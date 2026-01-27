/**
 * GOVERNANCE RULES ENGINE
 *
 * Enforces Policy-as-Code rules extracted from company annual reports:
 * - Budget approval thresholds
 * - Capital allocation policies
 * - Compliance requirements
 * - Stage-gate approvals
 * - Risk tolerance limits
 *
 * Rules are evaluated on entity create/update and can:
 * - Block the operation (hard stop)
 * - Require approval (soft block with workflow)
 * - Log warning (informational)
 */

import { db } from '../db';
import {
  companyRules,
  ruleExecutions,
  approvalRequests
} from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface RuleContext {
  entityType: 'project' | 'epic' | 'feature' | 'story' | 'budget' | 'resource';
  entityId: string;
  entityData: any;
  operation: 'create' | 'update' | 'delete';
  userId?: string;
  companyId: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  action: 'block' | 'require_approval' | 'warn' | 'allow';
  message: string;
  requiredApprover?: string;
  metadata?: any;
}

export interface EnforcementResult {
  allowed: boolean;
  requiresApproval: boolean;
  approvalRequestId?: string;
  blockedBy?: RuleEvaluationResult[];
  warnings?: RuleEvaluationResult[];
}

/**
 * Main entry point: Enforce all applicable rules for an entity operation
 */
export async function enforceRules(
  context: RuleContext
): Promise<EnforcementResult> {
  console.log(`[Rules Engine] Evaluating rules for ${context.entityType} ${context.entityId} (${context.operation})`);

  // 1. Fetch active rules for this company
  const activeRules = await db
    .select()
    .from(companyRules)
    .where(
      and(
        eq(companyRules.companyId, context.companyId),
        eq(companyRules.isActive, true)
      )
    );

  if (activeRules.length === 0) {
    console.log('[Rules Engine] No active rules found');
    return { allowed: true, requiresApproval: false };
  }

  // 2. Filter rules applicable to this entity type and operation
  const applicableRules = activeRules.filter(rule =>
    isRuleApplicable(rule, context)
  );

  console.log(`[Rules Engine] Found ${applicableRules.length} applicable rules`);

  // 3. Evaluate each rule
  const evaluations: RuleEvaluationResult[] = [];

  for (const rule of applicableRules) {
    const result = await evaluateRule(rule, context);
    evaluations.push(result);

    // Log execution to audit trail
    await logRuleExecution(rule.id, context, result);
  }

  // 4. Determine overall enforcement decision
  const blocked = evaluations.filter(e => !e.passed && e.action === 'block');
  const requireApproval = evaluations.filter(e => !e.passed && e.action === 'require_approval');
  const warnings = evaluations.filter(e => !e.passed && e.action === 'warn');

  // If any rule blocks, operation is denied
  if (blocked.length > 0) {
    console.log(`[Rules Engine] Operation BLOCKED by ${blocked.length} rules`);
    return {
      allowed: false,
      requiresApproval: false,
      blockedBy: blocked
    };
  }

  // If any rule requires approval, create approval request
  if (requireApproval.length > 0) {
    console.log(`[Rules Engine] Operation requires approval (${requireApproval.length} rules)`);

    const approvalRequestId = await createApprovalRequest(context, requireApproval);

    return {
      allowed: false,
      requiresApproval: true,
      approvalRequestId,
      warnings
    };
  }

  // Otherwise, allow with warnings
  console.log(`[Rules Engine] Operation ALLOWED with ${warnings.length} warnings`);
  return {
    allowed: true,
    requiresApproval: false,
    warnings
  };
}

/**
 * Check if a rule applies to this entity type and operation
 */
function isRuleApplicable(rule: any, context: RuleContext): boolean {
  const ruleLogic = rule.ruleLogic;

  // Check if rule applies to this entity type
  if (ruleLogic.applicableEntities && !ruleLogic.applicableEntities.includes(context.entityType)) {
    return false;
  }

  // Check if rule applies to this operation
  if (ruleLogic.applicableOperations && !ruleLogic.applicableOperations.includes(context.operation)) {
    return false;
  }

  return true;
}

/**
 * Evaluate a single rule against the context
 */
async function evaluateRule(
  rule: any,
  context: RuleContext
): Promise<RuleEvaluationResult> {
  const ruleLogic = rule.ruleLogic;

  try {
    // Evaluate all conditions
    const conditionResults = await Promise.all(
      ruleLogic.conditions.map((condition: any) =>
        evaluateCondition(condition, context)
      )
    );

    // All conditions must pass for rule to trigger
    const allConditionsPassed = conditionResults.every(r => r);

    if (allConditionsPassed) {
      // Rule triggered - determine action
      const action = ruleLogic.actions[0]; // Use first action

      return {
        ruleId: rule.id,
        ruleName: rule.ruleName,
        passed: false, // Rule triggered (conditions met)
        action: action.type,
        message: action.message || rule.ruleDescription,
        requiredApprover: action.approver,
        metadata: {
          ruleCategory: rule.ruleCategory,
          enforcementLevel: rule.enforcementLevel
        }
      };
    } else {
      // Rule did not trigger
      return {
        ruleId: rule.id,
        ruleName: rule.ruleName,
        passed: true, // Rule passed (conditions not met)
        action: 'allow',
        message: 'Rule conditions not met'
      };
    }
  } catch (error: any) {
    console.error(`[Rules Engine] Error evaluating rule ${rule.id}:`, error);

    // On error, fail safe based on enforcement level
    if (rule.enforcementLevel === 'mandatory') {
      return {
        ruleId: rule.id,
        ruleName: rule.ruleName,
        passed: false,
        action: 'block',
        message: `Rule evaluation error: ${error.message}`
      };
    } else {
      return {
        ruleId: rule.id,
        ruleName: rule.ruleName,
        passed: true,
        action: 'warn',
        message: `Rule evaluation error (non-blocking): ${error.message}`
      };
    }
  }
}

