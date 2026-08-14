import { Request } from "express";

export type AuthUser = {
  user_id: number;
  email: string;
  role: string;
  name?: string;
  firebase_uid?: string;
};

export type AuthenticatedStore = {
  id: number;
  name: string;
  status: "trial" | "active" | "expired" | "suspended";
  trial_ends_at: Date | string | null;
};

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export type RawBodyRequest = Request & {
  rawBody?: Buffer;
};
