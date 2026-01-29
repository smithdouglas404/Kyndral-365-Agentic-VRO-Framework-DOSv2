# Task List: Complete Agent-as-Object + Langflow MCP + Mem0 Architecture

**Status**: Implementation Plan
**Created**: 2026-01-29
**Prerequisites**: Langflow hosted on DataStax (✅ DONE), 8 agent flows created (✅ DONE)

---

## Executive Summary

### What's Already Done ✅
- ✅ Langflow instance hosted on DataStax (v1.7.1)
- ✅ Langflow exposed as **MCP Server** (can be called via MCP protocol)
- ✅ 8 agent flows auto-generated and working
- ✅ All 8 agents wired to call Langflow flows
- ✅ 5 custom Langflow components built
- ✅ Server endpoints for external integrations (Jira, ServiceNow, Slack)

### What We Need to Build ❌
- ❌ Configure external MCP servers in Langflow (Jira MCP, SAP MCP, etc.)
- ❌ Add MCP Tools nodes to flows (connect to external MCPs)
- ❌ Add Mem0 streaming layer to flows (early warning)
- ❌ Build agent objects as MCP clients (315 callable attributes)
- ❌ Wire dashboards to query agent attributes (not DB directly)
- ❌ Implement WebSocket invalidation on Mem0 signals

---

## Phase 1: Configure External MCP Servers in Langflow

**Goal**: Connect Langflow to external MCP servers (Jira, SAP, Azure DevOps, etc.)

### Task 1.1: Access Langflow MCP Configuration
- [ ] Open Langflow UI: https://astra.datastax.com
- [ ] Navigate to: Settings → MCP Servers
- [ ] Verify Langflow v1.7+ supports MCP client mode

### Task 1.2: Add Jira MCP Server
- [ ] In Langflow MCP Servers settings, add new MCP server:
  ```json
  {
    "mcpServers": {
      "jira-mcp": {
        "command": "uvx",
        "args": ["mcp-server-jira"],
        "env": {
          "JIRA_URL": "https://yourcompany.atlassian.net",
          "JIRA_EMAIL": "your-email@company.com",
          "JIRA_API_TOKEN": "your-jira-api-token"
        }
      }
    }
  }
  ```
- [ ] Test connection in Langflow UI

### Task 1.3: Add Azure DevOps MCP Server
- [ ] Configure Azure DevOps MCP:
  ```json
  {
    "mcpServers": {
      "azure-devops-mcp": {
        "command": "uvx",
        "args": ["mcp-server-azure-devops"],
        "env": {
          "AZURE_DEVOPS_ORG": "https://dev.azure.com/yourorg",
          "AZURE_DEVOPS_PAT": "your-personal-access-token"
        }
      }
    }
  }
  ```
- [ ] Test connection

### Task 1.4: Add SAP MCP Server (for FinOps)
- [ ] Configure SAP MCP:
  ```json
  {
    "mcpServers": {
      "sap-mcp": {
        "command": "uvx",
        "args": ["mcp-server-sap"],
        "env": {
          "SAP_HOST": "https://your-sap-instance.com",
          "SAP_CLIENT": "100",
          "SAP_USERNAME": "your-username",
          "SAP_PASSWORD": "your-password"
        }
      }
    }
  }
  ```
- [ ] Test connection

### Task 1.5: Add Slack MCP Server
- [ ] Configure Slack MCP:
  ```json
  {
    "mcpServers": {
      "slack-mcp": {
        "command": "uvx",
        "args": ["mcp-server-slack"],
        "env": {
          "SLACK_BOT_TOKEN": "xoxb-your-bot-token",
          "SLACK_APP_TOKEN": "xapp-your-app-token"
        }
      }
    }
  }
  ```
- [ ] Test connection

**Deliverable**: All external MCP servers configured in Langflow UI

---

## Phase 2: Update Langflow Flows to Use MCP Tools

**Goal**: Replace API Request nodes with MCP Tools nodes

