/**
 * MEM0 SERVICE
 *
 * Shared fact ledger that enables agents to observe each other's discoveries.
 *
 * Key Concepts:
 * - Agents write facts about entities (projects, epics, features)
 * - Other agents subscribe to patterns and get notified
 * - Facts can supersede previous facts (living knowledge)
 * - All facts are timestamped and attributed to source agent
 *
 * Example Flow:
 * 1. PMO Agent discovers: Project X is 5 days late
 * 2. Writes fact: {entity: "project_x", attribute: "schedule_variance", value: -5}
 * 3. Governance Agent subscribed to "schedule_variance < -3"
 * 4. Governance Agent automatically receives notification
 * 5. Governance Agent triggers policy check
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { agentFacts, agentFactSubscriptions } from '../../shared/schema.js';
import type { InsertAgentFact, AgentFact } from '../../shared/schema.js';
import EventEmitter from 'events';

export interface Fact {
  id: string;
  entity: string; // "project_x", "epic_42", "feature_123"
  attribute: string; // "status", "cpi", "risk_score", "schedule_variance"
  value: any; // "delayed", 0.78, 8.5, -5
  sourceAgent: string; // "deep-pmo", "deep-finops"
  timestamp: Date;
  confidence: number; // 0-1
  supersedes?: string; // ID of fact this replaces
}

export interface FactFilter {
  entity?: string;
  attribute?: string;
  sourceAgent?: string;
  sinceTimestamp?: Date;
}

export class Mem0Service extends EventEmitter {
  private static instance: Mem0Service;

  private constructor() {
    super();
    // Increase max listeners to support 10+ agents subscribing to fact events
    this.setMaxListeners(20);
    console.log('[Mem0] Shared fact ledger initialized');
  }

  public static getInstance(): Mem0Service {
    if (!Mem0Service.instance) {
      Mem0Service.instance = new Mem0Service();
    }
    return Mem0Service.instance;
  }

  /**
   * Write a fact to the shared ledger
   * Other agents subscribed to this pattern will be notified
   */
  async writeFact(fact: Omit<Fact, 'id' | 'timestamp'>): Promise<Fact> {
    const result = await db.execute(sql`
      INSERT INTO agent_facts (
        entity, attribute, value, source_agent, confidence, supersedes
      ) VALUES (
        ${fact.entity},
        ${fact.attribute},
        ${JSON.stringify(fact.value)},
        ${fact.sourceAgent},
        ${fact.confidence?.toString() || '1.0'},
        ${fact.supersedes || null}
      )
      RETURNING id, entity, attribute, value, source_agent, confidence, supersedes, created_at
    `);

    const row = result.rows[0] as any;
    const createdFact: Fact = {
      id: row.id,
      entity: row.entity,
      attribute: row.attribute,
      value: JSON.parse(row.value),
      sourceAgent: row.source_agent,
      confidence: parseFloat(row.confidence),
      supersedes: row.supersedes,
      timestamp: new Date(row.created_at),
    };

    console.log(`[Mem0] Fact written: ${fact.entity}.${fact.attribute} = ${JSON.stringify(fact.value)} (by ${fact.sourceAgent})`);

    // Emit event for real-time subscriptions
    this.emit('fact:created', createdFact);
    this.emit(`fact:${fact.entity}`, createdFact);
    this.emit(`fact:${fact.entity}:${fact.attribute}`, createdFact);

    return createdFact;
  }

  /**
   * Observe facts matching a filter
   * Returns historical facts (not real-time)
   */
  async observeFacts(filter: FactFilter = {}): Promise<Fact[]> {
    const conditions: string[] = [];

    if (filter.entity) {
      conditions.push(`entity = '${filter.entity}'`);
    }

    if (filter.attribute) {
      conditions.push(`attribute = '${filter.attribute}'`);
    }

    if (filter.sourceAgent) {
      conditions.push(`source_agent = '${filter.sourceAgent}'`);
    }

    if (filter.sinceTimestamp) {
      conditions.push(`created_at >= '${filter.sinceTimestamp.toISOString()}'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.execute(sql`
      SELECT
        id, entity, attribute, value, source_agent,
        confidence, supersedes, created_at
      FROM agent_facts
      ${sql.raw(whereClause)}
      ORDER BY created_at DESC
      LIMIT 1000
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      entity: row.entity,
      attribute: row.attribute,
      value: JSON.parse(row.value),
      sourceAgent: row.source_agent,
      confidence: parseFloat(row.confidence),
      supersedes: row.supersedes,
      timestamp: new Date(row.created_at),
    }));
  }

  /**
   * Get current state of an entity (latest facts win)
   * Returns a consolidated view with most recent value for each attribute
   */
  async getEntityState(entity: string): Promise<Record<string, any>> {
    const result = await db.execute(sql`
      SELECT DISTINCT ON (attribute)
        attribute, value, source_agent, created_at
      FROM agent_facts
      WHERE entity = ${entity}
      ORDER BY attribute, created_at DESC
    `);

    const state: Record<string, any> = {};

    for (const row of result.rows as any[]) {
      state[row.attribute] = {
        value: JSON.parse(row.value),
        sourceAgent: row.source_agent,
        timestamp: new Date(row.created_at),
      };
    }

    return state;
  }

  /**
   * Subscribe to real-time fact changes matching a pattern
   * Pattern examples:
   * - "project_*" - All facts about any project
   * - "project_x:schedule_variance" - Specific attribute of specific entity
   * - "*:risk_score" - Specific attribute across all entities
   */
  subscribe(agentId: string, pattern: string, callback: (fact: Fact) => void): void {
    // Parse pattern
    const [entityPattern, attributePattern] = pattern.split(':');

    const handler = (fact: Fact) => {
      const entityMatches = this.matchesPattern(fact.entity, entityPattern || '*');
      const attributeMatches = attributePattern
        ? this.matchesPattern(fact.attribute, attributePattern)
        : true;

      if (entityMatches && attributeMatches) {
        callback(fact);
      }
    };

    this.on('fact:created', handler);

    // Store subscription in database
    db.execute(sql`
      INSERT INTO agent_fact_subscriptions (agent_id, pattern, active)
      VALUES (${agentId}, ${pattern}, true)
      ON CONFLICT DO NOTHING
    `).catch((error) => {
      console.error('[Mem0] Failed to store subscription:', error);
    });

    console.log(`[Mem0] ${agentId} subscribed to pattern: ${pattern}`);
  }

  /**
   * Unsubscribe from a pattern
   */
  unsubscribe(agentId: string, pattern: string): void {
    this.removeAllListeners(`subscription:${agentId}:${pattern}`);

    db.execute(sql`
      UPDATE agent_fact_subscriptions
      SET active = false
      WHERE agent_id = ${agentId} AND pattern = ${pattern}
    `).catch((error) => {
      console.error('[Mem0] Failed to update subscription:', error);
    });

    console.log(`[Mem0] ${agentId} unsubscribed from pattern: ${pattern}`);
  }

  /**
   * Get all subscriptions for an agent
   */
  async getSubscriptions(agentId: string): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT pattern
      FROM agent_fact_subscriptions
      WHERE agent_id = ${agentId} AND active = true
      ORDER BY created_at DESC
    `);

    return result.rows.map((row: any) => row.pattern);
  }

  /**
   * Get fact history for an entity
   */
  async getFactHistory(entity: string, attribute?: string): Promise<Fact[]> {
    const attributeFilter = attribute ? `AND attribute = '${attribute}'` : '';

    const result = await db.execute(sql`
      SELECT
        id, entity, attribute, value, source_agent,
        confidence, supersedes, created_at
      FROM agent_facts
      WHERE entity = ${entity}
      ${sql.raw(attributeFilter)}
      ORDER BY created_at DESC
      LIMIT 100
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      entity: row.entity,
      attribute: row.attribute,
      value: JSON.parse(row.value),
      sourceAgent: row.source_agent,
      confidence: parseFloat(row.confidence),
      supersedes: row.supersedes,
      timestamp: new Date(row.created_at),
    }));
  }

  /**
   * Simple pattern matching (supports * wildcard)
   */
  private matchesPattern(value: string, pattern: string): boolean {
    if (pattern === '*') return true;

    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(value);
  }

  /**
   * Get statistics about facts in the system
   */
  async getStatistics(): Promise<{
    totalFacts: number;
    uniqueEntities: number;
    uniqueAttributes: number;
    factsByAgent: Record<string, number>;
  }> {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_facts,
        COUNT(DISTINCT entity) as unique_entities,
        COUNT(DISTINCT attribute) as unique_attributes
      FROM agent_facts
    `);

    const agentResult = await db.execute(sql`
      SELECT source_agent, COUNT(*) as count
      FROM agent_facts
      GROUP BY source_agent
      ORDER BY count DESC
    `);

    const factsByAgent: Record<string, number> = {};
    for (const row of agentResult.rows as any[]) {
      factsByAgent[row.source_agent] = parseInt(row.count);
    }

    return {
      totalFacts: parseInt((result.rows[0] as any).total_facts),
      uniqueEntities: parseInt((result.rows[0] as any).unique_entities),
      uniqueAttributes: parseInt((result.rows[0] as any).unique_attributes),
      factsByAgent,
    };
  }
}

// Singleton instance
export function getMem0Service(): Mem0Service {
  return Mem0Service.getInstance();
}
