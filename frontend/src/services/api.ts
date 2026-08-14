import axios from "axios";
import { clearSession } from "../features/auth/session";
import { STORAGE_KEYS } from "../constants/storage";
import { readJson, writeJson } from "../utils/storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !String(error.config?.url || "").includes("/auth/login")
    ) {
      clearSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    if (error.response?.status === 402) {
      const business = readJson<Record<string, unknown>>(STORAGE_KEYS.business);
      if (business) writeJson(STORAGE_KEYS.business, { ...business, status: "expired" });
      window.dispatchEvent(new Event("tindatrack:subscription-expired"));
    }
    return Promise.reject(error);
  },
);

export default api;
