import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { ROUTES } from "../constants/routes";
import { STORAGE_KEYS } from "../constants/storage";
import { clearSession } from "../features/auth/session";
import api from "../services/api";
import { readJson } from "../utils/storage";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = readJson<{ name?: string; email?: string }>(STORAGE_KEYS.user);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
      navigate(ROUTES.login, { replace: true });
    }
  }

  return (
    <main className="min-h-dvh bg-paper-dim font-sans text-ink">
      <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open admin menu" className="fixed left-4 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-ink-line bg-white text-pine shadow-lg lg:hidden">
        <Menu size={20} />
      </button>
      {mobileOpen && <button type="button" aria-label="Close admin menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-pine/55 backdrop-blur-sm lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] flex-col border-r border-white/10 bg-pine p-5 text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between gap-3">
          <Link to={ROUTES.home}><BrandLogo className="h-12" /></Link>
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close admin menu" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white/70 lg:hidden"><X size={18} /></button>
        </div>
        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/55"><ShieldCheck size={15} /> Platform control</div>
          <p className="mt-2 text-sm font-bold">Super Administrator</p>
          <p className="mt-1 text-xs text-white/55">System-wide access</p>
        </div>
        <nav className="mt-6">
          <Link to={ROUTES.superAdminDashboard} className="flex items-center gap-3 rounded-xl bg-leaf px-4 py-3 text-sm font-bold shadow-lg shadow-leaf/20"><LayoutDashboard size={19} /> Overview</Link>
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold">{user?.name || "Administrator"}</p>
            <p className="truncate text-xs text-white/50">{user?.email}</p>
          </div>
          <button type="button" onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-amber transition hover:bg-amber/10"><LogOut size={17} /> Logout</button>
        </div>
      </aside>

      <section className="min-h-dvh lg:ml-72">{children}</section>
    </main>
  );
}
