import { useQuery } from "@tanstack/react-query";

// TMO Data
export function useTMOAdoptionMetrics() {
  return useQuery({
    queryKey: ["tmo-adoption-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/tmo/adoption-metrics");
      if (!res.ok) throw new Error("Failed to fetch adoption metrics");
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useTMOInitiatives() {
  return useQuery({
    queryKey: ["tmo-initiatives"],
    queryFn: async () => {
      const res = await fetch("/api/tmo/initiatives");
      if (!res.ok) throw new Error("Failed to fetch initiatives");
      return res.json();
    },
    staleTime: 30000,
  });
}

// OKR Data
export function useOKRObjectives() {
  return useQuery({
    queryKey: ["okr-objectives"],
    queryFn: async () => {
      const res = await fetch("/api/okr/objectives");
      if (!res.ok) throw new Error("Failed to fetch objectives");
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useOKRKeyResults() {
  return useQuery({
    queryKey: ["okr-key-results"],
    queryFn: async () => {
      const res = await fetch("/api/okr/key-results");
      if (!res.ok) throw new Error("Failed to fetch key results");
      return res.json();
    },
    staleTime: 30000,
  });
}

// Planning Data
export function usePlanningMilestones() {
  return useQuery({
    queryKey: ["planning-milestones"],
    queryFn: async () => {
      const res = await fetch("/api/planning/milestones");
      if (!res.ok) throw new Error("Failed to fetch milestones");
      return res.json();
    },
    staleTime: 30000,
  });
}

export function usePlanningRoadmap() {
  return useQuery({
    queryKey: ["planning-roadmap"],
    queryFn: async () => {
      const res = await fetch("/api/planning/roadmap");
      if (!res.ok) throw new Error("Failed to fetch roadmap");
      return res.json();
    },
    staleTime: 30000,
  });
}

// OCM Data
export function useOCMReadiness() {
  return useQuery({
    queryKey: ["ocm-readiness"],
    queryFn: async () => {
      const res = await fetch("/api/ocm/readiness");
      if (!res.ok) throw new Error("Failed to fetch readiness");
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useOCMStakeholders() {
  return useQuery({
    queryKey: ["ocm-stakeholders"],
    queryFn: async () => {
      const res = await fetch("/api/ocm/stakeholders");
      if (!res.ok) throw new Error("Failed to fetch stakeholders");
      return res.json();
    },
    staleTime: 30000,
  });
}

// Governance Data
export function useGovernanceItems() {
  return useQuery({
    queryKey: ["governance-items"],
    queryFn: async () => {
      const res = await fetch("/api/governance/items");
      if (!res.ok) throw new Error("Failed to fetch governance items");
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useGovernanceRiskMetrics() {
  return useQuery({
    queryKey: ["governance-risk-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/governance/risk-metrics");
      if (!res.ok) throw new Error("Failed to fetch risk metrics");
      return res.json();
    },
    staleTime: 30000,
  });
}

// Sustainability Data
export function useSustainabilityEmissions() {
  return useQuery({
    queryKey: ["sustainability-emissions"],
    queryFn: async () => {
      const res = await fetch("/api/sustainability/emissions");
      if (!res.ok) throw new Error("Failed to fetch emissions");
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
      if (!res.ok) throw new Error("Failed to fetch targets");
      return res.json();
    },
    staleTime: 30000,
  });
}

// Risk Data
export function useRiskCategories() {
  return useQuery({
    queryKey: ["risk-categories"],
    queryFn: async () => {
      const res = await fetch("/api/risk/categories");
      if (!res.ok) throw new Error("Failed to fetch risk categories");
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useEmergingRisks() {
  return useQuery({
    queryKey: ["emerging-risks"],
    queryFn: async () => {
      const res = await fetch("/api/risk/emerging");
      if (!res.ok) throw new Error("Failed to fetch emerging risks");
      return res.json();
    },
    staleTime: 30000,
  });
}

// Projects Data
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    staleTime: 30000,
  });
}
