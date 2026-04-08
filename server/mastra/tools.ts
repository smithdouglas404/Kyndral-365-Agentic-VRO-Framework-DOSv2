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
import { startTrace, endTrace, recordToolCall, recordToolResult, recordError } from '../services/AgentTracing.js';
import { emitUIPacket, emitAgentAlert } from '../services/AgentUIEmitter.js';
import type { UIBlock } from '../../shared/agentUIPacket.js';
import {
  opGetProjectHealthTool, opGetGanttDataTool, opCreateWorkPackageTool,
  opUpdateWorkPackageTool, opGetBudgetTool, opLogTimeTool, opCreateRiskTool,
  opCreateVersionTool, opGetResourceCapacityTool, opAddRelationTool,
  opCreateMeetingTool, opSendNotificationTool,
} from '../agents/tools/OpenProjectAgentTools.js';

// Storage reference - set during initialization
let storageRef: IStorage | null = null;

export function setToolStorage(storage: IStorage) {
  storageRef = storage;
}

// ============================================================================
// Agent type → canvas agent ID mapping
// ============================================================================

const AGENT_ID_MAP: Record<string, string> = {
  pmo: 'pmo-agent',
  finops: 'finops-agent',
  risk: 'risk-agent',
  ocm: 'ocm-agent',
  tmo: 'tmo-agent',
  vro: 'vro-agent',
  governance: 'governance-agent',
  planning: 'planning-agent',
};

// ============================================================================
// Result → UIBlock transformer
//
// Reads the structured output from an agent and builds appropriate UIBlocks.
// The agent's result shape determines the suggested visualization.
// ============================================================================

