/**
 * Test Jira Connection and List Projects
 */

import 'dotenv/config';
import { JiraClient } from '../jiraClient.js';

async function main() {
  console.log("=".repeat(60));
  console.log("TESTING JIRA CONNECTION");
  console.log("=".repeat(60));

  let domain = process.env.JIRA_DOMAIN || '';
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!domain || !email || !apiToken) {
    console.error("Missing JIRA_DOMAIN, JIRA_EMAIL, or JIRA_API_TOKEN");
    process.exit(1);
  }

  // Remove .atlassian.net suffix if present (client adds it)
  domain = domain.replace('.atlassian.net', '');

  console.log("\nConfig:");
  console.log("  Domain:", domain);
  console.log("  Email:", email);
  console.log("  Project Key:", projectKey || "(not set)");

  const client = new JiraClient({ domain, email, apiToken, projectKey });

  // Test connection
  console.log("\n--- Testing Connection ---");
  const result = await client.testConnection();
  console.log("Connection:", result.success ? "SUCCESS" : "FAILED");
  console.log("Message:", result.message);

  if (!result.success) {
    process.exit(1);
  }

  // List projects
  console.log("\n--- Listing Projects ---");
  try {
    const projects = await client.getProjects();
    console.log(`Found ${projects.length} projects:\n`);

    for (const project of projects) {
      console.log(`  Key: ${project.key}`);
      console.log(`  Name: ${project.name}`);
      console.log(`  Type: ${project.projectTypeKey}`);
      console.log(`  ---`);
    }

    // If project key is set, get details
    if (projectKey) {
      console.log(`\n--- Project Details: ${projectKey} ---`);
      try {
        const project = await client.getProject(projectKey);
        console.log(`Name: ${project.name}`);
        console.log(`Key: ${project.key}`);
        console.log(`Type: ${project.projectTypeKey}`);

        console.log("\n--- Issues ---");
        const epics = await client.getEpics(projectKey);
        console.log(`Epics: ${epics.length}`);
        for (const epic of epics.slice(0, 5)) {
          const summary = epic.fields?.summary || epic.summary || '(no summary)';
          console.log(`  ${epic.key}: ${summary}`);
        }

        const stories = await client.getStories(projectKey);
        console.log(`\nStories: ${stories.length}`);
        for (const story of stories.slice(0, 5)) {
          const summary = story.fields?.summary || story.summary || '(no summary)';
          console.log(`  ${story.key}: ${summary}`);
        }

        const tasks = await client.getTasks(projectKey);
        console.log(`\nTasks: ${tasks.length}`);
        for (const task of tasks.slice(0, 5)) {
          const summary = task.fields?.summary || task.summary || '(no summary)';
          console.log(`  ${task.key}: ${summary}`);
        }

      } catch (e: any) {
        console.log(`Error: ${e.message}`);
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
