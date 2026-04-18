/**
 * LETTA AGENT MEMORY
 *
 * Per-agent self-editing memory system.
 *
 * Core Memory: Small, editable facts the agent "knows" (like working memory)
 * Archival Memory: Long-term storage the agent can search (like long-term memory)
 *
 * Key Concepts:
 * - Each agent has its own private memory
 * - Agents can edit their own core memory (persona, policies, learned facts)
 * - Agents can archive facts for later retrieval
 * - Agents can search their own archives
 *
 * Example:
 * - PMO Agent detects Project X is late
 * - Writes to core memory: "I triggered an audit on Project X"
 * - Archives the full context: "Project X was 5 days late, triggered audit on 2026-01-25"
 * - Next time PMO analyzes Project X, it can search archive and see history
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import {
  agentCoreMemory,
  agentArchivalMemory,
  type InsertAgentCoreMemory,
  type InsertAgentArchivalMemory,
} from '../../shared/schema.js';

export interface CoreMemory {
  persona: string; // "I am the FinOps agent responsible for budget oversight..."
  policies: string[]; // Active policies agent enforces
  learnedFacts: Record<string, any>; // Agent-discovered truths
  currentContext: string; // What agent is currently working on
  pendingActions: string[]; // Actions agent plans to take
}

export interface ArchivalEntry {
  id: string;
  content: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export class LettaAgentMemory {
  private agentId: string;
  private coreCache: CoreMemory | null = null;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  /**
   * Safely parse JSON with fallback to default value
   * Handles: string JSON, already-parsed objects, null/undefined, corrupted data
   */
  private safeParseJSON(value: any, fallback: any, fieldName: string): any {
    // Null or undefined
    if (value === null || value === undefined) return fallback;
    
    // Already an object or array (Drizzle may auto-deserialize)
    if (typeof value === 'object') {
      // Check for valid structure
      if (Array.isArray(value)) return value;
      if (Object.keys(value).length > 0 || fieldName === 'learned_facts') return value;
      return fallback;
    }
    
    // Empty string
    if (value === '') return fallback;
    
    // String that needs parsing
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed;
      } catch (error) {
        // Corrupted data - log warning but don't spam console
        console.warn(`[Letta] ${this.agentId} ${fieldName} had invalid data, resetting to default`);
        return fallback;
      }
    }
    
    return fallback;
  }

  /**
   * Initialize core memory for agent (if not exists)
   */
  async initialize(persona: string): Promise<void> {
    const result = await db.execute(sql`
      INSERT INTO agent_core_memory (
        agent_id, persona, policies, learned_facts, current_context, pending_actions
      ) VALUES (
        ${this.agentId},
        ${persona},
        '[]',
        '{}',
        '',
        '[]'
      )
      ON CONFLICT (agent_id) DO NOTHING
      RETURNING agent_id
    `);

    if (result.rows.length > 0) {
      console.log(`[Letta] Initialized core memory for ${this.agentId}`);
    }
  }

  /**
   * Get core memory (loads from cache or database)
   */
  async getCore(): Promise<CoreMemory> {
    if (this.coreCache) {
      return this.coreCache;
    }

    const result = await db.execute(sql`
      SELECT persona, policies, learned_facts, current_context, pending_actions
      FROM agent_core_memory
      WHERE agent_id = ${this.agentId}
    `);

    if (result.rows.length === 0) {
      // Initialize with defaults. Cache an in-memory default immediately to
      // avoid infinite recursion when the underlying store is a no-op stub
      // (Postgres removed) — initialize() may not actually persist anything.
      this.coreCache = {
        persona: `I am the ${this.agentId} agent.`,
        policies: [],
        learnedFacts: {},
        currentContext: '',
        pendingActions: [],
      };
      try {
        await this.initialize(`I am the ${this.agentId} agent.`);
      } catch {
        // best-effort; cache already populated
      }
      return this.coreCache;
    }

    const row = result.rows[0] as any;

    this.coreCache = {
      persona: row.persona || '',
      policies: this.safeParseJSON(row.policies, [], 'policies'),
      learnedFacts: this.safeParseJSON(row.learned_facts, {}, 'learned_facts'),
      currentContext: row.current_context || '',
      pendingActions: this.safeParseJSON(row.pending_actions, [], 'pending_actions'),
    };

    return this.coreCache;
  }

  /**
   * Edit core memory field
   * Agent can modify its own "brain"
   */
  async editCore(field: keyof CoreMemory, value: any): Promise<void> {
    const core = await this.getCore();
    (core as any)[field] = value;

    // Serialize to JSON if needed
    let dbValue: string;
    if (typeof value === 'string') {
      dbValue = value;
    } else {
      dbValue = JSON.stringify(value);
    }

    const columnName = this.camelToSnake(field);

    await db.execute(sql`
      UPDATE agent_core_memory
      SET ${sql.raw(columnName)} = ${dbValue}
      WHERE agent_id = ${this.agentId}
    `);

    // Update cache
    this.coreCache = core;

    console.log(`[Letta] ${this.agentId} updated core memory: ${field}`);
  }

  /**
   * Append to current context
   */
  async appendContext(text: string): Promise<void> {
    const core = await this.getCore();
    const newContext = core.currentContext
      ? `${core.currentContext}\n${text}`
      : text;

    await this.editCore('currentContext', newContext);
  }

  /**
   * Clear current context
   */
  async clearContext(): Promise<void> {
    await this.editCore('currentContext', '');
  }

  /**
   * Learn a fact (add to learned_facts)
   */
  async learn(key: string, value: any): Promise<void> {
    const core = await this.getCore();
    core.learnedFacts[key] = {
      value,
      learnedAt: new Date().toISOString(),
    };

    await this.editCore('learnedFacts', core.learnedFacts);
  }

  /**
   * Recall a learned fact
   */
  async recall(key: string): Promise<any | null> {
    const core = await this.getCore();
    return core.learnedFacts[key]?.value || null;
  }

  /**
   * Add a policy
   */
  async addPolicy(policy: string): Promise<void> {
    const core = await this.getCore();

    if (!core.policies.includes(policy)) {
      core.policies.push(policy);
      await this.editCore('policies', core.policies);
    }
  }

  /**
   * Remove a policy
   */
  async removePolicy(policy: string): Promise<void> {
    const core = await this.getCore();
    core.policies = core.policies.filter((p) => p !== policy);
    await this.editCore('policies', core.policies);
  }

  /**
   * Add a pending action
   */
  async addPendingAction(action: string): Promise<void> {
    const core = await this.getCore();
    core.pendingActions.push(action);
    await this.editCore('pendingActions', core.pendingActions);
  }

  /**
   * Complete a pending action
   */
  async completePendingAction(action: string): Promise<void> {
    const core = await this.getCore();
    core.pendingActions = core.pendingActions.filter((a) => a !== action);
    await this.editCore('pendingActions', core.pendingActions);
  }

  /**
   * Archive a fact for long-term storage
   */
  async archive(content: string, metadata: Record<string, any> = {}): Promise<string> {
    const result = await db.execute(sql`
      INSERT INTO agent_archival_memory (agent_id, content, metadata)
      VALUES (
        ${this.agentId},
        ${content},
        ${JSON.stringify(metadata)}
      )
      RETURNING id
    `);

    const id = (result.rows[0] as any).id;

    console.log(`[Letta] ${this.agentId} archived: ${content.substring(0, 50)}...`);

    return id;
  }

  /**
   * Search archival memory
   * Simple text search (can be enhanced with vector search later)
   */
  async searchArchive(query: string, limit: number = 10): Promise<ArchivalEntry[]> {
    const result = await db.execute(sql`
      SELECT id, content, metadata, created_at
      FROM agent_archival_memory
      WHERE agent_id = ${this.agentId}
        AND content ILIKE ${`%${query}%`}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: this.safeParseJSON(row.metadata, {}, `metadata for archive ${row.id}`),
      timestamp: new Date(row.created_at),
    }));
  }

  /**
   * Get recent archival entries
   */
  async getRecentArchives(limit: number = 20): Promise<ArchivalEntry[]> {
    const result = await db.execute(sql`
      SELECT id, content, metadata, created_at
      FROM agent_archival_memory
      WHERE agent_id = ${this.agentId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: this.safeParseJSON(row.metadata, {}, `metadata for archive ${row.id}`),
      timestamp: new Date(row.created_at),
    }));
  }

  /**
   * Get archival statistics
   */
  async getArchiveStats(): Promise<{
    totalEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM agent_archival_memory
      WHERE agent_id = ${this.agentId}
    `);

    const row = result.rows[0] as any;

    return {
      totalEntries: parseInt(row.total || '0'),
      oldestEntry: row.oldest ? new Date(row.oldest) : null,
      newestEntry: row.newest ? new Date(row.newest) : null,
    };
  }

  /**
   * Clear all archived memories (dangerous!)
   */
  async clearArchive(): Promise<void> {
    await db.execute(sql`
      DELETE FROM agent_archival_memory
      WHERE agent_id = ${this.agentId}
    `);

    console.log(`[Letta] ${this.agentId} archive cleared`);
  }

  /**
   * Export memory for backup
   */
  async exportMemory(): Promise<{
    core: CoreMemory;
    archives: ArchivalEntry[];
  }> {
    const core = await this.getCore();
    const archives = await this.getRecentArchives(1000);

    return { core, archives };
  }

  /**
   * Helper: Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

/**
 * Factory function to create agent memory
 */
export function createAgentMemory(agentId: string): LettaAgentMemory {
  return new LettaAgentMemory(agentId);
}
