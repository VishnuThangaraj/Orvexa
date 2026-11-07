import type { Response } from "express";

interface ApiResponse<T> {
  success: boolean;

  message: string;

  data?: T | undefined;
}

export function sendResponse<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  return res.status(statusCode).json(response);
}
