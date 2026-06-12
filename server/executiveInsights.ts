import { callLLM } from './lib/OpenRouterClient.js';
import { z } from "zod";
import { storage } from "./storage";
import { groundingValidator } from "./services/grounding/GroundingValidator";
import { outcomeTracker } from "./services/grounding/OutcomeTracker";
import type {
  GroundedFinding,
  MetricValue,
  EvidenceRef,
  FindingNarrative,
  FindingValidation,
} from "./services/grounding/types";

// All Claude calls now route through OpenRouter for cost optimization
//
// GROUNDING (docs/GROUNDING_AND_HALLUCINATION.md): the LLM output is routed through
// the grounding validation layer. Computed numbers live in `metrics{}` (never from
// the LLM), the LLM text lives in `narrative{}`, every insight carries `evidence[]`
// citations to real entities, and `validation{}` records the entity/constraint
// checks + confidence gate. The legacy response shape is preserved; the grounded
// channels are ADDED alongside it.

const ExecutiveInsightSchema = z.object({
  headline: z.string().min(10),
  portfolioHealth: z.enum(['green', 'amber', 'red']),
  healthSummary: z.string().min(20),
  keyRisks: z.array(z.object({
    title: z.string(),
    impact: z.string(),
    mitigation: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    linkedEntity: z.string().optional()
  })).min(1).max(5),
  opportunities: z.array(z.object({
    title: z.string(),
    potentialValue: z.string(),
    action: z.string(),
    linkedEntity: z.string().optional()
  })).min(1).max(4),
  recommendations: z.array(z.object({
    action: z.string(),
    rationale: z.string(),
    priority: z.enum(['urgent', 'high', 'medium']),
    actionRef: z.string().optional()
  })).min(1).max(4),
  kpiHighlights: z.array(z.object({
    name: z.string(),
    status: z.enum(['on-track', 'at-risk', 'off-track']),
    delta: z.string()
  })).min(1).max(6)
});

interface ExecutiveInsight {
  headline: string;
  portfolioHealth: 'green' | 'amber' | 'red';
  healthSummary: string;
  keyRisks: Array<{
    title: string;
    impact: string;
    mitigation: string;
    severity: 'high' | 'medium' | 'low';
    linkedEntity?: string;
  }>;
  opportunities: Array<{
    title: string;
    potentialValue: string;
    action: string;
    linkedEntity?: string;
  }>;
  recommendations: Array<{
    action: string;
    rationale: string;
    priority: 'urgent' | 'high' | 'medium';
    actionRef?: string;
  }>;
  kpiHighlights: Array<{
    name: string;
    status: 'on-track' | 'at-risk' | 'off-track';
    delta: string;
  }>;
  generatedAt: string;
  // ---- Grounded two-channel additions (backward-compatible; legacy fields above are kept) ----
  /** Computed channel: deterministic metrics — never produced by the LLM. */
  metrics?: Record<string, MetricValue>;
  /** LLM channel: explains/prioritizes the computed metrics. */
  narrative?: FindingNarrative;
  /** Citations to the real entities this insight is based on. */
  evidence?: EvidenceRef[];
  /** Outcome-weighted confidence (0..1). */
  confidence?: number;
  /** Result of the grounding validation layer (entity checks, constraints, status). */
  validation?: FindingValidation;
}

let cachedInsight: ExecutiveInsight | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

interface ComputedPortfolioContext {
  contextText: string;
  /** Deterministic metrics computed in code from source data — the metrics{} channel. */
  metrics: Record<string, MetricValue>;
  /** Evidence citations for the entities the computed metrics rest on. */
  evidence: EvidenceRef[];
  /** name (lowercased) → entity ref, used to resolve LLM `linkedEntity` names to real ids. */
  entityByName: Map<string, { entityId: string; entityType: string }>;
}

