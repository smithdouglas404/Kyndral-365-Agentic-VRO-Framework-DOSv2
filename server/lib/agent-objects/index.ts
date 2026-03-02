export { BaseAgentObject, type AttributeValue, type AgentObjectConfig, type RulesService } from './BaseAgentObject.js';
export { PMOAgentObject } from './PMOAgentObject.js';
export { FinOpsAgentObject } from './FinOpsAgentObject.js';
export { VROAgentObject } from './VROAgentObject.js';

import type { AgentType } from '../AgentAttributeRegistry.js';
import type { RulesService } from './BaseAgentObject.js';
import { BaseAgentObject, type AgentObjectConfig } from './BaseAgentObject.js';
import { PMOAgentObject } from './PMOAgentObject.js';
import { FinOpsAgentObject } from './FinOpsAgentObject.js';
import { VROAgentObject } from './VROAgentObject.js';

export function createAgentObject(
  agentType: AgentType,
  entityId: string,
  rulesService?: RulesService,
  mem0Endpoint?: string
): BaseAgentObject {

  const config: Omit<AgentObjectConfig, 'agentType' | 'entityId'> = {
    rulesService,
    mem0Endpoint
  };

  switch (agentType) {
    case 'pmo':
      return new PMOAgentObject(entityId, config);
    case 'finops':
      return new FinOpsAgentObject(entityId, config);
    case 'vro':
      return new VROAgentObject(entityId, config);
    case 'planning':
    case 'ocm':
    case 'risk':
    case 'governance':
    case 'tmo':
    case 'company':
      return new BaseAgentObject({
        ...config,
        agentType,
        entityId
      });
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

export function createAgentObjects(
  entityId: string,
  rulesService?: RulesService,
  mem0Endpoint?: string
): Record<AgentType, BaseAgentObject> {

  const agentTypes: AgentType[] = [
    'pmo',
    'finops',
    'vro',
    'planning',
    'ocm',
    'risk',
    'governance',
    'tmo',
    'company'
  ];

  return agentTypes.reduce((acc, agentType) => {
    acc[agentType] = createAgentObject(agentType, entityId, rulesService, mem0Endpoint);
    return acc;
  }, {} as Record<AgentType, BaseAgentObject>);
}
