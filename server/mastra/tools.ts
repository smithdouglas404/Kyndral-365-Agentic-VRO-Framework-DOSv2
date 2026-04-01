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
 * PMO - Resource Capacity Analysis
 */
export const resourceCapacityTool = createTool({
  id: 'resource-capacity-analysis',
  description: 'Analyze team capacity, resource allocation, and utilization across projects using Palantir AtlasTeam and AtlasProject data',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier (omit for portfolio-wide)'),
    teamId: z.string().optional().describe('Specific team to analyze'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    utilization: z.number().optional(),
    overallocated: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze resource capacity${input.projectId ? ` for project ${input.projectId}` : ' across portfolio'}${input.teamId ? ` focusing on team ${input.teamId}` : ''}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { projectId: input.projectId, teamId: input.teamId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), utilization: result?.utilization, overallocated: result?.overallocated, recommendations: result?.recommendations };
  },
});

/**
 * PMO - SAFe PI Planning
 */
export const safePiPlanningTool = createTool({
  id: 'safe-pi-planning',
  description: 'Analyze SAFe Program Increment planning — feature completion, velocity, predictability, and PI objectives across the 22 SAFe projects',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier'),
    piId: z.string().optional().describe('Program Increment identifier (e.g. PI-2024-Q1)'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    velocity: z.number().optional(),
    predictability: z.number().optional(),
    featureCompletion: z.number().optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze SAFe PI planning${input.piId ? ` for ${input.piId}` : ''}${input.projectId ? ` on project ${input.projectId}` : ' across portfolio'}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { projectId: input.projectId, piId: input.piId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), velocity: result?.velocity, predictability: result?.predictability, featureCompletion: result?.featureCompletion };
  },
});

/**
 * PMO - Milestone Tracking
 */
export const milestoneTrackingTool = createTool({
  id: 'milestone-tracking',
  description: 'Track milestone progress, schedule variance, and upcoming deadlines from Palantir AtlasProject milestoneProgress data',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    milestoneProgress: z.number().optional(),
    scheduleVariance: z.number().optional(),
    upcomingMilestones: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Track milestones and schedule for project ${input.projectId}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), milestoneProgress: result?.milestoneProgress, scheduleVariance: result?.scheduleVariance, upcomingMilestones: result?.upcomingMilestones };
  },
});

/**
 * FinOps - Burn Rate Forecasting
 */
export const burnRateForecastTool = createTool({
  id: 'burn-rate-forecast',
  description: 'Forecast budget burn rate and estimated completion cost using AtlasBudget and AtlasFinancialRecord data from Palantir',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    forecastMonths: z.number().optional().describe('Months to forecast ahead'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    currentBurnRate: z.number().optional(),
    estimatedCompletionCost: z.number().optional(),
    budgetAtRisk: z.boolean().optional(),
  }),
  execute: async (input) => {
    const goal = `Forecast burn rate for project ${input.projectId}${input.forecastMonths ? ` for next ${input.forecastMonths} months` : ''}`;
    const result = await executeWithMemory('finops', 'DeepFinOpsAgent', goal, { projectId: input.projectId, forecastMonths: input.forecastMonths });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), currentBurnRate: result?.currentBurnRate, estimatedCompletionCost: result?.estimatedCompletionCost, budgetAtRisk: result?.budgetAtRisk };
  },
});

/**
 * FinOps - Cost Optimization
 */