function buildUIBlocksFromResult(
  agentType: string,
  result: any,
  goal: string,
  context: Record<string, any>
): { title: string; blocks: UIBlock[]; priority: number } {
  if (!result || typeof result === 'string') {
    return {
      title: goal.substring(0, 80),
      blocks: [{
        type: 'markdown',
        content: typeof result === 'string' ? result : 'Agent completed analysis.',
      }],
      priority: 3,
    };
  }

  const blocks: UIBlock[] = [];
  let priority = 5;

  // --- KPI row from numeric metrics ---
  const kpiFields: { key: string; label: string; unit?: string; severity?: any }[] = [];

  if (result.healthScore !== undefined) kpiFields.push({ key: 'healthScore', label: 'Health Score', severity: result.healthScore >= 80 ? 'success' : result.healthScore >= 60 ? 'warning' : 'critical' });
  if (result.readinessScore !== undefined) kpiFields.push({ key: 'readinessScore', label: 'Readiness', unit: '%', severity: result.readinessScore >= 80 ? 'success' : result.readinessScore >= 50 ? 'warning' : 'critical' });
  if (result.complianceScore !== undefined) kpiFields.push({ key: 'complianceScore', label: 'Compliance', unit: '%', severity: result.complianceScore >= 90 ? 'success' : result.complianceScore >= 70 ? 'warning' : 'critical' });
  if (result.overallRiskScore !== undefined) kpiFields.push({ key: 'overallRiskScore', label: 'Risk Score', severity: result.overallRiskScore <= 30 ? 'success' : result.overallRiskScore <= 60 ? 'warning' : 'critical' });
  if (result.variance !== undefined) kpiFields.push({ key: 'variance', label: 'Variance', unit: result.variancePercentage !== undefined ? '%' : undefined });
  if (result.variancePercentage !== undefined && result.variance === undefined) kpiFields.push({ key: 'variancePercentage', label: 'Variance', unit: '%' });
  if (result.roi !== undefined) kpiFields.push({ key: 'roi', label: 'ROI', unit: '%' });
  if (result.utilization !== undefined) kpiFields.push({ key: 'utilization', label: 'Utilization', unit: '%' });
  if (result.adoptionRate !== undefined) kpiFields.push({ key: 'adoptionRate', label: 'Adoption Rate', unit: '%' });
  if (result.trainingCompletion !== undefined) kpiFields.push({ key: 'trainingCompletion', label: 'Training Complete', unit: '%' });
  if (result.realizationPercentage !== undefined) kpiFields.push({ key: 'realizationPercentage', label: 'Value Realized', unit: '%' });
  if (result.checklistCompletion !== undefined) kpiFields.push({ key: 'checklistCompletion', label: 'Checklist', unit: '%' });
  if (result.flowEfficiency !== undefined) kpiFields.push({ key: 'flowEfficiency', label: 'Flow Efficiency', unit: '%' });
  if (result.velocity !== undefined) kpiFields.push({ key: 'velocity', label: 'Velocity' });
  if (result.alignmentScore !== undefined) kpiFields.push({ key: 'alignmentScore', label: 'OKR Alignment', unit: '%' });
  if (result.cpi !== undefined) kpiFields.push({ key: 'cpi', label: 'CPI', severity: result.cpi >= 0.95 ? 'success' : result.cpi >= 0.85 ? 'warning' : 'critical' });
  if (result.spi !== undefined) kpiFields.push({ key: 'spi', label: 'SPI', severity: result.spi >= 0.95 ? 'success' : result.spi >= 0.85 ? 'warning' : 'critical' });

  // Portfolio health KPIs
  if (result.greenProjects !== undefined || result.amberProjects !== undefined || result.redProjects !== undefined) {
    kpiFields.push({ key: 'greenProjects', label: 'Green', severity: 'success' });
    if (result.amberProjects !== undefined) kpiFields.push({ key: 'amberProjects', label: 'Amber', severity: 'warning' });
    if (result.redProjects !== undefined) kpiFields.push({ key: 'redProjects', label: 'Red', severity: 'critical' });
  }

  if (kpiFields.length > 0) {
    blocks.push({
      type: 'kpi-row',
      kpis: kpiFields.map(f => ({
        type: 'kpi' as const,
        label: f.label,
        value: result[f.key] ?? '—',
        unit: f.unit,
        severity: f.severity,
      })),
    });
  }

  // --- Table blocks from arrays of objects ---
  const arrayFields = ['risks', 'dependencies', 'impactedProjects', 'correlatedRisks',
    'impactedGroups', 'emergingRisks', 'breaches', 'scenarios', 'capacityGaps',
    'prioritizedItems', 'anomalies', 'topCategories', 'atRiskKeyResults'];

  for (const field of arrayFields) {
    if (Array.isArray(result[field]) && result[field].length > 0) {
      const items = result[field];
      const firstItem = items[0];
      const keys = Object.keys(firstItem);
      blocks.push({
        type: 'table',
        title: field.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()),
        columns: keys.map(k => ({
          key: k,
          label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()),
          format: typeof firstItem[k] === 'number' ? 'number' as const : 'text' as const,
        })),
        rows: items,
        sortable: true,
        maxRows: 10,
      });
    }
  }

  // --- Status list from string arrays ---
  const listFields = ['blockers', 'violations', 'gaps', 'overallocated',
    'upcomingMilestones', 'cutoverSteps', 'exitCriteria', 'unrealizedBenefits',
    'bottlenecks', 'sequencingIssues', 'hiringRecommendations', 'palantirActionsTriggered'];

  for (const field of listFields) {
    if (Array.isArray(result[field]) && result[field].length > 0) {
      const statusMap: Record<string, 'critical' | 'warning' | 'ok' | 'pending'> = {
        blockers: 'critical', violations: 'critical', gaps: 'warning',
        overallocated: 'warning', bottlenecks: 'warning',
      };
      blocks.push({
        type: 'status-list',
        title: field.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()),
        items: result[field].map((item: string) => ({
          label: item,
          status: statusMap[field] || 'pending',
        })),
      });
      if (field === 'blockers' || field === 'violations') priority = Math.max(priority, 8);
    }
  }

  // --- Recommendations as recommendation blocks ---
  if (Array.isArray(result.recommendations) && result.recommendations.length > 0) {
    result.recommendations.slice(0, 3).forEach((rec: string) => {
      blocks.push({
        type: 'recommendation',
        title: rec.length > 80 ? rec.substring(0, 80) + '…' : rec,
        body: rec,
        impact: 'medium',
        effort: 'medium',
      });
    });
  }

  // --- Analysis text as insight ---
  if (result.analysis && typeof result.analysis === 'string' && result.analysis.length > 20) {
    // Determine severity from result
    let severity: 'info' | 'warning' | 'critical' | 'success' = 'info';
    if (result.healthScore !== undefined && result.healthScore < 60) severity = 'critical';
    else if (result.healthScore !== undefined && result.healthScore < 80) severity = 'warning';
    else if (result.overallRiskScore !== undefined && result.overallRiskScore > 60) severity = 'critical';
    else if (result.budgetAtRisk) severity = 'critical';
    else if (result.compliant === false) severity = 'warning';

    if (severity === 'critical') priority = Math.max(priority, 9);
    else if (severity === 'warning') priority = Math.max(priority, 7);

    blocks.push({
      type: 'insight',
      title: `${agentType.toUpperCase()} Analysis`,
      body: result.analysis.substring(0, 500),
      severity,
      source: `${agentType} agent — ${goal.substring(0, 60)}`,
    });
  }

  // Build title from goal
  const entityName = context.projectId || context.initiativeId || context.valueStreamId || 'Portfolio';
  const title = goal.length > 80 ? goal.substring(0, 77) + '…' : goal;

  return { title, blocks, priority };
}

