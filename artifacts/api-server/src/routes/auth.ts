/**
 * Authentication routes
 *
 * Phase 2: Structural foundation with safe stubs.
 * Phase 3: Real bcrypt password hashing, JWT signing, refresh tokens.
 */
import { Router, type IRouter } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { AppError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Validation schemas ─────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["client", "worker"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Routes ─────────────────────────────────────────────────────────────────────

router.post("/auth/register", validate(registerSchema), (req, res, next) => {
  try {
    // Phase 3: Hash password with bcrypt (cost factor 12+), persist to DB, issue JWT.
    // NEVER store plain-text passwords.
    // NEVER log passwords.
    logger.info({ email: req.body.email, role: req.body.role }, "Register attempt");

    // Stub response — Phase 3 replaces this
    res.status(201).json({
      accessToken: "stub-token-replace-in-phase-3",
      user: {
        id: "stub-user-id",
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        proofScore: 0,
        walletAddress: null,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/login", validate(loginSchema), (req, res, next) => {
  try {
    // Phase 3: Look up user by email, compare bcrypt hash, issue JWT + set httpOnly refresh cookie.
    logger.info({ email: req.body.email }, "Login attempt");

    // Stub response
    res.status(200).json({
      accessToken: "stub-token-replace-in-phase-3",
      user: {
        id: "stub-user-id",
        name: "Demo User",
        email: req.body.email,
        role: "worker",
        proofScore: 0,
        walletAddress: null,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/refresh", (req, res, next) => {
  try {
    // Phase 3: Read refresh token from httpOnly cookie, verify, issue new access token.
    throw new AppError(501, "not_implemented", "Token refresh is implemented in Phase 3.");
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", requireAuth, (req, res, next) => {
  try {
    // Phase 3: Invalidate refresh token in DB, clear httpOnly cookie.
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
