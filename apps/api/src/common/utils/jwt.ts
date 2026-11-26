import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import AppError from "../errors/AppError.js";
import { Role } from "../types/roles.js";
import env from "../../config/env.js";

export interface JwtPayload {
  id: string | bigint;
  role: Role;
  jti?: string;
  iat?: number;
  exp?: number;
}

const getJwtSecret = (): string => {
  if (!env.JWT_SECRET) {
    throw new AppError("Server configuration error: JWT_SECRET is missing", 500);
  }
  return env.JWT_SECRET;
};

const getJwtRefreshSecret = (): string => {
  if (!env.JWT_REFRESH_SECRET) {
    throw new AppError(
      "Server configuration error: JWT_REFRESH_SECRET is missing",
      500,
    );
  }
  return env.JWT_REFRESH_SECRET;
};

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(
    { id: payload.id.toString(), role: payload.role },
    getJwtSecret(),
    {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions,
  );
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(
    {
      id: payload.id.toString(),
      role: payload.role,
      jti: crypto.randomUUID(),
    },
    getJwtRefreshSecret(),
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions,
  );
};

export const generateAuthToken = (payload: JwtPayload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
};

export const generateToken = (payload: JwtPayload): string => {
  return generateAccessToken(payload);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, getJwtRefreshSecret()) as JwtPayload;
};
