/**
 * Run full sync from PostgreSQL to Palantir
 */

import { PostgresToPalantirSync } from '../services/PostgresToPalantirSync.js';

async function main() {
  const sync = new PostgresToPalantirSync();
  if (!sync.isAvailable()) {
    console.log('Palantir service not available');
    process.exit(1);
  }

  console.log('Running full sync to Palantir...\n');
  const result = await sync.syncAll();

  console.log('\n' + '='.repeat(60));
  console.log('SYNC RESULTS');
  console.log('='.repeat(60));
  console.log('Duration:', result.duration, 'ms');
  console.log('Total:', result.summary.totalObjects);
  console.log('Synced:', result.summary.totalSynced);
  console.log('Failed:', result.summary.totalFailed);

  console.log('\nBy object type:');
  for (const r of result.results) {
    const status = r.failed === 0 ? '✓' : '✗';
    console.log(`  ${status} ${r.objectType}: ${r.synced}/${r.total}`);
    if (r.errors.length > 0) {
      console.log('    Errors:');
      for (const e of r.errors.slice(0, 3)) {
        console.log('      - ' + e.slice(0, 100));
      }
      if (r.errors.length > 3) {
        console.log(`      ... and ${r.errors.length - 3} more`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  if (result.summary.totalFailed === 0) {
    console.log('✓ SYNC COMPLETED SUCCESSFULLY');
  } else {
    console.log('✗ SYNC COMPLETED WITH ERRORS');
  }
  console.log('='.repeat(60));
}

main().catch(console.error);

export {};
