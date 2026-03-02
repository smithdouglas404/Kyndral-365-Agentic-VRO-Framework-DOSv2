// ============================================================================
// SIMULATION DATA GENERATORS
// Generates mock data for VRO and PMO charts
// ============================================================================

export const citations = {
  vro: {
    cycleTime: { value: "15-20%", source: "Industry benchmarks", context: "Typical cycle time improvements with VRO" },
    benefits: { value: "$2-5M", source: "VRO case studies", context: "Average annual benefits realized" },
    risk: { value: "30%", source: "Risk assessment data", context: "Risk reduction through proactive management" },
    efficiency: { value: "25%", source: "Process optimization", context: "Operational efficiency gains" },
    governance: { value: "85%", source: "Compliance metrics", context: "Governance health score" }
  },
  pmo: {
    cycleTime: { value: "10-15%", source: "PMO analytics", context: "Project delivery improvements" },
    benefits: { value: "$1-3M", source: "Project portfolio data", context: "Average project savings" },
    risk: { value: "20%", source: "Risk register", context: "Risk mitigation effectiveness" },
    efficiency: { value: "18%", source: "Resource utilization", context: "Resource efficiency gains" },
    governance: { value: "78%", source: "Audit reports", context: "PMO governance compliance" }
  },
  forecastAccuracy: { value: "92%", source: "Predictive analytics", context: "ML-based forecast accuracy" },
  transformationRisk: { value: "35%", source: "Risk assessment", context: "Transformation risk mitigation" },
  costEfficiency: { value: "18%", source: "FinOps metrics", context: "Cost efficiency improvements" }
};

export function generateVROCycleTimeData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month, i) => ({
    month,
    time: 45 - i * 3 + Math.round(Math.random() * 3),
    benchmark: 30,
    baseline: 45 - i * 2,
    current: 38 - i * 3,
    target: 30
  }));
}

export function generateVROBenefitsData() {
  const categories = ['Cost Savings', 'Revenue Growth', 'Risk Avoidance', 'Efficiency Gains', 'Strategic Value'];
  return categories.map((category) => {
    const realized = Math.round(Math.random() * 3 + 1);
    const forecasted = Math.round(realized * 1.3 + Math.random() * 2);
    return {
      category,
      realized,
      forecasted,
      projected: forecasted,
      target: Math.round(forecasted * 1.2)
    };
  });
}

export function generateVRORiskDistribution() {
  return [
    { name: 'Critical', value: Math.round(Math.random() * 3 + 1), color: '#ef4444' },
    { name: 'High', value: Math.round(Math.random() * 5 + 3), color: '#f97316' },
    { name: 'Medium', value: Math.round(Math.random() * 8 + 5), color: '#eab308' },
    { name: 'Low', value: Math.round(Math.random() * 12 + 8), color: '#22c55e' }
  ];
}

export function generateVROEfficiencyData() {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  return quarters.map((quarter, i) => ({
    quarter,
    efficiency: Math.round(70 + i * 5 + Math.random() * 5),
    utilization: Math.round(75 + i * 4 + Math.random() * 5),
    automation: Math.round(40 + i * 10 + Math.random() * 5),
    manual: Math.round(60 - i * 10 + Math.random() * 5),
    automated: Math.round(40 + i * 10 + Math.random() * 5)
  }));
}

export function generateVROGovernanceHealth() {
  return [
    { domain: 'Compliance', score: Math.round(80 + Math.random() * 15) },
    { domain: 'Risk Management', score: Math.round(75 + Math.random() * 15) },
    { domain: 'Process Adherence', score: Math.round(85 + Math.random() * 10) },
    { domain: 'Reporting', score: Math.round(70 + Math.random() * 20) },
    { domain: 'Stakeholder Engagement', score: Math.round(65 + Math.random() * 25) }
  ];
}

export function generatePMOCycleTimeData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month, i) => ({
    month,
    time: 50 - i * 2 + Math.round(Math.random() * 3),
    benchmark: 35,
    planned: 60 - i * 2,
    actual: 65 - i * 3,
    variance: 5 - i * 0.5
  }));
}

export function generatePMOBenefitsData() {
  const projects = ['Project A', 'Project B', 'Project C', 'Project D', 'Project E'];
  return projects.map((project) => {
    const realized = Math.round(Math.random() * 8 + 3);
    const forecasted = Math.round(realized * 1.2 + Math.random() * 2);
    return {
      project,
      realized,
      forecasted,
      budget: Math.round(Math.random() * 10 + 5),
      spent: realized,
      remaining: Math.round(Math.random() * 5 + 1)
    };
  });
}

export function generatePMORiskDistribution() {
  return [
    { name: 'Schedule', value: Math.round(Math.random() * 8 + 4), color: '#ef4444' },
    { name: 'Budget', value: Math.round(Math.random() * 6 + 3), color: '#f97316' },
    { name: 'Resource', value: Math.round(Math.random() * 5 + 2), color: '#eab308' },
    { name: 'Technical', value: Math.round(Math.random() * 4 + 2), color: '#22c55e' }
  ];
}

export function generatePMOEfficiencyData() {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  return quarters.map((quarter, i) => ({
    quarter,
    onTime: Math.round(65 + i * 5 + Math.random() * 10),
    onBudget: Math.round(70 + i * 4 + Math.random() * 8),
    quality: Math.round(80 + i * 3 + Math.random() * 5),
    manual: Math.round(55 - i * 8 + Math.random() * 5),
    automated: Math.round(45 + i * 8 + Math.random() * 5)
  }));
}

export function generatePMOGovernanceHealth() {
  return [
    { domain: 'Project Controls', score: Math.round(75 + Math.random() * 15) },
    { domain: 'Resource Management', score: Math.round(70 + Math.random() * 20) },
    { domain: 'Stakeholder Communication', score: Math.round(80 + Math.random() * 15) },
    { domain: 'Risk Management', score: Math.round(72 + Math.random() * 18) },
    { domain: 'Quality Assurance', score: Math.round(78 + Math.random() * 12) }
  ];
}
