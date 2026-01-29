import { PMO_DEFAULT_ATTRIBUTES } from '../agents/attributes/PMOAgentAttributes.js';
import { FINOPS_DEFAULT_ATTRIBUTES } from '../agents/attributes/FinOpsAgentAttributes.js';
import { VRO_DEFAULT_ATTRIBUTES } from '../agents/attributes/VROAgentAttributes.js';
import { PLANNING_DEFAULT_ATTRIBUTES } from '../agents/attributes/PlanningAgentAttributes.js';
import { OCM_DEFAULT_ATTRIBUTES } from '../agents/attributes/OCMAgentAttributes.js';
import { RISK_DEFAULT_ATTRIBUTES } from '../agents/attributes/RiskAgentAttributes.js';
import { GOVERNANCE_DEFAULT_ATTRIBUTES } from '../agents/attributes/GovernanceAgentAttributes.js';
import { TMO_DEFAULT_ATTRIBUTES } from '../agents/attributes/TMOAgentAttributes.js';
import { COMPANY_DEFAULT_ATTRIBUTES } from '../agents/attributes/CompanyAgentAttributes.js';
import type { AttributeDefinition } from '../agents/attributes/FinOpsAgentAttributes.js';

export type AgentType = 'pmo' | 'finops' | 'vro' | 'planning' | 'ocm' | 'risk' | 'governance' | 'tmo' | 'company';

export interface AgentAttributeRegistryEntry extends AttributeDefinition {
  ownerAgent: AgentType;
  sourceKind: 'calculated' | 'project_field' | 'external_api' | 'admin_input';
  endpoint: string;
}

const DEFAULT_REGISTRY: Record<AgentType, Record<string, AttributeDefinition>> = {
  pmo: PMO_DEFAULT_ATTRIBUTES,
  finops: FINOPS_DEFAULT_ATTRIBUTES,
  vro: VRO_DEFAULT_ATTRIBUTES,
  planning: PLANNING_DEFAULT_ATTRIBUTES,
  ocm: OCM_DEFAULT_ATTRIBUTES,
  risk: RISK_DEFAULT_ATTRIBUTES,
  governance: GOVERNANCE_DEFAULT_ATTRIBUTES,
  tmo: TMO_DEFAULT_ATTRIBUTES,
  company: COMPANY_DEFAULT_ATTRIBUTES,
};

export const AGENT_TYPES: AgentType[] = [
  'pmo',
  'finops',
  'vro',
  'planning',
  'ocm',
  'risk',
  'governance',
  'tmo',
  'company',
];

export function isAgentType(value: string): value is AgentType {
  return AGENT_TYPES.includes(value as AgentType);
}

export function getDefaultAttributes(agentType: AgentType): AgentAttributeRegistryEntry[] {
  const attributes = DEFAULT_REGISTRY[agentType] || {};

  return Object.values(attributes).map((attr) => ({
    ...attr,
    ownerAgent: agentType,
    sourceKind: attr.source,
    endpoint: `/api/agents/${agentType}/attributes/${attr.name}`,
  }));
}

export function getAllDefaultAttributes(): Record<AgentType, AgentAttributeRegistryEntry[]> {
  return AGENT_TYPES.reduce((acc, agentType) => {
    acc[agentType] = getDefaultAttributes(agentType);
    return acc;
  }, {} as Record<AgentType, AgentAttributeRegistryEntry[]>);
}
