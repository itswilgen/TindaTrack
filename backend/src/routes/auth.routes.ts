import { Router } from "express";
import {
  googleLogin,
  login,
  logout,
  currentSession,
  registerBusiness,
  requestRegistrationOtp,
  registrationConfig,
} from "../controllers/auth.controller";
import { authRateLimiter } from "../middleware/rateLimit.middleware";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/registration-config", registrationConfig);
router.post("/registration-otp", authRateLimiter, requestRegistrationOtp);
router.post("/register-business", authRateLimiter, registerBusiness);
router.post("/login", authRateLimiter, login);
router.post("/google-login", authRateLimiter, googleLogin);
router.post("/logout", authRateLimiter, logout);
router.get("/session", requireAuth, currentSession);

export default router;
