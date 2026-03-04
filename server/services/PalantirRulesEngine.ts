/**
 * PALANTIR RULES ENGINE
 *
 * SOURCE OF TRUTH: PALANTIR FOUNDRY
 *
 * Integrates the Governance Rules Engine with Palantir:
 * - Rules stored as Intervention objects with category="rule"
 * - Rule executions logged to Palantir for audit
 * - LLM-powered rule evaluation via PalantirLLMBridge
 *
 * Combines:
 * - Database rules (from companyRules table)
 * - Palantir rules (Intervention category=rule)
 * - LLM semantic evaluation
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { getPalantirLLMBridge } from './PalantirLLMBridge.js';
import { getPalantirApprovalService } from './PalantirApprovalService.js';
import { db } from '../db.js';
import { companyRules, ruleExecutions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { PALANTIR_OBJECT_TYPES, PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

export interface RuleContext {
  entityType: 'project' | 'epic' | 'feature' | 'story' | 'budget' | 'resource' | string;
  entityId: string;
  entityData: any;
  operation: 'create' | 'update' | 'delete';
  userId?: string;
  companyId: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: string;
  ruleLogic: {
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions: Array<{
      type: 'block' | 'require_approval' | 'warn' | 'allow';
      message?: string;
      approver?: string;
    }>;
    applicableEntities?: string[];
    applicableOperations?: string[];
  };
  enforcementLevel: 'mandatory' | 'advisory';
  isActive: boolean;
  source: 'postgres' | 'palantir' | 'llm';
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  action: 'block' | 'require_approval' | 'warn' | 'allow';
  message: string;
  requiredApprover?: string;
  confidence?: number;
  source: 'database' | 'palantir' | 'llm';
  metadata?: any;
}

export interface EnforcementResult {
  allowed: boolean;
  requiresApproval: boolean;
  approvalRequestId?: string;
  blockedBy?: RuleEvaluationResult[];
  warnings?: RuleEvaluationResult[];
  evaluations?: RuleEvaluationResult[];
}

class PalantirRulesEngine {
  private palantirService = getPalantirService();
  private llmBridge: any = null;
  private approvalService = getPalantirApprovalService();

  /**
   * Get LLM bridge (lazy loaded)
   */
  private async getLLMBridge() {
    if (!this.llmBridge) {
      this.llmBridge = await getPalantirLLMBridge();
    }
    return this.llmBridge;
  }

  /**
   * Get all active rules from both Palantir and PostgreSQL
   */
  async getRules(companyId: string): Promise<Rule[]> {
    const rules: Rule[] = [];

    // 1. Get rules from PostgreSQL
    try {
      const dbRules = await db
        .select()
        .from(companyRules)
        .where(
          and(
            eq(companyRules.companyId, companyId),
            eq(companyRules.isActive, true)
          )
        );

      for (const rule of dbRules) {
        rules.push({
          id: rule.id,
          name: rule.ruleName || 'Unnamed Rule',
          description: rule.ruleDescription || '',
          category: rule.ruleCategory || 'general',
          ruleLogic: rule.ruleLogic as any || { conditions: [], actions: [] },
          enforcementLevel: (rule.enforcementLevel as any) || 'advisory',
          isActive: rule.isActive ?? true,
          source: 'postgres',
        });
      }
    } catch (error: any) {
      console.warn('[PalantirRules] Failed to get PostgreSQL rules:', error.message);
    }

    // 2. Get rules from Palantir (Intervention with category=rule)
    try {
      if (this.palantirService) {
        const result = await this.palantirService.listObjects(PALANTIR_OBJECT_TYPES.INTERVENTION, { pageSize: 100 });
        const palantirRules = (result.data || []).filter((item: any) =>
          item.category === 'rule' && item.status !== 'inactive'
        );

        for (const pRule of palantirRules) {
          rules.push({
            id: pRule.insight_id || pRule.id,
            name: pRule.title || 'Palantir Rule',
            description: pRule.description || '',
            category: pRule.insight_type || 'governance',
            ruleLogic: this.parseRuleLogic(pRule),
            enforcementLevel: pRule.severity === 'critical' ? 'mandatory' : 'advisory',
            isActive: true,
            source: 'palantir',
          });
        }
      }
    } catch (error: any) {
      console.warn('[PalantirRules] Failed to get Palantir rules:', error.message);
    }

    return rules;
  }

  /**
   * Parse rule logic from Palantir insight
   */
  private parseRuleLogic(insight: any): Rule['ruleLogic'] {
    try {
      // If metadata contains rule logic, use it
      if (insight.metadata) {
        const meta = typeof insight.metadata === 'string'
          ? JSON.parse(insight.metadata)
          : insight.metadata;

        if (meta.conditions && meta.actions) {
          return meta;
        }
      }

      // Otherwise, create a natural language rule for LLM evaluation
      return {
        conditions: [{ field: 'natural_language', operator: 'llm_eval', value: insight.description }],
        actions: [{ type: 'warn', message: insight.description }],
      };
    } catch {
      return { conditions: [], actions: [] };
    }
  }

  /**
   * Enforce all applicable rules for an entity operation
   */
  async enforceRules(context: RuleContext): Promise<EnforcementResult> {
    console.log(`[PalantirRules] Evaluating rules for ${context.entityType} ${context.entityId} (${context.operation})`);

    // 1. Get all active rules
    const rules = await this.getRules(context.companyId);

    if (rules.length === 0) {
      console.log('[PalantirRules] No active rules found');
      return { allowed: true, requiresApproval: false, evaluations: [] };
    }

    // 2. Filter applicable rules
    const applicableRules = rules.filter(rule => this.isRuleApplicable(rule, context));
    console.log(`[PalantirRules] Found ${applicableRules.length} applicable rules`);

    // 3. Evaluate each rule
    const evaluations: RuleEvaluationResult[] = [];

    for (const rule of applicableRules) {
      const result = await this.evaluateRule(rule, context);
      evaluations.push(result);

      // Log to Palantir audit trail
      await this.logRuleExecution(rule, context, result);
    }

    // 4. Also run LLM semantic evaluation for additional governance
    try {
      const llmResult = await this.evaluateWithLLM(context);
      if (llmResult) {
        evaluations.push(llmResult);
      }
    } catch (error: any) {
      console.warn('[PalantirRules] LLM evaluation failed:', error.message);
    }

    // 5. Determine overall enforcement decision
    const blocked = evaluations.filter(e => !e.passed && e.action === 'block');
    const requireApproval = evaluations.filter(e => !e.passed && e.action === 'require_approval');
    const warnings = evaluations.filter(e => !e.passed && e.action === 'warn');

    // If any rule blocks, operation is denied
    if (blocked.length > 0) {
      console.log(`[PalantirRules] Operation BLOCKED by ${blocked.length} rules`);
      return {
        allowed: false,
        requiresApproval: false,
        blockedBy: blocked,
        evaluations,
      };
    }

    // If any rule requires approval, create approval request
    if (requireApproval.length > 0) {
      console.log(`[PalantirRules] Operation requires approval (${requireApproval.length} rules)`);

      const { id: approvalRequestId } = await this.approvalService.createApprovalRequest({
        type: 'rule_enforcement',
        entityType: context.entityType,
        entityId: context.entityId,
        title: `Approval Required: ${context.operation} ${context.entityType}`,
        description: requireApproval.map(r => r.message).join('; '),
        requestedBy: context.userId,
        metadata: {
          triggeredRules: requireApproval.map(r => ({
            ruleId: r.ruleId,
            ruleName: r.ruleName,
            message: r.message,
          })),
          operation: context.operation,
          entityData: context.entityData,
        },
      });

      return {
        allowed: false,
        requiresApproval: true,
        approvalRequestId,
        warnings,
        evaluations,
      };
    }

    console.log(`[PalantirRules] Operation ALLOWED with ${warnings.length} warnings`);
    return {
      allowed: true,
      requiresApproval: false,
      warnings,
      evaluations,
    };
  }

  /**
   * Check if a rule applies to this context
   */
  private isRuleApplicable(rule: Rule, context: RuleContext): boolean {
    const logic = rule.ruleLogic;

    if (logic.applicableEntities && !logic.applicableEntities.includes(context.entityType)) {
      return false;
    }

    if (logic.applicableOperations && !logic.applicableOperations.includes(context.operation)) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(rule: Rule, context: RuleContext): Promise<RuleEvaluationResult> {
    try {
      const logic = rule.ruleLogic;

      // Check for LLM evaluation
      if (logic.conditions.some(c => c.operator === 'llm_eval')) {
        return this.evaluateWithLLMRule(rule, context);
      }

      // Standard condition evaluation
      const conditionResults = await Promise.all(
        logic.conditions.map(condition => this.evaluateCondition(condition, context))
      );

      const allConditionsMet = conditionResults.every(r => r);

      if (allConditionsMet) {
        const action = logic.actions[0];
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          action: action.type,
          message: action.message || rule.description,
          requiredApprover: action.approver,
          source: rule.source === 'palantir' ? 'palantir' : 'database',
          metadata: { category: rule.category, enforcementLevel: rule.enforcementLevel },
        };
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: true,
        action: 'allow',
        message: 'Rule conditions not met',
        source: rule.source === 'palantir' ? 'palantir' : 'database',
      };
    } catch (error: any) {
      console.error(`[PalantirRules] Error evaluating rule ${rule.id}:`, error);

      if (rule.enforcementLevel === 'mandatory') {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          action: 'block',
          message: `Rule evaluation error: ${error.message}`,
          source: rule.source === 'palantir' ? 'palantir' : 'database',
        };
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: true,
        action: 'warn',
        message: `Rule evaluation error (non-blocking): ${error.message}`,
        source: rule.source === 'palantir' ? 'palantir' : 'database',
      };
    }
  }

  /**
   * Evaluate a condition
   */
  private async evaluateCondition(
    condition: { field: string; operator: string; value: any },
    context: RuleContext
  ): Promise<boolean> {
    const actualValue = this.getFieldValue(condition.field, context.entityData);

    switch (condition.operator) {
      case '>': return Number(actualValue) > Number(condition.value);
      case '>=': return Number(actualValue) >= Number(condition.value);
      case '<': return Number(actualValue) < Number(condition.value);
      case '<=': return Number(actualValue) <= Number(condition.value);
      case '==':
      case '===': return actualValue === condition.value;
      case '!=':
      case '!==': return actualValue !== condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case 'not_in': return Array.isArray(condition.value) && !condition.value.includes(actualValue);
      case 'contains': return String(actualValue).includes(String(condition.value));
      case 'matches': return new RegExp(condition.value).test(String(actualValue));
      default: return false;
    }
  }

  /**
   * Get field value from entity data
   */
  private getFieldValue(field: string, data: any): any {
    const parts = field.split('.');
    let value = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate rule using LLM
   */
  private async evaluateWithLLMRule(rule: Rule, context: RuleContext): Promise<RuleEvaluationResult> {
    try {
      const bridge = await this.getLLMBridge();

      const ruleText = rule.ruleLogic.conditions.find(c => c.operator === 'llm_eval')?.value || rule.description;

      const result = await bridge.evaluateRule({
        rule: ruleText,
        context: {
          entityType: context.entityType,
          operation: context.operation,
          companyId: context.companyId,
        },
        data: context.entityData,
      });

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: !result.triggered,
        action: result.triggered ? (result.actions?.[0]?.type || 'warn') : 'allow',
        message: result.reasoning || rule.description,
        confidence: result.confidence,
        source: 'llm',
        metadata: { llmResult: result },
      };
    } catch (error: any) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: true,
        action: 'warn',
        message: `LLM evaluation failed: ${error.message}`,
        source: 'llm',
      };
    }
  }

  /**
   * Run general LLM evaluation for governance
   */
  private async evaluateWithLLM(context: RuleContext): Promise<RuleEvaluationResult | null> {
    try {
      const bridge = await this.getLLMBridge();

      // Generic governance check
      const result = await bridge.evaluateRule({
        rule: `Check if this ${context.entityType} ${context.operation} operation complies with standard enterprise governance policies (budget limits, approval requirements, risk thresholds)`,
        context: {
          entityType: context.entityType,
          operation: context.operation,
        },
        data: context.entityData,
      });

      if (result.triggered && result.confidence > 0.7) {
        return {
          ruleId: 'llm-governance-check',
          ruleName: 'AI Governance Check',
          passed: false,
          action: result.confidence > 0.9 ? 'require_approval' : 'warn',
          message: result.reasoning || 'AI detected potential governance concern',
          confidence: result.confidence,
          source: 'llm',
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Log rule execution to Palantir for audit
   */
  private async logRuleExecution(
    rule: Rule,
    context: RuleContext,
    result: RuleEvaluationResult
  ): Promise<void> {
    try {
      // Log to Palantir
      if (this.palantirService) {
        await this.palantirService.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
          insight_id: `rule-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `Rule Execution: ${rule.name}`,
          description: `Rule ${rule.id} evaluated for ${context.entityType} ${context.entityId}: ${result.action}`,
          category: 'audit',
          insight_type: 'rule_execution',
          severity: result.action === 'block' ? 'critical' : result.action === 'require_approval' ? 'warning' : 'info',
          status: result.passed ? 'passed' : 'triggered',
          created_by: context.userId || 'system',
        });
      }

      // Also log to PostgreSQL for backup
      try {
        await db.insert(ruleExecutions).values({
          ruleId: rule.id,
          entityType: context.entityType,
          entityId: context.entityId,
          executedBy: context.userId || null,
          companyId: context.companyId,
          conditionsMet: !result.passed,
          actionTaken: result.action,
          executionResult: result.message,
          executionMetadata: {
            operation: context.operation,
            source: result.source,
            confidence: result.confidence,
          },
        } as any);
      } catch (e) {
        console.warn('[PalantirRules] Could not log to PostgreSQL:', e);
      }
    } catch (error: any) {
      console.warn('[PalantirRules] Failed to log rule execution:', error.message);
    }
  }

  /**
   * Create a new rule in Palantir
   */
  async createRule(rule: Omit<Rule, 'id' | 'source'>): Promise<{ id: string; success: boolean }> {
    const id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (this.palantirService) {
        await this.palantirService.applyAction(PALANTIR_ACTIONS.CREATE_INTERVENTION, {
          insight_id: id,
          title: rule.name,
          description: rule.description,
          category: 'rule',
          insight_type: rule.category,
          severity: rule.enforcementLevel === 'mandatory' ? 'critical' : 'warning',
          status: rule.isActive ? 'active' : 'inactive',
          metadata: JSON.stringify(rule.ruleLogic),
        });
      }

      return { id, success: true };
    } catch (error: any) {
      console.error('[PalantirRules] Failed to create rule:', error);
      return { id: '', success: false };
    }
  }
}

// Singleton
let _rulesEngine: PalantirRulesEngine | null = null;

export function getPalantirRulesEngine(): PalantirRulesEngine {
  if (!_rulesEngine) {
    _rulesEngine = new PalantirRulesEngine();
  }
  return _rulesEngine;
}

// Export for middleware compatibility
export async function enforceRules(context: RuleContext): Promise<EnforcementResult> {
  return getPalantirRulesEngine().enforceRules(context);
}

export async function hasPendingApproval(entityType: string, entityId: string): Promise<boolean> {
  const approvalService = getPalantirApprovalService();
  const items = await approvalService.getRuleApprovals();
  return items.some(item =>
    item.entityType === entityType &&
    item.entityId === entityId &&
    item.status === 'pending'
  );
}
