/**
 * SEED INDUSTRY ONTOLOGY PROFILES
 *
 * Populates ontology_industry_profiles table with standard industry definitions
 * Run: tsx server/scripts/seed-industry-profiles.ts
 */

import { db } from '../db.js';
import { ontologyIndustryProfiles } from '../db/schema.js';
import { getAllIndustries } from '../services/industryProfileLoader.js';
import { eq } from 'drizzle-orm';

async function seedIndustryProfiles() {
  console.log('[Seed] Starting industry profile seed...');

  try {
    // Load all industry profiles from JSON
    const industries = getAllIndustries();

    console.log(`[Seed] Found ${industries.length} industry profiles to seed`);

    for (const industry of industries) {
      console.log(`[Seed] Processing: ${industry.name}`);

      // Check if already exists
      const existing = await db
        .select()
        .from(ontologyIndustryProfiles)
        .where(eq(ontologyIndustryProfiles.industryName, industry.name))
        .limit(1);

      if (existing.length > 0) {
        console.log(`[Seed] ✓ ${industry.name} already exists, updating...`);

        // Update existing
        await db
          .update(ontologyIndustryProfiles)
          .set({
            industryCode: industry.codes.gics[0] || industry.codes.naics[0],
            primaryClasses: industry.terminology.orgUnits,
            classExtensions: {
              projectTypes: industry.terminology.projectTypes,
              safeMapping: industry.terminology.safeMapping,
              complianceFrameworks: industry.complianceFrameworks,
              okrCategories: industry.commonOKRCategories,
            },
            standardMetrics: industry.standardMetrics.map(metric => ({
              name: metric.name,
              category: metric.category,
              unit: metric.unit,
              description: metric.description,
              typical_target: metric.typical_target,
              frequency: metric.frequency,
            })),
          })
          .where(eq(ontologyIndustryProfiles.industryName, industry.name));

      } else {
        console.log(`[Seed] ✓ Creating new: ${industry.name}`);

        // Insert new
        await db
          .insert(ontologyIndustryProfiles)
          .values({
            industryName: industry.name,
            industryCode: industry.codes.gics[0] || industry.codes.naics[0],
            primaryClasses: industry.terminology.orgUnits,
            classExtensions: {
              projectTypes: industry.terminology.projectTypes,
              safeMapping: industry.terminology.safeMapping,
              complianceFrameworks: industry.complianceFrameworks,
              okrCategories: industry.commonOKRCategories,
            },
            standardMetrics: industry.standardMetrics.map(metric => ({
              name: metric.name,
              category: metric.category,
              unit: metric.unit,
              description: metric.description,
              typical_target: metric.typical_target,
              frequency: metric.frequency,
            })),
          });
      }
    }

    console.log('[Seed] ✅ Industry profile seed complete!');

    // Show summary
    const allProfiles = await db.select().from(ontologyIndustryProfiles);
    console.log(`[Seed] Total profiles in database: ${allProfiles.length}`);
    console.log('[Seed] Industries:');
    allProfiles.forEach(profile => {
      const metricCount = Array.isArray(profile.standardMetrics)
        ? profile.standardMetrics.length
        : 0;
      console.log(`  - ${profile.industryName} (${profile.industryCode}) - ${metricCount} metrics`);
    });

  } catch (error) {
    console.error('[Seed] Error seeding industry profiles:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedIndustryProfiles()
    .then(() => {
      console.log('[Seed] Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Failed:', error);
      process.exit(1);
    });
}

export { seedIndustryProfiles };
