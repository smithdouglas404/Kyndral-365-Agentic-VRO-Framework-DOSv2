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
  'Institutional Retirement',
  'Asset Management',
  'Retail',
  'Corporate Investments',
  'Risk & Compliance',
  'Group Technology',
  'Group HR',
  'Group Legal',
  'Group Finance',
  'Group Investments'
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
    id: "pmo-gt-001",
    name: "Cloud Migration Program",
    bu: "Group Technology",
    status: "green" as const,
    budget: { spent: 3.2, total: 4.5, unit: "£m" },
    timeline: { elapsed: 10, total: 18, unit: "months" },
    deliverables: { completed: 14, total: 24 },
    risks: ["Legacy system dependencies", "Data migration complexity"],
    nextMilestone: "Phase 3 AWS migration - Week 35",
    safe: {
      velocity: 52,
      predictability: 85,
      flowEfficiency: 72,
      currentPI: "PI 24.4",
      epicId: "EPIC-GT-001",
      epicName: "Enterprise Cloud Transformation",
      epicProgress: 58,
      okr: { objective: "Migrate 80% workloads to cloud", keyResult: "Reduce infrastructure costs 40%", progress: 62 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 48, predictability: 80 }, { pi: "PI 24.3", velocity: 50, predictability: 82 }, { pi: "PI 24.4", velocity: 52, predictability: 85 }]
    },
    safeStage: "implementing" as const,
    aiSignals: [
      { type: "opportunity" as const, message: "Kubernetes adoption could accelerate by 25%", confidence: 84, dataSource: "DevOps metrics" }
    ],
    proactiveActions: [
      { id: "pa-gt-001", action: "Accelerate container migration for quick wins", impact: "30% faster deployment", urgency: "this-week" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 52 }, { week: "W29", value: 56 }, { week: "W30", value: 60 }, { week: "W31", value: 64 }, { week: "W32", value: 68 }]
  },
  {
    id: "pmo-gt-002",
    name: "API Gateway Modernization",
    bu: "Group Technology",
    status: "amber" as const,
    budget: { spent: 1.1, total: 1.8, unit: "£m" },
    timeline: { elapsed: 4, total: 8, unit: "months" },
    deliverables: { completed: 5, total: 12 },
    risks: ["Third-party API compatibility"],
    nextMilestone: "Security audit - Week 28",
    safe: {
      velocity: 42,
      predictability: 75,
      flowEfficiency: 65,
      currentPI: "PI 24.4",
      epicId: "EPIC-GT-002",
      epicName: "API First Architecture",
      epicProgress: 42,
      okr: { objective: "Enable seamless API integrations", keyResult: "100% API catalog coverage", progress: 48 },
      piTrend: [{ pi: "PI 24.1", velocity: 38, predictability: 70 }, { pi: "PI 24.2", velocity: 40, predictability: 72 }, { pi: "PI 24.3", velocity: 41, predictability: 74 }, { pi: "PI 24.4", velocity: 42, predictability: 75 }]
    },
    safeStage: "analyzing" as const,
    aiSignals: [
      { type: "warning" as const, message: "3 legacy APIs need urgent refactoring", confidence: 88, dataSource: "API health scan" }
    ],
    proactiveActions: [
      { id: "pa-gt-002", action: "Prioritize legacy API refactoring", impact: "Unblock 4 downstream projects", urgency: "immediate" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W28", value: 38 }, { week: "W29", value: 42 }, { week: "W30", value: 44 }, { week: "W31", value: 46 }, { week: "W32", value: 48 }]
  },
  {
    id: "pmo-gh-001",
    name: "Workforce Analytics Platform",
    bu: "Group HR",
    status: "green" as const,
    budget: { spent: 0.8, total: 1.2, unit: "£m" },
    timeline: { elapsed: 5, total: 7, unit: "months" },
    deliverables: { completed: 8, total: 11 },
    risks: ["GDPR compliance validation"],
    nextMilestone: "Pilot launch - Week 26",
    safe: {
      velocity: 58,
      predictability: 88,
      flowEfficiency: 78,
      currentPI: "PI 24.4",
      epicId: "EPIC-GH-001",
      epicName: "People Analytics",
      epicProgress: 72,
      okr: { objective: "Data-driven talent decisions", keyResult: "Reduce attrition by 15%", progress: 65 },
      piTrend: [{ pi: "PI 24.1", velocity: 50, predictability: 82 }, { pi: "PI 24.2", velocity: 53, predictability: 84 }, { pi: "PI 24.3", velocity: 55, predictability: 86 }, { pi: "PI 24.4", velocity: 58, predictability: 88 }]
    },
    safeStage: "implementing" as const,
    aiSignals: [
      { type: "insight" as const, message: "Predictive attrition model achieving 82% accuracy", confidence: 91, dataSource: "ML model metrics" }
    ],
    proactiveActions: [
      { id: "pa-gh-001", action: "Expand pilot to 3 additional business units", impact: "Faster enterprise value", urgency: "this-month" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 62 }, { week: "W29", value: 68 }, { week: "W30", value: 72 }, { week: "W31", value: 78 }, { week: "W32", value: 82 }]
  },
  {
    id: "pmo-gh-002",
    name: "Learning Management Refresh",
    bu: "Group HR",
    status: "amber" as const,
    budget: { spent: 0.4, total: 0.6, unit: "£m" },
    timeline: { elapsed: 3, total: 5, unit: "months" },
    deliverables: { completed: 4, total: 8 },
    risks: ["Content migration from legacy LMS"],
    nextMilestone: "Content review - Week 27",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 68,
      currentPI: "PI 24.4",
      epicId: "EPIC-GH-002",
      epicName: "Digital Learning Experience",
      epicProgress: 52,
      okr: { objective: "Enable continuous learning culture", keyResult: "80% completion rate", progress: 45 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 42, predictability: 74 }, { pi: "PI 24.3", velocity: 44, predictability: 76 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "portfolio-backlog" as const,
    aiSignals: [
      { type: "warning" as const, message: "Legacy content requires 40% more effort than planned", confidence: 82, dataSource: "Migration analysis" }
    ],
    proactiveActions: [
      { id: "pa-gh-002", action: "Prioritize high-value content migration", impact: "Focus resources effectively", urgency: "this-week" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W28", value: 42 }, { week: "W29", value: 48 }, { week: "W30", value: 52 }, { week: "W31", value: 55 }, { week: "W32", value: 58 }]
  },
  {
    id: "pmo-gl-001",
    name: "Contract Lifecycle Management",
    bu: "Group Legal",
    status: "green" as const,
    budget: { spent: 1.5, total: 2.0, unit: "£m" },
    timeline: { elapsed: 8, total: 10, unit: "months" },
    deliverables: { completed: 12, total: 15 },
    risks: ["Integration with existing document management"],
    nextMilestone: "Go-live - Week 28",
    safe: {
      velocity: 55,
      predictability: 88,
      flowEfficiency: 75,
      currentPI: "PI 24.4",
      epicId: "EPIC-GL-001",
      epicName: "Legal Operations Automation",
      epicProgress: 82,
      okr: { objective: "Automate 70% of contract workflows", keyResult: "Reduce cycle time by 50%", progress: 78 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 82 }, { pi: "PI 24.2", velocity: 50, predictability: 84 }, { pi: "PI 24.3", velocity: 52, predictability: 86 }, { pi: "PI 24.4", velocity: 55, predictability: 88 }]
    },
    safeStage: "done" as const,
    aiSignals: [
      { type: "insight" as const, message: "AI clause extraction achieving 94% accuracy", confidence: 95, dataSource: "NLP model" }
    ],
    proactiveActions: [
      { id: "pa-gl-001", action: "Document success patterns for Phase 2", impact: "Enable faster rollout", urgency: "this-month" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 78 }, { week: "W29", value: 82 }, { week: "W30", value: 85 }, { week: "W31", value: 88 }, { week: "W32", value: 92 }]
  },
  {
    id: "pmo-gl-002",
    name: "Regulatory Change Tracker",
    bu: "Group Legal",
    status: "amber" as const,
    budget: { spent: 0.6, total: 0.9, unit: "£m" },
    timeline: { elapsed: 4, total: 7, unit: "months" },
    deliverables: { completed: 5, total: 10 },
    risks: ["Regulatory data feed reliability"],
    nextMilestone: "UAT - Week 30",
    safe: {
      velocity: 42,
      predictability: 75,
      flowEfficiency: 62,
      currentPI: "PI 24.4",
      epicId: "EPIC-GL-002",
      epicName: "Regulatory Intelligence",
      epicProgress: 55,
      okr: { objective: "Proactive regulatory compliance", keyResult: "Zero missed regulatory changes", progress: 52 },
      piTrend: [{ pi: "PI 24.1", velocity: 38, predictability: 70 }, { pi: "PI 24.2", velocity: 40, predictability: 72 }, { pi: "PI 24.3", velocity: 41, predictability: 74 }, { pi: "PI 24.4", velocity: 42, predictability: 75 }]
    },
    safeStage: "reviewing" as const,
    aiSignals: [
      { type: "warning" as const, message: "2 regulatory feeds showing latency issues", confidence: 78, dataSource: "Feed monitoring" }
    ],
    proactiveActions: [
      { id: "pa-gl-002", action: "Escalate feed issues to vendor", impact: "Ensure data reliability", urgency: "immediate" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W28", value: 48 }, { week: "W29", value: 52 }, { week: "W30", value: 55 }, { week: "W31", value: 58 }, { week: "W32", value: 62 }]
  },
  {
    id: "pmo-gf-001",
    name: "Finance Automation Suite",
    bu: "Group Finance",
    status: "green" as const,
    budget: { spent: 2.2, total: 3.0, unit: "£m" },
    timeline: { elapsed: 9, total: 12, unit: "months" },
    deliverables: { completed: 15, total: 20 },
    risks: ["Audit trail requirements"],
    nextMilestone: "Phase 2 deployment - Week 32",
    safe: {
      velocity: 52,
      predictability: 85,
      flowEfficiency: 75,
      currentPI: "PI 24.4",
      epicId: "EPIC-GF-001",
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
      { id: "pa-gf-001", action: "Capture efficiency gains for business case", impact: "Support Phase 3 funding", urgency: "this-week" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 68 }, { week: "W29", value: 72 }, { week: "W30", value: 75 }, { week: "W31", value: 78 }, { week: "W32", value: 82 }]
  },
  {
    id: "pmo-gf-002",
    name: "Treasury Management Upgrade",
    bu: "Group Finance",
    status: "amber" as const,
    budget: { spent: 0.9, total: 1.4, unit: "£m" },
    timeline: { elapsed: 5, total: 8, unit: "months" },
    deliverables: { completed: 6, total: 12 },
    risks: ["Bank connectivity testing"],
    nextMilestone: "Integration testing - Week 29",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 68,
      currentPI: "PI 24.4",
      epicId: "EPIC-GF-002",
      epicName: "Treasury Modernization",
      epicProgress: 52,
      okr: { objective: "Real-time cash visibility", keyResult: "Same-day reporting", progress: 48 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 42, predictability: 74 }, { pi: "PI 24.3", velocity: 44, predictability: 76 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "analyzing" as const,
    aiSignals: [
      { type: "warning" as const, message: "2 bank APIs require additional security testing", confidence: 82, dataSource: "Security scan" }
    ],
    proactiveActions: [
      { id: "pa-gf-002", action: "Schedule dedicated security testing window", impact: "Unblock integration", urgency: "this-week" as const, type: "mitigate" as const }
    ],
    trendData: [{ week: "W28", value: 45 }, { week: "W29", value: 48 }, { week: "W30", value: 52 }, { week: "W31", value: 55 }, { week: "W32", value: 58 }]
  },
  {
    id: "pmo-gi-001",
    name: "Investment Analytics Platform",
    bu: "Group Investments",
    status: "green" as const,
    budget: { spent: 1.8, total: 2.5, unit: "£m" },
    timeline: { elapsed: 7, total: 10, unit: "months" },
    deliverables: { completed: 11, total: 16 },
    risks: ["Real-time data feed latency"],
    nextMilestone: "Beta launch - Week 28",
    safe: {
      velocity: 55,
      predictability: 88,
      flowEfficiency: 78,
      currentPI: "PI 24.4",
      epicId: "EPIC-GI-001",
      epicName: "Investment Intelligence",
      epicProgress: 70,
      okr: { objective: "Data-driven investment decisions", keyResult: "15bps alpha improvement", progress: 68 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 82 }, { pi: "PI 24.2", velocity: 50, predictability: 84 }, { pi: "PI 24.3", velocity: 52, predictability: 86 }, { pi: "PI 24.4", velocity: 55, predictability: 88 }]
    },
    safeStage: "implementing" as const,
    aiSignals: [
      { type: "opportunity" as const, message: "ML model identifying 12bps additional alpha opportunity", confidence: 85, dataSource: "Quant analytics" }
    ],
    proactiveActions: [
      { id: "pa-gi-001", action: "Prioritize ML model enhancement", impact: "Capture additional alpha", urgency: "this-month" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 62 }, { week: "W29", value: 68 }, { week: "W30", value: 72 }, { week: "W31", value: 76 }, { week: "W32", value: 80 }]
  },
  {
    id: "pmo-gi-002",
    name: "ESG Scoring Integration",
    bu: "Group Investments",
    status: "green" as const,
    budget: { spent: 0.5, total: 0.8, unit: "£m" },
    timeline: { elapsed: 4, total: 6, unit: "months" },
    deliverables: { completed: 7, total: 10 },
    risks: ["Third-party ESG data quality"],
    nextMilestone: "Production release - Week 26",
    safe: {
      velocity: 58,
      predictability: 90,
      flowEfficiency: 82,
      currentPI: "PI 24.4",
      epicId: "EPIC-GI-002",
      epicName: "Sustainable Investment Framework",
      epicProgress: 72,
      okr: { objective: "Integrate ESG into all investment decisions", keyResult: "100% portfolio coverage", progress: 78 },
      piTrend: [{ pi: "PI 24.1", velocity: 50, predictability: 84 }, { pi: "PI 24.2", velocity: 53, predictability: 86 }, { pi: "PI 24.3", velocity: 55, predictability: 88 }, { pi: "PI 24.4", velocity: 58, predictability: 90 }]
    },
    safeStage: "done" as const,
    aiSignals: [
      { type: "insight" as const, message: "ESG integration showing positive correlation with returns", confidence: 88, dataSource: "Portfolio analytics" }
    ],
    proactiveActions: [
      { id: "pa-gi-002", action: "Document ESG-return correlation for investor comms", impact: "Strengthen ESG narrative", urgency: "this-month" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W28", value: 72 }, { week: "W29", value: 78 }, { week: "W30", value: 82 }, { week: "W31", value: 86 }, { week: "W32", value: 90 }]
  },
  {
    id: "pmo-rt-funnel-001",
    name: "Customer Journey Reimagination",
    bu: "Retail",
    status: "green" as const,
    budget: { spent: 0.1, total: 0.5, unit: "£m" },
    timeline: { elapsed: 1, total: 8, unit: "months" },
    deliverables: { completed: 1, total: 12 },
    risks: ["Scope definition"],
    nextMilestone: "Discovery complete - Week 26",
    safe: {
      velocity: 35,
      predictability: 70,
      flowEfficiency: 55,
      currentPI: "PI 24.4",
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
    bu: "Asset Management",
    status: "amber" as const,
    budget: { spent: 0.2, total: 1.2, unit: "£m" },
    timeline: { elapsed: 2, total: 14, unit: "months" },
    deliverables: { completed: 2, total: 18 },
    risks: ["Regulatory approval timeline"],
    nextMilestone: "Business case approval - Week 28",
    safe: {
      velocity: 30,
      predictability: 65,
      flowEfficiency: 50,
      currentPI: "PI 24.4",
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
    id: "pmo-ir-reviewing-001",
    name: "Bulk Annuity Platform v2",
    bu: "Institutional Retirement",
    status: "green" as const,
    budget: { spent: 0.3, total: 2.8, unit: "£m" },
    timeline: { elapsed: 2, total: 16, unit: "months" },
    deliverables: { completed: 3, total: 22 },
    risks: ["Technical architecture decisions pending"],
    nextMilestone: "Architecture review - Week 27",
    safe: {
      velocity: 38,
      predictability: 72,
      flowEfficiency: 58,
      currentPI: "PI 24.4",
      epicId: "EPIC-IR-REVIEW",
      epicName: "Next Gen Bulk Annuity",
      epicProgress: 15,
      okr: { objective: "Double bulk annuity capacity", keyResult: "Process £20bn annually", progress: 12 },
      piTrend: [{ pi: "PI 24.4", velocity: 38, predictability: 72 }]
    },
    safeStage: "reviewing" as const,
    aiSignals: [
      { type: "insight" as const, message: "Cloud-native architecture could reduce costs 35%", confidence: 82, dataSource: "Architecture analysis" }
    ],
    proactiveActions: [
      { id: "pa-ir-r-001", action: "Schedule architecture decision workshop", impact: "Unblock detailed design", urgency: "this-week" as const, type: "accelerate" as const }
    ],
    trendData: [{ week: "W32", value: 15 }]
  },
  {
    id: "pmo-ci-analyzing-001",
    name: "Build-to-Rent Platform Enhancement",
    bu: "Corporate Investments",
    status: "amber" as const,
    budget: { spent: 0.4, total: 1.6, unit: "£m" },
    timeline: { elapsed: 3, total: 10, unit: "months" },
    deliverables: { completed: 4, total: 14 },
    risks: ["Integration with property management systems"],
    nextMilestone: "Requirements sign-off - Week 29",
    safe: {
      velocity: 40,
      predictability: 74,
      flowEfficiency: 60,
      currentPI: "PI 24.4",
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
    id: "pmo-rc-backlog-001",
    name: "Operational Resilience Framework",
    bu: "Risk & Compliance",
    status: "green" as const,
    budget: { spent: 0.5, total: 1.8, unit: "£m" },
    timeline: { elapsed: 4, total: 12, unit: "months" },
    deliverables: { completed: 5, total: 16 },
    risks: ["Cross-BU coordination"],
    nextMilestone: "Sprint 1 start - Week 26",
    safe: {
      velocity: 42,
      predictability: 78,
      flowEfficiency: 65,
      currentPI: "PI 24.4",
      epicId: "EPIC-RC-BACKLOG",
      epicName: "Enterprise Resilience",
      epicProgress: 32,
      okr: { objective: "Meet operational resilience requirements", keyResult: "100% IBS mapping", progress: 28 },
      piTrend: [{ pi: "PI 24.4", velocity: 42, predictability: 78 }]
    },
    safeStage: "portfolio-backlog" as const,
    aiSignals: [
      { type: "insight" as const, message: "Early mapping shows 85% IBS coverage already", confidence: 85, dataSource: "Resilience assessment" }
    ],
    proactiveActions: [
      { id: "pa-rc-b-001", action: "Prioritize gap analysis for remaining 15%", impact: "Focus remediation efforts", urgency: "this-week" as const, type: "accelerate" as const }
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
    { id: "kpi-am-001-2", name: "Transaction Volume", value: 2.8, target: 5.0, unit: "£bn", weight: 0.35, trend: "up", lastUpdated: new Date() },
    { id: "kpi-am-001-3", name: "Cost per Transaction", value: 45, target: 30, unit: "£", weight: 0.20, trend: "down", lastUpdated: new Date() },
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
    objective: "Accelerate PRT Deal Processing",
    keyResults: [
      { id: "kr-001-1", description: "Reduce deal cycle time from 18 days to 5 days", progress: 68, target: 100, unit: "%", contributingKPIs: ["kpi-ir-001-1", "kpi-ir-001-2"], calculationMethod: "Weighted average of processing time and error rate improvements" },
      { id: "kr-001-2", description: "Increase throughput to 200 deals/month", progress: 72, target: 100, unit: "%", contributingKPIs: ["kpi-ir-001-3"], calculationMethod: "Current throughput / target throughput * 100" },
      { id: "kr-001-3", description: "Achieve 4.5/5 customer satisfaction", progress: 93, target: 100, unit: "%", contributingKPIs: ["kpi-ir-001-4"], calculationMethod: "Current score / target score * 100" }
    ],
    overallProgress: 78,
    strategicPriority: "critical",
    owner: "Andrew Kail",
    buAlignment: ["Institutional Retirement"]
  },
  {
    id: "okr-002",
    objective: "Build Private Markets Capability",
    keyResults: [
      { id: "kr-002-1", description: "Platform operational for £5bn transactions", progress: 56, target: 100, unit: "%", contributingKPIs: ["kpi-am-001-2"], calculationMethod: "Transaction volume / target volume * 100" },
      { id: "kr-002-2", description: "Achieve 99.9% platform uptime", progress: 99, target: 100, unit: "%", contributingKPIs: ["kpi-am-001-1"], calculationMethod: "Current uptime / target uptime * 100" },
      { id: "kr-002-3", description: "Reduce transaction costs by 35%", progress: 45, target: 100, unit: "%", contributingKPIs: ["kpi-am-001-3"], calculationMethod: "Cost reduction achieved / target reduction * 100" }
    ],
    overallProgress: 67,
    strategicPriority: "high",
    owner: "Eric Adler",
    buAlignment: ["Asset Management"]
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
    buAlignment: ["Retail"]
  },
  {
    id: "okr-004",
    objective: "Enterprise Cloud Transformation",
    keyResults: [
      { id: "kr-004-1", description: "Migrate 80% workloads to cloud", progress: 65, target: 100, unit: "%", contributingKPIs: ["kpi-gt-001-1"], calculationMethod: "Workloads migrated / target * 100" },
      { id: "kr-004-2", description: "Reduce infrastructure costs 40%", progress: 70, target: 100, unit: "%", contributingKPIs: ["kpi-gt-001-2"], calculationMethod: "Cost reduction / target * 100" },
      { id: "kr-004-3", description: "Increase deployment frequency to 20/week", progress: 60, target: 100, unit: "%", contributingKPIs: ["kpi-gt-001-3"], calculationMethod: "Current frequency / target * 100" }
    ],
    overallProgress: 65,
    strategicPriority: "critical",
    owner: "Group CTO",
    buAlignment: ["Group Technology"]
  }
];

export function calculateVROMetricsFromProjects(): VROAggregatedMetric[] {
  const allProjects = EXPANDED_PMO_PROJECTS;
  
  const completedProjects = allProjects.filter(p => p.safeStage === 'done');
  const implementingProjects = allProjects.filter(p => p.safeStage === 'implementing');
  const allActiveProjects = allProjects.filter(p => p.safeStage !== 'done');
  
  let totalBudget = 0;
  let totalSpent = 0;
  let totalValueRealized = 0;
  let totalExpectedValue = 0;
  
  vroPrograms.forEach(prog => {
    totalValueRealized += prog.valueRealized;
    totalExpectedValue += prog.roiValue;
  });
  
  allProjects.forEach(proj => {
    totalBudget += proj.budget.total;
    totalSpent += proj.budget.spent;
  });
  
  const currentROI = totalExpectedValue > 0 ? Math.round((totalValueRealized / totalExpectedValue) * 100) : 0;
  
  const avgPredictability = Math.round(
    allActiveProjects.reduce((sum, p) => sum + p.safe.predictability, 0) / allActiveProjects.length
  );
  
  const avgVelocity = Math.round(
    allActiveProjects.reduce((sum, p) => sum + p.safe.velocity, 0) / allActiveProjects.length
  );
  
  const onTrackCount = allProjects.filter(p => p.status === 'green').length;
  const deliverySuccessRate = Math.round((onTrackCount / allProjects.length) * 100);
  
  const okrProgress = Math.round(OKRS.reduce((sum, okr) => sum + okr.overallProgress, 0) / OKRS.length);

  return [
    {
      id: "vro-metric-001",
      name: "Current ROI",
      currentValue: currentROI,
      targetValue: 85,
      unit: "%",
      sourceOKRs: OKRS.map(o => o.id),
      calculationFormula: "(Total Value Realized / Total Expected Value) × 100",
      breakdown: [
        { source: "Institutional Retirement", contribution: 35, value: vroPrograms.filter(p => p.bu === "Institutional Retirement").reduce((s, p) => s + p.valueRealized, 0) },
        { source: "Asset Management", contribution: 28, value: vroPrograms.filter(p => p.bu === "Asset Management").reduce((s, p) => s + p.valueRealized, 0) },
        { source: "Retail", contribution: 22, value: vroPrograms.filter(p => p.bu === "Retail").reduce((s, p) => s + p.valueRealized, 0) },
        { source: "Corporate Investments", contribution: 15, value: vroPrograms.filter(p => p.bu === "Corporate Investments").reduce((s, p) => s + p.valueRealized, 0) }
      ],
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
      calculationFormula: "Average progress across all strategic OKRs",
      breakdown: OKRS.map(okr => ({
        source: okr.objective.substring(0, 30) + "...",
        contribution: Math.round(100 / OKRS.length),
        value: okr.overallProgress
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
