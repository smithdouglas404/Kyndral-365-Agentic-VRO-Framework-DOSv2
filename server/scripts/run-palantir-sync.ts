/**
 * Run PostgreSQL → Palantir Sync
 *
 * Usage: npx tsx server/scripts/run-palantir-sync.ts
 */

import { getPostgresToPalantirSync } from '../services/PostgresToPalantirSync.js';

async function run() {
  console.log('='.repeat(60));
  console.log('Starting PostgreSQL → Palantir Foundry sync...');
  console.log('='.repeat(60));

  const sync = getPostgresToPalantirSync();

  try {
    const result = await sync.syncAll();

    console.log('\n' + '='.repeat(60));
    console.log('Sync Results:');
    console.log('='.repeat(60));
    console.log(`Success: ${result.success}`);
    console.log(`Started: ${result.startedAt}`);
    console.log(`Completed: ${result.completedAt}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log('\nBy Object Type:');

    for (const r of result.results) {
      console.log(`  ${r.objectType}: ${r.synced}/${r.total} synced, ${r.failed} failed`);
      if (r.errors.length > 0) {
        console.log(`    Errors: ${r.errors.slice(0, 3).join(', ')}${r.errors.length > 3 ? '...' : ''}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Sync complete!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

run();
