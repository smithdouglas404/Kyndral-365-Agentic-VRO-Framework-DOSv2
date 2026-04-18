/**
 * DEEP AGENT BASE v4.0 - PALANTIR ONTOLOGY FIRST
 *
 * Enhanced agent with Deep Agent capabilities:
 * - Planning: Think before acting
 * - Reflection: Evaluate outcomes and adjust
 * - Multi-step reasoning: Break down complex tasks
 * - Memory: Maintain context across interactions
 *
 * DATA SOURCE: Palantir Foundry Ontology (via OntologyDataProvider)
 * - All data reads from Palantir as single source of truth
 * - PostgreSQL is NOT used for primary data
 *
 * NO LANGCHAIN DEPENDENCY for LLM calls.
 * Uses SmartModelRouter -> OpenRouterClient for all AI calls.
 * AgentTool used for local tool definitions only (no API cost, no LangChain).
 */

import { AgentTool } from "../../lib/AgentTool.js";
import type { IStorage } from "../../storage.js";
import { getMem0Service, type Fact } from "../../lib/Mem0Service.js";
import { createAgentMemory, type LettaAgentMemory } from "../../lib/LettaAgentMemory.js";
import { createMemoryManager, type MemoryManager } from "../../lib/MemoryManager.js";
import { getSmartRouter, SmartModelRouter, ModelTier, type ProjectChangeEvent } from "../../lib/SmartModelRouter.js";
import { OntologyDataProvider, type QueryOptions, type QueryFilter } from "../../services/OntologyDataProvider.js";
import { PALANTIR_OBJECT_TYPES } from "../../constants/palantirOntology.js";
import { getPalantirActionsService, type CreateInterventionParams, type CreateAlertParams } from "../../services/PalantirActionsService.js";
type VectorDocument = { id: string; content: string; metadata?: Record<string, any> };

/**
 * Plan step for multi-step reasoning
 */
interface PlanStep {
  step: number;
  description: string;
  tool?: string;
  toolInput?: Record<string, any>; // Parameters for tool execution
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
  useSmartRouting?: boolean; // Enable cost-optimized model routing
}

/**
 * Deep Agent Base Class
 * Extends basic agent with planning, reflection, and multi-step reasoning
 */
export abstract class DeepAgentBase {
  protected config: DeepAgentConfig;
  protected storage: IStorage;
  protected router: SmartModelRouter;
  protected aiEnabled: boolean = false;

  protected tracingEnabled: boolean;
  protected enableKnowledgeEnrichment: boolean;

  protected currentPlan?: AgentPlan;
  protected reflectionHistory: ActionReflection[] = [];
  protected actionCount: number = 0;

  protected mem0: ReturnType<typeof getMem0Service>;
  protected memory: LettaAgentMemory;
  protected conversationMemory: MemoryManager;
  private memoryInitPromise: Promise<void>;

  constructor(config: DeepAgentConfig, storage: IStorage) {
    this.config = {
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 10,
      reflectionThreshold: 3,
      ...config,
    };
    this.storage = storage;

    this.router = getSmartRouter();
    this.aiEnabled = this.router.isAIEnabled();
    
    if (!this.aiEnabled) {
      console.log(`[${config.agentName}] ⛔ AI DISABLED - Agent created in dormant mode (zero token consumption)`);
      this.mem0 = getMem0Service();
      this.memory = createAgentMemory(config.agentName.toLowerCase());
      this.conversationMemory = createMemoryManager(config.agentName.toLowerCase(), {
        contextWindowSize: 10,
        maxHistorySize: 100
      });
      this.memoryInitPromise = Promise.resolve();
      this.tracingEnabled = false;
      this.enableKnowledgeEnrichment = false;
      return;
    }

    this.tracingEnabled = false;
    this.enableKnowledgeEnrichment = false;

    this.mem0 = getMem0Service();
    this.memory = createAgentMemory(config.agentName.toLowerCase());
    this.conversationMemory = createMemoryManager(config.agentName.toLowerCase(), {
      contextWindowSize: 10,
      maxHistorySize: 100
    });

    this.memoryInitPromise = this.memory.initialize(`I am the ${config.agentName} agent responsible for ${config.description}`).catch((error) => {
      console.error(`[${config.agentName}] CRITICAL: Failed to initialize memory:`, error);
      throw error;
    });

    this.subscribeToFacts();

    console.log(`[${config.agentName}] Deep Agent initialized with planning=${this.config.enablePlanning}, reflection=${this.config.enableReflection}`);
  }

  isEnabled(): boolean {
    return this.aiEnabled;
  }

