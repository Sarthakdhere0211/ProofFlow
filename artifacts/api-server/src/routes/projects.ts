/**
 * Project and milestone routes
 *
 * Phase 2: Route structure, validation, authorization checks.
 * Phase 11: Connect to real database via Drizzle ORM.
 */
import { Router, type IRouter } from "express";
import { z } from "zod";
import { validate, paginationSchema, projectParamSchema, milestoneParamSchema } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Validation schemas ─────────────────────────────────────────────────────────

const createMilestoneSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  amount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
});

const createProjectSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  workerId: z.string().min(1),
  category: z.string().max(100).optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "XLM", "USDC"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  milestones: z.array(createMilestoneSchema).min(1),
});

const submitProofSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  githubUrl: z.string().url().nullable().optional(),
  liveUrl: z.string().url().nullable().optional(),
  additionalUrl: z.string().url().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  contentHash: z.string().nullable().optional(),
});

const approveMilestoneSchema = z.object({
  txHash: z.string().min(1, "Transaction hash from the blockchain is required."),
  notes: z.string().max(500).nullable().optional(),
});

const rejectMilestoneSchema = z.object({
  reason: z.string().min(5).max(500),
});

// ── Project routes ─────────────────────────────────────────────────────────────

router.get(
  "/projects",
  requireAuth,
  validate(paginationSchema, "query"),
  (req, res, next) => {
    try {
      // Phase 11: Query DB for projects where clientId=userId OR workerId=userId
      // Apply cursor-based or offset pagination
      logger.info({ userId: req.userId }, "List projects");

      res.json({
        projects: [],
        total: 0,
        page: req.query.page ?? 1,
        limit: req.query.limit ?? 20,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/projects",
  requireAuth,
  validate(createProjectSchema),
  (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createProjectSchema>;

      // Validate milestone sum > 0 (belt-and-suspenders; schema already requires positive amounts)
      const milestoneTotal = body.milestones.reduce((sum: number, m: { amount: number }) => sum + m.amount, 0);
      if (milestoneTotal <= 0) {
        throw new AppError(400, "validation_error", "Total milestone amount must be greater than zero.");
      }

      // Validate date ordering
      if (body.startDate >= body.endDate) {
        throw new AppError(400, "validation_error", "End date must be after start date.");
      }

      // Phase 11: Persist to DB, return created project
      logger.info({ userId: req.userId, title: body.title }, "Create project");

      res.status(201).json({
        id: "stub-project-id",
        title: body.title,
        description: body.description ?? "",
        clientId: req.userId,
        workerId: body.workerId,
        category: body.category ?? "",
        budget: milestoneTotal,
        currency: body.currency,
        startDate: body.startDate,
        endDate: body.endDate,
        status: "draft",
        contractStatus: null,
        contractProjectId: null,
        milestones: body.milestones.map((m: z.infer<typeof createMilestoneSchema>, i: number) => ({
          id: `stub-milestone-${i}`,
          title: m.title,
          description: m.description ?? "",
          amount: m.amount,
          dueDate: m.dueDate,
          status: "pending",
          proofStatus: "not_submitted",
          paymentStatus: "pending",
          contractStatus: null,
          contractMilestoneIndex: i,
          createdAt: new Date().toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/projects/:projectId",
  requireAuth,
  validate(projectParamSchema, "params"),
  (req, res, next) => {
    try {
      // Phase 11: Load from DB, verify req.userId === clientId || workerId (IDOR protection)
      const { projectId } = req.params;
      logger.info({ userId: req.userId, projectId }, "Get project");

      throw new AppError(404, "not_found", "Project not found.");
    } catch (err) {
      next(err);
    }
  },
);

// ── Milestone routes ───────────────────────────────────────────────────────────

router.post(
  "/projects/:projectId/milestones",
  requireAuth,
  validate(projectParamSchema, "params"),
  validate(createMilestoneSchema),
  (req, res, next) => {
    try {
      const { projectId } = req.params;
      const body = req.body as z.infer<typeof createMilestoneSchema>;

      // Phase 11: Verify project exists, verify req.userId === clientId (only client adds milestones)
      logger.info({ userId: req.userId, projectId }, "Create milestone");

      res.status(201).json({
        id: "stub-milestone-id",
        title: body.title,
        description: body.description ?? "",
        amount: body.amount,
        dueDate: body.dueDate,
        status: "pending",
        proofStatus: "not_submitted",
        paymentStatus: "pending",
        contractStatus: null,
        contractMilestoneIndex: null,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── Proof routes ───────────────────────────────────────────────────────────────

router.post(
  "/projects/:projectId/milestones/:milestoneId/proof",
  requireAuth,
  validate(milestoneParamSchema, "params"),
  validate(submitProofSchema),
  (req, res, next) => {
    try {
      const { projectId, milestoneId } = req.params;
      const body = req.body as z.infer<typeof submitProofSchema>;

      // Phase 11: Verify project exists, verify req.userId === workerId (ONLY worker submits proof)
      // Phase 7: Call blockchain service to record proof hash on-chain
      logger.info({ userId: req.userId, projectId, milestoneId }, "Submit proof");

      res.json({
        id: milestoneId,
        title: "stub",
        description: "stub",
        amount: 0,
        dueDate: new Date().toISOString().slice(0, 10),
        status: "under_review",
        proofStatus: "submitted",
        paymentStatus: "pending",
        contractStatus: "PROOF_SUBMITTED",
        contractMilestoneIndex: null,
        proof: {
          id: "stub-proof-id",
          title: body.title,
          description: body.description,
          githubUrl: body.githubUrl ?? null,
          liveUrl: body.liveUrl ?? null,
          additionalUrl: body.additionalUrl ?? null,
          contentHash: body.contentHash ?? null,
          notes: body.notes ?? null,
          status: "submitted",
          submittedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/projects/:projectId/milestones/:milestoneId/approve",
  requireAuth,
  validate(milestoneParamSchema, "params"),
  validate(approveMilestoneSchema),
  (req, res, next) => {
    try {
      const { projectId, milestoneId } = req.params;
      const body = req.body as z.infer<typeof approveMilestoneSchema>;

      // Phase 11: Verify project exists, verify req.userId === clientId (ONLY client approves)
      // Phase 7: Verify txHash on Stellar network before marking as approved
      // IMPORTANT: Never trust the txHash blindly — verify it on-chain
      logger.info(
        { userId: req.userId, projectId, milestoneId, txHash: body.txHash },
        "Approve milestone",
      );

      res.json({
        id: milestoneId,
        title: "stub",
        description: "stub",
        amount: 0,
        dueDate: new Date().toISOString().slice(0, 10),
        status: "verified",
        proofStatus: "approved",
        paymentStatus: "released",
        contractStatus: "RELEASED",
        contractMilestoneIndex: null,
        proof: null,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/projects/:projectId/milestones/:milestoneId/reject",
  requireAuth,
  validate(milestoneParamSchema, "params"),
  validate(rejectMilestoneSchema),
  (req, res, next) => {
    try {
      const { projectId, milestoneId } = req.params;
      const body = req.body as z.infer<typeof rejectMilestoneSchema>;

      // Phase 11: Verify project exists, verify req.userId === clientId
      logger.info(
        { userId: req.userId, projectId, milestoneId, reason: body.reason },
        "Reject milestone",
      );

      res.json({
        id: milestoneId,
        title: "stub",
        description: "stub",
        amount: 0,
        dueDate: new Date().toISOString().slice(0, 10),
        status: "in_progress",
        proofStatus: "changes_requested",
        paymentStatus: "pending",
        contractStatus: "REJECTED",
        contractMilestoneIndex: null,
        proof: null,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
