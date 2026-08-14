import { Response } from "express";

type ApiResponse<T> = {
  status: "success" | "error";
  message: string;
  data?: T;
  request_id?: string;
};

function attachRequestId<T>(res: Response, payload: ApiResponse<T>) {
  const requestId = res.getHeader("X-Request-ID");
  if (typeof requestId === "string") payload.request_id = requestId;
  return payload;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
) {
  const payload: ApiResponse<T> = {
    status: "success",
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(attachRequestId(res, payload));
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  debug?: unknown
) {
  const payload: ApiResponse<never> = {
    status: "error",
    message,
  };

  if (debug !== undefined) {
    const details =
      debug instanceof Error
        ? {
            name: debug.name,
            message: debug.message,
            code: "code" in debug ? String(debug.code) : undefined,
          }
        : { message: "A non-Error value was raised." };
    console.error(JSON.stringify({
      level: "error",
      request_id: String(res.getHeader("X-Request-ID") || "unknown"),
      ...details,
    }));
  }

  return res.status(statusCode).json(attachRequestId(res, payload));
}