/**
 * Helper to execute a Deep Agent with memory context.
 * Automatically emits a UI packet to the agent's canvas with the results.
 */
async function executeWithMemory(
  agentType: string,
  agentClass: string,
  goal: string,
  context: Record<string, any>
): Promise<any> {
  if (!storageRef) throw new Error('Storage not initialized');

  const traceId = startTrace(agentType, { agentClass, goal, context: { projectId: context.projectId } });
  const startTime = Date.now();

  try {
    recordToolCall(traceId, agentType, agentClass, { goal: goal.substring(0, 200), projectId: context.projectId });

    const entityId = context.projectId || context.initiativeId;
    const { memory, contextPrompt } = await createToolContext(agentType, goal, entityId);

    const enrichedGoal = contextPrompt
      ? `${goal}\n\n--- Memory Context ---\n${contextPrompt}`
      : goal;

    const module = await import(`../agents/deep/${agentClass}.js`);
    const AgentClass = module[agentClass] || module.default;
    const agent = new AgentClass(storageRef);

    const result = await agent.run(enrichedGoal, context);
    const durationMs = Date.now() - startTime;

    recordToolResult(traceId, agentType, agentClass, { hasResult: !!result, keys: result ? Object.keys(result).slice(0, 10) : [] }, durationMs);
    endTrace(traceId, agentType, durationMs);

    if (result) {
      await memory.recordInteraction('agent', typeof result === 'string' ? result : JSON.stringify(result));

      if (entityId && result.healthScore !== undefined) {
        await memory.broadcastFact(entityId, 'health_score', result.healthScore, 0.9);
      }
      if (entityId && result.riskLevel) {
        await memory.broadcastFact(entityId, 'risk_level', result.riskLevel, 0.9);
      }

      // --- Emit UI packet to the agent's canvas ---
      try {
        const agentId = AGENT_ID_MAP[agentType] || `${agentType}-agent`;
        const { title, blocks, priority } = buildUIBlocksFromResult(agentType, result, goal, context);

        if (blocks.length > 0) {
          emitUIPacket(agentId, title, blocks, {
            entityType: context.projectId ? 'project' : context.initiativeId ? 'initiative' : undefined,
            entityId: entityId,
            entityName: entityId,
            priority,
            size: blocks.length > 3 ? 'large' : blocks.length > 1 ? 'medium' : 'small',
            section: agentType,
            refreshable: true,
            reasoning: result.analysis?.substring(0, 300),
            // Preserve source data so users can reshape the visualization via AI chat
            sourceData: typeof result === 'object' ? result : undefined,
          });
        }
      } catch (emitErr: any) {
        // Don't fail the tool execution if UI emission fails
        console.warn(`[executeWithMemory] Failed to emit UI packet for ${agentType}:`, emitErr.message);
      }
    }

    return result;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    recordError(traceId, agentType, err.message, agentClass);
    endTrace(traceId, agentType, durationMs);
    throw err;
  }
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
 * PMO - SAFe Flow Metrics
 */
export const flowMetricsTool = createTool({
  id: 'flow-metrics',
  description: 'Analyze SAFe flow metrics — Distribution, Velocity, Time, Load, and Efficiency — with anomaly detection across ARTs and value streams',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier'),
    valueStream: z.string().optional().describe('Value stream (e.g. vs-digital-platform)'),
    metric: z.enum(['distribution', 'velocity', 'time', 'load', 'efficiency', 'all']).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    flowEfficiency: z.number().optional(),
    cycleTime: z.number().optional(),
    throughput: z.number().optional(),
    wipCount: z.number().optional(),
    anomalies: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze SAFe flow ${input.metric || 'all'} metrics${input.valueStream ? ` for value stream ${input.valueStream}` : ''}${input.projectId ? ` for project ${input.projectId}` : ''}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { projectId: input.projectId, valueStream: input.valueStream, metric: input.metric });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), flowEfficiency: result?.flowEfficiency, cycleTime: result?.cycleTime, throughput: result?.throughput, wipCount: result?.wipCount, anomalies: result?.anomalies };
  },
});

