/**
 * VRO AGENT - DEFAULT ATTRIBUTES & RULES
 *
 * Value realization, ROI tracking, strategic alignment, benefits management
 */

import { AttributeDefinition, RuleDefinition } from './FinOpsAgentAttributes';

/**
 * Default attributes that VRO agent can measure
 */
export const VRO_DEFAULT_ATTRIBUTES: Record<string, AttributeDefinition> = {
  valueScore: {
    name: 'valueScore',
    displayName: 'Overall Value Score',
    type: 'number',
    description: 'Composite value realization score (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 50,
      critical: 30
    }
  },

  strategicAlignmentScore: {
    name: 'strategicAlignmentScore',
    displayName: 'Strategic Alignment Score',
    type: 'number',
    description: 'Alignment with strategic objectives and OKRs (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 50,
      critical: 30
    }
  },

  projectedROI: {
    name: 'projectedROI',
    displayName: 'Projected ROI',
    type: 'percentage',
    description: 'Expected return on investment at current trajectory',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 100,
      critical: 50
    }
  },

  businessCaseHealth: {
    name: 'businessCaseHealth',
    displayName: 'Business Case Health',
    type: 'enum',
    description: 'Health status of the business case',
    values: ['strong', 'moderate', 'weak', 'negative'],
    source: 'calculated',
    defaultThresholds: {
      warning: 'weak',
      critical: 'negative'
    }
  },

  benefitsRealizationRate: {
    name: 'benefitsRealizationRate',
    displayName: 'Benefits Realization Rate',
    type: 'percentage',
    description: 'Percentage of planned benefits being realized',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 70,
      critical: 50
    }
  },

  valueAtRisk: {
    name: 'valueAtRisk',
    displayName: 'Value at Risk',
    type: 'currency',
    description: 'Estimated value at risk from current issues',
    unit: '$',
    source: 'calculated',
    defaultThresholds: {
      warning: 500000,
      critical: 1000000
    }
  },

  outcomeDeliveryConfidence: {
    name: 'outcomeDeliveryConfidence',
    displayName: 'Outcome Delivery Confidence',
    type: 'percentage',
    description: 'Confidence in achieving target outcomes',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 60,
      critical: 40
    }
  },

  stakeholderSatisfaction: {
    name: 'stakeholderSatisfaction',
    displayName: 'Stakeholder Satisfaction',
    type: 'number',
    description: 'Average stakeholder satisfaction score (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 60,
      critical: 40
    }
  }
};

/**
 * Default rules for VRO agent
 */
