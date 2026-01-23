import { addMonths, format, subMonths } from "date-fns";

// Utility to generate random number within range
const random = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));

// Utility to generate a trend with some noise
const generateTrend = (
  start: number, 
  end: number, 
  steps: number, 
  noise: number = 0
) => {
  const data = [];
  const stepSize = (end - start) / (steps - 1);
  
  for (let i = 0; i < steps; i++) {
    const baseValue = start + (stepSize * i);
    const noiseValue = random(-noise, noise);
    data.push(Math.max(0, Math.round(baseValue + noiseValue)));
  }
  
  return data;
};

// Generate last 12 months labels
const getMonths = (count: number) => {
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(format(subMonths(new Date(), i), "MMM"));
  }
  return months;
};

// ============ NEXTERA ENERGY DATA (Renewables & Grid Transformation) ============

export const generateRenewableGrowthData = () => {
  const months = getMonths(12);
  const rawData = generateTrend(45, 78, 12, 5); // Growing towards 78GW target
  
  return months.map((month, i) => ({
    month,
    capacity: rawData[i],
    target: 78
  }));
};

export const generateGridModernizationData = () => {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const deployment = generateTrend(30, 85, 4, 2);
  const target = [40, 60, 80, 100];

  return quarters.map((q, i) => ({
    quarter: q,
    deployment: deployment[i],
    target: target[i]
  }));
};

export const generateVROCycleTimeData = () => {
  const months = getMonths(12);
  const rawData = generateTrend(35, 5, 12, 2);
  
  return months.map((month, i) => ({
    month,
    time: rawData[i],
    benchmark: 7
  }));
};

export const generateVROBenefitsData = () => {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const forecast = generateTrend(40, 95, 4, 3);
  const realized = [
    Math.round(forecast[0] * 0.65),
    Math.round(forecast[1] * 0.82),
    Math.round(forecast[2] * 0.95),
    Math.round(forecast[3] * 1.02)
  ];

  return quarters.map((q, i) => ({
    quarter: q,
    forecasted: forecast[i],
    realized: realized[i]
  }));
};

export const generateVRORiskDistribution = () => {
  const high = randomInt(5, 10);
  const medium = randomInt(12, 20);
  const low = 100 - high - medium;

  return [
    { name: 'Low Risk', value: low, color: 'hsl(148, 100%, 26%)' },
    { name: 'Medium Risk', value: medium, color: 'hsl(51, 100%, 50%)' },
    { name: 'High Risk', value: high, color: 'hsl(346, 100%, 42%)' }
  ];
};

export const generateVROEfficiencyData = () => {
  const months = getMonths(12);
  const manual = generateTrend(1500, 300, 12, 50);
  const automated = generateTrend(100, 1800, 12, 80);

  return months.map((month, i) => ({
    month,
    manual: manual[i],
    automated: automated[i]
  }));
};

export const generateVROGovernanceHealth = () => {
  return [
    { category: 'Policy Alignment', score: randomInt(92, 98), fullMark: 100 },
    { category: 'Audit Trail', score: randomInt(95, 99), fullMark: 100 },
    { category: 'Decision Speed', score: randomInt(88, 95), fullMark: 100 },
    { category: 'Risk Mitigation', score: randomInt(90, 96), fullMark: 100 },
    { category: 'Stakeholder Review', score: randomInt(91, 97), fullMark: 100 },
  ];
};

// ============ PMO DATA (Traditional - Worse Performance) ============

export const generatePMOCycleTimeData = () => {
  const months = getMonths(12);
  const rawData = generateTrend(28, 22, 12, 4);
  
  return months.map((month, i) => ({
    month,
    time: rawData[i],
    benchmark: 7
  }));
};

export const generatePMOBenefitsData = () => {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const forecast = generateTrend(50, 70, 4, 5);
  const realized = [
    Math.round(forecast[0] * 0.45),
    Math.round(forecast[1] * 0.52),
    Math.round(forecast[2] * 0.58),
    Math.round(forecast[3] * 0.62)
  ];

  return quarters.map((q, i) => ({
    quarter: q,
    forecasted: forecast[i],
    realized: realized[i]
  }));
};

export const generatePMORiskDistribution = () => {
  const high = randomInt(22, 32);
  const medium = randomInt(30, 40);
  const low = 100 - high - medium;

  return [
    { name: 'Low Risk', value: low, color: 'hsl(148, 100%, 26%)' },
    { name: 'Medium Risk', value: medium, color: 'hsl(51, 100%, 50%)' },
    { name: 'High Risk', value: high, color: 'hsl(346, 100%, 42%)' }
  ];
};

export const generatePMOEfficiencyData = () => {
  const months = getMonths(12);
  const manual = generateTrend(1400, 1200, 12, 80);
  const automated = generateTrend(50, 200, 12, 30);

  return months.map((month, i) => ({
    month,
    manual: manual[i],
    automated: automated[i]
  }));
};

export const generatePMOGovernanceHealth = () => {
  return [
    { category: 'Policy Alignment', score: randomInt(62, 72), fullMark: 100 },
    { category: 'Audit Trail', score: randomInt(58, 68), fullMark: 100 },
    { category: 'Decision Speed', score: randomInt(45, 55), fullMark: 100 },
    { category: 'Risk Mitigation', score: randomInt(52, 62), fullMark: 100 },
    { category: 'Stakeholder Review', score: randomInt(55, 65), fullMark: 100 },
  ];
};

// ============ LIVE KPI STATS (for dashboard header) ============

export const generateVROStats = () => ({
  cycleTime: { value: randomInt(4, 6), unit: "days", change: randomInt(-82, -78) },
  forecastAccuracy: { value: randomInt(83, 87), unit: "%", change: randomInt(38, 45) },
  costVariance: { value: randomInt(8, 12), unit: "±%", change: randomInt(-58, -52) },
  overheadReduction: { value: randomInt(73, 78), unit: "%", change: randomInt(70, 78) }
});

export const generatePMOStats = () => ({
  cycleTime: { value: randomInt(22, 28), unit: "days", change: randomInt(-12, -8) },
  forecastAccuracy: { value: randomInt(58, 65), unit: "%", change: randomInt(5, 12) },
  costVariance: { value: randomInt(22, 28), unit: "±%", change: randomInt(-8, -2) },
  overheadReduction: { value: randomInt(12, 18), unit: "%", change: randomInt(8, 15) }
});

// ============ NEXTERA ENERGY ANNUAL REPORT CITATIONS ============
export const citations = {
  renewableCapacity: {
    value: "78 GW",
    source: "NextEra Energy Annual Report 2024, p.12",
    context: "Total renewable capacity target"
  },
  forecastAccuracy: {
    value: "85%",
    source: "NextEra Energy Annual Report 2024, p.45",
    context: "Strategic planning accuracy target"
  },
  transformationRisk: {
    value: "Principal Risk",
    source: "NextEra Energy Annual Report 2024, Risk Section p.78",
    context: "Identified as ongoing concern requiring governance"
  },
  costEfficiency: {
    value: "$250m",
    source: "NextEra Energy Annual Report 2024, p.23",
    context: "Cost savings target through operational efficiency"
  },
  digitalInvestment: {
    value: "$185m",
    source: "NextEra Energy Annual Report 2024, p.34",
    context: "Technology modernization investment"
  },
  prtVolume: {
    value: "68.5 GW",
    source: "NextEra Energy Annual Report 2024, p.18",
    context: "Total clean energy portfolio capacity"
  }
};
