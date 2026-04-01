/**
 * MASTRA TOOLS
 *
 * Creates Mastra-compatible tools that wrap existing Deep Agent capabilities.
 * Each tool invokes the corresponding Deep Agent functionality.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { IStorage } from '../storage.js';

// Storage reference - set during initialization
let storageRef: IStorage | null = null;

export function setToolStorage(storage: IStorage) {
  storageRef = storage;
}

/**
 * PMO Agent Tools
 */
export const analyzeProjectHealthTool = createTool({
  id: 'analyze-project-health',
  description: 'Analyze project health metrics including schedule, budget, and resource utilization',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    includeHistory: z.boolean().optional().describe('Include historical trends'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    healthScore: z.number().optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const { DeepPMOAgent } = await import('../agents/deep/DeepPMOAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepPMOAgent(storageRef);
    const result = await agent.run(
      `Analyze project health for project ${input.projectId}${input.includeHistory ? ' including historical trends' : ''}`,
      { projectId: input.projectId }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      healthScore: result?.healthScore,
      recommendations: result?.recommendations,
    };
  },
});

export const identifyDependenciesTool = createTool({
  id: 'identify-dependencies',
  description: 'Analyze cross-project dependencies and potential blockers',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    depth: z.number().optional().describe('Dependency chain depth to analyze'),
  }),
  outputSchema: z.object({
    dependencies: z.array(z.object({
      sourceProject: z.string(),
      targetProject: z.string(),
      type: z.string(),
      status: z.string(),
    })).optional(),
    blockers: z.array(z.string()).optional(),
    analysis: z.string(),
  }),
  execute: async (input) => {
    const { DeepPMOAgent } = await import('../agents/deep/DeepPMOAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepPMOAgent(storageRef);
    const result = await agent.run(
      `Identify dependencies for project ${input.projectId}${input.depth ? ` to depth ${input.depth}` : ''}`,
      { projectId: input.projectId }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      dependencies: result?.dependencies,
      blockers: result?.blockers,
    };
  },
});

/**
 * FinOps Agent Tools
 */
export const analyzeBudgetVarianceTool = createTool({
  id: 'analyze-budget-variance',
  description: 'Analyze budget vs actual spending and identify variances',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    period: z.enum(['monthly', 'quarterly', 'ytd']).optional().describe('Analysis period'),
  }),
  outputSchema: z.object({
    variance: z.number().optional(),
    variancePercentage: z.number().optional(),
    analysis: z.string(),
    recommendations: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const { DeepFinOpsAgent } = await import('../agents/deep/DeepFinOpsAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepFinOpsAgent(storageRef);
    const result = await agent.run(
      `Analyze budget variance for project ${input.projectId} for ${input.period || 'current'} period`,
      { projectId: input.projectId, period: input.period }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      variance: result?.variance,
      variancePercentage: result?.variancePercentage,
      recommendations: result?.recommendations,
    };
  },
});

export const calculateRoiTool = createTool({
  id: 'calculate-roi',
  description: 'Calculate return on investment for projects or initiatives',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    timeHorizon: z.string().optional().describe('Time horizon for ROI calculation'),
  }),
  outputSchema: z.object({
    roi: z.number().optional(),
    npv: z.number().optional(),
    paybackPeriod: z.string().optional(),
    analysis: z.string(),
  }),
  execute: async (input) => {
    const { DeepFinOpsAgent } = await import('../agents/deep/DeepFinOpsAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepFinOpsAgent(storageRef);
    const result = await agent.run(
      `Calculate ROI for project ${input.projectId}${input.timeHorizon ? ` over ${input.timeHorizon}` : ''}`,
      { projectId: input.projectId }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      roi: result?.roi,
      npv: result?.npv,
      paybackPeriod: result?.paybackPeriod,
    };
  },
});

/**
 * Risk Agent Tools
 */
export const assessRiskTool = createTool({
  id: 'assess-risk',
  description: 'Comprehensive risk assessment with severity scoring',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    riskCategory: z.enum(['technical', 'schedule', 'budget', 'resource', 'external', 'all']).optional(),
  }),
  outputSchema: z.object({
    risks: z.array(z.object({
      id: z.string(),
      description: z.string(),
      severity: z.string(),
      probability: z.string(),
      impact: z.string(),
    })).optional(),
    overallRiskScore: z.number().optional(),
    analysis: z.string(),
  }),
  execute: async (input) => {
    const { DeepRiskAgent } = await import('../agents/deep/DeepRiskAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepRiskAgent(storageRef);
    const result = await agent.run(
      `Assess ${input.riskCategory || 'all'} risks for project ${input.projectId}`,
      { projectId: input.projectId, riskCategory: input.riskCategory }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      risks: result?.risks,
      overallRiskScore: result?.overallRiskScore,
    };
  },
});

