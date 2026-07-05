// src/pages/RegisterBusinessPage.tsx
import { Link } from "react-router-dom";
import { Building2, Lock, Mail, Phone, User } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

function RegisterBusinessPage() {
  return (
    <main className="min-h-screen bg-paper-dim font-sans text-ink">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="fixed left-0 top-0 z-50 w-full border-b border-ink-line bg-pine backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center">
              <BrandLogo className="h-12" />
            </Link>
            <div className="flex items-center gap-3"></div>
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {/* Left */}
          <section className="flex flex-col justify-center">
            <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber">
              Start your free account
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
              Open your business workspace with TindaTrack
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-ink-soft">
              Register your store and start managing products, sales, inventory,
              and reports in one clean dashboard.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink-line bg-white p-5">
                <h3 className="font-display text-lg font-semibold">
                  For store owners
                </h3>
                <p className="mt-2 text-sm text-ink-soft">
                  Manage staff, products, sales, and reports easily.
                </p>
              </div>

              <div className="rounded-2xl border border-ink-line bg-white p-5">
                <h3 className="font-display text-lg font-semibold">
                  For local businesses
                </h3>
                <p className="mt-2 text-sm text-ink-soft">
                  Great for sari-sari stores, mini groceries, and small shops.
                </p>
              </div>
            </div>
          </section>

          {/* Right */}
          <section className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="font-display text-2xl font-semibold">
              Register Business
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Fill in the details below to get started.
            </p>

            <form className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-semibold text-ink">
                  Business Name
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 transition focus-within:border-sage focus-within:bg-white">
                  <Building2 size={18} className="text-ink-soft" />
                  <input
                    type="text"
                    placeholder="Example: Wilgen Mini Store"
                    className="w-full bg-transparent py-3 text-ink outline-none placeholder:text-ink-soft/70"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">
                  Owner Name
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 transition focus-within:border-sage focus-within:bg-white">
                  <User size={18} className="text-ink-soft" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="w-full bg-transparent py-3 text-ink outline-none placeholder:text-ink-soft/70"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Email</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 transition focus-within:border-sage focus-within:bg-white">
                  <Mail size={18} className="text-ink-soft" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent py-3 text-ink outline-none placeholder:text-ink-soft/70"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Phone</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 transition focus-within:border-sage focus-within:bg-white">
                  <Phone size={18} className="text-ink-soft" />
                  <input
                    type="text"
                    placeholder="09XXXXXXXXX"
                    className="w-full bg-transparent py-3 text-ink outline-none placeholder:text-ink-soft/70"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">
                  Password
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 transition focus-within:border-sage focus-within:bg-white">
                  <Lock size={18} className="text-ink-soft" />
                  <input
                    type="password"
                    placeholder="Create your password"
                    className="w-full bg-transparent py-3 text-ink outline-none placeholder:text-ink-soft/70"
                  />
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-xl bg-leaf py-3.5 font-bold text-white transition hover:bg-leaf-dark"
              >
                Create Business Account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-sage hover:text-sage-dark"
              >
                Login here
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

export default RegisterBusinessPage;
