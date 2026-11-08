import type { Request, Response, NextFunction } from "express";

import AuthService from "./auth.service.js";
import { loginSchema } from "./auth.validation.js";
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
}

export default AuthController;
