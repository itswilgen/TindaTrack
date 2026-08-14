import { ROUTES } from "../../constants/routes";
import { STORAGE_KEYS } from "../../constants/storage";
import { readJson, writeJson } from "../../utils/storage";
import type {
  AppRole,
  AuthSession,
  SessionBusiness,
  SessionUser,
} from "./types";
import { isAppRole } from "./types";

const sessionKeys = [
  STORAGE_KEYS.token,
  STORAGE_KEYS.user,
  STORAGE_KEYS.business,
  STORAGE_KEYS.pendingCheckoutSession,
] as const;

export function routeForRole(role: AppRole) {
  if (role === "super_admin") return ROUTES.superAdminDashboard;
  if (role === "cashier") return ROUTES.ownerPos;
  if (role === "inventory_staff") return ROUTES.ownerInventory;
  return ROUTES.ownerDashboard;
}

export function getSession(): AuthSession | null {
  const user = readJson<SessionUser>(STORAGE_KEYS.user);
  const business = readJson<SessionBusiness>(STORAGE_KEYS.business);

  if (!user || !isAppRole(user.role)) return null;
  return { user, business };
}

export function saveSession(session: AuthSession) {
  localStorage.removeItem(STORAGE_KEYS.token);
  writeJson(STORAGE_KEYS.user, session.user);

  if (session.business) {
    writeJson(STORAGE_KEYS.business, session.business);
  } else {
    localStorage.removeItem(STORAGE_KEYS.business);
  }
}

export function clearSession() {
  sessionKeys.forEach((key) => localStorage.removeItem(key));
}
