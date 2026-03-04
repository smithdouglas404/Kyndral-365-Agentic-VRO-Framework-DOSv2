/**
 * PUSH ALL PM TOOL DATA TO PALANTIR FOUNDRY
 * Uses correct action parameters discovered from Palantir API
 *
 * Actions used:
 * - atlas-create-project: project_id, name, status (required), description (optional)
 * - atlas-create-insight: insight_id, title (required), description, status (optional)
 */

import 'dotenv/config';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { JiraClient } from '../jiraClient.js';
import { OpenProjectService } from '../mcp/OpenProjectService.js';
import { MondayClient } from '../mondayClient.js';
import { PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

async function main() {
  console.log("=".repeat(60));
  console.log("PUSHING ALL PM TOOL DATA TO PALANTIR FOUNDRY");
  console.log("=".repeat(60));

  const palantir = getPalantirService();
  if (!palantir) {
    console.error("ERROR: Palantir service not initialized");
    process.exit(1);
  }

  let projectCount = 0;
  let insightCount = 0;
  let errorCount = 0;

  // ============================================================
  // JIRA SYNC
  // ============================================================
  console.log("\n" + "=".repeat(50));
  console.log("PUSHING JIRA DATA TO PALANTIR");
  console.log("=".repeat(50));

  try {
    const domain = (process.env.JIRA_DOMAIN || '').replace('.atlassian.net', '');
    const email = process.env.JIRA_EMAIL!;
    const apiToken = process.env.JIRA_API_TOKEN!;
    const projectKey = process.env.JIRA_PROJECT_KEY!;

    const jiraClient = new JiraClient({ domain, email, apiToken, projectKey });
    const epics = await jiraClient.getEpics(projectKey);
    const stories = await jiraClient.getStories(projectKey);

    console.log(`Found ${epics.length} epics, ${stories.length} stories`);

    // Push epics as projects
    for (const epic of epics) {
      const summary = epic.fields?.summary || epic.key;
      const projectId = `jira-epic-${epic.key}`;
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
          project_id: projectId,
          name: `[Jira Epic] ${summary}`,
          status: 'Planning',
          description: `Synced from Jira ${epic.key}`,
        });
        console.log(`  ✓ Project: ${summary}`);
        projectCount++;
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ ${summary} (exists)`);
          projectCount++;
        } else {
          console.log(`  ✗ ${summary}: ${e.message?.slice(0, 60)}`);
          errorCount++;
        }
      }
    }

    // Push stories as insights
    for (const story of stories.slice(0, 20)) {
      const summary = story.fields?.summary || story.key;
      const insightId = `jira-story-${story.key}`;
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
          insight_id: insightId,
          title: `[Jira] ${summary}`,
          description: `Synced from Jira ${story.key}`,
          status: 'New',
          insight_type: 'Pattern',
          severity: 'Medium',
        });
        console.log(`  ✓ Insight: ${summary}`);
        insightCount++;
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ ${summary} (exists)`);
          insightCount++;
        } else {
          console.log(`  ✗ ${summary}: ${e.message?.slice(0, 60)}`);
          errorCount++;
        }
      }
    }
  } catch (e: any) {
    console.log(`Jira error: ${e.message}`);
  }

  // ============================================================
  // OPENPROJECT SYNC
  // ============================================================
  console.log("\n" + "=".repeat(50));
  console.log("PUSHING OPENPROJECT DATA TO PALANTIR");
  console.log("=".repeat(50));

  try {
    const baseUrl = process.env.OPENPROJECT_URL!;
    const apiKey = process.env.OPENPROJECT_API_KEY!;
    const projectId = process.env.OPENPROJECT_PROJECT_ID || 'atlas';

    const opClient = new OpenProjectService({ baseUrl, apiKey });
    const workPackages = await opClient.listWorkPackages({ projectId, pageSize: 100 });

    console.log(`Found ${workPackages.length} work packages`);

    for (const wp of workPackages) {
      const typeName = wp._links?.type?.title || 'Task';
      const isEpic = typeName === 'Epic' || typeName === 'Feature';
      const pkId = `openproject-wp-${wp.id}`;

      try {
        if (isEpic) {
          await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
            project_id: pkId,
            name: `[OpenProject] ${wp.subject}`,
            status: 'Planning',
            description: wp.description?.raw || `Work package #${wp.id}`,
          });
          console.log(`  ✓ Project: ${wp.subject}`);
          projectCount++;
        } else {
          await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
            insight_id: pkId,
            title: `[OpenProject] ${wp.subject}`,
            description: wp.description?.raw || `Work package #${wp.id}`,
            status: 'New',
            insight_type: 'Pattern',
          });
          console.log(`  ✓ Insight: ${wp.subject}`);
          insightCount++;
        }
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ ${wp.subject} (exists)`);
          isEpic ? projectCount++ : insightCount++;
        } else {
          console.log(`  ✗ ${wp.subject}: ${e.message?.slice(0, 60)}`);
          errorCount++;
        }
      }
    }
  } catch (e: any) {
    console.log(`OpenProject error: ${e.message}`);
  }

  // ============================================================
  // MONDAY SYNC
  // ============================================================
  console.log("\n" + "=".repeat(50));
  console.log("PUSHING MONDAY.COM DATA TO PALANTIR");
  console.log("=".repeat(50));

  try {
    const apiToken = process.env.MONDAY_API_TOKEN!;
    const boardId = process.env.MONDAY_BOARD_ID!;

    const mondayClient = new MondayClient({ apiKey: apiToken });
    const boards = await mondayClient.getBoards();
    const items = await mondayClient.getItems(boardId);

    console.log(`Found ${boards.length} boards, ${items.length} items`);

    // Push boards as projects
    for (const board of boards.slice(0, 5)) {
      const pkId = `monday-board-${board.id}`;
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
          project_id: pkId,
          name: `[Monday] ${board.name}`,
          status: 'Planning',
          description: board.description || 'Monday.com board',
        });
        console.log(`  ✓ Project: ${board.name}`);
        projectCount++;
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ ${board.name} (exists)`);
          projectCount++;
        } else {
          console.log(`  ✗ ${board.name}: ${e.message?.slice(0, 60)}`);
          errorCount++;
        }
      }
    }

    // Push items as insights
    for (const item of items) {
      const pkId = `monday-item-${item.id}`;
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
          insight_id: pkId,
          title: `[Monday] ${item.name}`,
          description: `Group: ${item.group?.title || 'N/A'}`,
          status: 'New',
          insight_type: 'Pattern',
        });
        console.log(`  ✓ Insight: ${item.name}`);
        insightCount++;
      } catch (e: any) {
        if (e.message?.includes('ObjectAlreadyExists')) {
          console.log(`  ○ ${item.name} (exists)`);
          insightCount++;
        } else {
          console.log(`  ✗ ${item.name}: ${e.message?.slice(0, 60)}`);
          errorCount++;
        }
      }
    }
  } catch (e: any) {
    console.log(`Monday error: ${e.message}`);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("SYNC COMPLETE");
  console.log("=".repeat(60));
  console.log(`Projects created/synced: ${projectCount}`);
  console.log(`Insights created/synced: ${insightCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nView in Palantir Foundry:`);
  console.log(`  https://${process.env.PALANTIR_HOSTNAME}/workspace/ontology`);
  console.log(`  → Look for AtlasProject and AtlasInsight objects`);
}

main().catch(console.error);
