/**
 * POLICY-AS-CODE MCP SERVER
 *
 * Exposes Policy-as-Code system as MCP tools for all agents to connect to.
 * Enables agents to query compliance rules, regulatory requirements, and internal SOPs.
 *
 * All agents (PMO, FinOps, VRO, Planning, OCM, Risk, Governance, TMO, Company)
 * can connect to this MCP server in Langflow for compliance/regulatory/SOP enforcement.
 *
 * MCP Tools Exposed:
 * - queryPolicies - Search and filter policies by framework, type, status
 * - getPolicy - Get detailed policy by ID with full code and metadata
 * - checkCompliance - Check if an entity/action complies with policies
 * - getRulesForAgent - Get all active rules for a specific agent type
 * - getApplicablePolicies - Get policies applicable to a specific domain/entity
 * - getPolicyStats - Get policy system statistics
 */

import { MCPBase } from './base/MCPBase.js';
import type { IStorage } from '../storage.js';
import { db } from '../db.js';
import {
  policyAsCode,
  agentCollaborationRules,
  customAttributes,
} from '../../shared/schema.js';
import { eq, like, or, and, desc } from 'drizzle-orm';

export interface PolicyQuery {
  status?: 'pending_review' | 'approved' | 'active' | 'scheduled' | 'rejected';
  complianceFramework?: string;
  documentType?: string;
  searchTerm?: string;
}

export interface ComplianceCheck {
  entity: string; // e.g., "project-123", "team-finance"
  entityType: string; // e.g., "project", "team", "resource"
  action: string; // e.g., "create_project", "assign_resource", "approve_budget"
  context?: Record<string, any>; // Additional context for the check
}

export interface ComplianceResult {
  compliant: boolean;
  violatedPolicies: Array<{
    policyId: string;
    policyName: string;
    complianceFramework: string;
    violationReason: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
  applicableRules: Array<{
    ruleId: string;
    ruleName: string;
    sourcePolicy: string;
    recommendation?: string;
  }>;
  recommendations: string[];
}

export class PolicyMCPServer extends MCPBase {
  constructor(storage: IStorage) {
    super(storage, 'PolicyMCPServer', {
      circuitBreaker: {
        failureThreshold: 3,
        timeout: 30000,
      },
      rateLimiter: {
        maxRequests: 200,
        windowMs: 60000,
      },
    });
  }

  /**
   * MCP Tool: queryPolicies
   * Search and filter policies by framework, type, status
   */
  async queryPolicies(query: PolicyQuery): Promise<any[]> {
    const result = await this.executeWithSafeguards(async () => {
      let dbQuery = db.select().from(policyAsCode).orderBy(desc(policyAsCode.createdAt));

      // Apply filters
      const conditions = [];

      if (query.status) {
        conditions.push(eq(policyAsCode.status, query.status));
      }

      if (query.complianceFramework) {
        conditions.push(eq(policyAsCode.complianceFramework, query.complianceFramework));
      }

      if (query.documentType) {
        conditions.push(eq(policyAsCode.documentType, query.documentType));
      }

      if (query.searchTerm) {
        conditions.push(
          or(
            like(policyAsCode.policyName, `%${query.searchTerm}%`),
            like(policyAsCode.description, `%${query.searchTerm}%`)
          )!
        );
      }

      if (conditions.length > 0) {
        dbQuery = dbQuery.where(and(...conditions)) as any;
      }

      const policies = await dbQuery;

      return policies.map((p) => ({
        id: p.id,
        policyName: p.policyName,
        complianceFramework: p.complianceFramework,
        documentType: p.documentType,
        status: p.status,
        description: p.description,
        sectionsCovered: JSON.parse(p.sectionsCovered),
        customAttributesCreated: p.customAttributesCreated,
        rulesGenerated: p.rulesGenerated,
        extractionConfidence: p.extractionConfidence,
        createdAt: p.createdAt,
        effectiveDate: p.effectiveDate,
        activatedAt: p.activatedAt,
      }));
    }, 'queryPolicies');

    if (!result.success) {
      throw result.error;
    }

    return result.data || [];
  }

