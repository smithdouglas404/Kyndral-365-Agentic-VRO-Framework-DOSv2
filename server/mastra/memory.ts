/**
 * MASTRA MEMORY INTEGRATION
 *
 * Integrates Mem0 (shared facts) and Letta (agent memory) with Mastra agents.
 * Provides unified memory access for AI agents via Mastra's memory interface.
 */

import { getMem0Service, type Fact, type FactFilter } from '../lib/Mem0Service.js';
import { createAgentMemory, type LettaAgentMemory } from '../lib/LettaAgentMemory.js';
import { createMemoryManager, type MemoryManager } from '../lib/MemoryManager.js';
import type { IStorage } from '../storage.js';

/**
 * Agent memory context - combines all memory sources
 */
export interface AgentMemoryContext {
  // From Mem0 - shared facts
  entityFacts: Fact[];
  entityState: Record<string, any>;
  relatedFacts: Fact[];

  // From Letta - personal memory
  persona: string;
  learnedFacts: Record<string, any>;
  currentContext: string;
  archivalMemory: string[];

  // From Conversation Memory
  recentMessages: string[];
  semanticKnowledge: string[];
}

/**
 * Mastra Memory Provider
 *
 * Provides unified memory access for Mastra agents by combining:
 * - Mem0 (inter-agent shared facts)
 * - Letta (per-agent working/archival memory)
 * - Conversation Memory (session context)
 */
