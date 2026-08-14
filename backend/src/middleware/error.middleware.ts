import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
};

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, 404, `Route ${req.method} ${req.path} was not found.`);
}

export function errorHandler(
  error: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) return;

  const isMalformedJson =
    error instanceof SyntaxError && error.type === "entity.parse.failed";
  const status = isMalformedJson
    ? 400
    : Number(error.status || error.statusCode || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  const message = isMalformedJson
    ? "Request body contains invalid JSON."
    : safeStatus === 403
      ? error.message
      : safeStatus < 500
        ? error.message
        : "Unexpected server error. Please try again later.";

  console.error(
    JSON.stringify({
      level: "error",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: safeStatus,
      error: error.message,
    })
  );

  return sendError(res, safeStatus, message);
}
