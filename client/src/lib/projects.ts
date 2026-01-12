// ============================================================================
// UNIFIED PROJECT DATA - Enriched PMO Projects with Portfolio-Level Detail
// Source of truth for all project views across the application
// ============================================================================

import { PMOProject, VROProgram, SAFePortfolioStage, SAFeMetrics, AISignal, ProactiveAction, TrendPoint } from './buPrograms';
import { Feature, Resource, Milestone, Dependency, Financials } from './safeProjectData';

// Cross-project dependency with health indicator
export interface ProjectDependency {
  projectId: string;
  projectName: string;
  type: "blocks" | "blocked-by" | "related";
  health: "green" | "yellow" | "red";
  description: string;
  impactIfDelayed?: string;
}

// Priority levels for project prioritization
export type ProjectPriority = "critical" | "high" | "medium" | "low";

// Enriched project combining PMO metrics with Portfolio-level detail
export interface EnrichedProject {
  id: string;
  name: string;
  bu: string; // Business Unit / Group Function Portfolio
  
  // Rich descriptive fields
  description: string;
  expectedROI: string;
  roiValue: number; // Numeric value in £m for calculations
  priority: ProjectPriority;
  aiRecommendation: string;
  
  // PMO tracking fields
  status: "green" | "amber" | "red";
  budget: { spent: number; total: number; unit: string };
  timeline: { elapsed: number; total: number; unit: string };
  deliverables: { completed: number; total: number };
  risks: string[];
  nextMilestone: string;
  
  // SAFe 6.0 metrics
  safe: SAFeMetrics;
  safeStage: SAFePortfolioStage;
  
  // SAFe 6.0 Hierarchy (Full Depth)
  artName?: string; // Agile Release Train name
  portfolioTheme?: string; // Strategic theme
  features?: Feature[]; // Features with nested stories and tasks
  resources?: Resource[]; // Team allocation
  milestones?: Milestone[]; // PI milestones with deliverables
  safeDependencies?: Dependency[]; // Cross-project dependencies (SAFe format)
  financials?: Financials; // Detailed financials including ROI
  currentPI?: number; // Current Program Increment (1-4)
  totalPIs?: number; // Total planned PIs
  velocity?: number; // Story points per sprint
  burndownHealth?: number; // 0-100
  qualityScore?: number; // 0-100
  
  // AI Enhancement
  aiSignals: AISignal[];
  proactiveActions: ProactiveAction[];
  trendData: TrendPoint[];
  
  // Cross-project dependencies
  dependencies: ProjectDependency[];
  
  // Linked VRO program (if applicable)
  linkedVROProgramId?: string;
}

// ============================================================================
// ENRICHED PROJECT DATA - All 24 Projects with Full Detail
// ============================================================================

