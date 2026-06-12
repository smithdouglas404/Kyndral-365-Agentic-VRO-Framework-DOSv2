/**
 * GroundingValidator — the §2 validation layer around existing LLM calls.
 * (kyndryl-connector docs/GROUNDING_AND_HALLUCINATION.md)
 *
 * Runs after every LLM-generated finding:
 *  1. enforceEvidence       — no evidence citations ⇒ not published (flagged)
 *  2. validateEntities      — every cited entity id must resolve against real data; unresolved ⇒ dropped + flagged
 *  3. validateConstraints   — hard bounds (EAC ≥ AC, delay ≤ remaining duration, allocation ≤ capacity); clip or reject
 *  4. checkContradictions   — conflicting recommendations on the same entity from different agents ⇒ flagged
 *  5. applyConfidenceGate   — confidence below threshold ⇒ abstain ("insufficient data") instead of guessing
 *
 * No new infra: it only reads through the existing storage layer.
 */

import { storage } from "../../storage";
import type { Project } from "@shared/schema";
import type {
  GroundedFinding,
  EntityCheck,
  ConstraintCheck,
  ConstraintRule,
  ConstraintContext,
  ValidationStatus,
} from "./types";

const DEFAULT_CONFIDENCE_THRESHOLD = 0.4;

/** Status severity ordering: a worse status always wins when checks disagree. */
const STATUS_RANK: Record<ValidationStatus, number> = {
  published: 0,
  flagged: 1,
  abstained: 2,
  rejected: 3,
};

