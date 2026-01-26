/**
 * Seed PMO Flow Metrics
 * Run with: npx tsx server/scripts/seed-pmo-metrics.ts
 */

import { db } from '../db.js';
import { vroMetrics } from '../../shared/schema.js';

const PMO_METRICS = [
  {
    metricKey: 'cycle-time',
    label: 'Cycle Time',
    value: '19',
    unit: 'days',
    color: 'text-[#0072CE]',
    source: 'PMO Flow Metrics',
    category: 'pmo',
    sortOrder: 1,
    isActive: true,
  },
  {
    metricKey: 'flow-efficiency',
    label: 'Flow Efficiency',
    value: '69',
    unit: '%',
    color: 'text-[#D50032]',
    source: 'Lean/Agile Metrics',
    category: 'pmo',
    sortOrder: 2,
    isActive: true,
  },
  {
    metricKey: 'throughput',
    label: 'Throughput',
    value: '11',
    unit: 'items/week',
    color: 'text-[#00A651]',
    source: 'Sprint Analytics',
    category: 'pmo',
    sortOrder: 3,
    isActive: true,
  },
  {
    metricKey: 'wip-items',
    label: 'WIP Items',
    value: '9',
    unit: '/ 12',
    color: 'text-[#0072CE]',
    source: 'Kanban Board',
    category: 'pmo',
    sortOrder: 4,
    isActive: true,
  },
];

async function seedPMOMetrics() {
  try {
    console.log('🔧 Seeding PMO metrics...');

    for (const metric of PMO_METRICS) {
      await db
        .insert(vroMetrics)
        .values(metric as any)
        .onConflictDoUpdate({
          target: [vroMetrics.metricKey],
          set: {
            label: metric.label,
            value: metric.value,
            unit: metric.unit,
            color: metric.color,
            source: metric.source,
            category: metric.category,
            sortOrder: metric.sortOrder,
            isActive: metric.isActive,
            updatedAt: new Date(),
          },
        });
    }

    console.log(`✅ Seeded ${PMO_METRICS.length} PMO metrics`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed PMO metrics:', error);
    process.exit(1);
  }
}

seedPMOMetrics();
