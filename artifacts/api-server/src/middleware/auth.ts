/**
 * JWT authentication middleware
 *
 * Verifies the Authorization: Bearer <token> header.
 * Sets req.userId and req.userRole on success.
 *
 * Phase 3: Full JWT + refresh token implementation.
 * For now this is the structural foundation.
 */
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

/**
 * Safe error message — never exposes internals.
 */
function unauthorized(res: Response, message = "Authentication required."): void {
  res.status(401).json({ error: "unauthorized", message });
}

/**
 * requireAuth middleware — attach to any protected route.
 *
 * In Phase 3 this will verify a real JWT using the JWT_SECRET env var.
 * The structure is already correct so routes don't need to change later.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    unauthorized(res);
    return;
  }

  const token = authHeader.slice(7);

  if (!token) {
    unauthorized(res);
    return;
  }

  // ── Phase 3: Replace this block with real JWT verification ──────────────
  // import jwt from 'jsonwebtoken';
  // try {
  //   const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; role: string };
  //   req.userId = payload.sub;
  //   req.userRole = payload.role;
  //   next();
  // } catch (err) {
  //   logger.warn({ err }, 'JWT verification failed');
  //   unauthorized(res, 'Invalid or expired token.');
  // }
  // ────────────────────────────────────────────────────────────────────────

  // Temporary: accept any non-empty token, extract userId from it
  // This is explicitly NOT production auth — it is replaced in Phase 3.
  logger.warn(
    { path: req.path },
    "Auth middleware running in Phase-2 stub mode — not production-safe",
  );
  req.userId = "demo-user";
  req.userRole = "worker";
  next();
}

/**
 * requireRole middleware — use after requireAuth.
 * Usage: router.post('/approve', requireAuth, requireRole('client'), handler)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to perform this action.",
      });
      return;
    }
    next();
  };
}
