export const DEFAULT_PLAN = "starter";
export const FREE_TRIAL_PLAN = "free_trial";

export const SUBSCRIPTION_PLANS = {
  starter: {
    label: "Starter",
    price: "₱499",
    description:
      "Best for one small store starting with digital sales and inventory.",
  },
  business: {
    label: "Business",
    price: "₱999",
    description: "Best for growing teams with staff access and deeper reports.",
  },
  premium: {
    label: "Premium",
    price: "₱1,999",
    description: "Best for multi-branch businesses that need advanced support.",
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export function normalizePlan(plan?: string | null): SubscriptionPlan {
  if (plan && plan in SUBSCRIPTION_PLANS) {
    return plan as SubscriptionPlan;
  }

  return DEFAULT_PLAN;
}

export function formatPlanName(plan: string) {
  if (plan in SUBSCRIPTION_PLANS) {
    return SUBSCRIPTION_PLANS[plan as SubscriptionPlan].label;
  }

  return plan
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
