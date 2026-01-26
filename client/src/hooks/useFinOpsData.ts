import { useQuery } from "@tanstack/react-query";

export interface CostCategory {
  name: string;
  budget: number;
  spent: number;
  forecast: number;
  variance: number;
  division: string;
  savings: number;
  aiInsight: string;
}

export interface SavingsOpportunity {
  area: string;
  potential: number;
  confidence: number;
  status: 'validated' | 'in-progress' | 'pending';
  aiInsight: string;
  division: string;
  roi: number;
  paybackMonths: number;
}

export function useCostCategories() {
  return useQuery<CostCategory[], Error>({
    queryKey: ["finops-cost-categories"],
    queryFn: async () => {
      const response = await fetch("/api/finops/cost-categories");
      if (!response.ok) {
        throw new Error("Failed to fetch cost categories");
      }
      return response.json();
    },
    staleTime: 30000,
  });
}

export function useSavingsOpportunities() {
  return useQuery<SavingsOpportunity[], Error>({
    queryKey: ["finops-savings-opportunities"],
    queryFn: async () => {
      const response = await fetch("/api/finops/savings-opportunities");
      if (!response.ok) {
        throw new Error("Failed to fetch savings opportunities");
      }
      return response.json();
    },
    staleTime: 30000,
  });
}
