import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useSocketStore } from "../store/socket.store";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/socket.types";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;
  private isInitialized = false;

  private getBaseUrl(): string {
    const rawUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_SERVER_URL ||
      (import.meta.env.DEV ? "http://localhost:6969" : "");
    return rawUrl.trim().replace(/\/+$/, "").replace(/\/api$/, "");
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // React to auth store changes
    useAuthStore.subscribe((state, prevState) => {
      if (state.accessToken && !prevState.accessToken) {
        // Logged in
        this.connect();
      } else if (!state.accessToken && prevState.accessToken) {
        // Logged out
        this.disconnect();
      } else if (
        state.accessToken &&
        prevState.accessToken &&
        state.accessToken !== prevState.accessToken
      ) {
        // Token refreshed
        this.updateAuthToken(state.accessToken);
      }
    });

    // Auto-connect if already authenticated on initial load
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (isAuthenticated && accessToken) {
      this.connect();
    }
  }

  public connect(): TypedSocket | null {
    const { accessToken, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !accessToken) {
      console.warn("[SOCKET] Cannot connect: User is not authenticated.");
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    const url = this.getBaseUrl();
    if (!url) {
      return null;
    }

    const socketStore = useSocketStore.getState();
    socketStore.setConnecting(true);

    if (!this.socket) {
      this.socket = io(url, {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupListeners();
    } else {
      this.socket.auth = { token: accessToken };
    }

    this.socket.connect();
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    useSocketStore.getState().reset();
  }

  public updateAuthToken(token: string) {
    if (this.socket) {
      this.socket.auth = { token };
      if (!this.socket.connected) {
        this.socket.connect();
      }
    }
  }

  public getSocket(): TypedSocket | null {
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[SOCKET] Connected successfully:", this.socket?.id);
      const socketStore = useSocketStore.getState();
      socketStore.setConnected(true);

      // Re-join any previously active rooms
      for (const room of socketStore.activeRooms) {
        this.socket?.emit("chat:join", { conversationId: room });
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected. Reason:", reason);
      useSocketStore.getState().setConnected(false);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[SOCKET] Connection error:", error.message);
      useSocketStore.getState().setError(error.message);
    });

    this.socket.on("presence:state", (data) => {
      const store = useSocketStore.getState();
      if (data.isOnline) {
        store.addOnlineUser(data.userId, data.status);
      } else {
        store.removeOnlineUser(data.userId);
      }
    });

    this.socket.on("error", (err) => {
      console.error("[SOCKET] Server error:", err.message);
    });
  }
}

export const socketService = new SocketService();
export default socketService;
