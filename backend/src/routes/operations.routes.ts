import { Router } from "express";
import { requireAuth, requireRole, requireStoreAccess } from "../middleware/auth.middleware";
import {
  addExpense,
  addStaff,
  expensesOverview,
  exportReport,
  inventoryOverview,
  reportOverview,
  salesOverview,
  saveSettings,
  settingsOverview,
  staffOverview,
  stockIn,
  updateStaffStatus,
  updateStaffAccountAccess,
} from "../controllers/operations.controller";
import {
  exportRateLimiter,
  writeRateLimiter,
} from "../middleware/rateLimit.middleware";

const router = Router();
router.use(requireAuth, requireStoreAccess);
router.get("/inventory", requireRole("owner", "inventory_staff"), inventoryOverview);
router.post("/inventory/stock-in", writeRateLimiter, requireRole("owner", "inventory_staff"), stockIn);
router.get("/sales", requireRole("owner", "cashier"), salesOverview);
router.get("/reports", requireRole("owner"), reportOverview);
router.get("/reports/export", exportRateLimiter, requireRole("owner"), exportReport);
router.get("/staff", requireRole("owner"), staffOverview);
router.post("/staff", writeRateLimiter, requireRole("owner"), addStaff);
router.patch("/staff/:userId/status", writeRateLimiter, requireRole("owner"), updateStaffStatus);
router.patch("/staff/:userId/access", writeRateLimiter, requireRole("owner"), updateStaffAccountAccess);
router.get("/settings", requireRole("owner"), settingsOverview);
router.put("/settings", writeRateLimiter, requireRole("owner"), saveSettings);
router.get("/expenses", requireRole("owner"), expensesOverview);
router.post("/expenses", writeRateLimiter, requireRole("owner"), addExpense);

export default router;
