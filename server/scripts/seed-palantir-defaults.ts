/**
 * PALANTIR DEFAULTS & DATA LINEAGE SEEDER
 *
 * MANUAL SCRIPT - Run this when you want to:
 * 1. Initialize Palantir with master transformation structure
 * 2. Sync projects, features, risks from PostgreSQL to Palantir
 * 3. Create integration source projects for data lineage
 * 4. Sync business rules (companyRules) to Palantir
 * 5. Create project dependencies in Palantir
 *
 * Usage:
 *   npx tsx server/scripts/seed-palantir-defaults.ts
 *
 * Or via API:
 *   POST /api/palantir/sync/full
 */

import 'dotenv/config';
import { db } from '../db.js';
import { companyRules } from '../db/schema.js';
import { projects, features, risks, divisions, dependencies, divisionKpis, divisionOkrs } from '../../shared/schema.js';
import { isNotNull } from 'drizzle-orm';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

export interface SeedResult {
  success: boolean;
  created: number;
  skipped: number;
  errors: number;
  details: {
    transformations: number;
    projects: number;
    features: number;
    risks: number;
    rules: number;
    dependencies: number;
    kpis: number;
    okrs: number;
    integrationSources: number;
  };
}

/**
 * Main seeding function - can be called from script or API
 */
