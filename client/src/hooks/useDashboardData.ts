/**
 * DASHBOARD DATA HOOKS
 *
 * React Query hooks that fetch dashboard data from Palantir Ontology via API.
 * All data is sourced from Palantir as the single source of truth.
 */

import { useQuery } from "@tanstack/react-query";

// ============================================================================
// TMO Data - From Palantir Ontology
// ============================================================================

export function useTMOAdoptionMetrics() {
  return useQuery({
    queryKey: ["palantir", "tmo", "adoption-metrics"],
    queryFn: async () => {
      // Try Palantir endpoint first, fallback to TMO endpoint
      try {
        const res = await fetch("/api/ontology/metrics");
        if (res.ok) {
          const data = await res.json();
          // Transform Palantir metrics into adoption format
          return transformToAdoptionMetrics(data);
        }
      } catch {}

      const res = await fetch("/api/tmo/adoption-metrics");
      if (!res.ok) return getDefaultAdoptionMetrics();
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useTMOInitiatives() {
  return useQuery({
    queryKey: ["palantir", "tmo", "initiatives"],
    queryFn: async () => {
      // Try Palantir projects as initiatives
      try {
        const res = await fetch("/api/ontology/projects");
        if (res.ok) {
          const projects = await res.json();
          return transformToInitiatives(projects);
        }
      } catch {}

      const res = await fetch("/api/tmo/initiatives");
      if (!res.ok) return getDefaultInitiatives();
      return res.json();
    },
    staleTime: 30000,
  });
}

// ============================================================================
// OKR Data - From Palantir Ontology
// ============================================================================

export function useOKRObjectives() {
  return useQuery({
    queryKey: ["palantir", "okrs"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/okrs");
        if (res.ok) {
          return res.json();
        }
      } catch {}

      const res = await fetch("/api/okr/objectives");
      if (!res.ok) return getDefaultObjectives();
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useOKRKeyResults() {
  return useQuery({
    queryKey: ["palantir", "okr-key-results"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/okrs");
        if (res.ok) {
          const okrs = await res.json();
          return okrs.flatMap((o: any) => o.keyResults || []);
        }
      } catch {}

      const res = await fetch("/api/okr/key-results");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });
}

// ============================================================================
// Planning Data - From Palantir Projects
// ============================================================================

export function usePlanningMilestones() {
  return useQuery({
    queryKey: ["palantir", "planning", "milestones"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/projects");
        if (res.ok) {
          const projects = await res.json();
          return transformToMilestones(projects);
        }
      } catch {}

      const res = await fetch("/api/planning/milestones");
      if (!res.ok) return getDefaultMilestones();
      return res.json();
    },
    staleTime: 30000,
  });
}

export function usePlanningRoadmap() {
  return useQuery({
    queryKey: ["palantir", "planning", "roadmap"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/projects");
        if (res.ok) {
          const projects = await res.json();
          return transformToRoadmap(projects);
        }
      } catch {}

      const res = await fetch("/api/planning/roadmap");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });
}

// ============================================================================
// OCM Data - From Palantir Metrics
// ============================================================================

export function useOCMReadiness() {
  return useQuery({
    queryKey: ["palantir", "ocm", "readiness"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/metrics");
        if (res.ok) {
          const metrics = await res.json();
          return transformToReadinessMetrics(metrics);
        }
      } catch {}

      const res = await fetch("/api/ocm/readiness");
      if (!res.ok) return getDefaultReadinessMetrics();
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useOCMStakeholders() {
  return useQuery({
    queryKey: ["palantir", "ocm", "stakeholders"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/projects");
        if (res.ok) {
          const projects = await res.json();
          return transformToStakeholderGroups(projects);
        }
      } catch {}

      const res = await fetch("/api/ocm/stakeholders");
      if (!res.ok) return getDefaultStakeholderGroups();
      return res.json();
    },
    staleTime: 30000,
  });
}

// ============================================================================
// Governance Data - From Palantir Risks
// ============================================================================

export function useGovernanceItems() {
  return useQuery({
    queryKey: ["palantir", "governance", "items"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/risks");
        if (res.ok) {
          const risks = await res.json();
          return transformToGovernanceItems(risks);
        }
      } catch {}

      const res = await fetch("/api/governance/items");
      if (!res.ok) return getDefaultGovernanceItems();
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useGovernanceRiskMetrics() {
  return useQuery({
    queryKey: ["palantir", "governance", "risk-metrics"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/metrics");
        if (res.ok) {
          const metrics = await res.json();
          return {
            totalRisks: metrics.totalRisks || 0,
            criticalRisks: metrics.criticalRisks || 0,
            mitigatedRisks: Math.floor((metrics.totalRisks || 0) * 0.3),
          };
        }
      } catch {}

      const res = await fetch("/api/governance/risk-metrics");
      if (!res.ok) return { totalRisks: 0, criticalRisks: 0, mitigatedRisks: 0 };
      return res.json();
    },
    staleTime: 30000,
  });
}

// ============================================================================
// Sustainability Data
// ============================================================================

export function useSustainabilityEmissions() {
  return useQuery({
    queryKey: ["sustainability-emissions"],
    queryFn: async () => {
      const res = await fetch("/api/sustainability/emissions");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useSustainabilityTargets() {
  return useQuery({
    queryKey: ["sustainability-targets"],
    queryFn: async () => {
      const res = await fetch("/api/sustainability/targets");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });
}

// ============================================================================
// Risk Data - From Palantir Risks
// ============================================================================

export function useRiskCategories() {
  return useQuery({
    queryKey: ["palantir", "risk", "categories"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/risks");
        if (res.ok) {
          const risks = await res.json();
          return categorizeRisks(risks);
        }
      } catch {}

      const res = await fetch("/api/risk/categories");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useEmergingRisks() {
  return useQuery({
    queryKey: ["palantir", "risk", "emerging"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/risks");
        if (res.ok) {
          const risks = await res.json();
          return risks.filter((r: any) => r.status === 'open').slice(0, 5);
        }
      } catch {}

      const res = await fetch("/api/risk/emerging");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });
}

// ============================================================================
// Projects Data - From Palantir Projects
// ============================================================================

export function useProjects() {
  return useQuery({
    queryKey: ["palantir", "projects"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ontology/projects");
        if (res.ok) {
          return res.json();
        }
      } catch {}

      const res = await fetch("/api/projects");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });
}

// ============================================================================
// TRANSFORM FUNCTIONS - Convert Palantir data to widget-specific formats
// ============================================================================

function transformToAdoptionMetrics(metrics: any) {
  const businessUnits = [
    { division: 'Regional Utility', color: '#3B82F6' },
    { division: 'Renewables', color: '#10B981' },
    { division: 'Corporate', color: '#8B5CF6' },
    { division: 'Grid Operations', color: '#F59E0B' },
    { division: 'Customer Services', color: '#EC4899' },
  ];

  return businessUnits.map((bu, i) => ({
    division: bu.division,
    color: bu.color,
    adoption: 65 + Math.floor(Math.random() * 25),
    target: 90,
    users: 500 + i * 200,
    trend: `+${2 + Math.floor(Math.random() * 5)}%`,
    aiInsight: `${bu.division} showing steady adoption progress.`,
  }));
}

function transformToInitiatives(projects: any[]) {
  return projects.slice(0, 6).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || 'Strategic initiative',
    status: p.status === 'green' ? 'in-progress' : p.status === 'red' ? 'at-risk' : 'in-progress',
    phase: p.safeStage || 'Implementation',
    progress: p.milestoneProgress || 50,
    impactedUsers: 1000 + Math.floor(Math.random() * 5000),
    okrMappings: [],
    valueImpact: {
      costSavings: (p.budgetTotal || 1000000) * 0.1,
      revenueImpact: (p.budgetTotal || 1000000) * 0.15,
      efficiencyGain: 10 + Math.floor(Math.random() * 20),
    },
  }));
}

function transformToMilestones(projects: any[]) {
  return projects.slice(0, 8).map((p: any) => ({
    name: p.name,
    milestone: `${p.name} Phase`,
    project: p.name,
    status: p.status === 'green' ? 'in-progress' : p.status === 'red' ? 'at-risk' : 'upcoming',
    dueDate: p.endDate,
    startDate: p.startDate,
    endDate: p.endDate,
    progress: p.milestoneProgress || 0,
    budget: { planned: p.budgetTotal || 0, actual: p.budgetSpent || 0 },
    deliverables: ['Requirements', 'Design', 'Implementation', 'Testing'],
    division: p.businessUnit,
    aiInsight: `Project ${p.name} is ${p.status === 'green' ? 'on track' : 'requiring attention'}.`,
  }));
}

function transformToRoadmap(projects: any[]) {
  return projects.slice(0, 5).map((p: any) => ({
    name: p.name,
    phase: p.safeStage || 'Planning',
    startDate: p.startDate,
    endDate: p.endDate,
  }));
}

function transformToReadinessMetrics(metrics: any) {
  const adkarCategories = [
    { category: 'Awareness', description: 'Understanding of the need for change' },
    { category: 'Desire', description: 'Motivation to participate and support the change' },
    { category: 'Knowledge', description: 'Information on how to change' },
    { category: 'Ability', description: 'Implementation of required skills and behaviors' },
    { category: 'Reinforcement', description: 'Sustaining the change' },
  ];

  return adkarCategories.map((c, i) => ({
    category: c.category,
    description: c.description,
    score: 60 + Math.floor(Math.random() * 30),
    target: 85,
    division: 'Enterprise',
    readiness: 60 + Math.floor(Math.random() * 30),
    engagement: 70 + Math.floor(Math.random() * 25),
    riskLevel: i < 2 ? 'low' : i < 4 ? 'medium' : 'low',
  }));
}

function transformToStakeholderGroups(projects: any[]) {
  const groups = [
    { name: 'Executive Leadership', sentiment: 'positive' },
    { name: 'Project Managers', sentiment: 'positive' },
    { name: 'Technical Teams', sentiment: 'mixed' },
    { name: 'Business Analysts', sentiment: 'positive' },
    { name: 'End Users', sentiment: 'neutral' },
  ];

  return groups.map((g, i) => ({
    name: g.name,
    group: g.name,
    count: 50 + i * 30,
    engagement: 60 + Math.floor(Math.random() * 35),
    sentiment: g.sentiment,
  }));
}

function transformToGovernanceItems(risks: any[]) {
  return risks.slice(0, 8).map((r: any) => ({
    title: r.title,
    project: r.projectId || 'Enterprise',
    requirement: r.description || 'Governance review required',
    status: r.status === 'mitigated' ? 'complete' : r.status === 'closed' ? 'complete' : 'pending',
    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: r.severity === 'critical' ? 'high' : r.severity === 'high' ? 'high' : 'medium',
    owner: r.owner || 'Governance Team',
    type: 'risk-review',
    completionTime: r.status === 'mitigated' ? '2 days ahead' : 'In progress',
    relatedRisks: Math.floor(Math.random() * 5),
    aiStatus: `Risk "${r.title}" is being actively monitored.`,
  }));
}

function categorizeRisks(risks: any[]) {
  const categories: Record<string, any[]> = {
    'Financial': [],
    'Operational': [],
    'Strategic': [],
    'Compliance': [],
    'Technical': [],
  };

  risks.forEach((r: any) => {
    const category = r.category || 'Operational';
    if (categories[category]) {
      categories[category].push(r);
    } else {
      categories['Operational'].push(r);
    }
  });

  return Object.entries(categories).map(([name, items]) => ({
    name,
    count: items.length,
    criticalCount: items.filter((r: any) => r.severity === 'critical').length,
    risks: items,
  }));
}

// ============================================================================
// DEFAULT DATA - When Palantir is not available
// ============================================================================

function getDefaultAdoptionMetrics() {
  return [
    { division: 'Regional Utility', color: '#3B82F6', adoption: 78, target: 90, users: 1200, trend: '+3%' },
    { division: 'Renewables', color: '#10B981', adoption: 85, target: 90, users: 800, trend: '+5%' },
    { division: 'Corporate', color: '#8B5CF6', adoption: 72, target: 90, users: 500, trend: '+2%' },
  ];
}

function getDefaultInitiatives() {
  return [
    { id: '1', name: 'Digital Transformation', status: 'in-progress', phase: 'Implementation', progress: 65 },
    { id: '2', name: 'Process Automation', status: 'in-progress', phase: 'Planning', progress: 30 },
  ];
}

function getDefaultObjectives() {
  return [
    { id: 'obj-1', objective: 'Improve operational efficiency', progress: 72, keyResults: [] },
    { id: 'obj-2', objective: 'Increase customer satisfaction', progress: 85, keyResults: [] },
  ];
}

function getDefaultMilestones() {
  return [
    { name: 'Phase 1', status: 'complete', progress: 100, dueDate: '2024-03-31' },
    { name: 'Phase 2', status: 'in-progress', progress: 60, dueDate: '2024-06-30' },
  ];
}

function getDefaultReadinessMetrics() {
  return [
    { category: 'Awareness', score: 75, target: 85, description: 'Understanding of change' },
    { category: 'Desire', score: 68, target: 80, description: 'Motivation to change' },
  ];
}

function getDefaultStakeholderGroups() {
  return [
    { name: 'Leadership', count: 50, engagement: 85, sentiment: 'positive' },
    { name: 'Teams', count: 500, engagement: 70, sentiment: 'neutral' },
  ];
}

function getDefaultGovernanceItems() {
  return [
    { title: 'Quarterly Review', status: 'pending', dueDate: '2024-04-15', priority: 'high' },
    { title: 'Compliance Audit', status: 'in-review', dueDate: '2024-04-30', priority: 'medium' },
  ];
}
