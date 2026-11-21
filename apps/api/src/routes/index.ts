import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import mailRoutes from "../modules/mail/mail.routes.js";
import chatRoutes from "../modules/chat/chat.routes.js";
import calendarRoutes from "../modules/calendar/calendar.routes.js";
import meetRoutes from "../modules/meet/meet.routes.js";
import driveRoutes from "../modules/drive/drive.routes.js";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/mail", mailRoutes);
router.use("/chat", chatRoutes);
router.use("/calendar", calendarRoutes);
router.use("/meet", meetRoutes);
router.use("/drive", driveRoutes);

export default router;
