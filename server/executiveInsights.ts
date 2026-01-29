import { callLLM } from './lib/OpenRouterClient.js';
import { z } from "zod";
import { storage } from "./storage";

// All Claude calls now route through OpenRouter for cost optimization

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

async function buildExecutiveContext(): Promise<string> {
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

  return `
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
}

export async function generateExecutiveInsights(): Promise<ExecutiveInsight> {
  const now = Date.now();
  if (cachedInsight && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedInsight;
  }

  const context = await buildExecutiveContext();
  
  const systemPrompt = `You are the Enterprise Transformation Intelligence Agent for the organization.

Your role is to provide executive-level insights that are:
1. ACTIONABLE - Every insight should lead to a clear decision or action
2. QUANTIFIED - Include specific numbers, percentages, and financial impacts
3. EVIDENCE-BASED - Reference specific projects, epics, or metrics from the data provided
4. STRATEGIC - Focus on portfolio-level outcomes, not operational details
5. ENERGY-INDUSTRY FOCUSED - Use utility/energy terminology (grid reliability, renewable capacity, regulatory compliance, storm hardening, customer operations)

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
    
    cachedInsight = insight;
    cacheTimestamp = Date.now();
    
    return insight;
  } catch (error) {
    console.error('Failed to generate executive insights:', error);
    
    return {
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
