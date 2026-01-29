/**
 * LANGFLOW ATTRIBUTE SYNC SERVICE
 *
 * Bidirectional sync between agent attributes and Langflow flows:
 * 1. DB attributes → Langflow: When new attribute added, update agent's flow
 * 2. Langflow → DB: When attribute calculated in flow, store in agent_attributes table
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { AgentAttributeRegistry, type AgentType } from './AgentAttributeRegistry.js';

export interface AttributeToFlowSync {
  agentType: AgentType;
  attributeName: string;
  displayName: string;
  type: string;
  description: string;
  defaultThresholds?: {
    warning: number;
    critical: number;
  };
}

export interface FlowToAttributeSync {
  agentType: AgentType;
  entityId: string;
  attributeName: string;
  value: any;
  narrative?: string;
  reasoning?: string;
  sources?: string[];
  confidence?: number;
}

export class LangflowAttributeSync {
  private langflowApiUrl: string;
  private langflowApiKey: string;
  private orgId: string;

  constructor() {
    this.langflowApiUrl = process.env.LANGFLOW_API_URL || '';
    this.langflowApiKey = process.env.LANGFLOW_API_KEY || '';
    this.orgId = process.env.LANGFLOW_ORG_ID || '';
  }

  /**
   * Sync new attribute to Langflow flow
   * Called when admin adds new custom attribute via UI
   */
  async syncAttributeToLangflow(attr: AttributeToFlowSync): Promise<boolean> {
    try {
      console.log(`[AttributeSync] Syncing attribute to Langflow: ${attr.agentType}.${attr.attributeName}`);

      // Get the agent's attribute-sync flow ID
      const flowId = `${attr.agentType}-attribute-sync`;

      // Get current flow structure
      const flow = await this.getFlow(flowId);
      if (!flow) {
        console.warn(`[AttributeSync] Flow not found: ${flowId}`);
        return false;
      }

      // Add attribute mapper node for this attribute
      const updatedFlow = this.addAttributeToFlow(flow, attr);

      // Update flow in Langflow
      await this.updateFlow(flowId, updatedFlow);

      console.log(`[AttributeSync] ✅ Attribute synced to Langflow: ${attr.attributeName}`);
      return true;
    } catch (error: any) {
      console.error(`[AttributeSync] Error syncing attribute to Langflow:`, error.message);
      return false;
    }
  }

  /**
   * Sync calculated attribute from Langflow to database
   * Called via webhook when Langflow calculates an attribute
   */
  async syncAttributeFromLangflow(data: FlowToAttributeSync): Promise<boolean> {
    try {
      console.log(`[AttributeSync] Syncing calculated attribute from Langflow: ${data.agentType}.${data.attributeName}`);

      // Check if attribute definition exists in registry
      const registry = new AgentAttributeRegistry();
      const attrDef = registry.getAttribute(data.agentType, data.attributeName);

      if (!attrDef) {
        // Auto-create attribute definition
        console.log(`[AttributeSync] Auto-creating attribute: ${data.attributeName}`);
        await this.createAttributeDefinition(data);
      }

      // Store calculated value in agent_facts table (Mem0)
      await db.execute(sql`
        INSERT INTO agent_facts (
          entity, attribute, value, source_agent, confidence, created_at
        ) VALUES (
          ${data.entityId},
          ${data.attributeName},
          ${JSON.stringify({
            value: data.value,
            narrative: data.narrative,
            reasoning: data.reasoning,
            sources: data.sources
          })},
          ${data.agentType},
          ${data.confidence || 1.0},
          NOW()
        )
        ON CONFLICT (entity, attribute) DO UPDATE SET
          value = EXCLUDED.value,
          confidence = EXCLUDED.confidence,
          created_at = EXCLUDED.created_at
      `);

      console.log(`[AttributeSync] ✅ Attribute value stored in Mem0`);
      return true;
    } catch (error: any) {
      console.error(`[AttributeSync] Error syncing from Langflow:`, error.message);
      return false;
    }
  }

  /**
   * Add attribute mapper configuration to Langflow flow
   */
  private addAttributeToFlow(flow: any, attr: AttributeToFlowSync): any {
    // Clone flow structure
    const updatedFlow = JSON.parse(JSON.stringify(flow));

    // Find or create AttributeMapper component
    let mapperNode = updatedFlow.nodes?.find((n: any) => n.data?.type === 'AttributeMapper');

    if (!mapperNode) {
      // Create new AttributeMapper node
      mapperNode = {
        id: `mapper_${Date.now()}`,
        type: 'customComponent',
        position: { x: 300, y: 200 },
        data: {
          type: 'AttributeMapper',
          node: {
            template: {
              agent_type: {
                value: attr.agentType
              },
              attributes: {
                value: []
              }
            }
          }
        }
      };
      updatedFlow.nodes = updatedFlow.nodes || [];
      updatedFlow.nodes.push(mapperNode);
    }

    // Add attribute to mapper configuration
    const attributes = mapperNode.data.node.template.attributes.value || [];
    attributes.push({
      name: attr.attributeName,
      displayName: attr.displayName,
      type: attr.type,
      description: attr.description,
      thresholds: attr.defaultThresholds
    });
    mapperNode.data.node.template.attributes.value = attributes;

    return updatedFlow;
  }

  /**
   * Create attribute definition in custom_attributes table
   */
  private async createAttributeDefinition(data: FlowToAttributeSync): Promise<void> {
    await db.execute(sql`
      INSERT INTO custom_attributes (
        name, label, description, data_type, owner_agent, auto_generated, created_at
      ) VALUES (
        ${data.attributeName},
        ${data.attributeName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())},
        ${'Auto-created from Langflow calculation'},
        ${typeof data.value === 'number' ? 'number' : 'string'},
        ${data.agentType},
        true,
        NOW()
      )
      ON CONFLICT (name) DO NOTHING
    `);
  }

  /**
   * Get flow from Langflow
   */
  private async getFlow(flowId: string): Promise<any> {
    try {
      const response = await fetch(`${this.langflowApiUrl}/flows/${flowId}`, {
        headers: {
          'Authorization': `Bearer ${this.langflowApiKey}`,
          'X-DataStax-Current-Org': this.orgId
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error: any) {
      console.error(`[AttributeSync] Error fetching flow:`, error.message);
      return null;
    }
  }

  /**
   * Update flow in Langflow
   */
  private async updateFlow(flowId: string, flowData: any): Promise<void> {
    const response = await fetch(`${this.langflowApiUrl}/flows/${flowId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.langflowApiKey}`,
        'X-DataStax-Current-Org': this.orgId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flowData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update flow: ${response.status}`);
    }
  }

  /**
   * Batch sync all attributes for an agent to Langflow
   */
  async syncAllAttributesForAgent(agentType: AgentType): Promise<number> {
    console.log(`[AttributeSync] Syncing all attributes for agent: ${agentType}`);

    const registry = new AgentAttributeRegistry();
    const attributes = registry.getAttributes(agentType);

    let successCount = 0;
    for (const attr of attributes) {
      const success = await this.syncAttributeToLangflow({
        agentType,
        attributeName: attr.name,
        displayName: attr.displayName,
        type: attr.type,
        description: attr.description,
        defaultThresholds: attr.defaultThresholds
      });

      if (success) successCount++;
    }

    console.log(`[AttributeSync] ✅ Synced ${successCount}/${attributes.length} attributes for ${agentType}`);
    return successCount;
  }
}

// Singleton instance
let instance: LangflowAttributeSync | null = null;

export function getLangflowAttributeSync(): LangflowAttributeSync {
  if (!instance) {
    instance = new LangflowAttributeSync();
  }
  return instance;
}
