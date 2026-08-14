import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import { ROUTES } from "../constants/routes";

function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-pine p-4 text-center font-sans text-white sm:px-6">
      <div
        className="torn-edge w-full max-w-sm rounded-t-lg bg-paper px-5 pb-7 pt-6 text-ink sm:px-8 sm:pb-9 sm:pt-8"
        style={{ ["--tear-color" as string]: "var(--color-paper)" }}
      >
        <Receipt className="mx-auto text-amber" size={32} />
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-ink-soft">
          Resibo not found
        </p>
        <h1 className="mt-2 font-display text-5xl font-semibold text-pine sm:text-6xl">
          404
        </h1>
        <p className="resibo-rule mt-4 pt-4 text-sm text-ink-soft">
          Walang item na nakita. This page doesn't exist or was moved.
        </p>
      </div>
      <div className="h-3 w-full max-w-sm" />

      <Link
        to={ROUTES.home}
        className="mt-6 rounded-full bg-leaf px-6 py-3 font-bold text-white transition hover:bg-leaf-dark"
      >
        Back to Home
      </Link>
    </main>
  );
}

export default NotFoundPage;
