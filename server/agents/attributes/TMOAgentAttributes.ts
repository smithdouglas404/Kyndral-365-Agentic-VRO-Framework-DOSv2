/**
 * TMO AGENT - DEFAULT ATTRIBUTES & RULES
 *
 * Schedule management, timeline optimization, critical path analysis
 */

import { AttributeDefinition, RuleDefinition } from './FinOpsAgentAttributes';

/**
 * Default attributes that TMO agent can measure
 */
export const TMO_DEFAULT_ATTRIBUTES: Record<string, AttributeDefinition> = {
  scheduleVariance: {
    name: 'scheduleVariance',
    displayName: 'Schedule Variance',
    type: 'number',
    description: 'Days ahead or behind schedule (negative = behind)',
    unit: 'days',
    source: 'calculated',
    defaultThresholds: {
      warning: -7,
      critical: -14
    }
  },

  criticalPathStatus: {
    name: 'criticalPathStatus',
    displayName: 'Critical Path Status',
    type: 'enum',
    description: 'Health status of the critical path',
    values: ['on-track', 'at-risk', 'delayed', 'critical'],
    source: 'calculated',
    defaultThresholds: {
      warning: 'at-risk',
      critical: 'critical'
    }
  },

  schedulePerformanceIndex: {
    name: 'schedulePerformanceIndex',
    displayName: 'Schedule Performance Index (SPI)',
    type: 'number',
    description: 'Ratio of earned value to planned value (1.0 = on schedule)',
    unit: 'ratio',
    source: 'calculated',
    defaultThresholds: {
      warning: 0.9,
      critical: 0.8
    }
  },

  milestonesAtRisk: {
    name: 'milestonesAtRisk',
    displayName: 'Milestones at Risk',
    type: 'number',
    description: 'Number of milestones at risk of missing target dates',
    unit: 'count',
    source: 'calculated',
    defaultThresholds: {
      warning: 2,
      critical: 4
    }
  },

  resourceUtilization: {
    name: 'resourceUtilization',
    displayName: 'Resource Utilization',
    type: 'percentage',
    description: 'Average team resource utilization rate',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 120,
      critical: 150
    }
  },

  taskCompletionRate: {
    name: 'taskCompletionRate',
    displayName: 'Task Completion Rate',
    type: 'percentage',
    description: 'Percentage of tasks completed on time',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 70,
      critical: 50
    }
  },

  criticalPathBufferDays: {
    name: 'criticalPathBufferDays',
    displayName: 'Critical Path Buffer',
    type: 'number',
    description: 'Days of buffer remaining on critical path',
    unit: 'days',
    source: 'calculated',
    defaultThresholds: {
      warning: 5,
      critical: 2
    }
  },

  dependencyRisks: {
    name: 'dependencyRisks',
    displayName: 'Dependency Risks',
    type: 'number',
    description: 'Number of blocked or at-risk task dependencies',
    unit: 'count',
    source: 'calculated',
    defaultThresholds: {
      warning: 3,
      critical: 6
    }
  }
};

/**
 * Default rules for TMO agent
 */
