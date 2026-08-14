import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ImagePlus,
  Lock,
  Phone,
  ShieldCheck,
  Upload,
  User,
  X,
} from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { auth, googleProvider } from "../services/firebase";
import { paymentUrl, ROUTES } from "../constants/routes";
import { formatPlanName, FREE_TRIAL_PLAN } from "../constants/subscriptionPlans";
import { saveSession } from "../features/auth/session";
import type { AuthSession } from "../features/auth/types";

type RegistrationMode = "password" | "google";
type LoadingAction = "otp" | "register" | "google" | null;

const initialForm = {
  business_name: "",
  owner_name: "",
  phone: "",
  password: "",
  logo_url: "",
};

async function prepareStoreLogo(file: File) {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
    throw new Error("Choose a PNG, JPG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 5 MB.");
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The logo could not be read."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("The logo image is invalid."));
    element.src = source;
  });
  const scale = Math.min(1, 512 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.82);
}

function RegisterBusinessPage() {
  const [formData, setFormData] = useState(initialForm);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [registrationMode, setRegistrationMode] =
    useState<RegistrationMode>("password");
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [trialDays, setTrialDays] = useState(30);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan") || FREE_TRIAL_PLAN;
  const isFreePlan = selectedPlan === FREE_TRIAL_PLAN;

  useEffect(() => {
    api.get("/auth/registration-config")
      .then((response) => {
        const days = Number(response.data.data?.default_trial_days);
        if (Number.isInteger(days) && days > 0) setTrialDays(days);
      })
      .catch(() => undefined);
  }, []);

  function resetVerification() {
    setOtpSent(false);
    setOtpCode("");
    setDevelopmentCode("");
    setGoogleIdToken("");
    setRegistrationMode("password");
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (name === "phone" && otpSent) resetVerification();
  }

  function validateBase(mode: RegistrationMode) {
    if (!formData.business_name.trim()) return "Please enter your business name.";
    if (!formData.owner_name.trim()) return "Please enter the owner's name.";
    if (!/^09\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      return "Enter a valid Philippine mobile number, such as 09XXXXXXXXX.";
    }
    if (mode === "password" && formData.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    return "";
  }

  async function requestOtp(mode: RegistrationMode, idToken = "") {
    const validationError = validateBase(mode);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoadingAction("otp");
      setErrorMessage("");
      setSuccessMessage("");
      const response = await api.post("/auth/registration-otp", {
        phone: formData.phone,
      });
      setRegistrationMode(mode);
      setGoogleIdToken(idToken);
      setOtpSent(true);
      setDevelopmentCode(response.data.data?.development_code || "");
      setOtpCode(response.data.data?.development_code || "");
      setSuccessMessage(response.data.message);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Unable to send the SMS code.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleInitialSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otpSent) {
      await completeRegistration();
      return;
    }
    await requestOtp("password");
  }

  async function completeRegistration() {
    if (!/^\d{6}$/.test(otpCode)) {
      setErrorMessage("Enter the 6-digit code sent to your mobile number.");
      return;
    }

    try {
      setLoadingAction("register");
      setErrorMessage("");
      const response = await api.post("/auth/register-business", {
        google_id_token: registrationMode === "google" ? googleIdToken : null,
        owner_name: formData.owner_name,
        password: registrationMode === "password" ? formData.password : null,
        business_name: formData.business_name,
        business_type: "Local Business",
        phone: formData.phone,
        address: "Philippines",
        logo_url: formData.logo_url || null,
        selected_plan: selectedPlan,
        otp_code: otpCode,
      });
      const session = response.data.data as AuthSession;
      saveSession(session);
      setSuccessMessage("Mobile verified. Your business workspace is ready.");
      setFormData(initialForm);
      setTimeout(
        () => navigate(isFreePlan ? ROUTES.ownerDashboard : paymentUrl(selectedPlan)),
        700,
      );
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || "We could not create your account right now.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleGoogleRegister() {
    const validationError = validateBase("google");
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoadingAction("google");
      setErrorMessage("");
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await requestOtp("google", idToken);
    } catch (error: any) {
      setErrorMessage(error.message || "Google registration failed. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setErrorMessage("");
      const logoUrl = await prepareStoreLogo(file);
      setFormData((current) => ({ ...current, logo_url: logoUrl }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to import the logo.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="min-h-dvh bg-paper-dim font-sans text-ink">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="grid gap-7 sm:gap-10 lg:mt-6 lg:grid-cols-2">
          <section className="flex flex-col justify-center">
            <Link to={ROUTES.home} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-sage transition hover:text-leaf-dark sm:mb-8">
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber">{trialDays}-day free trial</p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-[1.1] text-pine sm:text-5xl">
              Open your business workspace with TindaTrack
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft sm:mt-5 sm:text-lg sm:leading-8">
              Verify your mobile number, personalize your store, and start managing daily operations securely.
            </p>
            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-2xl border border-ink-line bg-white p-5">
                <ShieldCheck className="text-leaf-dark" size={22} />
                <h3 className="mt-3 font-display text-lg font-semibold">SMS verified</h3>
                <p className="mt-2 text-sm text-ink-soft">Account creation completes only after your phone is verified.</p>
              </div>
              <div className="rounded-2xl border border-ink-line bg-white p-5">
                <CheckCircle2 className="text-leaf-dark" size={22} />
                <h3 className="mt-3 font-display text-lg font-semibold">{trialDays}-day trial</h3>
                <p className="mt-2 text-sm text-ink-soft">Use the store workspace for {trialDays} days before selecting a paid plan.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-xl sm:rounded-3xl sm:p-6 lg:mt-10">
            <h2 className="font-display text-2xl font-semibold">Register Business</h2>
            <p className="mt-2 text-sm text-ink-soft">Your mobile number will be your account login.</p>
            <div className="mt-4 rounded-xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf-dark">
              Selected Plan: {formatPlanName(selectedPlan)}
            </div>

            {successMessage && <div aria-live="polite" className="mt-5 rounded-xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf-dark">{successMessage}</div>}
            {errorMessage && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{errorMessage}</div>}

            <form onSubmit={handleInitialSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold">Business Name</span>
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 focus-within:border-sage focus-within:bg-white">
                  <Building2 size={18} className="text-ink-soft" />
                  <input name="business_name" value={formData.business_name} onChange={handleChange} placeholder="Example: Ana's Sari-Sari Store" className="w-full bg-transparent py-3 outline-none" />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Owner Name</span>
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 focus-within:border-sage focus-within:bg-white">
                  <User size={18} className="text-ink-soft" />
                  <input name="owner_name" value={formData.owner_name} onChange={handleChange} placeholder="Your full name" className="w-full bg-transparent py-3 outline-none" />
                </span>
              </label>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Store Logo</span>
                  <span className="text-xs font-semibold text-ink-soft">Optional</span>
                </div>
                <div className="mt-2 flex items-center gap-4 rounded-xl border border-dashed border-ink-line bg-paper-dim p-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-line bg-white text-ink-soft">
                    {formData.logo_url ? <img src={formData.logo_url} alt="Store logo preview" className="h-full w-full object-contain p-1" /> : <ImagePlus size={24} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink-line bg-white px-3 py-2 text-sm font-bold text-pine transition hover:border-leaf/40">
                      <Upload size={16} /> Import logo
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="sr-only" />
                    </label>
                    <p className="mt-1 text-xs text-ink-soft">PNG, JPG, or WebP. TindaTrack remains the fallback.</p>
                  </div>
                  {formData.logo_url && <button type="button" onClick={() => setFormData((current) => ({ ...current, logo_url: "" }))} aria-label="Remove store logo" className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-white hover:text-pine"><X size={17} /></button>}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-semibold">Mobile Number</span>
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 focus-within:border-sage focus-within:bg-white">
                  <Phone size={18} className="text-ink-soft" />
                  <input autoComplete="tel" inputMode="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="09XXXXXXXXX" className="w-full bg-transparent py-3 outline-none" />
                </span>
              </label>

              {registrationMode === "password" && (
                <label className="block">
                  <span className="text-sm font-semibold">Password</span>
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-ink-line bg-paper-dim px-4 focus-within:border-sage focus-within:bg-white">
                    <Lock size={18} className="text-ink-soft" />
                    <input autoComplete="new-password" name="password" maxLength={72} value={formData.password} onChange={handleChange} type="password" placeholder="At least 8 characters" className="w-full bg-transparent py-3 outline-none" />
                  </span>
                </label>
              )}

              {otpSent && (
                <div className="rounded-xl border border-leaf/25 bg-leaf/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-pine"><ShieldCheck size={18} className="text-leaf-dark" /> Verify your mobile number</div>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">Enter the code sent to {formData.phone}. The code expires after 10 minutes.</p>
                  <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))} aria-label="SMS verification code" placeholder="6-digit code" className="mt-3 h-12 w-full rounded-xl border border-ink-line bg-white px-4 text-center text-lg font-bold tracking-[0.35em] outline-none focus:border-leaf/50" />
                  {developmentCode && <p className="mt-2 text-center text-xs font-semibold text-amber">Local test code: {developmentCode}</p>}
                  <button type="button" disabled={loadingAction !== null} onClick={() => requestOtp(registrationMode, googleIdToken)} className="mt-2 w-full text-center text-xs font-bold text-leaf-dark hover:underline">Send a new code</button>
                </div>
              )}

              <button type="submit" disabled={loadingAction !== null} className="w-full rounded-xl bg-leaf py-3.5 font-bold text-white transition hover:bg-leaf-dark disabled:cursor-not-allowed disabled:opacity-70">
                {loadingAction === "register" ? "Verifying and creating..." : loadingAction === "otp" ? "Sending SMS code..." : otpSent ? "Verify & Create Account" : "Send SMS Code"}
              </button>

              {!otpSent && (
                <>
                  <div className="my-6 flex items-center gap-4"><div className="h-px flex-1 bg-ink-line" /><span className="text-sm text-ink-soft">or</span><div className="h-px flex-1 bg-ink-line" /></div>
                  <button type="button" onClick={handleGoogleRegister} disabled={loadingAction !== null} className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-line bg-white py-3.5 font-bold transition hover:bg-paper disabled:opacity-70">
                    <span className="text-xl text-leaf">G</span>{loadingAction === "google" ? "Connecting..." : "Continue with Google & SMS"}
                  </button>
                </>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">Already have an account? <Link to={ROUTES.login} className="font-semibold text-sage hover:text-sage-dark">Login here</Link></p>
          </section>
        </div>
      </div>
    </main>
  );
}

export default RegisterBusinessPage;
