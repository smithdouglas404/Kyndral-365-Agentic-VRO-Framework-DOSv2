/**
 * FINANCIAL CALCULATION ENGINE
 *
 * Powers financial intelligence across the platform:
 * - Earned Value Management (EVM) calculations
 * - Budget variance analysis
 * - Cost performance forecasting
 * - ROI tracking and value realization
 * - Resource cost attribution
 *
 * Used by: FinOps Agent, VRO Agent, Executive Dashboards
 */

import type { IStorage } from '../storage.js';
import type { Project, ProjectFinancials } from '@shared/schema';

export interface EVMMetrics {
  // Planned Value (PV) - Budgeted cost for work scheduled
  plannedValue: number;

  // Earned Value (EV) - Budgeted cost for work completed
  earnedValue: number;

  // Actual Cost (AC) - Actual cost for work completed
  actualCost: number;

  // Budget at Completion (BAC) - Total planned budget
  budgetAtCompletion: number;

  // Cost Variance (CV) - EV - AC
  costVariance: number;
  costVariancePercent: number;

  // Schedule Variance (SV) - EV - PV
  scheduleVariance: number;
  scheduleVariancePercent: number;

  // Cost Performance Index (CPI) - EV / AC
  cpi: number;

  // Schedule Performance Index (SPI) - EV / PV
  spi: number;

  // Estimate at Completion (EAC) - Forecasted total cost
  estimateAtCompletion: number;

  // Estimate to Complete (ETC) - Forecasted remaining cost
  estimateToComplete: number;

  // Variance at Completion (VAC) - BAC - EAC
  varianceAtCompletion: number;
  varianceAtCompletionPercent: number;

  // To-Complete Performance Index (TCPI) - (BAC - EV) / (BAC - AC)
  tcpi: number;

  // Health indicators
  isOverBudget: boolean;
  isBehindSchedule: boolean;
  severity: 'healthy' | 'at-risk' | 'critical';
}

export interface BudgetForecast {
  projectId: string;
  projectName: string;
  currentBudget: number;
  currentSpent: number;
  percentComplete: number;

  // Forecasts
  forecastedCompletion: number; // EAC
  forecastedVariance: number; // VAC
  forecastedVariancePercent: number;

  // Confidence
  confidence: number; // 0-100
  confidenceReason: string;

  // Risk factors
  riskFactors: string[];

  // Recommended actions
  recommendations: string[];
}

export interface ValueRealizationMetrics {
  projectId: string;
  projectName: string;

  // Expected value
  expectedROI: number;
  expectedCostSavings: number;
  expectedRevenueImpact: number;

  // Realized value to date
  realizedROI: number;
  realizedCostSavings: number;
  realizedRevenueImpact: number;

  // Variance
  roiVariance: number;
  roiVariancePercent: number;

  // Value realization percentage
  valueRealizationPercent: number; // % of expected value achieved

  // Timeline
  daysIntoProject: number;
  expectedDaysToComplete: number;
  percentThroughTimeline: number;

  // Is value on track?
  isOnTrack: boolean;
  valueLeakage: number; // Expected - Realized
  severity: 'healthy' | 'at-risk' | 'critical';
}

export interface CostAttributionResult {
  projectId: string;
  projectName: string;
  totalCost: number;

  // Cost breakdown
  laborCost: number;
  materialCost: number;
  softwareCost: number;
  infrastructureCost: number;
  vendorCost: number;
  overheadCost: number;

  // Resource attribution
  resourceCosts: {
    resourceId: string;
    resourceName: string;
    allocationPercent: number;
    cost: number;
    hoursWorked: number;
    hourlyRate: number;
  }[];

  // Phase/milestone attribution
  phaseCosts: {
    phaseId: string;
    phaseName: string;
    budgeted: number;
    spent: number;
    variance: number;
  }[];
}

export interface PortfolioBudgetAnalysis {
  portfolioId: string;
  portfolioName: string;
  totalBudget: number;
  totalSpent: number;
  totalForecasted: number;

  // Aggregated metrics
  averageCPI: number;
  averageSPI: number;
  projectsOverBudget: number;
  projectsBehindSchedule: number;
  totalProjects: number;

  // Budget health by severity
  healthDistribution: {
    healthy: number;
    atRisk: number;
    critical: number;
  };

  // Top risks
  topBudgetRisks: {
    projectId: string;
    projectName: string;
    budgetVariance: number;
    severity: string;
  }[];

  // Recommendations
  portfolioRecommendations: string[];
}

export class FinancialCalculationEngine {
  constructor(private storage: IStorage) {}

