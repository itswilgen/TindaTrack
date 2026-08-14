import {
  BarChart3,
  Boxes,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../../../components/BrandLogo";
import { ROUTES } from "../../../constants/routes";
import { formatPlanName } from "../../../constants/subscriptionPlans";
import { STORAGE_KEYS } from "../../../constants/storage";
import { readJson } from "../../../utils/storage";
import { clearSession } from "../../auth/session";
import type { AppRole } from "../../auth/types";
import api from "../../../services/api";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.ownerDashboard, roles: ["owner"] },
  { label: "Income Monitor", icon: Wallet, path: ROUTES.ownerIncomeMonitoring, roles: ["owner"] },
  { label: "POS", icon: ShoppingCart, path: ROUTES.ownerPos, roles: ["owner", "cashier"] },
  { label: "Products", icon: Package, path: ROUTES.ownerProducts, roles: ["owner", "inventory_staff"] },
  { label: "Inventory", icon: Boxes, path: ROUTES.ownerInventory, roles: ["owner", "inventory_staff"] },
  { label: "Sales", icon: Receipt, path: ROUTES.ownerSales, roles: ["owner", "cashier"] },
  { label: "Reports", icon: BarChart3, path: ROUTES.ownerReports, roles: ["owner"] },
  { label: "Staff", icon: Users, path: ROUTES.ownerStaff, roles: ["owner"] },
  { label: "Settings", icon: Settings, path: ROUTES.ownerSettings, roles: ["owner"] },
];

const planBadgeStyles: Record<string, string> = {
  free_trial: "bg-white/10 text-white/75 ring-white/15",
  starter: "bg-leaf/20 text-white ring-leaf/35",
  business: "bg-sage/25 text-white ring-sage/40",
  premium: "bg-amber/20 text-amber ring-amber/35",
};

function OwnerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const user = readJson<{ name?: string; email?: string; phone?: string; role?: string }>(STORAGE_KEYS.user);
  const business = readJson<{ business_name?: string; selected_plan?: string; logo_url?: string | null; status?: string; trial_ends_at?: string | null }>(
    STORAGE_KEYS.business,
  );
  const ownerName = user?.name || "Owner";
  const ownerContact = user?.phone || user?.email || "TindaTrack account";
  const initial = ownerName.charAt(0).toUpperCase();
  const currentPlan = business?.selected_plan || "free_trial";
  const role = (user?.role || "") as AppRole;
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));
  const planLabel = business?.status === "expired"
    ? "Plan expired"
    : currentPlan === "free_trial"
      ? "1-month trial"
      : formatPlanName(currentPlan);
  const planBadgeClass =
    planBadgeStyles[currentPlan] || "bg-white/10 text-white/75 ring-white/15";

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileOpen]);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Local cleanup still signs the user out if the API is unavailable.
    }
    clearSession();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <>
      <button
        type="button"
        aria-controls="owner-navigation"
        aria-expanded={isMobileOpen}
        aria-label="Open navigation menu"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-ink-line bg-white text-pine shadow-lg shadow-pine/10 transition hover:border-leaf/40 hover:text-leaf-dark lg:hidden"
      >
        <Menu size={21} />
      </button>

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-pine/55 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        id="owner-navigation"
        className={`scrollbar-hidden fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[88vw] flex-col overflow-y-auto overscroll-contain border-r border-white/10 bg-pine px-4 py-4 text-white shadow-2xl transition-transform duration-300 ease-out lg:h-screen lg:translate-x-0 lg:py-5 lg:shadow-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div>
        <div className="flex items-center justify-between gap-3 px-2">
          <Link to={ROUTES.home} className="flex min-w-0 items-center" onClick={() => setIsMobileOpen(false)}>
            {business?.logo_url ? (
              <img src={business.logo_url} alt={`${business.business_name || "Store"} logo`} className="h-11 max-w-44 object-contain object-left lg:h-12" />
            ) : (
              <BrandLogo className="h-11 lg:h-12" />
            )}
          </Link>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/75 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 rounded-xl bg-white/10 p-4 lg:mt-6 lg:rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Workspace
          </p>
          <p className="mt-2 truncate text-sm font-bold">
            {business?.business_name || "TindaTrack Store"}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs capitalize text-white/55">{role.replace("_", " ")} account</p>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide ring-1 ${planBadgeClass}`}
            >
              {planLabel}
            </span>
          </div>
        </div>

        <nav className="mt-5 space-y-1 lg:mt-6">
          {visibleNavItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={label}
              to={path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-leaf text-white shadow-lg shadow-leaf/20"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

      </div>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl p-3">
          <button
            type="button"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{ownerName}</p>
              <p className="truncate text-xs text-white/50">{ownerContact}</p>
            </div>
          </button>

          {isProfileMenuOpen && (
            <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() =>
                  window.alert(
                    "The mobile app is still in development. Your web account and store data are ready for it when released.",
                  )
                }
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <Download size={17} />
                  Download app
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white/50">
                  Soon
                </span>
              </button>

              {role === "owner" && (
                <Link
                  to={ROUTES.ownerSubscriptionPlans}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <Sparkles size={17} />
                  Subscription plan
                </Link>
              )}

              <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber transition hover:bg-amber/10">
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}

export default OwnerSidebar;
