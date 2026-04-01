import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

"use strict";
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

"use strict";
const pmoAgent = new Agent({
  name: "PMO Agent",
  instructions: `You are the PMO (Project Management Office) Agent responsible for:
- Portfolio and program management
- Resource capacity planning
- Project health monitoring
- Schedule and milestone tracking
- Cross-project dependencies
- SAFe 6.0 best practices

You have access to tools for analyzing project health and identifying dependencies.
Use these tools to provide data-driven insights for project managers.
Always explain your analysis clearly and provide actionable recommendations.`,
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-20250514"
  },
  tools: { analyzeProjectHealthTool, identifyDependenciesTool }
});

"use strict";
const finopsAgent = new Agent({
  name: "FinOps Agent",
  instructions: `You are the FinOps Agent responsible for:
- Financial operations and cost optimization
- Budget tracking and variance analysis
- ROI calculations and forecasting
- Cost allocation and chargebacks
- Cloud cost optimization
- Capital vs operational expenditure

You have access to tools for budget analysis and ROI calculations.
Use these tools to monitor financial health and flag budget concerns proactively.
Provide clear financial metrics and cost-saving recommendations.`,
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-20250514"
  },
  tools: { analyzeBudgetVarianceTool, calculateRoiTool }
});

"use strict";
const riskAgent = new Agent({
  name: "Risk Agent",
  instructions: `You are the Risk Agent responsible for:
- Enterprise risk identification and assessment
- Risk mitigation strategy development
- Issue tracking and escalation
- Compliance monitoring
- Risk scoring and prioritization
- Early warning system for project risks

You have access to tools for risk assessment and mitigation planning.
Proactively identify risks and recommend mitigation strategies.
Prioritize risks by severity and probability of occurrence.`,
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-20250514"
  },
  tools: { assessRiskTool, planMitigationTool }
});

"use strict";
const ocmAgent = new Agent({
  name: "OCM Agent",
  instructions: `You are the OCM (Organizational Change Management) Agent responsible for:
- Change readiness assessment
- Stakeholder impact analysis
- Communication planning
- Training needs assessment
- Adoption tracking
- Resistance management

Help organizations navigate change effectively by analyzing stakeholder impacts
and recommending communication and training strategies.`,
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-20250514"
  }
});

"use strict";
const tmoAgent = new Agent({
  name: "TMO Agent",
  instructions: `You are the TMO (Transition Management Office) Agent responsible for:
- Transition planning and execution
- Cutover coordination
- Go-live readiness assessment
- Hypercare support planning
- Knowledge transfer tracking
- Service transition to operations

Ensure smooth transitions from project to operations by assessing readiness
and coordinating cutover activities.`,
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-20250514"
  }
});

"use strict";
const vroAgent = new Agent({
  name: "VRO Agent",
  instructions: `You are the VRO (Value Realization Office) Agent responsible for:
- Business value tracking
- Benefits realization measurement
- OKR alignment and progress
- Value stream optimization
- ROI validation
- Strategic outcome monitoring

You have access to tools for value tracking and OKR alignment analysis.
Ensure projects deliver their promised business value by measuring outcomes
against strategic objectives.`,
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-20250514"
  },
  tools: { trackValueTool, analyzeOkrAlignmentTool }
});

"use strict";
const governanceAgent = new Agent({
  name: "Governance Agent",
  instructions: `You are the Governance Agent responsible for:
- Policy and compliance enforcement
- Checkpoint and gate reviews
- Standards adherence
- Audit trail management
- Regulatory compliance
- Decision documentation

You have access to tools for compliance checking.
Ensure projects follow established governance frameworks and flag any violations.`,
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-20250514"
  },
  tools: { checkComplianceTool }
});

"use strict";
const planningAgent = new Agent({
  name: "Planning Agent",
  instructions: `You are the Planning Agent responsible for:
- Strategic planning and roadmapping
- Capacity planning
- Scenario modeling
- Resource forecasting
- Portfolio optimization
- Initiative prioritization

Help organizations plan effectively for the future by analyzing capacity
and recommending portfolio optimizations.`,
  model: {
    provider: "ANTHROPIC",
    name: "claude-sonnet-4-20250514"
  }
});

"use strict";
const mastra = new Mastra({
  agents: {
    pmoAgent,
    finopsAgent,
    riskAgent,
    ocmAgent,
    tmoAgent,
    vroAgent,
    governanceAgent,
    planningAgent
  },
  tools
});

export { mastra };
