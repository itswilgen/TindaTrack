import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../../services/api";
import CompactMetricCard from "../components/CompactMetricCard";
import OwnerPageShell from "../components/OwnerPageShell";
import { PageLoadingState } from "../../../components/LoadingSpinner";

type StaffRole = "owner" | "cashier" | "inventory_staff";

type Staff = {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  status: "active" | "inactive";
  updated_at: string;
};

type IssuedCredentials = {
  name: string;
  email: string;
  password: string;
  role: Exclude<StaffRole, "owner">;
};

const roleLabels: Record<StaffRole, string> = {
  owner: "Owner",
  cashier: "Cashier",
  inventory_staff: "Inventory staff",
};

const roleDescriptions: Record<Exclude<StaffRole, "owner">, string> = {
  cashier: "POS checkout and sales history",
  inventory_staff: "Products, stock levels, and stock-in",
};

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const random = new Uint32Array(12);
  crypto.getRandomValues(random);
  return Array.from(random, (value) => alphabet[value % alphabet.length]).join("");
}

function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [issuedCredentials, setIssuedCredentials] =
    useState<IssuedCredentials | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "cashier" as Exclude<StaffRole, "owner">,
    password: "",
  });
  const [accessForm, setAccessForm] = useState({
    role: "cashier" as Exclude<StaffRole, "owner">,
    password: "",
  });

  async function load() {
    try {
      setError("");
      const response = await api.get("/operations/staff");
      setStaff(response.data.data.staff || []);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to load staff.");
    } finally {
      setIsLoadingStaff(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreateModal() {
    setError("");
    setForm({
      name: "",
      email: "",
      role: "cashier",
      password: generateTemporaryPassword(),
    });
    setShowCreatePassword(true);
    setIsCreateOpen(true);
  }

  function openAccessModal(member: Staff) {
    if (member.role === "owner") return;
    setError("");
    setAccessForm({ role: member.role, password: "" });
    setShowResetPassword(false);
    setEditingMember(member);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await api.post("/operations/staff", form);
      setIssuedCredentials({ ...form });
      setMessage("Staff account created. Give these credentials only to the assigned staff member.");
      setIsCreateOpen(false);
      await load();
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "Unable to create staff account.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateAccess(event: React.FormEvent) {
    event.preventDefault();
    if (!editingMember) return;

    try {
      setSaving(true);
      setError("");
      await api.patch(`/operations/staff/${editingMember.id}/access`, accessForm);
      setMessage(
        accessForm.password
          ? `${editingMember.name}'s role and temporary password were updated.`
          : `${editingMember.name}'s role was updated.`,
      );
      if (accessForm.password) {
        setIssuedCredentials({
          name: editingMember.name,
          email: editingMember.email,
          password: accessForm.password,
          role: accessForm.role,
        });
      }
      setEditingMember(null);
      await load();
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update staff access.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggle(member: Staff) {
    try {
      setError("");
      const status = member.status === "active" ? "inactive" : "active";
      await api.patch(`/operations/staff/${member.id}/status`, { status });
      setMessage(
        status === "active"
          ? `${member.name} can now log in again.`
          : `${member.name} has been signed out of protected store access.`,
      );
      await load();
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message || "Unable to update staff.",
      );
    }
  }

  async function copyCredentials() {
    if (!issuedCredentials) return;
    const credentials = [
      `TindaTrack ${roleLabels[issuedCredentials.role]} account`,
      `Store user: ${issuedCredentials.name}`,
      `Login email: ${issuedCredentials.email}`,
      `Temporary password: ${issuedCredentials.password}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(credentials);
      setMessage("Login credentials copied.");
    } catch {
      setError("Unable to copy automatically. Select the credentials and copy them manually.");
    }
  }

  const storeStaff = staff.filter((member) => member.role !== "owner");
  const active = storeStaff.filter((member) => member.status === "active").length;
  const cashiers = storeStaff.filter(
    (member) => member.role === "cashier" && member.status === "active",
  ).length;
  const inventory = storeStaff.filter(
    (member) =>
      member.role === "inventory_staff" && member.status === "active",
  ).length;

  if (isLoadingStaff) {
    return <PageLoadingState fullScreen label="Loading staff accounts..." />;
  }

  return (
    <OwnerPageShell
      badge={
        <>
          <Users size={14} />
          Role-based access
        </>
      }
      description="Create staff login credentials and control access to POS and inventory work."
      title="Staff Accounts"
      topLabel="Account management"
    >
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-5 rounded-xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf-dark">
          {message}
        </div>
      )}

      {issuedCredentials && (
        <section className="mt-5 border-y border-ink-line bg-paper px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-leaf-dark">
                <KeyRound size={17} />
                <p className="text-sm font-black">Credentials ready to share</p>
              </div>
              <p className="mt-2 break-all text-sm font-bold text-ink">
                {issuedCredentials.email}
              </p>
              <p className="mt-1 break-all font-mono text-sm text-ink-soft">
                {issuedCredentials.password}
              </p>
              <p className="mt-1 text-xs font-bold text-ink-soft">
                {roleLabels[issuedCredentials.role]}: {roleDescriptions[issuedCredentials.role]}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => void copyCredentials()}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-leaf/30 bg-white px-4 text-sm font-black text-leaf-dark sm:flex-none"
              >
                <Copy size={16} />
                Copy credentials
              </button>
              <button
                type="button"
                onClick={() => setIssuedCredentials(null)}
                aria-label="Dismiss credentials"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-line bg-white text-ink-soft"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Active staff",
              value: active,
              detail: "Can access the store",
              icon: UserCheck,
              tone: "leaf" as const,
            },
            {
              label: "Cashiers",
              value: cashiers,
              detail: "POS and sales access",
              icon: Users,
              tone: "sage" as const,
            },
            {
              label: "Inventory staff",
              value: inventory,
              detail: "Product and stock access",
              icon: ShieldCheck,
              tone: "leaf" as const,
            },
          ].map((stat) => (
            <CompactMetricCard
              key={stat.label}
              detail={stat.detail}
              icon={stat.icon}
              label={stat.label}
              tone={stat.tone}
              value={String(stat.value)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-leaf px-4 text-sm font-black text-white sm:w-fit"
        >
          <Plus size={18} />
          Add staff account
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-ink-line bg-white sm:rounded-2xl">
        {staff.length === 0 && (
          <div className="p-8 text-center text-sm font-bold text-ink-soft">
            No store accounts found.
          </div>
        )}

        <div className="divide-y divide-ink-line md:hidden">
          {staff.map((member) => (
            <div key={member.id} className="p-4">
              <StaffIdentity member={member} />
              <div className="mt-3 flex items-center justify-between gap-3">
                <RoleStatus member={member} />
                {member.role === "owner" ? (
                  <span className="text-xs font-bold text-ink-soft">Protected</span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openAccessModal(member)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-line text-ink-soft"
                      aria-label={`Manage ${member.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggle(member)}
                      className="rounded-lg border border-ink-line px-3 py-2 text-xs font-black"
                    >
                      {member.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_11rem_10rem_14rem] bg-paper-dim/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-ink-soft">
              <span>Account</span>
              <span>Role</span>
              <span>Status</span>
              <span>Access controls</span>
            </div>
            {staff.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[minmax(0,1.4fr)_11rem_10rem_14rem] items-center border-t border-ink-line px-4 py-4 text-sm"
              >
                <StaffIdentity member={member} />
                <span className="font-black text-ink">{roleLabels[member.role]}</span>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-black capitalize ${
                    member.status === "active"
                      ? "bg-leaf/10 text-leaf-dark"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {member.status}
                </span>
                {member.role === "owner" ? (
                  <span className="text-xs font-bold text-ink-soft">Owner account is protected</span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openAccessModal(member)}
                      className="flex h-9 items-center gap-2 rounded-lg border border-ink-line px-3 text-xs font-black transition hover:border-leaf/40"
                    >
                      <Pencil size={14} />
                      Manage
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggle(member)}
                      className="h-9 rounded-lg border border-ink-line px-3 text-xs font-black transition hover:border-leaf/40"
                    >
                      {member.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 border-y border-ink-line bg-paper px-4 py-4 text-sm text-ink-soft">
        <p className="font-black text-ink">Access policy</p>
        <p className="mt-1">
          Cashiers can use POS and Sales. Inventory staff can use Products and Inventory.
          Only the owner can access financial reports, staff accounts, settings, and subscriptions.
        </p>
      </div>

      {isCreateOpen && (
        <AccountModal
          title="Add staff account"
          eyebrow="Admin-issued login"
          onClose={() => setIsCreateOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-black uppercase text-ink-soft sm:col-span-2">
                Full name
                <input
                  required
                  autoComplete="off"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-2 h-11 w-full rounded-xl border border-ink-line px-3 text-sm font-normal normal-case outline-none focus:border-leaf"
                />
              </label>
              <label className="text-xs font-black uppercase text-ink-soft sm:col-span-2">
                Login email
                <input
                  required
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="mt-2 h-11 w-full rounded-xl border border-ink-line px-3 text-sm font-normal normal-case outline-none focus:border-leaf"
                />
              </label>
              <RoleSelect
                value={form.role}
                onChange={(role) => setForm({ ...form, role })}
              />
              <PasswordField
                label="Temporary password"
                value={form.password}
                show={showCreatePassword}
                onChange={(password) => setForm({ ...form, password })}
                onToggle={() => setShowCreatePassword((current) => !current)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({ ...form, password: generateTemporaryPassword() });
                setShowCreatePassword(true);
              }}
              className="mt-3 flex items-center gap-2 text-xs font-black text-leaf-dark"
            >
              <KeyRound size={15} />
              Generate another password
            </button>
            <ModalActions
              saving={saving}
              submitLabel="Create account"
              onCancel={() => setIsCreateOpen(false)}
            />
          </form>
        </AccountModal>
      )}

      {editingMember && (
        <AccountModal
          title={`Manage ${editingMember.name}`}
          eyebrow="Role and credentials"
          onClose={() => setEditingMember(null)}
        >
          <form onSubmit={updateAccess}>
            <div className="mt-4 rounded-xl bg-paper px-4 py-3">
              <p className="break-all text-sm font-black text-ink">{editingMember.email}</p>
              <p className="mt-1 text-xs font-bold text-ink-soft">
                Changes apply immediately to protected API access.
              </p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <RoleSelect
                value={accessForm.role}
                onChange={(role) => setAccessForm({ ...accessForm, role })}
              />
              <PasswordField
                label="New password (optional)"
                value={accessForm.password}
                show={showResetPassword}
                required={false}
                onChange={(password) => setAccessForm({ ...accessForm, password })}
                onToggle={() => setShowResetPassword((current) => !current)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setAccessForm({ ...accessForm, password: generateTemporaryPassword() });
                setShowResetPassword(true);
              }}
              className="mt-3 flex items-center gap-2 text-xs font-black text-leaf-dark"
            >
              <KeyRound size={15} />
              Generate temporary password
            </button>
            <ModalActions
              saving={saving}
              submitLabel="Save access"
              onCancel={() => setEditingMember(null)}
            />
          </form>
        </AccountModal>
      )}
    </OwnerPageShell>
  );
}

function StaffIdentity({ member }: { member: Staff }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf/10 font-black text-leaf-dark">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate font-black text-ink">{member.name}</p>
        <p className="truncate text-xs font-bold text-ink-soft">{member.email}</p>
      </div>
    </div>
  );
}

function RoleStatus({ member }: { member: Staff }) {
  return (
    <div>
      <p className="text-xs font-black text-ink">{roleLabels[member.role]}</p>
      <p className={`mt-1 text-[0.68rem] font-black capitalize ${member.status === "active" ? "text-leaf-dark" : "text-red-500"}`}>
        {member.status}
      </p>
    </div>
  );
}

function AccountModal({
  children,
  eyebrow,
  onClose,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine/45 p-3 backdrop-blur-sm">
      <section className="scrollbar-hidden max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-leaf-dark">{eyebrow}</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-pine">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-line"
          >
            <X size={17} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function RoleSelect({
  onChange,
  value,
}: {
  onChange: (role: Exclude<StaffRole, "owner">) => void;
  value: Exclude<StaffRole, "owner">;
}) {
  return (
    <label className="text-xs font-black uppercase text-ink-soft">
      Assigned role
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Exclude<StaffRole, "owner">)}
        className="mt-2 h-11 w-full rounded-xl border border-ink-line bg-white px-3 text-sm font-normal normal-case outline-none focus:border-leaf"
      >
        <option value="cashier">Cashier</option>
        <option value="inventory_staff">Inventory staff</option>
      </select>
      <span className="mt-1.5 block text-[0.68rem] font-bold normal-case text-ink-soft">
        {roleDescriptions[value]}
      </span>
    </label>
  );
}

function PasswordField({
  label,
  onChange,
  onToggle,
  required = true,
  show,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  required?: boolean;
  show: boolean;
  value: string;
}) {
  return (
    <label className="text-xs font-black uppercase text-ink-soft">
      {label}
      <span className="relative mt-2 block">
        <input
          required={required}
          minLength={value ? 8 : undefined}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-ink-line px-3 pr-11 font-mono text-sm font-normal normal-case outline-none focus:border-leaf"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center text-ink-soft"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}

function ModalActions({
  onCancel,
  saving,
  submitLabel,
}: {
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="h-11 w-full rounded-xl border border-ink-line px-4 text-sm font-black sm:w-auto"
      >
        Cancel
      </button>
      <button
        disabled={saving}
        className="h-11 w-full rounded-xl bg-leaf px-5 text-sm font-black text-white disabled:opacity-60 sm:w-auto"
      >
        {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

export default StaffPage;
