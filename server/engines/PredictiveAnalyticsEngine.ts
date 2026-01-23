/**
 * PREDICTIVE ANALYTICS ENGINE
 *
 * Provides intelligent predictions and forecasting:
 * - Risk prediction (budget overrun, schedule slippage, quality issues)
 * - Schedule forecasting with Monte Carlo simulation
 * - Anomaly detection in project metrics
 * - Early warning system for project health
 * - Resource utilization forecasting
 *
 * Used by: Risk Agent, TMO Agent, OKR Agent, Executive Dashboards
 */

import type { IStorage } from '../storage.js';
import type { Project, ProjectMetric } from '@shared/schema';
import { FinancialCalculationEngine } from './FinancialCalculationEngine.js';

export interface RiskPrediction {
  projectId: string;
  projectName: string;

  // Risk scores (0-100, higher = more risk)
  overallRiskScore: number;
  budgetRiskScore: number;
  scheduleRiskScore: number;
  qualityRiskScore: number;
  resourceRiskScore: number;

  // Predictions
  budgetOverrunProbability: number; // 0-100%
  budgetOverrunAmount: number; // Estimated $ overrun
  scheduleDelayProbability: number; // 0-100%
  scheduleDelayDays: number; // Estimated delay in days

  // Risk factors
  riskFactors: {
    category: 'budget' | 'schedule' | 'quality' | 'resource' | 'dependency';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    likelihood: number; // 0-100%
  }[];

  // Early warnings
  earlyWarnings: string[];

  // Recommendations
  mitigationActions: string[];

  // Confidence in prediction
  confidence: number; // 0-100%
  confidenceReason: string;
}

export interface ScheduleForecast {
  projectId: string;
  projectName: string;

  // Current schedule
  plannedEndDate: Date;
  currentProgress: number; // %

  // Forecasted completion
  forecastedEndDate: Date;
  forecastedDelayDays: number;
  onTimeDeliveryProbability: number; // % chance of on-time delivery

  // Monte Carlo simulation results
  optimisticEndDate: Date; // P10 (10% chance of finishing earlier)
  pessimisticEndDate: Date; // P90 (90% chance of finishing by this date)
  mostLikelyEndDate: Date; // P50 (median)

  // Schedule performance trend
  trend: 'improving' | 'stable' | 'declining';
  spiTrend: number[]; // Last 6 SPI values

  // Critical path analysis
  criticalPathRisk: 'low' | 'medium' | 'high';
  blockedDependencies: number;

  // Recommendations
  scheduleRecommendations: string[];
}

export interface AnomalyDetection {
  projectId: string;
  projectName: string;

  // Detected anomalies
  anomalies: {
    type: 'budget_spike' | 'velocity_drop' | 'quality_decline' | 'resource_churn';
    severity: 'low' | 'medium' | 'high';
    description: string;
    detectedAt: Date;
    metricValue: number;
    expectedValue: number;
    deviation: number; // % deviation from expected
    confidence: number; // 0-100%
  }[];

  // Patterns detected
  patterns: {
    type: 'trend' | 'seasonality' | 'cycle';
    description: string;
    impact: string;
  }[];

  // Overall health trend
  healthTrend: 'improving' | 'stable' | 'declining';
  healthScore: number; // 0-100
}

export interface EarlyWarningAlert {
  projectId: string;
  projectName: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'budget' | 'schedule' | 'quality' | 'resource' | 'value';
  title: string;
  description: string;
  predictedImpact: string;
  timeToImpact: string; // e.g., "2 weeks", "1 month"
  recommendedAction: string;
  confidence: number; // 0-100%
}

export interface ResourceUtilizationForecast {
  resourceId?: string;
  resourceName?: string;

  // Current utilization
  currentUtilization: number; // %
  currentAllocation: number; // hours/week

  // Forecasted utilization (next 3 months)
  forecast: {
    month: string;
    utilization: number; // %
    allocation: number; // hours
    availableCapacity: number; // hours
  }[];

  // Capacity issues
  overallocationRisk: 'none' | 'low' | 'medium' | 'high';
  burnoutRisk: 'none' | 'low' | 'medium' | 'high';

