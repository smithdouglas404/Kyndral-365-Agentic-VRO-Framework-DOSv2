// ============================================================================
// AGENT DATA HOOKS - React hooks for live agent data
// ============================================================================

import { useMemo } from 'react';
import {
  getAgentDataSlice,
  getEntityDrilldown,
  getAllCrossAgentMessages,
  getAllAgentsSummary,
  AgentType,
  AgentDataSlice,
  EntityDrilldown,
  CrossAgentMessage,
  AgentMetrics
} from '@/lib/dataHub';

// Hook to get data for a specific agent (simulation removed)
export function useAgentData(agentId: AgentType): AgentDataSlice {
  return useMemo(() => {
    return getAgentDataSlice(agentId);
  }, [agentId]);
}

// Hook to get entity drilldown data
export function useEntityDrilldown(entityType: string, entityId: string): EntityDrilldown | null {
  return useMemo(() => {
    return getEntityDrilldown(entityType, entityId);
  }, [entityType, entityId]);
}

// Hook to get all cross-agent messages
export function useCrossAgentFeed(): CrossAgentMessage[] {
  return useMemo(() => {
    return getAllCrossAgentMessages();
  }, []);
}

// Hook to get summary metrics for all agents
export function useAllAgentsSummary() {
  return useMemo(() => {
    return getAllAgentsSummary();
  }, []);
}

// Hook to get filtered projects by status
export function useProjectsByStatus(status?: 'green' | 'amber' | 'red') {
  const integData = useMemo(() => getAgentDataSlice('integrated-management'), []);

  return useMemo(() => {
    if (!status) return integData.projects;
    return integData.projects.filter(p => p.status === status);
  }, [integData.projects, status]);
}

// Hook to get programs by value status
export function useProgramsByValueStatus(status?: 'accelerating' | 'on-track' | 'at-risk' | 'blocked') {
  const integData = useMemo(() => getAgentDataSlice('integrated-management'), []);

  return useMemo(() => {
    if (!status) return integData.programs;
    return integData.programs.filter(p => p.valueStatus === status);
  }, [integData.programs, status]);
}

// Hook to get real-time metrics
export function useLiveMetrics() {
  return useMemo(() => {
    const allSummary = getAllAgentsSummary();

    return {
      totalProjects: allSummary.totalProjects || 0,
      totalValue: 0,
      realizedValue: 0,
      activeAlerts: allSummary.totalAlerts || 0,
      avgConfidence: allSummary.avgConfidence || 0,
      pendingActions: 0,
    };
  }, []);
}
