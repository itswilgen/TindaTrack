export type PaymentChannel = "hosted_checkout" | "maya" | "qrph" | "gcash" | "card";

export const DEFAULT_PAYMENT_CHANNEL: PaymentChannel = "hosted_checkout";

const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  hosted_checkout: "PayMongo Hosted Checkout",
  maya: "Maya",
  qrph: "QR PH",
  gcash: "GCash",
  card: "Card",
};

function parsePaymentMethodTypes(value: string) {
  return value
    .split(",")
    .map((method) => method.trim())
    .filter(Boolean);
}

export function normalizePaymentChannel(channel?: string): PaymentChannel {
  if (
    channel === "hosted_checkout" ||
    channel === "maya" ||
    channel === "qrph" ||
    channel === "gcash" ||
    channel === "card"
  ) {
    return channel;
  }

  return DEFAULT_PAYMENT_CHANNEL;
}

export function getPaymentMethodTypes(channel: PaymentChannel) {
  if (channel === "hosted_checkout") {
    return parsePaymentMethodTypes(
      env.paymongo.hostedPaymentMethodTypes
    );
  }

  if (channel === "maya") {
    return parsePaymentMethodTypes(
      env.paymongo.mayaPaymentMethodTypes
    );
  }

  if (channel === "gcash") {
    return ["gcash"];
  }

  if (channel === "card") {
    return ["card"];
  }

  return ["qrph"];
}

export function getPaymentChannelLabel(channel: PaymentChannel) {
  return PAYMENT_CHANNEL_LABELS[channel];
}
import { env } from "./env";
