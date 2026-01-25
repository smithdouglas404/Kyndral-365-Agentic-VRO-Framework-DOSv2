/**
 * SEED COLLABORATION RULES
 *
 * Populates agent_collaboration_rules table with default rules
 * from the attribute definition files.
 */

import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';
import { FINOPS_DEFAULT_RULES } from '../server/agents/attributes/FinOpsAgentAttributes.js';
import { RISK_DEFAULT_RULES } from '../server/agents/attributes/RiskAgentAttributes.js';
import { TMO_DEFAULT_RULES } from '../server/agents/attributes/TMOAgentAttributes.js';
import { VRO_DEFAULT_RULES } from '../server/agents/attributes/VROAgentAttributes.js';
import { PMO_DEFAULT_RULES } from '../server/agents/attributes/PMOAgentAttributes.js';
import { OCM_DEFAULT_RULES } from '../server/agents/attributes/OCMAgentAttributes.js';
import type { RuleDefinition } from '../server/agents/attributes/FinOpsAgentAttributes.js';

const RULES_BY_AGENT: Array<{ agent: string; rules: RuleDefinition[] }> = [
  { agent: 'finops', rules: FINOPS_DEFAULT_RULES },
  { agent: 'risk', rules: RISK_DEFAULT_RULES },
  { agent: 'tmo', rules: TMO_DEFAULT_RULES },
  { agent: 'vro', rules: VRO_DEFAULT_RULES },
  { agent: 'pmo', rules: PMO_DEFAULT_RULES },
  { agent: 'ocm', rules: OCM_DEFAULT_RULES },
];

async function seedRules() {
  console.log('[SeedRules] Starting...');

  // Clear existing rules
  await db.execute(sql`DELETE FROM agent_collaboration_rules`);
  console.log('[SeedRules] Cleared existing rules');

  let count = 0;

  for (const { agent, rules } of RULES_BY_AGENT) {
    for (const rule of rules) {
      try {
        await db.execute(sql`
          INSERT INTO agent_collaboration_rules (
            id,
            name,
            description,
            enabled,
            priority,
            source_agent,
            conditions,
            actions,
            created_by
          ) VALUES (
            ${rule.id},
            ${rule.name},
            ${rule.description},
            ${rule.enabled},
            5,
            ${agent},
            ${JSON.stringify(rule.conditions)},
            ${JSON.stringify(rule.actions)},
            'system'
          )
        `);

        count++;
        console.log(`[SeedRules] Added: ${rule.name} (${agent})`);
      } catch (error: any) {
        console.error(`[SeedRules] Error adding rule ${rule.id}:`, error.message);
      }
    }
  }

  console.log(`[SeedRules] Complete! Added ${count} rules`);
}

seedRules()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[SeedRules] Fatal error:', error);
    process.exit(1);
  });
