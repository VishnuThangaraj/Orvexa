import type { ExtendedError } from "socket.io";
import { verifyToken, type JwtPayload } from "../common/utils/jwt.js";
import prisma from "../infrastructure/database/prisma.js";
import type { AuthenticatedSocket } from "./socket.types.js";

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void,
) => {
  try {
    const authHeader = socket.handshake.headers?.authorization;
    let token: string | undefined = socket.handshake.auth?.token;

    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return next(new Error("Authentication required"));
    }

    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch {
      return next(new Error("Invalid or Expired Token"));
    }

    if (!decoded || !decoded.id) {
      return next(new Error("Invalid or Expired Token"));
    }

    const userId = BigInt(decoded.id);

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        role: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new Error("User account is inactive or not found"));
    }

    // Check if token was issued prior to a password change
    if (decoded.iat) {
      const credentials = await prisma.credentials.findUnique({
        where: { userId },
        select: { passwordChangedAt: true },
      });

      if (credentials?.passwordChangedAt) {
        const passwordChangedSeconds = Math.floor(
          credentials.passwordChangedAt.getTime() / 1000,
        );
        if (decoded.iat < passwordChangedSeconds) {
          return next(
            new Error(
              "Token expired due to password change. Please log in again.",
            ),
          );
        }
      }
    }

    // Attach verified user to socket.data
    socket.data.user = {
      id: String(user.id),
      role: user.role,
    };

    next();
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Authentication failed");
    next(error);
  }
};
