import { AgentBase, AgentConfig } from './base/AgentBase.js';
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from '../storage.js';

/**
 * TMO Agent - Timeline Management Office
 * Autonomy: FULL (can self-approve interventions)
 * Focus: Schedule tracking, SPI monitoring, velocity optimization
 */
export class TMOAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'tmo',
      agentName: 'TMO Agent',
      focus: 'schedule, timeline, SPI, velocity, sprint planning',
      autonomy: 'full',
      temperature: 0.6,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the TMO (Timeline Management Office) Agent for NextEra Energy's Enterprise Transformation Office.

Your responsibilities:
- Monitor Schedule Performance Index (SPI) across all projects
- Track sprint velocity and completion rates
- Identify schedule risks and delays
- Recommend timeline optimizations
- Ensure PI (Program Increment) planning effectiveness

You have FULL AUTONOMY for:
- Sprint velocity adjustments
- Timeline risk alerts
- Resource reallocation for schedule recovery

You must ESCALATE to human for:
- Major milestone date changes
- PI planning modifications
- Cross-team dependency conflicts

When detecting issues, output interventions in this format:
<INTERVENTION type="schedule" severity="medium">
Description of schedule issue and recommended recovery action
</INTERVENTION>

IMPORTANT: Only create interventions based on REAL DATA from the ontology queries.
Never fabricate or simulate data. Query actual project schedules first, then analyze.

