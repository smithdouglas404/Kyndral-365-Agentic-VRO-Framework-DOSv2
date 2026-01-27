/**
 * DEEP AGENT BASE
 *
 * Enhanced agent with Deep Agent capabilities:
 * - Planning: Think before acting
 * - Reflection: Evaluate outcomes and adjust
 * - Multi-step reasoning: Break down complex tasks
 * - Memory: Maintain context across interactions
 *
 * Based on LangChain Deep Agents pattern
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import type { IStorage } from "../../storage.js";
import { getMem0Service, type Fact } from "../../lib/Mem0Service.js";
import { createAgentMemory, type LettaAgentMemory } from "../../lib/LettaAgentMemory.js";
// Removed: RetoolVectorsMCP is no longer used
// import { getRetoolVectorsMCP } from "../../mcp/RetoolVectorsMCP.js";
type VectorDocument = { id: string; content: string; metadata?: Record<string, any> };

/**
 * Plan step for multi-step reasoning
 */
interface PlanStep {
  step: number;
  description: string;
  tool?: string;
  expectedOutcome: string;
  dependencies: number[]; // Steps that must complete first
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  reflection?: string;
}

/**
 * Agent plan with steps and reasoning
 */
interface AgentPlan {
  goal: string;
  reasoning: string;
  steps: PlanStep[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  requiresCollaboration: boolean;
  createdAt: Date;
}

/**
 * Reflection on action outcome
 */
interface ActionReflection {
  action: string;
  outcome: any;
  success: boolean;
  learnings: string[];
  adjustments: string[];
  timestamp: Date;
}

/**
 * Deep Agent configuration
 */
export interface DeepAgentConfig {
  agentName: string;
  agentType: string;
  description: string;
  capabilities: string[];
  enablePlanning?: boolean;
  enableReflection?: boolean;
  maxPlanSteps?: number;
  reflectionThreshold?: number; // How many actions before reflecting
}

/**
 * Deep Agent Base Class
 * Extends basic agent with planning, reflection, and multi-step reasoning
 */
export abstract class DeepAgentBase {
  protected config: DeepAgentConfig;
  protected storage: IStorage;
  protected model: ChatAnthropic;
  protected plannerModel: ChatAnthropic;
  protected reflectorModel: ChatAnthropic;

  protected tracingEnabled: boolean;
  protected enableKnowledgeEnrichment: boolean;

  protected currentPlan?: AgentPlan;
  protected reflectionHistory: ActionReflection[] = [];
  protected actionCount: number = 0;

  // Memory layers
  protected mem0: ReturnType<typeof getMem0Service>; // Shared facts with other agents
  protected memory: LettaAgentMemory; // Private self-editing memory

  constructor(config: DeepAgentConfig, storage: IStorage) {
    this.config = {
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 10,
      reflectionThreshold: 3,
      ...config,
    };
    this.storage = storage;

    // Initialize tracing (disabled for now)
    this.tracingEnabled = false;

    // Enable knowledge enrichment if Retool Vectors MCP is configured
    this.enableKnowledgeEnrichment = false; // Disabled: RetoolVectorsMCP removed

    // Initialize memory layers
    this.mem0 = getMem0Service();
    this.memory = createAgentMemory(config.agentName.toLowerCase());

    // Initialize agent's core memory with persona
    this.memory.initialize(`I am the ${config.agentName} agent responsible for ${config.description}`).catch((error) => {
      console.error(`[${config.agentName}] Failed to initialize memory:`, error);
    });

    // Subscribe to relevant facts from other agents
    this.subscribeToFacts();

    // Initialize models with different temperatures for different purposes
    const callbacks: any[] = [];

    // Main execution model
    this.model = new ChatAnthropic({
      modelName: "claude-sonnet-4-5-20250929",
      temperature: 0.7,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      callbacks,
      metadata: {
        layer: "deep-agent",
        agent_type: config.agentName.toLowerCase(),
        system: "deep-agent-architecture",
      },
    });

    // Planner model (lower temperature for more structured thinking)
    this.plannerModel = new ChatAnthropic({
      modelName: "claude-sonnet-4-5-20250929",
      temperature: 0.3,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      callbacks,
      metadata: {
        layer: "deep-agent-planning",
        agent_type: config.agentName.toLowerCase(),
        component: "planner",
      },
    });

    // Reflector model (balanced temperature for evaluation)
    this.reflectorModel = new ChatAnthropic({
      modelName: "claude-sonnet-4-5-20250929",
      temperature: 0.5,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      callbacks,
      metadata: {
        layer: "deep-agent-reflection",
        agent_type: config.agentName.toLowerCase(),
        component: "reflector",
      },
    });

    console.log(`[${config.agentName}] Deep Agent initialized with planning=${this.config.enablePlanning}, reflection=${this.config.enableReflection}`);
  }

