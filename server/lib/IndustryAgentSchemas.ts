/**
 * INDUSTRY-SPECIFIC AGENT SCHEMAS
 *
 * TWO LEVELS OF ATTRIBUTES:
 * Level 1: Universal (PMI, SAFe, PRINCE2) - ALL industries
 * Level 2: Industry-specific (Energy, Healthcare, Finance, etc.)
 *
 * Example:
 * - budget_variance (Level 1 - universal)
 * - regulatory_compliance (Level 2 - energy industry)
 */

import type { AgentAttribute } from './AgentObjectSchema.js';

export interface IndustryAgentExtension {
  industry: string;
  displayName: string;
  agentType: string; // pmo, finops, etc.

  // Additional attributes specific to this industry
  additionalProduces: AgentAttribute[];
  additionalConsumes: AgentAttribute[];

  // Industry-specific dashboard metrics
  industryDashboardMetrics: string[];

  // Industry-specific alerts
  industryAlerts: {
    condition: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    notifyAgents: string[];
  }[];
}

/**
 * ENERGY INDUSTRY - PMO AGENT EXTENSIONS
 */
export const ENERGY_PMO_EXTENSION: IndustryAgentExtension = {
  industry: 'energy',
  displayName: 'Energy PMO',
  agentType: 'pmo',

  additionalProduces: [
    {
      name: 'regulatory_compliance_score',
      label: 'Regulatory Compliance Score',
      description: 'Compliance with FERC, NERC, EPA regulations',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate regulatory compliance considering FERC, NERC, and EPA requirements'
    },
    {
      name: 'safety_score',
      label: 'Safety Score',
      description: 'Project safety metrics (OSHA compliance, incidents)',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate safety score based on OSHA compliance, incident rates, and safety training'
    },
    {
      name: 'environmental_impact_score',
      label: 'Environmental Impact Score',
      description: 'Environmental compliance and sustainability metrics',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Assess environmental impact including emissions, waste, and sustainability goals'
    },
    {
      name: 'grid_reliability_impact',
      label: 'Grid Reliability Impact',
      description: 'Impact on grid reliability and uptime',
      dataType: 'object',
      required: false,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'renewable_portfolio_standard_compliance',
      label: 'RPS Compliance',
      description: 'Compliance with Renewable Portfolio Standards',
      dataType: 'number',
      unit: 'percentage',
      required: false,
      category: 'produces',
      calculatedBy: 'llm'
    }
  ],

  additionalConsumes: [
    {
      name: 'energy_market_price',
      label: 'Energy Market Price',
      description: 'Current energy market pricing data',
      dataType: 'number',
      unit: 'currency',
      required: false,
      category: 'consumes',
      calculatedBy: 'api'
    },
    {
      name: 'transmission_capacity',
      label: 'Transmission Capacity',
      description: 'Available transmission capacity',
      dataType: 'number',
      required: false,
      category: 'consumes',
      calculatedBy: 'database'
    }
  ],

  industryDashboardMetrics: [
    'regulatory_compliance_score',
    'safety_score',
    'environmental_impact_score',
    'grid_reliability_impact'
  ],

  industryAlerts: [
    {
      condition: 'regulatory_compliance_score < 0.85',
      severity: 'critical',
      message: 'Regulatory compliance below threshold - FERC/NERC violation risk',
      notifyAgents: ['governance', 'risk']
    },
    {
      condition: 'safety_score < 0.80',
      severity: 'critical',
      message: 'Safety score critically low - OSHA investigation risk',
      notifyAgents: ['governance', 'ocm']
    }
  ]
};

/**
 * HEALTHCARE INDUSTRY - PMO AGENT EXTENSIONS
 */
export const HEALTHCARE_PMO_EXTENSION: IndustryAgentExtension = {
  industry: 'healthcare',
  displayName: 'Healthcare PMO',
  agentType: 'pmo',

  additionalProduces: [
    {
      name: 'patient_impact_score',
      label: 'Patient Impact Score',
      description: 'Impact on patient care and outcomes',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate patient impact considering care quality, access, and outcomes'
    },
    {
      name: 'hipaa_compliance_score',
      label: 'HIPAA Compliance Score',
      description: 'HIPAA and PHI protection compliance',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Assess HIPAA compliance for PHI handling, access controls, and breach risk'
    },
    {
      name: 'clinical_workflow_disruption',
      label: 'Clinical Workflow Disruption',
      description: 'Impact on clinical workflows',
      dataType: 'string',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'meaningful_use_compliance',
      label: 'Meaningful Use Compliance',
      description: 'EHR meaningful use criteria compliance',
      dataType: 'number',
      unit: 'percentage',
      required: false,
      category: 'produces',
      calculatedBy: 'llm'
    }
  ],

  additionalConsumes: [
    {
      name: 'patient_volume',
      label: 'Patient Volume',
      description: 'Current patient volume metrics',
      dataType: 'number',
      required: false,
      category: 'consumes',
      calculatedBy: 'database'
    }
  ],

  industryDashboardMetrics: [
    'patient_impact_score',
    'hipaa_compliance_score',
    'clinical_workflow_disruption'
  ],

  industryAlerts: [
    {
      condition: 'hipaa_compliance_score < 0.95',
      severity: 'critical',
      message: 'HIPAA compliance at risk - OCR investigation potential',
      notifyAgents: ['governance', 'risk']
    },
    {
      condition: 'patient_impact_score < 0.70',
      severity: 'high',
      message: 'Negative patient care impact detected',
      notifyAgents: ['governance', 'ocm']
    }
  ]
};

