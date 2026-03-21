/**
 * Build Data Lineage in Palantir Foundry
 *
 * Creates the relationship structure:
 * Transformation -> Projects -> Dependencies, KPIs, Risks, Insights
 */

import 'dotenv/config';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

async function main() {
  console.log('='.repeat(60));
  console.log('BUILDING DATA LINEAGE IN PALANTIR');
  console.log('='.repeat(60));

  const palantir = getPalantirService();
  if (!palantir) {
    console.error('ERROR: Palantir service not initialized');
    process.exit(1);
  }

  // Step 1: Create a Transformation (top-level container)
  console.log('\n--- Step 1: Create Transformation ---');
  const transformationId = 'atlas-digital-transformation';
  try {
    await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_DIVISION, {
      transformation_id: transformationId,
      name: 'Atlas Digital Transformation Program',
      status: 'Active',
      vision: 'Unified portfolio management across all PM tools',
      executive_sponsor: 'CIO Office',
    });
    console.log('✓ Created transformation: ' + transformationId);
  } catch (e: any) {
    if (e.message?.includes('ObjectAlreadyExists')) {
      console.log('○ Transformation exists: ' + transformationId);
    } else {
      console.log('✗ Error: ' + e.message?.slice(0, 60));
    }
  }

  // Step 2: Create master projects for each source tool (linked to transformation)
  console.log('\n--- Step 2: Create Source Tool Projects ---');
  const sourceProjects = [
    { id: 'source-jira', name: 'Jira Integration', tool: 'Jira' },
    { id: 'source-openproject', name: 'OpenProject Integration', tool: 'OpenProject' },
    { id: 'source-monday', name: 'Monday.com Integration', tool: 'Monday.com' },
  ];

  for (const proj of sourceProjects) {
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
        project_id: proj.id,
        name: `[${proj.tool}] ${proj.name}`,
        status: 'Active',
        description: `Data source: ${proj.tool} - synced to Palantir Foundry`,
        transformation_id: transformationId,
      });
      console.log(`✓ Created project: ${proj.name}`);
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`○ Project exists: ${proj.name}`);
      } else {
        console.log(`✗ Error: ${e.message?.slice(0, 60)}`);
      }
    }
  }

  // Step 3: Create dependencies between projects (shows data flow)
  console.log('\n--- Step 3: Create Dependencies (Data Flow) ---');
  const dependencies = [
    { id: 'dep-jira-palantir', source: 'source-jira', target: 'source-openproject', type: 'data-sync' },
    { id: 'dep-monday-palantir', source: 'source-monday', target: 'source-openproject', type: 'data-sync' },
  ];

  for (const dep of dependencies) {
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
        dependency_id: dep.id,
        source_project_id: dep.source,
        target_project_id: dep.target,
        dependency_type: dep.type,
        status: 'Active',
        description: `Data flows from ${dep.source} to ${dep.target}`,
      });
      console.log(`✓ Created dependency: ${dep.source} -> ${dep.target}`);
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`○ Dependency exists: ${dep.id}`);
      } else {
        console.log(`✗ Error: ${e.message?.slice(0, 60)}`);
      }
    }
  }

  // Step 4: Create KPIs linked to projects
  console.log('\n--- Step 4: Create KPIs (Metrics) ---');
  const kpis = [
    { id: 'kpi-jira-sync', name: 'Jira Sync Rate', project: 'source-jira', value: 98, target: 99 },
    { id: 'kpi-op-sync', name: 'OpenProject Sync Rate', project: 'source-openproject', value: 100, target: 99 },
    { id: 'kpi-monday-sync', name: 'Monday Sync Rate', project: 'source-monday', value: 95, target: 99 },
    { id: 'kpi-total-objects', name: 'Total Objects Synced', project: 'source-openproject', value: 264, target: 300 },
  ];

  for (const kpi of kpis) {
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_KPI, {
        kpi_id: kpi.id,
        name: kpi.name,
        project_id: kpi.project,
        current_value: kpi.value,
        target_value: kpi.target,
        unit: '%',
        status: kpi.value >= kpi.target ? 'On Track' : 'At Risk',
        measurement_frequency: 'Daily',
      });
      console.log(`✓ Created KPI: ${kpi.name}`);
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`○ KPI exists: ${kpi.name}`);
      } else {
        console.log(`✗ Error: ${e.message?.slice(0, 60)}`);
      }
    }
  }

  // Step 5: Create insights linked to projects
  console.log('\n--- Step 5: Create Linked Insights ---');
  const linkedInsights = [
    { id: 'insight-jira-health', title: 'Jira Integration Health', project: 'source-jira', type: 'Pattern' },
    { id: 'insight-op-health', title: 'OpenProject Integration Health', project: 'source-openproject', type: 'Pattern' },
    { id: 'insight-monday-health', title: 'Monday.com Integration Health', project: 'source-monday', type: 'Pattern' },
    { id: 'insight-data-quality', title: 'Cross-Tool Data Quality Score', project: 'source-openproject', type: 'Anomaly' },
    { id: 'insight-sync-recommendation', title: 'Sync Optimization Recommendation', project: 'source-openproject', type: 'Recommendation' },
  ];

  for (const insight of linkedInsights) {
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
        insight_id: insight.id,
        title: insight.title,
        description: `Integration health insight for ${insight.project}`,
        related_project_id: insight.project,
        status: 'New',
        insight_type: insight.type,
        severity: 'Medium',
        confidence_score: 0.85,
      });
      console.log(`✓ Created insight: ${insight.title}`);
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`○ Insight exists: ${insight.title}`);
      } else {
        console.log(`✗ Error: ${e.message?.slice(0, 60)}`);
      }
    }
  }

  // Step 6: Create risks linked to projects
  console.log('\n--- Step 6: Create Risks ---');
  const risks = [
    { id: 'risk-sync-failure', desc: 'PM Tool Sync Failure Risk', project: 'source-jira' },
    { id: 'risk-data-drift', desc: 'Cross-Tool Data Drift Risk', project: 'source-openproject' },
  ];

  for (const risk of risks) {
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_RISK, {
        risk_id: risk.id,
        description: risk.desc,
        project_id: risk.project,
        status: 'Open',
        impact: 'Medium',
        probability: 'Low',
        risk_score: 4,
        mitigation_plan: 'Automated sync monitoring and alerting',
      });
      console.log(`✓ Created risk: ${risk.desc}`);
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`○ Risk exists: ${risk.desc}`);
      } else {
        console.log(`✗ Error: ${e.message?.slice(0, 60)}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DATA LINEAGE STRUCTURE CREATED');
  console.log('='.repeat(60));
  console.log(`
Structure:
  Transformation: Atlas Digital Transformation Program
    └── Projects (by source tool)
        ├── [Jira] Jira Integration
        │   ├── KPI: Jira Sync Rate
        │   ├── Risk: PM Tool Sync Failure Risk
        │   └── Insight: Jira Integration Health
        ├── [OpenProject] OpenProject Integration
        │   ├── KPI: OpenProject Sync Rate
        │   ├── KPI: Total Objects Synced
        │   ├── Risk: Cross-Tool Data Drift Risk
        │   └── Insights: Data Quality, Sync Recommendation
        └── [Monday.com] Monday.com Integration
            ├── KPI: Monday Sync Rate
            └── Insight: Monday.com Integration Health

Dependencies (Data Flow):
  source-jira -> source-openproject
  source-monday -> source-openproject

View in Palantir Foundry:
  → Ontology Manager → Select AtlasTransformation, AtlasProject, etc.
  → Data Lineage view should show the relationships
`);
}

main().catch(console.error);

export {};
