import { Router } from "express";
import { createPosSale, getPosCatalog } from "../controllers/pos.controller";
import { requireAuth, requireRole, requireStoreAccess } from "../middleware/auth.middleware";
import { saleRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.use(requireAuth, requireStoreAccess);

router.get("/catalog", requireRole("owner", "cashier"), getPosCatalog);
router.post(
  "/sales",
  saleRateLimiter,
  requireRole("owner", "cashier"),
  createPosSale
);

export default router;
