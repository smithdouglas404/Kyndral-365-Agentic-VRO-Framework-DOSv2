/**
 * Test Monday.com Connection and List Boards
 */

import 'dotenv/config';
import { MondayClient } from '../mondayClient.js';

async function main() {
  console.log("=".repeat(60));
  console.log("TESTING MONDAY.COM CONNECTION");
  console.log("=".repeat(60));

  const apiToken = process.env.MONDAY_API_TOKEN;
  const boardId = process.env.MONDAY_BOARD_ID;

  if (!apiToken) {
    console.error("Missing MONDAY_API_TOKEN");
    process.exit(1);
  }

  console.log("\nConfig:");
  console.log("  API Token:", apiToken.substring(0, 20) + "...");
  console.log("  Board ID:", boardId || "(not set)");

  const client = new MondayClient({ apiKey: apiToken });

  // Test connection
  console.log("\n--- Testing Connection ---");
  const result = await client.testConnection();
  console.log("Connection:", result.success ? "SUCCESS" : "FAILED");
  console.log("Message:", result.message);

  if (!result.success) {
    process.exit(1);
  }

  // List boards
  console.log("\n--- Listing Boards ---");
  try {
    const boards = await client.getBoards();
    console.log(`Found ${boards.length} boards:\n`);

    for (const board of boards.slice(0, 10)) {
      console.log(`  ID: ${board.id}`);
      console.log(`  Name: ${board.name}`);
      console.log(`  Type: ${board.board_kind}`);
      console.log(`  State: ${board.state}`);
      console.log(`  Owner: ${board.owner?.name || 'N/A'}`);
      console.log(`  ---`);
    }

    // If board ID is set, get details
    if (boardId) {
      console.log(`\n--- Board Details: ${boardId} ---`);
      try {
        const board = await client.getBoard(boardId);
        console.log(`Name: ${board.name}`);
        console.log(`Type: ${board.board_kind}`);
        console.log(`Description: ${board.description || '(none)'}`);

        console.log("\n--- Groups ---");
        const groups = await client.getGroups(boardId);
        console.log(`Found ${groups.length} groups:`);
        for (const group of groups) {
          console.log(`  ${group.title} (${group.color})`);
        }

        console.log("\n--- Items ---");
        const items = await client.getItems(boardId);
        console.log(`Found ${items.length} items:`);
        for (const item of items.slice(0, 10)) {
          console.log(`  ${item.id}: ${item.name}`);
          console.log(`    Group: ${item.group?.title || 'N/A'}`);
          console.log(`    State: ${item.state}`);
          if (item.subitems && item.subitems.length > 0) {
            console.log(`    Subitems: ${item.subitems.length}`);
          }
        }
        if (items.length > 10) {
          console.log(`  ... and ${items.length - 10} more items`);
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