export const costOptimizationTool = createTool({
  id: 'cost-optimization',
  description: 'Identify cost saving opportunities across the portfolio by analyzing budget utilization, vendor spend, and resource efficiency',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier (omit for portfolio-wide)'),
    category: z.enum(['cloud', 'vendor', 'resource', 'all']).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    potentialSavings: z.number().optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Identify ${input.category || 'all'} cost optimization opportunities${input.projectId ? ` for project ${input.projectId}` : ' across portfolio'}`;
    const result = await executeWithMemory('finops', 'DeepFinOpsAgent', goal, { projectId: input.projectId, category: input.category });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), potentialSavings: result?.potentialSavings, recommendations: result?.recommendations };
  },
});

/**
 * FinOps - Earned Value Analysis
 */
export const earnedValueTool = createTool({
  id: 'earned-value-analysis',
  description: 'Calculate earned value metrics (CPI, SPI, EV, PV, AC) for cost and schedule performance measurement',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    cpi: z.number().optional(),
    spi: z.number().optional(),
    earnedValue: z.number().optional(),
    plannedValue: z.number().optional(),
  }),
  execute: async (input) => {
    const goal = `Calculate earned value analysis for project ${input.projectId}`;
    const result = await executeWithMemory('finops', 'DeepFinOpsAgent', goal, { projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), cpi: result?.cpi, spi: result?.spi, earnedValue: result?.earnedValue, plannedValue: result?.plannedValue };
  },
});

/**
 * Risk - Early Warning Scan
 */
export const earlyWarningScanTool = createTool({
  id: 'early-warning-scan',
  description: 'Proactive scan for emerging risks using Palantir AtlasRisk data, Rulebricks threshold rules, and cross-project dependency analysis',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier (omit for portfolio-wide)'),
    lookAheadDays: z.number().optional().describe('Days to look ahead for risk detection'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    emergingRisks: z.array(z.object({ description: z.string(), severity: z.string(), probability: z.string() })).optional(),
    alertCount: z.number().optional(),
  }),
  execute: async (input) => {
    const goal = `Early warning scan${input.projectId ? ` for project ${input.projectId}` : ' across portfolio'}${input.lookAheadDays ? ` looking ${input.lookAheadDays} days ahead` : ''}`;
    const result = await executeWithMemory('risk', 'DeepRiskAgent', goal, { projectId: input.projectId, lookAheadDays: input.lookAheadDays });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), emergingRisks: result?.emergingRisks, alertCount: result?.alertCount };
  },
});

/**
 * Risk - Cross-Project Risk Correlation
 */
export const riskCorrelationTool = createTool({
  id: 'risk-correlation',
  description: 'Identify correlated risks across projects via AtlasDependency links — when one project risk materializes, which others are affected',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Starting project for correlation analysis'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    correlatedRisks: z.array(z.object({ sourceProject: z.string(), targetProject: z.string(), riskType: z.string(), correlation: z.string() })).optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze cross-project risk correlations${input.projectId ? ` starting from project ${input.projectId}` : ''}`;
    const result = await executeWithMemory('risk', 'DeepRiskAgent', goal, { projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), correlatedRisks: result?.correlatedRisks };
  },
});

/**
 * OCM - Change Readiness Assessment
 */
export const changeReadinessTool = createTool({
  id: 'change-readiness-assessment',
  description: 'Assess organizational readiness for change using AtlasPerson and AtlasReadinessMetric data from Palantir',
  inputSchema: z.object({
    projectId: z.string().describe('Project or initiative identifier'),
    stakeholderGroups: z.array(z.string()).optional().describe('Specific stakeholder groups to assess'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    readinessScore: z.number().optional(),
    gaps: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Assess change readiness for project ${input.projectId}${input.stakeholderGroups ? ` focusing on ${input.stakeholderGroups.join(', ')}` : ''}`;
    const result = await executeWithMemory('ocm', 'DeepOCMAgent', goal, { projectId: input.projectId, stakeholderGroups: input.stakeholderGroups });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), readinessScore: result?.readinessScore, gaps: result?.gaps, recommendations: result?.recommendations };
  },
});

/**
 * OCM - Stakeholder Impact Analysis
 */
export const stakeholderImpactTool = createTool({
  id: 'stakeholder-impact-analysis',
  description: 'Analyze the impact of transformation changes on different stakeholder groups, identify resistance patterns, and recommend engagement strategies',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    impactedGroups: z.array(z.object({ group: z.string(), impactLevel: z.string(), readiness: z.string() })).optional(),
    resistanceRisk: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze stakeholder impact for project ${input.projectId}`;
    const result = await executeWithMemory('ocm', 'DeepOCMAgent', goal, { projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), impactedGroups: result?.impactedGroups, resistanceRisk: result?.resistanceRisk };
  },
});

/**
 * OCM - Adoption Tracking
 */
export const adoptionTrackingTool = createTool({
  id: 'adoption-tracking',
  description: 'Track adoption metrics, training completion, and user engagement for transformation initiatives',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    adoptionRate: z.number().optional(),
    trainingCompletion: z.number().optional(),
    engagementScore: z.number().optional(),
  }),
  execute: async (input) => {
    const goal = `Track adoption metrics for project ${input.projectId}`;
    const result = await executeWithMemory('ocm', 'DeepOCMAgent', goal, { projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), adoptionRate: result?.adoptionRate, trainingCompletion: result?.trainingCompletion, engagementScore: result?.engagementScore };
  },
});

