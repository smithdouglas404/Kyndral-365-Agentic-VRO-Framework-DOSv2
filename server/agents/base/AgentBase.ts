import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { BufferMemory } from "langchain/memory";
import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";
import type { IStorage } from "../../storage.js";
import type { InsertAgentActivityLog, InsertIntervention } from "@shared/schema";

export interface AgentConfig {
  agentId: string;
  agentName: string;
  focus: string;
  autonomy: 'full' | 'supervised';
  temperature?: number;
  modelName?: string;
}

/**
 * AgentBase - Foundation for all LangChain-based intelligent agents
 * Replaces the simulation system with real AI-powered autonomous agents
 * 
 * LangSmith tracing is enabled via LangChainTracer:
 * - LANGCHAIN_TRACING_V2=true
 * - LANGCHAIN_API_KEY=your_key
 * - LANGCHAIN_PROJECT=your_project
 */
export abstract class AgentBase {
  protected config: AgentConfig;
  protected model: ChatAnthropic;
  protected executor: AgentExecutor | null = null;
  protected memory: BufferMemory;
  protected tools: DynamicStructuredTool[];
  protected storage: IStorage;
  protected tracingEnabled: boolean = false;
  protected langsmithClient: Client | null = null;
  protected tracer: LangChainTracer | null = null;
  protected mem0: ReturnType<typeof import('../../lib/Mem0Service.js').getMem0Service>;

