import type { Request, Response, NextFunction } from "express";
import AppError from "../common/errors/AppError.js";
import { verifyToken } from "../common/utils/jwt.js";
import prisma from "../infrastructure/database/prisma.js";

export const authenticate = async (
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

    // Invalidate access token if issued before the password was last changed
    if (decoded.iat && decoded.id) {
      try {
        const credentials = await prisma.credentials.findUnique({
          where: { userId: BigInt(decoded.id) },
          select: { passwordChangedAt: true },
        });

        if (credentials?.passwordChangedAt) {
          const passwordChangedSeconds = Math.floor(
            credentials.passwordChangedAt.getTime() / 1000,
          );
          if (decoded.iat < passwordChangedSeconds) {
            throw new AppError(
              "Token expired due to password change. Please log in again.",
              401,
            );
          }
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
      }
    }

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
