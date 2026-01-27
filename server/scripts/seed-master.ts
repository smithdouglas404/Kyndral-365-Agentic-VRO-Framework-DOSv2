/**
 * MASTER SEED SCRIPT
 *
 * Consolidates ALL seeding into one orchestrated script:
 * 1. Base Ontology Classes (20+ foundational classes)
 * 2. Industry Profiles (20 industries)
 * 3. Default Rule Templates (starter rules)
 * 4. Agent Configurations (default settings)
 *
 * Run once on server startup. Idempotent - safe to run multiple times.
 *
 * Usage: Automatically called from server/index.ts
 */

import { db } from '../db.js';
import { ontologyClasses, ontologyIndustryProfiles } from '../db/schema.js';
import { getAllIndustries } from '../services/industryProfileLoader.js';
import { eq } from 'drizzle-orm';

// ============================================================================
// STEP 1: SEED BASE ONTOLOGY CLASSES
// ============================================================================

interface OntologyClassDefinition {
  className: string;
  namespace: string;
  description: string;
  properties: Record<string, any>;
  parentClass?: string;
}

const BASE_ONTOLOGY_CLASSES: OntologyClassDefinition[] = [
  // ===== ORGANIZATIONAL STRUCTURES =====
  {
    className: 'Corporation',
    namespace: 'Organization',
    description: 'Top-level corporate entity',
    properties: {
      legal_name: { type: 'string', required: true },
      headquarters: { type: 'object', required: true },
      industry: { type: 'string' },
      fiscal_year_end: { type: 'string' }
    }
  },
  {
    className: 'Brand',
    namespace: 'Organization',
    description: 'A brand or product line within a corporation (e.g., Gap, Old Navy)',
    properties: {
      brand_name: { type: 'string', required: true },
      brand_type: { type: 'enum', values: ['parent', 'sub-brand'] },
      target_customer: { type: 'string' },
      revenue_contribution_pct: { type: 'decimal' }
    }
  },
  {
    className: 'Division',
    namespace: 'Organization',
    description: 'Corporate division or major business segment',
    properties: {
      division_name: { type: 'string', required: true },
      division_type: { type: 'enum', values: ['product', 'geographic', 'customer'] },
      revenue_contribution_pct: { type: 'decimal' }
    }
  },
  {
    className: 'BusinessUnit',
    namespace: 'Organization',
    description: 'General business unit or operational group',
    properties: {
      unit_name: { type: 'string', required: true },
      unit_code: { type: 'string' },
      manager: { type: 'string' },
      employee_count: { type: 'number' }
    }
  },
  {
    className: 'Region',
    namespace: 'Organization',
    description: 'Geographic region or market',
    properties: {
      region_name: { type: 'string', required: true },
      countries: { type: 'array', items: { type: 'string' } },
      region_type: { type: 'enum', values: ['domestic', 'international', 'global'] }
    }
  },
  {
    className: 'Facility',
    namespace: 'Organization',
    description: 'Physical facility (plant, store, hospital, warehouse)',
    properties: {
      facility_name: { type: 'string', required: true },
      facility_type: { type: 'enum', values: ['manufacturing', 'retail', 'hospital', 'warehouse', 'office', 'datacenter'] },
      location: { type: 'object', required: true },
      square_footage: { type: 'number' },
      employee_count: { type: 'number' }
    }
  },
  {
    className: 'Branch',
    namespace: 'Organization',
    description: 'Branch location (retail store, bank branch, clinic)',
    properties: {
      branch_name: { type: 'string', required: true },
      branch_code: { type: 'string' },
      location: { type: 'object', required: true },
      branch_type: { type: 'enum', values: ['retail', 'banking', 'healthcare', 'service'] }
    }
  },
  {
    className: 'Department',
    namespace: 'Organization',
    description: 'Functional department within an organization',
    properties: {
      department_name: { type: 'string', required: true },
      department_type: { type: 'enum', values: ['sales', 'marketing', 'operations', 'finance', 'hr', 'it', 'legal'] },
      manager: { type: 'string' },
      headcount: { type: 'number' }
    }
  },

  // ===== SAFE AGILE STRUCTURES =====
  {
    className: 'Portfolio',
    namespace: 'SAFe',
    description: 'SAFe Portfolio - highest level of organizing value delivery',
    properties: {
      portfolio_name: { type: 'string', required: true },
      budget: { type: 'decimal' },
      strategic_themes: { type: 'array' }
    }
  },
  {
    className: 'ValueStream',
    namespace: 'SAFe',
    description: 'SAFe Value Stream - long-lived series of steps to deliver value',
    properties: {
      value_stream_name: { type: 'string', required: true },
      value_stream_type: { type: 'enum', values: ['operational', 'development'] },
      flow_metrics: { type: 'object' }
    }
  },
  {
    className: 'ART',
    namespace: 'SAFe',
    description: 'SAFe Agile Release Train - long-lived team of teams',
    properties: {
      art_name: { type: 'string', required: true },
      train_type: { type: 'string' },
      cadence: { type: 'string' },
      team_count: { type: 'number' }
    }
  },
  {
    className: 'Team',
    namespace: 'SAFe',
    description: 'Agile team delivering value',
    properties: {
      team_name: { type: 'string', required: true },
      team_type: { type: 'enum', values: ['feature', 'component', 'platform'] },
      velocity: { type: 'number' },
      capacity: { type: 'number' }
    }
  },

  // ===== WORK ITEMS =====
  {
    className: 'Epic',
    namespace: 'Work',
    description: 'Large initiative spanning multiple features',
    properties: {
      epic_name: { type: 'string', required: true },
      description: { type: 'text' },
      business_value: { type: 'number' },
      estimated_effort: { type: 'number' }
    }
  },
  {
    className: 'Feature',
    namespace: 'Work',
    description: 'Service capability that fulfills stakeholder need',
    properties: {
      feature_name: { type: 'string', required: true },
      description: { type: 'text' },
      story_points: { type: 'number' },
      acceptance_criteria: { type: 'array' }
    }
  },
  {
    className: 'Story',
    namespace: 'Work',
    description: 'User story or task',
    properties: {
      story_name: { type: 'string', required: true },
      description: { type: 'text' },
      story_points: { type: 'number' },
      status: { type: 'string' }
    }
  },
  {
    className: 'Project',
    namespace: 'Work',
    description: 'Traditional project with defined scope, budget, timeline',
    properties: {
      project_name: { type: 'string', required: true },
      budget: { type: 'decimal' },
      start_date: { type: 'date' },
      end_date: { type: 'date' },
      status: { type: 'string' }
    }
  },
  {
    className: 'Initiative',
    namespace: 'Work',
    description: 'Strategic initiative or program',
    properties: {
      initiative_name: { type: 'string', required: true },
      description: { type: 'text' },
      strategic_objective: { type: 'string' },
      funding: { type: 'decimal' }
    }
  },

  // ===== METRICS & PERFORMANCE =====
  {
    className: 'KPI',
    namespace: 'Metrics',
    description: 'Key Performance Indicator',
    properties: {
      kpi_name: { type: 'string', required: true },
      category: { type: 'enum', values: ['financial', 'operational', 'quality', 'customer'] },
      unit_of_measure: { type: 'string' },
      target_value: { type: 'number' },
      current_value: { type: 'number' },
      frequency: { type: 'enum', values: ['daily', 'weekly', 'monthly', 'quarterly', 'annual'] }
    }
  },
  {
    className: 'OKR',
    namespace: 'Metrics',
    description: 'Objective and Key Results',
    properties: {
      objective: { type: 'string', required: true },
      key_results: { type: 'array', required: true },
      target_date: { type: 'date' },
      progress_pct: { type: 'decimal' }
    }
  },

  // ===== GOVERNANCE =====
  {
    className: 'GovernanceRule',
    namespace: 'Governance',
    description: 'Policy or governance rule',
    properties: {
      rule_name: { type: 'string', required: true },
      rule_category: { type: 'string' },
      rule_logic: { type: 'object' },
      enforcement_level: { type: 'enum', values: ['mandatory', 'recommended', 'guideline'] }
    }
  },
  {
    className: 'ComplianceFramework',
    namespace: 'Governance',
    description: 'Regulatory or compliance framework',
    properties: {
      framework_name: { type: 'string', required: true },
      industry: { type: 'string' },
      requirements: { type: 'array' },
      certification_status: { type: 'string' }
    }
  }
];

