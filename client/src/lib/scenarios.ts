// ============================================================================
// SCENARIO DATA TYPES AND GENERATORS
// Supports scenario planning and what-if analysis
// ============================================================================

export type StageId = 'discovery' | 'planning' | 'execution' | 'optimization' | 'transformation';

export interface Stage {
  id: StageId;
  name: string;
  description: string;
  duration: string;
  color: string;
}

export const stages: Stage[] = [
  { id: 'discovery', name: 'Discovery', description: 'Initial assessment and opportunity identification', duration: '4-6 weeks', color: '#3b82f6' },
  { id: 'planning', name: 'Planning', description: 'Detailed roadmap and resource allocation', duration: '6-8 weeks', color: '#8b5cf6' },
  { id: 'execution', name: 'Execution', description: 'Implementation of initiatives', duration: '12-16 weeks', color: '#22c55e' },
  { id: 'optimization', name: 'Optimization', description: 'Performance tuning and refinement', duration: '8-12 weeks', color: '#f97316' },
  { id: 'transformation', name: 'Transformation', description: 'Full-scale organizational change', duration: '16-24 weeks', color: '#ef4444' }
];

export interface ScenarioMetrics {
  roi: number;
  timeline: number;
  risk: number;
  confidence: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'conservative' | 'moderate' | 'aggressive';
  metrics: ScenarioMetrics;
  stages: StageId[];
  impact: {
    revenue: number;
    cost: number;
    efficiency: number;
  };
}

export function generateScenarioChartData(scenario: Scenario, stage?: StageId) {
  const baseMultiplier = scenario.type === 'aggressive' ? 1.5 : scenario.type === 'conservative' ? 0.7 : 1;

  const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
  return weeks.map((week, i) => ({
    week,
    time: Math.round(45 - i * 3 * baseMultiplier + Math.random() * 3),
    benchmark: 30,
    progress: Math.min(100, Math.round((i + 1) * 8 * baseMultiplier + Math.random() * 5)),
    planned: Math.round((i + 1) * 8.5),
    variance: Math.round((Math.random() - 0.5) * 10)
  }));
}

export function generateScenarioBenefitsData(scenario: Scenario, stage?: StageId) {
  const multiplier = scenario.type === 'aggressive' ? 1.5 : scenario.type === 'conservative' ? 0.7 : 1;

  return [
    { category: 'Revenue Impact', value: Math.round(scenario.impact.revenue * multiplier), realized: Math.round(scenario.impact.revenue * multiplier * 0.8), forecasted: Math.round(scenario.impact.revenue * multiplier * 1.2), projected: scenario.impact.revenue * 1.2 },
    { category: 'Cost Reduction', value: Math.round(scenario.impact.cost * multiplier), realized: Math.round(scenario.impact.cost * multiplier * 0.75), forecasted: Math.round(scenario.impact.cost * multiplier * 1.15), projected: scenario.impact.cost * 1.15 },
    { category: 'Efficiency Gains', value: Math.round(scenario.impact.efficiency * multiplier), realized: Math.round(scenario.impact.efficiency * multiplier * 0.7), forecasted: Math.round(scenario.impact.efficiency * multiplier * 1.1), projected: scenario.impact.efficiency * 1.1 },
    { category: 'Risk Mitigation', value: Math.round(20 * multiplier), realized: Math.round(15 * multiplier), forecasted: Math.round(25 * multiplier), projected: 25 },
    { category: 'Strategic Value', value: Math.round(35 * multiplier), realized: Math.round(28 * multiplier), forecasted: Math.round(40 * multiplier), projected: 40 }
  ];
}

export function generateScenarioRiskData(scenario: Scenario, stage?: StageId) {
  const riskMultiplier = scenario.type === 'aggressive' ? 1.3 : scenario.type === 'conservative' ? 0.6 : 1;

  return [
    { name: 'Technical', value: Math.round(15 * riskMultiplier), color: '#ef4444' },
    { name: 'Operational', value: Math.round(12 * riskMultiplier), color: '#f97316' },
    { name: 'Financial', value: Math.round(8 * riskMultiplier), color: '#eab308' },
    { name: 'Strategic', value: Math.round(5 * riskMultiplier), color: '#22c55e' }
  ];
}

export function generateScenarioEfficiencyData(scenario: Scenario, stage?: StageId) {
  const baseEfficiency = scenario.type === 'aggressive' ? 85 : scenario.type === 'conservative' ? 70 : 78;

  const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
  return months.map((month, i) => ({
    month,
    efficiency: Math.min(100, Math.round(baseEfficiency + i * 3 + Math.random() * 5)),
    capacity: Math.round(70 + i * 4 + Math.random() * 5),
    utilization: Math.round(65 + i * 5 + Math.random() * 8),
    manual: Math.round(55 - i * 6 + Math.random() * 5),
    automated: Math.round(45 + i * 6 + Math.random() * 5)
  }));
}

export function generateScenarioGovernanceData(scenario: Scenario, stage?: StageId) {
  const baseScore = scenario.type === 'aggressive' ? 75 : scenario.type === 'conservative' ? 85 : 80;

  return [
    { domain: 'Compliance', score: Math.round(baseScore + Math.random() * 10) },
    { domain: 'Risk Controls', score: Math.round(baseScore - 5 + Math.random() * 15) },
    { domain: 'Process Maturity', score: Math.round(baseScore + 3 + Math.random() * 8) },
    { domain: 'Change Management', score: Math.round(baseScore - 3 + Math.random() * 12) },
    { domain: 'Stakeholder Buy-in', score: Math.round(baseScore + Math.random() * 15) }
  ];
}
