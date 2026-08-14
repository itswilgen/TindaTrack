import axios from "axios";
import crypto from "crypto";
import { env } from "../config/env";
import {
  getPaymentChannelLabel,
  getPaymentMethodTypes,
  normalizePaymentChannel,
} from "../config/paymentChannels";
import { normalizePlan, SUBSCRIPTION_PLANS } from "../config/plans";
import { createPaymentTransaction } from "../models/paymentTransaction.model";
import {
  CheckoutSessionInput,
  CheckoutSessionResult,
  VerifiedPaymentStatus,
} from "../types/payment.types";

const PAYMONGO_API_URL = "https://api.paymongo.com/v2";

function getPaymongoAuthHeader() {
  const secretKey = env.paymongo.secretKey;

  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY_MISSING");
  }

  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

function normalizeProviderPaymentStatus(status?: string): VerifiedPaymentStatus {
  if (status === "paid" || status === "succeeded" || status === "completed") {
    return "paid";
  }

  if (status === "cancelled" || status === "canceled" || status === "expired") {
    return "cancelled";
  }

  if (status === "failed") {
    return "failed";
  }

  return "pending";
}

export async function createCheckoutSessionService(
  data: CheckoutSessionInput
): Promise<CheckoutSessionResult> {
  const frontendUrl = env.frontendUrl;
  const selectedPlan = normalizePlan(data.plan);
  const selectedPaymentChannel = normalizePaymentChannel(data.paymentChannel);
  const paymentMethodTypes = getPaymentMethodTypes(selectedPaymentChannel);
  const plan = SUBSCRIPTION_PLANS[selectedPlan];

  if (env.paymentProvider === "mock") {
    const checkoutSessionId = `mock_checkout_${Date.now()}`;
    const checkoutUrl = `${frontendUrl}/payment/success?plan=${selectedPlan}&payment_method=${selectedPaymentChannel}&mock=true&checkout_session_id=${checkoutSessionId}`;

    await createPaymentTransaction({
      checkout_session_id: checkoutSessionId,
      provider: "mock",
      plan: selectedPlan,
      amount: plan.amount,
      currency: "PHP",
      customer_email: data.customerEmail,
      customer_name: data.customerName || null,
      status: "pending",
      checkout_url: checkoutUrl,
      business_id: data.businessId,
      user_id: data.userId,
    });

    return {
      id: checkoutSessionId,
      checkoutUrl,
      plan: selectedPlan,
      paymentChannel: selectedPaymentChannel,
    };
  }

  const response = await axios.post(
    `${PAYMONGO_API_URL}/checkout_sessions`,
    {
      data: {
        attributes: {
          line_items: [
            {
              name: plan.name,
              amount: plan.amount,
              currency: "PHP",
              quantity: 1,
            },
          ],
          billing: data.billing,
          payment_method_types: paymentMethodTypes,
          success_url: `${frontendUrl}/payment/success?plan=${selectedPlan}&payment_method=${selectedPaymentChannel}`,
          cancel_url: `${frontendUrl}/payment/cancel?plan=${selectedPlan}&payment_method=${selectedPaymentChannel}`,
          reference_number: `TINDATRACK-${Date.now()}`,
          send_email_receipt: true,
          metadata: {
            plan: selectedPlan,
            payment_channel: selectedPaymentChannel,
            payment_channel_label: getPaymentChannelLabel(selectedPaymentChannel),
            customer_email: data.billing.email,
            customer_name: data.billing.name,
            customer_phone: data.billing.phone,
            billing_city: data.billing.address.city,
            billing_postal_code: data.billing.address.postal_code,
            business_id: String(data.businessId),
            user_id: String(data.userId),
          },
        },
      },
    },
    {
      headers: {
        Authorization: getPaymongoAuthHeader(),
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      timeout: 15_000,
    }
  );

  const checkoutSessionId = response.data.data.id;
  const checkoutUrl = response.data.data.attributes.checkout_url;

  await createPaymentTransaction({
    checkout_session_id: checkoutSessionId,
    provider: "paymongo",
    plan: selectedPlan,
    amount: plan.amount,
    currency: "PHP",
    customer_email: data.customerEmail,
    customer_name: data.customerName || null,
    status: "pending",
    checkout_url: checkoutUrl,
    business_id: data.businessId,
    user_id: data.userId,
  });

  return {
    id: checkoutSessionId,
    checkoutUrl,
    plan: selectedPlan,
    paymentChannel: selectedPaymentChannel,
  };
}

export async function retrieveCheckoutSessionStatus(
  checkoutSessionId: string
): Promise<VerifiedPaymentStatus> {
  const response = await axios.get(
    `${PAYMONGO_API_URL}/checkout_sessions/${checkoutSessionId}`,
    {
      headers: {
        Authorization: getPaymongoAuthHeader(),
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    }
  );

  const attributes = response.data?.data?.attributes;
  const paymentStatuses = Array.isArray(attributes?.payments)
    ? attributes.payments.map((payment: any) =>
        normalizeProviderPaymentStatus(payment?.attributes?.status)
      )
    : [];

  if (paymentStatuses.includes("paid")) {
    return "paid";
  }

  const paymentIntentStatus = normalizeProviderPaymentStatus(
    attributes?.payment_intent?.attributes?.status
  );

  if (paymentIntentStatus !== "pending") {
    return paymentIntentStatus;
  }

  return normalizeProviderPaymentStatus(attributes?.status);
}