/**
 * FinOps - Spend Analytics
 */
export const spendAnalyticsTool = createTool({
  id: 'spend-analytics',
  description: 'Analyze spend patterns across the portfolio — cost anomaly detection, vendor spend distribution, and spending trend analysis from AtlasFinancialRecord data',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier (omit for portfolio-wide)'),
    period: z.enum(['monthly', 'quarterly', 'ytd', 'all']).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    totalSpend: z.number().optional(),
    anomalies: z.array(z.object({ description: z.string(), amount: z.number(), severity: z.string() })).optional(),
    topCategories: z.array(z.object({ category: z.string(), amount: z.number() })).optional(),
  }),
  execute: async (input) => {
    const goal = `Analyze spend patterns${input.projectId ? ` for project ${input.projectId}` : ' across portfolio'} for ${input.period || 'current'} period`;
    const result = await executeWithMemory('finops', 'DeepFinOpsAgent', goal, { projectId: input.projectId, period: input.period });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), totalSpend: result?.totalSpend, anomalies: result?.anomalies, topCategories: result?.topCategories };
  },
});

/**
 * FinOps - Budget Forecasting
 */
export const budgetForecastingTool = createTool({
  id: 'budget-forecasting',
  description: 'Generate budget forecasts based on current burn rate trends, historical patterns, and planned scope — flag projects likely to overrun before they do',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier'),
    forecastQuarters: z.number().optional().describe('Quarters to forecast'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    forecastedSpend: z.number().optional(),
    overrunRisk: z.string().optional(),
    confidenceLevel: z.number().optional(),
  }),
  execute: async (input) => {
    const goal = `Forecast budget${input.projectId ? ` for project ${input.projectId}` : ' for portfolio'} over ${input.forecastQuarters || 2} quarters`;
    const result = await executeWithMemory('finops', 'DeepFinOpsAgent', goal, { projectId: input.projectId, forecastQuarters: input.forecastQuarters });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), forecastedSpend: result?.forecastedSpend, overrunRisk: result?.overrunRisk, confidenceLevel: result?.confidenceLevel };
  },
});

/**
 * VRO - Investment Recommendations
 */
export const investmentRecommendationsTool = createTool({
  id: 'investment-recommendations',
  description: 'Generate investment portfolio recommendations — which projects to increase, maintain, reduce, or sunset based on ROI, NPV, and value realization trends',
  inputSchema: z.object({
    portfolioId: z.string().optional().describe('Portfolio or value stream'),
    investmentThreshold: z.number().optional().describe('Minimum ROI threshold'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    recommendations: z.array(z.object({ projectId: z.string(), action: z.string(), rationale: z.string() })).optional(),
    portfolioRoi: z.number().optional(),
  }),
  execute: async (input) => {
    const goal = `Generate investment recommendations${input.portfolioId ? ` for ${input.portfolioId}` : ' across portfolio'}${input.investmentThreshold ? ` with ${input.investmentThreshold}% ROI threshold` : ''}`;
    const result = await executeWithMemory('vro', 'DeepVROAgent', goal, { portfolioId: input.portfolioId, investmentThreshold: input.investmentThreshold });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), recommendations: result?.recommendations, portfolioRoi: result?.portfolioRoi };
  },
});

/**
 * Governance - Policy Validation
 */
export const policyValidationTool = createTool({
  id: 'policy-validation',
  description: 'Validate project actions against Policy-as-Code rules — check if proposed changes, approvals, or decisions comply with enterprise governance policies and SOPs',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
    action: z.string().describe('Proposed action to validate'),
    policyDomain: z.enum(['budget', 'compliance', 'risk', 'change', 'procurement', 'all']).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    compliant: z.boolean().optional(),
    violations: z.array(z.object({ policy: z.string(), violation: z.string(), severity: z.string() })).optional(),
    requiredApprovals: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    const goal = `Validate action "${input.action}" for project ${input.projectId} against ${input.policyDomain || 'all'} policies`;
    const result = await executeWithMemory('governance', 'DeepGovernanceAgent', goal, { projectId: input.projectId, action: input.action, policyDomain: input.policyDomain });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), compliant: result?.compliant, violations: result?.violations, requiredApprovals: result?.requiredApprovals };
  },
});

