import { create } from "zustand";

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  activeRooms: string[];
  onlineUsers: Record<string, boolean>;
  presenceStatuses: Record<string, "ACTIVE" | "AWAY" | "DND">;
  myPresenceStatus: "ACTIVE" | "AWAY" | "DND";

  setConnected: (isConnected: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setError: (connectionError: string | null) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setUserPresenceStatus: (userId: string, status: "ACTIVE" | "AWAY" | "DND") => void;
  setMyPresenceStatus: (status: "ACTIVE" | "AWAY" | "DND") => void;
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string, status?: "ACTIVE" | "AWAY" | "DND") => void;
  removeOnlineUser: (userId: string) => void;
  addActiveRoom: (room: string) => void;
  removeActiveRoom: (room: string) => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  activeRooms: [],
  onlineUsers: {},
  presenceStatuses: {},
  myPresenceStatus: "ACTIVE",

  setConnected: (isConnected) =>
    set((state) => ({
      isConnected,
      isConnecting: false,
      connectionError: isConnected ? null : state.connectionError,
    })),

  setConnecting: (isConnecting) => set({ isConnecting }),

  setError: (connectionError) =>
    set({ connectionError, isConnecting: false, isConnected: false }),

  setUserOnline: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),

  setUserPresenceStatus: (userId, status) =>
    set((state) => ({
      presenceStatuses: { ...state.presenceStatuses, [userId]: status },
    })),

  setMyPresenceStatus: (myPresenceStatus) => set({ myPresenceStatus }),

  setOnlineUsers: (userIds) =>
    set({
      onlineUsers: userIds.reduce<Record<string, boolean>>((acc, id) => {
        acc[id] = true;
        return acc;
      }, {}),
    }),

  addOnlineUser: (userId, status = "ACTIVE") =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: true },
      presenceStatuses: { ...state.presenceStatuses, [userId]: status },
    })),

  removeOnlineUser: (userId) =>
    set((state) => {
      const restStatuses = { ...state.presenceStatuses };
      delete restStatuses[userId];
      return {
        onlineUsers: { ...state.onlineUsers, [userId]: false },
        presenceStatuses: restStatuses,
      };
    }),

  addActiveRoom: (room) =>
    set((state) => ({
      activeRooms: state.activeRooms.includes(room)
        ? state.activeRooms
        : [...state.activeRooms, room],
    })),

  removeActiveRoom: (room) =>
    set((state) => ({
      activeRooms: state.activeRooms.filter((r) => r !== room),
    })),

  reset: () =>
    set({
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      activeRooms: [],
      onlineUsers: {},
    }),
}));

export default useSocketStore;
