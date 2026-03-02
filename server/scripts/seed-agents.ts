/**
 * SEED AGENTS
 *
 * Seeds the agents table with the 11 core agents
 * Idempotent - safe to run multiple times
 */

import { db } from '../db.js';
import { agents } from '../../shared/schema.js';
import { sql } from 'drizzle-orm';

interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: 'domain' | 'orchestration' | 'utility';
  capabilities: string[];
  defaultPriority: number;
  palantirObjectTypes: string[];
  icon: string;
  color: string;
}

const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'finops',
    name: 'FinOps Agent',
    description: 'Financial operations and budget management. Monitors CPI, budget variance, burn rates, and cost optimization.',
    category: 'domain',
    capabilities: [
      'Budget variance analysis',
      'EVM calculations (CPI, SPI)',
      'Burn rate forecasting',
      'Cost optimization recommendations',
      'Financial risk identification',
    ],
    defaultPriority: 8,
    palantirObjectTypes: ['AtlasBudget', 'AtlasFinancialRecord', 'AtlasKpi'],
    icon: 'DollarSign',
    color: '#10B981',
  },
  {
    id: 'tmo',
    name: 'TMO Agent',
    description: 'Transformation Management Office. Monitors schedule performance, milestones, and delivery timelines.',
    category: 'domain',
    capabilities: [
      'Schedule analysis',
      'Timeline optimization',
      'Milestone tracking',
      'Critical path analysis',
      'Dependency management',
    ],
    defaultPriority: 8,
    palantirObjectTypes: ['AtlasProject', 'AtlasDependency', 'AtlasTeam'],
    icon: 'Clock',
    color: '#3B82F6',
  },
  {
    id: 'risk',
    name: 'Risk Agent',
    description: 'Risk assessment and mitigation. Identifies, scores, and tracks risks across the portfolio.',
    category: 'domain',
    capabilities: [
      'Risk identification',
      'Risk scoring and assessment',
      'Mitigation strategy recommendations',
      'Risk monitoring and alerts',
      'Cross-project risk correlation',
    ],
    defaultPriority: 9,
    palantirObjectTypes: ['AtlasRisk', 'AtlasInsight', 'AtlasProject'],
    icon: 'Shield',
    color: '#EF4444',
  },
  {
    id: 'pmo',
    name: 'PMO Agent',
    description: 'Project Management Office. Monitors project health, governance, and portfolio performance.',
    category: 'domain',
    capabilities: [
      'Project health analysis',
      'Milestone tracking and prediction',
      'Resource optimization',
      'Governance enforcement',
      'Status report generation',
    ],
    defaultPriority: 7,
    palantirObjectTypes: ['AtlasProject', 'AtlasGovernanceCheckpoint', 'AtlasTransformation'],
    icon: 'Briefcase',
    color: '#8B5CF6',
  },
  {
    id: 'governance',
    name: 'Governance Agent',
    description: 'Compliance and governance monitoring. Enforces policies and tracks regulatory requirements.',
    category: 'domain',
    capabilities: [
      'Compliance monitoring',
      'Policy enforcement',
      'Audit preparation',
      'Regulatory tracking',
      'Approval workflow management',
    ],
    defaultPriority: 9,
    palantirObjectTypes: ['AtlasGovernanceCheckpoint', 'AtlasInsight', 'AtlasProject'],
    icon: 'Scale',
    color: '#F59E0B',
  },
  {
    id: 'vro',
    name: 'VRO Agent',
    description: 'Value Realization Office. Tracks benefits, ROI, and value delivery across initiatives.',
    category: 'domain',
    capabilities: [
      'Value realization tracking',
      'Benefits measurement',
      'ROI analysis',
      'Value gap identification',
      'Business case validation',
    ],
    defaultPriority: 7,
    palantirObjectTypes: ['AtlasKpi', 'AtlasObjective', 'AtlasKeyResult'],
    icon: 'TrendingUp',
    color: '#06B6D4',
  },
  {
    id: 'ocm',
    name: 'OCM Agent',
    description: 'Organizational Change Management. Tracks adoption, stakeholder engagement, and change readiness.',
    category: 'domain',
    capabilities: [
      'Change impact assessment',
      'Stakeholder mapping and analysis',
      'Adoption metrics tracking',
      'Intervention recommendations',
      'Resistance forecasting',
    ],
    defaultPriority: 6,
    palantirObjectTypes: ['AtlasReadinessMetric', 'AtlasTeam', 'AtlasPerson'],
    icon: 'Users',
    color: '#EC4899',
  },
  {
    id: 'planning',
    name: 'Planning Agent',
    description: 'Strategic planning and roadmap management. Handles capacity planning and resource allocation.',
    category: 'domain',
    capabilities: [
      'Roadmap management',
      'Capacity planning',
      'Resource allocation',
      'Sprint planning support',
      'Backlog prioritization',
    ],
    defaultPriority: 6,
    palantirObjectTypes: ['AtlasProject', 'AtlasTeam', 'AtlasDependency'],
    icon: 'Map',
    color: '#14B8A6',
  },
  {
    id: 'okr',
    name: 'OKR Agent',
    description: 'Objectives and Key Results tracking. Monitors goal progress and alignment.',
    category: 'domain',
    capabilities: [
      'OKR progress tracking',
      'Goal alignment analysis',
      'Key result measurement',
      'Cascade management',
      'Performance insights',
    ],
    defaultPriority: 5,
    palantirObjectTypes: ['AtlasObjective', 'AtlasKeyResult', 'AtlasKpi'],
    icon: 'Target',
    color: '#F97316',
  },
  {
    id: 'integrated',
    name: 'Integrated Agent',
    description: 'Cross-functional coordination and synthesis. Aggregates insights from all domain agents.',
    category: 'orchestration',
    capabilities: [
      'Cross-agent synthesis',
      'Portfolio-level insights',
      'Executive summaries',
      'Conflict resolution',
      'Unified recommendations',
    ],
    defaultPriority: 10,
    palantirObjectTypes: ['AtlasProject', 'AtlasInsight', 'AtlasKpi'],
    icon: 'Layers',
    color: '#6366F1',
  },
  {
    id: 'notification',
    name: 'Notification Agent',
    description: 'Central gateway for alerts, approvals, and signal broadcasting. Handles HITL workflows.',
    category: 'utility',
    capabilities: [
      'Alert routing and delivery',
      'HITL approval workflows',
      'Signal broadcasting',
      'Notification aggregation',
      'Escalation management',
    ],
    defaultPriority: 10,
    palantirObjectTypes: ['AtlasAgent', 'AtlasInsight', 'AtlasProject'],
    icon: 'Bell',
    color: '#A855F7',
  },
];

export async function seedAgents() {
  console.log('[Seed] Starting agents seed...');

  let created = 0;
  let existed = 0;

  for (const agent of AGENT_DEFINITIONS) {
    const existing = await db.execute(sql`
      SELECT id FROM agents WHERE id = ${agent.id} LIMIT 1
    `);

    if (existing.rows.length > 0) {
      existed++;
      console.log(`[Seed] Agent exists: ${agent.name}`);
    } else {
      await db.execute(sql`
        INSERT INTO agents (id, name, description, category, enabled, capabilities, default_priority, palantir_object_types, icon, color)
        VALUES (
          ${agent.id},
          ${agent.name},
          ${agent.description},
          ${agent.category},
          true,
          ${JSON.stringify(agent.capabilities)},
          ${agent.defaultPriority},
          ${JSON.stringify(agent.palantirObjectTypes)},
          ${agent.icon},
          ${agent.color}
        )
      `);
      created++;
      console.log(`[Seed] Created agent: ${agent.name}`);
    }
  }

  console.log(`[Seed] Agents: ${created} created, ${existed} already existed`);
  console.log('[Seed] Agents seed complete!');
}

// Run if called directly
if (process.argv[1]?.includes('seed-agents')) {
  seedAgents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}