export const TMO_DEFAULT_RULES: RuleDefinition[] = [
  {
    id: 'tmo-schedule-delay',
    name: 'Schedule Delay Alert',
    description: 'Alert when schedule variance exceeds acceptable threshold',
    enabled: true,
    conditions: [
      { attribute: 'scheduleVariance', operator: '<', threshold: -7 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['risk'],
        severity: 'high',
        message: 'Schedule delayed by 7+ days - risk assessment needed'
      },
      {
        type: 'notify',
        targetUsers: ['tmo-lead', 'pmo-lead'],
        severity: 'high',
        message: 'Schedule behind - recovery plan required'
      }
    ]
  },

  {
    id: 'tmo-critical-path-impact',
    name: 'Critical Path Impact',
    description: 'Immediate escalation when critical path is impacted',
    enabled: true,
    conditions: [
      { attribute: 'criticalPathStatus', operator: '==', threshold: 'critical' }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance', 'risk'],
        severity: 'critical',
        message: 'Critical path in critical state - project delivery at risk'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['finops', 'vro'],
        severity: 'critical',
        message: 'Critical path issues - assess cost of acceleration and value impact'
      },
      {
        type: 'notify',
        targetUsers: ['tmo-lead', 'pmo-lead', 'sponsor'],
        severity: 'critical',
        message: 'Critical path critical - executive intervention required'
      }
    ]
  },

  {
    id: 'tmo-low-spi',
    name: 'Low Schedule Performance Index',
    description: 'Alert when SPI indicates schedule performance issues',
    enabled: true,
    conditions: [
      { attribute: 'schedulePerformanceIndex', operator: '<', threshold: 0.9 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['pmo', 'risk'],
        severity: 'medium',
        message: 'SPI below 0.9 - schedule performance degrading'
      },
      {
        type: 'notify',
        targetUsers: ['tmo-lead'],
        severity: 'medium',
        message: 'Schedule performance index low - intervention needed'
      }
    ]
  },

  {
    id: 'tmo-buffer-exhausted',
    name: 'Critical Path Buffer Exhausted',
    description: 'Alert when critical path buffer is running out',
    enabled: true,
    conditions: [
      { attribute: 'criticalPathBufferDays', operator: '<', threshold: 5 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['risk'],
        severity: 'high',
        message: 'Critical path buffer below 5 days - schedule risk increasing'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['finops'],
        severity: 'high',
        message: 'Low schedule buffer - assess fast-track options and costs'
      },
      {
        type: 'notify',
        targetUsers: ['tmo-lead', 'pmo-lead'],
        severity: 'high',
        message: 'Critical path buffer low - proactive action needed'
      }
    ]
  },

  {
    id: 'tmo-resource-overload',
    name: 'Resource Overload',
    description: 'Alert when resource utilization indicates burnout risk',
    enabled: true,
    conditions: [
      { attribute: 'resourceUtilization', operator: '>', threshold: 120 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['pmo', 'ocm'],
        severity: 'high',
        message: 'Resource utilization over 120% - team burnout risk'
      },
      {
        type: 'notify',
        targetUsers: ['tmo-lead', 'resource-manager'],
        severity: 'high',
        message: 'Resources overloaded - rebalancing or additional capacity needed'
      }
    ]
  },

  {
    id: 'tmo-milestones-at-risk',
    name: 'Multiple Milestones at Risk',
    description: 'Alert when multiple milestones are at risk',
    enabled: true,
    conditions: [
      { attribute: 'milestonesAtRisk', operator: '>', threshold: 3 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['risk', 'vro'],
        severity: 'high',
        message: 'Multiple milestones at risk - delivery and value impact'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['finops'],
        severity: 'medium',
        message: 'Milestone delays may require budget for acceleration'
      }
    ]
  },

  {
    id: 'tmo-dependency-risks',
    name: 'High Dependency Risks',
    description: 'Alert when too many dependencies are at risk',
    enabled: true,
    conditions: [
      { attribute: 'dependencyRisks', operator: '>', threshold: 5 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['pmo', 'risk'],
        severity: 'high',
        message: 'High number of dependency risks - coordination issues'
      },
      {
        type: 'notify',
        targetUsers: ['tmo-lead'],
        severity: 'high',
        message: 'Dependency risks high - stakeholder alignment needed'
      }
    ]
  }
];

/**
 * Required MCP connectors for TMO agent
 */
export const TMO_REQUIRED_CONNECTORS = [
  'ragie',                    // Document/knowledge RAG
  'project-knowledge-graph',  // Project relationships
  'sequential-thinking',      // Deep reasoning
  'clickhouse',              // Analytics (optional but recommended)
  'microsoft-project-server' // Project management (optional)
];