async function buildExecutiveContext(): Promise<ComputedPortfolioContext> {
  const [
    strategicThemes,
    valueStreams,
    epics,
    arts,
    divisions,
    projects
  ] = await Promise.all([
    storage.getStrategicThemes(),
    storage.getValueStreams(),
    storage.getEpics(),
    storage.getArts(),
    storage.getDivisions(),
    storage.getProjects()
  ]);

  const allDivisionKpis: Array<{ divisionName: string; kpis: any[] }> = [];
  const allDivisionRisks: Array<{ divisionName: string; risks: any[] }> = [];
  
  for (const div of divisions.slice(0, 6)) {
    const [kpis, risks] = await Promise.all([
      storage.getDivisionKpis(div.id),
      storage.getDivisionRisks(div.id)
    ]);
    allDivisionKpis.push({ divisionName: div.name, kpis });
    allDivisionRisks.push({ divisionName: div.name, risks });
  }

  const atRiskEpics = epics.filter(e => e.status === 'at-risk' || e.status === 'red');
  const criticalRisks = allDivisionRisks.flatMap(d => 
    d.risks.filter(r => r.level === 'high' || r.level === 'critical')
  );

  const totalBudget = epics.reduce((sum, e) => sum + (Number(e.estimatedCost) || 0), 0);

  // ---- Computed channel: deterministic metrics (formulas in code, never from the LLM) ----
  const computedBy = "executiveInsights.buildExecutiveContext";
  const source = "postgres";
  const metrics: Record<string, MetricValue> = {
    totalPortfolioBudget: { value: totalBudget, source, computedBy },
    epicCount: { value: epics.length, source, computedBy },
    activeProjectCount: { value: projects.length, source, computedBy },
    atRiskEpicCount: { value: atRiskEpics.length, source, computedBy },
    onTrackEpicCount: {
      value: epics.filter(e => e.status === 'on-track' || e.status === 'green').length,
      source, computedBy,
    },
    criticalRiskCount: { value: criticalRisks.length, source, computedBy },
    atRiskBudget: {
      value: atRiskEpics.reduce((sum, e) => sum + (Number(e.estimatedCost) || 0), 0),
      source, computedBy,
    },
  };

  // ---- Evidence: cite the real entities the metrics rest on ----
  const evidence: EvidenceRef[] = atRiskEpics.slice(0, 10).map(e => ({
    entityId: e.id,
    entityType: "epic" as const,
    metric: "status",
    value: e.status ?? undefined,
  }));
  for (const theme of strategicThemes.slice(0, 5)) {
    evidence.push({ entityId: theme.id, entityType: "strategicTheme" });
  }

  // ---- Name → id index so LLM `linkedEntity` names can be resolved to real entities ----
  const entityByName = new Map<string, { entityId: string; entityType: string }>();
  for (const p of projects) entityByName.set(p.name.toLowerCase(), { entityId: p.id, entityType: "project" });
  for (const e of epics) entityByName.set(e.name.toLowerCase(), { entityId: e.id, entityType: "epic" });
  for (const vs of valueStreams) entityByName.set(vs.name.toLowerCase(), { entityId: vs.id, entityType: "valueStream" });
  for (const t of strategicThemes) entityByName.set(t.name.toLowerCase(), { entityId: t.id, entityType: "strategicTheme" });

  const contextText = `
NEXTERA ENERGY ENTERPRISE TRANSFORMATION PORTFOLIO EXECUTIVE SUMMARY
====================================================================
Data Source: PostgreSQL Database (Real-time)

PORTFOLIO FINANCIALS:
- Total Portfolio Budget: $${(totalBudget / 1000000).toFixed(1)}M across ${epics.length} epics
- Active Projects: ${projects.length}

STRATEGIC THEMES (${strategicThemes.length}):
${strategicThemes.map(t => `  • ${t.name}: ${t.budgetAllocation || 0}% budget allocation | Status: ${(t.status || 'active').toUpperCase()}`).join('\n')}

VALUE STREAMS (${valueStreams.length}):
${valueStreams.map(vs => `  • ${vs.name}: Type: ${vs.type || 'operational'} | Owner: ${vs.owner || 'TBD'} | Status: ${vs.status || 'active'}`).join('\n')}

PORTFOLIO EPICS STATUS:
- Total: ${epics.length} | On Track: ${epics.filter(e => e.status === 'on-track' || e.status === 'green').length} | At Risk: ${atRiskEpics.length}
${atRiskEpics.slice(0, 5).map(e => `  ⚠️ ${e.name}: $${((Number(e.estimatedCost) || 0) / 1000000).toFixed(1)}M | Status: ${e.status}`).join('\n')}

AGILE RELEASE TRAINS (${arts.length}):
${arts.map(art => `  • ${art.name}: ${art.teamCount || 0} teams | Velocity: ${art.velocity || 0} pts`).join('\n')}

BUSINESS SEGMENTS (SEC Reportable - from NEE 10-K):
${divisions.slice(0, 6).map(d => {
  const profit = d.profit2024 || 0;
  const formatted = profit >= 1000 ? `$${(profit/1000).toFixed(1)}B` : `$${profit}M`;
  return `  • ${d.name}: ${formatted} profit | ${(d.changePercent || 0) >= 0 ? '+' : ''}${d.changePercent || 0}% YoY`;
}).join('\n')}

DIVISION KPIs:
${allDivisionKpis.map(d => 
  `  ${d.divisionName}:\n${d.kpis.slice(0, 3).map(k => `    - ${k.name}: ${k.value2024 || 'N/A'} ${k.unit || ''} (Target: ${k.target2025 || 'N/A'})`).join('\n')}`
).join('\n')}

RISK REGISTER:
- Critical/High Risks: ${criticalRisks.length}
${criticalRisks.slice(0, 5).map(r => `  🔴 ${r.type}: ${r.description || 'No description'} | Mitigation: ${r.mitigation || 'Pending'}`).join('\n')}
`;

  return { contextText, metrics, evidence, entityByName };
}

