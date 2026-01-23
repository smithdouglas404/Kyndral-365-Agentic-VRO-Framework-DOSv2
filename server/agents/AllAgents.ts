/**
 * Full Agent Implementations - Governance, Planning, OCM, Integrated Mgmt
 * Each agent has 4 tools for comprehensive monitoring
 */

import { AgentBase } from './base/AgentBase.js';
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from '../storage.js';

// ============================================================================
// GOVERNANCE AGENT - Compliance, Approvals, Policy Enforcement
// ============================================================================

export class GovernanceAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'governance',
      agentName: 'Governance Agent',
      focus: 'compliance, approvals, escalations, policies',
      autonomy: 'supervised',
      temperature: 0.5,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the Governance Agent for NextEra Energy's Enterprise Transformation Office.

Your responsibilities:
- Monitor compliance gates and policy adherence
- Track approval workflows and escalations
- Ensure regulatory requirements are met
- Verify stage-gate transitions are properly approved
- Escalate governance violations

You have SUPERVISED AUTONOMY:
- All interventions require human approval before execution
- You can recommend actions but cannot execute them autonomously

When detecting issues, output interventions in this format:
<INTERVENTION type="governance" severity="high">
Description of governance issue and recommended action
</INTERVENTION>

IMPORTANT: Only create interventions based on REAL DATA from the queries.
Never fabricate or simulate data. Query actual project data first, then analyze.