### Task 2.1: Update PMO Agent Flow
- [ ] Open flow: `pmo-agent-sync` (ID: `27bc79cd-2302-4356-a039-3238de8218b8`)
- [ ] Replace API Request node with **MCP Tools** component
- [ ] Connect to: Jira MCP + Azure DevOps MCP
- [ ] Configure MCP Tools to query:
  - Jira issues for wip_age calculation
  - Azure DevOps work items for flow_status
- [ ] Test flow execution in Playground

### Task 2.2: Update FinOps Agent Flow
- [ ] Open flow: `finops-budget-alert` (ID: `70d569d8-3e9c-4684-9227-ee4743d4be09`)
- [ ] Replace API nodes with MCP Tools
- [ ] Connect to: SAP MCP (financial data)
- [ ] Query budget and actuals from SAP
- [ ] Test flow

### Task 2.3: Update Remaining 6 Agent Flows
- [ ] Update TMO flow with scheduling MCPs
- [ ] Update Risk flow with risk data MCPs
- [ ] Update VRO flow with CRM MCPs (Salesforce)
- [ ] Update OCM flow with communication MCPs (Slack, Teams)
- [ ] Update Governance flow with compliance MCPs
- [ ] Update Planning flow with dependency MCPs

**Deliverable**: All 8 flows using native MCP Tools nodes instead of API requests

---

## Phase 3: Add Mem0 Streaming Layer to Flows

**Goal**: Implement MCP → Mem0 → DB flow with early warning signals

### Task 3.1: Upload Custom Components to Langflow
- [ ] Upload `langflow-components/mem0_writer.py` to Langflow
- [ ] Upload `langflow-components/mem0_reader.py` to Langflow
- [ ] Verify components appear in Langflow component library

### Task 3.2: Build ThresholdEvaluator Component
- [ ] Create `langflow-components/threshold_evaluator.py`:
  ```python
  class ThresholdEvaluatorComponent(Component):
      display_name = "Threshold Evaluator"
      description = "Checks if attribute crosses threshold and fires signal"

      inputs = [
          StrInput(name="attribute", display_name="Attribute Key"),
          StrInput(name="value", display_name="Current Value"),
          StrInput(name="operator", display_name="Operator"),
          StrInput(name="threshold", display_name="Threshold Value"),
          StrInput(name="signal_type", display_name="Signal Type"),
      ]

      def evaluate(self) -> dict:
          # Check if threshold crossed
          # Return signal if yes
  ```
- [ ] Upload to Langflow

### Task 3.3: Build WebSocketBroadcaster Component
- [ ] Create `langflow-components/websocket_broadcaster.py`:
  ```python
  class WebSocketBroadcasterComponent(Component):
      display_name = "WebSocket Broadcaster"
      description = "Broadcasts signal to dashboards via WebSocket"

      inputs = [
          StrInput(name="channel", display_name="Channel"),
          StrInput(name="event", display_name="Event Type"),
          StrInput(name="payload", display_name="Event Payload (JSON)"),
      ]

      def broadcast(self) -> dict:
          # POST to /api/websocket/broadcast
  ```
- [ ] Upload to Langflow

### Task 3.4: Build DBPersister Component
- [ ] Create `langflow-components/db_persister.py`:
  ```python
  class DBPersisterComponent(Component):
      display_name = "Database Persister"
      description = "Asynchronously persists attributes to database"

      inputs = [
          StrInput(name="agent_id", display_name="Agent ID"),
          StrInput(name="entity", display_name="Entity ID"),
          StrInput(name="attribute", display_name="Attribute Key"),
          StrInput(name="value", display_name="Attribute Value"),
      ]

      def persist(self) -> dict:
          # POST to /api/agent-facts (async)
  ```
- [ ] Upload to Langflow