export const planMitigationTool = createTool({
  id: 'plan-mitigation',
  description: 'Generate risk mitigation strategies and action plans',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    riskId: z.string().optional().describe('Specific risk to mitigate'),
  }),
  outputSchema: z.object({
    mitigationStrategies: z.array(z.object({
      riskId: z.string(),
      strategy: z.string(),
      actions: z.array(z.string()),
      owner: z.string().optional(),
    })).optional(),
    analysis: z.string(),
  }),
  execute: async (input) => {
    const { DeepRiskAgent } = await import('../agents/deep/DeepRiskAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepRiskAgent(storageRef);
    const result = await agent.run(
      `Create mitigation plan for ${input.riskId ? `risk ${input.riskId}` : 'all risks'} in project ${input.projectId}`,
      { projectId: input.projectId, riskId: input.riskId }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      mitigationStrategies: result?.mitigationStrategies,
    };
  },
});

/**
 * VRO Agent Tools
 */
export const trackValueTool = createTool({
  id: 'track-value',
  description: 'Track business value realization against targets',
  inputSchema: z.object({
    initiativeId: z.string().describe('Initiative or project identifier'),
    metrics: z.array(z.string()).optional().describe('Specific metrics to track'),
  }),
  outputSchema: z.object({
    valueRealized: z.number().optional(),
    valueTarget: z.number().optional(),
    realizationPercentage: z.number().optional(),
    analysis: z.string(),
  }),
  execute: async (input) => {
    const { DeepVROAgent } = await import('../agents/deep/DeepVROAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepVROAgent(storageRef);
    const result = await agent.run(
      `Track value realization for initiative ${input.initiativeId}${input.metrics ? ` focusing on ${input.metrics.join(', ')}` : ''}`,
      { initiativeId: input.initiativeId, metrics: input.metrics }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      valueRealized: result?.valueRealized,
      valueTarget: result?.valueTarget,
      realizationPercentage: result?.realizationPercentage,
    };
  },
});

export const analyzeOkrAlignmentTool = createTool({
  id: 'analyze-okr-alignment',
  description: 'Analyze alignment between projects and strategic OKRs',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier'),
    okrId: z.string().optional().describe('OKR identifier'),
  }),
  outputSchema: z.object({
    alignmentScore: z.number().optional(),
    gaps: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
    analysis: z.string(),
  }),
  execute: async (input) => {
    const { DeepVROAgent } = await import('../agents/deep/DeepVROAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepVROAgent(storageRef);
    const result = await agent.run(
      `Analyze OKR alignment for ${input.projectId ? `project ${input.projectId}` : 'portfolio'}${input.okrId ? ` against OKR ${input.okrId}` : ''}`,
      { projectId: input.projectId, okrId: input.okrId }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      alignmentScore: result?.alignmentScore,
      gaps: result?.gaps,
      recommendations: result?.recommendations,
    };
  },
});

/**
 * Governance Agent Tools
 */
export const checkComplianceTool = createTool({
  id: 'check-compliance',
  description: 'Check project compliance with governance standards',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    framework: z.enum(['safe', 'pmbok', 'prince2', 'custom']).optional(),
  }),
  outputSchema: z.object({
    compliant: z.boolean().optional(),
    complianceScore: z.number().optional(),
    violations: z.array(z.string()).optional(),
    analysis: z.string(),
  }),
  execute: async (input) => {
    const { DeepGovernanceAgent } = await import('../agents/deep/DeepGovernanceAgent.js');
    if (!storageRef) throw new Error('Storage not initialized');

    const agent = new DeepGovernanceAgent(storageRef);
    const result = await agent.run(
      `Check compliance for project ${input.projectId}${input.framework ? ` against ${input.framework} framework` : ''}`,
      { projectId: input.projectId, framework: input.framework }
    );

    return {
      analysis: typeof result === 'string' ? result : JSON.stringify(result),
      compliant: result?.compliant,
      complianceScore: result?.complianceScore,
      violations: result?.violations,
    };
  },
});

/**
 * Export all tools grouped by agent
 */
export const pmoTools = {
  analyzeProjectHealthTool,
  identifyDependenciesTool,
};

export const finopsTools = {
  analyzeBudgetVarianceTool,
  calculateRoiTool,
};

export const riskTools = {
  assessRiskTool,
  planMitigationTool,
};

export const vroTools = {
  trackValueTool,
  analyzeOkrAlignmentTool,
};

export const governanceTools = {
  checkComplianceTool,
};

export const allTools = {
  ...pmoTools,
  ...finopsTools,
  ...riskTools,
  ...vroTools,
  ...governanceTools,
};
