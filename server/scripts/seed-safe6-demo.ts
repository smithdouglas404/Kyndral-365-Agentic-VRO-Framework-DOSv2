/**
 * SAFe 6.0 DEMO DATA SEED SCRIPT
 *
 * Creates comprehensive SAFe 6.0 demo data and syncs to Palantir Foundry.
 *
 * SAFe Hierarchy:
 * - Portfolio (Enterprise level)
 *   - Strategic Themes
 *   - Value Streams (Operational & Development)
 *     - ARTs (Agile Release Trains)
 *       - Teams
 *       - Program Increments
 *       - Features
 *         - Stories
 *         - Tasks
 *
 * Usage: npx tsx server/scripts/seed-safe6-demo.ts
 */

import { db } from "../db.js";
import {
  divisions,
  projects,
  features,
  stories,
  tasks,
  divisionKpis,
  divisionOkrs,
  enterpriseRisks,
} from "../../shared/schema.js";
import { getPostgresToPalantirSync } from "../services/PostgresToPalantirSync.js";

// ============================================================================
// SAFe 6.0 DEMO DATA
// ============================================================================

// Value Streams (mapped to divisions in our schema)
const VALUE_STREAMS = [
  {
    id: "vs-digital-platform",
    name: "Digital Platform Value Stream",
    ceo: "Sarah Chen",
    description: "End-to-end digital customer experience and platform modernization",
    color: "#0072CE",
    profit2023: 45,
    profit2024: 52,
    changePercent: 15.5,
  },
  {
    id: "vs-data-analytics",
    name: "Data & Analytics Value Stream",
    ceo: "Michael Rodriguez",
    description: "Enterprise data platform, AI/ML capabilities, and analytics solutions",
    color: "#00A651",
    profit2023: 38,
    profit2024: 48,
    changePercent: 26.3,
  },
  {
    id: "vs-cloud-infra",
    name: "Cloud Infrastructure Value Stream",
    ceo: "Jennifer Park",
    description: "Cloud migration, infrastructure modernization, and DevOps transformation",
    color: "#6B4C9A",
    profit2023: 62,
    profit2024: 71,
    changePercent: 14.5,
  },
  {
    id: "vs-customer-ops",
    name: "Customer Operations Value Stream",
    ceo: "David Thompson",
    description: "Customer service transformation, CRM modernization, and operational excellence",
    color: "#FF6B35",
    profit2023: 28,
    profit2024: 33,
    changePercent: 17.8,
  },
];

