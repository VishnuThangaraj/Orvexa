import { Router } from "express";
import AuthController from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router: Router = Router();
const authController = new AuthController();

// user login
router.post("/", authController.userLogin);

// refresh token
router.post("/refresh", authController.refreshToken);

// user profile
router.get("/", authenticate, authController.userProfile);

export default router;
