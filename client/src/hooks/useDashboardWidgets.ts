import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface DashboardWidget {
  id: string;
  widgetKey: string;
  widgetType: string;
  title: string;
  description: string | null;
  dataSource: string | null;
  category: string | null;
  size: string | null;
  sortOrder: number | null;
  isVisible: boolean | null;
  config: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function useDashboardWidgets(category?: string, includeHidden: boolean = false) {
  return useQuery<DashboardWidget[], Error>({
    queryKey: ["dashboard-widgets", category, includeHidden],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (includeHidden) params.set("all", "true");
      const url = `/api/dashboard/widgets${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard widgets");
      }
      return response.json();
    },
    staleTime: 60000,
  });
}

export function useUpdateDashboardWidget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DashboardWidget> }) => {
      const response = await fetch(`/api/dashboard/widgets/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
    },
  });
}

export function useReorderDashboardWidgets() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (widgets: { id: string; sortOrder: number }[]) => {
      const response = await fetch("/api/dashboard/widgets/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets }),
      });
      if (!response.ok) {
        throw new Error("Failed to reorder widgets");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
    },
  });
}

export function useCreateDashboardWidget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch("/api/dashboard/widgets", {
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
    },
  });
}

export function useDeleteDashboardWidget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dashboard/widgets/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete widget");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
    },
  });
}
