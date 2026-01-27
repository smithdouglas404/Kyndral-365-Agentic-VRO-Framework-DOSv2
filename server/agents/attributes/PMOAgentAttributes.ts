/**
 * PMO AGENT - DEFAULT ATTRIBUTES & RULES
 *
 * Portfolio management, project health, delivery metrics, governance
 */

import { AttributeDefinition, RuleDefinition } from './FinOpsAgentAttributes';

// Re-export for use in PMO agent
export type { AttributeDefinition, RuleDefinition };

/**
 * Default attributes that PMO agent can measure
 */
export const PMO_DEFAULT_ATTRIBUTES: Record<string, AttributeDefinition> = {
  projectHealthScore: {
    name: 'projectHealthScore',
    displayName: 'Project Health Score',
    type: 'number',
    description: 'Composite project health score (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 60,
      critical: 40
    }
  },

  onTimeDeliveryRate: {
    name: 'onTimeDeliveryRate',
    displayName: 'On-Time Delivery Rate',
    type: 'percentage',
    description: 'Percentage of deliverables completed on time',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 80,
      critical: 60
    }
  },

  teamVelocityTrend: {
    name: 'teamVelocityTrend',
    displayName: 'Team Velocity Trend',
    type: 'percentage',
    description: 'Change in team velocity over recent periods',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: -15,
      critical: -30
    }
  },

  qualityMetrics: {
    name: 'qualityMetrics',
    displayName: 'Quality Score',
    type: 'number',
    description: 'Composite quality score based on defects, rework, and reviews',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 70,
      critical: 50
    }
  },

  deliveryPredictability: {
    name: 'deliveryPredictability',
    displayName: 'Delivery Predictability',
    type: 'percentage',
    description: 'Consistency in meeting delivery commitments',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 75,
      critical: 60
    }
  },

  teamMoraleScore: {
    name: 'teamMoraleScore',
    displayName: 'Team Morale Score',
    type: 'number',
    description: 'Team satisfaction and engagement score (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 60,
      critical: 40
    }
  },

  scopeCreep: {
    name: 'scopeCreep',
    displayName: 'Scope Creep',
    type: 'percentage',
    description: 'Percentage of scope growth beyond baseline',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 15,
      critical: 30
    }
  },

  issueResolutionTime: {
    name: 'issueResolutionTime',
    displayName: 'Avg Issue Resolution Time',
    type: 'number',
    description: 'Average days to resolve issues',
    unit: 'days',
    source: 'calculated',
    defaultThresholds: {
      warning: 7,
      critical: 14
    }
  }
};

/**
 * Default rules for PMO agent
 */