  /**
   * MCP Tool: getPolicy
   * Get detailed policy by ID with full code and metadata
   */
  async getPolicy(policyId: string): Promise<any> {
    const result = await this.executeWithSafeguards(async () => {
      const [policy] = await db
        .select()
        .from(policyAsCode)
        .where(eq(policyAsCode.id, policyId))
        .limit(1);

      if (!policy) {
        throw new Error(`Policy not found: ${policyId}`);
      }

      // Get associated rules
      const rules = await db
        .select()
        .from(agentCollaborationRules)
        .where(eq(agentCollaborationRules.sourcePolicyId, policyId));

      // Get associated attributes
      const attributes = await db
        .select()
        .from(customAttributes)
        .where(eq(customAttributes.sourcePolicyId, policyId));

      return {
        ...policy,
        sectionsCovered: JSON.parse(policy.sectionsCovered),
        fullPolicyCode: JSON.parse(policy.fullPolicyCode),
        associatedRules: rules.map((r) => ({
          id: r.id,
          ruleName: r.ruleName,
          sourceAgent: r.sourceAgent,
          targetAgent: r.targetAgent,
          triggerCondition: r.triggerCondition,
          enabled: r.enabled,
        })),
        associatedAttributes: attributes.map((a) => ({
          id: a.id,
          name: a.name,
          label: a.label,
          dataType: a.dataType,
          ownerAgent: a.ownerAgent,
        })),
      };
    }, 'getPolicy');

    if (!result.success) {
      throw result.error;
    }

    return result.data;
  }

  /**
   * MCP Tool: checkCompliance
   * Check if an entity/action complies with active policies
   */
  async checkCompliance(check: ComplianceCheck): Promise<ComplianceResult> {
    const result = await this.executeWithSafeguards(async () => {
      // Get all active policies
      const activePolicies = await db
        .select()
        .from(policyAsCode)
        .where(eq(policyAsCode.status, 'active'));

      // Get all enabled rules
      const activeRules = await db
        .select()
        .from(agentCollaborationRules)
        .where(eq(agentCollaborationRules.enabled, true));

      const violatedPolicies = [];
      const applicableRules = [];
      const recommendations = [];

      // Check each policy for compliance violations
      for (const policy of activePolicies) {
        const policyCode = JSON.parse(policy.fullPolicyCode);

        // Example compliance check logic (customize based on your policy structure)
        const isViolated = this.evaluatePolicyViolation(policy, check);

        if (isViolated) {
          violatedPolicies.push({
            policyId: policy.id,
            policyName: policy.policyName,
            complianceFramework: policy.complianceFramework,
            violationReason: `Action '${check.action}' violates ${policy.policyName}`,
            severity: 'warning' as const,
          });
        }
      }

      // Find applicable rules
      for (const rule of activeRules) {
        // Check if rule applies to this entity/action
        if (this.isRuleApplicable(rule, check)) {
          applicableRules.push({
            ruleId: rule.id,
            ruleName: rule.ruleName,
            sourcePolicy: rule.sourcePolicyId || 'N/A',
            recommendation: rule.responseAction || undefined,
          });
        }
      }

      // Generate recommendations
      if (violatedPolicies.length > 0) {
        recommendations.push(`Found ${violatedPolicies.length} policy violation(s). Review policies before proceeding.`);
      }

      if (applicableRules.length > 0) {
        recommendations.push(`${applicableRules.length} rules apply to this action. Follow recommended actions.`);
      }

      return {
        compliant: violatedPolicies.length === 0,
        violatedPolicies,
        applicableRules,
        recommendations,
      };
    }, 'checkCompliance');

    if (!result.success) {
      throw result.error;
    }

    return result.data!;
  }

  /**
   * MCP Tool: getRulesForAgent
   * Get all active rules for a specific agent type
   */
  async getRulesForAgent(agentType: string): Promise<any[]> {
    const result = await this.executeWithSafeguards(async () => {
      const rules = await db
        .select()
        .from(agentCollaborationRules)
        .where(
          and(
            or(
              eq(agentCollaborationRules.sourceAgent, agentType),
              eq(agentCollaborationRules.targetAgent, agentType)
            )!,
            eq(agentCollaborationRules.enabled, true)
          )
        );

      return rules.map((r) => ({
        id: r.id,
        ruleName: r.ruleName,
        sourceAgent: r.sourceAgent,
        targetAgent: r.targetAgent,
        triggerCondition: r.triggerCondition,
        responseAction: r.responseAction,
        priority: r.priority,
        sourcePolicyId: r.sourcePolicyId,
        lastTriggered: r.lastTriggered,
      }));
    }, 'getRulesForAgent');

    if (!result.success) {
      throw result.error;
    }

    return result.data || [];
  }

