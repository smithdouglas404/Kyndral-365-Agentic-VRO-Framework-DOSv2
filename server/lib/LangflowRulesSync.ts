/**
 * LANGFLOW RULES SYNC SERVICE
 *
 * Bidirectional sync between database rules and Langflow flows:
 * 1. DB rules → Langflow: When user creates rule, update Langflow flow
 * 2. Langflow → DB: When user adds connection in flow, create rule
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { agentCollaborationRules } from '../../shared/schema.js';

export interface RuleToFlowSync {
  agentId: string;
  ruleId: string;
  ruleName: string;
  conditions: any[];
  actions: any[];
}

export interface FlowToRuleSync {
  fromAgent: string;
  toAgent: string;
  connectionType: string; // 'notify', 'request', 'alert'
  condition?: string; // Optional trigger condition
}

export class LangflowRulesSync {
  private langflowApiUrl: string;
  private langflowApiKey: string;
  private orgId: string;

  constructor() {
    this.langflowApiUrl = process.env.LANGFLOW_API_URL || '';
    this.langflowApiKey = process.env.LANGFLOW_API_KEY || '';
    this.orgId = process.env.LANGFLOW_ORG_ID || '';
  }

  /**
   * Sync database rule to Langflow flow
   * Called when user creates/updates rule via admin UI
   */
  async syncRuleToLangflow(rule: any): Promise<boolean> {
    try {
      console.log(`[LangflowSync] Syncing rule to Langflow: ${rule.name}`);

      // Get the agent's flow ID
      const flowId = await this.getAgentFlowId(rule.agent_id);
      if (!flowId) {
        console.warn(`[LangflowSync] No flow found for agent ${rule.agent_id}`);
        return false;
      }

      // Get current flow structure
      const flow = await this.getFlow(flowId);
      if (!flow) {
        console.warn(`[LangflowSync] Failed to fetch flow ${flowId}`);
        return false;
      }

      // Add/update rule nodes in flow
      const updatedFlow = this.addRuleToFlow(flow, rule);

      // Update flow in Langflow
      await this.updateFlow(flowId, updatedFlow);

      console.log(`[LangflowSync] ✅ Rule synced to Langflow: ${rule.name}`);
      return true;
    } catch (error: any) {
      console.error(`[LangflowSync] Error syncing rule to Langflow:`, error.message);
      return false;
    }
  }

  /**
   * Sync Langflow flow connection to database rule
   * Called via webhook when user adds connection in Langflow
   */
  async syncFlowToRule(flowData: FlowToRuleSync): Promise<string | null> {
    try {
      console.log(`[LangflowSync] Syncing flow connection to DB: ${flowData.fromAgent} → ${flowData.toAgent}`);

      // Check if rule already exists
      const existing = await db.execute(sql`
        SELECT id FROM agent_collaboration_rules
        WHERE agent_id = ${flowData.fromAgent}
          AND JSON_EXTRACT(actions, '$[0].parameters.targetAgent') = ${flowData.toAgent}
        LIMIT 1
      `);

      if (existing.rows.length > 0) {
        console.log(`[LangflowSync] Rule already exists`);
        return (existing.rows[0] as any).id;
      }

      // Create new collaboration rule
      const ruleName = `${flowData.fromAgent} → ${flowData.toAgent} (Auto-created from Langflow)`;
      const ruleDescription = `Automatically created when user connected ${flowData.fromAgent} to ${flowData.toAgent} in Langflow`;

      const conditions = flowData.condition
        ? JSON.parse(flowData.condition)
        : {
            all: [
              {
                fact: 'severity',
                operator: 'in',
                value: ['critical', 'high']
              }
            ]
          };

      const actions = [
        {
          type: 'notify_agent',
          parameters: {
            targetAgent: flowData.toAgent,
            message: `${flowData.fromAgent} detected an issue requiring your attention`,
            severity: 'high'
          }
        }
      ];

      const result = await db.execute(sql`
        INSERT INTO agent_collaboration_rules (
          agent_id, name, description, conditions, actions, priority, enabled
        ) VALUES (
          ${flowData.fromAgent},
          ${ruleName},
          ${ruleDescription},
          ${JSON.stringify(conditions)},
          ${JSON.stringify(actions)},
          50,
          true
        )
        RETURNING id
      `);

      const ruleId = (result.rows[0] as any).id;
      console.log(`[LangflowSync] ✅ Rule created in DB: ${ruleId}`);

      return ruleId;
    } catch (error: any) {
      console.error(`[LangflowSync] Error syncing flow to rule:`, error.message);
      return null;
    }
  }

  /**
   * Get agent's Langflow flow ID from database
   */
  private async getAgentFlowId(agentId: string): Promise<string | null> {
    try {
      // Check if flow ID is stored in database
      const result = await db.execute(sql`
        SELECT langflow_flow_id FROM agent_config
        WHERE agent_id = ${agentId}
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        return (result.rows[0] as any).langflow_flow_id;
      }

      return null;
    } catch (error: any) {
      console.error(`[LangflowSync] Error getting flow ID:`, error.message);
      return null;
    }
  }

  /**
   * Fetch flow from Langflow API
   */
  private async getFlow(flowId: string): Promise<any> {
    try {
      const url = `${this.langflowApiUrl?.replace('/api/v1', '')}/api/v1/flows/${flowId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.langflowApiKey}`,
          'X-DataStax-Current-Org': this.orgId,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`[LangflowSync] Error fetching flow:`, error.message);
      return null;
    }
  }

  /**
   * Update flow in Langflow API
   */
  private async updateFlow(flowId: string, flowData: any): Promise<boolean> {
    try {
      const url = `${this.langflowApiUrl?.replace('/api/v1', '')}/api/v1/flows/${flowId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.langflowApiKey}`,
          'X-DataStax-Current-Org': this.orgId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flowData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return true;
    } catch (error: any) {
      console.error(`[LangflowSync] Error updating flow:`, error.message);
      return false;
    }
  }

  /**
   * Add rule as nodes to flow
   */
  private addRuleToFlow(flow: any, rule: any): any {
    const nodes = flow.data?.nodes || [];
    const edges = flow.data?.edges || [];

    // Parse rule actions to find agent connections
    const actions = JSON.parse(rule.actions);
    const conditions = JSON.parse(rule.conditions);

    for (const action of actions) {
      if (action.type === 'notify_agent' || action.type === 'request_collaboration') {
        const targetAgent = action.parameters?.targetAgent;
        if (!targetAgent) continue;

        // Check if connection already exists
        const existingEdge = edges.find((e: any) =>
          e.source?.includes(rule.agent_id) && e.target?.includes(targetAgent)
        );

        if (!existingEdge) {
          // Add A2A message node
          const nodeId = `a2a-${rule.id}-${targetAgent}`;
          nodes.push({
            id: nodeId,
            type: 'APIRequest',
            position: { x: 550, y: 200 + (nodes.length * 50) },
            data: {
              type: 'APIRequest',
              node: {
                display_name: `Notify ${targetAgent}`,
                description: `Auto-synced from rule: ${rule.name}`,
                template: {
                  method: { value: 'POST' },
                  url: { value: '{{SERVER_URL}}/api/a2a/send' },
                  headers: {
                    value: JSON.stringify({ 'Content-Type': 'application/json' })
                  },
                  body: {
                    value: JSON.stringify({
                      from: rule.agent_id,
                      to: targetAgent,
                      type: action.type === 'notify_agent' ? 'alert' : 'request',
                      content: action.parameters?.message || `${rule.name} triggered`,
                      severity: action.parameters?.severity || 'medium'
                    })
                  }
                }
              }
            }
          });

          // Add edge from rule check to A2A node
          edges.push({
            id: `edge-${rule.id}-${targetAgent}`,
            source: 'python-threshold', // Assuming standard flow structure
            target: nodeId
          });
        }
      }
    }

    return {
      ...flow,
      data: {
        ...flow.data,
        nodes,
        edges
      }
    };
  }

  /**
   * Sync all rules for an agent to Langflow
   */
  async syncAllRulesForAgent(agentId: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM agent_collaboration_rules
        WHERE agent_id = ${agentId} AND enabled = true
      `);

      let syncedCount = 0;
      for (const rule of result.rows) {
        const success = await this.syncRuleToLangflow(rule);
        if (success) syncedCount++;
      }

      console.log(`[LangflowSync] Synced ${syncedCount}/${result.rows.length} rules for ${agentId}`);
      return syncedCount;
    } catch (error: any) {
      console.error(`[LangflowSync] Error syncing all rules:`, error.message);
      return 0;
    }
  }

  /**
   * Get all agent connections from Langflow flow
   */
  async getFlowConnections(flowId: string): Promise<FlowToRuleSync[]> {
    try {
      const flow = await this.getFlow(flowId);
      if (!flow) return [];

      const connections: FlowToRuleSync[] = [];
      const edges = flow.data?.edges || [];
      const nodes = flow.data?.nodes || [];

      // Parse edges to find A2A connections
      for (const edge of edges) {
        const sourceNode = nodes.find((n: any) => n.id === edge.source);
        const targetNode = nodes.find((n: any) => n.id === edge.target);

        if (sourceNode?.type === 'APIRequest' && targetNode?.type === 'APIRequest') {
          // Check if it's an A2A call
          const url = sourceNode.data?.node?.template?.url?.value || '';
          if (url.includes('/api/a2a/')) {
            const body = sourceNode.data?.node?.template?.body?.value;
            if (body) {
              try {
                const parsed = JSON.parse(body);
                connections.push({
                  fromAgent: parsed.from,
                  toAgent: parsed.to,
                  connectionType: parsed.type
                });
              } catch (e) {
                // Invalid JSON, skip
              }
            }
          }
        }
      }

      return connections;
    } catch (error: any) {
      console.error(`[LangflowSync] Error getting flow connections:`, error.message);
      return [];
    }
  }
}

// Singleton instance
let syncInstance: LangflowRulesSync | null = null;

export function getLangflowRulesSync(): LangflowRulesSync {
  if (!syncInstance) {
    syncInstance = new LangflowRulesSync();
  }
  return syncInstance;
}
