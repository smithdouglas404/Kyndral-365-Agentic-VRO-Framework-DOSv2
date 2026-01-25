/**
 * DEEP FINOPS AGENT
 *
 * Enhanced FinOps agent with Deep Agent capabilities
 * - Plans budget analysis approaches
 * - Reflects on financial recommendations
 * - Multi-step reasoning for complex scenarios
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";
import { FINOPS_DEFAULT_RULES, FINOPS_DEFAULT_ATTRIBUTES } from "../attributes/FinOpsAgentAttributes.js";
import type { RuleDefinition } from "../attributes/FinOpsAgentAttributes.js";

export class DeepFinOpsAgent extends DeepAgentBase {
  private rules: RuleDefinition[] = FINOPS_DEFAULT_RULES;
  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DeepFinOps",
      agentType: "financial_intelligence",
      description: "Enhanced financial intelligence agent with planning and reflection",
      capabilities: [
        "Budget variance analysis",
        "Cost forecasting",
        "ROI optimization",
        "EVM calculations",
        "Financial risk assessment",
        "Multi-step financial planning",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 8,
      reflectionThreshold: 2,
    };

    super(config, storage);
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "analyze_budget_variance",
        description: "Analyze budget variance for a project. Returns detailed budget vs actual comparison.",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          threshold: z.number().optional().describe("Variance threshold percentage (default 10%)"),
        }),
        func: async ({ projectId, threshold = 10 }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          const budget = parseFloat(project.budget || '0');
          const actualCost = parseFloat(project.actualCost || '0');
          const variance = budget > 0 ? ((actualCost - budget) / budget) * 100 : 0;
          const isOverBudget = variance > threshold;
          const severity = variance > 20 ? 'critical' : variance > threshold ? 'warning' : 'normal';

          // Broadcast budget variance fact to other agents
          await this.broadcastFact(
            `project_${projectId}`,
            'budget_variance',
            variance,
            0.95 // High confidence - based on actual data
          );

          await this.broadcastFact(
            `project_${projectId}`,
            'budget_status',
            severity,
            0.95
          );

          // If critical, archive context and learn pattern
          if (variance > 20) {
            console.log(`[DeepFinOps] CRITICAL: Project ${project.name} is ${variance.toFixed(1)}% over budget`);

            await this.learn(`project_${projectId}_budget_overrun`, {
              variance,
              budget,
              actualCost,
              detectedAt: new Date(),
            });

            await this.archiveContext(
              `Project ${project.name} detected with ${variance.toFixed(1)}% budget overrun (critical threshold exceeded)`,
              {
                projectId,
                variance,
                severity: 'critical',
              }
            );
          }

          return {
            projectId,
            projectName: project.name,
            budget: budget.toString(),
            actualCost: actualCost.toString(),
            variance: variance.toFixed(2),
            percentage: `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`,
            status: isOverBudget ? 'over_budget' : 'within_budget',
            severity,
          };
        },
      }),

      new DynamicStructuredTool({
        name: "calculate_evm_metrics",
        description: "Calculate Earned Value Management metrics (CPI, SPI, EAC, ETC)",
        schema: z.object({
          projectId: z.string().describe("Project ID"),
        }),
        func: async ({ projectId }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          const progress = project.progress || 0;
          const budget = parseFloat(project.budget || '0');
          const actualCost = parseFloat(project.actualCost || '0');

          // Validate inputs to prevent division by zero
          if (actualCost <= 0) {
            return {
              error: "Cannot calculate EVM metrics - no costs incurred yet",
              projectId,
              projectName: project.name,
              earnedValue: '0.00',
              cpi: '1.000',
              spi: '1.000',
              eac: budget.toFixed(2),
              etc: budget.toFixed(2),
              health: 'unknown',
            };
          }

          const earnedValue = (progress / 100) * budget;
          const cpi = earnedValue / actualCost;
          const plannedValue = budget * (progress / 100);
          const spi = plannedValue > 0 ? earnedValue / plannedValue : 1.0;

          // Prevent division by zero for EAC calculation
          const eac = cpi > 0 ? budget / cpi : budget;
          const etc = eac - actualCost;

          // Broadcast EVM metrics as facts
          await this.broadcastFact(
            `project_${projectId}`,
            'cpi',
            cpi,
            0.95
          );

          await this.broadcastFact(
            `project_${projectId}`,
            'spi',
            spi,
            0.95
          );

          // Critical performance issue detection
          if (cpi < 0.8) {
            console.log(`[DeepFinOps] CRITICAL: Project ${project.name} has CPI of ${cpi.toFixed(3)} (significant cost overrun)`);

            await this.learn(`project_${projectId}_cpi_critical`, {
              cpi,
              earnedValue,
              actualCost,
              detectedAt: new Date(),
            });

            await this.archiveContext(
              `Project ${project.name} CPI dropped to ${cpi.toFixed(3)} - critical cost performance issue`,
              {
                projectId,
                cpi,
                severity: 'critical',
              }
            );
          }

          if (spi < 0.8) {
            console.log(`[DeepFinOps] CRITICAL: Project ${project.name} has SPI of ${spi.toFixed(3)} (significant schedule delay)`);

            await this.learn(`project_${projectId}_spi_critical`, {
              spi,
              earnedValue,
              plannedValue,
              detectedAt: new Date(),
            });
          }

          return {
            projectId,
            projectName: project.name,
            earnedValue: earnedValue.toFixed(2),
            cpi: cpi.toFixed(3),
            spi: spi.toFixed(3),
            eac: eac.toFixed(2),
            etc: etc.toFixed(2),
            health: cpi >= 0.95 && spi >= 0.95 ? 'good' : cpi < 0.85 || spi < 0.85 ? 'critical' : 'warning',
          };
        },
      }),

      new DynamicStructuredTool({
        name: "forecast_burn_rate",
        description: "Forecast budget burn rate and estimate runway",
        schema: z.object({
          projectId: z.string().describe("Project ID"),
          timeframeDays: z.number().optional().describe("Forecast timeframe in days (default 30)"),
        }),
        func: async ({ projectId, timeframeDays = 30 }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          // Simple burn rate calculation (in production, use historical data)
          const budget = parseFloat(project.budget || '0');
          const actualCost = parseFloat(project.actualCost || '0');
          const progress = project.progress || 0;

          // Assume linear burn for simplicity
          const elapsedDays = 30; // Mock - would calculate from start date
          const dailyBurnRate = elapsedDays > 0 ? actualCost / elapsedDays : 0;
          const projectedCost = actualCost + (dailyBurnRate * timeframeDays);
          const remaining = budget - actualCost;

          // Prevent division by zero for runway calculation
          const runway = dailyBurnRate > 0 ? remaining / dailyBurnRate : Infinity;
          const runwayDays = runway === Infinity ? 999999 : Math.floor(runway);

          return {
            projectId,
            projectName: project.name,
            currentBurn: dailyBurnRate.toFixed(2),
            projectedCost: projectedCost.toFixed(2),
            remaining: remaining.toFixed(2),
            runwayDays: runwayDays > 999999 ? 'Infinite (no burn)' : runwayDays,
            alert: projectedCost > budget ? 'Budget overrun projected' : 'On track',
          };
        },
      }),

      new DynamicStructuredTool({
        name: "recommend_cost_optimization",
        description: "Analyze project and recommend cost optimization strategies",
        schema: z.object({
          projectId: z.string().describe("Project ID"),
        }),
        func: async ({ projectId }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          const recommendations = [];

          // Check budget variance
          const budget = parseFloat(project.budget || '0');
          const actualCost = parseFloat(project.actualCost || '0');
          const variance = budget > 0 ? ((actualCost - budget) / budget) * 100 : 0;
          if (variance > 10) {
            recommendations.push({
              priority: 'high',
              category: 'budget_control',
              recommendation: 'Implement stricter budget controls and approval workflows',
              estimatedSavings: (variance * 0.3).toFixed(1) + '%',
            });
          }

          // Check progress vs spend
          const progress = project.progress || 0;
          const spendRatio = budget > 0 ? (actualCost / budget) * 100 : 0;
          if (spendRatio > progress + 15) {
            recommendations.push({
              priority: 'high',
              category: 'efficiency',
              recommendation: 'Review resource utilization - spending outpacing progress',
              estimatedSavings: '15-20%',
            });
          }

          // Generic recommendations
          recommendations.push({
            priority: 'medium',
            category: 'optimization',
            recommendation: 'Conduct regular cost reviews with stakeholders',
            estimatedSavings: '5-10%',
          });

          return {
            projectId,
            projectName: project.name,
            totalRecommendations: recommendations.length,
            recommendations,
          };
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
        console.log(`[DeepFinOps] Rule triggered: ${rule.name}`);
        results.push({
          rule,
          triggered: true,
          actions: rule.actions,
        });
      }
    }

    return results;
  }

  protected getSystemPrompt(): string {
    return `You are an advanced Financial Intelligence Agent (DeepFinOps) with deep planning and reflection capabilities.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from results

When analyzing financial data:
- Consider multiple perspectives (budget, timeline, resources)
- Identify patterns and trends
- Provide actionable recommendations
- Flag risks early
- Suggest optimization strategies

You work within a multi-agent system. When issues span multiple domains (e.g., budget + schedule), recommend collaboration with other agents (TMO, Risk, etc.).

DECISION FRAMEWORK:
- CPI < 0.85 or SPI < 0.85 → Critical risk, recommend immediate action
- Budget variance > 15% → High priority, escalate to stakeholders
- Burn rate exceeds runway → Project risk, recommend reforecasting

Always provide clear reasoning and data-driven insights.`;
  }
}
