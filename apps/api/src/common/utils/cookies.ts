import type { CookieOptions, Request, Response, NextFunction } from "express";
import env from "../../config/env.js";

export const REFRESH_COOKIE_NAME = "refreshToken";

export const getCookieOptions = (
  custom?: Partial<CookieOptions>,
): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  ...custom,
});

export const setRefreshCookie = (
  res: Response,
  token: string,
  customOptions?: Partial<CookieOptions>,
): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, getCookieOptions(customOptions));
};

export const clearRefreshCookie = (
  res: Response,
  customOptions?: Partial<CookieOptions>,
): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions(customOptions));
};

export const getRefreshCookie = (req: Request): string | undefined => {
  return req.cookies?.[REFRESH_COOKIE_NAME];
};

/**
 * Bridge HttpOnly cookie to body for refresh and logout if not explicitly passed in body
 */
export const attachCookieToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.body?.refreshToken && req.cookies?.[REFRESH_COOKIE_NAME]) {
    req.body = { ...req.body, refreshToken: req.cookies[REFRESH_COOKIE_NAME] };
  }
  next();
};
