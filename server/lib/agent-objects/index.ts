/**
 * AGENT OBJECTS INDEX
 *
 * Factory and exports for agent-as-object architecture
 */

export { BaseAgentObject, type AttributeValue, type AgentObjectConfig } from './BaseAgentObject.js';
export { PMOAgentObject } from './PMOAgentObject.js';
export { FinOpsAgentObject } from './FinOpsAgentObject.js';
export { VROAgentObject } from './VROAgentObject.js';

import type { AgentType } from '../AgentAttributeRegistry.js';
import type { LangflowService } from '../LangflowService.js';
import { BaseAgentObject, type AgentObjectConfig } from './BaseAgentObject.js';
import { PMOAgentObject } from './PMOAgentObject.js';
import { FinOpsAgentObject } from './FinOpsAgentObject.js';
import { VROAgentObject } from './VROAgentObject.js';

/**
 * Agent object factory
 */
export function createAgentObject(
  agentType: AgentType,
  entityId: string,
  langflowService: LangflowService,
  mem0Endpoint?: string
): BaseAgentObject {

  const config: Omit<AgentObjectConfig, 'agentType' | 'entityId'> = {
    langflowService,
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
      // For other agent types, use base class until specific implementations are created
      return new BaseAgentObject({
        ...config,
        agentType,
        entityId
      });
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

/**
 * Create multiple agent objects for an entity
 */
export function createAgentObjects(
  entityId: string,
  langflowService: LangflowService,
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
    acc[agentType] = createAgentObject(agentType, entityId, langflowService, mem0Endpoint);
    return acc;
  }, {} as Record<AgentType, BaseAgentObject>);
}

/**
 * Example usage:
 *
 * ```typescript
 * import { createAgentObject, PMOAgentObject } from './lib/agent-objects';
 * import { LangflowService } from './lib/LangflowService';
 *
 * const langflowService = new LangflowService({
 *   apiUrl: process.env.LANGFLOW_API_URL!,
 *   apiKey: process.env.LANGFLOW_API_KEY!,
 *   orgId: process.env.LANGFLOW_ORG_ID
 * });
 *
 * // Create PMO agent object for a project
 * const pmoAgent = createAgentObject('pmo', 'project_123', langflowService);
 *
 * // Get project health score (checks Mem0 cache first, triggers Langflow if not cached)
 * const healthScore = await pmoAgent.getAttribute('projectHealthScore');
 * console.log(`Health: ${healthScore.value} - ${healthScore.narrative}`);
 *
 * // Or use typed class directly
 * const typedPMO = new PMOAgentObject('project_123', { langflowService });
 * const score = await typedPMO.getProjectHealthScore();
 * const report = await typedPMO.getHealthReport();
 *
 * // Create all agent objects for an entity
 * const agents = createAgentObjects('project_123', langflowService);
 * const finopsVariance = await agents.finops.getAttribute('budgetVariance');
 * const vroValue = await agents.vro.getAttribute('valueRealizationScore');
 * ```
 */