  /**
   * Calculate comprehensive EVM metrics for a project
   */
  async calculateEVM(projectId: string): Promise<EVMMetrics> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const financials = await this.storage.getProjectFinancials(projectId);

    // Extract values
    const percentComplete = parseFloat((project as any).percentComplete || (project as any).spi || '0') * 100;
    const budgetTotal = parseFloat(project.budgetTotal || '0');
    const budgetSpent = parseFloat(project.budgetSpent || '0');

    // Calculate Planned Value (PV)
    // For simplicity, assume linear spending plan
    const daysIntoProject = this.calculateDaysIntoProject(project);
    const totalDays = this.calculateProjectDuration(project);
    const percentThroughTimeline = totalDays > 0 ? (daysIntoProject / totalDays) * 100 : 0;
    const plannedValue = budgetTotal * (percentThroughTimeline / 100);

    // Calculate Earned Value (EV)
    const earnedValue = budgetTotal * (percentComplete / 100);

    // Actual Cost (AC)
    const actualCost = budgetSpent;

    // Budget at Completion (BAC)
    const budgetAtCompletion = budgetTotal;

    // Cost Variance (CV = EV - AC)
    const costVariance = earnedValue - actualCost;
    const costVariancePercent = actualCost > 0 ? (costVariance / actualCost) * 100 : 0;

    // Schedule Variance (SV = EV - PV)
    const scheduleVariance = earnedValue - plannedValue;
    const scheduleVariancePercent = plannedValue > 0 ? (scheduleVariance / plannedValue) * 100 : 0;

    // Cost Performance Index (CPI = EV / AC)
    const cpi = actualCost > 0 ? earnedValue / actualCost : 1.0;

    // Schedule Performance Index (SPI = EV / PV)
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1.0;

    // Estimate at Completion (EAC)
    // Using formula: EAC = BAC / CPI (assumes current performance continues)
    const estimateAtCompletion = cpi > 0 ? budgetAtCompletion / cpi : budgetAtCompletion;

    // Estimate to Complete (ETC = EAC - AC)
    const estimateToComplete = estimateAtCompletion - actualCost;

    // Variance at Completion (VAC = BAC - EAC)
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;
    const varianceAtCompletionPercent = budgetAtCompletion > 0 ? (varianceAtCompletion / budgetAtCompletion) * 100 : 0;

    // To-Complete Performance Index (TCPI)
    // TCPI = (BAC - EV) / (BAC - AC)
    const tcpi = (budgetAtCompletion - actualCost) > 0
      ? (budgetAtCompletion - earnedValue) / (budgetAtCompletion - actualCost)
      : 1.0;

    // Health indicators
    const isOverBudget = cpi < 0.9; // CPI < 0.9 indicates over budget
    const isBehindSchedule = spi < 0.9; // SPI < 0.9 indicates behind schedule

    let severity: 'healthy' | 'at-risk' | 'critical' = 'healthy';
    if (cpi < 0.8 || spi < 0.8 || varianceAtCompletionPercent < -30) {
      severity = 'critical';
    } else if (cpi < 0.9 || spi < 0.9 || varianceAtCompletionPercent < -20) {
      severity = 'at-risk';
    }

