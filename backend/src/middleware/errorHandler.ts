import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Central error handler — every thrown/forwarded error ends up here.
// Keeps error shape consistent and messages beginner-readable.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }

  console.error("[unhandled error]", err);
  res.status(500).json({
    success: false,
    error: "Something went wrong on the server. Please try again shortly.",
  });
}
