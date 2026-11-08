import type { Request, Response, NextFunction } from "express";
import AppError from "../common/errors/AppError.js";

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  skipInTest?: boolean;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    message = "Too many requests from this IP, please try again later.",
    statusCode = 429,
    skipInTest = false,
  } = options;

  const hits = new Map<string, number[]>();

  // Cleanup expired timestamps periodically (every 5 minutes)
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, valid);
      }
    }
  }, 5 * 60 * 1000);

  if (typeof cleanupTimer.unref === "function") {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    if (skipInTest && process.env.NODE_ENV === "test") {
      return next();
    }

    const ip =
      ((req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        req.ip ||
        "unknown-ip") ?? "unknown-ip";

    const now = Date.now();
    const timestamps = hits.get(ip) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= max) {
      const resetTime = validTimestamps[0] + windowMs;
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);

      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));

      return next(new AppError(message, statusCode));
    }

    validTimestamps.push(now);
    hits.set(ip, validTimestamps);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(max - validTimestamps.length));

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: "Too many authentication attempts from this IP, please try again later.",
  skipInTest: false,
});

export default authRateLimiter;
