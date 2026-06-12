/**
 * OutcomeTracker — the §3 learning loop.
 * (kyndryl-connector docs/GROUNDING_AND_HALLUCINATION.md)
 *
 * Agents store predictions ("value at risk", "forecast EAC") — this closes the loop:
 *  - recordPrediction()  when a forecast-like finding is emitted
 *  - resolveOutcomes()   when projects close / dueAt passes: join prediction → realized
 *                        value, compute accuracy, store it
 *  - getAgentAccuracy()  rolling accuracy per agent (+ optional finding type)
 *  - weightConfidence()  scale a finding's base confidence by the agent's track record
 *
 * Result: "this agent's calls have been X% accurate over the last N closed items" —
 * provable learning, not just memory.
 */

import { storage } from "../../storage";
import type { AgentPrediction } from "@shared/schema";

export interface PredictionInput {
  agentId: string;
  findingType: string;
  projectId?: string;
  entityId?: string;
  entityType?: string;
  /** The forecast payload, e.g. { metric: "eac", value: 4200000 } or { raw: "$2.5M value at risk", amount: 2500000 }. */
  predictedValue: Record<string, unknown>;
  /** When the prediction should be resolvable (defaults to 90 days out). */
  dueAt?: Date;
}

const DEFAULT_HORIZON_DAYS = 90;
/** Below this many resolved predictions, accuracy is not considered statistically meaningful. */
const MIN_SAMPLES_FOR_WEIGHTING = 3;

const CLOSED_PROJECT_STATUSES = new Set(["completed", "closed", "done", "cancelled", "complete"]);

function numericAccuracy(predicted: number, actual: number): number {
  const denom = Math.max(Math.abs(actual), 1);
  return Math.max(0, 1 - Math.abs(predicted - actual) / denom);
}

function extractNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[$,%\s]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["value", "amount", "eac", "predicted"]) {
      const n = extractNumber(obj[key]);
      if (n !== undefined) return n;
    }
  }
  return undefined;
}

export class OutcomeTracker {
  /** Store a forecast so it can later be compared to what actually happened. Best-effort by design. */
  async recordPrediction(input: PredictionInput): Promise<AgentPrediction | undefined> {
    try {
      const dueAt = input.dueAt ?? new Date(Date.now() + DEFAULT_HORIZON_DAYS * 24 * 60 * 60 * 1000);
      return await storage.createAgentPrediction({
        agentId: input.agentId,
        findingType: input.findingType,
        projectId: input.projectId ?? null,
        entityId: input.entityId ?? null,
        entityType: input.entityType ?? null,
        predictedValue: input.predictedValue,
        dueAt,
      });
    } catch (err) {
      // Outcome tracking must never break the insight path.
      console.warn("[OutcomeTracker] failed to record prediction:", err);
      return undefined;
    }
  }

  /**
   * Join open predictions to realized values. A prediction is resolvable when its
   * target project has closed or its dueAt horizon has passed. Accuracy:
   *  - numeric forecasts (e.g. EAC): 1 - |predicted - actual| / max(|actual|, 1), floored at 0
   *  - categorical forecasts (e.g. status): exact match → 1, else 0
   */
  async resolveOutcomes(): Promise<{ checked: number; resolved: number }> {
    const open = await storage.getOpenAgentPredictions();
    const now = Date.now();
    let resolved = 0;

    for (const prediction of open) {
      try {
        const project = prediction.projectId ? await storage.getProject(prediction.projectId) : undefined;
        const projectClosed = !!project?.status && CLOSED_PROJECT_STATUSES.has(project.status.toLowerCase());
        const horizonPassed = !!prediction.dueAt && new Date(prediction.dueAt).getTime() <= now;
        if (!projectClosed && !horizonPassed) continue;

        const outcome = this.realizeOutcome(prediction, project);
        if (!outcome) continue; // nothing realizable yet — leave open

        await storage.resolveAgentPrediction(prediction.id, outcome.actualValue, outcome.accuracy);
        resolved++;
      } catch (err) {
        console.warn(`[OutcomeTracker] failed to resolve prediction ${prediction.id}:`, err);
      }
    }
    return { checked: open.length, resolved };
  }

