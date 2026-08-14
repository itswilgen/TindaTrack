import { AuthenticatedStore, AuthUser } from "./request.types";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      requestId?: string;
      user?: AuthUser;
      store?: AuthenticatedStore;
    }
  }
}

export {};
