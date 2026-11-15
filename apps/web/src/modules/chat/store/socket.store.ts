import { create } from "zustand";

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  activeRooms: string[];
  onlineUsers: Record<string, boolean>;

  setConnected: (isConnected: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setError: (connectionError: string | null) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
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

  setConnected: (isConnected) =>
    set({ isConnected, isConnecting: false, connectionError: isConnected ? null : undefined }),

  setConnecting: (isConnecting) => set({ isConnecting }),

  setError: (connectionError) =>
    set({ connectionError, isConnecting: false, isConnected: false }),

  setUserOnline: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),

  setOnlineUsers: (userIds) =>
    set({
      onlineUsers: userIds.reduce<Record<string, boolean>>((acc, id) => {
        acc[id] = true;
        return acc;
      }, {}),
    }),

  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: true },
    })),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: false },
    })),

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
