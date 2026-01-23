/**
 * AGENT INSIGHTS HOOKS
 * React hooks for fetching agent-calculated insights from backend engines
 */

import { useQuery } from '@tanstack/react-query';

/**
 * Financial Insights from FinOps Agent
 * Real-time EVM calculations with forecasting
 */
export interface EVMMetrics {
  bac: number;
  ac: number;
  ev: number;
  pv: number;
  cpi: number;
  spi: number;
  eac: number;
  cv: number;
  sv: number;
  vac: number;
}

export interface FinancialInsight {
  projectId: string;
  evm: EVMMetrics;
  forecast: {
    completionDate: string;
    finalCost: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  calculatedAt: string;
}

export interface FinancialInsightsResponse {
  success: boolean;
  calculations: FinancialInsight[];
  aggregated: {
    totalProjects: number;
    totalBAC: number;
    totalAC: number;
    totalEV: number;
    totalPV: number;
    avgCPI: number;
    avgSPI: number;
    totalEAC: number;
    portfolioHealth: number;
  };
  source: string;
}

export function useFinancialInsights(params?: {
  projectIds?: string[];
  divisionId?: string;
  portfolioId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.projectIds) {
    queryParams.set('projectIds', params.projectIds.join(','));
  }
  if (params?.divisionId) {
    queryParams.set('divisionId', params.divisionId);
  }
  if (params?.portfolioId) {
    queryParams.set('portfolioId', params.portfolioId);
  }

  return useQuery<FinancialInsightsResponse>({
    queryKey: ['/api/agent-insights/financial', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/agent-insights/financial?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch financial insights');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Value Insights from VRO Agent
 * Benefits realization tracking and value leakage analysis
 */
export interface ValueInsight {
  projectId: string;
  projectName: string;
  plannedValue: number;
  actualValue: number;
  valueLeakage: number;
  realizationRate: number;
  benefits: any[];
  status: 'on_track' | 'at_risk' | 'high_risk';
}

export interface ValueInsightsResponse {
  success: boolean;
  analysis: ValueInsight[];
  aggregated: {
    totalProjects: number;
    totalPlannedValue: number;
    totalActualValue: number;
    totalValueLeakage: number;
    avgRealizationRate: number;
    projectsOnTrack: number;
    projectsAtRisk: number;
    projectsHighRisk: number;
  };
  source: string;
}

export function useValueInsights(params?: {
  projectIds?: string[];
  portfolioId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.projectIds) {
    queryParams.set('projectIds', params.projectIds.join(','));
  }
  if (params?.portfolioId) {
    queryParams.set('portfolioId', params.portfolioId);
  }

  return useQuery<ValueInsightsResponse>({
    queryKey: ['/api/agent-insights/value', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/agent-insights/value?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch value insights');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });
}

/**
 * Risk Insights from Risk Agent
 * Quantitative risk scoring and portfolio risk analysis
 */
export interface RiskInsight {
  projectId: string;
  projectName: string;
  totalRisks: number;
  totalRiskExposure: number;
  avgRiskScore: number;
  topRisks: any[];
  riskLevel: 'high' | 'medium' | 'low';
}

export interface RiskInsightsResponse {
  success: boolean;
  analysis: RiskInsight[];
  aggregated: {
    totalProjects: number;
    totalRiskExposure: number;
    totalRisks: number;
    avgRiskExposure: number;
    highRiskProjects: number;
    mediumRiskProjects: number;
    lowRiskProjects: number;
  };
  source: string;
}

export function useRiskInsights(params?: {
  portfolioId?: string;
  threshold?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.portfolioId) {
    queryParams.set('portfolioId', params.portfolioId);
  }
  if (params?.threshold) {
    queryParams.set('threshold', params.threshold.toString());
  }

  return useQuery<RiskInsightsResponse>({
    queryKey: ['/api/agent-insights/risks', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/agent-insights/risks?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch risk insights');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });
}

/**
 * Predictive Insights from Predictive Analytics Engine
 * Forecasts and anomaly detection
 */
export interface PredictiveInsight {
  projectId: string;
  riskPrediction: {
    overallRiskScore: number;
    factors: any[];
  };
  scheduleForecast: {
    predictedCompletion: string;
    confidence: number;
  };
  anomalies?: {
    anomalies: any[];
  };
  predictedAt: string;
}

export interface PredictiveInsightsResponse {
  success: boolean;
  predictions: PredictiveInsight[];
  aggregated: {
    totalProjects: number;
    highRiskProjects: number;
    mediumRiskProjects: number;
    lowRiskProjects: number;
    avgRiskScore: number;
    projectsWithAnomalies: number | null;
  };
  source: string;
}

export function usePredictiveInsights(params?: {
  projectIds?: string[];
  portfolioId?: string;
  includeAnomalies?: boolean;
}) {
  const queryParams = new URLSearchParams();
  if (params?.projectIds) {
    queryParams.set('projectIds', params.projectIds.join(','));
  }
  if (params?.portfolioId) {
    queryParams.set('portfolioId', params.portfolioId);
  }
  if (params?.includeAnomalies) {
    queryParams.set('includeAnomalies', 'true');
  }

  return useQuery<PredictiveInsightsResponse>({
    queryKey: ['/api/agent-insights/predictions', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/agent-insights/predictions?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch predictive insights');
      }
      return response.json();
    },
    refetchInterval: 60000, // Predictions change less frequently
  });
}
