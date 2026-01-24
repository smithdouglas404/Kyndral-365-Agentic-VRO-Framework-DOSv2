/**
 * RISK AGENT - DEFAULT ATTRIBUTES & RULES
 *
 * Risk assessment, mitigation planning, risk scoring
 */

import { AttributeDefinition, RuleDefinition } from './FinOpsAgentAttributes';

/**
 * Default attributes that Risk agent can measure
 */
export const RISK_DEFAULT_ATTRIBUTES: Record<string, AttributeDefinition> = {
  riskScore: {
    name: 'riskScore',
    displayName: 'Overall Risk Score',
    type: 'number',
    description: 'Composite risk score based on all identified risks (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 50,
      critical: 70
    }
  },

  probabilityOfFailure: {
    name: 'probabilityOfFailure',
    displayName: 'Probability of Failure',
    type: 'percentage',
    description: 'Calculated probability that project will fail to meet objectives',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 40,
      critical: 70
    }
  },

  highPriorityRisksCount: {
    name: 'highPriorityRisksCount',
    displayName: 'High Priority Risks Count',
    type: 'number',
    description: 'Number of high or critical priority risks',
    unit: 'count',
    source: 'calculated',
    defaultThresholds: {
      warning: 3,
      critical: 5
    }
  },

  financialExposure: {
    name: 'financialExposure',
    displayName: 'Financial Exposure',
    type: 'currency',
    description: 'Total potential financial impact of identified risks',
    unit: '$',
    source: 'calculated',
    defaultThresholds: {
      warning: 500000,
      critical: 1000000
    }
  },

  scheduleExposure: {
    name: 'scheduleExposure',
    displayName: 'Schedule Exposure',
    type: 'number',
    description: 'Potential schedule delay in days from risks',
    unit: 'days',
    source: 'calculated',
    defaultThresholds: {
      warning: 14,
      critical: 30
    }
  },

  mitigationCoverage: {
    name: 'mitigationCoverage',
    displayName: 'Mitigation Coverage',
    type: 'percentage',
    description: 'Percentage of risks with active mitigation plans',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 70,
      critical: 50
    }
  },

  emergingRisksCount: {
    name: 'emergingRisksCount',
    displayName: 'Emerging Risks Count',
    type: 'number',
    description: 'Number of newly identified risks in last period',
    unit: 'count',
    source: 'calculated',
    defaultThresholds: {
      warning: 2,
      critical: 4
    }
  },

  riskTrend: {
    name: 'riskTrend',
    displayName: 'Risk Trend',
    type: 'enum',
    description: 'Direction of overall risk trajectory',
    values: ['improving', 'stable', 'worsening', 'critical'],
    source: 'calculated',
    defaultThresholds: {
      warning: 'worsening',
      critical: 'critical'
    }
  }
};

/**
 * Default rules for Risk agent
 */
export const RISK_DEFAULT_RULES: RuleDefinition[] = [
  {
    id: 'risk-critical-score',
    name: 'Critical Risk Score Alert',
    description: 'Escalate when overall risk score reaches critical level',
    enabled: true,
    conditions: [
      { attribute: 'riskScore', operator: '>', threshold: 70 }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance'],
        severity: 'critical',
        message: 'Risk score critical - governance review required'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['finops', 'vro'],
        severity: 'high',
        message: 'High risk detected - assess financial and value impact'
      },
      {
        type: 'notify',
        targetUsers: ['risk-lead', 'pmo-lead'],
        severity: 'critical',
        message: 'Critical risk level - immediate action required'
      }
    ]
  },

  {
    id: 'risk-high-failure-probability',
    name: 'High Probability of Failure',
    description: 'Alert when failure probability exceeds acceptable threshold',
    enabled: true,
    conditions: [
      { attribute: 'probabilityOfFailure', operator: '>', threshold: 70 }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance', 'vro'],
        severity: 'critical',
        message: 'High probability of failure - strategic review needed'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['tmo', 'finops'],
        severity: 'critical',
        message: 'Failure risk high - assess schedule and budget recovery options'
      }
    ]
  },

  {
    id: 'risk-high-financial-exposure',
    name: 'High Financial Exposure',
    description: 'Alert when potential financial impact is significant',
    enabled: true,
    conditions: [
      { attribute: 'financialExposure', operator: '>', threshold: 1000000 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['finops'],
        severity: 'critical',
        message: 'Financial exposure exceeds $1M - budget contingency assessment needed'
      },
      {
        type: 'notify',
        targetUsers: ['risk-lead', 'finops-lead', 'cfo'],
        severity: 'critical',
        message: 'High financial risk exposure - executive review required'
      }
    ]
  },

  {
    id: 'risk-low-mitigation-coverage',
    name: 'Low Mitigation Coverage',
    description: 'Alert when too many risks lack mitigation plans',
    enabled: true,
    conditions: [
      { attribute: 'mitigationCoverage', operator: '<', threshold: 70 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['pmo'],
        severity: 'medium',
        message: 'Low mitigation coverage - risk response planning needed'
      },
      {
        type: 'notify',
        targetUsers: ['risk-lead'],
        severity: 'medium',
        message: 'Less than 70% of risks have mitigation plans'
      }
    ]
  },

  {
    id: 'risk-worsening-trend',
    name: 'Worsening Risk Trend',
    description: 'Alert when risk trend is deteriorating',
    enabled: true,
    conditions: [
      { attribute: 'riskTrend', operator: '==', threshold: 'worsening' }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['pmo', 'tmo'],
        severity: 'high',
        message: 'Risk trend worsening - review project health'
      },
      {
        type: 'notify',
        targetUsers: ['risk-lead', 'pmo-lead'],
        severity: 'high',
        message: 'Risk trajectory deteriorating - intervention may be needed'
      }
    ]
  },

  {
    id: 'risk-schedule-exposure-high',
    name: 'High Schedule Exposure',
    description: 'Alert when schedule risk exposure is significant',
    enabled: true,
    conditions: [
      { attribute: 'scheduleExposure', operator: '>', threshold: 30 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['tmo'],
        severity: 'high',
        message: 'Schedule exposure exceeds 30 days - timeline recovery assessment needed'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['vro'],
        severity: 'high',
        message: 'Schedule delays may impact value delivery'
      }
    ]
  }
];

/**
 * Required MCP connectors for Risk agent
 */
export const RISK_REQUIRED_CONNECTORS = [
  'ragie',                    // Document/knowledge RAG
  'sequential-thinking',      // Deep reasoning
  'sentry'                    // Error tracking (optional but recommended)
];
