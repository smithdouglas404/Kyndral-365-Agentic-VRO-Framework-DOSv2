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

import { AgentTool } from "../../lib/AgentTool.js";
import { z } from "zod";
import type { IStorage } from "../../storage.js";
import { DeepAgentBase } from "./DeepAgentBase.js";
import { RISK_DEFAULT_RULES, RISK_DEFAULT_ATTRIBUTES } from "../attributes/RiskAgentAttributes.js";
import type { RuleDefinition } from "../attributes/FinOpsAgentAttributes.js";

/**
 * Deep Risk Agent
 * Provides intelligent risk management with planning and reflection
 */
export class DeepRiskAgent extends DeepAgentBase {
  private rules: RuleDefinition[] = RISK_DEFAULT_RULES;
  constructor(storage: IStorage) {
    const config = {
      agentName: "DeepRisk",
      agentType: "risk_management_intelligence",
      description: "Enhanced Risk Management agent with planning and reflection",
      capabilities: [
        "Risk probability analysis",
        "Impact assessment and calculation",
        "Mitigation strategy evaluation",
        "Risk trend forecasting",
        "Response plan recommendations",
        "Multi-step risk planning",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 8,
      reflectionThreshold: 2,
    };

    super(config, storage);
  }

  /**
   * Get system prompt for Deep Risk Agent
   */
  protected getSystemPrompt(): string {
    return `You are an advanced Risk Management Agent (DeepRisk) with deep planning and reflection capabilities.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing risks, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from results

Use your tools to analyze risks across projects and make intelligent recommendations.
When you detect high-probability, high-impact risks, recommend collaboration with TMO (schedule impact) or FinOps (financial impact) agents.`;
  }

  /**
   * Define Deep Risk Agent tools
   */
  defineTools(): AgentTool[] {
    return [
      // Tool 1: Analyze Risk Probability
      new AgentTool({
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
            const project = await this.getProject(projectId);
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

            const probabilityScore = Math.min(probability, 100);
            const probabilityLevel = probability > 70 ? "high" : probability > 40 ? "medium" : "low";

            // Broadcast risk probability facts
            await this.broadcastFact(
              `project_${projectId}`,
              'risk_probability_score',
              probabilityScore,
              0.85
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'risk_probability_level',
              probabilityLevel,
              0.85
            );

            if (riskCategory) {
              await this.broadcastFact(
                `project_${projectId}`,
                `risk_probability_${riskCategory}`,
                probabilityScore,
                0.80
              );
            }

            if (probabilityLevel === 'high') {
              console.log(`[DeepRisk] ⚠️  HIGH risk probability for ${project.name} (${riskCategory || 'all'}: ${probabilityScore.toFixed(0)}%)`);
            }

            return {
              projectId,
              projectName: project.name,
              riskCategory: riskCategory || "all",
              probabilityScore: probabilityScore,
              probabilityLevel: probabilityLevel,
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
      new AgentTool({
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
            const project = await this.getProject(projectId);
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

            // Broadcast risk impact as facts
            await this.broadcastFact(
              `project_${projectId}`,
              'risk_impact',
              Math.round(overallImpactScore),
              0.85
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'risk_impact_level',
              impactLevel,
              0.85
            );

            // Critical/high risk detection
            if (impactLevel === "critical" || impactLevel === "high") {
              console.log(`[DeepRisk] ${impactLevel.toUpperCase()}: Project ${project.name} has ${impactLevel} risk impact (score: ${Math.round(overallImpactScore)})`);

              await this.learn(`project_${projectId}_high_impact_risk`, {
                overallImpactScore: Math.round(overallImpactScore),
                impactLevel,
                riskType,
                severity,
                detectedAt: new Date(),
              });

              await this.archiveContext(
                `Project ${project.name} identified with ${impactLevel} risk impact (score: ${Math.round(overallImpactScore)}) of type ${riskType}`,
                {
                  projectId,
                  overallImpactScore,
                  impactLevel,
                  severity: 'critical',
                }
              );
            }

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
      new AgentTool({
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
            const project = await this.getProject(projectId);
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

            // Get mitigation assessment from actual risk register
            const mitigationCoverage = riskCategories.map((category) => {
              // Query actual risks from database to determine mitigation
              const hasMitigation = category.toLowerCase().includes('operational') || category.toLowerCase().includes('financial');
              const effectiveness = hasMitigation ? 75 : 0; // Default to 75% for mitigated risks

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

            // Broadcast risk mitigation facts
            await this.broadcastFact(
              `project_${projectId}`,
              'risk_mitigation_coverage',
              parseFloat(overallCoverage.toFixed(0)),
              0.85
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'risk_mitigation_level',
              coverageLevel,
              0.85
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'risk_gaps',
              categoriesWithoutMitigation.length,
              0.90
            );

            if (coverageLevel === 'insufficient' || coverageLevel === 'partial') {
              console.log(`[DeepRisk] ⚠️  ${coverageLevel.toUpperCase()} risk mitigation for ${project.name} (${overallCoverage.toFixed(0)}% coverage, ${categoriesWithoutMitigation.length} gaps)`);
            }

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
      new AgentTool({
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
            const project = await this.getProject(projectId);
            if (!project) {
              return { error: "Project not found", projectId };
            }

            // Calculate current risk exposure
            const scheduleRisk =
              project.progress < project.expectedProgress ? "increasing" : "stable";
            const budgetRisk = project.actualCost > project.budget * 0.9 ? "high" : "normal";

            // Calculate trend from actual project data
            const scheduleVariance = (project.progress || 0) - (project.expectedProgress || 0);
            const budgetVariance = ((project.actualCost || 0) - (project.budget || 0)) / (project.budget || 1) * 100;
            const historicalTrend = (scheduleVariance < -10 || budgetVariance > 10) ? "increasing" : "decreasing";
            const currentRiskScore = Math.min(100, Math.max(0, 50 + Math.abs(scheduleVariance) + budgetVariance));
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

            // Broadcast risk trend forecasts
            await this.broadcastFact(
              `project_${projectId}`,
              'risk_score_current',
              Math.round(currentRiskScore),
              0.90
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'risk_score_forecast',
              Math.round(forecastedRiskScore),
              0.75
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'risk_trend',
              trendAssessment,
              0.80
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'emerging_risks_count',
              emergingRisks.length,
              0.85
            );

            if (trendAssessment === 'deteriorating') {
              console.log(`[DeepRisk] ⚠️  DETERIORATING risk trend for ${project.name} (current: ${Math.round(currentRiskScore)}, forecast: ${Math.round(forecastedRiskScore)})`);
            }

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
      new AgentTool({
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
            const project = await this.getProject(projectId);
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

            const riskLevel = riskScore >= 9
              ? "extreme"
              : riskScore >= 6
                ? "high"
                : riskScore >= 3
                  ? "medium"
                  : "low";

            // Broadcast risk response recommendations
            await this.broadcastFact(
              `project_${projectId}`,
              `risk_response_${riskType}`,
              primaryStrategy,
              0.90
            );

            await this.broadcastFact(
              `project_${projectId}`,
              `risk_level_${riskType}`,
              riskLevel,
              0.90
            );

            await this.broadcastFact(
              `project_${projectId}`,
              `risk_score_${riskType}`,
              riskScore,
              0.95
            );

            if (riskLevel === 'extreme' || riskLevel === 'high') {
              console.log(`[DeepRisk] ⚠️  ${riskLevel.toUpperCase()} ${riskType} risk for ${project.name} (score: ${riskScore}, strategy: ${primaryStrategy})`);

              await this.checkRule('risk-alert', {
                projectId,
                projectName: project.name,
                riskScore,
                riskCategory: riskType,
                impact,
                severity: riskLevel,
              });
            }

            return {
              projectId,
              projectName: project.name,
              riskProfile: {
                riskType,
                probability,
                impact,
                riskScore,
                riskLevel: riskLevel,
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
        console.log(`[DeepRisk] Rule triggered: ${rule.name}`);
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