/**
 * FINANCE INDUSTRY - PMO AGENT EXTENSIONS
 */
export const FINANCE_PMO_EXTENSION: IndustryAgentExtension = {
  industry: 'finance',
  displayName: 'Finance PMO',
  agentType: 'pmo',

  additionalProduces: [
    {
      name: 'regulatory_capital_impact',
      label: 'Regulatory Capital Impact',
      description: 'Impact on regulatory capital requirements',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate regulatory capital impact considering Basel III/IV requirements'
    },
    {
      name: 'sox_compliance_score',
      label: 'SOX Compliance Score',
      description: 'Sarbanes-Oxley compliance',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Assess SOX compliance for internal controls and financial reporting'
    },
    {
      name: 'fraud_risk_score',
      label: 'Fraud Risk Score',
      description: 'Fraud and AML risk assessment',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'operational_risk_capital',
      label: 'Operational Risk Capital',
      description: 'Operational risk capital requirements',
      dataType: 'number',
      unit: 'currency',
      required: false,
      category: 'produces',
      calculatedBy: 'llm'
    }
  ],

  additionalConsumes: [
    {
      name: 'market_volatility',
      label: 'Market Volatility',
      description: 'Current market volatility index',
      dataType: 'number',
      required: false,
      category: 'consumes',
      calculatedBy: 'api'
    }
  ],

  industryDashboardMetrics: [
    'regulatory_capital_impact',
    'sox_compliance_score',
    'fraud_risk_score'
  ],

  industryAlerts: [
    {
      condition: 'sox_compliance_score < 0.95',
      severity: 'critical',
      message: 'SOX compliance at risk - audit finding potential',
      notifyAgents: ['governance', 'risk']
    },
    {
      condition: 'fraud_risk_score > 0.75',
      severity: 'critical',
      message: 'Elevated fraud risk detected',
      notifyAgents: ['governance', 'risk']
    }
  ]
};

/**
 * MANUFACTURING INDUSTRY - PMO AGENT EXTENSIONS
 */
export const MANUFACTURING_PMO_EXTENSION: IndustryAgentExtension = {
  industry: 'manufacturing',
  displayName: 'Manufacturing PMO',
  agentType: 'pmo',

  additionalProduces: [
    {
      name: 'production_impact_score',
      label: 'Production Impact Score',
      description: 'Impact on production capacity and throughput',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate production impact on capacity, throughput, and efficiency'
    },
    {
      name: 'supply_chain_risk',
      label: 'Supply Chain Risk',
      description: 'Supply chain disruption risk',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'quality_defect_rate',
      label: 'Quality Defect Rate',
      description: 'Product quality and defect metrics',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    }
  ],

  additionalConsumes: [],

  industryDashboardMetrics: [
    'production_impact_score',
    'supply_chain_risk',
    'quality_defect_rate'
  ],

  industryAlerts: [
    {
      condition: 'production_impact_score < 0.70',
      severity: 'critical',
      message: 'Significant production capacity impact',
      notifyAgents: ['planning', 'risk']
    }
  ]
};

/**
 * All industry extensions
 */
export const INDUSTRY_EXTENSIONS: Record<string, Record<string, IndustryAgentExtension>> = {
  energy: {
    pmo: ENERGY_PMO_EXTENSION
  },
  healthcare: {
    pmo: HEALTHCARE_PMO_EXTENSION
  },
  finance: {
    pmo: FINANCE_PMO_EXTENSION
  },
  manufacturing: {
    pmo: MANUFACTURING_PMO_EXTENSION
  }
};

/**
 * Get industry extension for agent
 */
export function getIndustryExtension(industry: string, agentType: string): IndustryAgentExtension | null {
  return INDUSTRY_EXTENSIONS[industry]?.[agentType] || null;
}

/**
 * Merge base agent schema with industry extension
 */
export function mergeAgentWithIndustry(baseSchema: any, industryExtension: IndustryAgentExtension): any {
  return {
    ...baseSchema,
    industry: industryExtension.industry,
    displayName: `${industryExtension.displayName} (${baseSchema.displayName})`,
    produces: [...baseSchema.produces, ...industryExtension.additionalProduces],
    consumes: [...baseSchema.consumes, ...industryExtension.additionalConsumes],
    dashboardMetrics: [...baseSchema.dashboardMetrics, ...industryExtension.industryDashboardMetrics],
    defaultAlerts: [...baseSchema.defaultAlerts, ...industryExtension.industryAlerts]
  };
}
