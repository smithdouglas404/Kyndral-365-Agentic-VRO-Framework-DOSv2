/**
 * AgentBase v3.0 - No LangChain LLM dependency
 * 
 * Uses SmartModelRouter -> OpenRouterClient for all AI calls.
 * DynamicStructuredTool kept for local tool definitions only.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import type { IStorage } from "../../storage.js";
import type { InsertAgentActivityLog, InsertIntervention } from "@shared/schema";
import { getSmartRouter, SmartModelRouter, ModelTier } from "../../lib/SmartModelRouter.js";

export interface AgentConfig {
  agentId: string;
  agentName: string;
  focus: string;
  autonomy: 'full' | 'supervised';
  temperature?: number;
  modelName?: string;
}

export abstract class AgentBase {
  protected config: AgentConfig;
  protected router: SmartModelRouter;
  protected tools: DynamicStructuredTool[];
  protected storage: IStorage;
  protected tracingEnabled: boolean = false;
  protected conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  protected mem0: ReturnType<typeof import('../../lib/Mem0Service.js').getMem0Service>;

  constructor(config: AgentConfig, storage: IStorage) {
    this.config = config;
    this.storage = storage;
    this.router = getSmartRouter();

    const { getMem0Service } = require('../../lib/Mem0Service.js');
    this.mem0 = getMem0Service();

    this.tools = this.defineTools();

    console.log(`[${config.agentName}] Agent initialized with ${this.tools.length} tools (direct API, no LangChain)`);
  }

  protected abstract defineTools(): DynamicStructuredTool[];
  protected abstract getSystemPrompt(): string;

  async execute(input: string, context?: Record<string, any>): Promise<{
    output: string;
    intermediateSteps: any[];
    interventions: any[];
  }> {
    if (!this.router.isAIEnabled()) {
      throw new Error(`[${this.config.agentName}] AI is disabled - agent cannot execute`);
    }

    await this.logActivity('agent_execution', `Executing ${this.config.agentName}: ${input}`);

    try {
      this.conversationHistory = [];

      const toolDescriptions = this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
      const systemPrompt = `${this.getSystemPrompt()}

Available tools:
${toolDescriptions}

When you need to use a tool, respond with:
<TOOL name="tool_name">{"param1": "value1"}</TOOL>

After tool results, continue reasoning. When done, provide your final answer.`;

      const userPrompt = context 
        ? `${input}\n\nContext: ${JSON.stringify(context, null, 2)}`
        : input;

      const intermediateSteps: any[] = [];
      let currentPrompt = userPrompt;
      let finalOutput = '';

      for (let iteration = 0; iteration < 5; iteration++) {
        const response = await this.router.callModel(ModelTier.CHEAP, systemPrompt, currentPrompt);
        const content = response.content;

        const toolMatch = content.match(/<TOOL name="([^"]+)">([\s\S]*?)<\/TOOL>/);
        if (toolMatch) {
          const [, toolName, toolInputStr] = toolMatch;
          const tool = this.tools.find(t => t.name === toolName);
          
          if (tool) {
            try {
              const toolInput = JSON.parse(toolInputStr);
              const toolResult = await tool.invoke(toolInput);
              intermediateSteps.push({ tool: toolName, input: toolInput, output: toolResult });
              currentPrompt = `Tool ${toolName} returned: ${typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)}\n\nContinue with your analysis.`;
            } catch (e: any) {
              currentPrompt = `Tool ${toolName} failed: ${e.message}\n\nContinue without this tool.`;
            }
          } else {
            currentPrompt = `Tool ${toolName} not found. Available: ${this.tools.map(t => t.name).join(', ')}\n\nContinue.`;
          }
        } else {
          finalOutput = content;
          break;
        }
      }

      if (!finalOutput) {
        finalOutput = 'Agent reached maximum iterations.';
      }

      const interventions = await this.parseInterventions(finalOutput);
      await this.logActivity('agent_complete', `Completed execution: ${interventions.length} interventions`);

      return {
        output: finalOutput,
        intermediateSteps,
        interventions,
      };
    } catch (error: any) {
      await this.logActivity('agent_error', `Error: ${error.message}`);
      throw error;
    }
  }

  async clearMemory(): Promise<void> {
    this.conversationHistory = [];
    console.log(`[${this.config.agentName}] Memory cleared`);
  }

  private async parseInterventions(output: string): Promise<any[]> {
    if (!output || typeof output !== 'string') {
      return [];
    }
    
    const interventionRegex = /<INTERVENTION.*?type="([^"]+)".*?severity="([^"]+)".*?>([\s\S]*?)<\/INTERVENTION>/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;

    while ((match = interventionRegex.exec(output)) !== null) {
      matches.push(match);
    }

    const interventions: any[] = [];

    for (const match of matches) {
      const [, type, severity, description] = match;
      const canSelfApprove = this.config.autonomy === 'full';

      const intervention = await this.storage.createIntervention({
        type,
        severity,
        title: `[${this.config.agentName}] ${type.toUpperCase()} Alert`,
        description: description.trim(),
        projectId: null,
        projectName: null,
        confidence: "0.85",
        suggestedAction: description.trim(),
        impact: "Requires review",
        status: canSelfApprove ? 'approved' : 'pending',
        agentSource: this.config.agentName,
        isAutonomous: 'true',
        selfApproved: canSelfApprove ? 'true' : 'false',
        triggerSource: 'agent_detection',
        approvedBy: canSelfApprove ? `${this.config.agentName} (Autonomous)` : null,
      });

      interventions.push(intervention);
    }

    return interventions;
  }

  protected async logActivity(eventType: string, summary: string, details?: any) {
    try {
      await this.storage.createAgentActivityLog({
        eventType,
        primaryAgentId: this.config.agentId,
        primaryAgentName: this.config.agentName,
        summary,
        details: details ? JSON.stringify(details) : undefined,
      });
    } catch (error) {
      console.error(`[${this.config.agentName}] Failed to log activity:`, error);
    }
  }

  protected async recallEntityContext(entityId: string): Promise<Record<string, any>> {
    const facts = await this.mem0.observeFacts({ entity: entityId });
    const state = await this.mem0.getEntityState(entityId);

    console.log(`[${this.config.agentName}] 🧠 Recalled ${facts.length} facts about ${entityId}`);
    return state;
  }

  protected async hasRecentIntervention(entityId: string, interventionType: string, withinHours: number = 24): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - (withinHours * 60 * 60 * 1000));
    const recentFacts = await this.mem0.observeFacts({
      entity: entityId,
      attribute: `intervention_${interventionType}`,
      sinceTimestamp: cutoffTime,
    });

    if (recentFacts.length > 0) {
      console.log(`[${this.config.agentName}] ⚠️  Duplicate intervention detected: ${interventionType} already issued for ${entityId} within ${withinHours}h`);
      return true;
    }

    return false;
  }

  protected async recordIntervention(entityId: string, interventionType: string, interventionId: string): Promise<void> {
    await this.mem0.writeFact({
      entity: entityId,
      attribute: `intervention_${interventionType}`,
      value: { interventionId, issuedAt: new Date().toISOString() },
      sourceAgent: this.config.agentName.toLowerCase(),
      confidence: 1.0,
    });
  }

  protected async broadcastFact(entity: string, attribute: string, value: any, confidence: number = 1.0): Promise<void> {
    await this.mem0.writeFact({
      entity,
      attribute,
      value,
      sourceAgent: this.config.agentName.toLowerCase(),
      confidence,
    });
  }

  protected async queryOntology(sparql: string): Promise<any[]> {
    try {
      const { createOBDAService } = await import('../../obda/index.js');
      const obdaService = createOBDAService(this.storage);
      const result = await obdaService.executeSPARQL(sparql);
      return result.data;
    } catch (error) {
      console.error(`[${this.config.agentName}] Ontology query error:`, error);
      return [];
    }
  }

  getConfig(): AgentConfig {
    return this.config;
  }
}
