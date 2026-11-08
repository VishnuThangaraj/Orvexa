import prisma from "../../infrastructure/database/prisma.js";

export interface CreateSessionData {
  userId: bigint;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
}

class AuthRepository {
  // find user by id
  async findById(id: bigint) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
      },
    });
  }

  // find user by email
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        credentials: true,
        preferences: true,
      },
    });
  }

  // update last login
  async updateLastLogin(userId: bigint) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  // increment failed login attempts, optionally setting lockout timestamp
  async incrementFailedLogin(
    userId: bigint,
    lockUntil?: Date | null,
    resetCount = false,
  ) {
    return prisma.credentials.update({
      where: { userId },
      data: resetCount
        ? {
            failedLoginAttempts: 1,
            lockedUntil: lockUntil ?? null,
          }
        : {
            failedLoginAttempts: { increment: 1 },
            ...(lockUntil !== undefined ? { lockedUntil: lockUntil } : {}),
          },
    });
  }

  // reset failed login attempts and clear lockout
  async resetFailedLogin(userId: bigint) {
    return prisma.credentials.update({
      where: { userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  // create user session
  async createSession(data: CreateSessionData) {
    return prisma.userSession.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        deviceName: data.deviceName ?? null,
        lastUsedAt: new Date(),
      },
    });
  }

  // find session by refresh token hash (including user, regardless of revoked/expired status for reuse detection)
  async findSessionByHash(refreshTokenHash: string) {
    return prisma.userSession.findFirst({
      where: { refreshTokenHash },
      include: {
        user: true,
      },
    });
  }

  // find active session by refresh token hash (non-revoked and unexpired)
  async findActiveSessionByHash(refreshTokenHash: string) {
    return prisma.userSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  // update session refresh token hash and expiry (token rotation)
  async updateSessionToken(
    sessionId: bigint,
    newRefreshTokenHash: string,
    newExpiresAt: Date,
  ) {
    return prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  // revoke session by ID and user ID (user-isolated soft-delete)
  async revokeSessionById(sessionId: bigint, userId: bigint) {
    return prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // revoke session by refresh token hash
  async revokeSessionByHash(refreshTokenHash: string) {
    return prisma.userSession.updateMany({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // revoke all active sessions for a user
  async revokeAllUserSessions(userId: bigint) {
    return prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // find all active sessions for a user
  async findActiveSessionsByUserId(userId: bigint) {
    return prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  // create a new password reset token
  async createPasswordResetToken(
    userId: bigint,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  // find an active and unused password reset token
  async findValidPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            credentials: true,
          },
        },
      },
    });
  }

  // mark a password reset token as used
  async markPasswordResetTokenUsed(id: bigint) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }

  // update credentials password and record change timestamp
  async updatePassword(userId: bigint, newPasswordHash: string) {
    return prisma.credentials.update({
      where: { userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  // find credentials by user id
  async findCredentialsByUserId(userId: bigint) {
    return prisma.credentials.findUnique({
      where: { userId },
    });
  }

  // purge expired or revoked sessions older than threshold days
  async purgeExpiredSessions(olderThanDays = 30) {
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
    );
    return prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: cutoffDate } },
          { revokedAt: { lt: cutoffDate } },
        ],
      },
    });
  }
}

export default AuthRepository;
