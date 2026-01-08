import { 
  divisions, 
  lgCompanyOverview, 
  riskData 
} from './lgData';

export type DataMode = "VRO" | "PMO";

const VRO_MULTIPLIERS = {
  forecastEfficiency: 0.96,
  savingsRate: 0.08,
  confidenceBoost: 35,
  completionBoost: 30,
  adoptionBoost: 25,
  readinessBoost: 20,
  progressBoost: 15
};

const PMO_MULTIPLIERS = {
  forecastEfficiency: 1.15,
  savingsRate: 0.02,
  confidenceBoost: 0,
  completionBoost: 0,
  adoptionBoost: 0,
  readinessBoost: 0,
  progressBoost: -15
};

export interface TransformedCostCategory {
  name: string;
  budget: number;
  spent: number;
  forecast: number;
  variance: number;
  division: string;
  savings: number;
  aiInsight: string;
}

export function getCostCategoriesFromDivisions(mode: DataMode): TransformedCostCategory[] {
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  return divisions.map((div, i) => {
    const budget = Math.round(div.profit2024 * 0.12);
    const spent = Math.round(budget * (0.75 + (i * 0.03)));
    const forecast = Math.round(budget * mult.forecastEfficiency);
    const variance = Math.round(((forecast - budget) / budget) * 100 * 10) / 10;
    const savings = Math.round(budget * mult.savingsRate);
    
    const kpiCount = div.kpis.length;
    const projectCount = div.potentialProjects.length;
    
    return {
      name: div.name,
      budget,
      spent,
      forecast,
      variance,
      division: div.ceo,
      savings,
      aiInsight: mode === 'VRO' 
        ? `AI analysis of ${kpiCount} KPIs identified £${savings}M optimization across ${projectCount} projects`
        : `Manual review of ${kpiCount} KPIs pending. ${projectCount} projects require assessment.`
    };
  });
}

export interface TransformedSavingsOpportunity {
  area: string;
  potential: number;
  confidence: number;
  status: 'validated' | 'in-progress' | 'pending';
  aiInsight: string;
  division: string;
  roi: number;
  paybackMonths: number;
}

export function getSavingsOpportunitiesFromProjects(mode: DataMode): TransformedSavingsOpportunity[] {
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  const allProjects = divisions.flatMap(d => 
    d.potentialProjects.map(p => ({ ...p, division: d.name }))
  );
  
  return allProjects.slice(0, 6).map((project, i) => {
    const roiMatch = project.expectedROI.match(/£?(\d+(?:\.\d+)?)/);
    const baseRoi = roiMatch ? parseFloat(roiMatch[1]) : 5 + i * 2;
    
    const baseConfidence = 50 + (project.status === 'completed' ? 40 : project.status === 'in-progress' ? 20 : 0);
    const confidence = Math.min(100, baseConfidence + mult.confidenceBoost);
    
    const statusMap: Record<string, 'validated' | 'in-progress' | 'pending'> = {
      'completed': 'validated',
      'in-progress': 'in-progress',
      'proposed': 'pending'
    };
    
    return {
      area: project.name,
      potential: mode === 'VRO' ? baseRoi : Math.round(baseRoi * 0.4 * 10) / 10,
      confidence: Math.round(confidence),
      status: mode === 'VRO' 
        ? statusMap[project.status] || 'pending'
        : 'pending',
      aiInsight: project.aiRecommendation || project.description.slice(0, 80),
      division: project.division,
      roi: mode === 'VRO' ? 3.5 + (i * 0.3) : 1.2 + (i * 0.1),
      paybackMonths: mode === 'VRO' ? 6 + i * 2 : 18 + i * 3
    };
  });
}

export interface TransformedGovernanceItem {
  title: string;
  type: 'decision' | 'approval' | 'review' | 'compliance';
  status: 'complete' | 'in-review' | 'pending';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  owner: string;
  aiStatus: string;
  completionTime: string;
  relatedRisks: number;
}

