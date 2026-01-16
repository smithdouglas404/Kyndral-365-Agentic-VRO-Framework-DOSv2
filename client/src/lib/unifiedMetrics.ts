import { pmoProjects, vroPrograms, type SAFePortfolioStage } from './buPrograms';

export interface ProjectKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface KeyResult {
  id: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  contributingKPIs: string[];
  calculationMethod: string;
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: KeyResult[];
  overallProgress: number;
  strategicPriority: 'critical' | 'high' | 'medium';
  owner: string;
  buAlignment: string[];
}

export interface VROAggregatedMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  sourceOKRs: string[];
  calculationFormula: string;
  breakdown: { source: string; contribution: number; value: number }[];
  lastUpdated: Date;
}

export const GROUP_FUNCTIONS = [
  'FPL',
  'NEER',
  'Corporate & Other'
] as const;

export type GroupFunction = typeof GROUP_FUNCTIONS[number];

export const SAFE_STAGES: SAFePortfolioStage[] = [
  'funnel',
  'reviewing',
  'analyzing',
  'portfolio-backlog',
  'implementing',
  'done'
];

export const SAFE_STAGE_LABELS: Record<SAFePortfolioStage, string> = {
  'funnel': 'Funnel',
  'reviewing': 'Reviewing',
  'analyzing': 'Analyzing',
  'portfolio-backlog': 'Portfolio Backlog',
  'implementing': 'Implementing',
  'done': 'Done'
};