export const enrichedProjects: EnrichedProject[] = [
  // ============================================================================
  // INSTITUTIONAL RETIREMENT (2 Projects)
  // ============================================================================
  {
    id: "pmo-ir-001",
    name: "PRT Intake System Upgrade",
    bu: "Institutional Retirement",
    description: "Modernizing the Pension Risk Transfer intake system to automate initial deal assessment, reduce manual processing, and accelerate deal cycle times. Integrating AI-powered document processing with actuarial workflows.",
    expectedROI: "£85m annual efficiency",
    roiValue: 85,
    priority: "critical",
    aiRecommendation: "High priority - legacy API degradation detected. Recommend cloud migration to reduce integration complexity by 40%. Schedule API performance review immediately.",
    status: "amber",
    budget: { spent: 2.4, total: 3.5, unit: "£m" },
    timeline: { elapsed: 8, total: 12, unit: "months" },
    deliverables: { completed: 6, total: 14 },
    risks: ["Integration delays with legacy systems", "Resource constraints in Q3"],
    nextMilestone: "UAT Phase 2 - Week 34",
    safe: {
      velocity: 48,
      predictability: 82,
      flowEfficiency: 68,
      currentPI: "PI 24.4",
      epicId: "EPIC-IR-101",
      epicName: "PRT Digital Transformation",
      epicProgress: 55,
      okr: { objective: "Reduce PRT processing time by 40%", keyResult: "Achieve 3-day turnaround", progress: 45 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 75 }, { pi: "PI 24.2", velocity: 45, predictability: 78 }, { pi: "PI 24.3", velocity: 46, predictability: 80 }, { pi: "PI 24.4", velocity: 48, predictability: 82 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "Legacy API response times degrading 23% - integration risk increasing", confidence: 87, dataSource: "System monitoring" },
      { type: "opportunity", message: "Cloud migration could reduce integration complexity by 40%", confidence: 72, dataSource: "Architecture review" }
    ],
    proactiveActions: [
      { id: "pa-001", action: "Schedule API performance review with legacy team", impact: "Prevent 2-week delay", urgency: "immediate", type: "mitigate" },
      { id: "pa-002", action: "Request additional contractor resources for Q3", impact: "Maintain delivery pace", urgency: "this-week", type: "escalate" }
    ],
    trendData: [{ week: "W28", value: 42 }, { week: "W29", value: 45 }, { week: "W30", value: 43 }, { week: "W31", value: 48 }, { week: "W32", value: 52 }],
    dependencies: [
      { projectId: "pmo-ir-002", projectName: "Longevity Model Enhancement", type: "related", health: "green", description: "Shares actuarial data pipeline", impactIfDelayed: "Minimal - separate workstreams" },
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "blocked-by", health: "yellow", description: "Requires ESG data feeds for sustainable PRT deals", impactIfDelayed: "2-week delay on ESG module" },
      { projectId: "pmo-rc-001", projectName: "Risk Appetite Dashboard Upgrade", type: "related", health: "yellow", description: "Risk metrics integration", impactIfDelayed: "Manual risk data entry required" }
    ],
    linkedVROProgramId: "vro-ir-001"
  },
  {
    id: "pmo-ir-002",
    name: "Longevity Model Enhancement",
    bu: "Institutional Retirement",
    description: "Upgrading actuarial mortality and longevity models with latest population data, improved ML prediction capabilities, and real-time cohort monitoring. Critical for accurate reserve calculations.",
    expectedROI: "£42m risk mitigation",
    roiValue: 42,
    priority: "high",
    aiRecommendation: "Model accuracy improved 12% with new mortality tables. Fast-track actuarial review to accelerate go-live by 1 week. Strong candidate for early completion bonus.",
    status: "green",
    budget: { spent: 0.8, total: 1.2, unit: "£m" },
    timeline: { elapsed: 5, total: 6, unit: "months" },
    deliverables: { completed: 8, total: 10 },
    risks: ["Actuarial sign-off pending"],
    nextMilestone: "Go-live - Week 28",
    safe: {
      velocity: 52,
      predictability: 91,
      flowEfficiency: 78,
      currentPI: "PI 25.1",
      epicId: "EPIC-IR-102",
      epicName: "Actuarial Model Modernization",
      epicProgress: 85,
      okr: { objective: "Improve mortality prediction accuracy", keyResult: "Achieve 95% model accuracy", progress: 82 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 82 }, { pi: "PI 24.2", velocity: 48, predictability: 85 }, { pi: "PI 24.3", velocity: 50, predictability: 88 }, { pi: "PI 25.1", velocity: 52, predictability: 91 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Model accuracy improved 12% with new mortality tables", confidence: 94, dataSource: "Actuarial analytics" }
    ],
    proactiveActions: [
      { id: "pa-003", action: "Fast-track actuarial review to accelerate go-live", impact: "Save 1 week", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 78 }, { week: "W29", value: 82 }, { week: "W30", value: 85 }, { week: "W31", value: 88 }, { week: "W32", value: 92 }],
    dependencies: [
      { projectId: "pmo-ir-001", projectName: "PRT Intake System Upgrade", type: "related", health: "green", description: "Feeds pricing models for intake", impactIfDelayed: "PRT pricing less accurate" },
      { projectId: "pmo-rc-002", projectName: "Three Lines of Defence Automation", type: "blocks", health: "green", description: "Model outputs feed risk controls", impactIfDelayed: "Risk controls use legacy data" }
    ],
    linkedVROProgramId: "vro-ir-002"
  },

  // ============================================================================
  // ASSET MANAGEMENT (2 Projects)
  // ============================================================================
  {
    id: "pmo-am-001",
    name: "Private Markets Platform Build",
    bu: "Asset Management",
    description: "Building enterprise platform for private markets investments including infrastructure, real estate, and clean energy. Critical enabler for £2.5bn AUM growth target. Integrating deal pipeline, valuation, and investor reporting.",
    expectedROI: "£2.5bn new AUM capacity",
    roiValue: 125, // 5% fee on new AUM
    priority: "critical",
    aiRecommendation: "URGENT: Budget overrun 5% with vendor financial stress signals detected. Recommend immediate steering committee escalation. Freeze non-essential scope changes and identify backup vendor.",
    status: "red",
    budget: { spent: 4.2, total: 4.0, unit: "£m" },
    timeline: { elapsed: 14, total: 18, unit: "months" },
    deliverables: { completed: 12, total: 22 },
    risks: ["Budget overrun by 5%", "Key vendor dependency", "Scope creep from stakeholders"],
    nextMilestone: "Executive Steering - Week 32",
    safe: {
      velocity: 38,
      predictability: 65,
      flowEfficiency: 52,
      currentPI: "PI 24.4",
      epicId: "EPIC-AM-201",
      epicName: "Private Markets Capability Build",
      epicProgress: 45,
      okr: { objective: "Grow private markets AUM by 20%", keyResult: "Platform operational for £5bn transactions", progress: 35 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 42, predictability: 72 }, { pi: "PI 24.3", velocity: 40, predictability: 68 }, { pi: "PI 24.4", velocity: 38, predictability: 65 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "Vendor showing financial stress signals - backup plan needed", confidence: 78, dataSource: "Vendor risk monitoring" },
      { type: "warning", message: "Scope creep adding £800k unless controlled now", confidence: 91, dataSource: "Change request analysis" },
      { type: "prediction", message: "Timeline likely to slip 6 weeks without intervention", confidence: 85, dataSource: "Delivery analytics" }
    ],
    proactiveActions: [
      { id: "pa-004", action: "Escalate to Eric Adler - executive decision required", impact: "Unblock critical path", urgency: "immediate", type: "escalate" },
      { id: "pa-005", action: "Freeze non-essential scope changes", impact: "Contain budget overrun", urgency: "immediate", type: "mitigate" },
      { id: "pa-006", action: "Identify alternative vendor for backup", impact: "Reduce single-vendor risk", urgency: "this-week", type: "investigate" }
    ],
    trendData: [{ week: "W28", value: 52 }, { week: "W29", value: 50 }, { week: "W30", value: 48 }, { week: "W31", value: 45 }, { week: "W32", value: 42 }],
    dependencies: [
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "blocks", health: "red", description: "Platform provides data for ESG analytics", impactIfDelayed: "ESG analytics delayed 6 weeks" },
      { projectId: "pmo-ci-001", projectName: "Net Zero Housing Tracker", type: "related", health: "yellow", description: "Shared infrastructure investment data", impactIfDelayed: "Manual data reconciliation" },
      { projectId: "pmo-rc-001", projectName: "Risk Appetite Dashboard Upgrade", type: "blocked-by", health: "yellow", description: "Risk limits required before launch", impactIfDelayed: "Cannot process large deals" }
    ],
    linkedVROProgramId: "vro-am-001"
  },
  {
    id: "pmo-am-002",
    name: "ESG Analytics Dashboard",
    bu: "Asset Management",
    description: "Comprehensive ESG analytics platform providing portfolio-level sustainability metrics, climate risk analysis, and TCFD/TNFD reporting. Covers 100% of portfolio holdings with third-party data integration.",
    expectedROI: "£15m in ESG mandate wins",
    roiValue: 15,
    priority: "high",
    aiRecommendation: "Opportunity to add TNFD nature-risk metrics ahead of competitors. First-mover advantage in biodiversity analytics could attract £800m additional ESG mandates.",
    status: "green",
    budget: { spent: 0.6, total: 0.9, unit: "£m" },
    timeline: { elapsed: 4, total: 8, unit: "months" },
    deliverables: { completed: 5, total: 11 },
    risks: ["Data quality from third parties"],
    nextMilestone: "Beta release - Week 26",
    safe: {
      velocity: 55,
      predictability: 88,
      flowEfficiency: 75,
      currentPI: "PI 24.3",
      epicId: "EPIC-AM-202",
      epicName: "ESG Data & Reporting",
      epicProgress: 62,
      okr: { objective: "Achieve industry-leading ESG analytics", keyResult: "Cover 100% of portfolio holdings", progress: 58 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 80 }, { pi: "PI 24.2", velocity: 50, predictability: 82 }, { pi: "PI 24.3", velocity: 52, predictability: 85 }, { pi: "PI 24.3", velocity: 55, predictability: 88 }]
    },
    safeStage: "portfolio-backlog",
    aiSignals: [
      { type: "opportunity", message: "Add TNFD metrics to gain first-mover advantage", confidence: 82, dataSource: "Regulatory scanner" }
    ],
    proactiveActions: [
      { id: "pa-007", action: "Expand scope to include nature-risk metrics", impact: "Industry leadership", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 45 }, { week: "W29", value: 52 }, { week: "W30", value: 58 }, { week: "W31", value: 62 }, { week: "W32", value: 68 }],
    dependencies: [
      { projectId: "pmo-am-001", projectName: "Private Markets Platform Build", type: "blocked-by", health: "red", description: "Requires private markets data feed", impactIfDelayed: "Limited to public markets only" },
      { projectId: "pmo-ir-001", projectName: "PRT Intake System Upgrade", type: "blocks", health: "green", description: "Provides ESG scores for PRT deals", impactIfDelayed: "PRT lacks ESG module" },
      { projectId: "pmo-ci-001", projectName: "Net Zero Housing Tracker", type: "related", health: "green", description: "Shared carbon metrics", impactIfDelayed: "Duplicate carbon calculations" }
    ],
    linkedVROProgramId: "vro-am-002"
  },

  // ============================================================================
  // RETAIL (2 Projects)
  // ============================================================================
  {
    id: "pmo-rt-001",
    name: "Digital Onboarding Redesign",
    bu: "Retail",
    description: "Complete redesign of customer onboarding journey for insurance and savings products. Mobile-first approach with 10-minute completion target, integrated identity verification, and accessibility compliance.",
    expectedROI: "£28m efficiency + 15% conversion lift",
    roiValue: 28,
    priority: "high",
    aiRecommendation: "WCAG 2.1 compliance at 78% - needs 95% for launch. Engage accessibility specialist immediately. Step 3 redesign could increase conversion by 15%.",
    status: "amber",
    budget: { spent: 1.8, total: 2.5, unit: "£m" },
    timeline: { elapsed: 6, total: 10, unit: "months" },
    deliverables: { completed: 7, total: 16 },
    risks: ["Mobile app testing delays", "Accessibility compliance gaps"],
    nextMilestone: "Customer pilot - Week 30",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 65,
      currentPI: "PI 24.4",
      epicId: "EPIC-RT-301",
      epicName: "Customer Digital Experience",
      epicProgress: 48,
      okr: { objective: "Achieve 50% digital policy adoption", keyResult: "Reduce onboarding time to under 10 minutes", progress: 52 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 42, predictability: 74 }, { pi: "PI 24.3", velocity: 44, predictability: 76 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "WCAG 2.1 compliance at 78% - needs 95% for launch", confidence: 96, dataSource: "Accessibility scanner" },
      { type: "insight", message: "Drop-off rate highest at step 3 - simplification would increase conversion 15%", confidence: 88, dataSource: "User analytics" }
    ],
    proactiveActions: [
      { id: "pa-008", action: "Engage accessibility specialist contractor", impact: "Close compliance gap", urgency: "this-week", type: "mitigate" },
      { id: "pa-009", action: "Redesign step 3 to reduce friction", impact: "+15% conversion", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 38 }, { week: "W29", value: 42 }, { week: "W30", value: 44 }, { week: "W31", value: 48 }, { week: "W32", value: 52 }],
    dependencies: [
      { projectId: "pmo-rt-002", projectName: "AI Chatbot Implementation", type: "blocks", health: "green", description: "Onboarding feeds chatbot training data", impactIfDelayed: "Chatbot lacks onboarding support" },
      { projectId: "pmo-rc-001", projectName: "Risk Appetite Dashboard Upgrade", type: "related", health: "yellow", description: "Risk scoring for new customers", impactIfDelayed: "Manual risk assessment required" }
    ],
    linkedVROProgramId: "vro-rt-001"
  },
  {
    id: "pmo-rt-002",
    name: "AI Chatbot Implementation",
    bu: "Retail",
    description: "Deploying AI-powered customer service chatbot to handle 50% of queries, reduce call center volume by 30%, and improve response times. Integrated with knowledge base and escalation workflows.",
    expectedROI: "£8m annual call center savings",
    roiValue: 8,
    priority: "medium",
    aiRecommendation: "Current accuracy 89% exceeds 85% target. Plan Phase 2 with voice capability to handle 30% more queries. Strong success story for board presentation.",
    status: "green",
    budget: { spent: 0.4, total: 0.7, unit: "£m" },
    timeline: { elapsed: 3, total: 5, unit: "months" },
    deliverables: { completed: 4, total: 7 },
    risks: ["Training data quality"],
    nextMilestone: "Soft launch - Week 24",
    safe: {
      velocity: 62,
      predictability: 92,
      flowEfficiency: 82,
      currentPI: "PI 24.4",
      epicId: "EPIC-RT-302",
      epicName: "AI Customer Service",
      epicProgress: 72,
      okr: { objective: "Reduce customer service calls by 30%", keyResult: "Handle 50% of queries via AI", progress: 65 },
      piTrend: [{ pi: "PI 24.1", velocity: 52, predictability: 85 }, { pi: "PI 24.2", velocity: 55, predictability: 87 }, { pi: "PI 24.3", velocity: 58, predictability: 90 }, { pi: "PI 24.4", velocity: 62, predictability: 92 }]
    },
    safeStage: "done",
    aiSignals: [
      { type: "insight", message: "Current accuracy 89% - exceeds 85% target", confidence: 95, dataSource: "ML model metrics" },
      { type: "opportunity", message: "Voice capability could handle 30% more queries", confidence: 76, dataSource: "Customer research" }
    ],
    proactiveActions: [
      { id: "pa-010", action: "Plan Phase 2 with voice capability", impact: "30% more automation", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 55 }, { week: "W29", value: 62 }, { week: "W30", value: 70 }, { week: "W31", value: 78 }, { week: "W32", value: 85 }],
    dependencies: [
      { projectId: "pmo-rt-001", projectName: "Digital Onboarding Redesign", type: "blocked-by", health: "yellow", description: "Needs onboarding data for training", impactIfDelayed: "Limited onboarding support" }
    ],
    linkedVROProgramId: "vro-rt-001"
  },

  // ============================================================================
  // CORPORATE INVESTMENTS (1 Project)
  // ============================================================================
  {
    id: "pmo-ci-001",
    name: "Net Zero Housing Tracker",
    bu: "Corporate Investments",
    description: "IoT-enabled carbon tracking platform for L&G Affordable Homes portfolio. Real-time energy monitoring, heat pump integration, and carbon reduction verification. Expanding from Millfield Green pilot to 1000 properties.",
    expectedROI: "£180m development value unlocked",
    roiValue: 180,
    priority: "high",
    aiRecommendation: "Energy savings 42% better than projected at pilot sites. Q4 rollout to 500 properties feasible ahead of schedule. Recommend acceleration to capture sustainability premium.",
    status: "green",
    budget: { spent: 0.5, total: 0.8, unit: "£m" },
    timeline: { elapsed: 4, total: 6, unit: "months" },
    deliverables: { completed: 6, total: 9 },
    risks: ["Sensor integration with older properties"],
    nextMilestone: "Phase 2 rollout - Week 27",
    safe: {
      velocity: 48,
      predictability: 88,
      flowEfficiency: 75,
      currentPI: "PI 24.4",
      epicId: "EPIC-CI-401",
      epicName: "Carbon Neutral Portfolio",
      epicProgress: 68,
      okr: { objective: "Achieve carbon neutral portfolio by 2030", keyResult: "Deploy to 1000 properties", progress: 45 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 82 }, { pi: "PI 24.2", velocity: 44, predictability: 84 }, { pi: "PI 24.3", velocity: 46, predictability: 86 }, { pi: "PI 24.4", velocity: 48, predictability: 88 }]
    },
    safeStage: "analyzing",
    aiSignals: [
      { type: "insight", message: "Energy savings 42% better than projected in pilot sites", confidence: 92, dataSource: "IoT telemetry" },
      { type: "prediction", message: "Q4 rollout to 500 properties feasible ahead of schedule", confidence: 81, dataSource: "Capacity model" }
    ],
    proactiveActions: [
      { id: "pa-011", action: "Accelerate rollout to 500 properties by Q4", impact: "Earlier carbon savings", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 62 }, { week: "W29", value: 68 }, { week: "W30", value: 72 }, { week: "W31", value: 78 }, { week: "W32", value: 82 }],
    dependencies: [
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "related", health: "green", description: "Carbon data feeds ESG reporting", impactIfDelayed: "Manual carbon reporting" },
      { projectId: "pmo-am-001", projectName: "Private Markets Platform Build", type: "related", health: "red", description: "Asset valuation integration", impactIfDelayed: "Separate valuation workflows" }
    ],
    linkedVROProgramId: "vro-ci-001"
  },

  // ============================================================================
  // RISK & COMPLIANCE (2 Projects)
  // ============================================================================
  {
    id: "pmo-rc-001",
    name: "Risk Appetite Dashboard Upgrade",
    bu: "Risk & Compliance",
    description: "Enterprise risk dashboard providing real-time risk appetite monitoring across all business units. Integration with CRO reporting, regulatory stress testing, and early warning indicators. Critical for PRA compliance.",
    expectedROI: "£60m risk savings + regulatory compliance",
    roiValue: 60,
    priority: "critical",
    aiRecommendation: "PRA consultation may require 3 additional metrics. Engage with regulator to clarify requirements and avoid rework. Focus data lineage sprint on 2 priority legacy systems to close 80% of gaps.",
    status: "amber",
    budget: { spent: 1.1, total: 1.5, unit: "£m" },
    timeline: { elapsed: 7, total: 9, unit: "months" },
    deliverables: { completed: 9, total: 15 },
    risks: ["Data lineage documentation incomplete", "Regulatory changes pending"],
    nextMilestone: "CRO sign-off - Week 29",
    safe: {
      velocity: 42,
      predictability: 75,
      flowEfficiency: 62,
      currentPI: "PI 24.3",
      epicId: "EPIC-RC-501",
      epicName: "Enterprise Risk Framework",
      epicProgress: 58,
      okr: { objective: "Zero regulatory breaches", keyResult: "100% risk appetite coverage", progress: 72 },
      piTrend: [{ pi: "PI 24.1", velocity: 38, predictability: 70 }, { pi: "PI 24.2", velocity: 40, predictability: 72 }, { pi: "PI 24.3", velocity: 41, predictability: 74 }, { pi: "PI 24.3", velocity: 42, predictability: 75 }]
    },
    safeStage: "reviewing",
    aiSignals: [
      { type: "warning", message: "PRA consultation may require 3 additional metrics", confidence: 74, dataSource: "Regulatory intelligence" },
      { type: "insight", message: "Data lineage gaps concentrated in 2 legacy systems", confidence: 88, dataSource: "Data quality scan" }
    ],
    proactiveActions: [
      { id: "pa-012", action: "Engage with PRA to clarify requirements", impact: "Avoid rework", urgency: "this-week", type: "investigate" },
      { id: "pa-013", action: "Focus data lineage sprint on 2 priority systems", impact: "Close 80% of gaps", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 58 }, { week: "W29", value: 60 }, { week: "W30", value: 62 }, { week: "W31", value: 64 }, { week: "W32", value: 66 }],
    dependencies: [
      { projectId: "pmo-am-001", projectName: "Private Markets Platform Build", type: "blocks", health: "red", description: "Risk limits for private markets deals", impactIfDelayed: "Private markets cannot launch" },
      { projectId: "pmo-ir-001", projectName: "PRT Intake System Upgrade", type: "related", health: "yellow", description: "PRT risk scoring integration", impactIfDelayed: "Manual risk assessment for PRT" },
      { projectId: "pmo-rt-001", projectName: "Digital Onboarding Redesign", type: "related", health: "yellow", description: "Customer risk profiling", impactIfDelayed: "Basic risk scoring only" }
    ],
    linkedVROProgramId: "vro-rc-001"
  },
  {
    id: "pmo-rc-002",
    name: "Three Lines of Defence Automation",
    bu: "Risk & Compliance",
    description: "Automating the Three Lines of Defence model with integrated GRC platform. Control testing automation, audit trail generation, and real-time compliance monitoring. Targeting 80% control automation.",
    expectedROI: "£12m compliance efficiency",
    roiValue: 12,
    priority: "medium",
    aiRecommendation: "Retail division showing 92% adoption in pilot - highest across BUs. Create success playbook to accelerate rollout to other business units.",
    status: "green",
    budget: { spent: 0.7, total: 1.0, unit: "£m" },
    timeline: { elapsed: 5, total: 8, unit: "months" },
    deliverables: { completed: 6, total: 10 },
    risks: ["User adoption in Business Lines"],
    nextMilestone: "Pilot in Retail - Week 26",
    safe: {
      velocity: 52,
      predictability: 85,
      flowEfficiency: 72,
      currentPI: "PI 25.1",
      epicId: "EPIC-RC-502",
      epicName: "GRC Automation Platform",
      epicProgress: 65,
      okr: { objective: "Complete operational resilience framework", keyResult: "Automate 80% of controls", progress: 58 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 48, predictability: 80 }, { pi: "PI 24.3", velocity: 50, predictability: 82 }, { pi: "PI 25.1", velocity: 52, predictability: 85 }]
    },
    safeStage: "funnel",
    aiSignals: [
      { type: "insight", message: "Retail division showing 92% adoption in pilot - highest across BUs", confidence: 94, dataSource: "Usage analytics" },
      { type: "opportunity", message: "Success playbook from Retail can accelerate other BU rollouts", confidence: 86, dataSource: "Change management" }
    ],
    proactiveActions: [
      { id: "pa-014", action: "Create Retail playbook for other BU adoption", impact: "Faster enterprise rollout", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 58 }, { week: "W29", value: 65 }, { week: "W30", value: 72 }, { week: "W31", value: 78 }, { week: "W32", value: 85 }],
    dependencies: [
      { projectId: "pmo-ir-002", projectName: "Longevity Model Enhancement", type: "blocked-by", health: "green", description: "Model outputs for control testing", impactIfDelayed: "Limited actuarial controls" },
      { projectId: "pmo-rc-001", projectName: "Risk Appetite Dashboard Upgrade", type: "related", health: "yellow", description: "Shared risk data layer", impactIfDelayed: "Duplicate data infrastructure" }
    ],
    linkedVROProgramId: "vro-rc-002"
  },

  // ============================================================================
  // ADDITIONAL PROJECTS TO REACH 24 (Strategic Growth Initiatives)
  // ============================================================================
  
  // Additional Institutional Retirement Projects
  {
    id: "pmo-ir-003",
    name: "Bulk Annuity Pricing Engine",
    bu: "Institutional Retirement",
    description: "Next-generation pricing engine with ML-driven mortality assumptions, real-time market data integration, and automated quote generation. Targeting 50% reduction in pricing turnaround time.",
    expectedROI: "£35m additional deal capacity",
    roiValue: 35,
    priority: "high",
    aiRecommendation: "ML model showing 8% improvement in pricing accuracy. Integrate with PRT intake system for seamless workflow.",
    status: "green",
    budget: { spent: 1.2, total: 1.8, unit: "£m" },
    timeline: { elapsed: 4, total: 9, unit: "months" },
    deliverables: { completed: 5, total: 12 },
    risks: ["ML model validation with actuaries", "Market data vendor dependency"],
    nextMilestone: "UAT completion - Week 30",
    safe: {
      velocity: 50,
      predictability: 85,
      flowEfficiency: 70,
      currentPI: "PI 24.4",
      epicId: "EPIC-IR-103",
      epicName: "Pricing Automation",
      epicProgress: 45,
      okr: { objective: "Reduce pricing turnaround by 50%", keyResult: "Same-day quote capability", progress: 40 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 78 }, { pi: "PI 24.2", velocity: 45, predictability: 80 }, { pi: "PI 24.3", velocity: 48, predictability: 83 }, { pi: "PI 24.4", velocity: 50, predictability: 85 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "ML model showing 8% improvement in pricing accuracy", confidence: 88, dataSource: "Model validation" },
      { type: "opportunity", message: "Same-day quotes could increase deal win rate by 12%", confidence: 75, dataSource: "Sales analytics" }
    ],
    proactiveActions: [
      { id: "pa-015", action: "Accelerate actuarial validation for ML model", impact: "Earlier go-live", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 35 }, { week: "W29", value: 40 }, { week: "W30", value: 45 }, { week: "W31", value: 52 }, { week: "W32", value: 58 }],
    dependencies: [
      { projectId: "pmo-ir-001", projectName: "PRT Intake System Upgrade", type: "blocked-by", health: "yellow", description: "Integration point for quotes", impactIfDelayed: "Manual quote transfer" },
      { projectId: "pmo-ir-002", projectName: "Longevity Model Enhancement", type: "blocked-by", health: "green", description: "Mortality assumptions source", impactIfDelayed: "Legacy assumptions used" }
    ]
  },
  {
    id: "pmo-ir-004",
    name: "Pension Scheme Data Hub",
    bu: "Institutional Retirement",
    description: "Centralized data platform for pension scheme information, member records, and benefit calculations. Enabling self-service for scheme administrators and automated member communications.",
    expectedROI: "£18m operational savings",
    roiValue: 18,
    priority: "medium",
    aiRecommendation: "Data quality improvements showing 15% reduction in member queries. Scale to all administered schemes.",
    status: "amber",
    budget: { spent: 0.9, total: 1.4, unit: "£m" },
    timeline: { elapsed: 6, total: 10, unit: "months" },
    deliverables: { completed: 6, total: 13 },
    risks: ["Legacy data migration complexity", "GDPR compliance requirements"],
    nextMilestone: "Data migration phase 2 - Week 32",
    safe: {
      velocity: 42,
      predictability: 75,
      flowEfficiency: 62,
      currentPI: "PI 24.3",
      epicId: "EPIC-IR-104",
      epicName: "Pension Administration Platform",
      epicProgress: 50,
      okr: { objective: "Improve scheme administration efficiency", keyResult: "90% self-service adoption", progress: 35 },
      piTrend: [{ pi: "PI 24.1", velocity: 38, predictability: 70 }, { pi: "PI 24.2", velocity: 40, predictability: 72 }, { pi: "PI 24.3", velocity: 41, predictability: 74 }, { pi: "PI 24.3", velocity: 42, predictability: 75 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "Legacy data migration at 65% - quality issues in source systems", confidence: 82, dataSource: "Data profiling" },
      { type: "insight", message: "Self-service reducing member queries by 15%", confidence: 90, dataSource: "Support analytics" }
    ],
    proactiveActions: [
      { id: "pa-016", action: "Allocate data cleansing resources for legacy migration", impact: "Improve data quality", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 45 }, { week: "W29", value: 48 }, { week: "W30", value: 50 }, { week: "W31", value: 52 }, { week: "W32", value: 55 }],
    dependencies: [
      { projectId: "pmo-ir-001", projectName: "PRT Intake System Upgrade", type: "related", health: "green", description: "Member data for PRT deals", impactIfDelayed: "Manual member data handling" }
    ]
  },

  // Additional Asset Management Projects
  {
    id: "pmo-am-003",
    name: "Client Portal Modernization",
    bu: "Asset Management",
    description: "Redesigning LGIM client portal with enhanced reporting, real-time portfolio views, and self-service capabilities. Mobile-responsive design with API integration for institutional clients.",
    expectedROI: "£22m client retention value",
    roiValue: 22,
    priority: "high",
    aiRecommendation: "Client satisfaction scores improved 18% in beta testing. Prioritize institutional client features to reduce churn risk.",
    status: "green",
    budget: { spent: 1.0, total: 1.6, unit: "£m" },
    timeline: { elapsed: 5, total: 10, unit: "months" },
    deliverables: { completed: 6, total: 14 },
    risks: ["API backward compatibility", "Client migration coordination"],
    nextMilestone: "Institutional client pilot - Week 28",
    safe: {
      velocity: 52,
      predictability: 86,
      flowEfficiency: 72,
      currentPI: "PI 24.4",
      epicId: "EPIC-AM-203",
      epicName: "Client Experience Platform",
      epicProgress: 55,
      okr: { objective: "Improve client satisfaction to 85%", keyResult: "Launch new portal with 100% feature parity", progress: 50 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 80 }, { pi: "PI 24.2", velocity: 48, predictability: 82 }, { pi: "PI 24.3", velocity: 50, predictability: 84 }, { pi: "PI 24.4", velocity: 52, predictability: 86 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Client satisfaction improved 18% in beta testing", confidence: 91, dataSource: "NPS surveys" },
      { type: "opportunity", message: "Self-service could reduce client service costs by £3m", confidence: 78, dataSource: "Cost analysis" }
    ],
    proactiveActions: [
      { id: "pa-017", action: "Prioritize top 10 institutional clients for pilot", impact: "Protect £2bn AUM at risk", urgency: "this-week", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 42 }, { week: "W29", value: 48 }, { week: "W30", value: 52 }, { week: "W31", value: 58 }, { week: "W32", value: 62 }],
    dependencies: [
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "blocked-by", health: "green", description: "ESG reporting integration", impactIfDelayed: "No ESG data in portal" },
      { projectId: "pmo-am-001", projectName: "Private Markets Platform Build", type: "blocked-by", health: "red", description: "Private markets data feeds", impactIfDelayed: "Limited to public markets" }
    ]
  },
  {
    id: "pmo-am-004",
    name: "Investment Research AI",
    bu: "Asset Management",
    description: "AI-powered research platform providing automated analysis of earnings calls, regulatory filings, and market sentiment. Augmenting analyst capabilities with natural language processing.",
    expectedROI: "£8m analyst productivity gains",
    roiValue: 8,
    priority: "medium",
    aiRecommendation: "Pilot showing 25% reduction in research time. Expand to cover all FTSE 350 companies.",
    status: "green",
    budget: { spent: 0.5, total: 0.9, unit: "£m" },
    timeline: { elapsed: 3, total: 7, unit: "months" },
    deliverables: { completed: 4, total: 9 },
    risks: ["Model accuracy for niche sectors", "Data licensing costs"],
    nextMilestone: "Full FTSE coverage - Week 26",
    safe: {
      velocity: 58,
      predictability: 88,
      flowEfficiency: 78,
      currentPI: "PI 24.3",
      epicId: "EPIC-AM-204",
      epicName: "AI-Augmented Research",
      epicProgress: 50,
      okr: { objective: "Enhance research productivity by 30%", keyResult: "Cover 100% of investable universe", progress: 45 },
      piTrend: [{ pi: "PI 24.1", velocity: 50, predictability: 82 }, { pi: "PI 24.2", velocity: 52, predictability: 84 }, { pi: "PI 24.3", velocity: 55, predictability: 86 }, { pi: "PI 24.3", velocity: 58, predictability: 88 }]
    },
    safeStage: "analyzing",
    aiSignals: [
      { type: "insight", message: "Pilot showing 25% reduction in research time", confidence: 89, dataSource: "Productivity metrics" },
      { type: "opportunity", message: "Extend to earnings call analysis for real-time insights", confidence: 82, dataSource: "Feature requests" }
    ],
    proactiveActions: [
      { id: "pa-018", action: "Expand to FTSE 350 coverage by end of quarter", impact: "Full analyst adoption", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 35 }, { week: "W29", value: 42 }, { week: "W30", value: 48 }, { week: "W31", value: 55 }, { week: "W32", value: 62 }],
    dependencies: [
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "related", health: "green", description: "ESG data for research context", impactIfDelayed: "Limited ESG research" }
    ]
  },

  // Additional Retail Projects
  {
    id: "pmo-rt-003",
    name: "Protection Product Digitization",
    bu: "Retail",
    description: "Full digitization of protection product journey including life insurance, critical illness, and income protection. Automated underwriting with instant decisions for standard cases.",
    expectedROI: "£15m new business growth",
    roiValue: 15,
    priority: "high",
    aiRecommendation: "Automated underwriting approving 72% of cases instantly. Target 85% automation rate with enhanced medical data integration.",
    status: "amber",
    budget: { spent: 1.4, total: 2.0, unit: "£m" },
    timeline: { elapsed: 7, total: 11, unit: "months" },
    deliverables: { completed: 8, total: 15 },
    risks: ["Medical underwriting accuracy", "Regulatory approval for automated decisions"],
    nextMilestone: "Critical illness module launch - Week 31",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 65,
      currentPI: "PI 24.4",
      epicId: "EPIC-RT-303",
      epicName: "Protection Digital Transformation",
      epicProgress: 55,
      okr: { objective: "Grow protection APE by 15%", keyResult: "85% automated underwriting", progress: 60 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 42, predictability: 74 }, { pi: "PI 24.3", velocity: 44, predictability: 76 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Automated underwriting at 72% instant approval rate", confidence: 92, dataSource: "Underwriting metrics" },
      { type: "warning", message: "Critical illness module behind schedule - medical integration delayed", confidence: 85, dataSource: "Project tracking" }
    ],
    proactiveActions: [
      { id: "pa-019", action: "Expedite medical data integration partner contract", impact: "Unblock CI module", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 50 }, { week: "W29", value: 52 }, { week: "W30", value: 55 }, { week: "W31", value: 58 }, { week: "W32", value: 60 }],
    dependencies: [
      { projectId: "pmo-rt-001", projectName: "Digital Onboarding Redesign", type: "related", health: "yellow", description: "Shared customer journey", impactIfDelayed: "Inconsistent experience" },
      { projectId: "pmo-rc-001", projectName: "Risk Appetite Dashboard Upgrade", type: "blocked-by", health: "yellow", description: "Risk scoring for underwriting", impactIfDelayed: "Conservative risk limits" }
    ]
  },
  {
    id: "pmo-rt-004",
    name: "Savings & Investments Platform",
    bu: "Retail",
    description: "New retail investment platform for ISAs, investment bonds, and retirement products. Goal-based planning tools with AI-driven recommendations and portfolio modeling.",
    expectedROI: "£45m new inflows",
    roiValue: 45,
    priority: "high",
    aiRecommendation: "Market analysis shows 340% increase in goal-based planning demand. Prioritize retirement planning features for baby boomer segment.",
    status: "green",
    budget: { spent: 1.1, total: 2.2, unit: "£m" },
    timeline: { elapsed: 4, total: 12, unit: "months" },
    deliverables: { completed: 5, total: 18 },
    risks: ["Regulatory approval for robo-advice", "Platform scalability"],
    nextMilestone: "ISA module MVP - Week 26",
    safe: {
      velocity: 55,
      predictability: 85,
      flowEfficiency: 72,
      currentPI: "PI 24.3",
      epicId: "EPIC-RT-304",
      epicName: "Retail Investment Platform",
      epicProgress: 35,
      okr: { objective: "Launch market-leading investment platform", keyResult: "Achieve £500m inflows in year 1", progress: 28 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 78 }, { pi: "PI 24.2", velocity: 50, predictability: 80 }, { pi: "PI 24.3", velocity: 52, predictability: 82 }, { pi: "PI 24.3", velocity: 55, predictability: 85 }]
    },
    safeStage: "analyzing",
    aiSignals: [
      { type: "opportunity", message: "Goal-based planning demand up 340% - first-mover advantage", confidence: 87, dataSource: "Market research" },
      { type: "insight", message: "Baby boomer segment showing highest engagement in beta", confidence: 83, dataSource: "User analytics" }
    ],
    proactiveActions: [
      { id: "pa-020", action: "Prioritize retirement planning features for launch", impact: "Capture boomer segment", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 25 }, { week: "W29", value: 28 }, { week: "W30", value: 32 }, { week: "W31", value: 35 }, { week: "W32", value: 40 }],
    dependencies: [
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "blocked-by", health: "green", description: "ESG data for fund selection", impactIfDelayed: "Limited ESG fund options" },
      { projectId: "pmo-rt-001", projectName: "Digital Onboarding Redesign", type: "related", health: "yellow", description: "Customer onboarding flow", impactIfDelayed: "Separate onboarding" }
    ]
  },

  // Additional Corporate Investments Projects
  {
    id: "pmo-ci-002",
    name: "Infrastructure Asset Management System",
    bu: "Corporate Investments",
    description: "Digital platform for managing £5bn infrastructure investment portfolio including wind farms, solar parks, and transport assets. Real-time performance monitoring and predictive maintenance.",
    expectedROI: "£25m asset optimization",
    roiValue: 25,
    priority: "high",
    aiRecommendation: "Predictive maintenance reducing downtime by 18% in pilot assets. Scale to full infrastructure portfolio.",
    status: "green",
    budget: { spent: 0.8, total: 1.3, unit: "£m" },
    timeline: { elapsed: 5, total: 9, unit: "months" },
    deliverables: { completed: 6, total: 11 },
    risks: ["IoT sensor reliability", "Asset data standardization"],
    nextMilestone: "Wind farm integration - Week 28",
    safe: {
      velocity: 50,
      predictability: 86,
      flowEfficiency: 74,
      currentPI: "PI 24.4",
      epicId: "EPIC-CI-402",
      epicName: "Infrastructure Intelligence",
      epicProgress: 58,
      okr: { objective: "Optimize infrastructure returns", keyResult: "95% asset visibility", progress: 55 },
      piTrend: [{ pi: "PI 24.1", velocity: 44, predictability: 80 }, { pi: "PI 24.2", velocity: 46, predictability: 82 }, { pi: "PI 24.3", velocity: 48, predictability: 84 }, { pi: "PI 24.4", velocity: 50, predictability: 86 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Predictive maintenance reducing downtime by 18%", confidence: 90, dataSource: "Asset telemetry" },
      { type: "opportunity", message: "Extend to solar portfolio for additional £5m savings", confidence: 78, dataSource: "Asset analysis" }
    ],
    proactiveActions: [
      { id: "pa-021", action: "Scale predictive maintenance to all wind assets", impact: "£8m additional savings", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 48 }, { week: "W29", value: 52 }, { week: "W30", value: 55 }, { week: "W31", value: 58 }, { week: "W32", value: 62 }],
    dependencies: [
      { projectId: "pmo-ci-001", projectName: "Net Zero Housing Tracker", type: "related", health: "green", description: "Shared IoT platform", impactIfDelayed: "Separate IoT stacks" },
      { projectId: "pmo-am-001", projectName: "Private Markets Platform Build", type: "blocked-by", health: "red", description: "Asset valuation data", impactIfDelayed: "Manual valuations" }
    ]
  },
  {
    id: "pmo-ci-003",
    name: "Build to Rent Operating Platform",
    bu: "Corporate Investments",
    description: "End-to-end platform for L&G's Build to Rent portfolio including tenant management, maintenance scheduling, and rent optimization. Covering 3,000+ residential units.",
    expectedROI: "£12m operational efficiency",
    roiValue: 12,
    priority: "medium",
    aiRecommendation: "Tenant satisfaction improved 22% with new digital services. Expand to all BTR sites.",
    status: "green",
    budget: { spent: 0.6, total: 1.0, unit: "£m" },
    timeline: { elapsed: 4, total: 8, unit: "months" },
    deliverables: { completed: 5, total: 10 },
    risks: ["Tenant adoption of digital channels", "Integration with property managers"],
    nextMilestone: "National rollout - Week 29",
    safe: {
      velocity: 52,
      predictability: 88,
      flowEfficiency: 76,
      currentPI: "PI 24.4",
      epicId: "EPIC-CI-403",
      epicName: "BTR Digital Experience",
      epicProgress: 55,
      okr: { objective: "Lead BTR sector in tenant experience", keyResult: "Achieve 90% tenant satisfaction", progress: 60 },
      piTrend: [{ pi: "PI 24.1", velocity: 46, predictability: 82 }, { pi: "PI 24.2", velocity: 48, predictability: 84 }, { pi: "PI 24.3", velocity: 50, predictability: 86 }, { pi: "PI 24.4", velocity: 52, predictability: 88 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Tenant satisfaction improved 22% with digital services", confidence: 91, dataSource: "Tenant surveys" },
      { type: "opportunity", message: "Predictive maintenance could reduce repair costs by 15%", confidence: 75, dataSource: "Maintenance analytics" }
    ],
    proactiveActions: [
      { id: "pa-022", action: "Fast-track national rollout to all BTR sites", impact: "Capture market leadership", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 45 }, { week: "W29", value: 50 }, { week: "W30", value: 54 }, { week: "W31", value: 58 }, { week: "W32", value: 62 }],
    dependencies: [
      { projectId: "pmo-ci-001", projectName: "Net Zero Housing Tracker", type: "related", health: "green", description: "Carbon tracking for BTR", impactIfDelayed: "No sustainability metrics" }
    ]
  },

  // Additional Risk & Compliance Projects
  {
    id: "pmo-rc-003",
    name: "Regulatory Change Management",
    bu: "Risk & Compliance",
    description: "AI-powered platform for tracking, assessing, and implementing regulatory changes across all business units. Automated impact analysis with integrated workflow for compliance responses.",
    expectedROI: "£8m compliance efficiency",
    roiValue: 8,
    priority: "high",
    aiRecommendation: "25 regulatory changes in pipeline for 2025. Prioritize CSRD and PS1/SS3 climate disclosure requirements.",
    status: "amber",
    budget: { spent: 0.7, total: 1.1, unit: "£m" },
    timeline: { elapsed: 5, total: 9, unit: "months" },
    deliverables: { completed: 5, total: 11 },
    risks: ["Regulatory uncertainty", "Cross-BU coordination"],
    nextMilestone: "CSRD module live - Week 30",
    safe: {
      velocity: 44,
      predictability: 78,
      flowEfficiency: 65,
      currentPI: "PI 24.4",
      epicId: "EPIC-RC-503",
      epicName: "RegTech Platform",
      epicProgress: 50,
      okr: { objective: "Zero compliance surprises", keyResult: "Track 100% of applicable regulations", progress: 72 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 41, predictability: 74 }, { pi: "PI 24.3", velocity: 43, predictability: 76 }, { pi: "PI 24.4", velocity: 44, predictability: 78 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "CSRD implementation timeline compressed - accelerate preparations", confidence: 88, dataSource: "Regulatory intelligence" },
      { type: "insight", message: "25 significant regulatory changes tracked for 2025", confidence: 95, dataSource: "Regulatory scanner" }
    ],
    proactiveActions: [
      { id: "pa-023", action: "Prioritize CSRD and climate disclosure modules", impact: "Meet regulatory deadlines", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 42 }, { week: "W29", value: 45 }, { week: "W30", value: 48 }, { week: "W31", value: 52 }, { week: "W32", value: 55 }],
    dependencies: [
      { projectId: "pmo-rc-001", projectName: "Risk Appetite Dashboard Upgrade", type: "related", health: "yellow", description: "Risk impact integration", impactIfDelayed: "Manual risk assessment" },
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "blocked-by", health: "green", description: "Climate disclosure data", impactIfDelayed: "Limited climate reporting" }
    ]
  },
  {
    id: "pmo-rc-004",
    name: "Operational Resilience Framework",
    bu: "Risk & Compliance",
    description: "Building comprehensive operational resilience capability including impact tolerances, scenario testing, and recovery planning. Meeting PRA/FCA operational resilience requirements.",
    expectedROI: "Regulatory compliance + £5m avoided fines",
    roiValue: 5,
    priority: "critical",
    aiRecommendation: "March 2025 deadline approaching. 3 important business services still need impact tolerance mapping.",
    status: "amber",
    budget: { spent: 0.9, total: 1.2, unit: "£m" },
    timeline: { elapsed: 8, total: 10, unit: "months" },
    deliverables: { completed: 9, total: 12 },
    risks: ["Regulatory deadline pressure", "Third-party dependencies"],
    nextMilestone: "Board attestation - Week 32",
    safe: {
      velocity: 48,
      predictability: 82,
      flowEfficiency: 68,
      currentPI: "PI 24.4",
      epicId: "EPIC-RC-504",
      epicName: "Operational Resilience",
      epicProgress: 78,
      okr: { objective: "Full regulatory compliance by March 2025", keyResult: "100% IBS mapping complete", progress: 82 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 75 }, { pi: "PI 24.2", velocity: 44, predictability: 78 }, { pi: "PI 24.3", velocity: 46, predictability: 80 }, { pi: "PI 24.4", velocity: 48, predictability: 82 }]
    },
    safeStage: "reviewing",
    aiSignals: [
      { type: "warning", message: "3 important business services need impact tolerance mapping", confidence: 95, dataSource: "Compliance tracking" },
      { type: "insight", message: "82% of IBS mapping complete - on track for deadline", confidence: 90, dataSource: "Project tracking" }
    ],
    proactiveActions: [
      { id: "pa-024", action: "Sprint on remaining 3 IBS impact tolerances", impact: "Meet regulatory deadline", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 72 }, { week: "W29", value: 75 }, { week: "W30", value: 78 }, { week: "W31", value: 80 }, { week: "W32", value: 82 }],
    dependencies: [
      { projectId: "pmo-rc-002", projectName: "Three Lines of Defence Automation", type: "related", health: "green", description: "Control framework integration", impactIfDelayed: "Manual control testing" },
      { projectId: "pmo-rc-001", projectName: "Risk Appetite Dashboard Upgrade", type: "related", health: "yellow", description: "Risk tolerance alignment", impactIfDelayed: "Inconsistent tolerances" }
    ]
  },

  // Group-wide Strategic Projects
  {
    id: "pmo-grp-001",
    name: "Enterprise Data Platform",
    bu: "Group Functions",
    description: "Central data platform enabling cross-BU analytics, AI/ML capabilities, and regulatory reporting. Building single source of truth for customer, product, and financial data.",
    expectedROI: "£50m data-driven decision value",
    roiValue: 50,
    priority: "critical",
    aiRecommendation: "Data quality scores improved 35% in pilot domains. Accelerate rollout to support AI initiatives across all BUs.",
    status: "amber",
    budget: { spent: 3.2, total: 4.5, unit: "£m" },
    timeline: { elapsed: 10, total: 18, unit: "months" },
    deliverables: { completed: 12, total: 24 },
    risks: ["Data governance complexity", "Legacy system integration", "Resource constraints"],
    nextMilestone: "Customer 360 domain live - Week 30",
    safe: {
      velocity: 45,
      predictability: 75,
      flowEfficiency: 60,
      currentPI: "PI 24.4",
      epicId: "EPIC-GRP-001",
      epicName: "Enterprise Data Foundation",
      epicProgress: 52,
      okr: { objective: "Enable data-driven enterprise", keyResult: "100% priority domains migrated", progress: 48 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 68 }, { pi: "PI 24.2", velocity: 42, predictability: 70 }, { pi: "PI 24.3", velocity: 44, predictability: 73 }, { pi: "PI 24.4", velocity: 45, predictability: 75 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Data quality improved 35% in pilot domains", confidence: 88, dataSource: "Data quality metrics" },
      { type: "warning", message: "Customer domain integration behind schedule", confidence: 82, dataSource: "Project tracking" }
    ],
    proactiveActions: [
      { id: "pa-025", action: "Add resources to customer domain integration", impact: "Unblock AI initiatives", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 45 }, { week: "W29", value: 48 }, { week: "W30", value: 50 }, { week: "W31", value: 52 }, { week: "W32", value: 55 }],
    dependencies: [
      { projectId: "pmo-ir-001", projectName: "PRT Intake System Upgrade", type: "blocks", health: "yellow", description: "PRT data integration", impactIfDelayed: "Limited PRT analytics" },
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "blocks", health: "green", description: "ESG data foundation", impactIfDelayed: "ESG analytics delayed" },
      { projectId: "pmo-rt-002", projectName: "AI Chatbot Implementation", type: "blocks", health: "green", description: "Customer data for AI training", impactIfDelayed: "Limited chatbot knowledge" }
    ]
  },
  {
    id: "pmo-grp-002",
    name: "Climate Transition Analytics",
    bu: "Group Functions",
    description: "Platform for tracking L&G's net zero transition across all portfolios. Portfolio temperature scoring, transition pathway modeling, and TCFD/TNFD disclosure automation.",
    expectedROI: "Regulatory compliance + £100m green bond capacity",
    roiValue: 100,
    priority: "high",
    aiRecommendation: "Portfolio temperature at 2.4°C - transition pathway modeling shows 1.5°C achievable with £2.1bn reallocation. Position for green bond issuance.",
    status: "green",
    budget: { spent: 0.8, total: 1.4, unit: "£m" },
    timeline: { elapsed: 5, total: 10, unit: "months" },
    deliverables: { completed: 6, total: 13 },
    risks: ["Data availability for scope 3", "Methodology evolution"],
    nextMilestone: "TCFD automation live - Week 28",
    safe: {
      velocity: 52,
      predictability: 85,
      flowEfficiency: 72,
      currentPI: "PI 24.4",
      epicId: "EPIC-GRP-002",
      epicName: "Net Zero Acceleration",
      epicProgress: 55,
      okr: { objective: "Achieve 1.5°C portfolio alignment by 2030", keyResult: "100% portfolio coverage", progress: 62 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 48, predictability: 80 }, { pi: "PI 24.3", velocity: 50, predictability: 83 }, { pi: "PI 24.4", velocity: 52, predictability: 85 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "1.5°C pathway achievable with £2.1bn reallocation", confidence: 87, dataSource: "Climate model" },
      { type: "opportunity", message: "Green bond issuance enabled by credible pathway", confidence: 80, dataSource: "Treasury analysis" }
    ],
    proactiveActions: [
      { id: "pa-026", action: "Commission transition pathway analysis", impact: "Enable green financing", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 48 }, { week: "W29", value: 52 }, { week: "W30", value: 55 }, { week: "W31", value: 58 }, { week: "W32", value: 62 }],
    dependencies: [
      { projectId: "pmo-am-002", projectName: "ESG Analytics Dashboard", type: "related", health: "green", description: "Shared ESG data infrastructure", impactIfDelayed: "Duplicate data work" },
      { projectId: "pmo-ci-001", projectName: "Net Zero Housing Tracker", type: "related", health: "green", description: "Property carbon data", impactIfDelayed: "Missing real estate emissions" },
      { projectId: "pmo-rc-003", projectName: "Regulatory Change Management", type: "related", health: "yellow", description: "CSRD/TCFD requirements", impactIfDelayed: "Manual compliance tracking" }
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get all unique business units
export const getBusinessUnits = (): string[] => {
  return Array.from(new Set(enrichedProjects.map(p => p.bu)));
};

// Get all unique SAFe stages
export const getSafeStages = (): SAFePortfolioStage[] => {
  return ["funnel", "reviewing", "analyzing", "portfolio-backlog", "implementing", "done"];
};

// Get stage display label
export const getStageLabel = (stage: SAFePortfolioStage): string => {
  const labels: Record<SAFePortfolioStage, string> = {
    "funnel": "Funnel",
    "reviewing": "Reviewing",
    "analyzing": "Analyzing",
    "portfolio-backlog": "Backlog",
    "implementing": "Implementing",
    "done": "Done"
  };
  return labels[stage];
};

// Filter projects by business unit
export const getProjectsByBU = (bu: string): EnrichedProject[] => {
  return enrichedProjects.filter(p => p.bu === bu);
};

// Filter projects by stage
export const getProjectsByStage = (stage: SAFePortfolioStage): EnrichedProject[] => {
  return enrichedProjects.filter(p => p.safeStage === stage);
};

// Get project by ID
export const getProjectById = (id: string): EnrichedProject | undefined => {
  return enrichedProjects.find(p => p.id === id);
};

// Get all dependencies for a project
export const getProjectDependencies = (projectId: string): ProjectDependency[] => {
  const project = getProjectById(projectId);
  return project?.dependencies || [];
};

// Get projects that depend on this project
export const getDependentProjects = (projectId: string): EnrichedProject[] => {
  return enrichedProjects.filter(p => 
    p.dependencies.some(d => d.projectId === projectId)
  );
};

// Get cross-project dependency health summary
export const getDependencyHealthSummary = (): { green: number; yellow: number; red: number } => {
  const allDeps = enrichedProjects.flatMap(p => p.dependencies);
  return {
    green: allDeps.filter(d => d.health === "green").length,
    yellow: allDeps.filter(d => d.health === "yellow").length,
    red: allDeps.filter(d => d.health === "red").length
  };
};

// Summary statistics
export const projectSummary = {
  totalProjects: enrichedProjects.length,
  byStatus: {
    green: enrichedProjects.filter(p => p.status === "green").length,
    amber: enrichedProjects.filter(p => p.status === "amber").length,
    red: enrichedProjects.filter(p => p.status === "red").length
  },
  byPriority: {
    critical: enrichedProjects.filter(p => p.priority === "critical").length,
    high: enrichedProjects.filter(p => p.priority === "high").length,
    medium: enrichedProjects.filter(p => p.priority === "medium").length,
    low: enrichedProjects.filter(p => p.priority === "low").length
  },
  totalBudget: enrichedProjects.reduce((sum, p) => sum + p.budget.total, 0),
  totalSpent: enrichedProjects.reduce((sum, p) => sum + p.budget.spent, 0),
  totalExpectedROI: enrichedProjects.reduce((sum, p) => sum + p.roiValue, 0),
  dependencyHealth: getDependencyHealthSummary()
};

// ============================================================================
// SAFe HIERARCHY ENRICHMENT
// Links safeProjects data to enrichedProjects for full SAFe 6.0 depth
// ============================================================================

import { safeProjects, SAFeProject } from './safeProjectData';

// Mapping from enrichedProject IDs to safeProject IDs
const projectLinkMapping: Record<string, string> = {
  "pmo-ir-001": "proj-prt-platform",
  "pmo-ir-002": "proj-longevity-models",
  "pmo-am-001": "proj-private-markets",
  "pmo-am-002": "proj-esg-analytics",
  "pmo-retail-001": "proj-digital-savings",
  "pmo-retail-002": "proj-protection-platform",
  "pmo-ci-001": "proj-clean-energy",
  "pmo-ci-002": "proj-housing-delivery",
  "pmo-rc-001": "proj-operational-risk",
  "pmo-rc-002": "proj-three-lines"
};

// Get SAFe hierarchy for an enriched project
export function getSafeHierarchy(projectId: string): SAFeProject | undefined {
  const safeProjectId = projectLinkMapping[projectId];
  if (safeProjectId) {
    return safeProjects.find(sp => sp.id === safeProjectId);
  }
  return undefined;
}

// Get total features count for a project
export function getProjectFeatureCount(projectId: string): number {
  const safeProject = getSafeHierarchy(projectId);
  return safeProject?.features?.length || 0;
}

// Get total stories count for a project (sum of stories across all features)
export function getProjectStoryCount(projectId: string): number {
  const safeProject = getSafeHierarchy(projectId);
  if (!safeProject) return 0;
  return safeProject.features?.reduce((sum, f) => sum + (f.stories?.length || 0), 0) || 0;
}

// Get total tasks count for a project (sum of tasks across all stories)
export function getProjectTaskCount(projectId: string): number {
  const safeProject = getSafeHierarchy(projectId);
  if (!safeProject) return 0;
  return safeProject.features?.reduce((sum, f) => 
    sum + (f.stories?.reduce((s, story) => s + (story.tasks?.length || 0), 0) || 0), 0) || 0;
}

// Get ART name for a project
export function getProjectART(projectId: string): string {
  const safeProject = getSafeHierarchy(projectId);
  return safeProject?.artName || 'Transformation ART';
}

// Get total resources for a project
export function getProjectResources(projectId: string): Resource[] {
  const safeProject = getSafeHierarchy(projectId);
  return safeProject?.resources || [];
}

// Get milestones for a project
export function getProjectMilestones(projectId: string): Milestone[] {
  const safeProject = getSafeHierarchy(projectId);
  return safeProject?.milestones || [];
}

// Summary of SAFe coverage across all projects
export const safeCoverageSummary = {
  projectsWithFullSAFe: Object.keys(projectLinkMapping).length,
  totalProjects: enrichedProjects.length,
  coveragePercentage: Math.round((Object.keys(projectLinkMapping).length / enrichedProjects.length) * 100),
  totalFeatures: safeProjects.reduce((sum, p) => sum + (p.features?.length || 0), 0),
  totalStories: safeProjects.reduce((sum, p) => 
    sum + (p.features?.reduce((fs, f) => fs + (f.stories?.length || 0), 0) || 0), 0),
  totalTasks: safeProjects.reduce((sum, p) => 
    sum + (p.features?.reduce((fs, f) => 
      fs + (f.stories?.reduce((ss, s) => ss + (s.tasks?.length || 0), 0) || 0), 0) || 0), 0)
};
