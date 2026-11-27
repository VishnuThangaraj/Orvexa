import prisma from "../infrastructure/database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import { getIO } from "./socket.instance.js";

export type UserPresenceStatus = "ACTIVE" | "AWAY" | "DND";

const PRESENCE_TTL_MS = 120_000; // 2 minutes heartbeat window for serverless/HTTP presence

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

  async persistUserPresence(
    userId: string,
    status: UserPresenceStatus | "OFFLINE",
  ): Promise<void> {
    if (!/^\d+$/.test(userId)) return;
    const uid = BigInt(userId);

    try {
      const existing = await prisma.userPreference.findUnique({
        where: { userId: uid },
        select: { notificationPreferences: true },
      });

      const basePrefs =
        existing?.notificationPreferences &&
        typeof existing.notificationPreferences === "object" &&
        !Array.isArray(existing.notificationPreferences)
          ? (existing.notificationPreferences as Record<string, unknown>)
          : { mail: true, chat: true, calendar: true, security: true };

      const updatedPrefs: Record<string, unknown> = {
        ...basePrefs,
        presenceStatus: status,
        presenceUpdatedAt: status === "OFFLINE" ? null : new Date().toISOString(),
      };

      await prisma.userPreference.upsert({
        where: { userId: uid },
        create: {
          userId: uid,
          notificationPreferences: updatedPrefs as Prisma.InputJsonValue,
        },
        update: {
          notificationPreferences: updatedPrefs as Prisma.InputJsonValue,
        },
      });
    } catch {
      // Best-effort persistence
    }
  }

  async getHydratedPresenceMap(
    ttlMs: number = PRESENCE_TTL_MS,
  ): Promise<Record<string, { isOnline: boolean; status: UserPresenceStatus }>> {
    const map = this.getPresenceMap();

    try {
      const cutoff = Date.now() - ttlMs;
      const rows = await prisma.userPreference.findMany({
        select: {
          userId: true,
          notificationPreferences: true,
        },
      });

      for (const row of rows) {
        const uid = String(row.userId);
        // Live WebSocket state takes precedence when user has active socket
        if (map[uid]?.isOnline) continue;

        const prefs = row.notificationPreferences;
        if (!prefs || typeof prefs !== "object" || Array.isArray(prefs)) continue;

        const record = prefs as Record<string, unknown>;
        const rawStatus = record.presenceStatus;
        const rawUpdatedAt = record.presenceUpdatedAt;

        if (
          rawStatus !== "ACTIVE" &&
          rawStatus !== "AWAY" &&
          rawStatus !== "DND"
        ) {
          continue;
        }
        if (typeof rawUpdatedAt !== "string") continue;

        const updatedMs = new Date(rawUpdatedAt).getTime();
        if (Number.isFinite(updatedMs) && updatedMs >= cutoff) {
          map[uid] = {
            isOnline: true,
            status: rawStatus,
          };
        }
      }
    } catch {
      // Fallback to in-memory socket presence map
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
