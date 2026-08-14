import { Router } from "express";
import {
  adminOverview,
  saveBusinessStatus,
  saveDefaultTrialDays,
  saveTrialDeadline,
  saveUserStatus,
} from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { writeRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();
router.use(requireAuth, requireRole("super_admin"));
router.get("/overview", adminOverview);
router.patch("/settings/trial-days", writeRateLimiter, saveDefaultTrialDays);
router.patch("/users/:userId/status", writeRateLimiter, saveUserStatus);
router.patch("/businesses/:businessId/status", writeRateLimiter, saveBusinessStatus);
router.patch("/businesses/:businessId/trial", writeRateLimiter, saveTrialDeadline);

export default router;
