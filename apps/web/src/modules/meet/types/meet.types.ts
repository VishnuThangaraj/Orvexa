export type MeetingStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
export type MeetingRole = "HOST" | "CO_HOST" | "PARTICIPANT";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface MeetingHost {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profileImage?: { secureUrl: string } | null;
}

export interface MeetingParticipant {
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

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  hostId: string;
  host: MeetingHost;
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
  participants?: MeetingParticipant[];
  myRole?: MeetingRole | null;
  myStatus?: InvitationStatus | null;
}

export interface MeetingMessage {
  id: string;
  meetingId: string;
  senderId: string | null;
  senderName: string;
  content: string;
  createdAt: string;
}

export type MeetSignalKind =
  | "offer"
  | "answer"
  | "ice"
  | "media_state"
  | "reaction"
  | "hand_raise"
  | "leave";

export interface MeetSignalItem {
  id: string;
  fromUserId: string;
  fromName: string;
  avatarUrl: string | null;
  toUserId: string | null;
  kind: MeetSignalKind;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface MeetActivePeerSummary {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: MeetingRole;
}

export interface MeetSignalsPollResponse {
  latestId: string | null;
  signals: MeetSignalItem[];
  activeParticipants: MeetActivePeerSummary[];
  waitingParticipants: Array<{
    userId: string;
    displayName: string;
    avatarUrl?: string;
  }>;
  meetingStatus: MeetingStatus;
}

export interface FallbackParticipantTileData {
  id: string;
  name: string;
  avatarUrl: string | null;
  role?: MeetingRole;
  isLocal: boolean;
  stream: MediaStream | null;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
}

export interface LiveKitTokenData {
  token: string;
  url: string;
  mode?: "livekit" | "webrtc";
  roomName: string;
  meetingCode: string;
  participantId: string;
  participantName: string;
  role: MeetingRole;
}

export interface CreateMeetingInput {
  title?: string;
  description?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  isLocked?: boolean;
  requireApproval?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  allowReactions?: boolean;
}

export interface UpdateMeetingSettingsInput {
  isLocked?: boolean;
  requireApproval?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  allowReactions?: boolean;
}
