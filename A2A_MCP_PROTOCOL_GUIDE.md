# A2A & MCP Protocol Integration Guide

## Overview

The NextEra Energy ETO/VRO Platform now supports two critical communication protocols:

1. **A2A (Agent-to-Agent)**: Internal protocol for real-time agent coordination
2. **MCP (Model Context Protocol)**: External protocol for service integration (Jira, Azure DevOps, ServiceNow, etc.)

This enables **24x7 continuous coordination** with predictive and real-time insights across all agents and external systems.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    CONTINUOUS ORCHESTRATOR                      │
│  (24x7 Always-On Coordination - 15 second cycles)              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐         ┌─────────────────────┐      │
│  │   A2A Message Bus   │         │   MCP Protocol      │      │
│  │  (Internal Agents)  │         │  (External Services)│      │
│  └──────────┬──────────┘         └──────────┬──────────┘      │
│             │                               │                  │
│             ├───► FinOps Agent ◄────────────┤                  │
│             ├───► TMO Agent    ◄────────────┤                  │
│             ├───► VRO Agent    ◄────────────┤                  │
│             ├───► Risk Agent   ◄────────────┤                  │
│             ├───► Planning     ◄────────────┤                  │
│             ├───► Governance   ◄────────────┤                  │
│             ├───► OCM Agent    ◄────────────┤                  │
│             └───► Integrated   ◄────────────┘                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    [Jira API]    [Azure DevOps]    [ServiceNow]
    [Slack]       [Teams]           [Smartsheet]
```

---

## A2A (Agent-to-Agent) Protocol

### Purpose
Enable real-time coordination between agents without waiting for scheduled scans.

### Message Types

1. **scan**: Agent is scanning projects
2. **detection**: Agent detected an issue
3. **request**: Agent requesting input from another agent
4. **alert**: Agent broadcasting critical alert
5. **response**: Agent responding to a request
6. **action**: Agent taking autonomous action
7. **celebration**: Agent sharing success/milestone
8. **communication**: Agent sharing status update

### Example: Budget & Schedule Collaboration

```
FinOps Agent detects budget overrun (CPI < 0.85)
    ↓
FinOps sends A2A request to TMO Agent
    ↓
TMO Agent receives message via A2A bus
    ↓
TMO Agent analyzes schedule impact using LLM
    ↓
TMO sends A2A response back to FinOps
    ↓
FinOps synthesizes combined recommendation
    ↓
Creates collaborative intervention
```

### API Usage

**Send A2A Message:**
```bash
POST /api/orchestration/a2a/send
{
  "from": "finops",
  "to": "tmo",
  "type": "request",
  "content": "Budget overrun detected. Can schedule be adjusted?",
  "projectId": "proj-123",
  "severity": "high"
}
```

**Broadcast A2A Alert:**
```bash
POST /api/orchestration/a2a/broadcast
{
  "fromAgentId": "risk",
  "recipientIds": ["finops", "tmo", "governance"],
  "alert": {
    "message": "Critical risk identified requiring immediate attention",
    "projectId": "proj-123",
    "severity": "critical"
  }
}
```

**Get A2A Status:**
```bash
GET /api/orchestration/a2a/status
```

Response:
```json
{
  "success": true,
  "status": {
    "activeQueues": 8,
    "totalMessages": 12
  }
}
```

---

## MCP (Model Context Protocol)

### Purpose
Enable agents to interact with external services (Jira, Azure DevOps, ServiceNow, etc.) programmatically.

### Registered Services

| Service | Protocol | Capabilities |
|---------|----------|-------------|
| **Jira** | HTTP | query_issues, update_status, create_ticket, get_sprint_data |
| **Azure DevOps** | HTTP | query_workitems, update_board, get_pipeline_status, create_workitem |
| **ServiceNow** | HTTP | create_incident, update_change_request, query_cmdb, create_problem |
| **Slack** | WebSocket | send_notification, create_channel, post_message |
| **Teams** | HTTP | send_notification, post_adaptive_card |
| **Smartsheet** | HTTP | update_sheet, get_rows, create_row, update_cell |

### Example: Agent Updates Jira Ticket

```
TMO Agent detects schedule delay
    ↓
