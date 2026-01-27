/**
 * LANGFLOW RULE SYNC SERVICE
 * 
 * Handles sync between PostgreSQL rules and Langflow flows.
 * 
 * IMPORTANT: This is a "mapping-only" sync - it links existing rules to existing flows.
 * Langflow MCP only exposes existing flows as callable tools, it does not provide
 * an API to create/delete flows programmatically. To create flows, use the Langflow UI.
 * 
 * Flow 1: DB Rule → Langflow Mapping
 *   When a rule is created/updated with a "trigger_workflow" action,
 *   this service links it to the corresponding Langflow flow (if it exists).
 * 
 * Flow 2: Langflow → DB Rule Suggestions
 *   When new flows are discovered in Langflow (via MCP tools list),
 *   this service creates disabled rule suggestions that can be enabled by admins.
 */

import { db } from '../db.js';
import { eq } from 'drizzle-orm';
import { flowRuleMappings, agentCollaborationRules, type FlowRuleMapping } from '../../shared/schema.js';
import { getLangflowMCPClient } from './LangflowMCPClient.js';
import type { CollaborationRule } from './AgentCollaborationRulesEngine.js';

interface LangflowFlowInfo {
  name: string;
  description: string;
  inputSchema?: any;
}

/**
 * LangflowRuleSyncService - Manages sync between database rules and Langflow flows
 * 
 * NOTE: This is mapping-only sync. Langflow MCP cannot create flows programmatically.
 * Flows must be created via the Langflow visual editor at your DataStax instance.
 */
export class LangflowRuleSyncService {
  private mappingsCache: Map<string, FlowRuleMapping> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize service - load existing mappings from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[LangflowSync] Initializing...');

    // Ensure table exists via Drizzle schema
    await this.loadMappings();