    return {
      plannedValue,
      earnedValue,
      actualCost,
      budgetAtCompletion,
      costVariance,
      costVariancePercent,
      scheduleVariance,
      scheduleVariancePercent,
      cpi,
      spi,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion,
      varianceAtCompletionPercent,
      tcpi,
      isOverBudget,
      isBehindSchedule,
      severity,
    };
  }

  /**
   * Forecast budget at completion with confidence scoring
   */
  async forecastBudget(projectId: string): Promise<BudgetForecast> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const evm = await this.calculateEVM(projectId);

    const currentBudget = parseFloat(project.budgetTotal || '0');
    const currentSpent = parseFloat(project.budgetSpent || '0');
    const percentComplete = parseFloat((project as any).percentComplete || (project as any).spi || '0') * 100;

    // Calculate confidence based on data quality
    let confidence = 100;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Reduce confidence if project is early (< 20% complete)
    if (percentComplete < 20) {
      confidence -= 30;
      riskFactors.push('Project is in early stages (<20% complete)');
    }

    // Reduce confidence if CPI is unstable (< 0.7 or > 1.3)
    if (evm.cpi < 0.7 || evm.cpi > 1.3) {
      confidence -= 20;
      riskFactors.push('Cost Performance Index is highly volatile');
    }

    // Reduce confidence if missing financial data
    const financials = await this.storage.getProjectFinancials(projectId);
    if (!financials) {
      confidence -= 15;
      riskFactors.push('Detailed financial tracking not enabled');
    }

    // Generate recommendations
    if (evm.isOverBudget) {
      recommendations.push('Implement immediate cost controls and review resource allocation');
      recommendations.push('Schedule budget review meeting with project sponsor');
    }

    if (evm.cpi < 0.8) {
      recommendations.push('CRITICAL: Halt non-essential spending and reassess project scope');
      recommendations.push('Consider project pivot or phase-based delivery to reduce risk');
    }

    if (evm.tcpi > 1.1) {
      recommendations.push(`Remaining work requires ${((evm.tcpi - 1) * 100).toFixed(0)}% better cost performance to stay on budget`);
      recommendations.push('Negotiate resource rates or optimize processes to improve efficiency');
    }

    let confidenceReason = '';
    if (confidence >= 80) {
      confidenceReason = 'High confidence based on project maturity and stable CPI';
    } else if (confidence >= 60) {
      confidenceReason = 'Moderate confidence - some risk factors present';
    } else {
      confidenceReason = 'Low confidence - significant uncertainty in forecast';
    }

    return {
      projectId: project.id,
      projectName: project.name,
      currentBudget,
      currentSpent,
      percentComplete,
      forecastedCompletion: evm.estimateAtCompletion,
      forecastedVariance: evm.varianceAtCompletion,
      forecastedVariancePercent: evm.varianceAtCompletionPercent,
      confidence: Math.max(0, confidence),
      confidenceReason,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Calculate value realization metrics (ROI tracking)
   */
  async calculateValueRealization(projectId: string): Promise<ValueRealizationMetrics> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Extract expected values
    const expectedROI = parseFloat(project.expectedRoi || '0');
    const expectedCostSavings = parseFloat((project as any).expectedCostSavings || '0');
    const expectedRevenueImpact = parseFloat((project as any).expectedRevenueImpact || '0');

    // Extract realized values
    const realizedROI = parseFloat((project as any).actualValueRealized || '0');
    const realizedCostSavings = parseFloat((project as any).actualCostSavings || '0');
    const realizedRevenueImpact = parseFloat((project as any).actualRevenueImpact || '0');

    // Calculate variance
    const roiVariance = realizedROI - expectedROI;
    const roiVariancePercent = expectedROI > 0 ? (roiVariance / expectedROI) * 100 : 0;

    // Calculate value realization percentage
    const valueRealizationPercent = expectedROI > 0 ? (realizedROI / expectedROI) * 100 : 0;

    // Timeline calculations
    const daysIntoProject = this.calculateDaysIntoProject(project);
    const expectedDaysToComplete = this.calculateProjectDuration(project);
    const percentThroughTimeline = expectedDaysToComplete > 0 ? (daysIntoProject / expectedDaysToComplete) * 100 : 0;

    // Value leakage = Expected value at this point in timeline - Realized value
    const expectedValueAtThisPoint = expectedROI * (percentThroughTimeline / 100);
    const valueLeakage = expectedValueAtThisPoint - realizedROI;

    // Determine if on track
    // Value should be proportional to timeline progress
    const isOnTrack = valueRealizationPercent >= (percentThroughTimeline * 0.8); // 80% threshold

    let severity: 'healthy' | 'at-risk' | 'critical' = 'healthy';
    if (valueRealizationPercent < 50 && percentThroughTimeline > 50) {
      severity = 'critical';
    } else if (valueRealizationPercent < 70 && percentThroughTimeline > 50) {
      severity = 'at-risk';
    }

    return {
      projectId: project.id,
      projectName: project.name,
      expectedROI,
      expectedCostSavings,
      expectedRevenueImpact,
      realizedROI,
      realizedCostSavings,
      realizedRevenueImpact,
      roiVariance,
      roiVariancePercent,
      valueRealizationPercent,
      daysIntoProject,
      expectedDaysToComplete,
      percentThroughTimeline,
      isOnTrack,
      valueLeakage,
      severity,
    };
  }

  /**
   * Calculate cost attribution across resources, phases, and categories
   */
  async calculateCostAttribution(projectId: string): Promise<CostAttributionResult> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const totalCost = parseFloat(project.budgetSpent || '0');

    // Get resources
    const resources = await this.storage.getResources(projectId);

    // Calculate resource costs
    const resourceCosts = resources.map((resource: any) => {
      const allocationPercent = parseFloat(resource.allocation || '100');
      const hoursWorked = parseFloat(resource.hoursWorked || '0');
      const hourlyRate = parseFloat(resource.hourlyRate || resource.costRate || '0');
      const cost = hoursWorked * hourlyRate;

      return {
        resourceId: resource.id,
        resourceName: resource.name,
        allocationPercent,
        cost,
        hoursWorked,
        hourlyRate,
      };
    });

    const totalResourceCost = resourceCosts.reduce((sum, r) => sum + r.cost, 0);

    // Calculate category costs (example - would be more sophisticated in production)
    const laborCost = totalResourceCost;
    const materialCost = totalCost * 0.15; // Example: 15% materials
    const softwareCost = totalCost * 0.10; // Example: 10% software
    const infrastructureCost = totalCost * 0.08; // Example: 8% infrastructure
    const vendorCost = totalCost * 0.05; // Example: 5% vendors
    const overheadCost = totalCost - (laborCost + materialCost + softwareCost + infrastructureCost + vendorCost);

    // Get milestones for phase costs
    const milestones = await this.storage.getMilestones(projectId);

    // Calculate phase costs (distribute total cost across milestones)
    const phaseCosts = milestones.map(milestone => {
      // In production, this would use actual phase budgets and spend tracking
      const phaseBudget = totalCost / milestones.length;
      const phaseSpent = phaseBudget * 0.9; // Example

      return {
        phaseId: milestone.id,
        phaseName: milestone.name,
        budgeted: phaseBudget,
        spent: phaseSpent,
        variance: phaseSpent - phaseBudget,
      };
    });

    return {
      projectId: project.id,
      projectName: project.name,
      totalCost,
      laborCost,
      materialCost,
      softwareCost,
      infrastructureCost,
      vendorCost,
      overheadCost,
      resourceCosts,
      phaseCosts,
    };
  }

  /**
   * Analyze portfolio-level budget health
   */
  async analyzePortfolioBudget(portfolioId: string): Promise<PortfolioBudgetAnalysis> {
    const portfolio = await this.storage.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // Get all projects in portfolio
    const allProjects = await this.storage.getProjects();
    const portfolioProjects = allProjects.filter(p => p.portfolioId === portfolioId);

    // Calculate aggregates
    const totalBudget = portfolioProjects.reduce((sum, p) => sum + parseFloat(p.budgetTotal || '0'), 0);
    const totalSpent = portfolioProjects.reduce((sum, p) => sum + parseFloat(p.budgetSpent || '0'), 0);

    // Calculate EVM metrics for each project
    const evmResults = await Promise.all(
      portfolioProjects.map(p => this.calculateEVM(p.id))
    );

    const averageCPI = evmResults.reduce((sum, evm) => sum + evm.cpi, 0) / evmResults.length;
    const averageSPI = evmResults.reduce((sum, evm) => sum + evm.spi, 0) / evmResults.length;

    const projectsOverBudget = evmResults.filter(evm => evm.isOverBudget).length;
    const projectsBehindSchedule = evmResults.filter(evm => evm.isBehindSchedule).length;

    // Calculate total forecasted spend
    const totalForecasted = evmResults.reduce((sum, evm) => sum + evm.estimateAtCompletion, 0);

    // Health distribution
    const healthy = evmResults.filter(evm => evm.severity === 'healthy').length;
    const atRisk = evmResults.filter(evm => evm.severity === 'at-risk').length;
    const critical = evmResults.filter(evm => evm.severity === 'critical').length;

    // Top budget risks
    const topBudgetRisks = portfolioProjects
      .map((project, index) => ({
        projectId: project.id,
        projectName: project.name,
        budgetVariance: evmResults[index].varianceAtCompletion,
        severity: evmResults[index].severity,
      }))
      .sort((a, b) => a.budgetVariance - b.budgetVariance)
      .slice(0, 5);

    // Portfolio recommendations
    const portfolioRecommendations: string[] = [];

    if (critical > 0) {
      portfolioRecommendations.push(`URGENT: ${critical} projects are in critical budget status - immediate review required`);
    }

    if (averageCPI < 0.9) {
      portfolioRecommendations.push(`Portfolio CPI is ${averageCPI.toFixed(2)} - consider rebalancing resources across projects`);
    }

    if (totalForecasted > totalBudget * 1.1) {
      const overrun = ((totalForecasted / totalBudget - 1) * 100).toFixed(0);
      portfolioRecommendations.push(`Portfolio forecasted to exceed budget by ${overrun}% - contingency planning needed`);
    }

    return {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      totalBudget,
      totalSpent,
      totalForecasted,
      averageCPI,
      averageSPI,
      projectsOverBudget,
      projectsBehindSchedule,
      totalProjects: portfolioProjects.length,
      healthDistribution: {
        healthy,
        atRisk,
        critical,
      },
      topBudgetRisks,
      portfolioRecommendations,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private calculateDaysIntoProject(project: Project): number {
    if (!project.startDate) return 0;

    const start = new Date(project.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  private calculateProjectDuration(project: Project): number {
    if (!project.startDate || !project.endDate) return 365; // Default 1 year

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
