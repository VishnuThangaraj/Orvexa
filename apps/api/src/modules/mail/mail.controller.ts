import type { NextFunction, Request, Response } from "express";
import AppError from "../../common/errors/AppError.js";
import { sendResponse } from "../../common/utils/response.js";
import MailService from "./mail.service.js";

class MailController {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();
  }

  // Send mail endpoint handler
  sendMail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const senderId = BigInt(userId);
      const {
        to,
        cc,
        bcc,
        subject,
        body,
        parentMessageId,
        attachmentIds,
        attachments,
        draftId,
      } = req.body;

      const result = await this.mailService.sendMail({
        senderId,
        to: Array.isArray(to) ? to : [to],
        cc: Array.isArray(cc) ? cc : cc ? [cc] : [],
        bcc: Array.isArray(bcc) ? bcc : bcc ? [bcc] : [],
        subject: subject ?? "",
        body: body ?? "",
        parentMessageId: parentMessageId ? BigInt(parentMessageId) : null,
        attachmentIds: attachmentIds?.map((id: string | number) => BigInt(id)),
        attachments,
        draftId: draftId ? BigInt(draftId) : null,
      });

      return sendResponse(res, 201, "Email sent successfully", result);
    } catch (error) {
      next(error);
    }
  };

  // Upload attachment(s) endpoint handler
  uploadAttachments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const files =
        (req.files as Express.Multer.File[]) ||
        (req.file ? [req.file] : []);

      if (!files.length) {
        throw new AppError(
          "No files provided for upload. Attach a file using form-data.",
          400,
        );
      }

      const result = await this.mailService.uploadAttachments(
        BigInt(userId),
        files,
      );

      return sendResponse(res, 201, "Attachment uploaded successfully", result);
    } catch (error) {
      next(error);
    }
  };

  // Delete attachment endpoint handler
  deleteAttachment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const idParam = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      if (!idParam) {
        throw new AppError("Invalid attachment ID", 400);
      }
      const assetId = BigInt(idParam);
      await this.mailService.deleteAttachment(BigInt(userId), assetId);

      return sendResponse(res, 200, "Attachment removed successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default MailController;