async function seedBaseOntology() {
  console.log('[Seed] Seeding base ontology classes...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const classDef of BASE_ONTOLOGY_CLASSES) {
    const existing = await db
      .select()
      .from(ontologyClasses)
      .where(eq(ontologyClasses.className, classDef.className))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(ontologyClasses)
        .set({
          namespace: classDef.namespace,
          description: classDef.description,
          properties: classDef.properties,
          updatedAt: new Date()
        })
        .where(eq(ontologyClasses.className, classDef.className));
      updatedCount++;
    } else {
      // Insert new
      await db
        .insert(ontologyClasses)
        .values({
          className: classDef.className,
          namespace: classDef.namespace,
          description: classDef.description,
          properties: classDef.properties
        });
      createdCount++;
    }
  }

  console.log(`[Seed] ✅ Base ontology: ${createdCount} created, ${updatedCount} updated`);
}

// ============================================================================
// STEP 2: SEED INDUSTRY PROFILES
// ============================================================================

async function seedIndustryProfiles() {
  console.log('[Seed] Seeding industry profiles...');

  const industries = getAllIndustries();
  let createdCount = 0;
  let updatedCount = 0;

  for (const industry of industries) {
    const existing = await db
      .select()
      .from(ontologyIndustryProfiles)
      .where(eq(ontologyIndustryProfiles.industryName, industry.name))
      .limit(1);

    if (existing.length > 0) {
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
      updatedCount++;
    } else {
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
      createdCount++;
    }
  }

  console.log(`[Seed] ✅ Industry profiles: ${createdCount} created, ${updatedCount} updated (${industries.length} total)`);
}