  constructor(config: AgentConfig, storage: IStorage) {
    this.config = config;
    this.storage = storage;

    // Initialize Mem0 for cross-agent learning
    const { getMem0Service } = require('../../lib/Mem0Service.js');
    this.mem0 = getMem0Service();

    // Check if LangSmith tracing is configured
    this.tracingEnabled = !!(process.env.LANGCHAIN_API_KEY && process.env.LANGCHAIN_TRACING_V2?.toLowerCase() === 'true');
    if (this.tracingEnabled) {
      console.log(`[${config.agentName}] LangSmith tracing enabled for project: ${process.env.LANGCHAIN_PROJECT}`);
      // Initialize LangSmith client and tracer
      this.langsmithClient = new Client({
        apiKey: process.env.LANGCHAIN_API_KEY,
        apiUrl: process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com",
      });
      this.tracer = new LangChainTracer({
        projectName: process.env.LANGCHAIN_PROJECT || "nexus-ppm",
        client: this.langsmithClient,
      });
    } else {
      console.warn(`[${config.agentName}] LangSmith tracing NOT enabled - check LANGCHAIN_API_KEY and LANGCHAIN_TRACING_V2`);
    }

    // Initialize Anthropic model
    this.model = new ChatAnthropic({
      modelName: config.modelName || "claude-sonnet-4-5-20250929",
      temperature: config.temperature || 0.7,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      metadata: {
        layer: "agent",
        agent_type: config.agentName.toLowerCase(),
        system: "multi-agent-orchestration",
      },
    });

    // Initialize memory with message filtering to prevent corruption
    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
    });

    // Override saveContext to prevent malformed messages from being saved
    const originalSaveContext = this.memory.saveContext.bind(this.memory);
    this.memory.saveContext = async (inputValues: any, outputValues: any) => {
      try {
        // Validate output before saving
        if (outputValues && outputValues.output) {
          const output = outputValues.output;

          // Check if output is a malformed message object
          if (typeof output === 'object' && output.type === 'not_implemented') {
            console.warn(`[${this.config.agentName}] Blocked not_implemented message from being saved to memory`);
            return;
          }
        }

        // Save the context normally if validation passes
        await originalSaveContext(inputValues, outputValues);
      } catch (error) {
        console.error(`[${this.config.agentName}] Error in saveContext:`, error);
        // Don't rethrow - failing to save to memory shouldn't crash the agent
      }
    };

    // Override loadMemoryVariables to filter out malformed "not_implemented" messages
    // and ensure chat_history is always a valid array
    const originalLoadMemoryVariables = this.memory.loadMemoryVariables.bind(this.memory);
    this.memory.loadMemoryVariables = async (values: any) => {
      try {
        const result = await originalLoadMemoryVariables(values);

        // Ensure chat_history exists and is an array
        if (!result.chat_history) {
          result.chat_history = [];
          return result;
        }

        if (!Array.isArray(result.chat_history)) {
          console.warn(`[${this.config.agentName}] chat_history is not an array, converting to empty array`);
          result.chat_history = [];
          return result;
        }

        // Filter out malformed messages
        result.chat_history = result.chat_history.filter((msg: any) => {
          // Remove messages that are null, undefined, or not objects
          if (!msg || typeof msg !== 'object') {
            console.warn(`[${this.config.agentName}] Filtered out invalid message:`, msg);
            return false;
          }

          // Remove messages with type "not_implemented"
          if (msg.type === 'not_implemented') {
            console.warn(`[${this.config.agentName}] Filtered out not_implemented message`);
            return false;
          }

          // Remove messages without required content
          if (!msg.content && !msg.text) {
            console.warn(`[${this.config.agentName}] Filtered out message without content`);
            return false;
          }

          return true;
        });

        return result;
      } catch (error) {
        console.error(`[${this.config.agentName}] Error in loadMemoryVariables, returning empty history:`, error);
        return { chat_history: [] };
      }
    };

    // Initialize tools (to be defined by subclasses)
    this.tools = this.defineTools();

    // Initialize agent executor (async, will be done in init())
    this.initializeAgent().catch(err => {
      console.error(`[${this.config.agentName}] Failed to initialize:`, err);
    });
  }

  /**
   * Define agent-specific tools
   * Subclasses must implement this
   */
  protected abstract defineTools(): DynamicStructuredTool[];

  /**
   * Agent system prompt
   * Subclasses must implement this
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Initialize ReAct agent with tools
   */
  private async initializeAgent() {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.getSystemPrompt()],
      ["placeholder", "{chat_history}"],
      ["human", "{input}"],
      ["placeholder", "{agent_scratchpad}"],
    ]);

    const agent = await createToolCallingAgent({
      llm: this.model,
      tools: this.tools,
      prompt,
    });

    this.executor = new AgentExecutor({
      agent,
      tools: this.tools,
      memory: this.memory,
      verbose: process.env.NODE_ENV === 'development',
      maxIterations: 5,
      returnIntermediateSteps: true,
    });

    console.log(`[${this.config.agentName}] Agent initialized with ${this.tools.length} tools`);
  }

  /**
   * Execute agent with input - with LangSmith tracing via callbacks
   */
  async execute(input: string, context?: Record<string, any>): Promise<{
    output: string;
    intermediateSteps: any[];
    interventions: any[];
  }> {
    if (!this.executor) {
      throw new Error(`[${this.config.agentName}] Agent not initialized yet`);
    }

    await this.logActivity('agent_execution', `Executing ${this.config.agentName}: ${input}`);

    try {
      // Clear memory before execution to ensure clean state
      // This prevents any lingering malformed messages from previous executions
      await this.clearMemory();

      // Execute with LangSmith tracer callback if enabled
      const callbacks = this.tracer ? [this.tracer] : [];

      const result = await this.executor.invoke(
        {
          input,
          ...context,
        },
        {
          callbacks,
          runName: this.config.agentName,
          metadata: {
            agentId: this.config.agentId,
            focus: this.config.focus,
            autonomy: this.config.autonomy,
          },
        }
      );

      // Parse interventions from output
      const interventions = await this.parseInterventions(result.output);

      await this.logActivity('agent_complete', `Completed execution: ${interventions.length} interventions`);

      return {
        output: result.output,
        intermediateSteps: result.intermediateSteps || [],
        interventions,
      };
    } catch (error: any) {
      // Clear memory on ANY error to prevent corruption propagation
      console.warn(`[${this.config.agentName}] Error during execution, clearing memory to prevent corruption`);
      await this.clearMemory();

      // Log specific error types for debugging
      if (error.message?.includes('max_iterations') || error.message?.includes('Agent stopped')) {
        console.warn(`[${this.config.agentName}] Max iterations reached`);
      } else if (error.message?.includes("Cannot read properties of undefined (reading 'map')")) {
        console.error(`[${this.config.agentName}] Message formatting error detected - malformed message in history`);
      }

      await this.logActivity('agent_error', `Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear agent memory to prevent history buildup
   * Call this after max_iterations or between coordination cycles
   */
  async clearMemory(): Promise<void> {
    try {
      await this.memory.clear();
      console.log(`[${this.config.agentName}] Memory cleared`);
    } catch (error) {
      console.error(`[${this.config.agentName}] Failed to clear memory:`, error);
    }
  }

  /**
   * Parse interventions from agent output
   * Agents can output structured interventions using XML-like tags
   */
  private async parseInterventions(output: string): Promise<any[]> {
    if (!output || typeof output !== 'string') {
      return [];
    }
    
    // Extract structured interventions from agent response
    // Format expected: <INTERVENTION type="budget" severity="high">...</INTERVENTION>
    const interventionRegex = /<INTERVENTION.*?type="([^"]+)".*?severity="([^"]+)".*?>([\s\S]*?)<\/INTERVENTION>/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = interventionRegex.exec(output)) !== null) {
      matches.push(match);
    }

    const interventions: any[] = [];

    for (const match of matches) {
      const [, type, severity, description] = match;

      // Only autonomous agents can self-approve
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

  /**
   * Log agent activity
   */
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

  /**
   * Recall past facts about an entity before making new decisions
   * This enables learning and prevents duplicate interventions
   */
  protected async recallEntityContext(entityId: string): Promise<Record<string, any>> {
    const facts = await this.mem0.observeFacts({ entity: entityId });
    const state = await this.mem0.getEntityState(entityId);

    console.log(`[${this.config.agentName}] 🧠 Recalled ${facts.length} facts about ${entityId}`);

    if (facts.length > 0) {
      console.log(`[${this.config.agentName}] 📚 Historical context:`,
        facts.slice(0, 3).map(f => `${f.attribute}=${JSON.stringify(f.value)} (${f.sourceAgent})`).join(', ')
      );
    }

    return state;
  }

  /**
   * Check if an intervention was already issued to avoid duplicates
   */
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

  /**
   * Record that an intervention was issued
   */
  protected async recordIntervention(entityId: string, interventionType: string, interventionId: string): Promise<void> {
    await this.mem0.writeFact({
      entity: entityId,
      attribute: `intervention_${interventionType}`,
      value: { interventionId, issuedAt: new Date().toISOString() },
      sourceAgent: this.config.agentName.toLowerCase(),
      confidence: 1.0,
    });

    console.log(`[${this.config.agentName}] 📝 Recorded intervention: ${interventionType} for ${entityId}`);
  }

  /**
   * Broadcast a fact to Mem0 for other agents to observe
   */
  protected async broadcastFact(entity: string, attribute: string, value: any, confidence: number = 1.0): Promise<void> {
    await this.mem0.writeFact({
      entity,
      attribute,
      value,
      sourceAgent: this.config.agentName.toLowerCase(),
      confidence,
    });

    console.log(`[${this.config.agentName}] 📡 Broadcast fact: ${entity}.${attribute} = ${JSON.stringify(value)}`);
  }

  /**
   * Query ontology via OBDA
   * This replaces direct database queries with semantic queries
   */
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

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }
}