  /**
   * Get agent configuration
   * Required by orchestrator to access agent metadata
   */
  public getConfig() {
    return {
      agentId: this.config.agentName.toLowerCase().replace(/deep/, '').replace(/agent/, '').trim(),
      agentName: this.config.agentName,
      agentType: this.config.agentType,
      description: this.config.description,
      capabilities: this.config.capabilities,
      autonomy: 'supervised', // Deep agents default to supervised
      focus: this.config.description,
    };
  }

  /**
   * Define agent-specific tools
   * Subclasses must implement this
   */
  protected abstract defineTools(): DynamicStructuredTool[];

  /**
   * Get agent system prompt
   * Subclasses must implement this
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Get fact subscription patterns for this agent
   * Subclasses should override to specify what facts they care about
   * Examples: ["project_*:schedule_variance", "*:risk_score"]
   */
  protected getFactSubscriptions(): string[] {
    return []; // Default: no subscriptions
  }

  /**
   * Subscribe to relevant facts from other agents
   */
  private subscribeToFacts(): void {
    const patterns = this.getFactSubscriptions();

    for (const pattern of patterns) {
      this.mem0.subscribe(
        this.config.agentName.toLowerCase(),
        pattern,
        (fact) => this.onFactObserved(fact)
      );
    }

    if (patterns.length > 0) {
      console.log(`[${this.config.agentName}] Subscribed to ${patterns.length} fact patterns`);
    }
  }

  /**
   * Called when another agent writes a relevant fact
   * Subclasses can override to respond to specific facts
   */
  protected async onFactObserved(fact: Fact): Promise<void> {
    // Update working memory
    await this.memory.appendContext(
      `Observed: ${fact.entity}.${fact.attribute} = ${JSON.stringify(fact.value)} (by ${fact.sourceAgent})`
    );

    console.log(`[${this.config.agentName}] Observed fact: ${fact.entity}.${fact.attribute}`);

    // Subclasses can override to check if this triggers any rules
    // Example: if (fact.attribute === 'schedule_variance' && fact.value < -5) { ... }
  }

  /**
   * Agent learns and remembers a fact
   */
  protected async learn(key: string, value: any): Promise<void> {
    await this.memory.learn(key, value);
    console.log(`[${this.config.agentName}] Learned: ${key}`);
  }

  /**
   * Agent broadcasts a fact to other agents
   */
  protected async broadcastFact(entity: string, attribute: string, value: any, confidence: number = 1.0): Promise<void> {
    await this.mem0.writeFact({
      entity,
      attribute,
      value,
      sourceAgent: this.config.agentName.toLowerCase(),
      confidence,
    });

    console.log(`[${this.config.agentName}] Broadcast fact: ${entity}.${attribute} = ${JSON.stringify(value)}`);
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
    await this.broadcastFact(
      entityId,
      `intervention_${interventionType}`,
      { interventionId, issuedAt: new Date().toISOString() },
      1.0
    );
  }

