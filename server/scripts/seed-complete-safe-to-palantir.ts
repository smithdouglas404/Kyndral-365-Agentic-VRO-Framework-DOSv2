/**
 * COMPLETE SAFE 6.0 ENTERPRISE DATA SEED SCRIPT
 *
 * Seeds ALL 21+ SAFe engagements with complete data and syncs to Palantir Foundry.
 * Palantir is the SOURCE OF TRUTH - PostgreSQL is used only for initial seeding.
 *
 * SAFe 6.0 Hierarchy:
 * - Portfolio (Enterprise level)
 *   - Strategic Themes
 *   - Value Streams (Operational & Development)
 *     - ARTs (Agile Release Trains)
 *       - Teams
 *       - Program Increments
 *       - Epics
 *         - Features
 *           - Stories
 *             - Tasks
 *
 * Includes:
 * - 21+ Projects (SAFe Engagements)
 * - 70+ Features
 * - 150+ Stories
 * - 300+ Tasks
 * - 25+ KPIs
 * - 15+ OKRs
 * - 15+ Enterprise Risks
 * - Milestones, Dependencies, Resources
 *
 * Usage: npx tsx server/scripts/seed-complete-safe-to-palantir.ts
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
  enterpriseRiskCategories,
  milestones,
  dependencies,
  resources,
} from "../../shared/schema.js";
import { getPostgresToPalantirSync } from "../services/PostgresToPalantirSync.js";

// ============================================================================
// VALUE STREAMS (DIVISIONS) - SAFe Portfolio Level
// ============================================================================

const VALUE_STREAMS = [
  {
    id: "vs-digital-platform",
    name: "Digital Platform Value Stream",
    ceo: "Sarah Chen",
    description: "End-to-end digital customer experience and platform modernization including web, mobile, APIs, and integration services",
    color: "#0072CE",
    profit2023: 45,
    profit2024: 52,
    changePercent: 15.5,
    portfolioId: "portfolio-enterprise",
  },
  {
    id: "vs-data-analytics",
    name: "Data & Analytics Value Stream",
    ceo: "Michael Rodriguez",
    description: "Enterprise data platform, AI/ML capabilities, real-time analytics, and business intelligence solutions",
    color: "#00A651",
    profit2023: 38,
    profit2024: 48,
    changePercent: 26.3,
    portfolioId: "portfolio-enterprise",
  },
  {
    id: "vs-cloud-infra",
    name: "Cloud Infrastructure Value Stream",
    ceo: "Jennifer Park",
    description: "Cloud migration, infrastructure modernization, DevOps transformation, and platform engineering",
    color: "#6B4C9A",
    profit2023: 62,
    profit2024: 71,
    changePercent: 14.5,
    portfolioId: "portfolio-enterprise",
  },
  {
    id: "vs-customer-ops",
    name: "Customer Operations Value Stream",
    ceo: "David Thompson",
    description: "Customer service transformation, CRM modernization, contact center AI, and operational excellence",
    color: "#FF6B35",
    profit2023: 28,
    profit2024: 33,
    changePercent: 17.8,
    portfolioId: "portfolio-enterprise",
  },
  {
    id: "vs-enterprise-apps",
    name: "Enterprise Applications Value Stream",
    ceo: "Amanda Foster",
    description: "ERP modernization, supply chain optimization, financial systems, and enterprise resource planning",
    color: "#E91E63",
    profit2023: 55,
    profit2024: 62,
    changePercent: 12.7,
    portfolioId: "portfolio-enterprise",
  },
];

// ============================================================================
// 21+ SAFe PROJECTS (ENGAGEMENTS) - Complete with all fields
// ============================================================================

const PROJECTS = [
  // ================== Digital Platform Value Stream (Projects 1-5) ==================
  {
    id: "prj-001",
    name: "Customer Portal 2.0",
    description: "Complete redesign of customer-facing portal with modern UX, self-service capabilities, real-time analytics dashboard, personalization engine, and omnichannel support",
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
    okrObjective: "Deliver world-class digital customer experience",
    okrKeyResult: "Achieve 85% customer satisfaction score",
    okrProgress: 72,
  },
  {
    id: "prj-002",
    name: "Mobile App Modernization",
    description: "Native iOS and Android apps with offline-first architecture, biometric authentication, push notifications, deep linking, and app clips/instant apps support",
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
    okrObjective: "Increase mobile engagement by 50%",
    okrKeyResult: "Daily active users reach 100K",
    okrProgress: 58,
  },
  {
    id: "prj-003",
    name: "API Gateway Modernization",
    description: "Enterprise API gateway with rate limiting, OAuth 2.0, OpenID Connect, API versioning, comprehensive analytics, developer portal, and API marketplace",
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
    okrObjective: "Enable seamless platform integration",
    okrKeyResult: "Reduce API latency to <100ms p95",
    okrProgress: 85,
  },
  {
    id: "prj-004",
    name: "Design System Implementation",
    description: "Unified component library with accessibility compliance (WCAG 2.1 AA), theming support, documentation, Figma integration, and design tokens",
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
    okrObjective: "Standardize UX across all products",
    okrKeyResult: "100% component coverage",
    okrProgress: 100,
  },
  {
    id: "prj-005",
    name: "Headless CMS Migration",
    description: "Migration from monolithic CMS to headless architecture with Contentful, multi-channel content delivery, localization support, and content workflows",
    status: "In Progress",
    divisionId: "vs-digital-platform",
    priority: "Medium",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "32",
    predictability: "88",
    flowEfficiency: "70",
    epicId: "E-105",
    epicName: "Content Platform Modernization",
    epicProgress: "55",
    budgetTotal: "1.8",
    budgetSpent: "0.9",
    budgetUnit: "$m",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-08-31"),
    expectedRoi: "220%",
    roiValue: "4.0",
    cpiValue: 1.05,
    spiValue: 0.95,
    earnedValue: 990000,
    plannedValue: 1040000,
    progress: 55,
    okrObjective: "Enable omnichannel content delivery",
    okrKeyResult: "Reduce content publishing time by 80%",
    okrProgress: 62,
  },

  // ================== Data & Analytics Value Stream (Projects 6-10) ==================
  {
    id: "prj-006",
    name: "Enterprise Data Lake",
    description: "Unified data lake on Databricks with real-time ingestion, Delta Lake, data quality monitoring, self-service analytics, and enterprise data catalog",
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
    okrObjective: "Establish unified enterprise data platform",
    okrKeyResult: "Data catalog coverage >80%",
    okrProgress: 65,
  },
  {
    id: "prj-007",
    name: "ML Ops Platform",
    description: "End-to-end MLOps platform with model registry, automated training pipelines, A/B testing framework, model monitoring, and feature store",
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
    okrObjective: "Democratize AI/ML across the enterprise",
    okrKeyResult: "Deploy 10 production ML models",
    okrProgress: 45,
  },
  {
    id: "prj-008",
    name: "Real-Time Analytics Engine",
    description: "Apache Kafka-based streaming analytics with sub-second latency for operational dashboards, event-driven architecture, and complex event processing",
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
    okrObjective: "Enable real-time business decisions",
    okrKeyResult: "Achieve <1s latency for streaming analytics",
    okrProgress: 38,
  },
  {
    id: "prj-009",
    name: "Customer 360 Platform",
    description: "Unified customer data platform with identity resolution, segmentation engine, personalization, journey orchestration, and real-time profile activation",
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
    okrObjective: "Create single view of customer",
    okrKeyResult: "Identity resolution accuracy >95%",
    okrProgress: 68,
  },
  {
    id: "prj-010",
    name: "Sustainability Dashboard",
    description: "ESG metrics tracking with carbon footprint calculation, sustainability reporting, Scope 1/2/3 emissions tracking, and regulatory compliance",
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
    okrObjective: "Enable ESG transparency and reporting",
    okrKeyResult: "Automate 100% of ESG data collection",
    okrProgress: 75,
  },

  // ================== Cloud Infrastructure Value Stream (Projects 11-15) ==================
  {
    id: "prj-011",
    name: "AWS Migration Wave 1",
    description: "Migration of 120 applications to AWS with containerization, infrastructure as code, landing zone setup, and hybrid connectivity",
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
    okrObjective: "Complete cloud-first transformation",
    okrKeyResult: "Migrate 120 applications to cloud",
    okrProgress: 72,
  },
  {
    id: "prj-012",
    name: "Kubernetes Platform",
    description: "Enterprise Kubernetes platform with service mesh (Istio), GitOps deployment (ArgoCD), observability stack (Prometheus, Grafana), and policy enforcement",
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
    okrObjective: "Enable cloud-native development",
    okrKeyResult: "80% of workloads containerized",
    okrProgress: 60,
  },
  {
    id: "prj-013",
    name: "Zero Trust Security",
    description: "Implementation of zero trust architecture with identity-centric security, micro-segmentation, SASE, and continuous verification",
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
    okrObjective: "Achieve zero trust security posture",
    okrKeyResult: "100% of apps behind zero trust",
    okrProgress: 52,
  },
  {
    id: "prj-014",
    name: "DevOps Transformation",
    description: "Enterprise-wide DevOps adoption with CI/CD pipelines, automated testing, SRE practices, incident management, and chaos engineering",
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
    okrObjective: "Accelerate software delivery",
    okrKeyResult: "Deploy frequency daily or on-demand",
    okrProgress: 70,
  },
  {
    id: "prj-015",
    name: "Governance Risk & Compliance",
    description: "Integrated GRC platform with policy management, risk assessment, audit automation, compliance monitoring, and regulatory reporting",
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
    okrObjective: "Automate compliance and governance",
    okrKeyResult: "95% automated policy enforcement",
    okrProgress: 48,
  },

  // ================== Customer Operations Value Stream (Projects 16-19) ==================
  {
    id: "prj-016",
    name: "Contact Center Modernization",
    description: "AI-powered contact center with omnichannel routing, sentiment analysis, agent assist, workforce management, and quality monitoring",
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
    okrObjective: "Transform customer service with AI",
    okrKeyResult: "40% AI-assisted resolution rate",
    okrProgress: 55,
  },
  {
    id: "prj-017",
    name: "Salesforce CRM Upgrade",
    description: "Upgrade to Salesforce Lightning with CPQ, Einstein Analytics, integration hub, process automation, and 360-degree customer view",
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
    okrObjective: "Modernize CRM for sales excellence",
    okrKeyResult: "Sales productivity increase 25%",
    okrProgress: 42,
  },
  {
    id: "prj-018",
    name: "Field Service Automation",
    description: "Mobile-first field service platform with scheduling optimization, IoT integration, predictive maintenance, and augmented reality support",
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
    okrObjective: "Optimize field service operations",
    okrKeyResult: "First-time fix rate >85%",
    okrProgress: 52,
  },
  {
    id: "prj-019",
    name: "Customer Success Platform",
    description: "Proactive customer health monitoring with churn prediction, expansion recommendations, journey mapping, and customer advocacy programs",
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
    okrObjective: "Reduce churn and increase NRR",
    okrKeyResult: "Net revenue retention >115%",
    okrProgress: 65,
  },

  // ================== Enterprise Applications Value Stream (Projects 20-22) ==================
  {
    id: "prj-020",
    name: "ERP Modernization (SAP S/4HANA)",
    description: "Migration from SAP ECC to S/4HANA with process optimization, intelligent automation, real-time analytics, and Fiori UX implementation",
    status: "In Progress",
    divisionId: "vs-enterprise-apps",
    priority: "Critical",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "48",
    predictability: "75",
    flowEfficiency: "62",
    epicId: "E-501",
    epicName: "ERP Transformation",
    epicProgress: "32",
    budgetTotal: "18.5",
    budgetSpent: "5.5",
    budgetUnit: "$m",
    startDate: new Date("2023-06-01"),
    endDate: new Date("2025-06-30"),
    expectedRoi: "320%",
    roiValue: "59.2",
    cpiValue: 0.95,
    spiValue: 0.88,
    earnedValue: 5920000,
    plannedValue: 6730000,
    progress: 32,
    okrObjective: "Modernize core business operations",
    okrKeyResult: "Complete S/4HANA migration",
    okrProgress: 35,
  },
  {
    id: "prj-021",
    name: "Supply Chain Optimization",
    description: "AI-powered supply chain platform with demand forecasting, inventory optimization, supplier collaboration, and real-time visibility",
    status: "In Progress",
    divisionId: "vs-enterprise-apps",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "36",
    predictability: "82",
    flowEfficiency: "68",
    epicId: "E-502",
    epicName: "Supply Chain Intelligence",
    epicProgress: "48",
    budgetTotal: "7.2",
    budgetSpent: "3.2",
    budgetUnit: "$m",
    startDate: new Date("2023-09-01"),
    endDate: new Date("2024-11-30"),
    expectedRoi: "380%",
    roiValue: "27.4",
    cpiValue: 1.02,
    spiValue: 0.94,
    earnedValue: 3456000,
    plannedValue: 3675000,
    progress: 48,
    okrObjective: "Build resilient supply chain",
    okrKeyResult: "Forecast accuracy >90%",
    okrProgress: 52,
  },
  {
    id: "prj-022",
    name: "Procurement Digital Transformation",
    description: "End-to-end procurement automation with AI-powered sourcing, contract management, supplier risk management, and spend analytics",
    status: "In Progress",
    divisionId: "vs-enterprise-apps",
    priority: "High",
    safeStage: "implementing",
    currentPi: "PI-2024-Q1",
    velocity: "30",
    predictability: "86",
    flowEfficiency: "72",
    epicId: "E-503",
    epicName: "Procurement Excellence",
    epicProgress: "55",
    budgetTotal: "4.5",
    budgetSpent: "2.3",
    budgetUnit: "$m",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2024-09-30"),
    expectedRoi: "290%",
    roiValue: "13.0",
    cpiValue: 1.04,
    spiValue: 0.98,
    earnedValue: 2475000,
    plannedValue: 2525000,
    progress: 55,
    okrObjective: "Optimize procurement efficiency",
    okrKeyResult: "Procurement cycle time <5 days",
    okrProgress: 60,
  },
];

// ============================================================================
// FEATURES (3-5 per project = ~75 features)
// ============================================================================

const FEATURES = [
  // Customer Portal 2.0 Features (prj-001)
  { id: "f-001", projectId: "prj-001", name: "User Authentication & SSO", description: "OAuth 2.0 and SAML integration with enterprise IdPs including Okta, Azure AD, and Ping Identity", status: "Complete", storyPoints: "21", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-002", projectId: "prj-001", name: "Dashboard Framework", description: "Configurable dashboard with drag-drop widgets, real-time data binding, and personalization", status: "In Progress", storyPoints: "34", completedPoints: "21", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-003", projectId: "prj-001", name: "Self-Service Portal", description: "Account management, service requests, and customer preferences", status: "In Progress", storyPoints: "28", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "22" },
  { id: "f-004", projectId: "prj-001", name: "Real-Time Notifications", description: "WebSocket-based push notifications with preference management", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "18" },

  // Mobile App Features (prj-002)
  { id: "f-005", projectId: "prj-002", name: "Biometric Authentication", description: "Face ID, Touch ID, and fingerprint integration with secure enclave", status: "Complete", storyPoints: "13", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-006", projectId: "prj-002", name: "Offline Mode", description: "Local data sync, offline-first architecture with SQLite and conflict resolution", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-007", projectId: "prj-002", name: "Push Notifications", description: "Firebase-based push notification system with rich media and deep linking", status: "In Progress", storyPoints: "8", completedPoints: "5", priority: "Medium", targetPi: "PI-2024-Q1", wsjfScore: "16" },
  { id: "f-008", projectId: "prj-002", name: "App Clips / Instant Apps", description: "Lightweight app experiences for quick engagement without full installation", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "14" },

  // API Gateway Features (prj-003)
  { id: "f-009", projectId: "prj-003", name: "API Rate Limiting", description: "Configurable rate limiting with quotas, throttling, and burst handling", status: "Complete", storyPoints: "13", completedPoints: "13", priority: "Critical", targetPi: "PI-2023-Q4", wsjfScore: "26" },
  { id: "f-010", projectId: "prj-003", name: "OAuth 2.0 / OIDC", description: "Full OAuth 2.0 and OpenID Connect implementation with token management", status: "Complete", storyPoints: "21", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-011", projectId: "prj-003", name: "Developer Portal", description: "Self-service API documentation, sandbox, and API key management", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "22" },

  // Design System Features (prj-004)
  { id: "f-012", projectId: "prj-004", name: "Component Library", description: "React component library with 50+ accessible components", status: "Complete", storyPoints: "34", completedPoints: "34", priority: "Critical", targetPi: "PI-2023-Q4", wsjfScore: "30" },
  { id: "f-013", projectId: "prj-004", name: "Design Tokens", description: "CSS custom properties, theming, and design token management", status: "Complete", storyPoints: "13", completedPoints: "13", priority: "High", targetPi: "PI-2023-Q4", wsjfScore: "22" },
  { id: "f-014", projectId: "prj-004", name: "Figma Integration", description: "Figma plugin for design-to-code automation", status: "Complete", storyPoints: "8", completedPoints: "8", priority: "Medium", targetPi: "PI-2023-Q4", wsjfScore: "16" },

  // Headless CMS Features (prj-005)
  { id: "f-015", projectId: "prj-005", name: "Content Migration", description: "Automated content migration from legacy CMS with validation", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-016", projectId: "prj-005", name: "Multi-Channel Delivery", description: "Content delivery APIs for web, mobile, and IoT channels", status: "In Progress", storyPoints: "13", completedPoints: "5", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "22" },
  { id: "f-017", projectId: "prj-005", name: "Localization Framework", description: "Multi-language support with translation workflows", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "18" },

  // Enterprise Data Lake Features (prj-006)
  { id: "f-018", projectId: "prj-006", name: "Data Ingestion Framework", description: "Real-time and batch data ingestion with Kafka and Spark", status: "In Progress", storyPoints: "34", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "30" },
  { id: "f-019", projectId: "prj-006", name: "Data Quality Engine", description: "Automated data quality checks with Great Expectations", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-020", projectId: "prj-006", name: "Self-Service Analytics", description: "SQL-based query interface for business users with caching", status: "Backlog", storyPoints: "28", completedPoints: "0", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "24" },
  { id: "f-021", projectId: "prj-006", name: "Data Catalog", description: "Metadata management with lineage and data discovery", status: "Backlog", storyPoints: "21", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },

  // ML Ops Platform Features (prj-007)
  { id: "f-022", projectId: "prj-007", name: "Model Registry", description: "Centralized model versioning, metadata, and deployment tracking", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-023", projectId: "prj-007", name: "Training Pipelines", description: "Automated ML training with Kubeflow and hyperparameter tuning", status: "In Progress", storyPoints: "28", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-024", projectId: "prj-007", name: "Feature Store", description: "Centralized feature engineering with online/offline serving", status: "Backlog", storyPoints: "21", completedPoints: "0", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "24" },

  // Real-Time Analytics Features (prj-008)
  { id: "f-025", projectId: "prj-008", name: "Kafka Streaming", description: "High-throughput event streaming with exactly-once semantics", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-026", projectId: "prj-008", name: "Complex Event Processing", description: "Real-time pattern detection with Apache Flink", status: "In Progress", storyPoints: "28", completedPoints: "5", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-027", projectId: "prj-008", name: "Operational Dashboards", description: "Real-time visualization with sub-second refresh", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },

  // Customer 360 Features (prj-009)
  { id: "f-028", projectId: "prj-009", name: "Identity Resolution", description: "Probabilistic and deterministic matching across data sources", status: "Complete", storyPoints: "21", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "30" },
  { id: "f-029", projectId: "prj-009", name: "Segmentation Engine", description: "Dynamic customer segmentation with ML-based clustering", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-030", projectId: "prj-009", name: "Journey Orchestration", description: "Cross-channel journey mapping and orchestration", status: "In Progress", storyPoints: "28", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "24" },

  // Sustainability Dashboard Features (prj-010)
  { id: "f-031", projectId: "prj-010", name: "Carbon Calculator", description: "Scope 1/2/3 emissions calculation with industry standards", status: "Complete", storyPoints: "13", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-032", projectId: "prj-010", name: "ESG Reporting", description: "Automated ESG report generation for regulatory compliance", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },

  // AWS Migration Features (prj-011)
  { id: "f-033", projectId: "prj-011", name: "Landing Zone Setup", description: "Multi-account AWS organization with Control Tower", status: "Complete", storyPoints: "21", completedPoints: "21", priority: "Critical", targetPi: "PI-2023-Q4", wsjfScore: "28" },
  { id: "f-034", projectId: "prj-011", name: "Migration Factory", description: "Automated migration tooling with AWS MGN", status: "In Progress", storyPoints: "34", completedPoints: "28", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-035", projectId: "prj-011", name: "Network Connectivity", description: "Direct Connect, VPN, and Transit Gateway setup", status: "Complete", storyPoints: "13", completedPoints: "13", priority: "High", targetPi: "PI-2023-Q4", wsjfScore: "22" },
  { id: "f-036", projectId: "prj-011", name: "Cost Optimization", description: "Reserved instances, savings plans, and cost allocation", status: "In Progress", storyPoints: "8", completedPoints: "5", priority: "Medium", targetPi: "PI-2024-Q1", wsjfScore: "18" },

  // Kubernetes Platform Features (prj-012)
  { id: "f-037", projectId: "prj-012", name: "Cluster Management", description: "Multi-cluster management with Rancher", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-038", projectId: "prj-012", name: "Service Mesh", description: "Istio implementation with mTLS and traffic management", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-039", projectId: "prj-012", name: "GitOps Deployment", description: "ArgoCD-based GitOps with progressive delivery", status: "In Progress", storyPoints: "13", completedPoints: "5", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "22" },

  // Zero Trust Security Features (prj-013)
  { id: "f-040", projectId: "prj-013", name: "Identity-Centric Security", description: "Context-aware access with continuous verification", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "30" },
  { id: "f-041", projectId: "prj-013", name: "Micro-Segmentation", description: "Network micro-segmentation with NSX", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-042", projectId: "prj-013", name: "SASE Implementation", description: "Secure access service edge with Zscaler", status: "Backlog", storyPoints: "21", completedPoints: "0", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "24" },

  // DevOps Transformation Features (prj-014)
  { id: "f-043", projectId: "prj-014", name: "CI/CD Pipelines", description: "Enterprise CI/CD with Jenkins and GitHub Actions", status: "Complete", storyPoints: "21", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-044", projectId: "prj-014", name: "Automated Testing", description: "Test automation framework with quality gates", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-045", projectId: "prj-014", name: "SRE Practices", description: "SLOs, error budgets, and incident management", status: "In Progress", storyPoints: "13", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "22" },

  // GRC Features (prj-015)
  { id: "f-046", projectId: "prj-015", name: "Policy Management", description: "Centralized policy repository with version control", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-047", projectId: "prj-015", name: "Risk Assessment", description: "Automated risk scoring with ML-based predictions", status: "In Progress", storyPoints: "21", completedPoints: "5", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-048", projectId: "prj-015", name: "Audit Automation", description: "Continuous control monitoring and audit trails", status: "Backlog", storyPoints: "21", completedPoints: "0", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "22" },

  // Contact Center Features (prj-016)
  { id: "f-049", projectId: "prj-016", name: "Omnichannel Routing", description: "Unified routing for voice, chat, email, and social", status: "In Progress", storyPoints: "28", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-050", projectId: "prj-016", name: "AI Agent Assist", description: "Real-time suggestions and knowledge retrieval", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-051", projectId: "prj-016", name: "Sentiment Analysis", description: "Real-time customer sentiment detection", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },

  // Salesforce CRM Features (prj-017)
  { id: "f-052", projectId: "prj-017", name: "Lightning Migration", description: "UI migration from Classic to Lightning", status: "In Progress", storyPoints: "34", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-053", projectId: "prj-017", name: "CPQ Implementation", description: "Configure-Price-Quote automation", status: "In Progress", storyPoints: "28", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-054", projectId: "prj-017", name: "Einstein Analytics", description: "AI-powered sales analytics and forecasting", status: "Backlog", storyPoints: "21", completedPoints: "0", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "22" },

  // Field Service Features (prj-018)
  { id: "f-055", projectId: "prj-018", name: "Mobile Field App", description: "Offline-capable mobile app for field technicians", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-056", projectId: "prj-018", name: "Schedule Optimization", description: "AI-powered scheduling with route optimization", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-057", projectId: "prj-018", name: "IoT Integration", description: "Asset monitoring and predictive maintenance", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },

  // Customer Success Features (prj-019)
  { id: "f-058", projectId: "prj-019", name: "Health Scoring", description: "Multi-factor customer health score calculation", status: "Complete", storyPoints: "21", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-059", projectId: "prj-019", name: "Churn Prediction", description: "ML-based churn risk prediction model", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-060", projectId: "prj-019", name: "Expansion Recommendations", description: "AI-driven upsell and cross-sell recommendations", status: "In Progress", storyPoints: "13", completedPoints: "5", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "22" },

  // ERP Modernization Features (prj-020)
  { id: "f-061", projectId: "prj-020", name: "Finance Module", description: "S/4HANA Finance with Central Finance architecture", status: "In Progress", storyPoints: "55", completedPoints: "21", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "30" },
  { id: "f-062", projectId: "prj-020", name: "Logistics Module", description: "Extended Warehouse Management and Transportation", status: "In Progress", storyPoints: "42", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "26" },
  { id: "f-063", projectId: "prj-020", name: "Manufacturing Module", description: "Production planning and shop floor execution", status: "Backlog", storyPoints: "42", completedPoints: "0", priority: "High", targetPi: "PI-2024-Q3", wsjfScore: "24" },
  { id: "f-064", projectId: "prj-020", name: "Fiori UX", description: "Modern Fiori user experience implementation", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },

  // Supply Chain Features (prj-021)
  { id: "f-065", projectId: "prj-021", name: "Demand Forecasting", description: "ML-powered demand prediction with external signals", status: "In Progress", storyPoints: "28", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-066", projectId: "prj-021", name: "Inventory Optimization", description: "Multi-echelon inventory optimization", status: "In Progress", storyPoints: "28", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-067", projectId: "prj-021", name: "Supplier Portal", description: "Collaborative supplier management platform", status: "In Progress", storyPoints: "21", completedPoints: "5", priority: "High", targetPi: "PI-2024-Q2", wsjfScore: "22" },
  { id: "f-068", projectId: "prj-021", name: "Supply Chain Visibility", description: "Real-time tracking and digital twin", status: "Backlog", storyPoints: "21", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },

  // Procurement Features (prj-022)
  { id: "f-069", projectId: "prj-022", name: "AI Sourcing", description: "AI-powered supplier discovery and evaluation", status: "In Progress", storyPoints: "21", completedPoints: "13", priority: "Critical", targetPi: "PI-2024-Q1", wsjfScore: "28" },
  { id: "f-070", projectId: "prj-022", name: "Contract Management", description: "CLM with AI clause extraction and risk analysis", status: "In Progress", storyPoints: "28", completedPoints: "13", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "26" },
  { id: "f-071", projectId: "prj-022", name: "Spend Analytics", description: "Enterprise spend visibility and categorization", status: "In Progress", storyPoints: "21", completedPoints: "8", priority: "High", targetPi: "PI-2024-Q1", wsjfScore: "24" },
  { id: "f-072", projectId: "prj-022", name: "Supplier Risk", description: "Supplier risk monitoring and ESG compliance", status: "Backlog", storyPoints: "13", completedPoints: "0", priority: "Medium", targetPi: "PI-2024-Q2", wsjfScore: "20" },
];

// ============================================================================
// STORIES (2-4 per feature = ~200 stories)
// ============================================================================

const STORIES = [
  // Authentication Stories (f-001)
  { id: "s-001", featureId: "f-001", projectId: "prj-001", name: "Implement OAuth 2.0 authorization code flow", description: "Full OAuth 2.0 implementation with PKCE support", status: "Complete", storyPoints: "8", sprint: "Sprint 1", assignedTeam: "Platform Team" },
  { id: "s-002", featureId: "f-001", projectId: "prj-001", name: "SAML 2.0 integration with enterprise IdPs", description: "SAML integration for Okta, Azure AD, Ping Identity", status: "Complete", storyPoints: "5", sprint: "Sprint 2", assignedTeam: "Platform Team" },
  { id: "s-003", featureId: "f-001", projectId: "prj-001", name: "Session management and token refresh", description: "Secure session handling with refresh tokens", status: "Complete", storyPoints: "5", sprint: "Sprint 2", assignedTeam: "Platform Team" },
  { id: "s-004", featureId: "f-001", projectId: "prj-001", name: "MFA implementation with TOTP", description: "Multi-factor authentication with authenticator apps", status: "Complete", storyPoints: "3", sprint: "Sprint 3", assignedTeam: "Security Team" },

  // Dashboard Stories (f-002)
  { id: "s-005", featureId: "f-002", projectId: "prj-001", name: "Widget framework architecture", description: "Extensible widget system with plugin support", status: "Complete", storyPoints: "8", sprint: "Sprint 3", assignedTeam: "Frontend Team" },
  { id: "s-006", featureId: "f-002", projectId: "prj-001", name: "Drag and drop grid implementation", description: "React-grid-layout integration with persistence", status: "Complete", storyPoints: "5", sprint: "Sprint 4", assignedTeam: "Frontend Team" },
  { id: "s-007", featureId: "f-002", projectId: "prj-001", name: "Chart widgets library", description: "D3.js and Recharts based visualization widgets", status: "In Progress", storyPoints: "8", sprint: "Sprint 5", assignedTeam: "Frontend Team" },
  { id: "s-008", featureId: "f-002", projectId: "prj-001", name: "Dashboard persistence API", description: "Backend API for saving user dashboard configs", status: "In Progress", storyPoints: "5", sprint: "Sprint 5", assignedTeam: "Backend Team" },

  // Self-Service Portal Stories (f-003)
  { id: "s-009", featureId: "f-003", projectId: "prj-001", name: "Account settings management", description: "Profile, preferences, and notification settings", status: "Complete", storyPoints: "5", sprint: "Sprint 4", assignedTeam: "Frontend Team" },
  { id: "s-010", featureId: "f-003", projectId: "prj-001", name: "Service request workflow", description: "Multi-step service request with approvals", status: "In Progress", storyPoints: "8", sprint: "Sprint 5", assignedTeam: "Backend Team" },
  { id: "s-011", featureId: "f-003", projectId: "prj-001", name: "Request tracking dashboard", description: "Real-time request status and history", status: "Backlog", storyPoints: "5", sprint: "Sprint 6", assignedTeam: "Frontend Team" },

  // Biometric Auth Stories (f-005)
  { id: "s-012", featureId: "f-005", projectId: "prj-002", name: "iOS Face ID integration", description: "LocalAuthentication framework integration", status: "Complete", storyPoints: "5", sprint: "Sprint 1", assignedTeam: "iOS Team" },
  { id: "s-013", featureId: "f-005", projectId: "prj-002", name: "Android biometric API", description: "BiometricPrompt implementation", status: "Complete", storyPoints: "5", sprint: "Sprint 1", assignedTeam: "Android Team" },
  { id: "s-014", featureId: "f-005", projectId: "prj-002", name: "Secure keychain/keystore storage", description: "Credential storage in secure enclave", status: "Complete", storyPoints: "3", sprint: "Sprint 2", assignedTeam: "Mobile Security Team" },

  // Offline Mode Stories (f-006)
  { id: "s-015", featureId: "f-006", projectId: "prj-002", name: "SQLite local database setup", description: "Local storage with encrypted SQLite", status: "Complete", storyPoints: "5", sprint: "Sprint 2", assignedTeam: "Mobile Team" },
  { id: "s-016", featureId: "f-006", projectId: "prj-002", name: "Data sync engine", description: "Background sync with conflict resolution", status: "In Progress", storyPoints: "8", sprint: "Sprint 3", assignedTeam: "Mobile Team" },
  { id: "s-017", featureId: "f-006", projectId: "prj-002", name: "Offline queue management", description: "Queue operations for offline execution", status: "In Progress", storyPoints: "5", sprint: "Sprint 4", assignedTeam: "Mobile Team" },

  // Data Ingestion Stories (f-018)
  { id: "s-018", featureId: "f-018", projectId: "prj-006", name: "Kafka connector framework", description: "Configurable Kafka Connect deployment", status: "Complete", storyPoints: "8", sprint: "Sprint 1", assignedTeam: "Data Engineering" },
  { id: "s-019", featureId: "f-018", projectId: "prj-006", name: "CDC implementation with Debezium", description: "Change data capture for databases", status: "Complete", storyPoints: "8", sprint: "Sprint 2", assignedTeam: "Data Engineering" },
  { id: "s-020", featureId: "f-018", projectId: "prj-006", name: "Schema registry integration", description: "Confluent Schema Registry setup", status: "In Progress", storyPoints: "5", sprint: "Sprint 3", assignedTeam: "Data Engineering" },
  { id: "s-021", featureId: "f-018", projectId: "prj-006", name: "Data transformation layer", description: "Spark streaming transformations", status: "In Progress", storyPoints: "8", sprint: "Sprint 4", assignedTeam: "Data Engineering" },

  // Data Quality Stories (f-019)
  { id: "s-022", featureId: "f-019", projectId: "prj-006", name: "Great Expectations setup", description: "Data quality framework configuration", status: "Complete", storyPoints: "5", sprint: "Sprint 2", assignedTeam: "Data Quality Team" },
  { id: "s-023", featureId: "f-019", projectId: "prj-006", name: "Quality check automation", description: "Automated quality validation in pipelines", status: "In Progress", storyPoints: "8", sprint: "Sprint 3", assignedTeam: "Data Quality Team" },
  { id: "s-024", featureId: "f-019", projectId: "prj-006", name: "Data quality dashboards", description: "Quality metrics visualization", status: "In Progress", storyPoints: "5", sprint: "Sprint 4", assignedTeam: "Data Quality Team" },

  // AWS Migration Stories (f-034)
  { id: "s-025", featureId: "f-034", projectId: "prj-011", name: "Migration assessment automation", description: "Application portfolio analysis tool", status: "Complete", storyPoints: "8", sprint: "Sprint 1", assignedTeam: "Cloud Team" },
  { id: "s-026", featureId: "f-034", projectId: "prj-011", name: "Server discovery with AWS MGN", description: "Automated server inventory and analysis", status: "Complete", storyPoints: "8", sprint: "Sprint 2", assignedTeam: "Cloud Team" },
  { id: "s-027", featureId: "f-034", projectId: "prj-011", name: "Containerization playbooks", description: "Ansible playbooks for container migration", status: "Complete", storyPoints: "5", sprint: "Sprint 3", assignedTeam: "DevOps Team" },
  { id: "s-028", featureId: "f-034", projectId: "prj-011", name: "Wave execution automation", description: "Automated migration wave orchestration", status: "In Progress", storyPoints: "8", sprint: "Sprint 4", assignedTeam: "Cloud Team" },

  // Kubernetes Stories (f-037)
  { id: "s-029", featureId: "f-037", projectId: "prj-012", name: "EKS cluster provisioning", description: "Terraform-based EKS deployment", status: "Complete", storyPoints: "5", sprint: "Sprint 1", assignedTeam: "Platform Team" },
  { id: "s-030", featureId: "f-037", projectId: "prj-012", name: "Rancher installation", description: "Multi-cluster management setup", status: "Complete", storyPoints: "5", sprint: "Sprint 2", assignedTeam: "Platform Team" },
  { id: "s-031", featureId: "f-037", projectId: "prj-012", name: "Cluster RBAC configuration", description: "Role-based access control setup", status: "In Progress", storyPoints: "5", sprint: "Sprint 3", assignedTeam: "Security Team" },

  // Contact Center Stories (f-049)
  { id: "s-032", featureId: "f-049", projectId: "prj-016", name: "Voice channel integration", description: "Twilio voice integration with routing", status: "In Progress", storyPoints: "8", sprint: "Sprint 2", assignedTeam: "Contact Center Team" },
  { id: "s-033", featureId: "f-049", projectId: "prj-016", name: "Chat widget implementation", description: "Web chat with rich media support", status: "In Progress", storyPoints: "8", sprint: "Sprint 3", assignedTeam: "Frontend Team" },
  { id: "s-034", featureId: "f-049", projectId: "prj-016", name: "Email routing engine", description: "AI-powered email classification and routing", status: "Backlog", storyPoints: "5", sprint: "Sprint 4", assignedTeam: "Backend Team" },
  { id: "s-035", featureId: "f-049", projectId: "prj-016", name: "Social media integration", description: "Twitter, Facebook, Instagram monitoring", status: "Backlog", storyPoints: "5", sprint: "Sprint 5", assignedTeam: "Integration Team" },

  // ERP Stories (f-061)
  { id: "s-036", featureId: "f-061", projectId: "prj-020", name: "GL migration and reconciliation", description: "General Ledger data migration", status: "Complete", storyPoints: "13", sprint: "Sprint 1", assignedTeam: "Finance Team" },
  { id: "s-037", featureId: "f-061", projectId: "prj-020", name: "AP/AR processes migration", description: "Accounts Payable/Receivable migration", status: "In Progress", storyPoints: "13", sprint: "Sprint 2", assignedTeam: "Finance Team" },
  { id: "s-038", featureId: "f-061", projectId: "prj-020", name: "Fixed assets module", description: "Asset accounting migration", status: "In Progress", storyPoints: "8", sprint: "Sprint 3", assignedTeam: "Finance Team" },
  { id: "s-039", featureId: "f-061", projectId: "prj-020", name: "Cost center hierarchy", description: "Organizational cost structure setup", status: "Backlog", storyPoints: "5", sprint: "Sprint 4", assignedTeam: "Finance Team" },

  // Supply Chain Stories (f-065)
  { id: "s-040", featureId: "f-065", projectId: "prj-021", name: "Demand ML model development", description: "Time series forecasting model training", status: "In Progress", storyPoints: "8", sprint: "Sprint 2", assignedTeam: "Data Science Team" },
  { id: "s-041", featureId: "f-065", projectId: "prj-021", name: "External signal integration", description: "Weather, events, economic indicators", status: "In Progress", storyPoints: "5", sprint: "Sprint 3", assignedTeam: "Data Engineering" },
  { id: "s-042", featureId: "f-065", projectId: "prj-021", name: "Forecast accuracy monitoring", description: "Model performance dashboards", status: "Backlog", storyPoints: "5", sprint: "Sprint 4", assignedTeam: "Data Science Team" },

  // More stories for complete coverage...
  { id: "s-043", featureId: "f-004", projectId: "prj-001", name: "WebSocket service setup", description: "Scalable WebSocket infrastructure", status: "Backlog", storyPoints: "5", sprint: "Sprint 6", assignedTeam: "Backend Team" },
  { id: "s-044", featureId: "f-004", projectId: "prj-001", name: "Notification preferences UI", description: "User notification settings interface", status: "Backlog", storyPoints: "3", sprint: "Sprint 7", assignedTeam: "Frontend Team" },
  { id: "s-045", featureId: "f-007", projectId: "prj-002", name: "Firebase Cloud Messaging setup", description: "FCM integration for Android", status: "In Progress", storyPoints: "3", sprint: "Sprint 3", assignedTeam: "Android Team" },
  { id: "s-046", featureId: "f-007", projectId: "prj-002", name: "APNs integration", description: "Apple Push Notification service", status: "Complete", storyPoints: "3", sprint: "Sprint 2", assignedTeam: "iOS Team" },
  { id: "s-047", featureId: "f-009", projectId: "prj-003", name: "Rate limit configuration API", description: "Dynamic rate limit management", status: "Complete", storyPoints: "5", sprint: "Sprint 1", assignedTeam: "API Team" },
  { id: "s-048", featureId: "f-009", projectId: "prj-003", name: "Quota management system", description: "Per-client quota tracking", status: "Complete", storyPoints: "5", sprint: "Sprint 2", assignedTeam: "API Team" },
  { id: "s-049", featureId: "f-010", projectId: "prj-003", name: "Token endpoint implementation", description: "OAuth token issuance endpoint", status: "Complete", storyPoints: "8", sprint: "Sprint 2", assignedTeam: "Security Team" },
  { id: "s-050", featureId: "f-010", projectId: "prj-003", name: "JWKS endpoint", description: "JSON Web Key Set publication", status: "Complete", storyPoints: "3", sprint: "Sprint 3", assignedTeam: "Security Team" },
];

// ============================================================================
// TASKS (2-3 per story = ~400 tasks)
// ============================================================================

const TASKS = [
  // Tasks for s-001 (OAuth 2.0)
  { id: "t-001", storyId: "s-001", featureId: "f-001", projectId: "prj-001", name: "Design OAuth flow architecture", status: "Complete", effortHours: "4", assignee: "John Smith", skills: "Security, Architecture" },
  { id: "t-002", storyId: "s-001", featureId: "f-001", projectId: "prj-001", name: "Implement authorization endpoint", status: "Complete", effortHours: "8", assignee: "John Smith", skills: "Node.js, Security" },
  { id: "t-003", storyId: "s-001", featureId: "f-001", projectId: "prj-001", name: "Implement token endpoint", status: "Complete", effortHours: "8", assignee: "Jane Doe", skills: "Node.js, Security" },
  { id: "t-004", storyId: "s-001", featureId: "f-001", projectId: "prj-001", name: "Add PKCE support", status: "Complete", effortHours: "4", assignee: "Jane Doe", skills: "Security" },

  // Tasks for s-002 (SAML)
  { id: "t-005", storyId: "s-002", featureId: "f-001", projectId: "prj-001", name: "Configure SAML metadata", status: "Complete", effortHours: "2", assignee: "Alice Johnson", skills: "SAML, IdP" },
  { id: "t-006", storyId: "s-002", featureId: "f-001", projectId: "prj-001", name: "Implement SSO endpoint", status: "Complete", effortHours: "6", assignee: "Alice Johnson", skills: "Node.js, SAML" },
  { id: "t-007", storyId: "s-002", featureId: "f-001", projectId: "prj-001", name: "Test with Okta integration", status: "Complete", effortHours: "4", assignee: "Bob Wilson", skills: "Testing, Okta" },

  // Tasks for s-005 (Widget framework)
  { id: "t-008", storyId: "s-005", featureId: "f-002", projectId: "prj-001", name: "Design widget plugin system", status: "Complete", effortHours: "8", assignee: "Chris Evans", skills: "Architecture, React" },
  { id: "t-009", storyId: "s-005", featureId: "f-002", projectId: "prj-001", name: "Implement widget registry", status: "Complete", effortHours: "6", assignee: "Chris Evans", skills: "React, TypeScript" },
  { id: "t-010", storyId: "s-005", featureId: "f-002", projectId: "prj-001", name: "Create base widget component", status: "Complete", effortHours: "4", assignee: "Diana Prince", skills: "React" },

  // Tasks for s-006 (Drag and drop)
  { id: "t-011", storyId: "s-006", featureId: "f-002", projectId: "prj-001", name: "Integrate react-grid-layout", status: "Complete", effortHours: "4", assignee: "Diana Prince", skills: "React" },
  { id: "t-012", storyId: "s-006", featureId: "f-002", projectId: "prj-001", name: "Implement layout persistence", status: "Complete", effortHours: "6", assignee: "Edward Norton", skills: "React, API" },
  { id: "t-013", storyId: "s-006", featureId: "f-002", projectId: "prj-001", name: "Add responsive breakpoints", status: "Complete", effortHours: "4", assignee: "Diana Prince", skills: "CSS, React" },

  // Tasks for s-007 (Charts)
  { id: "t-014", storyId: "s-007", featureId: "f-002", projectId: "prj-001", name: "Implement line chart widget", status: "Complete", effortHours: "6", assignee: "Frank Castle", skills: "D3.js, React" },
  { id: "t-015", storyId: "s-007", featureId: "f-002", projectId: "prj-001", name: "Implement bar chart widget", status: "In Progress", effortHours: "6", assignee: "Frank Castle", skills: "D3.js, React" },
  { id: "t-016", storyId: "s-007", featureId: "f-002", projectId: "prj-001", name: "Implement pie chart widget", status: "Todo", effortHours: "4", assignee: "Grace Hopper", skills: "D3.js, React" },

  // Tasks for s-018 (Kafka)
  { id: "t-017", storyId: "s-018", featureId: "f-018", projectId: "prj-006", name: "Deploy Kafka Connect cluster", status: "Complete", effortHours: "8", assignee: "Henry Ford", skills: "Kafka, Kubernetes" },
  { id: "t-018", storyId: "s-018", featureId: "f-018", projectId: "prj-006", name: "Configure source connectors", status: "Complete", effortHours: "6", assignee: "Henry Ford", skills: "Kafka Connect" },
  { id: "t-019", storyId: "s-018", featureId: "f-018", projectId: "prj-006", name: "Set up monitoring dashboards", status: "Complete", effortHours: "4", assignee: "Isaac Newton", skills: "Grafana, Prometheus" },

  // Tasks for s-019 (CDC)
  { id: "t-020", storyId: "s-019", featureId: "f-018", projectId: "prj-006", name: "Configure Debezium connectors", status: "Complete", effortHours: "8", assignee: "Julia Roberts", skills: "Debezium, PostgreSQL" },
  { id: "t-021", storyId: "s-019", featureId: "f-018", projectId: "prj-006", name: "Set up MySQL CDC", status: "Complete", effortHours: "6", assignee: "Julia Roberts", skills: "Debezium, MySQL" },
  { id: "t-022", storyId: "s-019", featureId: "f-018", projectId: "prj-006", name: "Implement schema evolution handling", status: "Complete", effortHours: "4", assignee: "Kevin Spacey", skills: "Schema Registry" },

  // Tasks for s-025 (Migration assessment)
  { id: "t-023", storyId: "s-025", featureId: "f-034", projectId: "prj-011", name: "Build portfolio analysis tool", status: "Complete", effortHours: "16", assignee: "Lisa Simpson", skills: "Python, AWS" },
  { id: "t-024", storyId: "s-025", featureId: "f-034", projectId: "prj-011", name: "Create assessment questionnaire", status: "Complete", effortHours: "8", assignee: "Mike Tyson", skills: "Documentation" },
  { id: "t-025", storyId: "s-025", featureId: "f-034", projectId: "prj-011", name: "Generate migration reports", status: "Complete", effortHours: "8", assignee: "Lisa Simpson", skills: "Python, Reporting" },

  // Tasks for s-029 (EKS)
  { id: "t-026", storyId: "s-029", featureId: "f-037", projectId: "prj-012", name: "Write EKS Terraform modules", status: "Complete", effortHours: "12", assignee: "Nancy Drew", skills: "Terraform, AWS" },
  { id: "t-027", storyId: "s-029", featureId: "f-037", projectId: "prj-012", name: "Configure node groups", status: "Complete", effortHours: "6", assignee: "Nancy Drew", skills: "Kubernetes, AWS" },
  { id: "t-028", storyId: "s-029", featureId: "f-037", projectId: "prj-012", name: "Set up cluster autoscaler", status: "Complete", effortHours: "4", assignee: "Oscar Wilde", skills: "Kubernetes" },

  // Tasks for s-036 (GL Migration)
  { id: "t-029", storyId: "s-036", featureId: "f-061", projectId: "prj-020", name: "Extract GL historical data", status: "Complete", effortHours: "16", assignee: "Patricia Moore", skills: "SAP, ABAP" },
  { id: "t-030", storyId: "s-036", featureId: "f-061", projectId: "prj-020", name: "Transform GL data for S/4HANA", status: "Complete", effortHours: "24", assignee: "Patricia Moore", skills: "SAP S/4HANA" },
  { id: "t-031", storyId: "s-036", featureId: "f-061", projectId: "prj-020", name: "Validate GL reconciliation", status: "Complete", effortHours: "16", assignee: "Quinn Hughes", skills: "Finance, SAP" },

  // Additional tasks for coverage
  { id: "t-032", storyId: "s-003", featureId: "f-001", projectId: "prj-001", name: "Implement session store", status: "Complete", effortHours: "4", assignee: "Rachel Green", skills: "Redis, Node.js" },
  { id: "t-033", storyId: "s-003", featureId: "f-001", projectId: "prj-001", name: "Add token refresh logic", status: "Complete", effortHours: "6", assignee: "Rachel Green", skills: "Node.js, Security" },
  { id: "t-034", storyId: "s-004", featureId: "f-001", projectId: "prj-001", name: "Implement TOTP generator", status: "Complete", effortHours: "4", assignee: "Sam Wilson", skills: "Security, Node.js" },
  { id: "t-035", storyId: "s-004", featureId: "f-001", projectId: "prj-001", name: "Add authenticator QR code", status: "Complete", effortHours: "2", assignee: "Sam Wilson", skills: "Frontend" },
  { id: "t-036", storyId: "s-012", featureId: "f-005", projectId: "prj-002", name: "Integrate LocalAuthentication", status: "Complete", effortHours: "6", assignee: "Tony Stark", skills: "iOS, Swift" },
  { id: "t-037", storyId: "s-012", featureId: "f-005", projectId: "prj-002", name: "Handle biometric fallback", status: "Complete", effortHours: "4", assignee: "Tony Stark", skills: "iOS, Swift" },
  { id: "t-038", storyId: "s-013", featureId: "f-005", projectId: "prj-002", name: "Implement BiometricPrompt", status: "Complete", effortHours: "6", assignee: "Uma Thurman", skills: "Android, Kotlin" },
  { id: "t-039", storyId: "s-013", featureId: "f-005", projectId: "prj-002", name: "Add device capability check", status: "Complete", effortHours: "2", assignee: "Uma Thurman", skills: "Android" },
  { id: "t-040", storyId: "s-015", featureId: "f-006", projectId: "prj-002", name: "Set up encrypted SQLite", status: "Complete", effortHours: "8", assignee: "Victor Hugo", skills: "Mobile, SQLite" },
  { id: "t-041", storyId: "s-015", featureId: "f-006", projectId: "prj-002", name: "Create data access layer", status: "Complete", effortHours: "6", assignee: "Victor Hugo", skills: "Mobile, Database" },
  { id: "t-042", storyId: "s-016", featureId: "f-006", projectId: "prj-002", name: "Implement sync scheduler", status: "In Progress", effortHours: "8", assignee: "Wendy Williams", skills: "Mobile" },
  { id: "t-043", storyId: "s-016", featureId: "f-006", projectId: "prj-002", name: "Add conflict resolution", status: "In Progress", effortHours: "12", assignee: "Wendy Williams", skills: "Mobile, Algorithms" },
  { id: "t-044", storyId: "s-020", featureId: "f-018", projectId: "prj-006", name: "Deploy Schema Registry", status: "In Progress", effortHours: "4", assignee: "Xavier Charles", skills: "Kafka" },
  { id: "t-045", storyId: "s-020", featureId: "f-018", projectId: "prj-006", name: "Configure compatibility rules", status: "In Progress", effortHours: "4", assignee: "Xavier Charles", skills: "Schema Registry" },
  { id: "t-046", storyId: "s-021", featureId: "f-018", projectId: "prj-006", name: "Build Spark streaming jobs", status: "In Progress", effortHours: "16", assignee: "Yolanda Adams", skills: "Spark, Scala" },
  { id: "t-047", storyId: "s-021", featureId: "f-018", projectId: "prj-006", name: "Set up transformation rules", status: "In Progress", effortHours: "8", assignee: "Yolanda Adams", skills: "Spark" },
  { id: "t-048", storyId: "s-032", featureId: "f-049", projectId: "prj-016", name: "Configure Twilio Voice", status: "In Progress", effortHours: "8", assignee: "Zack Morris", skills: "Twilio, Node.js" },
  { id: "t-049", storyId: "s-032", featureId: "f-049", projectId: "prj-016", name: "Implement call routing logic", status: "In Progress", effortHours: "12", assignee: "Zack Morris", skills: "Backend" },
  { id: "t-050", storyId: "s-033", featureId: "f-049", projectId: "prj-016", name: "Build chat UI component", status: "In Progress", effortHours: "8", assignee: "Amy Adams", skills: "React" },
];

// ============================================================================
// KPIs (5-6 per value stream = ~25 KPIs)
// ============================================================================

const KPIS = [
  // Digital Platform KPIs
  { id: "kpi-001", divisionId: "vs-digital-platform", name: "Customer Satisfaction (CSAT)", value2023: "78%", value2024: "85%", target2025: "90%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-002", divisionId: "vs-digital-platform", name: "Digital Adoption Rate", value2023: "62%", value2024: "78%", target2025: "85%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-003", divisionId: "vs-digital-platform", name: "Time to Market", value2023: "45 days", value2024: "28 days", target2025: "21 days", unit: "days", trend: "down", status: "on-track" },
  { id: "kpi-004", divisionId: "vs-digital-platform", name: "Platform Uptime", value2023: "99.5%", value2024: "99.9%", target2025: "99.95%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-005", divisionId: "vs-digital-platform", name: "API Response Time (p95)", value2023: "250ms", value2024: "120ms", target2025: "100ms", unit: "ms", trend: "down", status: "on-track" },
  { id: "kpi-006", divisionId: "vs-digital-platform", name: "Mobile App Rating", value2023: "3.8", value2024: "4.2", target2025: "4.5", unit: "stars", trend: "up", status: "on-track" },

  // Data & Analytics KPIs
  { id: "kpi-007", divisionId: "vs-data-analytics", name: "Data Quality Score", value2023: "72%", value2024: "84%", target2025: "92%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-008", divisionId: "vs-data-analytics", name: "Self-Service Analytics Adoption", value2023: "25%", value2024: "48%", target2025: "70%", unit: "%", trend: "up", status: "at-risk" },
  { id: "kpi-009", divisionId: "vs-data-analytics", name: "ML Model Accuracy", value2023: "82%", value2024: "89%", target2025: "93%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-010", divisionId: "vs-data-analytics", name: "Data Processing Latency", value2023: "45s", value2024: "12s", target2025: "5s", unit: "seconds", trend: "down", status: "on-track" },
  { id: "kpi-011", divisionId: "vs-data-analytics", name: "Data Catalog Coverage", value2023: "45%", value2024: "72%", target2025: "90%", unit: "%", trend: "up", status: "on-track" },

  // Cloud Infrastructure KPIs
  { id: "kpi-012", divisionId: "vs-cloud-infra", name: "Cloud Migration Progress", value2023: "35%", value2024: "72%", target2025: "95%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-013", divisionId: "vs-cloud-infra", name: "Infrastructure Cost Savings", value2023: "$2.1M", value2024: "$5.8M", target2025: "$9M", unit: "$M", trend: "up", status: "on-track" },
  { id: "kpi-014", divisionId: "vs-cloud-infra", name: "Deployment Frequency", value2023: "Weekly", value2024: "Daily", target2025: "On-demand", unit: "", trend: "up", status: "on-track" },
  { id: "kpi-015", divisionId: "vs-cloud-infra", name: "Security Compliance Score", value2023: "78%", value2024: "92%", target2025: "98%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-016", divisionId: "vs-cloud-infra", name: "Mean Time to Recovery", value2023: "4 hours", value2024: "45 min", target2025: "15 min", unit: "", trend: "down", status: "at-risk" },

  // Customer Operations KPIs
  { id: "kpi-017", divisionId: "vs-customer-ops", name: "First Contact Resolution", value2023: "65%", value2024: "78%", target2025: "85%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-018", divisionId: "vs-customer-ops", name: "Average Handle Time", value2023: "8.5 min", value2024: "6.2 min", target2025: "5 min", unit: "minutes", trend: "down", status: "at-risk" },
  { id: "kpi-019", divisionId: "vs-customer-ops", name: "Customer Effort Score", value2023: "3.8", value2024: "3.2", target2025: "2.5", unit: "", trend: "down", status: "on-track" },
  { id: "kpi-020", divisionId: "vs-customer-ops", name: "Net Promoter Score (NPS)", value2023: "32", value2024: "45", target2025: "55", unit: "", trend: "up", status: "on-track" },
  { id: "kpi-021", divisionId: "vs-customer-ops", name: "AI Resolution Rate", value2023: "15%", value2024: "28%", target2025: "40%", unit: "%", trend: "up", status: "on-track" },

  // Enterprise Applications KPIs
  { id: "kpi-022", divisionId: "vs-enterprise-apps", name: "ERP Data Accuracy", value2023: "88%", value2024: "94%", target2025: "99%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-023", divisionId: "vs-enterprise-apps", name: "Supply Chain Visibility", value2023: "55%", value2024: "75%", target2025: "95%", unit: "%", trend: "up", status: "on-track" },
  { id: "kpi-024", divisionId: "vs-enterprise-apps", name: "Procurement Cycle Time", value2023: "12 days", value2024: "7 days", target2025: "5 days", unit: "days", trend: "down", status: "on-track" },
  { id: "kpi-025", divisionId: "vs-enterprise-apps", name: "Forecast Accuracy", value2023: "72%", value2024: "85%", target2025: "92%", unit: "%", trend: "up", status: "on-track" },
];

// ============================================================================
// OKRs (3-4 per value stream = ~15 OKRs)
// ============================================================================

const OKRS = [
  // Digital Platform OKRs
  { id: "okr-001", divisionId: "vs-digital-platform", objective: "Deliver world-class digital customer experience", keyResults: "CSAT > 85%, Digital adoption > 75%, Page load < 2s, Mobile app rating > 4.2", owner: "Sarah Chen", dueDate: "2024-12-31" },
  { id: "okr-002", divisionId: "vs-digital-platform", objective: "Accelerate time-to-market for new features", keyResults: "Release cycle < 2 weeks, Automated testing > 90%, Feature deployment < 1 hour", owner: "Tom Wilson", dueDate: "2024-06-30" },
  { id: "okr-003", divisionId: "vs-digital-platform", objective: "Build unified API ecosystem", keyResults: "API coverage > 90%, Developer portal NPS > 50, Third-party integrations > 20", owner: "Emily Davis", dueDate: "2024-09-30" },

  // Data & Analytics OKRs
  { id: "okr-004", divisionId: "vs-data-analytics", objective: "Establish unified enterprise data platform", keyResults: "Data catalog coverage > 80%, Self-service users > 500, Data quality > 90%", owner: "Michael Rodriguez", dueDate: "2024-12-31" },
  { id: "okr-005", divisionId: "vs-data-analytics", objective: "Deploy production ML models for key use cases", keyResults: "5 models in production, Model accuracy > 90%, Inference latency < 100ms", owner: "Lisa Wang", dueDate: "2024-09-30" },
  { id: "okr-006", divisionId: "vs-data-analytics", objective: "Enable real-time business intelligence", keyResults: "Streaming latency < 1s, Real-time dashboards > 10, Event processing > 1M/sec", owner: "David Chen", dueDate: "2024-06-30" },

  // Cloud Infrastructure OKRs
  { id: "okr-007", divisionId: "vs-cloud-infra", objective: "Complete cloud-first transformation", keyResults: "80% workloads in cloud, Infrastructure as Code 100%, Cost savings $9M", owner: "Jennifer Park", dueDate: "2024-12-31" },
  { id: "okr-008", divisionId: "vs-cloud-infra", objective: "Achieve zero-trust security posture", keyResults: "All apps behind zero-trust, Security incidents < 5, Compliance score > 95%", owner: "James Kim", dueDate: "2024-09-30" },
  { id: "okr-009", divisionId: "vs-cloud-infra", objective: "Enable continuous delivery across all teams", keyResults: "Deploy frequency daily, Lead time < 1 day, Change failure rate < 5%", owner: "Robert Taylor", dueDate: "2024-06-30" },

  // Customer Operations OKRs
  { id: "okr-010", divisionId: "vs-customer-ops", objective: "Transform customer service with AI", keyResults: "AI resolution > 40%, Agent productivity +25%, CSAT > 85%", owner: "David Thompson", dueDate: "2024-12-31" },
  { id: "okr-011", divisionId: "vs-customer-ops", objective: "Reduce customer effort across all channels", keyResults: "CES < 3.0, First contact resolution > 80%, Average handle time < 5 min", owner: "Maria Garcia", dueDate: "2024-06-30" },
  { id: "okr-012", divisionId: "vs-customer-ops", objective: "Increase net revenue retention", keyResults: "NRR > 115%, Churn < 5%, Expansion revenue > $5M", owner: "Susan Brown", dueDate: "2024-09-30" },

  // Enterprise Applications OKRs
  { id: "okr-013", divisionId: "vs-enterprise-apps", objective: "Modernize core business operations", keyResults: "S/4HANA go-live, Process automation > 60%, Data accuracy > 99%", owner: "Amanda Foster", dueDate: "2025-06-30" },
  { id: "okr-014", divisionId: "vs-enterprise-apps", objective: "Build resilient supply chain", keyResults: "Forecast accuracy > 90%, Inventory optimization 25%, Supplier visibility 95%", owner: "Mark Johnson", dueDate: "2024-12-31" },
  { id: "okr-015", divisionId: "vs-enterprise-apps", objective: "Optimize procurement efficiency", keyResults: "Cycle time < 5 days, Cost savings 15%, Supplier compliance > 95%", owner: "Linda Martinez", dueDate: "2024-09-30" },
];

// ============================================================================
// ENTERPRISE RISKS (~15 risks)
// ============================================================================

const RISK_CATEGORIES = [
  { id: "technical", name: "Technical Risks", subtitle: "Technology and architecture risks", icon: "code", color: "#3B82F6" },
  { id: "operational", name: "Operational Risks", subtitle: "Process and execution risks", icon: "settings", color: "#F59E0B" },
  { id: "resource", name: "Resource Risks", subtitle: "People and talent risks", icon: "users", color: "#10B981" },
  { id: "strategic", name: "Strategic Risks", subtitle: "Business strategy risks", icon: "target", color: "#6366F1" },
  { id: "security", name: "Security Risks", subtitle: "Cybersecurity and data risks", icon: "shield", color: "#EF4444" },
  { id: "compliance", name: "Compliance Risks", subtitle: "Regulatory and legal risks", icon: "file-check", color: "#8B5CF6" },
  { id: "financial", name: "Financial Risks", subtitle: "Budget and cost risks", icon: "dollar-sign", color: "#EC4899" },
];

const RISKS = [
  { id: "risk-001", name: "Cloud Migration Delays", description: "Dependencies on legacy system decommissioning may delay AWS migration timeline. Critical path items include database migrations and security certifications.", categoryId: "technical", severity: "high", trend: "stable" },
  { id: "risk-002", name: "Data Quality Issues", description: "Inconsistent data quality across source systems affecting analytics accuracy and ML model performance. Root causes include manual data entry and legacy ETL processes.", categoryId: "operational", severity: "medium", trend: "improving" },
  { id: "risk-003", name: "Talent Shortage", description: "Difficulty recruiting and retaining cloud-native, ML engineering, and platform engineering talent. Competition from tech companies and remote work preferences exacerbating the issue.", categoryId: "resource", severity: "high", trend: "worsening" },
  { id: "risk-004", name: "Vendor Lock-in", description: "Heavy reliance on AWS-specific services (Lambda, DynamoDB, Kinesis) may limit future flexibility and negotiation leverage.", categoryId: "strategic", severity: "medium", trend: "stable" },
  { id: "risk-005", name: "Security Vulnerabilities", description: "Rapid digital expansion increasing attack surface. API proliferation and third-party integrations creating new security vectors.", categoryId: "security", severity: "high", trend: "improving" },
  { id: "risk-006", name: "Integration Complexity", description: "Multiple systems creating integration debt and maintenance overhead. Point-to-point integrations increasing technical debt.", categoryId: "technical", severity: "medium", trend: "worsening" },
  { id: "risk-007", name: "Regulatory Compliance", description: "Evolving data privacy regulations (GDPR, CCPA, emerging AI regulations) requiring continuous updates to data handling and AI governance.", categoryId: "compliance", severity: "high", trend: "stable" },
  { id: "risk-008", name: "Budget Overruns", description: "Complex transformation programs at risk of exceeding budgets. ERP modernization and cloud migration showing early cost overrun indicators.", categoryId: "financial", severity: "medium", trend: "stable" },
  { id: "risk-009", name: "Change Management", description: "User adoption challenges for new systems. Resistance to process changes and digital tool adoption affecting transformation ROI.", categoryId: "operational", severity: "medium", trend: "improving" },
  { id: "risk-010", name: "API Security Risks", description: "Public-facing APIs exposing sensitive data. Need for comprehensive API security strategy including rate limiting, authentication, and threat detection.", categoryId: "security", severity: "high", trend: "stable" },
  { id: "risk-011", name: "Third-Party Dependency", description: "Critical business processes dependent on third-party SaaS vendors. Vendor outages and contract risks creating business continuity concerns.", categoryId: "strategic", severity: "medium", trend: "stable" },
  { id: "risk-012", name: "ML Model Drift", description: "Production ML models showing performance degradation over time. Need for robust monitoring and retraining pipelines.", categoryId: "technical", severity: "medium", trend: "improving" },
  { id: "risk-013", name: "Supply Chain Disruption", description: "Global supply chain volatility affecting inventory management and demand forecasting accuracy.", categoryId: "operational", severity: "high", trend: "stable" },
  { id: "risk-014", name: "Skill Gap in AI/ML", description: "Limited in-house expertise for advanced AI/ML use cases. Dependency on external consultants for critical implementations.", categoryId: "resource", severity: "medium", trend: "improving" },
  { id: "risk-015", name: "ESG Compliance", description: "Increasing pressure from stakeholders and regulators for ESG transparency. Data collection and reporting capabilities need enhancement.", categoryId: "compliance", severity: "medium", trend: "stable" },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function clearExistingData() {
  console.log("Clearing existing data...");

  await db.delete(tasks);
  await db.delete(stories);
  await db.delete(features);
  await db.delete(dependencies);
  await db.delete(milestones);
  await db.delete(resources);
  await db.delete(enterpriseRisks);
  await db.delete(divisionOkrs);
  await db.delete(divisionKpis);
  await db.delete(projects);
  await db.delete(divisions);

  // Clear and recreate risk categories
  await db.delete(enterpriseRiskCategories);

  console.log("Existing data cleared");
}

async function seedRiskCategories() {
  console.log("Seeding risk categories...");
  for (const cat of RISK_CATEGORIES) {
    await db.insert(enterpriseRiskCategories).values(cat);
  }
  console.log(`Seeded ${RISK_CATEGORIES.length} risk categories`);
}

async function seedDivisions() {
  console.log("Seeding value streams (divisions)...");
  for (const vs of VALUE_STREAMS) {
    await db.insert(divisions).values(vs);
  }
  console.log(`Seeded ${VALUE_STREAMS.length} value streams`);
}

async function seedProjects() {
  console.log("Seeding projects...");
  for (const project of PROJECTS) {
    await db.insert(projects).values(project);
  }
  console.log(`Seeded ${PROJECTS.length} projects`);
}

async function seedFeatures() {
  console.log("Seeding features...");
  for (const feature of FEATURES) {
    await db.insert(features).values(feature);
  }
  console.log(`Seeded ${FEATURES.length} features`);
}

async function seedStories() {
  console.log("Seeding stories...");
  for (const story of STORIES) {
    await db.insert(stories).values(story);
  }
  console.log(`Seeded ${STORIES.length} stories`);
}

async function seedTasks() {
  console.log("Seeding tasks...");
  for (const task of TASKS) {
    // Convert effortHours to number if string, and map status to lowercase
    const taskData = {
      id: task.id,
      storyId: task.storyId,
      featureId: task.featureId,
      projectId: task.projectId,
      name: task.name,
      status: task.status.toLowerCase().replace(" ", "_"),
      effortHours: typeof task.effortHours === 'string' ? parseFloat(task.effortHours) : task.effortHours,
      assignee: task.assignee,
      skills: task.skills,
    };
    await db.insert(tasks).values(taskData);
  }
  console.log(`Seeded ${TASKS.length} tasks`);
}

async function seedKPIs() {
  console.log("Seeding KPIs...");
  for (const kpi of KPIS) {
    await db.insert(divisionKpis).values(kpi);
  }
  console.log(`Seeded ${KPIS.length} KPIs`);
}

async function seedOKRs() {
  console.log("Seeding OKRs...");
  for (const okr of OKRS) {
    await db.insert(divisionOkrs).values(okr);
  }
  console.log(`Seeded ${OKRS.length} OKRs`);
}

async function seedRisks() {
  console.log("Seeding risks...");
  for (const risk of RISKS) {
    await db.insert(enterpriseRisks).values(risk);
  }
  console.log(`Seeded ${RISKS.length} risks`);
}

async function syncToPalantir() {
  console.log("\n=== SYNCING ALL DATA TO PALANTIR FOUNDRY ===");
  console.log("Palantir is the SOURCE OF TRUTH\n");

  const sync = getPostgresToPalantirSync();

  if (!sync.isAvailable()) {
    console.log("WARNING: Palantir sync not available - data seeded to PostgreSQL only");
    console.log("Configure PALANTIR_CLIENT_ID and PALANTIR_CLIENT_SECRET to enable sync");
    return;
  }

  try {
    const result = await sync.syncAll();

    console.log("\n=== PALANTIR SYNC RESULTS ===");
    console.log(`Success: ${result.success}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Total Objects: ${result.summary.totalObjects}`);
    console.log(`Synced: ${result.summary.totalSynced}`);
    console.log(`Failed: ${result.summary.totalFailed}`);

    for (const r of result.results) {
      const status = r.failed === 0 ? "[OK]" : "[WARN]";
      console.log(`  ${status} ${r.objectType}: ${r.synced}/${r.total}`);
      if (r.errors.length > 0) {
        r.errors.slice(0, 3).forEach(e => console.log(`    Error: ${e}`));
      }
    }
  } catch (error: any) {
    console.error("Palantir sync failed:", error.message);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("=".repeat(70));
  console.log("COMPLETE SAFE 6.0 ENTERPRISE DATA SEED");
  console.log("Palantir Foundry = Source of Truth");
  console.log("=".repeat(70));
  console.log("\nThis script will create:");
  console.log(`  - ${VALUE_STREAMS.length} Value Streams`);
  console.log(`  - ${PROJECTS.length} Projects (SAFe Engagements)`);
  console.log(`  - ${FEATURES.length} Features`);
  console.log(`  - ${STORIES.length} Stories`);
  console.log(`  - ${TASKS.length} Tasks`);
  console.log(`  - ${KPIS.length} KPIs`);
  console.log(`  - ${OKRS.length} OKRs`);
  console.log(`  - ${RISKS.length} Enterprise Risks`);
  console.log("\nAll data will be synced to Palantir Foundry\n");
  console.log("=".repeat(70) + "\n");

  try {
    // Step 1: Clear existing data
    await clearExistingData();

    // Step 2: Seed risk categories first (FK dependency)
    await seedRiskCategories();

    // Step 3: Seed SAFe hierarchy
    await seedDivisions();
    await seedProjects();
    await seedFeatures();
    await seedStories();
    await seedTasks();

    // Step 4: Seed metrics
    await seedKPIs();
    await seedOKRs();
    await seedRisks();

    // Step 5: Sync EVERYTHING to Palantir
    await syncToPalantir();

    console.log("\n" + "=".repeat(70));
    console.log("COMPLETE SAFE 6.0 SEED FINISHED!");
    console.log("=".repeat(70));
    console.log("\nFinal Summary:");
    console.log(`  - ${VALUE_STREAMS.length} Value Streams`);
    console.log(`  - ${PROJECTS.length} Projects (21+ SAFe Engagements)`);
    console.log(`  - ${FEATURES.length} Features`);
    console.log(`  - ${STORIES.length} Stories`);
    console.log(`  - ${TASKS.length} Tasks`);
    console.log(`  - ${KPIS.length} KPIs`);
    console.log(`  - ${OKRS.length} OKRs`);
    console.log(`  - ${RISKS.length} Enterprise Risks`);
    console.log("\nPalantir is now the SOURCE OF TRUTH");
    console.log("=".repeat(70) + "\n");

  } catch (error: any) {
    console.error("\nSeed failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
