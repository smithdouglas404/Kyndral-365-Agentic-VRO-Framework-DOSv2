/**
 * PALANTIR RULES SERVICE
 *
 * Replaces Rulebricks with Palantir Functions for business rule evaluation.
 * All threshold checks and business logic are executed via Palantir AIP.
 *
 * This service provides:
 * - Threshold checking for all agent types
 * - Rule evaluation using Palantir Functions
 * - Action execution via Palantir Actions
 * - Automatic notification routing
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import type { PalantirAIPService } from '../mcp/PalantirAIPService.js';

export interface RuleResult {
  functionName: string;
  success: boolean;
  result: any;
  executionTime: number;
  error?: string;
}

export interface ThresholdCheckResult {
  triggered: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action?: string;
  notify?: boolean;
  escalate?: boolean;
  notifyRoles?: string[];
  details?: Record<string, any>;
}

/**
 * Agent-specific function mappings
 * Maps agent types to their Palantir Functions
 */
const AGENT_FUNCTION_MAPPING: Record<string, string[]> = {
  finops: [
    'checkBudgetThreshold',
    'evaluateCostVariance',
    'assessBurnRate',
    'detectCostAnomaly',
  ],
  tmo: [
    'checkScheduleVariance',
    'evaluateMilestoneRisk',
    'assessCriticalPath',
    'detectScheduleAnomaly',
  ],
  risk: [
    'evaluateRiskScore',
    'checkRiskThreshold',
    'assessMitigationStatus',
    'detectNewRisks',
  ],
  pmo: [
    'checkProjectHealth',
    'evaluateResourceAllocation',
    'assessStageGate',
    'detectStatusChange',
  ],
  vro: [
    'checkValueGap',
    'evaluateROI',
    'assessBenefitRealization',
    'detectValueDrift',
  ],
  ocm: [
    'checkReadinessScore',
    'evaluateAdoptionRate',
    'assessChangeImpact',
    'detectResistance',
  ],
  governance: [
    'checkComplianceStatus',
    'evaluatePolicyViolation',
    'assessApprovalStatus',
    'detectControlGap',
  ],
  planning: [
    'checkDependencyStatus',
    'evaluateRoadmapAlignment',
    'assessResourceConflict',
    'detectPlanningGap',
  ],
  okr: [
    'checkOKRProgress',
    'evaluateKeyResultStatus',
    'assessObjectiveAlignment',
    'detectOKRDrift',
  ],
  notification: [
    'routeNotification',
    'escalateAlert',
    'processApproval',
    'sendDigest',
  ],
};

/**
 * Default thresholds used when Palantir Functions are not configured
 * These are evaluated locally as a fallback
 */
const DEFAULT_THRESHOLDS: Record<string, Record<string, number>> = {
  finops: {
    budgetVariance: 10, // % over budget triggers alert
    burnRateCritical: 150, // % of expected burn rate
    costAnomalyThreshold: 20, // % deviation from forecast
  },
  tmo: {
    scheduleVariance: -5, // days behind triggers concern
    spiCritical: 0.85, // Schedule Performance Index
    milestoneSlipDays: 7, // days slipped triggers alert
  },
  risk: {
    riskScoreHigh: 7, // risk score >= 7 is high
    mitigationOverdue: 14, // days overdue for mitigation
    openRiskLimit: 10, // max open risks before escalation
  },
  pmo: {
    healthScoreLow: 60, // health score below triggers concern
    resourceUtilization: 120, // % over-allocation triggers alert
    stageGateOverdue: 5, // days overdue for stage gate
  },
  vro: {
    valueGapCritical: 25, // % gap between planned vs realized
    roiMinimum: 1.0, // ROI below 1.0 is concerning
    benefitShortfall: 15, // % shortfall from target
  },
  ocm: {
    readinessScoreLow: 50, // readiness below triggers concern
    adoptionRateLow: 40, // % adoption below triggers action
    resistanceHigh: 60, // resistance score above triggers action
  },
  governance: {
    complianceMinimum: 80, // % compliance required
    policyViolationLimit: 3, // violations before escalation
    approvalSLADays: 2, // days to respond to approval
  },
  planning: {
    dependencyBlockedLimit: 5, // blocked dependencies before alert
    resourceConflictLimit: 3, // conflicts before escalation
    roadmapDriftDays: 14, // days drifted from plan
  },
};

