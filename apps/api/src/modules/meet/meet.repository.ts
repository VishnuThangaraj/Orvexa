import { prisma } from "../../config/prisma.js";
import type {
  CreateMeetingRepoData,
  UpdateMeetingRepoData,
  MeetingRole,
  InvitationStatus,
} from "./meet.types.js";

export class MeetRepository {
  // Meetings CRUD
  async createMeeting(data: CreateMeetingRepoData) {
    return prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        hostId: data.hostId,
        meetingCode: data.meetingCode,
        roomName: data.roomName,
        conversationId: data.conversationId,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        isLocked: data.isLocked ?? false,
        requireApproval: data.requireApproval ?? true,
        allowScreenShare: data.allowScreenShare ?? true,
        allowChat: data.allowChat ?? true,
        allowReactions: data.allowReactions ?? true,
        status: data.scheduledStart ? "SCHEDULED" : "LIVE",
        participants: {
          create: {
            userId: data.hostId,
            meetingRole: "HOST",
            invitationStatus: "ACCEPTED",
          },
        },
      },
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImage: { select: { secureUrl: true } },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImage: { select: { secureUrl: true } },
              },
            },
          },
        },
      },
    });
  }

  async findByCode(meetingCode: string) {
    return prisma.meeting.findUnique({
      where: { meetingCode },
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImage: { select: { secureUrl: true } },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImage: { select: { secureUrl: true } },
              },
            },
          },
        },
      },
    });
  }

  async findById(id: bigint) {
    return prisma.meeting.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImage: { select: { secureUrl: true } },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImage: { select: { secureUrl: true } },
              },
            },
          },
        },
      },
    });
  }

  async findByRoomName(roomName: string) {
    return prisma.meeting.findUnique({
      where: { roomName },
    });
  }

  async listUserMeetings(userId: bigint, limit = 20) {
    return prisma.meeting.findMany({
      where: {
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      orderBy: [{ scheduledStart: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImage: { select: { secureUrl: true } },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImage: { select: { secureUrl: true } },
              },
            },
          },
        },
      },
    });
  }

  async updateMeeting(id: bigint, data: UpdateMeetingRepoData) {
    return prisma.meeting.update({
      where: { id },
      data,
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImage: { select: { secureUrl: true } },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImage: { select: { secureUrl: true } },
              },
            },
          },
        },
      },
    });
  }

  // Participants
  async getParticipant(meetingId: bigint, userId: bigint) {
    return prisma.meetingParticipant.findUnique({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImage: { select: { secureUrl: true } },
          },
        },
      },
    });
  }

  async upsertParticipant(
    meetingId: bigint,
    userId: bigint,
    data: {
      meetingRole?: MeetingRole;
      invitationStatus?: InvitationStatus;
      joinedAt?: Date | null;
      leftAt?: Date | null;
    },
  ) {
    return prisma.meetingParticipant.upsert({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      create: {
        meetingId,
        userId,
        meetingRole: data.meetingRole ?? "PARTICIPANT",
        invitationStatus: data.invitationStatus ?? "PENDING",
        joinedAt: data.joinedAt,
        leftAt: data.leftAt,
      },
      update: data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImage: { select: { secureUrl: true } },
          },
        },
      },
    });
  }

  async updateParticipantStatus(
    meetingId: bigint,
    userId: bigint,
    status: InvitationStatus,
  ) {
    return prisma.meetingParticipant.update({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      data: {
        invitationStatus: status,
      },
    });
  }

  async updateParticipantRole(
    meetingId: bigint,
    userId: bigint,
    role: MeetingRole,
  ) {
    return prisma.meetingParticipant.update({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      data: {
        meetingRole: role,
      },
    });
  }

  async recordParticipantJoin(meetingId: bigint, userId: bigint) {
    return prisma.meetingParticipant.upsert({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      create: {
        meetingId,
        userId,
        meetingRole: "PARTICIPANT",
        invitationStatus: "ACCEPTED",
        joinedAt: new Date(),
      },
      update: {
        joinedAt: new Date(),
        leftAt: null,
      },
    });
  }

  async recordParticipantLeave(meetingId: bigint, userId: bigint) {
    return prisma.meetingParticipant.updateMany({
      where: { meetingId, userId },
      data: { leftAt: new Date() },
    });
  }

  async deleteParticipant(meetingId: bigint, userId: bigint) {
    return prisma.meetingParticipant.deleteMany({
      where: { meetingId, userId },
    });
  }

  // In-Call Messages
  async createMessage(data: {
    meetingId: bigint;
    senderId?: bigint | null;
    senderName: string;
    content: string;
  }) {
    return prisma.meetingMessage.create({
      data,
    });
  }

  async listMessages(meetingId: bigint) {
    return prisma.meetingMessage.findMany({
      where: { meetingId },
      orderBy: { createdAt: "asc" },
    });
  }
}

export default MeetRepository;