/**
 * Governance - Audit Trail Generation
 */
export const auditTrailTool = createTool({
  id: 'audit-trail',
  description: 'Generate audit trail report for a project or decision — all significant actions, approvals, agent interventions, and policy checks with timestamps',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Project identifier'),
    startDate: z.string().optional().describe('Start date for audit period'),
    endDate: z.string().optional().describe('End date for audit period'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    auditEntries: z.array(z.object({ timestamp: z.string(), action: z.string(), actor: z.string(), outcome: z.string() })).optional(),
    totalEntries: z.number().optional(),
  }),
  execute: async (input) => {
    const goal = `Generate audit trail${input.projectId ? ` for project ${input.projectId}` : ' for portfolio'}${input.startDate ? ` from ${input.startDate}` : ''}${input.endDate ? ` to ${input.endDate}` : ''}`;
    const result = await executeWithMemory('governance', 'DeepGovernanceAgent', goal, { projectId: input.projectId, startDate: input.startDate, endDate: input.endDate });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), auditEntries: result?.auditEntries, totalEntries: result?.totalEntries };
  },
});

/**
 * TMO - Adoption Curve Tracking
 */
export const adoptionCurveTool = createTool({
  id: 'adoption-curve-tracking',
  description: 'Track adoption curves against targets for transformation initiatives — correlate initiative progress with business outcome metrics and flag transformation fatigue',
  inputSchema: z.object({
    projectId: z.string().describe('Project identifier'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    adoptionRate: z.number().optional(),
    targetRate: z.number().optional(),
    fatigueDetected: z.boolean().optional(),
    velocityTrend: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Track adoption curve and detect transformation fatigue for project ${input.projectId}`;
    const result = await executeWithMemory('tmo', 'DeepTMOAgent', goal, { projectId: input.projectId });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), adoptionRate: result?.adoptionRate, targetRate: result?.targetRate, fatigueDetected: result?.fatigueDetected, velocityTrend: result?.velocityTrend };
  },
});

/**
 * OKR - Orphaned Project Detection
 */
export const orphanedProjectDetectionTool = createTool({
  id: 'orphaned-project-detection',
  description: 'Detect orphaned projects — work not linked to any strategic objective or OKR — and alignment drift where key results have degraded over quarters',
  inputSchema: z.object({
    includeAlignment: z.boolean().optional().describe('Include alignment scoring'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    orphanedProjects: z.array(z.object({ projectId: z.string(), name: z.string(), reason: z.string() })).optional(),
    alignmentDrift: z.array(z.object({ okrId: z.string(), q1Score: z.number(), currentScore: z.number() })).optional(),
  }),
  execute: async (input) => {
    const goal = `Detect orphaned projects and OKR alignment drift${input.includeAlignment ? ' with full alignment scoring' : ''}`;
    const result = await executeWithMemory('vro', 'DeepVROAgent', goal, { includeAlignment: input.includeAlignment });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), orphanedProjects: result?.orphanedProjects, alignmentDrift: result?.alignmentDrift };
  },
});

/**
 * Integrated - Executive Insight Synthesis
 */
export const executiveInsightTool = createTool({
  id: 'executive-insight-synthesis',
  description: 'Generate executive leadership briefing — cross-agent pattern correlation across financial, operational, compliance, and change management domains with quantified impacts and prioritized recommendations',
  inputSchema: z.object({
    focus: z.enum(['strategic', 'financial', 'risk', 'delivery', 'comprehensive']).optional(),
    division: z.string().optional().describe('Specific division to focus on'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    keyFindings: z.array(z.string()).optional(),
    recommendations: z.array(z.object({ action: z.string(), impact: z.string(), priority: z.string() })).optional(),
    riskSummary: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Generate ${input.focus || 'comprehensive'} executive insight briefing${input.division ? ` for ${input.division}` : ''}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { focus: input.focus, division: input.division });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), keyFindings: result?.keyFindings, recommendations: result?.recommendations, riskSummary: result?.riskSummary };
  },
});

/**
 * Integrated - What-If Simulation
 */
export const whatIfSimulationTool = createTool({
  id: 'what-if-simulation',
  description: 'Run what-if simulation — modify portfolio variables (budgets, timelines, resources, scope) and preview how changes propagate across the portfolio before committing',
  inputSchema: z.object({
    scenarioName: z.string().describe('Name for this simulation scenario'),
    changes: z.array(z.object({
      projectId: z.string(),
      variable: z.string(),
      currentValue: z.string(),
      newValue: z.string(),
    })).describe('Variable changes to simulate'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    impactSummary: z.string().optional(),
    affectedProjects: z.array(z.object({ projectId: z.string(), impact: z.string() })).optional(),
    recommendation: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Run what-if simulation "${input.scenarioName}" with ${input.changes.length} variable changes`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { scenarioName: input.scenarioName, changes: input.changes });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), impactSummary: result?.impactSummary, affectedProjects: result?.affectedProjects, recommendation: result?.recommendation };
  },
});

