/**
 * DEEP PLANNING AGENT
 *
 * Enhanced Planning agent with Deep Agent capabilities
 * - Plans dependency analysis approaches
 * - Reflects on roadmap recommendations
 * - Multi-step reasoning for capacity planning
 */

import { AgentTool } from "../../lib/AgentTool.js";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";

export class DeepPlanningAgent extends DeepAgentBase {
  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DeepPlanning",
      agentType: "planning_intelligence",
      description: "Enhanced planning and dependency agent with reflection and multi-step reasoning",
      capabilities: [
        "Dependency analysis and tracking",
        "Resource capacity planning",
        "Roadmap conflict detection",
        "Cross-team coordination",
        "Blocked work item management",
        "Multi-step planning optimization",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 10,
      reflectionThreshold: 3,
    };

    super(config, storage);
  }

  protected defineTools(): AgentTool[] {
    return [
      new AgentTool({
        name: "analyze_dependencies",
        description: "Analyze project dependencies for conflicts and blockers",
        schema: z.object({
          projectId: z.string().optional().describe("Specific project, or omit for all"),
          limit: z.number().default(50),
        }),
        func: async ({ projectId, limit }) => {
          try {
            const projects = await this.storage.getProjects();
            let allDependencies: any[] = [];

            const targetProjects = projectId ? projects.filter(p => p.id === projectId) : projects;

            for (const proj of targetProjects) {
              const deps = await this.storage.getDependencies(proj.id);
              allDependencies = allDependencies.concat(deps);
            }

            const blocked = allDependencies.filter(d => d.status === 'blocked');
            const atRisk = allDependencies.filter(d => d.status === 'at_risk' || d.status === 'amber');

            const results = allDependencies.slice(0, limit).map(d => ({
              id: d.id,
              projectId: d.projectId,
              name: d.name,
              type: d.dependencyType,
              status: d.status,
              targetProjectId: d.targetProjectId,
              impactIfDelayed: d.impactIfDelayed,
            }));

            // Broadcast dependency facts
            await this.broadcastFact(
              'portfolio_dependencies',
              'blocked_count',
              blocked.length,
              0.95
            );

            await this.broadcastFact(
              'portfolio_dependencies',
              'at_risk_count',
              atRisk.length,
              0.95
            );

            // If critical dependency issues, learn and archive
            if (blocked.length > 5) {
              console.log(`[DeepPlanning] CRITICAL: ${blocked.length} blocked dependencies`);

              await this.learn('dependencies_blocked_critical', {
                blockedCount: blocked.length,
                atRiskCount: atRisk.length,
                detectedAt: new Date(),
              });

              await this.checkRule('dependency-alert', {
                projectId: 'portfolio',
                alignmentScore: 40,
                strategicGoals: ['dependency_resolution'],
                blockedCount: blocked.length,
                atRiskCount: atRisk.length,
                severity: 'critical',
              });

              await this.archiveContext(
                `Critical dependency situation: ${blocked.length} blocked, ${atRisk.length} at risk`,
                {
                  blocked: blocked.length,
                  atRisk: atRisk.length,
                  severity: 'critical',
                }
              );
            }

            return JSON.stringify({
              totalDependencies: allDependencies.length,
              blockedCount: blocked.length,
              atRiskCount: atRisk.length,
              dependencies: results,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new AgentTool({
        name: "check_resource_capacity",
        description: "Check resource allocation and capacity across teams",
        schema: z.object({
          teamId: z.string().optional().describe("Specific team, or omit for all"),
        }),
        func: async ({ teamId }) => {
          try {
            let teams = await this.storage.getTeams();

            if (teamId) {
              teams = teams.filter(t => t.id === teamId);
            }

            const capacityIssues = [];

            for (const team of teams) {
              const capacity = parseInt(team.capacity || '0');
              const velocity = parseInt(team.velocity || '0');
              const utilization = capacity > 0 ? (velocity / capacity) * 100 : 0;

              if (utilization > 100) {
                capacityIssues.push({
                  teamId: team.id,
                  teamName: team.name,
                  capacity,
                  velocity,
                  utilization: utilization.toFixed(1) + '%',
                  status: 'OVER_CAPACITY',
                  memberCount: team.memberCount,
                });

                // Broadcast capacity facts
                await this.broadcastFact(
                  `team_${team.id}`,
                  'capacity_utilization',
                  utilization,
                  0.95
                );

                // Learn about over-capacity teams
                await this.learn(`team_${team.id}_over_capacity`, {
                  utilization,
                  capacity,
                  velocity,
                  detectedAt: new Date(),
                });

                await this.archiveContext(
                  `Team ${team.name} is at ${utilization.toFixed(1)}% capacity (over capacity)`,
                  {
                    teamId: team.id,
                    utilization,
                    severity: 'critical',
                  }
                );
              } else if (utilization > 85) {
                capacityIssues.push({
                  teamId: team.id,
                  teamName: team.name,
                  capacity,
                  velocity,
                  utilization: utilization.toFixed(1) + '%',
                  status: 'AT_RISK',
                  memberCount: team.memberCount,
                });

                // Broadcast capacity facts
                await this.broadcastFact(
                  `team_${team.id}`,
                  'capacity_utilization',
                  utilization,
                  0.90
                );
              }
            }

            return JSON.stringify({
              totalTeams: teams.length,
              capacityIssues: capacityIssues.length,
              issues: capacityIssues,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new AgentTool({
        name: "identify_roadmap_conflicts",
        description: "Identify scheduling conflicts and roadmap alignment issues",
        schema: z.object({
          portfolioId: z.string().optional(),
        }),
        func: async ({ portfolioId }) => {
          try {
            let projects = await this.storage.getProjects();

            if (portfolioId) {
              projects = projects.filter(p => p.portfolioId === portfolioId);
            }

            const conflicts = [];

            for (const project of projects) {
              const endDate = project.endDate ? new Date(project.endDate) : null;
              const now = new Date();

              if (endDate && endDate < now && project.status !== 'green') {
                const daysOverdue = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

                conflicts.push({
                  projectId: project.id,
                  projectName: project.name,
                  endDate: project.endDate,
                  status: project.status,
                  issue: 'Past due date with non-green status',
                  daysOverdue,
                });

                // Broadcast roadmap conflict
                await this.broadcastFact(
                  `project_${project.id}`,
                  'roadmap_overdue',
                  daysOverdue,
                  0.95
                );

                // If significantly overdue, learn and archive
                if (daysOverdue > 14) {
                  await this.learn(`project_${project.id}_roadmap_overdue`, {
                    daysOverdue,
                    status: project.status,
                    detectedAt: new Date(),
                  });

                  await this.archiveContext(
                    `Project ${project.name} is ${daysOverdue} days overdue with ${project.status} status`,
                    {
                      projectId: project.id,
                      daysOverdue,
                      severity: 'high',
                    }
                  );
                }
              }
            }

            const projectsByART = new Map<string, typeof projects>();
            for (const p of projects) {
              if (p.artId) {
                if (!projectsByART.has(p.artId)) {
                  projectsByART.set(p.artId, []);
                }
                projectsByART.get(p.artId)!.push(p);
              }
            }

            for (const [artId, artProjects] of Array.from(projectsByART.entries())) {
              const redCount = artProjects.filter((p: any) => p.status === 'red').length;
              if (redCount >= 2) {
                conflicts.push({
                  artId,
                  issue: `ART has ${redCount} projects in red status`,
                  projectNames: artProjects.filter((p: any) => p.status === 'red').map((p: any) => p.name),
                });

                // Broadcast ART health issue
                await this.broadcastFact(
                  `art_${artId}`,
                  'red_projects_count',
                  redCount,
                  0.95
                );
              }
            }

            return JSON.stringify({
              conflictCount: conflicts.length,
              conflicts: conflicts.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new AgentTool({
        name: "get_blocked_work_items",
        description: "Get work items that are blocked and need attention",
        schema: z.object({
          projectId: z.string().optional(),
          limit: z.number().default(30),
        }),
        func: async ({ projectId, limit }) => {
          try {
            let tasks = await this.storage.getTasks();

            if (projectId) {
              const stories = await this.storage.getStoriesByProject(projectId);
              const storyIds = stories.map(s => s.id);
              tasks = tasks.filter(t => storyIds.includes(t.storyId));
            }

            const blocked = tasks
              .filter(t => t.status === 'blocked')
              .slice(0, limit)
              .map(t => ({
                id: t.id,
                name: t.name,
                status: t.status,
                storyId: t.storyId,
                assignee: t.assignee,
                blockedDays: Math.floor((Date.now() - new Date(t.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
              }));

            // Broadcast blocked work items
            await this.broadcastFact(
              'portfolio_blocked_work',
              'blocked_count',
              blocked.length,
              0.95
            );

            // If significant backlog, learn and archive
            if (blocked.length > 10) {
              await this.learn('blocked_work_items_high', {
                blockedCount: blocked.length,
                detectedAt: new Date(),
              });

              await this.archiveContext(
                `High number of blocked work items: ${blocked.length} tasks blocked`,
                {
                  blockedCount: blocked.length,
                  severity: 'high',
                }
              );
            }

            return JSON.stringify({
              blockedCount: blocked.length,
              blockedItems: blocked,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  protected getSystemPrompt(): string {
    return `You are an advanced Planning and Dependency Agent (DeepPlanning) with deep planning and reflection capabilities.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing dependencies, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from planning patterns

When analyzing planning and dependencies:
- Identify and track project dependencies
- Monitor capacity and resource allocation
- Detect roadmap conflicts and scheduling issues
- Recommend priority adjustments
- Escalate cross-team dependency blockers

You have SUPERVISED AUTONOMY:
- All interventions require human approval before execution
- You can recommend actions but cannot execute them autonomously

When detecting issues, output interventions in this format:
<INTERVENTION type="dependency" severity="high">
Description of planning issue and recommended resolution
</INTERVENTION>

DECISION FRAMEWORK:
- 5+ blocked dependencies → Critical cross-project issue
- Team >100% capacity → Resource reallocation needed
- Project >14 days overdue → Escalate for roadmap review
- 10+ blocked work items → Process bottleneck investigation

IMPORTANT: Only create interventions based on REAL DATA from the queries.
Never fabricate or simulate data. Query actual project data first, then analyze.

You work within a multi-agent system. When issues span multiple domains (e.g., dependencies + budget), recommend collaboration with other agents (FinOps, Risk, TMO).

Always provide clear reasoning and data-driven insights.`;
  }
}
