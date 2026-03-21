/**
 * CLEANUP PALANTIR LEGACY OBJECTS
 *
 * Deletes all Atlas* prefixed objects from Palantir to have a clean slate.
 * After running this, use seed-palantir-defaults.ts to create fresh data.
 *
 * Usage:
 *   npx tsx server/scripts/cleanup-palantir-legacy.ts
 */

import 'dotenv/config';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';

// Legacy object types to delete
const LEGACY_OBJECT_TYPES = [
  'AtlasProject',
  'AtlasTransformation',
  'AtlasRisk',
  'AtlasKpi',
  'AtlasObjective',
  'AtlasInsight',
  'AtlasAgent',
  'AtlasDependency',
  'AtlasTeam',
  'AtlasBudget',
  'AtlasKeyResult',
];

interface CleanupResult {
  objectType: string;
  found: number;
  deleted: number;
  errors: number;
}

async function deleteObjectsOfType(
  palantir: any,
  objectType: string
): Promise<CleanupResult> {
  const result: CleanupResult = {
    objectType,
    found: 0,
    deleted: 0,
    errors: 0,
  };

  try {
    // List all objects of this type
    const listResult = await palantir.listObjects(objectType, { pageSize: 500 });
    const objects = listResult.data || [];
    result.found = objects.length;

    if (objects.length === 0) {
      console.log(`  ${objectType}: No objects found`);
      return result;
    }

    console.log(`  ${objectType}: Found ${objects.length} objects, deleting...`);

    // Delete each object
    for (const obj of objects) {
      try {
        // Get the primary key - __primaryKey is the direct value
        const primaryKey = typeof obj.__primaryKey === 'string'
          ? obj.__primaryKey
          : obj.__primaryKey?.project_id ||
            obj.__primaryKey?.transformation_id ||
            obj.__primaryKey?.risk_id ||
            obj.__primaryKey?.kpi_id ||
            obj.__primaryKey?.objective_id ||
            obj.__primaryKey?.insight_id ||
            obj.__primaryKey?.agent_id ||
            obj.projectId ||
            obj.project_id ||
            obj.transformation_id ||
            obj.risk_id ||
            obj.kpi_id ||
            obj.objective_id ||
            obj.insight_id ||
            obj.agent_id ||
            obj.id;

        if (primaryKey && primaryKey !== 'undefined') {
          await palantir.deleteObject(objectType, primaryKey);
          result.deleted++;
        } else {
          console.log(`  ○ Skipping object without valid ID: ${JSON.stringify(obj.__primaryKey)}`);
          result.errors++;
        }
      } catch (e: any) {
        // Check for actual errors vs expected responses
        if (e.message?.includes('not found') || e.message?.includes('does not exist')) {
          result.deleted++; // Object already gone
        } else {
          console.log(`  ✗ Delete error: ${e.message?.slice(0, 60)}`);
          result.errors++;
        }
      }
    }

    console.log(`  ✓ ${objectType}: Deleted ${result.deleted}/${result.found}`);
  } catch (e: any) {
    // Object type might not exist
    if (e.message?.includes('ObjectTypeNotFound') || e.message?.includes('not found')) {
      console.log(`  ${objectType}: Object type doesn't exist (skipped)`);
    } else {
      console.log(`  ✗ ${objectType}: Error - ${e.message?.slice(0, 50)}`);
      result.errors++;
    }
  }

  return result;
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PALANTIR LEGACY CLEANUP');
  console.log('   Removing all Atlas* objects');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const palantir = getPalantirService();
  if (!palantir) {
    console.error('ERROR: Palantir service not initialized');
    process.exit(1);
  }

  const results: CleanupResult[] = [];

  for (const objectType of LEGACY_OBJECT_TYPES) {
    const result = await deleteObjectsOfType(palantir, objectType);
    results.push(result);
  }

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const totalFound = results.reduce((sum, r) => sum + r.found, 0);
  const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  console.log(`Total Objects Found:   ${totalFound}`);
  console.log(`Total Objects Deleted: ${totalDeleted}`);
  console.log(`Total Errors:          ${totalErrors}`);
  console.log('');
  console.log('Next Steps:');
  console.log('  1. Run: npx tsx server/scripts/seed-palantir-defaults.ts');
  console.log('  2. Or use: POST /api/palantir/sync/full');
  console.log('');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('[Cleanup] Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Cleanup] Failed:', error);
      process.exit(1);
    });
}

export { main as runCleanup };

export {};
