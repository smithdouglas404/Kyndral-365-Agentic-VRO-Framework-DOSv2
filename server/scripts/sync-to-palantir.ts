/**
 * SYNC SAFe 6.0 DATA TO PALANTIR
 *
 * Uses the correct Palantir Action APIs to create objects in Foundry.
 *
 * Actions used:
 * - upsertDivision
 * - upsertProject
 * - upsertRisk
 * - upsertKPI
 * - upsertOKR
 *
 * Usage: npx tsx server/scripts/sync-to-palantir.ts
 */

import { PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

const PALANTIR_HOST = process.env.PALANTIR_HOSTNAME?.replace(/\/$/, '') || '';
const PALANTIR_TOKEN = process.env.PALANTIR_TOKEN || '';
const ONTOLOGY_RID = process.env.PALANTIR_ONTOLOGY_RID || '';

if (!PALANTIR_HOST || !PALANTIR_TOKEN || !ONTOLOGY_RID) {
  console.error('Missing Palantir configuration. Set PALANTIR_HOSTNAME, PALANTIR_TOKEN, PALANTIR_ONTOLOGY_RID');
  process.exit(1);
}

// ============================================================================
// PALANTIR API HELPERS
// ============================================================================

async function palantirRequest(method: string, path: string, body?: any): Promise<any> {
  const url = `${PALANTIR_HOST}/api/v2${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${PALANTIR_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Palantir API error (${response.status}): ${text}`);
  }

  return response.json();
}