export function getGovernanceItemsFromRiskData(mode: DataMode): TransformedGovernanceItem[] {
  const today = new Date();
  const types: ('decision' | 'approval' | 'review' | 'compliance')[] = ['decision', 'approval', 'review', 'compliance'];
  const owners = [lgCompanyOverview.ceo, lgCompanyOverview.cfo, lgCompanyOverview.cro, 'Compliance'];
  
  return riskData.categories.slice(0, 4).map((category, i) => {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + (mode === 'VRO' ? -5 + i * 3 : 10 + i * 5));
    
    const highRisks = category.subRisks?.filter(r => r.severity === 'high').length || 0;
    const priorities: ('high' | 'medium' | 'low')[] = highRisks > 1 ? ['high', 'high', 'medium', 'medium'] : ['medium', 'medium', 'low', 'low'];
    
    return {
      title: `${category.name} Review`,
      type: types[i % 4],
      status: mode === 'VRO' 
        ? (i < 3 ? 'complete' : 'in-review') as const
        : (i === 0 ? 'in-review' : 'pending') as const,
      priority: priorities[i],
      dueDate: dueDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }),
      owner: owners[i % 4],
      aiStatus: mode === 'VRO'
        ? `AI-assisted ${category.name.toLowerCase()} analysis with ${category.subRisks?.length || 0} sub-risks evaluated`
        : `Manual ${category.name.toLowerCase()} review of ${category.subRisks?.length || 0} items required`,
      completionTime: mode === 'VRO' 
        ? (i < 3 ? `${3 - i} days ahead` : 'On schedule')
        : (i === 0 ? 'On schedule' : `Delayed ${i * 3} days`),
      relatedRisks: highRisks
    };
  });
}

export function getRiskMetricsFromDivisions(mode: DataMode) {
  const allRisks = divisions.flatMap(d => d.risks);
  const highRisks = allRisks.filter(r => r.level === 'high').length;
  const mediumRisks = allRisks.filter(r => r.level === 'medium').length;
  const lowRisks = allRisks.filter(r => r.level === 'low').length;
  
  const baseCompliance = 100 - (highRisks * 3 + mediumRisks * 1);
  
  return {
    total: allRisks.length,
    high: highRisks,
    medium: mediumRisks,
    low: lowRisks,
    complianceScore: mode === 'VRO' ? Math.min(100, baseCompliance + 10) : Math.max(50, baseCompliance - 10),
    trend: mode === 'VRO' ? 'improving' : 'stable'
  };
}

export interface TransformedReadinessMetric {
  category: string;
  score: number;
  target: number;
  description: string;
  aiInsight: string;
  trend: number;
}

export function getChangeReadinessFromDivisions(mode: DataMode): TransformedReadinessMetric[] {
  const categories = ['Awareness', 'Desire', 'Knowledge', 'Ability', 'Reinforcement'];
  const descriptions = [
    'Understanding of change purpose',
    'Willingness to participate',
    'Training completion',
    'Skill proficiency',
    'Sustainment practices'
  ];
  const targets = [90, 80, 85, 75, 70];
  
  const avgDivisionProgress = divisions.reduce((sum, d) => {
    const avgOkrProgress = d.okrs.reduce((s, o) => {
      const avgKrProgress = o.keyResults.reduce((ks, kr) => ks + kr.progress, 0) / (o.keyResults.length || 1);
      return s + avgKrProgress;
    }, 0) / (d.okrs.length || 1);
    return sum + avgOkrProgress;
  }, 0) / divisions.length;
  
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  return categories.map((cat, i) => {
    const baseScore = Math.round(avgDivisionProgress * (1 - i * 0.05));
    const score = Math.max(20, Math.min(100, baseScore + mult.readinessBoost));
    
    return {
      category: cat,
      score,
      target: targets[i],
      description: descriptions[i],
      aiInsight: mode === 'VRO'
        ? `AI-driven ${cat.toLowerCase()} optimization tracking ${divisions.length} divisions`
        : `Manual ${cat.toLowerCase()} tracking across ${divisions.length} divisions`,
      trend: mode === 'VRO' ? 8 + i * 2 : 2 + i
    };
  });
}

