import { Router } from "express";
import { getDashboardOverview } from "../controllers/dashboard.controller";
import { requireAuth, requireRole, requireStoreAccess } from "../middleware/auth.middleware";

const router = Router();

router.get("/overview", requireAuth, requireStoreAccess, requireRole("owner"), getDashboardOverview);

export default router;
