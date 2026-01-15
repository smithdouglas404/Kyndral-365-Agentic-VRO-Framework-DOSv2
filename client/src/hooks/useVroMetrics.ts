import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface VroMetric {
  id: string;
  metricKey: string;
  label: string;
  value: string;
  unit: string | null;
  color: string | null;
  source: string | null;
  category: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
}

export function useVroMetrics() {
  return useQuery<VroMetric[], Error>({
    queryKey: ["vro-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/vro-metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch VRO metrics");
      }
      return response.json();
    },
    staleTime: 30000,
  });
}

export function useUpdateVroMetric() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VroMetric> }) => {
      const response = await fetch(`/api/vro-metrics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error("Failed to update VRO metric");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vro-metrics"] });
    },
  });
}
