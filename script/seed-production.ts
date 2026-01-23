#!/usr/bin/env tsx
/**
 * PRODUCTION DATABASE SEEDING
 * Run: npm run seed:production
 * Seeds database with realistic production data
 */

import { db } from '../server/db.js';
import { storage } from '../server/storage.js';
import { seedProductionData } from '../server/seedProduction.js';

async function main() {
  console.log('🌱 Starting production database seeding...\n');

  try {
    const result = await seedProductionData(storage);

    if (result.success) {
      console.log('\n✅ Database seeded successfully!');
      console.log('\n📊 Summary:');
      console.log(`   - Business Units: ${result.businessUnits.length}`);
      console.log(`   - Portfolios: ${result.portfolios.length}`);
      console.log(`   - Programs: ${result.programs.length}`);
      console.log(`   - Projects: ${result.projects.length}`);
      console.log('\n💡 You can now start the server with: npm run dev');
      console.log('   All dashboards will show REAL DATABASE DATA');
      console.log('   NO MORE HARDCODED DATA!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
