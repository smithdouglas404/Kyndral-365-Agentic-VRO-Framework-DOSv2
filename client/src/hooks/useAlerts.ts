import { useQuery } from "@tanstack/react-query";

export interface Alert {
  id: string;
  type: string | null;
  severity: string | null;
  title: string;
  description: string | null;
  source: string | null;
  projectId: string | null;
  status: string | null;
  createdAt: string | null;
}

export function useActiveAlerts() {
  return useQuery<Alert[], Error>({
    queryKey: ["alerts", "active"],
    queryFn: async () => {
      const response = await fetch("/api/alerts/active");
      if (!response.ok) {
        throw new Error("Failed to fetch active alerts");
      }
      return response.json();
    },
    staleTime: 15000,
    refetchInterval: 30000,
  });
}