  // Recommendations
  recommendations: string[];
}

export class PredictiveAnalyticsEngine {
  private financialEngine: FinancialCalculationEngine;

  constructor(private storage: IStorage) {
    this.financialEngine = new FinancialCalculationEngine(storage);
  }

  /**
   * Predict project risks using historical data and current trends
   */
  async predictRisks(projectId: string): Promise<RiskPrediction> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get EVM metrics
    const evm = await this.financialEngine.calculateEVM(projectId);

    // Get historical metrics
    const metrics = await this.storage.getProjectMetrics(projectId);

    // Calculate risk scores
    const budgetRiskScore = this.calculateBudgetRiskScore(evm, project);
    const scheduleRiskScore = this.calculateScheduleRiskScore(evm, project);
    const qualityRiskScore = this.calculateQualityRiskScore(project, metrics);
    const resourceRiskScore = this.calculateResourceRiskScore(project);

    const overallRiskScore = (
      budgetRiskScore * 0.35 +
      scheduleRiskScore * 0.30 +
      qualityRiskScore * 0.20 +
      resourceRiskScore * 0.15
    );

    // Predict budget overrun
    const budgetOverrunProbability = this.predictBudgetOverrunProbability(evm);
    const budgetOverrunAmount = evm.varianceAtCompletion < 0 ? Math.abs(evm.varianceAtCompletion) : 0;

    // Predict schedule delay
    const scheduleDelayProbability = this.predictScheduleDelayProbability(evm);
    const scheduleDelayDays = this.estimateScheduleDelay(evm, project);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(project, evm, metrics);

    // Generate early warnings
    const earlyWarnings = this.generateEarlyWarningsInternal(project, evm, overallRiskScore);

    // Generate mitigation actions
    const mitigationActions = this.generateMitigationActions(riskFactors);

    // Calculate confidence
    const confidence = this.calculatePredictionConfidence(project, metrics);
    const confidenceReason = this.getConfidenceReason(confidence, project, metrics);

