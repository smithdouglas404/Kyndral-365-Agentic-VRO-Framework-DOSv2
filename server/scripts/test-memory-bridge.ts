/**
 * Test script for PalantirMemoryBridge
 */
import 'dotenv/config';
import { getPalantirMemoryBridge, type AgentFact, type AgentDecision } from '../services/PalantirMemoryBridge.js';

async function main() {
  console.log('Testing PalantirMemoryBridge...\n');

  const bridge = getPalantirMemoryBridge();

  // Check initial status
  console.log('Initial Status:');
  console.log(JSON.stringify(bridge.getStatus(), null, 2));
  console.log('');

  // Test fact sync
  const testFact: AgentFact = {
    id: `test-fact-${Date.now()}`,
    entity: 'project_test',
    attribute: 'status',
    value: 'on-track',
    confidence: 0.95,
    sourceAgentId: 'deep-pmo',
    sourceAgentName: 'PMO Agent',
    timestamp: new Date(),
    metadata: {
      projectId: 'prj-001',
    },
  };

  console.log('Syncing test fact...');
  const factResult = await bridge.syncFact(testFact);
  console.log('Fact sync queued:', factResult);
  console.log('');

  // Test decision sync
  const testDecision: AgentDecision = {
    id: `test-decision-${Date.now()}`,
    type: 'alert',
    agentId: 'deep-risk',
    agentName: 'Risk Agent',
    subject: 'Test Alert',
    description: 'This is a test alert from the memory bridge',
    severity: 'high',
    relatedEntityId: 'prj-001',
    relatedEntityType: 'project',
    requiresHumanReview: false,
    status: 'pending',
    timestamp: new Date(),
  };

  console.log('Syncing test decision...');
  const decisionResult = await bridge.syncDecision(testDecision);
  console.log('Decision synced:', decisionResult);
  console.log('');

  // Wait a moment for batch processing
  console.log('Waiting for batch processing...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Flush any remaining
  console.log('Flushing queue...');
  await bridge.flush();

  // Check final status
  console.log('\nFinal Status:');
  console.log(JSON.stringify(bridge.getStatus(), null, 2));
}

main().catch(console.error);
