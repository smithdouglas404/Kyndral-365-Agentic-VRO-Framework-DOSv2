/**
 * CREATE LOGIC GATE SCENARIO WORKFLOWS
 *
 * Uses LangflowFlowGenerator to programmatically create the 4 Logic Gate workflows
 * Run: tsx server/scripts/create-logic-gate-scenarios.ts
 */

import { LangflowFlowGenerator } from '../lib/LangflowFlowGenerator.js';
import { LangflowService } from '../lib/LangflowService.js';

async function main() {
  console.log('🚀 Creating Logic Gate Scenario Workflows...\n');

  if (!process.env.LANGFLOW_API_KEY) {
    console.error('❌ LANGFLOW_API_KEY not set in environment');
    process.exit(1);
  }

  const service = new LangflowService({
    apiUrl: process.env.LANGFLOW_API_URL!,
    apiKey: process.env.LANGFLOW_API_KEY!,
    orgId: process.env.LANGFLOW_ORG_ID,
    projectId: process.env.LANGFLOW_PROJECT_ID
  });

  const generator = new LangflowFlowGenerator(service);

  // Map Logic Gate scenarios to agent flow types
  const scenarios = [
    { id: 'A', name: 'Budget Overrun', agent: 'finops' },
    { id: 'B', name: 'Burnout Brake', agent: 'ocm' },
    { id: 'C', name: 'Regulatory Deadbolt', agent: 'risk' },
    { id: 'D', name: 'Maturity Governor', agent: 'tmo' }
  ];

  const results: Record<string, string> = {};

  for (const scenario of scenarios) {
    console.log(`Creating Scenario ${scenario.id}: ${scenario.name}...`);

    try {
      const flowId = await generator.generateAgentFlow(scenario.agent);

      if (flowId) {
        results[scenario.id] = flowId;
        console.log(`✅ Scenario ${scenario.id} created: ${flowId}\n`);
      } else {
        results[scenario.id] = 'FAILED';
        console.log(`❌ Scenario ${scenario.id} failed: No flow ID returned\n`);
      }
    } catch (error: any) {
      results[scenario.id] = 'FAILED';
      console.log(`❌ Scenario ${scenario.id} failed: ${error.message}\n`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('═══════════════════════════════════════════');
  scenarios.forEach(scenario => {
    const flowId = results[scenario.id];
    const status = flowId === 'FAILED' ? '❌' : '✅';
    console.log(`${status} Scenario ${scenario.id} (${scenario.name}): ${flowId}`);
  });
  console.log('═══════════════════════════════════════════\n');

  console.log('📝 Save these IDs to .env:');
  scenarios.forEach(scenario => {
    const flowId = results[scenario.id];
    if (flowId !== 'FAILED') {
      console.log(`LANGFLOW_SCENARIO_${scenario.id}_ID=${flowId}`);
    }
  });
}

main().catch(console.error);
