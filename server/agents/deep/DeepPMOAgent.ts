/**
 * DEEP PMO AGENT v4.0 - PALANTIR ONTOLOGY FIRST
 *
 * Enhanced Project Management Office agent with Deep Agent capabilities
 * - Plans project health analysis approaches
 * - Reflects on portfolio governance recommendations
 * - Multi-step reasoning for complex project scenarios
 *
 * DATA SOURCE: Palantir Foundry Ontology (NOT PostgreSQL)
 */

import { AgentTool } from "../../lib/AgentTool.js";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";
import type { Fact } from "../../lib/Mem0Service.js";
import { PMO_DEFAULT_RULES, PMO_DEFAULT_ATTRIBUTES } from "../attributes/PMOAgentAttributes.js";
import type { RuleDefinition } from "../attributes/PMOAgentAttributes.js";

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

      await this.checkRule('health-alert', {
        projectId: fact.entity.replace('project_', ''),
        projectName: fact.entity,
        healthScore: 3,
        scheduleVariance: fact.value,
        severity: 'critical',
      });

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

  protected defineTools(): AgentTool[] {
    return [
      new AgentTool({
        name: "analyze_project_health",
        description: "Scans all projects for schedule/budget/scope variance and calculates overall health score",
        schema: z.object({
          projectId: z.string().optional().describe("Specific project ID (optional, analyzes all if not provided)"),
          includeMetrics: z.boolean().optional().describe("Include detailed metrics breakdown (default true)"),
        }),
        func: async ({ projectId, includeMetrics = true }) => {
          if (projectId) {
            // Analyze single project
            const project = await this.getProject(projectId);
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

            // Compute REAL metrics from Palantir data (no mocks)
            let metrics: any = undefined;
            if (includeMetrics) {
              const [milestonesRaw, projectRisks, projectIssues] = await Promise.all([
                this.getMilestones(projectId).catch(() => [] as any[]),
                this.getProjectRisks(projectId).catch(() => [] as any[]),
                this.getIssues(projectId).catch(() => [] as any[]),
              ]);

              // Embedded milestones (PalantirIngestService stores as JSON on project)
              let embeddedMilestones: any[] = [];
              if (typeof project.milestonesJson === 'string') {
                try { embeddedMilestones = JSON.parse(project.milestonesJson); } catch {}
              }
              const milestones = milestonesRaw.length > 0 ? milestonesRaw : embeddedMilestones;

              const completed = milestones.filter((m: any) => (m.status || '').toLowerCase() === 'completed');
              const onTime = completed.filter((m: any) => {
                const due = m.dueDate || m.date;
                const done = m.completedDate || m.actualDate;
                return !done || !due || done <= due;
              }).length;
              const onTimeDeliveryRate = completed.length > 0
                ? Math.round((onTime / completed.length) * 100)
                : 100;

              const openRisks = projectRisks.filter((r: any) => (r.status || '').toLowerCase() === 'open').length;
              const openIssues = projectIssues.filter((i: any) => (i.status || '').toLowerCase() !== 'closed').length;
              const closedIssues = projectIssues.filter((i: any) => (i.status || '').toLowerCase() === 'closed').length;

              const velocity = Number(project.velocity ?? 0);
              const predictability = Number(project.predictability ?? 0);
              const flowEfficiency = Number(project.flowEfficiency ?? 0);

              metrics = {
                onTimeDeliveryRate,
                completedMilestones: completed.length,
                totalMilestones: milestones.length,
                openRisks,
                openIssues,
                closedIssues,
                teamVelocity: velocity,
                deliveryPredictability: Math.round(predictability * 100),
                flowEfficiencyPercent: Math.round(flowEfficiency * 100),
                budgetVariancePercent: parseFloat(budgetVariance.toFixed(2)),
              };
            }

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
            const projects = await this.getProjects();
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

      new AgentTool({
        name: "track_milestones",
        description: "Monitors milestone completion, predicts delays, and identifies at-risk deliverables",
        schema: z.object({
          projectId: z.string().describe("Project ID to track milestones for"),
          predictDelays: z.boolean().optional().describe("Enable delay prediction (default true)"),
        }),
        func: async ({ projectId, predictDelays = true }) => {
          const project = await this.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          // Read REAL milestones from Palantir (or embedded JSON fallback)
          let milestones: any[] = await this.getMilestones(projectId).catch(() => [] as any[]);
          if (milestones.length === 0 && typeof project.milestonesJson === 'string') {
            try {
              milestones = JSON.parse(project.milestonesJson) || [];
            } catch {
              milestones = [];
            }
          }
          // Normalize milestone shape
          milestones = milestones.map((m: any, idx: number) => ({
            id: m.id || `m${idx + 1}`,
            name: m.name,
            status: (m.status || 'planned').toLowerCase(),
            dueDate: m.dueDate || m.date || null,
            completedDate: m.completedDate || m.actualDate || null,
            expectedDate: m.expectedDate || null,
          }));

          const completedOnTime = milestones.filter(m => m.status === 'completed' && (!m.completedDate || !m.dueDate || m.completedDate <= m.dueDate)).length;
          const totalCompleted = milestones.filter(m => m.status === 'completed').length;
          const onTimeRate = totalCompleted > 0 ? (completedOnTime / totalCompleted) * 100 : 100;

          const atRiskMilestones = predictDelays ?
            milestones.filter(m => m.status !== 'completed' && m.expectedDate && m.dueDate && m.expectedDate > m.dueDate) : [];

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

      new AgentTool({
        name: "optimize_resources",
        description: "Identifies over/under-allocated resources across portfolio and recommends rebalancing",
        schema: z.object({
          portfolioView: z.boolean().optional().describe("Analyze entire portfolio (default true)"),
          threshold: z.number().optional().describe("Allocation threshold percentage (default 80)"),
          projectId: z.string().optional().describe("If set, scope analysis to a single project (no portfolio fan-out)"),
        }),
        func: async ({ portfolioView = true, threshold = 80, projectId }) => {
          // Pull the entire Palantir portfolio (default behaviour). Only scope
          // to a single project if the caller explicitly asks for it.
          const projects = projectId
            ? [await this.getProject(projectId)].filter(Boolean)
            : await this.getProjects();

          // Read REAL resources from Palantir (or embedded JSON fallback per project)
          // Aggregate the same person across projects (sum allocations)
          const palantirResources = await this.getResourceAllocations(projectId).catch(() => [] as any[]);
          const aggregated = new Map<string, { name: string; role: string; allocation: number; projects: string[] }>();

          // Source 1: Palantir resource allocation objects
          for (const r of palantirResources) {
            const key = (r.name || r.resourceName || '').trim();
            if (!key) continue;
            const cur = aggregated.get(key) || { name: key, role: r.role || 'Member', allocation: 0, projects: [] as string[] };
            cur.allocation += Number(r.allocation ?? 0);
            if (r.projectId && !cur.projects.includes(r.projectId)) cur.projects.push(r.projectId);
            aggregated.set(key, cur);
          }

          // Source 2: Embedded resourcesJson on each project
          for (const p of projects) {
            if (typeof p.resourcesJson !== 'string') continue;
            let arr: any[] = [];
            try { arr = JSON.parse(p.resourcesJson) || []; } catch { continue; }
            for (const r of arr) {
              const key = (r.name || '').trim();
              if (!key) continue;
              const cur = aggregated.get(key) || { name: key, role: r.role || 'Member', allocation: 0, projects: [] as string[] };
              cur.allocation += Number(r.allocation ?? 0);
              const pid = p.projectId || p.id;
              if (pid && !cur.projects.includes(pid)) cur.projects.push(pid);
              aggregated.set(key, cur);
            }
          }

          const resources = Array.from(aggregated.values()).map((r, idx) => ({
            id: `r${idx + 1}`,
            name: r.name,
            role: r.role,
            allocation: Math.round(r.allocation),
            projects: r.projects,
          }));

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

          const utilizationRate = resources.length > 0
            ? parseFloat((resources.reduce((sum, r) => sum + r.allocation, 0) / (resources.length * 100) * 100).toFixed(1))
            : 0;

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
            projectsAnalyzed: projects.length,
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

      new AgentTool({
        name: "enforce_governance",
        description: "Checks compliance with PMO standards, gates, and approvals for projects",
        schema: z.object({
          projectId: z.string().describe("Project ID to check governance compliance"),
          gateType: z.enum(['planning', 'execution', 'closure']).optional().describe("Specific gate to check"),
        }),
        func: async ({ projectId, gateType }) => {
          const project = await this.getProject(projectId);
          if (!project) {
            return { error: "Project not found" };
          }

          // Read REAL governance checkpoints from Palantir
          const rawCheckpoints = await this.getGovernanceCheckpoints(projectId).catch(() => [] as any[]);
          const checks = rawCheckpoints.length > 0
            ? rawCheckpoints.map((c: any) => ({
                gate: (c.gate || 'execution').toLowerCase(),
                rule: c.rule || c.name || 'unnamed-check',
                status: (c.status || 'not_started').toLowerCase(),
                required: c.required ?? true,
              }))
            : [];

          if (checks.length === 0) {
            return {
              projectId,
              projectName: project.name,
              gate: gateType || 'all',
              complianceScore: '0',
              status: 'no_checkpoints_defined',
              totalChecks: 0,
              passed: 0,
              failed: 0,
              warnings: 0,
              notStarted: 0,
              failedChecks: [],
              warningChecks: [],
              note: 'No governance checkpoints found in Palantir for this project',
            };
          }

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

      new AgentTool({
        name: "generate_status_report",
        description: "Creates executive dashboards and status summaries for projects or portfolio",
        schema: z.object({
          projectId: z.string().optional().describe("Specific project ID (optional, generates portfolio report if not provided)"),
          format: z.enum(['summary', 'detailed', 'executive']).optional().describe("Report format (default summary)"),
        }),
        func: async ({ projectId, format = 'summary' }) => {
          if (projectId) {
            // Single project status report
            const project = await this.getProject(projectId);
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
              // Compose REAL detail from Palantir
              const [milestonesRaw, projectRisks, projectIssues, resAlloc] = await Promise.all([
                this.getMilestones(projectId).catch(() => [] as any[]),
                this.getProjectRisks(projectId).catch(() => [] as any[]),
                this.getIssues(projectId).catch(() => [] as any[]),
                this.getResourceAllocations(projectId).catch(() => [] as any[]),
              ]);

              let milestones = milestonesRaw;
              if (milestones.length === 0 && typeof project.milestonesJson === 'string') {
                try { milestones = JSON.parse(project.milestonesJson) || []; } catch { milestones = []; }
              }
              let resources = resAlloc;
              if (resources.length === 0 && typeof project.resourcesJson === 'string') {
                try { resources = JSON.parse(project.resourcesJson) || []; } catch { resources = []; }
              }

              const completedMs = milestones.filter((m: any) => (m.status || '').toLowerCase() === 'completed');
              const onTrackMs = milestones.filter((m: any) => {
                const s = (m.status || '').toLowerCase();
                if (s === 'completed') return false;
                if (!m.expectedDate || !m.dueDate) return s !== 'blocked';
                return m.expectedDate <= m.dueDate;
              });

              const riskBucket = (impact: number, prob: number) => {
                const score = (Number(impact) || 0) * (Number(prob) || 0);
                if (score >= 16) return 'high';
                if (score >= 8) return 'medium';
                return 'low';
              };
              const riskCounts = { high: 0, medium: 0, low: 0 };
              for (const r of projectRisks) {
                const b = riskBucket(r.impact, r.probability);
                riskCounts[b as 'high' | 'medium' | 'low']++;
              }

              const openIssues = projectIssues.filter((i: any) => (i.status || '').toLowerCase() !== 'closed').length;
              const closedIssues = projectIssues.filter((i: any) => (i.status || '').toLowerCase() === 'closed').length;

              const upcoming = milestones
                .filter((m: any) => (m.status || '').toLowerCase() !== 'completed')
                .slice(0, 3)
                .map((m: any) => m.name);

              const recentlyCompleted = completedMs.slice(-3).map((m: any) => m.name);

              return {
                ...summary,
                milestones: { completed: completedMs.length, total: milestones.length, onTrack: onTrackMs.length },
                risks: riskCounts,
                issues: { open: openIssues, closed: closedIssues },
                teamSize: resources.length,
                keyAccomplishments: recentlyCompleted.length > 0 ? recentlyCompleted : ['No completed milestones yet'],
                upcomingMilestones: upcoming.length > 0 ? upcoming : ['No upcoming milestones'],
                executiveSummary: format === 'executive' ?
                  `Project ${project.name} is ${project.progress}% complete with ${budgetVariance > 0 ? 'budget overrun' : 'budget remaining'} of ${Math.abs(budgetVariance).toFixed(1)}%. ${budgetVariance > 15 ? 'Immediate attention required.' : 'On track.'}` :
                  undefined,
              };
            }

            return summary;
          } else {
            // Portfolio status report
            const projects = await this.getProjects();
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
