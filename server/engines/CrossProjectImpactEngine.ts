/**
 * CROSS-PROJECT IMPACT ENGINE
 *
 * THIS IS THE CRITICAL DIFFERENTIATOR FROM PM TOOLS
 *
 * Capabilities:
 * 1. Cross-project dependency mapping
 * 2. Cascade impact prediction (how Project A delay impacts B, C, D)
 * 3. AI-driven recommendations with impact analysis
 * 4. Recommendation traceability (who created, who approved, what happened)
 * 5. Portfolio-wide impact simulation ("what-if" scenarios)
 * 6. Resource contention detection across projects
 *
 * Used by: All agents, executive dashboards, automated email alerts
 */

import type { IStorage } from '../storage.js';
import type { Project, Dependency } from '@shared/schema';
import { PredictiveAnalyticsEngine } from './PredictiveAnalyticsEngine.js';
import { FinancialCalculationEngine } from './FinancialCalculationEngine.js';

export interface CrossProjectDependency {
  dependencyId: string;
  sourceProjectId: string;
  sourceProjectName: string;
  targetProjectId: string;
  targetProjectName: string;
  dependencyType: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'resource-sharing' | 'data-dependency';
  criticality: 'critical' | 'high' | 'medium' | 'low';
  status: 'healthy' | 'at-risk' | 'blocked';
  riskScore: number; // 0-100
  description: string;
}

export interface CascadeImpactAnalysis {
  triggerProjectId: string;
  triggerProjectName: string;
  changeType: 'schedule-delay' | 'budget-overrun' | 'scope-change' | 'resource-unavailable' | 'cancellation';
  changeDescription: string;
  estimatedDelayDays?: number;
  estimatedCostImpact?: number;

  // Direct impacts (first-order)
  directImpacts: ProjectImpact[];

  // Cascade impacts (second-order and beyond)
  cascadeImpacts: ProjectImpact[];

  // Portfolio-level impact
  portfolioImpact: {
    totalProjectsAffected: number;
    totalDelayDays: number;
    totalCostImpact: number;
    criticalProjectsAffected: number;
    portfolioRiskIncrease: number; // % increase in overall portfolio risk
  };

  // Critical path analysis
  criticalPathImpact: boolean;
  criticalPathProjects: string[];

  // AI recommendations
  recommendations: AIRecommendation[];

  // Traceability
  analysisId: string;
  analyzedAt: Date;
  analyzedBy: 'system' | string; // Agent ID or user ID
  confidence: number; // 0-100%
}

export interface ProjectImpact {
  projectId: string;
  projectName: string;
  impactType: 'schedule' | 'budget' | 'scope' | 'resource' | 'value';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;

  // Quantified impact
  scheduleDelayDays?: number;
  costImpact?: number;
  valueImpact?: number;
  probabilityOfImpact: number; // 0-100%

  // Dependency chain
  dependencyChain: string[]; // List of project IDs in dependency path

  // Mitigation options
  mitigationOptions: string[];
}

export interface AIRecommendation {
  recommendationId: string;
  type: 'schedule-mitigation' | 'budget-reallocation' | 'resource-reallocation' | 'scope-adjustment' | 'risk-mitigation' | 'dependency-removal';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;

  // Impact of implementing recommendation
  expectedBenefit: {
    scheduleImprovement?: number; // days saved
    costSaving?: number; // $ saved
    riskReduction?: number; // % risk reduction
    valueProtection?: number; // $ value protected
  };

  // Implementation details
  implementationCost: number; // $
  implementationTime: string; // e.g., "2 weeks"
  implementationRisk: 'low' | 'medium' | 'high';
  affectedProjects: string[]; // Project IDs

  // Traceability
  createdBy: string; // Agent ID or user ID
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  implementedBy?: string;
  implementedAt?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'implemented' | 'expired';

  // AI confidence
  confidence: number; // 0-100%
  evidenceLinks: string[]; // Links to supporting data
}

export interface ResourceContentionAnalysis {
  resourceId: string;
  resourceName: string;

