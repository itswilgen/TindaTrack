import { Link, useSearchParams } from "react-router-dom";

import { useState } from "react";
import api from "../services/api";
import { ROUTES } from "../constants/routes";
import { STORAGE_KEYS } from "../constants/storage";
import {
  formatPlanName,
  normalizePlan,
  SUBSCRIPTION_PLANS,
} from "../constants/subscriptionPlans";
import {
  getCityMunicipalityOptions,
  getProvinceOptions,
} from "../utils/philippinesLocations";
import { readJson } from "../utils/storage";

import {
  ArrowLeft,
  Check,
  Mail,
  MapPin,
  Lock,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

type StoredBusiness = {
  id?: number;
};

type BillingForm = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  province_code: string;
  city_code: string;
  city: string;
  state: string;
  postal_code: string;
};

function PaymentPage() {
  const [searchParams] = useSearchParams();
  const selectedPlan = normalizePlan(searchParams.get("plan"));

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [billingForm, setBillingForm] = useState<BillingForm>({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    province_code: "",
    city_code: "",
    city: "",
    state: "",
    postal_code: "",
  });

  const planLabel = formatPlanName(selectedPlan);
  const selectedPlanDetails = SUBSCRIPTION_PLANS[selectedPlan];
  const price = selectedPlanDetails.price;
  const description = selectedPlanDetails.description;
  const provinceOptions = getProvinceOptions();
  const cityOptions = getCityMunicipalityOptions(billingForm.province_code);

  function handleBillingChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setBillingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleProvinceChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const provinceCode = event.target.value;
    const province = provinceOptions.find(
      (option) => option.code === provinceCode,
    );

    setBillingForm((prev) => ({
      ...prev,
      province_code: provinceCode,
      state: province?.name || "",
      city_code: "",
      city: "",
    }));
  }

  function handleCityChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const cityCode = event.target.value;
    const city = cityOptions.find((option) => option.code === cityCode);

    setBillingForm((prev) => ({
      ...prev,
      city_code: cityCode,
      city: city?.name || "",
    }));
  }

  function validateBillingForm() {
    if (!billingForm.name.trim()) return "Please enter your full name.";
    if (!billingForm.email.trim()) return "Please enter your email address.";
    if (!billingForm.phone.trim()) return "Please enter your phone number.";
    if (!billingForm.line1.trim()) return "Please enter your billing address.";
    if (!billingForm.state.trim()) return "Please select your province.";
    if (!billingForm.city.trim()) return "Please select your city.";
    if (!billingForm.postal_code.trim())
      return "Please enter your postal code.";
    return "";
  }

  async function handleContinueToPayment(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    const validationMessage = validateBillingForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setLoading(true);

      const business = readJson<StoredBusiness>(STORAGE_KEYS.business);

      const response = await api.post("/payments/create-checkout-session", {
        plan: selectedPlan,
        paymentChannel: "hosted_checkout",
        businessId: business?.id || null,
        billing: {
          name: billingForm.name,
          email: billingForm.email,
          phone: billingForm.phone,
          address: {
            line1: billingForm.line1,
            line2: billingForm.line2 || undefined,
            city: billingForm.city,
            state: billingForm.state || undefined,
            postal_code: billingForm.postal_code,
            country: "PH",
          },
        },
      });

      const checkoutUrl = response.data.data.checkout_url;
      const checkoutSessionId = response.data.data.checkout_session_id;

      if (checkoutSessionId) {
        localStorage.setItem(
          STORAGE_KEYS.pendingCheckoutSession,
          checkoutSessionId,
        );
      }

      window.location.href = checkoutUrl;
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to continue to payment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-white font-sans text-ink">
      <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Order Summary */}
        <aside className="flex items-center justify-center bg-[#e8f5ee] px-3 py-4 sm:px-6 sm:py-6 lg:min-h-dvh lg:px-8">
          <div className="w-full max-w-130 rounded-2xl bg-white p-4 shadow-xl shadow-pine/5 sm:rounded-[1.75rem] sm:p-6">
            <Link
              to={ROUTES.registerBusiness}
              className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-sage transition hover:text-leaf-dark"
            >
              <ArrowLeft size={16} />
              Back to plans
            </Link>

            <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-sage">
              Order Summary
            </p>

            <div className="mt-4 rounded-xl bg-[#eaf4ee] p-4 sm:mt-5 sm:rounded-[1.4rem] sm:p-6">
              <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between sm:gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-leaf-dark sm:text-3xl">
                    {planLabel}
                  </h1>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-ink-soft sm:mt-3 sm:text-base sm:leading-7">
                    {description}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-leaf-dark sm:px-4 sm:py-2 sm:text-sm">
                  Monthly
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-b border-ink-line pb-5 sm:mt-6 sm:space-y-4 sm:pb-6">
              <div className="flex items-center justify-between text-base">
                <span className="text-ink-soft">Plan price</span>
                <span className="font-bold text-ink">{price}</span>
              </div>

              <div className="flex items-center justify-between text-base">
                <span className="text-ink-soft">Setup fee</span>
                <span className="font-bold text-leaf">Free</span>
              </div>

              <div className="flex items-center justify-between text-base">
                <span className="text-ink-soft">Billing cycle</span>
                <span className="font-bold text-ink">Monthly</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
              <span className="text-base font-bold text-ink sm:text-lg">
                Total due today
              </span>
              <span className="font-display text-3xl font-bold text-leaf-dark sm:text-4xl">
                {price}
              </span>
            </div>

            <div className="mt-5 space-y-3 sm:mt-6">
              {[
                "Instant account activation after payment",
                "Cancel or upgrade anytime",
                "Cloud-based access from any device",
                "Secure checkout through PayMongo",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf/10 text-leaf">
                    <Check size={15} />
                  </span>
                  <span className="text-ink-soft">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-leaf/20 bg-leaf/10 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-leaf-dark">
                <ShieldCheck size={17} />
                PayMongo-ready checkout
              </p>
            </div>
          </div>
        </aside>

        {/* Right Billing Address */}
        <section className="flex items-center justify-center px-3 py-4 sm:px-6 sm:py-6 lg:min-h-dvh">
          <div className="flex w-full max-w-140 flex-col justify-center py-2 sm:py-6">
            <div className="rounded-2xl border-ink-line bg-white sm:rounded-3xl sm:p-6">
              <form onSubmit={handleContinueToPayment}>
                <div className="rounded-xl border border-ink-line bg-paper-dim p-4 sm:rounded-2xl">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-sage">
                      Billing Address
                    </p>
                    <h1 className="mt-2 font-display text-2xl font-bold text-pine sm:text-3xl">
                      Complete your billing details
                    </h1>
                    <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
                      We use this for checkout receipts and payment records.
                      Payment methods will appear on PayMongo after you
                      continue.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage">
                      <User size={17} className="text-ink-soft" />
                      <input
                        name="name"
                        value={billingForm.name}
                        onChange={handleBillingChange}
                        type="text"
                        placeholder="Full name"
                        className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-ink-soft/60"
                      />
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage">
                      <Mail size={17} className="text-ink-soft" />
                      <input
                        name="email"
                        value={billingForm.email}
                        onChange={handleBillingChange}
                        type="email"
                        placeholder="Email address"
                        className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-ink-soft/60"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage">
                    <Phone size={17} className="text-ink-soft" />
                    <input
                      name="phone"
                      value={billingForm.phone}
                      onChange={handleBillingChange}
                      type="tel"
                      placeholder="Phone number"
                      className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-ink-soft/60"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage">
                    <MapPin size={17} className="text-ink-soft" />
                    <input
                      name="line1"
                      value={billingForm.line1}
                      onChange={handleBillingChange}
                      type="text"
                      placeholder="Street address"
                      className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-ink-soft/60"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-ink-line bg-white px-4 transition focus-within:border-sage">
                    <MapPin size={17} className="text-ink-soft" />
                    <input
                      name="line2"
                      value={billingForm.line2}
                      onChange={handleBillingChange}
                      type="text"
                      placeholder="Barangay"
                      className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-ink-soft/60"
                    />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <select
                      name="province_code"
                      value={billingForm.province_code}
                      onChange={handleProvinceChange}
                      className="rounded-xl border border-ink-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage"
                    >
                      <option value="">Province</option>
                      {provinceOptions.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>

                    <select
                      name="city_code"
                      value={billingForm.city_code}
                      onChange={handleCityChange}
                      disabled={!billingForm.province_code}
                      className="rounded-xl border border-ink-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-soft"
                    >
                      <option value="">
                        {billingForm.province_code
                          ? "City / Municipality"
                          : "City"}
                      </option>
                      {cityOptions.map((city) => (
                        <option key={city.code} value={city.code}>
                          {city.name}
                        </option>
                      ))}
                    </select>

                    <input
                      name="postal_code"
                      value={billingForm.postal_code}
                      onChange={handleBillingChange}
                      type="text"
                      placeholder="Postal code"
                      className="rounded-xl border border-ink-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-ink-soft/60 focus:border-sage"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf py-4 text-base font-bold text-white shadow-md shadow-leaf/20 transition hover:bg-leaf-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Opening PayMongo..." : "Continue to Pay"}
                </button>
              </form>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-ink-soft">
                <Lock size={15} className="text-leaf" />
                Your payment information is entered only on PayMongo.
              </p>
            </div>

            <Link
              to={ROUTES.ownerDashboard}
              className="mt-3 block shrink-0 text-center text-sm font-bold text-sage transition hover:text-sage-dark"
            >
              Skip payment for now
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default PaymentPage;
