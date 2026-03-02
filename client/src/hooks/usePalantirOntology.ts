/**
 * PALANTIR ONTOLOGY HOOKS
 *
 * React Query hooks for fetching data from Palantir Foundry ontology.
 * This is the SINGLE SOURCE OF TRUTH for all business data in the application.
 *
 * Architecture:
 * - All project/financial/risk/OKR data comes from Palantir ontology
 * - External systems (Jira, OpenProject, Monday) sync TO Palantir
 * - This app reads FROM Palantir only
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================================================
// TYPE DEFINITIONS - Palantir Ontology Objects
// ============================================================================

export interface OntologyObjectType {
  apiName: string;
  displayName: string;
  description?: string;
  primaryKey: string;
  properties: Record<string, OntologyProperty>;
  links?: Record<string, OntologyLink>;
}

export interface OntologyProperty {
  type: string;
  description?: string;
  nullable?: boolean;
}

export interface OntologyLink {
  targetObjectType: string;
  cardinality: "ONE" | "MANY";
}

export interface OntologySchema {
  objectTypes: OntologyObjectType[];
  totalCount: number;
  lastUpdated: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  projectsByStatus: {
    green: number;
    amber: number;
    red: number;
  };
  totalBudget: number;
  spentBudget: number;
  totalRisks: number;
  criticalRisks: number;
  okrProgress: number;
  agentAssignments: Record<string, string[]>;
}

export interface OntologyProject {
  id: string;
  name: string;
  description?: string;
  status: "green" | "amber" | "red";
  businessUnit: string;
  startDate?: string;
  endDate?: string;
  priority: "critical" | "high" | "medium" | "low";
  budgetTotal?: number;
  budgetSpent?: number;
  budgetUnit?: string;
  expectedRoi?: string;
  roiValue?: number;
  // SAFe fields
  artName?: string;
  portfolioTheme?: string;
  safeStage?: string;
  currentPi?: string;
  velocity?: number;
  predictability?: number;
  flowEfficiency?: number;
  // Counts
  featureCount?: number;
  storyCount?: number;
  taskCount?: number;
  riskCount?: number;
  dependencyCount?: number;
}

export interface OntologyRisk {
  id: string;
  title: string;
  description?: string;
  severity: "critical" | "high" | "medium" | "low";
  probability: number;
  impact: number;
  status: "open" | "mitigated" | "closed";
  projectId?: string;
  owner?: string;
  mitigationPlan?: string;
}

export interface OntologyOKR {
  id: string;
  objective: string;
  keyResults: Array<{
    id: string;
    description: string;
    progress: number;
    target: number;
    unit: string;
  }>;
  progress: number;
  owner?: string;
  period?: string;
  strategicPriority?: string;
}

export interface OntologyFinancial {
  id: string;
  projectId: string;
  budgetAllocated: number;
  budgetSpent: number;
  budgetRemaining: number;
  forecastAtCompletion: number;
  variance: number;
  variancePercent: number;
  burnRate?: number;
  lastUpdated: string;
}

export interface SyncConfig {
  system: "jira" | "openproject" | "monday";
  baseUrl: string;
  credentials: {
    email?: string;
    apiToken?: string;
    apiKey?: string;
  };
  projectKey?: string;
  boardId?: string;
}

export interface SyncResult {
  success: boolean;
  system: string;
  objectsCreated: number;
  objectsUpdated: number;
  errors: string[];
  syncedAt: string;
  duration: number;
}

// ============================================================================
// SCHEMA & METADATA HOOKS
// ============================================================================

/**
 * Fetch the full Palantir ontology schema
 */
