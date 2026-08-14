// src/pages/PaymentSuccessPage.tsx
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import logo from "../assets/images/TindaLogo.png";

import { useEffect, useState } from "react";
import api from "../services/api";
import { ROUTES } from "../constants/routes";
import { STORAGE_KEYS } from "../constants/storage";
import {
  DEFAULT_PLAN,
  formatPlanName,
} from "../constants/subscriptionPlans";

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || DEFAULT_PLAN;
  const isMock = searchParams.get("mock") === "true";

  const checkoutSessionId =
    searchParams.get("checkout_session_id") ||
    localStorage.getItem(STORAGE_KEYS.pendingCheckoutSession);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    function updateSavedBusinessPlan() {
      const savedBusiness = localStorage.getItem(STORAGE_KEYS.business);

      if (!savedBusiness) return;

      try {
        const business = JSON.parse(savedBusiness);
        localStorage.setItem(
          STORAGE_KEYS.business,
          JSON.stringify({ ...business, selected_plan: plan }),
        );
      } catch {
        // Keep the success page available even if local storage is malformed.
      }
    }

    async function syncPaymentStatus() {
      if (!checkoutSessionId) {
        updateSavedBusinessPlan();
        return;
      }

      try {
        const response = await api.post("/payments/sync-status", {
          checkout_session_id: checkoutSessionId,
          mock_status: isMock ? "paid" : undefined,
        });

        if (response.data.data?.status === "pending") {
          setStatusMessage(
            "Payment is being verified. Your dashboard will update once confirmed.",
          );
          return;
        }

        setStatusMessage("Payment record verified successfully.");
        updateSavedBusinessPlan();
        localStorage.removeItem(STORAGE_KEYS.pendingCheckoutSession);
      } catch {
        setStatusMessage(
          "Payment returned successfully, but we could not verify it yet.",
        );
      }
    }

    syncPaymentStatus();
  }, [checkoutSessionId, isMock, plan]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#e8f5ee] p-4 font-sans text-ink sm:px-6">
      <section className="w-full max-w-xl rounded-2xl bg-white p-5 text-center shadow-xl shadow-pine/5 sm:rounded-4xl sm:p-8">
        <img
          src={logo}
          alt="TindaTrack"
          className="mx-auto h-12 w-auto object-contain"
        />

        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-leaf/10 text-leaf sm:mt-8 sm:h-20 sm:w-20">
          <CheckCircle2 size={44} />
        </div>

        <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.3em] text-leaf">
          Payment Successful
        </p>

        <h1 className="mt-3 font-display text-3xl font-bold text-pine sm:text-4xl">
          Your {formatPlanName(plan)} plan is active
        </h1>

        <p className="mt-4 leading-7 text-ink-soft">
          Your TindaTrack workspace is ready. You can now continue to your owner
          dashboard and start managing your business.
        </p>

        {isMock && (
          <div className="mt-6 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm font-semibold text-ink-soft">
            Mock payment mode is enabled. No real payment was processed.
          </div>
        )}

        {statusMessage && (
          <p className="mt-4 text-sm font-semibold text-ink-soft">
            {statusMessage}
          </p>
        )}

        <Link
          to={ROUTES.ownerDashboard}
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-leaf px-6 py-4 font-bold text-white shadow-lg shadow-leaf/20 transition hover:bg-leaf-dark"
        >
          Go to Dashboard
        </Link>
      </section>
    </main>
  );
}

export default PaymentSuccessPage;
