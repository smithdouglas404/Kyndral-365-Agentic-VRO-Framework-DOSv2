/**
 * RULEBRICKS RULES ENGINE SERVICE
 *
 * Integrates with Rulebricks API for external business rule evaluation.
 * Provides enterprise threshold rules that can be managed via Rulebricks UI.
 *
 * Rule Categories:
 * - budget-alert → FinOps agent
 * - schedule-alert → TMO agent
 * - risk-alert → Risk agent
 * - compliance-alert → Governance agent
 * - health-alert → PMO agent
 * - value-gap → VRO agent
 * - change-impact → OCM agent
 * - dependency-alert → Planning agent
 */

const RULEBRICKS_API_BASE = 'https://rulebricks.com/api/v1';

export interface RulebricksRule {
  slug: string;
  name: string;
  description: string;
  agentMapping: string;
  category: string;
}

export interface RulebricksEvalResult {
  ruleSlug: string;
  triggered: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action?: string;
  details?: Record<string, any>;
  source: 'rulebricks' | 'local-fallback';
  executionTimeMs: number;
}

const ENTERPRISE_RULES: RulebricksRule[] = [
  {
    slug: 'budget-overrun-check',
    name: 'Budget Overrun Detection',
    description: 'Triggers when budget spent exceeds threshold percentage of total budget',
    agentMapping: 'finops',
    category: 'budget-alert',
  },
  {
    slug: 'burn-rate-anomaly',
    name: 'Burn Rate Anomaly',
    description: 'Detects when monthly burn rate exceeds expected rate by threshold',
    agentMapping: 'finops',
    category: 'budget-alert',
  },
  {
    slug: 'schedule-variance-check',
    name: 'Schedule Variance Detection',
    description: 'Triggers when schedule slips beyond threshold days',
    agentMapping: 'tmo',
    category: 'schedule-alert',
  },
  {
    slug: 'spi-critical',
    name: 'Schedule Performance Index Critical',
    description: 'Triggers when SPI drops below critical threshold',
    agentMapping: 'tmo',
    category: 'schedule-alert',
  },
  {
    slug: 'risk-score-escalation',
    name: 'Risk Score Escalation',
    description: 'Escalates when risk score exceeds high threshold',
    agentMapping: 'risk',
    category: 'risk-alert',
  },
  {
    slug: 'mitigation-overdue',
    name: 'Mitigation Overdue',
    description: 'Alerts when risk mitigation actions are overdue by threshold days',
    agentMapping: 'risk',
    category: 'risk-alert',
  },
  {
    slug: 'compliance-score-low',
    name: 'Compliance Score Below Minimum',
    description: 'Triggers when compliance score drops below required minimum',
    agentMapping: 'governance',
    category: 'compliance-alert',
  },
  {
    slug: 'policy-violation-limit',
    name: 'Policy Violation Limit Exceeded',
    description: 'Escalates when policy violations exceed threshold count',
    agentMapping: 'governance',
    category: 'compliance-alert',
  },
  {
    slug: 'project-health-low',
    name: 'Project Health Score Low',
    description: 'Triggers when project health score drops below threshold',
    agentMapping: 'pmo',
    category: 'health-alert',
  },
  {
    slug: 'resource-overallocation',
    name: 'Resource Over-Allocation',
    description: 'Alerts when resource utilization exceeds capacity threshold',
    agentMapping: 'pmo',
    category: 'health-alert',
  },
  {
    slug: 'value-gap-critical',
    name: 'Value Realization Gap Critical',
    description: 'Triggers when gap between planned and realized value exceeds threshold',
    agentMapping: 'vro',
    category: 'value-gap',
  },
  {
    slug: 'roi-below-minimum',
    name: 'ROI Below Minimum',
    description: 'Alerts when project ROI drops below minimum acceptable threshold',
    agentMapping: 'vro',
    category: 'value-gap',
  },
  {
    slug: 'readiness-score-low',
    name: 'Change Readiness Score Low',
    description: 'Triggers when organizational readiness falls below threshold',
    agentMapping: 'ocm',
    category: 'change-impact',
  },
  {
    slug: 'adoption-rate-low',
    name: 'Adoption Rate Below Target',
    description: 'Alerts when user adoption rate is below target percentage',
    agentMapping: 'ocm',
    category: 'change-impact',
  },
  {
    slug: 'dependency-blocked',
    name: 'Blocked Dependencies Limit',
    description: 'Escalates when blocked dependencies exceed threshold count',
    agentMapping: 'planning',
    category: 'dependency-alert',
  },
  {
    slug: 'okr-progress-drift',
    name: 'OKR Progress Drift',
    description: 'Alerts when OKR progress drifts significantly from expected trajectory',
    agentMapping: 'okr',
    category: 'health-alert',
  },
];