const INSIGHT_AGENT_ID = "executive-insights-agent";
const INSIGHT_FINDING_TYPE = "executive_insight";

/** Parse "$2.5M", "$680M", "$1.2B", "$450K" style amounts from LLM text. */
function parseDollarAmount(text: string): number | undefined {
  const match = /\$\s*([\d,]+(?:\.\d+)?)\s*(B|M|K)?/i.exec(text);
  if (!match) return undefined;
  const base = parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(base)) return undefined;
  const mult = match[2]?.toUpperCase() === "B" ? 1e9 : match[2]?.toUpperCase() === "M" ? 1e6 : match[2]?.toUpperCase() === "K" ? 1e3 : 1;
  return base * mult;
}

/**
 * Route an LLM-generated insight through the grounding layer:
 * computed metrics → metrics{}, LLM text → narrative{}, entity references → evidence[],
 * outcome-weighted confidence + confidence gate, validation status attached.
 */
async function groundExecutiveInsight(
  insight: ExecutiveInsight,
  computed: ComputedPortfolioContext,
  baseConfidence: number,
): Promise<ExecutiveInsight> {
  // Evidence = the entities the computed metrics rest on + any LLM linkedEntity
  // names that resolve to REAL entities (unresolvable names are simply not cited;
  // the validator independently re-verifies every citation against storage).
  const evidence: EvidenceRef[] = [...computed.evidence];
  const referencedNames = [
    ...insight.keyRisks.map(r => r.linkedEntity),
    ...insight.opportunities.map(o => o.linkedEntity),
  ].filter((n): n is string => !!n);
  for (const name of referencedNames) {
    const ref = computed.entityByName.get(name.toLowerCase());
    if (ref && !evidence.some(e => e.entityId === ref.entityId)) {
      evidence.push({ entityId: ref.entityId, entityType: ref.entityType });
    }
  }

  const finding: GroundedFinding = {
    id: `exec-insight-${Date.now()}`,
    metrics: computed.metrics,
    narrative: {
      summary: insight.headline,
      explanation: insight.healthSummary,
      recommendation: insight.recommendations[0]?.action,
    },
    evidence,
    confidence: await outcomeTracker.weightConfidence(INSIGHT_AGENT_ID, INSIGHT_FINDING_TYPE, baseConfidence),
    agentId: INSIGHT_AGENT_ID,
    findingType: INSIGHT_FINDING_TYPE,
    validation: { entityChecks: [], constraintChecks: [], status: "published", reasons: [] },
  };

  await groundingValidator.groundFinding(finding);

  if (finding.validation.status !== "published") {
    // Flagged/abstained findings are logged and surfaced MARKED (validation.status
    // tells consumers not to present them as verified) — never silently as published.
    console.warn(
      `[ExecutiveInsights] insight not published (status=${finding.validation.status}):`,
      finding.validation.reasons.join("; "),
    );
  } else {
    // §3 outcome-tracking hook: store forecast-like statements (value-at-risk /
    // value-opportunity amounts) so resolveOutcomes() can later score them. Best-effort.
    for (const risk of insight.keyRisks) {
      const amount = parseDollarAmount(risk.impact);
      if (amount === undefined) continue;
      const ref = risk.linkedEntity ? computed.entityByName.get(risk.linkedEntity.toLowerCase()) : undefined;
      await outcomeTracker.recordPrediction({
        agentId: INSIGHT_AGENT_ID,
        findingType: "value_at_risk",
        projectId: ref?.entityType === "project" ? ref.entityId : undefined,
        entityId: ref?.entityId,
        entityType: ref?.entityType,
        predictedValue: { raw: risk.impact, amount, title: risk.title, severity: risk.severity },
      });
    }
    for (const opp of insight.opportunities) {
      const amount = parseDollarAmount(opp.potentialValue);
      if (amount === undefined) continue;
      const ref = opp.linkedEntity ? computed.entityByName.get(opp.linkedEntity.toLowerCase()) : undefined;
      await outcomeTracker.recordPrediction({
        agentId: INSIGHT_AGENT_ID,
        findingType: "value_opportunity",
        projectId: ref?.entityType === "project" ? ref.entityId : undefined,
        entityId: ref?.entityId,
        entityType: ref?.entityType,
        predictedValue: { raw: opp.potentialValue, amount, title: opp.title },
      });
    }
  }

  // Backward-compatible: legacy fields untouched, grounded channels added alongside.
  return {
    ...insight,
    metrics: finding.metrics,
    narrative: finding.narrative,
    evidence: finding.evidence,
    confidence: finding.confidence,
    validation: finding.validation,
  };
}

