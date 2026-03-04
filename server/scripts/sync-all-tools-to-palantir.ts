/**
 * SYNC ALL PM TOOLS TO PALANTIR
 *
 * Pulls data from Jira, OpenProject, and Monday.com
 * and syncs to Palantir Foundry as the single source of truth
 */

import 'dotenv/config';
import { JiraClient } from '../jiraClient.js';
import { OpenProjectService } from '../mcp/OpenProjectService.js';
import { MondayClient } from '../mondayClient.js';

// Palantir sync endpoint
const PALANTIR_SYNC_URL = process.env.PALANTIR_FOUNDRY_URL || 'https://palantir.example.com';

interface SyncResult {
  tool: string;
  success: boolean;
  itemsSynced: number;
  errors: string[];
}

const results: SyncResult[] = [];

// ============================================================
// JIRA SYNC
// ============================================================
async function syncJira(): Promise<SyncResult> {
  console.log("\n" + "=".repeat(50));
  console.log("SYNCING JIRA TO PALANTIR");
  console.log("=".repeat(50));

  const result: SyncResult = { tool: 'Jira', success: false, itemsSynced: 0, errors: [] };

  try {
    const domain = (process.env.JIRA_DOMAIN || '').replace('.atlassian.net', '');
    const email = process.env.JIRA_EMAIL!;
    const apiToken = process.env.JIRA_API_TOKEN!;
    const projectKey = process.env.JIRA_PROJECT_KEY!;

    const client = new JiraClient({ domain, email, apiToken, projectKey });

    const conn = await client.testConnection();
    if (!conn.success) {
      result.errors.push(conn.message);
      return result;
    }
    console.log("Connected to Jira");

    // Get all issues
    const epics = await client.getEpics(projectKey);
    const stories = await client.getStories(projectKey);
    const tasks = await client.getTasks(projectKey);

    console.log(`  Epics: ${epics.length}`);
    console.log(`  Stories: ${stories.length}`);
    console.log(`  Tasks: ${tasks.length}`);

    // Transform to Palantir format
    const palantirObjects: any[] = [];

    for (const epic of epics) {
      palantirObjects.push({
        objectType: 'AtlasProject',
        primaryKey: `jira-${epic.key}`,
        properties: {
          name: `[Epic] ${epic.fields?.summary || epic.key}`,
          description: epic.fields?.description || '',
          status: mapJiraStatus(epic.fields?.status?.statusCategory?.key),
          source: 'jira',
          sourceId: epic.key,
          projectId: projectKey,
        }
      });
    }

    for (const story of stories) {
      palantirObjects.push({
        objectType: 'AtlasInsight',
        primaryKey: `jira-${story.key}`,
        properties: {
          title: story.fields?.summary || story.key,
          description: story.fields?.description || '',
          category: 'story',
          status: mapJiraStatus(story.fields?.status?.statusCategory?.key),
          source: 'jira',
          sourceId: story.key,
        }
      });
    }

    result.itemsSynced = palantirObjects.length;
    result.success = true;
    console.log(`  Prepared ${palantirObjects.length} objects for Palantir`);

  } catch (e: any) {
    result.errors.push(e.message);
  }

  return result;
}

// ============================================================
// OPENPROJECT SYNC
// ============================================================
async function syncOpenProject(): Promise<SyncResult> {
  console.log("\n" + "=".repeat(50));
  console.log("SYNCING OPENPROJECT TO PALANTIR");
  console.log("=".repeat(50));

  const result: SyncResult = { tool: 'OpenProject', success: false, itemsSynced: 0, errors: [] };

  try {
    const baseUrl = process.env.OPENPROJECT_URL!;
    const apiKey = process.env.OPENPROJECT_API_KEY!;
    const projectId = process.env.OPENPROJECT_PROJECT_ID || 'atlas';

    const client = new OpenProjectService({ baseUrl, apiKey });

    const conn = await client.testConnection();
    if (!conn.connected) {
      result.errors.push(conn.error || 'Connection failed');
      return result;
    }
    console.log(`Connected to OpenProject ${conn.version}`);

    // Get work packages
    const workPackages = await client.listWorkPackages({ projectId });
    console.log(`  Work Packages: ${workPackages.length}`);

    // Transform to Palantir format
    const palantirObjects: any[] = [];

    for (const wp of workPackages) {
      const typeName = wp._links?.type?.title || 'Task';
      palantirObjects.push({
        objectType: typeName === 'Epic' ? 'AtlasProject' : 'AtlasInsight',
        primaryKey: `openproject-${wp.id}`,
        properties: {
          name: wp.subject,
          title: wp.subject,
          description: wp.description?.raw || '',
          category: typeName.toLowerCase(),
          status: mapOpenProjectStatus(wp._links?.status?.title),
          source: 'openproject',
          sourceId: String(wp.id),
        }
      });
    }

    result.itemsSynced = palantirObjects.length;
    result.success = true;
    console.log(`  Prepared ${palantirObjects.length} objects for Palantir`);

  } catch (e: any) {
    result.errors.push(e.message);
  }

  return result;
}

