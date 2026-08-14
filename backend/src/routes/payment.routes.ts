import { Router } from "express";
import {
  createCheckoutSession,
  handlePaymongoWebhook,
  syncPaymentStatus,
} from "../controllers/payment.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import {
  paymentRateLimiter,
  webhookRateLimiter,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.post(
  "/create-checkout-session",
  requireAuth,
  paymentRateLimiter,
  requireRole("owner"),
  createCheckoutSession
);
router.post("/sync-status", requireAuth, paymentRateLimiter, requireRole("owner"), syncPaymentStatus);
router.post("/webhooks/paymongo", webhookRateLimiter, handlePaymongoWebhook);

export default router;