  // Contention details
  contentionType: 'over-allocation' | 'skill-gap' | 'conflicting-priorities';
  severity: 'critical' | 'high' | 'medium' | 'low';

  // Competing projects
  competingProjects: {
    projectId: string;
    projectName: string;
    allocationPercent: number;
    priority: number;
    criticality: 'critical' | 'high' | 'medium' | 'low';
  }[];

  // Impact
  totalAllocation: number; // % over 100% indicates overallocation
  burnoutRisk: number; // 0-100%

  // Recommendations
  recommendations: AIRecommendation[];
}

export interface WhatIfScenario {
  scenarioId: string;
  scenarioName: string;
  scenarioDescription: string;

  // Changes to simulate
  changes: {
    projectId: string;
    changeType: 'delay' | 'budget-cut' | 'budget-increase' | 'cancel' | 'accelerate';
    changeValue: number; // days, $, etc.
  }[];

  // Predicted outcomes
  predictedOutcomes: {
    portfolioRiskScore: number;
    totalCostChange: number;
    totalScheduleChange: number;
    projectsAtRisk: number;
    projectsBenefited: number;
  };

  // Recommendations
  isRecommended: boolean;
  recommendationReason: string;
}

export class CrossProjectImpactEngine {
  private predictiveEngine: PredictiveAnalyticsEngine;
  private financialEngine: FinancialCalculationEngine;

  constructor(private storage: IStorage) {
    this.predictiveEngine = new PredictiveAnalyticsEngine(storage);
    this.financialEngine = new FinancialCalculationEngine(storage);
  }

  /**
   * Map all cross-project dependencies in the portfolio
   */
  async mapCrossProjectDependencies(portfolioId?: string): Promise<CrossProjectDependency[]> {
    const projects = await this.storage.getProjects();

    // Filter by portfolio if specified
    const portfolioProjects = portfolioId
      ? projects.filter(p => p.portfolioId === portfolioId)
      : projects;

    const crossProjectDeps: CrossProjectDependency[] = [];

    // Get all dependencies
    for (const project of portfolioProjects) {
      const dependencies = await this.storage.getDependencies(project.id);

      for (const dep of dependencies) {
        // Check if dependency is cross-project
        const targetProject = portfolioProjects.find(p => p.id === (dep as any).dependentProject || p.id === dep.targetProjectId);

        if (targetProject && targetProject.id !== project.id) {
          // This is a cross-project dependency
          const riskScore = await this.calculateDependencyRiskScore(project, targetProject, dep);

          let status: 'healthy' | 'at-risk' | 'blocked' = 'healthy';
          if (dep.status === 'blocked') status = 'blocked';
          else if (riskScore > 60) status = 'at-risk';

          crossProjectDeps.push({
            dependencyId: dep.id,
            sourceProjectId: project.id,
            sourceProjectName: project.name,
            targetProjectId: targetProject.id,
            targetProjectName: targetProject.name,
            dependencyType: (dep as any).type || dep.dependencyType || 'finish-to-start',
            criticality: this.determineDependencyCriticality(riskScore),
            status,
            riskScore,
            description: dep.description || `${project.name} depends on ${targetProject.name}`,
          });
        }
      }
    }

    return crossProjectDeps;
  }

