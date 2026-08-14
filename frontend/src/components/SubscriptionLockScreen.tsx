import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { ROUTES } from "../constants/routes";
import type { AuthSession } from "../features/auth/types";

const plans = [
  { name: "Starter", price: "₱499", detail: "POS, products, and inventory" },
  { name: "Business", price: "₱999", detail: "Staff, expenses, and reports" },
  { name: "Premium", price: "₱1,999", detail: "Advanced support and branches" },
];

export default function SubscriptionLockScreen({ session }: { session: AuthSession }) {
  const isOwner = session.user.role === "owner";
  const isSuspended = session.business?.status === "suspended";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper-dim p-4 font-sans text-ink sm:p-8">
      <section role="dialog" aria-modal="true" aria-labelledby="trial-ended-title" className="w-full max-w-4xl rounded-2xl border border-ink-line bg-white p-5 shadow-2xl shadow-pine/10 sm:rounded-3xl sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-ink-line pb-5">
          {session.business?.logo_url ? (
            <img src={session.business.logo_url} alt={`${session.business.business_name} logo`} className="h-12 max-w-48 object-contain object-left" />
          ) : (
            <BrandLogo className="h-11" />
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${isSuspended ? "bg-red-50 text-red-600" : "bg-amber/10 text-amber"}`}>{isSuspended ? "Workspace suspended" : "Workspace locked"}</span>
        </div>

        <div className="mx-auto max-w-2xl py-7 text-center sm:py-9">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf/10 text-leaf-dark"><LockKeyhole size={26} /></span>
          <h1 id="trial-ended-title" className="mt-5 font-display text-2xl font-bold text-pine sm:text-4xl">{isSuspended ? "This store workspace is suspended" : "Your free trial has ended"}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-soft sm:text-base">
            {isSuspended
              ? "Store data remains safe, but platform access has been paused by a TindaTrack administrator. Contact support before continuing."
              : isOwner
                ? "Your store data is safe. Select a TindaTrack plan to unlock this workspace and continue daily operations."
                : "This store plan needs to be renewed. Ask the business owner to select a plan before continuing."}
          </p>
        </div>

        {isOwner && !isSuspended && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-xl border border-ink-line p-4">
                  <div className="flex items-center justify-between gap-2"><h2 className="font-bold text-pine">{plan.name}</h2><CheckCircle2 size={17} className="text-leaf-dark" /></div>
                  <p className="mt-2 font-display text-2xl font-bold text-leaf-dark">{plan.price}<span className="text-xs font-semibold text-ink-soft"> / month</span></p>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">{plan.detail}</p>
                </div>
              ))}
            </div>
            <Link to={ROUTES.ownerSubscriptionPlans} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-leaf px-5 text-sm font-bold text-white shadow-lg shadow-leaf/20 transition hover:bg-leaf-dark">
              <Sparkles size={18} /> View plans and unlock store
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
