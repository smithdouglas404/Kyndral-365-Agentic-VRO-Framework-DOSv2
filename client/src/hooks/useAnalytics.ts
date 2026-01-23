/**
 * ANALYTICS HOOKS
 * React hooks for consuming the three analytics engines:
 * - Predictive Analytics (risk prediction, forecasting, anomaly detection)
 * - Cross-Project Impact (dependencies, cascade analysis, resource contention)
 * - Financial Calculation (EVM, ROI, burn rate, forecasts)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * PREDICTIVE ANALYTICS ENGINE HOOKS
 */

export function useRiskPredictions(options?: {
  projectIds?: string[];
  threshold?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['analytics', 'predictions', options?.projectIds, options?.threshold],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.projectIds) {
        params.append('projectIds', options.projectIds.join(','));
      }
      if (options?.threshold) {
        params.append('threshold', options.threshold.toString());
      }

      const res = await fetch(`/api/analytics/predictions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
    enabled: options?.enabled !== false,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useProjectRiskPrediction(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'predictions', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/predictions/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch prediction');
      return res.json();
    },
    enabled: enabled && !!projectId,
    refetchInterval: 60000,
  });
}

export function useScheduleForecast(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'forecasts', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/forecasts/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch forecast');
      return res.json();
    },
    enabled: enabled && !!projectId,
    refetchInterval: 120000, // Refresh every 2 minutes
  });
}

export function useAnomalies(projectIds?: string[], enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'anomalies', projectIds],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectIds) {
        params.append('projectIds', projectIds.join(','));
      }

      const res = await fetch(`/api/analytics/anomalies?${params}`);
      if (!res.ok) throw new Error('Failed to fetch anomalies');
      return res.json();
    },
    enabled,
    refetchInterval: 120000,
  });
}

/**
 * CROSS-PROJECT IMPACT ENGINE HOOKS
 */

export function useDependencies(options?: {
  portfolioId?: string;
  criticality?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['analytics', 'dependencies', options?.portfolioId, options?.criticality],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.portfolioId) {
        params.append('portfolioId', options.portfolioId);
      }
      if (options?.criticality) {
        params.append('criticality', options.criticality);
      }

      const res = await fetch(`/api/analytics/dependencies?${params}`);
      if (!res.ok) throw new Error('Failed to fetch dependencies');
      return res.json();
    },
    enabled: options?.enabled !== false,
    refetchInterval: 180000, // Refresh every 3 minutes
  });
}

export function useImpactAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      changeType: string;
      delayDays?: number;
      costImpact?: number;
      description?: string;
    }) => {
      const res = await fetch('/api/analytics/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) throw new Error('Failed to analyze impact');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'impact'] });
    },
  });
}

export function useProjectImpactSummary(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'impact', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/impact/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch impact summary');
      return res.json();
    },
    enabled: enabled && !!projectId,
    refetchInterval: 180000,
  });
}

export function useResourceContention(portfolioId?: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'resource-contention', portfolioId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (portfolioId) {
        params.append('portfolioId', portfolioId);
      }

      const res = await fetch(`/api/analytics/resource-contention?${params}`);
      if (!res.ok) throw new Error('Failed to fetch resource contention');
      return res.json();
    },
    enabled,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

/**
 * FINANCIAL CALCULATION ENGINE HOOKS
 */

export function useFinancialMetrics(options?: {
  portfolioId?: string;
  businessUnitId?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['analytics', 'financial', 'metrics', options?.portfolioId, options?.businessUnitId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.portfolioId) {
        params.append('portfolioId', options.portfolioId);
      }
      if (options?.businessUnitId) {
        params.append('businessUnitId', options.businessUnitId);
      }

      const res = await fetch(`/api/analytics/financial/metrics?${params}`);
      if (!res.ok) throw new Error('Failed to fetch financial metrics');
      return res.json();
    },
    enabled: options?.enabled !== false,
    refetchInterval: 60000,
  });
}

export function useEVM(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'financial', 'evm', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/financial/evm/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch EVM');
      return res.json();
    },
    enabled: enabled && !!projectId,
    refetchInterval: 60000,
  });
}

export function useROI(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'financial', 'roi', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/financial/roi/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch ROI');
      return res.json();
    },
    enabled: enabled && !!projectId,
    refetchInterval: 120000,
  });
}

export function useBurnRate(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'financial', 'burn-rate', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/financial/burn-rate/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch burn rate');
      return res.json();
    },
    enabled: enabled && !!projectId,
    refetchInterval: 60000,
  });
}

export function useFinancialForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      scenarios?: any;
    }) => {
      const res = await fetch('/api/analytics/financial/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) throw new Error('Failed to forecast completion');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['analytics', 'financial', 'forecast', variables.projectId],
      });
    },
  });
}
