import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(6).max(255),
  deviceName: z.string().max(255).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const sessionIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid session ID format"),
});
