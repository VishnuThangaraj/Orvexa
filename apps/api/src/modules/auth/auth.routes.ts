import { Router } from "express";
import AuthController from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  sessionIdParamSchema,
} from "./auth.validation.js";

const router: Router = Router();
const authController = new AuthController();

// user login
router.post("/", validate(loginSchema), authController.userLogin);

// refresh token
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);

// user logout
router.post("/logout", validate(logoutSchema), authController.logout);

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
