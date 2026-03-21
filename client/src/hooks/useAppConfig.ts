import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AppConfig {
  id: string;
  configKey: string;
  configValue: any;
  description: string | null;
  category: string | null;
}

/**
 * Fetch a typed app configuration value with a default fallback
 * @param key - The configuration key (e.g., 'risk.scoring', 'status.colors')
 * @param defaultValue - Default value if config doesn't exist
 */
export function useAppConfigValue<T>(key: string, defaultValue: T) {
  return useQuery<T>({
    queryKey: ["app-config", key],
    queryFn: async () => {
      const response = await fetch(`/api/config/${key}`);
      if (!response.ok) {
        return defaultValue;
      }
      const data = await response.json();
      return data?.configValue ?? defaultValue;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: defaultValue,
  });
}

export function useAppConfig(key: string) {
  return useQuery<AppConfig | null, Error>({
    queryKey: ["config", key],
    queryFn: async () => {
      const response = await fetch(`/api/config/${key}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch config");
      }
      return response.json();
    },
    staleTime: 60000,
  });
}

export function useDemoMode() {
  const { data: config, isLoading } = useAppConfig("demo_mode");
  return {
    isDemoMode: config?.configValue === "true",
    isLoading,
  };
}

export function useSetAppConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value, description, category }: { 
      key: string; 
      value: string; 
      description?: string; 
      category?: string 
    }) => {
      const response = await fetch(`/api/config/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, description, category }),
      });
      if (!response.ok) {
        throw new Error("Failed to set config");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["config", variables.key] });
    },
  });
}

export function useToggleDemoMode() {
  const { isDemoMode } = useDemoMode();
  const setConfig = useSetAppConfig();

  return {
    toggle: () => setConfig.mutate({
      key: "demo_mode",
      value: isDemoMode ? "false" : "true",
      description: "Enable demo simulation mode",
      category: "system"
    }),
    isPending: setConfig.isPending,
  };
}

// ============================================================================
// User Dashboard Config Hooks
// ============================================================================

export interface DashboardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UserDashboardConfig {
  id?: string;
  dashboardType: string;
  layouts: {
    lg?: DashboardLayout[];
    md?: DashboardLayout[];
    sm?: DashboardLayout[];
  };
  visibleWidgets: string[];
  widgetSizes: Record<string, string>;
  widgetConfigs: Record<string, any>;
  isDefault?: boolean;
}

export function useUserDashboardConfig(dashboardType: string) {
  return useQuery<UserDashboardConfig | null>({
    queryKey: ["dashboard-config", dashboardType],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/config/${dashboardType}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard config");
      }
      const data = await response.json();
      return data.config;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSaveDashboardConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dashboardType, config }: { dashboardType: string; config: Omit<UserDashboardConfig, 'id' | 'dashboardType'> }) => {
      const response = await fetch(`/api/dashboard/config/${dashboardType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error("Failed to save dashboard config");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-config", variables.dashboardType] });
    },
  });
}

export function useResetDashboardConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dashboardType: string) => {
      const response = await fetch(`/api/dashboard/config/${dashboardType}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to reset dashboard config");
      }
      return response.json();
    },
    onSuccess: (_, dashboardType) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-config", dashboardType] });
    },
  });
}

// ============================================================================
// User Widgets Hooks
// ============================================================================

export interface UserWidget {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  dataSourceConfig: {
    type: 'ontology' | 'api' | 'agent';
    objectType?: string;
    endpoint?: string;
    agentId?: string;
    filters?: Array<{
      field: string;
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';
      value: any;
    }>;
    refreshInterval?: number;
  };
  visualizationConfig: {
    type: 'metric' | 'chart' | 'table' | 'list' | 'gauge';
    chartType?: 'bar' | 'line' | 'pie' | 'radar' | 'area';
    fields: Array<{
      sourceField: string;
      displayName: string;
      format?: 'number' | 'currency' | 'percent' | 'date';
      aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    }>;
    thresholds?: Array<{
      value: number;
      color: string;
      label?: string;
    }>;
  };
  size: string;
  refreshInterval: number;
  isShared: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useUserWidgets() {
  return useQuery<UserWidget[]>({
    queryKey: ["user-widgets"],
    queryFn: async () => {
      const response = await fetch("/api/user/widgets");
      if (!response.ok) {
        throw new Error("Failed to fetch user widgets");
      }
      const data = await response.json();
      return data.widgets || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateUserWidget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (widget: Omit<UserWidget, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch("/api/user/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(widget),
      });
      if (!response.ok) {
        throw new Error("Failed to create widget");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-widgets"] });
    },
  });
}

export function useUpdateUserWidget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserWidget> }) => {
      const response = await fetch(`/api/user/widgets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error("Failed to update widget");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-widgets"] });
    },
  });
}

export function useDeleteUserWidget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user/widgets/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete widget");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-widgets"] });
    },
  });
}