export async function generateExecutiveInsights(): Promise<ExecutiveInsight> {
  const now = Date.now();
  if (cachedInsight && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedInsight;
  }

  const computed = await buildExecutiveContext();
  const context = computed.contextText;

  const systemPrompt = `You are the Enterprise Transformation Intelligence Agent for the organization.

Your role is to provide executive-level insights that are:
1. ACTIONABLE - Every insight should lead to a clear decision or action
2. QUANTIFIED - Include specific numbers, percentages, and financial impacts
3. EVIDENCE-BASED - Reference specific projects, epics, or metrics from the data provided
4. STRATEGIC - Focus on portfolio-level outcomes, not operational details
5. ENERGY-INDUSTRY FOCUSED - Use utility/energy terminology (grid reliability, renewable capacity, regulatory compliance, storm hardening, customer operations)

GROUNDING RULES (mandatory):
- Only reference numbers that appear in the provided portfolio data. Do NOT invent metrics, percentages, or dollar amounts.
- Every linkedEntity must be the exact name of a project, epic, value stream, or strategic theme from the data.
- If the data is insufficient to support a claim, omit the claim rather than guessing.

Respond in valid JSON format only. Do not include any text outside the JSON object.`;

  const userPrompt = `Based on this portfolio data from the database, generate an executive insight report:

${context}

Generate a JSON response with this exact structure:
{
  "headline": "One impactful sentence summarizing the portfolio state",
  "portfolioHealth": "green" | "amber" | "red",
  "healthSummary": "2-3 sentence explanation of overall portfolio health",
  "keyRisks": [
    {
      "title": "Risk title",
      "impact": "Quantified impact (e.g., '$2.5M potential value leakage')",
      "mitigation": "Recommended mitigation action",
      "severity": "high" | "medium" | "low",
      "linkedEntity": "Related project or epic name"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity title",
      "potentialValue": "Quantified value (e.g., '$4M acceleration opportunity')",
      "action": "Specific action to capture value",
      "linkedEntity": "Related project or epic name"
    }
  ],
  "recommendations": [
    {
      "action": "Specific action for leadership",
      "rationale": "Why this matters now",
      "priority": "urgent" | "high" | "medium",
      "actionRef": "Reference like 'REVIEW_RISK:risk-id' or 'OPEN_PROJECT:project-id'"
    }
  ],
  "kpiHighlights": [
    {
      "name": "KPI name",
      "status": "on-track" | "at-risk" | "off-track",
      "delta": "Change indicator like '+5% vs target' or '-2% this month'"
    }
  ]
}

Provide exactly 3 key risks, 2-3 opportunities, 3 recommendations, and 4 KPI highlights.
Focus on energy industry issues: grid reliability, renewable development, storm resilience, regulatory compliance, customer satisfaction.`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, { maxTokens: 2000 });

    const cleanedJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedJson);
    
    const validated = ExecutiveInsightSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn('AI response validation failed:', validated.error.errors);
      throw new Error('Invalid AI response structure');
    }
    
    const insight: ExecutiveInsight = {
      ...validated.data,
      generatedAt: new Date().toISOString()
    };

    // Route the LLM output through the grounding validation layer (entity checks,
    // hard constraints, evidence enforcement, outcome-weighted confidence gate).
    const grounded = await groundExecutiveInsight(insight, computed, 0.85);

    cachedInsight = grounded;
    cacheTimestamp = Date.now();

    return grounded;
  } catch (error) {
    console.error('Failed to generate executive insights:', error);

    const fallback: ExecutiveInsight = {
      headline: "Enterprise portfolio on track with grid modernization and renewable expansion initiatives",
      portfolioHealth: 'amber',
      healthSummary: "The enterprise transformation portfolio is progressing with Regional Utility storm hardening and Renewables Division solar expansion as priority initiatives. Some areas require executive attention to maintain momentum ahead of hurricane season.",
      keyRisks: [
        {
          title: "Storm Hardening Timeline Risk",
          impact: "$45M potential storm damage exposure if not complete before hurricane season",
          mitigation: "Accelerate underground conversion in critical feeder corridors",
          severity: "high",
          linkedEntity: "Critical Infrastructure Program"
        },
        {
          title: "Solar Interconnection Queue Delays",
          impact: "2.1GW capacity at risk of missing 2025 COD targets",
          mitigation: "Engage FERC and regional grid operators on expedited review process",
          severity: "high",
          linkedEntity: "Strategic Capacity Expansion"
        },
        {
          title: "Smart Meter Integration Dependencies",
          impact: "$12M potential rework if billing system integration delayed",
          mitigation: "Establish dedicated integration team with Billing platform owners",
          severity: "medium",
          linkedEntity: "Customer Digital Experience Platform"
        }
      ],
      opportunities: [
        {
          title: "Accelerate Battery Storage Development",
          potentialValue: "$85M in IRA tax credits available for 2025 projects",
          action: "Fast-track 500MW Florida storage project approvals",
          linkedEntity: "Clean Energy Development"
        },
        {
          title: "Customer Self-Service Cost Reduction",
          potentialValue: "$18M annual call center savings with 75% digital adoption",
          action: "Approve expanded mobile app marketing campaign",
          linkedEntity: "Customer Digital Experience Platform"
        }
      ],
      recommendations: [
        {
          action: "Conduct pre-hurricane readiness review with Grid Operations",
          rationale: "Storm season begins June 1 - 85% hardening completion may leave gaps",
          priority: "urgent",
          actionRef: "REVIEW_PROJECT:storm-hardening"
        },
        {
          action: "Escalate interconnection delays to regulatory affairs",
          rationale: "Queue position risk affecting $680M in project capital",
          priority: "high",
          actionRef: "REVIEW_RISK:interconnection-delay"
        },
        {
          action: "Approve Q2 customer experience enhancement budget",
          rationale: "J.D. Power ranking opportunity with 62% current digital adoption",
          priority: "high",
          actionRef: "OPEN_PROJECT:customer-digital"
        }
      ],
      kpiHighlights: [
        { name: "Grid Reliability (SAIDI)", status: "on-track", delta: "-11% vs prior year" },
        { name: "Renewable Capacity Added", status: "at-risk", delta: "73% of annual target" },
        { name: "Customer Satisfaction", status: "on-track", delta: "#2 J.D. Power ranking" },
        { name: "Storm Hardening Progress", status: "at-risk", delta: "85% complete, 15% at risk" }
      ],
      generatedAt: new Date().toISOString()
    };

    // The static fallback is NOT LLM-grounded narrative — attach the real computed
    // metrics but mark it flagged with low confidence so consumers never present it
    // as a verified, published finding.
    return {
      ...fallback,
      metrics: computed.metrics,
      narrative: {
        summary: fallback.headline,
        explanation: fallback.healthSummary,
        recommendation: fallback.recommendations[0]?.action,
      },
      evidence: computed.evidence,
      confidence: 0.2,
      validation: {
        entityChecks: [],
        constraintChecks: [],
        status: "flagged",
        reasons: ["LLM generation failed — static fallback content, not validated against live data"],
      },
    };
  }
}

export function clearInsightsCache(): void {
  cachedInsight = null;
  cacheTimestamp = 0;
}

export async function refreshInsights(): Promise<ExecutiveInsight> {
  clearInsightsCache();
  return generateExecutiveInsights();
}