export async function seedPalantirDefaults(): Promise<SeedResult> {
  const palantir = getPalantirService();

  if (!palantir) {
    console.log('[Palantir Seed] ERROR: Palantir service not configured');
    return {
      success: false,
      created: 0,
      skipped: 0,
      errors: 1,
      details: {
        transformations: 0,
        projects: 0,
        features: 0,
        risks: 0,
        rules: 0,
        dependencies: 0,
        kpis: 0,
        okrs: 0,
        integrationSources: 0,
      },
    };
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PALANTIR DEFAULTS & DATA LINEAGE SEEDER');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const result: SeedResult = {
    success: true,
    created: 0,
    skipped: 0,
    errors: 0,
    details: {
      transformations: 0,
      projects: 0,
      features: 0,
      risks: 0,
      rules: 0,
      dependencies: 0,
      kpis: 0,
      okrs: 0,
      integrationSources: 0,
    },
  };

  // Helper to track success/skip/error
  const tryAction = async (
    action: () => Promise<void>,
    detailKey: keyof SeedResult['details']
  ) => {
    try {
      await action();
      result.created++;
      result.details[detailKey]++;
    } catch (e: any) {
      if (
        e.message?.includes('ObjectAlreadyExists') ||
        e.message?.includes('already exists')
      ) {
        result.skipped++;
      } else {
        result.errors++;
        console.log(`  ✗ Error: ${e.message?.slice(0, 60)}`);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Create Master Transformation (top-level container)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- Step 1: Create Master Transformation ---');

  await tryAction(async () => {
    await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_DIVISION, {
      transformation_id: 'atlas-master-transformation',
      name: 'Atlas Enterprise Portfolio',
      status: 'Active',
      vision: 'Unified portfolio management with full data lineage traceability',
      executive_sponsor: 'Executive Leadership',
    });
    console.log('  ✓ Created: Atlas Enterprise Portfolio');
  }, 'transformations');

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Sync Projects from PostgreSQL
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 2: Sync Projects from Database ---');

  try {
    const allProjects = await db.select().from(projects);
    console.log(`  Found ${allProjects.length} projects in PostgreSQL`);

    for (const proj of allProjects) {
      await tryAction(async () => {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
          project_id: proj.id,
          name: proj.name,
          status: proj.status || 'Planning',
          description: proj.description || '',
          transformation_id: 'atlas-master-transformation',
        });
      }, 'projects');
    }
    console.log(`  ✓ Projects synced: ${result.details.projects}`);
  } catch (e: any) {
    console.log(`  ○ Projects table: ${e.message?.slice(0, 50)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Sync Divisions/Value Streams
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 3: Sync Divisions/Value Streams ---');

  try {
    const allDivisions = await db.select().from(divisions);
    console.log(`  Found ${allDivisions.length} divisions in PostgreSQL`);

    for (const div of allDivisions) {
      await tryAction(async () => {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_DIVISION, {
          transformation_id: `division-${div.id}`,
          name: `[Division] ${div.name}`,
          status: 'Active',
          vision: div.description || '',
          executive_sponsor: div.ceo || '',
        });
      }, 'transformations');
    }
    console.log(`  ✓ Divisions synced`);
  } catch (e: any) {
    console.log(`  ○ Divisions table: ${e.message?.slice(0, 50)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Sync Features (linked to Projects via related_project_id)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 4: Sync Features (linked to Projects) ---');

  try {
    const allFeatures = await db.select().from(features);
    console.log(`  Found ${allFeatures.length} features in PostgreSQL`);

    for (const feat of allFeatures) {
      await tryAction(async () => {
        await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
          insight_id: `feature-${feat.id}`,
          title: `[Feature] ${feat.name}`,
          description: feat.description || '',
          related_project_id: feat.projectId,
          status: feat.status || 'New',
          insight_type: 'Pattern',
          severity: feat.priority === 'high' ? 'High' : 'Medium',
        });
      }, 'features');
    }
    console.log(`  ✓ Features synced: ${result.details.features}`);
  } catch (e: any) {
    console.log(`  ○ Features table: ${e.message?.slice(0, 50)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Sync Risks (linked to Projects)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 5: Sync Risks (linked to Projects) ---');

  try {
    const allRisks = await db.select().from(risks);
    console.log(`  Found ${allRisks.length} risks in PostgreSQL`);

    for (const risk of allRisks) {
      await tryAction(async () => {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_RISK, {
          risk_id: `risk-${risk.id}`,
          description: risk.name || 'Risk',
          project_id: risk.projectId,
          status: risk.status || 'Open',
          impact: risk.impact || 'Medium',
          probability: risk.probability || 'Medium',
          risk_score: risk.riskScore || 5,
          mitigation_plan: risk.mitigation || '',
        });
      }, 'risks');
    }
    console.log(`  ✓ Risks synced: ${result.details.risks}`);
  } catch (e: any) {
    console.log(`  ○ Risks table: ${e.message?.slice(0, 50)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Sync Business Rules (companyRules → Palantir as Insights)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 6: Sync Business Rules ---');

  try {
    const allRules = await db.select().from(companyRules);
    console.log(`  Found ${allRules.length} business rules in PostgreSQL`);

    for (const rule of allRules) {
      await tryAction(async () => {
        await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
          insight_id: `rule-${rule.id}`,
          title: `[Rule] ${rule.ruleName}`,
          description: rule.ruleDescription || '',
          category: 'governance',
          insight_type: 'Rule',
          status: rule.isActive ? 'Active' : 'Inactive',
          severity: rule.enforcementLevel === 'block' ? 'High' : 'Medium',
          created_by: 'policy-as-code-extractor',
          metadata: JSON.stringify({
            ruleCode: rule.ruleCode,
            ruleCategory: rule.ruleCategory,
            ruleLogic: rule.ruleLogic,
            enforcementLevel: rule.enforcementLevel,
            extractedFromReport: rule.extractedFromReport,
            sourceDocument: rule.sourceDocument,
          }),
        });
      }, 'rules');
    }
    console.log(`  ✓ Business rules synced: ${result.details.rules}`);
  } catch (e: any) {
    console.log(`  ○ Company rules table: ${e.message?.slice(0, 50)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: Sync Project Dependencies (data lineage relationships)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 7: Sync Project Dependencies ---');

  try {
    const allDeps = await db
      .select()
      .from(dependencies)
      .where(isNotNull(dependencies.targetProjectId));
    console.log(`  Found ${allDeps.length} project dependencies in PostgreSQL`);

    for (const dep of allDeps) {
      await tryAction(async () => {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
          dependency_id: `dep-${dep.id}`,
          source_project_id: dep.projectId,
          target_project_id: dep.targetProjectId!,
          dependency_type: dep.dependencyType || 'depends_on',
          status: dep.status || 'Active',
          description:
            dep.description ||
            `${dep.projectId} depends on ${dep.targetProjectId}`,
        });
      }, 'dependencies');
    }
    console.log(`  ✓ Dependencies synced: ${result.details.dependencies}`);
  } catch (e: any) {
    console.log(`  ○ Dependencies table: ${e.message?.slice(0, 50)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 8: Create Integration Source Projects (for data lineage visualization)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 8: Create Integration Source Projects ---');

  const integrationSources = [
    {
      id: 'source-jira',
      name: '[Integration] Jira',
      tool: 'Jira',
      desc: 'Epics, stories, tasks from Jira',
    },
    {
      id: 'source-openproject',
      name: '[Integration] OpenProject',
      tool: 'OpenProject',
      desc: 'Work packages from OpenProject',
    },
    {
      id: 'source-monday',
      name: '[Integration] Monday.com',
      tool: 'Monday.com',
      desc: 'Items and boards from Monday.com',
    },
    {
      id: 'source-postgres',
      name: '[Integration] PostgreSQL',
      tool: 'PostgreSQL',
      desc: 'Local database records',
    },
  ];

  for (const src of integrationSources) {
    await tryAction(async () => {
      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
        project_id: src.id,
        name: src.name,
        status: 'Active',
        description: `Data source: ${src.tool} - ${src.desc}`,
        transformation_id: 'atlas-master-transformation',
      });
      console.log(`  ✓ ${src.name}`);
    }, 'integrationSources');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 9: Create Data Flow Dependencies (integration lineage)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 9: Create Data Flow Dependencies ---');

  const lineageDeps = [
    {
      id: 'lineage-jira-postgres',
      source: 'source-jira',
      target: 'source-postgres',
      type: 'data-sync',
    },
    {
      id: 'lineage-openproject-postgres',
      source: 'source-openproject',
      target: 'source-postgres',
      type: 'data-sync',
    },
    {
      id: 'lineage-monday-postgres',
      source: 'source-monday',
      target: 'source-postgres',
      type: 'data-sync',
    },
    {
      id: 'lineage-postgres-palantir',
      source: 'source-postgres',
      target: 'atlas-master-transformation',
      type: 'data-sync',
    },
  ];

  for (const dep of lineageDeps) {
    await tryAction(async () => {
      await palantir.applyAction(PALANTIR_ACTIONS.CREATE_DEPENDENCY, {
        dependency_id: dep.id,
        source_project_id: dep.source,
        target_project_id: dep.target,
        dependency_type: dep.type,
        status: 'Active',
        description: `Data flows from ${dep.source} → ${dep.target}`,
      });
      console.log(`  ✓ ${dep.source} → ${dep.target}`);
    }, 'dependencies');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 10: Sync KPIs from PostgreSQL
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 10: Sync Division KPIs from PostgreSQL ---');

  const dbKpis = await db.select().from(divisionKpis);
  console.log(`  Found ${dbKpis.length} KPIs in PostgreSQL`);

  for (const kpi of dbKpis) {
    await tryAction(async () => {
      // Parse numeric values from string fields like "78%" or "$2.1M"
      const parseValue = (val: string | null): number | undefined => {
        if (!val) return undefined;
        const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? undefined : num;
      };

      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_KPI, {
        kpi_id: kpi.id,
        name: kpi.name,
        description: `Division: ${kpi.divisionId} | Trend: ${kpi.trend || 'stable'}`,
        current_value: parseValue(kpi.value2024),
        target_value: parseValue(kpi.target2025),
        unit: kpi.unit || '%',
        status: kpi.status === 'on-track' ? 'On Track' : kpi.status === 'at-risk' ? 'At Risk' : 'Unknown',
        measurement_frequency: 'Monthly',
        project_id: kpi.divisionId, // Link to division
      });
      console.log(`  ✓ ${kpi.name}`);
    }, 'kpis');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 11: Sync OKRs from PostgreSQL
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 11: Sync Division OKRs from PostgreSQL ---');

  const dbOkrs = await db.select().from(divisionOkrs);
  console.log(`  Found ${dbOkrs.length} OKRs in PostgreSQL`);

  for (const okr of dbOkrs) {
    await tryAction(async () => {
      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_OKR, {
        objective_id: okr.id,
        name: okr.objective,
        description: `Key Results: ${okr.keyResults || 'N/A'}\nOwner: ${okr.owner || 'N/A'}\nDivision: ${okr.divisionId}`,
        status: 'Active',
        timeframe: okr.dueDate ? new Date(okr.dueDate).toISOString().split('T')[0] : undefined,
      });
      console.log(`  ✓ ${okr.objective}`);
    }, 'okrs');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 12: Create Default KPIs for Integration Health Monitoring
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Step 12: Create Integration Health KPIs ---');

  const defaultKPIs = [
    {
      id: 'kpi-jira-sync',
      name: 'Jira Sync Rate',
      project: 'source-jira',
      value: 98,
      target: 99,
    },
    {
      id: 'kpi-openproject-sync',
      name: 'OpenProject Sync Rate',
      project: 'source-openproject',
      value: 100,
      target: 99,
    },
    {
      id: 'kpi-monday-sync',
      name: 'Monday.com Sync Rate',
      project: 'source-monday',
      value: 95,
      target: 99,
    },
    {
      id: 'kpi-data-quality',
      name: 'Data Quality Score',
      project: 'source-postgres',
      value: 92,
      target: 95,
    },
    {
      id: 'kpi-palantir-objects',
      name: 'Total Palantir Objects',
      project: 'atlas-master-transformation',
      value: 0,
      target: 500,
    },
  ];

  for (const kpi of defaultKPIs) {
    await tryAction(async () => {
      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_KPI, {
        kpi_id: kpi.id,
        name: kpi.name,
        project_id: kpi.project,
        current_value: kpi.value,
        target_value: kpi.target,
        unit: kpi.id.includes('Rate') || kpi.id.includes('Quality') ? '%' : 'count',
        status: kpi.value >= kpi.target ? 'On Track' : 'At Risk',
        measurement_frequency: 'Daily',
      });
      console.log(`  ✓ ${kpi.name}`);
    }, 'kpis');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PALANTIR SEEDING COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Created:  ${result.created}`);
  console.log(`Skipped:  ${result.skipped} (already exist)`);
  console.log(`Errors:   ${result.errors}`);
  console.log('');
  console.log('Details:');
  console.log(`  Transformations:     ${result.details.transformations}`);
  console.log(`  Projects:            ${result.details.projects}`);
  console.log(`  Features:            ${result.details.features}`);
  console.log(`  Risks:               ${result.details.risks}`);
  console.log(`  Business Rules:      ${result.details.rules}`);
  console.log(`  Dependencies:        ${result.details.dependencies}`);
  console.log(`  KPIs:                ${result.details.kpis}`);
  console.log(`  OKRs:                ${result.details.okrs}`);
  console.log(`  Integration Sources: ${result.details.integrationSources}`);
  console.log('');
  console.log('Data Lineage Structure:');
  console.log('  [Jira] ─────────┐');
  console.log('  [OpenProject] ──┼──► [PostgreSQL] ──► [Palantir Foundry]');
  console.log('  [Monday.com] ───┘');
  console.log('');
  console.log('View in Palantir Foundry:');
  console.log('  → Ontology Manager → AtlasTransformation');
  console.log('  → Data Lineage view shows the relationship graph');
  console.log('');

  return result;
}

// Run if called directly as a script
if (!(globalThis as any).__BUNDLED__ && import.meta.url === `file://${process.argv[1]}`) {
  seedPalantirDefaults()
    .then((result) => {
      if (result.success) {
        console.log('[Palantir Seed] Done!');
        process.exit(0);
      } else {
        console.log('[Palantir Seed] Completed with errors');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('[Palantir Seed] Failed:', error);
      process.exit(1);
    });
}