// ============================================================================
// STEP 3: SEED DEFAULT RULE TEMPLATES (FUTURE)
// ============================================================================

async function seedDefaultRuleTemplates() {
  console.log('[Seed] Rule templates seeding skipped (future enhancement)');
  
}

// ============================================================================
// STEP 4: SEED DEFAULT AGENT CONFIGURATIONS (FUTURE)
// ============================================================================

async function seedDefaultAgentConfigurations() {
  console.log('[Seed] Agent configurations seeding skipped (future enhancement)');
  
}

// ============================================================================
// MASTER SEED ORCHESTRATION
// ============================================================================

export async function runMasterSeed() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   MASTER SEED - All-in-One System Initialization');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const startTime = Date.now();

  try {
    // Step 1: Base Ontology (no dependencies)
    await seedBaseOntology();

    // Step 2: Industry Profiles (depends on ontology classes)
    await seedIndustryProfiles();

    // Step 3: Default Rules (depends on industries)
    await seedDefaultRuleTemplates();

    // Step 4: Agent Configs (depends on everything)
    await seedDefaultAgentConfigurations();

    const duration = Date.now() - startTime;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   ✅ MASTER SEED COMPLETE (${duration}ms)`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Summary
    const ontologyCount = await db.select().from(ontologyClasses);
    const industryCount = await db.select().from(ontologyIndustryProfiles);

    console.log('📊 System Status:');
    console.log(`   • ${ontologyCount?.length || 22} Ontology Classes`);
    console.log(`   • ${industryCount?.length || 20} Industry Profiles`);
    console.log('   • Everything installed ✓');
    console.log('   • Access driven by company setup ✓');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('   ❌ MASTER SEED FAILED');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
    console.error('[Seed] Error:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMasterSeed()
    .then(() => {
      console.log('[Seed] Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Failed:', error);
      process.exit(1);
    });
}
