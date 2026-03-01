/**
 * UNIFIED MEMORY MANAGER
 *
 * The "Central Nervous System" for Deep Agents
 *
 * Two-Layer Architecture:
 * 1. Short-Term: Recent conversation history (direct Postgres queries)
 * 2. Long-Term: Semantic facts learned over time (agent_memories with pgvector)
 *
 * This replaces unbounded in-memory arrays with Postgres-backed storage,
 * reducing Node.js RAM usage from 790MB → ~100MB
 *
 * NO LANGCHAIN DEPENDENCY - uses direct SQL for message history.
 */

import { db, pool } from '../db.js';
import { sql } from 'drizzle-orm';
import OpenAI from 'openai';

interface MemoryManagerConfig {
  agentId: string;
  contextWindowSize?: number;
  maxHistorySize?: number;
}

interface SemanticFact {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

export interface ChatMessage {
  role: 'human' | 'ai';
  content: string;
}

export class MemoryManager {
  private agentId: string;
  private contextWindowSize: number;
  private maxHistorySize: number;
  private openai: OpenAI;
  private tableInitialized: boolean = false;

  constructor(config: MemoryManagerConfig) {
    this.agentId = config.agentId;
    this.contextWindowSize = config.contextWindowSize || 10;
    this.maxHistorySize = config.maxHistorySize || 100;

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`[MemoryManager] Initialized for agent: ${this.agentId}`);
  }

  private async ensureTable(): Promise<void> {
    if (this.tableInitialized) return;
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS agent_message_history (
          id SERIAL PRIMARY KEY,
          session_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      this.tableInitialized = true;
    } catch {
      this.tableInitialized = true;
    }
  }

  async getContextForThought(userQuery: string): Promise<{
    history: ChatMessage[];
    knowledge: string;
    fullPrompt: string;
  }> {
    const [recentMessages, relevantFacts] = await Promise.all([
      this.getRecentMessages(),
      this.searchSemanticFacts(userQuery, 5)
    ]);

    const knowledgeBlock = relevantFacts.length > 0
      ? relevantFacts.map(f => `- ${f.content} (confidence: ${f.similarity.toFixed(2)})`).join('\n')
      : 'No relevant prior knowledge found.';

    const fullPrompt = `## Relevant Knowledge from Long-Term Memory:\n${knowledgeBlock}\n\n## Recent Conversation History:\n(Last ${recentMessages.length} messages loaded)`;

    return {
      history: recentMessages,
      knowledge: knowledgeBlock,
      fullPrompt
    };
  }