export interface TransformedStakeholderGroup {
  name: string;
  sentiment: 'positive' | 'neutral' | 'mixed' | 'negative';
  engagement: number;
  count: number;
  aiActions: string;
  division: string;
}

export function getStakeholderGroupsFromDivisions(mode: DataMode): TransformedStakeholderGroup[] {
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  return divisions.map((div, i) => {
    const baseEngagement = 50 + Math.round(div.changePercent * 2) + (div.okrs.length * 5);
    const engagement = Math.max(20, Math.min(100, baseEngagement + mult.adoptionBoost));
    
    const sentiment = engagement > 80 ? 'positive' : engagement > 60 ? 'neutral' : engagement > 40 ? 'mixed' : 'negative';
    const estimatedStaff = Math.round(lgCompanyOverview.employees / divisions.length);
    
    return {
      name: div.name,
      sentiment: sentiment as 'positive' | 'neutral' | 'mixed' | 'negative',
      engagement,
      count: estimatedStaff,
      aiActions: mode === 'VRO'
        ? `AI-personalized change support with ${div.kpis.length} KPI alignment points`
        : `Standard communication channels, ${div.kpis.length} KPIs tracked manually`,
      division: div.name
    };
  });
}

export interface TransformedTrainingProgram {
  name: string;
  enrolled: number;
  completed: number;
  satisfaction: number;
  format: string;
  duration: string;
  division: string;
}

export function getTrainingProgramsFromOKRs(mode: DataMode): TransformedTrainingProgram[] {
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  const allOkrs = divisions.flatMap(d => 
    d.okrs.map(o => ({ ...o, division: d.name }))
  );
  
  return allOkrs.slice(0, 5).map((okr, i) => {
    const avgProgress = okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / (okr.keyResults.length || 1);
    const enrolled = 500 + (i * 300);
    const completionRate = Math.min(100, avgProgress + mult.completionBoost) / 100;
    
    return {
      name: okr.objective.slice(0, 40) + (okr.objective.length > 40 ? '...' : ''),
      enrolled,
      completed: Math.round(enrolled * completionRate),
      satisfaction: mode === 'VRO' ? 4.2 + (i * 0.1) : 3.2 + (i * 0.1),
      format: mode === 'VRO' ? 'AI-adaptive' : 'Classroom',
      duration: mode === 'VRO' ? '45 min avg' : '3 hours',
      division: okr.division
    };
  });
}

export interface TransformedMilestone {
  name: string;
  status: 'complete' | 'in-progress' | 'upcoming' | 'at-risk' | 'planned';
  startDate: string;
  endDate: string;
  progress: number;
  deliverables: string[];
  aiInsight: string;
  budget: { planned: number; actual: number };
  division: string;
}

export function getMilestonesFromProjects(mode: DataMode): TransformedMilestone[] {
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  const allProjects = divisions.flatMap(d => 
    d.potentialProjects.map(p => ({ ...p, division: d.name }))
  );
  
  const phases = ['Foundation', 'Development', 'Rollout', 'Optimization'];
  const quarters = ['Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025'];
  
  return phases.map((phase, i) => {
    const relatedProjects = allProjects.filter((p, j) => j % 4 === i).slice(0, 3);
    
    const baseProgress = i === 0 ? 100 : i === 1 ? 45 : 0;
    const progress = Math.min(100, Math.max(0, baseProgress + mult.progressBoost));
    
    const plannedBudget = 15 + i * 12;
    const actualMultiplier = mode === 'VRO' ? 0.92 : (i === 1 ? 1.18 : 1);
    
    return {
      name: `Phase ${i + 1}: ${phase}`,
      status: mode === 'VRO'
        ? (progress === 100 ? 'complete' : progress > 0 ? 'in-progress' : 'upcoming') as const
        : (progress === 100 ? 'complete' : progress > 0 ? 'at-risk' : 'planned') as const,
      startDate: quarters[i].replace('Q', 'Jan ').replace(' 2', ', 2'),
      endDate: quarters[i].replace('Q', 'Mar ').replace(' 2', ', 2'),
      progress,
      deliverables: relatedProjects.map(p => p.name),
      aiInsight: mode === 'VRO'
        ? `AI analysis: ${90 + i * 2}% on-time probability with ${relatedProjects.length} deliverables`
        : `Manual tracking: ${relatedProjects.length} deliverables ${i > 0 ? 'at risk' : 'on track'}`,
      budget: {
        planned: plannedBudget,
        actual: Math.round(plannedBudget * actualMultiplier * 10) / 10
      },
      division: relatedProjects[0]?.division || 'Group'
    };
  });
}

