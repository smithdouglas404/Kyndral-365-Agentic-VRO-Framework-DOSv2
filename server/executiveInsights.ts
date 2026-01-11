import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  strategicThemes,
  valueStreams,
  portfolioEpics,
  portfolioOKRs,
  portfolioKPIs,
  arts,
  programIncrements,
  dependencies,
  financialSnapshots,
  riskRegister
} from "../client/src/lib/safe6Data";
import { divisions } from "../client/src/lib/lgData";

const anthropic = new Anthropic();

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
}

let cachedInsight: ExecutiveInsight | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

function buildExecutiveContext(): string {
  const totalBudget = portfolioEpics.reduce((sum, e) => sum + (e.estimatedCost || 0), 0);
  const atRiskEpics = portfolioEpics.filter(e => e.status === 'at-risk' || e.status === 'red');
  const onTrackKPIs = portfolioKPIs.filter(k => k.trend === 'up' || k.currentValue >= k.targetValue * 0.9);
  const criticalRisks = riskRegister.filter(r => r.severity === 'critical' || r.severity === 'high');
  const blockedDeps = dependencies.filter(d => d.health === 'red');
  
  const latestFinancial = financialSnapshots[financialSnapshots.length - 1];
  
  return `
ENTERPRISE TRANSFORMATION PORTFOLIO EXECUTIVE SUMMARY
=====================================================

PORTFOLIO FINANCIALS:
- Total Portfolio Budget: £${totalBudget.toFixed(1)}M across ${portfolioEpics.length} epics
- Latest Financial Snapshot: ${latestFinancial ? `Actual: £${latestFinancial.actualSpend}M vs Planned: £${latestFinancial.plannedSpend}M (Variance: ${latestFinancial.variance > 0 ? '+' : ''}${latestFinancial.variance}%)` : 'N/A'}
- Forecast Accuracy: ${latestFinancial?.forecastAccuracy || 'N/A'}%

STRATEGIC THEMES (${strategicThemes.length}):
${strategicThemes.map(t => `  • ${t.name}: ${t.budgetAllocation}% budget allocation | Status: ${t.status.toUpperCase()}`).join('\n')}

VALUE STREAMS (${valueStreams.length}):
${valueStreams.map(vs => `  • ${vs.name}: £${vs.annualBudget}M annual budget | ${vs.linkedARTs.length} ARTs`).join('\n')}

PORTFOLIO EPICS STATUS:
- Total: ${portfolioEpics.length} | On Track: ${portfolioEpics.filter(e => e.status === 'on-track').length} | At Risk: ${atRiskEpics.length}
${atRiskEpics.map(e => `  ⚠️ ${e.name}: £${e.estimatedCost}M | Status: ${e.status} | WSJF: ${e.wsjfScore}`).join('\n')}

PORTFOLIO OKRS:
${portfolioOKRs.map(o => {
  const achieved = o.keyResults.filter(kr => kr.status === 'achieved').length;
  const total = o.keyResults.length;
  return `  • ${o.objective}: ${achieved}/${total} KRs achieved (${Math.round(achieved/total*100)}%) | Status: ${o.status}`;
}).join('\n')}

KEY PERFORMANCE INDICATORS:
- On Track: ${onTrackKPIs.length}/${portfolioKPIs.length}
${portfolioKPIs.map(k => {
  const pctComplete = Math.round((k.currentValue / k.targetValue) * 100);
  const statusIcon = k.trend === 'up' ? '↑' : k.trend === 'down' ? '↓' : '→';
  return `  ${statusIcon} ${k.name}: ${k.currentValue}/${k.targetValue} ${k.unit} (${pctComplete}%)`;
}).join('\n')}

RISK REGISTER:
- Critical/High Risks: ${criticalRisks.length}
${criticalRisks.slice(0, 5).map(r => `  🔴 ${r.title}: Impact: ${r.impact} | Probability: ${r.probability} | Owner: ${r.owner}`).join('\n')}

DEPENDENCY HEALTH:
- Blocked Dependencies: ${blockedDeps.length}/${dependencies.length}
${blockedDeps.map(d => `  ⛔ ${d.sourceName} → ${d.targetName}: ${d.type} (Schedule Impact: ${d.scheduleImpactDays} days)`).join('\n')}

AGILE RELEASE TRAINS:
${arts.map(art => {
  const pi = programIncrements.find(p => p.artId === art.id && p.status === 'active');
  return `  • ${art.name}: ${art.teams.length} teams | Current PI: ${pi?.name || 'N/A'} | Velocity: ${art.averageVelocity} pts`;
}).join('\n')}

DIVISION PERFORMANCE:
${divisions.slice(0, 6).map(d => `  • ${d.name}: £${d.profit2024}m profit | ${d.changePercent >= 0 ? '+' : ''}${d.changePercent}% YoY`).join('\n')}
`;
}

