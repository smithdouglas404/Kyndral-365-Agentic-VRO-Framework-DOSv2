/**
 * AGENT COLLABORATION RULES ENGINE
 *
 * Dynamic, configurable rules for inter-agent collaboration.
 * Uses json-rules-engine for flexible rule definition.
 *
 * Three Types of Collaboration:
 * 1. **Rule-Based** - User-defined explicit rules (this file)
 * 2. **AI-Driven** - LLM decides when to collaborate based on context
 * 3. **Pattern-Based** - System learns from successful collaborations
 *
 * Why Both Rules AND AI?
 * - Rules: For business logic that MUST always fire (compliance, escalations)
 * - AI: For nuanced decisions (Does this budget overrun warrant TMO involvement?)
 * - Patterns: For continuous improvement (Risk + FinOps collaboration reduced issues by 30%)
 */

import { Engine, Rule } from 'json-rules-engine';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface CollaborationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // 1-10, higher = runs first
  sourceAgent: string; // Agent that triggers the rule
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  executionCount?: number;
  lastExecuted?: Date;
}

export interface RuleCondition {
  fact: string; // e.g., 'cpi', 'risk_score', 'budget_variance'
  operator: 'equal' | 'notEqual' | 'lessThan' | 'lessThanInclusive' | 'greaterThan' | 'greaterThanInclusive' | 'in' | 'notIn' | 'contains' | 'doesNotContain';
  value: any;
  path?: string; // JSONPath for nested facts
}

export interface RuleAction {
  type: 'notify_agent' | 'send_email' | 'create_task' | 'escalate' | 'attach_document' | 'trigger_workflow';
  targetAgent?: string;
  targetUser?: string;
  parameters?: Record<string, any>;
}

export interface RuleFacts {
  agentId: string;
  userId: string;
  projectId?: string;

  // Financial facts
  cpi?: number; // Cost Performance Index
  spi?: number; // Schedule Performance Index
  budget_variance?: number;
  cost_overrun?: number;

  // Risk facts
  risk_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  open_issues_count?: number;

  // Schedule facts
  schedule_variance?: number;
  days_behind?: number;
  milestone_at_risk?: boolean;

  // Value facts
  value_realization?: number;
  benefits_achieved?: number;
  roi?: number;

  // Governance facts
  compliance_violations?: number;
  approval_pending?: boolean;

  // Context
  severity?: 'low' | 'medium' | 'high' | 'critical';
  event_type?: string;
  metadata?: Record<string, any>;
}

export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  actions: Array<{
    type: string;
    targetAgent?: string;
    executed: boolean;
    error?: string;
  }>;
  executionTime: number;
}

// ============================================================================
// COLLABORATION RULES ENGINE
// ============================================================================

