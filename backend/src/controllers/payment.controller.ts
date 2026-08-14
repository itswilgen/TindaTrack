import { Request, Response } from "express";
import {
  createCheckoutSessionService,
  retrieveCheckoutSessionStatus,
} from "../services/payment.service";
import { findBusinessUserRole } from "../models/businessUser.model";
import {
  findPaymentTransactionByCheckoutSession,
  PaymentStatus,
  updatePaymentTransactionStatus,
} from "../models/paymentTransaction.model";
import { activateBusinessSubscription } from "../models/subscription.model";
import { sendError, sendSuccess } from "../utils/response";
import {
  INPUT_LIMITS,
  isPositiveInteger,
  isSafeCheckoutSessionId,
  isValidEmail,
  isWithinLength,
  normalizeEmail,
} from "../utils/validation";
import { verifyWebhookSignature } from "../utils/webhookSignature";
import { AuthenticatedRequest, RawBodyRequest } from "../types/request.types";
import { BillingDetails } from "../types/payment.types";
import { env } from "../config/env";
import { SUBSCRIPTION_PLANS } from "../config/plans";
import type { PaymentChannel } from "../config/paymentChannels";

const paymentChannels = new Set<PaymentChannel>([
  "hosted_checkout",
  "maya",
  "qrph",
  "gcash",
  "card",
]);

function isPaymentProviderMock() {
  return env.paymentProvider === "mock";
}

async function applyVerifiedPaymentStatus(
  checkoutSessionId: string,
  status: PaymentStatus
) {
  const affectedRows = await updatePaymentTransactionStatus(
    checkoutSessionId,
    status
  );

  if (!affectedRows) {
    return null;
  }

  const transaction = await findPaymentTransactionByCheckoutSession(
    checkoutSessionId
  );

  if (status === "paid" && transaction?.business_id) {
    await activateBusinessSubscription({
      business_id: transaction.business_id,
      plan: transaction.plan,
    });
  }

  return transaction;
}

function extractCheckoutSessionIdFromWebhook(body: any) {
  const checkoutSession = body?.data?.data;
  const attributes = body?.data?.attributes;
  const eventData = attributes?.data;

  return (
    checkoutSession?.id ||
    eventData?.id ||
    eventData?.data?.id ||
    eventData?.attributes?.checkout_session_id ||
    eventData?.attributes?.checkout_session?.id ||
    null
  );
}

function extractEventTypeFromWebhook(body: any) {
  return body?.data?.type || body?.data?.attributes?.type || body?.type || "";
}

function isValidBillingDetails(value: any): value is BillingDetails {
  const email = normalizeEmail(value?.email);
  return (
    typeof value?.name === "string" &&
    value.name.trim().length >= 2 &&
    isWithinLength(value.name.trim(), 100) &&
    typeof value?.email === "string" &&
    isValidEmail(email) &&
    typeof value?.phone === "string" &&
    value.phone.trim().length >= 7 &&
    isWithinLength(value.phone.trim(), INPUT_LIMITS.phone) &&
    typeof value?.address?.line1 === "string" &&
    value.address.line1.trim().length >= 3 &&
    isWithinLength(value.address.line1.trim(), 200) &&
    isWithinLength(String(value.address.line2 || "").trim(), 200) &&
    typeof value?.address?.city === "string" &&
    value.address.city.trim().length >= 2 &&
    isWithinLength(value.address.city.trim(), 100) &&
    isWithinLength(String(value.address.state || "").trim(), 100) &&
    typeof value?.address?.postal_code === "string" &&
    value.address.postal_code.trim().length >= 3 &&
    isWithinLength(value.address.postal_code.trim(), 20)
  );
}

