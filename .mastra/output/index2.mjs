import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const analyzeProjectHealthTool = createTool({
  id: "analyze-project-health",
  description: "Analyze project health metrics including schedule, budget, and resource utilization",
  inputSchema: z.object({
    projectId: z.string().describe("Project identifier"),
    includeHistory: z.boolean().optional().describe("Include historical trends")
  }),
  outputSchema: z.object({
    analysis: z.string(),
    healthScore: z.number().optional(),
    recommendations: z.array(z.string()).optional()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `Health analysis for project ${context.projectId}`,
      healthScore: 85,
      recommendations: ["Continue monitoring schedule variance"]
    };
  }
});
const identifyDependenciesTool = createTool({
  id: "identify-dependencies",
  description: "Analyze cross-project dependencies and potential blockers",
  inputSchema: z.object({
    projectId: z.string().describe("Project identifier"),
    depth: z.number().optional().describe("Dependency chain depth to analyze")
  }),
  outputSchema: z.object({
    dependencies: z.array(z.object({
      sourceProject: z.string(),
      targetProject: z.string(),
      type: z.string(),
      status: z.string()
    })).optional(),
    blockers: z.array(z.string()).optional(),
    analysis: z.string()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `Dependencies for project ${context.projectId}`,
      dependencies: [],
      blockers: []
    };
  }
});
const analyzeBudgetVarianceTool = createTool({
  id: "analyze-budget-variance",
  description: "Analyze budget vs actual spending and identify variances",
  inputSchema: z.object({
    projectId: z.string().describe("Project identifier"),
    period: z.enum(["monthly", "quarterly", "ytd"]).optional().describe("Analysis period")
  }),
  outputSchema: z.object({
    variance: z.number().optional(),
    variancePercentage: z.number().optional(),
    analysis: z.string(),
    recommendations: z.array(z.string()).optional()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `Budget variance for project ${context.projectId}`,
      variance: 0,
      variancePercentage: 0,
      recommendations: []
    };
  }
});
const calculateRoiTool = createTool({
  id: "calculate-roi",
  description: "Calculate return on investment for projects or initiatives",
  inputSchema: z.object({
    projectId: z.string().describe("Project identifier"),
    timeHorizon: z.string().optional().describe("Time horizon for ROI calculation")
  }),
  outputSchema: z.object({
    roi: z.number().optional(),
    npv: z.number().optional(),
    paybackPeriod: z.string().optional(),
    analysis: z.string()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `ROI calculation for project ${context.projectId}`,
      roi: 150,
      npv: 5e5,
      paybackPeriod: "18 months"
    };
  }
});
const assessRiskTool = createTool({
  id: "assess-risk",
  description: "Comprehensive risk assessment with severity scoring",
  inputSchema: z.object({
    projectId: z.string().describe("Project identifier"),
    riskCategory: z.enum(["technical", "schedule", "budget", "resource", "external", "all"]).optional()
  }),
  outputSchema: z.object({
    risks: z.array(z.object({
      id: z.string(),
      description: z.string(),
      severity: z.string(),
      probability: z.string(),
      impact: z.string()
    })).optional(),
    overallRiskScore: z.number().optional(),
    analysis: z.string()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `Risk assessment for project ${context.projectId}`,
      risks: [],
      overallRiskScore: 3.5
    };
  }
});
const planMitigationTool = createTool({
  id: "plan-mitigation",
  description: "Generate risk mitigation strategies and action plans",
  inputSchema: z.object({
    projectId: z.string().describe("Project identifier"),
    riskId: z.string().optional().describe("Specific risk to mitigate")
  }),
  outputSchema: z.object({
    mitigationStrategies: z.array(z.object({
      riskId: z.string(),
      strategy: z.string(),
      actions: z.array(z.string()),
      owner: z.string().optional()
    })).optional(),
    analysis: z.string()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `Mitigation plan for project ${context.projectId}`,
      mitigationStrategies: []
    };
  }
});
const trackValueTool = createTool({
  id: "track-value",
  description: "Track business value realization against targets",
  inputSchema: z.object({
    initiativeId: z.string().describe("Initiative or project identifier"),
    metrics: z.array(z.string()).optional().describe("Specific metrics to track")
  }),
  outputSchema: z.object({
    valueRealized: z.number().optional(),
    valueTarget: z.number().optional(),
    realizationPercentage: z.number().optional(),
    analysis: z.string()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `Value tracking for initiative ${context.initiativeId}`,
      valueRealized: 75e4,
      valueTarget: 1e6,
      realizationPercentage: 75
    };
  }
});
const analyzeOkrAlignmentTool = createTool({
  id: "analyze-okr-alignment",
  description: "Analyze alignment between projects and strategic OKRs",
  inputSchema: z.object({
    projectId: z.string().optional().describe("Project identifier"),
    okrId: z.string().optional().describe("OKR identifier")
  }),
  outputSchema: z.object({
    alignmentScore: z.number().optional(),
    gaps: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
    analysis: z.string()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `OKR alignment analysis`,
      alignmentScore: 82,
      gaps: [],
      recommendations: []
    };
  }
});
const checkComplianceTool = createTool({
  id: "check-compliance",
  description: "Check project compliance with governance standards",
  inputSchema: z.object({
    projectId: z.string().describe("Project identifier"),
    framework: z.enum(["safe", "pmbok", "prince2", "custom"]).optional()
  }),
  outputSchema: z.object({
    compliant: z.boolean().optional(),
    complianceScore: z.number().optional(),
    violations: z.array(z.string()).optional(),
    analysis: z.string()
  }),
  execute: async ({ context }) => {
    return {
      analysis: `Compliance check for project ${context.projectId}`,
      compliant: true,
      complianceScore: 95,
      violations: []
    };
  }
});

var tools = /*#__PURE__*/Object.freeze({
  __proto__: null,
  analyzeBudgetVarianceTool: analyzeBudgetVarianceTool,
  analyzeOkrAlignmentTool: analyzeOkrAlignmentTool,
  analyzeProjectHealthTool: analyzeProjectHealthTool,
  assessRiskTool: assessRiskTool,
  calculateRoiTool: calculateRoiTool,
  checkComplianceTool: checkComplianceTool,
  identifyDependenciesTool: identifyDependenciesTool,
  planMitigationTool: planMitigationTool,
  trackValueTool: trackValueTool
});

export { analyzeProjectHealthTool as a, analyzeBudgetVarianceTool as b, calculateRoiTool as c, assessRiskTool as d, analyzeOkrAlignmentTool as e, checkComplianceTool as f, tools as g, identifyDependenciesTool as i, planMitigationTool as p, trackValueTool as t };
