// src/pages/LoginPage.tsx
import { useState } from "react";
import axios from "axios";
import loginImage from "../assets/login.png";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Smartphone, ArrowLeft } from "lucide-react";

import api from "../services/api";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { ROUTES } from "../constants/routes";
import { routeForRole, saveSession } from "../features/auth/session";
import type { AuthSession } from "../features/auth/types";

const DEMO_ACCOUNT = {
  identifier: "owner@tindatrack.test",
  password: "password123",
};

function getLoginErrorMessage(error: unknown) {
  if (!axios.isAxiosError<{ message?: string }>(error)) {
    return "Login failed. Please try again.";
  }

  const responseMessage = error.response?.data?.message;
  if (responseMessage) return responseMessage;

  if (!error.response) {
    return "Cannot reach the login server. Refresh this page and try again.";
  }

  return `Login failed (server error ${error.response.status}). Please try again.`;
}

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loginWithCredentials(identifier: string, password: string) {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });
      const session = response.data.data as AuthSession;
      saveSession(session);

      setSuccessMessage("Login successful. Redirecting...");

      setTimeout(() => {
        navigate(routeForRole(session.user.role));
      }, 800);
    } catch (error: unknown) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleCredentialLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.identifier.trim() || !formData.password.trim()) {
      setSuccessMessage("");
      setErrorMessage("Please enter your email or mobile number and password.");
      return;
    }

    await loginWithCredentials(formData.identifier, formData.password);
  }

  async function handleDemoLogin() {
    setFormData(DEMO_ACCOUNT);
    await loginWithCredentials(DEMO_ACCOUNT.identifier, DEMO_ACCOUNT.password);
  }

  async function handleGoogleLogin() {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const response = await api.post("/auth/google-login", {
        idToken,
      });

      const session = response.data.data as AuthSession;
      saveSession(session);

      setSuccessMessage("Google login successful. Redirecting...");

      setTimeout(() => {
        navigate(routeForRole(session.user.role));
      }, 800);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
          "Google login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-dvh bg-cover bg-center bg-no-repeat font-sans text-ink lg:bg-left"
      style={{ backgroundImage: `url(${loginImage})` }}
    >
      <div className="mx-auto grid min-h-dvh max-w-7xl lg:grid-cols-2">
        {/* Left */}
        <section className="relative hidden min-h-screen px-10 py-40 lg:block">
          <Link
            to={ROUTES.home}
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-sage transition hover:text-leaf-dark"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

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
        <section className="flex min-h-dvh items-center justify-center bg-paper/45 px-4 py-6 backdrop-blur-[2px] sm:px-6 sm:py-10 lg:min-h-0 lg:bg-transparent lg:backdrop-blur-none">
          <div className="w-full max-w-130 rounded-2xl border border-ink-line bg-white p-5 shadow-2xl shadow-pine/10 sm:rounded-4xl sm:px-10 sm:py-10 lg:py-12">
            <Link
              to={ROUTES.home}
              className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-sage lg:hidden"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-pine sm:text-3xl">
                Welcome back!
              </h2>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-ink-soft">
                Login to your account to continue managing your business.
              </p>
            </div>

            {successMessage && (
              <div
                aria-live="polite"
                className="mt-6 rounded-xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf-dark"
              >
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCredentialLogin} className="mt-7 space-y-5 sm:mt-10 sm:space-y-6">
              <div>
                <label className="text-sm font-bold text-ink">
                  Email or mobile number
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage focus-within:ring-4 focus-within:ring-leaf/10">
                  <Smartphone size={20} className="text-ink-soft" />

                  <input
                    autoCapitalize="none"
                    autoComplete="username"
                    name="identifier"
                    spellCheck={false}
                    value={formData.identifier}
                    onChange={handleChange}
                    type="text"
                    inputMode="text"
                    placeholder="Email or 09XXXXXXXXX"
                    className="w-full bg-transparent py-3.5 text-ink outline-none placeholder:text-ink-soft/70 sm:py-4"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-bold text-ink">Password</label>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage focus-within:ring-4 focus-within:ring-leaf/10">
                  <Lock size={20} className="text-ink-soft" />

                  <input
                    autoComplete="current-password"
                    name="password"
                    maxLength={72}
                    value={formData.password}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full bg-transparent py-3.5 text-ink outline-none placeholder:text-ink-soft/70 sm:py-4"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-ink-soft transition hover:text-pine"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>

              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-leaf py-4 text-base font-bold text-white shadow-lg shadow-leaf/20 transition hover:bg-leaf-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>

              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={() => void handleDemoLogin()}
                  disabled={loading}
                  className="w-full rounded-xl border border-leaf/30 bg-leaf/5 py-3.5 text-sm font-bold text-leaf-dark transition hover:border-leaf hover:bg-leaf/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Log in with demo account
                </button>
              )}
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 sm:my-8 sm:gap-4">
              <div className="h-px flex-1 bg-ink-line" />
              <span className="text-sm text-ink-soft">or continue with</span>
              <div className="h-px flex-1 bg-ink-line" />
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-line bg-white py-3.5 font-bold text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="text-xl text-leaf">G</span>
              {loading ? "Connecting..." : "Continue with Google"}
            </button>

            <p className="mt-6 text-center text-sm text-ink-soft sm:mt-8">
              Don&apos;t have an account?{" "}
              <Link
                to={ROUTES.registerBusiness}
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
