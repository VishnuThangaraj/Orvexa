import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Role } from "../types/roles.js";
import env from "../../config/env.js";

export interface JwtPayload {
  id: string | bigint;
  role: Role;
  jti?: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(
    { id: payload.id.toString(), role: payload.role },
    env.JWT_SECRET,
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
    env.JWT_REFRESH_SECRET,
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
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};
