import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import RequireAuth from "./RequireAuth";
import { PageLoadingState } from "../components/LoadingSpinner";

const LandingPage = lazy(() => import("../pages/LandingPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterBusinessPage = lazy(() => import("../pages/RegisterBusinessPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const OwnerDashboardPage = lazy(() => import("../features/dashboard/pages/OwnerDashboardPage"));
const IncomeMonitoringPage = lazy(() => import("../features/dashboard/pages/IncomeMonitoringPage"));
const PosPage = lazy(() => import("../features/dashboard/pages/PosPage"));
const ProductsPage = lazy(() => import("../features/dashboard/pages/ProductsPage"));
const InventoryPage = lazy(() => import("../features/dashboard/pages/InventoryPage"));
const SalesPage = lazy(() => import("../features/dashboard/pages/SalesPage"));
const ReportsPage = lazy(() => import("../features/dashboard/pages/ReportsPage"));
const StaffPage = lazy(() => import("../features/dashboard/pages/StaffPage"));
const SettingsPage = lazy(() => import("../features/dashboard/pages/SettingsPage"));
const SubscriptionPlansPage = lazy(() => import("../features/dashboard/pages/SubscriptionPlansPage"));
const PaymentPage = lazy(() => import("../pages/PaymentPage"));
const PaymentSuccessPage = lazy(() => import("../pages/PaymentSuccessPage"));
const PaymentCancelPage = lazy(() => import("../pages/PaymentCancelPage"));
const SuperAdminDashboardPage = lazy(() => import("../features/admin/pages/SuperAdminDashboardPage"));

const ownerOnly = ["owner"] as const;
const posRoles = ["owner", "cashier"] as const;
const inventoryRoles = ["owner", "inventory_staff"] as const;
const superAdminOnly = ["super_admin"] as const;

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={<PageLoadingState fullScreen label="Loading TindaTrack..." />}
      >
        <Routes>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route
          path={ROUTES.registerBusiness}
          element={<RegisterBusinessPage />}
        />
        <Route path={ROUTES.superAdminDashboard} element={<RequireAuth roles={[...superAdminOnly]}><SuperAdminDashboardPage /></RequireAuth>} />
        <Route path={ROUTES.ownerDashboard} element={<RequireAuth roles={[...ownerOnly]}><OwnerDashboardPage /></RequireAuth>} />
        <Route
          path={ROUTES.ownerIncomeMonitoring}
          element={<RequireAuth roles={[...ownerOnly]}><IncomeMonitoringPage /></RequireAuth>}
        />
        <Route path={ROUTES.ownerPos} element={<RequireAuth roles={[...posRoles]}><PosPage /></RequireAuth>} />
        <Route path={ROUTES.ownerProducts} element={<RequireAuth roles={[...inventoryRoles]}><ProductsPage /></RequireAuth>} />
        <Route path={ROUTES.ownerInventory} element={<RequireAuth roles={[...inventoryRoles]}><InventoryPage /></RequireAuth>} />
        <Route path={ROUTES.ownerSales} element={<RequireAuth roles={[...posRoles]}><SalesPage /></RequireAuth>} />
        <Route path={ROUTES.ownerReports} element={<RequireAuth roles={[...ownerOnly]}><ReportsPage /></RequireAuth>} />
        <Route path={ROUTES.ownerStaff} element={<RequireAuth roles={[...ownerOnly]}><StaffPage /></RequireAuth>} />
        <Route path={ROUTES.ownerSettings} element={<RequireAuth roles={[...ownerOnly]}><SettingsPage /></RequireAuth>} />
        <Route
          path={ROUTES.ownerSubscriptionPlans}
          element={<RequireAuth allowExpired roles={[...ownerOnly]}><SubscriptionPlansPage /></RequireAuth>}
        />
        <Route path={ROUTES.payment} element={<PaymentPage />} />
        <Route path={ROUTES.paymentSuccess} element={<PaymentSuccessPage />} />
        <Route path={ROUTES.paymentCancel} element={<PaymentCancelPage />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
