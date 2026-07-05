// src/pages/LoginPage.tsx
import loginImage from "../assets/login.png";
import { Link } from "react-router-dom";
import { EyeOff, Import, Lock, Mail } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

function LoginPage() {
  return (
    <main
      className="min-h-screen bg-cover bg-left bg-no-repeat font-sans text-ink"
      style={{ backgroundImage: `url(${loginImage})` }}
    >
      <header className="fixed left-0 top-0 z-50 w-full border-b border-ink-line bg-pine backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center">
            <BrandLogo className="h-12" />
          </Link>
        </div>
      </header>
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        {/* Left */}
        <section className="relative hidden min-h-screen px-10 py-40 lg:block">
          <div>
            <span className="inline-block rounded-full border border-leaf/30 bg-leaf/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-leaf">
              Owner &amp; Staff Login
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight">
              Welcome back to your tindahan.
            </h1>

            <p className="mt-5 max-w-md leading-8 text-pine">
              Every sale, every stock-in, every resibo — all in one clean
              dashboard you can trust.
            </p>
          </div>
        </section>

        {/* Right */}
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-130 rounded-4xl border border-ink-line bg-white px-10 py-12 shadow-2xl shadow-pine/10 ml-30 mt-20">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLogo className="h-12" />
            </div>

            <div className="text-center">
              <h2 className="font-display text-3xl font-semibold text-pine">
                Welcome back!
              </h2>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-ink-soft">
                Login to your account to continue managing your business.
              </p>
            </div>

            <form className="mt-10 space-y-6">
              {/* Email */}
              <div>
                <label className="text-sm font-bold text-ink">
                  Email address
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage focus-within:ring-4 focus-within:ring-leaf/10">
                  <Mail size={20} className="text-ink-soft" />

                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full bg-transparent py-4 text-ink outline-none placeholder:text-ink-soft/70"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-bold text-ink">Password</label>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage focus-within:ring-4 focus-within:ring-leaf/10">
                  <Lock size={20} className="text-ink-soft" />

                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full bg-transparent py-4 text-ink outline-none placeholder:text-ink-soft/70"
                  />

                  <button
                    type="button"
                    className="text-ink-soft transition hover:text-pine"
                    aria-label="Toggle password visibility"
                  >
                    <EyeOff size={20} />
                  </button>
                </div>

                <div className="mt-3 flex justify-end">
                  <a
                    href="#"
                    className="text-sm font-bold text-leaf hover:text-leaf-dark"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="button"
                className="w-full rounded-xl bg-leaf py-4 text-base font-bold text-white shadow-lg shadow-leaf/20 transition hover:bg-leaf-dark"
              >
                Log in
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-ink-line" />
              <span className="text-sm text-ink-soft">or continue with</span>
              <div className="h-px flex-1 bg-ink-line" />
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-line bg-white py-3.5 font-bold text-ink transition hover:bg-paper"
            >
              <span className="text-xl">G</span>
              Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-ink-soft">
              Don&apos;t have an account?{" "}
              <Link
                to="/register-business"
                className="font-bold text-leaf hover:text-leaf-dark"
              >
                Sign up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
