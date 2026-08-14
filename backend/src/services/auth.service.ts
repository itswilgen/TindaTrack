import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import db from "../config/db";
import { createUser, findUserByEmail, findUserById, findUserByIdentifier } from "../models/user.model";
import { createBusiness, findPrimaryBusinessByUserId } from "../models/business.model";
import { createBusinessUser, findBusinessUserRole } from "../models/businessUser.model";
import { firebaseAuth } from "../config/firebase";
import { getDefaultTrialDays } from "../models/platformSetting.model";
import {
  LoginInput,
  RegisterBusinessInput,
  RegisteredBusinessResult,
} from "../types/auth.types";

function createJwtToken(payload: {
  user_id: number;
  email: string;
  role: string;
  name?: string;
  firebase_uid?: string;
}) {
  const jwtOptions: SignOptions = {
    algorithm: "HS256",
    audience: env.jwt.audience,
    expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
    issuer: env.jwt.issuer,
  };

  return jwt.sign(payload, env.jwt.secret, jwtOptions);
}

export async function registerBusinessService(
  data: RegisterBusinessInput
): Promise<RegisteredBusinessResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
    const trialDays = await getDefaultTrialDays(connection);

    const userId = await createUser(connection, {
      firebase_uid: data.firebase_uid || null,
      name: data.owner_name,
      email: data.email,
      phone: data.phone,
      password_hash: passwordHash,
    });

    const businessId = await createBusiness(connection, {
      business_name: data.business_name,
      business_type: data.business_type || null,
      owner_user_id: userId,
      phone: data.phone || null,
      address: data.address || null,
      logo_url: data.logo_url || null,
      selected_plan: data.selected_plan || "free_trial",
      trial_days: trialDays,
    });

    await createBusinessUser(connection, {
      business_id: businessId,
      user_id: userId,
      role: "owner",
    });

    await connection.commit();

    const token = createJwtToken({
      user_id: userId,
      email: data.email,
      role: "owner",
      name: data.owner_name,
      firebase_uid: data.firebase_uid || undefined,
    });

    const createdBusiness = await findPrimaryBusinessByUserId(userId);

    return {
      token,
      user: {
        id: userId,
        name: data.owner_name,
        email: data.email,
        phone: data.phone,
        role: "owner",
      },
      business: {
        id: businessId,
        business_name: data.business_name,
        status: "trial",
        logo_url: data.logo_url || null,
        selected_plan: data.selected_plan || "free_trial",
        trial_ends_at: createdBusiness?.trial_ends_at || null,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function verifyGoogleRegistrationToken(idToken: string) {
  const decodedToken = await firebaseAuth.verifyIdToken(idToken);
  if (!decodedToken.email) throw new Error("GOOGLE_EMAIL_NOT_FOUND");

  return {
    firebase_uid: decodedToken.uid,
    email: decodedToken.email.toLowerCase(),
    name:
      decodedToken.name || decodedToken.email.split("@")[0] || "Business Owner",
  };
}

export async function loginService(data: LoginInput) {
  const user = await findUserByIdentifier(data.identifier);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (user.status !== "active") {
    throw new Error("ACCOUNT_INACTIVE");
  }

  if (!user.password_hash) {
    throw new Error("PASSWORD_NOT_SET");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (user.global_role === "super_admin") {
    const token = createJwtToken({
      user_id: user.id,
      email: user.email,
      role: "super_admin",
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "super_admin",
      },
      business: null,
    };
  }

  const business = await findPrimaryBusinessByUserId(user.id);
  const businessRole = business
    ? await findBusinessUserRole(business.id, user.id)
    : null;

  if (!business || !businessRole) {
    throw new Error("NO_WORKSPACE_ACCESS");
  }

  const effectiveRole = businessRole.role;

  const token = createJwtToken({
    user_id: user.id,
    email: user.email,
    role: effectiveRole,
    name: user.name,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: effectiveRole,
    },
    business: business
      ? {
          id: business.id,
          business_name: business.business_name,
          status: business.status,
          logo_url: business.logo_url,
          selected_plan: business.selected_plan,
          trial_ends_at: business.trial_ends_at,
        }
      : null,
  };
}

export async function googleLoginService(idToken: string) {
  const decodedToken = await firebaseAuth.verifyIdToken(idToken);

  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email;
  const name =
    decodedToken.name || decodedToken.email?.split("@")[0] || "Google User";

  if (!email) {
    throw new Error("GOOGLE_EMAIL_NOT_FOUND");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("GOOGLE_ACCOUNT_NOT_REGISTERED");
  }

  if (user.status !== "active") {
    throw new Error("ACCOUNT_INACTIVE");
  }

  if (user.global_role === "super_admin") {
    const token = createJwtToken({
      user_id: user.id,
      email: user.email,
      role: "super_admin",
      name: user.name || name,
      firebase_uid: firebaseUid,
    });
    return {
      token,
      user: {
        id: user.id,
        name: user.name || name,
        email: user.email,
        phone: user.phone,
        role: "super_admin",
      },
      business: null,
    };
  }

  const business = await findPrimaryBusinessByUserId(user.id);
  const businessRole = business
    ? await findBusinessUserRole(business.id, user.id)
    : null;

  if (!business || !businessRole) {
    throw new Error("NO_WORKSPACE_ACCESS");
  }

  const effectiveRole = businessRole.role;
  const token = createJwtToken({
    user_id: user.id,
    email: user.email,
    role: effectiveRole,
    name: user.name || name,
    firebase_uid: firebaseUid,
  });
  return {
    token,
    user: {
      id: user.id,
      name: user.name || name,
      email: user.email,
      phone: user.phone,
      role: effectiveRole,
    },
    business: business
      ? {
          id: business.id,
          business_name: business.business_name,
          status: business.status,
          logo_url: business.logo_url,
          selected_plan: business.selected_plan,
          trial_ends_at: business.trial_ends_at,
        }
      : null,
  };
}

export async function getSessionService(userId: number) {
  const platformUser = await findUserById(userId);
  if (!platformUser) throw new Error("NO_WORKSPACE_ACCESS");
  if (platformUser.global_role === "super_admin") {
    return {
      user: {
        id: platformUser.id,
        name: platformUser.name,
        email: platformUser.email,
        phone: platformUser.phone,
        role: "super_admin",
      },
      business: null,
    };
  }

  const business = await findPrimaryBusinessByUserId(userId);
  const businessRole = business
    ? await findBusinessUserRole(business.id, userId)
    : null;

  if (!business || !businessRole) throw new Error("NO_WORKSPACE_ACCESS");

  const [rows] = await db.query<any[]>(
    "SELECT id, name, email, phone FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  const user = rows[0];
  if (!user) throw new Error("NO_WORKSPACE_ACCESS");

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: businessRole.role,
    },
    business: {
      id: business.id,
      business_name: business.business_name,
      status: business.status,
      logo_url: business.logo_url,
      selected_plan: business.selected_plan,
      trial_ends_at: business.trial_ends_at,
    },
  };
}
