import { Router } from "express";
import MailController from "./mail.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  attachmentIdParamSchema,
  fetchInboxQuerySchema,
  sendMailSchema,
} from "./mail.validation.js";
import { mailAttachmentUpload } from "../../middleware/upload.middleware.js";

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

// upload mail attachment(s)
router.post(
  "/attachments",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  mailAttachmentUpload,
  mailController.uploadAttachments,
);

// alias for upload
router.post(
  "/upload",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  mailAttachmentUpload,
  mailController.uploadAttachments,
);

// delete attachment before sending
router.delete(
  "/attachments/:id",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  validate(attachmentIdParamSchema, "params"),
  mailController.deleteAttachment,
);

// get inbox mail
router.get(
  "/inbox",
  authenticate,
  authorize("ADMIN", "MEMBER"),
  validate(fetchInboxQuerySchema, "query"),
  mailController.fetchInbox,
);

export default router;
