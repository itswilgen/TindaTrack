import { Request, Response } from "express";
import { env } from "../config/env";

export const SESSION_COOKIE_NAME = "tindatrack_session";

function readCookie(req: Request, name: string) {
  const cookies = String(req.headers.cookie || "").split(";");

  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    if (separator < 0) continue;
    const key = cookie.slice(0, separator).trim();
    if (key !== name) continue;

    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

export function getSessionToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim() || null;
  }

  return readCookie(req, SESSION_COOKIE_NAME);
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: env.sessionCookieDays * 24 * 60 * 60 * 1000,
    path: "/api/v1",
    sameSite: "lax",
    secure: env.isProduction,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    path: "/api/v1",
    sameSite: "lax",
    secure: env.isProduction,
  });
}