    this.initialized = true;
    console.log(`[LangflowSync] Initialized with ${this.mappingsCache.size} mappings`);
  }

  /**
   * Load mappings from database using Drizzle
   */
  private async loadMappings(): Promise<void> {
    try {
      const result = await db.select().from(flowRuleMappings);
      
      this.mappingsCache.clear();
      for (const row of result) {
        this.mappingsCache.set(row.ruleId, row);
      }
    } catch (error) {
      console.warn('[LangflowSync] Table may not exist yet, will be created on first insert');
    }
  }

  /**
   * FLOW 1: When a rule is created/updated with trigger_workflow action,
   * link it to a Langflow flow (if the flow exists)
   */
  async syncRuleToFlow(rule: CollaborationRule): Promise<FlowRuleMapping | null> {
    if (!this.initialized) await this.initialize();

    // Check if rule has a trigger_workflow action
    const workflowAction = rule.actions.find(a => a.type === 'trigger_workflow');
    if (!workflowAction) {
      console.log(`[LangflowSync] Rule ${rule.id} has no trigger_workflow action`);
      return null;
    }

    // Get the flow name from action parameters
    const flowName = workflowAction.parameters?.flowName || workflowAction.parameters?.flowId;
    if (!flowName) {
      console.log(`[LangflowSync] Rule ${rule.id} has trigger_workflow but no flowName specified`);
      return null;
    }

    // Check if this flow exists in Langflow
    const client = getLangflowMCPClient();
    if (!client || !client.isConnected()) {
      console.warn(`[LangflowSync] Langflow not connected, skipping sync`);
      return null;
    }

    const tools = await client.listTools();
    const matchingFlow = tools.find(t => 
      t.name === flowName || 
      t.name.toLowerCase().includes(flowName.toLowerCase())
    );

    if (!matchingFlow) {
      console.warn(`[LangflowSync] Flow "${flowName}" not found in Langflow. Create it in the Langflow UI first.`);
      return null;
    }

    // Create/update mapping using Drizzle upsert
    const mappingData = {
      ruleId: rule.id,
      flowId: matchingFlow.name,
      flowName: matchingFlow.name,
      sourceAgent: rule.sourceAgent,
      syncDirection: 'rule_to_flow' as const,
    };

    try {
      // Try insert first
      await db.insert(flowRuleMappings).values(mappingData).onConflictDoUpdate({
        target: [flowRuleMappings.ruleId],
        set: {
          flowId: matchingFlow.name,
          flowName: matchingFlow.name,
          syncDirection: 'rule_to_flow',
          lastSynced: new Date(),
        },
      });
    } catch (error) {
      // If unique constraint error, update instead
      await db.update(flowRuleMappings)
        .set({
          flowId: matchingFlow.name,
          flowName: matchingFlow.name,
          syncDirection: 'rule_to_flow',
          lastSynced: new Date(),
        })
        .where(eq(flowRuleMappings.ruleId, rule.id));
    }

    // Reload mappings
    await this.loadMappings();
    
    console.log(`[LangflowSync] ✅ Linked rule "${rule.name}" → flow "${matchingFlow.name}"`);
    return this.mappingsCache.get(rule.id) || null;
  }

  /**
   * FLOW 2: Discover Langflow flows and create disabled rule suggestions
   * Admins can review and enable these rules via the admin UI
   */
  async syncFlowsToRules(): Promise<{ created: number; updated: number }> {
    if (!this.initialized) await this.initialize();

    const client = getLangflowMCPClient();
    if (!client || !client.isConnected()) {
      console.warn(`[LangflowSync] Langflow not connected, skipping discovery`);
      return { created: 0, updated: 0 };
    }

    const tools = await client.listTools();
    let created = 0;
    let updated = 0;

    for (const tool of tools) {
      // Check if we already have a mapping for this flow
      const existingMapping = Array.from(this.mappingsCache.values())
        .find(m => m.flowId === tool.name);

      if (existingMapping) {
        // Update last synced time
        await db.update(flowRuleMappings)
          .set({ lastSynced: new Date() })
          .where(eq(flowRuleMappings.id, existingMapping.id));
        updated++;
        continue;
      }

      // Auto-generate a rule suggestion ID for this flow
      const ruleId = `flow-${tool.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      // Check if auto-generated rule already exists
      const existingRules = await db.select()
        .from(agentCollaborationRules)
        .where(eq(agentCollaborationRules.id, ruleId));

      if (existingRules.length === 0) {
        // Create auto-generated rule (DISABLED by default - admin must review and enable)
        const agentType = this.inferAgentFromFlowName(tool.name);
        
        await db.insert(agentCollaborationRules).values({
          id: ruleId,
          name: `Auto: ${tool.name}`,
          description: `Auto-generated from Langflow flow: ${tool.description || tool.name}. Enable this rule to activate.`,
          enabled: false, // DISABLED - requires admin review
          priority: 1,
          sourceAgent: agentType,
          conditions: JSON.stringify([{ fact: 'manual_trigger', operator: 'equal', value: true }]),
          actions: JSON.stringify([{ type: 'trigger_workflow', parameters: { flowName: tool.name } }]),
          createdBy: 'langflow_sync',
        });

        console.log(`[LangflowSync] 📋 Created DISABLED rule suggestion for flow: ${tool.name}`);
        console.log(`[LangflowSync]    → Admin must enable at /admin/rules/${agentType}`);
        created++;
      }

      // Create mapping
      await db.insert(flowRuleMappings).values({
        ruleId,
        flowId: tool.name,
        flowName: tool.name,
        sourceAgent: this.inferAgentFromFlowName(tool.name),
        syncDirection: 'flow_to_rule',
      }).onConflictDoNothing();
    }

    // Reload mappings
    await this.loadMappings();

    console.log(`[LangflowSync] Sync complete: ${created} created (disabled), ${updated} updated`);
    return { created, updated };
  }

  /**
   * Get all flow-rule mappings
   */
  async getMappings(): Promise<FlowRuleMapping[]> {
    if (!this.initialized) await this.initialize();
    return Array.from(this.mappingsCache.values());
  }

  /**
   * Get mapping for a specific rule
   */
  getFlowForRule(ruleId: string): FlowRuleMapping | undefined {
    return this.mappingsCache.get(ruleId);
  }

  /**
   * Get available Langflow flows with their rule associations
   */
  async getFlowsWithRules(): Promise<Array<LangflowFlowInfo & { linkedRule?: string }>> {
    if (!this.initialized) await this.initialize();

    const client = getLangflowMCPClient();
    if (!client || !client.isConnected()) {
      return [];
    }

    const tools = await client.listTools();
    return tools.map(tool => {
      const mapping = Array.from(this.mappingsCache.values())
        .find(m => m.flowId === tool.name);
      
      return {
        name: tool.name,
        description: tool.description || '',
        linkedRule: mapping?.ruleId,
      };
    });
  }

  /**
   * Manually link a rule to a flow
   */
  async linkRuleToFlow(ruleId: string, flowId: string, sourceAgent: string): Promise<FlowRuleMapping | null> {
    if (!this.initialized) await this.initialize();

    await db.insert(flowRuleMappings).values({
      ruleId,
      flowId,
      flowName: flowId,
      sourceAgent,
      syncDirection: 'manual',
    }).onConflictDoUpdate({
      target: [flowRuleMappings.ruleId],
      set: {
        flowId,
        flowName: flowId,
        syncDirection: 'manual',
        lastSynced: new Date(),
      },
    });

    await this.loadMappings();
    console.log(`[LangflowSync] ✅ Manually linked rule "${ruleId}" → flow "${flowId}"`);
    
    return this.mappingsCache.get(ruleId) || null;
  }

  /**
   * Unlink a rule from a flow
   */
  async unlinkRule(ruleId: string): Promise<void> {
    await db.delete(flowRuleMappings).where(eq(flowRuleMappings.ruleId, ruleId));
    this.mappingsCache.delete(ruleId);
    console.log(`[LangflowSync] Unlinked rule: ${ruleId}`);
  }

  /**
   * Infer agent type from flow name
   */
  private inferAgentFromFlowName(flowName: string): string {
    const name = flowName.toLowerCase();
    if (name.includes('finops') || name.includes('budget') || name.includes('cost')) return 'finops';
    if (name.includes('risk')) return 'risk';
    if (name.includes('tmo') || name.includes('schedule') || name.includes('timeline')) return 'tmo';
    if (name.includes('vro') || name.includes('value')) return 'vro';
    if (name.includes('pmo') || name.includes('health')) return 'pmo';
    if (name.includes('ocm') || name.includes('change')) return 'ocm';
    if (name.includes('governance') || name.includes('compliance')) return 'governance';
    if (name.includes('planning') || name.includes('dependency')) return 'planning';
    return 'integrated'; // Default to integrated management agent
  }
}

// Singleton instance
let syncService: LangflowRuleSyncService | null = null;

export function getLangflowRuleSyncService(): LangflowRuleSyncService {
  if (!syncService) {
    syncService = new LangflowRuleSyncService();
  }
  return syncService;
}