  // ============================================================================
  // PALANTIR ONTOLOGY DATA ACCESS METHODS
  // All data reads go through OntologyDataProvider -> Palantir Foundry
  // ============================================================================

  /**
   * Get a single project from Palantir Ontology
   */
  protected async getProject(projectId: string): Promise<any | null> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.PROJECT, {
        filters: [{ field: 'projectId', operator: 'eq', value: projectId }],
        pageSize: 1
      });
      return result.data[0] || null;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get project from Palantir:`, error.message);
      return null;
    }
  }

  /**
   * Get all projects from Palantir Ontology
   */
  protected async getProjects(options?: QueryOptions): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.PROJECT, {
        pageSize: 100,
        ...options
      });
      console.log(`[${this.config.agentName}] Retrieved ${result.data.length} projects from Palantir (source: ${result.source})`);
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get projects from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get risks from Palantir Ontology
   */
  protected async getRisks(filters?: QueryFilter[]): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.RISK, {
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get risks from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get risks for a specific project
   */
  protected async getProjectRisks(projectId: string): Promise<any[]> {
    return this.getRisks([{ field: 'projectId', operator: 'eq', value: projectId }]);
  }

  /**
   * Get budgets from Palantir Ontology
   */
  protected async getBudgets(filters?: QueryFilter[]): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.PROJECT, {
        // Budget data is on Project
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get budgets from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get budget for a specific project
   */
  protected async getProjectBudget(projectId: string): Promise<any | null> {
    const budgets = await this.getBudgets([{ field: 'projectId', operator: 'eq', value: projectId }]);
    return budgets[0] || null;
  }

  /**
   * Get objectives (OKRs) from Palantir Ontology
   */
  protected async getObjectives(filters?: QueryFilter[]): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.OKR, {
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get objectives from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get key results from Palantir Ontology
   */
  protected async getKeyResults(objectiveId?: string): Promise<any[]> {
    try {
      const filters: QueryFilter[] = objectiveId
        ? [{ field: 'objectiveId', operator: 'eq', value: objectiveId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.KEY_RESULT, {
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get key results from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get metrics/KPIs from Palantir Ontology
   */
  protected async getMetrics(filters?: QueryFilter[]): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.KPI, {
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get metrics from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get teams from Palantir Ontology
   */
  protected async getTeams(filters?: QueryFilter[]): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.TEAM, {
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get teams from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get dependencies from Palantir Ontology
   */
  protected async getDependencies(projectId?: string): Promise<any[]> {
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'sourceProjectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.DEPENDENCY, {
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get dependencies from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get milestones from Palantir Ontology
   */
  protected async getMilestones(projectId?: string): Promise<any[]> {
    const out: any[] = [];

    // 1. Prefer the dedicated AtlasMilestone object type
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'projectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.MILESTONE, {
        filters,
        pageSize: 100,
      });
      for (const m of result.data || []) out.push(m);
    } catch (error: any) {
      // AtlasMilestone may not yet be deployed in Palantir — fall through to embedded JSON
      console.warn(`[${this.config.agentName}] AtlasMilestone query failed (${error.message}); falling back to embedded JSON.`);
    }

    // 2. Always merge in legacy milestonesJson embedded on AtlasProject rows
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'projectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.PROJECT, {
        filters,
        pageSize: 100,
      });
      // Normalise on (projectId|lowercased name) so standalone AtlasMilestone
      // rows and embedded milestonesJson rows dedupe against each other.
      const keyOf = (m: any, pid?: string) =>
        `${pid || m.projectId || ''}|${(m.name || '').toLowerCase()}`;
      const seen = new Set(out.map((m: any) => keyOf(m)));
      for (const row of result.data || []) {
        const raw = (row as any).milestonesJson ?? (row as any).milestones ?? [];
        let arr: any[] = [];
        if (Array.isArray(raw)) arr = raw;
        else if (typeof raw === 'string') {
          try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) arr = parsed; } catch {}
        }
        const pid = (row as any).projectId || (row as any).id;
        for (const m of arr) {
          const k = keyOf(m, pid);
          if (seen.has(k)) continue;
          out.push({ ...m, projectId: m.projectId || pid });
          seen.add(k);
        }
      }
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get embedded milestones:`, error.message);
    }

    return out;
  }

  /**
   * Get governance checkpoints from Palantir Ontology
   */
  protected async getGovernanceCheckpoints(projectId?: string): Promise<any[]> {
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'projectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.CHECKPOINT, {
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get governance checkpoints from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get change initiatives (OCM) from Palantir Ontology
   */
  protected async getChangeInitiatives(filters?: QueryFilter[]): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.PROJECT, { // Change initiatives tracked as Projects
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get change initiatives from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get dashboard metrics aggregated from Palantir
   */
  protected async getDashboardMetrics(): Promise<any> {
    try {
      return await OntologyDataProvider.getDashboardMetrics();
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get dashboard metrics from Palantir:`, error.message);
      return null;
    }
  }

  /**
   * Query any Palantir object type with custom filters
   */
  protected async queryOntology(objectType: string, options?: QueryOptions): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(objectType, options);
      console.log(`[${this.config.agentName}] Queried ${result.data.length} ${objectType} objects from Palantir`);
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to query ${objectType} from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get work items (tasks/stories) from Palantir Ontology
   */
  protected async getTasks(projectId?: string): Promise<any[]> {
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'projectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.PROJECT, { // Work items are Projects
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get tasks from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get stories by project from Palantir Ontology
   */
  protected async getStoriesByProject(projectId: string): Promise<any[]> {
    return this.getTasks(projectId);
  }

  /**
   * Get interventions from Palantir Ontology
   */
  protected async getInterventions(filters?: QueryFilter[]): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query('AtlasInsight', {
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get interventions from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get OKRs for a division from Palantir Ontology
   */
  protected async getDivisionOkrs(divisionId: string): Promise<any[]> {
    try {
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.OKR, {
        filters: [{ field: 'businessUnitId', operator: 'eq', value: divisionId }],
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get division OKRs from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get issues from Palantir Ontology
   */
  protected async getIssues(projectId?: string): Promise<any[]> {
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'projectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.RISK, { // Issues tracked as Risks
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get issues from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get change requests from Palantir Ontology
   */
  protected async getChangeRequests(projectId?: string): Promise<any[]> {
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'projectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.INTERVENTION, { // Change requests tracked as Interventions
        filters,
        pageSize: 100
      });
      return result.data;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get change requests from Palantir:`, error.message);
      return [];
    }
  }

  /**
   * Get resource allocations from Palantir Ontology
   */
  protected async getResourceAllocations(projectId?: string): Promise<any[]> {
    const out: any[] = [];

    // 1. Prefer the dedicated AtlasResource object type
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'projectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.RESOURCE, {
        filters,
        pageSize: 100,
      });
      for (const r of result.data || []) out.push(r);
    } catch (error: any) {
      // AtlasResource may not yet be deployed in Palantir — fall through to embedded JSON
      console.warn(`[${this.config.agentName}] AtlasResource query failed (${error.message}); falling back to embedded JSON.`);
    }

    // 2. Always merge in legacy resourcesJson embedded on AtlasProject rows
    try {
      const filters: QueryFilter[] = projectId
        ? [{ field: 'projectId', operator: 'eq', value: projectId }]
        : [];
      const result = await OntologyDataProvider.query(PALANTIR_OBJECT_TYPES.PROJECT, {
        filters,
        pageSize: 100,
      });
      // Normalise on (projectId|lowercased name) so standalone AtlasResource
      // rows and embedded resourcesJson rows dedupe against each other.
      const keyOf = (r: any, pid?: string) =>
        `${pid || r.projectId || ''}|${(r.name || '').toLowerCase()}`;
      const seen = new Set(out.map((r: any) => keyOf(r)));
      for (const row of result.data || []) {
        const raw = (row as any).resourcesJson ?? (row as any).resources ?? [];
        let arr: any[] = [];
        if (Array.isArray(raw)) arr = raw;
        else if (typeof raw === 'string') {
          try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) arr = parsed; } catch {}
        }
        const pid = (row as any).projectId || (row as any).id;
        for (const r of arr) {
          const k = keyOf(r, pid);
          if (seen.has(k)) continue;
          out.push({ ...r, projectId: r.projectId || pid });
          seen.add(k);
        }
      }
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to get embedded resources:`, error.message);
    }

    return out;
  }

  // ============================================================================
  // END PALANTIR DATA ACCESS METHODS
  // ============================================================================

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
  protected abstract defineTools(): AgentTool[];

  /**
   * PUBLIC: Run a single tool directly by name without LLM planning loop.
   * Used by route handlers (e.g. /api/projects/ingest) to invoke a specific
   * agent tool with concrete arguments and get its raw output back.
   *
   * Returns { ok, toolName, output, error } so callers can render results
   * or surface errors per-tool without aborting the whole batch.
   */
  async runToolDirect(
    toolName: string,
    args: Record<string, any> = {}
  ): Promise<{ ok: boolean; agent: string; toolName: string; output?: any; error?: string }> {
    const tools = this.defineTools();
    const tool = tools.find((t) => t.name === toolName);
    if (!tool) {
      return {
        ok: false,
        agent: this.config.agentName,
        toolName,
        error: `Tool '${toolName}' not found on agent ${this.config.agentName}`,
      };
    }

    try {
      const output = await tool.invoke(args);
      this.actionCount++;
      return { ok: true, agent: this.config.agentName, toolName, output };
    } catch (err: any) {
      console.error(
        `[${this.config.agentName}] runToolDirect(${toolName}) failed:`,
        err.message
      );
      return {
        ok: false,
        agent: this.config.agentName,
        toolName,
        error: err.message || String(err),
      };
    }
  }

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
    // Ensure memory is initialized before using it
    await this.memoryInitPromise;

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
    try {
      await this.memoryInitPromise;
      await Promise.race([
        this.memory.learn(key, value),
        new Promise((_, rej) => setTimeout(() => rej(new Error('learn timeout')), 1500)),
      ]);
      console.log(`[${this.config.agentName}] Learned: ${key}`);
    } catch (err: any) {
      console.warn(`[${this.config.agentName}] learn non-fatal failure for ${key}: ${err.message}`);
    }
  }

  /**
   * Agent broadcasts a fact to other agents
   */
  protected async broadcastFact(entity: string, attribute: string, value: any, confidence: number = 1.0): Promise<void> {
    try {
      await this.mem0.writeFact({
        entity,
        attribute,
        value,
        sourceAgent: this.config.agentName.toLowerCase(),
        confidence,
      });
      console.log(`[${this.config.agentName}] Broadcast fact: ${entity}.${attribute} = ${JSON.stringify(value)}`);
    } catch (err: any) {
      // Never let mem0 failures abort an agent tool — fact broadcast is best-effort
      console.warn(`[${this.config.agentName}] broadcastFact non-fatal failure for ${entity}.${attribute}: ${err.message}`);
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
    await this.broadcastFact(
      entityId,
      `intervention_${interventionType}`,
      { interventionId, issuedAt: new Date().toISOString() },
      1.0
    );
  }

  /**
   * Create intervention with automatic duplicate checking
   * Creates intervention in Palantir Foundry for HITL approval workflow
   * Returns intervention ID if created, null if duplicate detected
   */
  protected async createInterventionIfNew(
    entityId: string,
    interventionType: string,
    interventionData: {
      title: string;
      description: string;
      recommendation: string;
      severity?: "critical" | "high" | "medium" | "low";
      projectId?: string;
      estimatedImpact?: string;
      requiredApprovers?: string[];
      autoApproveAfterHours?: number;
      metadata?: Record<string, unknown>;
    },
    withinHours: number = 24
  ): Promise<string | null> {
    // Check for recent duplicate
    const isDuplicate = await this.hasRecentIntervention(entityId, interventionType, withinHours);

    if (isDuplicate) {
      console.log(`[${this.config.agentName}] ⏭️  Skipping duplicate ${interventionType} intervention for ${entityId}`);
      return null;
    }

    // Create the intervention in Palantir Foundry (HITL workflow)
    const actionsService = getPalantirActionsService();
    const result = await actionsService.createIntervention({
      title: interventionData.title,
      description: interventionData.description,
      interventionType,
      severity: interventionData.severity || "medium",
      agentSource: this.config.agentName,
      projectId: interventionData.projectId,
      entityType: "project", // or derive from entityId
      entityId,
      recommendation: interventionData.recommendation,
      estimatedImpact: interventionData.estimatedImpact,
      requiredApprovers: interventionData.requiredApprovers,
      autoApproveAfterHours: interventionData.autoApproveAfterHours,
      metadata: {
        ...interventionData.metadata,
        agentType: this.config.agentType,
        capabilities: this.config.capabilities,
      },
    });

    if (!result.success) {
      console.error(`[${this.config.agentName}] ❌ Failed to create intervention in Palantir: ${result.error}`);
      return null;
    }

    const interventionId = result.objectRid || `int_${Date.now()}`;
    console.log(`[${this.config.agentName}] ✅ Created intervention in Palantir: ${interventionId}`);

    // Record that we issued this intervention (for duplicate detection)
    await this.recordIntervention(entityId, interventionType, interventionId);

    // Also create an alert to notify relevant parties
    await this.createAlert({
      title: `Intervention Required: ${interventionData.title}`,
      message: interventionData.recommendation,
      alertType: "intervention_created",
      severity: interventionData.severity || "medium",
      projectId: interventionData.projectId,
      entityId,
      actionRequired: true,
      relatedInterventionId: interventionId,
    });

    return interventionId;
  }

  /**
   * Create an alert in Palantir Foundry
   * Palantir handles notification delivery based on severity and notifyRoles
   */
  protected async createAlert(params: {
    title: string;
    message: string;
    alertType: string;
    severity: "critical" | "high" | "medium" | "low";
    projectId?: string;
    entityType?: string;
    entityId?: string;
    notifyRoles?: string[];
    notifyUsers?: string[];
    actionRequired?: boolean;
    relatedInterventionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string | null> {
    const actionsService = getPalantirActionsService();
    const result = await actionsService.createAlert({
      title: params.title,
      message: params.message,
      alertType: params.alertType,
      severity: params.severity,
      agentSource: this.config.agentName,
      projectId: params.projectId,
      entityType: params.entityType,
      entityId: params.entityId,
      notifyRoles: params.notifyRoles || this.getDefaultNotifyRoles(params.severity),
      notifyUsers: params.notifyUsers,
      actionRequired: params.actionRequired ?? false,
      relatedInterventionId: params.relatedInterventionId,
      metadata: {
        ...params.metadata,
        agentType: this.config.agentType,
      },
    });

    if (!result.success) {
      console.error(`[${this.config.agentName}] ❌ Failed to create alert in Palantir: ${result.error}`);
      return null;
    }

    const alertId = result.objectRid || `alert_${Date.now()}`;
    console.log(`[${this.config.agentName}] 🔔 Created alert in Palantir: ${alertId} (${params.severity})`);
    return alertId;
  }

  /**
   * Get default notification roles based on severity
   */
  private getDefaultNotifyRoles(severity: "critical" | "high" | "medium" | "low"): string[] {
    switch (severity) {
      case "critical":
        return ["executive", "portfolio_manager", "project_manager"];
      case "high":
        return ["portfolio_manager", "project_manager"];
      case "medium":
        return ["project_manager", "team_lead"];
      case "low":
        return ["team_lead"];
      default:
        return ["project_manager"];
    }
  }

  /**
   * Check a Palantir Function — all agents can call business logic / threshold checks
   * Returns the rule result, or null if Palantir is not configured
   * Automatically logs execution with agent metadata
   * Auto-notifies Notification Agent when rule result has notify=true or escalate=true
   */
  protected async checkRule(functionName: string, input: Record<string, any>, projectId?: string): Promise<any> {
    try {
      const { getPalantirRulesService } = await import('../../lib/PalantirRulesService.js');
      const rules = getPalantirRulesService();
      if (!rules) {
        console.log(`[${this.config.agentName}] Palantir Rules not configured — skipping check: ${functionName}`);
        return null;
      }

      // Pass agent metadata for execution logging
      const agentId = this.config.agentName.toLowerCase().replace(/deep|agent/g, '').trim() || this.config.agentType;
      const metadata = {
        agentId,
        projectId,
        tags: [this.config.agentType, 'agent-rule-check'],
      };

      const result = await Promise.race([
        rules.checkRule(functionName, input, metadata),
        new Promise<any>((_, rej) => setTimeout(() => rej(new Error('checkRule timeout')), 3000)),
      ]);
      if (result.success) {
        console.log(`[${this.config.agentName}] Function "${functionName}" checked (${result.executionTime}ms)`);

        // Store in short-term context
        await this.memory.appendContext(
          `Rule check "${functionName}": ${JSON.stringify(result.result)}`
        );

        // Store in persistent Letta memory for learning
        await this.learn(`rule_result_${functionName}`, {
          functionName,
          input,
          result: result.result,
          executionTime: result.executionTime,
          checkedAt: new Date().toISOString(),
        });

        // Auto-notify Notification Agent if rule says to escalate or notify
        const ruleResult = result.result || {};
        if (ruleResult.notify === true || ruleResult.escalate === true) {
          const severity = ruleResult.severity || input.severity || 'medium';
          const message = ruleResult.message || `Function "${functionName}" triggered: ${ruleResult.action || 'alert'}`;

          console.log(`[${this.config.agentName}] 🔔 Auto-notifying: ${functionName} (escalate=${ruleResult.escalate}, severity=${severity})`);

          // Broadcast to Notification Agent via fact (it subscribes to *:alert, *:escalation)
          await this.broadcastFact(
            projectId || input.projectId || 'system',
            ruleResult.escalate ? 'escalation' : 'alert',
            {
              functionName,
              sourceAgent: agentId,
              message,
              severity,
              action: ruleResult.action,
              notifyRoles: ruleResult.notifyRoles,
              input,
              ruleResult,
              triggeredAt: new Date().toISOString(),
            },
            1.0
          );
        }

        return result.result;
      } else {
        console.warn(`[${this.config.agentName}] Function "${functionName}" failed: ${result.error}`);
        return null;
      }
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Rule check error: ${error.message}`);
      return null;
    }
  }

  /**
   * Check a threshold using Palantir Rules Service
   * Returns structured threshold result with severity and actions
   */
  protected async checkThreshold(
    thresholdType: string,
    currentValue: number,
    context?: Record<string, any>
  ): Promise<any> {
    try {
      const { getPalantirRulesService } = await import('../../lib/PalantirRulesService.js');
      const rules = getPalantirRulesService();
      if (!rules) {
        console.log(`[${this.config.agentName}] Palantir Rules not configured — using default thresholds`);
        return null;
      }

      const result = await rules.checkThreshold(
        this.config.agentType,
        thresholdType,
        currentValue,
        context
      );

      if (result.triggered) {
        console.log(`[${this.config.agentName}] ⚠️ Threshold "${thresholdType}" breached: ${result.message}`);

        // Auto-broadcast if notification required
        if (result.notify || result.escalate) {
          await this.broadcastFact(
            context?.projectId || 'system',
            result.escalate ? 'escalation' : 'alert',
            {
              thresholdType,
              currentValue,
              severity: result.severity,
              message: result.message,
              action: result.action,
              notifyRoles: result.notifyRoles,
              sourceAgent: this.config.agentName.toLowerCase(),
              triggeredAt: new Date().toISOString(),
            },
            1.0
          );
        }
      }

      return result;
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Threshold check error: ${error.message}`);
      return null;
    }
  }

  /**
   * Archive important context to long-term memory
   */
  protected async archiveContext(content: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      await this.memoryInitPromise;
      await Promise.race([
        this.memory.archive(content, {
          ...metadata,
          archivedAt: new Date().toISOString(),
          source: 'deep-agent',
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('archive timeout')), 1500)),
      ]);
    } catch (err: any) {
      console.warn(`[${this.config.agentName}] archiveContext non-fatal failure: ${err.message}`);
    }
  }

  /**
   * Enrich context with knowledge from Palantir Ontology
   * Queries relevant data based on agent type and context
   */
  protected async enrichContextWithKnowledge(goal: string, context: any): Promise<any> {
    if (!this.enableKnowledgeEnrichment) {
      return context;
    }

    try {
      // Get relevant data from Palantir based on agent type
      const dashboardMetrics = await this.getDashboardMetrics();
      if (dashboardMetrics) {
        return {
          ...context,
          palantirMetrics: dashboardMetrics,
        };
      }
      return context;
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

    // Look for entity IDs in context (highest priority)
    if (context.projectId) entityIds.push(context.projectId);
    if (context.entityId) entityIds.push(context.entityId);

    // Look for UUIDs in parentheses: "(d13c54a6-6514-47c3-9003-40c274731c9b)"
    const uuidInParensMatches = goal.match(/\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/gi);
    if (uuidInParensMatches) {
      // Extract UUID from parentheses
      entityIds.push(...uuidInParensMatches.map(m => m.replace(/[()]/g, '').toLowerCase()));
    }

    // Look for bare UUIDs anywhere in text
    const uuidMatches = goal.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
    if (uuidMatches) {
      entityIds.push(...uuidMatches.map(m => m.toLowerCase()));
    }

    // Look for project IDs with prefix (e.g., "project_123", "proj-abc")
    const projectMatches = goal.match(/(?:project|proj)[_-]([a-zA-Z0-9-]+)/gi);
    if (projectMatches) {
      entityIds.push(...projectMatches.map(m => m.toLowerCase()));
    }

    const uniqueIds = [...new Set(entityIds)]; // Remove duplicates

    if (uniqueIds.length > 0) {
      console.log(`[${this.config.agentName}] 🔍 Extracted entity IDs: ${uniqueIds.join(', ')}`);
    }

    return uniqueIds;
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

    const systemPrompt = `You are a planning expert for ${this.config.agentName}.

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
{
  "reasoning": "Why this approach?",
  "estimatedComplexity": "low|medium|high",
  "requiresCollaboration": true|false,
  "steps": [
    {
      "step": 1,
      "description": "What to do",
      "tool": "tool_name or null",
      "toolInput": {"param1": "value1"},
      "expectedOutcome": "What we expect",
      "dependencies": []
    }
  ]
}

IMPORTANT: When specifying toolInput, extract the required parameters from the context (e.g., projectId, changeId, etc.).
Example: If context has projectId: "proj_123", use {"projectId": "proj_123"} as toolInput.`;

    const priorKnowledge = enrichedContext.priorKnowledge || '## Prior Knowledge\nNo prior observations for this entity.';
    const userPrompt = `${priorKnowledge}

## Current Goal
${goal}

## Additional Context
${JSON.stringify(enrichedContext, null, 2)}

Create a plan to achieve this goal. Consider the prior knowledge when planning to avoid duplicate work.`;

    const response = await this.router.callModel(ModelTier.CHEAP, systemPrompt, userPrompt);
    const planText = response.content;
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
        console.log(`[${this.config.agentName}] Executing tool: ${step.tool}`);
        try {
          // Extract tool parameters from step description or use default context
          const toolInput = step.toolInput || {};

          // Invoke the tool function
          const toolResult = await tool.invoke(toolInput);
          console.log(`[${this.config.agentName}] Tool ${step.tool} completed successfully`);

          return {
            toolUsed: step.tool,
            toolResult,
            summary: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult).substring(0, 200)
          };
        } catch (error: any) {
          console.error(`[${this.config.agentName}] Tool ${step.tool} failed:`, error.message);
          throw error;
        }
      }
    }

    const execUserPrompt = `Execute this step:
Description: ${step.description}
Expected outcome: ${step.expectedOutcome}
Context: ${contextString}

Provide the result of executing this step.`;

    const response = await this.router.callModel(ModelTier.CHEAP, this.getSystemPrompt(), execUserPrompt);

    return {
      stepResult: response.content,
      summary: response.content.substring(0, 200),
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

    const reflectSystemPrompt = `You are a reflection expert for ${this.config.agentName}.

Analyze the action and its outcome. Provide:
1. Was it successful?
2. What did we learn?
3. What adjustments should we make?

Return JSON:
{
  "success": true|false,
  "learnings": ["learning 1", "learning 2"],
  "adjustments": ["adjustment 1", "adjustment 2"]
}`;

    const sanitizedOutcome = sanitizeOutcome(outcome);
    const reflectUserPrompt = `Action: ${step.description}
Expected: ${step.expectedOutcome}
Actual outcome: ${JSON.stringify(sanitizedOutcome, null, 2)}

Reflect on this action.`;

    const response = await this.router.callModel(ModelTier.CHEAP, reflectSystemPrompt, reflectUserPrompt);

    let reflection;
    try {
      const reflectionText = response.content;
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
   * Load conversation context from MemoryManager
   * Includes recent messages + semantic facts
   */
  protected async loadConversationContext(goal: string): Promise<{
    recentMessages: string;
    semanticKnowledge: string;
  }> {
    try {
      const context = await this.conversationMemory.getContextForThought(goal);

      const recentMessages = context.history.length > 0
        ? context.history.map((msg: any) =>
          `${msg.role}: ${msg.content}`
        ).join('\n')
        : 'No recent conversation history';

      return {
        recentMessages,
        semanticKnowledge: context.knowledge
      };
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to load conversation context:`, error.message);
      return {
        recentMessages: 'No conversation history available',
        semanticKnowledge: 'No semantic knowledge available'
      };
    }
  }

  /**
   * Save interaction to conversation memory
   */
  protected async saveConversationInteraction(goal: string, result: any): Promise<void> {
    try {
      const resultSummary = typeof result === 'string'
        ? result
        : JSON.stringify(result).substring(0, 500); // Truncate large results

      await this.conversationMemory.recordInteraction(goal, resultSummary);
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Failed to save conversation:`, error.message);
    }
  }

  /**
   * PUBLIC: Run agent with Deep Agent capabilities
   * NOW WITH CONVERSATION MEMORY AND SMART ROUTING
   */
  async run(goal: string, context: any = {}): Promise<any> {
    console.log(`[${this.config.agentName}] Deep Agent run started: ${goal}`);

    try {
      // PHASE 0: SMART ROUTING - Check cache and classify task
      const router = getSmartRouter();
      const classification = router.classifyTask(
        this.config.agentType,
        context.projectData || context,
        this.config.agentName
      );

      // Check if we can skip analysis (cached result)
      if (classification.skipAnalysis && classification.cachedResult) {
        console.log(`[${this.config.agentName}] ✅ CACHE HIT - zero API cost`);
        return {
          cached: true,
          result: classification.cachedResult,
          tier: classification.tier,
          reason: classification.reason,
        };
      }

      // TIER 0: Check if heuristics can handle this without any LLM call
      if (classification.tier === ModelTier.HEURISTIC && classification.heuristicResult) {
        const heuristicResponse = router.formatHeuristicResponse(
          classification.heuristicResult,
          this.config.agentName
        );
        console.log(`[${this.config.agentName}] ✅ TIER 0 HEURISTIC - zero API cost (${classification.heuristicResult.findings.length} metrics evaluated)`);

        // Cache the heuristic result
        const projectId = context.projectData?.id || context.projectId;
        if (projectId) {
          router.cacheResult(this.config.agentType, context.projectData || context, this.config.agentName, heuristicResponse.content, ModelTier.HEURISTIC);
          router.storeSummary(this.config.agentName, projectId, classification.heuristicResult.summary);
        }

        return {
          cached: false,
          heuristic: true,
          result: heuristicResponse.content,
          tier: ModelTier.HEURISTIC,
          reason: classification.reason,
          findings: classification.heuristicResult.findings,
          riskLevel: classification.heuristicResult.riskLevel,
          recommendations: classification.heuristicResult.recommendations,
          costSaved: heuristicResponse.costSaved,
        };
      }

      // Get other agents' summaries for context
      const projectId = context.projectData?.id || context.projectId;
      const otherSummaries = projectId ? router.getAllSummaries(projectId) : {};
      
      console.log(`[${this.config.agentName}] Using TIER ${classification.tier === ModelTier.PREMIUM ? '2 PREMIUM' : '1 CHEAP'} model (${classification.reason})`);

      // PHASE 0A: Load conversation context (new unified memory)
      const conversationContext = await this.loadConversationContext(goal);

      // PHASE 0B: RECALL - Retrieve historical facts from memory
      const enrichedContext = await this.enrichContextWithFacts(goal, context);
      
      // Add other agent summaries to context
      enrichedContext.otherAgentInsights = otherSummaries;

      // Merge conversation context with enriched context
      enrichedContext.conversationHistory = conversationContext.recentMessages;
      enrichedContext.semanticKnowledge = conversationContext.semanticKnowledge;

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

      // PHASE 4: SAVE CONVERSATION - Save interaction to conversation memory
      await this.saveConversationInteraction(goal, result);

      // PHASE 5: STORE SUMMARY & CACHE RESULT for smart routing
      const projectId2 = context.projectData?.id || context.projectId;
      if (projectId2) {
        const summary = this.extractSummary(result);
        router.storeSummary(this.config.agentName, projectId2, summary);
        router.cacheResult(
          this.config.agentType,
          context.projectData || context,
          this.config.agentName,
          JSON.stringify(result),
          classification.tier
        );
      }

      console.log(`[${this.config.agentName}] Deep Agent run completed (${classification.tier} tier)`);
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
    const planSystemPrompt = `Reflect on the entire plan execution for ${this.config.agentName}. Summarize learnings and future improvements.`;
    const planUserPrompt = `Plan goal: ${plan.goal}
Steps: ${JSON.stringify(plan.steps, null, 2)}
Result: ${JSON.stringify(result, null, 2)}
Reflection history: ${JSON.stringify(this.reflectionHistory, null, 2)}

Provide a summary of what was learned and how to improve next time.`;

    const response = await this.router.callModel(ModelTier.CHEAP, planSystemPrompt, planUserPrompt);
    return response.content;
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

  /**
   * Extract a compact summary from analysis result for agent collaboration
   */
  protected extractSummary(result: any): string {
    if (result.summary) return result.summary;
    if (result.finalReflection) return String(result.finalReflection).slice(0, 200);
    if (result.analysis) return String(result.analysis).slice(0, 200);
    if (result.content) return String(result.content).slice(0, 200);
    return `${this.config.agentName} analysis completed`;
  }

  /**
   * Scheduled scan entry point for AgentScheduler
   * This method is called periodically by the scheduler
   * DATA SOURCE: Palantir Foundry Ontology (NOT PostgreSQL)
   */
  async runScheduledScan(): Promise<void> {
    console.log(`[${this.config.agentName}] Starting scheduled scan (Palantir source)...`);

    try {
      // Get all projects from Palantir Ontology
      const projects = await this.getProjects();

      if (projects.length === 0) {
        console.log(`[${this.config.agentName}] No projects found in Palantir Ontology`);
        return;
      }

      console.log(`[${this.config.agentName}] Found ${projects.length} projects in Palantir to analyze`);

      // Analyze each project
      for (const project of projects) {
        try {
          const projectId = project.projectId || project.id;
          const projectName = project.name || project.title || projectId;

          const goal = `Analyze project "${projectName}" (${projectId}) for ${this.config.agentType} concerns`;

          console.log(`[${this.config.agentName}] Analyzing project: ${projectName}`);

          // Call the main run method with Palantir project data
          await this.run(goal, {
            projectId,
            projectName,
            projectData: project, // Full Palantir object
            scheduledScan: true,
          });

          console.log(`[${this.config.agentName}] ✅ Completed analysis of ${projectName}`);
        } catch (error: any) {
          console.error(`[${this.config.agentName}] Error analyzing project:`, error.message);
        }
      }

      console.log(`[${this.config.agentName}] Scheduled scan complete (Palantir source)`);
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Scheduled scan failed:`, error.message);
      throw error;
    }
  }
}