export interface TransformedDeadline {
  task: string;
  date: string;
  owner: string;
  status: 'complete' | 'on-track' | 'at-risk' | 'pending';
  division: string;
  aiPrediction: string;
}

export function getDeadlinesFromProjects(mode: DataMode): TransformedDeadline[] {
  const allProjects = divisions.flatMap(d => 
    d.potentialProjects.map(p => ({ ...p, division: d.name, ceo: d.ceo }))
  );
  
  const today = new Date();
  
  return allProjects.slice(0, 6).map((project, i) => {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + (mode === 'VRO' ? 10 + i * 7 : 20 + i * 10));
    
    const vroStatus = project.status === 'completed' ? 'complete' : 'on-track';
    const pmoStatus = project.status === 'completed' ? 'complete' : project.priority === 'high' ? 'at-risk' : 'pending';
    
    const onTimeProb = mode === 'VRO' ? 92 + i : 50 + i * 5;
    
    return {
      task: project.name,
      date: dueDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }),
      owner: project.ceo,
      status: (mode === 'VRO' ? vroStatus : pmoStatus) as TransformedDeadline['status'],
      division: project.division,
      aiPrediction: mode === 'VRO'
        ? `${onTimeProb}% on-time confidence`
        : project.priority === 'high' ? 'High priority - risk of delay' : 'Standard tracking'
    };
  });
}

export interface TransformedAdoptionMetric {
  division: string;
  adoption: number;
  target: number;
  users: number;
  trend: string;
  aiInsight: string;
  color: string;
}

export function getAdoptionMetricsFromDivisions(mode: DataMode): TransformedAdoptionMetric[] {
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  return divisions.map((div, i) => {
    const digitalKpi = div.kpis.find(k => k.name.toLowerCase().includes('digital'));
    const baseAdoption = digitalKpi && typeof digitalKpi.value2024 === 'number' 
      ? digitalKpi.value2024 
      : 50 + div.changePercent * 2;
    
    const adoption = Math.max(20, Math.min(100, Math.round(baseAdoption + mult.adoptionBoost)));
    const estimatedUsers = Math.round(lgCompanyOverview.employees / divisions.length);
    
    const trendValue = mode === 'VRO' ? 8 + i * 2 : 2 + i;
    
    return {
      division: div.name,
      adoption,
      target: 90,
      users: estimatedUsers,
      trend: `+${trendValue}%`,
      aiInsight: mode === 'VRO'
        ? `AI-driven onboarding achieving ${adoption + 5}% activation rate`
        : `Standard training rollout with ${div.kpis.length} KPIs tracked`,
      color: div.color
    };
  });
}

export interface TransformedInitiative {
  id: string;
  name: string;
  description: string;
  phase: string;
  progress: number;
  impactedUsers: number;
  status: 'on-track' | 'at-risk' | 'complete';
  division: string;
  owner: string;
  startDate: string;
  targetDate: string;
  valueImpact: { costSavings: number; revenueImpact: number; efficiencyGain: number };
  okrMappings: {
    objectiveId: string;
    objectiveName: string;
    keyResults: { name: string; contribution: number }[];
    valueImpact: string;
  }[];
  collaboratingAgents: {
    agentId: string;
    agentName: string;
    role: string;
    lastSync: string;
    status: 'active' | 'pending' | 'complete';
  }[];
  milestones: { name: string; date: string; status: 'complete' | 'in-progress' | 'pending' }[];
  risks: { description: string; severity: 'low' | 'medium' | 'high'; mitigation: string }[];
}