TMO calls MCP service: jira.update_status
    ↓
MCP Handler routes to Jira API
    ↓
Jira ticket updated with new status
    ↓
Activity logged to database
    ↓
LangSmith trace recorded
```

### API Usage

**Call MCP Service:**
```bash
POST /api/orchestration/mcp/call
{
  "agentId": "tmo",
  "serviceName": "jira",
  "action": "update_status",
  "params": {
    "issueKey": "PROJ-123",
    "status": "In Progress",
    "comment": "Schedule recovery plan initiated by TMO Agent"
  }
}
```

**Get Available MCP Services:**
```bash
GET /api/orchestration/mcp/services
```

Response:
```json
{
  "success": true,
  "services": [
    {
      "name": "jira",
      "protocol": "http",
      "endpoint": "https://jira.nexteraenergy.com",
      "capabilities": ["query_issues", "update_status", "create_ticket", "get_sprint_data"]
    },
    {
      "name": "azure-devops",
      "protocol": "http",
      "endpoint": "https://dev.azure.com/nexteraenergy",
      "capabilities": ["query_workitems", "update_board", "get_pipeline_status", "create_workitem"]
    }
  ],
  "count": 6
}
```

---

## Dual-Mode Operation

### Mode 1: Continuous 24x7 Coordination (NEW)
- **Interval**: Every 15 seconds
- **Purpose**: Real-time agent collaboration, A2A messaging, MCP service calls
- **Behavior**:
  - Round-robin agent activation
  - Automatic collaboration triggers
  - Cross-domain issue detection
  - Immediate response to critical issues

### Mode 2: Scheduled Deep Scans (EXISTING)
- **Intervals**:
  - FinOps: Every 30 minutes
  - TMO: Every 20 minutes
  - Risk: Every 60 minutes
  - VRO: Every 60 minutes
  - Governance: Every 2 hours
  - Planning: Every 30 minutes
  - OCM: Every 45 minutes
  - Integrated Mgmt: Every 45 minutes
- **Purpose**: Comprehensive domain-specific analysis
- **Behavior**: Full tool execution, detailed LLM reasoning, thorough project analysis

### Why Both Modes?

**Continuous Mode** provides:
- Real-time alerts
- Instant cross-agent collaboration
- Predictive insights
- Immediate response to critical issues

**Scheduled Mode** provides:
- Deep domain analysis
- Comprehensive tool execution
- Historical pattern recognition
- Strategic recommendations

**Together**: Complete coverage from real-time tactical response to strategic planning.

---

## Orchestration Cycle (15 seconds)

Each cycle consists of:

1. **Phase 1**: Select active agent (round-robin)
2. **Phase 2**: Process pending A2A messages
3. **Phase 3**: Agent performs autonomous scan (3 random projects)
4. **Phase 4**: Detect issues using domain heuristics
5. **Phase 5**: Determine collaboration needs
6. **Phase 6**: Send A2A requests to other agents (if needed)
7. **Phase 7**: Full autonomy agents may self-approve actions
8. **Phase 8**: Log all activity to database

**Performance**: Each cycle completes in <2 seconds, allowing agents to respond quickly.

---

## Agent Collaboration Patterns

### Pattern 1: Cross-Domain Issues

```
Budget overrun (CPI < 0.85) detected by FinOps
    ↓
FinOps sends A2A request to:
  - TMO: Can schedule be adjusted?
  - VRO: What's the ROI impact?
  - Planning: Are there resource alternatives?
    ↓
All 3 agents analyze and respond via A2A
    ↓
FinOps synthesizes combined recommendation
    ↓
Creates multi-agent collaborative intervention
```

### Pattern 2: Critical Severity

```
Any agent detects critical issue (severity = "critical")
    ↓
Automatic collaboration triggered
    ↓
Relevant agents selected based on domain:
  - Financial issue → FinOps + TMO + VRO + Planning
  - Risk issue → Risk + Governance + Planning
    ↓
All agents contribute via A2A messages
    ↓
