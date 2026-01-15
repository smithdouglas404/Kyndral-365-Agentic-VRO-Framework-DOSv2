import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AppConfig {
  id: string;
  configKey: string;
  configValue: string;
  description: string | null;
  category: string | null;
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
