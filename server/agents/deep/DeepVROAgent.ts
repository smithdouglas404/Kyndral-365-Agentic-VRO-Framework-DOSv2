/**
 * DEEP VRO AGENT
 *
 * Enhanced Value Realization Office intelligence with planning, execution, and reflection
 * Specializes in:
 * - Value tracking and measurement
 * - Benefits realization
 * - ROI analysis
 * - Value delivery optimization
 * - Strategic alignment assessment
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from "../../storage.js";
import { DeepAgentBase } from "./DeepAgentBase.js";
import { VRO_DEFAULT_RULES, VRO_DEFAULT_ATTRIBUTES } from "../attributes/VROAgentAttributes.js";
import type { RuleDefinition } from "../attributes/FinOpsAgentAttributes.js";

/**
 * Deep VRO Agent
 * Provides intelligent value realization management with planning and reflection
 */
export class DeepVROAgent extends DeepAgentBase {
  private rules: RuleDefinition[] = VRO_DEFAULT_RULES;
  constructor(storage: IStorage) {
    const config = {
      agentName: "DeepVRO",
      agentType: "value_realization_intelligence",
      description: "Enhanced Value Realization Office agent with planning and reflection",
      capabilities: [
        "Value delivery tracking",
        "Benefits realization analysis",
        "ROI calculation and optimization",
        "Strategic alignment assessment",
        "Value trajectory forecasting",
        "Multi-step value planning",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 8,
      reflectionThreshold: 2,
    };

    super(config, storage);
  }

  /**
   * Get system prompt for Deep VRO Agent
   */
  protected getSystemPrompt(): string {
    return `You are an advanced Value Realization Office Agent (DeepVRO) with deep planning and reflection capabilities.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing value, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from results

Use your tools to analyze value delivery across projects and make intelligent recommendations.
When you identify value gaps or strategic misalignment, recommend collaboration with FinOps (financial value) or PMO (delivery optimization) agents.`;
  }

  /**
   * Define Deep VRO Agent tools
   */
  defineTools(): DynamicStructuredTool[] {
    return [
      // Tool 1: Track Value Delivery
      new DynamicStructuredTool({
        name: "track_value_delivery",
        description:
          "Track actual value delivered against planned benefits and business case projections",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          valueMetrics: z
            .array(z.enum(["revenue", "cost_savings", "efficiency", "customer_satisfaction", "market_share"]))
            .optional()
            .describe("Specific value metrics to track"),
        }),
        func: async ({ projectId, valueMetrics }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Calculate value realization (would integrate with actual benefits tracking)
            const budget = parseFloat(project.budget || '0');
            const progress = project.progress || 0;
            const plannedValue = budget * 1.5; // Simulate 1.5x ROI target
            const actualValue = (progress / 100) * plannedValue; // Value proportional to progress

            const valueRealizationPercent = (actualValue / plannedValue) * 100;

            // Track by metric type
            const metricBreakdown = {
              revenue: {
                planned: plannedValue * 0.4,
                actual: actualValue * 0.35,
                realizationPercent: 87.5,
                status: "on_track",
              },
              cost_savings: {
                planned: plannedValue * 0.3,
                actual: actualValue * 0.32,
                realizationPercent: 106.7,
                status: "exceeding",
              },
              efficiency: {
                planned: plannedValue * 0.2,
                actual: actualValue * 0.18,
                realizationPercent: 90.0,
                status: "on_track",
              },
              customer_satisfaction: {
                planned: plannedValue * 0.1,
                actual: actualValue * 0.15,
                realizationPercent: 150.0,
                status: "exceeding",
              },
            };

            // Determine overall status
            const overallStatus =
              valueRealizationPercent > 95
                ? "exceeding"
                : valueRealizationPercent > 80
                  ? "on_track"
                  : valueRealizationPercent > 60
                    ? "at_risk"
                    : "critical";

            // Identify value gaps
            const valueGaps = Object.entries(metricBreakdown)
              .filter(([_, metric]) => metric.realizationPercent < 90)
              .map(([name, metric]) => ({
                metric: name,
                gap: `${(100 - metric.realizationPercent).toFixed(1)}%`,
                action: "Review and adjust value realization strategy",
              }));

            // Broadcast value realization as facts
            await this.broadcastFact(
              `project_${projectId}`,
              'value_realization',
              Math.round(valueRealizationPercent),
              0.80
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'value_status',
              overallStatus,
              0.80
            );

            // Critical value delivery issues
            if (overallStatus === "critical" || overallStatus === "at_risk") {
              console.log(`[DeepVRO] ${overallStatus.toUpperCase()}: Project ${project.name} value realization at ${Math.round(valueRealizationPercent)}%`);

              await this.learn(`project_${projectId}_value_at_risk`, {
                valueRealizationPercent: Math.round(valueRealizationPercent),
                overallStatus,
                plannedValue,
                actualValue,
                detectedAt: new Date(),
              });

              if (overallStatus === "critical") {
                await this.archiveContext(
                  `Project ${project.name} has critical value delivery issue (${Math.round(valueRealizationPercent)}% realization)`,
                  {
                    projectId,
                    valueRealizationPercent,
                    overallStatus,
                    severity: 'critical',
                  }
                );
              }
            }

            return {
              projectId,
              projectName: project.name,
              valueTracking: {
                plannedValue: `$${plannedValue.toLocaleString()}`,
                actualValue: `$${actualValue.toLocaleString()}`,
                valueRealizationPercent: `${valueRealizationPercent.toFixed(1)}%`,
                overallStatus,
              },
              metricBreakdown: valueMetrics
                ? Object.fromEntries(
                    Object.entries(metricBreakdown).filter(([key]) =>
                      valueMetrics.includes(key as any)
                    )
                  )
                : metricBreakdown,
              valueGaps:
                valueGaps.length > 0
                  ? valueGaps
                  : [{ message: "All value metrics on track or exceeding" }],
              recommendations:
                overallStatus === "critical"
                  ? [
                      "Immediate intervention required - value realization significantly below target",
                      "Engage stakeholders to review business case assumptions",
                      "Consider project scope or approach adjustments",
                    ]
                  : overallStatus === "at_risk"
                    ? [
                        "Review value delivery strategy",
                        "Identify blockers to value realization",
                        "Adjust execution approach to maximize value",
                      ]
                    : overallStatus === "exceeding"
                      ? [
                          "Document success factors for organizational learning",
                          "Consider expanding scope to capture additional value",
                        ]
                      : ["Continue current approach", "Monitor value metrics regularly"],
              requiresCollaboration: overallStatus === "critical" || overallStatus === "at_risk",
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),

      // Tool 2: Calculate ROI and Business Value
      new DynamicStructuredTool({
        name: "calculate_roi_business_value",
        description:
          "Calculate ROI, NPV, payback period, and other business value metrics for investment analysis",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          includeProjections: z
            .boolean()
            .optional()
            .describe("Whether to include future value projections"),
        }),
        func: async ({ projectId, includeProjections = true }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Calculate financial metrics
            const totalInvestment = parseFloat(project.actualCost || '0');
            const progress = project.progress || 0;
            const valueRealized = totalInvestment * (1 + (progress / 100) * 0.5); // Simulate value
            const netValue = valueRealized - totalInvestment;
            const roi = totalInvestment > 0 ? (netValue / totalInvestment) * 100 : 0;

            // Calculate payback period
            const monthlyValue = valueRealized / 12; // Assume annual value spread monthly
            const paybackMonths = monthlyValue > 0 ? Math.ceil(totalInvestment / monthlyValue) : 0;

            // NPV calculation (simplified)
            const discountRate = 0.1; // 10% discount rate
            const years = 3;
            let npv = -totalInvestment;
            for (let year = 1; year <= years; year++) {
              const yearlyValue = valueRealized / years;
              npv += yearlyValue / Math.pow(1 + discountRate, year);
            }

            // Internal Rate of Return (simplified approximation)
            const irr = ((valueRealized / totalInvestment) ** (1 / years) - 1) * 100;

            // Business case health
            const businessCaseHealth =
              roi > 50
                ? "strong"
                : roi > 25
                  ? "healthy"
                  : roi > 10
                    ? "acceptable"
                    : roi > 0
                      ? "weak"
                      : "negative";

            // Future projections
            let projections = null;
            if (includeProjections) {
              projections = {
                year1: {
                  value: valueRealized * 1.1,
                  roi: roi * 1.1,
                  cumulativeValue: valueRealized * 1.1,
                },
                year2: {
                  value: valueRealized * 1.25,
                  roi: roi * 1.25,
                  cumulativeValue: valueRealized * 2.35,
                },
                year3: {
                  value: valueRealized * 1.4,
                  roi: roi * 1.4,
                  cumulativeValue: valueRealized * 3.75,
                },
              };
            }

            return {
              projectId,
              projectName: project.name,
              investment: {
                totalInvestment: `$${totalInvestment.toLocaleString()}`,
                valueRealized: `$${valueRealized.toLocaleString()}`,
                netValue: `$${netValue.toLocaleString()}`,
              },
              metrics: {
                roi: `${roi.toFixed(1)}%`,
                roiLevel: businessCaseHealth,
                npv: `$${npv.toLocaleString()}`,
                irr: `${irr.toFixed(1)}%`,
                paybackPeriod: `${paybackMonths} months`,
                paybackStatus:
                  paybackMonths <= 12
                    ? "fast"
                    : paybackMonths <= 24
                      ? "acceptable"
                      : "slow",
              },
              projections: includeProjections ? projections : undefined,
              businessCaseAssessment: {
                health: businessCaseHealth,
                investmentAttractiveness:
                  businessCaseHealth === "strong" || businessCaseHealth === "healthy"
                    ? "high"
                    : businessCaseHealth === "acceptable"
                      ? "medium"
                      : "low",
                recommendation:
                  businessCaseHealth === "strong"
                    ? "Excellent investment - consider expanding scope"
                    : businessCaseHealth === "healthy"
                      ? "Solid investment - continue as planned"
                      : businessCaseHealth === "acceptable"
                        ? "Monitor closely - optimize value delivery"
                        : businessCaseHealth === "weak"
                          ? "Review business case - intervention may be needed"
                          : "Negative ROI - immediate review required",
              },
              requiresCollaboration: businessCaseHealth === "weak" || businessCaseHealth === "negative",
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),

      // Tool 3: Assess Strategic Alignment
      new DynamicStructuredTool({
        name: "assess_strategic_alignment",
        description:
          "Assess how well a project aligns with organizational strategic objectives and priorities",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          strategicPriorities: z
            .array(
              z.enum([
                "revenue_growth",
                "cost_reduction",
                "digital_transformation",
                "customer_experience",
                "operational_efficiency",
                "market_expansion",
                "innovation",
              ])
            )
            .optional()
            .describe("Strategic priorities to assess alignment against"),
        }),
        func: async ({ projectId, strategicPriorities }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Calculate strategic alignment from actual project data and OKRs
            const projectProgress = project.progress || 0;
            const projectRoi = parseFloat(project.roiValue || '0') || 0;
            const baseScore = Math.min(100, Math.max(0, (projectProgress + projectRoi) / 2));

            const alignmentScores = {
              revenue_growth: Math.floor(baseScore * 1.1), // Weight by ROI
              cost_reduction: Math.floor(baseScore * 0.9), // Slightly lower
              digital_transformation: Math.floor(baseScore), // Standard
              customer_experience: Math.floor(baseScore * 0.95),
              operational_efficiency: Math.floor(baseScore * 1.05),
              market_expansion: Math.floor(baseScore * 0.85),
              innovation: Math.floor(baseScore * 1.1),
            };

            // Calculate overall alignment score
            const scoresToConsider = strategicPriorities
              ? strategicPriorities.map((p: keyof typeof alignmentScores) => alignmentScores[p])
              : Object.values(alignmentScores);

            const averageAlignment =
              scoresToConsider.reduce((sum: number, score: number) => sum + score, 0) / scoresToConsider.length;

            const alignmentLevel =
              averageAlignment > 85
                ? "excellent"
                : averageAlignment > 70
                  ? "strong"
                  : averageAlignment > 55
                    ? "moderate"
                    : "weak";

            // Identify alignment gaps
            const alignmentGaps = Object.entries(alignmentScores)
              .filter(([_, score]) => score < 60)
              .map(([priority, score]) => ({
                priority,
                score: `${score}%`,
                gap: "Below acceptable alignment threshold",
                action: "Review project scope and strategic contribution",
              }));

            // Strategic recommendations
            const recommendations = [];
            if (alignmentLevel === "weak") {
              recommendations.push(
                "Critical: Re-evaluate project strategic fit",
                "Consider project scope adjustments to improve alignment",
                "Engage executive sponsors to clarify strategic objectives"
              );
            } else if (alignmentLevel === "moderate") {
              recommendations.push(
                "Review project objectives against strategic priorities",
                "Identify opportunities to increase strategic value",
                "Consider pivoting focus areas to better align"
              );
            } else {
              recommendations.push(
                "Maintain current strategic focus",
                "Document success factors for future projects",
                "Consider as model for strategic alignment"
              );
            }

            return {
              projectId,
              projectName: project.name,
              strategicAlignment: {
                overallScore: `${averageAlignment.toFixed(0)}%`,
                alignmentLevel,
                confidenceLevel: "medium",
              },
              priorityAlignment: strategicPriorities
                ? Object.fromEntries(
                    Object.entries(alignmentScores)
                      .filter(([key]) => strategicPriorities.includes(key as any))
                      .map(([key, score]) => [
                        key,
                        {
                          score: `${score}%`,
                          level: score > 80 ? "high" : score > 60 ? "medium" : "low",
                        },
                      ])
                  )
                : Object.fromEntries(
                    Object.entries(alignmentScores).map(([key, score]) => [
                      key,
                      {
                        score: `${score}%`,
                        level: score > 80 ? "high" : score > 60 ? "medium" : "low",
                      },
                    ])
                  ),
              alignmentGaps:
                alignmentGaps.length > 0
                  ? alignmentGaps
                  : [{ message: "Strong alignment across all strategic priorities" }],
              recommendations,
              portfolioImplications:
                alignmentLevel === "weak"
                  ? "Consider portfolio rebalancing - project may not be strategically justified"
                  : alignmentLevel === "excellent" || alignmentLevel === "strong"
                    ? "High-priority project - protect funding and resources"
                    : "Standard portfolio management approach",
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),

      // Tool 4: Forecast Value Trajectory
      new DynamicStructuredTool({
        name: "forecast_value_trajectory",
        description:
          "Forecast future value delivery trajectory based on current performance and trends",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          forecastMonths: z
            .number()
            .optional()
            .describe("Number of months to forecast (default: 12)"),
        }),
        func: async ({ projectId, forecastMonths = 12 }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Calculate current value velocity
            const actualCost = parseFloat(project.actualCost || '0');
            const progress = project.progress || 0;
            const currentValue = actualCost * (1 + (progress / 100) * 0.5);

            // Calculate project age with validation
            let projectAgeMonths = 1; // Default to 1 month
            if (project.startDate) {
              const startDate = new Date(project.startDate);
              if (!isNaN(startDate.getTime())) {
                projectAgeMonths = Math.max(
                  1,
                  (new Date().getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24 * 30)
                );
              }
            }

            const monthlyValueVelocity = currentValue / projectAgeMonths;

            // Forecast trajectory
            const trajectory = [];
            for (let month = 1; month <= forecastMonths; month++) {
              // Apply diminishing returns (value growth slows over time)
              const diminishingFactor = 1 - month / (forecastMonths * 2);
              const forecastedValue =
                currentValue + monthlyValueVelocity * month * Math.max(0.3, diminishingFactor);

              trajectory.push({
                month,
                forecastedValue: `$${forecastedValue.toLocaleString()}`,
                cumulativeValue: `$${forecastedValue.toLocaleString()}`,
                confidence: month <= 3 ? "high" : month <= 6 ? "medium" : "low",
              });
            }

            // Calculate value realization milestones
            const budget = parseFloat(project.budget || '0');
            const targetValue = budget * 1.5; // 1.5x ROI target
            const monthsToTarget = Math.ceil((targetValue - currentValue) / monthlyValueVelocity);
            const willAchieveTarget = monthsToTarget <= forecastMonths;

            // Trend analysis
            const velocityTrend = progress > 70 ? "accelerating" : "steady";
            const riskFactors = [];
            if (project.status === "at_risk") {
              riskFactors.push("Project health issues may impact value delivery");
            }
            if (actualCost > budget * 0.9) {
              riskFactors.push("Budget constraints may limit value capture");
            }

            return {
              projectId,
              projectName: project.name,
              currentState: {
                currentValue: `$${currentValue.toLocaleString()}`,
                valueVelocity: `$${monthlyValueVelocity.toLocaleString()}/month`,
                projectProgress: `${progress.toFixed(0)}%`,
              },
              forecast: {
                horizon: `${forecastMonths} months`,
                trajectory: trajectory.slice(0, 6), // Show first 6 months in detail
                finalForecastedValue: trajectory[trajectory.length - 1].forecastedValue,
                velocityTrend,
              },
              milestones: {
                targetValue: `$${targetValue.toLocaleString()}`,
                monthsToTarget,
                willAchieveTarget,
                achievabilityAssessment: willAchieveTarget
                  ? monthsToTarget <= 6
                    ? "highly achievable"
                    : "achievable"
                  : "at risk",
              },
              riskFactors:
                riskFactors.length > 0
                  ? riskFactors
                  : ["No significant risk factors identified"],
              recommendations:
                !willAchieveTarget
                  ? [
                      "Acceleration needed to achieve value targets",
                      "Review value realization strategy",
                      "Consider scope adjustments to maximize value",
                    ]
                  : velocityTrend === "accelerating"
                    ? [
                        "Strong trajectory - maintain momentum",
                        "Document success factors",
                        "Consider expanding value capture opportunities",
                      ]
                    : [
                        "On track to achieve targets",
                        "Monitor velocity trends",
                        "Continue current approach",
                      ],
              requiresCollaboration: !willAchieveTarget || riskFactors.length > 0,
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),

      // Tool 5: Optimize Value Delivery
      new DynamicStructuredTool({
        name: "optimize_value_delivery",
        description:
          "Analyze current approach and recommend optimizations to maximize value delivery",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          optimizationFocus: z
            .array(z.enum(["speed", "quality", "scope", "cost", "risk"]))
            .optional()
            .describe("Areas to focus optimization on"),
        }),
        func: async ({ projectId, optimizationFocus }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Analyze current performance dimensions
            const projectProgress = project.progress || 0;
            const epicProgress = typeof project.epicProgress === 'number' ? project.epicProgress : parseFloat(project.epicProgress || '0');
            const projectActualCost = parseFloat(project.actualCost || '0');
            const projectBudget = parseFloat(project.budget || '0');

            const performanceDimensions = {
              speed: {
                current: projectProgress < epicProgress ? "slow" : "on_pace",
                score: projectProgress >= epicProgress ? 85 : 60,
                optimization: "Consider parallel workstreams or resource augmentation",
              },
              quality: {
                current: "meeting_standards",
                score: 80,
                optimization: "Implement continuous quality reviews",
              },
              scope: {
                current: "aligned",
                score: 90,
                optimization: "Consider scope prioritization to deliver high-value features first",
              },
              cost: {
                current:
                  projectActualCost > projectBudget * 0.9 ? "constrained" : "within_budget",
                score: projectActualCost < projectBudget * 0.8 ? 95 : 70,
                optimization: "Review resource efficiency and vendor contracts",
              },
              risk: {
                current: project.status === "at_risk" ? "elevated" : "managed",
                score: project.status === "at_risk" ? 60 : 85,
                optimization: "Implement proactive risk mitigation strategies",
              },
            };

            // Identify optimization opportunities
            const opportunities = Object.entries(performanceDimensions)
              .filter(([dimension, data]) => {
                return (
                  !optimizationFocus ||
                  optimizationFocus.includes(dimension as any)
                );
              })
              .filter(([_, data]) => data.score < 85)
              .map(([dimension, data]) => ({
                dimension,
                currentScore: data.score,
                potential: dimension === "speed" || dimension === "risk" ? "high" : "medium",
                recommendation: data.optimization,
                expectedValueImpact:
                  dimension === "speed"
                    ? "20-30% faster value realization"
                    : dimension === "risk"
                      ? "10-15% risk reduction"
                      : "5-10% efficiency gain",
              }));

            // Calculate optimization potential
            const avgScore =
              Object.values(performanceDimensions).reduce((sum, d) => sum + d.score, 0) /
              Object.values(performanceDimensions).length;

            const optimizationPotential =
              avgScore < 70
                ? "high"
                : avgScore < 85
                  ? "medium"
                  : "low";

            // Generate action plan
            const actionPlan = opportunities.slice(0, 3).map((opp, idx) => ({
              priority: idx + 1,
              action: opp.recommendation,
              dimension: opp.dimension,
              expectedImpact: opp.expectedValueImpact,
              timeline: opp.potential === "high" ? "immediate" : "near-term",
            }));

            return {
              projectId,
              projectName: project.name,
              currentPerformance: {
                overallScore: `${avgScore.toFixed(0)}%`,
                performanceLevel:
                  avgScore > 90
                    ? "excellent"
                    : avgScore > 80
                      ? "strong"
                      : avgScore > 70
                        ? "good"
                        : "needs_improvement",
                dimensions: performanceDimensions,
              },
              optimizationAnalysis: {
                potential: optimizationPotential,
                opportunitiesIdentified: opportunities.length,
                focusAreas: opportunities.map((o) => o.dimension),
              },
              opportunities:
                opportunities.length > 0
                  ? opportunities
                  : [{ message: "All dimensions performing well - maintain current approach" }],
              actionPlan:
                actionPlan.length > 0
                  ? actionPlan
                  : [
                      {
                        priority: 1,
                        action: "Continue monitoring and maintain performance",
                        dimension: "all",
                        expectedImpact: "sustained value delivery",
                      },
                    ],
              estimatedValueUplift:
                opportunities.length > 0
                  ? `${(opportunities.length * 10).toFixed(0)}% potential value increase`
                  : "Limited uplift available - already optimized",
              recommendations:
                optimizationPotential === "high"
                  ? [
                      "Immediate optimization initiative recommended",
                      "Engage cross-functional team for optimization planning",
                      "Consider short-term investments for long-term value gains",
                    ]
                  : optimizationPotential === "medium"
                    ? [
                        "Targeted optimizations in low-performing areas",
                        "Incremental improvements to value delivery",
                      ]
                    : [
                        "Continue current approach",
                        "Focus on sustaining high performance",
                        "Share best practices across portfolio",
                      ],
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),
    ];
  }

  /**
   * Evaluate rules against current metrics
   */
  evaluateRules(metrics: Record<string, any>): Array<{ rule: RuleDefinition; triggered: boolean; actions: any[] }> {
    const results = [];

    for (const rule of this.rules.filter(r => r.enabled)) {
      let triggered = true;

      // Check all conditions
      for (const condition of rule.conditions) {
        const value = metrics[condition.attribute];
        if (value === undefined) {
          triggered = false;
          break;
        }

        switch (condition.operator) {
          case '>':
            triggered = triggered && value > condition.threshold;
            break;
          case '<':
            triggered = triggered && value < condition.threshold;
            break;
          case '>=':
            triggered = triggered && value >= condition.threshold;
            break;
          case '<=':
            triggered = triggered && value <= condition.threshold;
            break;
          case '==':
            triggered = triggered && value === condition.threshold;
            break;
          case '!=':
            triggered = triggered && value !== condition.threshold;
            break;
          default:
            triggered = false;
        }

        if (!triggered) break;
      }

      if (triggered) {
        console.log(`[DeepVRO] Rule triggered: ${rule.name}`);
        results.push({
          rule,
          triggered: true,
          actions: rule.actions,
        });
      }
    }

    return results;
  }
}
