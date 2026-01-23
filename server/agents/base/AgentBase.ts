import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { BufferMemory } from "langchain/memory";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
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
 */
export abstract class AgentBase {
  protected config: AgentConfig;
  protected model: ChatAnthropic;
  protected executor: AgentExecutor | null = null;
  protected memory: BufferMemory;
  protected tools: DynamicStructuredTool[];
  protected storage: IStorage;

  constructor(config: AgentConfig, storage: IStorage) {
    this.config = config;
    this.storage = storage;

    // Initialize LangSmith tracer
    const callbacks = [];

    // Add LangSmith tracer if configured (case-insensitive check)
    if (process.env.LANGCHAIN_API_KEY && process.env.LANGCHAIN_TRACING_V2?.toLowerCase() === 'true') {
      const tracer = new LangChainTracer({
        projectName: process.env.LANGCHAIN_PROJECT || "nextera-eto",
        client: undefined, // Will use env vars
      });
      callbacks.push(tracer);
      console.log(`[${config.agentName}] LangSmith tracing enabled for project: ${process.env.LANGCHAIN_PROJECT}`);
    } else {
      console.warn(`[${config.agentName}] LangSmith tracing NOT enabled - check LANGCHAIN_API_KEY and LANGCHAIN_TRACING_V2`);
    }

    // Add activity logging callback
    callbacks.push({
      handleLLMStart: async () => {
        await this.logActivity('llm_call', `Starting LLM call for ${this.config.agentName}`);
      },
      handleLLMEnd: async () => {
        await this.logActivity('llm_response', `Received response from LLM`);
      },
    });

    // Initialize Anthropic model with LangSmith tracing
    this.model = new ChatAnthropic({
      modelName: config.modelName || "claude-sonnet-4-5-20250929",
      temperature: config.temperature || 0.7,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      callbacks,
    });

    // Initialize memory
    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
    });

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
      callbacks: this.model.callbacks, // Propagate callbacks from model
    });

    console.log(`[${this.config.agentName}] Agent initialized with ${this.tools.length} tools`);
  }

  /**
   * Execute agent with input
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
      const result = await this.executor.invoke({
        input,
        ...context,
      });

      // Parse interventions from output
      const interventions = await this.parseInterventions(result.output);

      await this.logActivity('agent_complete', `Completed execution: ${interventions.length} interventions`);

      return {
        output: result.output,
        intermediateSteps: result.intermediateSteps || [],
        interventions,
      };
    } catch (error: any) {
      await this.logActivity('agent_error', `Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse interventions from agent output
   * Agents can output structured interventions using XML-like tags
   */
  private async parseInterventions(output: string): Promise<any[]> {
    // Extract structured interventions from agent response
    // Format expected: <INTERVENTION type="budget" severity="high">...</INTERVENTION>
    const interventionRegex = /<INTERVENTION.*?type="([^"]+)".*?severity="([^"]+)".*?>(.*?)<\/INTERVENTION>/gs;
    const matches = [...output.matchAll(interventionRegex)];

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
