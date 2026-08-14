import {
  CheckCircle2,
  CreditCard,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { paymentUrl } from "../../../constants/routes";
import {
  formatPlanName,
  SUBSCRIPTION_PLANS,
} from "../../../constants/subscriptionPlans";
import { STORAGE_KEYS } from "../../../constants/storage";
import { readJson } from "../../../utils/storage";
import OwnerSidebar from "../components/OwnerSidebar";

const planOptions = [
  {
    key: "free_trial",
    label: "Free Trial",
    price: "₱0",
    period: "limited trial",
    description: "Try TindaTrack basics before applying a paid plan.",
    icon: Store,
    features: ["1 branch", "Up to 50 products", "Basic POS", "Basic reports"],
  },
  {
    key: "starter",
    label: SUBSCRIPTION_PLANS.starter.label,
    price: SUBSCRIPTION_PLANS.starter.price,
    period: "monthly",
    description: SUBSCRIPTION_PLANS.starter.description,
    icon: Zap,
    features: [
      "1 branch",
      "Unlimited products",
      "Digital receipts",
      "Low-stock alerts",
    ],
  },
  {
    key: "business",
    label: SUBSCRIPTION_PLANS.business.label,
    price: SUBSCRIPTION_PLANS.business.price,
    period: "monthly",
    description: SUBSCRIPTION_PLANS.business.description,
    icon: ShieldCheck,
    features: [
      "Up to 3 branches",
      "Staff access",
      "Expense tracking",
      "Exportable reports",
    ],
    recommended: true,
  },
  {
    key: "premium",
    label: SUBSCRIPTION_PLANS.premium.label,
    price: SUBSCRIPTION_PLANS.premium.price,
    period: "monthly",
    description: SUBSCRIPTION_PLANS.premium.description,
    icon: Sparkles,
    features: [
      "Unlimited branches",
      "Priority support",
      "Custom setup",
      "Everything in Business",
    ],
  },
];

const planOrder = ["free_trial", "starter", "business", "premium"];

function SubscriptionPlansPage() {
  const user = readJson<{ name?: string; email?: string }>(STORAGE_KEYS.user);
  const business = readJson<{ business_name?: string; selected_plan?: string }>(
    STORAGE_KEYS.business,
  );
  const ownerName = user?.name || "Owner";
  const initial = ownerName.charAt(0).toUpperCase();
  const currentPlan = business?.selected_plan || "free_trial";
  const currentPlanLabel =
    currentPlan === "free_trial" ? "Free Trial" : formatPlanName(currentPlan);
  const currentPlanIndex = Math.max(planOrder.indexOf(currentPlan), 0);

  return (
    <main className="h-dvh overflow-hidden bg-paper-dim font-sans text-ink">
      <div className="min-h-screen">
        <OwnerSidebar />

        <section className="h-dvh min-w-0 overflow-x-hidden overflow-y-auto lg:ml-72">
          <header className="dashboard-enter sticky top-0 z-30 border-b border-ink-line bg-paper-dim/90 py-3 pl-20 pr-4 backdrop-blur-xl sm:pr-6 lg:px-6 lg:py-4">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-soft sm:text-sm">
                  Subscription Plan
                </p>
                <h1 className="truncate font-display text-lg font-bold text-pine sm:text-2xl">
                  Apply another TindaTrack plan
                </h1>
              </div>

              <div className="hidden h-11 items-center gap-2 rounded-xl border border-ink-line bg-white px-4 text-sm font-semibold text-ink-soft md:flex">
                <Search size={17} />
                <span>Search plan features...</span>
              </div>

              <div className="hidden rounded-xl border border-leaf/30 bg-leaf/10 px-3 py-2 text-xs font-bold text-leaf-dark sm:block">
                {currentPlanLabel}
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-sm font-bold text-white sm:h-11 sm:w-11">
                {initial}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
            <section className="dashboard-enter dashboard-interactive rounded-xl bg-white p-4 shadow-[0_18px_45px_rgba(15,111,87,0.08)] sm:rounded-[1.75rem] sm:p-8">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-leaf/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-leaf-dark">
                    <CreditCard size={14} />
                    Plan management
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-bold text-pine sm:text-3xl">
                    Choose the plan your store needs next.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
                    Current workspace:{" "}
                    <span className="font-bold text-pine">
                      {business?.business_name || "TindaTrack Store"}
                    </span>
                    . Applying a paid plan will continue through PayMongo hosted
                    checkout.
                  </p>
                </div>

                <div className="rounded-xl bg-pine px-4 py-3 text-white sm:rounded-2xl sm:px-5 sm:py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/55">
                    Current plan
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                    {currentPlanLabel}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-4">
              {planOptions.map((plan, index) => {
                const Icon = plan.icon;
                const isCurrent = plan.key === currentPlan;
                const isPaidPlan = plan.key !== "free_trial";
                const isUpgrade =
                  planOrder.indexOf(plan.key) > currentPlanIndex;

                return (
                  <article
                    key={plan.key}
                    className={`dashboard-enter dashboard-interactive relative flex min-h-0 flex-col rounded-xl bg-white p-5 shadow-[0_18px_45px_rgba(15,111,87,0.08)] sm:min-h-120 sm:rounded-[1.75rem] ${
                      plan.recommended ? "ring-2 ring-leaf/35" : ""
                    }`}
                    style={{ animationDelay: `${120 + index * 65}ms` }}
                  >
                    {plan.recommended && (
                      <span className="absolute right-5 top-5 rounded-full bg-leaf px-3 py-1 text-xs font-bold text-white">
                        Recommended
                      </span>
                    )}

                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf/10 text-leaf-dark">
                      <Icon size={21} />
                    </span>

                    <h3 className="mt-5 font-display text-2xl font-bold text-pine">
                      {plan.label}
                    </h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-ink-soft">
                      {plan.description}
                    </p>

                    <div className="mt-5">
                      <span className="font-display text-3xl font-bold text-pine">
                        {plan.price}
                      </span>
                      <span className="ml-2 text-sm font-semibold text-ink-soft">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="mt-5 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm font-semibold text-ink-soft"
                        >
                          <CheckCircle2
                            className="mt-0.5 shrink-0 text-leaf-dark"
                            size={17}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <span className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-paper-dim px-4 py-3 text-sm font-bold text-sage-dark">
                        Current plan
                      </span>
                    ) : isPaidPlan ? (
                      <Link
                        to={paymentUrl(plan.key)}
                        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-leaf px-4 py-3 text-sm font-bold text-white shadow-md shadow-leaf/20 transition hover:bg-leaf-dark"
                      >
                        {isUpgrade ? "Apply upgrade" : "Apply plan"}
                      </Link>
                    ) : (
                      <span className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-ink-line px-4 py-3 text-sm font-bold text-ink-soft">
                        Trial plan only
                      </span>
                    )}
                  </article>
                );
              })}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export default SubscriptionPlansPage;
