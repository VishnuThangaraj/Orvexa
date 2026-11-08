import type { Request, Response, NextFunction } from "express";
import AppError from "../common/errors/AppError.js";
import { verifyToken } from "../common/utils/jwt.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const decoded = verifyToken(token);
    req.user = {
      id: String(decoded.id),
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError("Invalid or Expired Token", 401));
  }
};

export default authenticate;
