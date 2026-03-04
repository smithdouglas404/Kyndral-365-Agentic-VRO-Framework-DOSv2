/**
 * Create relationships/links between Palantir objects for data lineage
 *
 * Links insights to their parent projects based on source system
 */

import 'dotenv/config';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { PALANTIR_OBJECT_TYPES, PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

async function main() {
  console.log('='.repeat(60));
  console.log('CREATING DATA LINEAGE LINKS IN PALANTIR');
  console.log('='.repeat(60));

  const palantir = getPalantirService();
  if (!palantir) {
    console.error('ERROR: Palantir service not initialized');
    process.exit(1);
  }

  // First, get all projects to map them
  console.log('\nFetching projects...');
  const projects = await palantir.listObjects(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 200 });
  const projectList = projects.data || [];
  console.log(`Found ${projectList.length} projects`);

  // Create a map of source prefixes to project IDs
  const projectMap: Record<string, string> = {};

  for (const proj of projectList) {
    const name = proj.name || '';
    const projectId = proj.project_id || proj.__primaryKey?.project_id;

    if (name.includes('[Jira Epic]')) {
      projectMap['jira'] = projectId;
    } else if (name.includes('[OpenProject]')) {
      projectMap['openproject'] = projectId;
    } else if (name.includes('[Monday]')) {
      projectMap['monday'] = projectId;
    }
  }

  console.log('\nProject mapping:');
  console.log('  Jira project:', projectMap['jira'] || 'not found');
  console.log('  OpenProject project:', projectMap['openproject'] || 'not found');
  console.log('  Monday project:', projectMap['monday'] || 'not found');

  // Now fetch insights and update them with project links
  console.log('\nFetching insights...');
  const insights = await palantir.listObjects('AtlasInsight', { pageSize: 200 });
  const insightList = insights.data || [];
  console.log(`Found ${insightList.length} insights`);

  // Group insights by source
  const insightsBySource: Record<string, any[]> = {
    jira: [],
    openproject: [],
    monday: [],
    other: [],
  };

  for (const insight of insightList) {
    const title = insight.title || '';
    const id = insight.insight_id || insight.__primaryKey?.insight_id;

    if (title.includes('[Jira]')) {
      insightsBySource.jira.push({ id, title });
    } else if (title.includes('[OpenProject]')) {
      insightsBySource.openproject.push({ id, title });
    } else if (title.includes('[Monday]')) {
      insightsBySource.monday.push({ id, title });
    } else {
      insightsBySource.other.push({ id, title });
    }
  }

  console.log('\nInsights by source:');
  console.log('  Jira:', insightsBySource.jira.length);
  console.log('  OpenProject:', insightsBySource.openproject.length);
  console.log('  Monday:', insightsBySource.monday.length);
  console.log('  Other:', insightsBySource.other.length);

  // Create new insights with relatedProjectId set
  console.log('\n--- Creating linked insights ---\n');

  let linkedCount = 0;
  let errorCount = 0;

  // For each source, create insights with the project link
  for (const [source, insights] of Object.entries(insightsBySource)) {
    if (source === 'other') continue;

    const projectId = projectMap[source];
    if (!projectId) {
      console.log(`Skipping ${source} - no matching project found`);
      continue;
    }

    console.log(`\nLinking ${insights.length} ${source} insights to project ${projectId}...`);

    for (const insight of insights.slice(0, 10)) { // Limit for testing
      try {
        // Create a new insight with the project link
        await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
          insight_id: `${insight.id}-linked`,
          title: insight.title,
          description: `Linked to project ${projectId}`,
          status: 'New',
          insight_type: 'Pattern',
          related_project_id: projectId,
        });
        console.log(`  ✓ Linked: ${insight.title.substring(0, 50)}`);
        linkedCount++;
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ Already linked: ${insight.title.substring(0, 40)}`);
          linkedCount++;
        } else {
          console.log(`  ✗ Error: ${e.message?.slice(0, 50)}`);
          errorCount++;
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('COMPLETE');
  console.log('='.repeat(60));
  console.log(`Linked: ${linkedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('\nNote: Data lineage should now show connections between');
  console.log('AtlasInsight objects and their related AtlasProject objects.');
}

main().catch(console.error);
