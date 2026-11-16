import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import mailRoutes from "../modules/mail/mail.routes.js";
import chatRoutes from "../modules/chat/chat.routes.js";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/mail", mailRoutes);
router.use("/chat", chatRoutes);

export default router;