export class PalantirRulesService {
  private palantir: PalantirAIPService | null;

  constructor() {
    this.palantir = getPalantirService();
  }

  /**
   * Check if Palantir is available
   */
  isAvailable(): boolean {
    return this.palantir !== null;
  }

  /**
   * Execute a Palantir Function for rule evaluation
   * Falls back to local threshold checking if Palantir is unavailable
   */
  async checkRule(
    functionName: string,
    input: Record<string, any>,
    metadata?: { agentId?: string; projectId?: string; tags?: string[] }
  ): Promise<RuleResult> {
    const startTime = Date.now();

    try {
      if (this.palantir) {
        // Execute via Palantir Functions
        const result = await this.palantir.executeQuery(functionName, input);
        const executionTime = Date.now() - startTime;

        console.log(`[PalantirRules] Function "${functionName}" executed (${executionTime}ms)`);

        return {
          functionName,
          success: true,
          result,
          executionTime,
        };
      } else {
        // Fallback to local threshold evaluation
        const result = this.evaluateLocalThreshold(functionName, input, metadata?.agentId);
        const executionTime = Date.now() - startTime;

        console.log(`[PalantirRules] Local evaluation "${functionName}" (${executionTime}ms) [Palantir not configured]`);

        return {
          functionName,
          success: true,
          result,
          executionTime,
        };
      }
    } catch (error: any) {
      console.error(`[PalantirRules] Function "${functionName}" failed:`, error.message);
      return {
        functionName,
        success: false,
        result: null,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Check a threshold and return structured result
   * This is the primary method agents should call
   */
  async checkThreshold(
    agentType: string,
    thresholdType: string,
    currentValue: number,
    context?: Record<string, any>
  ): Promise<ThresholdCheckResult> {
    const normalizedAgent = agentType.toLowerCase().replace(/deep|agent/g, '');
    const thresholds = DEFAULT_THRESHOLDS[normalizedAgent] || {};
    const threshold = thresholds[thresholdType];

    if (threshold === undefined) {
      return {
        triggered: false,
        severity: 'low',
        message: `Unknown threshold type: ${thresholdType}`,
        details: { currentValue, thresholdType },
      };
    }

    // Determine if threshold is breached and severity
    const { triggered, severity } = this.evaluateThresholdBreach(
      thresholdType,
      currentValue,
      threshold,
      normalizedAgent
    );

    const result: ThresholdCheckResult = {
      triggered,
      severity,
      message: triggered
        ? this.generateThresholdMessage(thresholdType, currentValue, threshold, normalizedAgent)
        : `${thresholdType} within acceptable range (${currentValue})`,
      details: {
        currentValue,
        threshold,
        agentType: normalizedAgent,
        ...context,
      },
    };

    // Set notification flags based on severity
    if (triggered) {
      result.notify = severity !== 'low';
      result.escalate = severity === 'critical';
      result.action = this.suggestAction(thresholdType, severity, normalizedAgent);
      result.notifyRoles = this.getNotifyRoles(normalizedAgent, severity);
    }

    return result;
  }

  /**
   * Execute a Palantir Action (for notifications, approvals, etc.)
   */
  async executeAction(
    actionName: string,
    parameters: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    if (!this.palantir) {
      console.log(`[PalantirRules] Action "${actionName}" skipped - Palantir not configured`);
      return { success: false, error: 'Palantir not configured' };
    }

    try {
      const result = await this.palantir.applyAction(actionName, parameters);
      console.log(`[PalantirRules] Action "${actionName}" executed successfully`);
      return { success: true, result };
    } catch (error: any) {
      console.error(`[PalantirRules] Action "${actionName}" failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available functions for an agent type
   */
  getFunctionsForAgent(agentType: string): string[] {
    const normalized = agentType.toLowerCase().replace(/deep|agent/g, '');
    return AGENT_FUNCTION_MAPPING[normalized] || [];
  }

  /**
   * Get all thresholds for an agent type
   */
  getThresholdsForAgent(agentType: string): Record<string, number> {
    const normalized = agentType.toLowerCase().replace(/deep|agent/g, '');
    return DEFAULT_THRESHOLDS[normalized] || {};
  }

  /**
   * Test connection to Palantir
   */
  async testConnection(): Promise<boolean> {
    if (!this.palantir) {
      return false;
    }

    try {
      const result = await this.palantir.testConnection();
      return result.connected;
    } catch {
      return false;
    }
  }

  // ================== Private Helper Methods ==================

  /**
   * Evaluate threshold locally when Palantir is unavailable
   */
  private evaluateLocalThreshold(
    functionName: string,
    input: Record<string, any>,
    agentId?: string
  ): ThresholdCheckResult {
    // Parse function name to determine threshold type
    // e.g., "checkBudgetThreshold" -> "budget"
    const thresholdType = this.functionToThresholdType(functionName);
    const agentType = agentId || this.functionToAgentType(functionName);

    // Get the primary value from input
    const value = input.value || input.currentValue || input.score || 0;

    return this.checkThresholdSync(agentType, thresholdType, value, input);
  }

  /**
   * Synchronous threshold check for local evaluation
   */
  private checkThresholdSync(
    agentType: string,
    thresholdType: string,
    currentValue: number,
    context?: Record<string, any>
  ): ThresholdCheckResult {
    const thresholds = DEFAULT_THRESHOLDS[agentType] || {};
    const threshold = thresholds[thresholdType];

    if (threshold === undefined) {
      return {
        triggered: false,
        severity: 'low',
        message: `Threshold check completed (no specific threshold for ${thresholdType})`,
        details: { currentValue, context },
      };
    }

    const { triggered, severity } = this.evaluateThresholdBreach(
      thresholdType,
      currentValue,
      threshold,
      agentType
    );

    return {
      triggered,
      severity,
      message: triggered
        ? this.generateThresholdMessage(thresholdType, currentValue, threshold, agentType)
        : `${thresholdType} within acceptable range`,
      notify: triggered && severity !== 'low',
      escalate: severity === 'critical',
      action: triggered ? this.suggestAction(thresholdType, severity, agentType) : undefined,
      details: { currentValue, threshold, agentType, ...context },
    };
  }

  /**
   * Evaluate if threshold is breached and determine severity
   */
  private evaluateThresholdBreach(
    thresholdType: string,
    currentValue: number,
    threshold: number,
    agentType: string
  ): { triggered: boolean; severity: 'low' | 'medium' | 'high' | 'critical' } {
    // Different threshold types have different comparison logic
    const isLowerBetter = this.isLowerBetterThreshold(thresholdType);
    const isScoreType = thresholdType.includes('Score') || thresholdType.includes('Rate');

    let triggered = false;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (isLowerBetter) {
      // For thresholds where lower is better (e.g., risk score, variance)
      triggered = currentValue >= threshold;
      if (triggered) {
        const excess = currentValue / threshold;
        if (excess >= 2.0) severity = 'critical';
        else if (excess >= 1.5) severity = 'high';
        else if (excess >= 1.2) severity = 'medium';
        else severity = 'low';
      }
    } else if (isScoreType) {
      // For score types where higher is better (e.g., health score, adoption rate)
      triggered = currentValue < threshold;
      if (triggered) {
        const deficit = threshold / Math.max(currentValue, 1);
        if (deficit >= 2.0) severity = 'critical';
        else if (deficit >= 1.5) severity = 'high';
        else if (deficit >= 1.2) severity = 'medium';
        else severity = 'low';
      }
    } else {
      // Default: treat as upper limit
      triggered = currentValue > threshold;
      if (triggered) {
        const excess = currentValue / threshold;
        if (excess >= 2.0) severity = 'critical';
        else if (excess >= 1.5) severity = 'high';
        else if (excess >= 1.2) severity = 'medium';
        else severity = 'low';
      }
    }

    return { triggered, severity };
  }

  /**
   * Check if lower values are better for this threshold type
   */
  private isLowerBetterThreshold(thresholdType: string): boolean {
    const lowerBetterTypes = [
      'riskScore', 'riskScoreHigh', 'resistance', 'resistanceHigh',
      'variance', 'budgetVariance', 'scheduleVariance',
      'overdue', 'mitigationOverdue', 'stageGateOverdue', 'approvalSLADays',
      'violations', 'policyViolationLimit', 'openRiskLimit',
      'blocked', 'dependencyBlockedLimit', 'resourceConflictLimit',
      'drift', 'roadmapDriftDays', 'burnRate', 'burnRateCritical',
      'gap', 'valueGapCritical', 'shortfall', 'benefitShortfall',
      'anomaly', 'costAnomalyThreshold',
    ];
    return lowerBetterTypes.some(t => thresholdType.toLowerCase().includes(t.toLowerCase()));
  }

  /**
   * Generate human-readable threshold breach message
   */
  private generateThresholdMessage(
    thresholdType: string,
    currentValue: number,
    threshold: number,
    agentType: string
  ): string {
    const messages: Record<string, string> = {
      budgetVariance: `Budget variance of ${currentValue}% exceeds ${threshold}% threshold`,
      scheduleVariance: `Schedule variance of ${currentValue} days exceeds ${threshold} days threshold`,
      riskScoreHigh: `Risk score of ${currentValue} exceeds threshold of ${threshold}`,
      healthScoreLow: `Health score of ${currentValue} is below minimum of ${threshold}`,
      valueGapCritical: `Value gap of ${currentValue}% exceeds critical threshold of ${threshold}%`,
      readinessScoreLow: `Readiness score of ${currentValue} is below minimum of ${threshold}`,
      complianceMinimum: `Compliance score of ${currentValue}% is below required ${threshold}%`,
    };

    return messages[thresholdType] ||
      `${thresholdType} (${currentValue}) breached threshold (${threshold}) for ${agentType}`;
  }

  /**
   * Suggest action based on threshold breach
   */
  private suggestAction(
    thresholdType: string,
    severity: string,
    agentType: string
  ): string {
    if (severity === 'critical') {
      return 'escalate_immediately';
    }

    const actionMap: Record<string, string> = {
      budgetVariance: 'review_spend',
      scheduleVariance: 'assess_recovery',
      riskScoreHigh: 'mitigation_review',
      healthScoreLow: 'status_review',
      valueGapCritical: 'benefit_review',
      readinessScoreLow: 'change_assessment',
      complianceMinimum: 'audit_required',
    };

    return actionMap[thresholdType] || 'review_required';
  }

  /**
   * Get roles to notify based on agent type and severity
   */
  private getNotifyRoles(agentType: string, severity: string): string[] {
    const baseRoles: Record<string, string[]> = {
      finops: ['finance_manager', 'project_manager'],
      tmo: ['project_manager', 'delivery_lead'],
      risk: ['risk_manager', 'project_manager'],
      pmo: ['pmo_lead', 'portfolio_manager'],
      vro: ['value_manager', 'sponsor'],
      ocm: ['change_manager', 'hr_lead'],
      governance: ['compliance_officer', 'governance_lead'],
      planning: ['planning_lead', 'project_manager'],
    };

    const roles = baseRoles[agentType] || ['project_manager'];

    if (severity === 'critical') {
      roles.push('executive_sponsor', 'steering_committee');
    } else if (severity === 'high') {
      roles.push('portfolio_manager');
    }

    return roles;
  }

  /**
   * Map function name to threshold type
   */
  private functionToThresholdType(functionName: string): string {
    const mapping: Record<string, string> = {
      checkBudgetThreshold: 'budgetVariance',
      evaluateCostVariance: 'budgetVariance',
      assessBurnRate: 'burnRateCritical',
      checkScheduleVariance: 'scheduleVariance',
      evaluateMilestoneRisk: 'milestoneSlipDays',
      evaluateRiskScore: 'riskScoreHigh',
      checkRiskThreshold: 'riskScoreHigh',
      checkProjectHealth: 'healthScoreLow',
      checkValueGap: 'valueGapCritical',
      evaluateROI: 'roiMinimum',
      checkReadinessScore: 'readinessScoreLow',
      checkComplianceStatus: 'complianceMinimum',
    };
    return mapping[functionName] || 'generic';
  }

  /**
   * Map function name to agent type
   */
  private functionToAgentType(functionName: string): string {
    for (const [agent, functions] of Object.entries(AGENT_FUNCTION_MAPPING)) {
      if (functions.includes(functionName)) {
        return agent;
      }
    }
    return 'generic';
  }
}

// Singleton instance
let palantirRulesInstance: PalantirRulesService | null = null;

/**
 * Initialize the Palantir Rules Service
 */
export function initializePalantirRulesService(): PalantirRulesService {
  palantirRulesInstance = new PalantirRulesService();
  console.log('[PalantirRules] Service initialized');
  return palantirRulesInstance;
}

/**
 * Get the Palantir Rules Service instance
 */
export function getPalantirRulesService(): PalantirRulesService | null {
  return palantirRulesInstance;
}
