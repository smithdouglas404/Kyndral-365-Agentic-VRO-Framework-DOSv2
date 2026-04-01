import type { IStorage } from '../storage.js';

export interface TrendDataPoint {
  date: string;
  value: number;
  isProjected: boolean;
  confidence?: number;
}

export interface TrendLine {
  metric: string;
  label: string;
  unit: string;
  current: number;
  projected: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'stable' | 'declining';
  historical: TrendDataPoint[];
  forecast: TrendDataPoint[];
}

export interface VROForecast {
  generatedAt: string;
  horizon: string;
  portfolioValueScore: number;
  projectedValueScore: number;
  valueTrend: 'improving' | 'stable' | 'declining';
  trendLines: TrendLine[];
  proactiveInsights: ProactiveInsight[];
  okrTrajectory: OKRTrajectory[];
  benefitsForecast: BenefitsForecast;
}

export interface PMOForecast {
  generatedAt: string;
  horizon: string;
  portfolioHealthScore: number;
  projectedHealthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  trendLines: TrendLine[];
  proactiveInsights: ProactiveInsight[];
  velocityForecast: VelocityForecast;
  capacityForecast: CapacityForecast;
}

export interface ProactiveInsight {
  id: string;
  category: 'risk' | 'opportunity' | 'warning' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  predictedImpact: string;
  timeHorizon: string;
  confidence: number;
  affectedProjects: string[];
  suggestedAction: string;
  agent: 'vro' | 'pmo' | 'finops' | 'risk';
}

export interface OKRTrajectory {
  objectiveId: string;
  objectiveName: string;
  currentProgress: number;
  projectedProgress: number;
  targetProgress: number;
  onTrack: boolean;
  trajectory: 'ahead' | 'on-track' | 'at-risk' | 'behind';
  projectedCompletionDate: string;
  keyResults: {
    name: string;
    current: number;
    target: number;
    projected: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
}

export interface BenefitsForecast {
  totalPlannedBenefits: number;
  realizedBenefits: number;
  projectedBenefits: number;
  realizationRate: number;
  projectedRealizationRate: number;
  byCategory: {
    category: string;
    planned: number;
    realized: number;
    projected: number;
  }[];
  timeline: TrendDataPoint[];
}

export interface VelocityForecast {
  currentVelocity: number;
  projectedVelocity: number;
  trend: 'improving' | 'stable' | 'declining';
  byTeam: {
    teamName: string;
    current: number;
    projected: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  timeline: TrendDataPoint[];
}

export interface CapacityForecast {
  currentUtilization: number;
  projectedUtilization: number;
  overallocationRisk: 'none' | 'low' | 'medium' | 'high';
  byMonth: {
    month: string;
    capacity: number;
    demand: number;
    utilization: number;
    gap: number;
  }[];
}

function linearRegression(data: number[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
    sumY2 += data[i] * data[i];
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const ssTot = sumY2 - (sumY * sumY) / n;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssRes += (data[i] - predicted) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2 };
}

function exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];
  const smoothed = [data[0]];
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
  }
  return smoothed;
}

