// src/pages/LandingPage.tsx
import heroImage from "../assets/Hero.png";
import { type CSSProperties, useState } from "react";
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
  Menu,
  Receipt,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { registerBusinessUrl, ROUTES } from "../constants/routes";

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

function staggerStyle(index: number, step = 80): CSSProperties {
  return { "--delay": `${index * step}ms` } as CSSProperties;
}

function LandingPage() {
  const [yearly, setYearly] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-paper font-sans text-ink">
      {/* Header */}
      <header className="landing-header fixed left-0 top-0 z-50 w-full bg-transparent px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-xl border border-ink-line bg-paper/85 px-3 py-2 shadow-lg shadow-pine/5 backdrop-blur-xl transition-all duration-500 hover:border-leaf/30 hover:bg-paper/95 sm:rounded-2xl sm:px-6 sm:py-3">
          <Link to={ROUTES.home} className="flex items-center gap-3">
            <BrandLogo className="h-10 sm:h-14" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-pine md:flex">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#pricing" className="nav-link">
              Pricing
            </a>
            <a href="#about" className="nav-link">
              About
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to={ROUTES.login}
              className="rounded-full px-4 py-2 text-sm font-semibold text-pine transition-all duration-300 hover:-translate-y-0.5 hover:bg-paper-dim"
            >
              Log in
            </Link>

            <Link
              to={ROUTES.registerBusiness}
              className="cta-button rounded-full bg-leaf px-5 py-2.5 text-sm font-bold text-white transition hover:bg-leaf-dark"
            >
              Start Free Trial
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-line bg-white text-pine md:hidden"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="mx-auto mt-2 max-w-7xl rounded-xl border border-ink-line bg-white p-3 shadow-xl md:hidden">
            <nav className="grid gap-1 text-sm font-bold text-pine">
              {[
                ["Features", "#features"],
                ["Pricing", "#pricing"],
                ["About", "#about"],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-paper-dim">
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ink-line pt-3">
              <Link to={ROUTES.login} className="flex h-11 items-center justify-center rounded-xl border border-ink-line text-sm font-bold text-pine">
                Log in
              </Link>
              <Link to={ROUTES.registerBusiness} className="flex h-11 items-center justify-center rounded-xl bg-leaf px-3 text-center text-sm font-bold text-white">
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        className="hero-scene relative min-h-svh overflow-hidden px-4 pb-8 pt-28 sm:px-6 sm:pt-32"
      >
        <div
          aria-hidden="true"
          className="hero-media absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 py-8 sm:py-12 lg:min-h-[38rem] lg:grid-cols-2">
          <div className="hero-copy">
            <span className="hero-eyebrow inline-flex items-center gap-2 rounded-full border border-ink-line bg-paper-dim px-3 py-1.5 text-xs font-semibold text-leaf-dark sm:px-4 sm:text-sm">
              <BarChart3 size={16} /> All-in-one POS + Inventory Platform
            </span>

            <h1 className="hero-title mt-5 font-display text-[1.75rem] font-bold leading-[1.08] text-pine min-[390px]:text-3xl sm:mt-6 sm:text-5xl lg:text-[3.2rem]">
              <span className="block whitespace-nowrap">Run your store</span>
              <span className="mt-1 block whitespace-nowrap text-leaf-dark sm:mt-2">
                Grow your business
              </span>
            </h1>

            <p className="hero-subtitle mt-4 max-w-xl text-base leading-7 text-ink-soft sm:mt-6 sm:text-lg sm:leading-8">
              Manage sales, inventory, and reports in one powerful platform —
              built to help sari-sari stores, bakeries, salons, and other local
              businesses save time, reduce losses, and grow.
            </p>

            <div className="hero-actions mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                to={ROUTES.registerBusiness}
                className="cta-button cta-primary inline-flex items-center justify-center gap-2 rounded-full bg-leaf px-7 py-4 text-center font-bold text-white transition hover:bg-leaf-dark"
              >
                Start Free Trial <ArrowRight size={18} />
              </Link>

              <a
                href="#pricing"
                className="cta-button inline-flex items-center justify-center gap-2 rounded-full border border-ink-line bg-white px-7 py-4 text-center font-bold text-ink transition hover:bg-paper-dim"
              >
                Book a Demo <Calendar size={18} />
              </a>
            </div>

            <div className="hero-proof mt-9 flex flex-wrap gap-x-6 gap-y-2">
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
        <div className="section-reveal relative z-10 mx-auto mt-4 max-w-6xl rounded-xl border border-ink-line bg-paper p-4 shadow-lg sm:mt-8 sm:rounded-2xl lg:p-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6 lg:divide-x lg:divide-ink-line">
            {trustItems.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className={`stagger-item flex items-start gap-3 ${i > 0 ? "lg:pl-6" : ""}`}
                style={staggerStyle(i)}
              >
                <span className="icon-badge flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf/10 text-leaf-dark">
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
      <section id="features" className="section-reveal bg-paper px-4 py-16 sm:px-6 sm:py-24">
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

          <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, color, title, desc }, index) => (
              <div
                key={title}
                className="animated-card stagger-item rounded-2xl border border-ink-line bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-7"
                style={staggerStyle(index)}
              >
                <span
                  className="icon-badge inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed"
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
      <section id="about" className="section-reveal bg-paper-dim px-4 py-16 sm:px-6 sm:py-24">
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
            {businessTypes.map((type, index) => (
              <span
                key={type}
                className="stagger-item rounded-full border border-ink-line bg-white px-4 py-1.5 text-sm text-ink-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-leaf/40 hover:text-leaf-dark"
                style={staggerStyle(index, 45)}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-reveal bg-paper px-4 py-16 sm:px-6 sm:py-24">
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

            <div className="mx-auto mt-7 flex w-full max-w-sm rounded-xl border border-ink-line bg-white p-1 shadow-sm transition-all duration-300 hover:shadow-md sm:inline-flex sm:w-auto sm:rounded-full">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-300 sm:rounded-full sm:px-5 sm:text-sm ${
                  !yearly ? "bg-leaf text-white" : "text-ink-soft"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-300 sm:rounded-full sm:px-5 sm:text-sm ${
                  yearly ? "bg-leaf text-white" : "text-ink-soft"
                }`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            {plans.map((plan, index) => {
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
                  className={`animated-card stagger-item flex flex-col rounded-2xl p-5 sm:rounded-3xl sm:p-7 ${
                    plan.highlight
                      ? "bg-pine text-white shadow-2xl"
                      : "border border-ink-line bg-white"
                  }`}
                  style={staggerStyle(index)}
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
                    to={registerBusinessUrl(
                      plan.name.toLowerCase().replaceAll(" ", "_"),
                    )}
                    className={`cta-button mt-7 rounded-full px-5 py-3 text-center text-sm font-bold transition ${
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