export function getInitiativesFromDivisions(mode: DataMode): TransformedInitiative[] {
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  const allProjects = divisions.flatMap(d => 
    d.potentialProjects.map(p => ({ ...p, division: d.name, ceo: d.ceo, divisionOkrs: d.okrs, divisionRisks: d.risks }))
  );
  
  const agents = [
    { agentId: 'vro', agentName: 'VRO Agent', role: 'Value tracking' },
    { agentId: 'pmo', agentName: 'PMO Agent', role: 'Delivery oversight' },
    { agentId: 'ocm', agentName: 'OCM Agent', role: 'Change management' },
    { agentId: 'finops', agentName: 'FinOps Agent', role: 'Cost monitoring' },
    { agentId: 'okr', agentName: 'OKR Agent', role: 'Alignment tracking' }
  ];
  
  return allProjects.slice(0, 4).map((project, i) => {
    const roiMatch = project.expectedROI.match(/£?(\d+(?:\.\d+)?)/);
    const roiValue = roiMatch ? parseFloat(roiMatch[1]) : 25;
    
    const baseProgress = project.status === 'completed' ? 100 : project.status === 'in-progress' ? 50 : 10;
    const progress = Math.min(100, Math.max(0, baseProgress + mult.progressBoost));
    
    const estimatedUsers = Math.round(lgCompanyOverview.employees / divisions.length);
    
    return {
      id: `init-${i + 1}`,
      name: project.name,
      description: project.description,
      phase: project.status === 'completed' ? 'Complete' : project.status === 'in-progress' ? 'Development' : 'Planning',
      progress,
      impactedUsers: estimatedUsers,
      status: mode === 'VRO'
        ? (project.status === 'completed' ? 'complete' : 'on-track') as const
        : (project.status === 'completed' ? 'complete' : 'at-risk') as const,
      division: project.division,
      owner: project.ceo,
      startDate: 'Oct 2024',
      targetDate: mode === 'VRO' ? 'Jun 2025' : 'Dec 2025',
      valueImpact: {
        costSavings: mode === 'VRO' ? Math.round(roiValue * 0.4) : Math.round(roiValue * 0.15),
        revenueImpact: mode === 'VRO' ? Math.round(roiValue * 0.8) : Math.round(roiValue * 0.25),
        efficiencyGain: mode === 'VRO' ? 35 + i * 5 : 10 + i * 3
      },
      okrMappings: project.divisionOkrs.slice(0, 2).map((okr, j) => ({
        objectiveId: `okr-${i}-${j}`,
        objectiveName: okr.objective,
        keyResults: okr.keyResults.slice(0, 2).map((kr, k) => ({
          name: kr.result,
          contribution: mode === 'VRO' ? 20 + j * 10 + k * 5 : 5 + j * 2 + k
        })),
        valueImpact: mode === 'VRO' ? `+£${Math.round(roiValue * 0.3)}M value` : 'TBD'
      })),
      collaboratingAgents: mode === 'VRO' 
        ? agents.slice(0, 3 + i).map((a, j) => ({
            ...a,
            lastSync: `${5 + j * 3} min ago`,
            status: 'active' as const
          }))
        : [{ ...agents[1], lastSync: '3 days ago', status: 'pending' as const }],
      milestones: [
        { name: 'Requirements', date: 'Nov 2024', status: mode === 'VRO' ? 'complete' as const : 'complete' as const },
        { name: 'Development', date: 'Feb 2025', status: mode === 'VRO' ? 'complete' as const : 'in-progress' as const },
        { name: 'Testing', date: 'Apr 2025', status: mode === 'VRO' ? 'in-progress' as const : 'pending' as const },
        { name: 'Rollout', date: 'Jun 2025', status: 'pending' as const }
      ],
      risks: project.divisionRisks.slice(0, 2).map(r => ({
        description: r.description,
        severity: r.level,
        mitigation: r.mitigation
      }))
    };
  });
}

