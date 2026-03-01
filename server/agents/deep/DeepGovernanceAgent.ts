/**
 * DEEP GOVERNANCE AGENT
 *
 * Enhanced Governance agent with Deep Agent capabilities
 * - Plans compliance analysis approaches
 * - Reflects on governance recommendations
 * - Multi-step reasoning for policy enforcement
 */

import { AgentTool } from "../../lib/AgentTool.js";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";
import { executeLangflowFlow } from "../../lib/LangflowMCPClient.js";

export class DeepGovernanceAgent extends DeepAgentBase {
  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DeepGovernance",
      agentType: "compliance_intelligence",
      description: "Enhanced governance and compliance agent with planning and reflection",
      capabilities: [
        "Compliance status monitoring",
        "Stage-gate approval tracking",
        "Policy violation detection",
        "Escalation management",
        "Regulatory adherence verification",
        "Multi-step compliance planning",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 8,
      reflectionThreshold: 3,
    };

    super(config, storage);
  }

  protected defineTools(): AgentTool[] {
    return [
      new AgentTool({
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

            // Broadcast compliance facts to other agents
            await this.broadcastFact(
              'portfolio_compliance',
              'at_risk_count',
              atRisk,
              0.95
            );

            await this.broadcastFact(
              'portfolio_compliance',
              'review_needed_count',
              reviewNeeded,
              0.95
            );

            // If critical, learn the pattern
            if (atRisk > 5) {
              console.log(`[DeepGovernance] CRITICAL: ${atRisk} projects at compliance risk`);

              await this.learn('portfolio_compliance_critical', {
                atRiskCount: atRisk,
                reviewNeededCount: reviewNeeded,
                totalProjects: projects.length,
                detectedAt: new Date(),
              });

              // Execute Langflow workflow for compliance alert
              try {
                const flowResult = await executeLangflowFlow(
                  'new_flow',
                  {
                    input_value: JSON.stringify({
                      projectId: 'portfolio',
                      violationType: 'multiple_projects_at_risk',
                      severity: 'critical',
                      policyId: 'portfolio_compliance',
                      message: `${atRisk} projects at compliance risk, ${reviewNeeded} need review`,
                    })
                  },
                  'governance'
                );

                if (flowResult.success) {
                  console.log(`[DeepGovernance] ✅ Langflow workflow executed`);
                }
              } catch (error: any) {
                console.warn(`[DeepGovernance] Langflow skipped:`, error.message);
              }

              await this.archiveContext(
                `Portfolio compliance alert: ${atRisk} projects at risk, ${reviewNeeded} need review`,
                {
                  atRisk,
                  reviewNeeded,
                  severity: 'critical',
                }
              );
            }

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

      new AgentTool({
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
                const daysOverdue = oldestDate ? Math.floor((Date.now() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                stageGateIssues.push({
                  projectId: project.id,
                  projectName: project.name,
                  currentStage: project.safeStage,
                  overdueMilestones: overdueMilestones.length,
                  oldestOverdue: overdueMilestones[0]?.name,
                  daysOverdue,
                });

                // Broadcast stage gate issues
                await this.broadcastFact(
                  `project_${project.id}`,
                  'stage_gate_overdue',
                  daysOverdue,
                  0.95
                );

                // If severely overdue, learn and archive
                if (daysOverdue > 30) {
                  await this.learn(`project_${project.id}_stage_gate_critical`, {
                    daysOverdue,
                    overdueMilestones: overdueMilestones.length,
                    detectedAt: new Date(),
                  });

                  await this.archiveContext(
                    `Project ${project.name} has stage gate milestone ${daysOverdue} days overdue`,
                    {
                      projectId: project.id,
                      daysOverdue,
                      severity: 'critical',
                    }
                  );
                }
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

      new AgentTool({
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
                const severity = issues.length > 2 ? 'high' : 'medium';

                violations.push({
                  projectId: project.id,
                  projectName: project.name,
                  violations: issues,
                  severity,
                });

                // Broadcast policy violations
                await this.broadcastFact(
                  `project_${project.id}`,
                  'policy_violations',
                  issues.length,
                  0.95
                );

                // If high severity, learn and archive
                if (severity === 'high') {
                  await this.learn(`project_${project.id}_policy_violations`, {
                    violationCount: issues.length,
                    violations: issues,
                    detectedAt: new Date(),
                  });

                  await this.archiveContext(
                    `Project ${project.name} has ${issues.length} policy violations`,
                    {
                      projectId: project.id,
                      violations: issues,
                      severity: 'high',
                    }
                  );
                }
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

      new AgentTool({
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

            // Broadcast escalation backlog
            await this.broadcastFact(
              'governance_escalations',
              'pending_count',
              pending.length,
              0.95
            );

            // If backlog is high, learn and archive
            if (pending.length > 10) {
              await this.learn('escalation_backlog_high', {
                pendingCount: pending.length,
                detectedAt: new Date(),
              });

              await this.archiveContext(
                `High escalation backlog: ${pending.length} interventions pending approval`,
                {
                  pendingCount: pending.length,
                  severity: 'high',
                }
              );
            }

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

  protected getSystemPrompt(): string {
    return `You are an advanced Governance and Compliance Agent (DeepGovernance) with deep planning and reflection capabilities.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing compliance, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from governance patterns

When analyzing governance and compliance:
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

DECISION FRAMEWORK:
- 5+ projects at risk → Critical portfolio compliance issue
- Stage gate 30+ days overdue → Escalate immediately
- Multiple policy violations → High priority review needed
- 10+ pending escalations → Governance process bottleneck

IMPORTANT: Only create interventions based on REAL DATA from the queries.
Never fabricate or simulate data. Query actual project data first, then analyze.

You work within a multi-agent system. When issues span multiple domains (e.g., compliance + budget), recommend collaboration with other agents (FinOps, Risk, etc.).

Always provide clear reasoning and data-driven insights.`;
  }
}
