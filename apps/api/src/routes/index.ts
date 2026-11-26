import { Router } from "express";
import env from "../config/env.js";

import authRoutes from "../modules/auth/auth.routes.js";
import profileRoutes from "../modules/profile/profile.routes.js";
import mailRoutes from "../modules/mail/mail.routes.js";
import chatRoutes from "../modules/chat/chat.routes.js";
import calendarRoutes from "../modules/calendar/calendar.routes.js";
import meetRoutes from "../modules/meet/meet.routes.js";
import driveRoutes from "../modules/drive/drive.routes.js";
import homeRoutes from "../modules/home/home.routes.js";

const router: Router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: `Orvexa - Server Running Version : ${env.PROJECT_VERSION}`,
  });
});

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    version: env.PROJECT_VERSION,
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/home", homeRoutes);
router.use("/mail", mailRoutes);
router.use("/chat", chatRoutes);
router.use("/calendar", calendarRoutes);
router.use("/meet", meetRoutes);
router.use("/drive", driveRoutes);

export default router;
