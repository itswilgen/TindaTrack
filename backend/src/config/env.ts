import dotenv from "dotenv";

dotenv.config();

type NodeEnvironment = "development" | "test" | "production";
type PaymentProvider = "mock" | "paymongo";
type SmsOtpProvider = "console" | "twilio";

function readString(name: string, fallback = "") {
  return String(process.env[name] ?? fallback).trim();
}

function readPositiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function readNonnegativeInteger(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function readBoolean(name: string, fallback = false) {
  const value = readString(name, String(fallback)).toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false.`);
}

function readUrl(name: string, fallback: string) {
  const value = readString(name, fallback);

  return normalizeUrl(value, name);
}

function normalizeUrl(value: string, name: string) {

  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
}

function readNodeEnvironment(): NodeEnvironment {
  const value = readString("NODE_ENV", "development");
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }
  throw new Error("NODE_ENV must be development, test, or production.");
}

function readPaymentProvider(): PaymentProvider {
  const value = readString("PAYMENT_PROVIDER", "mock");
  if (value === "mock" || value === "paymongo") return value;
  throw new Error("PAYMENT_PROVIDER must be mock or paymongo.");
}

function readSmsOtpProvider(): SmsOtpProvider {
  const value = readString("SMS_OTP_PROVIDER", "console");
  if (value === "console" || value === "twilio") return value;
  throw new Error("SMS_OTP_PROVIDER must be console or twilio.");
}

const nodeEnv = readNodeEnvironment();
const isProduction = nodeEnv === "production";
const jwtSecret = readString("JWT_SECRET");
const frontendUrl = readUrl("FRONTEND_URL", "http://localhost:5173");
const paymentProvider = readPaymentProvider();
const paymongoSecretKey = readString("PAYMONGO_SECRET_KEY");
const paymongoWebhookSecret = readString("PAYMONGO_WEBHOOK_SECRET");
const databaseHost = readString("DB_HOST", "localhost");
const databaseUser = readString("DB_USER", "root");
const databaseSsl = readBoolean("DB_SSL", false);
const smsOtpProvider = readSmsOtpProvider();
const twilioAccountSid = readString("TWILIO_ACCOUNT_SID");
const twilioAuthToken = readString("TWILIO_AUTH_TOKEN");
const twilioVerifyServiceSid = readString("TWILIO_VERIFY_SERVICE_SID");

if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

if (isProduction && !frontendUrl.startsWith("https://")) {
  throw new Error("FRONTEND_URL must use HTTPS in production.");
}

if (isProduction && paymentProvider === "mock") {
  throw new Error("PAYMENT_PROVIDER cannot be mock in production.");
}

if (paymentProvider === "paymongo" && !paymongoSecretKey) {
  throw new Error("PAYMONGO_SECRET_KEY is required when PayMongo is enabled.");
}

if (isProduction && paymentProvider === "paymongo" && !paymongoWebhookSecret) {
  throw new Error("PAYMONGO_WEBHOOK_SECRET is required in production.");
}

if (isProduction && databaseUser.toLowerCase() === "root") {
  throw new Error("DB_USER must be a restricted application user in production.");
}

if (
  isProduction &&
  !["localhost", "127.0.0.1", "::1"].includes(databaseHost) &&
  !databaseSsl
) {
  throw new Error("DB_SSL must be true for a remote production database.");
}

if (isProduction && smsOtpProvider === "console") {
  throw new Error("SMS_OTP_PROVIDER must be twilio in production.");
}

if (
  smsOtpProvider === "twilio" &&
  (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid)
) {
  throw new Error(
    "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID are required for SMS OTP."
  );
}

const configuredOrigins = readString("CORS_ALLOWED_ORIGINS")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => normalizeUrl(origin, "CORS_ALLOWED_ORIGINS"));

export const env = Object.freeze({
  nodeEnv,
  isDevelopment: nodeEnv === "development",
  isProduction,
  port: readPositiveInteger("PORT", 5000),
  frontendUrl,
  corsAllowedOrigins: Array.from(new Set([frontendUrl, ...configuredOrigins])),
  trustProxyHops: readNonnegativeInteger("TRUST_PROXY_HOPS", 0),
  database: {
    host: databaseHost,
    port: readPositiveInteger("DB_PORT", 3306),
    user: databaseUser,
    password: String(process.env.DB_PASSWORD ?? ""),
    name: readString("DB_NAME", "tindatrack_db"),
    connectionLimit: readPositiveInteger("DB_CONNECTION_LIMIT", 10),
    ssl: databaseSsl,
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: readString("JWT_EXPIRES_IN", "7d"),
    issuer: readString("JWT_ISSUER", "tindatrack-api"),
    audience: readString("JWT_AUDIENCE", "tindatrack-app"),
  },
  sessionCookieDays: readPositiveInteger("SESSION_COOKIE_DAYS", 7),
  firebaseCredentialPath: readString("GOOGLE_APPLICATION_CREDENTIALS"),
  smsOtp: {
    provider: smsOtpProvider,
    twilioAccountSid,
    twilioAuthToken,
    twilioVerifyServiceSid,
  },
  paymentProvider,
  paymongo: {
    secretKey: paymongoSecretKey,
    webhookSecret: paymongoWebhookSecret,
    hostedPaymentMethodTypes: readString(
      "PAYMONGO_HOSTED_PAYMENT_METHOD_TYPES",
      "card,gcash,qrph"
    ),
    mayaPaymentMethodTypes: readString(
      "PAYMONGO_MAYA_PAYMENT_METHOD_TYPES",
      "card"
    ),
  },
  rateLimits: {
    apiPerMinute: readPositiveInteger("RATE_LIMIT_API_PER_MINUTE", 300),
    authFailures: readPositiveInteger("RATE_LIMIT_AUTH_FAILURES", 10),
    lookupsPerMinute: readPositiveInteger("RATE_LIMIT_LOOKUPS_PER_MINUTE", 120),
    writesPerMinute: readPositiveInteger("RATE_LIMIT_WRITES_PER_MINUTE", 60),
    salesPerMinute: readPositiveInteger("RATE_LIMIT_SALES_PER_MINUTE", 30),
    exportsPerWindow: readPositiveInteger("RATE_LIMIT_EXPORTS_PER_WINDOW", 10),
    paymentsPerWindow: readPositiveInteger("RATE_LIMIT_PAYMENTS_PER_WINDOW", 20),
    webhooksPerMinute: readPositiveInteger("RATE_LIMIT_WEBHOOKS_PER_MINUTE", 120),
  },
});
