/**
 * LIVE PALANTIR DATA HOOK
 *
 * Combines WebSocket real-time updates with React Query for reliable data fetching.
 * This hook provides:
 * - Initial data fetch from API
 * - Automatic polling as fallback
 * - Real-time updates via WebSocket
 * - Connection status indicator
 * - Automatic cache invalidation on agent updates
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

export interface LiveDataOptions {
  /** Polling interval in ms when WebSocket is disconnected (default: 60000) */
  pollingInterval?: number;
  /** How long data is considered fresh (default: 30000) */
  staleTime?: number;
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
  /** Custom fetch function */
  fetcher?: () => Promise<any>;
  /** Initial data to use before fetch completes */
  initialData?: any;
}

export interface LiveDataResult<T> {
  /** The current data */
  data: T | undefined;
  /** Whether the WebSocket is connected */
  isLive: boolean;
  /** Whether the initial data is loading */
  isLoading: boolean;
  /** Whether a background refetch is happening */
  isFetching: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Timestamp of last update (from server or WebSocket) */
  lastUpdated: number | null;
  /** Manually trigger a refetch */
  refetch: () => void;
  /** Number of real-time updates received */
  realtimeUpdateCount: number;
}

/**
 * Hook for fetching live data from Palantir with real-time WebSocket updates
 *
 * @param dataType - The type of data to fetch (e.g., "metrics", "projects", "risks")
 * @param options - Configuration options
 * @returns LiveDataResult with data, status, and control functions
 *
 * @example
 * const { data, isLive, isLoading } = useLivePalantirData("metrics");
 *
 * @example
 * const { data, refetch } = useLivePalantirData("projects", {
 *   pollingInterval: 30000,
 *   staleTime: 15000,
 * });
 */
export function useLivePalantirData<T = Record<string, unknown>>(
  dataType: string,
  options: LiveDataOptions = {}
): LiveDataResult<T> {
  const {
    pollingInterval = 60000,
    staleTime = 30000,
    enablePolling = true,
    fetcher,
    initialData,
  } = options;

  const queryClient = useQueryClient();
  const { isConnected, lastMessage } = useWebSocketContext();
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [realtimeUpdateCount, setRealtimeUpdateCount] = useState(0);
  const previousMessageRef = useRef<any>(null);

  // Default fetcher for Palantir ontology data
  const defaultFetcher = useCallback(async () => {
    const response = await fetch(`/api/palantir/ontology/${dataType}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${dataType} from Palantir`);
    }
    const data = await response.json();
    setLastUpdated(Date.now());
    return data;
  }, [dataType]);

  // React Query for initial fetch and polling fallback
  const query = useQuery<T, Error>({
    queryKey: ["palantir", "live", dataType],
    queryFn: fetcher || defaultFetcher,
    staleTime,
    refetchInterval: enablePolling ? pollingInterval : false,
    initialData,
  });

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage || lastMessage === previousMessageRef.current) {
      return;
    }

    previousMessageRef.current = lastMessage;

    // Check if this message is relevant to our data type
    const messageTypes = [
      `agent:${dataType}`,
      `agent:metrics`,
      `agent:project-update`,
      `agent:status-change`,
      "notification",
      "agent:insight",
    ];

    if (messageTypes.includes(lastMessage.type)) {
      // Check if the message contains data relevant to this dataType
      const shouldUpdate =
        lastMessage.type === `agent:${dataType}` ||
        (lastMessage.data?.type && lastMessage.data.type.includes(dataType)) ||
        lastMessage.type === "agent:insight";

      if (shouldUpdate && lastMessage.data) {
        // Merge the new data into the cache
        queryClient.setQueryData(
          ["palantir", "live", dataType],
          (oldData: T | undefined) => {
            if (!oldData) return lastMessage.data;

            // If it's an object, merge the data
            if (typeof oldData === "object" && !Array.isArray(oldData)) {
              return {
                ...oldData,
                ...lastMessage.data,
                _lastWebSocketUpdate: Date.now(),
              };
            }

            // If it's an array, we might want to append or update
            if (Array.isArray(oldData)) {
              // If the message has an id, try to update existing item
              if (lastMessage.data.id) {
                const index = oldData.findIndex(
                  (item: any) => item.id === lastMessage.data.id
                );
                if (index >= 0) {
                  const newData = [...oldData];
                  newData[index] = { ...newData[index], ...lastMessage.data };
                  return newData as T;
                }
              }
              // Otherwise prepend the new data
              return [lastMessage.data, ...oldData] as T;
            }

            return lastMessage.data;
          }
        );

        setLastUpdated(Date.now());
        setRealtimeUpdateCount((c) => c + 1);
      }

      // Also invalidate related queries so other components update
      if (lastMessage.type === "agent:insight") {
        queryClient.invalidateQueries({ queryKey: ["palantir", "metrics"] });
        queryClient.invalidateQueries({ queryKey: ["palantir", "projects"] });
      }
    }
  }, [lastMessage, dataType, queryClient]);

  // Refetch function
  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    data: query.data,
    isLive: isConnected,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    lastUpdated,
    refetch,
    realtimeUpdateCount,
  };
}