Orchestrator synthesizes unified recommendation
```

### Pattern 3: Value Realization Check

```
VRO Agent detects value leakage (ROI variance > 20%)
    ↓
VRO broadcasts A2A alert to all agents
    ↓
Each agent checks their domain:
  - FinOps: Budget alignment
  - TMO: Schedule impact
  - Risk: Risk exposure
  - Planning: Resource constraints
    ↓
Multi-agent collaboration creates comprehensive recovery plan
```

---

## Configuration

### Environment Variables

```bash
# LangSmith Observability
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=nextera-eto
LANGCHAIN_TRACING_V2=true

# MCP Service Endpoints (optional - defaults provided)
JIRA_URL=https://jira.nexteraenergy.com
AZURE_DEVOPS_URL=https://dev.azure.com/nexteraenergy
SERVICENOW_URL=https://nexteraenergy.service-now.com
SLACK_WEBHOOK=https://hooks.slack.com/services/...
TEAMS_WEBHOOK=https://outlook.office.com/webhook/...
SMARTSHEET_URL=https://api.smartsheet.com/2.0
```

### Tuning Parameters

**Continuous Orchestration Interval:**
```typescript
// In server/index.ts or AgentScheduler.startAll()
await orchestrator.start(15000); // 15 seconds (default)
// Adjust between 10-30 seconds based on load
```

**Collaboration Thresholds:**
```typescript
// In ContinuousOrchestrator.shouldCollaborate()
// Critical issues always trigger collaboration
// High severity triggers if 2+ agents have findings
// Adjust logic based on organizational needs
```

---

## Monitoring & Observability

### LangSmith Traces

All agent actions are traced in LangSmith:
- A2A message sends and receives
- MCP service calls
- Agent reasoning and tool execution
- Collaboration synthesis

**View Traces:**
1. Go to https://smith.langchain.com/
2. Select project: `nextera-eto` (or your configured project)
3. Filter by agent name or session ID
4. View full execution chain

### Database Logs

All orchestration activity is logged to `agent_activity_log` table:

```sql
SELECT * FROM agent_activity_log
WHERE event_type = 'agent_to_agent'
ORDER BY created_at DESC
LIMIT 100;
```

Includes:
- A2A messages between agents
- MCP service calls
- Collaboration requests and responses
- Synthesis results

### API Status Endpoint

```bash
GET /api/orchestration/status
```

Returns:
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "cycleCount": 487,
    "activeScans": 3,
    "pendingRequests": 2,
    "recentFindings": 5,
    "a2a": {
      "activeQueues": 8,
      "totalMessages": 0
    },
    "mcp": {
      "servicesRegistered": 6,
      "services": ["jira", "azure-devops", "servicenow", "slack", "teams", "smartsheet"]
    }
  },
  "protocols": {
    "a2a": "Agent-to-Agent messaging for internal coordination",
    "mcp": "Model Context Protocol for external service integration"
  }
}
```

---

## Advanced Use Cases

### Use Case 1: Proactive Risk Mitigation

```
Continuous orchestrator detects pattern:
  - Budget trending over (FinOps)
  - Schedule slipping (TMO)
  - Quality dropping (Integrated Mgmt)

All 3 agents receive A2A alerts
    ↓
Planning Agent coordinates via A2A:
  - Requests resource reallocation options
  - Queries external Jira via MCP for sprint data
  - Synthesizes recovery plan
    ↓
VRO Agent validates ROI impact via A2A
    ↓
Governance Agent approves plan via A2A
    ↓
Collaborative intervention created
    ↓
Full autonomy agents execute approved actions
    ↓
Updates sent to Slack/Teams via MCP
```

### Use Case 2: Value Realization Tracking

```
VRO Agent runs value scan every 60 minutes
    ↓
Detects project with value leakage
    ↓
Broadcasts A2A alert to all agents
    ↓
Parallel analysis via A2A:
  - FinOps: Budget variance root cause
  - TMO: Schedule impact analysis
  - Risk: Risk mitigation effectiveness
  - Planning: Resource utilization
    ↓
Orchestrator synthesizes findings
    ↓
Creates Jira ticket via MCP
    ↓
Notifies stakeholders via Teams MCP call
    ↓
Tracks response in database
```

