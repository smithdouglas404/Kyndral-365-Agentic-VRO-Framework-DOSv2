/**
 * PPM Agent Context
 *
 * Connects to the REAL agent system and Palantir data.
 * Uses existing hooks for actual data - no fake/sample data.
 *
 * Real Agents:
 * - DeepFinOpsAgent, DeepTMOAgent, DeepPMOAgent, DeepVROAgent
 * - DeepRiskAgent, DeepGovernanceAgent, DeepOCMAgent, DeepPlanningAgent
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useOntologyProjects,
  useDashboardMetrics,
  useOntologyRisks,
} from '@/hooks/usePalantirOntology';
import { useValueInsights } from '@/hooks/useAgentInsights';

// ============================================================================
// Types - Based on Real Agent System
// ============================================================================

export interface RealAgent {
  id: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'idle' | 'processing' | 'error';
  lastActivity?: string;
  factSubscriptions?: string[];
}

export interface AgentInsight {
  id: string;
  agentId: string;
  agentName: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  content: string;
  timestamp: string;
  projectId?: string;
  actionUrl?: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  atRiskProjects: number;
  totalBudget: number;
  budgetSpent: number;
  budgetUtilization: number;
  onTrackPercentage: number;
  overallHealth: number;
}

interface PPMAgentContextValue {
  // Real Agents
  agents: RealAgent[];
  isLoadingAgents: boolean;
  getAgent: (id: string) => RealAgent | undefined;

  // Real Metrics from Palantir
  metrics: DashboardMetrics | null;
  isLoadingMetrics: boolean;

  // Real Projects
  projects: any[];
  isLoadingProjects: boolean;

  // Real Risks
  risks: any[];
  isLoadingRisks: boolean;

  // Value Insights (VRO)
  valueInsights: any;
  isLoadingValueInsights: boolean;

  // Agent Insights (from broadcasts)
  insights: AgentInsight[];
  addInsight: (insight: Omit<AgentInsight, 'id' | 'timestamp'>) => void;

  // Chat state
  activeAgentChat: string | null;
  setActiveAgentChat: (agentId: string | null) => void;

  // Selected agent for views
  selectedAgent: string | null;
  setSelectedAgent: (agentId: string | null) => void;

  // Send message to real agent
  sendAgentMessage: (agentId: string, message: string) => Promise<any>;
}

// ============================================================================
// The 8 Real Deep Agents
// ============================================================================

const REAL_AGENTS: RealAgent[] = [
  {
    id: 'finops',
    name: 'FinOps Agent',
    type: 'DeepFinOpsAgent',
    description: 'Financial Intelligence - Budget variance, cost forecasting, ROI optimization',
    capabilities: ['analyze_budget_variance', 'cost_forecasting', 'roi_analysis', 'evm_calculations'],
    status: 'active',
    factSubscriptions: ['project_*:budget_status', 'project_*:cost_variance'],
  },
  {
    id: 'tmo',
    name: 'TMO Agent',
    type: 'DeepTMOAgent',
    description: 'Schedule Intelligence - Schedule variance, critical path, timeline forecasting',
    capabilities: ['analyze_schedule_variance', 'critical_path_analysis', 'resource_bottleneck_detection'],
    status: 'active',
    factSubscriptions: ['project_*:schedule_variance', 'project_*:milestone_status'],
  },
  {
    id: 'pmo',
    name: 'PMO Agent',
    type: 'DeepPMOAgent',
    description: 'Project Management - Project health, milestone tracking, governance enforcement',
    capabilities: ['project_health_analysis', 'milestone_tracking', 'resource_optimization', 'status_reports'],
    status: 'active',
    factSubscriptions: ['project_*:health_score', 'project_*:risk_score', '*:team_velocity'],
  },
  {
    id: 'vro',
    name: 'VRO Agent',
    type: 'DeepVROAgent',
    description: 'Value Realization - Value delivery tracking, benefits realization, strategic alignment',
    capabilities: ['track_value_delivery', 'benefits_realization', 'roi_calculation', 'strategic_alignment'],
    status: 'active',
    factSubscriptions: ['project_*:value_score', 'project_*:benefits_realized'],
  },
  {
    id: 'risk',
    name: 'Risk Agent',
    type: 'DeepRiskAgent',
    description: 'Risk Intelligence - Risk probability analysis, impact assessment, mitigation strategies',
    capabilities: ['analyze_risk_probability', 'assess_impact', 'evaluate_mitigation', 'risk_forecasting'],
    status: 'active',
    factSubscriptions: ['project_*:risk_score', 'project_*:risk_status'],
  },
  {
    id: 'governance',
    name: 'Governance Agent',
    type: 'DeepGovernanceAgent',
    description: 'Compliance Intelligence - Compliance monitoring, stage-gate approvals, policy enforcement',
    capabilities: ['check_compliance_status', 'approval_tracking', 'policy_violation_detection', 'escalation_management'],
    status: 'active',
    factSubscriptions: ['project_*:compliance_status', 'project_*:approval_status'],
  },
  {
    id: 'ocm',
    name: 'OCM Agent',
    type: 'DeepOCMAgent',
    description: 'Change Management - Change impact assessment, stakeholder mapping, adoption tracking',
    capabilities: ['assess_change_impact', 'stakeholder_mapping', 'adoption_metrics', 'resistance_forecasting'],
    status: 'active',
    factSubscriptions: ['project_*:change_readiness', 'project_*:adoption_rate'],
  },
  {
    id: 'planning',
    name: 'Planning Agent',
    type: 'DeepPlanningAgent',
    description: 'Planning Intelligence - Dependency analysis, resource capacity, roadmap coordination',
    capabilities: ['analyze_dependencies', 'resource_capacity_planning', 'roadmap_conflict_detection', 'blocked_work_management'],
    status: 'active',
    factSubscriptions: ['project_*:dependency_status', 'project_*:resource_allocation'],
  },
];

// ============================================================================
// Context
// ============================================================================

const PPMAgentContext = createContext<PPMAgentContextValue | null>(null);

// ============================================================================
// Provider - Connects to Real Data
// ============================================================================

interface PPMAgentProviderProps {
  children: ReactNode;
}

export function PPMAgentProvider({ children }: PPMAgentProviderProps) {
  // Real data from Palantir via existing hooks
  const { data: projects, isLoading: isLoadingProjects } = useOntologyProjects();
  const { data: dashboardMetrics, isLoading: isLoadingMetrics } = useDashboardMetrics();
  const { data: risks, isLoading: isLoadingRisks } = useOntologyRisks();
  const { data: valueInsights, isLoading: isLoadingValueInsights } = useValueInsights();

  // Fetch agent status from registry
  const { data: agentRegistry, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agent-registry'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/agents/registry');
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    staleTime: 30000,
  });

  // Merge registry data with agent definitions
  const agents = useMemo(() => {
    if (!agentRegistry) return REAL_AGENTS;

    return REAL_AGENTS.map((agent) => {
      const registryInfo = agentRegistry.agents?.find(
        (a: any) => a.type === agent.type || a.id === agent.id
      );
      return {
        ...agent,
        status: registryInfo?.status || agent.status,
        lastActivity: registryInfo?.lastActivity,
      };
    });
  }, [agentRegistry]);

  // Transform Palantir metrics to our format
  const metrics: DashboardMetrics | null = useMemo(() => {
    if (!dashboardMetrics) return null;

    return {
      totalProjects: dashboardMetrics.totalProjects || 0,
      activeProjects: dashboardMetrics.activeProjects || 0,
      atRiskProjects: dashboardMetrics.atRiskProjects || 0,
      totalBudget: dashboardMetrics.totalBudget || 0,
      budgetSpent: dashboardMetrics.totalSpent || 0,
      budgetUtilization: dashboardMetrics.budgetUtilization || 0,
      onTrackPercentage: dashboardMetrics.onTrackPercentage || 0,
      overallHealth: dashboardMetrics.overallHealth || 0,
    };
  }, [dashboardMetrics]);

  // Local state for insights (could be enhanced with WebSocket)
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [activeAgentChat, setActiveAgentChat] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const getAgent = useCallback(
    (id: string) => agents.find((a) => a.id === id),
    [agents]
  );

  const addInsight = useCallback(
    (insight: Omit<AgentInsight, 'id' | 'timestamp'>) => {
      const newInsight: AgentInsight = {
        ...insight,
        id: `insight-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      setInsights((prev) => [newInsight, ...prev.slice(0, 49)]);
    },
    []
  );

  // Send message to real agent via API
  const sendAgentMessage = useCallback(
    async (agentId: string, message: string) => {
      const agent = getAgent(agentId);
      if (!agent) throw new Error(`Agent ${agentId} not found`);

      try {
        const response = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: agent.type,
            message,
            context: {
              projects: projects?.slice(0, 5),
              metrics,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message to agent');
        }

        return response.json();
      } catch (error) {
        console.error('Agent chat error:', error);
        throw error;
      }
    },
    [getAgent, projects, metrics]
  );

  const value: PPMAgentContextValue = {
    agents,
    isLoadingAgents,
    getAgent,
    metrics,
    isLoadingMetrics,
    projects: projects || [],
    isLoadingProjects,
    risks: risks || [],
    isLoadingRisks,
    valueInsights,
    isLoadingValueInsights,
    insights,
    addInsight,
    activeAgentChat,
    setActiveAgentChat,
    selectedAgent,
    setSelectedAgent,
    sendAgentMessage,
  };

  return (
    <PPMAgentContext.Provider value={value}>
      {children}
    </PPMAgentContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function usePPMAgents() {
  const context = useContext(PPMAgentContext);
  if (!context) {
    throw new Error('usePPMAgents must be used within PPMAgentProvider');
  }
  return context;
}

export function useAgent(agentId: string) {
  const { getAgent, sendAgentMessage } = usePPMAgents();
  const agent = getAgent(agentId);

  return {
    agent,
    sendMessage: (message: string) => sendAgentMessage(agentId, message),
  };
}

export function usePPMMetrics() {
  const { metrics, isLoadingMetrics, projects, risks } = usePPMAgents();

  return {
    metrics,
    isLoading: isLoadingMetrics,
    projectCount: projects.length,
    riskCount: risks.length,
    atRiskCount: risks.filter((r: any) => r.severity === 'high' || r.severity === 'critical').length,
  };
}

export default PPMAgentProvider;
