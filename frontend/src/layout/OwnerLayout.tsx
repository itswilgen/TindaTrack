import { Outlet, NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  BarChart3,
  Users,
  LogOut,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const menuItems = [
  { name: "Dashboard", path: "/owner/dashboard", icon: LayoutDashboard },
  { name: "POS", path: "/owner/pos", icon: ShoppingCart },
  { name: "Products", path: "/owner/products", icon: Package },
  { name: "Inventory", path: "/owner/inventory", icon: Boxes },
  { name: "Sales", path: "/owner/sales", icon: Receipt },
  { name: "Reports", path: "/owner/reports", icon: BarChart3 },
  { name: "Staff", path: "/owner/staff", icon: Users },
];

function OwnerLayout() {
  return (
    <div className="min-h-screen bg-paper-dim font-sans text-ink">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-pine text-white">
        <div className="border-b border-white/10 px-6 py-5">
          <Link to="/">
            <BrandLogo className="h-9" />
          </Link>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/40">
            Owner Panel
          </p>
        </div>

        <nav className="space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-leaf text-white"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}

          <button className="mt-6 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-amber hover:bg-amber/10">
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="flex h-16 items-center justify-between border-b border-ink-line bg-white px-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Business Dashboard
          </h2>
          <span className="rounded-full bg-paper-dim px-3 py-1 text-sm font-medium text-ink-soft">
            Owner Account
          </span>
        </header>

        <section className="p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default OwnerLayout;
