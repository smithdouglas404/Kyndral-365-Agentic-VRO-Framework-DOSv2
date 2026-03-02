/**
 * MASTER SEED SCRIPT
 *
 * Runs all seed scripts in the correct order.
 * Idempotent - safe to run multiple times.
 */

import { seedAgents } from './seed-agents.js';
import { seedAgentAttributes } from './seed-agent-attributes.js';
import { seedWidgetDefinitions } from './seed-widget-definitions.js';

export async function seedAll() {
  console.log('='.repeat(60));
  console.log('[Seed] Starting full database seed...');
  console.log('='.repeat(60));

  const results: Record<string, any> = {};

  // 1. Seed agents first (attributes depend on them)
  console.log('\n[1/3] Seeding agents...');
  try {
    await seedAgents();
    results.agents = 'success';
  } catch (error: any) {
    console.error('[Seed] Agents failed:', error.message);
    results.agents = { error: error.message };
  }

  // 2. Seed agent attributes
  console.log('\n[2/3] Seeding agent attributes...');
  try {
    results.attributes = await seedAgentAttributes();
  } catch (error: any) {
    console.error('[Seed] Agent attributes failed:', error.message);
    results.attributes = { error: error.message };
  }

  // 3. Seed widget definitions
  console.log('\n[3/3] Seeding widget definitions...');
  try {
    results.widgets = await seedWidgetDefinitions();
  } catch (error: any) {
    console.error('[Seed] Widget definitions failed:', error.message);
    results.widgets = { error: error.message };
  }

  console.log('\n' + '='.repeat(60));
  console.log('[Seed] Full database seed complete!');
  console.log('='.repeat(60));
  console.log('\nResults:', JSON.stringify(results, null, 2));

  return results;
}

// Run if called directly
if (process.argv[1]?.includes('seed-all')) {
  seedAll()
    .then((results) => {
      console.log('\n[Seed] All seeds completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Fatal error:', err);
      process.exit(1);
    });
}