export function useOntologySchema() {
  return useQuery<OntologySchema, Error>({
    queryKey: ["palantir", "schema"],
    queryFn: async () => {
      const response = await fetch("/api/palantir/ontology/schema");
      if (!response.ok) {
        throw new Error("Failed to fetch ontology schema");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - schema rarely changes
  });
}

/**
 * Fetch aggregated dashboard metrics from Palantir
 */
export function useDashboardMetrics() {
  return useQuery<DashboardMetrics, Error>({
    queryKey: ["palantir", "metrics"],
    queryFn: async () => {
      const response = await fetch("/api/palantir/ontology/metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard metrics");
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// ============================================================================
// PROJECT HOOKS
// ============================================================================

/**
 * Fetch all projects from Palantir ontology
 */
export function useOntologyProjects(filters?: {
  status?: string;
  businessUnit?: string;
  priority?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.businessUnit) queryParams.set("businessUnit", filters.businessUnit);
  if (filters?.priority) queryParams.set("priority", filters.priority);

  const queryString = queryParams.toString();

  return useQuery<OntologyProject[], Error>({
    queryKey: ["palantir", "projects", filters],
    queryFn: async () => {
      const url = `/api/palantir/ontology/projects${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch projects from ontology");
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single project by ID from Palantir ontology
 */
export function useOntologyProject(projectId: string) {
  return useQuery<OntologyProject, Error>({
    queryKey: ["palantir", "project", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/palantir/ontology/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project from ontology");
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch projects by business unit
 */
export function useOntologyProjectsByBU(businessUnit: string | string[]) {
  const buList = Array.isArray(businessUnit) ? businessUnit : [businessUnit];

  return useQuery<OntologyProject[], Error>({
    queryKey: ["palantir", "projects", "by-bu", buList],
    queryFn: async () => {
      const response = await fetch(`/api/palantir/ontology/projects?businessUnits=${buList.join(",")}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects by business unit");
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// RISK HOOKS
// ============================================================================

/**
 * Fetch all risks from Palantir ontology
 */
export function useOntologyRisks(filters?: {
  severity?: string;
  status?: string;
  projectId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.severity) queryParams.set("severity", filters.severity);
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.projectId) queryParams.set("projectId", filters.projectId);

  const queryString = queryParams.toString();

  return useQuery<OntologyRisk[], Error>({
    queryKey: ["palantir", "risks", filters],
    queryFn: async () => {
      const url = `/api/palantir/ontology/risks${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch risks from ontology");
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// OKR HOOKS
// ============================================================================

/**
 * Fetch all OKRs from Palantir ontology
 */
export function useOntologyOKRs(filters?: {
  period?: string;
  owner?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.period) queryParams.set("period", filters.period);
  if (filters?.owner) queryParams.set("owner", filters.owner);

  const queryString = queryParams.toString();

  return useQuery<OntologyOKR[], Error>({
    queryKey: ["palantir", "okrs", filters],
    queryFn: async () => {
      const url = `/api/palantir/ontology/okrs${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch OKRs from ontology");
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// FINANCIAL HOOKS
// ============================================================================

/**
 * Fetch financial data from Palantir ontology
 */
export function useOntologyFinancials(projectId?: string) {
  return useQuery<OntologyFinancial[], Error>({
    queryKey: ["palantir", "financials", projectId],
    queryFn: async () => {
      const url = projectId
        ? `/api/palantir/ontology/financials?projectId=${projectId}`
        : "/api/palantir/ontology/financials";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch financials from ontology");
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// GENERIC OBJECT TYPE HOOKS
// ============================================================================

/**
 * Query any object type from the Palantir ontology
 */
export function useOntologyObjects<T = Record<string, unknown>>(
  objectType: string,
  filters?: Record<string, string | number | boolean>
) {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.set(key, String(value));
    });
  }

  const queryString = queryParams.toString();

  return useQuery<T[], Error>({
    queryKey: ["palantir", "objects", objectType, filters],
    queryFn: async () => {
      const url = `/api/palantir/ontology/${objectType}${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${objectType} from ontology`);
      }
      return response.json();
    },
    enabled: !!objectType,
    staleTime: 30 * 1000,
  });
}

/**
 * Get a single object by ID from any object type
 */
export function useOntologyObject<T = Record<string, unknown>>(
  objectType: string,
  objectId: string
) {
  return useQuery<T, Error>({
    queryKey: ["palantir", "object", objectType, objectId],
    queryFn: async () => {
      const response = await fetch(`/api/palantir/ontology/${objectType}/${objectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${objectType} object from ontology`);
      }
      return response.json();
    },
    enabled: !!objectType && !!objectId,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// AGENT DATA HOOKS
// ============================================================================

/**
 * Fetch data for a specific agent type from Palantir
 */
export function useAgentOntologyData(agentType: string) {
  return useQuery<{
    objectTypes: string[];
    data: Record<string, unknown[]>;
    summary: Record<string, number>;
  }, Error>({
    queryKey: ["palantir", "agent-data", agentType],
    queryFn: async () => {
      const response = await fetch(`/api/palantir/ontology/agent/${agentType}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ontology data for agent: ${agentType}`);
      }
      return response.json();
    },
    enabled: !!agentType,
    staleTime: 60 * 1000, // 1 minute for agent data
  });
}

// ============================================================================
// SYNC HOOKS
// ============================================================================

/**
 * Trigger a sync from Jira to Palantir
 */
export function useSyncJira() {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey?: string;
  }>({
    mutationFn: async (config) => {
      const response = await fetch("/api/palantir/sync/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sync from Jira");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all Palantir data queries after sync
      queryClient.invalidateQueries({ queryKey: ["palantir"] });
    },
  });
}

/**
 * Trigger a sync from OpenProject to Palantir
 */
export function useSyncOpenProject() {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, {
    baseUrl: string;
    apiKey: string;
    projectId?: string;
  }>({
    mutationFn: async (config) => {
      const response = await fetch("/api/palantir/sync/openproject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sync from OpenProject");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["palantir"] });
    },
  });
}

/**
 * Trigger a sync from Monday.com to Palantir
 */
export function useSyncMonday() {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, {
    apiToken: string;
    boardId?: string;
  }>({
    mutationFn: async (config) => {
      const response = await fetch("/api/palantir/sync/monday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sync from Monday.com");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["palantir"] });
    },
  });
}

/**
 * Clear the Palantir ontology cache
 */
export function useClearOntologyCache() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error>({
    mutationFn: async () => {
      const response = await fetch("/api/palantir/cache/clear", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to clear cache");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all queries to force refetch
      queryClient.invalidateQueries({ queryKey: ["palantir"] });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Check Palantir connection status
 */
export function usePalantirStatus() {
  return useQuery<{
    connected: boolean;
    hostname?: string;
    objectTypeCount: number;
    lastSync?: string;
  }, Error>({
    queryKey: ["palantir", "status"],
    queryFn: async () => {
      const response = await fetch("/api/palantir/status");
      if (!response.ok) {
        throw new Error("Failed to check Palantir status");
      }
      return response.json();
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Get sync history
 */
export function useSyncHistory(limit = 10) {
  return useQuery<SyncResult[], Error>({
    queryKey: ["palantir", "sync-history", limit],
    queryFn: async () => {
      const response = await fetch(`/api/palantir/sync/history?limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sync history");
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}