/**
 * Integrated - Write-Back to Source Systems
 */
export const writeBackTool = createTool({
  id: 'write-back',
  description: 'Push governed changes back to source PPM systems (Jira, OpenProject, Monday.com) — closes the loop between AI analysis and operational action via MCP write-back API',
  inputSchema: z.object({
    targetSystem: z.enum(['jira', 'openproject', 'monday', 'confluence']).describe('Target system'),
    entityType: z.enum(['project', 'epic', 'insight', 'risk', 'task']).describe('Entity type'),
    action: z.enum(['create', 'update', 'comment']).describe('Action to perform'),
    projectId: z.string().describe('Source project identifier'),
    payload: z.record(z.any()).describe('Data payload for the write-back'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    success: z.boolean().optional(),
    externalId: z.string().optional(),
    targetUrl: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Write-back ${input.action} ${input.entityType} to ${input.targetSystem} for project ${input.projectId}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { targetSystem: input.targetSystem, entityType: input.entityType, action: input.action, projectId: input.projectId, payload: input.payload });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), success: result?.success, externalId: result?.externalId, targetUrl: result?.targetUrl };
  },
});

/**
 * Notification - Cascade Workflow
 */
export const cascadeWorkflowTool = createTool({
  id: 'cascade-workflow',
  description: 'Trigger a pre-defined multi-agent cascade workflow — e.g. Budget Reduction Cascade sequences through FinOps → VRO → TMO → Planning → Governance automatically',
  inputSchema: z.object({
    cascadeType: z.enum(['budget-reduction', 'risk-escalation', 'compliance-breach', 'schedule-slip', 'go-live-readiness']).describe('Type of cascade to trigger'),
    projectId: z.string().describe('Project that triggered the cascade'),
    trigger: z.string().describe('What triggered this cascade'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    cascadeId: z.string().optional(),
    agentsInvolved: z.array(z.string()).optional(),
    status: z.string().optional(),
  }),
  execute: async (input) => {
    const goal = `Trigger ${input.cascadeType} cascade for project ${input.projectId}: ${input.trigger}`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { cascadeType: input.cascadeType, projectId: input.projectId, trigger: input.trigger });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), cascadeId: result?.cascadeId, agentsInvolved: result?.agentsInvolved, status: result?.status };
  },
});

/**
 * Notification - Priority Routing & Deduplication
 */
