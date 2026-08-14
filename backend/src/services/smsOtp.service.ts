import crypto from "crypto";
import { env } from "../config/env";

type DevelopmentOtp = {
  digest: string;
  expiresAt: number;
  attempts: number;
};

const developmentOtps = new Map<string, DevelopmentOtp>();
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function digestOtp(phone: string, code: string) {
  return crypto
    .createHmac("sha256", env.jwt.secret)
    .update(`${phone}:${code}`)
    .digest("hex");
}

function twilioAuthorization() {
  return `Basic ${Buffer.from(
    `${env.smsOtp.twilioAccountSid}:${env.smsOtp.twilioAuthToken}`
  ).toString("base64")}`;
}

async function callTwilioVerify(path: string, body: URLSearchParams) {
  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${env.smsOtp.twilioVerifyServiceSid}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthorization(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    }
  );

  const payload = (await response.json()) as { status?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "SMS verification service rejected the request.");
  }

  return payload;
}

export async function sendRegistrationOtp(phone: string) {
  if (env.smsOtp.provider === "twilio") {
    await callTwilioVerify(
      "Verifications",
      new URLSearchParams({ To: phone, Channel: "sms" })
    );
    return {};
  }

  const code = String(crypto.randomInt(100000, 1000000));
  developmentOtps.set(phone, {
    digest: digestOtp(phone, code),
    expiresAt: Date.now() + OTP_LIFETIME_MS,
    attempts: 0,
  });
  console.info(`[TindaTrack development OTP] ${phone}: ${code}`);
  return { developmentCode: code };
}

export async function verifyRegistrationOtp(phone: string, code: string) {
  if (env.smsOtp.provider === "twilio") {
    const result = await callTwilioVerify(
      "VerificationCheck",
      new URLSearchParams({ To: phone, Code: code })
    );
    return result.status === "approved";
  }

  const pending = developmentOtps.get(phone);
  if (!pending || pending.expiresAt <= Date.now()) {
    developmentOtps.delete(phone);
    return false;
  }

  pending.attempts += 1;
  if (pending.attempts > MAX_ATTEMPTS) {
    developmentOtps.delete(phone);
    return false;
  }

  const expected = Buffer.from(pending.digest, "hex");
  const provided = Buffer.from(digestOtp(phone, code), "hex");
  const valid = crypto.timingSafeEqual(expected, provided);

  if (valid) developmentOtps.delete(phone);
  return valid;
}
