export type SubscriptionPlan = "starter" | "business" | "premium";

export const DEFAULT_PLAN: SubscriptionPlan = "starter";

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  {
    name: string;
    amount: number;
  }
> = {
  starter: {
    name: "TindaTrack Starter Plan",
    amount: 49900,
  },
  business: {
    name: "TindaTrack Business Plan",
    amount: 99900,
  },
  premium: {
    name: "TindaTrack Premium Plan",
    amount: 199900,
  },
};

export function normalizePlan(plan?: string): SubscriptionPlan {
  if (plan && plan in SUBSCRIPTION_PLANS) {
    return plan as SubscriptionPlan;
  }

  return DEFAULT_PLAN;
}