  private async getRecentMessages(): Promise<ChatMessage[]> {
    await this.ensureTable();
    try {
      const result = await db.execute(sql`
        SELECT role, content FROM agent_message_history
        WHERE session_id = ${this.agentId}
        ORDER BY id DESC
        LIMIT ${this.contextWindowSize}
      `);

      const messages = result.rows.map((row: any) => ({
        role: row.role as 'human' | 'ai',
        content: row.content,
      }));

      messages.reverse();

      const totalResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM agent_message_history
        WHERE session_id = ${this.agentId}
      `);
      const total = parseInt((totalResult.rows[0] as any)?.total || '0');

      console.log(`[MemoryManager] Loaded ${messages.length}/${total} messages for ${this.agentId}`);

      return messages;
    } catch (error) {
      console.error(`[MemoryManager] Failed to load messages:`, error);
      return [];
    }
  }

  private async searchSemanticFacts(query: string, limit: number = 5): Promise<SemanticFact[]> {
    try {
      const embedding = await this.generateEmbedding(query);

      const result = await db.execute(sql`
        SELECT
          id::text,
          content,
          metadata,
          1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
        FROM agent_memories
        WHERE agent_id = ${this.agentId}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
        LIMIT ${limit}
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata || {},
        similarity: parseFloat(row.similarity)
      }));
    } catch (error) {
      console.error(`[MemoryManager] Semantic search failed:`, error);
      return [];
    }
  }

  async recordInteraction(userInput: string, agentOutput: string): Promise<void> {
    await this.ensureTable();

    await db.execute(sql`
      INSERT INTO agent_message_history (session_id, role, content)
      VALUES (${this.agentId}, 'human', ${userInput})
    `);
    await db.execute(sql`
      INSERT INTO agent_message_history (session_id, role, content)
      VALUES (${this.agentId}, 'ai', ${agentOutput})
    `);

    this.learnFromInteraction(userInput, agentOutput).catch(err => {
      console.error(`[MemoryManager] Learning failed:`, err);
    });

    await this.cleanupOldMessages();
  }

  private async learnFromInteraction(userInput: string, agentOutput: string): Promise<void> {
    const content = `User: ${userInput}\nAgent: ${agentOutput}`;

    const embedding = await this.generateEmbedding(content);

    await db.execute(sql`
      INSERT INTO agent_memories (agent_id, content, embedding, metadata)
      VALUES (
        ${this.agentId},
        ${content},
        ${JSON.stringify(embedding)}::vector,
        ${JSON.stringify({ type: 'interaction', timestamp: new Date().toISOString() })}
      )
    `);

    console.log(`[MemoryManager] Learned new fact for ${this.agentId}`);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536
    });

    return response.data[0].embedding;
  }

  private async cleanupOldMessages(): Promise<void> {
    try {
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM agent_message_history
        WHERE session_id = ${this.agentId}
      `);
      const total = parseInt((countResult.rows[0] as any)?.total || '0');

      if (total > this.maxHistorySize) {
        const excess = total - this.maxHistorySize;
        console.log(`[MemoryManager] Cleaning up ${excess} old messages for ${this.agentId}`);

        await db.execute(sql`
          DELETE FROM agent_message_history
          WHERE id IN (
            SELECT id FROM agent_message_history
            WHERE session_id = ${this.agentId}
            ORDER BY id ASC
            LIMIT ${excess}
          )
        `);
      }
    } catch (error) {
      console.error(`[MemoryManager] Cleanup failed:`, error);
    }
  }

  async saveFact(content: string, metadata: Record<string, any> = {}): Promise<void> {
    const embedding = await this.generateEmbedding(content);

    await db.execute(sql`
      INSERT INTO agent_memories (agent_id, content, embedding, metadata)
      VALUES (
        ${this.agentId},
        ${content},
        ${JSON.stringify(embedding)}::vector,
        ${JSON.stringify(metadata)}
      )
    `);

    console.log(`[MemoryManager] Saved fact for ${this.agentId}: ${content.substring(0, 50)}...`);
  }

  async clearAll(): Promise<void> {
    await this.ensureTable();

    await db.execute(sql`
      DELETE FROM agent_message_history
      WHERE session_id = ${this.agentId}
    `);

    await db.execute(sql`
      DELETE FROM agent_memories
      WHERE agent_id = ${this.agentId}
    `);

    console.log(`[MemoryManager] Cleared all memory for ${this.agentId}`);
  }

  async getStats(): Promise<{
    shortTermMessages: number;
    longTermFacts: number;
    oldestFact: Date | null;
    newestFact: Date | null;
  }> {
    await this.ensureTable();

    const msgResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM agent_message_history
      WHERE session_id = ${this.agentId}
    `);

    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM agent_memories
      WHERE agent_id = ${this.agentId}
    `);

    const row = result.rows[0] as any;

    return {
      shortTermMessages: parseInt((msgResult.rows[0] as any)?.total || '0'),
      longTermFacts: parseInt(row.total || '0'),
      oldestFact: row.oldest ? new Date(row.oldest) : null,
      newestFact: row.newest ? new Date(row.newest) : null,
    };
  }
}

export function createMemoryManager(agentId: string, config?: Partial<MemoryManagerConfig>): MemoryManager {
  return new MemoryManager({
    agentId,
    ...config
  });
}
