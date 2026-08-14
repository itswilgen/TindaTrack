import { SubscriptionPlan } from "../config/plans";
import { PaymentChannel } from "../config/paymentChannels";

export type CheckoutSessionInput = {
  plan?: string;
  paymentChannel?: string;
  billing: BillingDetails;
  customerEmail: string;
  customerName?: string;
  businessId: number;
  userId: number;
};

export type BillingDetails = {
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: "PH";
  };
};

export type CheckoutSessionResult = {
  id: string;
  checkoutUrl: string;
  plan: SubscriptionPlan;
  paymentChannel: PaymentChannel;
};

export type VerifiedPaymentStatus = "paid" | "pending" | "cancelled" | "failed";