// Projects with full SAFe 6.0 attributes (18 projects)
const PROJECTS = [
  // Digital Platform Value Stream Projects
  {
    id: "prj-001",
    name: "Customer Portal 2.0",
    description: "Complete redesign of customer-facing portal with modern UX, self-service capabilities, and real-time analytics dashboard",
    status: "In Progress",
    divisionId: "vs-digital-platform",
    priority: "Critical",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "42",
    predictability: "87",
    flowEfficiency: "72",
    epicId: "E-101",
    epicName: "Digital Customer Experience",
    epicProgress: "65",
    budgetTotal: "4.5",
    budgetSpent: "2.8",
    budgetUnit: "$m",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-09-30"),
    expectedRoi: "340%",
    roiValue: "15.3",
    cpiValue: 1.05,
    spiValue: 0.92,
    earnedValue: 2940000,
    plannedValue: 3200000,
    progress: 65,
  },
  {
    id: "prj-002",
    name: "Mobile App Modernization",
    description: "Native iOS and Android apps with offline-first architecture, biometric auth, and push notifications",
    status: "In Progress",
    divisionId: "vs-digital-platform",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "38",
    predictability: "82",
    flowEfficiency: "68",
    epicId: "E-102",
    epicName: "Mobile Experience",
    epicProgress: "45",
    budgetTotal: "3.2",
    budgetSpent: "1.4",
    budgetUnit: "$m",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-11-30"),
    expectedRoi: "280%",
    roiValue: "8.9",
    cpiValue: 1.12,
    spiValue: 0.98,
    earnedValue: 1440000,
    plannedValue: 1470000,
    progress: 45,
  },
  {
    id: "prj-003",
    name: "API Gateway Modernization",
    description: "Enterprise API gateway with rate limiting, OAuth 2.0, and comprehensive API analytics",
    status: "In Progress",
    divisionId: "vs-digital-platform",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "35",
    predictability: "91",
    flowEfficiency: "75",
    epicId: "E-103",
    epicName: "Platform Integration",
    epicProgress: "72",
    budgetTotal: "2.1",
    budgetSpent: "1.5",
    budgetUnit: "$m",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2024-06-30"),
    expectedRoi: "420%",
    roiValue: "8.8",
    cpiValue: 0.98,
    spiValue: 1.02,
    earnedValue: 1512000,
    plannedValue: 1480000,
    progress: 72,
  },
  {
    id: "prj-004",
    name: "Design System Implementation",
    description: "Unified component library with accessibility compliance (WCAG 2.1 AA) across all digital properties",
    status: "Complete",
    divisionId: "vs-digital-platform",
    priority: "Medium",
    safeStage: "complete",
    currentPi: "PI-2023-Q4",
    velocity: "28",
    predictability: "95",
    flowEfficiency: "82",
    epicId: "E-104",
    epicName: "UX Standardization",
    epicProgress: "100",
    budgetTotal: "1.2",
    budgetSpent: "1.1",
    budgetUnit: "$m",
    startDate: new Date("2023-06-01"),
    endDate: new Date("2024-01-31"),
    expectedRoi: "180%",
    roiValue: "2.2",
    cpiValue: 1.09,
    spiValue: 1.00,
    earnedValue: 1200000,
    plannedValue: 1200000,
    progress: 100,
  },

  // Data & Analytics Value Stream Projects
  {
    id: "prj-005",
    name: "Enterprise Data Lake",
    description: "Unified data lake on Databricks with real-time ingestion, data quality monitoring, and self-service analytics",
    status: "In Progress",
    divisionId: "vs-data-analytics",
    priority: "Critical",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "45",
    predictability: "78",
    flowEfficiency: "65",
    epicId: "E-201",
    epicName: "Data Platform Modernization",
    epicProgress: "55",
    budgetTotal: "8.5",
    budgetSpent: "4.2",
    budgetUnit: "$m",
    startDate: new Date("2023-09-01"),
    endDate: new Date("2024-12-31"),
    expectedRoi: "520%",
    roiValue: "44.2",
    cpiValue: 0.95,
    spiValue: 0.88,
    earnedValue: 4675000,
    plannedValue: 5312500,
    progress: 55,
  },
  {
    id: "prj-006",
    name: "ML Ops Platform",
    description: "End-to-end MLOps platform with model registry, automated training pipelines, and A/B testing framework",
    status: "In Progress",
    divisionId: "vs-data-analytics",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "32",
    predictability: "85",
    flowEfficiency: "71",
    epicId: "E-202",
    epicName: "AI/ML Enablement",
    epicProgress: "40",
    budgetTotal: "5.2",
    budgetSpent: "1.9",
    budgetUnit: "$m",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-10-31"),
    expectedRoi: "380%",
    roiValue: "19.8",
    cpiValue: 1.08,
    spiValue: 0.95,
    earnedValue: 2080000,
    plannedValue: 2190000,
    progress: 40,
  },
  {
    id: "prj-007",
    name: "Real-Time Analytics Engine",
    description: "Apache Kafka-based streaming analytics with sub-second latency for operational dashboards",
    status: "At Risk",
    divisionId: "vs-data-analytics",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "28",
    predictability: "72",
    flowEfficiency: "58",
    epicId: "E-203",
    epicName: "Real-Time Intelligence",
    epicProgress: "35",
    budgetTotal: "3.8",
    budgetSpent: "1.8",
    budgetUnit: "$m",
    startDate: new Date("2023-11-01"),
    endDate: new Date("2024-08-31"),
    expectedRoi: "290%",
    roiValue: "11.0",
    cpiValue: 0.82,
    spiValue: 0.78,
    earnedValue: 1330000,
    plannedValue: 1706000,
    progress: 35,
  },
  {
    id: "prj-008",
    name: "Customer 360 Platform",
    description: "Unified customer data platform with identity resolution, segmentation, and personalization engine",
    status: "In Progress",
    divisionId: "vs-data-analytics",
    priority: "Critical",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "40",
    predictability: "83",
    flowEfficiency: "69",
    epicId: "E-204",
    epicName: "Customer Intelligence",
    epicProgress: "60",
    budgetTotal: "6.2",
    budgetSpent: "3.5",
    budgetUnit: "$m",
    startDate: new Date("2023-08-01"),
    endDate: new Date("2024-07-31"),
    expectedRoi: "450%",
    roiValue: "27.9",
    cpiValue: 1.02,
    spiValue: 0.96,
    earnedValue: 3720000,
    plannedValue: 3875000,
    progress: 60,
  },

  // Cloud Infrastructure Value Stream Projects
  {
    id: "prj-009",
    name: "AWS Migration Wave 1",
    description: "Migration of 120 applications to AWS with containerization and infrastructure as code",
    status: "In Progress",
    divisionId: "vs-cloud-infra",
    priority: "Critical",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "52",
    predictability: "88",
    flowEfficiency: "74",
    epicId: "E-301",
    epicName: "Cloud Migration",
    epicProgress: "70",
    budgetTotal: "12.5",
    budgetSpent: "8.2",
    budgetUnit: "$m",
    startDate: new Date("2023-04-01"),
    endDate: new Date("2024-06-30"),
    expectedRoi: "280%",
    roiValue: "35.0",
    cpiValue: 1.06,
    spiValue: 1.01,
    earnedValue: 8750000,
    plannedValue: 8660000,
    progress: 70,
  },
  {
    id: "prj-010",
    name: "Kubernetes Platform",
    description: "Enterprise Kubernetes platform with service mesh, GitOps deployment, and observability stack",
    status: "In Progress",
    divisionId: "vs-cloud-infra",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "38",
    predictability: "86",
    flowEfficiency: "70",
    epicId: "E-302",
    epicName: "Container Platform",
    epicProgress: "55",
    budgetTotal: "4.8",
    budgetSpent: "2.4",
    budgetUnit: "$m",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2024-09-30"),
    expectedRoi: "320%",
    roiValue: "15.4",
    cpiValue: 1.10,
    spiValue: 0.98,
    earnedValue: 2640000,
    plannedValue: 2695000,
    progress: 55,
  },
  {
    id: "prj-011",
    name: "Zero Trust Security",
    description: "Implementation of zero trust architecture with identity-centric security and micro-segmentation",
    status: "In Progress",
    divisionId: "vs-cloud-infra",
    priority: "Critical",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "30",
    predictability: "90",
    flowEfficiency: "78",
    epicId: "E-303",
    epicName: "Security Transformation",
    epicProgress: "48",
    budgetTotal: "5.5",
    budgetSpent: "2.5",
    budgetUnit: "$m",
    startDate: new Date("2023-11-01"),
    endDate: new Date("2024-10-31"),
    expectedRoi: "N/A",
    roiValue: "0",
    cpiValue: 1.04,
    spiValue: 0.94,
    earnedValue: 2640000,
    plannedValue: 2810000,
    progress: 48,
  },
  {
    id: "prj-012",
    name: "DevOps Transformation",
    description: "Enterprise-wide DevOps adoption with CI/CD pipelines, automated testing, and SRE practices",
    status: "In Progress",
    divisionId: "vs-cloud-infra",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "35",
    predictability: "84",
    flowEfficiency: "72",
    epicId: "E-304",
    epicName: "DevOps Excellence",
    epicProgress: "62",
    budgetTotal: "3.2",
    budgetSpent: "1.9",
    budgetUnit: "$m",
    startDate: new Date("2023-07-01"),
    endDate: new Date("2024-06-30"),
    expectedRoi: "250%",
    roiValue: "8.0",
    cpiValue: 1.02,
    spiValue: 1.00,
    earnedValue: 1984000,
    plannedValue: 1984000,
    progress: 62,
  },

  // Customer Operations Value Stream Projects
  {
    id: "prj-013",
    name: "Contact Center Modernization",
    description: "AI-powered contact center with omnichannel routing, sentiment analysis, and agent assist",
    status: "In Progress",
    divisionId: "vs-customer-ops",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "34",
    predictability: "81",
    flowEfficiency: "66",
    epicId: "E-401",
    epicName: "Contact Center Transformation",
    epicProgress: "52",
    budgetTotal: "4.2",
    budgetSpent: "2.1",
    budgetUnit: "$m",
    startDate: new Date("2023-09-01"),
    endDate: new Date("2024-08-31"),
    expectedRoi: "310%",
    roiValue: "13.0",
    cpiValue: 1.00,
    spiValue: 0.92,
    earnedValue: 2184000,
    plannedValue: 2375000,
    progress: 52,
  },
  {
    id: "prj-014",
    name: "Salesforce CRM Upgrade",
    description: "Upgrade to Salesforce Lightning with CPQ, Einstein Analytics, and integration hub",
    status: "At Risk",
    divisionId: "vs-customer-ops",
    priority: "Critical",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "25",
    predictability: "68",
    flowEfficiency: "55",
    epicId: "E-402",
    epicName: "CRM Modernization",
    epicProgress: "38",
    budgetTotal: "5.8",
    budgetSpent: "2.8",
    budgetUnit: "$m",
    startDate: new Date("2023-08-01"),
    endDate: new Date("2024-07-31"),
    expectedRoi: "220%",
    roiValue: "12.8",
    cpiValue: 0.78,
    spiValue: 0.72,
    earnedValue: 2204000,
    plannedValue: 3060000,
    progress: 38,
  },
  {
    id: "prj-015",
    name: "Field Service Automation",
    description: "Mobile-first field service platform with scheduling optimization and IoT integration",
    status: "In Progress",
    divisionId: "vs-customer-ops",
    priority: "Medium",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "30",
    predictability: "85",
    flowEfficiency: "70",
    epicId: "E-403",
    epicName: "Field Operations",
    epicProgress: "45",
    budgetTotal: "2.8",
    budgetSpent: "1.2",
    budgetUnit: "$m",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-10-31"),
    expectedRoi: "260%",
    roiValue: "7.3",
    cpiValue: 1.05,
    spiValue: 0.96,
    earnedValue: 1260000,
    plannedValue: 1312500,
    progress: 45,
  },
  {
    id: "prj-016",
    name: "Customer Success Platform",
    description: "Proactive customer health monitoring with churn prediction and expansion recommendations",
    status: "In Progress",
    divisionId: "vs-customer-ops",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "32",
    predictability: "88",
    flowEfficiency: "73",
    epicId: "E-404",
    epicName: "Customer Success",
    epicProgress: "58",
    budgetTotal: "2.5",
    budgetSpent: "1.4",
    budgetUnit: "$m",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2024-07-31"),
    expectedRoi: "380%",
    roiValue: "9.5",
    cpiValue: 1.04,
    spiValue: 1.02,
    earnedValue: 1450000,
    plannedValue: 1420000,
    progress: 58,
  },

  // Additional Strategic Projects
  {
    id: "prj-017",
    name: "Sustainability Dashboard",
    description: "ESG metrics tracking with carbon footprint calculation and sustainability reporting",
    status: "In Progress",
    divisionId: "vs-data-analytics",
    priority: "Medium",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "24",
    predictability: "92",
    flowEfficiency: "80",
    epicId: "E-205",
    epicName: "ESG Analytics",
    epicProgress: "68",
    budgetTotal: "1.5",
    budgetSpent: "0.95",
    budgetUnit: "$m",
    startDate: new Date("2023-11-01"),
    endDate: new Date("2024-05-31"),
    expectedRoi: "N/A",
    roiValue: "0",
    cpiValue: 1.06,
    spiValue: 1.05,
    earnedValue: 1020000,
    plannedValue: 970000,
    progress: 68,
  },
  {
    id: "prj-018",
    name: "Governance Risk & Compliance",
    description: "Integrated GRC platform with policy management, risk assessment, and audit automation",
    status: "In Progress",
    divisionId: "vs-cloud-infra",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "28",
    predictability: "87",
    flowEfficiency: "75",
    epicId: "E-305",
    epicName: "Enterprise GRC",
    epicProgress: "42",
    budgetTotal: "3.5",
    budgetSpent: "1.4",
    budgetUnit: "$m",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-11-30"),
    expectedRoi: "N/A",
    roiValue: "0",
    cpiValue: 1.02,
    spiValue: 0.95,
    earnedValue: 1470000,
    plannedValue: 1547000,
    progress: 42,
  },
];