export interface TransformedObjective {
  id: string;
  title: string;
  owner: string;
  division: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'ahead';
  keyResults: {
    title: string;
    progress: number;
    target: string;
    current: string;
    linkedInitiatives: {
      id: string;
      name: string;
      division: string;
      contribution: number;
      status: 'on-track' | 'at-risk' | 'complete';
      valueImpact: string;
      phase: string;
    }[];
  }[];
  collaboratingAgents: {
    agentId: string;
    agentName: string;
    contribution: string;
    lastSync: string;
  }[];
  totalValueImpact: { costSavings: number; revenueImpact: number };
}

export function getObjectivesFromDivisions(mode: DataMode): TransformedObjective[] {
  const mult = mode === 'VRO' ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;
  
  const divisionOkrs = divisions.flatMap(d => 
    d.okrs.map(okr => ({
      ...okr,
      division: d.name,
      ceo: d.ceo,
      projects: d.potentialProjects,
      profit: d.profit2024
    }))
  );
  
  const agents = [
    { agentId: 'vro', agentName: 'VRO Agent', contribution: 'Value tracking & ROI' },
    { agentId: 'finops', agentName: 'FinOps Agent', contribution: 'Cost optimization' },
    { agentId: 'tmo', agentName: 'TMO Agent', contribution: 'Change management' },
    { agentId: 'governance', agentName: 'Governance Agent', contribution: 'Compliance oversight' },
    { agentId: 'planning', agentName: 'Planning Agent', contribution: 'Roadmap alignment' }
  ];
  
  return divisionOkrs.slice(0, 4).map((okr, i) => {
    const avgKrProgress = okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / (okr.keyResults.length || 1);
    const progress = Math.min(100, Math.max(0, Math.round(avgKrProgress + mult.progressBoost)));
    
    const status = progress > 85 ? 'ahead' : progress > 60 ? 'on-track' : 'at-risk';
    const relatedProjects = okr.projects.slice(0, 2);
    
    return {
      id: `okr-${i + 1}`,
      title: okr.objective,
      owner: okr.ceo,
      division: okr.division,
      progress,
      status: status as 'on-track' | 'at-risk' | 'ahead',
      keyResults: okr.keyResults.map((kr, j) => {
        const krProgress = Math.min(100, Math.max(0, kr.progress + mult.progressBoost));
        return {
          title: kr.result,
          progress: Math.round(krProgress),
          target: `${kr.target}${kr.unit}`,
          current: `${kr.progress}${kr.unit}`,
          linkedInitiatives: relatedProjects.map((p, k) => ({
            id: `init-${i}-${j}-${k}`,
            name: p.name,
            division: okr.division,
            contribution: mode === 'VRO' ? 25 + j * 10 + k * 5 : 5 + j * 2 + k,
            status: mode === 'VRO' 
              ? (p.status === 'completed' ? 'complete' : 'on-track') as const
              : 'at-risk' as const,
            valueImpact: p.expectedROI,
            phase: p.status === 'completed' ? 'Complete' : p.status === 'in-progress' ? 'Development' : 'Planning'
          }))
        };
      }),
      collaboratingAgents: mode === 'VRO'
        ? agents.slice(0, 3 + i % 2).map((a, j) => ({
            ...a,
            lastSync: `${5 + j * 5} min ago`
          }))
        : [{ ...agents[0], lastSync: '1 week ago' }],
      totalValueImpact: {
        costSavings: mode === 'VRO' ? Math.round(okr.profit * 0.05) : Math.round(okr.profit * 0.015),
        revenueImpact: mode === 'VRO' ? Math.round(okr.profit * 0.12) : Math.round(okr.profit * 0.03)
      }
    };
  });
}

export function getCompanyMetrics() {
  return {
    totalProfit: divisions.reduce((sum, d) => sum + d.profit2024, 0),
    totalEmployees: lgCompanyOverview.employees,
    aum: lgCompanyOverview.assetsUnderManagement,
    divisions: divisions.length,
    ceo: lgCompanyOverview.ceo,
    cfo: lgCompanyOverview.cfo,
    cro: lgCompanyOverview.cro
  };
}