  /**
   * Create intervention with automatic duplicate checking
   * Returns intervention ID if created, null if duplicate detected
   */
  protected async createInterventionIfNew(
    entityId: string,
    interventionType: string,
    interventionData: any,
    withinHours: number = 24
  ): Promise<string | null> {
    // Check for recent duplicate
    const isDuplicate = await this.hasRecentIntervention(entityId, interventionType, withinHours);

    if (isDuplicate) {
      console.log(`[${this.config.agentName}] ⏭️  Skipping duplicate ${interventionType} intervention for ${entityId}`);
      return null;
    }

    // Create the intervention (agents must implement this)
    const interventionId = `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log intervention creation
    console.log(`[${this.config.agentName}] ✅ Creating ${interventionType} intervention for ${entityId}: ${interventionId}`);

    // Record that we issued this intervention
    await this.recordIntervention(entityId, interventionType, interventionId);

    return interventionId;
  }

  /**
   * Archive important context to long-term memory
   */
  protected async archiveContext(content: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.memory.archive(content, {
      ...metadata,
      archivedAt: new Date().toISOString(),
      source: 'deep-agent',
    });
  }

  /**
   * Enrich context with knowledge from Retool Vectors (RAG)
   */
  protected async enrichContextWithKnowledge(goal: string, context: any): Promise<any> {
    if (!this.enableKnowledgeEnrichment) {
      return context;
    }

    try {
      // Disabled: RetoolVectorsMCP removed
      const vectorsMCP = null;
      if (!vectorsMCP) {
        return context;
      }

      console.log(`[${this.config.agentName}] Enriching context with knowledge base via MCP`);

      // Query relevant documents
      const relevantDocs = await vectorsMCP.query({
        text: goal,
        topK: 3,
        filter: {
          domain: this.config.agentType, // Filter by agent domain
        },
      });

      if (relevantDocs.length === 0) {
        console.log(`[${this.config.agentName}] No relevant documents found`);
        return context;
      }

      console.log(`[${this.config.agentName}] Found ${relevantDocs.length} relevant documents`);

      // Add knowledge context
      return {
        ...context,
        knowledgeContext: relevantDocs.map(doc => ({
          content: doc.content,
          source: doc.metadata.source,
          relevance: doc.score,
        })),
        documentSources: relevantDocs.map(doc => doc.metadata.source),
      };
    } catch (error: any) {
      console.warn(`[${this.config.agentName}] Knowledge enrichment failed:`, error.message);
      return context;
    }
  }

  /**
   * Extract entity IDs from goal text and context
   */
  protected extractEntityIds(goal: string, context: any): string[] {
    const entityIds: string[] = [];

    // Look for entity IDs in context
    if (context.projectId) entityIds.push(context.projectId);
    if (context.entityId) entityIds.push(context.entityId);

    // Look for project IDs in goal text (e.g., "analyze project_123")
    const projectMatches = goal.match(/project[_-]?([a-zA-Z0-9-]+)/gi);
    if (projectMatches) {
      entityIds.push(...projectMatches.map(m => m.toLowerCase()));
    }

    return [...new Set(entityIds)]; // Remove duplicates
  }

  /**
   * Retrieve all facts about an entity as a structured record
   */
  protected async retrieveEntityFacts(entityId: string): Promise<Record<string, any>> {
    const facts: Record<string, any> = {};

    // Get current state (latest value for each attribute)
    const state = await this.mem0.getEntityState(entityId);

    for (const [attribute, data] of Object.entries(state)) {
      facts[attribute] = data.value;
      console.log(`[${this.config.agentName}] 🧠 Fact retrieved: ${entityId}.${attribute} = ${JSON.stringify(data.value)}`);
    }

    return facts;
  }

  /**
   * Enrich context with historical facts from Mem0
   * Formats facts as human-readable text for LLM consumption
   */
  protected async enrichContextWithFacts(goal: string, context: any): Promise<any> {
    try {
      const entityIds = this.extractEntityIds(goal, context);

      if (entityIds.length === 0) {
        return context;
      }

      // Build human-readable prior knowledge section
      const priorKnowledgeLines: string[] = [];
      priorKnowledgeLines.push('## Prior Knowledge (from previous observations)');
      priorKnowledgeLines.push('');

      for (const entityId of entityIds) {
        const facts = await this.retrieveEntityFacts(entityId);

        if (Object.keys(facts).length > 0) {
          priorKnowledgeLines.push(`### ${entityId}`);

          // Sort facts by key for consistent ordering
          const sortedFacts = Object.entries(facts).sort(([a], [b]) => a.localeCompare(b));

          for (const [key, value] of sortedFacts) {
            const formattedValue = typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
            priorKnowledgeLines.push(`- ${key}: ${formattedValue}`);
          }

          priorKnowledgeLines.push('');
          console.log(`[${this.config.agentName}] 🧠 Recalled ${Object.keys(facts).length} facts about ${entityId}`);
        }
      }

