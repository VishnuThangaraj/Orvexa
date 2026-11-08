import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(6).max(255),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
