/**
 * OKR rollup routes for the Kyndral-365 server.
 *
 *   GET  /api/okrs/:id/rollup
 *        Computed (never stored-stale) OKR progress: weighted KR rollups with
 *        the full contributor breakdown and the `formula` audit string from
 *        server/okrRollupService.ts.
 *
 *   POST /api/okrs/:okrId/key-results/:krId/contributions
 *        Upsert a HUMAN contribution row (inferredBy:"human") — body
 *        { entityType, entityId, contributionPct }. Human rows override
 *        agent-inferred ones in the rollup. Responds with the saved row plus
 *        the freshly recomputed KR rollup so the UI can update in place.
 *
 * Registered in server/routes.ts next to the other routers; ids are varchar
 * UUID strings (Kyndral's schema), so params are validated as non-empty
 * strings rather than positive integers.
 */
import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { OkrRollupService, type ContributionRow, type RollupStorage } from "../okrRollupService";

// ── Dependencies (structural — Kyndral's storage satisfies these) ────────────

export interface OkrRollupRouteDeps {
  /** Kyndral storage; see RollupStorage in server/okrRollupService.ts. */
  storage: RollupStorage;
  /**
   * Upsert keyed on (keyResultId, entityType, entityId) — the unique index in
   * okrEntityContributions. Returns the saved row.
   */
  upsertContribution(row: ContributionRow): Promise<ContributionRow>;
}

// ── Validation ───────────────────────────────────────────────────────────────

const contributionBodySchema = z.object({
  entityType: z.enum(["epic", "feature", "story", "task", "project"]),
  entityId: z.string().min(1),
  /** Share (0–100) of the key result this entity drives. */
  contributionPct: z.number().min(0).max(100),
});

/** Kyndral ids are varchar UUIDs — accept any non-empty string param. */
function idParam(value: string | undefined): string | null {
  const v = typeof value === "string" ? value.trim() : "";
  return v.length > 0 ? v : null;
}

// ── Router ───────────────────────────────────────────────────────────────────

export function initOkrRollupRoutes(router: Router, deps: OkrRollupRouteDeps): Router {
  const service = new OkrRollupService(deps.storage);

  router.get("/api/okrs/:id/rollup", async (req: Request, res: Response) => {
    const okrId = idParam(req.params.id);
    if (okrId === null) {
      res.status(400).json({ error: "okr id must be a non-empty string" });
      return;
    }
    try {
      const rollup = await service.rollUpOkr(okrId);
      res.json(rollup);
    } catch (e: any) {
      console.error(`[okr-rollup] GET rollup for OKR ${okrId} failed:`, e?.message ?? e);
      res.status(500).json({ error: e?.message ?? "rollup failed" });
    }
  });

  router.post(
    "/api/okrs/:okrId/key-results/:krId/contributions",
    express.json(),
    async (req: Request, res: Response) => {
      const okrId = idParam(req.params.okrId);
      const keyResultId = idParam(req.params.krId);
      if (okrId === null || keyResultId === null) {
        res.status(400).json({ error: "okrId and krId must be non-empty strings" });
        return;
      }
      const parsed = contributionBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "invalid body", details: parsed.error.flatten() });
        return;
      }
      try {
        const saved = await deps.upsertContribution({
          okrId,
          keyResultId,
          entityType: parsed.data.entityType,
          entityId: parsed.data.entityId,
          contributionPct: parsed.data.contributionPct,
          inferredBy: "human", // human rows win over agent-inferred rows
          confidence: 1,
        });
        // Recompute so the caller sees the effect of the override immediately.
        const rollup = await service.rollUpKeyResult(keyResultId);
        res.status(201).json({ contribution: saved, rollup });
      } catch (e: any) {
        console.error(`[okr-rollup] POST contribution for KR ${keyResultId} failed:`, e?.message ?? e);
        res.status(500).json({ error: e?.message ?? "contribution upsert failed" });
      }
    },
  );

  return router;
}

export default initOkrRollupRoutes;
