/**
 * USE AGENT REGISTRY HOOK
 *
 * Fetches agent definitions from the database via API.
 * Use this instead of hardcoded agent arrays/mappings.
 *
 * Benefits:
 * - Adding new agents only requires database entry
 * - No code changes needed for new agents
 * - Icons, colors, and metadata are database-driven
 */

import { useQuery } from '@tanstack/react-query';

export interface AgentMetadata {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  enabled: boolean;
  capabilities: string[];
  palantirObjectTypes: string[];
}

export interface AgentDefinition extends AgentMetadata {
  defaultPriority: number;
  ownerUserId?: string;
  ownerTeam?: string;
  mcpConnections: string[];
  palantirFunctions?: string[];
  createdAt: string;
  updatedAt: string;
}

// Icon name to emoji mapping for backward compatibility
const ICON_TO_EMOJI: Record<string, string> = {
  DollarSign: '💰',
  Clock: '🔄',
  Repeat: '🔄',
  Shield: '🛡️',
  AlertTriangle: '⚠️',
  TrendingUp: '📈',
  Briefcase: '📋',
  Users: '👥',
  Scale: '⚖️',
  Map: '🎯',
  Layers: '🔗',
  Target: '🎯',
  Bell: '🔔',
  Bot: '🤖',
  Building: '🏢',
};

/**
 * Fetch all agents from the registry
 */
export function useAgentRegistry() {
  return useQuery<AgentDefinition[]>({
    queryKey: ['agent-registry'],
    queryFn: async () => {
      const response = await fetch('/api/agent-registry');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      return data.agents || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch only enabled agents
 */
export function useEnabledAgents() {
  return useQuery<AgentDefinition[]>({
    queryKey: ['agent-registry', 'enabled'],
    queryFn: async () => {
      const response = await fetch('/api/agent-registry/enabled');
      if (!response.ok) {
        throw new Error('Failed to fetch enabled agents');
      }
      const data = await response.json();
      return data.agents || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch agent metadata (lightweight, for UI display)
 */
export function useAgentMetadata() {
  return useQuery<AgentMetadata[]>({
    queryKey: ['agent-registry', 'metadata'],
    queryFn: async () => {
      const response = await fetch('/api/agent-registry/metadata');
      if (!response.ok) {
        throw new Error('Failed to fetch agent metadata');
      }
      const data = await response.json();
      return data.agents || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch agent IDs only (very lightweight)
 */
export function useAgentIds(enabledOnly: boolean = false) {
  return useQuery<string[]>({
    queryKey: ['agent-registry', 'ids', enabledOnly],
    queryFn: async () => {
      const url = enabledOnly ? '/api/agent-registry/ids?enabled=true' : '/api/agent-registry/ids';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch agent IDs');
      }
      const data = await response.json();
      return data.agentIds || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch specific agent by ID
 */
export function useAgent(agentId: string) {
  return useQuery<AgentDefinition | null>({
    queryKey: ['agent-registry', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agent-registry/${agentId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch agent');
      }
      const data = await response.json();
      return data.agent || null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!agentId,
  });
}

/**
 * Get agent icon and color maps from metadata
 * Returns functions that can be used in place of hardcoded AGENT_ICONS, AGENT_COLORS
 */
export function useAgentMappings() {
  const { data: agents = [], isLoading, error } = useAgentMetadata();

  // Build maps from agent metadata
  const iconMap = new Map<string, string>();
  const colorMap = new Map<string, string>();
  const nameMap = new Map<string, string>();

  for (const agent of agents) {
    iconMap.set(agent.id, agent.icon);
    colorMap.set(agent.id, agent.color);
    nameMap.set(agent.id, agent.name);
  }

  return {
    isLoading,
    error,
    agents,

    // Get icon for agent (Lucide icon name)
    getIcon: (agentId: string) => iconMap.get(agentId) || 'Bot',

    // Get emoji for agent (backward compatible)
    getEmoji: (agentId: string) => {
      const icon = iconMap.get(agentId) || 'Bot';
      return ICON_TO_EMOJI[icon] || '🤖';
    },

    // Get color for agent
    getColor: (agentId: string) => colorMap.get(agentId) || '#6366f1',

    // Get name for agent
    getName: (agentId: string) => nameMap.get(agentId) || agentId,

    // Check if agent exists
    hasAgent: (agentId: string) => iconMap.has(agentId),

    // Get all agent IDs
    getAgentIds: () => agents.map(a => a.id),
  };
}

/**
 * Static fallback data for when API is not available
 * This ensures the app works even if the API fails
 */
export const FALLBACK_AGENT_METADATA: AgentMetadata[] = [
  { id: 'finops', name: 'FinOps Agent', shortName: 'FIN', description: 'Financial operations', icon: 'DollarSign', color: '#10B981', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'tmo', name: 'TMO Agent', shortName: 'TMO', description: 'Timeline management', icon: 'Clock', color: '#3B82F6', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'risk', name: 'Risk Agent', shortName: 'RSK', description: 'Risk assessment', icon: 'Shield', color: '#EF4444', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'pmo', name: 'PMO Agent', shortName: 'PMO', description: 'Project management', icon: 'Briefcase', color: '#8B5CF6', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'governance', name: 'Governance Agent', shortName: 'GOV', description: 'Compliance monitoring', icon: 'Scale', color: '#F59E0B', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'vro', name: 'VRO Agent', shortName: 'VRO', description: 'Value realization', icon: 'TrendingUp', color: '#06B6D4', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'ocm', name: 'OCM Agent', shortName: 'OCM', description: 'Change management', icon: 'Users', color: '#EC4899', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'planning', name: 'Planning Agent', shortName: 'PLN', description: 'Strategic planning', icon: 'Map', color: '#14B8A6', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'okr', name: 'OKR Agent', shortName: 'OKR', description: 'OKR tracking', icon: 'Target', color: '#F97316', category: 'domain', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'integrated', name: 'Integrated Agent', shortName: 'INT', description: 'Cross-functional coordination', icon: 'Layers', color: '#6366F1', category: 'orchestration', enabled: true, capabilities: [], palantirObjectTypes: [] },
  { id: 'notification', name: 'Notification Agent', shortName: 'NOT', description: 'Alert management', icon: 'Bell', color: '#A855F7', category: 'utility', enabled: true, capabilities: [], palantirObjectTypes: [] },
];

/**
 * Get fallback emoji map (for sync/non-hook contexts)
 */
export function getFallbackEmoji(agentId: string): string {
  const agent = FALLBACK_AGENT_METADATA.find(a => a.id === agentId);
  if (!agent) return '🤖';
  return ICON_TO_EMOJI[agent.icon] || '🤖';
}

/**
 * Get fallback color (for sync/non-hook contexts)
 */
export function getFallbackColor(agentId: string): string {
  const agent = FALLBACK_AGENT_METADATA.find(a => a.id === agentId);
  return agent?.color || '#6366f1';
}

/**
 * Get fallback name (for sync/non-hook contexts)
 */
export function getFallbackName(agentId: string): string {
  const agent = FALLBACK_AGENT_METADATA.find(a => a.id === agentId);
  return agent?.name || agentId;
}
