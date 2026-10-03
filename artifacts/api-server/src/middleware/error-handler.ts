/**
 * Centralized error handler
 *
 * Catches errors thrown from route handlers and formats safe responses.
 * NEVER exposes stack traces, file paths, or database internals to clients.
 */
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    error: "not_found",
    message: "The requested resource was not found.",
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  // Log the real error server-side with full context
  logger.error(
    {
      err,
      method: req.method,
      path: req.path,
      userId: req.userId,
    },
    "Unhandled error",
  );

  // Return a safe, generic error to the client
  res.status(500).json({
    error: "internal_error",
    message: "An unexpected error occurred. Please try again.",
  });
}
