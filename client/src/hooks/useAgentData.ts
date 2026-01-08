// ============================================================================
// AGENT DATA HOOKS - React hooks for live agent data
// ============================================================================

import { useMemo } from 'react';
import { useSimulation } from '@/contexts/SimulationContext';
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

// Hook to get live data for a specific agent
// viewMode affects the data: 'realtime' shows current events, 'snapshot' shows 30-day aggregate
export function useAgentData(agentId: AgentType): AgentDataSlice {
  const { events, viewMode } = useSimulation();
  
  return useMemo(() => {
    // In snapshot mode, we could filter events to show 30-day aggregate
    // For now, we return all events but this hook is viewMode-aware
    const filteredEvents = viewMode === 'snapshot' 
      ? events.filter(e => {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return new Date(e.timestamp) >= thirtyDaysAgo;
        })
      : events;
    return getAgentDataSlice(agentId, filteredEvents);
  }, [agentId, events, viewMode]);
}

// Hook to get entity drilldown data
export function useEntityDrilldown(entityType: string, entityId: string): EntityDrilldown | null {
  const { events } = useSimulation();
  
  return useMemo(() => {
    return getEntityDrilldown(entityType, entityId, events);
  }, [entityType, entityId, events]);
}

// Hook to get all cross-agent messages
export function useCrossAgentFeed(): CrossAgentMessage[] {
  const { events } = useSimulation();
  
  return useMemo(() => {
    return getAllCrossAgentMessages(events);
  }, [events]);
}

// Hook to get summary metrics for all agents
export function useAllAgentsSummary(): Record<AgentType, AgentMetrics> {
  const { events } = useSimulation();
  
  return useMemo(() => {
    return getAllAgentsSummary(events);
  }, [events]);
}

// Hook to get filtered projects by status
export function useProjectsByStatus(status?: 'green' | 'amber' | 'red') {
  const { events } = useSimulation();
  const pmoData = useMemo(() => getAgentDataSlice('pmo', events), [events]);
  
  return useMemo(() => {
    if (!status) return pmoData.projects;
    return pmoData.projects.filter(p => p.status === status);
  }, [pmoData.projects, status]);
}

// Hook to get programs by value status
export function useProgramsByValueStatus(status?: 'accelerating' | 'on-track' | 'at-risk' | 'blocked') {
  const { events } = useSimulation();
  const vroData = useMemo(() => getAgentDataSlice('vro', events), [events]);
  
  return useMemo(() => {
    if (!status) return vroData.programs;
    return vroData.programs.filter(p => p.valueStatus === status);
  }, [vroData.programs, status]);
}

// Hook to get real-time metrics with live updates
export function useLiveMetrics() {
  const { events, dataMode } = useSimulation();
  
  return useMemo(() => {
    const allSummary = getAllAgentsSummary(events);
    
    // Aggregate metrics
    const totalProjects = Object.values(allSummary).reduce((sum, a) => sum + a.totalProjects, 0) / 8; // Average since each agent has overlapping projects
    const totalValue = allSummary.vro.totalValue;
    const realizedValue = allSummary.vro.realizedValue;
    const activeAlerts = events.filter(e => !e.read).length;
    const avgConfidence = Object.values(allSummary).reduce((sum, a) => sum + a.avgConfidence, 0) / 8;
    
    // Apply VRO/PMO multipliers
    const confidenceMultiplier = dataMode === 'VRO' ? 1.15 : 0.85;
    
    return {
      totalProjects: Math.round(totalProjects),
      totalValue,
      realizedValue,
      activeAlerts,
      avgConfidence: Math.round(avgConfidence * confidenceMultiplier),
      pendingActions: Object.values(allSummary).reduce((sum, a) => sum + a.pendingActions, 0),
      dataMode
    };
  }, [events, dataMode]);
}
