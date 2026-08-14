// src/pages/PaymentCancelPage.tsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import api from "../services/api";
import logo from "../assets/images/TindaLogo.png";
import { paymentUrl, ROUTES } from "../constants/routes";
import { STORAGE_KEYS } from "../constants/storage";
import { DEFAULT_PLAN } from "../constants/subscriptionPlans";

function PaymentCancelPage() {
  const [searchParams] = useSearchParams();

  const plan = searchParams.get("plan") || DEFAULT_PLAN;
  const checkoutSessionId =
    searchParams.get("checkout_session_id") ||
    localStorage.getItem(STORAGE_KEYS.pendingCheckoutSession);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function syncPaymentStatus() {
      if (!checkoutSessionId) return;

      try {
        await api.post("/payments/sync-status", {
          checkout_session_id: checkoutSessionId,
          mock_status: "cancelled",
        });

        setStatusMessage("Payment record marked as cancelled.");
        localStorage.removeItem(STORAGE_KEYS.pendingCheckoutSession);
      } catch {
        setStatusMessage(
          "Payment was cancelled, but we could not update the local record.",
        );
      }
    }

    syncPaymentStatus();
  }, [checkoutSessionId]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper-dim p-4 font-sans text-ink sm:px-6">
      <section className="w-full max-w-xl rounded-2xl bg-white p-5 text-center shadow-xl shadow-pine/5 sm:rounded-4xl sm:p-8">
        <img
          src={logo}
          alt="TindaTrack"
          className="mx-auto h-12 w-auto object-contain"
        />

        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 sm:mt-8 sm:h-20 sm:w-20">
          <XCircle size={44} />
        </div>

        <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.3em] text-red-500">
          Payment Cancelled
        </p>

        <h1 className="mt-3 font-display text-3xl font-bold text-pine sm:text-4xl">
          Your payment was not completed
        </h1>

        <p className="mt-4 leading-7 text-ink-soft">
          No worries. Your account is still saved. You can go back and try your
          payment again.
        </p>

        {statusMessage && (
          <p className="mt-4 text-sm font-semibold text-ink-soft">
            {statusMessage}
          </p>
        )}

        <Link
          to={paymentUrl(plan)}
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-leaf px-6 py-4 font-bold text-white shadow-lg shadow-leaf/20 transition hover:bg-leaf-dark"
        >
          Try Payment Again
        </Link>

        <Link
          to={ROUTES.ownerDashboard}
          className="mt-5 block text-sm font-bold text-sage transition hover:text-sage-dark"
        >
          Skip for now
        </Link>
      </section>
    </main>
  );
}

export default PaymentCancelPage;