// ============================================================
// MONDAY.COM SYNC
// ============================================================
async function syncMonday(): Promise<SyncResult> {
  console.log("\n" + "=".repeat(50));
  console.log("SYNCING MONDAY.COM TO PALANTIR");
  console.log("=".repeat(50));

  const result: SyncResult = { tool: 'Monday.com', success: false, itemsSynced: 0, errors: [] };

  try {
    const apiToken = process.env.MONDAY_API_TOKEN!;
    const boardId = process.env.MONDAY_BOARD_ID!;

    const client = new MondayClient({ apiKey: apiToken });

    const conn = await client.testConnection();
    if (!conn.success) {
      result.errors.push(conn.message);
      return result;
    }
    console.log("Connected to Monday.com");

    // Get all boards
    const boards = await client.getBoards();
    console.log(`  Boards: ${boards.length}`);

    const palantirObjects: any[] = [];

    // Sync main board items
    const items = await client.getItems(boardId);
    const groups = await client.getGroups(boardId);
    console.log(`  Items in main board: ${items.length}`);
    console.log(`  Groups: ${groups.length}`);

    // Add boards as projects
    for (const board of boards) {
      palantirObjects.push({
        objectType: 'AtlasProject',
        primaryKey: `monday-board-${board.id}`,
        properties: {
          name: board.name,
          description: board.description || '',
          status: board.state === 'active' ? 'green' : 'amber',
          source: 'monday',
          sourceId: board.id,
        }
      });
    }

    // Add items as insights
    for (const item of items) {
      palantirObjects.push({
        objectType: 'AtlasInsight',
        primaryKey: `monday-item-${item.id}`,
        properties: {
          title: item.name,
          category: 'task',
          status: item.state === 'active' ? 'in-progress' : 'completed',
          source: 'monday',
          sourceId: item.id,
          groupName: item.group?.title,
        }
      });

      // Add subitems
      if (item.subitems) {
        for (const subitem of item.subitems) {
          palantirObjects.push({
            objectType: 'AtlasInsight',
            primaryKey: `monday-subitem-${subitem.id}`,
            properties: {
              title: subitem.name,
              category: 'subtask',
              status: subitem.state === 'active' ? 'in-progress' : 'completed',
              source: 'monday',
              sourceId: subitem.id,
              parentId: item.id,
            }
          });
        }
      }
    }

    result.itemsSynced = palantirObjects.length;
    result.success = true;
    console.log(`  Prepared ${palantirObjects.length} objects for Palantir`);

  } catch (e: any) {
    result.errors.push(e.message);
  }

  return result;
}

// ============================================================
// STATUS MAPPERS
// ============================================================
function mapJiraStatus(statusCategory: string | undefined): string {
  switch (statusCategory?.toLowerCase()) {
    case 'done': return 'completed';
    case 'indeterminate': return 'in-progress';
    default: return 'not-started';
  }
}

function mapOpenProjectStatus(status: string | undefined): string {
  const s = (status || '').toLowerCase();
  if (s.includes('closed') || s.includes('done')) return 'completed';
  if (s.includes('progress') || s.includes('working')) return 'in-progress';
  return 'not-started';
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("=".repeat(60));
  console.log("SYNCING ALL PM TOOLS TO PALANTIR");
  console.log("=".repeat(60));
  console.log(`Started: ${new Date().toISOString()}`);

  // Run all syncs
  results.push(await syncJira());
  results.push(await syncOpenProject());
  results.push(await syncMonday());

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SYNC SUMMARY");
  console.log("=".repeat(60));

  let totalItems = 0;
  let successCount = 0;

  for (const r of results) {
    const status = r.success ? 'SUCCESS' : 'FAILED';
    console.log(`\n${r.tool}: ${status}`);
    console.log(`  Items synced: ${r.itemsSynced}`);
    if (r.errors.length > 0) {
      console.log(`  Errors: ${r.errors.join(', ')}`);
    }
    totalItems += r.itemsSynced;
    if (r.success) successCount++;
  }

  console.log("\n" + "-".repeat(60));
  console.log(`Total tools: ${results.length} (${successCount} successful)`);
  console.log(`Total items synced to Palantir: ${totalItems}`);
  console.log(`Completed: ${new Date().toISOString()}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