### Task 3.5: Build AttributeMapper Component
- [ ] Create `langflow-components/attribute_mapper.py`:
  ```python
  class AttributeMapperComponent(Component):
      display_name = "Attribute Mapper"
      description = "Maps MCP data to agent attributes"

      inputs = [
          StrInput(name="agent_type", display_name="Agent Type"),
          StrInput(name="mcp_data", display_name="MCP Data (JSON)"),
      ]

      def map_attributes(self) -> dict:
          # Parse MCP data
          # Map to agent attributes
          # Return list of attributes
  ```
- [ ] Upload to Langflow

### Task 3.6: Redesign PMO Flow with Mem0 Layer
- [ ] Open PMO flow in Langflow UI
- [ ] Rebuild flow structure:
  ```
  [MCP Tools] → [AttributeMapper] → [Mem0Writer] → [ThresholdEvaluator]
                                                           ↓
                                              [IF threshold crossed]
                                                           ↓
                                              [WebSocketBroadcaster]
                                                           ↓
                                              [A2AMessageSender]
                                                           ↓
                                              [DBPersister]
  ```
- [ ] Configure Mem0Writer with 5-minute TTL
- [ ] Configure thresholds in ThresholdEvaluator
- [ ] Test flow end-to-end

### Task 3.7: Apply Pattern to All 8 Flows
- [ ] Redesign FinOps flow with Mem0 layer
- [ ] Redesign TMO flow with Mem0 layer
- [ ] Redesign Risk flow with Mem0 layer
- [ ] Redesign VRO flow with Mem0 layer
- [ ] Redesign OCM flow with Mem0 layer
- [ ] Redesign Governance flow with Mem0 layer
- [ ] Redesign Planning flow with Mem0 layer

**Deliverable**: All flows follow pattern: MCP → AttributeMapper → Mem0 → Threshold → Signal → DB

---

## Phase 4: Create API Endpoints for Langflow Components

**Goal**: Build server endpoints that Langflow components call

### Task 4.1: Mem0 Fact Writer Endpoint
- [ ] Create `POST /api/mem0/facts` in `server/routes/langflow-integration.ts`:
  ```typescript
  app.post('/api/mem0/facts', async (req, res) => {
    const { entity, attribute, value, source_agent, ttl } = req.body;

    await redis.setex(
      `mem0:${entity}:${attribute}`,
      ttl,
      JSON.stringify({ value, source_agent, timestamp: Date.now() })
    );

    res.json({ success: true, cached: true, ttl });
  });
  ```

### Task 4.2: WebSocket Broadcast Endpoint
- [ ] Create `POST /api/websocket/broadcast`:
  ```typescript
  app.post('/api/websocket/broadcast', async (req, res) => {
    const { channel, event, payload } = req.body;

    io.to(channel).emit(event, payload);

    res.json({ broadcasted: true });
  });
  ```

### Task 4.3: Agent Facts Persister Endpoint
- [ ] Create `POST /api/agent-facts`:
  ```typescript
  app.post('/api/agent-facts', async (req, res) => {
    const { agent_id, entity, attribute_key, value } = req.body;

    await db('agent_facts').insert({
      agent_id,
      entity,
      attribute_key,
      value: JSON.stringify(value),
      created_at: new Date()
    });

    res.json({ persisted: true });
  });
  ```

### Task 4.4: A2A Message Sender Endpoint
- [ ] Create `POST /api/a2a/messages`:
  ```typescript
  app.post('/api/a2a/messages', async (req, res) => {
    const { from, to, type, content } = req.body;

    await db('a2a_messages').insert({ from_agent: from, to_agent: to, message_type: type, content });

    io.to(`agent:${to}`).emit('a2a:message', { from, type, content });

    res.json({ sent: true });
  });
  ```

### Task 4.5: Register Routes
- [ ] Add to `server/routes.ts`:
  ```typescript
  import { registerLangflowIntegrationRoutes } from './routes/langflow-integration';
  registerLangflowIntegrationRoutes(app);
  ```

**Deliverable**: 4 new API endpoints for Langflow components

