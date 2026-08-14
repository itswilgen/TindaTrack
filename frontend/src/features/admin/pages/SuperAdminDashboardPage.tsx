import { Building2, CalendarDays, LockKeyhole, Save, Search, ShieldCheck, Store, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageLoadingState } from "../../../components/LoadingSpinner";
import { STORAGE_KEYS } from "../../../constants/storage";
import SuperAdminLayout from "../../../layout/SuperAdminLayout";
import api from "../../../services/api";
import { readJson } from "../../../utils/storage";

type BusinessStatus = "trial" | "active" | "expired" | "suspended";
type AccountStatus = "active" | "inactive" | "suspended";
type AdminBusiness = { id: number; business_name: string; logo_url: string | null; status: BusinessStatus; selected_plan: string; trial_ends_at: string | null; owner_name: string; owner_email: string; owner_phone: string | null; user_count: number };
type AdminUser = { id: number; name: string; email: string; phone: string | null; global_role: "super_admin" | "business_user"; status: AccountStatus; business_name: string | null; business_role: string | null };
type AdminData = { settings: { default_trial_days: number }; stats: { businesses: number; users: number; trials: number; locked: number }; businesses: AdminBusiness[]; users: AdminUser[] };

const statusStyle: Record<string, string> = {
  active: "bg-leaf/10 text-leaf-dark",
  trial: "bg-sky-50 text-sky-700",
  expired: "bg-amber/10 text-amber",
  suspended: "bg-red-50 text-red-600",
  inactive: "bg-paper-dim text-ink-soft",
};

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Not set";
}

function toDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInput(date.toISOString());
}