export const PMO_DEFAULT_RULES: RuleDefinition[] = [
  {
    id: 'pmo-low-health-score',
    name: 'Low Project Health Score',
    description: 'Alert when overall project health is declining',
    enabled: true,
    conditions: [
      { attribute: 'projectHealthScore', operator: '<', threshold: 60 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['risk', 'vro'],
        severity: 'high',
        message: 'Project health below 60 - risk and value assessment needed'
      },
      {
        type: 'notify',
        targetUsers: ['pmo-lead', 'sponsor'],
        severity: 'high',
        message: 'Project health declining - intervention required'
      }
    ]
  },

  {
    id: 'pmo-low-delivery-rate',
    name: 'Low On-Time Delivery Rate',
    description: 'Alert when delivery performance is poor',
    enabled: true,
    conditions: [
      { attribute: 'onTimeDeliveryRate', operator: '<', threshold: 80 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['tmo'],
        severity: 'high',
        message: 'On-time delivery below 80% - schedule management review needed'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['risk'],
        severity: 'high',
        message: 'Poor delivery performance - assess delivery risks'
      },
      {
        type: 'notify',
        targetUsers: ['pmo-lead', 'delivery-manager'],
        severity: 'high',
        message: 'On-time delivery rate low - process improvement needed'
      }
    ]
  },

  {
    id: 'pmo-velocity-decline',
    name: 'Declining Team Velocity',
    description: 'Alert when team velocity is trending downward',
    enabled: true,
    conditions: [
      { attribute: 'teamVelocityTrend', operator: '<', threshold: -20 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['tmo', 'ocm'],
        severity: 'high',
        message: 'Team velocity declining 20% - schedule impact and morale assessment needed'
      },
      {
        type: 'notify',
        targetUsers: ['pmo-lead', 'team-lead'],
        severity: 'high',
        message: 'Team velocity declining significantly - investigate impediments'
      }
    ]
  },

  {
    id: 'pmo-quality-issues',
    name: 'Quality Issues',
    description: 'Alert when quality metrics are below acceptable levels',
    enabled: true,
    conditions: [
      { attribute: 'qualityMetrics', operator: '<', threshold: 70 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['risk'],
        severity: 'high',
        message: 'Quality score below 70 - technical debt and rework risks'
      },
      {
        type: 'notify',
        targetUsers: ['pmo-lead', 'quality-lead'],
        severity: 'high',
        message: 'Quality metrics declining - quality assurance review needed'
      }
    ]
  },

  {
    id: 'pmo-low-predictability',
    name: 'Low Delivery Predictability',
    description: 'Alert when delivery becomes unpredictable',
    enabled: true,
    conditions: [
      { attribute: 'deliveryPredictability', operator: '<', threshold: 75 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['tmo'],
        severity: 'medium',
        message: 'Delivery predictability low - estimation and planning improvements needed'
      },
      {
        type: 'notify',
        targetUsers: ['pmo-lead'],
        severity: 'medium',
        message: 'Inconsistent delivery performance - process review required'
      }
    ]
  },

  {
    id: 'pmo-low-morale',
    name: 'Low Team Morale',
    description: 'Alert when team morale is declining',
    enabled: true,
    conditions: [
      { attribute: 'teamMoraleScore', operator: '<', threshold: 60 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['ocm'],
        severity: 'high',
        message: 'Low team morale - change management and support needed'
      },
      {
        type: 'notify',
        targetUsers: ['pmo-lead', 'team-lead', 'hr-lead'],
        severity: 'high',
        message: 'Team morale low - retention and productivity risk'
      }
    ]
  },

  {
    id: 'pmo-high-scope-creep',
    name: 'High Scope Creep',
    description: 'Alert when scope is growing beyond acceptable levels',
    enabled: true,
    conditions: [
      { attribute: 'scopeCreep', operator: '>', threshold: 20 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['finops', 'tmo'],
        severity: 'high',
        message: 'Scope creep over 20% - budget and schedule impact assessment needed'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['governance'],
        severity: 'high',
        message: 'High scope creep - scope control and change management review needed'
      },
      {
        type: 'notify',
        targetUsers: ['pmo-lead', 'sponsor'],
        severity: 'high',
        message: 'Excessive scope growth - formal scope baseline review required'
      }
    ]
  },

  {
    id: 'pmo-slow-issue-resolution',
    name: 'Slow Issue Resolution',
    description: 'Alert when issues are taking too long to resolve',
    enabled: true,
    conditions: [
      { attribute: 'issueResolutionTime', operator: '>', threshold: 10 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['tmo'],
        severity: 'medium',
        message: 'Issue resolution time over 10 days - blocking impacts schedule'
      },
      {
        type: 'notify',
        targetUsers: ['pmo-lead'],
        severity: 'medium',
        message: 'Slow issue resolution - process improvement or escalation needed'
      }
    ]
  }
];

/**
 * Required MCP connectors for PMO agent
 */
export const PMO_REQUIRED_CONNECTORS = [
  'ragie',                    // Document/knowledge RAG
  'clickhouse',              // Analytics
  'jira_cloud',              // Project tracking (optional but recommended)
  'asana'                    // Alternative project tracking (optional)
];
