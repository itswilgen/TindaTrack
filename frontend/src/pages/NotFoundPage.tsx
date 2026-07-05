import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-pine px-6 text-center font-sans text-white">
      <div
        className="torn-edge w-full max-w-sm rounded-t-lg bg-paper px-8 pb-9 pt-8 text-ink"
        style={{ ["--tear-color" as string]: "var(--color-paper)" }}
      >
        <Receipt className="mx-auto text-amber" size={32} />
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-ink-soft">
          Resibo not found
        </p>
        <h1 className="mt-2 font-display text-6xl font-semibold text-pine">
          404
        </h1>
        <p className="resibo-rule mt-4 pt-4 text-sm text-ink-soft">
          Walang item na nakita. This page doesn't exist or was moved.
        </p>
      </div>
      <div className="h-3 w-full max-w-sm" />

      <Link
        to="/"
        className="mt-6 rounded-full bg-leaf px-6 py-3 font-bold text-white transition hover:bg-leaf-dark"
      >
        Back to Home
      </Link>
    </main>
  );
}

export default NotFoundPage;