/**
 * Evaluate a single condition
 */
async function evaluateCondition(
  condition: any,
  context: RuleContext
): Promise<boolean> {
  const { field, operator, value } = condition;

  // Get field value from entity data
  let actualValue = getFieldValue(field, context.entityData);

  // Handle special field types that require lookups
  if (field.includes('.')) {
    actualValue = await resolveNestedField(field, context);
  }

  // Compare based on operator
  switch (operator) {
    case '>':
      return Number(actualValue) > Number(value);
    case '>=':
      return Number(actualValue) >= Number(value);
    case '<':
      return Number(actualValue) < Number(value);
    case '<=':
      return Number(actualValue) <= Number(value);
    case '==':
    case '===':
      return actualValue === value;
    case '!=':
    case '!==':
      return actualValue !== value;
    case 'in':
      return Array.isArray(value) && value.includes(actualValue);
    case 'not_in':
      return Array.isArray(value) && !value.includes(actualValue);
    case 'contains':
      return String(actualValue).includes(String(value));
    case 'matches':
      return new RegExp(value).test(String(actualValue));
    default:
      console.warn(`[Rules Engine] Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Get field value from entity data
 */
function getFieldValue(field: string, data: any): any {
  // Handle nested fields like "budget.total"
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
 * Resolve nested fields that require database lookups
 */
async function resolveNestedField(field: string, context: RuleContext): Promise<any> {
  // Example: "project.actual_cost" when evaluating an epic
  const [relation, attribute] = field.split('.');

  
  // if (relation === 'project' && context.entityData.projectId) {
  //   const [project] = await db
  //     .select()
  //     .from(projects)
  //     .where(eq(projects.id, context.entityData.projectId))
  //     .limit(1);
  //
  //   return project ? project[attribute as keyof typeof project] : undefined;
  // }

  return undefined;
}

/**
 * Create an approval request when rules require approval
 */
async function createApprovalRequest(
  context: RuleContext,
  triggeredRules: RuleEvaluationResult[]
): Promise<string> {
  // Determine required approvers (combine from all rules)
  const approvers = triggeredRules
    .map(r => r.requiredApprover)
    .filter(Boolean);

  const approvalRequest = await db
    .insert(approvalRequests)
    .values({
      requestType: 'rule_enforcement',
      entityType: context.entityType,
      entityId: context.entityId,
      entityData: context.entityData,
      requestedBy: context.userId,
      companyId: context.companyId,
      requiredApprovers: approvers,
      reason: triggeredRules.map(r => r.message).join('; '),
      metadata: {
        triggeredRules: triggeredRules.map(r => ({
          ruleId: r.ruleId,
          ruleName: r.ruleName,
          message: r.message
        })),
        operation: context.operation
      },
      status: 'pending'
    })
    .returning();

  console.log(`[Rules Engine] Created approval request: ${approvalRequest[0].id}`);

  return approvalRequest[0].id;
}

/**
 * Log rule execution to audit trail
 */
async function logRuleExecution(
  ruleId: string,
  context: RuleContext,
  result: RuleEvaluationResult
): Promise<void> {
  await db.insert(ruleExecutions).values({
    ruleId,
    entityType: context.entityType,
    entityId: context.entityId,
    executedBy: context.userId,
    companyId: context.companyId,
    conditionsMet: !result.passed,
    actionTaken: result.action,
    executionResult: result.message,
    executionMetadata: {
      operation: context.operation,
      entityData: context.entityData,
      ...result.metadata
    }
  });
}

/**
 * Check if an entity has a pending approval request
 */
export async function hasPendingApproval(
  entityType: string,
  entityId: string
): Promise<boolean> {
  const pending = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.entityType, entityType),
        eq(approvalRequests.entityId, entityId),
        eq(approvalRequests.status, 'pending')
      )
    )
    .limit(1);

  return pending.length > 0;
}

/**
 * Approve an approval request
 */
export async function approveRequest(
  requestId: string,
  approverId: string,
  comments?: string
): Promise<void> {
  await db
    .update(approvalRequests)
    .set({
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      approverComments: comments
    })
    .where(eq(approvalRequests.id, requestId));

  console.log(`[Rules Engine] Approval request ${requestId} approved by ${approverId}`);
}

/**
 * Reject an approval request
 */
export async function rejectRequest(
  requestId: string,
  approverId: string,
  reason: string
): Promise<void> {
  await db
    .update(approvalRequests)
    .set({
      status: 'rejected',
      approvedBy: approverId,
      approvedAt: new Date(),
      approverComments: reason
    })
    .where(eq(approvalRequests.id, requestId));

  console.log(`[Rules Engine] Approval request ${requestId} rejected by ${approverId}`);
}

/**
 * Get approval requests for a user
 */
export async function getApprovalRequestsForUser(
  userId: string,
  status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'
): Promise<any[]> {
  const query = db
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.requiredApprovers, [userId])); // Simplified - would need JSON contains operator

  if (status !== 'all') {
    query.where(eq(approvalRequests.status, status));
  }

  return await query;
}
