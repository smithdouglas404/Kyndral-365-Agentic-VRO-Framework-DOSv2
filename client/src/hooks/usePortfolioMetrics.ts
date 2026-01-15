import { useQuery } from "@tanstack/react-query";

export interface PortfolioMetrics {
  summary: {
    totalProjects: number;
    projectsByStatus: {
      green: number;
      amber: number;
      red: number;
    };
    criticalProjects: number;
    highProjects: number;
  };
  financial: {
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    totalRoiValue: number;
    budgetUnit: string;
  };
  performance: {
    avgPredictability: number;
    avgVelocity: number;
    healthScore: number;
  };
  lastCalculated: string;
}

export interface BusinessUnitMetrics {
  businessUnitId: string;
  totalProjects: number;
  projectsByStatus: {
    green: number;
    amber: number;
    red: number;
  };
  financial: {
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    totalRoiValue: number;
  };
  lastCalculated: string;
}

export function usePortfolioMetrics() {
  return useQuery<PortfolioMetrics, Error>({
    queryKey: ["portfolio-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/portfolio/metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio metrics");
      }
      return response.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useBusinessUnitMetrics(businessUnitId: string) {
  return useQuery<BusinessUnitMetrics, Error>({
    queryKey: ["portfolio-metrics", businessUnitId],
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/metrics/${encodeURIComponent(businessUnitId)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch business unit metrics");
      }
      return response.json();
    },
    enabled: !!businessUnitId,
    staleTime: 30000,
  });
}
