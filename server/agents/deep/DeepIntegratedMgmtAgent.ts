/**
 * DEEP INTEGRATED MANAGEMENT AGENT
 *
 * Enhanced Integrated Management agent with Deep Agent capabilities
 * - Plans quality analysis approaches
 * - Reflects on testing recommendations
 * - Multi-step reasoning for release readiness
 */

import { AgentTool } from "../../lib/AgentTool.js";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";

export class DeepIntegratedMgmtAgent extends DeepAgentBase {
  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DeepIntegratedMgmt",
      agentType: "quality_intelligence",
      description: "Enhanced quality and testing agent with planning and reflection",
      capabilities: [
        "Quality gate monitoring",
        "Testing metrics analysis",
        "Defect trend tracking",
        "Technical debt assessment",
        "Release readiness evaluation",
        "Multi-step quality planning",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 8,
      reflectionThreshold: 2,
    };

    super(config, storage);
  }

  protected defineTools(): AgentTool[] {
    return [
      new AgentTool({
        name: "query_quality_metrics",
        description: "Query quality metrics for projects including status and milestone completion",
        schema: z.object({
          projectId: z.string().optional(),
          limit: z.number().default(50),
        }),
        func: async ({ projectId, limit }) => {
          try {
            let projects = await this.storage.getProjects();

            if (projectId) {
              projects = projects.filter(p => p.id === projectId);
            }

            const qualityData = [];

            for (const project of projects.slice(0, limit)) {
              const milestones = await this.storage.getMilestones(project.id);
              const completedMilestones = milestones.filter(m => m.status === 'completed').length;
              const totalMilestones = milestones.length;

              const predictability = parseInt(project.predictability || '0');

              const qualityStatus = predictability < 70 ? 'NEEDS_IMPROVEMENT' : predictability < 85 ? 'ACCEPTABLE' : 'EXCELLENT';

              qualityData.push({
                projectId: project.id,
                projectName: project.name,
                status: project.status,
                predictability: predictability + '%',
                milestoneCompletion: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) + '%' : 'N/A',
                qualityScore: predictability,
                qualityStatus,
              });

              // Broadcast quality metrics
              await this.broadcastFact(
                `project_${project.id}`,
                'quality_score',
                predictability,
                0.95
              );

              // If quality needs improvement, learn and archive
              if (qualityStatus === 'NEEDS_IMPROVEMENT') {
                await this.learn(`project_${project.id}_quality_low`, {
                  predictability,
                  qualityStatus,
                  detectedAt: new Date(),
                });

                await this.archiveContext(
                  `Project ${project.name} quality needs improvement: ${predictability}% predictability`,
                  {
                    projectId: project.id,
                    predictability,
                    severity: 'medium',
                  }
                );
              }
            }

            const needsImprovement = qualityData.filter(q => q.qualityStatus === 'NEEDS_IMPROVEMENT');

            return JSON.stringify({
              totalProjects: qualityData.length,
              needsImprovementCount: needsImprovement.length,
              qualityData: qualityData,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new AgentTool({
        name: "check_milestone_health",
        description: "Check milestone status and identify overdue or at-risk milestones",
        schema: z.object({
          projectId: z.string().optional(),
        }),
        func: async ({ projectId }) => {
          try {
            let projects = await this.storage.getProjects();

            if (projectId) {
              projects = projects.filter(p => p.id === projectId);
            }

            const milestoneIssues: any[] = [];

            for (const project of projects) {
              const milestones = await this.storage.getMilestones(project.id);

              for (const milestone of milestones) {
                if (!milestone.targetDate) continue;
                const targetDate = new Date(milestone.targetDate);
                const now = new Date();

                if (targetDate < now && milestone.status !== 'completed') {
                  const daysOverdue = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
                  const severity = daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'high' : 'medium';

                  milestoneIssues.push({
                    milestoneId: milestone.id,
                    milestoneName: milestone.name,
                    projectId: project.id,
                    projectName: project.name,
                    targetDate: milestone.targetDate,
                    status: milestone.status,
                    daysOverdue,
                    severity,
                  });

                  // Broadcast milestone health
                  await this.broadcastFact(
                    `milestone_${milestone.id}`,
                    'days_overdue',
                    daysOverdue,
                    0.95
                  );

                  // If critical, learn and archive
                  if (severity === 'critical') {
                    await this.learn(`milestone_${milestone.id}_critical_overdue`, {
                      daysOverdue,
                      projectId: project.id,
                      detectedAt: new Date(),
                    });

                    await this.archiveContext(
                      `Milestone ${milestone.name} in project ${project.name} is ${daysOverdue} days overdue`,
                      {
                        milestoneId: milestone.id,
                        daysOverdue,
                        severity: 'critical',
                      }
                    );
                  }
                }
              }
            }

            milestoneIssues.sort((a, b) => b.daysOverdue - a.daysOverdue);

            return JSON.stringify({
              overdueCount: milestoneIssues.length,
              milestoneIssues: milestoneIssues.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new AgentTool({
        name: "analyze_velocity_trends",
        description: "Analyze team velocity and predictability trends",
        schema: z.object({
          artId: z.string().optional().describe("Filter by ART"),
        }),
        func: async ({ artId }) => {
          try {
            let projects = await this.storage.getProjects();

            if (artId) {
              projects = projects.filter(p => p.artId === artId);
            }

            const velocityData = projects
              .filter(p => p.velocity || p.predictability)
              .map(p => {
                const velocity = parseInt(p.velocity || '0');
                const predictability = parseInt(p.predictability || '0');
                const flowEfficiency = parseInt(p.flowEfficiency || '0');
                const trend = predictability < 70 ? 'DECLINING' : 'STABLE';

                return {
                  projectId: p.id,
                  projectName: p.name,
                  velocity,
                  predictability,
                  flowEfficiency,
                  status: p.status,
                  trend,
                };
              });

            const declining = velocityData.filter(v => v.trend === 'DECLINING');

            // Broadcast velocity trends
            await this.broadcastFact(
              'portfolio_velocity',
              'declining_count',
              declining.length,
              0.90
            );

            // If many declining, learn and archive
            if (declining.length > 3) {
              await this.learn('portfolio_velocity_declining', {
                decliningCount: declining.length,
                detectedAt: new Date(),
              });

              await this.archiveContext(
                `Portfolio velocity declining: ${declining.length} projects with declining trend`,
                {
                  decliningCount: declining.length,
                  severity: 'medium',
                }
              );
            }

            return JSON.stringify({
              projectCount: velocityData.length,
              decliningCount: declining.length,
              velocityData: velocityData.slice(0, 30),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new AgentTool({
        name: "get_release_readiness",
        description: "Assess release readiness for projects nearing completion",
        schema: z.object({
          daysToRelease: z.number().default(30).describe("Check projects with end date within this many days"),
        }),
        func: async ({ daysToRelease }) => {
          try {
            const projects = await this.storage.getProjects();
            const now = new Date();
            const cutoffDate = new Date(now.getTime() + daysToRelease * 24 * 60 * 60 * 1000);

            const upcomingReleases = [];

            for (const project of projects) {
              const endDate = project.endDate ? new Date(project.endDate) : null;

              if (endDate && endDate <= cutoffDate && endDate >= now) {
                const milestones = await this.storage.getMilestones(project.id);
                const completedMilestones = milestones.filter(m => m.status === 'completed').length;
                const predictability = parseInt(project.predictability || '0');

                const readinessScore = Math.round(
                  (completedMilestones / Math.max(milestones.length, 1)) * 50 +
                  (predictability / 100) * 50
                );

                const readinessStatus = readinessScore < 50 ? 'NOT_READY' : readinessScore < 75 ? 'AT_RISK' : 'READY';
                const daysUntilRelease = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                upcomingReleases.push({
                  projectId: project.id,
                  projectName: project.name,
                  endDate: project.endDate,
                  daysUntilRelease,
                  milestoneCompletion: `${completedMilestones}/${milestones.length}`,
                  predictability: predictability + '%',
                  readinessScore,
                  readinessStatus,
                });

                // Broadcast release readiness
                await this.broadcastFact(
                  `project_${project.id}`,
                  'release_readiness',
                  readinessScore,
                  0.95
                );

                // If not ready and release is near, escalate
                if (readinessStatus === 'NOT_READY' && daysUntilRelease < 14) {
                  console.log(`[DeepIntegratedMgmt] CRITICAL: Project ${project.name} not ready for release in ${daysUntilRelease} days`);

                  await this.learn(`project_${project.id}_release_not_ready`, {
                    readinessScore,
                    daysUntilRelease,
                    detectedAt: new Date(),
                  });

                  await this.archiveContext(
                    `Project ${project.name} not ready for release in ${daysUntilRelease} days (readiness: ${readinessScore}%)`,
                    {
                      projectId: project.id,
                      readinessScore,
                      daysUntilRelease,
                      severity: 'critical',
                    }
                  );
                }
              }
            }

            upcomingReleases.sort((a, b) => a.daysUntilRelease - b.daysUntilRelease);

            return JSON.stringify({
              upcomingReleaseCount: upcomingReleases.length,
              releases: upcomingReleases.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  protected getSystemPrompt(): string {
    return `You are an advanced Integrated Management Agent (DeepIntegratedMgmt) with deep planning and reflection capabilities for quality and testing.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing quality, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from quality patterns

When analyzing quality and testing:
- Monitor quality gates and testing metrics
- Track defect trends and resolution
- Identify technical debt accumulation
- Ensure release readiness
- Recommend quality improvements

You have FULL AUTONOMY for:
- Test coverage recommendations
- Defect prioritization
- Quality gate adjustments (minor)

You must ESCALATE to human for:
- Release decisions
- Major quality gate failures
- Critical defect escalations

When detecting issues, output interventions in this format:
<INTERVENTION type="quality" severity="high">
Description of quality issue and recommended action
</INTERVENTION>

DECISION FRAMEWORK:
- Predictability <70% → Quality improvement needed
- Milestone >30 days overdue → Critical quality gate failure
- Release <14 days and not ready → Escalate immediately
- 3+ projects declining velocity → Process investigation needed

IMPORTANT: Only create interventions based on REAL DATA from the queries.
Never fabricate or simulate data. Query actual data first, then analyze.

You work within a multi-agent system. When issues span multiple domains (e.g., quality + schedule), recommend collaboration with other agents (Planning, TMO, PMO).

Always provide clear reasoning and data-driven insights.`;
  }
}
