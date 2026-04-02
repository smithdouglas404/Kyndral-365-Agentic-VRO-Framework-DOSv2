/**
 * Test script for cross-domain insights via TimbrQueryService
 * Run with: npx tsx server/scripts/test-cross-domain-insights.ts
 */

import { timbrQueryService } from '../services/TimbrQueryService.js';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       CROSS-DOMAIN INSIGHTS TEST                             ║');
  console.log('║       Testing Timbr + Palantir Integration                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize the service
    console.log('[1] Initializing TimbrQueryService...');
    await timbrQueryService.initialize();

    // Get status
    const status = timbrQueryService.getStatus();
    console.log('\n[2] Service Status:');
    console.log(`    • Initialized: ${status.initialized}`);
    console.log(`    • Timbr Enabled: ${status.timbrEnabled}`);
    console.log(`    • Palantir Available: ${status.palantirAvailable}`);
    console.log(`    • Data Source: ${status.dataSource}`);
    console.log(`    • Ontology Triples: ${status.ontologyStats?.totalTriples || 'N/A'}`);

    // Generate cross-domain insights
    console.log('\n[3] Generating cross-domain insights from Palantir...\n');
    const insights = await timbrQueryService.generateCrossDomainInsights();

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
      const writeResult = await timbrQueryService.writeInsightToPalantir(testInsight);
      console.log(`    Write result: ${writeResult ? '✅ Success' : '⚠️ Failed (Palantir action not available)'}\n`);
    }

    // Test a semantic query
    console.log('[5] Testing semantic query: k360:Project...');
    const projectQuery = await timbrQueryService.query('k360:Project', undefined, 5);
    console.log(`    Source: ${projectQuery.source}`);
    console.log(`    Results: ${projectQuery.count} projects`);
    console.log(`    Execution time: ${projectQuery.executionTime}ms`);

    if (projectQuery.entities.length > 0) {
      console.log('    Sample projects:');
      for (const project of projectQuery.entities.slice(0, 3)) {
        console.log(`      - ${project.title || project.name || project.id}`);
      }
    }

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
