import { useQuery } from "@tanstack/react-query";

export interface Division {
  id: string;
  name: string;
  ceo: string | null;
  profit2023: number | null;
  profit2024: number | null;
  changePercent: number | null;
  description: string | null;
  color: string | null;
  portfolioId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DivisionKpi {
  id: string;
  divisionId: string;
  name: string;
  value2023: string | null;
  value2024: string | null;
  target2025: string | null;
  unit: string | null;
  trend: string | null;
  status: string | null;
}

export interface DivisionOkr {
  id: string;
  divisionId: string;
  objective: string;
  keyResults: string | null;
  owner: string | null;
  dueDate: string | null;
}

export interface DivisionRisk {
  id: string;
  divisionId: string;
  type: string;
  level: string | null;
  description: string | null;
  mitigation: string | null;
}

export interface FullDivision {
  division: Division;
  kpis: DivisionKpi[];
  okrs: DivisionOkr[];
  risks: DivisionRisk[];
}

export interface CompanyOverview {
  id: string;
  companyName: string;
  yearsOfHistory: number | null;
  employees: number | null;
  adjustedOperatingProfitValue: number | null;
  adjustedOperatingProfitUnit: string | null;
  adjustedOperatingProfitYear: number | null;
  assetsUnderManagementValue: number | null;
  assetsUnderManagementUnit: string | null;
  proprietaryAssetsValue: number | null;
  proprietaryAssetsUnit: string | null;
  fortune200: boolean | null;
  ceo: string | null;
  cfo: string | null;
  cro: string | null;
  climateDirector: string | null;
  source: string | null;
  sustainalyticsPercentile: number | null;
  sustainalyticsRating: string | null;
  msciRating: string | null;
}

export interface ClimateMetric {
  id: string;
  category: string;
  metricName: string;
  value: number | null;
  unit: string | null;
  description: string | null;
  targetValue: number | null;
  targetYear: number | null;
  baseYear: number | null;
  progress: number | null;
  source: string | null;
}

export interface EnterpriseRiskCategory {
  id: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  color: string | null;
}

export interface EnterpriseRisk {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  severity: string | null;
  trend: string | null;
}

export interface EnterpriseRiskProfile {
  categories: (EnterpriseRiskCategory & { risks: EnterpriseRisk[] })[];
}

export function useDivisions() {
  return useQuery<Division[]>({
    queryKey: ["/api/divisions"],
    queryFn: async () => {
      const response = await fetch("/api/divisions");
      if (!response.ok) throw new Error("Failed to fetch divisions");
      return response.json();
    }
  });
}

export function useDivision(id: string) {
  return useQuery<Division>({
    queryKey: ["/api/divisions", id],
    queryFn: async () => {
      const response = await fetch(`/api/divisions/${id}`);
      if (!response.ok) throw new Error("Failed to fetch division");
      return response.json();
    },
    enabled: !!id
  });
}

export function useFullDivision(id: string) {
  return useQuery<FullDivision>({
    queryKey: ["/api/divisions", id, "full"],
    queryFn: async () => {
      const response = await fetch(`/api/divisions/${id}/full`);
      if (!response.ok) throw new Error("Failed to fetch full division");
      return response.json();
    },
    enabled: !!id
  });
}

export function useCompanyOverview() {
  return useQuery<CompanyOverview>({
    queryKey: ["/api/company/overview"],
    queryFn: async () => {
      const response = await fetch("/api/company/overview");
      if (!response.ok) throw new Error("Failed to fetch company overview");
      return response.json();
    }
  });
}

export function useClimateMetrics(category?: string) {
  return useQuery<ClimateMetric[]>({
    queryKey: ["/api/climate/metrics", category],
    queryFn: async () => {
      const url = category 
        ? `/api/climate/metrics/${category}` 
        : "/api/climate/metrics";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch climate metrics");
      return response.json();
    }
  });
}

export function useEnterpriseRiskCategories() {
  return useQuery<EnterpriseRiskCategory[]>({
    queryKey: ["/api/enterprise-risks/categories"],
    queryFn: async () => {
      const response = await fetch("/api/enterprise-risks/categories");
      if (!response.ok) throw new Error("Failed to fetch risk categories");
      return response.json();
    }
  });
}

export function useEnterpriseRisks(categoryId?: string) {
  return useQuery<EnterpriseRisk[]>({
    queryKey: ["/api/enterprise-risks", categoryId],
    queryFn: async () => {
      const url = categoryId 
        ? `/api/enterprise-risks?categoryId=${categoryId}` 
        : "/api/enterprise-risks";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch enterprise risks");
      return response.json();
    }
  });
}

export function useEnterpriseRiskProfile() {
  return useQuery<EnterpriseRiskProfile>({
    queryKey: ["/api/enterprise-risks/profile"],
    queryFn: async () => {
      const response = await fetch("/api/enterprise-risks/profile");
      if (!response.ok) throw new Error("Failed to fetch risk profile");
      return response.json();
    }
  });
}
