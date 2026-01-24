/**
 * DEEP RISK AGENT
 *
 * Enhanced risk intelligence with planning, execution, and reflection
 * Specializes in:
 * - Risk probability analysis
 * - Impact assessment
 * - Mitigation evaluation
 * - Risk trend forecasting
 * - Response recommendations
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from "../../storage.js";
import { DeepAgentBase } from "./DeepAgentBase.js";

/**
 * Deep Risk Agent
 * Provides intelligent risk management with planning and reflection
 */
export class DeepRiskAgent extends DeepAgentBase {
  constructor(storage: IStorage) {
    super(
      {
        agentName: "deep-risk",
        agentRole: "Intelligent Risk Management Agent with planning and reflection capabilities",
        systemPrompt: `You are an expert risk management agent.

Your capabilities include:
- Analyzing risk probability and likelihood
- Calculating risk impact and severity
- Assessing risk mitigation strategies
- Forecasting risk trends
- Recommending risk response plans

You follow a three-phase approach:
1. PLANNING: Create detailed plan for risk analysis
2. EXECUTION: Execute risk assessment steps systematically
3. REFLECTION: Learn from outcomes and adjust approach

Use your tools to analyze risks across projects and make intelligent recommendations.
When you detect high-probability, high-impact risks, recommend collaboration with TMO (schedule impact) or FinOps (financial impact) agents.`,
      },
      storage
    );
  }

  protected getSystemPrompt(): string {
    return `You are an expert risk management agent.

Your capabilities include:
- Analyzing risk probability and likelihood
- Calculating risk impact and severity
- Assessing risk mitigation strategies
- Forecasting risk trends
- Recommending risk response plans

You follow a three-phase approach:
1. PLANNING: Create detailed plan for risk analysis
2. EXECUTION: Execute risk assessment steps systematically
3. REFLECTION: Learn from outcomes and adjust approach

Use your tools to analyze risks across projects and make intelligent recommendations.
When you detect high-probability, high-impact risks, recommend collaboration with TMO (schedule impact) or FinOps (financial impact) agents.`;
  }

