/**
 * Zod request validation middleware
 *
 * Validates request body, params, and query against a Zod schema.
 * Returns a 400 with field-level errors on failure.
 */
import type { Request, Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";

type ValidationTarget = "body" | "params" | "query";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((issue: z.ZodIssue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        error: "validation_error",
        message: "Request validation failed.",
        details,
      });
      return;
    }

    // Replace with validated + coerced data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[target] = result.data;
    next();
  };
}

// ── Common reusable schemas ────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uuidParamSchema = z.object({
  id: z.string().min(1),
});

export const projectParamSchema = z.object({
  projectId: z.string().min(1),
});

export const milestoneParamSchema = z.object({
  projectId: z.string().min(1),
  milestoneId: z.string().min(1),
});
