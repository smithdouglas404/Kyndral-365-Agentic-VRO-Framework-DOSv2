/**
 * OCM AGENT - DEFAULT ATTRIBUTES & RULES
 *
 * Organizational change management, adoption tracking, stakeholder readiness
 */

import { AttributeDefinition, RuleDefinition } from './FinOpsAgentAttributes';

/**
 * Default attributes that OCM agent can measure
 */
export const OCM_DEFAULT_ATTRIBUTES: Record<string, AttributeDefinition> = {
  adoptionRate: {
    name: 'adoptionRate',
    displayName: 'User Adoption Rate',
    type: 'percentage',
    description: 'Percentage of target users actively adopting changes',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 70,
      critical: 50
    }
  },

  stakeholderReadinessScore: {
    name: 'stakeholderReadinessScore',
    displayName: 'Stakeholder Readiness Score',
    type: 'number',
    description: 'Overall stakeholder readiness for change (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 60,
      critical: 40
    }
  },

  changeResistanceLevel: {
    name: 'changeResistanceLevel',
    displayName: 'Change Resistance Level',
    type: 'enum',
    description: 'Level of resistance to change',
    values: ['low', 'moderate', 'high', 'severe'],
    source: 'calculated',
    defaultThresholds: {
      warning: 'high',
      critical: 'severe'
    }
  },

  trainingCompletionRate: {
    name: 'trainingCompletionRate',
    displayName: 'Training Completion Rate',
    type: 'percentage',
    description: 'Percentage of required training completed',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 80,
      critical: 60
    }
  },

  communicationEffectiveness: {
    name: 'communicationEffectiveness',
    displayName: 'Communication Effectiveness',
    type: 'number',
    description: 'Effectiveness of change communications (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 70,
      critical: 50
    }
  },

  sponsorEngagement: {
    name: 'sponsorEngagement',
    displayName: 'Sponsor Engagement',
    type: 'number',
    description: 'Active engagement level of executive sponsors (0-100)',
    unit: 'score',
    source: 'calculated',
    defaultThresholds: {
      warning: 70,
      critical: 50
    }
  },

  impactedUsersSupportLevel: {
    name: 'impactedUsersSupportLevel',
    displayName: 'Impacted Users Support Level',
    type: 'percentage',
    description: 'Percentage of impacted users with adequate support',
    unit: '%',
    source: 'calculated',
    defaultThresholds: {
      warning: 75,
      critical: 60
    }
  },

  changeReadinessGaps: {
    name: 'changeReadinessGaps',
    displayName: 'Change Readiness Gaps',
    type: 'number',
    description: 'Number of critical readiness gaps identified',
    unit: 'count',
    source: 'calculated',
    defaultThresholds: {
      warning: 3,
      critical: 5
    }
  }
};

/**
 * Default rules for OCM agent
 */