  private realizeOutcome(
    prediction: AgentPrediction,
    project?: Awaited<ReturnType<typeof storage.getProject>>,
  ): { actualValue: Record<string, unknown>; accuracy: number } | undefined {
    const predicted = (prediction.predictedValue ?? {}) as Record<string, unknown>;

    // EAC / cost forecasts → compare to realized estimate-at-completion (or actual cost at close).
    if (/eac|cost|value_at_risk|budget/i.test(prediction.findingType)) {
      const actual =
        project?.estimateAtCompletion ??
        (project?.actualCost != null ? parseFloat(String(project.actualCost).replace(/[$,]/g, "")) : undefined);
      const predictedNum = extractNumber(predicted);
      if (actual == null || !Number.isFinite(actual) || predictedNum === undefined) return undefined;
      return {
        actualValue: { metric: "eac", value: actual, source: "postgres:projects" },
        accuracy: numericAccuracy(predictedNum, actual),
      };
    }

    // Status / health forecasts → exact categorical match against realized project status.
    if (/status|health|overdue|risk_call/i.test(prediction.findingType)) {
      if (!project?.status) return undefined;
      const predictedStatus = String(predicted.status ?? predicted.value ?? "").toLowerCase();
      if (!predictedStatus) return undefined;
      return {
        actualValue: { metric: "status", value: project.status, source: "postgres:projects" },
        accuracy: predictedStatus === project.status.toLowerCase() ? 1 : 0,
      };
    }

    // Generic numeric prediction with a realized progress percentage as a proxy.
    const predictedNum = extractNumber(predicted);
    const actualNum = project?.progressPercentage ?? project?.progress ?? undefined;
    if (predictedNum !== undefined && actualNum != null && /progress|completion/i.test(prediction.findingType)) {
      return {
        actualValue: { metric: "progress", value: actualNum, source: "postgres:projects" },
        accuracy: numericAccuracy(predictedNum, actualNum),
      };
    }

    return undefined;
  }

  /** Rolling accuracy: mean accuracy over the agent's resolved predictions (optionally per finding type). */
  async getAgentAccuracy(
    agentId: string,
    findingType?: string,
  ): Promise<{ accuracy: number | null; sampleSize: number }> {
    try {
      const predictions = await storage.getAgentPredictions(agentId, findingType);
      const scored = predictions.filter((p) => p.resolvedAt != null && p.accuracy != null);
      if (scored.length === 0) return { accuracy: null, sampleSize: 0 };
      const sum = scored.reduce((acc, p) => acc + (p.accuracy ?? 0), 0);
      return { accuracy: sum / scored.length, sampleSize: scored.length };
    } catch (err) {
      console.warn("[OutcomeTracker] failed to compute agent accuracy:", err);
      return { accuracy: null, sampleSize: 0 };
    }
  }

  /**
   * Weight a finding's base confidence by the agent's historical accuracy for this
   * finding type. With no (or too little) track record the base confidence passes
   * through unchanged; an agent that has been right gets boosted, one that has been
   * wrong gets damped. Result clamped to [0, 1].
   */
  async weightConfidence(agentId: string, findingType: string, baseConfidence: number): Promise<number> {
    let { accuracy, sampleSize } = await this.getAgentAccuracy(agentId, findingType);
    if (accuracy === null || sampleSize < MIN_SAMPLES_FOR_WEIGHTING) {
      // Fall back to the agent's overall track record across finding types.
      ({ accuracy, sampleSize } = await this.getAgentAccuracy(agentId));
      if (accuracy === null || sampleSize < MIN_SAMPLES_FOR_WEIGHTING) return baseConfidence;
    }
    // accuracy 0.5 → neutral; 1.0 → +50%; 0.0 → -50%.
    const weighted = baseConfidence * (0.5 + accuracy);
    return Math.min(1, Math.max(0, weighted));
  }
}

export const outcomeTracker = new OutcomeTracker();