/**
 * TMO - Transition Readiness
 */
export const transitionReadinessTool = createTool({
  id: 'transition-readiness',
  description: 'Assess readiness for go-live transition including operational acceptance, knowledge transfer status, and support model completeness',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    transitionDate: z.string().optional().describe('Planned transition date'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    readinessScore: z.number().optional(),
    blockers: z.array(z.string()).optional(),
    checklistCompletion: z.number().optional(),
  }),
  execute: async (input) => {
    const goal = `Assess transition readiness for project ${input.projectId}${input.transitionDate ? ` with planned date ${input.transitionDate}` : ''}`;
    const result = await executeWithMemory('tmo', 'DeepTMOAgent', goal, { projectId: input.projectId, transitionDate: input.transitionDate });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), readinessScore: result?.readinessScore, blockers: result?.blockers, checklistCompletion: result?.checklistCompletion };
  },
});

/**
 * TMO - Cutover Planning
 */
export const cutoverPlanningTool = createTool({
  id: 'cutover-planning',
  description: 'Generate cutover plans with task sequences, rollback procedures, and communication checklists for go-live events',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    cutoverSteps: z.array(z.string()).optional(),
    rollbackPlan: z.string().optional(),
    estimatedDowntime: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Create cutover plan for project ${input.projectId}`;
    const result = await executeWithMemory('tmo', 'DeepTMOAgent', goal, { projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), cutoverSteps: result?.cutoverSteps, rollbackPlan: result?.rollbackPlan, estimatedDowntime: result?.estimatedDowntime };
  },
});

/**
 * TMO - Hypercare Assessment
 */
export const hypercareTool = createTool({
  id: 'hypercare-assessment',
  description: 'Plan and assess hypercare support requirements post go-live including support model, escalation paths, and success criteria',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    hypercareDuration: z.string().optional().describe('Planned hypercare duration'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    supportModel: z.string().optional(),
    exitCriteria: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Assess hypercare requirements for project ${input.projectId}${input.hypercareDuration ? ` with ${input.hypercareDuration} duration` : ''}`;
    const result = await executeWithMemory('tmo', 'DeepTMOAgent', goal, { projectId: input.projectId, hypercareDuration: input.hypercareDuration });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), supportModel: result?.supportModel, exitCriteria: result?.exitCriteria };
  },
});

/**
 * VRO - Benefits Realization
 */
export const benefitsRealizationTool = createTool({
  id: 'benefits-realization',
  description: 'Measure and report on benefits realization — actual vs planned business outcomes using AtlasKpi and AtlasKeyResult data',
  inputSchema: z.object({
    projectId: z.string().describe('Project or initiative identifier'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    benefitsRealized: z.number().optional(),
    benefitsTarget: z.number().optional(),
    realizationRate: z.number().optional(),
    unrealizedBenefits: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Measure benefits realization for project ${input.projectId}`;
    const result = await executeWithMemory('vro', 'DeepVROAgent', goal, { projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), benefitsRealized: result?.benefitsRealized, benefitsTarget: result?.benefitsTarget, realizationRate: result?.realizationRate, unrealizedBenefits: result?.unrealizedBenefits };
  },
});

/**
 * VRO - Value Stream Mapping
 */
export const valueStreamMappingTool = createTool({
  id: 'value-stream-mapping',
  description: 'Map value streams across the portfolio — identify bottlenecks, waste, and flow efficiency using transformation and dependency data',
  inputSchema: z.object({
    valueStreamId: z.string().optional().describe('Value stream identifier (e.g. vs-digital-platform)'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    flowEfficiency: z.number().optional(),
    bottlenecks: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Map value stream${input.valueStreamId ? ` ${input.valueStreamId}` : 's across portfolio'} and identify bottlenecks`;
    const result = await executeWithMemory('vro', 'DeepVROAgent', goal, { valueStreamId: input.valueStreamId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), flowEfficiency: result?.flowEfficiency, bottlenecks: result?.bottlenecks, recommendations: result?.recommendations };
  },
});

/**
 * Governance - Gate Review
 */
export const gateReviewTool = createTool({
  id: 'gate-review',
  description: 'Conduct governance gate review using AtlasGovernanceCheckpoint data — evaluate readiness for stage gates and provide go/no-go recommendations',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    gateName: z.string().optional().describe('Specific gate to review'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    recommendation: z.string().optional(),
    checkpointsPassed: z.number().optional(),
    checkpointsTotal: z.number().optional(),
    blockers: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Conduct gate review for project ${input.projectId}${input.gateName ? ` at gate ${input.gateName}` : ''}`;
    const result = await executeWithMemory('governance', 'DeepGovernanceAgent', goal, { projectId: input.projectId, gateName: input.gateName });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), recommendation: result?.recommendation, checkpointsPassed: result?.checkpointsPassed, checkpointsTotal: result?.checkpointsTotal, blockers: result?.blockers };
  },
});

/**
 * Governance - Audit Preparation
 */
export const auditPreparationTool = createTool({
  id: 'audit-preparation',
  description: 'Prepare audit documentation and evidence by analyzing governance checkpoints, decision logs, and compliance status across projects',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier (omit for portfolio-wide)'),
    auditType: z.enum(['internal', 'external', 'regulatory']).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    documentationCompleteness: z.number().optional(),
    gaps: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Prepare ${input.auditType || 'internal'} audit documentation${input.projectId ? ` for project ${input.projectId}` : ' for portfolio'}`;
    const result = await executeWithMemory('governance', 'DeepGovernanceAgent', goal, { projectId: input.projectId, auditType: input.auditType });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), documentationCompleteness: result?.documentationCompleteness, gaps: result?.gaps };
  },
});

