import { create } from "zustand";
import meetApi from "../api/meet.api";
import type {
  Meeting,
  MeetingMessage,
  LiveKitTokenData,
  CreateMeetingInput,
  UpdateMeetingSettingsInput,
} from "../types/meet.types";

interface MeetState {
  currentMeeting: Meeting | null;
  isLoading: boolean;
  error: string | null;
  userMeetings: Meeting[];
  liveKitData: LiveKitTokenData | null;
  messages: MeetingMessage[];
  waitingState: "idle" | "knocking" | "admitted" | "denied";
  waitingParticipants: Array<{
    userId: string;
    displayName: string;
    avatarUrl?: string;
  }>;

  // Device & local media states
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  selectedAudioInputId: string | null;
  selectedVideoInputId: string | null;
  selectedAudioOutputId: string | null;

  // Active side panel
  activeSidePanel: "people" | "chat" | "details" | "host" | null;

  // Actions
  createMeeting: (input: CreateMeetingInput) => Promise<Meeting>;
  fetchMeetingByCode: (code: string) => Promise<Meeting>;
  fetchUserMeetings: () => Promise<void>;
  fetchLiveKitToken: (code: string) => Promise<LiveKitTokenData>;
  updateSettings: (code: string, data: UpdateMeetingSettingsInput) => Promise<void>;
  admitParticipant: (code: string, userId: string) => Promise<void>;
  denyParticipant: (code: string, userId: string) => Promise<void>;
  endMeetingForEveryone: (code: string) => Promise<void>;
  sendMessage: (code: string, content: string) => Promise<void>;
  fetchMessages: (code: string) => Promise<void>;

  setWaitingState: (state: "idle" | "knocking" | "admitted" | "denied") => void;
  addWaitingParticipant: (participant: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
  }) => void;
  removeWaitingParticipant: (userId: string) => void;
  clearWaitingParticipants: () => void;
  addMessage: (message: MeetingMessage) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  setMicEnabled: (enabled: boolean) => void;
  setCameraEnabled: (enabled: boolean) => void;
  setIsScreenSharing: (sharing: boolean) => void;
  setSelectedAudioInputId: (id: string | null) => void;
  setSelectedVideoInputId: (id: string | null) => void;
  setSelectedAudioOutputId: (id: string | null) => void;
  setActiveSidePanel: (panel: "people" | "chat" | "details" | "host" | null) => void;
  resetMeetingState: () => void;
}

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object") {
    const axiosErr = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return axiosErr.response?.data?.message || axiosErr.message || fallback;
  }
  return fallback;
};

export const useMeetStore = create<MeetState>((set, get) => ({
  currentMeeting: null,
  isLoading: false,
  error: null,
  userMeetings: [],
  liveKitData: null,
  messages: [],
  waitingState: "idle",
  waitingParticipants: [],

  isMicEnabled: true,
  isCameraEnabled: true,
  isScreenSharing: false,
  selectedAudioInputId: null,
  selectedVideoInputId: null,
  selectedAudioOutputId: null,

  activeSidePanel: null,

  createMeeting: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await meetApi.createMeeting(input);
      set({ currentMeeting: meeting, isLoading: false });
      return meeting;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to create meeting");
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  fetchMeetingByCode: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await meetApi.getMeetingByCode(code);
      set({ currentMeeting: meeting, isLoading: false });
      return meeting;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to fetch meeting");
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  fetchUserMeetings: async () => {
    try {
      const userMeetings = await meetApi.listMyMeetings();
      set({ userMeetings });
    } catch (err) {
      console.error("Failed to load user meetings:", err);
    }
  },

  fetchLiveKitToken: async (code) => {
    try {
      const data = await meetApi.getLiveKitToken(code);
      set({ liveKitData: data, waitingState: "admitted" });
      return data;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      const status = axiosErr.response?.status;
      if (status === 403) {
        // Needs host approval
        set({ waitingState: "knocking" });
      }
      throw err;
    }
  },

  updateSettings: async (code, data) => {
    try {
      const updated = await meetApi.updateSettings(code, data);
      set({ currentMeeting: updated });
    } catch (err: unknown) {
      console.error("Failed to update meeting settings:", err);
      throw err;
    }
  },

  admitParticipant: async (code, userId) => {
    await meetApi.admitParticipant(code, userId);
    // Refresh participant list
    await get().fetchMeetingByCode(code);
  },

  denyParticipant: async (code, userId) => {
    await meetApi.denyParticipant(code, userId);
    await get().fetchMeetingByCode(code);
  },

  endMeetingForEveryone: async (code) => {
    const updated = await meetApi.endMeeting(code);
    set({ currentMeeting: updated, liveKitData: null });
  },

  sendMessage: async (code, content) => {
    const msg = await meetApi.sendMessage(code, content);
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  fetchMessages: async (code) => {
    try {
      const messages = await meetApi.getMessages(code);
      set({ messages });
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  },

  setWaitingState: (waitingState) => set({ waitingState }),
  addWaitingParticipant: (participant) =>
    set((state) => {
      if (state.waitingParticipants.some((p) => p.userId === participant.userId)) {
        return state;
      }
      return { waitingParticipants: [...state.waitingParticipants, participant] };
    }),
  removeWaitingParticipant: (userId) =>
    set((state) => ({
      waitingParticipants: state.waitingParticipants.filter((p) => p.userId !== userId),
    })),
  clearWaitingParticipants: () => set({ waitingParticipants: [] }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  toggleMic: () => set((state) => ({ isMicEnabled: !state.isMicEnabled })),
  toggleCamera: () => set((state) => ({ isCameraEnabled: !state.isCameraEnabled })),
  setMicEnabled: (isMicEnabled) => set({ isMicEnabled }),
  setCameraEnabled: (isCameraEnabled) => set({ isCameraEnabled }),
  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setSelectedAudioInputId: (selectedAudioInputId) => set({ selectedAudioInputId }),
  setSelectedVideoInputId: (selectedVideoInputId) => set({ selectedVideoInputId }),
  setSelectedAudioOutputId: (selectedAudioOutputId) => set({ selectedAudioOutputId }),

  setActiveSidePanel: (panel) =>
    set((state) => ({
      activeSidePanel: state.activeSidePanel === panel ? null : panel,
    })),

  resetMeetingState: () =>
    set({
      currentMeeting: null,
      liveKitData: null,
      messages: [],
      waitingState: "idle",
      waitingParticipants: [],
      isScreenSharing: false,
      activeSidePanel: null,
      error: null,
    }),
}));
