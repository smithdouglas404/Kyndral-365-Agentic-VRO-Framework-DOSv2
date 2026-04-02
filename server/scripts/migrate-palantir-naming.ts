/**
 * PALANTIR NAMING MIGRATION SCRIPT
 *
 * Migrates existing Atlas* objects to simple-named objects in Palantir Foundry.
 *
 * Migration Mapping:
 * - AtlasProject → Project
 * - AtlasRisk → Risk
 * - AtlasKpi → KPI
 * - AtlasObjective → OKR
 * - AtlasTransformation → Division
 * - AtlasInsight → Intervention/Feature (context-dependent)
 * - AtlasAgent → Agent
 *
 * Usage:
 *   npx tsx server/scripts/migrate-palantir-naming.ts
 *
 * Or via API:
 *   POST /api/palantir/migrate
 */

import 'dotenv/config';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import {
  PALANTIR_OBJECT_TYPES,
  PALANTIR_ACTIONS,
  LEGACY_TO_NEW_OBJECT_TYPES,
} from '../constants/palantirOntology.js';

export interface MigrationResult {
  success: boolean;
  migrated: number;
  skipped: number;
  errors: number;
  details: Record<string, { migrated: number; skipped: number; errors: number }>;
}

/**
 * Migrate a single object type from Atlas* to simple naming
 */