/**
 * Planning - Roadmap Analysis
 */
export const roadmapAnalysisTool = createTool({
  id: 'roadmap-analysis',
  description: 'Analyze and optimize strategic roadmaps across value streams — identify sequencing issues, resource conflicts, and optimization opportunities',
  inputSchema: z.object({
    portfolioId: z.string().optional().describe('Portfolio or value stream identifier'),
    horizon: z.enum(['quarterly', 'annual', 'multi-year']).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    sequencingIssues: z.array(z.string()).optional(),
    optimizations: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze ${input.horizon || 'annual'} roadmap${input.portfolioId ? ` for ${input.portfolioId}` : ' across portfolio'}`;
    const result = await executeWithMemory('planning', 'DeepPlanningAgent', goal, { portfolioId: input.portfolioId, horizon: input.horizon });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), sequencingIssues: result?.sequencingIssues, optimizations: result?.optimizations };
  },
});

/**
 * Planning - Scenario Modeling
 */
export const scenarioModelingTool = createTool({
  id: 'scenario-modeling',
  description: 'Create and compare planning scenarios — what-if analysis for budget changes, timeline shifts, resource reallocation, or scope changes',
  inputSchema: z.object({
    scenarioType: z.enum(['budget-cut', 'timeline-shift', 'resource-change', 'scope-change', 'custom']).describe('Type of scenario to model'),
    parameters: z.record(z.any()).optional().describe('Scenario parameters'),
    projectId: z.string().optional().describe('Specific project or portfolio-wide'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    scenarios: z.array(z.object({ name: z.string(), impact: z.string(), recommendation: z.string() })).optional(),
  }),
  execute: async (input) => {
    const goal = `Model ${input.scenarioType} scenario${input.projectId ? ` for project ${input.projectId}` : ' across portfolio'}`;
    const result = await executeWithMemory('planning', 'DeepPlanningAgent', goal, { scenarioType: input.scenarioType, parameters: input.parameters, projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), scenarios: result?.scenarios };
  },
});

/**
 * Planning - Capacity Forecasting
 */
export const capacityForecastingTool = createTool({
  id: 'capacity-forecasting',
  description: 'Forecast resource capacity and demand across teams using AtlasTeam data — identify future bottlenecks and hiring needs',
  inputSchema: z.object({
    forecastMonths: z.number().optional().describe('Months to forecast'),
    teamId: z.string().optional().describe('Specific team'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    capacityGaps: z.array(z.object({ period: z.string(), gap: z.number(), team: z.string() })).optional(),
    hiringRecommendations: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Forecast resource capacity${input.teamId ? ` for team ${input.teamId}` : ''} over ${input.forecastMonths || 6} months`;
    const result = await executeWithMemory('planning', 'DeepPlanningAgent', goal, { forecastMonths: input.forecastMonths, teamId: input.teamId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), capacityGaps: result?.capacityGaps, hiringRecommendations: result?.hiringRecommendations };
  },
});

/**
 * Planning - WSJF Prioritization
 */
export const wsjfPrioritizationTool = createTool({
  id: 'wsjf-prioritization',
  description: 'Calculate Weighted Shortest Job First (WSJF) scores for features and epics to optimize SAFe backlog prioritization',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier'),
    items: z.array(z.object({ id: z.string(), name: z.string() })).optional().describe('Items to prioritize'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    prioritizedItems: z.array(z.object({ id: z.string(), name: z.string(), wsjfScore: z.number() })).optional(),
  }),
  execute: async (input) => {
    const goal = `Calculate WSJF prioritization${input.projectId ? ` for project ${input.projectId}` : ' for portfolio backlog'}`;
    const result = await executeWithMemory('planning', 'DeepPlanningAgent', goal, { projectId: input.projectId, items: input.items });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), prioritizedItems: result?.prioritizedItems };
  },
});