export const notificationRoutingTool = createTool({
  id: 'notification-routing',
  description: 'Deduplicate overlapping agent findings, prioritize by severity and organizational impact, and route notifications to appropriate stakeholders via email, Slack, Teams, or in-app',
  inputSchema: z.object({
    findings: z.array(z.object({ agentId: z.string(), finding: z.string(), severity: z.string() })).describe('Agent findings to process'),
    channel: z.enum(['email', 'slack', 'teams', 'in-app', 'auto']).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    deduplicatedCount: z.number().optional(),
    routedNotifications: z.array(z.object({ recipient: z.string(), channel: z.string(), priority: z.string() })).optional(),
  }),
  execute: async (input) => {
    const goal = `Process and route ${input.findings.length} agent findings via ${input.channel || 'auto'} channel`;
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', goal, { findings: input.findings, channel: input.channel });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), deduplicatedCount: result?.deduplicatedCount, routedNotifications: result?.routedNotifications };
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
  flowMetricsTool,
  opGetProjectHealthTool,
  opGetGanttDataTool,
  opCreateWorkPackageTool,
  opUpdateWorkPackageTool,
  opGetResourceCapacityTool,
  opAddRelationTool,
  opSendNotificationTool,
};

export const finopsTools = {
  analyzeBudgetVarianceTool,
  calculateRoiTool,
  burnRateForecastTool,
  costOptimizationTool,
  earnedValueTool,
  spendAnalyticsTool,
  budgetForecastingTool,
  opGetBudgetTool,
  opLogTimeTool,
  opCreateWorkPackageTool,
  opSendNotificationTool,
};

export const riskTools = {
  assessRiskTool,
  planMitigationTool,
  earlyWarningScanTool,
  riskCorrelationTool,
  opCreateRiskTool,
  opCreateWorkPackageTool,
  opAddRelationTool,
  opSendNotificationTool,
};

export const vroTools = {
  trackValueTool,
  analyzeOkrAlignmentTool,
  benefitsRealizationTool,
  valueStreamMappingTool,
  investmentRecommendationsTool,
  opGetProjectHealthTool,
  opCreateWorkPackageTool,
  opSendNotificationTool,
};

export const governanceTools = {
  checkComplianceTool,
  gateReviewTool,
  auditPreparationTool,
  evaluateRulesTool,
  policyValidationTool,
  auditTrailTool,
  opCreateMeetingTool,
  opCreateWorkPackageTool,
  opSendNotificationTool,
};

export const ocmTools = {
  changeReadinessTool,
  stakeholderImpactTool,
  adoptionTrackingTool,
  opCreateWorkPackageTool,
  opSendNotificationTool,
};

export const tmoTools = {
  transitionReadinessTool,
  cutoverPlanningTool,
  hypercareTool,
  adoptionCurveTool,
  opCreateVersionTool,
  opGetGanttDataTool,
  opCreateWorkPackageTool,
  opSendNotificationTool,
};

export const planningTools = {
  roadmapAnalysisTool,
  scenarioModelingTool,
  capacityForecastingTool,
  wsjfPrioritizationTool,
  opGetGanttDataTool,
  opGetResourceCapacityTool,
  opCreateVersionTool,
  opCreateWorkPackageTool,
  opSendNotificationTool,
};

export const integratedTools = {
  portfolioHealthTool,
  crossProjectImpactTool,
  executiveInsightTool,
  whatIfSimulationTool,
  writeBackTool,
};

export const okrTools = {
  okrGapDetectionTool,
  kpiTrendTool,
  orphanedProjectDetectionTool,
};

export const notificationTools = {
  hitlApprovalTool,
  cascadeWorkflowTool,
  notificationRoutingTool,
};

export const simulationTool = createTool({
  id: 'simulation-sandbox',
  description: 'Run agent re-run simulation — modify portfolio variables and re-execute agent analysis against modified data to preview outcomes before committing changes',
  inputSchema: z.object({
    scenarioName: z.string().describe('Descriptive name for this simulation'),
    modifications: z.array(z.object({ entity: z.string(), field: z.string(), originalValue: z.string(), newValue: z.string() })),
    agentsToRerun: z.array(z.string()).optional().describe('Agent keys to re-run (default: all)'),
  }),
  outputSchema: z.object({ analysis: z.string(), outcomes: z.array(z.object({ agent: z.string(), finding: z.string() })).optional() }),
  execute: async (input) => {
    const result = await executeWithMemory('integrated', 'DeepIntegratedMgmt', `Simulation "${input.scenarioName}": re-run agents against modified data`, { modifications: input.modifications, agentsToRerun: input.agentsToRerun });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), outcomes: result?.outcomes };
  },
});

export const temporalQueryTool = createTool({
  id: 'temporal-query',
  description: 'Execute temporal knowledge graph queries — point-in-time snapshots, range analysis, causal chain traversal, counterfactual what-if, and drift/decay detection',
  inputSchema: z.object({
    queryType: z.enum(['point-in-time', 'range', 'causal-chain', 'counterfactual', 'decay-drift']),
    entity: z.string().optional().describe('Entity to query (project, policy, risk, etc.)'),
    entityId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  outputSchema: z.object({ analysis: z.string(), results: z.array(z.any()).optional(), timelineEvents: z.array(z.object({ date: z.string(), event: z.string() })).optional() }),
  execute: async (input) => {
    const result = await executeWithMemory('integrated', 'DeepIntegratedMgmt', `Temporal ${input.queryType} query for ${input.entity || 'portfolio'}`, { queryType: input.queryType, entity: input.entity, entityId: input.entityId, startDate: input.startDate, endDate: input.endDate });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), results: result?.results, timelineEvents: result?.timelineEvents };
  },
});

