/**
 * Transaction routes
 *
 * Phase 2: Structure and validation.
 * Phase 11: Connect to real database.
 */
import { Router, type IRouter } from "express";
import { validate, paginationSchema } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get(
  "/transactions",
  requireAuth,
  validate(paginationSchema, "query"),
  (req, res, next) => {
    try {
      // Phase 11: Query DB for transactions where userId is client or worker of project
      logger.info({ userId: req.userId }, "List transactions");

      res.json({
        transactions: [],
        total: 0,
        page: req.query.page ?? 1,
        limit: req.query.limit ?? 20,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