export const VRO_DEFAULT_RULES: RuleDefinition[] = [
  {
    id: 'vro-low-value-score',
    name: 'Low Value Score Alert',
    description: 'Alert when overall value realization is declining',
    enabled: true,
    conditions: [
      { attribute: 'valueScore', operator: '<', threshold: 50 }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance'],
        severity: 'high',
        message: 'Value score below 50 - strategic review needed'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['risk'],
        severity: 'high',
        message: 'Low value score - assess risks to value delivery'
      },
      {
        type: 'notify',
        targetUsers: ['vro-lead', 'sponsor'],
        severity: 'high',
        message: 'Value realization declining - intervention required'
      }
    ]
  },

  {
    id: 'vro-strategic-misalignment',
    name: 'Strategic Misalignment',
    description: 'Alert when project alignment with strategy is weak',
    enabled: true,
    conditions: [
      { attribute: 'strategicAlignmentScore', operator: '<', threshold: 40 }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance'],
        severity: 'critical',
        message: 'Strategic misalignment detected - continuation review needed'
      },
      {
        type: 'alert',
        targetAgents: ['pmo'],
        severity: 'critical',
        message: 'Strategic alignment weak - portfolio impact assessment needed'
      },
      {
        type: 'notify',
        targetUsers: ['vro-lead', 'sponsor', 'cxo'],
        severity: 'critical',
        message: 'Strategic misalignment - executive decision required'
      }
    ]
  },

  {
    id: 'vro-negative-business-case',
    name: 'Negative Business Case',
    description: 'Immediate escalation when business case becomes negative',
    enabled: true,
    conditions: [
      { attribute: 'businessCaseHealth', operator: '==', threshold: 'negative' }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance'],
        severity: 'critical',
        message: 'Business case negative - project viability review required'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['finops', 'risk'],
        severity: 'critical',
        message: 'Negative business case - assess financial and strategic implications'
      },
      {
        type: 'notify',
        targetUsers: ['vro-lead', 'sponsor', 'cfo'],
        severity: 'critical',
        message: 'Business case negative - project continuation decision needed'
      }
    ]
  },

  {
    id: 'vro-low-roi',
    name: 'Low Projected ROI',
    description: 'Alert when projected ROI falls below acceptable threshold',
    enabled: true,
    conditions: [
      { attribute: 'projectedROI', operator: '<', threshold: 100 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['finops'],
        severity: 'high',
        message: 'Projected ROI below 100% - cost optimization assessment needed'
      },
      {
        type: 'notify',
        targetUsers: ['vro-lead', 'finops-lead'],
        severity: 'high',
        message: 'Low projected ROI - value enhancement strategies needed'
      }
    ]
  },

  {
    id: 'vro-high-value-at-risk',
    name: 'High Value at Risk',
    description: 'Alert when significant value is at risk',
    enabled: true,
    conditions: [
      { attribute: 'valueAtRisk', operator: '>', threshold: 1000000 }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance', 'risk'],
        severity: 'critical',
        message: 'Value at risk exceeds $1M - mitigation required'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['tmo', 'finops'],
        severity: 'critical',
        message: 'High value at risk - assess recovery options and costs'
      },
      {
        type: 'notify',
        targetUsers: ['vro-lead', 'sponsor'],
        severity: 'critical',
        message: 'Significant value at risk - immediate action needed'
      }
    ]
  },

  {
    id: 'vro-low-benefits-realization',
    name: 'Low Benefits Realization',
    description: 'Alert when benefits realization is below target',
    enabled: true,
    conditions: [
      { attribute: 'benefitsRealizationRate', operator: '<', threshold: 70 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['ocm', 'pmo'],
        severity: 'high',
        message: 'Benefits realization below 70% - adoption and delivery issues'
      },
      {
        type: 'notify',
        targetUsers: ['vro-lead'],
        severity: 'high',
        message: 'Low benefits realization - review realization plan'
      }
    ]
  },

  {
    id: 'vro-low-delivery-confidence',
    name: 'Low Outcome Delivery Confidence',
    description: 'Alert when confidence in achieving outcomes is low',
    enabled: true,
    conditions: [
      { attribute: 'outcomeDeliveryConfidence', operator: '<', threshold: 60 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['risk', 'pmo'],
        severity: 'high',
        message: 'Low delivery confidence - risk assessment and plan review needed'
      },
      {
        type: 'notify',
        targetUsers: ['vro-lead', 'sponsor'],
        severity: 'high',
        message: 'Confidence in outcome delivery low - intervention needed'
      }
    ]
  },

  {
    id: 'vro-stakeholder-dissatisfaction',
    name: 'Stakeholder Dissatisfaction',
    description: 'Alert when stakeholder satisfaction is low',
    enabled: true,
    conditions: [
      { attribute: 'stakeholderSatisfaction', operator: '<', threshold: 50 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['ocm', 'pmo'],
        severity: 'high',
        message: 'Low stakeholder satisfaction - engagement issues'
      },
      {
        type: 'notify',
        targetUsers: ['vro-lead', 'sponsor'],
        severity: 'high',
        message: 'Stakeholder satisfaction low - communication and alignment needed'
      }
    ]
  }
];

/**
 * Required MCP connectors for VRO agent
 */
export const VRO_REQUIRED_CONNECTORS = [
  'ragie',                    // Document/knowledge RAG
  'dynamics-365-erp',        // Business data (optional but recommended)
  'greptimedb',              // Time series analytics (optional)
  'clickhouse',              // Analytics (optional but recommended)
  'financial-datasets'       // Financial data (optional)
];
