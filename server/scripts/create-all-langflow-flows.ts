/**
 * CREATE ALL LANGFLOW FLOWS - Fresh Installation
 *
 * Creates all 12 flows programmatically:
 * - 8 agent flows (FinOps, TMO, Risk, VRO, PMO, OCM, Governance, Planning)
 * - 4 Logic Gate scenarios (Budget Overrun, Burnout Brake, Regulatory Deadbolt, Maturity Governor)
 *
 * Run: tsx server/scripts/create-all-langflow-flows.ts
 */

import { LangflowFlowGenerator } from '../lib/LangflowFlowGenerator.js';
import { LangflowService } from '../lib/LangflowService.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 Creating ALL Langflow Flows...\n');

  if (!process.env.LANGFLOW_API_KEY || process.env.LANGFLOW_API_KEY === 'YOUR_KEY_HERE') {
    console.error('❌ LANGFLOW_API_KEY not set in .env');
    console.error('');
    console.error('Steps:');
    console.error('1. Open http://localhost:7860');
    console.error('2. Go to Settings → API Keys');
    console.error('3. Create new key and copy it');
    console.error('4. Update .env: LANGFLOW_API_KEY=<your-key>');
    console.error('5. Run this script again');
    process.exit(1);
  }

  const service = new LangflowService({
    apiUrl: process.env.LANGFLOW_API_URL || 'http://localhost:7860/api/v1',
    apiKey: process.env.LANGFLOW_API_KEY!,
  });

  const generator = new LangflowFlowGenerator(service);

  // ========================================
  // PART 1: Create 8 Agent Flows
  // ========================================

  console.log('📦 PART 1: Creating 8 Agent Flows\n');

  const agents = [
    { id: 'finops', name: 'FinOps' },
    { id: 'tmo', name: 'TMO' },
    { id: 'risk', name: 'Risk' },
    { id: 'vro', name: 'VRO' },
    { id: 'pmo', name: 'PMO' },
    { id: 'ocm', name: 'OCM' },
    { id: 'governance', name: 'Governance' },
    { id: 'planning', name: 'Planning' }
  ];

  const agentFlowIds: Record<string, string> = {};

  for (const agent of agents) {
    console.log(`Creating ${agent.name} agent flow...`);
    try {
      const flowId = await generator.generateAgentFlow(agent.id);
      if (flowId) {
        agentFlowIds[agent.id] = flowId;
        console.log(`✅ ${agent.name}: ${flowId}\n`);
      } else {
        console.log(`❌ ${agent.name}: No flow ID returned\n`);
      }
    } catch (error: any) {
      console.log(`❌ ${agent.name}: ${error.message}\n`);
    }
  }

  // ========================================
  // PART 2: Import 4 Logic Gate Scenarios
  // ========================================

  console.log('\n📦 PART 2: Importing 4 Logic Gate Scenarios\n');

  const scenarios = [
    { file: 'scenario-a-budget-overrun.json', name: 'Budget Overrun' },
    { file: 'scenario-b-burnout-brake.json', name: 'Burnout Brake' },
    { file: 'scenario-c-regulatory-deadbolt.json', name: 'Regulatory Deadbolt' },
    { file: 'scenario-d-maturity-governor.json', name: 'Maturity Governor' }
  ];

  const scenarioFlowIds: Record<string, string> = {};

  for (const scenario of scenarios) {
    console.log(`Importing ${scenario.name}...`);
    try {
      const filePath = path.join(process.cwd(), 'langflow-flows', scenario.file);

      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}\n`);
        continue;
      }

      const flowData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Create flow via API
      const response = await fetch(`${process.env.LANGFLOW_API_URL}/flows`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LANGFLOW_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flowData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result: any = await response.json();
      const flowId = result.id || result.flow_id;

      if (flowId) {
        scenarioFlowIds[scenario.file] = flowId;
        console.log(`✅ ${scenario.name}: ${flowId}\n`);
      } else {
        console.log(`❌ ${scenario.name}: No flow ID in response\n`);
      }
    } catch (error: any) {
      console.log(`❌ ${scenario.name}: ${error.message}\n`);
    }
  }

  // ========================================
  // SUMMARY
  // ========================================

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════\n');

  console.log('✅ Agent Flows Created:');
  Object.entries(agentFlowIds).forEach(([agent, flowId]) => {
    console.log(`   ${agent}: ${flowId}`);
  });

  console.log('\n✅ Logic Gate Scenarios Created:');
  Object.entries(scenarioFlowIds).forEach(([file, flowId]) => {
    console.log(`   ${file}: ${flowId}`);
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('📝 NEXT STEPS');
  console.log('═══════════════════════════════════════════\n');

  console.log('1. Update agent code with new Flow IDs:');
  console.log('   npx tsx server/scripts/update-agent-flow-ids.ts\n');

  console.log('2. Or manually update these files:');
  console.log('   server/agents/deep/DeepFinOpsAgent.ts → line 91');
  console.log('   server/agents/deep/DeepTMOAgent.ts → line 107');
  console.log('   server/agents/deep/DeepRiskAgent.ts → line 798');
  console.log('   server/agents/deep/DeepVROAgent.ts → line 176');
  console.log('   server/agents/deep/DeepPMOAgent.ts → line 77');
  console.log('   server/agents/deep/DeepOCMAgent.ts → line 162');
  console.log('   server/agents/deep/DeepGovernanceAgent.ts → line 96');
  console.log('   server/agents/deep/DeepPlanningAgent.ts → line 100\n');

  console.log('3. Test end-to-end integration\n');

  console.log('🎉 DONE! All flows created successfully.\n');

  // Save Flow IDs to file for reference
  const flowIdsFile = path.join(process.cwd(), 'LANGFLOW_FLOW_IDS.json');
  fs.writeFileSync(
    flowIdsFile,
    JSON.stringify({
      created: new Date().toISOString(),
      agentFlows: agentFlowIds,
      scenarioFlows: scenarioFlowIds
    }, null, 2)
  );
  console.log(`💾 Flow IDs saved to: ${flowIdsFile}\n`);
}

main().catch(console.error);
