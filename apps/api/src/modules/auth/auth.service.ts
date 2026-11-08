import {
  generateAuthToken,
  verifyRefreshToken,
  type JwtPayload,
} from "../../common/utils/jwt.js";
import { Role } from "../../common/types/roles.js";
import AppError from "../../common/errors/AppError.js";
import { verifyPassword } from "../../common/utils/password.js";
import { hashToken, getTokenExpiryDate } from "../../common/utils/hash.js";

import AuthRepository from "./auth.repository.js";
import { RefreshTokenInput, UserLogin, SessionResponse } from "./auth.types.js";

import env from "../../config/env.js";

class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  // user login with session creation
  async userLogin(data: UserLogin) {
    const user = await this.authRepository.findByEmail(data.email);

    if (!user) {
      await verifyPassword(env.DUMMY_PASSWORD_HASH, data.password);
      throw new AppError("Invalid Credentials", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive — login disabled", 403);
    }

    // Account lockout defense
    if (
      user.credentials?.lockedUntil &&
      user.credentials.lockedUntil > new Date()
    ) {
      throw new AppError(
        "Account is temporarily locked due to too many failed attempts. Please try again later.",
        423,
      );
    }

    if (!user.credentials?.passwordHash) {
      await verifyPassword(env.DUMMY_PASSWORD_HASH, data.password);
      throw new AppError("Invalid Credentials", 401);
    }

    const validPassword = await verifyPassword(
      user.credentials.passwordHash,
      data.password,
    );

    if (!validPassword) {
      const isLockExpired = Boolean(
        user.credentials.lockedUntil &&
        user.credentials.lockedUntil <= new Date(),
      );
      const previousAttempts = isLockExpired
        ? 0
        : user.credentials.failedLoginAttempts || 0;
      const currentAttempts = previousAttempts + 1;
      const lockUntil =
        currentAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.authRepository.incrementFailedLogin(
        user.id,
        lockUntil,
        isLockExpired,
      );

      if (lockUntil) {
        throw new AppError(
          "Account is temporarily locked due to too many failed attempts. Please try again later.",
          423,
        );
      }

      throw new AppError("Invalid Credentials", 401);
    }

    // Reset failed login attempts on successful authentication
    if (
      (user.credentials.failedLoginAttempts ?? 0) > 0 ||
      user.credentials.lockedUntil !== null
    ) {
      await this.authRepository.resetFailedLogin(user.id);
    }

    const previousLoginAt = user.lastLoginAt;

    await this.authRepository.updateLastLogin(user.id);

    const tokens = generateAuthToken({
      id: user.id.toString(),
      role: user.role as Role,
    });

    // Hash refresh token for DB persistence
    const refreshTokenHash = hashToken(tokens.refreshToken);
    const expiresAt = getTokenExpiryDate(tokens.refreshToken);

    const session = await this.authRepository.createSession({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      deviceName: data.deviceName ?? null,
    });

    const { credentials, ...safeUser } = user;
    safeUser.lastLoginAt = previousLoginAt;

    return {
      user: safeUser,
      sessionId: session.id.toString(),
      ...tokens,
    };
  }

  // session-backed token refresh with token rotation & reuse detection
  async refreshToken(data: RefreshTokenInput) {
    let payload: JwtPayload;

    try {
      payload = verifyRefreshToken(data.refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const tokenHash = hashToken(data.refreshToken);
    const session = await this.authRepository.findSessionByHash(tokenHash);

    if (!session) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Token reuse detection: if session is already revoked, reject request
    if (session.revokedAt) {
      throw new AppError("Invalid or revoked refresh token", 401);
    }

    // Expiry check
    if (session.expiresAt <= new Date()) {
      throw new AppError("Session has expired — please log in again", 401);
    }

    // User status check
    if (!session.user || !session.user.isActive) {
      throw new AppError("Account is inactive — access disabled", 403);
    }

    // Rotate tokens: generate a brand new token pair
    const tokens = generateAuthToken({
      id: session.user.id.toString(),
      role: session.user.role as Role,
    });

    const newRefreshTokenHash = hashToken(tokens.refreshToken);
    const newExpiresAt = getTokenExpiryDate(tokens.refreshToken);

    // Update existing session with rotated hash and updated lastUsedAt & expiresAt
    await this.authRepository.updateSessionToken(
      session.id,
      newRefreshTokenHash,
      newExpiresAt,
    );

    return tokens;
  }

  // logout single session
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.authRepository.revokeSessionByHash(tokenHash);
  }

  // revoke specific session by ID and user ownership
  async revokeSession(userId: bigint, sessionId: bigint): Promise<void> {
    const result = await this.authRepository.revokeSessionById(
      sessionId,
      userId,
    );
    if (result.count === 0) {
      throw new AppError("Session not found or already revoked", 404);
    }
  }

  // revoke all active sessions for a user (logout all devices)
  async revokeAllSessions(userId: bigint): Promise<void> {
    await this.authRepository.revokeAllUserSessions(userId);
  }

  // get active sessions for user
  async getActiveSessions(
    userId: bigint,
    currentRefreshToken?: string,
  ): Promise<SessionResponse[]> {
    const sessions =
      await this.authRepository.findActiveSessionsByUserId(userId);
    const currentHash = currentRefreshToken
      ? hashToken(currentRefreshToken)
      : null;

    return sessions.map((s) => ({
      id: s.id.toString(),
      deviceName: s.deviceName,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: currentHash ? s.refreshTokenHash === currentHash : false,
    }));
  }

  // user profile
  async userProfile(id: bigint) {
    const user = await this.authRepository.findById(id);

    if (!user) {
      throw new AppError("User profile not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    return user;
  }
}

export default AuthService;
