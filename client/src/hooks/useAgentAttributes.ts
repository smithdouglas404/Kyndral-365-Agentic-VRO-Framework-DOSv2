import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/auth';

export type AttributeAvailability = 'available' | 'admin_required' | 'mcp_required' | 'missing';

export interface AgentAttributeValue {
  name: string;
  displayName: string;
  type: string;
  description: string;
  unit?: string;
  source: string;
  ownerAgent: string;
  sourceKind: string;
  endpoint: string;
  availability: AttributeAvailability;
  lastUpdated: string | null;
  value?: string | null;
}

export function useAgentAttributes(agentType: string, includeValues = true) {
  return useQuery({
    queryKey: ['agent-attributes', agentType, includeValues ? 'values' : 'meta'],
    queryFn: async () => {
      const token = getAccessToken();
      const res = await fetch(`/api/agents/${agentType}/attributes?includeValues=${includeValues}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error('Failed to fetch agent attributes');
      }
      return res.json() as Promise<{ agentType: string; attributes: AgentAttributeValue[] }>;
    },
    refetchInterval: 30000,
  });
}

export function parseAttributeNumber(value?: string | null): number | null {
  if (value === null || value === undefined) return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'number') return parsed;
    const asNumber = Number(parsed);
    return Number.isFinite(asNumber) ? asNumber : null;
  } catch {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : null;
  }
}

export function parseAttributeText(value?: string | null): string | null {
  if (value === null || value === undefined) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed === null || parsed === undefined) return null;
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
  } catch {
    return String(value);
  }
}

export function getAttributeMap(attributes: AgentAttributeValue[] = []) {
  return attributes.reduce<Record<string, AgentAttributeValue>>((acc, attr) => {
    acc[attr.name] = attr;
    return acc;
  }, {});
}
