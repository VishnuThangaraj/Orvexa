import type { Request, Response, NextFunction } from "express";
import prisma from "../infrastructure/database/prisma.js";

const SENSITIVE_FIELDS = new Set([
  "password",
  "confirmpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
]);

const sanitize = (data: unknown): unknown => {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = SENSITIVE_FIELDS.has(key.toLowerCase())
      ? "********"
      : sanitize(value);
  }

  return result;
};

const toBigIntSafe = (val: unknown): bigint | null => {
  if (val === null || val === undefined || val === "") return null;
  try {
    return BigInt(val as string | number | bigint);
  } catch {
    return null;
  }
};

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  res.on("finish", async () => {
    try {
      // Ignore unnecessary routes
      if (req.originalUrl === "/health") return;

      // Get authenticated user ID if present
      const reqUser = (req as Request & { user?: { id?: unknown; userId?: unknown } }).user;
      const userId = toBigIntSafe(reqUser?.id ?? reqUser?.userId);
      const entityId = toBigIntSafe(req.params?.id);

      await prisma.auditLog.create({
        data: {
          userId,
          action: req.method,
          entityType: req.baseUrl || "UNKNOWN",
          entityId,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
          details: {
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            requestBody: sanitize(req.body),
            query: sanitize(req.query),
          } as any,
        },
      });
    } catch (error) {
      console.error("Audit logging failed:", error);
    }
  });

  next();
};

export default logger;
