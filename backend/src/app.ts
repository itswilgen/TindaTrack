import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import paymentRoutes from "./routes/payment.routes";
import posRoutes from "./routes/pos.routes";
import productRoutes from "./routes/product.routes";
import operationsRoutes from "./routes/operations.routes";
import adminRoutes from "./routes/admin.routes";
import { env } from "./config/env";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import { attachRequestContext } from "./middleware/requestContext.middleware";
import { sendSuccess } from "./utils/response";

const app = express();
const API_PREFIX = "/api/v1";
const trustProxyHops = env.trustProxyHops;

if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
  app.set("trust proxy", trustProxyHops);
}
const developmentOrigins = env.isDevelopment
  ? [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5175",
    ]
  : [];
const allowedOrigins = new Set([
  ...env.corsAllowedOrigins,
  ...developmentOrigins,
]);

app.disable("x-powered-by");
app.use(attachRequestContext);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error("This origin is not allowed to access the API.") as Error & {
        status?: number;
      };
      error.status = 403;
      callback(error);
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    strictTransportSecurity: env.isProduction ? undefined : false,
  })
);
app.use(
  morgan(env.isProduction ? "combined" : "dev", {
    skip: (req) => req.path === "/api/v1/health",
  })
);
app.use(
  express.json({
    limit: "4mb",
    verify: (req, _res, buffer) => {
      const request = req as express.Request;
      if (request.originalUrl === `${API_PREFIX}/payments/webhooks/paymongo`) {
        request.rawBody = Buffer.from(buffer);
      }
    },
  })
);

app.get("/", (_req, res) => {
  sendSuccess(res, 200, "TindaTrack Backend API is running");
});

app.get(`${API_PREFIX}/health`, (_req, res) => {
  sendSuccess(res, 200, "API is healthy");
});

app.use(API_PREFIX, apiRateLimiter);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/pos`, posRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/operations`, operationsRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