export class AgentCollaborationRulesEngine {
  private engine: Engine;
  private rules: Map<string, CollaborationRule> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.engine = new Engine();
  }

  /**
   * Initialize engine - load rules from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[RulesEngine] Initializing...');

    // Table is created by Drizzle migrations (shared/schema.ts)
    await this.loadRules();

    this.initialized = true;
    console.log(`[RulesEngine] Initialized with ${this.rules.size} rules`);
  }

  /**
   * Load rules from database
   */
  async loadRules(): Promise<void> {
    const result = await db.execute(sql`
      SELECT * FROM agent_collaboration_rules
      WHERE enabled = true
      ORDER BY priority DESC
    `);

    this.rules.clear();
    this.engine.removeAllRules();

    for (const row of result.rows as any[]) {
      const rule: CollaborationRule = {
        id: row.id,
        name: row.name,
        description: row.description,
        enabled: row.enabled,
        priority: row.priority,
        sourceAgent: row.source_agent,
        conditions: JSON.parse(row.conditions),
        actions: JSON.parse(row.actions),
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        executionCount: row.execution_count || 0,
        lastExecuted: row.last_executed ? new Date(row.last_executed) : undefined,
      };

      this.rules.set(rule.id, rule);

      // Add to json-rules-engine
      const engineRule = this.convertToEngineRule(rule);
      this.engine.addRule(engineRule);

      console.log(`[RulesEngine] Loaded rule: ${rule.name}`);
    }
  }

  /**
   * Convert CollaborationRule to json-rules-engine Rule
   */
  private convertToEngineRule(rule: CollaborationRule): Rule {
    return new Rule({
      conditions: {
        all: rule.conditions.map((condition) => ({
          fact: condition.fact,
          operator: condition.operator,
          value: condition.value,
          path: condition.path,
        })),
      },
      event: {
        type: 'collaboration-trigger',
        params: {
          ruleId: rule.id,
          ruleName: rule.name,
          sourceAgent: rule.sourceAgent,
          actions: rule.actions,
        },
      },
      priority: rule.priority,
    });
  }

  /**
   * Evaluate rules for given facts
   * Returns list of actions to execute
   */
  async evaluateRules(facts: RuleFacts): Promise<RuleExecutionResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    console.log(`[RulesEngine] Evaluating rules for agent: ${facts.agentId}`);

    try {
      const { events } = await this.engine.run(facts);

      const results: RuleExecutionResult[] = [];

      for (const event of events) {
        const { ruleId, ruleName, actions } = event.params as any;

        const actionResults = [];

        for (const action of actions) {
          try {
            await this.executeAction(action, facts);
            actionResults.push({
              type: action.type,
              targetAgent: action.targetAgent,
              executed: true,
            });
          } catch (error: any) {
            console.error(`[RulesEngine] Action failed: ${action.type}`, error);
            actionResults.push({
              type: action.type,
              targetAgent: action.targetAgent,
              executed: false,
              error: error.message,
            });
          }
        }

        // Update execution stats
        await this.recordExecution(ruleId);

        results.push({
          ruleId,
          ruleName,
          triggered: true,
          actions: actionResults,
          executionTime: Date.now() - startTime,
        });

        console.log(`[RulesEngine] Rule triggered: ${ruleName}`);
      }

      return results;
    } catch (error) {
      console.error('[RulesEngine] Evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Execute rule action
   */
  private async executeAction(action: RuleAction, facts: RuleFacts): Promise<void> {
    switch (action.type) {
      case 'notify_agent':
        if (action.targetAgent) {
          // Send message to target agent via A2A message bus
          console.log(`[RulesEngine] Notifying agent: ${action.targetAgent}`);
          // Implementation would call A2AMessageBus here
        }
        break;

      case 'send_email':
        if (action.targetUser || facts.userId) {
          console.log(`[RulesEngine] Sending email to: ${action.targetUser || facts.userId}`);
          // Implementation would call NotificationService here
        }
        break;

      case 'escalate':
        if (action.targetAgent) {
          console.log(`[RulesEngine] Escalating from ${facts.agentId} to ${action.targetAgent}`);
          // Implementation would escalate via orchestrator
        }
        break;

      case 'attach_document':
        console.log(`[RulesEngine] Attaching document: ${action.parameters?.documentId}`);
        // Implementation would fetch from knowledge base
        break;

      case 'create_task':
        console.log(`[RulesEngine] Creating task for project: ${facts.projectId}`);
        // Implementation would create task via API
        break;

      case 'trigger_workflow':
        console.log(`[RulesEngine] Triggering workflow: ${action.parameters?.workflowId}`);
        // Implementation would trigger workflow engine
        break;

      default:
        console.warn(`[RulesEngine] Unknown action type: ${action.type}`);
    }
  }

  /**
   * Record rule execution
   */
  private async recordExecution(ruleId: string): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE agent_collaboration_rules
        SET
          execution_count = execution_count + 1,
          last_executed = NOW()
        WHERE id = ${ruleId}
      `);
    } catch (error) {
      console.error('[RulesEngine] Failed to record execution:', error);
    }
  }

  /**
   * Create new rule
   */
  async createRule(rule: Omit<CollaborationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CollaborationRule> {
    const result = await db.execute(sql`
      INSERT INTO agent_collaboration_rules (
        name, description, enabled, priority, source_agent, conditions, actions, created_by
      )
      VALUES (
        ${rule.name},
        ${rule.description},
        ${rule.enabled},
        ${rule.priority},
        ${rule.sourceAgent},
        ${JSON.stringify(rule.conditions)},
        ${JSON.stringify(rule.actions)},
        ${rule.createdBy}
      )
      RETURNING *
    `);

    const row = result.rows[0] as any;

    const newRule: CollaborationRule = {
      id: row.id,
      name: row.name,
      description: row.description,
      enabled: row.enabled,
      priority: row.priority,
      sourceAgent: row.source_agent,
      conditions: JSON.parse(row.conditions),
      actions: JSON.parse(row.actions),
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    // Reload rules
    await this.loadRules();

    console.log(`[RulesEngine] Created rule: ${newRule.name}`);

    return newRule;
  }

  /**
   * Update rule
   */
  async updateRule(ruleId: string, updates: Partial<CollaborationRule>): Promise<void> {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(updates.description);
    }

    if (updates.enabled !== undefined) {
      updateFields.push(`enabled = $${paramIndex++}`);
      params.push(updates.enabled);
    }

    if (updates.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`);
      params.push(updates.priority);
    }

    if (updates.conditions !== undefined) {
      updateFields.push(`conditions = $${paramIndex++}`);
      params.push(JSON.stringify(updates.conditions));
    }

    if (updates.actions !== undefined) {
      updateFields.push(`actions = $${paramIndex++}`);
      params.push(JSON.stringify(updates.actions));
    }

    updateFields.push(`updated_at = NOW()`);

    params.push(ruleId);

    await db.execute(sql.raw(`
      UPDATE agent_collaboration_rules
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `), params);

    // Reload rules
    await this.loadRules();

    console.log(`[RulesEngine] Updated rule: ${ruleId}`);
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    await db.execute(sql`
      DELETE FROM agent_collaboration_rules WHERE id = ${ruleId}
    `);

    // Reload rules
    await this.loadRules();

    console.log(`[RulesEngine] Deleted rule: ${ruleId}`);
  }

  /**
   * Get all rules
   */
  async getAllRules(): Promise<CollaborationRule[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  async getRule(ruleId: string): Promise<CollaborationRule | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.rules.get(ruleId) || null;
  }

}

/**
 * Singleton instance
 */
let rulesEngineInstance: AgentCollaborationRulesEngine | null = null;

export function getAgentCollaborationRulesEngine(): AgentCollaborationRulesEngine {
  if (!rulesEngineInstance) {
    rulesEngineInstance = new AgentCollaborationRulesEngine();
  }
  return rulesEngineInstance;
}
