/**
 * Test the orchestrator's cross-domain insight generation
 * Simulates what happens during Phase 5.5 of the orchestration cycle
 */

import { timbrQueryService } from '../services/TimbrQueryService.js';
import { broadcastAgentInsight } from '../websocket.js';

async function testOrchestratorInsights() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       ORCHESTRATOR CROSS-DOMAIN INSIGHTS TEST                ║');
  console.log('║       Simulating Phase 5.5 of orchestration cycle            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize
    console.log('[Phase 5.5] Initializing TimbrQueryService...\n');
    await timbrQueryService.initialize();

    // Generate insights (what happens in Phase 5.5)
    console.log('[Phase 5.5] Generating cross-domain insights...\n');
    const insights = await timbrQueryService.generateCrossDomainInsights();

    console.log(`\n[Phase 5.5] Processing ${insights.length} insights...\n`);

    for (const insight of insights) {
      // Log to agent activity (simulated)
      console.log(`[Agent Activity] Cross-domain insight logged:`);
      console.log(`  Event Type: cross_domain_insight`);
      console.log(`  Primary Agent: orchestrator`);
      console.log(`  Summary: ${insight.title}`);
      console.log(`  Details: ${JSON.stringify({
        type: insight.type,
        description: insight.description,
        affectedDomains: insight.affectedDomains,
        severity: insight.severity,
        recommendation: insight.recommendation,
        confidence: insight.confidence,
      }, null, 2)}`);
      console.log('');

      // Route to relevant agents via A2A (simulated)
      for (const domain of insight.affectedDomains || []) {
        const agentId = domainToAgentId(domain);
        if (agentId) {
          console.log(`[A2A] orchestrator → ${agentId}: cross_domain_insight`);
          console.log(`      Content: ${insight.title}`);
          console.log(`      Severity: ${insight.severity}`);
          console.log(`      Requires Approval: ${insight.severity === 'critical'}`);
        }
      }
      console.log('');

      // Broadcast critical insights via WebSocket (simulated)
      if (insight.severity === 'critical' || insight.severity === 'high') {
        console.log(`[WebSocket] Broadcasting agent insight:`);
        console.log(`  Source: orchestrator`);
        console.log(`  Title: ${insight.title}`);
        console.log(`  Severity: ${insight.severity}`);
        console.log(`  Recommendations: ${insight.recommendedActions.slice(0, 2).join('; ')}`);
      }
      console.log('');
    }

    // Get agent-specific insights
    const agents = ['vro', 'finops', 'risk', 'pmo', 'planning'];
    console.log('[Phase 5.5] Agent-specific insight distribution:\n');

    for (const agentId of agents) {
      const agentInsights = await timbrQueryService.getAgentDomainInsights(agentId);
      console.log(`  ${agentId.toUpperCase()}: ${agentInsights.length} relevant insights`);
      for (const insight of agentInsights) {
        console.log(`    - ${insight.type}: ${insight.title.substring(0, 50)}...`);
      }
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║       ✅ ORCHESTRATOR TEST COMPLETE                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

function domainToAgentId(domain: string): string | null {
  const domainMap: Record<string, string> = {
    'VRO': 'vro',
    'PMO': 'pmo',
    'TMO': 'tmo',
    'FinOps': 'finops',
    'Risk': 'risk',
    'OKR': 'okr',
    'Governance': 'governance',
    'Planning': 'planning',
    'OCM': 'ocm',
  };
  return domainMap[domain] || null;
}

testOrchestratorInsights();
