/**
 * Seed Default App Configurations
 *
 * This script seeds default application configurations that were previously
 * hardcoded across the application. These can be overridden per-tenant.
 */

import { storage } from '../storage.js';

// Default configuration values
const defaultConfigs = [
  {
    key: 'risk.scoring',
    value: {
      impact: { high: 90, medium: 60, low: 30 },
      probability: { high: 90, medium: 60, low: 30 }
    },
    description: 'Risk scoring thresholds for impact and probability mappings',
    category: 'risk'
  },
  {
    key: 'status.colors',
    value: {
      'Active': { border: '#22c55e', bg: 'bg-emerald-100', text: 'text-emerald-800', borderClass: 'border-emerald-300' },
      'active': { border: '#22c55e', bg: 'bg-emerald-100', text: 'text-emerald-800', borderClass: 'border-emerald-300' },
      'In Progress': { border: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-800', borderClass: 'border-blue-300' },
      'Planning': { border: '#8b5cf6', bg: 'bg-violet-100', text: 'text-violet-800', borderClass: 'border-violet-300' },
      'At Risk': { border: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-800', borderClass: 'border-amber-300' },
      'Complete': { border: '#6b7280', bg: 'bg-gray-100', text: 'text-gray-800', borderClass: 'border-gray-300' },
      'Not Started': { border: '#64748b', bg: 'bg-slate-100', text: 'text-slate-700', borderClass: 'border-slate-300' },
      'On Track': { border: '#22c55e', bg: 'bg-emerald-100', text: 'text-emerald-800', borderClass: 'border-emerald-300' },
      'Critical': { border: '#ef4444', bg: 'bg-red-100', text: 'text-red-800', borderClass: 'border-red-300' },
      'green': { border: '#00A651', bg: 'bg-green-50', text: 'text-green-700' },
      'amber': { border: '#FFA500', bg: 'bg-amber-50', text: 'text-amber-700' },
      'red': { border: '#D50032', bg: 'bg-red-50', text: 'text-red-700' }
    },
    description: 'Project status color mappings for UI badges and cards',
    category: 'ui'
  },
  {
    key: 'brand.colors',
    value: {
      blue: '#0072CE',
      teal: '#00A99D',
      red: '#D50032',
      yellow: '#FFC72C',
      grey500: '#6B7280',
      grey700: '#374151'
    },
    description: 'Brand color definitions',
    category: 'ui'
  },
  {
    key: 'segment.mappings',
    value: {
      'FPL': { name: 'Florida Power & Light', portfolio: 'Utility', color: '#0072CE' },
      'NEER': { name: 'NextEra Energy Resources', portfolio: 'Renewables', color: '#00A651' },
      'Corp': { name: 'Corporate & Other', portfolio: 'Corporate', color: '#6B7280' },
      'Gulf Power': { name: 'Gulf Power', portfolio: 'Utility', color: '#00A99D' }
    },
    description: 'Segment name to portfolio/color mappings',
    category: 'business'
  },
  {
    key: 'project.metrics.defaults',
    value: {
      qualityScore: 80,
      burndownHealth: 75,
      confidence: 75,
      costMultipliers: {
        labor: 0.7,
        materials: 0.2,
        other: 0.1
      }
    },
    description: 'Default project metric values when data is unavailable',
    category: 'project'
  },
  {
    key: 'widget.refresh.intervals',
    value: {
      realtime: 5000,
      fast: 15000,
      normal: 60000,
      slow: 300000
    },
    description: 'Widget data refresh intervals in milliseconds',
    category: 'ui'
  },
  {
    key: 'dashboard.defaults',
    value: {
      finops: {
        visibleWidgets: ['budget-overview', 'cost-categories', 'evm-metrics', 'savings-opportunities'],
        defaultSize: 'medium'
      },
      governance: {
        visibleWidgets: ['governance-queue', 'risk-categories', 'compliance-status'],
        defaultSize: 'medium'
      },
      ppm: {
        visibleWidgets: ['project-portfolio', 'status-summary', 'milestones'],
        defaultSize: 'medium'
      }
    },
    description: 'Default dashboard widget configurations per dashboard type',
    category: 'dashboard'
  }
];

export async function seedAppConfigs(): Promise<void> {
  console.log('[SeedAppConfig] Starting to seed default app configurations...');

  for (const config of defaultConfigs) {
    try {
      const existing = await storage.getAppConfig(config.key);
      if (!existing) {
        await storage.setAppConfig(
          config.key,
          JSON.stringify(config.value),
          config.description,
          config.category
        );
        console.log(`[SeedAppConfig] Created: ${config.key}`);
      } else {
        console.log(`[SeedAppConfig] Skipped (exists): ${config.key}`);
      }
    } catch (error) {
      console.error(`[SeedAppConfig] Error seeding ${config.key}:`, error);
    }
  }

  console.log('[SeedAppConfig] Finished seeding app configurations');
}

// Run if executed directly
if (!(globalThis as any).__BUNDLED__ && import.meta.url === `file://${process.argv[1]}`) {
  seedAppConfigs()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
