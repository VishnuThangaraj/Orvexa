import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import AppError from "../common/errors/AppError.js";

export type ValidationSource = "body" | "params" | "query";

export function validate(
  schema: ZodType,
  source: ValidationSource = "body",
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message || "Validation Error";
      return next(new AppError(message, 400));
    }

    try {
      Object.defineProperty(req, source, {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } catch {
      req[source] = result.data;
    }

    next();
  };
}

export default validate;
