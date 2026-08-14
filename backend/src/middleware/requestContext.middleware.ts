import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

export function attachRequestContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  return next();
}