export const OCM_DEFAULT_RULES: RuleDefinition[] = [
  {
    id: 'ocm-low-adoption',
    name: 'Low Adoption Rate',
    description: 'Alert when user adoption is below target',
    enabled: true,
    conditions: [
      { attribute: 'adoptionRate', operator: '<', threshold: 70 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['vro'],
        severity: 'high',
        message: 'Adoption below 70% - value realization at risk'
      },
      {
        type: 'notify',
        targetUsers: ['ocm-lead', 'sponsor'],
        severity: 'high',
        message: 'Low adoption rate - enhanced change management interventions needed'
      }
    ]
  },

  {
    id: 'ocm-low-readiness',
    name: 'Low Stakeholder Readiness',
    description: 'Alert when stakeholders are not ready for change',
    enabled: true,
    conditions: [
      { attribute: 'stakeholderReadinessScore', operator: '<', threshold: 50 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['vro', 'risk'],
        severity: 'critical',
        message: 'Low stakeholder readiness - adoption failure risk high'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['pmo'],
        severity: 'high',
        message: 'Stakeholder readiness low - launch delay may be needed'
      },
      {
        type: 'notify',
        targetUsers: ['ocm-lead', 'sponsor'],
        severity: 'critical',
        message: 'Critical readiness gaps - accelerated readiness plan required'
      }
    ]
  },

  {
    id: 'ocm-high-resistance',
    name: 'High Change Resistance',
    description: 'Alert when change resistance is high',
    enabled: true,
    conditions: [
      { attribute: 'changeResistanceLevel', operator: '==', threshold: 'high' }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['pmo', 'vro'],
        severity: 'high',
        message: 'High change resistance - adoption and value delivery at risk'
      },
      {
        type: 'notify',
        targetUsers: ['ocm-lead', 'sponsor'],
        severity: 'high',
        message: 'High resistance to change - stakeholder engagement and communication needed'
      }
    ]
  },

  {
    id: 'ocm-severe-resistance',
    name: 'Severe Change Resistance',
    description: 'Escalate when change resistance becomes severe',
    enabled: true,
    conditions: [
      { attribute: 'changeResistanceLevel', operator: '==', threshold: 'severe' }
    ],
    actions: [
      {
        type: 'escalate',
        targetAgents: ['governance'],
        severity: 'critical',
        message: 'Severe change resistance - project viability review may be needed'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['vro', 'risk'],
        severity: 'critical',
        message: 'Severe resistance - major value and delivery risk'
      },
      {
        type: 'notify',
        targetUsers: ['ocm-lead', 'sponsor', 'cxo'],
        severity: 'critical',
        message: 'Severe resistance to change - executive intervention required'
      }
    ]
  },

  {
    id: 'ocm-low-training-completion',
    name: 'Low Training Completion',
    description: 'Alert when training completion is below target',
    enabled: true,
    conditions: [
      { attribute: 'trainingCompletionRate', operator: '<', threshold: 80 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['vro'],
        severity: 'medium',
        message: 'Training completion below 80% - competency and adoption risk'
      },
      {
        type: 'notify',
        targetUsers: ['ocm-lead', 'training-lead'],
        severity: 'medium',
        message: 'Low training completion - enhanced engagement strategies needed'
      }
    ]
  },

  {
    id: 'ocm-low-sponsor-engagement',
    name: 'Low Sponsor Engagement',
    description: 'Alert when executive sponsor engagement is insufficient',
    enabled: true,
    conditions: [
      { attribute: 'sponsorEngagement', operator: '<', threshold: 70 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['pmo', 'governance'],
        severity: 'high',
        message: 'Low sponsor engagement - change credibility and resources at risk'
      },
      {
        type: 'notify',
        targetUsers: ['ocm-lead', 'sponsor'],
        severity: 'high',
        message: 'Executive sponsor engagement low - active sponsorship activation needed'
      }
    ]
  },

  {
    id: 'ocm-communication-ineffective',
    name: 'Ineffective Communications',
    description: 'Alert when change communications are not effective',
    enabled: true,
    conditions: [
      { attribute: 'communicationEffectiveness', operator: '<', threshold: 70 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['vro'],
        severity: 'medium',
        message: 'Communication effectiveness low - awareness and understanding gaps'
      },
      {
        type: 'notify',
        targetUsers: ['ocm-lead', 'communications-lead'],
        severity: 'medium',
        message: 'Change communications ineffective - strategy revision needed'
      }
    ]
  },

  {
    id: 'ocm-readiness-gaps',
    name: 'Critical Readiness Gaps',
    description: 'Alert when multiple readiness gaps exist',
    enabled: true,
    conditions: [
      { attribute: 'changeReadinessGaps', operator: '>', threshold: 4 }
    ],
    actions: [
      {
        type: 'alert',
        targetAgents: ['pmo', 'risk'],
        severity: 'high',
        message: 'Multiple critical readiness gaps - launch readiness at risk'
      },
      {
        type: 'trigger_agent',
        targetAgents: ['vro'],
        severity: 'high',
        message: 'Readiness gaps may delay benefits realization'
      },
      {
        type: 'notify',
        targetUsers: ['ocm-lead', 'sponsor'],
        severity: 'high',
        message: 'Critical readiness gaps - targeted interventions required'
      }
    ]
  }
];

/**
 * Required MCP connectors for OCM agent
 */
export const OCM_REQUIRED_CONNECTORS = [
  'ragie',                    // Document/knowledge RAG
  'slack',                   // Team communication (optional but recommended)
  'microsoft-teams'          // Alternative team communication (optional)
];