export const policyIngestionTool = createTool({
  id: 'policy-ingestion',
  description: 'Ingest policy documents (SOPs, regulatory filings, compliance frameworks) and extract machine-executable rules using Policy-as-Code pipeline',
  inputSchema: z.object({
    documentName: z.string(),
    documentType: z.enum(['sop', 'regulatory', 'compliance-framework', 'governance-policy', 'custom']),
    content: z.string().describe('Document text content'),
  }),
  outputSchema: z.object({ analysis: z.string(), extractedRules: z.array(z.object({ ruleId: z.string(), description: z.string(), threshold: z.string() })).optional(), policyId: z.string().optional() }),
  execute: async (input) => {
    const result = await executeWithMemory('governance', 'DeepGovernanceAgent', `Ingest ${input.documentType} document "${input.documentName}" and extract rules`, { documentName: input.documentName, documentType: input.documentType, content: input.content });
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), extractedRules: result?.extractedRules, policyId: result?.policyId };
  },
});

export const interventionTool = createTool({
  id: 'intervention-management',
  description: 'Create, track, and manage interventions — the closed-loop pipeline from AI detection through human approval to write-back execution',
  inputSchema: z.object({
    action: z.enum(['create', 'list', 'approve', 'reject', 'execute']),
    interventionId: z.string().optional(),
    projectId: z.string().optional(),
    description: z.string().optional(),
    interventionType: z.enum(['budget-pause', 'scope-reduction', 'timeline-extension', 'resource-reallocation', 'risk-mitigation', 'escalation']).optional(),
  }),
  outputSchema: z.object({ analysis: z.string(), interventionId: z.string().optional(), status: z.string().optional() }),
  execute: async (input) => {
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', `Intervention ${input.action}${input.projectId ? ` for project ${input.projectId}` : ''}${input.description ? `: ${input.description}` : ''}`, input);
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), interventionId: result?.interventionId, status: result?.status };
  },
});

export const dataQualityTool = createTool({
  id: 'data-quality-assessment',
  description: 'Assess data quality across Palantir Foundry objects — completeness, consistency, freshness, and accuracy scores per entity type',
  inputSchema: z.object({
    objectType: z.string().optional().describe('Palantir object type to assess (e.g. AtlasProject)'),
    scope: z.enum(['single-type', 'portfolio-wide']).optional(),
  }),
  outputSchema: z.object({ analysis: z.string(), qualityScore: z.number().optional(), issues: z.array(z.object({ field: z.string(), issue: z.string(), severity: z.string() })).optional() }),
  execute: async (input) => {
    const result = await executeWithMemory('integrated', 'DeepIntegratedMgmt', `Data quality assessment for ${input.objectType || 'all object types'}`, input);
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), qualityScore: result?.qualityScore, issues: result?.issues };
  },
});

export const resourceOptimizationTool = createTool({
  id: 'resource-optimization',
  description: 'Optimize resource allocation across the portfolio — identify over/under-allocated teams, suggest rebalancing, and forecast hiring needs',
  inputSchema: z.object({
    horizon: z.enum(['current-sprint', 'current-pi', 'next-quarter', 'annual']).optional(),
    valueStream: z.string().optional(),
  }),
  outputSchema: z.object({ analysis: z.string(), overAllocated: z.array(z.object({ team: z.string(), utilization: z.number() })).optional(), underAllocated: z.array(z.object({ team: z.string(), utilization: z.number() })).optional(), recommendations: z.array(z.string()).optional() }),
  execute: async (input) => {
    const result = await executeWithMemory('pmo', 'DeepPMOAgent', `Resource optimization for ${input.horizon || 'current-pi'}${input.valueStream ? ` in ${input.valueStream}` : ''}`, input);
    return { analysis: typeof result === 'string' ? result : JSON.stringify(result), overAllocated: result?.overAllocated, underAllocated: result?.underAllocated, recommendations: result?.recommendations };
  },
});

export const simulationTools = {
  simulationTool,
  temporalQueryTool,
};

export const policyTools = {
  policyIngestionTool,
};

export const interventionTools = {
  interventionTool,
};

export const dataQualityTools = {
  dataQualityTool,
};

export const resourceTools = {
  resourceOptimizationTool,
};