---

## Phase 5: Build Agent Objects as MCP Clients

**Goal**: Agents query Langflow MCP servers for attributes

### Task 5.1: Install MCP SDK
- [ ] Add to `package.json`:
  ```json
  {
    "dependencies": {
      "@modelcontextprotocol/sdk": "^1.0.0"
    }
  }
  ```
- [ ] Run `npm install`

### Task 5.2: Create PMOAgentObject
- [ ] Create `server/lib/agents/PMOAgentObject.ts`:
  ```typescript
  import { Client } from '@modelcontextprotocol/sdk/client/index.js';
  import { StreamableHttpTransport } from '@modelcontextprotocol/sdk/client/transport.js';

  export class PMOAgentObject {
    private mcpClient: Client;
    private langflowMcpUrl: string;

    constructor(entityId: string) {
      this.entity_id = entityId;
      this.langflowMcpUrl = `${process.env.LANGFLOW_API_URL}/mcp/project/${process.env.LANGFLOW_PROJECT_ID}/streamable`;

      this.initializeMCPClient();
    }

    private async initializeMCPClient() {
      this.mcpClient = new Client({ name: 'pmo-agent', version: '1.0.0' });

      const transport = new StreamableHttpTransport({
        url: this.langflowMcpUrl,
        headers: { 'x-api-key': process.env.LANGFLOW_API_KEY }
      });

      await this.mcpClient.connect(transport);
    }

    async getAttribute(key: string): Promise<any> {
      const response = await this.mcpClient.callTool({
        name: 'pmo-agent-sync',
        arguments: {
          agent_type: 'pmo',
          attribute: key,
          entity_id: this.entity_id
        }
      });

      return JSON.parse(response.content[0].text).value;
    }

    // 38 callable attributes
    async get wip_age(): Promise<number> {
      return this.getAttribute('wip_age');
    }

    async get flow_status(): Promise<string> {
      return this.getAttribute('flow_status');
    }

    // ... 36 more attributes
  }
  ```

### Task 5.3: Create Remaining Agent Objects
- [ ] Create FinOpsAgentObject (40 attributes)
- [ ] Create VROAgentObject (37 attributes)
- [ ] Create PlanningAgentObject (30 attributes)
- [ ] Create OCMAgentObject (38 attributes)
- [ ] Create RiskAgentObject (39 attributes)
- [ ] Create GovernanceAgentObject (32 attributes)
- [ ] Create TMOAgentObject (38 attributes)
- [ ] Create CompanyAgentObject (23 attributes)

### Task 5.4: Create AgentObjectFactory
- [ ] Create `server/lib/AgentObjectFactory.ts`:
  ```typescript
  export function getAgentObject(agentType: AgentType, entityId?: string): AgentObject {
    switch (agentType) {
      case 'pmo': return new PMOAgentObject(entityId);
      case 'finops': return new FinOpsAgentObject(entityId);
      // ... other agents
    }
  }
  ```

**Deliverable**: 9 agent object classes with 315 callable attributes

---

## Phase 6: Update Agent Attributes API

**Goal**: API routes query agent objects (which call Langflow MCP)

### Task 6.1: Update GET /api/agents/:agentType/attributes
- [ ] Modify `server/routes/agent-attributes.ts`:
  ```typescript
  app.get('/api/agents/:agentType/attributes', async (req, res) => {
    const { agentType } = req.params;

    // Get agent object (uses Langflow MCP client)
    const agent = getAgentObject(agentType);

    // Get attribute definitions
    const definitions = getAgentAttributeDefinitions(agentType);

    // Fetch values via Langflow MCP (which checks Mem0 first)
    const attributes = await Promise.all(
      definitions.map(async (def) => {
        const value = await agent.getAttribute(def.key);
        return {
          key: def.key,
          value,
          unit: def.unit,
          availability: value !== null ? 'available' : 'missing',
          source: 'langflow_mcp'
        };
      })
    );

    res.json({ agent_type: agentType, attributes });
  });
  ```

