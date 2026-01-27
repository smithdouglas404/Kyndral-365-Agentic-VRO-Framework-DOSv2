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
export function useAllAgentsSummary(): Record<AgentType, AgentMetrics> {
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

    // Aggregate metrics from integrated management agent
    const integ = allSummary['integrated-management'];
    const agentCount = Object.keys(allSummary).length;
    const totalProjects = Object.values(allSummary).reduce((sum, a) => sum + (a?.totalProjects || 0), 0) / agentCount;
    const totalValue = integ?.totalValue || 0;
    const realizedValue = integ?.realizedValue || 0;
    const activeAlerts = 0; // Simulation removed
    const avgConfidence = Object.values(allSummary).reduce((sum, a) => sum + (a?.avgConfidence || 0), 0) / agentCount;
    
    return {
      totalProjects: Math.round(totalProjects),
      totalValue,
      realizedValue,
      activeAlerts,
      avgConfidence: Math.round(avgConfidence),
      pendingActions: Object.values(allSummary).reduce((sum, a) => sum + (a?.pendingActions || 0), 0),
    };
  }, []);
}
