import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { PageLoadingState } from "../components/LoadingSpinner";
import SubscriptionLockScreen from "../components/SubscriptionLockScreen";
import { ROUTES } from "../constants/routes";
import { getSession, routeForRole, saveSession } from "../features/auth/session";
import type { AppRole, AuthSession } from "../features/auth/types";
import api from "../services/api";

export default function RequireAuth({
  children,
  roles,
  allowExpired = false,
}: {
  children: ReactNode;
  roles: AppRole[];
  allowExpired?: boolean;
}) {
  const [localSession] = useState(getSession);
  const [session, setSession] = useState<AuthSession | null>(localSession);
  const [checking, setChecking] = useState(Boolean(localSession));

  useEffect(() => {
    if (!localSession) return;
    let active = true;

    api.get("/auth/session")
      .then((response) => {
        if (!active) return;
        const verifiedSession = response.data.data as AuthSession;
        saveSession(verifiedSession);
        setSession(verifiedSession);
      })
      .catch(() => {
        if (active) setSession(getSession());
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    const markExpired = () => {
      const current = getSession();
      if (current) setSession(current);
    };
    window.addEventListener("tindatrack:subscription-expired", markExpired);
    return () => {
      active = false;
      window.removeEventListener("tindatrack:subscription-expired", markExpired);
    };
  }, [localSession]);

  if (!localSession) return <Navigate replace to={ROUTES.login} />;
  if (checking) return <PageLoadingState fullScreen label="Checking store access..." />;
  if (!session) return <Navigate replace to={ROUTES.login} />;
  if (!roles.includes(session.user.role)) {
    return <Navigate replace to={routeForRole(session.user.role)} />;
  }
  if (!allowExpired && session.business?.status === "expired") {
    return <SubscriptionLockScreen session={session} />;
  }
  if (session.business?.status === "suspended") {
    return <SubscriptionLockScreen session={session} />;
  }

  return children;
}