**Deliverable**: Dashboards query agent attributes → Langflow MCP → Mem0 → DB

---

## Phase 7: Configure Langflow Flows as MCP Servers

**Goal**: Expose Langflow flows as MCP tools

### Task 7.1: Enable MCP Server in Langflow Project
- [ ] In Langflow UI, go to Project Settings
- [ ] Enable "Expose as MCP Server"
- [ ] Verify MCP endpoint: `${LANGFLOW_API_URL}/mcp/project/${PROJECT_ID}/streamable`

### Task 7.2: Configure Each Flow as MCP Tool
For each of the 8 flows:
- [ ] Open flow in Langflow editor
- [ ] Go to flow settings
- [ ] Enable "Expose as MCP tool"
- [ ] Set tool name (e.g., `pmo-agent-sync`)
- [ ] Set tool description (e.g., "Get PMO agent attributes")
- [ ] Set input schema:
  ```json
  {
    "type": "object",
    "properties": {
      "agent_type": { "type": "string" },
      "attribute": { "type": "string" },
      "entity_id": { "type": "string" }
    },
    "required": ["agent_type", "attribute"]
  }
  ```

### Task 7.3: Test MCP Server Connection
- [ ] Install MCP Inspector: `npx @modelcontextprotocol/inspector`
- [ ] Connect to Langflow MCP server
- [ ] View registered tools (should see 8 agent flows)
- [ ] Test invoking `pmo-agent-sync` tool
- [ ] Verify it returns attribute value from Mem0/DB

**Deliverable**: All 8 Langflow flows exposed as MCP tools

---

## Phase 8: WebSocket Invalidation on Signals

**Goal**: Dashboards update in real-time when signals fire

### Task 8.1: Update WebSocketContext
- [ ] Modify `client/src/contexts/WebSocketContext.tsx`:
  ```typescript
  socket.on('agent:signal', (signal: AgentSignal) => {
    console.log('🔔 Agent signal received:', signal);

    // Invalidate affected queries
    queryClient.invalidateQueries({
      queryKey: ['agent-attributes', signal.agent_id]
    });

    // Show toast if critical
    if (signal.severity === 'critical') {
      toast.error(signal.message, {
        action: {
          label: signal.recommended_action,
          onClick: () => handleSignalAction(signal)
        }
      });
    }
  });
  ```

### Task 8.2: Test End-to-End Signal Flow
- [ ] Trigger condition in external MCP (e.g., create Jira issue with >30 day WIP age)
- [ ] MCP webhook → Langflow flow → AttributeMapper → Mem0Writer → ThresholdEvaluator
- [ ] ThresholdEvaluator detects wip_age > 30
- [ ] WebSocketBroadcaster fires signal
- [ ] Dashboard receives signal and invalidates query
- [ ] Dashboard shows updated attribute with warning badge

**Deliverable**: Real-time dashboard updates on Mem0 signals

---

## Phase 9: Testing & Validation

### Task 9.1: Test PMO Flow End-to-End
- [ ] Create test Jira issue with specific characteristics
- [ ] Trigger Jira webhook → Langflow PMO flow
- [ ] Verify: MCP → AttributeMapper → Mem0Writer → ThresholdCheck → WebSocket → Dashboard
- [ ] Check Mem0 cache contains attribute
- [ ] Check DB has persisted record
- [ ] Check dashboard shows live attribute with status badge

### Task 9.2: Test All 8 Agent Flows
- [ ] Test FinOps flow with SAP data
- [ ] Test TMO flow with schedule data
- [ ] Test Risk flow with risk data
- [ ] Test VRO flow with value data
- [ ] Test OCM flow with sentiment data
- [ ] Test Governance flow with compliance data
- [ ] Test Planning flow with dependency data

