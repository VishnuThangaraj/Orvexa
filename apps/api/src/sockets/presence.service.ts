import { getIO } from "./socket.instance.js";

export type UserPresenceStatus = "ACTIVE" | "AWAY" | "DND";

class PresenceService {
  private userSockets: Map<string, Set<string>> = new Map();
  private userStatuses: Map<string, UserPresenceStatus> = new Map();

  addUserSocket(userId: string, socketId: string): void {
    let sockets = this.userSockets.get(userId);
    const wasOffline = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(socketId);
    if (!this.userStatuses.has(userId)) {
      this.userStatuses.set(userId, "ACTIVE");
    }

    if (wasOffline) {
      this.broadcastPresence(userId, true, this.userStatuses.get(userId));
    }
  }

  setUserStatus(userId: string, status: UserPresenceStatus): void {
    this.userStatuses.set(userId, status);
    if (this.isUserOnline(userId)) {
      this.broadcastPresence(userId, true, status);
    }
  }

  getUserStatus(userId: string): UserPresenceStatus {
    return this.userStatuses.get(userId) || "ACTIVE";
  }

  removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      this.userStatuses.delete(userId);
      this.broadcastPresence(userId, false, undefined, new Date().toISOString());
    }
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  getPresenceMap(): Record<string, { isOnline: boolean; status: UserPresenceStatus }> {
    const map: Record<string, { isOnline: boolean; status: UserPresenceStatus }> = {};
    for (const [userId, sockets] of this.userSockets.entries()) {
      map[userId] = {
        isOnline: sockets.size > 0,
        status: this.userStatuses.get(userId) || "ACTIVE",
      };
    }
    return map;
  }

  clear(): void {
    this.userSockets.clear();
    this.userStatuses.clear();
  }

  private broadcastPresence(
    userId: string,
    isOnline: boolean,
    status?: UserPresenceStatus,
    lastSeen?: string,
  ): void {
    try {
      const io = getIO();
      io.emit("presence:state", { userId, isOnline, status, lastSeen });
    } catch {
      // Ignore if socket server is offline or in test context
    }
  }
}

export const presenceService = new PresenceService();
export default presenceService;