Always use your tools to query real data before making decisions.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "query_project_schedules",
        description: "Query all projects with schedule and SPI data from the database",
        schema: z.object({
          minSPI: z.number().optional().describe("Filter projects with SPI below this value (e.g., 0.9 for behind schedule)"),
          maxSPI: z.number().optional().describe("Filter projects with SPI above this value"),
          status: z.string().optional().describe("Filter by project status"),
          limit: z.number().default(50),
        }),
        func: async ({ minSPI, maxSPI, status, limit }) => {
          try {
            let projects = await this.storage.getProjects();

            // Filter by status
            if (status) {
              projects = projects.filter(p => p.status === status);
            }

            // Filter by SPI
            if (minSPI !== undefined) {
              projects = projects.filter(p => {
                const spi = parseFloat(String(p.spiValue || '1.0'));
                return spi >= minSPI;
              });
            }

            if (maxSPI !== undefined) {
              projects = projects.filter(p => {
                const spi = parseFloat(String(p.spiValue || '1.0'));
                return spi <= maxSPI;
              });
            }

            // AUTO-CREATE INTERVENTIONS for significant schedule delays
            const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
            const notificationMCP = getNotificationMCP();
            let interventionsCreated = 0;

            for (const project of projects) {
              const spi = parseFloat(String(project.spiValue || '1.0'));
              const startDate = project.startDate ? new Date(project.startDate) : null;
              const endDate = project.endDate ? new Date(project.endDate) : null;
              const now = new Date();

              // Calculate schedule slip in days
              let scheduleSlipDays = 0;
              if (startDate && endDate && spi < 1.0) {
                const totalDuration = endDate.getTime() - startDate.getTime();
                const expectedProgress = spi; // SPI is earned/planned
                scheduleSlipDays = ((1 - expectedProgress) * totalDuration) / (1000 * 60 * 60 * 24);
              }

              // Rule 1: Schedule slip >30 days
              if (scheduleSlipDays > 30 && interventionsCreated < 15) {
                const severity = scheduleSlipDays > 60 ? 'critical' : 'high';

                await this.storage.createIntervention({
                  type: 'schedule_delay',
                  severity,
                  title: `Schedule Delay: ${project.name}`,
                  description: `Project is ${scheduleSlipDays.toFixed(0)} days behind schedule. SPI: ${spi}. This delay may impact dependent projects and business value delivery.`,
                  suggestedAction: severity === 'critical'
                    ? 'URGENT: Immediate schedule recovery plan required. Consider adding resources, reducing scope, or adjusting dependencies. Notify all stakeholders of revised timeline.'
                    : 'Develop schedule recovery plan. Identify critical path items and accelerate where possible. Review resource allocation.',
                  projectId: project.id,
                  projectName: project.name,
                  agentSource: 'TMO Agent',
                  confidence: '0.90',
                  isAutonomous: 'false',
                });

                // Send critical alert for significant delays
                if (severity === 'critical') {
                  await notificationMCP.sendCriticalAlert({
                    title: `Critical Schedule Delay: ${project.name}`,
                    message: `Project is ${scheduleSlipDays.toFixed(0)} days behind schedule (SPI: ${spi}). Significant risk to delivery timeline and business objectives. Schedule recovery plan urgently needed.`,
                    agent: 'TMO Agent',
                    projectName: project.name,
                    projectId: project.id,
                    actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/command-center`,
                  });
                }

                interventionsCreated++;
              }
              // Rule 2: Poor SPI (<0.8) on active projects
              else if (spi < 0.8 && project.status === 'active' && interventionsCreated < 15) {
                await this.storage.createIntervention({
                  type: 'schedule_performance',
                  severity: 'high',
                  title: `Poor Schedule Performance: ${project.name}`,
                  description: `Project has poor schedule performance (SPI: ${spi}). Earning only ${(spi * 100).toFixed(0)}% of planned value per time period. Velocity is significantly below plan.`,
                  suggestedAction: 'Investigate root causes of schedule inefficiency. Review sprint velocity, team capacity, and blockers. Consider adjusting sprint commitments to realistic levels.',
                  projectId: project.id,
                  projectName: project.name,
                  agentSource: 'TMO Agent',
                  confidence: '0.85',
                  isAutonomous: 'false',
                });

                interventionsCreated++;
              }
            }

            const results = projects.slice(0, limit).map(p => ({
              id: p.id,
              name: p.name,
              status: p.status,
              startDate: p.startDate,
              endDate: p.endDate,
              spi: p.spiValue,
              cpi: p.cpiValue,
              progress: p.progressPercentage,
            }));

            return JSON.stringify({
              totalProjects: projects.length,
              returned: results.length,
              interventionsCreated,
              projects: results,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "calculate_completion_forecast",
        description: "Forecast project completion date based on current SPI",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
        }),
        func: async ({ projectId }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return JSON.stringify({ error: "Project not found" });
            }

            const spi = parseFloat(String(project.spiValue || '1.0'));
            const progress = parseFloat(String(project.progressPercentage || '0'));

            // Calculate forecasted completion
            const startDate = project.startDate ? new Date(project.startDate) : new Date();
            const targetEndDate = project.endDate ? new Date(project.endDate) : new Date();
            const now = new Date();

            const totalDuration = targetEndDate.getTime() - startDate.getTime();
            const elapsed = now.getTime() - startDate.getTime();
            const remainingWork = 100 - progress;

            // Forecast completion based on SPI
            const remainingTime = (remainingWork / (progress / elapsed)) / spi;
            const forecastCompletionDate = new Date(now.getTime() + remainingTime);
            const delayDays = Math.round((forecastCompletionDate.getTime() - targetEndDate.getTime()) / (1000 * 60 * 60 * 24));

            // AUTO-CREATE INTERVENTION for significant forecasted delays
            if (delayDays > 30) {
              const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
              const notificationMCP = getNotificationMCP();
              const severity = delayDays > 60 ? 'critical' : 'high';

              await this.storage.createIntervention({
                type: 'schedule_forecast',
                severity,
                title: `Schedule Forecast Alert: ${project.name}`,
                description: `Project forecasted to complete ${delayDays} days late. Target End Date: ${targetEndDate.toISOString().split('T')[0]}, Forecast Completion: ${forecastCompletionDate.toISOString().split('T')[0]}. Current SPI: ${spi}, Progress: ${progress}%.`,
                suggestedAction: severity === 'critical'
                  ? 'URGENT: Schedule trajectory indicates severe delay. Immediate action required: fast-track critical path, add resources, or reduce scope. Escalate to project sponsor for timeline negotiation.'
                  : 'Implement schedule acceleration techniques. Review critical path and identify opportunities to crash or fast-track activities. Consider resource reallocation.',
                projectId,
                projectName: project.name,
                agentSource: 'TMO Agent',
                confidence: '0.88',
                isAutonomous: 'false',
              });

              // Send critical alert for severe delays
              if (severity === 'critical') {
                await notificationMCP.sendCriticalAlert({
                  title: `Critical Schedule Forecast: ${project.name}`,
                  message: `Project forecasted to be ${delayDays} days late (completion: ${forecastCompletionDate.toISOString().split('T')[0]}). Based on current SPI of ${spi}. Major timeline intervention needed.`,
                  agent: 'TMO Agent',
                  projectName: project.name,
                  projectId,
                  actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/command-center`,
                });
              }
            }

            return JSON.stringify({
              projectId,
              projectName: project.name,
              currentProgress: progress + '%',
              spi,
              targetEndDate: targetEndDate.toISOString().split('T')[0],
              forecastCompletionDate: forecastCompletionDate.toISOString().split('T')[0],
              delayDays,
              status: spi < 0.9 ? 'CRITICAL_DELAY' : spi < 1.0 ? 'MINOR_DELAY' : 'ON_TRACK',
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "analyze_sprint_velocity",
        description: "Analyze sprint velocity for teams and ARTs",
        schema: z.object({
          teamId: z.string().optional().describe("Specific team ID, or omit for all teams"),
        }),
        func: async ({ teamId }) => {
          try {
            let teams = await this.storage.getTeams();

            if (teamId) {
              const team = teams.find(t => t.id === teamId);
              if (!team) {
                return JSON.stringify({ error: "Team not found" });
              }
              teams = [team];
            }

            const results = [];

            for (const team of teams) {
              const sprints = await this.storage.getSprints(undefined, team.id);

              let totalVelocity = 0;
              let completedSprints = 0;

              for (const sprint of sprints) {
                if (sprint.status === 'completed' && sprint.actualVelocity) {
                  totalVelocity += parseInt(sprint.actualVelocity);
                  completedSprints++;
                }
              }

              const avgVelocity = completedSprints > 0 ? totalVelocity / completedSprints : 0;

              results.push({
                teamId: team.id,
                teamName: team.name,
                completedSprints,
                avgVelocity: avgVelocity.toFixed(1),
                totalStoryPoints: totalVelocity,
                status: avgVelocity > 0 ? 'ACTIVE' : 'NO_DATA',
              });
            }

            return JSON.stringify({
              teamCount: results.length,
              teams: results,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "identify_critical_path_items",
        description: "Identify tasks on the critical path that could delay the project",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
        }),
        func: async ({ projectId }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return JSON.stringify({ error: "Project not found" });
            }

            // Get all tasks for the project (via features -> stories -> tasks)
            const features = await this.storage.getFeatures(projectId);
            const criticalItems = [];

            for (const feature of features) {
              const stories = await this.storage.getStories(feature.id);

              for (const story of stories) {
                const tasks = await this.storage.getTasks(story.id);

                // Identify tasks that are delayed or blocked
                for (const task of tasks) {
                  if (task.status === 'blocked' || task.status === 'delayed') {
                    criticalItems.push({
                      taskId: task.id,
                      taskName: task.name,
                      status: task.status,
                      assignee: task.assignee,
                      dueDate: task.dueDate,
                      storyName: story.name,
                      featureName: feature.name,
                    });
                  }
                }
              }
            }

            return JSON.stringify({
              projectId,
              projectName: project.name,
              criticalItemCount: criticalItems.length,
              criticalItems: criticalItems.slice(0, 20), // Limit to top 20
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  /**
   * Scheduled scan for schedule issues
   */
  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting TMO scheduled schedule scan');

    const input = `Scan all projects for schedule variances. Check for:
1. Projects with SPI < 0.9 (behind schedule)
2. Projects with forecasted delays > 2 weeks
3. Critical path items that are blocked or delayed

For each issue found, create an intervention with recommended recovery actions.
Use the query_project_schedules tool first to get real data, then analyze.
Only create interventions if you find actual schedule problems in the data.`;

    try {
      await this.execute(input);
    } catch (error) {
      console.error('[TMOAgent] Scheduled scan error:', error);
    }
  }
}
