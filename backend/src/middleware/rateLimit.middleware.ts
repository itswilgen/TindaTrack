import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env";

const MINUTE_MS = 60 * 1000;

function clientKey(req: Request) {
  return req.user?.user_id
    ? `user:${req.user.user_id}`
    : `ip:${ipKeyGenerator(req.ip || "unknown")}`;
}

function authClientKey(req: Request) {
  const identifier =
    typeof (req.body?.identifier || req.body?.email || req.body?.phone) === "string"
      ? String(req.body.identifier || req.body.email || req.body.phone).trim().toLowerCase().slice(0, 254)
      : "anonymous";

  return `${ipKeyGenerator(req.ip || "unknown")}:${identifier}`;
}

function createLimiter({
  windowMinutes,
  limit,
  message,
  keyGenerator,
  skipSuccessfulRequests = false,
}: {
  windowMinutes: number;
  limit: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    windowMs: windowMinutes * MINUTE_MS,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator,
    skipSuccessfulRequests,
    passOnStoreError: true,
    message: {
      status: "error",
      message,
    },
  });
}

export const apiRateLimiter = createLimiter({
  windowMinutes: 1,
  limit: env.rateLimits.apiPerMinute,
  message: "Too many API requests. Please wait a moment and try again.",
});

export const authRateLimiter = createLimiter({
  windowMinutes: 15,
  limit: env.rateLimits.authFailures,
  message: "Too many failed sign-in attempts. Please try again in 15 minutes.",
  keyGenerator: authClientKey,
  skipSuccessfulRequests: true,
});

export const lookupRateLimiter = createLimiter({
  windowMinutes: 1,
  limit: env.rateLimits.lookupsPerMinute,
  message: "Too many product lookups. Please wait a moment and scan again.",
  keyGenerator: clientKey,
});

export const writeRateLimiter = createLimiter({
  windowMinutes: 1,
  limit: env.rateLimits.writesPerMinute,
  message: "Too many changes were submitted. Please wait a moment and try again.",
  keyGenerator: clientKey,
});

export const saleRateLimiter = createLimiter({
  windowMinutes: 1,
  limit: env.rateLimits.salesPerMinute,
  message: "Too many sales were submitted. Please verify the last sale before retrying.",
  keyGenerator: clientKey,
});

export const exportRateLimiter = createLimiter({
  windowMinutes: 10,
  limit: env.rateLimits.exportsPerWindow,
  message: "Too many report exports. Please try again later.",
  keyGenerator: clientKey,
});

export const paymentRateLimiter = createLimiter({
  windowMinutes: 10,
  limit: env.rateLimits.paymentsPerWindow,
  message: "Too many payment requests. Please verify the current payment before retrying.",
  keyGenerator: clientKey,
});

export const webhookRateLimiter = createLimiter({
  windowMinutes: 1,
  limit: env.rateLimits.webhooksPerMinute,
  message: "Too many webhook requests.",
});
