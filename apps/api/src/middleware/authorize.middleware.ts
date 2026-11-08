import type { Request, Response, NextFunction } from "express";

import AppError from "../common/errors/AppError.js";
import type { Role } from "../common/types/roles.js";

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }

    next();
  };
}

export default authorize;
