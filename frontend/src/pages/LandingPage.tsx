// src/pages/LandingPage.tsx
import heroImage from "../assets/Hero.png";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Receipt,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const businessTypes = [
  "Sari-sari store",
  "Water refilling station",
  "Mini grocery",
  "Bakery",
  "Salon",
  "Printing shop",
  "School canteen",
  "Small restaurant",
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Trusted by Local Businesses",
    desc: "Built with owners in mind.",
  },
  {
    icon: TrendingUp,
    title: "Increase Sales",
    desc: "Make smarter decisions with real-time insights.",
  },
  {
    icon: Clock,
    title: "Save Time",
    desc: "Automate daily tasks and focus on growth.",
  },
  {
    icon: CheckCircle2,
    title: "Reduce Losses",
    desc: "Track inventory and minimize stockouts.",
  },
  {
    icon: Store,
    title: "Grow Anywhere",
    desc: "Manage your business from any device.",
  },
];

const features = [
  {
    icon: Receipt,
    color: "leaf",
    title: "Fast POS",
    desc: "Process transactions quickly and record every sale properly, even during rush hour.",
  },
  {
    icon: Boxes,
    color: "sage",
    title: "Inventory Tracking",
    desc: "Monitor product quantities and stock-in across every branch your business runs.",
  },
  {
    icon: AlertTriangle,
    color: "amber",
    title: "Low-Stock Alerts",
    desc: "Get notified before an item runs out, so you never turn away a sale.",
  },
  {
    icon: FileText,
    color: "leaf",
    title: "Digital Receipts",
    desc: "Every transaction generates a clean digital resibo — no more handwritten slips.",
  },
  {
    icon: BarChart3,
    color: "sage",
    title: "Sales Reports",
    desc: "See daily and monthly performance, top sellers, and expenses at a glance.",
  },
  {
    icon: Users,
    color: "amber",
    title: "Role-Based Access",
    desc: "Give owners, cashiers, and staff exactly the access they need — nothing more.",
  },
];

