/**
 * UNIFIED MEMORY MANAGER
 *
 * The "Central Nervous System" for Deep Agents
 *
 * Two-Layer Architecture:
 * 1. Short-Term: Recent conversation history (PostgresChatMessageHistory)
 * 2. Long-Term: Semantic facts learned over time (agent_memories with pgvector)
 *
 * This replaces unbounded in-memory arrays with Postgres-backed storage,
 * reducing Node.js RAM usage from 790MB → ~100MB
 */

import { PostgresChatMessageHistory } from "@langchain/community/stores/message/postgres";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { db, pool } from '../db.js';
import { sql } from 'drizzle-orm';
import OpenAI from 'openai';

interface MemoryManagerConfig {
  agentId: string;
  contextWindowSize?: number; // How many recent messages to load (default: 10)
  maxHistorySize?: number;    // Max messages to keep in Postgres (default: 100)
}

interface SemanticFact {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

export class MemoryManager {
  private agentId: string;
  private contextWindowSize: number;
  private maxHistorySize: number;
  private shortTermHistory: PostgresChatMessageHistory;
  private openai: OpenAI;

  constructor(config: MemoryManagerConfig) {
    this.agentId = config.agentId;
    this.contextWindowSize = config.contextWindowSize || 10;
    this.maxHistorySize = config.maxHistorySize || 100;

    // Initialize short-term message history (LangChain)
    this.shortTermHistory = new PostgresChatMessageHistory({
      pool: pool,
      sessionId: this.agentId,
      tableName: "agent_message_history",
    });

    // Initialize OpenAI for embeddings
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`[MemoryManager] Initialized for agent: ${this.agentId}`);
  }

  /**
   * Get context for the agent's next "thought"
   * Fetches limited context window to prevent RAM bloat
   */
  async getContextForThought(userQuery: string): Promise<{
    history: BaseMessage[];
    knowledge: string;
    fullPrompt: string;
  }> {
    // Parallel fetch for speed
    const [recentMessages, relevantFacts] = await Promise.all([
      this.getRecentMessages(),
      this.searchSemanticFacts(userQuery, 5)
    ]);

    // Format semantic facts into knowledge block
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

  /**
   * Get recent messages with context window limit
   * CRITICAL: Only loads last N messages to prevent RAM bloat
   */
  private async getRecentMessages(): Promise<BaseMessage[]> {
    const allMessages = await this.shortTermHistory.getMessages();

    // CONTEXT WINDOW: Only keep last N messages in RAM
    const recentMessages = allMessages.slice(-this.contextWindowSize);

    console.log(`[MemoryManager] Loaded ${recentMessages.length}/${allMessages.length} messages for ${this.agentId}`);

    return recentMessages;
  }

  /**
   * Search for semantically similar facts using pgvector
   */
  private async searchSemanticFacts(query: string, limit: number = 5): Promise<SemanticFact[]> {
    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);

      // Search using vector similarity (cosine distance)
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

  /**
   * Record an interaction (user input + agent output)
   * Saves to short-term history AND triggers long-term learning
   */
  async recordInteraction(userInput: string, agentOutput: string): Promise<void> {
    // Save to short-term history
    await this.shortTermHistory.addMessage(new HumanMessage(userInput));
    await this.shortTermHistory.addMessage(new AIMessage(agentOutput));

    // Extract and save facts to long-term memory (async, don't wait)
    this.learnFromInteraction(userInput, agentOutput).catch(err => {
      console.error(`[MemoryManager] Learning failed:`, err);
    });

    // Cleanup old messages if needed
    await this.cleanupOldMessages();
  }

  /**
   * Extract facts from interaction and save to long-term memory
   */
  private async learnFromInteraction(userInput: string, agentOutput: string): Promise<void> {
    // Combine input and output for fact extraction
    const content = `User: ${userInput}\nAgent: ${agentOutput}`;

    // Generate embedding
    const embedding = await this.generateEmbedding(content);

    // Save to agent_memories
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

  /**
   * Generate OpenAI embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536
    });

    return response.data[0].embedding;
  }

  /**
   * Cleanup old messages to prevent Postgres bloat
   * Keeps only the most recent maxHistorySize messages
   */
  private async cleanupOldMessages(): Promise<void> {
    try {
      const allMessages = await this.shortTermHistory.getMessages();

      if (allMessages.length > this.maxHistorySize) {
        console.log(`[MemoryManager] Cleaning up ${allMessages.length - this.maxHistorySize} old messages for ${this.agentId}`);

        // Clear all messages
        await this.shortTermHistory.clear();

        // Re-add only the most recent ones
        const messagesToKeep = allMessages.slice(-this.maxHistorySize);
        for (const msg of messagesToKeep) {
          await this.shortTermHistory.addMessage(msg);
        }
      }
    } catch (error) {
      console.error(`[MemoryManager] Cleanup failed:`, error);
    }
  }

  /**
   * Save a fact directly to long-term memory
   * Used when agents explicitly learn something
   */
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

  /**
   * Clear all memory (both short-term and long-term)
   * Use with caution!
   */
  async clearAll(): Promise<void> {
    await this.shortTermHistory.clear();

    await db.execute(sql`
      DELETE FROM agent_memories
      WHERE agent_id = ${this.agentId}
    `);

    console.log(`[MemoryManager] Cleared all memory for ${this.agentId}`);
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    shortTermMessages: number;
    longTermFacts: number;
    oldestFact: Date | null;
    newestFact: Date | null;
  }> {
    const messages = await this.shortTermHistory.getMessages();

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
      shortTermMessages: messages.length,
      longTermFacts: parseInt(row.total || '0'),
      oldestFact: row.oldest ? new Date(row.oldest) : null,
      newestFact: row.newest ? new Date(row.newest) : null,
    };
  }
}

/**
 * Factory function to create a MemoryManager instance
 */
export function createMemoryManager(agentId: string, config?: Partial<MemoryManagerConfig>): MemoryManager {
  return new MemoryManager({
    agentId,
    ...config
  });
}
