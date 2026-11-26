import type { Request, Response, NextFunction } from "express";
import AppError from "../common/errors/AppError.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  const errWithCode = err as Error & { code?: unknown; meta?: unknown };
  console.error("[API ERROR]", {
    method: req.method,
    path: req.originalUrl,
    code: errWithCode.code,
    meta: errWithCode.meta,
    message: err.message,
  });
  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}
