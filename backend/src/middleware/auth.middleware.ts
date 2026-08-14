import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response";
import { AuthUser } from "../types/request.types";
import { findUserAccessById } from "../models/businessUser.model";
import { env } from "../config/env";
import { getSessionToken } from "../utils/sessionCookie";
import { findUserById } from "../models/user.model";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getSessionToken(req);

  if (!token) {
    return sendError(res, 401, "Authentication is required.");
  }

  let decoded: AuthUser;

  try {
    decoded = jwt.verify(
      token,
      env.jwt.secret,
      {
        algorithms: ["HS256"],
        audience: env.jwt.audience,
        issuer: env.jwt.issuer,
      }
    ) as AuthUser;

    if (!decoded.user_id || !decoded.email) {
      return sendError(res, 401, "Invalid authentication token.");
    }

  } catch {
    return sendError(res, 401, "Your session has expired. Please log in again.");
  }

  try {
    const platformUser = await findUserById(decoded.user_id);
    if (!platformUser || platformUser.status !== "active") {
      return sendError(res, 401, "This account has been deactivated.");
    }

    if (platformUser.global_role === "super_admin") {
      req.user = {
        user_id: platformUser.id,
        email: platformUser.email,
        name: platformUser.name,
        role: "super_admin",
      };
      return next();
    }

    const access = await findUserAccessById(decoded.user_id);

    if (!access) {
      return sendError(res, 401, "This account no longer has store access.");
    }

    if (access.user_status !== "active") {
      return sendError(res, 401, "This staff account has been deactivated.");
    }

    if (access.business_status === "suspended") {
      return sendError(res, 403, "This store workspace is suspended.");
    }

    req.user = {
      user_id: access.user_id,
      email: access.email,
      name: access.name,
      role: access.role,
    };
    req.store = {
      id: access.business_id,
      name: access.business_name,
      status: access.business_status,
      trial_ends_at: access.trial_ends_at,
    };

    return next();
  } catch (error) {
    return sendError(res, 500, "Unable to verify account access.", error);
  }
}

export function requireStoreAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.store) return sendError(res, 401, "Authentication is required.");

  if (req.store.status === "expired") {
    return sendError(
      res,
      402,
      "Your free trial or subscription has ended. Choose a plan to unlock this store."
    );
  }

  return next();
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 401, "Authentication is required.");

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, "You do not have permission to use this feature.");
    }
    return next();
  };
}