  /**
   * MCP Tool: getApplicablePolicies
   * Get policies applicable to a specific domain/entity
   */
  async getApplicablePolicies(domain: string, entityType?: string): Promise<any[]> {
    const result = await this.executeWithSafeguards(async () => {
      // Get all active policies
      const policies = await db
        .select()
        .from(policyAsCode)
        .where(eq(policyAsCode.status, 'active'));

      // Filter policies by domain/entity type
      const applicablePolicies = policies.filter((policy) => {
        const sections = JSON.parse(policy.sectionsCovered);

        // Check if policy applies to this domain
        return sections.some(
          (section: string) =>
            section.toLowerCase().includes(domain.toLowerCase()) ||
            (entityType && section.toLowerCase().includes(entityType.toLowerCase()))
        );
      });

      return applicablePolicies.map((p) => ({
        id: p.id,
        policyName: p.policyName,
        complianceFramework: p.complianceFramework,
        description: p.description,
        sectionsCovered: JSON.parse(p.sectionsCovered),
        effectiveDate: p.effectiveDate,
      }));
    }, 'getApplicablePolicies');

    if (!result.success) {
      throw result.error;
    }

    return result.data || [];
  }

  /**
   * MCP Tool: getPolicyStats
   * Get policy system statistics
   */
  async getPolicyStats(): Promise<any> {
    const result = await this.executeWithSafeguards(async () => {
      const allPolicies = await db.select().from(policyAsCode);

      const stats = {
        totalPolicies: allPolicies.length,
        byStatus: {
          pending_review: 0,
          approved: 0,
          active: 0,
          scheduled: 0,
          rejected: 0,
        },
        byFramework: {} as Record<string, number>,
        totalAttributes: 0,
        totalRules: 0,
        avgConfidence: 0,
      };

      let totalConfidence = 0;

      for (const policy of allPolicies) {
        stats.byStatus[policy.status] = (stats.byStatus[policy.status] || 0) + 1;

        if (!stats.byFramework[policy.complianceFramework]) {
          stats.byFramework[policy.complianceFramework] = 0;
        }
        stats.byFramework[policy.complianceFramework]++;

        stats.totalAttributes += policy.customAttributesCreated || 0;
        stats.totalRules += policy.rulesGenerated || 0;
        totalConfidence += policy.extractionConfidence || 0;
      }

      stats.avgConfidence = allPolicies.length > 0 ? totalConfidence / allPolicies.length : 0;

      return stats;
    }, 'getPolicyStats');

    if (!result.success) {
      throw result.error;
    }

    return result.data;
  }

  /**
   * Helper: Evaluate if policy is violated
   * (Simplified - customize based on your policy structure)
   */
  private evaluatePolicyViolation(policy: any, check: ComplianceCheck): boolean {
    // This is a simplified example - you would implement actual policy evaluation logic
    // based on your policy code structure

    const policyCode = JSON.parse(policy.fullPolicyCode);

    // Example: Check if action is in restricted list
    if (policyCode.restrictedActions && Array.isArray(policyCode.restrictedActions)) {
      if (policyCode.restrictedActions.includes(check.action)) {
        return true;
      }
    }

    // Example: Check entity type restrictions
    if (policyCode.entityRestrictions && policyCode.entityRestrictions[check.entityType]) {
      const restrictions = policyCode.entityRestrictions[check.entityType];
      // Evaluate restrictions against context
      // ... custom logic here
    }

    return false;
  }

  /**
   * Helper: Check if rule is applicable to this check
   */
  private isRuleApplicable(rule: any, check: ComplianceCheck): boolean {
    // Parse trigger condition and check if it matches the current check
    try {
      const condition = JSON.parse(rule.triggerCondition);

      // Example: Check if entity type matches
      if (condition.entityType && condition.entityType !== check.entityType) {
        return false;
      }

      // Example: Check if action matches
      if (condition.action && condition.action !== check.action) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[PolicyMCPServer] Error parsing rule condition:`, error);
      return false;
    }
  }

  /**
   * Test connection to database
   */
  async testConnection(): Promise<boolean> {
    try {
      await db.select().from(policyAsCode).limit(1);
      console.log(`[${this.mcpName}] Connection test successful`);
      return true;
    } catch (error: any) {
      console.error(`[${this.mcpName}] Connection test failed:`, error.message);
      return false;
    }
  }
}

// Singleton instance
let instance: PolicyMCPServer | null = null;

export function getPolicyMCPServer(storage: IStorage): PolicyMCPServer {
  if (!instance) {
    instance = new PolicyMCPServer(storage);
  }
  return instance;
}
