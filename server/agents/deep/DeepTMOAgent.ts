/**
 * DEEP TMO AGENT
 *
 * Enhanced Technology Management Office agent with Deep Agent capabilities
 * - Plans schedule analysis approaches
 * - Reflects on timeline recommendations
 * - Multi-step reasoning for complex schedule scenarios
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";
import { TMO_DEFAULT_RULES, TMO_DEFAULT_ATTRIBUTES } from "../attributes/TMOAgentAttributes.js";
import type { RuleDefinition } from "../attributes/FinOpsAgentAttributes.js";

export class DeepTMOAgent extends DeepAgentBase {
  private rules: RuleDefinition[] = TMO_DEFAULT_RULES;
  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DeepTMO",
      agentType: "schedule_intelligence",
      description: "Enhanced schedule and timeline intelligence agent with planning and reflection",
      capabilities: [
        "Schedule variance analysis",
        "Critical path identification",
        "Resource bottleneck detection",
        "Timeline forecasting",
        "Dependency impact analysis",
        "Multi-step schedule planning",
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
        name: "analyze_schedule_variance",
        description: "Analyze schedule variance and identify delays. Returns detailed timeline comparison.",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
          threshold: z.number().optional().describe("Variance threshold in days (default 7)"),
        }),
        func: async ({ projectId, threshold = 7 }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          // Calculate schedule variance (mock - in production use actual dates)
          const progress = project.progress || 0;
          const expectedProgress = 50; // Mock baseline
          const varianceDays = ((expectedProgress - progress) / 100) * 90; // Assuming 90-day project
          const severity = Math.abs(varianceDays) > 14 ? 'critical' : Math.abs(varianceDays) > threshold ? 'warning' : 'normal';

          // Broadcast schedule variance as a fact
          await this.broadcastFact(
            `project_${projectId}`,
            'schedule_variance',
            varianceDays,
            0.90 // Good confidence from schedule data
          );

          await this.broadcastFact(
            `project_${projectId}`,
            'schedule_status',
            severity,
            0.90
          );

          // Critical delay detection
          if (Math.abs(varianceDays) > 14) {
            console.log(`[DeepTMO] CRITICAL: Project ${project.name} is ${Math.abs(varianceDays)} days behind schedule`);

            await this.learn(`project_${projectId}_schedule_delay`, {
              varianceDays: Math.abs(varianceDays),
              progress,
              expectedProgress,
              detectedAt: new Date(),
            });

            await this.archiveContext(
              `Project ${project.name} detected with ${Math.abs(varianceDays)} days schedule delay - critical threshold exceeded`,
              {
                projectId,
                varianceDays,
                severity: 'critical',
              }
            );
          }

          return {
            projectId,
            projectName: project.name,
            progress: progress,
            expectedProgress: expectedProgress,
            varianceDays: Math.round(varianceDays),
            status: Math.abs(varianceDays) > threshold ? 'delayed' : 'on_track',
            severity,
          };
        },
      }),

      new DynamicStructuredTool({
        name: "identify_critical_path",
        description: "Identify critical path and high-risk dependencies",
        schema: z.object({
          projectId: z.string().describe("Project ID"),
        }),
        func: async ({ projectId }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          // Mock critical path analysis
          const criticalTasks = [
            { task: "Infrastructure Setup", duration: 14, slack: 0, status: "in_progress" },
            { task: "Data Migration", duration: 21, slack: 0, status: "not_started" },
            { task: "Testing", duration: 10, slack: 0, status: "not_started" },
          ];

          const totalCriticalPathDays = criticalTasks.reduce((sum, t) => sum + t.duration, 0);

          return {
            projectId,
            projectName: project.name,
            criticalPath: criticalTasks,
            totalDuration: totalCriticalPathDays,
            riskyTasks: criticalTasks.filter(t => t.status === 'not_started'),
            recommendation: "Focus resources on critical path tasks to avoid delays",
          };
        },
      }),

      new DynamicStructuredTool({
        name: "detect_resource_bottlenecks",
        description: "Detect resource allocation bottlenecks affecting schedule",
        schema: z.object({
          projectId: z.string().describe("Project ID"),
        }),
        func: async ({ projectId }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          // Mock bottleneck detection
          const bottlenecks = [];

          if (project.progress < 30) {
            bottlenecks.push({
              type: "resource_shortage",
              resource: "Senior Developers",
              impact: "2 weeks delay",
              recommendation: "Allocate 2 additional senior developers",
            });
          }

          if (project.risks && project.risks.length > 3) {
            bottlenecks.push({
              type: "dependency_risk",
              resource: "External API Integration",
              impact: "1 week delay",
              recommendation: "Escalate vendor issue to management",
            });
          }

          return {
            projectId,
            projectName: project.name,
            bottlenecksDetected: bottlenecks.length,
            bottlenecks,
            overallImpact: bottlenecks.length > 0 ? `${bottlenecks.length} weeks potential delay` : "No bottlenecks",
          };
        },
      }),

      new DynamicStructuredTool({
        name: "forecast_completion_date",
        description: "Forecast project completion date based on current velocity",
        schema: z.object({
          projectId: z.string().describe("Project ID"),
        }),
        func: async ({ projectId }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          const progress = project.progress || 0;
          const remainingWork = 100 - progress;

          // Mock velocity calculation (5% per week)
          const velocity = 5;
          const weeksRemaining = remainingWork / velocity;
          const forecastDate = new Date();
          forecastDate.setDate(forecastDate.getDate() + (weeksRemaining * 7));

          // Mock baseline end date (3 months from now)
          const baselineEnd = new Date();
          baselineEnd.setMonth(baselineEnd.getMonth() + 3);

          const variance = (forecastDate.getTime() - baselineEnd.getTime()) / (1000 * 60 * 60 * 24);

          return {
            projectId,
            projectName: project.name,
            currentProgress: progress,
            velocity: `${velocity}% per week`,
            forecastCompletion: forecastDate.toISOString().split('T')[0],
            baselineCompletion: baselineEnd.toISOString().split('T')[0],
            varianceDays: Math.round(variance),
            onTrack: variance <= 7,
          };
        },
      }),

      new DynamicStructuredTool({
        name: "recommend_schedule_recovery",
        description: "Recommend actions to recover delayed schedule",
        schema: z.object({
          projectId: z.string().describe("Project ID"),
          delayDays: z.number().describe("Number of days behind schedule"),
        }),
        func: async ({ projectId, delayDays }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          const recommendations = [];

          if (delayDays > 14) {
            recommendations.push({
              priority: 'critical',
              action: 'Add parallel work streams',
              impact: 'Recover 7-10 days',
              cost: 'Medium',
            });
            recommendations.push({
              priority: 'high',
              action: 'Reduce scope of non-critical features',
              impact: 'Recover 5-7 days',
              cost: 'Low',
            });
          } else if (delayDays > 7) {
            recommendations.push({
              priority: 'medium',
              action: 'Increase resource allocation by 20%',
              impact: 'Recover 3-5 days',
              cost: 'Medium',
            });
          }

          recommendations.push({
            priority: 'medium',
            action: 'Optimize critical path tasks',
            impact: 'Recover 2-4 days',
            cost: 'Low',
          });

          return {
            projectId,
            projectName: project.name,
            delayDays,
            recommendations,
            estimatedRecovery: recommendations.reduce((sum, r) => {
              const impactMatch = r.impact.match(/(\d+)-?(\d+)?/);
              return sum + (impactMatch ? parseInt(impactMatch[1]) : 0);
            }, 0),
          };
        },
      }),
    ];
  }

  protected getSystemPrompt(): string {
    return `You are an advanced Technology Management Office (TMO) Agent with deep planning and reflection capabilities.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing schedules, create a multi-step plan
2. EXECUTE: Systematically analyze timeline, dependencies, and resources
3. REFLECT: Evaluate findings and learn from schedule patterns

When analyzing schedules:
- Identify critical path and high-risk tasks
- Detect resource bottlenecks early
- Forecast completion dates with confidence intervals
- Provide actionable recovery strategies
- Consider dependencies and external factors

You work within a multi-agent system. When schedule issues have financial or risk implications, recommend collaboration with:
- FinOps Agent (budget-schedule correlation)
- Risk Agent (schedule risk assessment)
- VRO Agent (value delivery timeline)

DECISION FRAMEWORK:
- Delay > 14 days → Critical, escalate immediately
- Delay > 7 days → High priority, implement recovery plan
- Resource bottleneck detected → Flag and recommend mitigation
- Critical path at risk → Proactive intervention required

Always provide data-driven insights with clear reasoning.`;
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
        console.log(`[DeepTMO] Rule triggered: ${rule.name}`);
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