export class MastraMemoryProvider {
  private agentId: string;
  private mem0 = getMem0Service();
  private lettaMemory: LettaAgentMemory;
  private conversationMemory: MemoryManager;
  private initialized = false;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.lettaMemory = createAgentMemory(agentId);
    this.conversationMemory = createMemoryManager(agentId);
  }

  /**
   * Initialize memory systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.lettaMemory.initialize();
      this.initialized = true;
      console.log(`[MastraMemory] Initialized for agent: ${this.agentId}`);
    } catch (error: any) {
      console.error(`[MastraMemory] Failed to initialize for ${this.agentId}:`, error.message);
    }
  }

  /**
   * Get full memory context for a goal/task
   */
  async getContextForGoal(goal: string, entityId?: string): Promise<AgentMemoryContext> {
    await this.initialize();

    // Get entity facts from Mem0
    let entityFacts: Fact[] = [];
    let entityState: Record<string, any> = {};

    if (entityId) {
      entityFacts = await this.mem0.observeFacts({ entity: entityId });
      entityState = await this.mem0.getEntityState(entityId);
    }

    // Search for related facts semantically
    let relatedFacts: Fact[] = [];
    try {
      relatedFacts = await this.mem0.searchSemanticFacts(goal, 5);
    } catch (error: any) {
      console.warn(`[MastraMemory] Semantic search failed:`, error.message);
    }

    // Get Letta core memory
    const coreMemory = await this.lettaMemory.getCore();

    // Search archival memory
    let archivalMemory: string[] = [];
    try {
      const archivalResults = await this.lettaMemory.searchArchive(goal, 5);
      archivalMemory = archivalResults.map((r) => r.content);
    } catch (error: any) {
      console.warn(`[MastraMemory] Archival search failed:`, error.message);
    }

    // Get conversation context
    let recentMessages: string[] = [];
    let semanticKnowledge: string[] = [];
    try {
      const convContext = await this.conversationMemory.getContextForThought(goal);
      recentMessages = convContext.recentMessages
        ? convContext.recentMessages.split('\n').filter(Boolean)
        : [];
      semanticKnowledge = convContext.semanticKnowledge
        ? convContext.semanticKnowledge.split('\n').filter(Boolean)
        : [];
    } catch (error: any) {
      console.warn(`[MastraMemory] Conversation context failed:`, error.message);
    }

    return {
      entityFacts,
      entityState,
      relatedFacts,
      persona: coreMemory.persona || '',
      learnedFacts: coreMemory.learnedFacts || {},
      currentContext: coreMemory.currentContext || '',
      archivalMemory,
      recentMessages,
      semanticKnowledge,
    };
  }

  /**
   * Format memory context as a prompt section
   */
  formatContextForPrompt(context: AgentMemoryContext): string {
    const sections: string[] = [];

    // Entity state
    if (Object.keys(context.entityState).length > 0) {
      sections.push(`## Current Entity State\n${JSON.stringify(context.entityState, null, 2)}`);
    }

    // Recent facts
    if (context.entityFacts.length > 0) {
      const recentFacts = context.entityFacts.slice(-5).map(
        (f) => `- ${f.entity}.${f.attribute} = ${JSON.stringify(f.value)} (by ${f.sourceAgent}, confidence: ${f.confidence})`
      );
      sections.push(`## Recent Facts\n${recentFacts.join('\n')}`);
    }

    // Learned facts
    if (Object.keys(context.learnedFacts).length > 0) {
      sections.push(`## What I've Learned\n${JSON.stringify(context.learnedFacts, null, 2)}`);
    }

    // Related knowledge
    if (context.relatedFacts.length > 0) {
      const related = context.relatedFacts.map(
        (f) => `- ${f.entity}: ${f.attribute} = ${JSON.stringify(f.value)}`
      );
      sections.push(`## Related Knowledge\n${related.join('\n')}`);
    }

    // Archival memory
    if (context.archivalMemory.length > 0) {
      sections.push(`## From My Archives\n${context.archivalMemory.join('\n')}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Write a fact to the shared Mem0 ledger
   */
  async broadcastFact(
    entity: string,
    attribute: string,
    value: any,
    confidence: number = 1.0
  ): Promise<void> {
    await this.mem0.writeFact({
      entity,
      attribute,
      value,
      sourceAgent: this.agentId,
      confidence,
    });
    console.log(`[MastraMemory] ${this.agentId} broadcast: ${entity}.${attribute}`);
  }

  /**
   * Learn a fact (store in personal memory)
   */
  async learn(key: string, value: any): Promise<void> {
    await this.initialize();
    await this.lettaMemory.learn(key, value);
  }

  /**
   * Recall a learned fact
   */
  async recall(key: string): Promise<any> {
    await this.initialize();
    return await this.lettaMemory.recall(key);
  }

  /**
   * Archive context for future reference
   */
  async archive(content: string, metadata?: Record<string, any>): Promise<void> {
    await this.initialize();
    await this.lettaMemory.archive(content, metadata);
  }

  /**
   * Record an interaction in conversation memory
   */
  async recordInteraction(role: 'user' | 'agent', content: string): Promise<void> {
    await this.conversationMemory.recordInteraction(role, content);
  }

  /**
   * Check if we've recently handled something (prevent duplicates)
   */
  async hasRecentFact(
    entity: string,
    attribute: string,
    withinHours: number = 24
  ): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - withinHours * 60 * 60 * 1000);
    const recentFacts = await this.mem0.observeFacts({
      entity,
      attribute,
      sinceTimestamp: cutoffTime,
    });
    return recentFacts.length > 0;
  }

  /**
   * Get facts for an entity
   */
  async getEntityFacts(entityId: string): Promise<Fact[]> {
    return await this.mem0.observeFacts({ entity: entityId });
  }

  /**
   * Search facts semantically
   */
  async searchFacts(query: string, limit: number = 5): Promise<Fact[]> {
    return await this.mem0.searchSemanticFacts(query, limit);
  }
}

// Cache of memory providers per agent
const memoryProviders = new Map<string, MastraMemoryProvider>();

/**
 * Get or create memory provider for an agent
 */
export function getMastraMemory(agentId: string): MastraMemoryProvider {
  if (!memoryProviders.has(agentId)) {
    memoryProviders.set(agentId, new MastraMemoryProvider(agentId));
  }
  return memoryProviders.get(agentId)!;
}

/**
 * Create memory-aware context for tool execution
 */
export async function createToolContext(
  agentId: string,
  goal: string,
  entityId?: string
): Promise<{
  memory: MastraMemoryProvider;
  context: AgentMemoryContext;
  contextPrompt: string;
}> {
  const memory = getMastraMemory(agentId);
  const context = await memory.getContextForGoal(goal, entityId);
  const contextPrompt = memory.formatContextForPrompt(context);

  return { memory, context, contextPrompt };
}
