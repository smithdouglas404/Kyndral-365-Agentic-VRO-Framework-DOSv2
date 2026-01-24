/**
 * AGENT ORCHESTRATOR
 *
 * Central coordination system that:
 * - Loads agent configurations from database (enabled agents, MCP mappings, LLM strategies)
 * - Connects agents to their assigned MCP tools
 * - Routes agent requests to the appropriate LLM via EnhancedLLMRouter
 * - Executes trigger conditions from Knowledge Base
 * - Handles inter-agent communication
 *
 * This is the "activation code" that makes agents use their configured tools when enabled.
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import type { IStorage } from '../storage.js';
import { getEnhancedLLMRouter } from './EnhancedLLMRouter.js';
import { UniversalMCPConnector } from '../mcp/UniversalMCPConnector.js';
import { getEnhancedKnowledgeBaseRepository } from './EnhancedKnowledgeBaseRepository.js';
import { getNotificationService } from './NotificationService.js';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  mcpServers: string[];
  llmStrategy: {
    taskType: string;
    primary: string;
    fallback: string[];
  }[];
}

export interface AgentContext {
  userId: string;
  projectId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AgentRequest {
  agentId: string;
  taskType: string;
  prompt: string;
  context: AgentContext;
  tools?: string[]; // Optional specific tools to use
}

export interface AgentResponse {
  agentId: string;
  content: string;
  model: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  toolsUsed: string[];
  triggersExecuted?: number;
}

export interface MCPToolDefinition {
  mcpServerId: string;
  displayName: string;
  connector: UniversalMCPConnector;
  available: boolean;
}

// ============================================================================
// AGENT ORCHESTRATOR
// ============================================================================

export class AgentOrchestrator {
  private storage: IStorage;
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private mcpConnectors: Map<string, UniversalMCPConnector> = new Map();
  private initialized: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Initialize orchestrator - load all agent configs and MCP connectors
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[AgentOrchestrator] Initializing...');

    try {
      // Ensure tables exist
      await this.ensureTables();

      // Load agent configurations
      await this.loadAgentConfigs();

      // Initialize MCP connectors for all unique servers
      await this.initializeMCPConnectors();

      this.initialized = true;
      console.log(`[AgentOrchestrator] Initialized with ${this.agentConfigs.size} agents and ${this.mcpConnectors.size} MCP connectors`);
    } catch (error) {
      console.error('[AgentOrchestrator] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load agent configurations from database
   */
  private async loadAgentConfigs(): Promise<void> {
    // Get all enabled agents
    const agentsResult = await db.execute(sql`
      SELECT agent_id, agent_name, description, enabled
      FROM agent_setup_config
      WHERE enabled = true
    `);

    for (const row of agentsResult.rows as any[]) {
      const agentId = row.agent_id;

      // Get MCP mappings for this agent
      const mcpResult = await db.execute(sql`
        SELECT mcp_server_id
        FROM agent_mcp_mappings
        WHERE agent_id = ${agentId}
      `);

      const mcpServers = mcpResult.rows.map((r: any) => r.mcp_server_id);

      // Get LLM strategy for this agent
      const strategyResult = await db.execute(sql`
        SELECT task_type, primary_model, fallback_models
        FROM agent_llm_strategies
        WHERE agent_id = ${agentId}
      `);

      const llmStrategy = strategyResult.rows.map((r: any) => ({
        taskType: r.task_type,
        primary: r.primary_model,
        fallback: JSON.parse(r.fallback_models),
      }));

      this.agentConfigs.set(agentId, {
        id: agentId,
        name: row.agent_name,
        description: row.description,
        enabled: row.enabled,
        mcpServers,
        llmStrategy,
      });
    }
  }

  /**
   * Initialize MCP connectors for all unique servers
   */
  private async initializeMCPConnectors(): Promise<void> {
    const uniqueServers = new Set<string>();

    // Collect all unique MCP server IDs
    for (const config of this.agentConfigs.values()) {
      config.mcpServers.forEach((serverId) => uniqueServers.add(serverId));
    }

    // Initialize connectors
    for (const serverId of uniqueServers) {
      try {
        // Get integration config for this MCP server
        const integrationResult = await db.execute(sql`
          SELECT * FROM integrations WHERE name = ${serverId} AND status = 'active'
        `);

        if (integrationResult.rows.length === 0) {
          console.warn(`[AgentOrchestrator] No active integration found for MCP server: ${serverId}`);
          continue;
        }

        const integration = integrationResult.rows[0] as any;

        // Create connector
        const connector = new UniversalMCPConnector({
          presetId: serverId,
          baseUrl: integration.base_url,
          apiKey: integration.api_key,
        });

        this.mcpConnectors.set(serverId, connector);
        console.log(`[AgentOrchestrator] Initialized MCP connector: ${serverId}`);
      } catch (error) {
        console.error(`[AgentOrchestrator] Failed to initialize MCP connector ${serverId}:`, error);
      }
    }
  }

  /**
   * Execute agent request
   * This is the main entry point for agent interactions
   */
  async executeAgentRequest(request: AgentRequest): Promise<AgentResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[AgentOrchestrator] Executing request for agent: ${request.agentId}`);

    // Get agent config
    const agentConfig = this.agentConfigs.get(request.agentId);

    if (!agentConfig) {
      throw new Error(`Agent ${request.agentId} not found or not enabled`);
    }

    // Get available tools for this agent
    const availableTools = this.getAvailableToolsForAgent(request.agentId);

    console.log(`[AgentOrchestrator] Agent ${request.agentId} has ${availableTools.length} tools available`);

    // Build system prompt with tool descriptions
    const systemPrompt = this.buildSystemPrompt(agentConfig, availableTools);

    // Get LLM router
    const llmRouter = getEnhancedLLMRouter(this.storage);

    // Call LLM with context
    const startTime = Date.now();
    const result = await llmRouter.chat({
      agent: request.agentId,
      taskType: request.taskType,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.prompt },
      ],
    });

    const latency = Date.now() - startTime;

    // Check for trigger conditions in the request
    const triggers = await this.checkAndExecuteTriggers(request);

    // Log agent execution
    await this.logAgentExecution({
      agentId: request.agentId,
      userId: request.context.userId,
      taskType: request.taskType,
      prompt: request.prompt,
      response: result.content,
      model: result.model,
      tokensUsed: result.usage.total_tokens,
      cost: result.cost,
      latency,
      toolsUsed: availableTools.map((t) => t.mcpServerId),
    });

    return {
      agentId: request.agentId,
      content: result.content,
      model: result.model,
      tokensUsed: result.usage.total_tokens,
      cost: result.cost,
      latency,
      toolsUsed: availableTools.map((t) => t.mcpServerId),
      triggersExecuted: triggers.actionsExecuted,
    };
  }

  /**
   * Get available tools for an agent
   */
  private getAvailableToolsForAgent(agentId: string): MCPToolDefinition[] {
    const agentConfig = this.agentConfigs.get(agentId);
    if (!agentConfig) return [];

    const tools: MCPToolDefinition[] = [];

    for (const mcpServerId of agentConfig.mcpServers) {
      const connector = this.mcpConnectors.get(mcpServerId);

      if (connector) {
        tools.push({
          mcpServerId,
          displayName: mcpServerId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          connector,
          available: true,
        });
      } else {
        console.warn(`[AgentOrchestrator] MCP connector not found for: ${mcpServerId}`);
      }
    }

    return tools;
  }

  /**
   * Build system prompt with tool descriptions
   */
  private buildSystemPrompt(agentConfig: AgentConfig, tools: MCPToolDefinition[]): string {
    let prompt = `You are the ${agentConfig.name} agent. ${agentConfig.description}\n\n`;

    if (tools.length > 0) {
      prompt += `You have access to the following tools:\n`;
      for (const tool of tools) {
        prompt += `- ${tool.displayName}: Connected and ready\n`;
      }
      prompt += `\nWhen responding, you can reference data from these tools to provide accurate, up-to-date information.\n\n`;
    }

    prompt += `Your role is to assist with tasks specific to your domain. Provide clear, actionable responses.`;

    return prompt;
  }

  /**
   * Check and execute trigger conditions
   */
  private async checkAndExecuteTriggers(request: AgentRequest): Promise<{
    success: boolean;
    actionsExecuted: number;
    errors: string[];
  }> {
    try {
      // Extract potential trigger conditions from the request
      // This is a simple implementation - could be enhanced with NLP
      const conditions = this.extractTriggerConditions(request.prompt);

      if (conditions.length === 0) {
        return { success: true, actionsExecuted: 0, errors: [] };
      }

      const kb = getEnhancedKnowledgeBaseRepository(this.storage);
      let totalActionsExecuted = 0;
      const errors: string[] = [];

      for (const condition of conditions) {
        const result = await kb.executeTriggerActions(request.agentId, condition, {
          userId: request.context.userId,
          projectId: request.context.projectId,
          metadata: request.context.metadata,
        });

        totalActionsExecuted += result.actionsExecuted;
        errors.push(...result.errors);
      }

      return {
        success: errors.length === 0,
        actionsExecuted: totalActionsExecuted,
        errors,
      };
    } catch (error: any) {
      console.error('[AgentOrchestrator] Failed to execute triggers:', error);
      return { success: false, actionsExecuted: 0, errors: [error.message] };
    }
  }

  /**
   * Extract trigger conditions from prompt
   * Simple keyword-based extraction - could be enhanced with NLP
   */
  private extractTriggerConditions(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const conditions: string[] = [];

    // Common trigger conditions
    if (lowerPrompt.includes('compliance') || lowerPrompt.includes('violation')) {
      conditions.push('compliance_violation');
    }

    if (lowerPrompt.includes('high risk') || lowerPrompt.includes('critical risk')) {
      conditions.push('risk_high');
    }

    if (lowerPrompt.includes('budget') && lowerPrompt.includes('exceed')) {
      conditions.push('budget_exceeded');
    }

    if (lowerPrompt.includes('deadline') || lowerPrompt.includes('overdue')) {
      conditions.push('deadline_approaching');
    }

    if (lowerPrompt.includes('issue') || lowerPrompt.includes('problem')) {
      conditions.push('issue_created');
    }

    return conditions;
  }

  /**
   * Log agent execution to database
   */
  private async logAgentExecution(log: {
    agentId: string;
    userId: string;
    taskType: string;
    prompt: string;
    response: string;
    model: string;
    tokensUsed: number;
    cost: number;
    latency: number;
    toolsUsed: string[];
  }): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO agent_execution_logs (
          agent_id, user_id, task_type, prompt, response, model, tokens_used, cost, latency, tools_used, created_at
        )
        VALUES (
          ${log.agentId},
          ${log.userId},
          ${log.taskType},
          ${log.prompt},
          ${log.response},
          ${log.model},
          ${log.tokensUsed},
          ${log.cost},
          ${log.latency},
          ${JSON.stringify(log.toolsUsed)},
          NOW()
        )
      `);
    } catch (error) {
      console.error('[AgentOrchestrator] Failed to log execution:', error);
    }
  }

  /**
   * Get agent configuration
   */
  async getAgentConfig(agentId: string): Promise<AgentConfig | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.agentConfigs.get(agentId) || null;
  }

  /**
   * Get all enabled agents
   */
  async getEnabledAgents(): Promise<AgentConfig[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return Array.from(this.agentConfigs.values());
  }

  /**
   * Reload configurations (call after admin changes)
   */
  async reload(): Promise<void> {
    console.log('[AgentOrchestrator] Reloading configurations...');
    this.agentConfigs.clear();
    this.mcpConnectors.clear();
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Ensure tables exist
   */
  private async ensureTables(): Promise<void> {
    // Agent execution logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_execution_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        agent_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        model TEXT NOT NULL,
        tokens_used INTEGER NOT NULL,
        cost DECIMAL(10,6) NOT NULL,
        latency INTEGER NOT NULL,
        tools_used JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index for faster queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_agent_user ON agent_execution_logs(agent_id, user_id, created_at DESC)
    `);
  }
}

/**
 * Singleton instance
 */
let agentOrchestratorInstance: AgentOrchestrator | null = null;

export function getAgentOrchestrator(storage: IStorage): AgentOrchestrator {
  if (!agentOrchestratorInstance) {
    agentOrchestratorInstance = new AgentOrchestrator(storage);
  }
  return agentOrchestratorInstance;
}