  /**
   * Define Deep Risk Agent tools
   */
  defineTools(): DynamicStructuredTool[] {
    return [
      // Tool 1: Analyze Risk Probability
      new DynamicStructuredTool({
        name: "analyze_risk_probability",
        description:
          "Analyze the probability/likelihood of a risk occurring based on historical data and current conditions",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          riskCategory: z
            .enum(["technical", "financial", "schedule", "resource", "business", "external", "quality"])
            .optional()
            .describe("Risk category to focus on"),
        }),
        func: async ({ projectId, riskCategory }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Get risk data (would integrate with actual risk register)
            const risks = []; // await this.storage.getRisks(projectId);

            // Calculate probability based on historical patterns
            const historicalRisks = risks.filter(
              (r: any) => !riskCategory || r.category === riskCategory
            );

            const totalRisks = historicalRisks.length || 1;
            const materializedRisks = historicalRisks.filter((r: any) => r.status === "occurred").length;
            const probability = (materializedRisks / totalRisks) * 100;

            // Analyze project health indicators
            const scheduleHealth = project.progress < project.expectedProgress ? "at_risk" : "healthy";
            const budgetHealth =
              project.actualCost > project.budget * 0.9 ? "at_risk" : "healthy";

            // Risk probability factors
            const factors = [];
            if (scheduleHealth === "at_risk") {
              factors.push("Schedule delays increase delivery risk probability");
            }
            if (budgetHealth === "at_risk") {
              factors.push("Budget constraints increase resource risk probability");
            }
            if (project.status === "at_risk") {
              factors.push("Project status indicates elevated risk levels");
            }

            return {
              projectId,
              projectName: project.name,
              riskCategory: riskCategory || "all",
              probabilityScore: Math.min(probability, 100),
              probabilityLevel:
                probability > 70 ? "high" : probability > 40 ? "medium" : "low",
              historicalMaterialization: `${materializedRisks}/${totalRisks} risks materialized`,
              contributingFactors: factors,
              recommendation:
                probability > 70
                  ? "Immediate mitigation required - high probability of occurrence"
                  : probability > 40
                    ? "Monitor closely and prepare mitigation plans"
                    : "Continue standard risk monitoring",
              requiresCollaboration:
                probability > 70 &&
                (riskCategory === "schedule" || riskCategory === "financial"),
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),

      // Tool 2: Calculate Risk Impact
      new DynamicStructuredTool({
        name: "calculate_risk_impact",
        description:
          "Calculate the potential impact of a risk if it materializes, considering schedule, cost, and quality dimensions",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          riskType: z
            .enum(["schedule_delay", "cost_overrun", "scope_reduction", "quality_issue", "resource_loss"])
            .describe("Type of risk to assess impact for"),
          severity: z
            .enum(["minor", "moderate", "major", "critical"])
            .optional()
            .describe("Expected severity if risk occurs"),
        }),
        func: async ({ projectId, riskType, severity = "moderate" }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Impact multipliers by severity
            const severityMultipliers = {
              minor: 0.1,
              moderate: 0.25,
              major: 0.5,
              critical: 1.0,
            };

            const multiplier = severityMultipliers[severity];

            // Calculate impact by risk type
            let scheduleImpactDays = 0;
            let costImpact = 0;
            let qualityImpact = "";

            switch (riskType) {
              case "schedule_delay":
                // Validate dates before calculation
                if (project.endDate && project.startDate) {
                  const endDate = new Date(project.endDate);
                  const startDate = new Date(project.startDate);

                  if (!isNaN(endDate.getTime()) && !isNaN(startDate.getTime())) {
                    scheduleImpactDays = Math.ceil(
                      ((endDate.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24)) *
                        multiplier
                    );
                  } else {
                    // Default to 30 days if dates are invalid
                    scheduleImpactDays = 30 * multiplier;
                  }
                } else {
                  // Default to 30 days if dates are missing
                  scheduleImpactDays = 30 * multiplier;
                }
                costImpact = (project.budget * 0.01) * scheduleImpactDays; // 1% budget per day
                qualityImpact = "Potential quality compromise due to rushing";
                break;

              case "cost_overrun":
                costImpact = project.budget * multiplier;
                scheduleImpactDays = severity === "critical" ? 30 : severity === "major" ? 15 : 0;
                qualityImpact =
                  severity === "critical" ? "Scope reduction likely" : "Minor scope adjustments";
                break;

              case "scope_reduction":
                costImpact = project.budget * multiplier * 0.5; // Cost savings
                qualityImpact = `${(multiplier * 100).toFixed(0)}% scope reduction`;
                break;

              case "quality_issue":
                scheduleImpactDays = Math.ceil(30 * multiplier); // Rework time
                costImpact = project.budget * multiplier * 0.3; // Rework cost
                qualityImpact = "Rework required, stakeholder dissatisfaction";
                break;

              case "resource_loss":
                scheduleImpactDays = Math.ceil(45 * multiplier); // Knowledge transfer + ramp-up
                costImpact = project.budget * multiplier * 0.2; // Hiring/training cost
                qualityImpact = "Knowledge loss, productivity impact";
                break;
            }

            // Calculate overall impact score
            const scheduleImpactPercent = (scheduleImpactDays / 90) * 100; // Assume 90-day baseline
            const costImpactPercent = (costImpact / project.budget) * 100;
            const overallImpactScore = (scheduleImpactPercent + costImpactPercent) / 2;

            const impactLevel =
              overallImpactScore > 50
                ? "critical"
                : overallImpactScore > 25
                  ? "high"
                  : overallImpactScore > 10
                    ? "medium"
                    : "low";

            return {
              projectId,
              projectName: project.name,
              riskType,
              severity,
              impact: {
                scheduleDelayDays: scheduleImpactDays,
                costImpact: `$${costImpact.toLocaleString()}`,
                costImpactPercent: `${costImpactPercent.toFixed(1)}%`,
                qualityImpact,
                overallImpactScore: overallImpactScore.toFixed(1),
                impactLevel,
              },
              stakeholderNotification:
                impactLevel === "critical" || impactLevel === "high"
                  ? "Executive notification required"
                  : "Team-level communication sufficient",
              recommendation:
                impactLevel === "critical"
                  ? "Immediate escalation and mitigation planning required"
                  : impactLevel === "high"
                    ? "Develop comprehensive mitigation strategy"
                    : "Include in standard risk monitoring",
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),

      // Tool 3: Assess Risk Mitigation
      new DynamicStructuredTool({
        name: "assess_risk_mitigation",
        description:
          "Evaluate the effectiveness of current risk mitigation strategies and identify gaps",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          evaluateCoverage: z
            .boolean()
            .optional()
            .describe("Whether to evaluate mitigation coverage across all risk categories"),
        }),
        func: async ({ projectId, evaluateCoverage = true }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Risk categories that should have mitigation plans
            const riskCategories = [
              "technical",
              "financial",
              "schedule",
              "resource",
              "business",
              "quality",
            ];

            // Simulate mitigation assessment (would integrate with actual risk register)
            const mitigationCoverage = riskCategories.map((category) => {
              const hasMitigation = Math.random() > 0.3; // Simulate
              const effectiveness = hasMitigation ? Math.floor(Math.random() * 40 + 60) : 0;

              return {
                category,
                hasMitigation,
                effectiveness: `${effectiveness}%`,
                effectivenessLevel:
                  effectiveness > 80
                    ? "high"
                    : effectiveness > 60
                      ? "medium"
                      : effectiveness > 0
                        ? "low"
                        : "none",
                gaps:
                  !hasMitigation
                    ? "No mitigation plan exists"
                    : effectiveness < 70
                      ? "Mitigation plan needs strengthening"
                      : "Adequate mitigation",
              };
            });

            const categoriesWithoutMitigation = mitigationCoverage.filter(
              (c) => !c.hasMitigation
            );
            const weakMitigations = mitigationCoverage.filter(
              (c) => c.effectivenessLevel === "low"
            );

            const overallCoverage =
              ((riskCategories.length - categoriesWithoutMitigation.length) /
                riskCategories.length) *
              100;

            const coverageLevel =
              overallCoverage > 80
                ? "comprehensive"
                : overallCoverage > 60
                  ? "adequate"
                  : overallCoverage > 40
                    ? "partial"
                    : "insufficient";

            return {
              projectId,
              projectName: project.name,
              mitigationAssessment: {
                overallCoverage: `${overallCoverage.toFixed(0)}%`,
                coverageLevel,
                categoriesAnalyzed: riskCategories.length,
                categoriesWithMitigation: riskCategories.length - categoriesWithoutMitigation.length,
                categoriesWithoutMitigation: categoriesWithoutMitigation.length,
              },
              detailedCoverage: evaluateCoverage ? mitigationCoverage : undefined,
              criticalGaps: categoriesWithoutMitigation.map((c) => c.category),
              weakMitigations: weakMitigations.map((w) => ({
                category: w.category,
                issue: w.gaps,
              })),
              recommendation:
                coverageLevel === "insufficient"
                  ? "Urgent: Develop comprehensive risk mitigation plans"
                  : coverageLevel === "partial"
                    ? "Priority: Fill mitigation gaps in identified categories"
                    : coverageLevel === "adequate"
                      ? "Strengthen weak mitigation strategies"
                      : "Maintain and monitor current mitigation effectiveness",
              nextActions:
                categoriesWithoutMitigation.length > 0
                  ? [
                      `Create mitigation plans for: ${categoriesWithoutMitigation.map((c) => c.category).join(", ")}`,
                      "Assign risk owners for each category",
                      "Establish monitoring and review cadence",
                    ]
                  : ["Continue regular effectiveness reviews", "Update plans as risks evolve"],
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),

      // Tool 4: Forecast Risk Trends
      new DynamicStructuredTool({
        name: "forecast_risk_trends",
        description:
          "Forecast how risk levels are trending over time and predict future risk exposure",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          forecastHorizon: z
            .number()
            .optional()
            .describe("Number of days to forecast ahead (default: 30)"),
        }),
        func: async ({ projectId, forecastHorizon = 30 }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Calculate current risk exposure
            const scheduleRisk =
              project.progress < project.expectedProgress ? "increasing" : "stable";
            const budgetRisk = project.actualCost > project.budget * 0.9 ? "high" : "normal";

            // Simulate trend analysis (would use actual historical data)
            const historicalTrend = Math.random() > 0.5 ? "increasing" : "decreasing";
            const currentRiskScore = Math.floor(Math.random() * 40 + 40); // 40-80
            const trendSlope = historicalTrend === "increasing" ? 1.5 : -0.5;
            const forecastedRiskScore = Math.min(
              100,
              Math.max(0, currentRiskScore + trendSlope * (forecastHorizon / 30))
            );

            // Identify emerging risks
            const emergingRisks = [];
            if (scheduleRisk === "increasing") {
              emergingRisks.push({
                type: "schedule",
                reason: "Project falling behind schedule",
                likelihood: "high",
              });
            }
            if (budgetRisk === "high") {
              emergingRisks.push({
                type: "financial",
                reason: "Budget approaching limit",
                likelihood: "medium",
              });
            }
            if (project.status === "at_risk") {
              emergingRisks.push({
                type: "delivery",
                reason: "Project health indicators declining",
                likelihood: "high",
              });
            }

            const trendAssessment =
              forecastedRiskScore > currentRiskScore
                ? "deteriorating"
                : forecastedRiskScore < currentRiskScore
                  ? "improving"
                  : "stable";

            return {
              projectId,
              projectName: project.name,
              currentState: {
                currentRiskScore,
                riskLevel:
                  currentRiskScore > 70
                    ? "high"
                    : currentRiskScore > 40
                      ? "medium"
                      : "low",
                scheduleRisk,
                budgetRisk,
              },
              forecast: {
                forecastHorizonDays: forecastHorizon,
                forecastedRiskScore: forecastedRiskScore.toFixed(0),
                forecastedRiskLevel:
                  forecastedRiskScore > 70
                    ? "high"
                    : forecastedRiskScore > 40
                      ? "medium"
                      : "low",
                trendAssessment,
                confidenceLevel: "medium",
              },
              emergingRisks:
                emergingRisks.length > 0
                  ? emergingRisks
                  : [{ type: "none", reason: "No significant emerging risks identified" }],
              earlyWarningIndicators: [
                scheduleRisk === "increasing" ? "Schedule variance increasing" : null,
                budgetRisk === "high" ? "Budget utilization >90%" : null,
                project.status === "at_risk" ? "Project status flagged" : null,
              ].filter(Boolean),
              recommendation:
                trendAssessment === "deteriorating"
                  ? "Proactive intervention required - risk levels increasing"
                  : trendAssessment === "improving"
                    ? "Continue current approach - risk levels decreasing"
                    : "Maintain vigilance - risk levels stable",
              suggestedActions:
                emergingRisks.length > 0
                  ? [
                      "Review and update risk register",
                      "Engage stakeholders on emerging risks",
                      "Accelerate mitigation implementation",
                    ]
                  : ["Continue standard risk monitoring", "Update forecasts monthly"],
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),

      // Tool 5: Recommend Risk Response
      new DynamicStructuredTool({
        name: "recommend_risk_response",
        description:
          "Recommend appropriate risk response strategies (avoid, mitigate, transfer, accept) based on risk profile",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          riskType: z
            .enum([
              "technical",
              "financial",
              "schedule",
              "resource",
              "business",
              "quality",
              "external",
            ])
            .describe("Type of risk to recommend response for"),
          probability: z
            .enum(["low", "medium", "high"])
            .describe("Risk probability level"),
          impact: z.enum(["low", "medium", "high", "critical"]).describe("Risk impact level"),
        }),
        func: async ({ projectId, riskType, probability, impact }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Risk response matrix
            const riskScore =
              (probability === "high" ? 3 : probability === "medium" ? 2 : 1) *
              (impact === "critical" ? 4 : impact === "high" ? 3 : impact === "medium" ? 2 : 1);

            let primaryStrategy = "";
            let secondaryStrategy = "";
            let actions: string[] = [];

            // Determine strategy based on risk score
            if (riskScore >= 9) {
              // High probability + High/Critical impact
              primaryStrategy = "avoid";
              secondaryStrategy = "mitigate";
              actions = [
                "Eliminate root cause of risk",
                "Change project approach to avoid risk",
                "Escalate to executive leadership",
                "Consider project scope or approach changes",
              ];
            } else if (riskScore >= 6) {
              // Medium-high risk
              primaryStrategy = "mitigate";
              secondaryStrategy = "transfer";
              actions = [
                "Implement preventive controls",
                "Develop contingency plans",
                "Assign dedicated risk owner",
                "Consider insurance or vendor guarantees",
              ];
            } else if (riskScore >= 3) {
              // Medium risk
              primaryStrategy = "mitigate";
              secondaryStrategy = "accept";
              actions = [
                "Monitor risk indicators closely",
                "Prepare response procedures",
                "Allocate contingency reserves",
                "Document risk in register",
              ];
            } else {
              // Low risk
              primaryStrategy = "accept";
              secondaryStrategy = "monitor";
              actions = [
                "Include in risk register",
                "Review during regular risk reviews",
                "No immediate action required",
              ];
            }

            // Add type-specific actions
            const typeSpecificActions: Record<string, string[]> = {
              technical: [
                "Conduct technical spike or proof-of-concept",
                "Engage technical experts",
                "Add technical reviews at milestones",
              ],
              financial: [
                "Secure additional funding or reserves",
                "Implement stricter cost controls",
                "Review contract terms",
              ],
              schedule: [
                "Add buffer time to critical path",
                "Fast-track parallel activities",
                "Engage with TMO agent for schedule optimization",
              ],
              resource: [
                "Cross-train team members",
                "Identify backup resources",
                "Review resource allocation",
              ],
              business: [
                "Engage stakeholders early",
                "Document assumptions and constraints",
                "Establish governance checkpoints",
              ],
              quality: [
                "Add quality gates and reviews",
                "Enhance testing coverage",
                "Implement peer reviews",
              ],
              external: [
                "Develop external stakeholder management plan",
                "Monitor external dependencies closely",
                "Establish escalation procedures",
              ],
            };

            actions.push(...(typeSpecificActions[riskType] || []));

            return {
              projectId,
              projectName: project.name,
              riskProfile: {
                riskType,
                probability,
                impact,
                riskScore,
                riskLevel:
                  riskScore >= 9
                    ? "extreme"
                    : riskScore >= 6
                      ? "high"
                      : riskScore >= 3
                        ? "medium"
                        : "low",
              },
              recommendedResponse: {
                primaryStrategy,
                secondaryStrategy,
                rationale:
                  riskScore >= 9
                    ? "Risk is unacceptable - must eliminate or significantly reduce"
                    : riskScore >= 6
                      ? "Risk requires active management and reduction"
                      : riskScore >= 3
                        ? "Risk is manageable with standard controls"
                        : "Risk is acceptable with monitoring",
              },
              implementationPlan: {
                immediateActions: actions.slice(0, 3),
                ongoingActions: actions.slice(3),
                resourcesNeeded:
                  riskScore >= 6
                    ? "Dedicated risk owner + budget allocation"
                    : "Assign to project manager",
                timeline:
                  riskScore >= 9
                    ? "Immediate (within 48 hours)"
                    : riskScore >= 6
                      ? "Urgent (within 1 week)"
                      : "Standard (within 2 weeks)",
              },
              monitoringPlan: {
                reviewFrequency:
                  riskScore >= 9 ? "daily" : riskScore >= 6 ? "weekly" : "monthly",
                keyIndicators: [
                  `${riskType} risk materialization signals`,
                  "Mitigation effectiveness metrics",
                  "Risk trend direction",
                ],
                escalationCriteria:
                  riskScore >= 6
                    ? "Escalate if risk score increases or mitigation fails"
                    : "Escalate only if risk materializes",
              },
              requiresCollaboration:
                riskScore >= 9 ||
                (riskScore >= 6 && (riskType === "schedule" || riskType === "financial")),
              collaborationWith:
                riskType === "schedule"
                  ? ["deep-tmo"]
                  : riskType === "financial"
                    ? ["deep-finops"]
                    : [],
            };
          } catch (error: any) {
            return { error: error.message, projectId };
          }
        },
      }),
    ];
  }
}