async function applyAction(actionName: string, parameters: Record<string, any>): Promise<boolean> {
  try {
    await palantirRequest('POST', `/ontologies/${ONTOLOGY_RID}/actions/${actionName}/apply`, { parameters });
    return true;
  } catch (error: any) {
    console.error(`  ❌ ${actionName} failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// DATA DEFINITIONS
// ============================================================================

// Transformation (Portfolio level)
const TRANSFORMATION = {
  transformation_id: 'TRX-001',
  name: 'Enterprise Digital Transformation 2024',
  vision: 'Transform into a digital-first organization with AI-powered operations, cloud-native infrastructure, and exceptional customer experiences',
  executive_sponsor: 'John Smith, CEO',
  status: 'In Progress',
  start_date: '2024-01-01',
  end_date: '2025-12-31',
  created_at: new Date().toISOString(),
};

// Budgets
const BUDGETS = [
  { budget_id: 'BUD-001', name: 'Digital Platform Budget', total_amount: 15000000, allocated_amount: 12500000, spent_amount: 7800000, fiscal_year: '2024', currency: 'USD' },
  { budget_id: 'BUD-002', name: 'Data & Analytics Budget', total_amount: 22000000, allocated_amount: 19500000, spent_amount: 11200000, fiscal_year: '2024', currency: 'USD' },
  { budget_id: 'BUD-003', name: 'Cloud Infrastructure Budget', total_amount: 28000000, allocated_amount: 26000000, spent_amount: 16500000, fiscal_year: '2024', currency: 'USD' },
  { budget_id: 'BUD-004', name: 'Customer Operations Budget', total_amount: 12000000, allocated_amount: 10500000, spent_amount: 6200000, fiscal_year: '2024', currency: 'USD' },
];

// Projects (18 SAFe 6.0 projects)
const PROJECTS = [
  // Digital Platform Projects
  { project_id: 'PRJ-101', name: 'Customer Portal 2.0', description: 'Complete redesign of customer-facing portal with modern UX, self-service capabilities, and real-time analytics', status: 'In Progress', priority: 'Critical', transformation_id: 'TRX-001', budget_id: 'BUD-001', start_date: '2024-01-15', end_date: '2024-09-30', milestone_progress: 0.65 },
  { project_id: 'PRJ-102', name: 'Mobile App Modernization', description: 'Native iOS and Android apps with offline-first architecture, biometric auth, and push notifications', status: 'In Progress', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-001', start_date: '2024-02-01', end_date: '2024-11-30', milestone_progress: 0.45 },
  { project_id: 'PRJ-103', name: 'API Gateway Platform', description: 'Enterprise API gateway with rate limiting, OAuth 2.0, and comprehensive API analytics', status: 'In Progress', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-001', start_date: '2023-10-01', end_date: '2024-06-30', milestone_progress: 0.72 },
  { project_id: 'PRJ-104', name: 'Design System Implementation', description: 'Unified component library with accessibility compliance (WCAG 2.1 AA) across all digital properties', status: 'Complete', priority: 'Medium', transformation_id: 'TRX-001', budget_id: 'BUD-001', start_date: '2023-06-01', end_date: '2024-01-31', milestone_progress: 1.0 },

  // Data & Analytics Projects
  { project_id: 'PRJ-201', name: 'Enterprise Data Lake', description: 'Unified data lake on Databricks with real-time ingestion, data quality monitoring, and self-service analytics', status: 'In Progress', priority: 'Critical', transformation_id: 'TRX-001', budget_id: 'BUD-002', start_date: '2023-09-01', end_date: '2024-12-31', milestone_progress: 0.55 },
  { project_id: 'PRJ-202', name: 'ML Ops Platform', description: 'End-to-end MLOps platform with model registry, automated training pipelines, and A/B testing framework', status: 'In Progress', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-002', start_date: '2024-01-01', end_date: '2024-10-31', milestone_progress: 0.40 },
  { project_id: 'PRJ-203', name: 'Real-Time Analytics Engine', description: 'Apache Kafka-based streaming analytics with sub-second latency for operational dashboards', status: 'At Risk', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-002', start_date: '2023-11-01', end_date: '2024-08-31', milestone_progress: 0.35 },
  { project_id: 'PRJ-204', name: 'Customer 360 Platform', description: 'Unified customer data platform with identity resolution, segmentation, and personalization engine', status: 'In Progress', priority: 'Critical', transformation_id: 'TRX-001', budget_id: 'BUD-002', start_date: '2023-08-01', end_date: '2024-07-31', milestone_progress: 0.60 },
  { project_id: 'PRJ-205', name: 'Sustainability Dashboard', description: 'ESG metrics tracking with carbon footprint calculation and sustainability reporting', status: 'In Progress', priority: 'Medium', transformation_id: 'TRX-001', budget_id: 'BUD-002', start_date: '2023-11-01', end_date: '2024-05-31', milestone_progress: 0.68 },

  // Cloud Infrastructure Projects
  { project_id: 'PRJ-301', name: 'AWS Migration Wave 1', description: 'Migration of 120 applications to AWS with containerization and infrastructure as code', status: 'In Progress', priority: 'Critical', transformation_id: 'TRX-001', budget_id: 'BUD-003', start_date: '2023-04-01', end_date: '2024-06-30', milestone_progress: 0.70 },
  { project_id: 'PRJ-302', name: 'Kubernetes Platform', description: 'Enterprise Kubernetes platform with service mesh, GitOps deployment, and observability stack', status: 'In Progress', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-003', start_date: '2023-10-01', end_date: '2024-09-30', milestone_progress: 0.55 },
  { project_id: 'PRJ-303', name: 'Zero Trust Security', description: 'Implementation of zero trust architecture with identity-centric security and micro-segmentation', status: 'In Progress', priority: 'Critical', transformation_id: 'TRX-001', budget_id: 'BUD-003', start_date: '2023-11-01', end_date: '2024-10-31', milestone_progress: 0.48 },
  { project_id: 'PRJ-304', name: 'DevOps Transformation', description: 'Enterprise-wide DevOps adoption with CI/CD pipelines, automated testing, and SRE practices', status: 'In Progress', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-003', start_date: '2023-07-01', end_date: '2024-06-30', milestone_progress: 0.62 },
  { project_id: 'PRJ-305', name: 'Governance Risk & Compliance', description: 'Integrated GRC platform with policy management, risk assessment, and audit automation', status: 'In Progress', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-003', start_date: '2024-01-15', end_date: '2024-11-30', milestone_progress: 0.42 },

  // Customer Operations Projects
  { project_id: 'PRJ-401', name: 'Contact Center Modernization', description: 'AI-powered contact center with omnichannel routing, sentiment analysis, and agent assist', status: 'In Progress', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-004', start_date: '2023-09-01', end_date: '2024-08-31', milestone_progress: 0.52 },
  { project_id: 'PRJ-402', name: 'Salesforce CRM Upgrade', description: 'Upgrade to Salesforce Lightning with CPQ, Einstein Analytics, and integration hub', status: 'At Risk', priority: 'Critical', transformation_id: 'TRX-001', budget_id: 'BUD-004', start_date: '2023-08-01', end_date: '2024-07-31', milestone_progress: 0.38 },
  { project_id: 'PRJ-403', name: 'Field Service Automation', description: 'Mobile-first field service platform with scheduling optimization and IoT integration', status: 'In Progress', priority: 'Medium', transformation_id: 'TRX-001', budget_id: 'BUD-004', start_date: '2024-01-01', end_date: '2024-10-31', milestone_progress: 0.45 },
  { project_id: 'PRJ-404', name: 'Customer Success Platform', description: 'Proactive customer health monitoring with churn prediction and expansion recommendations', status: 'In Progress', priority: 'High', transformation_id: 'TRX-001', budget_id: 'BUD-004', start_date: '2023-10-01', end_date: '2024-07-31', milestone_progress: 0.58 },
];

// Risks
const RISKS = [
  { risk_id: 'RSK-001', project_id: 'PRJ-203', description: 'Kafka cluster performance issues causing data pipeline delays', status: 'Open', probability: 0.7, impact: 0.8, risk_score: 0.56, owner: 'Data Engineering Lead', mitigation_plan: 'Scale cluster, optimize partitioning, add monitoring', identified_date: '2024-02-15' },
  { risk_id: 'RSK-002', project_id: 'PRJ-402', description: 'Salesforce integration complexity causing timeline delays', status: 'Open', probability: 0.8, impact: 0.7, risk_score: 0.56, owner: 'CRM Program Manager', mitigation_plan: 'Engage Salesforce consultants, reduce scope for Phase 1', identified_date: '2024-01-20' },
  { risk_id: 'RSK-003', project_id: 'PRJ-301', description: 'Legacy application dependencies blocking migration', status: 'Mitigating', probability: 0.5, impact: 0.9, risk_score: 0.45, owner: 'Cloud Migration Lead', mitigation_plan: 'Identify and modernize blockers, create parallel paths', identified_date: '2024-02-01' },
  { risk_id: 'RSK-004', project_id: 'PRJ-201', description: 'Data quality issues in source systems affecting analytics accuracy', status: 'Open', probability: 0.6, impact: 0.7, risk_score: 0.42, owner: 'Data Quality Manager', mitigation_plan: 'Implement data quality checks, establish data governance', identified_date: '2024-01-10' },
  { risk_id: 'RSK-005', project_id: 'PRJ-303', description: 'Zero trust rollout impacting user productivity', status: 'Monitoring', probability: 0.4, impact: 0.6, risk_score: 0.24, owner: 'Security Architect', mitigation_plan: 'Phased rollout, extensive user training, feedback loops', identified_date: '2024-02-20' },
  { risk_id: 'RSK-006', project_id: null, description: 'Talent shortage for cloud-native and ML engineering roles', status: 'Open', probability: 0.8, impact: 0.8, risk_score: 0.64, owner: 'VP of Engineering', mitigation_plan: 'Partner with recruiting firms, upskilling program, contractor augmentation', identified_date: '2024-01-05' },
  { risk_id: 'RSK-007', project_id: null, description: 'Budget overruns across transformation programs', status: 'Monitoring', probability: 0.5, impact: 0.7, risk_score: 0.35, owner: 'CFO', mitigation_plan: 'Monthly budget reviews, contingency reserves, scope prioritization', identified_date: '2024-02-10' },
  { risk_id: 'RSK-008', project_id: null, description: 'Regulatory compliance gaps with evolving data privacy laws', status: 'Mitigating', probability: 0.6, impact: 0.9, risk_score: 0.54, owner: 'Chief Compliance Officer', mitigation_plan: 'Legal review, privacy impact assessments, automated compliance checks', identified_date: '2024-01-25' },
];

// KPIs
const KPIS = [
  { kpi_id: 'KPI-001', name: 'Customer Satisfaction (CSAT)', description: 'Overall customer satisfaction score', current_value: 85, target_value: 90, unit: '%', status: 'On Track', project_id: 'PRJ-101', measurement_frequency: 'Monthly' },
  { kpi_id: 'KPI-002', name: 'Digital Adoption Rate', description: 'Percentage of customers using digital channels', current_value: 78, target_value: 85, unit: '%', status: 'On Track', project_id: 'PRJ-101', measurement_frequency: 'Monthly' },
  { kpi_id: 'KPI-003', name: 'Platform Uptime', description: 'System availability SLA', current_value: 99.9, target_value: 99.95, unit: '%', status: 'On Track', project_id: 'PRJ-103', measurement_frequency: 'Daily' },
  { kpi_id: 'KPI-004', name: 'Data Quality Score', description: 'Overall data quality index', current_value: 84, target_value: 92, unit: '%', status: 'At Risk', project_id: 'PRJ-201', measurement_frequency: 'Weekly' },
  { kpi_id: 'KPI-005', name: 'ML Model Accuracy', description: 'Average accuracy of production models', current_value: 89, target_value: 93, unit: '%', status: 'On Track', project_id: 'PRJ-202', measurement_frequency: 'Weekly' },
  { kpi_id: 'KPI-006', name: 'Cloud Migration Progress', description: 'Percentage of workloads migrated', current_value: 72, target_value: 95, unit: '%', status: 'On Track', project_id: 'PRJ-301', measurement_frequency: 'Monthly' },
  { kpi_id: 'KPI-007', name: 'Infrastructure Cost Savings', description: 'Annual savings from cloud optimization', current_value: 5.8, target_value: 9.0, unit: '$M', status: 'On Track', project_id: 'PRJ-301', measurement_frequency: 'Monthly' },
  { kpi_id: 'KPI-008', name: 'Deployment Frequency', description: 'Number of deployments per day', current_value: 15, target_value: 25, unit: 'per day', status: 'On Track', project_id: 'PRJ-304', measurement_frequency: 'Daily' },
  { kpi_id: 'KPI-009', name: 'Security Compliance Score', description: 'Overall security posture score', current_value: 92, target_value: 98, unit: '%', status: 'On Track', project_id: 'PRJ-303', measurement_frequency: 'Weekly' },
  { kpi_id: 'KPI-010', name: 'First Contact Resolution', description: 'Issues resolved on first contact', current_value: 78, target_value: 85, unit: '%', status: 'At Risk', project_id: 'PRJ-401', measurement_frequency: 'Weekly' },
  { kpi_id: 'KPI-011', name: 'Net Promoter Score', description: 'Customer loyalty metric', current_value: 45, target_value: 55, unit: '', status: 'On Track', project_id: 'PRJ-404', measurement_frequency: 'Quarterly' },
  { kpi_id: 'KPI-012', name: 'Carbon Footprint Reduction', description: 'YoY reduction in carbon emissions', current_value: 12, target_value: 20, unit: '%', status: 'On Track', project_id: 'PRJ-205', measurement_frequency: 'Quarterly' },
];

// Objectives (OKRs)
const OBJECTIVES = [
  { objective_id: 'OBJ-001', name: 'Deliver World-Class Digital Experience', description: 'Transform customer interactions through digital excellence', status: 'In Progress', timeframe: 'Q4 2024' },
  { objective_id: 'OBJ-002', name: 'Establish Unified Data Platform', description: 'Create single source of truth for enterprise data', status: 'In Progress', timeframe: 'Q4 2024' },
  { objective_id: 'OBJ-003', name: 'Complete Cloud Transformation', description: 'Achieve 95% cloud-native infrastructure', status: 'In Progress', timeframe: 'Q4 2024' },
  { objective_id: 'OBJ-004', name: 'Achieve Zero Trust Security', description: 'Implement comprehensive zero trust architecture', status: 'In Progress', timeframe: 'Q3 2024' },
  { objective_id: 'OBJ-005', name: 'Transform Customer Operations', description: 'AI-powered customer service excellence', status: 'In Progress', timeframe: 'Q4 2024' },
  { objective_id: 'OBJ-006', name: 'Accelerate Innovation Velocity', description: 'Reduce time-to-market for new capabilities', status: 'In Progress', timeframe: 'Q2 2024' },
];

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

async function syncTransformation() {
  console.log('\n📦 Creating Transformation...');
  const success = await applyAction(PALANTIR_ACTIONS.UPSERT_DIVISION, TRANSFORMATION);
  console.log(success ? '  ✅ Transformation created' : '  ❌ Transformation failed');
  return success ? 1 : 0;
}

async function syncBudgets() {
  console.log('\n💰 Creating Budgets...');
  let synced = 0;
  for (const budget of BUDGETS) {
    const success = await applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
      ...budget,
      created_at: new Date().toISOString(),
    });
    if (success) {
      synced++;
      console.log(`  ✅ ${budget.name}`);
    }
  }
  console.log(`  → ${synced}/${BUDGETS.length} budgets created`);
  return synced;
}

async function syncProjects() {
  console.log('\n📊 Creating Projects...');
  let synced = 0;
  for (const project of PROJECTS) {
    const success = await applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
      ...project,
      created_at: new Date().toISOString(),
    });
    if (success) {
      synced++;
      console.log(`  ✅ ${project.name}`);
    }
  }
  console.log(`  → ${synced}/${PROJECTS.length} projects created`);
  return synced;
}

async function syncRisks() {
  console.log('\n⚠️  Creating Risks...');
  let synced = 0;
  for (const risk of RISKS) {
    const success = await applyAction(PALANTIR_ACTIONS.UPSERT_RISK, {
      ...risk,
      created_at: new Date().toISOString(),
    });
    if (success) {
      synced++;
      console.log(`  ✅ ${risk.risk_id}: ${risk.description.substring(0, 50)}...`);
    }
  }
  console.log(`  → ${synced}/${RISKS.length} risks created`);
  return synced;
}

async function syncKPIs() {
  console.log('\n📈 Creating KPIs...');
  let synced = 0;
  for (const kpi of KPIS) {
    const success = await applyAction(PALANTIR_ACTIONS.UPSERT_KPI, {
      ...kpi,
      last_measured_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });
    if (success) {
      synced++;
      console.log(`  ✅ ${kpi.name}`);
    }
  }
  console.log(`  → ${synced}/${KPIS.length} KPIs created`);
  return synced;
}

async function syncObjectives() {
  console.log('\n🎯 Creating Objectives...');
  let synced = 0;
  for (const obj of OBJECTIVES) {
    const success = await applyAction(PALANTIR_ACTIONS.UPSERT_OKR, {
      ...obj,
      created_at: new Date().toISOString(),
    });
    if (success) {
      synced++;
      console.log(`  ✅ ${obj.name}`);
    }
  }
  console.log(`  → ${synced}/${OBJECTIVES.length} objectives created`);
  return synced;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Syncing SAFe 6.0 Data to Palantir Foundry');
  console.log('='.repeat(60));
  console.log(`\nOntology: ${ONTOLOGY_RID}`);
  console.log(`Host: ${PALANTIR_HOST}`);

  const results = {
    transformation: 0,
    budgets: 0,
    projects: 0,
    risks: 0,
    kpis: 0,
    objectives: 0,
  };

  try {
    // Sync in dependency order
    results.transformation = await syncTransformation();
    results.budgets = await syncBudgets();
    results.projects = await syncProjects();
    results.risks = await syncRisks();
    results.kpis = await syncKPIs();
    results.objectives = await syncObjectives();

    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC RESULTS');
    console.log('='.repeat(60));
    console.log(`  Transformation: ${results.transformation}/1`);
    console.log(`  Budgets: ${results.budgets}/${BUDGETS.length}`);
    console.log(`  Projects: ${results.projects}/${PROJECTS.length}`);
    console.log(`  Risks: ${results.risks}/${RISKS.length}`);
    console.log(`  KPIs: ${results.kpis}/${KPIS.length}`);
    console.log(`  Objectives: ${results.objectives}/${OBJECTIVES.length}`);

    const total = results.transformation + results.budgets + results.projects + results.risks + results.kpis + results.objectives;
    const expected = 1 + BUDGETS.length + PROJECTS.length + RISKS.length + KPIS.length + OBJECTIVES.length;

    console.log('\n' + '='.repeat(60));
    if (total === expected) {
      console.log(`✅ SUCCESS: All ${total} objects synced to Palantir!`);
    } else {
      console.log(`⚠️  PARTIAL: ${total}/${expected} objects synced`);
    }
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();