export default function SuperAdminDashboardPage() {
  const currentUser = readJson<{ id?: number }>(STORAGE_KEYS.user);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"stores" | "users">("stores");
  const [trialDays, setTrialDays] = useState(30);
  const [deadlines, setDeadlines] = useState<Record<number, string>>({});

  const loadData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError("");
      const response = await api.get("/admin/overview");
      const nextData = response.data.data as AdminData;
      setData(nextData);
      setTrialDays(nextData.settings.default_trial_days);
      setDeadlines(Object.fromEntries(nextData.businesses.map((business) => [business.id, toDateInput(business.trial_ends_at)])));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to load platform administration data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(true); }, [loadData]);

  const normalizedSearch = search.trim().toLowerCase();
  const businesses = useMemo(() => (data?.businesses || []).filter((business) =>
    [business.business_name, business.owner_name, business.owner_email, business.owner_phone].some((value) => String(value || "").toLowerCase().includes(normalizedSearch))), [data?.businesses, normalizedSearch]);
  const users = useMemo(() => (data?.users || []).filter((user) =>
    [user.name, user.email, user.phone, user.business_name, user.business_role].some((value) => String(value || "").toLowerCase().includes(normalizedSearch))), [data?.users, normalizedSearch]);

  async function runUpdate(key: string, request: () => Promise<unknown>, success: string) {
    try {
      setSavingKey(key); setError(""); setMessage("");
      await request();
      setMessage(success);
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "The change could not be saved.");
    } finally {
      setSavingKey("");
    }
  }

  if (loading) return <PageLoadingState fullScreen label="Loading platform controls..." />;

  const metrics = [
    { label: "Store workspaces", value: data?.stats.businesses || 0, detail: "Registered businesses", icon: Store },
    { label: "User accounts", value: data?.stats.users || 0, detail: "Owners and staff", icon: Users },
    { label: "Active trials", value: data?.stats.trials || 0, detail: `${data?.settings.default_trial_days || 30}-day default`, icon: CalendarDays },
    { label: "Locked stores", value: data?.stats.locked || 0, detail: "Expired or suspended", icon: LockKeyhole },
  ];

  return (
    <SuperAdminLayout>
      <header className="sticky top-0 z-30 border-b border-ink-line bg-paper-dim/90 py-3 pl-20 pr-4 backdrop-blur-xl sm:pr-6 lg:px-7 lg:py-4">
        <div className="flex items-center justify-between gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Platform Administration</p><h1 className="truncate font-display text-xl font-bold text-pine sm:text-2xl">Super Admin</h1></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf text-white"><ShieldCheck size={19} /></span></div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section><p className="text-xs font-bold uppercase tracking-widest text-leaf-dark">System overview</p><h2 className="mt-1 font-display text-2xl font-bold text-pine sm:text-3xl">Stores and account access</h2><p className="mt-2 text-sm text-ink-soft">Control trial policy, store availability, and user status from one protected workspace.</p></section>

        {(error || message) && <div role={error ? "alert" : "status"} className={`mt-5 rounded-xl border px-4 py-3 text-sm font-bold ${error ? "border-red-200 bg-red-50 text-red-600" : "border-leaf/20 bg-leaf/10 text-leaf-dark"}`}>{error || message}</div>}

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, detail, icon: Icon }) => <article key={label} className="flex min-h-28 items-center gap-4 rounded-xl border border-ink-line bg-white p-4 shadow-sm"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf/10 text-leaf-dark"><Icon size={20} /></span><div><p className="text-xs font-bold text-ink-soft">{label}</p><p className="mt-1 font-display text-2xl font-bold text-pine">{value}</p><p className="mt-1 text-xs font-semibold text-sage">{detail}</p></div></article>)}
        </section>

        <section className="mt-5 flex flex-col gap-4 rounded-xl border border-ink-line bg-white p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div><div className="flex items-center gap-2 font-bold text-pine"><CalendarDays size={18} className="text-leaf-dark" /> Default free-trial length</div><p className="mt-1 text-xs leading-5 text-ink-soft">Applies to newly registered businesses. Existing deadlines remain unchanged.</p></div>
          <div className="flex items-end gap-2"><label><span className="mb-1 block text-xs font-bold uppercase text-ink-soft">Days</span><input type="number" min={1} max={365} value={trialDays} onChange={(event) => setTrialDays(Number(event.target.value))} className="h-11 w-24 rounded-xl border border-ink-line px-3 text-sm font-bold outline-none focus:border-leaf/50" /></label><button type="button" disabled={savingKey === "trial-days"} onClick={() => runUpdate("trial-days", () => api.patch("/admin/settings/trial-days", { days: trialDays }), "Default trial length updated.")} className="flex h-11 items-center gap-2 rounded-xl bg-leaf px-4 text-sm font-bold text-white hover:bg-leaf-dark disabled:opacity-60"><Save size={16} /> Save</button></div>
        </section>

        <section className="mt-5 overflow-hidden rounded-xl border border-ink-line bg-white">
          <div className="flex flex-col gap-3 border-b border-ink-line p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex rounded-xl bg-paper-dim p-1"><button type="button" onClick={() => setTab("stores")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "stores" ? "bg-white text-leaf-dark shadow-sm" : "text-ink-soft"}`}>Stores</button><button type="button" onClick={() => setTab("users")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "users" ? "bg-white text-leaf-dark shadow-sm" : "text-ink-soft"}`}>Users</button></div><label className="flex h-11 w-full items-center gap-2 rounded-xl border border-ink-line px-3 sm:max-w-sm"><Search size={17} className="text-ink-soft" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${tab}...`} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label></div>

          {tab === "stores" ? <div className="divide-y divide-ink-line">
            {businesses.map((business) => <article key={business.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(14rem,1.4fr)_minmax(12rem,1fr)_10rem_minmax(13rem,1fr)] lg:items-center">
              <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-line bg-paper-dim text-leaf-dark">{business.logo_url ? <img src={business.logo_url} alt="" className="h-full w-full object-contain p-1" /> : <Building2 size={19} />}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-pine">{business.business_name}</p><p className="mt-1 text-xs capitalize text-ink-soft">{business.user_count} account{Number(business.user_count) === 1 ? "" : "s"} · {business.selected_plan.replaceAll("_", " ")}</p></div></div>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{business.owner_name}</p><p className="truncate text-xs text-ink-soft">{business.owner_phone || business.owner_email}</p></div>
              <label><span className="mb-1 block text-[0.65rem] font-bold uppercase text-ink-soft lg:hidden">Status</span><select value={business.status} disabled={savingKey === `business-${business.id}`} onChange={(event) => runUpdate(`business-${business.id}`, () => api.patch(`/admin/businesses/${business.id}/status`, { status: event.target.value }), `${business.business_name} status updated.`)} className={`h-10 w-full rounded-xl border-0 px-3 text-xs font-bold outline-none ${statusStyle[business.status]}`}>{["trial", "active", "expired", "suspended"].map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select></label>
              <div><p className="mb-1 text-[0.65rem] font-bold uppercase text-ink-soft">Trial deadline · {formatDate(business.trial_ends_at)}</p>{business.status === "trial" || business.status === "expired" ? <div className="flex gap-2"><input type="date" min={tomorrow()} value={deadlines[business.id] || ""} onChange={(event) => setDeadlines((current) => ({ ...current, [business.id]: event.target.value }))} className="h-10 min-w-0 flex-1 rounded-xl border border-ink-line px-2 text-xs font-semibold outline-none" /><button type="button" aria-label={`Save ${business.business_name} trial deadline`} disabled={!deadlines[business.id] || savingKey === `trial-${business.id}`} onClick={() => runUpdate(`trial-${business.id}`, () => api.patch(`/admin/businesses/${business.id}/trial`, { deadline: deadlines[business.id] }), `${business.business_name} trial deadline updated.`)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-white disabled:opacity-50"><Save size={15} /></button></div> : <p className="text-xs font-semibold text-ink-soft">Unavailable for active plans.</p>}</div>
            </article>)}
            {!businesses.length && <p className="p-8 text-center text-sm font-semibold text-ink-soft">No stores match your search.</p>}
          </div> : <div className="divide-y divide-ink-line">
            {users.map((user) => <article key={user.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(14rem,1.5fr)_minmax(12rem,1fr)_10rem] sm:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold text-pine">{user.name}</p>{user.global_role === "super_admin" && <ShieldCheck size={15} className="shrink-0 text-leaf-dark" />}</div><p className="truncate text-xs text-ink-soft">{user.phone || user.email}</p></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.business_name || "TindaTrack Platform"}</p><p className="text-xs capitalize text-ink-soft">{user.global_role === "super_admin" ? "Super administrator" : (user.business_role || "Business user").replaceAll("_", " ")}</p></div><select aria-label={`${user.name} account status`} value={user.status} disabled={user.id === currentUser?.id || savingKey === `user-${user.id}`} onChange={(event) => runUpdate(`user-${user.id}`, () => api.patch(`/admin/users/${user.id}/status`, { status: event.target.value }), `${user.name} status updated.`)} className={`h-10 w-full rounded-xl border-0 px-3 text-xs font-bold outline-none disabled:opacity-60 ${statusStyle[user.status]}`}>{["active", "inactive", "suspended"].map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select></article>)}
            {!users.length && <p className="p-8 text-center text-sm font-semibold text-ink-soft">No users match your search.</p>}
          </div>}
        </section>
      </div>
    </SuperAdminLayout>
  );
}
