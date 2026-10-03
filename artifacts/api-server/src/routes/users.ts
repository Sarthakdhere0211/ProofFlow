/**
 * User profile routes
 *
 * Phase 2: Structure and validation.
 * Phase 3: Connect to DB user records.
 */
import { Router, type IRouter } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  walletAddress: z.string().nullable().optional(),
});

router.get("/users/me", requireAuth, (req, res, next) => {
  try {
    // Phase 3: Load from DB by req.userId
    logger.info({ userId: req.userId }, "Get profile");

    res.json({
      id: req.userId,
      name: "Demo User",
      email: "demo@proofflow.demo",
      role: req.userRole ?? "worker",
      proofScore: 0,
      walletAddress: null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/users/me",
  requireAuth,
  validate(updateProfileSchema),
  (req, res, next) => {
    try {
      // Phase 3: Update in DB, return updated record
      // IMPORTANT: walletAddress update must be rate-limited and logged
      logger.info({ userId: req.userId }, "Update profile");

      res.json({
        id: req.userId,
        name: req.body.name ?? "Demo User",
        email: "demo@proofflow.demo",
        role: req.userRole ?? "worker",
        proofScore: 0,
        walletAddress: req.body.walletAddress ?? null,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
