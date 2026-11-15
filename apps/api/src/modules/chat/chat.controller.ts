import type { NextFunction, Request, Response } from "express";
import AppError from "../../common/errors/AppError.js";
import { sendResponse } from "../../common/utils/response.js";
import presenceService from "../../sockets/presence.service.js";
import ChatService from "./chat.service.js";

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  createDirectConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const { recipientId } = req.body;
      const conversation = await this.chatService.getOrCreateDirectConversation(
        BigInt(userId),
        BigInt(recipientId),
      );

      return sendResponse(
        res,
        201,
        "Direct conversation resolved successfully",
        conversation,
      );
    } catch (error) {
      next(error);
    }
  };

  createGroupOrChannel = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversation = await this.chatService.createGroupOrChannel(
        BigInt(userId),
        req.body,
      );

      return sendResponse(
        res,
        201,
        `${req.body.type === "CHANNEL" ? "Channel" : "Group"} created successfully`,
        conversation,
      );
    } catch (error) {
      next(error);
    }
  };

  getUserConversations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const result = await this.chatService.getUserConversations(
        BigInt(userId),
        req.query,
      );

      return sendResponse(
        res,
        200,
        "Conversations fetched successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  getConversationDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const conversation = await this.chatService.getConversationDetails(
        conversationId,
        BigInt(userId),
      );

      return sendResponse(
        res,
        200,
        "Conversation details fetched successfully",
        conversation,
      );
    } catch (error) {
      next(error);
    }
  };

  updateConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const updated = await this.chatService.updateConversation(
        conversationId,
        BigInt(userId),
        req.body,
      );

      return sendResponse(
        res,
        200,
        "Conversation updated successfully",
        updated,
      );
    } catch (error) {
      next(error);
    }
  };

  addParticipants = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const participants = await this.chatService.addParticipants(
        conversationId,
        BigInt(userId),
        req.body.userIds,
      );

      return sendResponse(
        res,
        200,
        "Participants added successfully",
        participants,
      );
    } catch (error) {
      next(error);
    }
  };

  removeParticipant = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const targetUserId = BigInt(getParam(req.params.userId));

      await this.chatService.removeParticipant(
        conversationId,
        BigInt(userId),
        targetUserId,
      );

      return sendResponse(
        res,
        200,
        "Participant removed successfully",
      );
    } catch (error) {
      next(error);
    }
  };

  updateParticipantRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const targetUserId = BigInt(getParam(req.params.userId));

      const updated = await this.chatService.updateParticipantRole(
        conversationId,
        BigInt(userId),
        targetUserId,
        req.body.memberRole,
      );

      return sendResponse(
        res,
        200,
        "Participant role updated successfully",
        updated,
      );
    } catch (error) {
      next(error);
    }
  };

  updateParticipantSettings = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const updated = await this.chatService.updateParticipantSettings(
        conversationId,
        BigInt(userId),
        req.body,
      );

      return sendResponse(
        res,
        200,
        "Participant settings updated successfully",
        updated,
      );
    } catch (error) {
      next(error);
    }
  };

  // Messaging Controller Handlers
  sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const message = await this.chatService.sendMessage(BigInt(userId), {
        conversationId,
        ...req.body,
      });

      return sendResponse(res, 201, "Message sent successfully", message);
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const messages = await this.chatService.getMessages(
        conversationId,
        BigInt(userId),
        req.query,
      );

      return sendResponse(res, 200, "Messages fetched successfully", messages);
    } catch (error) {
      next(error);
    }
  };

  editMessage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const messageId = BigInt(getParam(req.params.messageId));

      const updated = await this.chatService.editMessage(
        conversationId,
        messageId,
        BigInt(userId),
        req.body.content,
      );

      return sendResponse(res, 200, "Message edited successfully", updated);
    } catch (error) {
      next(error);
    }
  };

  deleteMessage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const messageId = BigInt(getParam(req.params.messageId));

      const deleted = await this.chatService.deleteMessage(
        conversationId,
        messageId,
        BigInt(userId),
      );

      return sendResponse(res, 200, "Message deleted successfully", deleted);
    } catch (error) {
      next(error);
    }
  };

  // Real-Time Interactions (Read Receipts, Reactions, Pinned Messages)
  markMessageAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const messageId = BigInt(req.body.messageId);

      const result = await this.chatService.markMessageAsRead(
        conversationId,
        BigInt(userId),
        messageId,
      );

      return sendResponse(
        res,
        200,
        "Conversation marked as read successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  toggleReaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const messageId = BigInt(getParam(req.params.messageId));

      const reactions = await this.chatService.toggleReaction(
        conversationId,
        messageId,
        BigInt(userId),
        req.body.emoji,
      );

      return sendResponse(
        res,
        200,
        "Reaction toggled successfully",
        reactions,
      );
    } catch (error) {
      next(error);
    }
  };

  togglePinMessage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const messageId = BigInt(getParam(req.params.messageId));

      const result = await this.chatService.togglePinMessage(
        conversationId,
        messageId,
        BigInt(userId),
      );

      return sendResponse(
        res,
        200,
        result.isPinned ? "Message pinned" : "Message unpinned",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  getPinnedMessages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const conversationId = BigInt(getParam(req.params.id));
      const pins = await this.chatService.getPinnedMessages(
        conversationId,
        BigInt(userId),
      );

      return sendResponse(
        res,
        200,
        "Pinned messages retrieved successfully",
        pins,
      );
    } catch (error) {
      next(error);
    }
  };

  getOnlinePresence = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const onlineUserIds = presenceService.getOnlineUserIds();
      return sendResponse(
        res,
        200,
        "Online presence retrieved successfully",
        { onlineUserIds },
      );
    } catch (error) {
      next(error);
    }
  };

  uploadAttachments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const files =
        (req.files as Express.Multer.File[]) ||
        (req.file ? [req.file] : []);

      if (!files || files.length === 0) {
        throw new AppError(
          "No files provided for upload. Attach a file using form-data.",
          400,
        );
      }

      const result = await this.chatService.uploadAttachments(
        BigInt(userId),
        files,
      );

      return sendResponse(
        res,
        201,
        "Attachment uploaded successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  deleteAttachment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const attachmentId = BigInt(getParam(req.params.id));
      const result = await this.chatService.deleteAttachment(
        attachmentId,
        BigInt(userId),
      );

      return sendResponse(
        res,
        200,
        "Attachment deleted successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      const query = typeof req.query.q === "string" ? req.query.q : undefined;
      const users = await this.chatService.searchUsers(
        query,
        userId ? BigInt(userId) : undefined,
      );

      return sendResponse(
        res,
        200,
        "Users retrieved successfully",
        users,
      );
    } catch (error) {
      next(error);
    }
  };
}

export default ChatController;
