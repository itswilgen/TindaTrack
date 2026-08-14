export type AppRole = "super_admin" | "owner" | "cashier" | "inventory_staff";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: AppRole;
};

export type SessionBusiness = {
  id: number;
  business_name: string;
  status: string;
  selected_plan?: string;
  logo_url?: string | null;
  trial_ends_at?: string | null;
};

export type AuthSession = {
  user: SessionUser;
  business: SessionBusiness | null;
};

export function isAppRole(value: unknown): value is AppRole {
  return value === "super_admin" || value === "owner" || value === "cashier" || value === "inventory_staff";
}
