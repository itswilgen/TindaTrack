import type { Request, Response } from "express";
import {
  getAdminOverview,
  updateBusinessStatus,
  updateBusinessTrialDeadline,
  updatePlatformUserStatus,
  type AccountStatus,
  type BusinessStatus,
} from "../models/admin.model";
import { getDefaultTrialDays, setDefaultTrialDays } from "../models/platformSetting.model";
import { sendError, sendSuccess } from "../utils/response";
import { isPositiveInteger } from "../utils/validation";

const accountStatuses = new Set<AccountStatus>(["active", "inactive", "suspended"]);
const businessStatuses = new Set<BusinessStatus>(["trial", "active", "expired", "suspended"]);

export async function adminOverview(_req: Request, res: Response) {
  try {
    return sendSuccess(res, 200, "Platform administration data loaded.", await getAdminOverview());
  } catch (error) {
    return sendError(res, 500, "Unable to load platform administration data.", error);
  }
}

export async function saveDefaultTrialDays(req: Request, res: Response) {
  try {
    const days = Number(req.body.days);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return sendError(res, 400, "Default trial length must be between 1 and 365 days.");
    }
    if (!req.user?.user_id) return sendError(res, 401, "Authentication is required.");

    await setDefaultTrialDays(days, req.user.user_id);
    return sendSuccess(res, 200, "Default trial length updated.", {
      default_trial_days: days,
    });
  } catch (error) {
    return sendError(res, 500, "Unable to update the default trial length.", error);
  }
}

export async function saveUserStatus(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    const status = String(req.body.status || "") as AccountStatus;
    if (!isPositiveInteger(userId) || !accountStatuses.has(status)) {
      return sendError(res, 400, "Select a valid account status.");
    }
    if (userId === req.user?.user_id) {
      return sendError(res, 409, "You cannot change the status of your own admin account.");
    }

    const updated = await updatePlatformUserStatus(userId, status);
    if (!updated) return sendError(res, 404, "User account not found.");
    return sendSuccess(res, 200, "User account status updated.");
  } catch (error) {
    return sendError(res, 500, "Unable to update the user account.", error);
  }
}

export async function saveBusinessStatus(req: Request, res: Response) {
  try {
    const businessId = Number(req.params.businessId);
    const status = String(req.body.status || "") as BusinessStatus;
    if (!isPositiveInteger(businessId) || !businessStatuses.has(status)) {
      return sendError(res, 400, "Select a valid store status.");
    }

    const updated = await updateBusinessStatus(
      businessId,
      status,
      await getDefaultTrialDays()
    );
    if (!updated) return sendError(res, 404, "Store workspace not found.");
    return sendSuccess(res, 200, "Store workspace status updated.");
  } catch (error) {
    return sendError(res, 500, "Unable to update the store workspace.", error);
  }
}

export async function saveTrialDeadline(req: Request, res: Response) {
  try {
    const businessId = Number(req.params.businessId);
    const deadline = String(req.body.deadline || "");
    const parsedDeadline = /^\d{4}-\d{2}-\d{2}$/.test(deadline)
      ? new Date(`${deadline}T23:59:59+08:00`)
      : null;
    if (
      !isPositiveInteger(businessId) ||
      !parsedDeadline ||
      Number.isNaN(parsedDeadline.getTime()) ||
      parsedDeadline.getTime() <= Date.now()
    ) {
      return sendError(res, 400, "Choose a valid future trial deadline.");
    }

    const updated = await updateBusinessTrialDeadline(businessId, deadline);
    if (!updated) {
      return sendError(
        res,
        409,
        "Only trial or expired stores can receive a trial deadline. Change the store status first if needed."
      );
    }
    return sendSuccess(res, 200, "Store trial deadline updated.");
  } catch (error) {
    return sendError(res, 500, "Unable to update the trial deadline.", error);
  }
}