function escalate(current: ValidationStatus, next: ValidationStatus): ValidationStatus {
  return STATUS_RANK[next] > STATUS_RANK[current] ? next : current;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[$,%\s]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Opposing action keywords used by the cross-agent contradiction heuristic. */
const OPPOSING_ACTIONS: Array<[RegExp, RegExp]> = [
  [/\b(add|increase|expand|hire|scale up|grow)\b/i, /\b(remove|decrease|reduce|cut|freeze|scale down|shrink)\b/i],
  [/\b(accelerate|fast[- ]track|expedite|advance)\b/i, /\b(delay|defer|postpone|pause|hold)\b/i],
  [/\b(approve|fund|invest)\b/i, /\b(reject|defund|divest|cancel)\b/i],
  [/\b(start|launch|begin)\b/i, /\b(stop|halt|terminate|cancel)\b/i],
];

/**
 * Built-in hard-bound rules (extensible: pass extra rules to the constructor).
 * Implemented against the data the schema supports today — projects carry EVM fields
 * (estimateAtCompletion, actualCost, budgetAtCompletion) and timelineElapsed/timelineTotal.
 */
const BUILTIN_RULES: ConstraintRule[] = [
  {
    // EAC can never be below cost already incurred. Clip violating metrics to AC.
    name: "eac>=ac",
    check(finding, ctx): ConstraintCheck | null {
      const ac = asNumber(ctx.project?.actualCost);
      if (ac === undefined) return null; // no data → rule not applicable
      let violated = false;
      for (const [key, metric] of Object.entries(finding.metrics)) {
        if (!/(^|[._-])eac\b|estimateAtCompletion/i.test(key)) continue;
        const val = asNumber(metric.value);
        if (val !== undefined && val < ac) {
          violated = true;
          metric.value = ac; // clip to the floor
        }
      }
      return violated
        ? { constraint: "eac>=ac", passed: false, clipped: true, detail: `EAC below actual cost ${ac}; clipped to AC` }
        : { constraint: "eac>=ac", passed: true };
    },
  },
  {
    // A forecast delay cannot exceed the remaining planned duration.
    name: "delay<=remaining-duration",
    check(finding, ctx): ConstraintCheck | null {
      const p = ctx.project;
      if (!p || p.timelineTotal == null || p.timelineElapsed == null) return null;
      const remaining = Math.max(0, p.timelineTotal - p.timelineElapsed);
      let violated = false;
      for (const [key, metric] of Object.entries(finding.metrics)) {
        if (!/delay|slip/i.test(key)) continue;
        const val = asNumber(metric.value);
        if (val !== undefined && val > remaining) {
          violated = true;
          metric.value = remaining; // clip to remaining duration
        }
      }
      return violated
        ? {
            constraint: "delay<=remaining-duration",
            passed: false,
            clipped: true,
            detail: `delay exceeded remaining duration (${remaining}); clipped`,
          }
        : { constraint: "delay<=remaining-duration", passed: true };
    },
  },
  {
    // Allocation can never exceed capacity (expressed as a percentage metric).
    name: "allocation<=capacity",
    check(finding): ConstraintCheck | null {
      let applicable = false;
      let violated = false;
      for (const [key, metric] of Object.entries(finding.metrics)) {
        if (!/allocation|utilization/i.test(key)) continue;
        applicable = true;
        const val = asNumber(metric.value);
        if (val !== undefined && val > 100) {
          violated = true;
          metric.value = 100; // capacity ceiling: 100%
        }
      }
      if (!applicable) return null;
      return violated
        ? { constraint: "allocation<=capacity", passed: false, clipped: true, detail: "allocation above 100% capacity; clipped" }
        : { constraint: "allocation<=capacity", passed: true };
    },
  },
];

export class GroundingValidator {
  private rules: ConstraintRule[];
  private confidenceThreshold: number;

  constructor(opts?: { extraRules?: ConstraintRule[]; confidenceThreshold?: number }) {
    this.rules = [...BUILTIN_RULES, ...(opts?.extraRules ?? [])];
    this.confidenceThreshold = opts?.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
  }

  /**
   * Resolve every evidence.entityId against real data via the storage layer.
   * Unresolved evidence is dropped from the finding and the finding is flagged.
   */
  async validateEntities(finding: GroundedFinding): Promise<EntityCheck[]> {
    const checks: EntityCheck[] = [];
    const resolvedEvidence: GroundedFinding["evidence"] = [];

    for (const ev of finding.evidence) {
      const resolved = await this.resolveEntity(ev.entityId, ev.entityType, finding.projectId);
      checks.push({
        entityId: ev.entityId,
        entityType: ev.entityType,
        resolved,
        detail: resolved ? undefined : `no ${ev.entityType} with id ${ev.entityId} in source data`,
      });
      if (resolved) resolvedEvidence.push(ev);
    }

    const dropped = finding.evidence.length - resolvedEvidence.length;
    finding.evidence = resolvedEvidence;
    if (dropped > 0) {
      finding.validation.status = escalate(finding.validation.status, "flagged");
      finding.validation.reasons.push(`${dropped} evidence citation(s) referenced entities that do not exist; dropped`);
    }
    finding.validation.entityChecks = checks;
    return checks;
  }

  private async resolveEntity(entityId: string, entityType: string, projectId?: string): Promise<boolean> {
    try {
      switch (entityType) {
        case "project":
          return !!(await storage.getProject(entityId));
        case "epic": {
          const epics = await storage.getEpics();
          return epics.some((e) => e.id === entityId);
        }
        case "feature": {
          if (!projectId) return false;
          const features = await storage.getFeatures(projectId);
          return features.some((f) => f.id === entityId);
        }
        case "story": {
          if (!projectId) return false;
          const stories = await storage.getStoriesByProject(projectId);
          return stories.some((s) => s.id === entityId);
        }
        case "task": {
          if (!projectId) return false;
          const tasks = await storage.getTasksByProject(projectId);
          return tasks.some((t) => t.id === entityId);
        }
        case "risk": {
          if (!projectId) return false;
          const risks = await storage.getRisks(projectId);
          return risks.some((r) => r.id === entityId);
        }
        case "valueStream": {
          const vss = await storage.getValueStreams();
          return vss.some((v) => v.id === entityId);
        }
        case "strategicTheme": {
          const themes = await storage.getStrategicThemes();
          return themes.some((t) => t.id === entityId);
        }
        case "division": {
          const divisions = await storage.getDivisions();
          return divisions.some((d) => d.id === entityId);
        }
        default:
          // Unknown entity type — cannot ground it, treat as unresolved.
          return false;
      }
    } catch (err) {
      console.warn(`[Grounding] entity resolution error for ${entityType}:${entityId}:`, err);
      return false;
    }
  }

  /**
   * Validate the finding's metrics against hard bounds. Violations are clipped
   * (recorded with clipped: true) where a safe bound exists, otherwise the finding is rejected.
   */
  async validateConstraints(finding: GroundedFinding): Promise<ConstraintCheck[]> {
    const ctx: ConstraintContext = {};
    if (finding.projectId) {
      try {
        ctx.project = (await storage.getProject(finding.projectId)) as Project | undefined;
      } catch {
        /* constraint rules treat missing project data as not-applicable */
      }
    }

    const checks: ConstraintCheck[] = [];
    for (const rule of this.rules) {
      try {
        const result = await rule.check(finding, ctx);
        if (!result) continue; // rule not applicable to this finding's data
        checks.push(result);
        if (!result.passed) {
          if (result.clipped) {
            finding.validation.status = escalate(finding.validation.status, "flagged");
            finding.validation.reasons.push(`constraint ${result.constraint} violated; value clipped (${result.detail ?? ""})`);
          } else {
            finding.validation.status = escalate(finding.validation.status, "rejected");
            finding.validation.reasons.push(`constraint ${result.constraint} violated; finding rejected (${result.detail ?? ""})`);
          }
        }
      } catch (err) {
        console.warn(`[Grounding] constraint rule ${rule.name} errored:`, err);
      }
    }
    finding.validation.constraintChecks = checks;
    return checks;
  }

  /**
   * Cross-agent reconciliation pass: flag findings from DIFFERENT agents whose
   * recommendations take opposing actions on the SAME entity. Both findings are
   * flagged and each records the other's finding id.
   */
  checkContradictions(findings: GroundedFinding[]): GroundedFinding[] {
    const flagged: GroundedFinding[] = [];
    for (let i = 0; i < findings.length; i++) {
      for (let j = i + 1; j < findings.length; j++) {
        const a = findings[i];
        const b = findings[j];
        if (a.agentId === b.agentId) continue;

        const aEntities = new Set([...a.evidence.map((e) => e.entityId), ...(a.projectId ? [a.projectId] : [])]);
        const shared = [...b.evidence.map((e) => e.entityId), ...(b.projectId ? [b.projectId] : [])].filter((id) =>
          aEntities.has(id),
        );
        if (shared.length === 0) continue;

        const aText = `${a.narrative.recommendation ?? ""} ${a.narrative.summary}`;
        const bText = `${b.narrative.recommendation ?? ""} ${b.narrative.summary}`;
        const opposed = OPPOSING_ACTIONS.some(
          ([pos, neg]) => (pos.test(aText) && neg.test(bText)) || (neg.test(aText) && pos.test(bText)),
        );
        if (!opposed) continue;

        for (const [f, other] of [[a, b], [b, a]] as const) {
          f.validation.status = escalate(f.validation.status, "flagged");
          f.validation.reasons.push(
            `contradicts finding ${other.id ?? "(unidentified)"} from agent ${other.agentId} on entity ${shared[0]}`,
          );
          if (!flagged.includes(f)) flagged.push(f);
        }
      }
    }
    return flagged;
  }

  /** No evidence ⇒ the finding cannot be published (doc §2: "No evidence → not published"). */
  enforceEvidence(finding: GroundedFinding): GroundedFinding {
    if (finding.evidence.length === 0) {
      finding.validation.status = escalate(finding.validation.status, "flagged");
      finding.validation.reasons.push("no evidence citations — finding not published");
    }
    return finding;
  }

  /** Below the confidence threshold the agent abstains ("insufficient data") instead of guessing. */
  applyConfidenceGate(finding: GroundedFinding, threshold?: number): GroundedFinding {
    const t = threshold ?? this.confidenceThreshold;
    if (finding.confidence < t) {
      finding.validation.status = escalate(finding.validation.status, "abstained");
      finding.validation.reasons.push(
        `insufficient data: confidence ${finding.confidence.toFixed(2)} below threshold ${t.toFixed(2)}`,
      );
    }
    return finding;
  }

  /**
   * Single entry point — runs all checks in doc priority order and returns the
   * finding with `validation` filled in. Pass `openFindings` to also run the
   * cross-agent contradiction pass against currently open findings.
   */
  async groundFinding(
    finding: GroundedFinding,
    openFindings?: GroundedFinding[],
    opts?: { confidenceThreshold?: number },
  ): Promise<GroundedFinding> {
    finding.validation ??= { entityChecks: [], constraintChecks: [], status: "published", reasons: [] };
    finding.validation.status = "published";
    finding.validation.reasons = [];

    this.enforceEvidence(finding);
    await this.validateEntities(finding);
    // Re-run evidence enforcement: dropping unresolved entities may have emptied the list.
    this.enforceEvidence(finding);
    await this.validateConstraints(finding);
    if (openFindings?.length) {
      this.checkContradictions([finding, ...openFindings]);
    }
    this.applyConfidenceGate(finding, opts?.confidenceThreshold);

    // De-duplicate reasons accumulated across passes.
    finding.validation.reasons = [...new Set(finding.validation.reasons)];
    return finding;
  }
}

export const groundingValidator = new GroundingValidator();
