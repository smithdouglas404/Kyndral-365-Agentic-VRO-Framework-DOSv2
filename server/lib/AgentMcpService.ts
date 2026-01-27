/**
 * AGENT-MCP SERVICE
 *
 * Enables agents to query their connected MCPs for:
 * 1. Knowledge (data from Jira, SAP, Azure DevOps)
 * 2. Governance (Responsible AI, QA, policy enforcement)
 *
 * Flow:
 * Agent action → Governance MCPs validate → Knowledge MCPs provide data → Result
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import {
  mcpDefinitions,
  agentMcpConnections,
  mcpExecutionLog,
  type McpDefinition,
  type AgentMcpConnection
} from '../../shared/schema.js';
import { getMem0Service } from './Mem0Service.js';

export interface McpQueryRequest {
  agentId: string;
  operation: string; // 'query', 'validate', 'enforce'
  input: any;
  context?: any;
}

export interface McpKnowledgeResult {
  success: boolean;
  data: any;
  source: string; // MCP name
  executionTime: number;
  cached: boolean;
}

export interface McpGovernanceResult {
  decision: 'allow' | 'block' | 'warn';
  reason: string;
  source: string; // MCP name
  recommendations?: string[];
  executionTime: number;
}

export interface McpQueryResult {
  success: boolean;
  knowledgeResults: McpKnowledgeResult[];
  governanceResults: McpGovernanceResult[];
  finalDecision: 'allow' | 'block' | 'warn';
  blockedBy?: string[];
  warnings?: string[];
}

export class AgentMcpService {
  private static instance: AgentMcpService;
  private mem0Service = getMem0Service();

  private constructor() {}

  public static getInstance(): AgentMcpService {
    if (!AgentMcpService.instance) {
      AgentMcpService.instance = new AgentMcpService();
    }
    return AgentMcpService.instance;
  }

  /**
   * Get all MCPs connected to an agent
   */
  async getAgentMcps(agentId: string): Promise<{
    knowledge: any[];
    governance: any[];
  }> {
    const result = await db.execute(sql`
      SELECT
        amc.id as connection_id,
        amc.agent_id,
        amc.mcp_id,
        amc.enabled,
        amc.priority,
        amc.config as connection_config,
        md.name as mcp_name,
        md.display_name as mcp_display_name,
        md.type as mcp_type,
        md.category as mcp_category,
        md.server_url as mcp_server_url,
        md.config as mcp_config,
        md.capabilities as mcp_capabilities
      FROM ${agentMcpConnections} amc
      JOIN ${mcpDefinitions} md ON amc.mcp_id = md.id
      WHERE amc.agent_id = ${agentId}
        AND amc.enabled = true
        AND md.enabled = true
      ORDER BY amc.priority ASC
    `);

    const knowledge = result.rows.filter((row: any) => row.mcp_type === 'knowledge');
    const governance = result.rows.filter((row: any) => row.mcp_type === 'governance');

    return { knowledge, governance };
  }

  /**
   * Execute agent query through connected MCPs
   * 1. Governance MCPs validate first
   * 2. If allowed, Knowledge MCPs provide data
   */
  async query(request: McpQueryRequest): Promise<McpQueryResult> {
    const startTime = Date.now();

    console.log(`[AgentMCP] ${request.agentId} → ${request.operation}`);

    try {
      // Get agent's connected MCPs
      const { knowledge, governance } = await this.getAgentMcps(request.agentId);

      // Step 1: Execute GOVERNANCE MCPs (validation)
      const governanceResults: McpGovernanceResult[] = [];
      let blocked = false;
      const blockedBy: string[] = [];
      const warnings: string[] = [];

      for (const govMcp of governance) {
        const govResult = await this.executeGovernanceMcp(
          govMcp,
          request.agentId,
          request.operation,
          request.input,
          request.context
        );

        governanceResults.push(govResult);

        if (govResult.decision === 'block') {
          blocked = true;
          blockedBy.push(govMcp.mcp_display_name);
        } else if (govResult.decision === 'warn') {
          warnings.push(`${govMcp.mcp_display_name}: ${govResult.reason}`);
        }
      }

      // If blocked by governance, don't query knowledge MCPs
      if (blocked) {
        console.log(`[AgentMCP] ❌ Blocked by: ${blockedBy.join(', ')}`);

        return {
          success: false,
          knowledgeResults: [],
          governanceResults,
          finalDecision: 'block',
          blockedBy
        };
      }

      // Step 2: Execute KNOWLEDGE MCPs (data retrieval)
      const knowledgeResults: McpKnowledgeResult[] = [];

      for (const knowMcp of knowledge) {
        const knowResult = await this.executeKnowledgeMcp(
          knowMcp,
          request.agentId,
          request.operation,
          request.input,
          request.context
        );

        knowledgeResults.push(knowResult);
      }

      const totalTime = Date.now() - startTime;

      console.log(`[AgentMCP] ✅ ${request.agentId} completed in ${totalTime}ms`);
      if (warnings.length > 0) {
        console.log(`[AgentMCP] ⚠️  Warnings: ${warnings.length}`);
      }

      return {
        success: true,
        knowledgeResults,
        governanceResults,
        finalDecision: warnings.length > 0 ? 'warn' : 'allow',
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error: any) {
      console.error('[AgentMCP] Query error:', error.message);
      throw error;
    }
  }

  /**
   * Execute governance MCP (validation/policy enforcement)
   */
  private async executeGovernanceMcp(
    mcp: any,
    agentId: string,
    operation: string,
    input: any,
    context: any
  ): Promise<McpGovernanceResult> {
    const startTime = Date.now();

    try {
      console.log(`[AgentMCP] Governance: ${mcp.mcp_display_name}`);

      // Simulate governance check (in production, call actual MCP server)
      let decision: 'allow' | 'block' | 'warn' = 'allow';
      let reason = 'Passed governance checks';
      const recommendations: string[] = [];

      // Example governance checks based on MCP category
      if (mcp.mcp_category === 'responsible_ai') {
        // Check for bias, safety, ethical concerns
        const biasCheck = await this.checkResponsibleAI(input, context);
        if (!biasCheck.passed) {
          decision = biasCheck.severity === 'high' ? 'block' : 'warn';
          reason = biasCheck.reason;
          recommendations.push(...biasCheck.recommendations);
        }
      } else if (mcp.mcp_category === 'qa') {
        // Check for quality standards
        const qaCheck = await this.checkQualityStandards(input, context);
        if (!qaCheck.passed) {
          decision = 'warn';
          reason = qaCheck.reason;
          recommendations.push(...qaCheck.recommendations);
        }
      } else if (mcp.mcp_category === 'policy') {
        // Check for policy compliance
        const policyCheck = await this.checkPolicyCompliance(input, context);
        if (!policyCheck.passed) {
          decision = policyCheck.severity === 'high' ? 'block' : 'warn';
          reason = policyCheck.reason;
        }
      }

      const executionTime = Date.now() - startTime;

      // Log to database
      await this.logMcpExecution({
        agentId,
        mcpId: mcp.mcp_id,
        mcpType: 'governance',
        operation: 'validate',
        input: JSON.stringify(input),
        output: JSON.stringify({ decision, reason, recommendations }),
        success: true,
        executionTime,
        governanceDecision: decision,
        governanceReason: reason
      });

      // Write to Mem0 for audit trail
      await this.mem0Service.writeFact({
        entity: `agent_${agentId}`,
        attribute: `governance_check_${mcp.mcp_name}`,
        value: {
          decision,
          reason,
          recommendations,
          timestamp: new Date().toISOString()
        },
        sourceAgent: agentId,
        confidence: 1.0
      });

      return {
        decision,
        reason,
        source: mcp.mcp_display_name,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      await this.logMcpExecution({
        agentId,
        mcpId: mcp.mcp_id,
        mcpType: 'governance',
        operation: 'validate',
        input: JSON.stringify(input),
        output: null,
        success: false,
        errorMessage: error.message,
        executionTime
      });

      // On error, block for safety
      return {
        decision: 'block',
        reason: `Governance check failed: ${error.message}`,
        source: mcp.mcp_display_name,
        executionTime
      };
    }
  }

  /**
   * Execute knowledge MCP (data retrieval)
   */
  private async executeKnowledgeMcp(
    mcp: any,
    agentId: string,
    operation: string,
    input: any,
    context: any
  ): Promise<McpKnowledgeResult> {
    const startTime = Date.now();

    try {
      console.log(`[AgentMCP] Knowledge: ${mcp.mcp_display_name}`);

      // Check Mem0 cache first
      const cacheKey = `mcp_cache_${mcp.mcp_name}_${JSON.stringify(input)}`;
      const cached = await this.checkMem0Cache(agentId, cacheKey);

      if (cached) {
        console.log(`[AgentMCP] ✅ Cache hit: ${mcp.mcp_display_name}`);
        return {
          success: true,
          data: cached.data,
          source: mcp.mcp_display_name,
          executionTime: Date.now() - startTime,
          cached: true
        };
      }

      // Simulate MCP query (in production, call actual MCP server)
      const data = await this.queryMcpServer(mcp, operation, input, context);

      const executionTime = Date.now() - startTime;

      // Log to database
      await this.logMcpExecution({
        agentId,
        mcpId: mcp.mcp_id,
        mcpType: 'knowledge',
        operation: 'query',
        input: JSON.stringify(input),
        output: JSON.stringify(data),
        success: true,
        executionTime
      });

      // Cache in Mem0
      await this.mem0Service.writeFact({
        entity: `agent_${agentId}`,
        attribute: cacheKey,
        value: {
          data,
          timestamp: new Date().toISOString(),
          ttl: 300 // 5 minutes
        },
        sourceAgent: mcp.mcp_name,
        confidence: 1.0
      });

      // Update connection usage stats
      await db.execute(sql`
        UPDATE ${agentMcpConnections}
        SET
          last_used = NOW(),
          usage_count = usage_count + 1
        WHERE agent_id = ${agentId} AND mcp_id = ${mcp.mcp_id}
      `);

      return {
        success: true,
        data,
        source: mcp.mcp_display_name,
        executionTime,
        cached: false
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      await this.logMcpExecution({
        agentId,
        mcpId: mcp.mcp_id,
        mcpType: 'knowledge',
        operation: 'query',
        input: JSON.stringify(input),
        output: null,
        success: false,
        errorMessage: error.message,
        executionTime
      });

      return {
        success: false,
        data: null,
        source: mcp.mcp_display_name,
        executionTime,
        cached: false
      };
    }
  }

  /**
   * Check Responsible AI compliance
   */
  private async checkResponsibleAI(input: any, context: any): Promise<any> {
    // TODO: Implement actual Responsible AI checks
    // For now, return mock validation
    return {
      passed: true,
      severity: 'low',
      reason: 'Responsible AI checks passed',
      recommendations: []
    };
  }

  /**
   * Check quality standards
   */
  private async checkQualityStandards(input: any, context: any): Promise<any> {
    // TODO: Implement actual QA checks
    return {
      passed: true,
      reason: 'Quality standards met',
      recommendations: []
    };
  }

  /**
   * Check policy compliance
   */
  private async checkPolicyCompliance(input: any, context: any): Promise<any> {
    // TODO: Implement actual policy checks
    return {
      passed: true,
      severity: 'low',
      reason: 'Policy compliant'
    };
  }

  /**
   * Query MCP server
   */
  private async queryMcpServer(mcp: any, operation: string, input: any, context: any): Promise<any> {
    // TODO: Implement actual MCP server communication
    // For now, return mock data based on MCP category
    if (mcp.mcp_category === 'ppm') {
      return {
        source: 'jira',
        issues: [
          { key: 'PROJ-123', status: 'In Progress', priority: 'High' },
          { key: 'PROJ-124', status: 'To Do', priority: 'Medium' }
        ]
      };
    } else if (mcp.mcp_category === 'erp') {
      return {
        source: 'sap',
        budgetData: {
          allocated: 1000000,
          spent: 750000,
          remaining: 250000
        }
      };
    }

    return { data: 'Mock MCP response' };
  }

  /**
   * Check Mem0 cache
   */
  private async checkMem0Cache(agentId: string, cacheKey: string): Promise<any | null> {
    try {
      const facts = await this.mem0Service.readFacts({
        entity: `agent_${agentId}`,
        attributes: [cacheKey]
      });

      if (facts.length > 0) {
        const fact = facts[0];
        const value = fact.value as any;

        // Check TTL
        const age = Date.now() - new Date(value.timestamp).getTime();
        if (value.ttl && age > value.ttl * 1000) {
          return null; // Cache expired
        }

        return value;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Log MCP execution
   */
  private async logMcpExecution(log: any): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO ${mcpExecutionLog} (
          agent_id, mcp_id, mcp_type, operation,
          input, output, success, error_message,
          execution_time, governance_decision, governance_reason
        )
        VALUES (
          ${log.agentId}, ${log.mcpId}, ${log.mcpType}, ${log.operation},
          ${log.input}, ${log.output}, ${log.success}, ${log.errorMessage || null},
          ${log.executionTime}, ${log.governanceDecision || null}, ${log.governanceReason || null}
        )
      `);
    } catch (error: any) {
      console.error('[AgentMCP] Log execution error:', error.message);
    }
  }
}

// Singleton instance
export function getAgentMcpService(): AgentMcpService {
  return AgentMcpService.getInstance();
}