const LOCAL_THRESHOLDS: Record<string, Record<string, { threshold: number; operator: 'gt' | 'lt' | 'gte' | 'lte'; severity: 'low' | 'medium' | 'high' | 'critical'; escalateSeverity?: 'critical' }>> = {
  'budget-overrun-check': {
    budgetUtilization: { threshold: 85, operator: 'gte', severity: 'medium', escalateSeverity: 'critical' },
  },
  'burn-rate-anomaly': {
    burnRatePercent: { threshold: 150, operator: 'gte', severity: 'high' },
  },
  'schedule-variance-check': {
    varianceDays: { threshold: 7, operator: 'gte', severity: 'medium', escalateSeverity: 'critical' },
  },
  'spi-critical': {
    spiValue: { threshold: 0.85, operator: 'lte', severity: 'high' },
  },
  'risk-score-escalation': {
    riskScore: { threshold: 7, operator: 'gte', severity: 'high', escalateSeverity: 'critical' },
  },
  'mitigation-overdue': {
    overdueDays: { threshold: 14, operator: 'gte', severity: 'high' },
  },
  'compliance-score-low': {
    complianceScore: { threshold: 80, operator: 'lte', severity: 'high' },
  },
  'policy-violation-limit': {
    violationCount: { threshold: 3, operator: 'gte', severity: 'high', escalateSeverity: 'critical' },
  },
  'project-health-low': {
    healthScore: { threshold: 60, operator: 'lte', severity: 'medium', escalateSeverity: 'critical' },
  },
  'resource-overallocation': {
    utilizationPercent: { threshold: 120, operator: 'gte', severity: 'high' },
  },
  'value-gap-critical': {
    valueGapPercent: { threshold: 25, operator: 'gte', severity: 'high' },
  },
  'roi-below-minimum': {
    roiValue: { threshold: 1.0, operator: 'lte', severity: 'medium' },
  },
  'readiness-score-low': {
    readinessScore: { threshold: 50, operator: 'lte', severity: 'high' },
  },
  'adoption-rate-low': {
    adoptionRate: { threshold: 40, operator: 'lte', severity: 'medium' },
  },
  'dependency-blocked': {
    blockedCount: { threshold: 5, operator: 'gte', severity: 'high' },
  },
  'okr-progress-drift': {
    driftPercent: { threshold: 20, operator: 'gte', severity: 'medium' },
  },
};

export class RulebricksService {
  private static instance: RulebricksService | null = null;
  private apiKey: string | null;
  private available: boolean = false;

  private constructor() {
    this.apiKey = process.env.RULEBRICKS_API_KEY || null;
    if (this.apiKey) {
      this.available = true;
      console.log('[Rulebricks] Service initialized with API key');
    } else {
      console.log('[Rulebricks] No API key — using local threshold fallback');
    }
  }

  static getInstance(): RulebricksService {
    if (!RulebricksService.instance) {
      RulebricksService.instance = new RulebricksService();
    }
    return RulebricksService.instance;
  }

  isAvailable(): boolean {
    return this.available;
  }

  getEnterpriseRules(): RulebricksRule[] {
    return ENTERPRISE_RULES;
  }

  getRulesForAgent(agentType: string): RulebricksRule[] {
    const normalized = agentType.toLowerCase().replace(/deep|agent/g, '');
    return ENTERPRISE_RULES.filter(r => r.agentMapping === normalized);
  }

  getRulesByCategory(category: string): RulebricksRule[] {
    return ENTERPRISE_RULES.filter(r => r.category === category);
  }

  async evaluateRule(
    ruleSlug: string,
    input: Record<string, any>
  ): Promise<RulebricksEvalResult> {
    const startTime = Date.now();

    if (this.available && this.apiKey) {
      try {
        const result = await this.callRulebricksAPI(ruleSlug, input);
        return {
          ruleSlug,
          ...result,
          source: 'rulebricks',
          executionTimeMs: Date.now() - startTime,
        };
      } catch (error: any) {
        console.warn(`[Rulebricks] API call failed for ${ruleSlug}: ${error.message}, using local fallback`);
      }
    }

    const result = this.evaluateLocal(ruleSlug, input);
    return {
      ruleSlug,
      ...result,
      source: 'local-fallback',
      executionTimeMs: Date.now() - startTime,
    };
  }