async function migrateObjectType(
  palantir: any,
  legacyType: string,
  newType: string,
  actionName: string,
  idField: string,
  mapProperties: (obj: any) => Record<string, any>
): Promise<{ migrated: number; skipped: number; errors: number }> {
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`\n--- Migrating ${legacyType} → ${newType} ---`);

  try {
    // List all objects of the legacy type
    const result = await palantir.listObjects(legacyType, { pageSize: 500 });
    const objects = result.data || [];

    console.log(`  Found ${objects.length} ${legacyType} objects`);

    for (const obj of objects) {
      try {
        // Map properties to new format
        const newProps = mapProperties(obj);
        const primaryKey = obj[idField] || obj.__primaryKey?.[idField] || obj.id;

        if (!primaryKey) {
          console.log(`  ○ Skipping object without ID`);
          skipped++;
          continue;
        }

        // Create new object with simple-named type
        await palantir.applyAction(actionName, {
          primaryKey,
          ...newProps,
        });

        migrated++;
      } catch (e: any) {
        if (
          e.message?.includes('ObjectAlreadyExists') ||
          e.message?.includes('already exists')
        ) {
          skipped++;
        } else {
          console.log(`  ✗ Error: ${e.message?.slice(0, 60)}`);
          errors++;
        }
      }
    }

    console.log(`  ✓ ${legacyType}: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
  } catch (e: any) {
    console.log(`  ✗ Failed to list ${legacyType}: ${e.message?.slice(0, 60)}`);
    errors++;
  }

  return { migrated, skipped, errors };
}

/**
 * Main migration function
 */
export async function runPalantirMigration(): Promise<MigrationResult> {
  const palantir = getPalantirService();

  if (!palantir) {
    console.error('[Migration] ERROR: Palantir service not configured');
    return {
      success: false,
      migrated: 0,
      skipped: 0,
      errors: 1,
      details: {},
    };
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PALANTIR NAMING MIGRATION');
  console.log('   Atlas* → Simple Names');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const result: MigrationResult = {
    success: true,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: {},
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Migrate AtlasProject → Project
  // ═══════════════════════════════════════════════════════════════════════════
  const projectResult = await migrateObjectType(
    palantir,
    'AtlasProject',
    PALANTIR_OBJECT_TYPES.PROJECT,
    PALANTIR_ACTIONS.UPSERT_PROJECT,
    'project_id',
    (obj) => ({
      id: obj.project_id || obj.id,
      name: obj.name,
      description: obj.description,
      status: obj.status,
      divisionId: obj.division_id || obj.transformation_id,
      priority: obj.priority,
      budgetTotal: obj.budget_total,
      budgetSpent: obj.budget_spent,
      progress: obj.progress,
      source: obj.source || 'migration',
      syncedAt: new Date().toISOString(),
    })
  );
  result.details['AtlasProject→Project'] = projectResult;
  result.migrated += projectResult.migrated;
  result.skipped += projectResult.skipped;
  result.errors += projectResult.errors;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Migrate AtlasTransformation → Division
  // ═══════════════════════════════════════════════════════════════════════════
  const divisionResult = await migrateObjectType(
    palantir,
    'AtlasTransformation',
    PALANTIR_OBJECT_TYPES.DIVISION,
    PALANTIR_ACTIONS.UPSERT_DIVISION,
    'transformation_id',
    (obj) => ({
      id: obj.transformation_id || obj.id,
      name: obj.name,
      ceo: obj.executive_sponsor,
      description: obj.vision || obj.description,
      source: obj.source || 'migration',
      syncedAt: new Date().toISOString(),
    })
  );
  result.details['AtlasTransformation→Division'] = divisionResult;
  result.migrated += divisionResult.migrated;
  result.skipped += divisionResult.skipped;
  result.errors += divisionResult.errors;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Migrate AtlasRisk → Risk
  // ═══════════════════════════════════════════════════════════════════════════
  const riskResult = await migrateObjectType(
    palantir,
    'AtlasRisk',
    PALANTIR_OBJECT_TYPES.RISK,
    PALANTIR_ACTIONS.UPSERT_RISK,
    'risk_id',
    (obj) => ({
      id: obj.risk_id || obj.id,
      title: obj.description || obj.title || 'Risk',
      description: obj.description,
      severity: obj.impact,
      probability: obj.probability,
      projectId: obj.project_id,
      mitigationPlan: obj.mitigation_plan,
      source: obj.source || 'migration',
      syncedAt: new Date().toISOString(),
    })
  );
  result.details['AtlasRisk→Risk'] = riskResult;
  result.migrated += riskResult.migrated;
  result.skipped += riskResult.skipped;
  result.errors += riskResult.errors;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Migrate AtlasKpi → KPI
  // ═══════════════════════════════════════════════════════════════════════════
  const kpiResult = await migrateObjectType(
    palantir,
    'AtlasKpi',
    PALANTIR_OBJECT_TYPES.KPI,
    PALANTIR_ACTIONS.UPSERT_KPI,
    'kpi_id',
    (obj) => ({
      id: obj.kpi_id || obj.id,
      name: obj.name,
      divisionId: obj.project_id || obj.division_id,
      value2024: obj.current_value,
      target2025: obj.target_value,
      unit: obj.unit,
      trend: obj.status === 'On Track' ? 'improving' : 'stable',
      status: obj.status,
      source: obj.source || 'migration',
      syncedAt: new Date().toISOString(),
    })
  );
  result.details['AtlasKpi→KPI'] = kpiResult;
  result.migrated += kpiResult.migrated;
  result.skipped += kpiResult.skipped;
  result.errors += kpiResult.errors;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Migrate AtlasObjective → OKR
  // ═══════════════════════════════════════════════════════════════════════════
  const okrResult = await migrateObjectType(
    palantir,
    'AtlasObjective',
    PALANTIR_OBJECT_TYPES.OKR,
    PALANTIR_ACTIONS.UPSERT_OKR,
    'objective_id',
    (obj) => ({
      id: obj.objective_id || obj.id,
      objective: obj.name || obj.objective,
      divisionId: obj.division_id,
      dueDate: obj.target_date || obj.due_date,
      progress: obj.progress,
      source: obj.source || 'migration',
      syncedAt: new Date().toISOString(),
    })
  );
  result.details['AtlasObjective→OKR'] = okrResult;
  result.migrated += okrResult.migrated;
  result.skipped += okrResult.skipped;
  result.errors += okrResult.errors;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Migrate AtlasInsight → Intervention (for approval/HITL items)
  // Note: AtlasInsight is overloaded - some are features, some are interventions
  // We'll migrate all as Interventions for now
  // ═══════════════════════════════════════════════════════════════════════════
  const insightResult = await migrateObjectType(
    palantir,
    'AtlasInsight',
    PALANTIR_OBJECT_TYPES.INTERVENTION,
    PALANTIR_ACTIONS.CREATE_INTERVENTION,
    'insight_id',
    (obj) => ({
      interventionId: obj.insight_id || obj.id,
      title: obj.title,
      description: obj.description,
      interventionType: obj.insight_type || 'general',
      severity: obj.severity || 'medium',
      agentSource: obj.agent_source || obj.created_by || 'migration',
      projectId: obj.related_project_id || obj.project_id,
      status: obj.status === 'Active' ? 'pending' : obj.status?.toLowerCase() || 'pending',
      source: obj.source || 'migration',
    })
  );
  result.details['AtlasInsight→Intervention'] = insightResult;
  result.migrated += insightResult.migrated;
  result.skipped += insightResult.skipped;
  result.errors += insightResult.errors;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: Migrate AtlasAgent → Agent
  // ═══════════════════════════════════════════════════════════════════════════
  const agentResult = await migrateObjectType(
    palantir,
    'AtlasAgent',
    PALANTIR_OBJECT_TYPES.AGENT,
    PALANTIR_ACTIONS.UPSERT_AGENT,
    'agent_id',
    (obj) => ({
      id: obj.agent_id || obj.id,
      name: obj.name,
      description: obj.description,
      category: obj.category,
      enabled: obj.enabled ?? true,
      source: obj.source || 'migration',
      syncedAt: new Date().toISOString(),
    })
  );
  result.details['AtlasAgent→Agent'] = agentResult;
  result.migrated += agentResult.migrated;
  result.skipped += agentResult.skipped;
  result.errors += agentResult.errors;

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   MIGRATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Total Migrated: ${result.migrated}`);
  console.log(`Total Skipped:  ${result.skipped} (already exist)`);
  console.log(`Total Errors:   ${result.errors}`);
  console.log('');
  console.log('Details:');
  for (const [key, value] of Object.entries(result.details)) {
    console.log(`  ${key}: ${value.migrated} migrated, ${value.skipped} skipped`);
  }
  console.log('');
  console.log('Next Steps:');
  console.log('  1. Verify data in Palantir Foundry UI');
  console.log('  2. Update code to use simple names (if not done)');
  console.log('  3. Run POST /api/palantir/sync/full to sync new data');
  console.log('');

  result.success = result.errors === 0;
  return result;
}

// Run if called directly as a script
if (!(globalThis as any).__BUNDLED__ && import.meta.url === `file://${process.argv[1]}`) {
  runPalantirMigration()
    .then((result) => {
      if (result.success) {
        console.log('[Migration] Done!');
        process.exit(0);
      } else {
        console.log('[Migration] Completed with errors');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('[Migration] Failed:', error);
      process.exit(1);
    });
}

export {};
