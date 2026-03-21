/**
 * BACKFILL EMBEDDINGS MIGRATION SCRIPT
 *
 * Generates vector embeddings for all existing facts in agent_facts table
 * and saves them to agent_memories for semantic search
 *
 * Run with: npx tsx server/scripts/backfill-embeddings.ts
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { config } from 'dotenv';

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Fact {
  id: string;
  entity: string;
  attribute: string;
  value: any;
  source_agent: string;
  confidence: string;
  created_at: Date;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536
  });

  return response.data[0].embedding;
}

async function backfillEmbeddings() {
  console.log('[Backfill] Starting embedding generation for existing facts...\n');

  // Get all facts that don't have embeddings yet
  const result = await db.execute(sql`
    SELECT
      f.id,
      f.entity,
      f.attribute,
      f.value,
      f.source_agent,
      f.confidence,
      f.created_at
    FROM agent_facts f
    LEFT JOIN agent_memories m
      ON m.metadata->>'fact_id' = f.id::text
    WHERE m.id IS NULL
    ORDER BY f.created_at DESC
  `);

  const facts = result.rows as unknown as Fact[];

  console.log(`[Backfill] Found ${facts.length} facts without embeddings\n`);

  if (facts.length === 0) {
    console.log('[Backfill] No facts to backfill. Exiting.\n');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const batchSize = 10; // Process in batches to avoid rate limits
  const delayMs = 1000; // 1 second between batches

  for (let i = 0; i < facts.length; i += batchSize) {
    const batch = facts.slice(i, i + batchSize);

    console.log(`[Backfill] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(facts.length / batchSize)} (${batch.length} facts)`);

    await Promise.all(
      batch.map(async (fact) => {
        try {
          // Create semantic content from fact
          const content = `${fact.entity}.${fact.attribute} = ${JSON.stringify(fact.value)}`;

          // Generate embedding
          const embedding = await generateEmbedding(content);

          // Save to agent_memories
          await db.execute(sql`
            INSERT INTO agent_memories (agent_id, content, embedding, metadata)
            VALUES (
              ${fact.source_agent},
              ${content},
              ${JSON.stringify(embedding)}::vector,
              ${JSON.stringify({
                fact_id: fact.id,
                entity: fact.entity,
                attribute: fact.attribute,
                confidence: parseFloat(fact.confidence),
                type: 'fact',
                backfilled: true,
                backfilled_at: new Date().toISOString()
              })}
            )
            ON CONFLICT DO NOTHING
          `);

          successCount++;
          process.stdout.write('.');
        } catch (error: any) {
          errorCount++;
          console.error(`\n[Backfill] Error processing fact ${fact.id}:`, error.message);
        }
      })
    );

    // Rate limiting delay between batches
    if (i + batchSize < facts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`\n\n[Backfill] Complete!`);
  console.log(`  ✅ Successfully backfilled: ${successCount} facts`);
  console.log(`  ❌ Errors: ${errorCount} facts`);
  console.log(`  📊 Total processed: ${facts.length} facts\n`);

  // Show statistics
  const stats = await db.execute(sql`
    SELECT
      agent_id,
      COUNT(*) as memory_count,
      COUNT(CASE WHEN metadata->>'backfilled' = 'true' THEN 1 END) as backfilled_count
    FROM agent_memories
    GROUP BY agent_id
    ORDER BY memory_count DESC
  `);

  console.log('[Backfill] Memory statistics by agent:');
  for (const row of stats.rows as any[]) {
    console.log(`  - ${row.agent_id}: ${row.memory_count} memories (${row.backfilled_count} backfilled)`);
  }
  console.log('');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillEmbeddings()
    .then(() => {
      console.log('[Backfill] Migration complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Backfill] Migration failed:', error);
      process.exit(1);
    });
}

export { backfillEmbeddings };

export {};