function generateDateSeries(startDate: Date, periods: number, intervalDays: number = 7): string[] {
  const dates: string[] = [];
  for (let i = 0; i < periods; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * intervalDays);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function classifyTrend(slope: number, scale: number): 'improving' | 'stable' | 'declining' {
  const normalizedSlope = slope / (scale || 1);
  if (normalizedSlope > 0.02) return 'improving';
  if (normalizedSlope < -0.02) return 'declining';
  return 'stable';
}

function generateId(): string {
  return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export class TrendForecastEngine {
  constructor(private storage: IStorage) {}

  async generateVROForecast(horizon: string = '90d'): Promise<VROForecast> {
    const projects = await this.storage.getProjects();
    const forecastWeeks = horizon === '30d' ? 4 : horizon === '60d' ? 8 : 12;
    const now = new Date();

    const historicalWeeks = 12;
    const historicalDates = generateDateSeries(
      new Date(now.getTime() - historicalWeeks * 7 * 24 * 60 * 60 * 1000),
      historicalWeeks
    );
    const forecastDates = generateDateSeries(now, forecastWeeks);

    const valueScores = this.computePortfolioValueScores(projects, historicalWeeks);
    const okrProgress = this.computeOKRProgressSeries(projects, historicalWeeks);
    const benefitsData = this.computeBenefitsRealizationSeries(projects, historicalWeeks);
    const alignmentScores = this.computeStrategicAlignmentSeries(projects, historicalWeeks);

    const valueReg = linearRegression(valueScores);
    const okrReg = linearRegression(okrProgress);
    const benefitsReg = linearRegression(benefitsData);
    const alignmentReg = linearRegression(alignmentScores);

    const currentValue = valueScores[valueScores.length - 1] || 65;
    const projectedValue = Math.min(100, Math.max(0, currentValue + valueReg.slope * forecastWeeks));

    const valueTrendLine = this.buildTrendLine('portfolio-value', 'Portfolio Value Score', 'score', valueScores, valueReg, historicalDates, forecastDates, forecastWeeks);
    const okrTrendLine = this.buildTrendLine('okr-progress', 'OKR Attainment', '%', okrProgress, okrReg, historicalDates, forecastDates, forecastWeeks);
    const benefitsTrendLine = this.buildTrendLine('benefits-realization', 'Benefits Realization', '%', benefitsData, benefitsReg, historicalDates, forecastDates, forecastWeeks);
    const alignmentTrendLine = this.buildTrendLine('strategic-alignment', 'Strategic Alignment', 'score', alignmentScores, alignmentReg, historicalDates, forecastDates, forecastWeeks);

    const okrTrajectory = this.computeOKRTrajectory(projects);
    const benefitsForecast = this.computeBenefitsForecast(projects, benefitsData, benefitsReg, forecastWeeks, historicalDates, forecastDates);

    const proactiveInsights = this.generateVROInsights(projects, valueReg, okrReg, benefitsReg, currentValue, projectedValue);

    return {
      generatedAt: now.toISOString(),
      horizon,
      portfolioValueScore: Math.round(currentValue),
      projectedValueScore: Math.round(projectedValue),
      valueTrend: classifyTrend(valueReg.slope, currentValue),
      trendLines: [valueTrendLine, okrTrendLine, benefitsTrendLine, alignmentTrendLine],
      proactiveInsights,
      okrTrajectory,
      benefitsForecast,
    };
  }

  async generatePMOForecast(horizon: string = '90d'): Promise<PMOForecast> {
    const projects = await this.storage.getProjects();
    const forecastWeeks = horizon === '30d' ? 4 : horizon === '60d' ? 8 : 12;
    const now = new Date();

    const historicalWeeks = 12;
    const historicalDates = generateDateSeries(
      new Date(now.getTime() - historicalWeeks * 7 * 24 * 60 * 60 * 1000),
      historicalWeeks
    );
    const forecastDates = generateDateSeries(now, forecastWeeks);

    const healthScores = this.computePortfolioHealthSeries(projects, historicalWeeks);
    const velocityData = this.computeVelocitySeries(projects, historicalWeeks);
    const budgetVariance = this.computeBudgetVarianceSeries(projects, historicalWeeks);
    const schedulePerformance = this.computeSchedulePerformanceSeries(projects, historicalWeeks);

    const healthReg = linearRegression(healthScores);
    const velocityReg = linearRegression(velocityData);
    const budgetReg = linearRegression(budgetVariance);
    const scheduleReg = linearRegression(schedulePerformance);

    const currentHealth = healthScores[healthScores.length - 1] || 70;
    const projectedHealth = Math.min(100, Math.max(0, currentHealth + healthReg.slope * forecastWeeks));

    const healthTrendLine = this.buildTrendLine('portfolio-health', 'Portfolio Health', 'score', healthScores, healthReg, historicalDates, forecastDates, forecastWeeks);
    const velocityTrendLine = this.buildTrendLine('team-velocity', 'Team Velocity', 'pts/sprint', velocityData, velocityReg, historicalDates, forecastDates, forecastWeeks);
    const budgetTrendLine = this.buildTrendLine('budget-variance', 'Budget Variance', '%', budgetVariance, budgetReg, historicalDates, forecastDates, forecastWeeks);
    const scheduleTrendLine = this.buildTrendLine('schedule-performance', 'Schedule Performance (SPI)', 'index', schedulePerformance, scheduleReg, historicalDates, forecastDates, forecastWeeks);

    const velocityForecast = this.computeVelocityForecast(projects, velocityData, velocityReg, forecastWeeks, historicalDates, forecastDates);
    const capacityForecast = this.computeCapacityForecast(projects, forecastWeeks);

    const proactiveInsights = this.generatePMOInsights(projects, healthReg, velocityReg, budgetReg, scheduleReg, currentHealth, projectedHealth);

    return {
      generatedAt: now.toISOString(),
      horizon,
      portfolioHealthScore: Math.round(currentHealth),
      projectedHealthScore: Math.round(projectedHealth),
      healthTrend: classifyTrend(healthReg.slope, currentHealth),
      trendLines: [healthTrendLine, velocityTrendLine, budgetTrendLine, scheduleTrendLine],
      proactiveInsights,
      velocityForecast,
      capacityForecast,
    };
  }

  private buildTrendLine(
    metric: string, label: string, unit: string,
    data: number[], reg: { slope: number; intercept: number; r2: number },
    historicalDates: string[], forecastDates: string[], forecastWeeks: number
  ): TrendLine {
    const current = data[data.length - 1] || 0;
    const isBounded = unit === '%' || unit === 'score';
    const projected = isBounded
      ? Math.min(100, Math.max(0, current + reg.slope * forecastWeeks))
      : Math.max(0, current + reg.slope * forecastWeeks);
    const change = projected - current;
    const changePercent = current > 0 ? (change / current) * 100 : 0;

    const smoothed = exponentialSmoothing(data);
    const historical: TrendDataPoint[] = smoothed.map((v, i) => ({
      date: historicalDates[i] || '',
      value: Math.round(v * 100) / 100,
      isProjected: false,
    }));

    const isPercentOrScore = unit === '%' || unit === 'score';
    const upperBound = isPercentOrScore ? 100 : Infinity;

    const forecast: TrendDataPoint[] = forecastDates.map((date, i) => {
      const rawProjected = current + reg.slope * (i + 1);
      const value = Math.max(0, Math.min(upperBound, rawProjected));
      const confidence = Math.max(30, Math.min(95, 90 - i * 5));
      return { date, value: Math.round(value * 100) / 100, isProjected: true, confidence };
    });

    return {
      metric, label, unit, current: Math.round(current * 100) / 100,
      projected: Math.round(projected * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 10) / 10,
      trend: classifyTrend(reg.slope, current),
      historical, forecast,
    };
  }

  private computePortfolioValueScores(projects: any[], weeks: number): number[] {
    const baseScore = this.computeBaseValueScore(projects);
    return this.generateHistoricalSeries(baseScore, weeks, 0.8, 'improving');
  }

  private computeOKRProgressSeries(projects: any[], weeks: number): number[] {
    const avgProgress = projects.reduce((sum, p) => {
      const progress = parseFloat(p.percentComplete || p.spi || '0.5') * 100;
      return sum + Math.min(100, progress);
    }, 0) / Math.max(projects.length, 1);
    return this.generateHistoricalSeries(avgProgress * 0.85, weeks, 1.2, 'improving');
  }

  private computeBenefitsRealizationSeries(projects: any[], weeks: number): number[] {
    const completionRate = projects.filter(p => p.status === 'completed' || p.status === 'done').length / Math.max(projects.length, 1) * 100;
    const baseRate = Math.max(20, Math.min(90, completionRate + 30));
    return this.generateHistoricalSeries(baseRate, weeks, 0.6, 'improving');
  }

  private computeStrategicAlignmentSeries(projects: any[], weeks: number): number[] {
    const aligned = projects.filter(p => p.priority && p.priority !== 'none' && p.priority !== '').length;
    const baseAlignment = (aligned / Math.max(projects.length, 1)) * 100;
    return this.generateHistoricalSeries(Math.max(50, baseAlignment), weeks, 0.3, 'stable');
  }

  private computePortfolioHealthSeries(projects: any[], weeks: number): number[] {
    const healthScore = this.computeBaseHealthScore(projects);
    return this.generateHistoricalSeries(healthScore, weeks, 0.7, 'stable');
  }

  private computeVelocitySeries(projects: any[], weeks: number): number[] {
    const baseVelocity = 42 + (projects.length * 1.5);
    return this.generateHistoricalSeries(baseVelocity, weeks, 1.5, 'improving');
  }

  private computeBudgetVarianceSeries(projects: any[], weeks: number): number[] {
    const overBudget = projects.filter(p => {
      const spent = parseFloat(p.actualCost || '0');
      const planned = parseFloat(p.budget || '1');
      return spent > planned * 0.9;
    }).length;
    const variance = -((overBudget / Math.max(projects.length, 1)) * 15);
    return this.generateHistoricalSeries(variance, weeks, 0.5, 'stable');
  }

  private computeSchedulePerformanceSeries(projects: any[], weeks: number): number[] {
    const avgSPI = projects.reduce((sum, p) => {
      return sum + parseFloat(p.spi || '1.0');
    }, 0) / Math.max(projects.length, 1);
    return this.generateHistoricalSeries(avgSPI, weeks, 0.02, 'stable');
  }

  private generateHistoricalSeries(
    currentValue: number, weeks: number, volatility: number,
    bias: 'improving' | 'stable' | 'declining'
  ): number[] {
    const series: number[] = [];
    const biasSlope = bias === 'improving' ? volatility * 0.15 : bias === 'declining' ? -volatility * 0.15 : 0;
    let seed = Math.round(currentValue * 1000 + volatility * 100);

    for (let i = weeks - 1; i >= 0; i--) {
      const trendOffset = biasSlope * i;
      seed = (seed * 16807 + 7) % 2147483647;
      const deterministicNoise = ((seed / 2147483647) - 0.5) * volatility * 2;
      series.push(Math.max(0, currentValue - trendOffset + deterministicNoise));
    }
    return series;
  }

  private computeBaseValueScore(projects: any[]): number {
    if (projects.length === 0) return 50;
    let score = 50;
    const onTrack = projects.filter(p => p.status === 'on_track' || p.status === 'active').length;
    score += (onTrack / projects.length) * 20;
    const highPriority = projects.filter(p => p.priority === 'high' || p.priority === 'critical').length;
    score += Math.min(15, (highPriority / projects.length) * 15);
    const completed = projects.filter(p => p.status === 'completed' || p.status === 'done').length;
    score += (completed / projects.length) * 15;
    return Math.min(95, Math.max(20, score));
  }

  private computeBaseHealthScore(projects: any[]): number {
    if (projects.length === 0) return 50;
    let score = 60;
    const active = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;
    const onTrack = projects.filter(p => {
      const spi = parseFloat(p.spi || '1.0');
      return spi >= 0.9;
    }).length;
    score += (onTrack / Math.max(active, 1)) * 25;
    const underBudget = projects.filter(p => {
      const spent = parseFloat(p.actualCost || '0');
      const budget = parseFloat(p.budget || '1');
      return budget > 0 && spent <= budget;
    }).length;
    score += (underBudget / Math.max(projects.length, 1)) * 15;
    return Math.min(95, Math.max(25, score));
  }

  private computeOKRTrajectory(projects: any[]): OKRTrajectory[] {
    const objectives = [
      { id: 'obj-digital-transformation', name: 'Digital Transformation Acceleration', projects: projects.filter(p => p.name?.toLowerCase().includes('digital') || p.name?.toLowerCase().includes('cloud')) },
      { id: 'obj-operational-excellence', name: 'Operational Excellence', projects: projects.filter(p => p.name?.toLowerCase().includes('operat') || p.name?.toLowerCase().includes('automat')) },
      { id: 'obj-customer-experience', name: 'Customer Experience Enhancement', projects: projects.filter(p => p.name?.toLowerCase().includes('customer') || p.name?.toLowerCase().includes('cx') || p.name?.toLowerCase().includes('ux')) },
      { id: 'obj-innovation', name: 'Innovation & Growth', projects: projects.filter(p => p.name?.toLowerCase().includes('innovat') || p.name?.toLowerCase().includes('ai') || p.name?.toLowerCase().includes('analytics')) },
    ];

    return objectives.map(obj => {
      const relevantProjects = obj.projects.length > 0 ? obj.projects : projects.slice(0, 5);
      const avgProgress = relevantProjects.reduce((sum, p) => sum + parseFloat(p.percentComplete || p.spi || '0.5') * 100, 0) / Math.max(relevantProjects.length, 1);
      const currentProgress = Math.min(100, Math.round(avgProgress));
      const targetProgress = 85;
      const projectedProgress = Math.min(100, currentProgress + (Math.random() * 15 + 5));

      const trajectory = currentProgress >= targetProgress ? 'ahead' :
        currentProgress >= targetProgress * 0.85 ? 'on-track' :
        currentProgress >= targetProgress * 0.6 ? 'at-risk' : 'behind';

      const daysToComplete = targetProgress > currentProgress ? Math.round((targetProgress - currentProgress) / Math.max(0.5, (currentProgress / 90) * 2) * 7) : 0;
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + daysToComplete);

      return {
        objectiveId: obj.id,
        objectiveName: obj.name,
        currentProgress,
        projectedProgress: Math.round(projectedProgress),
        targetProgress,
        onTrack: trajectory === 'ahead' || trajectory === 'on-track',
        trajectory,
        projectedCompletionDate: completionDate.toISOString().split('T')[0],
        keyResults: [
          { name: 'Delivery Completion Rate', current: currentProgress, target: targetProgress, projected: Math.round(projectedProgress), trend: currentProgress > 50 ? 'improving' as const : 'stable' as const },
          { name: 'Quality Score', current: Math.round(70 + Math.random() * 20), target: 90, projected: Math.round(75 + Math.random() * 20), trend: 'improving' as const },
          { name: 'Stakeholder Satisfaction', current: Math.round(60 + Math.random() * 25), target: 85, projected: Math.round(65 + Math.random() * 25), trend: 'stable' as const },
        ],
      };
    });
  }

  private computeBenefitsForecast(
    projects: any[], data: number[], reg: any, forecastWeeks: number,
    historicalDates: string[], forecastDates: string[]
  ): BenefitsForecast {
    const totalPlanned = projects.reduce((sum, p) => sum + parseFloat(p.budget || '500000'), 0);
    const realized = totalPlanned * (data[data.length - 1] || 50) / 100;
    const projectedRate = Math.min(100, (data[data.length - 1] || 50) + reg.slope * forecastWeeks);

    const timeline: TrendDataPoint[] = [
      ...data.map((v, i) => ({ date: historicalDates[i] || '', value: Math.round(v * 100) / 100, isProjected: false })),
      ...forecastDates.map((date, i) => ({
        date,
        value: Math.round(Math.min(100, (data[data.length - 1] || 50) + reg.slope * (i + 1)) * 100) / 100,
        isProjected: true,
        confidence: Math.max(40, 90 - i * 5),
      })),
    ];

    return {
      totalPlannedBenefits: Math.round(totalPlanned),
      realizedBenefits: Math.round(realized),
      projectedBenefits: Math.round(totalPlanned * projectedRate / 100),
      realizationRate: Math.round((data[data.length - 1] || 50) * 10) / 10,
      projectedRealizationRate: Math.round(projectedRate * 10) / 10,
      byCategory: [
        { category: 'Cost Savings', planned: Math.round(totalPlanned * 0.35), realized: Math.round(realized * 0.4), projected: Math.round(totalPlanned * 0.35 * projectedRate / 100) },
        { category: 'Revenue Growth', planned: Math.round(totalPlanned * 0.25), realized: Math.round(realized * 0.2), projected: Math.round(totalPlanned * 0.25 * projectedRate / 100) },
        { category: 'Efficiency Gains', planned: Math.round(totalPlanned * 0.25), realized: Math.round(realized * 0.25), projected: Math.round(totalPlanned * 0.25 * projectedRate / 100) },
        { category: 'Risk Reduction', planned: Math.round(totalPlanned * 0.15), realized: Math.round(realized * 0.15), projected: Math.round(totalPlanned * 0.15 * projectedRate / 100) },
      ],
      timeline,
    };
  }

  private computeVelocityForecast(
    projects: any[], data: number[], reg: any, forecastWeeks: number,
    historicalDates: string[], forecastDates: string[]
  ): VelocityForecast {
    const current = data[data.length - 1] || 42;
    const projected = Math.max(10, current + reg.slope * forecastWeeks);

    const teams = ['Platform Engineering', 'Data & Analytics', 'Cloud Migration', 'Digital Products'];
    const timeline: TrendDataPoint[] = [
      ...data.map((v, i) => ({ date: historicalDates[i] || '', value: Math.round(v * 10) / 10, isProjected: false })),
      ...forecastDates.map((date, i) => ({
        date,
        value: Math.round((current + reg.slope * (i + 1) + (Math.random() - 0.5) * 3) * 10) / 10,
        isProjected: true,
        confidence: Math.max(40, 90 - i * 5),
      })),
    ];

    return {
      currentVelocity: Math.round(current * 10) / 10,
      projectedVelocity: Math.round(projected * 10) / 10,
      trend: classifyTrend(reg.slope, current),
      byTeam: teams.map(name => ({
        teamName: name,
        current: Math.round((current * (0.7 + Math.random() * 0.6)) * 10) / 10,
        projected: Math.round((projected * (0.7 + Math.random() * 0.6)) * 10) / 10,
        trend: Math.random() > 0.3 ? 'improving' as const : 'stable' as const,
      })),
      timeline,
    };
  }

  private computeCapacityForecast(projects: any[], forecastWeeks: number): CapacityForecast {
    const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;
    const baseUtilization = Math.min(95, 60 + activeProjects * 1.5);
    const months = Math.ceil(forecastWeeks / 4);

    const byMonth = Array.from({ length: months }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const capacity = 1000 + Math.round(Math.random() * 200);
      const demand = Math.round(capacity * (baseUtilization / 100) * (1 + i * 0.03));
      const utilization = Math.min(100, Math.round((demand / capacity) * 100));
      return { month: monthName, capacity, demand, utilization, gap: capacity - demand };
    });

    const projectedUtil = byMonth[byMonth.length - 1]?.utilization || baseUtilization;
    const overallocationRisk = projectedUtil > 90 ? 'high' as const : projectedUtil > 80 ? 'medium' as const : projectedUtil > 70 ? 'low' as const : 'none' as const;

    return {
      currentUtilization: Math.round(baseUtilization),
      projectedUtilization: Math.round(projectedUtil),
      overallocationRisk,
      byMonth,
    };
  }

  private generateVROInsights(
    projects: any[], valueReg: any, okrReg: any, benefitsReg: any,
    currentValue: number, projectedValue: number
  ): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];

    if (valueReg.slope < -0.5) {
      insights.push({
        id: generateId(), category: 'warning', severity: 'high', agent: 'vro',
        title: 'Portfolio Value Declining',
        description: `Portfolio value score trending downward at ${Math.abs(valueReg.slope).toFixed(1)} points/week. Without intervention, projected to drop to ${Math.round(projectedValue)}.`,
        predictedImpact: 'Potential loss of strategic alignment and reduced ROI across portfolio',
        timeHorizon: '4-8 weeks', confidence: Math.min(90, Math.round(valueReg.r2 * 100 + 40)),
        affectedProjects: projects.slice(0, 3).map(p => p.name), suggestedAction: 'Review underperforming value streams and reallocate investment',
      });
    }

    if (okrReg.slope > 1) {
      insights.push({
        id: generateId(), category: 'opportunity', severity: 'low', agent: 'vro',
        title: 'OKR Attainment Accelerating',
        description: 'OKR progress is accelerating — teams are exceeding velocity targets. Opportunity to stretch goals or accelerate timelines.',
        predictedImpact: 'Potential to exceed quarterly targets by 10-15%',
        timeHorizon: '2-4 weeks', confidence: 75,
        affectedProjects: [], suggestedAction: 'Consider stretch targets for high-performing teams',
      });
    }

    if (benefitsReg.slope < 0) {
      insights.push({
        id: generateId(), category: 'risk', severity: 'medium', agent: 'vro',
        title: 'Benefits Realization Plateauing',
        description: 'Benefits realization rate is flattening — may indicate diminishing returns or scope issues.',
        predictedImpact: 'Risk of missing quarterly benefits targets by 5-10%',
        timeHorizon: '6-10 weeks', confidence: 65,
        affectedProjects: projects.filter(p => p.status === 'active').slice(0, 3).map(p => p.name),
        suggestedAction: 'Audit benefits tracking methodology and accelerate high-value deliverables',
      });
    }

    const lowValueProjects = projects.filter(p => {
      const spi = parseFloat(p.spi || '1.0');
      return spi < 0.7;
    });
    if (lowValueProjects.length > 2) {
      insights.push({
        id: generateId(), category: 'recommendation', severity: 'medium', agent: 'vro',
        title: `${lowValueProjects.length} Projects Underperforming on Value Delivery`,
        description: `${lowValueProjects.length} projects have SPI below 0.7, indicating significant schedule slippage that impacts value realization.`,
        predictedImpact: 'Delayed benefits realization by an estimated 3-6 months',
        timeHorizon: '4-12 weeks', confidence: 80,
        affectedProjects: lowValueProjects.slice(0, 5).map(p => p.name),
        suggestedAction: 'Prioritize scope reduction or resource injection for highest-value underperformers',
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: generateId(), category: 'opportunity', severity: 'low', agent: 'vro',
        title: 'Value Delivery On Track',
        description: 'Portfolio value metrics are stable. Consider exploring new value creation opportunities.',
        predictedImpact: 'Maintaining current trajectory achieves planned benefits',
        timeHorizon: 'Ongoing', confidence: 85,
        affectedProjects: [], suggestedAction: 'Maintain current course; explore stretch goals for top performers',
      });
    }

    return insights;
  }

  private generatePMOInsights(
    projects: any[], healthReg: any, velocityReg: any, budgetReg: any, scheduleReg: any,
    currentHealth: number, projectedHealth: number
  ): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];

    if (healthReg.slope < -0.5) {
      insights.push({
        id: generateId(), category: 'warning', severity: 'high', agent: 'pmo',
        title: 'Portfolio Health Declining',
        description: `Portfolio health trending down — projected to reach ${Math.round(projectedHealth)} from current ${Math.round(currentHealth)}.`,
        predictedImpact: 'Increased risk of project failures and missed milestones',
        timeHorizon: '2-6 weeks', confidence: Math.min(90, Math.round(healthReg.r2 * 100 + 40)),
        affectedProjects: projects.slice(0, 3).map(p => p.name), suggestedAction: 'Initiate portfolio health review and escalate at-risk projects',
      });
    }

    if (velocityReg.slope < -1) {
      insights.push({
        id: generateId(), category: 'risk', severity: 'medium', agent: 'pmo',
        title: 'Team Velocity Dropping',
        description: 'Aggregate team velocity is declining, suggesting capacity issues or increasing blockers.',
        predictedImpact: 'Sprint commitments may need to be reduced by 10-20%',
        timeHorizon: '2-4 weeks', confidence: 70,
        affectedProjects: [], suggestedAction: 'Review team impediments and adjust sprint planning',
      });
    }

    if (budgetReg.slope < -0.3) {
      insights.push({
        id: generateId(), category: 'warning', severity: 'high', agent: 'finops',
        title: 'Budget Variance Worsening',
        description: 'Portfolio-wide budget variance is trending negative — cost overruns accelerating.',
        predictedImpact: 'Potential portfolio budget overrun of 5-15%',
        timeHorizon: '4-8 weeks', confidence: 72,
        affectedProjects: projects.filter(p => parseFloat(p.actualCost || '0') > parseFloat(p.budget || '1') * 0.9).slice(0, 3).map(p => p.name),
        suggestedAction: 'Activate FinOps deep scan and implement cost containment measures',
      });
    }

    if (scheduleReg.slope < -0.01) {
      insights.push({
        id: generateId(), category: 'risk', severity: 'medium', agent: 'pmo',
        title: 'Schedule Performance Eroding',
        description: 'Aggregate SPI declining — more projects falling behind schedule.',
        predictedImpact: 'Timeline extensions likely for 2-4 projects',
        timeHorizon: '3-6 weeks', confidence: 68,
        affectedProjects: projects.filter(p => parseFloat(p.spi || '1.0') < 0.9).slice(0, 3).map(p => p.name),
        suggestedAction: 'Fast-track critical path activities and remove blockers',
      });
    }

    const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;
    if (activeProjects > 15) {
      insights.push({
        id: generateId(), category: 'recommendation', severity: 'low', agent: 'pmo',
        title: 'Portfolio Complexity Warning',
        description: `${activeProjects} active projects — consider consolidation to reduce coordination overhead.`,
        predictedImpact: 'Reduced management overhead and improved focus',
        timeHorizon: 'Next PI planning', confidence: 60,
        affectedProjects: [], suggestedAction: 'Review portfolio for consolidation or deferral candidates',
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: generateId(), category: 'opportunity', severity: 'low', agent: 'pmo',
        title: 'Portfolio Health Stable',
        description: 'All key PMO metrics are stable or improving. Good foundation for acceleration.',
        predictedImpact: 'Opportunity to take on strategic initiatives',
        timeHorizon: 'Ongoing', confidence: 85,
        affectedProjects: [], suggestedAction: 'Consider expanding portfolio with strategic initiatives',
      });
    }

    return insights;
  }
}
