import type { Request, Response, NextFunction } from "express";

import AuthService from "./auth.service.js";
import { loginSchema, refreshTokenSchema } from "./auth.validation.js";
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
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError(
          parseResult.error.issues[0]?.message || "Validation Error",
          400,
        );
      }

      const result = await this.authService.userLogin(parseResult.data);
      return sendResponse(res, 200, "Login Successful", result);
    } catch (error) {
      next(error);
    }
  };

  // refresh token
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = refreshTokenSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError(
          parseResult.error.issues[0]?.message || "Validation Error",
          400,
        );
      }

      const result = await this.authService.refreshToken(parseResult.data);
      return sendResponse(res, 200, "Token Refreshed Successfully", result);
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
}

export default AuthController;