// Features for each project (3-5 features per project)
const FEATURES = [
  // Customer Portal 2.0 Features
  { id: "f-001", projectId: "prj-001", name: "User Authentication & SSO", description: "OAuth 2.0 and SAML integration with enterprise IdPs", status: "Complete", storyPoints: "21", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-002", projectId: "prj-001", name: "Dashboard Framework", description: "Configurable dashboard with drag-drop widgets", status: "In Progress", storyPoints: "34", completedPoints: "21", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-003", projectId: "prj-001", name: "Self-Service Portal", description: "Account management and service requests", status: "In Progress", storyPoints: "28", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "22" },
  { id: "f-004", projectId: "prj-001", name: "Real-Time Notifications", description: "WebSocket-based push notifications", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "18" },

  // Mobile App Features
  { id: "f-005", projectId: "prj-002", name: "Biometric Authentication", description: "Face ID and Touch ID integration", status: "Complete", storyPoints: "13", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-006", projectId: "prj-002", name: "Offline Mode", description: "Local data sync and offline-first architecture", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-007", projectId: "prj-002", name: "Push Notifications", description: "Firebase-based push notification system", status: "In Progress", storyPoints: "8", completedPoints: "5", priority: "Medium", targetPi: "PI-2024-Q1", wsjfScore: "16" },

  // Enterprise Data Lake Features
  { id: "f-008", projectId: "prj-005", name: "Data Ingestion Framework", description: "Real-time and batch data ingestion pipelines", status: "In Progress", storyPoints: "34", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "30" },
  { id: "f-009", projectId: "prj-005", name: "Data Quality Engine", description: "Automated data quality checks and monitoring", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-010", projectId: "prj-005", name: "Self-Service Analytics", description: "SQL-based query interface for business users", status: "Backlog", storyPoints: "28", completedPoints: "0", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "24" },
  { id: "f-011", projectId: "prj-005", name: "Data Catalog", description: "Metadata management and data discovery", status: "Backlog", storyPoints: "21", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },

  // AWS Migration Features
  { id: "f-012", projectId: "prj-009", name: "Landing Zone Setup", description: "Multi-account AWS organization with guardrails", status: "Complete", storyPoints: "21", completedPoints: "21", priority: "Critical", targetPi: "PI-2023-Q4", wsjfScore: "28" },
  { id: "f-013", projectId: "prj-009", name: "Application Migration Factory", description: "Automated migration tooling and runbooks", status: "In Progress", storyPoints: "34", completedPoints: "28", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-014", projectId: "prj-009", name: "Network Connectivity", description: "Direct Connect and VPN configuration", status: "Complete", storyPoints: "13", completedPoints: "13", priority: "High", targetPi: "PI-2023-Q4", wsjfScore: "22" },
  { id: "f-015", projectId: "prj-009", name: "Cost Optimization", description: "Reserved instances and savings plans", status: "In Progress", storyPoints: "8", completedPoints: "5", priority: "Medium", targetPi: "PI-2024-Q1", wsjfScore: "18" },

  // Contact Center Features
  { id: "f-016", projectId: "prj-013", name: "Omnichannel Routing", description: "Unified routing for voice, chat, email, social", status: "In Progress", storyPoints: "28", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-017", projectId: "prj-013", name: "AI Agent Assist", description: "Real-time suggestions and knowledge retrieval", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-018", projectId: "prj-013", name: "Sentiment Analysis", description: "Real-time customer sentiment detection", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },
];

// Stories (2-4 per feature)
const STORIES = [
  // Authentication Stories
  { id: "s-001", featureId: "f-001", projectId: "prj-001", name: "Implement OAuth 2.0 flow", status: "Complete", storyPoints: "8", sprint: "Sprint 1", assignedTeam: "Platform Team" },
  { id: "s-002", featureId: "f-001", projectId: "prj-001", name: "SAML integration with Okta", status: "Complete", storyPoints: "5", sprint: "Sprint 2", assignedTeam: "Platform Team" },
  { id: "s-003", featureId: "f-001", projectId: "prj-001", name: "Session management", status: "Complete", storyPoints: "5", sprint: "Sprint 2", assignedTeam: "Platform Team" },
  { id: "s-004", featureId: "f-001", projectId: "prj-001", name: "MFA implementation", status: "Complete", storyPoints: "3", sprint: "Sprint 3", assignedTeam: "Security Team" },

  // Dashboard Stories
  { id: "s-005", featureId: "f-002", projectId: "prj-001", name: "Widget framework architecture", status: "Complete", storyPoints: "8", sprint: "Sprint 3", assignedTeam: "Frontend Team" },
  { id: "s-006", featureId: "f-002", projectId: "prj-001", name: "Drag and drop implementation", status: "Complete", storyPoints: "5", sprint: "Sprint 4", assignedTeam: "Frontend Team" },
  { id: "s-007", featureId: "f-002", projectId: "prj-001", name: "Chart widgets library", status: "In Progress", storyPoints: "8", sprint: "Sprint 5", assignedTeam: "Frontend Team" },
  { id: "s-008", featureId: "f-002", projectId: "prj-001", name: "Dashboard persistence", status: "In Progress", storyPoints: "5", sprint: "Sprint 5", assignedTeam: "Backend Team" },

  // Data Ingestion Stories
  { id: "s-009", featureId: "f-008", projectId: "prj-005", name: "Kafka connector framework", status: "Complete", storyPoints: "8", sprint: "Sprint 1", assignedTeam: "Data Engineering" },
  { id: "s-010", featureId: "f-008", projectId: "prj-005", name: "CDC implementation", status: "Complete", storyPoints: "8", sprint: "Sprint 2", assignedTeam: "Data Engineering" },
  { id: "s-011", featureId: "f-008", projectId: "prj-005", name: "Schema registry integration", status: "In Progress", storyPoints: "5", sprint: "Sprint 3", assignedTeam: "Data Engineering" },
  { id: "s-012", featureId: "f-008", projectId: "prj-005", name: "Data transformation layer", status: "In Progress", storyPoints: "8", sprint: "Sprint 4", assignedTeam: "Data Engineering" },

  // AWS Migration Stories
  { id: "s-013", featureId: "f-013", projectId: "prj-009", name: "Migration assessment tool", status: "Complete", storyPoints: "8", sprint: "Sprint 1", assignedTeam: "Cloud Team" },
  { id: "s-014", featureId: "f-013", projectId: "prj-009", name: "Automated server discovery", status: "Complete", storyPoints: "8", sprint: "Sprint 2", assignedTeam: "Cloud Team" },
  { id: "s-015", featureId: "f-013", projectId: "prj-009", name: "Containerization playbooks", status: "Complete", storyPoints: "5", sprint: "Sprint 3", assignedTeam: "DevOps Team" },
  { id: "s-016", featureId: "f-013", projectId: "prj-009", name: "Wave execution automation", status: "In Progress", storyPoints: "8", sprint: "Sprint 4", assignedTeam: "Cloud Team" },
];

// Division KPIs
const KPIS = [
  // Digital Platform KPIs
  { id: "kpi-001", divisionId: "vs-digital-platform", name: "Customer Satisfaction (CSAT)", value2023: "78%", value2024: "85%", target2025: "90%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-002", divisionId: "vs-digital-platform", name: "Digital Adoption Rate", value2023: "62%", value2024: "78%", target2025: "85%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-003", divisionId: "vs-digital-platform", name: "Time to Market", value2023: "45 days", value2024: "28 days", target2025: "21 days", unit: "days", trend: "down", status: "on-track" },
  { id: "kpi-004", divisionId: "vs-digital-platform", name: "Platform Uptime", value2023: "99.5%", value2024: "99.9%", target2025: "99.95%", unit: "%", trend: "up", status: "on-track" },

  // Data & Analytics KPIs
  { id: "kpi-005", divisionId: "vs-data-analytics", name: "Data Quality Score", value2023: "72%", value2024: "84%", target2025: "92%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-006", divisionId: "vs-data-analytics", name: "Self-Service Analytics Adoption", value2023: "25%", value2024: "48%", target2025: "70%", unit: "%", trend: "up", status: "at-risk" },
  { id: "kpi-007", divisionId: "vs-data-analytics", name: "ML Model Accuracy", value2023: "82%", value2024: "89%", target2025: "93%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-008", divisionId: "vs-data-analytics", name: "Data Processing Latency", value2023: "45s", value2024: "12s", target2025: "5s", unit: "seconds", trend: "down", status: "on-track" },

  // Cloud Infrastructure KPIs
  { id: "kpi-009", divisionId: "vs-cloud-infra", name: "Cloud Migration Progress", value2023: "35%", value2024: "72%", target2025: "95%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-010", divisionId: "vs-cloud-infra", name: "Infrastructure Cost Savings", value2023: "$2.1M", value2024: "$5.8M", target2025: "$9M", unit: "$M", trend: "up", status: "on-track" },
  { id: "kpi-011", divisionId: "vs-cloud-infra", name: "Deployment Frequency", value2023: "Weekly", value2024: "Daily", target2025: "On-demand", unit: "", trend: "up", status: "on-track" },
  { id: "kpi-012", divisionId: "vs-cloud-infra", name: "Security Compliance Score", value2023: "78%", value2024: "92%", target2025: "98%", unit: "%", trend: "up", status: "on-track" },

  // Customer Operations KPIs
  { id: "kpi-013", divisionId: "vs-customer-ops", name: "First Contact Resolution", value2023: "65%", value2024: "78%", target2025: "85%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-014", divisionId: "vs-customer-ops", name: "Average Handle Time", value2023: "8.5 min", value2024: "6.2 min", target2025: "5 min", unit: "minutes", trend: "down", status: "at-risk" },
  { id: "kpi-015", divisionId: "vs-customer-ops", name: "Customer Effort Score", value2023: "3.8", value2024: "3.2", target2025: "2.5", unit: "", trend: "down", status: "on-track" },
  { id: "kpi-016", divisionId: "vs-customer-ops", name: "Net Promoter Score (NPS)", value2023: "32", value2024: "45", target2025: "55", unit: "", trend: "up", status: "on-track" },
];

// Division OKRs
const OKRS = [
  // Digital Platform OKRs
  { id: "okr-001", divisionId: "vs-digital-platform", objective: "Deliver world-class digital customer experience", keyResults: "CSAT > 85%, Digital adoption > 75%, Page load < 2s", owner: "Sarah Chen", dueDate: "2024-12-31" },
  { id: "okr-002", divisionId: "vs-digital-platform", objective: "Accelerate time-to-market for new features", keyResults: "Release cycle < 2 weeks, Automated testing > 90%", owner: "Tom Wilson", dueDate: "2024-06-30" },

  // Data & Analytics OKRs
  { id: "okr-003", divisionId: "vs-data-analytics", objective: "Establish unified enterprise data platform", keyResults: "Data catalog coverage > 80%, Self-service users > 500", owner: "Michael Rodriguez", dueDate: "2024-12-31" },
  { id: "okr-004", divisionId: "vs-data-analytics", objective: "Deploy production ML models for key use cases", keyResults: "5 models in production, Model accuracy > 90%", owner: "Lisa Wang", dueDate: "2024-09-30" },

  // Cloud Infrastructure OKRs
  { id: "okr-005", divisionId: "vs-cloud-infra", objective: "Complete cloud-first transformation", keyResults: "80% workloads in cloud, Infrastructure as Code 100%", owner: "Jennifer Park", dueDate: "2024-12-31" },
  { id: "okr-006", divisionId: "vs-cloud-infra", objective: "Achieve zero-trust security posture", keyResults: "All apps behind zero-trust, Security incidents < 5", owner: "James Kim", dueDate: "2024-09-30" },

  // Customer Operations OKRs
  { id: "okr-007", divisionId: "vs-customer-ops", objective: "Transform customer service with AI", keyResults: "AI resolution > 40%, Agent productivity +25%", owner: "David Thompson", dueDate: "2024-12-31" },
  { id: "okr-008", divisionId: "vs-customer-ops", objective: "Reduce customer effort across all channels", keyResults: "CES < 3.0, First contact resolution > 80%", owner: "Maria Garcia", dueDate: "2024-06-30" },
];

// Enterprise Risks
const RISKS = [
  { id: "risk-001", name: "Cloud Migration Delays", description: "Dependencies on legacy system decommissioning may delay AWS migration timeline", categoryId: "technical", severity: "high", trend: "stable" },
  { id: "risk-002", name: "Data Quality Issues", description: "Inconsistent data quality across source systems affecting analytics accuracy", categoryId: "operational", severity: "medium", trend: "improving" },
  { id: "risk-003", name: "Talent Shortage", description: "Difficulty recruiting and retaining cloud-native and ML engineering talent", categoryId: "resource", severity: "high", trend: "worsening" },
  { id: "risk-004", name: "Vendor Lock-in", description: "Heavy reliance on AWS-specific services may limit future flexibility", categoryId: "strategic", severity: "medium", trend: "stable" },
  { id: "risk-005", name: "Security Vulnerabilities", description: "Rapid digital expansion increasing attack surface", categoryId: "security", severity: "high", trend: "improving" },
  { id: "risk-006", name: "Integration Complexity", description: "Multiple systems creating integration debt and maintenance overhead", categoryId: "technical", severity: "medium", trend: "worsening" },
  { id: "risk-007", name: "Regulatory Compliance", description: "Evolving data privacy regulations (GDPR, CCPA) requiring continuous updates", categoryId: "compliance", severity: "high", trend: "stable" },
  { id: "risk-008", name: "Budget Overruns", description: "Complex transformation programs at risk of exceeding budgets", categoryId: "financial", severity: "medium", trend: "stable" },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function clearExistingData() {
  console.log("🗑️  Clearing existing data...");

  // Clear in reverse order of dependencies
  await db.delete(tasks);
  await db.delete(stories);
  await db.delete(features);
  await db.delete(enterpriseRisks);
  await db.delete(divisionOkrs);
  await db.delete(divisionKpis);
  await db.delete(projects);
  await db.delete(divisions);

  console.log("✅ Existing data cleared");
}

async function seedDivisions() {
  console.log("📁 Seeding value streams (divisions)...");

  for (const vs of VALUE_STREAMS) {
    await db.insert(divisions).values({
      id: vs.id,
      name: vs.name,
      ceo: vs.ceo,
      description: vs.description,
      color: vs.color,
      profit2023: vs.profit2023,
      profit2024: vs.profit2024,
      changePercent: vs.changePercent,
    });
  }

  console.log(`✅ Seeded ${VALUE_STREAMS.length} value streams`);
}

async function seedProjects() {
  console.log("📊 Seeding projects...");

  for (const project of PROJECTS) {
    await db.insert(projects).values(project);
  }

  console.log(`✅ Seeded ${PROJECTS.length} projects`);
}

async function seedFeatures() {
  console.log("🎯 Seeding features...");

  for (const feature of FEATURES) {
    await db.insert(features).values(feature);
  }

  console.log(`✅ Seeded ${FEATURES.length} features`);
}

async function seedStories() {
  console.log("📝 Seeding stories...");

  for (const story of STORIES) {
    await db.insert(stories).values(story);
  }

  console.log(`✅ Seeded ${STORIES.length} stories`);
}

async function seedKPIs() {
  console.log("📈 Seeding KPIs...");

  for (const kpi of KPIS) {
    await db.insert(divisionKpis).values(kpi);
  }

  console.log(`✅ Seeded ${KPIS.length} KPIs`);
}

async function seedOKRs() {
  console.log("🎯 Seeding OKRs...");

  for (const okr of OKRS) {
    await db.insert(divisionOkrs).values(okr);
  }

  console.log(`✅ Seeded ${OKRS.length} OKRs`);
}

async function seedRisks() {
  console.log("⚠️  Seeding risks...");

  for (const risk of RISKS) {
    await db.insert(enterpriseRisks).values(risk);
  }

  console.log(`✅ Seeded ${RISKS.length} risks`);
}

async function syncToPalantir() {
  console.log("\n🔄 Syncing data to Palantir Foundry...");

  const sync = getPostgresToPalantirSync();

  if (!sync.isAvailable()) {
    console.log("⚠️  Palantir sync not available - skipping");
    return;
  }

  try {
    const result = await sync.syncAll();

    console.log("\n📊 Sync Results:");
    console.log(`   Success: ${result.success}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log(`   Total Objects: ${result.summary.totalObjects}`);
    console.log(`   Synced: ${result.summary.totalSynced}`);
    console.log(`   Failed: ${result.summary.totalFailed}`);

    for (const r of result.results) {
      const status = r.failed === 0 ? "✅" : "⚠️";
      console.log(`   ${status} ${r.objectType}: ${r.synced}/${r.total}`);
    }
  } catch (error: any) {
    console.error("❌ Palantir sync failed:", error.message);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 SAFe 6.0 Demo Data Seed Script");
  console.log("=".repeat(60));
  console.log("\nThis script will:");
  console.log("  1. Clear existing demo data");
  console.log("  2. Create SAFe 6.0 hierarchy (Value Streams, Projects, Features, Stories)");
  console.log("  3. Add KPIs, OKRs, and Risks");
  console.log("  4. Sync all data to Palantir Foundry");
  console.log("\n" + "=".repeat(60) + "\n");

  try {
    // Step 1: Clear existing data
    await clearExistingData();

    // Step 2: Seed SAFe hierarchy
    await seedDivisions();
    await seedProjects();
    await seedFeatures();
    await seedStories();

    // Step 3: Seed metrics
    await seedKPIs();
    await seedOKRs();
    await seedRisks();

    // Step 4: Sync to Palantir
    await syncToPalantir();

    console.log("\n" + "=".repeat(60));
    console.log("✅ SAFe 6.0 Demo Data Seed Complete!");
    console.log("=".repeat(60));
    console.log("\nSummary:");
    console.log(`  • ${VALUE_STREAMS.length} Value Streams`);
    console.log(`  • ${PROJECTS.length} Projects`);
    console.log(`  • ${FEATURES.length} Features`);
    console.log(`  • ${STORIES.length} Stories`);
    console.log(`  • ${KPIS.length} KPIs`);
    console.log(`  • ${OKRS.length} OKRs`);
    console.log(`  • ${RISKS.length} Risks`);
    console.log("\n");

  } catch (error: any) {
    console.error("\n❌ Seed failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
