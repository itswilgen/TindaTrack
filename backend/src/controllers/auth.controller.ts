import { Request, Response } from "express";
import {
  googleLoginService,
  getSessionService,
  loginService,
  registerBusinessService,
  verifyGoogleRegistrationToken,
} from "../services/auth.service";
import { findUserByPhone } from "../models/user.model";
import {
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from "../services/smsOtp.service";
import { sendError, sendSuccess } from "../utils/response";
import {
  INPUT_LIMITS,
  isValidEmail,
  isValidPassword,
  isValidStoreLogo,
  isWithinLength,
  normalizeEmail,
  normalizePhilippinePhone,
} from "../utils/validation";
import { clearSessionCookie, setSessionCookie } from "../utils/sessionCookie";
import { getDefaultTrialDays } from "../models/platformSetting.model";

export async function registrationConfig(_req: Request, res: Response) {
  try {
    const defaultTrialDays = await getDefaultTrialDays();
    return sendSuccess(res, 200, "Registration configuration loaded.", {
      default_trial_days: defaultTrialDays,
    });
  } catch (error) {
    return sendError(res, 500, "Unable to load registration configuration.", error);
  }
}

export async function registerBusiness(req: Request, res: Response) {
  try {
    const googleIdToken = String(req.body.google_id_token || "").trim();
    const googleIdentity = googleIdToken
      ? await verifyGoogleRegistrationToken(googleIdToken)
      : null;
    const firebase_uid = googleIdentity?.firebase_uid || null;
    const owner_name =
      String(req.body.owner_name || "").trim() || googleIdentity?.name || "";
    const phone = normalizePhilippinePhone(req.body.phone);
    const email = googleIdentity?.email || `${phone.slice(1)}@phone.tindatrack.local`;
    const password = req.body.password ? String(req.body.password) : null;
    const business_name = String(req.body.business_name || "").trim();
    const business_type = String(req.body.business_type || "").trim() || null;
    const address = String(req.body.address || "").trim() || null;
    const logo_url = String(req.body.logo_url || "").trim() || null;
    const selected_plan = String(req.body.selected_plan || "free_trial").trim();
    const otp_code = String(req.body.otp_code || "").replace(/\D/g, "");

    if (!owner_name || !phone || !business_name || !otp_code) {
      return sendError(res, 400, "Please complete all required fields.");
    }

    if (!isValidEmail(email)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    if (
      !isWithinLength(owner_name, 100) ||
      !isWithinLength(business_name, INPUT_LIMITS.businessName) ||
      !isWithinLength(business_type || "", INPUT_LIMITS.businessType) ||
      !isWithinLength(phone || "", INPUT_LIMITS.phone) ||
      !isWithinLength(address || "", INPUT_LIMITS.address) ||
      !isWithinLength(firebase_uid || "", 128)
    ) {
      return sendError(res, 400, "One or more account fields are too long.");
    }

    if (!isValidStoreLogo(logo_url || "")) {
      return sendError(res, 400, "Store logo must be a PNG, JPG, or WebP image under 500 KB.");
    }

    if (!/^(free_trial|starter|business|premium)$/.test(selected_plan)) {
      return sendError(res, 400, "Please select a supported subscription plan.");
    }

    if (!firebase_uid && !password) {
      return sendError(
        res,
        400,
        "Please create a password or continue with Google."
      );
    }

    if (password && !isValidPassword(password)) {
      return sendError(
        res,
        400,
        "Password must be at least 8 characters and no more than 72 bytes."
      );
    }

    if (!/^\d{6}$/.test(otp_code) || !(await verifyRegistrationOtp(phone, otp_code))) {
      return sendError(res, 400, "The SMS verification code is invalid or has expired.");
    }

    const result = await registerBusinessService({
      firebase_uid,
      owner_name,
      email,
      password,
      business_name,
      business_type,
      phone,
      address,
      logo_url,
      selected_plan: "free_trial",
    });

    setSessionCookie(res, result.token);
    const { token: _token, ...session } = result;

    return sendSuccess(
      res,
      201,
      "Business account created successfully. You can now log in.",
      session
    );
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(
        res,
        409,
        "This mobile number or Google account is already registered. Please log in instead."
      );
    }

    return sendError(
      res,
      500,
      "We could not create your account right now. Please try again."
    );
  }
}

export async function requestRegistrationOtp(req: Request, res: Response) {
  try {
    const phone = normalizePhilippinePhone(req.body.phone);
    if (!phone) {
      return sendError(res, 400, "Enter a valid Philippine mobile number.");
    }

    if (await findUserByPhone(phone)) {
      return sendError(res, 409, "This mobile number is already registered. Please log in instead.");
    }

    const result = await sendRegistrationOtp(phone);
    return sendSuccess(res, 200, "We sent a 6-digit verification code to your mobile number.", {
      phone,
      ...(result.developmentCode
        ? { development_code: result.developmentCode }
        : {}),
    });
  } catch (error) {
    return sendError(res, 502, "We could not send the SMS code. Please try again.", error);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const rawIdentifier = String(req.body.identifier || req.body.email || "").trim();
    const identifier = rawIdentifier.includes("@")
      ? normalizeEmail(rawIdentifier)
      : normalizePhilippinePhone(rawIdentifier);
    const password = String(req.body.password || "");

    if (!identifier || !password) {
      return sendError(res, 400, "Please enter your email or mobile number and password.");
    }

    if (
      (rawIdentifier.includes("@") && !isValidEmail(identifier)) ||
      Buffer.byteLength(password, "utf8") > INPUT_LIMITS.passwordBytes
    ) {
      return sendError(res, 401, "Invalid login details. Please check your credentials.");
    }

    const result = await loginService({ identifier, password });
    setSessionCookie(res, result.token);
    const { token: _token, ...session } = result;

    return sendSuccess(res, 200, "Login successful. Welcome back!", session);
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return sendError(
        res,
        401,
        "Invalid email, mobile number, or password. Please check your details."
      );
    }

    if (error.message === "PASSWORD_NOT_SET") {
      return sendError(
        res,
        401,
        "This account uses Google login. Please continue with Google."
      );
    }

    if (error.message === "ACCOUNT_INACTIVE") {
      return sendError(res, 403, "This account is not active.");
    }

    if (error.message === "NO_WORKSPACE_ACCESS") {
      return sendError(res, 403, "This account is not assigned to a store workspace.");
    }

    return sendError(res, 500, "Login failed. Please try again later.");
  }
}

