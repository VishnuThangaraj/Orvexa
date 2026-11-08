import { Router } from "express";
import AuthController from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authRateLimiter } from "../../middleware/rateLimiter.middleware.js";
import {
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  sessionIdParamSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.validation.js";

const router: Router = Router();
const authController = new AuthController();

// Rate limit all auth endpoints against IP-level spraying and abuse
router.use(authRateLimiter);

// Bridge HttpOnly cookie to body for refresh and logout if not explicitly passed in body
const attachCookieToken = (req: any, _res: any, next: any) => {
  if (!req.body?.refreshToken && req.cookies?.refreshToken) {
    req.body = { ...req.body, refreshToken: req.cookies.refreshToken };
  }
  next();
};

// user login
router.post("/", validate(loginSchema), authController.userLogin);

// refresh token
router.post(
  "/refresh",
  attachCookieToken,
  validate(refreshTokenSchema),
  authController.refreshToken,
);

// user logout
router.post(
  "/logout",
  attachCookieToken,
  validate(logoutSchema),
  authController.logout,
);

// forgot password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

// reset password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// change password (authenticated)
router.post(
  "/change-password",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  validate(changePasswordSchema),
  authController.changePassword,
);

// user profile
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  authController.userProfile,
);

// active sessions
router.get(
  "/sessions",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  authController.getActiveSessions,
);

// revoke specific session
router.delete(
  "/sessions/:id",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  validate(sessionIdParamSchema, "params"),
  authController.revokeSession,
);

// revoke all sessions (logout all devices)
router.delete(
  "/sessions",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  authController.revokeAllSessions,
);

export default router;
