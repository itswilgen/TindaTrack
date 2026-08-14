export const ROUTES = {
  home: "/",
  login: "/login",
  registerBusiness: "/register-business",
  superAdminDashboard: "/admin/dashboard",
  ownerDashboard: "/owner/dashboard",
  ownerIncomeMonitoring: "/owner/income-monitoring",
  ownerPos: "/owner/pos",
  ownerProducts: "/owner/products",
  ownerInventory: "/owner/inventory",
  ownerSales: "/owner/sales",
  ownerReports: "/owner/reports",
  ownerStaff: "/owner/staff",
  ownerSettings: "/owner/settings",
  ownerSubscriptionPlans: "/owner/subscription-plans",
  payment: "/payment",
  paymentSuccess: "/payment/success",
  paymentCancel: "/payment/cancel",
} as const;

export function paymentUrl(plan: string) {
  return `${ROUTES.payment}?plan=${plan}`;
}

export function registerBusinessUrl(plan: string) {
  return `${ROUTES.registerBusiness}?plan=${plan}`;
}
