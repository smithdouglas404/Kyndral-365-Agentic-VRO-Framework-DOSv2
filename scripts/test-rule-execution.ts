/**
 * TEST RULE EXECUTION
 *
 * Tests the rules engine by simulating agent evaluations
 * and verifying that executions are logged to rule_execution_history table.
 */

import { getAgentCollaborationRulesEngine } from '../server/lib/AgentCollaborationRulesEngine.js';
import type { RuleFacts } from '../server/lib/AgentCollaborationRulesEngine.js';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

const TEST_SCENARIOS: Array<{ name: string; facts: any }> = [
  {
    name: 'FinOps - High Budget Variance',
    facts: {
      agentId: 'finops',
      userId: 'test-user-1',
      projectId: 'test-project-001',
      variance: 25, // Triggers if > 20%
      burnRate: 160, // Triggers if > 150%
      cpi: 0.75,
      severity: 'high',
    },
  },
  {
    name: 'Risk - Critical Risk Score',
    facts: {
      agentId: 'risk',
      userId: 'test-user-1',
      projectId: 'test-project-002',
      riskScore: 92, // Triggers if > 90
      riskLevel: 'critical',
      openIssuesCount: 8,
      severity: 'critical',
    },
  },
  {
    name: 'TMO - Schedule Delay',
    facts: {
      agentId: 'tmo',
      userId: 'test-user-1',
      projectId: 'test-project-003',
      delayDays: 18, // Triggers if > 15
      spi: 0.75, // Triggers if < 0.8
      severity: 'high',
    },
  },
  {
    name: 'VRO - Low Value Score',
    facts: {
      agentId: 'vro',
      userId: 'test-user-1',
      projectId: 'test-project-004',
      valueScore: 35, // Triggers if < 40
      roi: -5, // Triggers if < 0
      severity: 'medium',
    },
  },
  {
    name: 'PMO - Low Health Score',
    facts: {
      agentId: 'pmo',
      userId: 'test-user-1',
      projectId: 'test-project-005',
      healthScore: 45, // Triggers if < 60
      severity: 'high',
    },
  },
  {
    name: 'OCM - Low Adoption',
    facts: {
      agentId: 'ocm',
      userId: 'test-user-1',
      projectId: 'test-project-006',
      adoptionRate: 25, // Triggers if < 40
      severity: 'medium',
    },
  },
];

async function testRuleExecution() {
  console.log('[TestRules] Starting rule execution tests...\n');

  const rulesEngine = getAgentCollaborationRulesEngine();

  // Initialize rules engine
  await rulesEngine.initialize();
  console.log('[TestRules] Rules engine initialized\n');

  // Get count before
  const beforeResult = await db.execute(sql`SELECT COUNT(*) as count FROM rule_execution_history`);
  const countBefore = beforeResult.rows[0]?.count || 0;
  console.log(`[TestRules] Execution history count before: ${countBefore}\n`);

  // Run test scenarios
  for (const scenario of TEST_SCENARIOS) {
    console.log(`[TestRules] Testing: ${scenario.name}`);
    console.log(`[TestRules] Facts:`, JSON.stringify(scenario.facts, null, 2));

    try {
      const results = await rulesEngine.evaluateRules(scenario.facts);

      if (results.length > 0) {
        console.log(`[TestRules] ✅ ${results.length} rule(s) triggered:`);
        results.forEach((result) => {
          console.log(`  - ${result.ruleName}`);
          console.log(`    Actions: ${result.actions.map((a) => `${a.type} (${a.executed ? 'OK' : 'FAILED'})`).join(', ')}`);
        });
      } else {
        console.log(`[TestRules] ⚠️  No rules triggered`);
      }
    } catch (error: any) {
      console.error(`[TestRules] ❌ Error: ${error.message}`);
    }

    console.log('');
  }

  // Get count after
  const afterResult = await db.execute(sql`SELECT COUNT(*) as count FROM rule_execution_history`);
  const countAfter = afterResult.rows[0]?.count || 0;
  console.log(`[TestRules] Execution history count after: ${countAfter}`);
  console.log(`[TestRules] New executions logged: ${countAfter - countBefore}\n`);

  // Show recent executions
  const recentResult = await db.execute(sql`
    SELECT
      rule_name,
      from_agent,
      to_agent,
      trigger_attribute,
      trigger_value,
      status,
      triggered_at
    FROM rule_execution_history
    ORDER BY triggered_at DESC
    LIMIT 10
  `);

  console.log('[TestRules] Recent executions:');
  console.table(recentResult.rows);

  console.log('\n[TestRules] ✅ Test complete!');
  console.log('[TestRules] Check the UI at:');
  console.log('[TestRules] - /admin/rule-execution-history');
  console.log('[TestRules] - /admin/agent-collaboration-matrix');

  process.exit(0);
}

testRuleExecution().catch((error) => {
  console.error('[TestRules] Fatal error:', error);
  process.exit(1);
});
