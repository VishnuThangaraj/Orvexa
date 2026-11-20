import type {
  MeetingStatus,
  MeetingRole,
  InvitationStatus,
} from "../../generated/prisma/enums.js";

export { MeetingStatus, MeetingRole, InvitationStatus };

export interface CreateMeetingRepoData {
  title: string;
  description?: string | null;
  hostId: bigint;
  meetingCode: string;
  roomName: string;
  conversationId?: bigint | null;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  isLocked?: boolean;
  requireApproval?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  allowReactions?: boolean;
}

export interface UpdateMeetingRepoData {
  title?: string;
  description?: string | null;
  status?: MeetingStatus;
  startedAt?: Date | null;
  endedAt?: Date | null;
  isLocked?: boolean;
  requireApproval?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  allowReactions?: boolean;
}

export interface CreateMeetingDto {
  title?: string;
  description?: string | null;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
  conversationId?: string | number | bigint | null;
  isLocked?: boolean;
  requireApproval?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  allowReactions?: boolean;
}

export interface UpdateMeetingSettingsDto {
  isLocked?: boolean;
  requireApproval?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  allowReactions?: boolean;
}

export interface JoinMeetingDto {
  passcode?: string;
}

export interface CreateMeetingMessageDto {
  content: string;
}

export interface MeetingResponse {
  id: string;
  title: string;
  description: string | null;
  hostId: string;
  host: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    profileImage?: { secureUrl: string } | null;
  };
  meetingCode: string;
  roomName: string;
  conversationId: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  startedAt: string | null;
  endedAt: string | null;
  status: MeetingStatus;
  isLocked: boolean;
  requireApproval: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowReactions: boolean;
  createdAt: string;
  updatedAt: string;
  participantsCount?: number;
  participants?: MeetingParticipantResponse[];
  myRole?: MeetingRole | null;
  myStatus?: InvitationStatus | null;
}

export interface MeetingParticipantResponse {
  id: string;
  meetingId: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    profileImage?: { secureUrl: string } | null;
  };
  meetingRole: MeetingRole;
  invitationStatus: InvitationStatus;
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string;
}

export interface MeetingMessageResponse {
  id: string;
  meetingId: string;
  senderId: string | null;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
  meetingCode: string;
  participantId: string;
  participantName: string;
  role: MeetingRole;
}
