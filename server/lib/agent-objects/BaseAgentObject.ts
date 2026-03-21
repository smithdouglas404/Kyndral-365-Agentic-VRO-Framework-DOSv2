/**
 * BASE AGENT OBJECT
 *
 * Base class for agent-as-object architecture
 * Agents are objects with callable attributes that query via Langflow MCP
 */

import type { AgentType, AgentAttributeRegistryEntry } from '../AgentAttributeRegistry.js';

export interface RulesService {
  checkRule(functionName: string, input: Record<string, any>, metadata?: any): Promise<any>;
}
import { getDefaultAttributes } from '../AgentAttributeRegistry.js';

export interface AttributeValue {
  value: any;
  narrative?: string;
  reasoning?: string;
  sources?: string[];
  confidence?: number;
  timestamp: Date;
  cached?: boolean;
  cacheAge?: number;
}

export interface AgentObjectConfig {
  agentType: AgentType;
  entityId: string;
  rulesService?: RulesService;
  mem0Endpoint?: string;
}

export class BaseAgentObject {
  protected agentType: AgentType;
  protected entityId: string;
  protected rulesService?: RulesService;
  protected mem0Endpoint: string;
  protected attributes: Map<string, AgentAttributeRegistryEntry>;

  constructor(config: AgentObjectConfig) {
    this.agentType = config.agentType;
    this.entityId = config.entityId;
    this.rulesService = config.rulesService;
    this.mem0Endpoint = config.mem0Endpoint || process.env.MEM0_API_URL || 'http://localhost:5000/api/mem0';

    // Load attributes from registry
    this.attributes = new Map();
    const defaultAttributes = getDefaultAttributes(config.agentType);
    for (const attr of defaultAttributes) {
      this.attributes.set(attr.name, attr);
    }
  }

  /**
   * Get attribute value (queries Mem0 first, then triggers Langflow if not cached)
   */
  async getAttribute(attributeName: string): Promise<AttributeValue> {
    // Check if attribute exists
    const attrDef = this.attributes.get(attributeName);
    if (!attrDef) {
      throw new Error(`Attribute '${attributeName}' not found for agent type '${this.agentType}'`);
    }

    try {
      // Step 1: Check Mem0 cache (5-minute TTL)
      const cachedValue = await this.queryMem0Cache(attributeName);
      if (cachedValue) {
        return {
          ...cachedValue,
          cached: true,
          cacheAge: Date.now() - new Date(cachedValue.timestamp).getTime()
        };
      }

      // Step 2: Cache miss - trigger Langflow flow to fetch and calculate
      const flowResult = await this.triggerAttributeCalculation(attributeName);

      return {
        value: flowResult.value,
        narrative: flowResult.narrative,
        reasoning: flowResult.reasoning,
        sources: flowResult.sources,
        confidence: flowResult.confidence,
        timestamp: new Date(),
        cached: false
      };

    } catch (error: any) {
      console.error(`[AgentObject] Failed to get attribute ${attributeName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get multiple attributes in parallel
   */
  async getAttributes(attributeNames: string[]): Promise<Record<string, AttributeValue>> {
    const results = await Promise.allSettled(
      attributeNames.map(async (name) => ({
        name,
        value: await this.getAttribute(name)
      }))
    );

    const attributes: Record<string, AttributeValue> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        attributes[result.value.name] = result.value.value;
      } else {
        console.error(`[AgentObject] Failed to get attribute:`, result.reason);
      }
    }

    return attributes;
  }

  /**
   * List all available attributes for this agent
   */
  listAttributes(): AgentAttributeRegistryEntry[] {
    return Array.from(this.attributes.values());
  }

  /**
   * Get attribute definition
   */
  getAttributeDefinition(attributeName: string): AgentAttributeRegistryEntry | undefined {
    return this.attributes.get(attributeName);
  }

  /**
   * Query Mem0 cache for attribute value
   */
  private async queryMem0Cache(attributeName: string): Promise<AttributeValue | null> {
    try {
      const response = await fetch(
        `${this.mem0Endpoint}/read-facts?entity=${this.entityId}&attribute=${attributeName}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.facts || data.facts.length === 0) {
        return null;
      }

      const fact = data.facts[0];
      return {
        value: fact.value.calculatedValue || fact.value,
        narrative: fact.value.narrative,
        reasoning: fact.value.reasoning,
        sources: fact.value.sources,
        confidence: fact.confidence,
        timestamp: new Date(fact.created_at)
      };

    } catch (error: any) {
      console.error(`[AgentObject] Mem0 cache query error:`, error.message);
      return null;
    }
  }

  private async triggerAttributeCalculation(attributeName: string): Promise<any> {
    const functionName = `calculate${this.agentType.charAt(0).toUpperCase() + this.agentType.slice(1)}Attribute`;

    try {
      // Try to get PalantirRulesService dynamically
      const { getPalantirRulesService } = await import('../PalantirRulesService.js');
      const service = this.rulesService || getPalantirRulesService();
      if (!service) {
        throw new Error('Palantir Rules service not available');
      }

      const result = await service.checkRule(functionName, {
        agent_type: this.agentType,
        entity_id: this.entityId,
        attribute: attributeName,
        operation: 'calculate'
      });

      if (result) {
        return {
          value: result.value ?? result,
          narrative: result.narrative,
          reasoning: result.reasoning,
          sources: result.sources,
          confidence: result.confidence || 1.0
        };
      }

      throw new Error(`Rule evaluation failed for ${functionName}`);

    } catch (error: any) {
      console.error(`[AgentObject] Rule evaluation error:`, error.message);
      throw error;
    }
  }

  /**
   * Refresh attribute (force recalculation, bypass cache)
   */
  async refreshAttribute(attributeName: string): Promise<AttributeValue> {
    // TODO: Implement cache invalidation
    // For now, just trigger calculation directly
    const flowResult = await this.triggerAttributeCalculation(attributeName);
    return {
      value: flowResult.value,
      narrative: flowResult.narrative,
      reasoning: flowResult.reasoning,
      sources: flowResult.sources,
      confidence: flowResult.confidence,
      timestamp: new Date(),
      cached: false
    };
  }

  /**
   * Get entity state (all cached attributes)
   */
  async getEntityState(): Promise<Record<string, AttributeValue>> {
    try {
      const response = await fetch(`${this.mem0Endpoint}/entity-state/${this.entityId}`);

      if (!response.ok) {
        return {};
      }

      const data = await response.json();
      const state: Record<string, AttributeValue> = {};

      for (const fact of data.facts || []) {
        state[fact.attribute] = {
          value: fact.value.calculatedValue || fact.value,
          narrative: fact.value.narrative,
          reasoning: fact.value.reasoning,
          sources: fact.value.sources,
          confidence: fact.confidence,
          timestamp: new Date(fact.created_at),
          cached: true
        };
      }

      return state;

    } catch (error: any) {
      console.error(`[AgentObject] Failed to get entity state:`, error.message);
      return {};
    }
  }
}
