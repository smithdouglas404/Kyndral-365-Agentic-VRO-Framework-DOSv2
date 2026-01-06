import { addMonths, format, subMonths } from "date-fns";

// Utility to generate random number within range
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

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

export const generateCycleTimeData = () => {
  const months = getMonths(12);
  const rawData = generateTrend(35, 4, 12, 3); // From 35 days down to ~4 days
  
  return months.map((month, i) => ({
    month,
    time: rawData[i],
    benchmark: 7 // Target is constant
  }));
};

export const generateBenefitsData = () => {
  // 4 Quarters
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  // Forecast goes up as confidence grows
  const forecast = generateTrend(40, 95, 4, 5); 
  // Realized starts low vs forecast, then catches up and exceeds
  const realized = [
    forecast[0] * 0.6, // Missed early
    forecast[1] * 0.8, // Catching up
    forecast[2] * 0.95, // On track
    forecast[3] * 1.05 // Exceeding
  ].map(n => Math.round(n));

  return quarters.map((q, i) => ({
    quarter: q,
    forecasted: forecast[i],
    realized: realized[i]
  }));
};

export const generateRiskDistribution = () => {
  // Dynamic but always heavily weighted to Low Risk (Success story)
  const high = random(5, 12);
  const medium = random(15, 25);
  const low = 100 - high - medium;

  return [
    { name: 'Low Risk', value: low, color: 'hsl(148, 100%, 26%)' }, // Brand Teal
    { name: 'Medium Risk', value: medium, color: 'hsl(51, 100%, 50%)' }, // Accent Yellow
    { name: 'High Risk (Requires Governance)', value: high, color: 'hsl(346, 100%, 42%)' }  // Brand Red
  ];
};

export const generateEfficiencyData = () => {
  const months = getMonths(12);
  // Manual effort drops
  const manual = generateTrend(1500, 300, 12, 50);
  // Automated output rises
  const automated = generateTrend(100, 2000, 12, 100);

  return months.map((month, i) => ({
    month,
    manual: manual[i],
    automated: automated[i]
  }));
};

export const generateGovernanceHealth = () => {
  return [
    { category: 'Policy Alignment', score: random(92, 99), fullMark: 100 },
    { category: 'Audit Trail', score: random(96, 100), fullMark: 100 },
    { category: 'Decision Speed', score: random(85, 95), fullMark: 100 },
    { category: 'Risk Mitigation', score: random(88, 96), fullMark: 100 },
    { category: 'Stakeholder Review', score: random(90, 98), fullMark: 100 },
  ];
};
