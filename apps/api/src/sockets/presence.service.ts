import { getIO } from "./socket.instance.js";

class PresenceService {
  private userSockets: Map<string, Set<string>> = new Map();

  addUserSocket(userId: string, socketId: string): void {
    let sockets = this.userSockets.get(userId);
    const wasOffline = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(socketId);

    if (wasOffline) {
      this.broadcastPresence(userId, true);
    }
  }

  removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      this.broadcastPresence(userId, false, new Date().toISOString());
    }
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  clear(): void {
    this.userSockets.clear();
  }

  private broadcastPresence(
    userId: string,
    isOnline: boolean,
    lastSeen?: string,
  ): void {
    try {
      const io = getIO();
      io.emit("presence:state", { userId, isOnline, lastSeen });
    } catch {
      // Ignore if socket server is offline or in test context
    }
  }
}

export const presenceService = new PresenceService();
export default presenceService;
