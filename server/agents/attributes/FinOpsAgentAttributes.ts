/**
 * FINOPS AGENT - DEFAULT ATTRIBUTES & RULES
 *
 * Financial operations, budget management, cost optimization
 */

export interface AttributeDefinition {
  name: string;
  displayName: string;
  type: 'number' | 'percentage' | 'currency' | 'enum' | 'boolean' | 'text';
  description: string;
  unit?: string;
  source: 'calculated' | 'project_field' | 'external_api';
  sourcePath?: string;
  values?: string[];  // For enum types
  defaultThresholds?: {
    warning?: number | string;
    critical?: number | string;
  };
}

export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    attribute: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number | string;
  }[];
  actions: {
    type: 'alert' | 'escalate' | 'trigger_agent' | 'block' | 'notify';
    targetAgents?: string[];
    targetUsers?: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    message?: string;
  }[];
}

/**
 * Default attributes that FinOps agent can measure
 */
export const FINOPS_DEFAULT_ATTRIBUTES: Record<string, AttributeDefinition> = {
  variance: {
    name: 'variance',
    displayName: 'Budget Variance',
    type: 'percentage',
    description: 'Percentage difference between actual spend and planned budget',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 15,
      critical: 20
    }
  },

  burnRate: {
    name: 'burnRate',
    displayName: 'Burn Rate',
    type: 'percentage',
    description: 'Rate of budget consumption compared to timeline progress',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 120,
      critical: 150
    }
  },

  budgetHealth: {
    name: 'budgetHealth',
    displayName: 'Budget Health Status',
    type: 'enum',
    description: 'Overall financial health assessment',
    values: ['healthy', 'warning', 'critical', 'overrun'],
    source: 'calculated',
    defaultThresholds: {
      warning: 'warning',
      critical: 'critical'
    }
  },

  remainingBudget: {
    name: 'remainingBudget',
    displayName: 'Remaining Budget',
    type: 'currency',
    description: 'Unspent budget remaining',
    unit: '$',
    source: 'project_field',
    sourcePath: 'remainingBudget'
  },

  forecastAccuracy: {
    name: 'forecastAccuracy',
    displayName: 'Forecast Accuracy',
    type: 'percentage',
    description: 'Accuracy of financial forecasting vs actuals',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 70,
      critical: 50
    }
  },

  costPerFeature: {
    name: 'costPerFeature',
    displayName: 'Cost Per Feature',
    type: 'currency',
    description: 'Average cost per delivered feature',
    unit: '$',
    source: 'calculated'
  },

  totalSpend: {
    name: 'totalSpend',
    displayName: 'Total Spend',
    type: 'currency',
    description: 'Total budget spent to date',
    unit: '$',
    source: 'project_field',
    sourcePath: 'totalSpend'
  },

  monthlyBurnAmount: {
    name: 'monthlyBurnAmount',
    displayName: 'Monthly Burn Amount',
    type: 'currency',
    description: 'Average monthly spending rate',
    unit: '$',
    source: 'calculated'
  }
};

/**
 * Default rules for FinOps agent
 */
export const FINOPS_DEFAULT_RULES: RuleDefinition[] = [
  {
    id: 'finops-high-variance',
    name: 'High Budget Variance Alert',
    description: 'Alert when budget variance exceeds acceptable threshold',
    enabled: true,
    conditions: [
      { attribute: 'variance', operator: '>', threshold: 20 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['risk'],
        severity: 'high',
        message: 'Budget variance exceeds 20% - financial risk assessment needed'
      },
      {
        type: 'notify',
        targetUsers: ['finops-lead'],
        severity: 'high',
        message: 'High budget variance detected - review required'
      }
    ]
  },

  {
    id: 'finops-critical-burn-rate',
    name: 'Critical Burn Rate',
    description: 'Escalate when burn rate indicates likely budget overrun',
    enabled: true,
    conditions: [
      { attribute: 'burnRate', operator: '>', threshold: 150 }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance'],
        severity: 'critical',
        message: 'Critical burn rate detected - governance review required'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['risk'],
        severity: 'critical',
        message: 'High burn rate - assess financial risk'
      }
    ]
  },

  {
    id: 'finops-budget-overrun',
    name: 'Budget Overrun',
    description: 'Immediate action when budget health is critical or overrun',
    enabled: true,
    conditions: [
      { attribute: 'budgetHealth', operator: '==', threshold: 'critical' }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance'],
        severity: 'critical',
        message: 'Budget in critical state - immediate review needed'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['vro', 'risk'],
        severity: 'critical',
        message: 'Budget critical - assess value delivery and risk impact'
      },
      {
        type: 'notify',
        targetUsers: ['finops-lead', 'cfo'],
        severity: 'critical',
        message: 'Budget health critical - executive attention required'
      }
    ]
  },

  {
    id: 'finops-low-forecast-accuracy',
    name: 'Low Forecast Accuracy',
    description: 'Alert when financial forecasting becomes unreliable',
    enabled: true,
    conditions: [
      { attribute: 'forecastAccuracy', operator: '<', threshold: 70 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['tmo'],
        severity: 'medium',
        message: 'Low forecast accuracy - schedule projections may be unreliable'
      },
      {
        type: 'notify',
        targetUsers: ['finops-lead'],
        severity: 'medium',
        message: 'Forecast accuracy below 70% - review forecasting methods'
      }
    ]
  },

  {
    id: 'finops-remaining-budget-low',
    name: 'Remaining Budget Low',
    description: 'Alert when remaining budget falls below critical threshold',
    enabled: true,
    conditions: [
      { attribute: 'remainingBudget', operator: '<', threshold: 100000 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['risk', 'vro'],
        severity: 'high',
        message: 'Remaining budget below $100K - assess delivery risk'
      },
      {
        type: 'notify',
        targetUsers: ['finops-lead'],
        severity: 'high',
        message: 'Low remaining budget - scope/schedule adjustments may be needed'
      }
    ]
  }
];

/**
 * Required MCP connectors for FinOps agent
 */
export const FINOPS_REQUIRED_CONNECTORS = [
  'ragie',                    // Document/knowledge RAG
  'quickbooks',              // Financial data (optional but recommended)
  'dynamics-365-erp',        // ERP integration (optional but recommended)
  'clickhouse'               // Analytics (optional but recommended)
];
