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
import { getAgentRegistry } from '../../services/AgentRegistryService.js';

/**
 * Custom agent object classes for agents with specialized logic
 * All other agents use BaseAgentObject
 */
const CUSTOM_AGENT_OBJECTS: Record<string, new (entityId: string, config: any) => BaseAgentObject> = {
  pmo: PMOAgentObject,
  finops: FinOpsAgentObject,
  vro: VROAgentObject,
};

/**
 * Create an agent object for a specific agent type
 * Uses custom class if available, otherwise BaseAgentObject
 * Works with any agent from the database
 */
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

  // Check if there's a custom implementation
  const CustomClass = CUSTOM_AGENT_OBJECTS[agentType];
  if (CustomClass) {
    return new CustomClass(entityId, config);
  }

  // Use BaseAgentObject for all other agents (including new dynamic ones)
  return new BaseAgentObject({
    ...config,
    agentType,
    entityId
  });
}

/**
 * Create agent objects for known agent types
 * For dynamic agents, use createAgentObject() directly
 */
export function createAgentObjects(
  entityId: string,
  rulesService?: RulesService,
  mem0Endpoint?: string
): Record<string, BaseAgentObject> {

  // Known agents that need objects created
  const knownAgentTypes = [
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

  return knownAgentTypes.reduce((acc, agentType) => {
    acc[agentType] = createAgentObject(agentType, entityId, rulesService, mem0Endpoint);
    return acc;
  }, {} as Record<string, BaseAgentObject>);
}

/**
 * Create agent objects for all agents from database
 */
export async function createAgentObjectsFromDatabase(
  entityId: string,
  rulesService?: RulesService,
  mem0Endpoint?: string
): Promise<Record<string, BaseAgentObject>> {
  const registry = getAgentRegistry();
  const agents = await registry.getEnabledAgents();

  return agents.reduce((acc, agent) => {
    acc[agent.id] = createAgentObject(agent.id, entityId, rulesService, mem0Endpoint);
    return acc;
  }, {} as Record<string, BaseAgentObject>);
}