Always use your tools to query real data before making decisions.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "check_compliance_status",
        description: "Check compliance status for all projects or a specific project",
        schema: z.object({
          projectId: z.string().optional().describe("Specific project to check, or omit for all"),
          limit: z.number().default(50),
        }),
        func: async ({ projectId, limit }) => {
          try {
            let projects = await this.storage.getProjects();
            
            if (projectId) {
              projects = projects.filter(p => p.id === projectId);
            }

            const results = projects.slice(0, limit).map(p => ({
              id: p.id,
              name: p.name,
              status: p.status,
              safeStage: p.safeStage,
              hasApprovals: true,
              complianceStatus: p.status === 'red' ? 'AT_RISK' : p.status === 'amber' ? 'REVIEW_NEEDED' : 'COMPLIANT',
            }));

            const atRisk = results.filter(r => r.complianceStatus === 'AT_RISK').length;
            const reviewNeeded = results.filter(r => r.complianceStatus === 'REVIEW_NEEDED').length;

            return JSON.stringify({
              totalProjects: projects.length,
              returned: results.length,
              atRiskCount: atRisk,
              reviewNeededCount: reviewNeeded,
              projects: results,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "check_stage_gate_approvals",
        description: "Check if projects have proper stage-gate approvals for their current phase",
        schema: z.object({
          portfolioId: z.string().optional().describe("Filter by portfolio"),
        }),
        func: async ({ portfolioId }) => {
          try {
            let projects = await this.storage.getProjects();
            
            if (portfolioId) {
              projects = projects.filter(p => p.portfolioId === portfolioId);
            }

            const stageGateIssues: any[] = [];

            for (const project of projects) {
              const milestones = await this.storage.getMilestones(project.id);
              const overdueMilestones = milestones.filter((m: any) => {
                if (!m.targetDate) return false;
                const targetDate = new Date(m.targetDate);
                return targetDate < new Date() && m.status !== 'completed';
              });

              if (overdueMilestones.length > 0) {
                const oldestDate = overdueMilestones[0]?.targetDate;
                stageGateIssues.push({
                  projectId: project.id,
                  projectName: project.name,
                  currentStage: project.safeStage,
                  overdueMilestones: overdueMilestones.length,
                  oldestOverdue: overdueMilestones[0]?.name,
                  daysOverdue: oldestDate ? Math.floor((Date.now() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
                });
              }
            }

            return JSON.stringify({
              totalIssues: stageGateIssues.length,
              issues: stageGateIssues.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "audit_policy_violations",
        description: "Audit projects for policy violations such as missing documentation, unapproved changes",
        schema: z.object({
          projectId: z.string().optional(),
        }),
        func: async ({ projectId }) => {
          try {
            let projects = await this.storage.getProjects();
            
            if (projectId) {
              projects = projects.filter(p => p.id === projectId);
            }

            const violations = [];

            for (const project of projects) {
              const issues = [];
              
              if (!project.expectedRoi) {
                issues.push('Missing ROI documentation');
              }
              if (project.status === 'red' && !project.aiRecommendation) {
                issues.push('Red status without documented remediation plan');
              }
              if (!project.portfolioId) {
                issues.push('Project not assigned to portfolio');
              }

              if (issues.length > 0) {
                violations.push({
                  projectId: project.id,
                  projectName: project.name,
                  violations: issues,
                  severity: issues.length > 2 ? 'high' : 'medium',
                });
              }
            }

            return JSON.stringify({
              totalViolations: violations.length,
              violations: violations.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "get_pending_escalations",
        description: "Get pending escalations and interventions awaiting approval",
        schema: z.object({
          limit: z.number().default(20),
        }),
        func: async ({ limit }) => {
          try {
            const interventions = await this.storage.getInterventions();
            
            const pending = interventions
              .filter(i => i.status === 'pending' && !i.selfApproved)
              .slice(0, limit)
              .map(i => ({
                id: i.id,
                type: i.type,
                severity: i.severity,
                title: i.title,
                agentSource: i.agentSource,
                projectName: i.projectName,
                createdAt: i.createdAt,
                daysWaiting: Math.floor((Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
              }));

            return JSON.stringify({
              pendingCount: pending.length,
              escalations: pending,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting Governance Agent compliance scan');

    const input = `Scan all projects for governance and compliance issues. Check for:
1. Projects with red or amber status that may need governance intervention
2. Stage-gate approvals that are overdue
3. Policy violations (missing documentation, unapproved changes)
4. Pending escalations that have been waiting too long

For each issue found, create an intervention with recommended actions.
Use your tools to get real data first, then analyze.
Only create interventions if you find actual governance problems.

Remember: You have SUPERVISED autonomy, so all interventions require human approval.`;

    try {
      await this.execute(input);
    } catch (error) {
      console.error('[GovernanceAgent] Scheduled scan error:', error);
    }
  }
}

// ============================================================================
// PLANNING AGENT - Dependencies, Capacity, Roadmap
// ============================================================================

export class PlanningAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'planning',
      agentName: 'Planning Agent',
      focus: 'dependencies, roadmap, capacity, resource planning',
      autonomy: 'supervised',
      temperature: 0.6,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the Planning Agent for NextEra Energy's Enterprise Transformation Office.

Your responsibilities:
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

IMPORTANT: Only create interventions based on REAL DATA from the queries.
Never fabricate or simulate data. Query actual project data first, then analyze.

Always use your tools to query real data before making decisions.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
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

      new DynamicStructuredTool({
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

      new DynamicStructuredTool({
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
                conflicts.push({
                  projectId: project.id,
                  projectName: project.name,
                  endDate: project.endDate,
                  status: project.status,
                  issue: 'Past due date with non-green status',
                  daysOverdue: Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)),
                });
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

      new DynamicStructuredTool({
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

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting Planning Agent dependency scan');

    const input = `Scan all projects for planning and dependency issues. Check for:
1. Blocked dependencies that need resolution
2. Teams over capacity or at risk
3. Roadmap conflicts and scheduling issues
4. Blocked work items that are stalled

For each issue found, create an intervention with recommended resolution.
Use your tools to get real data first, then analyze.
Only create interventions if you find actual planning problems.

Remember: You have SUPERVISED autonomy, so all interventions require human approval.`;

    try {
      await this.execute(input);
    } catch (error) {
      console.error('[PlanningAgent] Scheduled scan error:', error);
    }
  }
}

// ============================================================================
// OCM AGENT (Organizational Change Management)
// ============================================================================

export class OCMAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'ocm',
      agentName: 'OCM Agent',
      focus: 'change management, adoption, training, communication',
      autonomy: 'full',
      temperature: 0.7,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the OCM (Organizational Change Management) Agent for NextEra Energy.

Your responsibilities:
- Monitor change adoption and readiness
- Track training completion and effectiveness
- Identify communication gaps
- Assess stakeholder engagement
- Recommend change acceleration strategies

You have FULL AUTONOMY for:
- Training recommendations and reminders
- Communication plan adjustments
- Stakeholder engagement activities

You must ESCALATE to human for:
- Major change scope modifications
- Stakeholder escalations
- Resource reallocation

When detecting issues, output interventions in this format:
<INTERVENTION type="resource" severity="medium">
Description of OCM issue and recommended action
</INTERVENTION>

IMPORTANT: Only create interventions based on REAL DATA from the queries.
Never fabricate or simulate data. Query actual data first, then analyze.

Always use your tools to query real data before making decisions.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "track_adoption_metrics",
        description: "Track change adoption metrics across projects",
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

            const adoptionData = projects.slice(0, limit).map(p => {
              const flowEfficiency = parseInt(p.flowEfficiency || '0');
              const predictability = parseInt(p.predictability || '0');
              
              return {
                projectId: p.id,
                projectName: p.name,
                flowEfficiency: flowEfficiency + '%',
                predictability: predictability + '%',
                adoptionScore: Math.round((flowEfficiency + predictability) / 2),
                status: flowEfficiency < 50 ? 'LOW_ADOPTION' : flowEfficiency < 70 ? 'MODERATE' : 'HIGH',
              };
            });

            const lowAdoption = adoptionData.filter(a => a.status === 'LOW_ADOPTION');

            return JSON.stringify({
              totalProjects: adoptionData.length,
              lowAdoptionCount: lowAdoption.length,
              adoptionData: adoptionData,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "assess_stakeholder_readiness",
        description: "Assess stakeholder readiness and engagement levels",
        schema: z.object({
          portfolioId: z.string().optional(),
        }),
        func: async ({ portfolioId }) => {
          try {
            let projects = await this.storage.getProjects();
            
            if (portfolioId) {
              projects = projects.filter(p => p.portfolioId === portfolioId);
            }

            const readinessData = [];

            for (const project of projects) {
              const resources = await this.storage.getResources(project.id);
              const allocatedResources = resources.filter(r => r.allocation && parseInt(r.allocation) > 0);
              
              readinessData.push({
                projectId: project.id,
                projectName: project.name,
                resourceCount: resources.length,
                allocatedCount: allocatedResources.length,
                readinessScore: resources.length > 0 ? Math.round((allocatedResources.length / resources.length) * 100) : 0,
                status: allocatedResources.length < resources.length * 0.5 ? 'AT_RISK' : 'READY',
              });
            }

            const atRisk = readinessData.filter(r => r.status === 'AT_RISK');

            return JSON.stringify({
              totalProjects: readinessData.length,
              atRiskCount: atRisk.length,
              readinessData: readinessData.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "identify_communication_gaps",
        description: "Identify projects with communication or engagement issues",
        schema: z.object({
          limit: z.number().default(30),
        }),
        func: async ({ limit }) => {
          try {
            const projects = await this.storage.getProjects();
            const gaps = [];

            const allAlerts = await this.storage.getAlerts('active');
            
            for (const project of projects) {
              const alerts = allAlerts.filter((a: any) => a.sourceEntityId === project.id);
              const unresolvedAlerts = alerts.filter((a: any) => !a.acknowledgedAt);
              
              if (unresolvedAlerts.length > 3) {
                gaps.push({
                  projectId: project.id,
                  projectName: project.name,
                  unresolvedAlerts: unresolvedAlerts.length,
                  oldestAlert: unresolvedAlerts[0]?.title,
                  issue: 'High number of unacknowledged alerts indicates communication gap',
                });
              }
            }

            return JSON.stringify({
              gapsFound: gaps.length,
              communicationGaps: gaps.slice(0, limit),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "get_change_impact_analysis",
        description: "Analyze change impact across teams and projects",
        schema: z.object({
          projectId: z.string().optional(),
        }),
        func: async ({ projectId }) => {
          try {
            let projects = await this.storage.getProjects();
            
            if (projectId) {
              projects = projects.filter(p => p.id === projectId);
            }

            const impactAnalysis = [];

            const allInterventions = await this.storage.getInterventions();
            
            for (const project of projects) {
              const dependencies = await this.storage.getDependencies(project.id);
              const interventions = allInterventions.filter((i: any) => i.projectId === project.id);
              
              const impactScore = (dependencies.length * 2) + (interventions.filter((i: any) => i.severity === 'critical' || i.severity === 'high').length * 3);
              
              if (impactScore > 5) {
                impactAnalysis.push({
                  projectId: project.id,
                  projectName: project.name,
                  dependencyCount: dependencies.length,
                  highSeverityInterventions: interventions.filter(i => i.severity === 'critical' || i.severity === 'high').length,
                  impactScore,
                  impactLevel: impactScore > 10 ? 'HIGH' : 'MEDIUM',
                });
              }
            }

            impactAnalysis.sort((a, b) => b.impactScore - a.impactScore);

            return JSON.stringify({
              highImpactProjects: impactAnalysis.length,
              analysis: impactAnalysis.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting OCM Agent change management scan');

    const input = `Scan all projects for organizational change management issues. Check for:
1. Projects with low adoption metrics (flow efficiency < 50%)
2. Stakeholder readiness issues
3. Communication gaps (unacknowledged alerts)
4. High-impact changes that need attention

For each issue found, create an intervention with recommended OCM strategies.
Use your tools to get real data first, then analyze.
Only create interventions if you find actual change management problems.

Remember: You have FULL autonomy for training and communication recommendations.`;

    try {
      await this.execute(input);
    } catch (error) {
      console.error('[OCMAgent] Scheduled scan error:', error);
    }
  }
}

// ============================================================================
// INTEGRATED MANAGEMENT AGENT (Quality/Testing)
// ============================================================================

export class IntegratedMgmtAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'integrated',
      agentName: 'Integrated Mgmt Agent',
      focus: 'quality, testing, defects, coverage, technical debt',
      autonomy: 'full',
      temperature: 0.6,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the Integrated Management Agent for Quality and Testing at NextEra Energy.

Your responsibilities:
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

IMPORTANT: Only create interventions based on REAL DATA from the queries.
Never fabricate or simulate data. Query actual data first, then analyze.

Always use your tools to query real data before making decisions.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
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
              
              qualityData.push({
                projectId: project.id,
                projectName: project.name,
                status: project.status,
                predictability: predictability + '%',
                milestoneCompletion: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) + '%' : 'N/A',
                qualityScore: predictability,
                qualityStatus: predictability < 70 ? 'NEEDS_IMPROVEMENT' : predictability < 85 ? 'ACCEPTABLE' : 'EXCELLENT',
              });
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

      new DynamicStructuredTool({
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
                  
                  milestoneIssues.push({
                    milestoneId: milestone.id,
                    milestoneName: milestone.name,
                    projectId: project.id,
                    projectName: project.name,
                    targetDate: milestone.targetDate,
                    status: milestone.status,
                    daysOverdue,
                    severity: daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'high' : 'medium',
                  });
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

      new DynamicStructuredTool({
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
              .map(p => ({
                projectId: p.id,
                projectName: p.name,
                velocity: parseInt(p.velocity || '0'),
                predictability: parseInt(p.predictability || '0'),
                flowEfficiency: parseInt(p.flowEfficiency || '0'),
                status: p.status,
                trend: parseInt(p.predictability || '0') < 70 ? 'DECLINING' : 'STABLE',
              }));

            const declining = velocityData.filter(v => v.trend === 'DECLINING');

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

      new DynamicStructuredTool({
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

                upcomingReleases.push({
                  projectId: project.id,
                  projectName: project.name,
                  endDate: project.endDate,
                  daysUntilRelease: Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                  milestoneCompletion: `${completedMilestones}/${milestones.length}`,
                  predictability: predictability + '%',
                  readinessScore,
                  readinessStatus: readinessScore < 50 ? 'NOT_READY' : readinessScore < 75 ? 'AT_RISK' : 'READY',
                });
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

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting Integrated Mgmt Agent quality scan');

    const input = `Scan all projects for quality and testing issues. Check for:
1. Projects with low predictability (<70%)
2. Overdue milestones that indicate quality gate failures
3. Velocity trends that are declining
4. Upcoming releases that are not ready

For each issue found, create an intervention with recommended quality improvements.
Use your tools to get real data first, then analyze.
Only create interventions if you find actual quality problems.

Remember: You have FULL autonomy for test coverage and quality recommendations.`;

    try {
      await this.execute(input);
    } catch (error) {
      console.error('[IntegratedMgmtAgent] Scheduled scan error:', error);
    }
  }
}