### Task 9.3: Load Testing
- [ ] Simulate 100 concurrent MCP events
- [ ] Verify Mem0 caching reduces DB load
- [ ] Verify WebSocket broadcasts don't overwhelm clients
- [ ] Verify dashboard queries remain <100ms

**Deliverable**: All flows tested and validated

---

## Phase 10: Documentation & Training

### Task 10.1: Update Documentation
- [ ] Document new architecture in README
- [ ] Create flow diagrams showing MCP → Mem0 → Agent → Dashboard
- [ ] Document how to add new agent attributes
- [ ] Document how to configure new MCPs in Langflow

### Task 10.2: Create Visual Diagrams
- [ ] Create architecture diagram showing all components
- [ ] Create data flow diagram
- [ ] Create sequence diagram for attribute query
- [ ] Create deployment diagram

### Task 10.3: Training Materials
- [ ] Create video: "How to configure MCPs in Langflow"
- [ ] Create video: "How to add new agent attributes"
- [ ] Create guide: "Testing flows in Langflow playground"

**Deliverable**: Complete documentation suite

---

## Success Criteria

### ✅ Architecture Complete When:
1. External MCPs configured in Langflow (Jira, SAP, Azure DevOps, etc.)
2. All 8 flows use MCP Tools nodes (not API requests)
3. All flows write to Mem0 before DB
4. All flows fire signals when thresholds crossed
5. All 9 agent objects implemented with 315 callable attributes
6. Dashboards query agent attributes (not DB directly)
7. WebSocket invalidation works on Mem0 signals
8. Zero-lag dashboard updates (<100ms via Mem0 cache)
9. Early warning system operational (signals fire before DB write)
10. Visual pre-integration in Langflow UI works

### ✅ User Experience Complete When:
1. Non-developers can configure MCPs in Langflow UI
2. Non-developers can adjust thresholds in Langflow UI
3. Dashboards always show live data
4. Dashboards show attribute status badges (available, admin_required, mcp_required, missing)
5. Critical signals trigger toast notifications
6. A2A messages result in visible agent collaboration
7. Audit trail shows full data lineage (MCP → Mem0 → DB)

---

## Time Estimates (Rough)

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Configure MCPs | 2-3 hours |
| Phase 2 | Update flows | 4-6 hours |
| Phase 3 | Add Mem0 layer | 6-8 hours |
| Phase 4 | API endpoints | 2-3 hours |
| Phase 5 | Agent objects | 8-10 hours |
| Phase 6 | API updates | 2-3 hours |
| Phase 7 | MCP servers | 2-3 hours |
| Phase 8 | WebSocket | 2-3 hours |
| Phase 9 | Testing | 4-6 hours |
| Phase 10 | Documentation | 3-4 hours |
| **Total** | **10 phases** | **35-49 hours** |

**Note**: This is a comprehensive implementation. Can be done incrementally (PMO flow first, then others).

---

## Priority Order (If Doing Incrementally)

### Week 1: PMO Flow Proof of Concept
1. Phase 1: Task 1.2 (Jira MCP only)
2. Phase 2: Task 2.1 (PMO flow only)
3. Phase 3: Tasks 3.1-3.6 (PMO flow with Mem0)
4. Phase 4: All tasks (API endpoints)
5. Phase 5: Task 5.2 (PMOAgentObject only)
6. Phase 6: Task 6.1 (API update)
7. Phase 8: Task 8.1-8.2 (WebSocket)
8. Phase 9: Task 9.1 (PMO testing)

### Week 2: Expand to All Agents
9. Phase 1: Tasks 1.3-1.5 (Other MCPs)
10. Phase 2: Task 2.3 (Remaining flows)
11. Phase 3: Task 3.7 (Apply to all flows)
12. Phase 5: Task 5.3-5.4 (All agent objects)
13. Phase 7: All tasks (MCP servers)
14. Phase 9: Task 9.2-9.3 (Full testing)
15. Phase 10: All tasks (Documentation)

**Result**: Revolutionary architecture operational! 🚀
