// Art of the Possible - 5 Phase Transformation Journey Data
// Mobile-specific colors: #C50B30 (red primary), #007FAA (blue secondary), #F6F6F6 (grey bg)

export interface TransformationPhase {
  id: number;
  name: string;
  shortName: string;
  description: string;
  duration: string;
  asIs: PhaseState;
  toBe: PhaseState;
  screens: MobileScreen[];
}

export interface PhaseState {
  title: string;
  pain: string;
  metrics: { label: string; value: string; trend: "up" | "down" | "flat" }[];
  process: string[];
}

export interface MobileScreen {
  id: string;
  title: string;
  type: "alert" | "dashboard" | "form" | "collaboration" | "insight";
  content: string;
  persona?: Persona;
  aiAction?: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

export interface AIAlert {
  id: string;
  timestamp: string;
  message: string;
  severity: "info" | "warning" | "critical";
  targetPersona: string;
  phase: number;
  sentiment?: number;
}

export interface CollaborationEvent {
  id: string;
  timestamp: string;
  persona: string;
  action: string;
  phase: number;
}

export const personas: Persona[] = [
  { id: "ceo", name: "António Simões", role: "Group CEO", avatar: "👤", color: "#C50B30" },
  { id: "cfo", name: "Jeff Davies", role: "Group CFO", avatar: "💼", color: "#007FAA" },
  { id: "cro", name: "Risk Officer", role: "Chief Risk Officer", avatar: "🛡️", color: "#424242" },
  { id: "cio", name: "Tech Lead", role: "Chief Investment Officer", avatar: "📊", color: "#00843D" },
];

export const transformationPhases: TransformationPhase[] = [
  {
    id: 1,
    name: "Opportunity Identification",
    shortName: "Opportunity ID",
    description: "AI scans portfolio, market signals, and internal data to surface transformation opportunities",
    duration: "2-4 weeks",
    asIs: {
      title: "Manual Opportunity Discovery",
      pain: "Opportunities discovered reactively through quarterly reviews",
      metrics: [
        { label: "Discovery Time", value: "8-12 weeks", trend: "down" },
        { label: "Missed Opportunities", value: "35%", trend: "down" },
        { label: "Data Sources", value: "3 siloed", trend: "flat" },
      ],
      process: [
        "Wait for quarterly business review",
        "Manual spreadsheet analysis",
        "Email chains for validation",
        "Committee presentation prep",
      ],
    },
    toBe: {
      title: "AI-Powered Opportunity Radar",
      pain: "Real-time AI surfaces opportunities with confidence scores",
      metrics: [
        { label: "Discovery Time", value: "Real-time", trend: "up" },
        { label: "Missed Opportunities", value: "5%", trend: "up" },
        { label: "Data Sources", value: "12 integrated", trend: "up" },
      ],
      process: [
        "AI monitors 12 data streams continuously",
        "Anomaly detection flags opportunities",
        "Auto-generates business case draft",
        "Push notification to relevant persona",
      ],
    },
    screens: [
      { id: "1-1", title: "Opportunity Radar", type: "dashboard", content: "Live feed of AI-detected opportunities with confidence scores", aiAction: "3 new PRT opportunities detected in FTSE 350" },
      { id: "1-2", title: "Market Signal", type: "alert", content: "Phoenix Group pension scheme showing stress signals", persona: personas[0], aiAction: "CEO briefed on acquisition target" },
      { id: "1-3", title: "Portfolio Scan", type: "insight", content: "AI analysis of £1.1tn AUM for optimization opportunities" },
    ],
  },
  {
    id: 2,
    name: "TMO Engagement",
    shortName: "TMO Engage",
    description: "Transformation Management Office orchestrates stakeholder alignment and resource planning",
    duration: "1-2 weeks",
    asIs: {
      title: "Manual Stakeholder Coordination",
      pain: "Weeks of email chains and calendar coordination",
      metrics: [
        { label: "Alignment Time", value: "3-4 weeks", trend: "down" },
        { label: "Stakeholder Conflicts", value: "40%", trend: "down" },
        { label: "Resource Visibility", value: "Limited", trend: "flat" },
      ],
      process: [
        "Manual stakeholder identification",
        "Multiple alignment meetings",
        "Resource availability checks via email",
        "Conflict resolution through escalation",
      ],
    },
    toBe: {
      title: "Intelligent Orchestration",
      pain: "AI pre-aligns stakeholders and auto-schedules based on availability",
      metrics: [
        { label: "Alignment Time", value: "48 hours", trend: "up" },
        { label: "Stakeholder Conflicts", value: "8%", trend: "up" },
        { label: "Resource Visibility", value: "Real-time", trend: "up" },
      ],
      process: [
        "AI maps stakeholder network automatically",
        "Sentiment analysis on communications",
        "Auto-scheduling with conflict detection",
        "Real-time collaboration workspace",
      ],
    },
    screens: [
      { id: "2-1", title: "Stakeholder Map", type: "dashboard", content: "AI-generated influence network with engagement scores" },
      { id: "2-2", title: "Auto-Schedule", type: "form", content: "Intelligent meeting scheduler found optimal slot", aiAction: "Scheduled alignment call with 95% attendance probability" },
      { id: "2-3", title: "Sentiment Pulse", type: "insight", content: "Real-time sentiment analysis: CFO concerns about timing", persona: personas[1] },
    ],
  },
  {
    id: 3,
    name: "Prioritization & Business Case",
    shortName: "Prioritization",
    description: "AI generates business cases with ROI projections and risk-adjusted scoring",
    duration: "1-2 weeks",
    asIs: {
      title: "Manual Business Case Development",
      pain: "Weeks of analyst time building spreadsheet models",
      metrics: [
        { label: "Case Development", value: "4-6 weeks", trend: "down" },
        { label: "Accuracy", value: "60%", trend: "down" },
        { label: "Scenarios Modeled", value: "2-3", trend: "flat" },
      ],
      process: [
        "Gather data from multiple departments",
        "Build financial model in Excel",
        "Manual risk assessment",
        "Present to steering committee",
      ],
    },
    toBe: {
      title: "AI Business Case Generator",
      pain: "Instant business case generation with 50+ scenario simulations",
      metrics: [
        { label: "Case Development", value: "24 hours", trend: "up" },
        { label: "Accuracy", value: "92%", trend: "up" },
        { label: "Scenarios Modeled", value: "50+", trend: "up" },
      ],
      process: [
        "AI pulls data from integrated systems",
        "Monte Carlo simulations run automatically",
        "Risk-adjusted NPV calculated instantly",
        "Executive summary auto-generated",
      ],
    },
    screens: [
      { id: "3-1", title: "Case Generator", type: "form", content: "AI-generated business case for PRT acceleration", aiAction: "Projected £45m value creation over 3 years" },
      { id: "3-2", title: "Risk Matrix", type: "dashboard", content: "Automated risk scoring with mitigation recommendations", persona: personas[2] },
      { id: "3-3", title: "Scenario Compare", type: "insight", content: "50 Monte Carlo simulations completed" },
    ],
  },
  {
    id: 4,
    name: "Approval & Resourcing",
    shortName: "Approval",
    description: "Streamlined governance with AI-prepared approval packages and resource allocation",
    duration: "1 week",
    asIs: {
      title: "Committee-Based Approval",
      pain: "Multiple committee cycles and manual resource negotiations",
      metrics: [
        { label: "Approval Cycle", value: "4-8 weeks", trend: "down" },
        { label: "Rework Rate", value: "45%", trend: "down" },
        { label: "Resource Conflicts", value: "High", trend: "down" },
      ],
      process: [
        "Prepare committee presentation",
        "Wait for monthly committee meeting",
        "Address questions and rework",
        "Negotiate resources with departments",
      ],
    },
    toBe: {
      title: "Intelligent Governance",
      pain: "Pre-approved thresholds with AI governance recommendations",
      metrics: [
        { label: "Approval Cycle", value: "72 hours", trend: "up" },
        { label: "Rework Rate", value: "8%", trend: "up" },
        { label: "Resource Conflicts", value: "Minimal", trend: "up" },
      ],
      process: [
        "AI prepares approval package automatically",
        "Threshold-based auto-approval for low-risk",
        "Digital signatures with audit trail",
        "Smart resource allocation engine",
      ],
    },
    screens: [
      { id: "4-1", title: "Approval Queue", type: "dashboard", content: "Pending approvals with AI recommendations", persona: personas[0] },
      { id: "4-2", title: "Digital Sign", type: "form", content: "One-tap approval with full audit trail", aiAction: "CEO approved PRT initiative" },
      { id: "4-3", title: "Resource Allocator", type: "collaboration", content: "Smart resource matching based on skills and availability" },
    ],
  },
  {
    id: 5,
    name: "Design & Planning",
    shortName: "Design",
    description: "AI-assisted design thinking and sprint planning with real-time collaboration",
    duration: "2-4 weeks",
    asIs: {
      title: "Traditional Waterfall Planning",
      pain: "Long planning cycles with limited stakeholder input",
      metrics: [
        { label: "Planning Duration", value: "8-12 weeks", trend: "down" },
        { label: "Scope Creep", value: "35%", trend: "down" },
        { label: "Team Alignment", value: "Moderate", trend: "flat" },
      ],
      process: [
        "Gather requirements through workshops",
        "Create detailed project plan",
        "Review and revise multiple times",
        "Finalize and handoff to delivery",
      ],
    },
    toBe: {
      title: "Agile AI-Assisted Design",
      pain: "Rapid iteration with AI-generated design options and sprint plans",
      metrics: [
        { label: "Planning Duration", value: "2 weeks", trend: "up" },
        { label: "Scope Creep", value: "10%", trend: "up" },
        { label: "Team Alignment", value: "High", trend: "up" },
      ],
      process: [
        "AI generates design options from requirements",
        "Real-time collaboration on digital whiteboard",
        "Automated sprint plan generation",
        "Continuous feedback integration",
      ],
    },
    screens: [
      { id: "5-1", title: "Design Studio", type: "collaboration", content: "Real-time collaborative design canvas" },
      { id: "5-2", title: "Sprint Planner", type: "dashboard", content: "AI-generated sprint backlog with capacity matching", aiAction: "Sprint 1 planned: 12 story points, 85% confidence" },
      { id: "5-3", title: "Team Pulse", type: "insight", content: "Team sentiment and velocity tracking", persona: personas[3] },
    ],
  },
];

export const sampleAIAlerts: AIAlert[] = [
  { id: "a1", timestamp: "2 min ago", message: "Phoenix Group showing pension stress signals - potential PRT opportunity", severity: "critical", targetPersona: "ceo", phase: 1, sentiment: 0.85 },
  { id: "a2", timestamp: "15 min ago", message: "CFO sentiment analysis: concerns about Q2 timing", severity: "warning", targetPersona: "cfo", phase: 2, sentiment: 0.45 },
  { id: "a3", timestamp: "1 hour ago", message: "Business case approved - resource allocation recommended", severity: "info", targetPersona: "cio", phase: 4, sentiment: 0.92 },
  { id: "a4", timestamp: "2 hours ago", message: "CRO review required: elevated credit risk in scenario 3", severity: "warning", targetPersona: "cro", phase: 3, sentiment: 0.55 },
  { id: "a5", timestamp: "3 hours ago", message: "Sprint velocity tracking: 15% ahead of forecast", severity: "info", targetPersona: "cio", phase: 5, sentiment: 0.88 },
];

export const sampleCollaborationEvents: CollaborationEvent[] = [
  { id: "c1", timestamp: "Just now", persona: "ceo", action: "Viewed PRT opportunity briefing", phase: 1 },
  { id: "c2", timestamp: "5 min ago", persona: "cfo", action: "Added comment on business case", phase: 3 },
  { id: "c3", timestamp: "12 min ago", persona: "cro", action: "Approved risk assessment", phase: 3 },
  { id: "c4", timestamp: "30 min ago", persona: "cio", action: "Updated sprint capacity", phase: 5 },
  { id: "c5", timestamp: "1 hour ago", persona: "ceo", action: "Digitally signed approval", phase: 4 },
];

export const voiceCommands = [
  "Show me today's opportunities",
  "What's the status of the PRT initiative?",
  "Brief me on CFO concerns",
  "Approve the pending business case",
  "Schedule alignment meeting for tomorrow",
];