export async function currentSession(req: Request, res: Response) {
  try {
    if (!req.user?.user_id) return sendError(res, 401, "Authentication is required.");
    const session = await getSessionService(req.user.user_id);
    return sendSuccess(res, 200, "Session loaded.", session);
  } catch {
    return sendError(res, 403, "This account is not assigned to a store workspace.");
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const idToken = String(req.body.idToken || "");

    if (!idToken) {
      return sendError(res, 400, "Google login token is missing.");
    }

    if (idToken.length > 20_000) {
      return sendError(res, 400, "Google login token is invalid.");
    }

    const result = await googleLoginService(idToken);
    setSessionCookie(res, result.token);
    const { token: _token, ...session } = result;

    return sendSuccess(
      res,
      200,
      "Google login successful. Welcome back!",
      session
    );
  } catch (error: any) {
    if (error.message === "GOOGLE_ACCOUNT_NOT_REGISTERED") {
      return sendError(
        res,
        404,
        "No business account found for this Google email. Please register your business first."
      );
    }

    if (error.message === "GOOGLE_EMAIL_NOT_FOUND") {
      return sendError(res, 400, "Google email was not found.");
    }

    if (error.message === "ACCOUNT_INACTIVE") {
      return sendError(res, 403, "This account is not active.");
    }

    if (error.message === "NO_WORKSPACE_ACCESS") {
      return sendError(res, 403, "This account is not assigned to a store workspace.");
    }

    return sendError(res, 500, "Google login failed. Please try again.");
  }
}

export function logout(_req: Request, res: Response) {
  clearSessionCookie(res);
  return sendSuccess(res, 200, "You have been logged out.");
}