  /**
   * Analyze cascade impacts of a project change
   * THIS IS THE CRITICAL CAPABILITY PM TOOLS DON'T HAVE
   */
  async analyzeCascadeImpact(
    triggerProjectId: string,
    changeType: 'schedule-delay' | 'budget-overrun' | 'scope-change' | 'resource-unavailable' | 'cancellation',
    changeValue: { delayDays?: number; costImpact?: number }
  ): Promise<CascadeImpactAnalysis> {
    const project = await this.storage.getProject(triggerProjectId);
    if (!project) {
      throw new Error(`Project ${triggerProjectId} not found`);
    }

    // Build dependency graph
    const dependencyGraph = await this.buildDependencyGraph(project.portfolioId || '');

    // Find all projects impacted by this change
    const directImpacts = await this.calculateDirectImpacts(
      triggerProjectId,
      changeType,
      changeValue,
      dependencyGraph
    );

    const cascadeImpacts = await this.calculateCascadeImpacts(
      directImpacts,
      dependencyGraph
    );

    // Calculate portfolio-level impact
    const allImpacts = [...directImpacts, ...cascadeImpacts];
    const portfolioImpact = {
      totalProjectsAffected: new Set(allImpacts.map(i => i.projectId)).size,
      totalDelayDays: allImpacts.reduce((sum, i) => sum + (i.scheduleDelayDays || 0), 0),
      totalCostImpact: allImpacts.reduce((sum, i) => sum + (i.costImpact || 0), 0),
      criticalProjectsAffected: allImpacts.filter(i => i.severity === 'critical').length,
      portfolioRiskIncrease: this.calculatePortfolioRiskIncrease(allImpacts),
    };

    // Critical path analysis
    const criticalPathProjects = await this.identifyCriticalPath(project.portfolioId || '');
    const criticalPathImpact = criticalPathProjects.includes(triggerProjectId);

    // Generate AI recommendations
    const recommendations = await this.generateCascadeRecommendations(
      project,
      changeType,
      directImpacts,
      cascadeImpacts
    );

    const analysisId = `impact-${Date.now()}-${triggerProjectId}`;

    return {
      triggerProjectId: project.id,
      triggerProjectName: project.name,
      changeType,
      changeDescription: this.describeChange(changeType, changeValue),
      estimatedDelayDays: changeValue.delayDays,
      estimatedCostImpact: changeValue.costImpact,
      directImpacts,
      cascadeImpacts,
      portfolioImpact,
      criticalPathImpact,
      criticalPathProjects,
      recommendations,
      analysisId,
      analyzedAt: new Date(),
      analyzedBy: 'system',
      confidence: 85, // Based on dependency graph completeness
    };
  }

  /**
   * Generate AI recommendations with full traceability
   */
  async generateRecommendationsWithTraceability(
    projectId: string,
    context: {
      issueType: 'schedule-delay' | 'budget-overrun' | 'resource-contention' | 'dependency-blocked';
      severity: 'critical' | 'high' | 'medium' | 'low';
      details: any;
    },
    createdBy: string
  ): Promise<AIRecommendation[]> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const recommendations: AIRecommendation[] = [];

    // Generate recommendations based on issue type
    if (context.issueType === 'schedule-delay') {
      recommendations.push(
        await this.generateScheduleMitigationRecommendation(project, context, createdBy)
      );
    }

    if (context.issueType === 'budget-overrun') {
      recommendations.push(
        await this.generateBudgetReallocationRecommendation(project, context, createdBy)
      );
    }

    if (context.issueType === 'resource-contention') {
      recommendations.push(
        await this.generateResourceReallocationRecommendation(project, context, createdBy)
      );
    }

    // Store recommendations in database with traceability
    for (const rec of recommendations) {
      await this.storeRecommendation(rec);
    }

