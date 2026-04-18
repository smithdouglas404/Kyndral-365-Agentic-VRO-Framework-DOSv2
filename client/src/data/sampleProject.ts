/**
 * Realistic SAFe sample project with deliberate problems baked in
 * so PMO + VRO agents have something meaningful to surface during demos.
 *
 * Built-in problems:
 *   - Budget overrun: actual $4.2M vs $3.5M plan (+20%)
 *   - Slipping milestone: "Beta Launch" expected 14 days late
 *   - 1 critical unmitigated risk: vendor API deprecation
 *   - 1 over-allocated resource: Priya Raman 130%
 *   - 1 weakly-aligned objective: Mobile App Adoption (28% progress)
 *   - 1 governance gate failing: Status Reports Current
 */

export const sampleSafeProject = {
  name: "Aurora Customer Portal Modernization",
  bu: "bu-customer-experience",
  description:
    "Replatform the legacy customer portal onto a microservices architecture with self-service onboarding and real-time entitlements.",
  status: "active",
  priority: "high",
  expectedROI: 38,
  roiValue: 4200000,
  artName: "Customer Experience ART",
  portfolioTheme: "Digital Customer Experience",
  safeStage: "implementing",
  timeline: {
    startDate: "2026-01-06",
    endDate: "2026-09-30",
  },
  budget: {
    spent: 4200000,
    total: 3500000,
    unit: "$",
  },
  safe: {
    currentPI: "PI-2026-Q2",
    totalPIs: 4,
    velocity: 78,
    predictability: 0.72,
    flowEfficiency: 0.41,
    epicId: "epic-aurora-portal",
    epicName: "Aurora Portal v2",
    epicProgress: 55,
  },
  features: [
    {
      name: "Self-Service Onboarding Wizard",
      description: "Guided multi-step onboarding with progress save/resume.",
      status: "in_progress",
      storyPoints: 89,
      completedPoints: 55,
      priority: "high",
      targetPi: "PI-2026-Q2",
      wsjf: { score: 21 },
      stories: [
        {
          name: "Email + SMS verification",
          status: "completed",
          storyPoints: 13,
          tasks: [
            { name: "Twilio integration", status: "completed", effortHours: 16, assignee: "Devon Park" },
            { name: "Verification UI", status: "completed", effortHours: 12, assignee: "Mira Cohen" },
          ],
        },
        {
          name: "KYC document upload",
          status: "in_progress",
          storyPoints: 21,
          tasks: [
            { name: "S3 upload pipeline", status: "in_progress", effortHours: 24, assignee: "Devon Park" },
            { name: "OCR validation", status: "blocked", effortHours: 32, assignee: "Priya Raman" },
          ],
        },
      ],
    },
    {
      name: "Real-Time Entitlements Engine",
      description: "Replace nightly batch with event-driven entitlements.",
      status: "in_progress",
      storyPoints: 144,
      completedPoints: 62,
      priority: "critical",
      targetPi: "PI-2026-Q2",
      wsjf: { score: 28 },
      stories: [
        {
          name: "Kafka topic design",
          status: "completed",
          storyPoints: 8,
          tasks: [{ name: "Schema registry setup", status: "completed", effortHours: 12, assignee: "Sam Okafor" }],
        },
        {
          name: "Entitlement projection service",
          status: "in_progress",
          storyPoints: 34,
          tasks: [
            { name: "Read model build", status: "in_progress", effortHours: 48, assignee: "Sam Okafor" },
            { name: "Cache invalidation", status: "planned", effortHours: 24, assignee: "Priya Raman" },
          ],
        },
      ],
    },
    {
      name: "Mobile App Companion",
      description: "Lightweight native shell wrapping the new portal.",
      status: "planned",
      storyPoints: 55,
      completedPoints: 0,
      priority: "medium",
      targetPi: "PI-2026-Q3",
      wsjf: { score: 11 },
      stories: [],
    },
  ],
  milestones: [
    {
      name: "Architecture Sign-off",
      date: "2026-01-30",
      status: "completed",
      completedDate: "2026-01-28",
      deliverables: ["C4 diagrams", "ADR pack"],
    },
    {
      name: "Onboarding MVP",
      date: "2026-03-15",
      status: "completed",
      completedDate: "2026-03-22",
      deliverables: ["Wizard live in staging"],
    },
    {
      name: "Beta Launch",
      date: "2026-05-01",
      status: "in_progress",
      expectedDate: "2026-05-15",
      deliverables: ["1000 beta users", "Real-time entitlements"],
    },
    {
      name: "GA Launch",
      date: "2026-08-15",
      status: "planned",
      expectedDate: "2026-09-05",
      deliverables: ["All BUs migrated"],
    },
    {
      name: "Legacy Decommission",
      date: "2026-09-30",
      status: "planned",
      expectedDate: "2026-10-20",
      deliverables: ["Old portal offline"],
    },
  ],
  resources: [
    { name: "Devon Park", role: "Senior Engineer", allocation: 90, team: "Onboarding Squad", skills: ["Node", "AWS"], costRate: 220 },
    { name: "Mira Cohen", role: "UX Designer", allocation: 75, team: "Onboarding Squad", skills: ["Figma", "Usability"], costRate: 180 },
    { name: "Sam Okafor", role: "Staff Engineer", allocation: 95, team: "Entitlements Squad", skills: ["Kafka", "Java"], costRate: 280 },
    { name: "Priya Raman", role: "Senior Engineer", allocation: 130, team: "Entitlements Squad", skills: ["Kafka", "Python", "ML"], costRate: 240 },
    { name: "Liang Wei", role: "QA Lead", allocation: 60, team: "Quality Guild", skills: ["Cypress", "k6"], costRate: 170 },
    { name: "Olivia Bach", role: "Product Manager", allocation: 80, team: "Aurora", skills: ["SAFe", "Discovery"], costRate: 230 },
  ],
  risks: [
    {
      name: "Vendor API deprecation (PaymentNet v3)",
      description: "Vendor announced sunset of v3 by Q3 2026. No replacement scoped.",
      probability: 5,
      impact: 5,
      status: "Open",
      mitigation: "",
      owner: "Sam Okafor",
      category: "vendor",
    },
    {
      name: "OCR accuracy below 95%",
      description: "Current model fails on glare and folded documents.",
      probability: 4,
      impact: 3,
      status: "Open",
      mitigation: "Pilot Textract as backup",
      owner: "Priya Raman",
      category: "technical",
    },
    {
      name: "GDPR data residency review",
      description: "EU data must remain in eu-west-1.",
      probability: 2,
      impact: 4,
      status: "Mitigated",
      mitigation: "Region-pinned buckets + audit log",
      owner: "Olivia Bach",
      category: "compliance",
    },
  ],
  dependencies: [
    {
      name: "Identity Service v4 cutover",
      type: "finish-to-start",
      status: "blocked",
      description: "Aurora portal requires Identity v4 SSO endpoints.",
    },
  ],
  financials: {
    capitalex: 2800000,
    opex: 1400000,
    contingency: 350000,
    npv: 6800000,
    irr: 27,
    paybackMonths: 22,
  },
  objectives: [
    {
      name: "Reduce customer onboarding time to under 5 minutes",
      description: "Cut median onboarding completion time from 18 min to under 5.",
      progress: 62,
      status: "on_track",
      alignmentStrength: 0.9,
      quarter: "2026-Q2",
      keyResults: [
        { name: "Median onboarding time", currentValue: 8, targetValue: 5, unit: "minutes" },
        { name: "Drop-off rate", currentValue: 18, targetValue: 8, unit: "%" },
      ],
    },
    {
      name: "Real-time entitlements latency p95 under 500ms",
      description: "Replace batch with stream and hit p95 SLO.",
      progress: 48,
      status: "at_risk",
      alignmentStrength: 0.85,
      quarter: "2026-Q2",
      keyResults: [
        { name: "Entitlements p95 latency", currentValue: 1200, targetValue: 500, unit: "ms" },
        { name: "Stale entitlement incidents/week", currentValue: 6, targetValue: 1, unit: "count" },
      ],
    },
    {
      name: "Mobile app monthly active adoption",
      description: "Drive native app to 25% MAU of portal users.",
      progress: 12,
      status: "at_risk",
      alignmentStrength: 0.35,
      quarter: "2026-Q3",
      keyResults: [
        { name: "Mobile MAU share", currentValue: 3, targetValue: 25, unit: "%" },
      ],
    },
  ],
  kpis: [
    { name: "Onboarding completion rate", category: "customer", metricType: "engagement", currentValue: 71, targetValue: 90, baselineValue: 54, unit: "%", weight: 0.3 },
    { name: "NPS lift vs legacy", category: "customer", metricType: "satisfaction", currentValue: 7, targetValue: 15, baselineValue: 0, unit: "points", weight: 0.2 },
    { name: "Cost per active user", category: "financial", metricType: "efficiency", currentValue: 4.8, targetValue: 2.5, baselineValue: 6.2, unit: "$/user/mo", weight: 0.25 },
    { name: "Entitlement freshness", category: "operational", metricType: "quality", currentValue: 65, targetValue: 99, baselineValue: 40, unit: "% under 1s", weight: 0.25 },
  ],
  governanceCheckpoints: [
    { name: "Business Case Approved", gate: "planning", rule: "Business Case Approved", status: "passed", required: true },
    { name: "Budget Allocated", gate: "planning", rule: "Budget Allocated", status: "passed", required: true },
    { name: "Architecture Review", gate: "planning", rule: "Architecture Review Signed Off", status: "passed", required: true },
    { name: "Kickoff Meeting Held", gate: "execution", rule: "Kickoff Meeting Held", status: "passed", required: true },
    { name: "Status Reports Current", gate: "execution", rule: "Status Reports Current", status: "failed", required: true, notes: "Last status report 18 days ago" },
    { name: "Risk Register Updated", gate: "execution", rule: "Risk Register Updated", status: "warning", required: true, notes: "Vendor risk has no mitigation" },
    { name: "Change Control Active", gate: "execution", rule: "Change Control Active", status: "passed", required: true },
    { name: "Deliverables Accepted", gate: "closure", rule: "Deliverables Accepted", status: "not_started", required: true },
    { name: "Lessons Learned Captured", gate: "closure", rule: "Lessons Learned Captured", status: "not_started", required: true },
  ],
};

export type SampleSafeProject = typeof sampleSafeProject;