  async evaluateAgentRules(
    agentType: string,
    input: Record<string, any>
  ): Promise<RulebricksEvalResult[]> {
    const rules = this.getRulesForAgent(agentType);
    const results = await Promise.all(
      rules.map(rule => this.evaluateRule(rule.slug, input))
    );
    return results;
  }

  async evaluateAllRules(
    input: Record<string, any>
  ): Promise<{ results: RulebricksEvalResult[]; triggered: RulebricksEvalResult[]; summary: Record<string, number> }> {
    const results = await Promise.all(
      ENTERPRISE_RULES.map(rule => this.evaluateRule(rule.slug, input))
    );

    const triggered = results.filter(r => r.triggered);

    const summary: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    triggered.forEach(r => { summary[r.severity]++; });

    return { results, triggered, summary };
  }

  private async callRulebricksAPI(
    ruleSlug: string,
    input: Record<string, any>
  ): Promise<{ triggered: boolean; severity: 'low' | 'medium' | 'high' | 'critical'; message: string; action?: string; details?: Record<string, any> }> {
    const response = await fetch(`${RULEBRICKS_API_BASE}/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
      },
      body: JSON.stringify({
        slug: ruleSlug,
        request: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Rulebricks API returned ${response.status}`);
    }

    const data = await response.json();

    return {
      triggered: data.triggered ?? data.alert ?? false,
      severity: data.severity || 'medium',
      message: data.message || data.reason || `Rule ${ruleSlug} evaluated`,
      action: data.action || data.recommended_action,
      details: data,
    };
  }

  private evaluateLocal(
    ruleSlug: string,
    input: Record<string, any>
  ): { triggered: boolean; severity: 'low' | 'medium' | 'high' | 'critical'; message: string; action?: string; details?: Record<string, any> } {
    const ruleThresholds = LOCAL_THRESHOLDS[ruleSlug];
    if (!ruleThresholds) {
      return {
        triggered: false,
        severity: 'low',
        message: `No local threshold defined for ${ruleSlug}`,
      };
    }

    let triggered = false;
    let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const messages: string[] = [];
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };

    for (const [field, config] of Object.entries(ruleThresholds)) {
      const value = input[field];
      if (value === undefined || value === null) continue;

      let breached = false;
      switch (config.operator) {
        case 'gt': breached = value > config.threshold; break;
        case 'lt': breached = value < config.threshold; break;
        case 'gte': breached = value >= config.threshold; break;
        case 'lte': breached = value <= config.threshold; break;
      }

      if (breached) {
        triggered = true;
        let severity = config.severity;

        if (config.escalateSeverity) {
          const excess = config.operator === 'gte' || config.operator === 'gt'
            ? value / config.threshold
            : config.threshold / Math.max(value, 0.01);
          if (excess >= 1.5) severity = config.escalateSeverity;
        }

        if (severityOrder[severity] > severityOrder[highestSeverity]) {
          highestSeverity = severity;
        }

        messages.push(`${field}: ${value} ${config.operator} ${config.threshold}`);
      }
    }

    const rule = ENTERPRISE_RULES.find(r => r.slug === ruleSlug);
    const actionMap: Record<string, string> = {
      critical: 'escalate_immediately',
      high: 'review_and_mitigate',
      medium: 'monitor_closely',
      low: 'log_for_review',
    };

    return {
      triggered,
      severity: highestSeverity,
      message: triggered
        ? `${rule?.name || ruleSlug}: ${messages.join('; ')}`
        : `${rule?.name || ruleSlug}: within acceptable range`,
      action: triggered ? actionMap[highestSeverity] : undefined,
      details: { thresholds: ruleThresholds, input, breaches: messages },
    };
  }
}

let rulebricksInstance: RulebricksService | null = null;

export function initializeRulebricksService(): RulebricksService {
  rulebricksInstance = RulebricksService.getInstance();
  return rulebricksInstance;
}

export function getRulebricksService(): RulebricksService | null {
  return rulebricksInstance;
}
