/**
 * ENTERPRISE RULES ENGINE
 *
 * Unified rules pipeline that combines:
 * 1. Rulebricks — external rule evaluation (managed via Rulebricks UI)
 * 2. PalantirRulesService — local threshold evaluation + Palantir Function calls
 * 3. Palantir Actions — real write-back to Foundry when rules trigger
 *
 * Flow: Palantir data → Rulebricks evaluation → Threshold check → Palantir Action response
 *
 * Rule-to-Agent mapping:
 *   budget-alert → finops
 *   schedule-alert → tmo
 *   risk-alert → risk
 *   compliance-alert → governance
 *   health-alert → pmo
 *   value-gap → vro
 *   change-impact → ocm
 *   dependency-alert → planning
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { RulebricksService, initializeRulebricksService, type RulebricksEvalResult } from './RulebricksService.js';
import { getPalantirRulesService, initializePalantirRulesService, type ThresholdCheckResult } from '../lib/PalantirRulesService.js';

export interface RuleEvaluation {
  ruleId: string;
  ruleName: string;
  agentMapping: string;
  category: string;
  triggered: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action?: string;
  palantirActionExecuted?: boolean;
  palantirActionResult?: string;
  source: 'rulebricks' | 'palantir-threshold' | 'local-fallback';
  executionTimeMs: number;
  timestamp: string;
}

export interface RuleEngineReport {
  evaluatedAt: string;
  totalRulesEvaluated: number;
  totalTriggered: number;
  bySeverity: Record<string, number>;
  byAgent: Record<string, RuleEvaluation[]>;
  palantirActionsExecuted: number;
  evaluations: RuleEvaluation[];
}

const PALANTIR_ACTION_MAP: Record<string, { actionApiName: string; paramBuilder: (eval_: RuleEvaluation, context: Record<string, any>) => Record<string, any> }> = {
  'budget-overrun-check': {
    actionApiName: 'atlas-flag-budget-anomaly',
    paramBuilder: (eval_, ctx) => ({
      projectId: ctx.projectId || '',
      budgetId: ctx.budgetId || '',
      anomalyType: 'budget_overrun',
      severity: eval_.severity,
      description: eval_.message,
      detectedBy: 'finops-agent',
    }),
  },
  'burn-rate-anomaly': {
    actionApiName: 'atlas-flag-budget-anomaly',
    paramBuilder: (eval_, ctx) => ({
      projectId: ctx.projectId || '',
      budgetId: ctx.budgetId || '',
      anomalyType: 'burn_rate_anomaly',
      severity: eval_.severity,
      description: eval_.message,
      detectedBy: 'finops-agent',
    }),
  },
  'risk-score-escalation': {
    actionApiName: 'atlas-update-risk',
    paramBuilder: (eval_, ctx) => ({
      riskId: ctx.riskId || '',
      status: eval_.severity === 'critical' ? 'Escalated' : 'Under Review',
      mitigationPlan: `Auto-escalated: ${eval_.message}`,
    }),
  },
  'compliance-score-low': {
    actionApiName: 'atlas-record-governance-decision',
    paramBuilder: (eval_, ctx) => ({
      projectId: ctx.projectId || '',
      decision: 'compliance_review_required',
      outcome: `Auto-flagged: ${eval_.message}`,
      reviewedBy: 'governance-agent',
    }),
  },
  'schedule-variance-check': {
    actionApiName: 'atlas-create-insight',
    paramBuilder: (eval_, ctx) => ({
      projectId: ctx.projectId || '',
      insightType: 'schedule_alert',
      severity: eval_.severity,
      description: eval_.message,
      generatedBy: 'tmo-agent',
    }),
  },
  'project-health-low': {
    actionApiName: 'atlas-create-insight',
    paramBuilder: (eval_, ctx) => ({
      projectId: ctx.projectId || '',
      insightType: 'health_alert',
      severity: eval_.severity,
      description: eval_.message,
      generatedBy: 'pmo-agent',
    }),
  },
  'value-gap-critical': {
    actionApiName: 'atlas-create-insight',
    paramBuilder: (eval_, ctx) => ({
      projectId: ctx.projectId || '',
      insightType: 'value_gap',
      severity: eval_.severity,
      description: eval_.message,
      generatedBy: 'vro-agent',
    }),
  },
  'readiness-score-low': {
    actionApiName: 'atlas-update-readiness-score',
    paramBuilder: (eval_, ctx) => ({
      teamId: ctx.teamId || '',
      metricType: 'readiness',
      score: ctx.readinessScore || 0,
      notes: eval_.message,
    }),
  },
};

export class EnterpriseRulesEngine {
  private static instance: EnterpriseRulesEngine | null = null;
  private rulebricks: RulebricksService;
  private initialized: boolean = false;

  private constructor() {
    this.rulebricks = initializeRulebricksService();
  }

  static getInstance(): EnterpriseRulesEngine {
    if (!EnterpriseRulesEngine.instance) {
      EnterpriseRulesEngine.instance = new EnterpriseRulesEngine();
    }
    return EnterpriseRulesEngine.instance;
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      initializePalantirRulesService();
    } catch (e: any) {
      console.warn(`[EnterpriseRules] PalantirRulesService init skipped: ${e.message}`);
    }

    const palantirRules = getPalantirRulesService();
    console.log('[EnterpriseRules] Engine initialized');
    console.log(`[EnterpriseRules]   Rulebricks: ${this.rulebricks.isAvailable() ? 'CONNECTED' : 'local fallback'}`);
    console.log(`[EnterpriseRules]   Palantir Rules: ${palantirRules ? 'CONNECTED' : 'not available'}`);
    console.log(`[EnterpriseRules]   Enterprise rules: ${this.rulebricks.getEnterpriseRules().length} defined`);
    console.log(`[EnterpriseRules]   Palantir Actions: ${Object.keys(PALANTIR_ACTION_MAP).length} action mappings`);
  }

  async evaluateProjectRules(
    projectId: string,
    projectData: Record<string, any>,
    options: { executeActions?: boolean; agentFilter?: string } = {}
  ): Promise<RuleEvaluation[]> {
    const { executeActions = false, agentFilter } = options;

    let rules = this.rulebricks.getEnterpriseRules();
    if (agentFilter) {
      rules = rules.filter(r => r.agentMapping === agentFilter);
    }

    const evaluations: RuleEvaluation[] = [];

    for (const rule of rules) {
      const startTime = Date.now();
      const rbResult = await this.rulebricks.evaluateRule(rule.slug, projectData);

      const evaluation: RuleEvaluation = {
        ruleId: rule.slug,
        ruleName: rule.name,
        agentMapping: rule.agentMapping,
        category: rule.category,
        triggered: rbResult.triggered,
        severity: rbResult.severity,
        message: rbResult.message,
        action: rbResult.action,
        source: rbResult.source === 'rulebricks' ? 'rulebricks' : 'local-fallback',
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      if (evaluation.triggered && executeActions) {
        const actionResult = await this.executePalantirAction(rule.slug, evaluation, { ...projectData, projectId });
        evaluation.palantirActionExecuted = actionResult.executed;
        evaluation.palantirActionResult = actionResult.message;
      }

      evaluations.push(evaluation);
    }

    return evaluations;
  }

  async evaluatePortfolioRules(
    projects: Array<{ projectId: string; data: Record<string, any> }>,
    options: { executeActions?: boolean } = {}
  ): Promise<RuleEngineReport> {
    const allEvaluations: RuleEvaluation[] = [];

    for (const project of projects) {
      const evals = await this.evaluateProjectRules(
        project.projectId,
        project.data,
        options
      );
      allEvaluations.push(...evals);
    }

    const triggered = allEvaluations.filter(e => e.triggered);
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    triggered.forEach(e => { bySeverity[e.severity]++; });

    const byAgent: Record<string, RuleEvaluation[]> = {};
    triggered.forEach(e => {
      if (!byAgent[e.agentMapping]) byAgent[e.agentMapping] = [];
      byAgent[e.agentMapping].push(e);
    });

    return {
      evaluatedAt: new Date().toISOString(),
      totalRulesEvaluated: allEvaluations.length,
      totalTriggered: triggered.length,
      bySeverity,
      byAgent,
      palantirActionsExecuted: allEvaluations.filter(e => e.palantirActionExecuted).length,
      evaluations: allEvaluations,
    };
  }

  async evaluateSingleThreshold(
    agentType: string,
    thresholdType: string,
    currentValue: number,
    context?: Record<string, any>
  ): Promise<ThresholdCheckResult> {
    const palantirRules = getPalantirRulesService();
    if (palantirRules) {
      return palantirRules.checkThreshold(agentType, thresholdType, currentValue, context);
    }

    return {
      triggered: false,
      severity: 'low',
      message: 'Rules service not available',
    };
  }

  private async executePalantirAction(
    ruleSlug: string,
    evaluation: RuleEvaluation,
    context: Record<string, any>
  ): Promise<{ executed: boolean; message: string }> {
    const mapping = PALANTIR_ACTION_MAP[ruleSlug];
    if (!mapping) {
      return { executed: false, message: 'No Palantir Action mapped for this rule' };
    }

    const palantir = getPalantirService();
    if (!palantir) {
      return { executed: false, message: 'Palantir service not available' };
    }

    try {
      const params = mapping.paramBuilder(evaluation, context);
      await palantir.applyAction(mapping.actionApiName, params);

      console.log(`[EnterpriseRules] Palantir Action "${mapping.actionApiName}" executed for rule "${ruleSlug}"`);
      return { executed: true, message: `Action ${mapping.actionApiName} executed successfully` };
    } catch (error: any) {
      console.warn(`[EnterpriseRules] Palantir Action "${mapping.actionApiName}" failed: ${error.message}`);
      return { executed: false, message: `Action failed: ${error.message}` };
    }
  }

  getStatus(): Record<string, any> {
    const palantirRules = getPalantirRulesService();
    return {
      initialized: this.initialized,
      rulebricks: {
        available: this.rulebricks.isAvailable(),
        totalRules: this.rulebricks.getEnterpriseRules().length,
      },
      palantirRules: {
        available: !!palantirRules,
        connectionTested: palantirRules?.isAvailable() || false,
      },
      palantirActions: {
        mappedRules: Object.keys(PALANTIR_ACTION_MAP).length,
        actionNames: Object.values(PALANTIR_ACTION_MAP).map(m => m.actionApiName),
      },
      ruleCategories: {
        'budget-alert': this.rulebricks.getRulesByCategory('budget-alert').length,
        'schedule-alert': this.rulebricks.getRulesByCategory('schedule-alert').length,
        'risk-alert': this.rulebricks.getRulesByCategory('risk-alert').length,
        'compliance-alert': this.rulebricks.getRulesByCategory('compliance-alert').length,
        'health-alert': this.rulebricks.getRulesByCategory('health-alert').length,
        'value-gap': this.rulebricks.getRulesByCategory('value-gap').length,
        'change-impact': this.rulebricks.getRulesByCategory('change-impact').length,
        'dependency-alert': this.rulebricks.getRulesByCategory('dependency-alert').length,
      },
    };
  }
}

let engineInstance: EnterpriseRulesEngine | null = null;

export function initializeEnterpriseRulesEngine(): EnterpriseRulesEngine {
  engineInstance = EnterpriseRulesEngine.getInstance();
  engineInstance.initialize();
  return engineInstance;
}

export function getEnterpriseRulesEngine(): EnterpriseRulesEngine | null {
  return engineInstance;
}
