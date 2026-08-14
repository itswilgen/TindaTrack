import { Router } from "express";
import {
  checkProductBarcode,
  createProductRecord,
  deleteProductRecord,
  getProductByBarcodeRecord,
  getProducts,
  updateProductRecord,
} from "../controllers/product.controller";
import { requireAuth, requireRole, requireStoreAccess } from "../middleware/auth.middleware";
import {
  lookupRateLimiter,
  writeRateLimiter,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.use(requireAuth, requireStoreAccess);

router.get("/", requireRole("owner", "inventory_staff"), getProducts);
router.get(
  "/check-barcode/:barcode",
  lookupRateLimiter,
  requireRole("owner", "inventory_staff", "cashier"),
  checkProductBarcode
);
router.get(
  "/barcode/:barcode",
  lookupRateLimiter,
  requireRole("owner", "inventory_staff", "cashier"),
  getProductByBarcodeRecord
);
router.post("/", writeRateLimiter, requireRole("owner", "inventory_staff"), createProductRecord);
router.put("/:productId", writeRateLimiter, requireRole("owner", "inventory_staff"), updateProductRecord);
router.delete("/:productId", writeRateLimiter, requireRole("owner"), deleteProductRecord);

export default router;