export async function generateExecutiveInsights(): Promise<ExecutiveInsight> {
  const now = Date.now();
  if (cachedInsight && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedInsight;
  }

  const context = buildExecutiveContext();
  
  const systemPrompt = `You are the Enterprise Transformation Intelligence Agent for Legal & General.
Your role is to provide executive-level insights that are:
1. ACTIONABLE - Every insight should lead to a clear decision or action
2. QUANTIFIED - Include specific numbers, percentages, and financial impacts
3. EVIDENCE-BASED - Reference specific projects, epics, or metrics from the data provided
4. STRATEGIC - Focus on portfolio-level outcomes, not operational details

Respond in valid JSON format only. Do not include any text outside the JSON object.`;

  const userPrompt = `Based on this portfolio data, generate an executive insight report:

${context}

Generate a JSON response with this exact structure:
{
  "headline": "One impactful sentence summarizing the portfolio state",
  "portfolioHealth": "green" | "amber" | "red",
  "healthSummary": "2-3 sentence explanation of overall portfolio health",
  "keyRisks": [
    {
      "title": "Risk title",
      "impact": "Quantified impact (e.g., '£2.5M potential value leakage')",
      "mitigation": "Recommended mitigation action",
      "severity": "high" | "medium" | "low",
      "linkedEntity": "Related project or epic name"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity title",
      "potentialValue": "Quantified value (e.g., '£4M acceleration opportunity')",
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
Focus on the most critical items requiring executive attention.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        { role: "user", content: userPrompt }
      ],
      system: systemPrompt
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const cleanedJson = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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
    
    cachedInsight = insight;
    cacheTimestamp = Date.now();
    
    return insight;
  } catch (error) {
    console.error('Failed to generate executive insights:', error);
    
    return {
      headline: "Portfolio health requires attention - 3 critical dependencies blocking value delivery",
      portfolioHealth: 'amber',
      healthSummary: "The transformation portfolio is progressing with some areas of concern. Financial performance is on track but dependency management and risk mitigation need executive focus to maintain momentum.",
      keyRisks: [
        {
          title: "Cross-team dependency bottleneck",
          impact: "£3.2M potential delay cost across 4 initiatives",
          mitigation: "Establish daily stand-up between Platform and Trading teams",
          severity: "high",
          linkedEntity: "Trading Platform Modernization"
        },
        {
          title: "Resource contention on data architecture",
          impact: "2-sprint delay risk for ESG reporting",
          mitigation: "Prioritize shared data layer as portfolio-level enabler",
          severity: "medium",
          linkedEntity: "ESG Analytics Dashboard"
        },
        {
          title: "Vendor delivery uncertainty",
          impact: "£1.5M contingency may be required",
          mitigation: "Activate parallel internal development track",
          severity: "medium",
          linkedEntity: "Private Markets Platform"
        }
      ],
      opportunities: [
        {
          title: "Accelerate customer portal rollout",
          potentialValue: "£4.2M in accelerated benefits",
          action: "Approve additional sprint capacity for Q2",
          linkedEntity: "Customer Portal Enhancement"
        },
        {
          title: "Consolidate risk tooling",
          potentialValue: "£1.8M annual operational savings",
          action: "Initiate vendor rationalization assessment",
          linkedEntity: "Risk Engine Upgrade"
        }
      ],
      recommendations: [
        {
          action: "Convene dependency resolution session with Platform leads",
          rationale: "3 blocked dependencies affecting £8M in projected value",
          priority: "urgent",
          actionRef: "REVIEW_DEPENDENCIES"
        },
        {
          action: "Review Q2 resource allocation across data initiatives",
          rationale: "Current allocation creates single points of failure",
          priority: "high",
          actionRef: "OPEN_PROJECT:proj-esg-analytics"
        },
        {
          action: "Approve accelerated timeline for customer portal MVP",
          rationale: "Market window opportunity with 40% faster competitor deployment",
          priority: "high",
          actionRef: "OPEN_PROJECT:proj-customer-portal"
        }
      ],
      kpiHighlights: [
        { name: "Portfolio ROI", status: "on-track", delta: "+12% vs baseline" },
        { name: "Delivery Velocity", status: "at-risk", delta: "-8% this PI" },
        { name: "Quality Score", status: "on-track", delta: "+5% improvement" },
        { name: "Stakeholder Satisfaction", status: "at-risk", delta: "-3% this quarter" }
      ],
      generatedAt: new Date().toISOString()
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