/**
 * Integrated Management - Portfolio Health Dashboard
 */
export const portfolioHealthTool = createTool({
  id: 'portfolio-health',
  description: 'Generate comprehensive portfolio health summary across all 22 SAFe projects — aggregating health, risk, budget, and schedule data from Palantir',
  inputSchema: z.object({
    valueStream: z.string().optional().describe('Filter by value stream (e.g. vs-digital-platform, vs-data-analytics)'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    greenProjects: z.number().optional(),
    amberProjects: z.number().optional(),
    redProjects: z.number().optional(),
    totalBudget: z.number().optional(),
    overallHealth: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Generate portfolio health summary${input.valueStream ? ` for value stream ${input.valueStream}` : ''}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { valueStream: input.valueStream });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), greenProjects: result?.greenProjects, amberProjects: result?.amberProjects, redProjects: result?.redProjects, totalBudget: result?.totalBudget, overallHealth: result?.overallHealth };
  },
});

/**
 * Integrated Management - Cross-Project Impact Analysis
 */
export const crossProjectImpactTool = createTool({
  id: 'cross-project-impact',
  description: 'Analyze how changes in one project impact others via AtlasDependency links — schedule cascades, resource conflicts, and risk propagation',
  inputSchema: z.object({
    projectId: z.string().describe('Project where change originates'),
    changeType: z.enum(['schedule-delay', 'budget-cut', 'scope-change', 'resource-change']).describe('Type of change'),
    magnitude: z.string().optional().describe('Magnitude of the change'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    impactedProjects: z.array(z.object({ projectId: z.string(), projectName: z.string(), impactType: z.string(), severity: z.string() })).optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze cross-project impact of ${input.changeType}${input.magnitude ? ` (${input.magnitude})` : ''} in project ${input.projectId}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { projectId: input.projectId, changeType: input.changeType, magnitude: input.magnitude });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), impactedProjects: result?.impactedProjects };
  },
});

/**
 * OKR Inference - OKR Gap Detection
 */
