/**
 * DEEP PMO AGENT
 *
 * Enhanced Project Management Office agent with Deep Agent capabilities
 * - Plans project health analysis approaches
 * - Reflects on portfolio governance recommendations
 * - Multi-step reasoning for complex project scenarios
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";
import type { Fact } from "../../lib/Mem0Service.js";
import { PMO_DEFAULT_RULES, PMO_DEFAULT_ATTRIBUTES } from "../attributes/PMOAgentAttributes.js";
import type { RuleDefinition } from "../attributes/PMOAgentAttributes.js";
import { executeLangflowFlow } from "../../lib/LangflowMCPClient.js";

export class DeepPMOAgent extends DeepAgentBase {
  private rules: RuleDefinition[] = PMO_DEFAULT_RULES;

  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DeepPMO",
      agentType: "project_management_office",
      description: "Enhanced PMO agent with planning and reflection for portfolio management",
      capabilities: [
        "Project health analysis",
        "Milestone tracking and prediction",
        "Resource optimization",
        "Governance enforcement",
        "Status report generation",
        "Multi-step portfolio planning",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 8,
      reflectionThreshold: 2,
    };

    super(config, storage);
  }

  /**
   * PMO Agent subscribes to facts from other agents
   */
  protected getFactSubscriptions(): string[] {
    return [
      'project_*:health_score',       // Any project health changes
      'project_*:schedule_variance',  // Schedule delays from TMO
      'project_*:budget_status',      // Budget issues from FinOps
      'project_*:risk_score',         // Risk escalations
      '*:team_velocity',              // Team velocity changes
    ];
  }

  /**
   * Handle observed facts from other agents
   */
  protected async onFactObserved(fact: Fact): Promise<void> {
    await super.onFactObserved(fact);

    // PMO Agent responds to critical project health issues
    if (fact.attribute === 'schedule_variance' && typeof fact.value === 'number' && fact.value < -5) {
      console.log(`[DeepPMO] CRITICAL: ${fact.entity} is ${Math.abs(fact.value)} days behind schedule`);

      // Learn about this pattern
      await this.learn(`${fact.entity}_schedule_delay`, {
        detected: new Date(),
        severity: 'critical',
        daysLate: Math.abs(fact.value),
        sourceAgent: fact.sourceAgent,
      });

      // Execute Langflow workflow for health alert
      try {
        const flowResult = await executeLangflowFlow(
          'new_flow',
          {
            input_value: JSON.stringify({
              projectId: fact.entity.replace('project_', ''),
              projectName: fact.entity,
              healthScore: 3,
              issues: [`${Math.abs(fact.value)} days schedule delay`],
              severity: 'critical',
              message: `Critical health alert: ${Math.abs(fact.value)} days behind`,
            })
          },
          'pmo'
        );

        if (flowResult.success) {
          console.log(`[DeepPMO] ✅ Langflow workflow executed`);
        }
      } catch (error: any) {
        console.warn(`[DeepPMO] Langflow skipped:`, error.message);
      }

      // Archive the context
      await this.archiveContext(
        `Project ${fact.entity} detected with ${Math.abs(fact.value)} days schedule delay by ${fact.sourceAgent}`,
        {
          projectId: fact.entity,
          attribute: 'schedule_variance',
          severity: 'critical',
        }
      );
    }

    // Respond to budget issues
    if (fact.attribute === 'budget_status' && fact.value === 'critical') {
      console.log(`[DeepPMO] Budget alert for ${fact.entity}`);

      await this.learn(`${fact.entity}_budget_alert`, {
        detected: new Date(),
        status: fact.value,
        sourceAgent: fact.sourceAgent,
      });
    }
  }

  /**
   * Get system prompt for Deep PMO Agent
   */
  protected getSystemPrompt(): string {
    return `You are an advanced Project Management Office Agent (DeepPMO) with deep planning and reflection capabilities.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing projects, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from results

Use your tools to monitor project health, track milestones, optimize resources, and enforce governance.
When you identify critical issues, recommend collaboration with FinOps (budget), TMO (schedule), or Risk (threats) agents.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "analyze_project_health",
        description: "Scans all projects for schedule/budget/scope variance and calculates overall health score",
        schema: z.object({
          projectId: z.string().optional().describe("Specific project ID (optional, analyzes all if not provided)"),
          includeMetrics: z.boolean().optional().describe("Include detailed metrics breakdown (default true)"),
        }),
        func: async ({ projectId, includeMetrics = true }) => {
          if (projectId) {
            // Analyze single project
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found" };
            }

            const progress = project.progress || 0;
            const budget = parseFloat(project.budget || '0');
            const actualCost = parseFloat(project.actualCost || '0');
            const budgetVariance = budget > 0 ? ((actualCost - budget) / budget) * 100 : 0;

            // Calculate health score (0-100)
            let healthScore = 100;
            if (budgetVariance > 10) healthScore -= 20;
            if (budgetVariance > 20) healthScore -= 20;
            if (progress < 50) healthScore -= 10;
            if (actualCost > budget * 1.15) healthScore -= 15;

            const metrics = includeMetrics ? {
              onTimeDeliveryRate: 85, // Mock - would calculate from milestones
              teamVelocityTrend: -5,
              qualityMetrics: 75,
              deliveryPredictability: 80,
              teamMoraleScore: 70,
              scopeCreep: 12,
              issueResolutionTime: 8,
            } : undefined;

            const finalHealthScore = Math.max(0, healthScore);
            const status = finalHealthScore >= 75 ? 'healthy' : finalHealthScore >= 50 ? 'at_risk' : 'critical';

            // Broadcast project health as a fact to other agents
            await this.broadcastFact(
              `project_${projectId}`,
              'health_score',
              finalHealthScore,
              0.95 // High confidence
            );

            await this.broadcastFact(
              `project_${projectId}`,
              'health_status',
              status,
              0.95
            );

            // If critical, alert other agents
            if (finalHealthScore < 50) {
              console.log(`[DeepPMO] ALERT: Project ${project.name} health critical (score: ${finalHealthScore})`);

              // Learn about critical projects
              await this.learn(`project_${projectId}_critical`, {
                healthScore: finalHealthScore,
                detectedAt: new Date(),
                budgetVariance,
                progress,
              });
            }

            return {
              projectId,
              projectName: project.name,
              healthScore: finalHealthScore,
              status,
              budgetVariance: budgetVariance.toFixed(2),
              progress: progress,
              metrics,
            };
          } else {
            // Analyze all projects
            const projects = await this.storage.getProjects();
            const healthScores = projects.map((p: any) => {
              const budget = parseFloat(p.budget || '0');
              const actualCost = parseFloat(p.actualCost || '0');
              const budgetVariance = budget > 0 ? ((actualCost - budget) / budget) * 100 : 0;

              let score = 100;
              if (budgetVariance > 10) score -= 20;
              if (budgetVariance > 20) score -= 20;
              if ((p.progress || 0) < 50) score -= 10;

              return {
                projectId: p.id,
                projectName: p.name,
                healthScore: Math.max(0, score),
                status: score >= 75 ? 'healthy' : score >= 50 ? 'at_risk' : 'critical',
              };
            });

            const avgHealth = healthScores.reduce((sum: number, p: any) => sum + p.healthScore, 0) / healthScores.length;
            const criticalProjects = healthScores.filter((p: any) => p.status === 'critical').length;
            const atRiskProjects = healthScores.filter((p: any) => p.status === 'at_risk').length;

            return {
              portfolioHealth: avgHealth.toFixed(2),
              totalProjects: projects.length,
              criticalProjects,
              atRiskProjects,
              healthyProjects: projects.length - criticalProjects - atRiskProjects,
              projects: healthScores,
            };
          }
        },
      }),

      new DynamicStructuredTool({
        name: "track_milestones",
        description: "Monitors milestone completion, predicts delays, and identifies at-risk deliverables",
        schema: z.object({
          projectId: z.string().describe("Project ID to track milestones for"),
          predictDelays: z.boolean().optional().describe("Enable delay prediction (default true)"),
        }),
        func: async ({ projectId, predictDelays = true }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          // Mock milestone data - in production, would query from database
          const milestones = [
            { id: 'm1', name: 'Requirements Complete', status: 'completed', dueDate: '2026-01-15', completedDate: '2026-01-14' },
            { id: 'm2', name: 'Design Approval', status: 'completed', dueDate: '2026-01-25', completedDate: '2026-01-26' },
            { id: 'm3', name: 'Development Complete', status: 'in_progress', dueDate: '2026-02-15', expectedDate: '2026-02-20' },
            { id: 'm4', name: 'Testing Complete', status: 'planned', dueDate: '2026-03-01', expectedDate: '2026-03-05' },
            { id: 'm5', name: 'Production Launch', status: 'planned', dueDate: '2026-03-15', expectedDate: '2026-03-20' },
          ];

          const completedOnTime = milestones.filter(m => m.status === 'completed' && (!m.completedDate || m.completedDate <= m.dueDate)).length;
          const totalCompleted = milestones.filter(m => m.status === 'completed').length;
          const onTimeRate = totalCompleted > 0 ? (completedOnTime / totalCompleted) * 100 : 100;

          const atRiskMilestones = predictDelays ?
            milestones.filter(m => m.status !== 'completed' && m.expectedDate && m.expectedDate > m.dueDate) : [];

          // Broadcast milestone tracking facts
          await this.broadcastFact(
            `project_${projectId}`,
            'on_time_delivery_rate',
            parseFloat(onTimeRate.toFixed(1)),
            0.90
          );

          await this.broadcastFact(
            `project_${projectId}`,
            'at_risk_milestones',
            atRiskMilestones.length,
            0.85
          );

          await this.broadcastFact(
            `project_${projectId}`,
            'milestone_completion',
            totalCompleted,
            0.95
          );

          if (atRiskMilestones.length > 0) {
            console.log(`[DeepPMO] ⚠️  ${atRiskMilestones.length} at-risk milestones detected for ${project.name}`);
          }

          return {
            projectId,
            projectName: project.name,
            totalMilestones: milestones.length,
            completed: totalCompleted,
            inProgress: milestones.filter(m => m.status === 'in_progress').length,
            planned: milestones.filter(m => m.status === 'planned').length,
            onTimeDeliveryRate: onTimeRate.toFixed(1),
            atRiskMilestones: atRiskMilestones.map(m => ({
              name: m.name,
              dueDate: m.dueDate,
              expectedDate: m.expectedDate,
              delayDays: Math.ceil((new Date(m.expectedDate!).getTime() - new Date(m.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
            })),
            predictedDelay: atRiskMilestones.length > 0 ? 'yes' : 'no',
          };
        },
      }),

      new DynamicStructuredTool({
        name: "optimize_resources",
        description: "Identifies over/under-allocated resources across portfolio and recommends rebalancing",
        schema: z.object({
          portfolioView: z.boolean().optional().describe("Analyze entire portfolio (default true)"),
          threshold: z.number().optional().describe("Allocation threshold percentage (default 80)"),
        }),
        func: async ({ portfolioView = true, threshold = 80 }) => {
          const projects = await this.storage.getProjects();

          // Mock resource allocation data - in production, would query resource management system
          const resources = [
            { id: 'r1', name: 'John Doe', role: 'Developer', allocation: 120, projects: ['p1', 'p2', 'p3'] },
            { id: 'r2', name: 'Jane Smith', role: 'Designer', allocation: 45, projects: ['p1'] },
            { id: 'r3', name: 'Bob Johnson', role: 'QA', allocation: 95, projects: ['p2', 'p4'] },
            { id: 'r4', name: 'Alice Williams', role: 'PM', allocation: 85, projects: ['p1', 'p2'] },
            { id: 'r5', name: 'Charlie Brown', role: 'Developer', allocation: 30, projects: ['p3'] },
          ];

          const overAllocated = resources.filter(r => r.allocation > 100);
          const underAllocated = resources.filter(r => r.allocation < threshold);
          const optimal = resources.filter(r => r.allocation >= threshold && r.allocation <= 100);

          const recommendations = [];

          // Generate rebalancing recommendations
          for (const overRes of overAllocated) {
            const under = underAllocated.find(u => u.role === overRes.role);
            if (under) {
              recommendations.push({
                action: 'rebalance',
                from: overRes.name,
                to: under.name,
                role: overRes.role,
                reason: `${overRes.name} is ${overRes.allocation}% allocated, ${under.name} is only ${under.allocation}% allocated`,
              });
            } else {
              recommendations.push({
                action: 'hire',
                role: overRes.role,
                reason: `${overRes.name} is ${overRes.allocation}% allocated with no available resources to rebalance`,
              });
            }
          }

          const utilizationRate = parseFloat((resources.reduce((sum, r) => sum + r.allocation, 0) / (resources.length * 100) * 100).toFixed(1));

          // Broadcast resource optimization facts (portfolio-level)
          await this.broadcastFact(
            'portfolio',
            'over_allocated_resources',
            overAllocated.length,
            0.90
          );

          await this.broadcastFact(
            'portfolio',
            'under_allocated_resources',
            underAllocated.length,
            0.90
          );

          await this.broadcastFact(
            'portfolio',
            'resource_utilization',
            utilizationRate,
            0.85
          );

          if (overAllocated.length > 0) {
            console.log(`[DeepPMO] ⚠️  ${overAllocated.length} over-allocated resources detected (${overAllocated.map(r => r.name).join(', ')})`);
          }

          return {
            totalResources: resources.length,
            overAllocated: overAllocated.length,
            underAllocated: underAllocated.length,
            optimal: optimal.length,
            utilizationRate: utilizationRate.toFixed(1),
            overAllocatedResources: overAllocated.map(r => ({
              name: r.name,
              role: r.role,
              allocation: r.allocation,
              projects: r.projects.length,
            })),
            underAllocatedResources: underAllocated.map(r => ({
              name: r.name,
              role: r.role,
              allocation: r.allocation,
              projects: r.projects.length,
            })),
            recommendations,
          };
        },
      }),

      new DynamicStructuredTool({
        name: "enforce_governance",
        description: "Checks compliance with PMO standards, gates, and approvals for projects",
        schema: z.object({
          projectId: z.string().describe("Project ID to check governance compliance"),
          gateType: z.enum(['planning', 'execution', 'closure']).optional().describe("Specific gate to check"),
        }),
        func: async ({ projectId, gateType }) => {
          const project = await this.storage.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          // Mock governance checks - in production, would query governance system
          const checks = [
            { gate: 'planning', rule: 'Business Case Approved', status: 'passed', required: true },
            { gate: 'planning', rule: 'Budget Allocated', status: 'passed', required: true },
            { gate: 'planning', rule: 'Resources Assigned', status: 'passed', required: true },
            { gate: 'execution', rule: 'Kickoff Meeting Held', status: 'passed', required: true },
            { gate: 'execution', rule: 'Status Reports Current', status: 'failed', required: true },
            { gate: 'execution', rule: 'Risk Register Updated', status: 'warning', required: true },
            { gate: 'execution', rule: 'Change Control Active', status: 'passed', required: true },
            { gate: 'closure', rule: 'Deliverables Accepted', status: 'not_started', required: true },
            { gate: 'closure', rule: 'Lessons Learned Captured', status: 'not_started', required: true },
          ];

          const relevantChecks = gateType ? checks.filter(c => c.gate === gateType) : checks;
          const passed = relevantChecks.filter(c => c.status === 'passed').length;
          const failed = relevantChecks.filter(c => c.status === 'failed').length;
          const warnings = relevantChecks.filter(c => c.status === 'warning').length;

          const complianceScore = (passed / relevantChecks.length) * 100;
          const complianceStatus = complianceScore >= 90 ? 'compliant' : complianceScore >= 70 ? 'needs_attention' : 'non_compliant';

          // Broadcast governance compliance facts
          await this.broadcastFact(
            `project_${projectId}`,
            'governance_compliance_score',
            parseFloat(complianceScore.toFixed(1)),
            0.90
          );

          await this.broadcastFact(
            `project_${projectId}`,
            'governance_status',
            complianceStatus,
            0.90
          );

          await this.broadcastFact(
            `project_${projectId}`,
            'governance_failures',
            failed,
            0.95
          );

          if (complianceStatus === 'non_compliant') {
            console.log(`[DeepPMO] ⚠️  Governance non-compliant: ${project.name} (score: ${complianceScore.toFixed(1)}%, ${failed} failures)`);
          }

          return {
            projectId,
            projectName: project.name,
            gate: gateType || 'all',
            complianceScore: complianceScore.toFixed(1),
            status: complianceStatus,
            totalChecks: relevantChecks.length,
            passed,
            failed,
            warnings,
            notStarted: relevantChecks.filter(c => c.status === 'not_started').length,
            failedChecks: relevantChecks.filter(c => c.status === 'failed').map(c => c.rule),
            warningChecks: relevantChecks.filter(c => c.status === 'warning').map(c => c.rule),
          };
        },
      }),

      new DynamicStructuredTool({
        name: "generate_status_report",
        description: "Creates executive dashboards and status summaries for projects or portfolio",
        schema: z.object({
          projectId: z.string().optional().describe("Specific project ID (optional, generates portfolio report if not provided)"),
          format: z.enum(['summary', 'detailed', 'executive']).optional().describe("Report format (default summary)"),
        }),
        func: async ({ projectId, format = 'summary' }) => {
          if (projectId) {
            // Single project status report
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return { error: "Project not found" };
            }

            const budget = parseFloat(project.budget || '0');
            const actualCost = parseFloat(project.actualCost || '0');
            const budgetVariance = budget > 0 ? ((actualCost - budget) / budget) * 100 : 0;

            const summary = {
              projectId,
              projectName: project.name,
              status: project.status,
              progress: project.progress,
              health: budgetVariance < 10 ? 'green' : budgetVariance < 20 ? 'yellow' : 'red',
              budget: budget.toString(),
              actualCost: actualCost.toString(),
              budgetVariance: budgetVariance.toFixed(2),
            };

            if (format === 'detailed' || format === 'executive') {
              return {
                ...summary,
                milestones: { completed: 2, total: 5, onTrack: 3 },
                risks: { high: 1, medium: 3, low: 2 },
                issues: { open: 4, closed: 12 },
                teamSize: 8,
                keyAccomplishments: ['Requirements approved', 'Design phase completed'],
                upcomingMilestones: ['Development completion', 'Testing phase'],
                executiveSummary: format === 'executive' ?
                  `Project ${project.name} is ${project.progress}% complete with ${budgetVariance > 0 ? 'budget overrun' : 'budget remaining'} of ${Math.abs(budgetVariance).toFixed(1)}%. ${budgetVariance > 15 ? 'Immediate attention required.' : 'On track.'}` :
                  undefined,
              };
            }

            return summary;
          } else {
            // Portfolio status report
            const projects = await this.storage.getProjects();
            const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p.budget || '0'), 0);
            const totalActual = projects.reduce((sum, p) => sum + parseFloat(p.actualCost || '0'), 0);
            const avgProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length;

            const greenProjects = projects.filter(p => {
              const variance = parseFloat(p.budget || '0') > 0 ?
                ((parseFloat(p.actualCost || '0') - parseFloat(p.budget || '0')) / parseFloat(p.budget || '0')) * 100 : 0;
              return variance < 10;
            }).length;

            const yellowProjects = projects.filter(p => {
              const variance = parseFloat(p.budget || '0') > 0 ?
                ((parseFloat(p.actualCost || '0') - parseFloat(p.budget || '0')) / parseFloat(p.budget || '0')) * 100 : 0;
              return variance >= 10 && variance < 20;
            }).length;

            const redProjects = projects.length - greenProjects - yellowProjects;

            return {
              reportType: 'portfolio',
              totalProjects: projects.length,
              activeProjects: projects.filter(p => p.status === 'active').length,
              completedProjects: projects.filter(p => p.status === 'completed').length,
              portfolioBudget: totalBudget.toFixed(2),
              portfolioActual: totalActual.toFixed(2),
              portfolioVariance: ((totalActual - totalBudget) / totalBudget * 100).toFixed(2),
              avgProgress: avgProgress.toFixed(1),
              healthDistribution: {
                green: greenProjects,
                yellow: yellowProjects,
                red: redProjects,
              },
              executiveSummary: format === 'executive' ?
                `Portfolio consists of ${projects.length} projects with $${totalBudget.toFixed(0)} total budget. ${redProjects} projects require immediate attention. Overall portfolio is ${avgProgress.toFixed(0)}% complete.` :
                undefined,
            };
          }
        },
      }),
    ];
  }
}
