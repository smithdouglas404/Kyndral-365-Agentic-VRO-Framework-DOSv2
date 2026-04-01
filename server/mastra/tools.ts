/**
 * MASTRA TOOLS
 *
 * Creates Mastra-compatible tools that wrap existing Deep Agent capabilities.
 * Each tool invokes the corresponding Deep Agent functionality.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { IStorage } from '../storage.js';
import { getMastraMemory, createToolContext } from './memory.js';

// Storage reference - set during initialization
let storageRef: IStorage | null = null;

export function setToolStorage(storage: IStorage) {
  storageRef = storage;
}

/**
 * Helper to execute a Deep Agent with memory context
 */
async function executeWithMemory(
  agentType: string,
  agentClass: string,
  goal: string,
  context: Record<string, any>
): Promise<any> {
  if (!storageRef) throw new Error('Storage not initialized');

  // Get memory context
  const entityId = context.projectId || context.initiativeId;
  const { memory, contextPrompt } = await createToolContext(agentType, goal, entityId);

  // Enrich goal with memory context
  const enrichedGoal = contextPrompt
    ? `${goal}\n\n--- Memory Context ---\n${contextPrompt}`
    : goal;

  // Execute Deep Agent
  const module = await import(`../agents/deep/${agentClass}.js`);
  const AgentClass = module[agentClass] || module.default;
  const agent = new AgentClass(storageRef);

  const result = await agent.run(enrichedGoal, context);

  // Learn from the interaction
  if (result) {
    await memory.recordInteraction('agent', typeof result === 'string' ? result : JSON.stringify(result));

    // Broadcast key findings as facts
    if (entityId && result.healthScore !== undefined) {
      await memory.broadcastFact(entityId, 'health_score', result.healthScore, 0.9);
    }
    if (entityId && result.riskLevel) {
      await memory.broadcastFact(entityId, 'risk_level', result.riskLevel, 0.9);
    }
  }

  return result;
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
    const goal = `Analyze project health for project ${input.projectId}${input.includeHistory ? ' including historical trends' : ''}`;

    const result = await executeWithMemory(
      'pmo',
      'DeepPMOAgent',
      goal,
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
    const goal = `Identify dependencies for project ${input.projectId}${input.depth ? ` to depth ${input.depth}` : ''}`;

    const result = await executeWithMemory(
      'pmo',
      'DeepPMOAgent',
      goal,
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
    const goal = `Analyze budget variance for project ${input.projectId} for ${input.period || 'current'} period`;

    const result = await executeWithMemory(
      'finops',
      'DeepFinOpsAgent',
      goal,
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
    const goal = `Calculate ROI for project ${input.projectId}${input.timeHorizon ? ` over ${input.timeHorizon}` : ''}`;

    const result = await executeWithMemory(
      'finops',
      'DeepFinOpsAgent',
      goal,
      { projectId: input.projectId, timeHorizon: input.timeHorizon }
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
    const goal = `Assess ${input.riskCategory || 'all'} risks for project ${input.projectId}`;

    const result = await executeWithMemory(
      'risk',
      'DeepRiskAgent',
      goal,
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
    const goal = `Create mitigation plan for ${input.riskId ? `risk ${input.riskId}` : 'all risks'} in project ${input.projectId}`;

    const result = await executeWithMemory(
      'risk',
      'DeepRiskAgent',
      goal,
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
    const goal = `Track value realization for initiative ${input.initiativeId}${input.metrics ? ` focusing on ${input.metrics.join(', ')}` : ''}`;

    const result = await executeWithMemory(
      'vro',
      'DeepVROAgent',
      goal,
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
    const goal = `Analyze OKR alignment for ${input.projectId ? `project ${input.projectId}` : 'portfolio'}${input.okrId ? ` against OKR ${input.okrId}` : ''}`;

    const result = await executeWithMemory(
      'vro',
      'DeepVROAgent',
      goal,
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
    const goal = `Check compliance for project ${input.projectId}${input.framework ? ` against ${input.framework} framework` : ''}`;

    const result = await executeWithMemory(
      'governance',
      'DeepGovernanceAgent',
      goal,
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
