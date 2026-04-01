/**
 * MASTRA + A2A + MCP INTEGRATION
 *
 * Unified integration layer that combines:
 * - Mastra: Agent framework for building AI agents
 * - A2A: Agent-to-Agent protocol for interoperability
 * - MCP: Model Context Protocol for tool integration
 *
 * Usage:
 * 1. Initialize at server startup: await initializeAgentIntegration(storage)
 * 2. Register routes: registerAgentIntegrationRoutes(app, storage)
 * 3. Access agents via A2A or MCP endpoints
 *
 * A2A Endpoints:
 * - GET  /.well-known/a2a/agent-card  - Agent discovery
 * - GET  /api/a2a/agents              - List agents
 * - POST /api/a2a/agents/:id/tasks    - Execute agent task
 * - GET  /api/a2a/discover?skill=xxx  - Find agents by skill
 *
 * MCP Endpoints:
 * - GET  /api/mcp/tools               - List available tools
 * - POST /api/mcp/tools/:name         - Call a tool
 * - POST /api/mcp/rpc                 - JSON-RPC interface
 */

import type { Express } from 'express';
import type { IStorage } from '../storage.js';
import { initializeMastra, getMastra, listAgentTypes, isMastraInitialized } from '../mastra/index.js';
import { initializeA2ARegistry, getA2ARegistry } from '../a2a/A2ARegistry.js';
import { getAgentMCPServer } from '../mcp/AgentMCPServer.js';
import a2aProtocolRouter, { wellKnownAgentCard, setA2AStorage } from '../routes/a2a-protocol.js';
import mcpAgentsRouter, { setMCPStorage } from '../routes/mcp-agents.js';

/**
 * Initialize the agent integration layer
 */
export async function initializeAgentIntegration(storage: IStorage): Promise<void> {
  console.log('[Integration] Initializing Mastra + A2A + MCP integration...');

  // 1. Initialize Mastra with storage
  await initializeMastra(storage);
  const mastra = getMastra();
  console.log(`[Integration] Mastra initialized with ${listAgentTypes().length} agent types`);

  // 2. Initialize A2A Registry
  await initializeA2ARegistry();
  const registry = getA2ARegistry();
  const stats = registry.getStats();
  console.log(`[Integration] A2A Registry initialized with ${stats.totalAgents} agents`);

  // 3. Initialize MCP Server
  const mcpServer = getAgentMCPServer(storage);
  await mcpServer.initialize();
  const { tools } = await mcpServer.listTools();
  console.log(`[Integration] MCP Server initialized with ${tools.length} tools`);

  console.log('[Integration] ✅ Agent integration initialized successfully');
}

/**
 * Register all agent integration routes
 */
export function registerAgentIntegrationRoutes(app: Express, storage: IStorage): void {
  // Set storage references
  setA2AStorage(storage);
  setMCPStorage(storage);

  // Register well-known A2A endpoint
  app.get('/.well-known/a2a/agent-card', wellKnownAgentCard);

  // Register A2A protocol routes
  app.use('/api/a2a', a2aProtocolRouter);

  // Register MCP agent routes
  app.use('/api/mcp', mcpAgentsRouter);

  console.log('[Integration] Registered A2A and MCP routes');
  console.log('  - GET  /.well-known/a2a/agent-card');
  console.log('  - GET  /api/a2a/agents');
  console.log('  - POST /api/a2a/agents/:id/tasks');
  console.log('  - GET  /api/mcp/tools');
  console.log('  - POST /api/mcp/tools/:name');
}

/**
 * Get integration status and statistics
 */
export async function getIntegrationStatus(): Promise<{
  mastra: { initialized: boolean; agentTypes: string[] };
  a2a: { agents: number; tasks: { total: number; byState: Record<string, number> } };
  mcp: { tools: number };
}> {
  const registry = getA2ARegistry();
  const stats = registry.getStats();

  return {
    mastra: {
      initialized: true,
      agentTypes: listAgentTypes(),
    },
    a2a: {
      agents: stats.totalAgents,
      tasks: {
        total: stats.totalTasks,
        byState: stats.tasksByState,
      },
    },
    mcp: {
      tools: 0, // Will be populated after initialization
    },
  };
}

/**
 * Example usage showing how to interact with agents
 */
export const USAGE_EXAMPLES = {
  // Discover agents via A2A
  discoverAgents: `
    GET /.well-known/a2a/agent-card

    Response:
    {
      "id": "nextera-eto-vro-platform",
      "name": "NextEra Energy ETO/VRO Platform",
      "agents": [
        {
          "id": "pmo-agent",
          "name": "PMO Agent",
          "skills": [...]
        },
        ...
      ]
    }
  `,

  // List agents with filtering
  listAgents: `
    GET /api/a2a/agents?status=active&tag=project-management

    Response:
    {
      "success": true,
      "agents": [...],
      "total": 8
    }
  `,

  // Execute a task via A2A
  executeTask: `
    POST /api/a2a/agents/pmo/tasks?sync=true
    Content-Type: application/json

    {
      "message": {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "Analyze project health for Grid Modernization"
          }
        ]
      }
    }

    Response:
    {
      "success": true,
      "task": {
        "id": "task-123",
        "status": { "state": "completed" },
        "messages": [
          { "role": "user", "parts": [...] },
          { "role": "agent", "parts": [...] }
        ]
      }
    }
  `,

  // Discover agents by skill
  discoverBySkill: `
    GET /api/a2a/discover?skill=risk-assessment

    Response:
    {
      "success": true,
      "agents": [
        {
          "id": "risk-agent",
          "name": "Risk Agent",
          "skills": [
            {
              "id": "risk-assessment",
              "name": "Risk Assessment",
              "description": "..."
            }
          ]
        }
      ]
    }
  `,

  // List MCP tools
  listMcpTools: `
    GET /api/mcp/tools

    Response:
    {
      "success": true,
      "tools": [
        {
          "name": "agent_pmo_agent",
          "description": "PMO Agent: Portfolio and program management...",
          "inputSchema": {
            "type": "object",
            "properties": {
              "goal": { "type": "string" },
              "projectId": { "type": "string" }
            }
          }
        },
        ...
      ]
    }
  `,

  // Call MCP tool
  callMcpTool: `
    POST /api/mcp/tools/agent_finops_agent
    Content-Type: application/json

    {
      "goal": "Analyze budget variance for Q2 2024",
      "projectId": "proj-123"
    }

    Response:
    {
      "success": true,
      "result": {
        "content": [
          {
            "type": "text",
            "text": "Budget analysis completed..."
          }
        ]
      }
    }
  `,

  // MCP JSON-RPC
  mcpJsonRpc: `
    POST /api/mcp/rpc
    Content-Type: application/json

    {
      "jsonrpc": "2.0",
      "method": "tools/call",
      "params": {
        "name": "agent_risk_agent",
        "arguments": {
          "goal": "Identify top risks for portfolio"
        }
      },
      "id": 1
    }

    Response:
    {
      "jsonrpc": "2.0",
      "result": { ... },
      "id": 1
    }
  `,
};