/**
 * Hook for subscribing to specific agent data types
 * More granular than useLivePalantirData, designed for agent activity feeds
 */
export function useAgentDataStream(
  agentTypes?: string[]
): {
  events: Array<{
    id: string;
    type: string;
    payload: Record<string, unknown>;
    agentId?: string;
    agentName?: string;
    timestamp: string;
  }>;
  isConnected: boolean;
  clearEvents: () => void;
} {
  const { isConnected, lastMessage } = useWebSocketContext();
  const [events, setEvents] = useState<
    Array<{
      id: string;
      type: string;
      payload: Record<string, unknown>;
      agentId?: string;
      agentName?: string;
      timestamp: string;
    }>
  >([]);
  const previousMessageRef = useRef<any>(null);

  // Fetch recent events on mount
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await fetch("/api/agent/recent?limit=20");
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setEvents(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recent agent events:", error);
      }
    };

    fetchRecent();
  }, []);

  // Listen to WebSocket for new events
  useEffect(() => {
    if (!lastMessage || lastMessage === previousMessageRef.current) {
      return;
    }

    previousMessageRef.current = lastMessage;

    // Check if it's an agent-related message
    if (
      lastMessage.type?.startsWith("agent:") ||
      lastMessage.type === "notification"
    ) {
      const eventType = lastMessage.type.replace("agent:", "");

      // Filter by agent types if specified
      if (agentTypes && agentTypes.length > 0) {
        if (!agentTypes.includes(eventType)) {
          return;
        }
      }

      const newEvent = {
        id: lastMessage.data?.id || `event-${Date.now()}`,
        type: eventType,
        payload: lastMessage.data || {},
        agentId: lastMessage.data?.agentId || lastMessage.data?.sourceId,
        agentName: lastMessage.data?.agentName || lastMessage.data?.source,
        timestamp: lastMessage.data?.createdAt || new Date().toISOString(),
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 100));
    }
  }, [lastMessage, agentTypes]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    isConnected,
    clearEvents,
  };
}

/**
 * Hook for live dashboard metrics with automatic aggregation
 */
export function useLiveDashboardMetrics() {
  const { data, isLive, isLoading, error, lastUpdated, refetch } =
    useLivePalantirData<{
      // Project counts
      totalProjects: number;
      activeProjects: number;
      onTrackProjects: number;
      atRiskProjects: number;
      delayedProjects: number;
      avgProgress: number;
      projectsByStatus: {
        green: number;
        amber: number;
        red: number;
      };
      // Budget & Financial
      totalBudget: number;
      spentBudget: number;
      budgetUtilization: number;
      // Risks
      totalRisks: number;
      criticalRisks: number;
      // OKRs
      okrProgress: number;
      // SAFe breakdown
      totalFeatures: number;
      totalStories: number;
      totalTasks: number;
      totalDependencies: number;
      // EVM metrics
      avgCPI: number;
      avgSPI: number;
      costPerformance: string;
      schedulePerformance: string;
      // Agent assignments
      agentAssignments: Record<string, string[]>;
    }>("metrics", {
      staleTime: 30000,
      pollingInterval: 60000,
    });

  return {
    metrics: data,
    isLive,
    isLoading,
    error,
    lastUpdated,
    refetch,
  };
}

/**
 * Hook for live project list with real-time status updates
 */
export function useLiveProjects(filters?: {
  status?: string;
  businessUnit?: string;
  priority?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.businessUnit) queryParams.set("businessUnit", filters.businessUnit);
  if (filters?.priority) queryParams.set("priority", filters.priority);

  const queryString = queryParams.toString();

  return useLivePalantirData<
    Array<{
      id: string;
      name: string;
      description: string;
      status: "green" | "amber" | "red";
      statusText?: string;
      businessUnit: string;
      priority: "critical" | "high" | "medium" | "low";
      priorityText?: string;
      // Dates
      startDate?: string;
      endDate?: string;
      // Budget
      budgetTotal?: number;
      budgetSpent?: number;
      budgetUnit?: string;
      budgetRemaining?: number;
      budgetUtilization?: number;
      // ROI
      expectedRoi?: string;
      roiValue?: number;
      // Progress & EVM
      progress?: number;
      milestoneProgress?: number;
      cpiValue?: number;
      spiValue?: number;
      earnedValue?: number;
      plannedValue?: number;
      // SAFe
      artName?: string;
      portfolioTheme?: string;
      safeStage?: string;
      currentPi?: string;
      velocity?: number;
      predictability?: number;
      flowEfficiency?: number;
      // Epic
      epicId?: string;
      epicName?: string;
      // Counts
      riskCount?: number;
      featureCount?: number;
      storyCount?: number;
      taskCount?: number;
      dependencyCount?: number;
    }>
  >(`projects${queryString ? `?${queryString}` : ""}`, {
    staleTime: 30000,
    pollingInterval: 60000,
  });
}

export default useLivePalantirData;
