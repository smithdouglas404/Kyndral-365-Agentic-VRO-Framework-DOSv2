/**
 * Test script for cross-domain insights via Neo4jInsightService
 * Run with: npx tsx server/scripts/test-cross-domain-insights.ts
 */

import { neo4jInsightService } from '../services/Neo4jInsightService.js';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       CROSS-DOMAIN INSIGHTS TEST                             ║');
  console.log('║       Testing Neo4j + Palantir Integration                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize the service
    console.log('[1] Initializing Neo4jInsightService...');
    await neo4jInsightService.initialize();

    // Get status
    const status = neo4jInsightService.getStatus();
    console.log('\n[2] Service Status:');
    console.log(`    • Connected: ${status.connected}`);
    console.log(`    • Initialized: ${status.initialized}`);
    console.log(`    • Data Source: ${status.dataSource}`);
    console.log(`    • Last Sync: ${status.lastSyncTime || 'never'}`);

    // Generate cross-domain insights
    console.log('\n[3] Generating cross-domain insights from Palantir...\n');
    const insights = await neo4jInsightService.generateCrossDomainInsights();

    if (insights.length === 0) {
      console.log('    ⚠️  No cross-domain insights generated');
      console.log('    This could mean:');
      console.log('    - Palantir is not connected');
      console.log('    - No data matching insight criteria');
      console.log('    - All projects are healthy!\n');
    } else {
      console.log(`    ✅ Generated ${insights.length} cross-domain insights:\n`);

      for (const insight of insights) {
        const severityIcon = {
          critical: '🔴',
          high: '🟠',
          warning: '🟡',
          info: '🔵',
        }[insight.severity] || '⚪';

        console.log(`    ${severityIcon} ${insight.title}`);
        console.log(`       Type: ${insight.type}`);
        console.log(`       Severity: ${insight.severity}`);
        console.log(`       Description: ${insight.description}`);
        console.log(`       Affected Domains: ${insight.affectedDomains?.join(', ') || 'N/A'}`);
        console.log(`       Source Agents: ${insight.sourceAgents.join(', ')}`);
        console.log(`       Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
        console.log(`       Recommendation: ${insight.recommendation || insight.recommendedActions[0]}`);
        console.log(`       Affected Entities: ${insight.affectedEntities.slice(0, 3).join(', ')}${insight.affectedEntities.length > 3 ? '...' : ''}`);
        console.log('');
      }
    }

    // Test writing an insight back to Palantir
    if (insights.length > 0) {
      console.log('[4] Testing write-back to Palantir...');
      const testInsight = insights[0];
      const writeResult = await neo4jInsightService.writeInsightToPalantir(testInsight);
      console.log(`    Write result: ${writeResult ? '✅ Success' : '⚠️ Failed (Palantir action not available)'}\n`);
    }

    // Test Neo4j status
    console.log('[5] Neo4j service status:');
    const neo4jStatus = neo4jInsightService.getStatus();
    console.log(`    Connected: ${neo4jStatus.connected}`);
    console.log(`    Data source: ${neo4jStatus.dataSource}`);
    console.log(`    Last sync: ${neo4jStatus.lastSyncTime || 'never'}`);

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║       ✅ TEST COMPLETE                                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
