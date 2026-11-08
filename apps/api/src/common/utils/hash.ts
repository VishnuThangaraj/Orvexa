import crypto from "node:crypto";
import jwt from "jsonwebtoken";

/**
 * Computes a deterministic SHA-256 hash of a token.
 * Plaintext refresh tokens are never persisted in the database.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Extracts the expiration Date from a signed JWT token.
 * Reads the signed standard `exp` claim (seconds since epoch).
 * Falls back to Date.now() + fallbackDurationMs if `exp` is absent.
 */
export const getTokenExpiryDate = (
  token: string,
  fallbackDurationMs = 24 * 60 * 60 * 1000,
): Date => {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded && typeof decoded.exp === "number") {
      return new Date(decoded.exp * 1000);
    }
  } catch {
    // Fallback if decode throws
  }
  return new Date(Date.now() + fallbackDurationMs);
};
