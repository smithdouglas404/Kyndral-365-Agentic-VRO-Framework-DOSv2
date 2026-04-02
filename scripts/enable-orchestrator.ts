/**
 * Enable the Continuous Orchestrator - Direct DB Update
 */

import { db } from '../server/db.js';
import { appConfig } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('=== Enabling Continuous Orchestrator ===\n');

  try {
    // Check current settings
    const rows = await db.select().from(appConfig);
    console.log('Current app_config entries:', rows.length);
    rows.forEach(r => console.log(`  ${r.configKey} = ${r.configValue}`));

    // Delete and re-insert orchestrator_enabled setting
    await db.delete(appConfig).where(eq(appConfig.configKey, 'orchestrator_enabled'));
    await db.insert(appConfig).values({
      configKey: 'orchestrator_enabled',
      configValue: 'true',
      description: 'Enable/disable continuous agent orchestration',
      category: 'orchestrator',
    });
    console.log('\n✅ orchestrator_enabled = true');

    // Set interval
    await db.delete(appConfig).where(eq(appConfig.configKey, 'orchestrator_interval'));
    await db.insert(appConfig).values({
      configKey: 'orchestrator_interval',
      configValue: '300000',
      description: 'Continuous orchestration interval in milliseconds',
      category: 'orchestrator',
    });
    console.log('✅ orchestrator_interval = 300000 (5 min)');

    // Verify
    const verify = await db.select().from(appConfig).where(eq(appConfig.configKey, 'orchestrator_enabled'));
    console.log('\nVerified:', verify[0]?.configValue);

    console.log('\n=== DONE - Restart server to apply ===');
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

main();
