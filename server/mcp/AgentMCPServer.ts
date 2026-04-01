/**
 * AGENT MCP SERVER
 *
 * Exposes Deep Agents as MCP tools for integration with MCP clients.
 * Allows external systems to invoke agent capabilities via MCP protocol.
 *
 * This creates an MCP server that:
 * - Lists available agents as tools
 * - Executes agent tasks via tool calls
 * - Returns structured results
 */

import type { IStorage } from '../storage.js';
import { getA2ARegistry, initializeA2ARegistry } from '../a2a/A2ARegistry.js';
import { getA2ATaskExecutor } from '../a2a/A2ATaskExecutor.js';
import type { AgentCard } from '../a2a/types.js';

/**
 * MCP Tool Definition
 */
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Tool Call Result
 */
interface MCPToolResult {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: {
      uri: string;
      mimeType: string;
      text?: string;
    };
  }>;
  isError?: boolean;
}

/**
 * Agent MCP Server - Exposes agents as MCP tools
 */
export class AgentMCPServer {
  private storage: IStorage;
  private initialized: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Initialize the MCP server
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await initializeA2ARegistry();
    this.initialized = true;

    console.log('[AgentMCPServer] Initialized');
  }

  /**
   * Get server info for MCP
   */
  getServerInfo(): {
    name: string;
    version: string;
    capabilities: {
      tools?: {};
      resources?: {};
      prompts?: {};
    };
  } {
    return {
      name: 'nextera-agents',
      version: '1.0.0',
      capabilities: {
        tools: {},
      },
    };
  }

  /**
   * List available tools (agents)
   */
  async listTools(): Promise<{ tools: MCPTool[] }> {
    await this.initialize();

    const registry = getA2ARegistry();
    const { agents } = registry.listAgents({ status: 'active' });

    const tools: MCPTool[] = [];

    for (const agent of agents) {
      // Create main agent tool
      tools.push(this.createAgentTool(agent));

      // Create individual skill tools
      for (const skill of agent.skills) {
        tools.push(this.createSkillTool(agent, skill));
      }
    }

    return { tools };
  }

  /**
   * Create MCP tool from agent card
   */
  private createAgentTool(agent: AgentCard): MCPTool {
    return {
      name: `agent_${agent.id.replace(/-/g, '_')}`,
      description: `${agent.name}: ${agent.description}. Available skills: ${agent.skills
        .map((s) => s.name)
        .join(', ')}`,
      inputSchema: {
        type: 'object',
        properties: {
          goal: {
            type: 'string',
            description: 'The goal or task for the agent to accomplish',
          },
          projectId: {
            type: 'string',
            description: 'Optional project ID for context',
          },
          context: {
            type: 'object',
            description: 'Additional context for the agent',
          },
        },
        required: ['goal'],
      },
    };
  }

  /**
   * Create MCP tool from agent skill
   */
  private createSkillTool(
    agent: AgentCard,
    skill: { id: string; name: string; description: string; inputSchema?: any }
  ): MCPTool {
    const inputSchema = skill.inputSchema || {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: `Input for ${skill.name}`,
        },
      },
    };

    return {
      name: `${agent.id.replace(/-/g, '_')}_${skill.id.replace(/-/g, '_')}`,
      description: `${agent.name} - ${skill.name}: ${skill.description}`,
      inputSchema: {
        type: 'object',
        properties: inputSchema.properties || {},
        required: inputSchema.required,
      },
    };
  }

  /**
   * Call a tool
   */
  async callTool(
    name: string,
    args: Record<string, any>
  ): Promise<MCPToolResult> {
    await this.initialize();

    try {
      const registry = getA2ARegistry();
      const executor = getA2ATaskExecutor(this.storage);

      // Parse tool name to get agent and optional skill
      const parts = name.split('_');
      const agentPrefix = parts[0]; // 'agent' or agent id part

      let agentId: string;
      let skillId: string | undefined;

      if (agentPrefix === 'agent') {
        // Format: agent_pmo_agent -> pmo
        agentId = parts.slice(1).join('-');
      } else {
        // Format: pmo_agent_analyze_project_health -> agent: pmo-agent, skill: analyze-project-health
        // Find the agent by checking registered agents
        const { agents } = registry.listAgents();
        const matchingAgent = agents.find((a) =>
          name.startsWith(a.id.replace(/-/g, '_'))
        );

        if (matchingAgent) {
          agentId = matchingAgent.id;
          const agentPart = matchingAgent.id.replace(/-/g, '_');
          skillId = name.replace(`${agentPart}_`, '').replace(/_/g, '-');
        } else {
          // Fallback: assume first two parts are agent
          agentId = `${parts[0]}-${parts[1]}`;
          skillId = parts.slice(2).join('-');
        }
      }

      // Normalize agent ID
      const normalizedAgentId = agentId.includes('-agent') ? agentId : `${agentId}-agent`;

      // Check if agent exists
      const agent = registry.getAgent(agentId) || registry.getAgent(normalizedAgentId);
      if (!agent) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Agent not found: ${agentId}`,
            },
          ],
          isError: true,
        };
      }

      // Build goal from args
      let goal: string;
      if (args.goal) {
        goal = args.goal;
      } else if (skillId) {
        goal = `Execute skill "${skillId}" with input: ${JSON.stringify(args)}`;
      } else {
        goal = JSON.stringify(args);
      }

      // Create and execute task
      const { task } = await registry.createTask(agent.agentCard.id, {
        message: {
          role: 'user',
          parts: [{ type: 'text', text: goal }],
          timestamp: new Date().toISOString(),
        },
      });

      const completedTask = await executor.executeTaskSync(task.id);

      // Format result
      const lastAgentMessage = [...completedTask.messages]
        .reverse()
        .find((m) => m.role === 'agent');

      const resultText = lastAgentMessage?.parts
        .filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; text: string }).text)
        .join('\n') || 'Task completed without text response';

      const result: MCPToolResult = {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };

      // Add artifact as resource if present
      if (completedTask.artifacts.length > 0) {
        const artifact = completedTask.artifacts[0];
        result.content.push({
          type: 'resource',
          resource: {
            uri: `task://${task.id}/artifacts/${artifact.id}`,
            mimeType: artifact.mimeType,
            text: artifact.parts
              .filter((p) => p.type === 'text' || p.type === 'data')
              .map((p) => {
                if (p.type === 'text') return (p as any).text;
                if (p.type === 'data') {
                  return Buffer.from((p as any).data, 'base64').toString('utf-8');
                }
                return '';
              })
              .join('\n'),
          },
        });
      }

      // Mark error if task failed
      if (completedTask.status.state === 'failed') {
        result.isError = true;
      }

      return result;
    } catch (error: any) {
      console.error('[AgentMCPServer] Tool call failed:', error.message);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get MCP server manifest
   */
  getManifest(): {
    name: string;
    version: string;
    description: string;
    tools: string[];
  } {
    return {
      name: 'nextera-agents',
      version: '1.0.0',
      description: 'NextEra Energy ETO/VRO AI Agents exposed via MCP',
      tools: [
        'agent_pmo_agent',
        'agent_finops_agent',
        'agent_risk_agent',
        'agent_ocm_agent',
        'agent_tmo_agent',
        'agent_vro_agent',
        'agent_governance_agent',
        'agent_planning_agent',
      ],
    };
  }
}

// Singleton instance
let mcpServerInstance: AgentMCPServer | null = null;

export function getAgentMCPServer(storage: IStorage): AgentMCPServer {
  if (!mcpServerInstance) {
    mcpServerInstance = new AgentMCPServer(storage);
  }
  return mcpServerInstance;
}