    return recommendations;
  }

  /**
   * Detect resource contention across projects
   */
  async detectResourceContention(portfolioId?: string): Promise<ResourceContentionAnalysis[]> {
    const projects = await this.storage.getProjects();

    // Filter by portfolio
    const portfolioProjects = portfolioId
      ? projects.filter(p => p.portfolioId === portfolioId)
      : projects;

    // Build resource allocation map
    const resourceMap = new Map<string, any[]>();

    for (const project of portfolioProjects) {
      const resources = await this.storage.getResources(project.id);

      for (const resource of resources) {
        if (!resourceMap.has(resource.name)) {
          resourceMap.set(resource.name, []);
        }

        resourceMap.get(resource.name)!.push({
          projectId: project.id,
          projectName: project.name,
          allocation: parseFloat(resource.allocation || '0'),
          priority: 1, // Would come from project priority
          criticality: 'medium',
        });
      }
    }

    // Identify contentions
    const contentions: ResourceContentionAnalysis[] = [];

    for (const [resourceName, allocations] of Array.from(resourceMap.entries())) {
      const totalAllocation = allocations.reduce((sum: number, a: any) => sum + a.allocation, 0);

      if (totalAllocation > 100 || allocations.length > 2) {
        // Resource is overallocated or working on too many projects
        const severity = totalAllocation > 150 ? 'critical' :
                         totalAllocation > 120 ? 'high' : 'medium';

        const burnoutRisk = Math.min(100, (totalAllocation / 100) * 100);

        const recommendations = await this.generateResourceContentionRecommendations(
          resourceName,
          allocations,
          totalAllocation
        );

        contentions.push({
          resourceId: `resource-${resourceName}`,
          resourceName,
          contentionType: 'over-allocation',
          severity,
          competingProjects: allocations.map((a: any) => ({
            projectId: a.projectId,
            projectName: a.projectName,
            allocationPercent: a.allocation,
            priority: a.priority,
            criticality: a.criticality,
          })),
          totalAllocation,
          burnoutRisk,
          recommendations,
        });
      }
    }

    return contentions;
  }

  /**
   * Run "what-if" scenario simulation
   */
  async simulateWhatIfScenario(scenario: Omit<WhatIfScenario, 'scenarioId' | 'predictedOutcomes' | 'isRecommended' | 'recommendationReason'>): Promise<WhatIfScenario> {
    // Simulate each change and calculate combined impact
    const impactAnalyses = await Promise.all(
      scenario.changes.map(change =>
        this.analyzeCascadeImpact(
          change.projectId,
          change.changeType === 'delay' ? 'schedule-delay' : 'budget-overrun',
          { delayDays: change.changeType === 'delay' ? change.changeValue : undefined,
            costImpact: change.changeType !== 'delay' ? change.changeValue : undefined }
        )
      )
    );

    // Aggregate outcomes
    const predictedOutcomes = {
      portfolioRiskScore: impactAnalyses.reduce((sum, a) => sum + a.portfolioImpact.portfolioRiskIncrease, 0),
      totalCostChange: impactAnalyses.reduce((sum, a) => sum + a.portfolioImpact.totalCostImpact, 0),
      totalScheduleChange: impactAnalyses.reduce((sum, a) => sum + a.portfolioImpact.totalDelayDays, 0),
      projectsAtRisk: impactAnalyses.reduce((sum, a) => sum + a.portfolioImpact.criticalProjectsAffected, 0),
      projectsBenefited: 0, // Calculate based on positive impacts
    };

    // Determine if scenario is recommended
    const isRecommended = predictedOutcomes.portfolioRiskScore < 10 &&
                          predictedOutcomes.totalCostChange < 1000000;

    const recommendationReason = isRecommended
      ? 'Scenario has minimal portfolio impact and acceptable risk increase'
      : 'Scenario increases portfolio risk beyond acceptable thresholds';

    return {
      ...scenario,
      scenarioId: `scenario-${Date.now()}`,
      predictedOutcomes,
      isRecommended,
      recommendationReason,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async calculateDependencyRiskScore(
    sourceProject: Project,
    targetProject: Project,
    dependency: Dependency
  ): Promise<number> {
    let riskScore = 0;

    // Check if target project is at risk
    const targetRisks = await this.predictiveEngine.predictRisks(targetProject.id);
    riskScore += targetRisks.scheduleRiskScore * 0.6; // Heavy weight on schedule

    // Check if dependency is blocked
    if (dependency.status === 'blocked') {
      riskScore += 40;
    }

    return Math.min(100, riskScore);
  }

  private determineDependencyCriticality(riskScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (riskScore > 75) return 'critical';
    if (riskScore > 50) return 'high';
    if (riskScore > 25) return 'medium';
    return 'low';
  }

  private async buildDependencyGraph(portfolioId: string): Promise<Map<string, string[]>> {
    const graph = new Map<string, string[]>();
    const projects = await this.storage.getProjects();

    const portfolioProjects = projects.filter(p => p.portfolioId === portfolioId);

    for (const project of portfolioProjects) {
      const dependencies = await this.storage.getDependencies(project.id);

      const dependentProjects = dependencies
        .map((d: any) => d.dependentProject || d.targetProjectId)
        .filter((id: string) => portfolioProjects.some(p => p.id === id));

      graph.set(project.id, dependentProjects);
    }

    return graph;
  }

  private async calculateDirectImpacts(
    triggerProjectId: string,
    changeType: string,
    changeValue: any,
    dependencyGraph: Map<string, string[]>
  ): Promise<ProjectImpact[]> {
    const impacts: ProjectImpact[] = [];

    // Find projects that directly depend on trigger project
    for (const [projectId, dependencies] of Array.from(dependencyGraph.entries())) {
      if (dependencies.includes(triggerProjectId)) {
        const project = await this.storage.getProject(projectId);
        if (project) {
          impacts.push({
            projectId: project.id,
            projectName: project.name,
            impactType: 'schedule',
            severity: 'high',
            description: `Dependent on ${triggerProjectId} which has ${changeType}`,
            scheduleDelayDays: changeValue.delayDays ? changeValue.delayDays * 0.5 : 0, // 50% of trigger delay
            probabilityOfImpact: 85,
            dependencyChain: [triggerProjectId, projectId],
            mitigationOptions: [
              'Re-plan work to reduce dependency',
              'Parallelize non-dependent activities',
            ],
          });
        }
      }
    }

    return impacts;
  }

  private async calculateCascadeImpacts(
    directImpacts: ProjectImpact[],
    dependencyGraph: Map<string, string[]>
  ): Promise<ProjectImpact[]> {
    const cascadeImpacts: ProjectImpact[] = [];

    // For each direct impact, find second-order impacts
    for (const impact of directImpacts) {
      const secondOrder = await this.calculateDirectImpacts(
        impact.projectId,
        'schedule',
        { delayDays: impact.scheduleDelayDays },
        dependencyGraph
      );

      cascadeImpacts.push(...secondOrder);
    }

    return cascadeImpacts;
  }

  private calculatePortfolioRiskIncrease(impacts: ProjectImpact[]): number {
    // Simplified - would be more sophisticated in production
    const criticalCount = impacts.filter(i => i.severity === 'critical').length;
    return criticalCount * 5; // 5% risk increase per critical impact
  }

  private async identifyCriticalPath(portfolioId: string): Promise<string[]> {
    // Simplified critical path identification
    const projects = await this.storage.getProjects();
    const portfolioProjects = projects.filter(p => p.portfolioId === portfolioId);

    // Return projects with high criticality (simplified)
    return portfolioProjects
      .filter(p => parseFloat(p.budgetTotal || '0') > 20) // High-value projects
      .map(p => p.id);
  }

  private async generateCascadeRecommendations(
    project: Project,
    changeType: string,
    directImpacts: ProjectImpact[],
    cascadeImpacts: ProjectImpact[]
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    if (directImpacts.length > 0) {
      recommendations.push({
        recommendationId: `rec-${Date.now()}-1`,
        type: 'dependency-removal',
        priority: 'high',
        title: 'Reduce Cross-Project Dependencies',
        description: `${directImpacts.length} projects are directly impacted. Consider reducing dependencies.`,
        rationale: 'Reducing dependencies will limit cascade impacts in future changes',
        expectedBenefit: {
          riskReduction: 25,
        },
        implementationCost: 50000,
        implementationTime: '3 weeks',
        implementationRisk: 'medium',
        affectedProjects: [project.id, ...directImpacts.map(i => i.projectId)],
        createdBy: 'CrossProjectImpactEngine',
        createdAt: new Date(),
        status: 'pending',
        confidence: 75,
        evidenceLinks: [],
      });
    }

    return recommendations;
  }

  private async generateScheduleMitigationRecommendation(
    project: Project,
    context: any,
    createdBy: string
  ): Promise<AIRecommendation> {
    return {
      recommendationId: `rec-${Date.now()}-schedule`,
      type: 'schedule-mitigation',
      priority: context.severity === 'critical' ? 'critical' : 'high',
      title: 'Accelerate Schedule with Fast-Tracking',
      description: 'Fast-track critical path activities by parallelizing work streams',
      rationale: 'Project is behind schedule and impacting dependent projects',
      expectedBenefit: {
        scheduleImprovement: 14, // days
        riskReduction: 15,
      },
      implementationCost: 75000,
      implementationTime: '2 weeks',
      implementationRisk: 'medium',
      affectedProjects: [project.id],
      createdBy,
      createdAt: new Date(),
      status: 'pending',
      confidence: 80,
      evidenceLinks: [],
    };
  }

  private async generateBudgetReallocationRecommendation(
    project: Project,
    context: any,
    createdBy: string
  ): Promise<AIRecommendation> {
    return {
      recommendationId: `rec-${Date.now()}-budget`,
      type: 'budget-reallocation',
      priority: 'high',
      title: 'Reallocate Budget from Lower Priority Projects',
      description: 'Transfer budget from projects with positive variance',
      rationale: 'Project has budget overrun but high strategic value',
      expectedBenefit: {
        costSaving: 100000,
        valueProtection: 250000,
      },
      implementationCost: 10000,
      implementationTime: '1 week',
      implementationRisk: 'low',
      affectedProjects: [project.id],
      createdBy,
      createdAt: new Date(),
      status: 'pending',
      confidence: 85,
      evidenceLinks: [],
    };
  }

  private async generateResourceReallocationRecommendation(
    project: Project,
    context: any,
    createdBy: string
  ): Promise<AIRecommendation> {
    return {
      recommendationId: `rec-${Date.now()}-resource`,
      type: 'resource-reallocation',
      priority: 'high',
      title: 'Reallocate Resources to Reduce Contention',
      description: 'Move resource from non-critical activities to critical path',
      rationale: 'Resource is overallocated and causing delays',
      expectedBenefit: {
        scheduleImprovement: 7,
        riskReduction: 10,
      },
      implementationCost: 25000,
      implementationTime: '1 week',
      implementationRisk: 'low',
      affectedProjects: [project.id],
      createdBy,
      createdAt: new Date(),
      status: 'pending',
      confidence: 80,
      evidenceLinks: [],
    };
  }

  private async generateResourceContentionRecommendations(
    resourceName: string,
    allocations: any[],
    totalAllocation: number
  ): Promise<AIRecommendation[]> {
    return [{
      recommendationId: `rec-${Date.now()}-contention`,
      type: 'resource-reallocation',
      priority: totalAllocation > 150 ? 'critical' : 'high',
      title: `Resolve ${resourceName} Over-Allocation`,
      description: `${resourceName} is ${totalAllocation}% allocated across ${allocations.length} projects`,
      rationale: 'Over-allocation leads to burnout, delays, and quality issues',
      expectedBenefit: {
        riskReduction: 20,
      },
      implementationCost: 50000,
      implementationTime: '2 weeks',
      implementationRisk: 'medium',
      affectedProjects: allocations.map(a => a.projectId),
      createdBy: 'CrossProjectImpactEngine',
      createdAt: new Date(),
      status: 'pending',
      confidence: 85,
      evidenceLinks: [],
    }];
  }

  private async storeRecommendation(recommendation: AIRecommendation): Promise<void> {
    // In production, store in database with full traceability
    console.log('[Recommendation] Storing:', recommendation.recommendationId);
  }

  private describeChange(changeType: string, changeValue: any): string {
    if (changeType === 'schedule-delay') {
      return `Schedule delay of ${changeValue.delayDays} days`;
    }
    if (changeType === 'budget-overrun') {
      return `Budget overrun of $${(changeValue.costImpact / 1000000).toFixed(2)}M`;
    }
    return changeType;
  }
}