export const EXPANDED_PMO_PROJECTS = [
  ...pmoProjects,
  {
    id: "pmo-fpl-001",
    name: "FPL Grid Modernization & Automation",
    bu: "FPL",
    status: "green" as const,
    budget: { spent: 320, total: 450, unit: "$M" },
    timeline: { elapsed: 10, total: 18, unit: "months" },
    deliverables: { completed: 14, total: 24 },
    risks: ["Legacy SCADA dependencies", "Substation integration complexity"],
    nextMilestone: "Phase 3 SCADA integration - Week 35",
    safe: {
      velocity: 52,
      predictability: 85,
      flowEfficiency: 72,
      currentPI: "PI 24.4",
      epicId: "EPIC-FPL-001",
      epicName: "Enterprise Grid Transformation",
      epicProgress: 58,
      okr: { objective: "Modernize 80% of grid infrastructure", keyResult: "Reduce outage duration 40%", progress: 62 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 48, predictability: 80 }, { pi: "PI 24.3", velocity: 50, predictability: 82 }, { pi: "PI 24.4", velocity: 52, predictability: 85 }]
    },
    safeStage: "implementing" as const,
    aiSignals: [
      { type: "opportunity" as const, message: "Smart sensor deployment could accelerate by 25%", confidence: 84, dataSource: "Grid analytics" }
    ],
    proactiveActions: [
      { id: "pa-fpl-001", action: "Accelerate sensor deployment for quick wins", impact: "30% faster grid visibility", urgency: "this-week" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 52 }, { week: "W29", value: 56 }, { week: "W30", value: 60 }, { week: "W31", value: 64 }, { week: "W32", value: 68 }]
  },
  {
    id: "pmo-neer-001",
    name: "NEER Wind Portfolio Expansion 2024-2027",
    bu: "NEER",
    status: "amber" as const,
    budget: { spent: 1100, total: 1800, unit: "$M" },
    timeline: { elapsed: 4, total: 8, unit: "months" },
    deliverables: { completed: 5, total: 12 },
    risks: ["Vestas turbine delivery delays"],
    nextMilestone: "ERCOT interconnection - Week 28",
    safe: {
      velocity: 42,
      predictability: 75,
      flowEfficiency: 65,
      currentPI: "PI 25.1",
      epicId: "EPIC-NEER-001",
      epicName: "Renewable Generation Expansion",
      epicProgress: 42,
      okr: { objective: "Add 2,400 MW wind capacity", keyResult: "100% PPA coverage", progress: 48 },
      piTrend: [{ pi: "PI 24.1", velocity: 38, predictability: 70 }, { pi: "PI 24.2", velocity: 40, predictability: 72 }, { pi: "PI 24.3", velocity: 41, predictability: 74 }, { pi: "PI 24.4", velocity: 42, predictability: 75 }]
    },
    safeStage: "analyzing" as const,
    aiSignals: [
      { type: "warning" as const, message: "3 turbine orders need urgent vendor follow-up", confidence: 88, dataSource: "Supply chain tracker" }
    ],
    proactiveActions: [
      { id: "pa-neer-001", action: "Prioritize alternate turbine vendors", impact: "Unblock 4 downstream projects", urgency: "immediate" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W28", value: 38 }, { week: "W29", value: 42 }, { week: "W30", value: 44 }, { week: "W31", value: 46 }, { week: "W32", value: 48 }]
  },
  {
    id: "pmo-fpl-002",
    name: "FPL SolarTogether Phase III",
    bu: "FPL",
    status: "green" as const,
    budget: { spent: 80, total: 120, unit: "$M" },
    timeline: { elapsed: 5, total: 7, unit: "months" },
    deliverables: { completed: 8, total: 11 },
    risks: ["Solar panel supply chain constraints"],
    nextMilestone: "Site commissioning - Week 26",
    safe: {
      velocity: 58,
      predictability: 88,
      flowEfficiency: 78,
      currentPI: "PI 24.3",
      epicId: "EPIC-FPL-002",
      epicName: "Community Solar Expansion",
      epicProgress: 72,
      okr: { objective: "Add 1,000 MW community solar", keyResult: "Enroll 200K subscribers", progress: 65 },
      piTrend: [{ pi: "PI 24.1", velocity: 50, predictability: 82 }, { pi: "PI 24.2", velocity: 53, predictability: 84 }, { pi: "PI 24.3", velocity: 55, predictability: 86 }, { pi: "PI 24.4", velocity: 58, predictability: 88 }]
    },
    safeStage: "implementing" as const,
    aiSignals: [
      { type: "insight" as const, message: "Customer enrollment rate exceeding forecast by 23%", confidence: 91, dataSource: "Enrollment analytics" }
    ],
    proactiveActions: [
      { id: "pa-fpl-002", action: "Expand marketing to 3 additional counties", impact: "Faster subscriber acquisition", urgency: "this-month" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 62 }, { week: "W29", value: 68 }, { week: "W30", value: 72 }, { week: "W31", value: 78 }, { week: "W32", value: 82 }]
  },
  {
    id: "pmo-neer-002",
    name: "NEER Battery Energy Storage Systems",
    bu: "NEER",
    status: "amber" as const,
    budget: { spent: 400, total: 600, unit: "$M" },
    timeline: { elapsed: 3, total: 5, unit: "months" },
    deliverables: { completed: 4, total: 8 },
    risks: ["Battery supply from Tesla/BYD"],
    nextMilestone: "Site preparation - Week 27",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 68,
      currentPI: "PI 25.2",
      epicId: "EPIC-NEER-002",
      epicName: "Grid-Scale Storage Deployment",
      epicProgress: 52,
      okr: { objective: "Deploy 2,800 MW storage capacity", keyResult: "95% availability SLA", progress: 45 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 42, predictability: 74 }, { pi: "PI 24.3", velocity: 44, predictability: 76 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "portfolio-backlog" as const,
    aiSignals: [
      { type: "warning" as const, message: "Battery delivery delays may require 40% schedule buffer", confidence: 82, dataSource: "Supply chain analysis" }
    ],
    proactiveActions: [
      { id: "pa-neer-002", action: "Prioritize sites with confirmed battery deliveries", impact: "Focus resources effectively", urgency: "this-week" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W28", value: 42 }, { week: "W29", value: 48 }, { week: "W30", value: 52 }, { week: "W31", value: 55 }, { week: "W32", value: 58 }]
  },
  {
    id: "nee-fpl-003",
    name: "FPL Storm Protection Plan",
    bu: "FPL",
    status: "green" as const,
    budget: { spent: 150, total: 200, unit: "$M" },
    timeline: { elapsed: 8, total: 10, unit: "months" },
    deliverables: { completed: 12, total: 15 },
    risks: ["Weather delays during installation"],
    nextMilestone: "Go-live - Week 28",
    safe: {
      velocity: 55,
      predictability: 88,
      flowEfficiency: 75,
      currentPI: "PI 24.3",
      epicId: "EPIC-FPL-003",
      epicName: "Storm Resilience Infrastructure",
      epicProgress: 82,
      okr: { objective: "Harden 70% of coastal substations", keyResult: "Reduce hurricane restoration time by 50%", progress: 78 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 82 }, { pi: "PI 24.2", velocity: 50, predictability: 84 }, { pi: "PI 24.3", velocity: 52, predictability: 86 }, { pi: "PI 24.4", velocity: 55, predictability: 88 }]
    },
    safeStage: "done" as const,
    aiSignals: [
      { type: "insight" as const, message: "AI storm prediction achieving 94% accuracy", confidence: 95, dataSource: "Weather analytics" }
    ],
    proactiveActions: [
      { id: "pa-fpl-003", action: "Document success patterns for Phase 2", impact: "Enable faster rollout", urgency: "this-month" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 78 }, { week: "W29", value: 82 }, { week: "W30", value: 85 }, { week: "W31", value: 88 }, { week: "W32", value: 92 }]
  },
  {
    id: "nee-corp-001",
    name: "NextEra NERC CIP Compliance",
    bu: "Corporate & Other",
    status: "amber" as const,
    budget: { spent: 60, total: 90, unit: "$M" },
    timeline: { elapsed: 4, total: 7, unit: "months" },
    deliverables: { completed: 5, total: 10 },
    risks: ["Regulatory audit timeline"],
    nextMilestone: "UAT - Week 30",
    safe: {
      velocity: 42,
      predictability: 75,
      flowEfficiency: 62,
      currentPI: "PI 25.1",
      epicId: "EPIC-CORP-001",
      epicName: "Cybersecurity Compliance",
      epicProgress: 55,
      okr: { objective: "100% NERC CIP compliance", keyResult: "Zero audit findings", progress: 52 },
      piTrend: [{ pi: "PI 24.1", velocity: 38, predictability: 70 }, { pi: "PI 24.2", velocity: 40, predictability: 72 }, { pi: "PI 24.3", velocity: 41, predictability: 74 }, { pi: "PI 24.4", velocity: 42, predictability: 75 }]
    },
    safeStage: "reviewing" as const,
    aiSignals: [
      { type: "warning" as const, message: "2 control gaps showing latency issues", confidence: 78, dataSource: "Compliance monitoring" }
    ],
    proactiveActions: [
      { id: "pa-corp-001", action: "Escalate gaps to CISO", impact: "Ensure audit readiness", urgency: "immediate" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W28", value: 48 }, { week: "W29", value: 52 }, { week: "W30", value: 55 }, { week: "W31", value: 58 }, { week: "W32", value: 62 }]
  },
  {
    id: "nee-corp-002",
    name: "NextEra Enterprise Finance Platform",
    bu: "Corporate & Other",
    status: "green" as const,
    budget: { spent: 22, total: 30, unit: "$M" },
    timeline: { elapsed: 9, total: 12, unit: "months" },
    deliverables: { completed: 15, total: 20 },
    risks: ["Audit trail requirements"],
    nextMilestone: "Phase 2 deployment - Week 32",
    safe: {
      velocity: 52,
      predictability: 85,
      flowEfficiency: 75,
      currentPI: "PI 25.2",
      epicId: "EPIC-CORP-002",
      epicName: "Finance Transformation",
      epicProgress: 75,
      okr: { objective: "Automate 80% of finance processes", keyResult: "5-day close cycle", progress: 72 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 48, predictability: 80 }, { pi: "PI 24.3", velocity: 50, predictability: 82 }, { pi: "PI 24.4", velocity: 52, predictability: 85 }]
    },
    safeStage: "implementing" as const,
    aiSignals: [
      { type: "insight" as const, message: "Close cycle reduced from 12 to 7 days", confidence: 94, dataSource: "Process metrics" }
    ],
    proactiveActions: [
      { id: "pa-corp-002", action: "Capture efficiency gains for business case", impact: "Support Phase 3 funding", urgency: "this-week" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 68 }, { week: "W29", value: 72 }, { week: "W30", value: 75 }, { week: "W31", value: 78 }, { week: "W32", value: 82 }]
  },
  {
    id: "nee-neer-003",
    name: "NEER Offshore Wind Development",
    bu: "NEER",
    status: "amber" as const,
    budget: { spent: 900, total: 1400, unit: "$M" },
    timeline: { elapsed: 5, total: 8, unit: "months" },
    deliverables: { completed: 6, total: 12 },
    risks: ["Offshore permitting delays"],
    nextMilestone: "Environmental review - Week 29",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 68,
      currentPI: "PI 24.3",
      epicId: "EPIC-NEER-003",
      epicName: "Atlantic Offshore Wind",
      epicProgress: 52,
      okr: { objective: "Develop 1,200 MW offshore capacity", keyResult: "Federal permits secured", progress: 48 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 42, predictability: 74 }, { pi: "PI 24.3", velocity: 44, predictability: 76 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "analyzing" as const,
    aiSignals: [
      { type: "warning" as const, message: "2 environmental studies require additional review", confidence: 82, dataSource: "Regulatory tracker" }
    ],
    proactiveActions: [
      { id: "pa-neer-003", action: "Schedule dedicated permitting review", impact: "Unblock construction", urgency: "this-week" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W28", value: 45 }, { week: "W29", value: 48 }, { week: "W30", value: 52 }, { week: "W31", value: 55 }, { week: "W32", value: 58 }]
  },
  {
    id: "nee-neer-004",
    name: "NEER Hydrogen Production Pilot",
    bu: "NEER",
    status: "green" as const,
    budget: { spent: 180, total: 250, unit: "$M" },
    timeline: { elapsed: 7, total: 10, unit: "months" },
    deliverables: { completed: 11, total: 16 },
    risks: ["Electrolyzer delivery timeline"],
    nextMilestone: "Beta launch - Week 28",
    safe: {
      velocity: 55,
      predictability: 88,
      flowEfficiency: 78,
      currentPI: "PI 25.1",
      epicId: "EPIC-NEER-004",
      epicName: "Green Hydrogen Initiative",
      epicProgress: 70,
      okr: { objective: "Produce 10,000 kg/day green hydrogen", keyResult: "Industrial customer contracts", progress: 68 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 82 }, { pi: "PI 24.2", velocity: 50, predictability: 84 }, { pi: "PI 24.3", velocity: 52, predictability: 86 }, { pi: "PI 24.4", velocity: 55, predictability: 88 }]
    },
    safeStage: "implementing" as const,
    aiSignals: [
      { type: "opportunity" as const, message: "Industrial demand 25% higher than projected", confidence: 85, dataSource: "Market analytics" }
    ],
    proactiveActions: [
      { id: "pa-neer-004", action: "Accelerate electrolyzer capacity expansion", impact: "Capture demand", urgency: "this-month" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 62 }, { week: "W29", value: 68 }, { week: "W30", value: 72 }, { week: "W31", value: 76 }, { week: "W32", value: 80 }]
  },
  {
    id: "nee-neer-005",
    name: "NEER Real Zero Carbon Credits",
    bu: "NEER",
    status: "green" as const,
    budget: { spent: 50, total: 80, unit: "$M" },
    timeline: { elapsed: 4, total: 6, unit: "months" },
    deliverables: { completed: 7, total: 10 },
    risks: ["Carbon credit verification standards"],
    nextMilestone: "Production release - Week 26",
    safe: {
      velocity: 58,
      predictability: 90,
      flowEfficiency: 82,
      currentPI: "PI 25.2",
      epicId: "EPIC-NEER-005",
      epicName: "Carbon Credit Platform",
      epicProgress: 72,
      okr: { objective: "Launch Real Zero carbon credit marketplace", keyResult: "10 corporate customers enrolled", progress: 78 },
      piTrend: [{ pi: "PI 24.1", velocity: 50, predictability: 84 }, { pi: "PI 24.2", velocity: 53, predictability: 86 }, { pi: "PI 24.3", velocity: 55, predictability: 88 }, { pi: "PI 24.4", velocity: 58, predictability: 90 }]
    },
    safeStage: "done" as const,
    aiSignals: [
      { type: "insight" as const, message: "Corporate demand exceeding projections by 40%", confidence: 88, dataSource: "Sales analytics" }
    ],
    proactiveActions: [
      { id: "pa-neer-005", action: "Expand sales team capacity", impact: "Capture revenue opportunity", urgency: "this-month" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 72 }, { week: "W29", value: 78 }, { week: "W30", value: 82 }, { week: "W31", value: 86 }, { week: "W32", value: 90 }]
  },
  {
    id: "pmo-rt-funnel-001",
    name: "Customer Journey Reimagination",
    bu: "Florida Power & Light",
    status: "green" as const,
    budget: { spent: 0.1, total: 0.5, unit: "$m" },
    timeline: { elapsed: 1, total: 8, unit: "months" },
    deliverables: { completed: 1, total: 12 },
    risks: ["Scope definition"],
    nextMilestone: "Discovery complete - Week 26",
    safe: {
      velocity: 35,
      predictability: 70,
      flowEfficiency: 55,
      currentPI: "PI 24.3",
      epicId: "EPIC-RT-FUNNEL",
      epicName: "Next Gen Customer Experience",
      epicProgress: 10,
      okr: { objective: "Industry-leading digital experience", keyResult: "NPS +20 improvement", progress: 8 },
      piTrend: [{ pi: "PI 24.4", velocity: 35, predictability: 70 }]
    },
    safeStage: "funnel" as const,
    aiSignals: [
      { type: "insight" as const, message: "Competitor analysis shows 3 differentiation opportunities", confidence: 75, dataSource: "Market research" }
    ],
    proactiveActions: [
      { id: "pa-rt-f-001", action: "Complete competitive analysis", impact: "Inform strategy", urgency: "this-month" as const, type: "investigate" as const }
    ],
    trendData: [{ week: "W32", value: 10 }]
  },
  {
    id: "pmo-am-funnel-001",
    name: "Alternative Assets Expansion",
    bu: "NextEra Energy Resources",
    status: "amber" as const,
    budget: { spent: 0.2, total: 1.2, unit: "$m" },
    timeline: { elapsed: 2, total: 14, unit: "months" },
    deliverables: { completed: 2, total: 18 },
    risks: ["Regulatory approval timeline"],
    nextMilestone: "Business case approval - Week 28",
    safe: {
      velocity: 30,
      predictability: 65,
      flowEfficiency: 50,
      currentPI: "PI 25.1",
      epicId: "EPIC-AM-FUNNEL",
      epicName: "Alternatives Growth Strategy",
      epicProgress: 12,
      okr: { objective: "Expand alternatives AUM 30%", keyResult: "Launch 3 new products", progress: 15 },
      piTrend: [{ pi: "PI 24.4", velocity: 30, predictability: 65 }]
    },
    safeStage: "funnel" as const,
    aiSignals: [
      { type: "warning" as const, message: "Regulatory timeline may extend 3 months", confidence: 72, dataSource: "Regulatory tracker" }
    ],
    proactiveActions: [
      { id: "pa-am-f-001", action: "Engage regulatory affairs early", impact: "Reduce approval risk", urgency: "this-week" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W32", value: 12 }]
  },
  {
    id: "pmo-fpl-reviewing-001",
    name: "FPL Advanced Metering Infrastructure 2.0",
    bu: "FPL",
    status: "green" as const,
    budget: { spent: 30, total: 280, unit: "$M" },
    timeline: { elapsed: 2, total: 16, unit: "months" },
    deliverables: { completed: 3, total: 22 },
    risks: ["Technical architecture decisions pending"],
    nextMilestone: "Architecture review - Week 27",
    safe: {
      velocity: 38,
      predictability: 72,
      flowEfficiency: 58,
      currentPI: "PI 25.2",
      epicId: "EPIC-FPL-AMI",
      epicName: "Next Gen Smart Metering",
      epicProgress: 15,
      okr: { objective: "Deploy 5M smart meters", keyResult: "Process 100M daily readings", progress: 12 },
      piTrend: [{ pi: "PI 24.4", velocity: 38, predictability: 72 }]
    },
    safeStage: "reviewing" as const,
    aiSignals: [
      { type: "insight" as const, message: "Cloud-native architecture could reduce costs 35%", confidence: 82, dataSource: "Architecture analysis" }
    ],
    proactiveActions: [
      { id: "pa-fpl-r-001", action: "Schedule architecture decision workshop", impact: "Unblock detailed design", urgency: "this-week" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W32", value: 15 }]
  },
  {
    id: "pmo-ci-analyzing-001",
    name: "Build-to-Rent Platform Enhancement",
    bu: "Corporate & Other",
    status: "amber" as const,
    budget: { spent: 0.4, total: 1.6, unit: "$m" },
    timeline: { elapsed: 3, total: 10, unit: "months" },
    deliverables: { completed: 4, total: 14 },
    risks: ["Integration with property management systems"],
    nextMilestone: "Requirements sign-off - Week 29",
    safe: {
      velocity: 40,
      predictability: 74,
      flowEfficiency: 60,
      currentPI: "PI 24.3",
      epicId: "EPIC-CI-ANALYZE",
      epicName: "BTR Digital Ecosystem",
      epicProgress: 28,
      okr: { objective: "Optimize BTR portfolio performance", keyResult: "12% yield improvement", progress: 22 },
      piTrend: [{ pi: "PI 24.4", velocity: 40, predictability: 74 }]
    },
    safeStage: "analyzing" as const,
    aiSignals: [
      { type: "opportunity" as const, message: "IoT integration could improve tenant satisfaction 25%", confidence: 78, dataSource: "Tenant surveys" }
    ],
    proactiveActions: [
      { id: "pa-ci-a-001", action: "Include IoT scope in requirements", impact: "Higher tenant retention", urgency: "this-week" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W32", value: 28 }]
  },
  {
    id: "nee-corp-003",
    name: "NextEra Operational Resilience Framework",
    bu: "Corporate & Other",
    status: "green" as const,
    budget: { spent: 50, total: 180, unit: "$M" },
    timeline: { elapsed: 4, total: 12, unit: "months" },
    deliverables: { completed: 5, total: 16 },
    risks: ["Cross-segment coordination"],
    nextMilestone: "Sprint 1 start - Week 26",
    safe: {
      velocity: 42,
      predictability: 78,
      flowEfficiency: 65,
      currentPI: "PI 25.1",
      epicId: "EPIC-CORP-003",
      epicName: "Enterprise Resilience",
      epicProgress: 32,
      okr: { objective: "Meet operational resilience requirements", keyResult: "100% critical asset mapping", progress: 28 },
      piTrend: [{ pi: "PI 24.4", velocity: 42, predictability: 78 }]
    },
    safeStage: "portfolio-backlog" as const,
    aiSignals: [
      { type: "insight" as const, message: "Early mapping shows 85% critical asset coverage", confidence: 85, dataSource: "Resilience assessment" }
    ],
    proactiveActions: [
      { id: "pa-corp-003", action: "Prioritize gap analysis for remaining 15%", impact: "Focus remediation efforts", urgency: "this-week" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W32", value: 32 }]
  }
];

export const PROJECT_KPIS: Record<string, ProjectKPI[]> = {
  "pmo-ir-001": [
    { id: "kpi-ir-001-1", name: "Processing Time", value: 12, target: 5, unit: "days", weight: 0.35, trend: "down", lastUpdated: new Date() },
    { id: "kpi-ir-001-2", name: "Error Rate", value: 2.1, target: 1.0, unit: "%", weight: 0.25, trend: "down", lastUpdated: new Date() },
    { id: "kpi-ir-001-3", name: "Throughput", value: 145, target: 200, unit: "deals/month", weight: 0.25, trend: "up", lastUpdated: new Date() },
    { id: "kpi-ir-001-4", name: "Customer Satisfaction", value: 4.2, target: 4.5, unit: "/5", weight: 0.15, trend: "up", lastUpdated: new Date() }
  ],
  "pmo-am-001": [
    { id: "kpi-am-001-1", name: "Platform Uptime", value: 99.2, target: 99.9, unit: "%", weight: 0.30, trend: "stable", lastUpdated: new Date() },
    { id: "kpi-am-001-2", name: "Transaction Volume", value: 2.8, target: 5.0, unit: "$bn", weight: 0.35, trend: "up", lastUpdated: new Date() },
    { id: "kpi-am-001-3", name: "Cost per Transaction", value: 45, target: 30, unit: "$", weight: 0.20, trend: "down", lastUpdated: new Date() },
    { id: "kpi-am-001-4", name: "Time to Settle", value: 3.2, target: 1.0, unit: "days", weight: 0.15, trend: "down", lastUpdated: new Date() }
  ],
  "pmo-rt-001": [
    { id: "kpi-rt-001-1", name: "Conversion Rate", value: 32, target: 50, unit: "%", weight: 0.35, trend: "up", lastUpdated: new Date() },
    { id: "kpi-rt-001-2", name: "Onboarding Time", value: 18, target: 10, unit: "minutes", weight: 0.30, trend: "down", lastUpdated: new Date() },
    { id: "kpi-rt-001-3", name: "Drop-off Rate", value: 25, target: 15, unit: "%", weight: 0.20, trend: "down", lastUpdated: new Date() },
    { id: "kpi-rt-001-4", name: "Mobile Completion", value: 42, target: 60, unit: "%", weight: 0.15, trend: "up", lastUpdated: new Date() }
  ],
  "pmo-gt-001": [
    { id: "kpi-gt-001-1", name: "Workloads Migrated", value: 52, target: 80, unit: "%", weight: 0.35, trend: "up", lastUpdated: new Date() },
    { id: "kpi-gt-001-2", name: "Cost Reduction", value: 28, target: 40, unit: "%", weight: 0.30, trend: "up", lastUpdated: new Date() },
    { id: "kpi-gt-001-3", name: "Deployment Frequency", value: 12, target: 20, unit: "/week", weight: 0.20, trend: "up", lastUpdated: new Date() },
    { id: "kpi-gt-001-4", name: "Incident Reduction", value: 35, target: 50, unit: "%", weight: 0.15, trend: "up", lastUpdated: new Date() }
  ]
};

export const OKRS: OKR[] = [
  {
    id: "okr-001",
    objective: "Accelerate Grid Modernization",
    keyResults: [
      { id: "kr-001-1", description: "Reduce outage response time from 18 minutes to 5 minutes", progress: 68, target: 100, unit: "%", contributingKPIs: ["kpi-ir-001-1", "kpi-ir-001-2"], calculationMethod: "Weighted average of response time and error rate improvements" },
      { id: "kr-001-2", description: "Increase smart meter coverage to 100%", progress: 72, target: 100, unit: "%", contributingKPIs: ["kpi-ir-001-3"], calculationMethod: "Current coverage / target coverage * 100" },
      { id: "kr-001-3", description: "Achieve 4.5/5 customer satisfaction", progress: 93, target: 100, unit: "%", contributingKPIs: ["kpi-ir-001-4"], calculationMethod: "Current score / target score * 100" }
    ],
    overallProgress: 78,
    strategicPriority: "critical",
    owner: "Armando Pimentel",
    buAlignment: ["Florida Power & Light"]
  },
  {
    id: "okr-002",
    objective: "Build Private Markets Capability",
    keyResults: [
      { id: "kr-002-1", description: "Platform operational for $5bn transactions", progress: 56, target: 100, unit: "%", contributingKPIs: ["kpi-am-001-2"], calculationMethod: "Transaction volume / target volume * 100" },
      { id: "kr-002-2", description: "Achieve 99.9% platform uptime", progress: 99, target: 100, unit: "%", contributingKPIs: ["kpi-am-001-1"], calculationMethod: "Current uptime / target uptime * 100" },
      { id: "kr-002-3", description: "Reduce transaction costs by 35%", progress: 45, target: 100, unit: "%", contributingKPIs: ["kpi-am-001-3"], calculationMethod: "Cost reduction achieved / target reduction * 100" }
    ],
    overallProgress: 67,
    strategicPriority: "high",
    owner: "Eric Adler",
    buAlignment: ["NextEra Energy Resources"]
  },
  {
    id: "okr-003",
    objective: "Digital-First Customer Experience",
    keyResults: [
      { id: "kr-003-1", description: "50% digital policy adoption", progress: 64, target: 100, unit: "%", contributingKPIs: ["kpi-rt-001-1"], calculationMethod: "Conversion rate / target rate * 100" },
      { id: "kr-003-2", description: "Onboarding under 10 minutes", progress: 56, target: 100, unit: "%", contributingKPIs: ["kpi-rt-001-2"], calculationMethod: "Time improvement towards target" },
      { id: "kr-003-3", description: "Mobile completion rate 60%", progress: 70, target: 100, unit: "%", contributingKPIs: ["kpi-rt-001-4"], calculationMethod: "Current mobile rate / target rate * 100" }
    ],
    overallProgress: 63,
    strategicPriority: "high",
    owner: "Bernie Hickman",
    buAlignment: ["Florida Power & Light"]
  },
  {
    id: "okr-004",
    objective: "Enterprise Grid Transformation",
    keyResults: [
      { id: "kr-004-1", description: "Modernize 80% of grid infrastructure", progress: 65, target: 100, unit: "%", contributingKPIs: ["kpi-gt-001-1"], calculationMethod: "Infrastructure modernized / target * 100" },
      { id: "kr-004-2", description: "Reduce outage duration 40%", progress: 70, target: 100, unit: "%", contributingKPIs: ["kpi-gt-001-2"], calculationMethod: "Outage reduction / target * 100" },
      { id: "kr-004-3", description: "Increase grid automation to 90%", progress: 60, target: 100, unit: "%", contributingKPIs: ["kpi-gt-001-3"], calculationMethod: "Current automation / target * 100" }
    ],
    overallProgress: 65,
    strategicPriority: "critical",
    owner: "NextEra CTO",
    buAlignment: ["FPL"]
  }
];

export function calculateVROMetricsFromProjects(): VROAggregatedMetric[] {
  const allProjects = EXPANDED_PMO_PROJECTS;
  const allActiveProjects = allProjects.filter(p => p.safeStage !== 'done');
  
  const avgPredictability = Math.round(
    allActiveProjects.reduce((sum, p) => sum + p.safe.predictability, 0) / allActiveProjects.length
  );
  
  const avgVelocity = Math.round(
    allActiveProjects.reduce((sum, p) => sum + p.safe.velocity, 0) / allActiveProjects.length
  );
  
  const onTrackCount = allProjects.filter(p => p.status === 'green').length;
  const deliverySuccessRate = Math.round((onTrackCount / allProjects.length) * 100);
  
  const tracedROI = getTracedVROROI();
  const okrProgress = Math.round(OKRS.reduce((sum, okr) => sum + calculateOKRProgress(okr), 0) / OKRS.length);

  return [
    {
      id: "vro-metric-001",
      name: "Strategic ROI",
      currentValue: tracedROI.roi,
      targetValue: 85,
      unit: "%",
      sourceOKRs: OKRS.map(o => o.id),
      calculationFormula: "Weighted average of OKR progress (Critical: 1.5x, High: 1x, Medium: 0.5x)",
      breakdown: tracedROI.breakdown.map(b => ({
        source: b.objective,
        contribution: Math.round(b.weight * 100 / tracedROI.breakdown.reduce((s, x) => s + x.weight, 0)),
        value: b.progress
      })),
      lastUpdated: new Date()
    },
    {
      id: "vro-metric-002",
      name: "Delivery Predictability",
      currentValue: avgPredictability,
      targetValue: 90,
      unit: "%",
      sourceOKRs: ["okr-001", "okr-002", "okr-003", "okr-004"],
      calculationFormula: "Average SAFe Predictability across all active projects",
      breakdown: [
        { source: "Green Projects", contribution: 65, value: Math.round(allProjects.filter(p => p.status === 'green').reduce((s, p) => s + p.safe.predictability, 0) / allProjects.filter(p => p.status === 'green').length) || 0 },
        { source: "Amber Projects", contribution: 25, value: Math.round(allProjects.filter(p => p.status === 'amber').reduce((s, p) => s + p.safe.predictability, 0) / allProjects.filter(p => p.status === 'amber').length) || 0 },
        { source: "Red Projects", contribution: 10, value: Math.round(allProjects.filter(p => p.status === 'red').reduce((s, p) => s + p.safe.predictability, 0) / allProjects.filter(p => p.status === 'red').length) || 0 }
      ],
      lastUpdated: new Date()
    },
    {
      id: "vro-metric-003",
      name: "OKR Achievement",
      currentValue: okrProgress,
      targetValue: 80,
      unit: "%",
      sourceOKRs: OKRS.map(o => o.id),
      calculationFormula: "Average calculated progress across all strategic OKRs (derived from KR → KPI data)",
      breakdown: OKRS.map(okr => ({
        source: okr.objective.substring(0, 30) + "...",
        contribution: Math.round(100 / OKRS.length),
        value: calculateOKRProgress(okr)
      })),
      lastUpdated: new Date()
    },
    {
      id: "vro-metric-004",
      name: "Delivery Success Rate",
      currentValue: deliverySuccessRate,
      targetValue: 85,
      unit: "%",
      sourceOKRs: OKRS.map(o => o.id),
      calculationFormula: "(Projects On Track / Total Projects) × 100",
      breakdown: [
        { source: "Green (On Track)", contribution: onTrackCount, value: onTrackCount },
        { source: "Amber (At Risk)", contribution: allProjects.filter(p => p.status === 'amber').length, value: allProjects.filter(p => p.status === 'amber').length },
        { source: "Red (Critical)", contribution: allProjects.filter(p => p.status === 'red').length, value: allProjects.filter(p => p.status === 'red').length }
      ],
      lastUpdated: new Date()
    },
    {
      id: "vro-metric-005",
      name: "Portfolio Velocity",
      currentValue: avgVelocity,
      targetValue: 55,
      unit: "pts",
      sourceOKRs: ["okr-004"],
      calculationFormula: "Average SAFe velocity across all active projects",
      breakdown: GROUP_FUNCTIONS.slice(0, 5).map(fn => ({
        source: fn,
        contribution: 20,
        value: Math.round(allProjects.filter(p => p.bu === fn).reduce((s, p) => s + p.safe.velocity, 0) / Math.max(1, allProjects.filter(p => p.bu === fn).length))
      })),
      lastUpdated: new Date()
    }
  ];
}

export function getProjectsByStageAndFunction(): Record<SAFePortfolioStage, Record<string, number>> {
  const result: Record<SAFePortfolioStage, Record<string, number>> = {
    'funnel': {},
    'reviewing': {},
    'analyzing': {},
    'portfolio-backlog': {},
    'implementing': {},
    'done': {}
  };
  
  EXPANDED_PMO_PROJECTS.forEach(project => {
    if (!result[project.safeStage][project.bu]) {
      result[project.safeStage][project.bu] = 0;
    }
    result[project.safeStage][project.bu]++;
  });
  
  return result;
}

export function getStageCounts(): Record<SAFePortfolioStage, number> {
  const counts: Record<SAFePortfolioStage, number> = {
    'funnel': 0,
    'reviewing': 0,
    'analyzing': 0,
    'portfolio-backlog': 0,
    'implementing': 0,
    'done': 0
  };
  
  const allProjects = EXPANDED_PMO_PROJECTS;
  allProjects.forEach(project => {
    if (counts[project.safeStage] !== undefined) {
      counts[project.safeStage]++;
    }
  });
  
  return counts;
}

export function getGroupFunctionCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  
  EXPANDED_PMO_PROJECTS.forEach(project => {
    if (!counts[project.bu]) {
      counts[project.bu] = 0;
    }
    counts[project.bu]++;
  });
  
  return counts;
}

export interface PMOOverviewMetrics {
  activeProjects: number;
  onTrack: number;
  atRisk: number;
  critical: number;
  safeStages: number;
  totalBudget: number;
  totalSpent: number;
  avgPredictability: number;
  avgVelocity: number;
}

export interface PMOMetricWithProjects {
  count: number;
  total: number;
  projectIds: string[];
  projects: typeof EXPANDED_PMO_PROJECTS;
}

export interface PMOMetricsDetailed {
  activeProjects: PMOMetricWithProjects;
  onTrack: PMOMetricWithProjects;
  atRisk: PMOMetricWithProjects;
  critical: PMOMetricWithProjects;
  implementing: PMOMetricWithProjects;
  funnel: PMOMetricWithProjects;
  reviewing: PMOMetricWithProjects;
  analyzing: PMOMetricWithProjects;
  portfolioBacklog: PMOMetricWithProjects;
  done: PMOMetricWithProjects;
  totalBudget: number;
  totalSpent: number;
  avgPredictability: number;
  avgVelocity: number;
}

export function getPMOMetricsDetailed(): PMOMetricsDetailed {
  const allProjects = EXPANDED_PMO_PROJECTS;
  
  const onTrackProjects = allProjects.filter(p => p.status === 'green');
  const atRiskProjects = allProjects.filter(p => p.status === 'amber');
  const criticalProjects = allProjects.filter(p => p.status === 'red');
  const implementingProjects = allProjects.filter(p => p.safeStage === 'implementing');
  const funnelProjects = allProjects.filter(p => p.safeStage === 'funnel');
  const reviewingProjects = allProjects.filter(p => p.safeStage === 'reviewing');
  const analyzingProjects = allProjects.filter(p => p.safeStage === 'analyzing');
  const portfolioBacklogProjects = allProjects.filter(p => p.safeStage === 'portfolio-backlog');
  const doneProjects = allProjects.filter(p => p.safeStage === 'done');
  
  const totalBudget = allProjects.reduce((sum, p) => sum + p.budget.total, 0);
  const totalSpent = allProjects.reduce((sum, p) => sum + p.budget.spent, 0);
  
  const avgPredictability = Math.round(
    allProjects.reduce((sum, p) => sum + p.safe.predictability, 0) / allProjects.length
  );
  
  const avgVelocity = Math.round(
    allProjects.reduce((sum, p) => sum + p.safe.velocity, 0) / allProjects.length
  );
  
  return {
    activeProjects: {
      count: allProjects.length,
      total: allProjects.length,
      projectIds: allProjects.map(p => p.id),
      projects: allProjects
    },
    onTrack: {
      count: onTrackProjects.length,
      total: allProjects.length,
      projectIds: onTrackProjects.map(p => p.id),
      projects: onTrackProjects
    },
    atRisk: {
      count: atRiskProjects.length,
      total: allProjects.length,
      projectIds: atRiskProjects.map(p => p.id),
      projects: atRiskProjects
    },
    critical: {
      count: criticalProjects.length,
      total: allProjects.length,
      projectIds: criticalProjects.map(p => p.id),
      projects: criticalProjects
    },
    implementing: {
      count: implementingProjects.length,
      total: allProjects.length,
      projectIds: implementingProjects.map(p => p.id),
      projects: implementingProjects
    },
    funnel: {
      count: funnelProjects.length,
      total: allProjects.length,
      projectIds: funnelProjects.map(p => p.id),
      projects: funnelProjects
    },
    reviewing: {
      count: reviewingProjects.length,
      total: allProjects.length,
      projectIds: reviewingProjects.map(p => p.id),
      projects: reviewingProjects
    },
    analyzing: {
      count: analyzingProjects.length,
      total: allProjects.length,
      projectIds: analyzingProjects.map(p => p.id),
      projects: analyzingProjects
    },
    portfolioBacklog: {
      count: portfolioBacklogProjects.length,
      total: allProjects.length,
      projectIds: portfolioBacklogProjects.map(p => p.id),
      projects: portfolioBacklogProjects
    },
    done: {
      count: doneProjects.length,
      total: allProjects.length,
      projectIds: doneProjects.map(p => p.id),
      projects: doneProjects
    },
    totalBudget,
    totalSpent,
    avgPredictability,
    avgVelocity
  };
}

export function getProjectsByMetricId(metricId: string): typeof EXPANDED_PMO_PROJECTS {
  const allProjects = EXPANDED_PMO_PROJECTS;
  
  switch (metricId) {
    case 'active-projects':
    case 'all-projects':
      return allProjects;
    case 'on-track':
    case 'onTrack':
      return allProjects.filter(p => p.status === 'green');
    case 'at-risk':
    case 'atRisk':
      return allProjects.filter(p => p.status === 'amber');
    case 'critical':
      return allProjects.filter(p => p.status === 'red');
    case 'implementing':
    case 'wip-items':
      return allProjects.filter(p => p.safeStage === 'implementing');
    case 'funnel':
      return allProjects.filter(p => p.safeStage === 'funnel');
    case 'reviewing':
      return allProjects.filter(p => p.safeStage === 'reviewing');
    case 'analyzing':
      return allProjects.filter(p => p.safeStage === 'analyzing');
    case 'portfolio-backlog':
      return allProjects.filter(p => p.safeStage === 'portfolio-backlog');
    case 'done':
      return allProjects.filter(p => p.safeStage === 'done');
    default:
      return [];
  }
}

export function getPMOOverviewMetrics(): PMOOverviewMetrics {
  const allProjects = EXPANDED_PMO_PROJECTS;
  const onTrack = allProjects.filter(p => p.status === 'green').length;
  const atRisk = allProjects.filter(p => p.status === 'amber').length;
  const critical = allProjects.filter(p => p.status === 'red').length;
  
  const totalBudget = allProjects.reduce((sum, p) => sum + p.budget.total, 0);
  const totalSpent = allProjects.reduce((sum, p) => sum + p.budget.spent, 0);
  
  const avgPredictability = Math.round(
    allProjects.reduce((sum, p) => sum + p.safe.predictability, 0) / allProjects.length
  );
  
  const avgVelocity = Math.round(
    allProjects.reduce((sum, p) => sum + p.safe.velocity, 0) / allProjects.length
  );
  
  return {
    activeProjects: allProjects.length,
    onTrack,
    atRisk,
    critical,
    safeStages: 6,
    totalBudget,
    totalSpent,
    avgPredictability,
    avgVelocity
  };
}

export function calculateKeyResultProgress(kpiIds: string[]): number {
  let totalProgress = 0;
  let totalWeight = 0;
  
  kpiIds.forEach(kpiId => {
    for (const projectId in PROJECT_KPIS) {
      const kpi = PROJECT_KPIS[projectId]?.find(k => k.id === kpiId);
      if (kpi) {
        const progress = Math.min(100, (kpi.value / kpi.target) * 100);
        totalProgress += progress * kpi.weight;
        totalWeight += kpi.weight;
        break;
      }
    }
  });
  
  return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
}

export function calculateOKRProgress(okr: OKR): number {
  if (okr.keyResults.length === 0) return 0;
  
  const totalProgress = okr.keyResults.reduce((sum, kr) => {
    const calculatedProgress = calculateKeyResultProgress(kr.contributingKPIs);
    return sum + (calculatedProgress > 0 ? calculatedProgress : kr.progress);
  }, 0);
  
  return Math.round(totalProgress / okr.keyResults.length);
}

export function getTracedVROROI(): { 
  roi: number; 
  breakdown: { okrId: string; objective: string; progress: number; weight: number; contribution: number }[] 
} {
  const okrBreakdown = OKRS.map(okr => {
    const calculatedProgress = calculateOKRProgress(okr);
    const weight = okr.strategicPriority === 'critical' ? 1.5 : okr.strategicPriority === 'high' ? 1.0 : 0.5;
    return {
      okrId: okr.id,
      objective: okr.objective,
      progress: calculatedProgress,
      weight,
      contribution: calculatedProgress * weight
    };
  });
  
  const totalWeight = okrBreakdown.reduce((sum, o) => sum + o.weight, 0);
  const weightedROI = Math.round(okrBreakdown.reduce((sum, o) => sum + o.contribution, 0) / totalWeight);
  
  return {
    roi: weightedROI,
    breakdown: okrBreakdown
  };
}

export interface TraceableMetricBreakdown {
  level: 'okr' | 'kr' | 'kpi' | 'project';
  id: string;
  name: string;
  value: number;
  contribution: number;
  children?: TraceableMetricBreakdown[];
}

export function getFullTraceabilityChain(okrId: string): TraceableMetricBreakdown | null {
  const okr = OKRS.find(o => o.id === okrId);
  if (!okr) return null;
  
  const krChildren: TraceableMetricBreakdown[] = okr.keyResults.map(kr => {
    const kpiChildren: TraceableMetricBreakdown[] = kr.contributingKPIs.map(kpiId => {
      let foundKPI: ProjectKPI | null = null;
      let foundProjectId = '';
      
      for (const projectId in PROJECT_KPIS) {
        const kpi = PROJECT_KPIS[projectId]?.find(k => k.id === kpiId);
        if (kpi) {
          foundKPI = kpi;
          foundProjectId = projectId;
          break;
        }
      }
      
      if (!foundKPI) return null;
      
      const project = EXPANDED_PMO_PROJECTS.find(p => p.id === foundProjectId);
      
      return {
        level: 'kpi' as const,
        id: kpiId,
        name: foundKPI.name,
        value: foundKPI.value,
        contribution: Math.min(100, (foundKPI.value / foundKPI.target) * 100),
        children: project ? [{
          level: 'project' as const,
          id: project.id,
          name: project.name,
          value: project.safe.epicProgress,
          contribution: project.status === 'green' ? 100 : project.status === 'amber' ? 60 : 30
        }] : undefined
      };
    }).filter(Boolean) as TraceableMetricBreakdown[];
    
    return {
      level: 'kr' as const,
      id: kr.id,
      name: kr.description,
      value: calculateKeyResultProgress(kr.contributingKPIs) || kr.progress,
      contribution: kr.progress,
      children: kpiChildren
    };
  });
  
  return {
    level: 'okr' as const,
    id: okr.id,
    name: okr.objective,
    value: calculateOKRProgress(okr),
    contribution: okr.overallProgress,
    children: krChildren
  };
}