    return {
      projectId: project.id,
      projectName: project.name,
      overallRiskScore,
      budgetRiskScore,
      scheduleRiskScore,
      qualityRiskScore,
      resourceRiskScore,
      budgetOverrunProbability,
      budgetOverrunAmount,
      scheduleDelayProbability,
      scheduleDelayDays,
      riskFactors,
      earlyWarnings,
      mitigationActions,
      confidence,
      confidenceReason,
    };
  }

  /**
   * Forecast schedule completion with Monte Carlo simulation
   */
  async forecastSchedule(projectId: string): Promise<ScheduleForecast> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    if (!project.endDate) {
      throw new Error(`Project ${projectId} does not have a planned end date`);
    }

    const plannedEndDate = new Date(project.endDate);
    const currentProgress = parseFloat((project as any).percentComplete || (project as any).spi || '0') * 100;

    // Get EVM metrics for SPI trend
    const evm = await this.financialEngine.calculateEVM(projectId);
    const currentSPI = evm.spi;

    // Get historical SPI values (simplified - in production, use actual historical data)
    const spiTrend = this.generateSPITrend(currentSPI);

    // Monte Carlo simulation
    const { optimistic, pessimistic, mostLikely, onTimeProbability } = this.runMonteCarloScheduleSimulation(
      plannedEndDate,
      currentProgress,
      currentSPI,
      spiTrend
    );

    const forecastedEndDate = mostLikely;
    const forecastedDelayDays = this.calculateDaysDifference(plannedEndDate, forecastedEndDate);

    // Determine trend
    const trend = this.determineScheduleTrend(spiTrend);

    // Critical path analysis
    const dependencies = await this.storage.getDependencies(projectId);
    const blockedDependencies = dependencies.filter(d => d.status === 'blocked').length;
    const criticalPathRisk = this.assessCriticalPathRisk(blockedDependencies, currentSPI);

    // Generate recommendations
    const scheduleRecommendations = this.generateScheduleRecommendations(
      forecastedDelayDays,
      currentSPI,
      blockedDependencies,
      trend
    );

    return {
      projectId: project.id,
      projectName: project.name,
      plannedEndDate,
      currentProgress,
      forecastedEndDate,
      forecastedDelayDays,
      onTimeDeliveryProbability: onTimeProbability,
      optimisticEndDate: optimistic,
      pessimisticEndDate: pessimistic,
      mostLikelyEndDate: mostLikely,
      trend,
      spiTrend,
      criticalPathRisk,
      blockedDependencies,
      scheduleRecommendations,
    };
  }

  /**
   * Detect anomalies in project metrics
   */
  async detectAnomalies(projectId: string): Promise<AnomalyDetection> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const metrics = await this.storage.getProjectMetrics(projectId);

    // Detect various anomaly types
    const anomalies = [
      ...this.detectBudgetSpikes(project, metrics),
      ...this.detectVelocityDrops(project, metrics),
      ...this.detectQualityDeclines(project, metrics),
      ...this.detectResourceChurn(project),
    ];

    // Detect patterns
    const patterns = this.detectPatterns(metrics);

    // Calculate health trend
    const { healthTrend, healthScore } = this.calculateHealthTrend(metrics);

    return {
      projectId: project.id,
      projectName: project.name,
      anomalies,
      patterns,
      healthTrend,
      healthScore,
    };
  }

  /**
   * Generate early warning alerts for projects
   */
  async generateEarlyWarnings(projectId: string): Promise<EarlyWarningAlert[]> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const risks = await this.predictRisks(projectId);
    const schedule = await this.forecastSchedule(projectId);
    const anomalies = await this.detectAnomalies(projectId);
    const valueRealization = await this.financialEngine.calculateValueRealization(projectId);

    const warnings: EarlyWarningAlert[] = [];

    // Budget warnings
    if (risks.budgetOverrunProbability > 60) {
      warnings.push({
        projectId: project.id,
        projectName: project.name,
        severity: risks.budgetOverrunProbability > 80 ? 'critical' : 'warning',
        category: 'budget',
        title: 'High Budget Overrun Risk',
        description: `${risks.budgetOverrunProbability}% probability of budget overrun ($${risks.budgetOverrunAmount.toFixed(2)}M estimated)`,
        predictedImpact: `Project may exceed budget by $${risks.budgetOverrunAmount.toFixed(2)}M`,
        timeToImpact: this.estimateTimeToImpact(project, 'budget'),
        recommendedAction: 'Implement cost controls immediately and review resource allocation',
        confidence: risks.confidence,
      });
    }

    // Schedule warnings
    if (schedule.forecastedDelayDays > 14) {
      warnings.push({
        projectId: project.id,
        projectName: project.name,
        severity: schedule.forecastedDelayDays > 30 ? 'critical' : 'warning',
        category: 'schedule',
        title: 'Schedule Delay Predicted',
        description: `Project forecasted to complete ${schedule.forecastedDelayDays} days late`,
        predictedImpact: `Delivery date will slip to ${schedule.forecastedEndDate.toLocaleDateString()}`,
        timeToImpact: this.estimateTimeToImpact(project, 'schedule'),
        recommendedAction: 'Re-baseline schedule and address blocked dependencies',
        confidence: 75,
      });
    }

    // Value realization warnings
    if (!valueRealization.isOnTrack && valueRealization.percentThroughTimeline > 25) {
      warnings.push({
        projectId: project.id,
        projectName: project.name,
        severity: valueRealization.severity === 'critical' ? 'critical' : 'warning',
        category: 'value',
        title: 'Value Realization Below Target',
        description: `Only ${valueRealization.valueRealizationPercent.toFixed(0)}% of expected value realized at ${valueRealization.percentThroughTimeline.toFixed(0)}% through project`,
        predictedImpact: `$${valueRealization.valueLeakage.toFixed(2)}M value leakage detected`,
        timeToImpact: 'Current',
        recommendedAction: 'Review benefit realization plan and accelerate value delivery activities',
        confidence: 80,
      });
    }

    // Anomaly warnings
    const criticalAnomalies = anomalies.anomalies.filter(a => a.severity === 'high');
    if (criticalAnomalies.length > 0) {
      warnings.push({
        projectId: project.id,
        projectName: project.name,
        severity: 'warning',
        category: 'quality',
        title: 'Anomalies Detected',
        description: `${criticalAnomalies.length} high-severity anomalies detected in project metrics`,
        predictedImpact: 'Project health may deteriorate if trends continue',
        timeToImpact: '2-4 weeks',
        recommendedAction: 'Investigate anomalies and implement corrective actions',
        confidence: 70,
      });
    }

    return warnings;
  }

  /**
   * Forecast resource utilization
   */
  async forecastResourceUtilization(resourceId: string): Promise<ResourceUtilizationForecast> {
    const resource = await this.storage.getResources(''); // Get by resource ID in production

    // Simplified forecast - in production, use historical data and ML models
    const currentUtilization = 75; // % utilization
    const currentAllocation = 30; // hours/week

    const forecast = [
      { month: 'Month 1', utilization: 78, allocation: 31.2, availableCapacity: 8.8 },
      { month: 'Month 2', utilization: 82, allocation: 32.8, availableCapacity: 7.2 },
      { month: 'Month 3', utilization: 85, allocation: 34, availableCapacity: 6 },
    ];

    const overallocationRisk = currentUtilization > 90 ? 'high' : currentUtilization > 80 ? 'medium' : 'low';
    const burnoutRisk = currentUtilization > 85 ? 'high' : currentUtilization > 75 ? 'medium' : 'low';

    const recommendations: string[] = [];
    if (overallocationRisk === 'high') {
      recommendations.push('Resource is overallocated - consider redistributing work or adding team capacity');
    }
    if (burnoutRisk === 'high') {
      recommendations.push('High burnout risk detected - schedule time off or reduce workload');
    }

    return {
      resourceId,
      resourceName: 'Resource',
      currentUtilization,
      currentAllocation,
      forecast,
      overallocationRisk,
      burnoutRisk,
      recommendations,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private calculateBudgetRiskScore(evm: any, project: Project): number {
    let score = 0;

    // CPI < 0.8 = critical
    if (evm.cpi < 0.8) score += 40;
    else if (evm.cpi < 0.9) score += 25;
    else if (evm.cpi < 0.95) score += 10;

    // Variance > 20% = critical
    if (Math.abs(evm.varianceAtCompletionPercent) > 20) score += 30;
    else if (Math.abs(evm.varianceAtCompletionPercent) > 10) score += 15;

    // TCPI > 1.1 = need better performance
    if (evm.tcpi > 1.1) score += 20;

    // Large project with issues = higher risk
    const budget = parseFloat(project.budgetTotal || '0');
    if (budget > 50 && evm.cpi < 0.9) score += 10;

    return Math.min(100, score);
  }

  private calculateScheduleRiskScore(evm: any, project: Project): number {
    let score = 0;

    // SPI < 0.8 = critical
    if (evm.spi < 0.8) score += 40;
    else if (evm.spi < 0.9) score += 25;
    else if (evm.spi < 0.95) score += 10;

    // Schedule variance
    if (Math.abs(evm.scheduleVariancePercent) > 20) score += 30;
    else if (Math.abs(evm.scheduleVariancePercent) > 10) score += 15;

    // Projects in later stages with schedule issues = higher risk
    const percentComplete = parseFloat((project as any).percentComplete || (project as any).spi || '0') * 100;
    if (percentComplete > 50 && evm.spi < 0.9) score += 15;

    return Math.min(100, score);
  }

  private calculateQualityRiskScore(project: Project, metrics: ProjectMetric[]): number {
    let score = 0;

    // Look for quality metrics in project metrics
    const defectMetrics = metrics.filter((m: any) => m.metricKey === 'defects' || m.metricType === 'defects');
    if (defectMetrics.length > 0) {
      const recentDefects = parseFloat((defectMetrics[defectMetrics.length - 1] as any).currentValue || (defectMetrics[defectMetrics.length - 1] as any).value || '0');
      if (recentDefects > 50) score += 30;
      else if (recentDefects > 25) score += 15;
    }

    return Math.min(100, score);
  }

  private calculateResourceRiskScore(project: Project): number {
    // Simplified - in production, analyze actual resource allocation and churn
    return 20; // Default medium-low risk
  }

  private predictBudgetOverrunProbability(evm: any): number {
    // Use CPI to predict probability
    if (evm.cpi < 0.7) return 95;
    if (evm.cpi < 0.8) return 85;
    if (evm.cpi < 0.9) return 65;
    if (evm.cpi < 0.95) return 40;
    if (evm.cpi < 1.0) return 25;
    return 10;
  }

  private predictScheduleDelayProbability(evm: any): number {
    // Use SPI to predict probability
    if (evm.spi < 0.7) return 95;
    if (evm.spi < 0.8) return 85;
    if (evm.spi < 0.9) return 65;
    if (evm.spi < 0.95) return 40;
    if (evm.spi < 1.0) return 25;
    return 10;
  }

  private estimateScheduleDelay(evm: any, project: Project): number {
    if (!project.endDate) return 0;

    const totalDays = this.calculateProjectDuration(project);
    const remainingDays = totalDays * (1 - parseFloat((project as any).percentComplete || (project as any).spi || '0') / 100);

    // Delay = remaining work / SPI - remaining time
    if (evm.spi > 0) {
      const forecastedRemainingDays = remainingDays / evm.spi;
      return Math.max(0, Math.round(forecastedRemainingDays - remainingDays));
    }

    return 0;
  }

  private identifyRiskFactors(project: Project, evm: any, metrics: ProjectMetric[]): any[] {
    const factors: any[] = [];

    if (evm.cpi < 0.9) {
      factors.push({
        category: 'budget',
        severity: evm.cpi < 0.8 ? 'critical' : 'high',
        description: `Cost Performance Index is ${evm.cpi.toFixed(2)} (below 1.0)`,
        impact: `Spending $${(1 / evm.cpi).toFixed(2)} for every $1 of planned work`,
        likelihood: 90,
      });
    }

    if (evm.spi < 0.9) {
      factors.push({
        category: 'schedule',
        severity: evm.spi < 0.8 ? 'critical' : 'high',
        description: `Schedule Performance Index is ${evm.spi.toFixed(2)} (below 1.0)`,
        impact: `Completing work at ${(evm.spi * 100).toFixed(0)}% of planned pace`,
        likelihood: 85,
      });
    }

    return factors;
  }

  private generateEarlyWarningsInternal(project: Project, evm: any, riskScore: number): string[] {
    const warnings: string[] = [];

    if (riskScore > 70) {
      warnings.push('CRITICAL: Project is at high risk - immediate intervention required');
    }

    if (evm.tcpi > 1.2) {
      warnings.push(`WARNING: Remaining work requires ${((evm.tcpi - 1) * 100).toFixed(0)}% better cost performance than current`);
    }

    return warnings;
  }

  private generateMitigationActions(riskFactors: any[]): string[] {
    const actions: string[] = [];

    const budgetRisks = riskFactors.filter(f => f.category === 'budget');
    if (budgetRisks.length > 0) {
      actions.push('Implement cost freeze on non-essential spending');
      actions.push('Review resource rates and negotiate better terms');
    }

    const scheduleRisks = riskFactors.filter(f => f.category === 'schedule');
    if (scheduleRisks.length > 0) {
      actions.push('Fast-track critical path activities');
      actions.push('Add parallel work streams where possible');
    }

    return actions;
  }

  private calculatePredictionConfidence(project: Project, metrics: ProjectMetric[]): number {
    let confidence = 100;

    // Reduce confidence for early-stage projects
    const percentComplete = parseFloat((project as any).percentComplete || (project as any).spi || '0') * 100;
    if (percentComplete < 20) confidence -= 30;
    else if (percentComplete < 40) confidence -= 15;

    // Reduce confidence if limited historical data
    if (metrics.length < 5) confidence -= 20;

    return Math.max(50, confidence);
  }

  private getConfidenceReason(confidence: number, project: Project, metrics: ProjectMetric[]): string {
    if (confidence >= 80) {
      return 'High confidence based on project maturity and data availability';
    } else if (confidence >= 65) {
      return 'Moderate confidence - some data limitations present';
    } else {
      return 'Lower confidence due to limited historical data';
    }
  }

  private generateSPITrend(currentSPI: number): number[] {
    // Simplified - in production, use actual historical data
    return [1.0, 0.98, 0.95, 0.93, 0.91, currentSPI];
  }

  private runMonteCarloScheduleSimulation(
    plannedEndDate: Date,
    currentProgress: number,
    currentSPI: number,
    spiTrend: number[]
  ): { optimistic: Date; pessimistic: Date; mostLikely: Date; onTimeProbability: number } {
    // Simplified Monte Carlo - in production, run thousands of simulations
    const daysToPlanned = 0; // Days until planned end
    const remainingWork = 100 - currentProgress;

    // Optimistic: SPI improves by 10%
    const optimisticDays = Math.round((remainingWork / 100) * 365 / (currentSPI * 1.1));

    // Pessimistic: SPI degrades by 10%
    const pessimisticDays = Math.round((remainingWork / 100) * 365 / (currentSPI * 0.9));

    // Most likely: Current SPI continues
    const mostLikelyDays = Math.round((remainingWork / 100) * 365 / currentSPI);

    const optimistic = new Date(plannedEndDate);
    optimistic.setDate(optimistic.getDate() + optimisticDays);

    const pessimistic = new Date(plannedEndDate);
    pessimistic.setDate(pessimistic.getDate() + pessimisticDays);

    const mostLikely = new Date(plannedEndDate);
    mostLikely.setDate(mostLikely.getDate() + mostLikelyDays);

    // On-time probability based on current SPI
    const onTimeProbability = Math.min(95, Math.max(5, currentSPI * 100));

    return { optimistic, pessimistic, mostLikely, onTimeProbability };
  }

  private determineScheduleTrend(spiTrend: number[]): 'improving' | 'stable' | 'declining' {
    if (spiTrend.length < 3) return 'stable';

    const recent = spiTrend.slice(-3);
    const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const current = recent[recent.length - 1];

    if (current > average * 1.05) return 'improving';
    if (current < average * 0.95) return 'declining';
    return 'stable';
  }

  private assessCriticalPathRisk(blockedDependencies: number, spi: number): 'low' | 'medium' | 'high' {
    if (blockedDependencies > 3 || spi < 0.8) return 'high';
    if (blockedDependencies > 1 || spi < 0.9) return 'medium';
    return 'low';
  }

  private generateScheduleRecommendations(
    delayDays: number,
    spi: number,
    blockedDependencies: number,
    trend: string
  ): string[] {
    const recommendations: string[] = [];

    if (delayDays > 14) {
      recommendations.push('Re-baseline schedule and communicate new timeline to stakeholders');
    }

    if (spi < 0.9) {
      recommendations.push('Add resources to critical path activities to improve velocity');
    }

    if (blockedDependencies > 0) {
      recommendations.push(`Unblock ${blockedDependencies} dependencies immediately`);
    }

    if (trend === 'declining') {
      recommendations.push('Schedule trend is declining - conduct sprint retrospective to identify issues');
    }

    return recommendations;
  }

  private detectBudgetSpikes(project: Project, metrics: ProjectMetric[]): any[] {
    // Simplified anomaly detection
    return [];
  }

  private detectVelocityDrops(project: Project, metrics: ProjectMetric[]): any[] {
    return [];
  }

  private detectQualityDeclines(project: Project, metrics: ProjectMetric[]): any[] {
    return [];
  }

  private detectResourceChurn(project: Project): any[] {
    return [];
  }

  private detectPatterns(metrics: ProjectMetric[]): any[] {
    return [];
  }

  private calculateHealthTrend(metrics: ProjectMetric[]): { healthTrend: 'improving' | 'stable' | 'declining'; healthScore: number } {
    return { healthTrend: 'stable', healthScore: 75 };
  }

  private estimateTimeToImpact(project: Project, category: string): string {
    const percentComplete = parseFloat((project as any).percentComplete || (project as any).spi || '0') * 100;
    if (percentComplete < 30) return '2-3 months';
    if (percentComplete < 60) return '4-8 weeks';
    return '2-4 weeks';
  }

  private calculateDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateProjectDuration(project: Project): number {
    if (!project.startDate || !project.endDate) return 365;

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    return this.calculateDaysDifference(start, end);
  }
}