### Use Case 3: Multi-System Coordination

```
TMO Agent detects critical path delay
    ↓
Sends A2A request to Planning Agent
    ↓
Planning calls MCP services in parallel:
  - Jira: Get sprint data
  - Azure DevOps: Get pipeline status
  - Smartsheet: Get resource calendar
    ↓
Planning synthesizes results
    ↓
Sends A2A response to TMO with options
    ↓
TMO creates recovery plan
    ↓
Updates all systems via MCP:
  - Jira: Update sprint dates
  - Slack: Notify team
  - ServiceNow: Create change request
    ↓
All changes logged to database
```

---

## Best Practices

1. **Monitor A2A Message Volume**
   - Check `/api/orchestration/a2a/status` regularly
   - If queue grows >50 messages, increase orchestration interval
   - Consider adding more agent instances

2. **Rate Limit MCP Calls**
   - Jira/Azure have API rate limits
   - Cache MCP responses where appropriate
   - Use batch operations when possible

3. **Use Appropriate Autonomy Levels**
   - Full autonomy: FinOps, TMO, OCM, Integrated Mgmt (low-risk actions)
   - Supervised: Risk, Governance, Planning, VRO (high-impact decisions)
   - Adjust based on organizational risk tolerance

4. **Leverage LangSmith**
   - Review agent traces weekly
   - Identify inefficient collaboration patterns
   - Optimize prompts for better reasoning

5. **Test Collaboration Patterns**
   - Use `/api/orchestration/a2a/send` to trigger specific collaborations
   - Validate agent responses in LangSmith
   - Ensure synthesis produces actionable recommendations

---

## Troubleshooting

### Problem: No A2A messages being sent

**Diagnosis:**
```bash
GET /api/orchestration/a2a/status
```

If `totalMessages: 0` for extended time:
- Check orchestrator is running: `GET /api/orchestration/status`
- Verify agents are detecting issues (check LangSmith traces)
- Lower collaboration thresholds in `ContinuousOrchestrator.shouldCollaborate()`

### Problem: MCP service calls failing

**Diagnosis:**
```bash
GET /api/orchestration/mcp/services
```

If service missing or endpoint wrong:
- Check environment variables (JIRA_URL, etc.)
- Verify network connectivity to external services
- Check MCP service authentication/credentials
- Review service API documentation

### Problem: Orchestration cycles taking >10 seconds

**Diagnosis:**
- Check LangSmith traces for slow agent execution
- Reduce number of projects scanned per cycle (currently 3)
- Increase orchestration interval from 15s to 30s
- Optimize agent prompts to reduce LLM tokens

### Problem: Too many collaborative interventions

**Diagnosis:**
- Review collaboration triggers in `shouldCollaborate()`
- Increase severity threshold for collaboration
- Reduce scan frequency for less critical agents
- Add deduplication logic for similar findings

---

## Future Enhancements

1. **Agent Memory**: Persistent context across orchestration cycles
2. **Learning from Feedback**: Agents learn which collaborations are most effective
3. **Dynamic Scheduling**: Adjust orchestration interval based on system load
4. **Advanced MCP**: Bidirectional webhooks from external services
5. **Agent Reputation**: Track agent accuracy and adjust confidence scores
6. **Predictive Collaboration**: ML models predict when collaboration needed

---

## Summary

The A2A and MCP protocol integration transforms the NextEra Energy platform from a periodic monitoring system into a **24x7 continuous coordination platform** where:

- **Agents communicate in real-time** via A2A protocol
- **External services are integrated** via MCP protocol
- **Collaboration happens automatically** when cross-domain issues arise
- **Predictive insights are delivered** without waiting for scheduled scans
- **All activity is observable** via LangSmith and database logs

This architecture provides the **speed of real-time monitoring** with the **depth of strategic analysis**, ensuring no critical issue goes undetected.

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Platform**: NextEra Energy ETO/VRO Platform
