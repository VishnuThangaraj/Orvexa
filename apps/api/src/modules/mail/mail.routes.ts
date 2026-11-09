import { Router } from "express";
import MailController from "./mail.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { sendMailSchema } from "./mail.validation.js";

const router: Router = Router();
const mailController = new MailController();

// send mail with recipient, thread, and attachment support
router.post(
  "/send",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  validate(sendMailSchema),
  mailController.sendMail,
);

export default router;