      // Add formatted prior knowledge to context
      const priorKnowledge = priorKnowledgeLines.join('\n');

      return {
        ...context,
        priorKnowledge,
        hasPriorKnowledge: priorKnowledgeLines.length > 2, // More than just headers
        _entityIds: entityIds // Keep for duplicate checking
      };
    } catch (error) {
      console.error(`[${this.config.agentName}] Failed to enrich context with facts:`, error);
      return context;
    }
  }

  /**
   * PHASE 1: PLANNING
   * Create a multi-step plan before executing
   */
  protected async createPlan(goal: string, context: any): Promise<AgentPlan> {
    console.log(`[${this.config.agentName}] Creating plan for goal: ${goal}`);

    // Enrich context with knowledge from Retool Vectors (context already has facts from run())
    const enrichedContext = await this.enrichContextWithKnowledge(goal, context);

    const tools = this.defineTools();
    const toolDescriptions = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');

    const planningPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a planning expert for ${this.config.agentName}.

Your role: Analyze the goal and create a detailed, step-by-step plan.

Available tools:
${toolDescriptions}

Create a plan with these characteristics:
1. Break down complex goals into clear, sequential steps
2. Identify dependencies between steps
3. Specify which tool to use for each step
4. Estimate expected outcomes
5. Determine if collaboration with other agents is needed

Return a JSON plan with this structure:
{{{{
  "reasoning": "Why this approach?",
  "estimatedComplexity": "low|medium|high",
  "requiresCollaboration": true|false,
  "steps": [
    {{{{
      "step": 1,
      "description": "What to do",
      "tool": "tool_name or null",
      "expectedOutcome": "What we expect",
      "dependencies": []
    }}}}
  ]
}}}}`],
      ["human", `{priorKnowledge}

## Current Goal
{goal}

## Additional Context
{context}

Create a plan to achieve this goal. Consider the prior knowledge when planning to avoid duplicate work.`],
    ]);

    const chain = planningPrompt.pipe(this.plannerModel);
    const response = await chain.invoke({
      goal,
      priorKnowledge: enrichedContext.priorKnowledge || '## Prior Knowledge\nNo prior observations for this entity.',
      context: JSON.stringify(enrichedContext, null, 2),
    });

    // Parse the plan from response
    const planText = response.content.toString();
    let parsedPlan;

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = planText.match(/```json\s*([\s\S]*?)\s*```/) || planText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : planText;
      parsedPlan = JSON.parse(jsonText);
    } catch (error) {
      console.error(`[${this.config.agentName}] Failed to parse plan, using fallback`);
      parsedPlan = {
        reasoning: "Direct execution needed",
        estimatedComplexity: "low",
        requiresCollaboration: false,
        steps: [
          {
            step: 1,
            description: goal,
            tool: null,
            expectedOutcome: "Complete the goal",
            dependencies: [],
          }
        ]
      };
    }

    // Build AgentPlan object
    const plan: AgentPlan = {
      goal,
      reasoning: parsedPlan.reasoning,
      estimatedComplexity: parsedPlan.estimatedComplexity || 'medium',
      requiresCollaboration: parsedPlan.requiresCollaboration || false,
      steps: parsedPlan.steps.map((step: any) => ({
        ...step,
        status: 'pending' as const,
      })),
      createdAt: new Date(),
    };

    this.currentPlan = plan;
    console.log(`[${this.config.agentName}] Plan created with ${plan.steps.length} steps, complexity: ${plan.estimatedComplexity}`);

    return plan;
  }

  /**
   * PHASE 2: EXECUTION
   * Execute the plan step by step
   */
  protected async executePlan(plan: AgentPlan): Promise<any> {
    console.log(`[${this.config.agentName}] Executing plan: ${plan.goal}`);

    const results: any[] = [];

    for (const step of plan.steps) {
      // Check dependencies
      const depsComplete = step.dependencies.every(depStep => {
        const dep = plan.steps.find(s => s.step === depStep);
        return dep?.status === 'completed';
      });

      if (!depsComplete) {
        console.log(`[${this.config.agentName}] Step ${step.step} waiting for dependencies`);
        step.status = 'pending';
        continue;
      }

      // Execute step
      step.status = 'executing';
      console.log(`[${this.config.agentName}] Executing step ${step.step}: ${step.description}`);

      try {
        const result = await this.executeStep(step, results);
        step.result = result;
        step.status = 'completed';
        results.push(result);

        console.log(`[${this.config.agentName}] Step ${step.step} completed`);

        // Trigger reflection if threshold reached
        this.actionCount++;
        if (this.config.enableReflection && this.actionCount >= (this.config.reflectionThreshold || 3)) {
          await this.reflect(step, result);
          this.actionCount = 0;
        }
      } catch (error: any) {
        step.status = 'failed';
        step.result = { error: error.message };
        console.error(`[${this.config.agentName}] Step ${step.step} failed:`, error);

        // Reflect on failure
        if (this.config.enableReflection) {
          await this.reflect(step, { error: error.message });
        }

        throw error;
      }
    }

    return {
      goal: plan.goal,
      steps: plan.steps.map(s => ({
        step: s.step,
        description: s.description,
        status: s.status,
        result: s.result,
        reflection: s.reflection,
      })),
      success: plan.steps.every(s => s.status === 'completed'),
    };
  }

  /**
   * Execute a single plan step
   */
  protected async executeStep(step: PlanStep, previousResults: any[]): Promise<any> {
    const tools = this.defineTools();

    // Create circular reference handler
    const seen = new WeakSet();
    const circularReplacer = (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    };

    // Safely serialize previousResults
    let serializedPreviousResults: string;
    try {
      // Convert previousResults to simple summary format
      const simplifiedResults = previousResults.map((result, idx) => {
        if (typeof result === 'object' && result !== null) {
          return {
            stepIndex: idx,
            summary: typeof result === 'string' ? result : JSON.stringify(result, circularReplacer).substring(0, 500)
          };
        }
        return { stepIndex: idx, summary: String(result) };
      });
      serializedPreviousResults = JSON.stringify(simplifiedResults, null, 2);
    } catch (e) {
      serializedPreviousResults = `[Previous results: ${previousResults.length} steps completed]`;
    }

    const contextString = `Step ${step.step}: ${step.description}
Expected outcome: ${step.expectedOutcome}
Previous results: ${serializedPreviousResults}`;

    // If step specifies a tool, use it
    if (step.tool) {
      const tool = tools.find(t => t.name === step.tool);
      if (tool) {
        console.log(`[${this.config.agentName}] Using tool: ${step.tool}`);
        // TODO: Execute tool dynamically using tool.function()
        // For now, tools are provided but not executed - LLM handles execution
        return { toolUsed: step.tool, summary: `Used ${step.tool}` };
      }
    }

    // Otherwise, use LLM to execute step
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.getSystemPrompt()],
      ["human", `Execute this step:
Description: {description}
Expected outcome: {expectedOutcome}
Context: {context}

Provide the result of executing this step.`],
    ]);

    const chain = prompt.pipe(this.model);
    const response = await chain.invoke({
      description: step.description,
      expectedOutcome: step.expectedOutcome,
      context: contextString,
    });

    return {
      stepResult: response.content.toString(),
      context,
    };
  }

  /**
   * PHASE 3: REFLECTION
   * Evaluate the outcome and learn from it
   */
  protected async reflect(step: PlanStep, outcome: any): Promise<ActionReflection> {
    console.log(`[${this.config.agentName}] Reflecting on step ${step.step}`);

    // Sanitize outcome to prevent circular JSON errors
    const sanitizeOutcome = (obj: any, depth = 0, maxDepth = 3): any => {
      if (depth > maxDepth) return '[Max depth reached]';
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.slice(0, 5).map(item => sanitizeOutcome(item, depth + 1, maxDepth));
      }

      const sanitized: any = {};
      const keys = Object.keys(obj).slice(0, 10); // Limit keys
      for (const key of keys) {
        if (key === 'previousResults' || key === 'context') {
          sanitized[key] = '[Omitted to prevent circular reference]';
        } else {
          try {
            sanitized[key] = sanitizeOutcome(obj[key], depth + 1, maxDepth);
          } catch {
            sanitized[key] = '[Could not serialize]';
          }
        }
      }
      return sanitized;
    };

    const reflectionPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a reflection expert for ${this.config.agentName}.

Analyze the action and its outcome. Provide:
1. Was it successful?
2. What did we learn?
3. What adjustments should we make?

Return JSON:
{{{{
  "success": true|false,
  "learnings": ["learning 1", "learning 2"],
  "adjustments": ["adjustment 1", "adjustment 2"]
}}}}`],
      ["human", `Action: {action}
Expected: {expected}
Actual outcome: {outcome}

Reflect on this action.`],
    ]);

    const chain = reflectionPrompt.pipe(this.reflectorModel);
    const sanitizedOutcome = sanitizeOutcome(outcome);
    const response = await chain.invoke({
      action: step.description,
      expected: step.expectedOutcome,
      outcome: JSON.stringify(sanitizedOutcome, null, 2),
    });

    let reflection;
    try {
      const reflectionText = response.content.toString();
      const jsonMatch = reflectionText.match(/```json\s*([\s\S]*?)\s*```/) || reflectionText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : reflectionText;
      reflection = JSON.parse(jsonText);
    } catch (error) {
      reflection = {
        success: true,
        learnings: ["Completed step"],
        adjustments: [],
      };
    }

    const actionReflection: ActionReflection = {
      action: step.description,
      outcome,
      success: reflection.success,
      learnings: reflection.learnings || [],
      adjustments: reflection.adjustments || [],
      timestamp: new Date(),
    };

    this.reflectionHistory.push(actionReflection);
    step.reflection = JSON.stringify(reflection, null, 2);

    console.log(`[${this.config.agentName}] Reflection: Success=${reflection.success}, Learnings=${reflection.learnings.length}`);

    return actionReflection;
  }

  /**
   * PUBLIC: Run agent with Deep Agent capabilities
   */
  async run(goal: string, context: any = {}): Promise<any> {
    console.log(`[${this.config.agentName}] Deep Agent run started: ${goal}`);

    try {
      // PHASE 0: RECALL - Retrieve historical facts from memory
      const enrichedContext = await this.enrichContextWithFacts(goal, context);

      // PHASE 1: PLANNING
      let plan: AgentPlan;
      if (this.config.enablePlanning) {
        plan = await this.createPlan(goal, enrichedContext);
      } else {
        // Direct execution without planning
        plan = {
          goal,
          reasoning: "Direct execution",
          estimatedComplexity: 'low',
          requiresCollaboration: false,
          steps: [{
            step: 1,
            description: goal,
            expectedOutcome: "Complete the goal",
            dependencies: [],
            status: 'pending',
          }],
          createdAt: new Date(),
        };
      }

      // PHASE 2: EXECUTION
      const result = await this.executePlan(plan);

      // PHASE 3: FINAL REFLECTION (if enabled)
      if (this.config.enableReflection) {
        const finalReflection = await this.reflectOnPlan(plan, result);
        result.finalReflection = finalReflection;
      }

      console.log(`[${this.config.agentName}] Deep Agent run completed`);
      return result;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Deep Agent run failed:`, error);
      throw error;
    }
  }

  /**
   * Reflect on entire plan execution
   */
  protected async reflectOnPlan(plan: AgentPlan, result: any): Promise<string> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `Reflect on the entire plan execution for ${this.config.agentName}.
Summarize learnings and future improvements.`],
      ["human", `Plan goal: {goal}
Steps: {steps}
Result: {result}
Reflection history: {reflectionHistory}

Provide a summary of what was learned and how to improve next time.`],
    ]);

    const chain = prompt.pipe(this.reflectorModel);
    const response = await chain.invoke({
      goal: plan.goal,
      steps: JSON.stringify(plan.steps, null, 2),
      result: JSON.stringify(result, null, 2),
      reflectionHistory: JSON.stringify(this.reflectionHistory, null, 2),
    });

    return response.content.toString();
  }

  /**
   * Get reflection history
   */
  getReflectionHistory(): ActionReflection[] {
    return this.reflectionHistory;
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): AgentPlan | undefined {
    return this.currentPlan;
  }
}
