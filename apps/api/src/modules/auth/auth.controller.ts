import type { Request, Response, NextFunction } from "express";

import AuthService from "./auth.service.js";
import AppError from "../../common/errors/AppError.js";
import { sendResponse } from "../../common/utils/response.js";

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // user login
  userLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, deviceName } = req.body;

      const ipAddress =
        ((req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          req.ip ||
          null) ?? null;
      const userAgent = (req.headers["user-agent"] as string) || null;

      const result = await this.authService.userLogin({
        email,
        password,
        ipAddress,
        userAgent,
        deviceName: deviceName || null,
      });

      return sendResponse(res, 200, "Login Successful", result);
    } catch (error) {
      next(error);
    }
  };

  // refresh token
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken({ refreshToken });
      return sendResponse(res, 200, "Token Refreshed Successfully", result);
    } catch (error) {
      next(error);
    }
  };

  // logout current session
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      await this.authService.logout(refreshToken);
      return sendResponse(res, 200, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  };

  // get all active sessions for authenticated user
  getActiveSessions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const currentRefreshToken =
        (req.headers["x-refresh-token"] as string) || undefined;

      const sessions = await this.authService.getActiveSessions(
        BigInt(req.user.id),
        currentRefreshToken,
      );

      return sendResponse(
        res,
        200,
        "Active sessions retrieved successfully",
        sessions,
      );
    } catch (error) {
      next(error);
    }
  };

  // revoke specific session
  revokeSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const sessionId = BigInt(req.params.id as string);
      await this.authService.revokeSession(BigInt(req.user.id), sessionId);

      return sendResponse(res, 200, "Session revoked successfully");
    } catch (error) {
      next(error);
    }
  };

  // revoke all sessions (logout all devices)
  revokeAllSessions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      await this.authService.revokeAllSessions(BigInt(req.user.id));
      return sendResponse(res, 200, "All sessions revoked successfully");
    } catch (error) {
      next(error);
    }
  };

  // user profile
  userProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const result = await this.authService.userProfile(BigInt(req.user.id));
      return sendResponse(res, 200, "Profile Retrieved Successfully", result);
    } catch (error) {
      next(error);
    }
  };

  // forgot password
  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword({ email });
      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  // reset password
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.authService.resetPassword({
        token,
        newPassword,
      });
      return sendResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  };

  // change password (authenticated)
  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const { currentPassword, newPassword } = req.body;
      const result = await this.authService.changePassword(
        BigInt(req.user.id),
        { currentPassword, newPassword },
      );
      return sendResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
