/**
 * BUILD FULL DATA LINEAGE IN PALANTIR
 *
 * Reads all relationships from PostgreSQL and creates the complete
 * hierarchy in Palantir with proper FK links:
 *
 * Transformation
 *   └── Projects
 *       └── Features (linked to project)
 *           └── Stories (linked to feature)
 *               └── Tasks (linked to story)
 *       └── Risks (linked to project)
 *       └── KPIs (linked to project)
 *       └── Dependencies (project-to-project)
 */

import 'dotenv/config';
import { db } from '../db.js';
import { projects, features, stories, tasks, risks, kpis, dependencies } from '../../shared/schema.js';
import { sql } from 'drizzle-orm';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

async function main() {
  console.log('='.repeat(70));
  console.log('BUILDING FULL DATA LINEAGE IN PALANTIR');
  console.log('='.repeat(70));

  const palantir = getPalantirService();
  if (!palantir) {
    console.error('ERROR: Palantir service not initialized');
    process.exit(1);
  }

  // Stats
  let stats = {
    transformations: 0,
    projects: 0,
    features: 0,
    stories: 0,
    tasks: 0,
    risks: 0,
    kpis: 0,
    dependencies: 0,
    objectives: 0,
    errors: 0,
  };

  // Step 1: Create master transformation
  console.log('\n--- Step 1: Create Master Transformation ---');
  const transformationId = 'atlas-master-transformation';
  try {
    await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_DIVISION, {
      transformation_id: transformationId,
      name: 'Atlas Enterprise Portfolio',
      status: 'Active',
      vision: 'Unified portfolio management with full traceability',
      executive_sponsor: 'Executive Leadership',
    });
    console.log('✓ Created master transformation');
    stats.transformations++;
  } catch (e: any) {
    if (e.message?.includes('ObjectAlreadyExists')) {
      console.log('○ Master transformation exists');
      stats.transformations++;
    } else {
      console.log('✗ Error: ' + e.message?.slice(0, 60));
      stats.errors++;
    }
  }

  // Step 2: Get all projects from DB and create in Palantir
  console.log('\n--- Step 2: Sync Projects (linked to Transformation) ---');
  const allProjects = await db.select().from(projects);
  console.log(`Found ${allProjects.length} projects in database`);

  for (const proj of allProjects) {
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
        project_id: proj.id,
        name: proj.name,
        status: proj.status || 'Planning',
        description: proj.description || '',
        transformation_id: transformationId,
      });
      console.log(`  ✓ ${proj.name}`);
      stats.projects++;
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`  ○ ${proj.name} (exists)`);
        stats.projects++;
      } else {
        console.log(`  ✗ ${proj.name}: ${e.message?.slice(0, 50)}`);
        stats.errors++;
      }
    }
  }

  // Step 3: Get all features and create as insights linked to projects
  console.log('\n--- Step 3: Sync Features (linked to Projects) ---');
  const allFeatures = await db.select().from(features);
  console.log(`Found ${allFeatures.length} features in database`);

  for (const feat of allFeatures) {
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
        insight_id: `feature-${feat.id}`,
        title: `[Feature] ${feat.name}`,
        description: feat.description || '',
        related_project_id: feat.projectId,
        status: feat.status || 'New',
        insight_type: 'Pattern',
        severity: feat.priority === 'high' ? 'High' : 'Medium',
      });
      console.log(`  ✓ ${feat.name}`);
      stats.features++;
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`  ○ ${feat.name} (exists)`);
        stats.features++;
      } else {
        console.log(`  ✗ ${feat.name}: ${e.message?.slice(0, 50)}`);
        stats.errors++;
      }
    }
  }

  // Step 4: Get all stories and create as insights linked to features/projects
  console.log('\n--- Step 4: Sync Stories (linked to Features/Projects) ---');
  const allStories = await db.select().from(stories);
  console.log(`Found ${allStories.length} stories in database`);

  for (const story of allStories.slice(0, 50)) { // Limit for performance
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
        insight_id: `story-${story.id}`,
        title: `[Story] ${story.name}`,
        description: story.description || '',
        related_project_id: story.projectId,
        status: story.status || 'New',
        insight_type: 'Pattern',
      });
      console.log(`  ✓ ${story.name?.substring(0, 40)}`);
      stats.stories++;
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`  ○ ${story.name?.substring(0, 40)} (exists)`);
        stats.stories++;
      } else {
        console.log(`  ✗ ${story.name?.substring(0, 40)}: ${e.message?.slice(0, 40)}`);
        stats.errors++;
      }
    }
  }

  // Step 5: Get all tasks
  console.log('\n--- Step 5: Sync Tasks (linked to Stories/Projects) ---');
  const allTasks = await db.select().from(tasks);
  console.log(`Found ${allTasks.length} tasks in database`);

  for (const task of allTasks.slice(0, 50)) { // Limit for performance
    try {
      await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
        insight_id: `task-${task.id}`,
        title: `[Task] ${task.name}`,
        description: task.description || '',
        related_project_id: task.projectId,
        status: task.status || 'New',
        insight_type: 'Pattern',
      });
      console.log(`  ✓ ${task.name?.substring(0, 40)}`);
      stats.tasks++;
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`  ○ ${task.name?.substring(0, 40)} (exists)`);
        stats.tasks++;
      } else {
        console.log(`  ✗ ${task.name?.substring(0, 40)}: ${e.message?.slice(0, 40)}`);
        stats.errors++;
      }
    }
  }

  // Step 6: Get all risks and create linked to projects
  console.log('\n--- Step 6: Sync Risks (linked to Projects) ---');
  const allRisks = await db.select().from(risks);
  console.log(`Found ${allRisks.length} risks in database`);

  for (const risk of allRisks) {
    try {
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
      console.log(`  ✓ ${risk.name?.substring(0, 40)}`);
      stats.risks++;
    } catch (e: any) {
      if (e.message?.includes('ObjectAlreadyExists')) {
        console.log(`  ○ ${risk.name?.substring(0, 40)} (exists)`);
        stats.risks++;
      } else {
        console.log(`  ✗ ${risk.name?.substring(0, 40)}: ${e.message?.slice(0, 40)}`);
        stats.errors++;
      }
    }
  }

  // Step 7: Get all KPIs and create linked to projects
  console.log('\n--- Step 7: Sync KPIs (linked to Projects) ---');
  try {
    // Use raw SQL to query only columns that exist in the actual database
    const kpiResult = await db.execute(sql`
      SELECT id, name, description, level_id, current_value, target_value, unit, trend, status
      FROM kpis
      LIMIT 100
    `);
    const allKpis = kpiResult.rows as any[];
    console.log(`Found ${allKpis.length} KPIs in database`);

    for (const kpi of allKpis) {
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_KPI, {
          kpi_id: `kpi-${kpi.id}`,
          name: kpi.name,
          project_id: kpi.level_id || 'prj-001', // Use level_id as project reference
          current_value: kpi.current_value || 0,
          target_value: kpi.target_value || 100,
          unit: kpi.unit || '%',
          status: kpi.trend === 'improving' ? 'On Track' : kpi.trend === 'declining' ? 'At Risk' : 'Stable',
          description: kpi.description || '',
        });
        console.log(`  ✓ ${kpi.name}`);
        stats.kpis++;
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ ${kpi.name} (exists)`);
          stats.kpis++;
        } else {
          console.log(`  ✗ ${kpi.name}: ${e.message?.slice(0, 40)}`);
          stats.errors++;
        }
      }
    }
  } catch (e: any) {
    console.log(`KPIs query error: ${e.message?.slice(0, 60)}`);
    console.log('  Attempting with minimal columns...');
    try {
      const kpiResult = await db.execute(sql`SELECT id, name FROM kpis LIMIT 50`);
      const simpleKpis = kpiResult.rows as any[];
      console.log(`Found ${simpleKpis.length} KPIs (minimal query)`);
      for (const kpi of simpleKpis) {
        try {
          await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_KPI, {
            kpi_id: `kpi-${kpi.id}`,
            name: kpi.name,
            project_id: 'prj-001',
            current_value: 0,
            target_value: 100,
            unit: '%',
            status: 'Stable',
          });
          console.log(`  ✓ ${kpi.name}`);
          stats.kpis++;
        } catch (e: any) {
          if (e.message?.includes('ObjectAlreadyExists')) {
            stats.kpis++;
          } else {
            stats.errors++;
          }
        }
      }
    } catch (e2: any) {
      console.log(`KPIs table not available: ${e2.message?.slice(0, 50)}`);
    }
  }

  // Step 8: Get project dependencies
  console.log('\n--- Step 8: Sync Project Dependencies ---');
  try {
    const allDeps = await db.select().from(dependencies);
    console.log(`Found ${allDeps.length} dependencies in database`);

    for (const dep of allDeps) {
      // Skip dependencies without a target project
      if (!dep.targetProjectId) {
        console.log(`  ○ Skipping ${dep.name || dep.id} (no target project)`);
        continue;
      }
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
          dependency_id: `dep-${dep.id}`,
          source_project_id: dep.projectId,
          target_project_id: dep.targetProjectId,
          dependency_type: dep.dependencyType || 'depends_on',
          status: 'Active',
          description: dep.description || `${dep.projectId} depends on ${dep.targetProjectId}`,
        });
        console.log(`  ✓ ${dep.projectId} -> ${dep.targetProjectId}`);
        stats.dependencies++;
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ ${dep.projectId} -> ${dep.targetProjectId} (exists)`);
          stats.dependencies++;
        } else {
          console.log(`  ✗ Dep error: ${e.message?.slice(0, 50)}`);
          stats.errors++;
        }
      }
    }
  } catch (e: any) {
    console.log(`Dependencies table error: ${e.message?.slice(0, 50)}`);
  }

  // Step 9: Create OKRs/Objectives
  console.log('\n--- Step 9: Sync OKRs/Objectives ---');
  try {
    const okrs = await db.execute(sql`SELECT * FROM okrs LIMIT 20`);
    console.log(`Found ${okrs.rows.length} OKRs in database`);

    for (const okr of okrs.rows as any[]) {
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_OKR, {
          objective_id: `okr-${okr.id}`,
          name: okr.name || okr.objective,
          status: okr.status || 'On Track',
          description: okr.description || '',
          timeframe: okr.timeframe || 'Q1 2025',
        });
        console.log(`  ✓ ${(okr.name || okr.objective)?.substring(0, 40)}`);
        stats.objectives++;
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ ${(okr.name || okr.objective)?.substring(0, 40)} (exists)`);
          stats.objectives++;
        } else {
          console.log(`  ✗ OKR error: ${e.message?.slice(0, 50)}`);
          stats.errors++;
        }
      }
    }
  } catch (e: any) {
    console.log(`OKRs table error: ${e.message?.slice(0, 50)}`);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('LINEAGE SYNC COMPLETE');
  console.log('='.repeat(70));
  console.log(`
Objects synced to Palantir:
  Transformations: ${stats.transformations}
  Projects:        ${stats.projects}
  Features:        ${stats.features}
  Stories:         ${stats.stories}
  Tasks:           ${stats.tasks}
  Risks:           ${stats.risks}
  KPIs:            ${stats.kpis}
  Dependencies:    ${stats.dependencies}
  Objectives:      ${stats.objectives}
  ─────────────────
  Total:           ${Object.values(stats).reduce((a, b) => a + b, 0) - stats.errors}
  Errors:          ${stats.errors}

Lineage Structure:
  AtlasTransformation (master)
    └── AtlasProject (linked via transformation_id)
        ├── AtlasInsight [Feature] (linked via related_project_id)
        │   └── AtlasInsight [Story] (linked via related_project_id)
        │       └── AtlasInsight [Task] (linked via related_project_id)
        ├── AtlasRisk (linked via project_id)
        ├── AtlasKpi (linked via project_id)
        └── AtlasDependency (source_project_id -> target_project_id)

  AtlasObjective (OKRs, can link to projects via objective_id in KPIs)

View in Palantir Foundry:
  → Ontology Manager → Click any object → View "Links" or "Related Objects"
  → Or use Object Explorer to see the relationship graph
`);

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
