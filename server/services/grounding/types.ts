/**
 * Grounding layer — two-channel output contract.
 *
 * See kyndryl-connector docs/GROUNDING_AND_HALLUCINATION.md §2:
 *  - `metrics{}`   are COMPUTED (deterministic code over source data) — never from the LLM.
 *  - `narrative{}` is the LLM channel — it explains/prioritizes the metrics, it does not invent numbers.
 *  - `evidence[]`  cites the concrete entities/metrics a finding rests on. No evidence → not published.
 *  - `validation{}` records the result of the post-generation checks (entity existence,
 *    hard constraints, contradiction reconciliation, confidence gate).
 */

/** A computed metric value. `computedBy` names the code path (formula) that produced it. */
export interface MetricValue {
  value: number | string;
  /** Where the underlying data came from (e.g. "postgres:projects", "palantir:ontology"). */
  source: string;
  /** The function/module that computed the value — formulas live in code, not in the LLM. */
  computedBy: string;
}

/** A citation linking a finding to a real entity (and optionally a specific metric on it). */
export interface EvidenceRef {
  entityId: string;
  entityType: string;
  metric?: string;
  value?: number | string;
}

/** The LLM channel: free text that explains the computed metrics. */
export interface FindingNarrative {
  summary: string;
  explanation: string;
  recommendation?: string;
}

export type ValidationStatus = "published" | "flagged" | "rejected" | "abstained";

export interface EntityCheck {
  entityId: string;
  entityType: string;
  resolved: boolean;
  detail?: string;
}

export interface ConstraintCheck {
  /** Name of the hard bound, e.g. "eac>=ac", "delay<=remaining-duration", "allocation<=capacity". */
  constraint: string;
  passed: boolean;
  /** True when the offending value was clipped to the bound rather than the finding rejected. */
  clipped?: boolean;
  detail?: string;
}

export interface FindingValidation {
  entityChecks: EntityCheck[];
  constraintChecks: ConstraintCheck[];
  status: ValidationStatus;
  reasons: string[];
}

/** The two-channel grounded finding every narrative-layer output must conform to. */
export interface GroundedFinding {
  /** Optional stable id (used by the cross-agent contradiction check to reference findings). */
  id?: string;
  /** Computed channel — deterministic, never produced by the LLM. */
  metrics: Record<string, MetricValue>;
  /** LLM channel — explains/prioritizes the metrics. */
  narrative: FindingNarrative;
  /** Citations to real entities. Empty evidence ⇒ the finding is not published. */
  evidence: EvidenceRef[];
  /** 0..1 confidence; gated by the validator (below threshold ⇒ abstain). */
  confidence: number;
  agentId: string;
  findingType: string;
  projectId?: string;
  validation: FindingValidation;
}

/**
 * An extensible hard-bound rule evaluated by GroundingValidator.validateConstraints.
 * Rules may clip metric values in place (returning clipped: true) or fail the finding.
 */
export interface ConstraintRule {
  name: string;
  check(finding: GroundedFinding, ctx: ConstraintContext): Promise<ConstraintCheck | null> | ConstraintCheck | null;
}

/** Data handed to constraint rules so they can validate against reality. */
export interface ConstraintContext {
  /** The project the finding targets, when resolvable (carries the EVM fields). */
  project?: import("@shared/schema").Project;
}