const plans = [
  {
    name: "Free Trial",
    monthly: 0,
    trial: true,
    desc: "Try the full POS before you commit.",
    features: ["1 branch", "Up to 50 products", "Basic POS & reports"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Starter",
    monthly: 499,
    desc: "For a single store finding its footing.",
    features: [
      "1 branch",
      "Unlimited products",
      "Digital receipts",
      "Low-stock alerts",
    ],
    cta: "Choose Starter",
    highlight: false,
  },
  {
    name: "Business",
    monthly: 999,
    desc: "For growing businesses with a small team.",
    features: [
      "Up to 3 branches",
      "Role-based staff accounts",
      "Expense tracking",
      "Exportable sales reports",
    ],
    cta: "Choose Business",
    highlight: true,
  },
  {
    name: "Premium",
    monthly: 1999,
    desc: "For multi-branch operations at scale.",
    features: [
      "Unlimited branches",
      "Priority support",
      "Custom setup & training",
      "Everything in Business",
    ],
    cta: "Choose Premium",
    highlight: false,
  },
];

function peso(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

function LandingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-paper font-sans text-ink">
      {/* Header */}
      <header className="fixed left-0 top-0 z-50 w-full bg-transparent px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl border border-ink-line bg-pine/15 px-6 py-3 shadow-lg shadow-pine/5 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo className="h-14" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-pine md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-pine hover:bg-paper-dim"
            >
              Log in
            </Link>

            <Link
              to="/register-business"
              className="rounded-full bg-leaf px-5 py-2.5 text-sm font-bold text-white transition hover:bg-leaf-dark"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-leaf/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-sage/10 blur-3xl"
          aria-hidden
        />

        <div className=" pt-25 relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-line bg-paper-dim px-4 py-1.5 text-sm font-semibold text-leaf-dark mt-30">
              <BarChart3 size={16} /> All-in-one POS + Inventory Platform
            </span>

            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] text-pine sm:text-5xl lg:text-[3.2rem]">
              Run your store, Grow your store
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
              Manage sales, inventory, and reports in one powerful platform —
              built to help sari-sari stores, bakeries, salons, and other local
              businesses save time, reduce losses, and grow.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register-business"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf px-7 py-4 text-center font-bold text-white transition hover:bg-leaf-dark"
              >
                Start Free Trial <ArrowRight size={18} />
              </Link>

              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-line bg-white px-7 py-4 text-center font-bold text-ink transition hover:bg-paper-dim"
              >
                Book a Demo <Calendar size={18} />
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2">
              {[
                "No credit card required",
                "Easy setup in minutes",
                "Cancel anytime",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 text-sm text-ink-soft"
                >
                  <Check size={15} className="text-leaf-dark" /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="relative z-10 mx-auto mt-25 max-w-6xl rounded-2xl border border-ink-line bg-paper p-3 shadow-lg ">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-ink-line">
            {trustItems.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className={`flex items-start gap-3 ${i > 0 ? "lg:pl-6" : ""}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf/10 text-leaf-dark">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-paper px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-mono text-sm font-semibold uppercase tracking-widest text-sage">
              Powerful Features
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-pine sm:text-4xl">
              Everything a small business needs.
            </h2>
            <p className="mt-4 text-ink-soft">
              One centralized platform for sales, stock, staff, and reports —
              accessible from any browser, on any device.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl border border-ink-line bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed"
                  style={{
                    borderColor:
                      color === "leaf"
                        ? "var(--color-leaf)"
                        : color === "sage"
                          ? "var(--color-sage)"
                          : "var(--color-amber)",
                    color:
                      color === "leaf"
                        ? "var(--color-leaf-dark)"
                        : color === "sage"
                          ? "var(--color-sage)"
                          : "var(--color-amber)",
                  }}
                >
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">
                  {title}
                </h3>
                <p className="mt-3 text-ink-soft">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-paper-dim px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber">
            Built for Local Businesses
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-pine sm:text-4xl">
            Designed to help you work smarter, not harder
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-ink-soft">
            TindaTrack is a SaaS platform — each business gets its own private
            account, users, products, and reports, so a whole neighborhood of
            stores can run on the same system without seeing each other's data.
            No cash register or IT team required, just a browser.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
            {businessTypes.map((type) => (
              <span
                key={type}
                className="rounded-full border border-ink-line bg-white px-4 py-1.5 text-sm text-ink-soft"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-paper px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-sm font-semibold uppercase tracking-widest text-sage">
              Simple, Transparent Pricing
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-pine sm:text-4xl">
              Choose the plan that fits your business
            </h2>
            <p className="mx-auto mt-4 text-ink-soft">
              Every plan includes cloud backups and access from any device. No
              setup fees to get started.
            </p>

            <div className="mx-auto mt-7 inline-flex rounded-full border border-ink-line bg-white p-1">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  !yearly ? "bg-leaf text-white" : "text-ink-soft"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  yearly ? "bg-leaf text-white" : "text-ink-soft"
                }`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-4">
            {plans.map((plan) => {
              const displayPrice = plan.trial
                ? "₱0"
                : yearly
                  ? peso(Math.round(plan.monthly * 12 * 0.8))
                  : peso(plan.monthly);
              const displayPeriod = plan.trial
                ? "14 days"
                : yearly
                  ? "/year"
                  : "/month";

              return (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-3xl p-7 ${
                    plan.highlight
                      ? "bg-pine text-white shadow-2xl"
                      : "border border-ink-line bg-white"
                  }`}
                >
                  {plan.highlight && (
                    <span className="mb-4 w-fit rounded-full bg-leaf px-3 py-1 text-xs font-bold uppercase tracking-wide">
                      Most Popular
                    </span>
                  )}

                  <h3 className="font-display text-xl font-semibold">
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${plan.highlight ? "text-white/70" : "text-ink-soft"}`}
                  >
                    {plan.desc}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-semibold">
                      {displayPrice}
                    </span>
                    <span
                      className={`text-sm ${plan.highlight ? "text-white/70" : "text-ink-soft"}`}
                    >
                      {displayPeriod}
                    </span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check
                          size={16}
                          className={`mt-0.5 shrink-0 ${plan.highlight ? "text-leaf" : "text-leaf-dark"}`}
                        />
                        <span
                          className={
                            plan.highlight ? "text-white/90" : "text-ink-soft"
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register-business"
                    className={`mt-7 rounded-full px-5 py-3 text-center text-sm font-bold transition ${
                      plan.highlight
                        ? "bg-leaf text-white hover:bg-leaf-dark"
                        : "bg-paper-dim text-ink hover:bg-ink-line"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs text-ink-soft">
            Custom setup, training, and support packages are also available for
            larger operations.
          </p>
        </div>
      </section>

      <footer className="bg-pine px-6 pb-8 pt-14 text-center text-sm text-white/40">
        © 2026 TindaTrack. All rights reserved.
      </footer>
    </main>
  );
}

export default LandingPage;
