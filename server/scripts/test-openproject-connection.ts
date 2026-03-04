/**
 * Test OpenProject Connection and List Projects
 */

import 'dotenv/config';
import { OpenProjectService } from '../mcp/OpenProjectService.js';

async function main() {
  console.log("=".repeat(60));
  console.log("TESTING OPENPROJECT CONNECTION");
  console.log("=".repeat(60));

  const baseUrl = process.env.OPENPROJECT_URL;
  const apiKey = process.env.OPENPROJECT_API_KEY;

  if (!baseUrl || !apiKey) {
    console.error("Missing OPENPROJECT_URL or OPENPROJECT_API_KEY in environment");
    process.exit(1);
  }

  console.log("\nConfig:");
  console.log("  URL:", baseUrl);
  console.log("  API Key:", apiKey.substring(0, 8) + "...");

  const client = new OpenProjectService({ baseUrl, apiKey });

  // Test connection
  console.log("\n--- Testing Connection ---");
  const connectionResult = await client.testConnection();

  if (connectionResult.connected) {
    console.log("Connection: SUCCESS");
    console.log("  Version:", connectionResult.version);
    console.log("  Instance:", connectionResult.instanceName);
  } else {
    console.log("Connection: FAILED");
    console.log("  Error:", connectionResult.error);
    process.exit(1);
  }

  // List projects
  console.log("\n--- Listing Projects ---");
  try {
    const projects = await client.listProjects();
    console.log(`Found ${projects.length} projects:\n`);

    for (const project of projects) {
      console.log(`  ID: ${project.id}`);
      console.log(`  Identifier: ${project.identifier}`);
      console.log(`  Name: ${project.name}`);
      console.log(`  Status: ${project.status || 'active'}`);
      console.log(`  ---`);
    }

    // List work package types
    console.log("\n--- Work Package Types ---");
    const types = await client.listTypes();
    for (const type of types) {
      console.log(`  ${type.id}: ${type.name}`);
    }

    // List statuses
    console.log("\n--- Statuses ---");
    const statuses = await client.listStatuses();
    for (const status of statuses) {
      console.log(`  ${status.id}: ${status.name} (closed: ${status.isClosed})`);
    }

    // List priorities
    console.log("\n--- Priorities ---");
    const priorities = await client.listPriorities();
    for (const priority of priorities) {
      console.log(`  ${priority.id}: ${priority.name}`);
    }

    // Get work packages for the configured project
    const projectId = process.env.OPENPROJECT_PROJECT_ID;
    if (projectId) {
      console.log(`\n--- Work Packages in '${projectId}' ---`);
      try {
        const workPackages = await client.listWorkPackages({ projectId, pageSize: 10 });
        console.log(`Found ${workPackages.length} work packages (showing up to 10):\n`);

        for (const wp of workPackages.slice(0, 10)) {
          console.log(`  #${wp.id}: ${wp.subject}`);
          console.log(`    Type: ${wp._links?.type?.title || 'Unknown'}`);
          console.log(`    Status: ${wp._links?.status?.title || 'Unknown'}`);
          console.log(`    ---`);
        }
      } catch (e: any) {
        console.log(`  Error fetching work packages: ${e.message}`);
      }
    }

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST COMPLETE");
  console.log("=".repeat(60));
}

main().catch(console.error);