export const okrGapDetectionTool = createTool({
  id: 'okr-gap-detection',
  description: 'Detect gaps between strategic OKRs and project execution — identify objectives with no supporting projects or key results falling behind',
  inputSchema: z.object({
    objectiveId: z.string().optional().describe('Specific objective to analyze'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    unsupportedObjectives: z.array(z.string()).optional(),
    atRiskKeyResults: z.array(z.object({ krId: z.string(), name: z.string(), progress: z.number(), target: z.number() })).optional(),
  }),
  execute: async (input) => {
    const goal = `Detect OKR gaps${input.objectiveId ? ` for objective ${input.objectiveId}` : ' across all objectives'}`;
    const result = await executeWithMemory('vro', 'DeepVROAgent', goal, { objectiveId: input.objectiveId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), unsupportedObjectives: result?.unsupportedObjectives, atRiskKeyResults: result?.atRiskKeyResults };
  },
});

/**
 * OKR Inference - KPI Trend Analysis
 */
export const kpiTrendTool = createTool({
  id: 'kpi-trend-analysis',
  description: 'Analyze KPI trends from AtlasKpi data — detect trajectory changes, forecast target achievement, and flag deviating metrics',
  inputSchema: z.object({
    kpiId: z.string().optional().describe('Specific KPI to analyze'),
    projectId: z.string().optional().describe('Project context'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    trend: z.string().optional(),
    forecastedValue: z.number().optional(),
    onTrack: z.boolean().optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze KPI trends${input.kpiId ? ` for KPI ${input.kpiId}` : ''}${input.projectId ? ` in project ${input.projectId}` : ''}`;
    const result = await executeWithMemory('vro', 'DeepVROAgent', goal, { kpiId: input.kpiId, projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), trend: result?.trend, forecastedValue: result?.forecastedValue, onTrack: result?.onTrack };
  },
});

/**
 * Notification - HITL Approval Request
 */
export const hitlApprovalTool = createTool({
  id: 'hitl-approval-request',
  description: 'Submit a human-in-the-loop approval request via the Notification Agent A2A gateway — routes to appropriate stakeholder for decision',
  inputSchema: z.object({
    requestType: z.enum(['budget-approval', 'risk-acceptance', 'scope-change', 'go-live', 'escalation']).describe('Type of approval needed'),
    projectId: z.string().describe('Related project'),
    description: z.string().describe('What needs approval and why'),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    requestId: z.string().optional(),
    routedTo: z.string().optional(),
    status: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Submit ${input.requestType} approval request for project ${input.projectId}: ${input.description}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { requestType: input.requestType, projectId: input.projectId, description: input.description, urgency: input.urgency });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), requestId: result?.requestId, routedTo: result?.routedTo, status: result?.status };
  },
});

/**
 * Enterprise Rules - Evaluate Project Rules
 */
export const evaluateRulesTool = createTool({
  id: 'evaluate-enterprise-rules',
  description: 'Evaluate all 16 Rulebricks enterprise rules against a project — budget alerts, risk thresholds, schedule alerts, compliance checks, and trigger Palantir Actions on breach',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier to evaluate'),
    rulesSubset: z.array(z.string()).optional().describe('Specific rule slugs to evaluate (omit for all 16)'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    rulesFired: z.number().optional(),
    breaches: z.array(z.object({ rule: z.string(), severity: z.string(), action: z.string() })).optional(),
    palantirActionsTriggered: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Evaluate enterprise rules for project ${input.projectId}${input.rulesSubset ? ` (rules: ${input.rulesSubset.join(', ')})` : ''}`;
    const result = await executeWithMemory('governance', 'DeepGovernanceAgent', goal, { projectId: input.projectId, rulesSubset: input.rulesSubset });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), rulesFired: result?.rulesFired, breaches: result?.breaches, palantirActionsTriggered: result?.palantirActionsTriggered };
  },
});

/**
 * Export all tools grouped by agent
 */
export const pmoTools = {
  analyzeProjectHealthTool,
  identifyDependenciesTool,
  resourceCapacityTool,
  safePiPlanningTool,
  milestoneTrackingTool,
};

export const finopsTools = {
  analyzeBudgetVarianceTool,
  calculateRoiTool,
  burnRateForecastTool,
  costOptimizationTool,
  earnedValueTool,
};

export const riskTools = {
  assessRiskTool,
  planMitigationTool,
  earlyWarningScanTool,
  riskCorrelationTool,
};

export const vroTools = {
  trackValueTool,
  analyzeOkrAlignmentTool,
  benefitsRealizationTool,
  valueStreamMappingTool,
};

export const governanceTools = {
  checkComplianceTool,
  gateReviewTool,
  auditPreparationTool,
  evaluateRulesTool,
};

export const ocmTools = {
  changeReadinessTool,
  stakeholderImpactTool,
  adoptionTrackingTool,
};

export const tmoTools = {
  transitionReadinessTool,
  cutoverPlanningTool,
  hypercareTool,
};

export const planningTools = {
  roadmapAnalysisTool,
  scenarioModelingTool,
  capacityForecastingTool,
  wsjfPrioritizationTool,
};

export const integratedTools = {
  portfolioHealthTool,
  crossProjectImpactTool,
};

export const okrTools = {
  okrGapDetectionTool,
  kpiTrendTool,
};

export const notificationTools = {
  hitlApprovalTool,
};

export const allTools = {
  ...pmoTools,
  ...finopsTools,
  ...riskTools,
  ...vroTools,
  ...governanceTools,
  ...ocmTools,
  ...tmoTools,
  ...planningTools,
  ...integratedTools,
  ...okrTools,
  ...notificationTools,
};
