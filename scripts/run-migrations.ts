/**
 * Run SQL migrations
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🚀 Running database migrations...");

    // Read and run RAG tables migration
    const ragMigration = fs.readFileSync(
      path.join(__dirname, "../migrations/create_rag_tables.sql"),
      "utf8"
    );

    console.log("📊 Creating RAG tables...");
    await pool.query(ragMigration);
    console.log("✅ RAG tables created");

    // Read and run LLM/KB tables migration
    const llmKbMigration = fs.readFileSync(
      path.join(__dirname, "../migrations/create_llm_kb_tables.sql"),
      "utf8"
    );

    console.log("📊 Creating LLM and Knowledge Base tables...");
    await pool.query(llmKbMigration);
    console.log("✅ LLM and Knowledge Base tables created");

    // Read and run Battle Rhythm tables migration
    const battleRhythmMigration = fs.readFileSync(
      path.join(__dirname, "../migrations/create_battle_rhythm_tables.sql"),
      "utf8"
    );

    console.log("🎖️ Creating Battle Rhythm tables...");
    await pool.query(battleRhythmMigration);
    console.log("✅ Battle Rhythm tables created");

    console.log("🎉 All migrations completed successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
