/**
 * Run PostgreSQL → External Systems Sync
 *
 * Syncs data to Jira, OpenProject, and Monday.com
 *
 * Usage: npx tsx server/scripts/run-external-sync.ts
 */

import { getPostgresToExternalSync } from '../services/PostgresToExternalSync.js';

async function run() {
  console.log('='.repeat(60));
  console.log('Starting PostgreSQL → External Systems sync...');
  console.log('='.repeat(60));

  const sync = getPostgresToExternalSync();
  const availableSystems = sync.getAvailableSystems();

  console.log(`\nAvailable systems: ${availableSystems.length > 0 ? availableSystems.join(', ') : 'None configured'}`);

  if (availableSystems.length === 0) {
    console.log('\nNo external systems configured. Please set the following environment variables:');
    console.log('  - Jira: JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN');
    console.log('  - OpenProject: OPENPROJECT_URL, OPENPROJECT_API_KEY');
    console.log('  - Monday.com: MONDAY_API_TOKEN, MONDAY_BOARD_ID');
    process.exit(0);
  }

  try {
    const result = await sync.syncAllToAllSystems();

    console.log('\n' + '='.repeat(60));
    console.log('Sync Results:');
    console.log('='.repeat(60));
    console.log(`Success: ${result.success}`);
    console.log(`Started: ${result.startedAt}`);
    console.log(`Completed: ${result.completedAt}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log('\nBy System:');

    for (const r of result.results) {
      console.log(`\n  ${r.system.toUpperCase()}:`);
      console.log(`    Total: ${r.total}`);
      console.log(`    Created: ${r.created}`);
      console.log(`    Updated: ${r.updated}`);
      console.log(`    Failed: ${r.failed}`);
      console.log(`    Duration: ${r.duration}ms`);
      if (r.errors.length > 0) {
        console.log(`    Errors:`);
        r.errors.slice(0, 5).forEach(e => console.log(`      - ${e}`));
        if (r.errors.length > 5) {
          console.log(`      ... and ${r.errors.length - 5} more`);
        }
      }
      if (Object.keys(r.externalIds).length > 0) {
        console.log(`    External IDs mapped: ${Object.keys(r.externalIds).length}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('External sync complete!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

run();

export {};