export async function createCheckoutSession(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;

  try {
    const { plan, businessId, paymentChannel, billing } = req.body;

    if (typeof plan !== "string" || !(plan in SUBSCRIPTION_PLANS)) {
      return sendError(res, 400, "Please select a subscription plan.");
    }

    if (!paymentChannels.has(paymentChannel as PaymentChannel)) {
      return sendError(res, 400, "Please select a supported payment channel.");
    }

    if (!isPositiveInteger(businessId)) {
      return sendError(res, 400, "Business ID is required.");
    }

    if (!isValidBillingDetails(billing)) {
      return sendError(res, 400, "Please complete your billing information.");
    }

    const businessUser = await findBusinessUserRole(
      businessId,
      authReq.user.user_id
    );

    if (!businessUser || businessUser.role !== "owner") {
      return sendError(
        res,
        403,
        "Only the business owner can start a subscription checkout."
      );
    }

    const checkoutSession = await createCheckoutSessionService({
      plan,
      paymentChannel,
      billing: {
        ...billing,
        name: billing.name.trim(),
        email: normalizeEmail(billing.email),
        phone: billing.phone.trim(),
        address: {
          line1: billing.address.line1.trim(),
          line2: billing.address.line2?.trim() || undefined,
          city: billing.address.city.trim(),
          state: billing.address.state?.trim() || undefined,
          postal_code: billing.address.postal_code.trim(),
          country: "PH",
        },
      },
      customerEmail: authReq.user.email,
      customerName: authReq.user.name,
      businessId,
      userId: authReq.user.user_id,
    });

    return sendSuccess(res, 200, "Checkout session created successfully.", {
      checkout_session_id: checkoutSession.id,
      checkout_url: checkoutSession.checkoutUrl,
      plan: checkoutSession.plan,
      payment_channel: checkoutSession.paymentChannel,
    });
  } catch (error: any) {
    return sendError(
      res,
      500,
      "Unable to create payment checkout. Please try again.",
      error
    );
  }
}

export async function syncPaymentStatus(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;

  try {
    const { checkout_session_id, mock_status } = req.body;

    if (!isSafeCheckoutSessionId(checkout_session_id)) {
      return sendError(res, 400, "Valid checkout session ID is required.");
    }

    const transaction = await findPaymentTransactionByCheckoutSession(
      checkout_session_id
    );

    if (!transaction) {
      return sendError(res, 404, "Payment transaction not found.");
    }

    if (transaction.user_id !== authReq.user.user_id) {
      return sendError(res, 403, "You cannot access this payment transaction.");
    }

    const verifiedStatus =
      transaction.provider === "mock" && isPaymentProviderMock()
        ? mock_status === "cancelled"
          ? "cancelled"
          : "paid"
        : await retrieveCheckoutSessionStatus(checkout_session_id);

    if (verifiedStatus === "pending") {
      return sendSuccess(res, 200, "Payment is still pending.", {
        status: verifiedStatus,
      });
    }

    await applyVerifiedPaymentStatus(checkout_session_id, verifiedStatus);

    return sendSuccess(res, 200, "Payment status synced successfully.", {
      status: verifiedStatus,
    });
  } catch (error: any) {
    return sendError(res, 500, "Unable to verify payment status.", error);
  }
}

export async function handlePaymongoWebhook(req: Request, res: Response) {
  const rawReq = req as RawBodyRequest;

  try {
    const webhookSecret = env.paymongo.webhookSecret;

    if (!webhookSecret) {
      return sendError(res, 500, "Webhook secret is not configured.");
    }

    if (
      !rawReq.rawBody ||
      !verifyWebhookSignature({
        rawBody: rawReq.rawBody,
        headers: req.headers,
        secret: webhookSecret,
      })
    ) {
      return sendError(res, 401, "Invalid webhook signature.");
    }

    const eventType = extractEventTypeFromWebhook(req.body);
    const checkoutSessionId = extractCheckoutSessionIdFromWebhook(req.body);

    if (!checkoutSessionId || !isSafeCheckoutSessionId(checkoutSessionId)) {
      return sendError(res, 400, "Webhook checkout session ID is missing.");
    }

    if (eventType === "checkout_session.payment.paid") {
      await applyVerifiedPaymentStatus(checkoutSessionId, "paid");
    } else if (
      eventType === "checkout_session.payment.failed" ||
      eventType === "payment.failed"
    ) {
      await applyVerifiedPaymentStatus(checkoutSessionId, "failed");
    } else if (
      eventType === "checkout_session.expired" ||
      eventType === "checkout_session.cancelled"
    ) {
      await applyVerifiedPaymentStatus(checkoutSessionId, "cancelled");
    }

    return sendSuccess(res, 200, "Webhook received.");
  } catch (error) {
    return sendError(res, 500, "Unable to process webhook.", error);
  }
}
