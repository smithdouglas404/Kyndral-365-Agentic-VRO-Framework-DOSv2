# Langflow Custom Components Upload Guide

## Components Ready for Upload

The following 5 custom components have been created and are ready to be uploaded to Langflow:

### 1. Threshold Evaluator
**File:** `langflow-components/threshold_evaluator.py`
**Purpose:** Evaluates if an attribute crosses a threshold and determines if a signal should be fired
**Inputs:** attribute_key, current_value, operator, threshold, signal_type, severity
**Output:** fire_signal (boolean), signal details

### 2. WebSocket Broadcaster
**File:** `langflow-components/websocket_broadcaster.py`
**Purpose:** Broadcasts signals to dashboards via WebSocket for real-time updates
**Inputs:** server_url, channel, event, payload
**Output:** broadcasted (boolean), status
**API Endpoint:** `POST /api/websocket/broadcast`

### 3. Database Persister
**File:** `langflow-components/db_persister.py`
**Purpose:** Asynchronously persists agent attributes to database
**Inputs:** server_url, agent_id, entity, attribute_key, value
**Output:** persisted (boolean), status
**API Endpoint:** `POST /api/agent-facts`

### 4. Attribute Mapper
**File:** `langflow-components/attribute_mapper.py`
**Purpose:** Maps MCP data (from Jira, SAP, Azure DevOps) to agent-specific attributes
**Inputs:** agent_type, mcp_data, entity_id
**Output:** Mapped attributes array with keys and values
**Supports:** PMO, FinOps, Planning, Risk agents

### 5. A2A Message Sender
**File:** `langflow-components/a2a_message_sender.py`
**Purpose:** Sends agent-to-agent messages for collaboration
**Inputs:** server_url, from_agent, to_agent, message_type, content, priority
**Output:** sent (boolean), status
**API Endpoint:** `POST /api/a2a/messages`

## API Endpoints (Already Registered)

The following API endpoints are now available in the server to support these components:

```typescript
POST /api/mem0/facts              - Write to Mem0 cache (5-min TTL)
POST /api/websocket/broadcast     - Broadcast to dashboards
POST /api/a2a/messages            - Send A2A messages
POST /api/agent-facts             - Persist to database
```

All endpoints are registered in `server/routes/langflow-integration.ts`.

## Upload Methods

### Method 1: Manual Upload via Langflow UI (Recommended)

1. Go to Langflow UI:
   ```
   https://aws-us-east-2.langflow.datastax.com/lf/ed39ba15-ded9-4b54-9389-4f58e97b6a57
   ```

2. Navigate to "Components" or "Custom Components" section

3. Click "Upload Component" or "Add Custom Component"

4. For each component file:
   - Click "Browse" or "Upload File"
   - Select the `.py` file from `langflow-components/` directory
   - Click "Upload"
   - Verify component appears in component palette

5. Components should now be available in the flow editor under "Custom" category

### Method 2: Via Langflow CLI (If Available)

If you have CLI access to the Langflow server:

```bash
# Copy components to Langflow custom components directory
cp langflow-components/threshold_evaluator.py /path/to/langflow/custom_components/
cp langflow-components/websocket_broadcaster.py /path/to/langflow/custom_components/
cp langflow-components/db_persister.py /path/to/langflow/custom_components/
cp langflow-components/attribute_mapper.py /path/to/langflow/custom_components/
cp langflow-components/a2a_message_sender.py /path/to/langflow/custom_components/

# Restart Langflow to load new components
langflow run
```

### Method 3: Via API (Requires JWT Token)

**Note:** DataStax Langflow requires JWT authentication for component uploads, which is not available via API key alone. This method would require:

1. Obtaining a JWT token via browser login
2. Extracting the token from browser cookies/local storage
3. Using the token in API requests

This is not recommended for automated workflows.

## Component Architecture

These 5 new components work together with the existing Mem0 components to create the complete MCP → Langflow → Mem0 → Agent → Dashboard flow:

```
┌─────────────────────────────────────────────────────┐
│ EXTERNAL MCP SERVERS                                 │
│ Jira, SAP, Azure DevOps, ServiceNow                 │
└──────────────────┬──────────────────────────────────┘
                   │ (MCP Tools component)
                   ↓
┌─────────────────────────────────────────────────────┐
│ LANGFLOW FLOW                                        │
│                                                       │
│  [MCP Tools] → Fetch data from external system      │
│       ↓                                               │
│  [Attribute Mapper] → Map to agent attributes       │
│       ↓                                               │
│  [Mem0 Writer] → Cache in Mem0 (5-min TTL)         │
│       ↓                                               │
│  [Threshold Evaluator] → Check if threshold crossed │
│       ↓                                               │
│  [If threshold crossed]:                             │
│     ├─ [WebSocket Broadcaster] → Signal dashboards  │
│     ├─ [A2A Message Sender] → Notify other agents   │
│     └─ [DB Persister] → Async persist to database   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## Example Flow: PMO Agent with MCP Integration

After uploading components, create this flow in Langflow:

```
1. MCP Tools (Jira)
   - Connect to: Jira MCP Server
   - Action: Get Issue
   - Issue Key: {from trigger}

2. Attribute Mapper
   - Agent Type: "pmo"
   - MCP Data: {output from step 1}
   - Entity ID: {project_id}

3. Loop through attributes (for each attribute in mapper output):

   4. Mem0 Writer
      - Entity: {entity_id}
      - Attribute: {attribute.key}
      - Value: {attribute.value}
      - Source Agent: "pmo"
      - TTL: 300

   5. Threshold Evaluator
      - Attribute Key: {attribute.key}
      - Current Value: {attribute.value}
      - Operator: "gt"
      - Threshold: {from config}
      - Signal Type: "threshold_breach"
      - Severity: "warning"

   6. If fire_signal == true:

      7. WebSocket Broadcaster
         - Server URL: "http://localhost:5000"
         - Channel: "pmo:signals"
         - Event: "attribute_updated"
         - Payload: {attribute data}

      8. A2A Message Sender
         - From Agent: "pmo"
         - To Agent: "finops" (if budget-related)
         - Message Type: "alert"
         - Content: {narrative}
         - Priority: {severity}

      9. DB Persister
         - Agent ID: "pmo"
         - Entity: {entity_id}
         - Attribute Key: {attribute.key}
         - Value: {attribute.value}
```

## Integration with Agent Objects

Once components are uploaded and flows are created, agent objects can query attributes via Langflow MCP server:

```typescript
// Agent as MCP client
const pmoAgent = new PMOAgentObject('project_123');

// This calls Langflow MCP server, which:
// 1. Checks Mem0 cache (5ms if cached)
// 2. If not cached, triggers MCP flow to fetch from Jira
// 3. Returns value with narrative
const wipAge = await pmoAgent.getAttribute('wip_age');
```

## Testing Components

After upload, test each component individually in Langflow:

### Test Threshold Evaluator
```json
{
  "attribute_key": "wip_age",
  "current_value": 15,
  "operator": "gt",
  "threshold": 10,
  "signal_type": "wip_age_threshold",
  "severity": "warning"
}
```

Expected: `fire_signal: true`

### Test WebSocket Broadcaster
```json
{
  "server_url": "http://localhost:5000",
  "channel": "pmo:test",
  "event": "test_signal",
  "payload": {"test": "data"}
}
```

Expected: `broadcasted: true`, check server logs for broadcast

### Test DB Persister
```json
{
  "server_url": "http://localhost:5000",
  "agent_id": "pmo",
  "entity": "project_test",
  "attribute_key": "test_attribute",
  "value": "test_value"
}
```

Expected: `persisted: true`, check server logs

### Test Attribute Mapper
```json
{
  "agent_type": "pmo",
  "entity_id": "project_123",
  "mcp_data": {
    "issue": {
      "key": "PROJ-123",
      "fields": {
        "customfield_10016": 8,
        "status": {"name": "In Progress"},
        "created": "2026-01-15T10:00:00Z"
      }
    }
  }
}
```

Expected: Array of mapped attributes (feature_uuid, estimated_story_points, flow_status, wip_age)

### Test A2A Message Sender
```json
{
  "server_url": "http://localhost:5000",
  "from_agent": "pmo",
  "to_agent": "finops",
  "message_type": "alert",
  "content": "Test collaboration message",
  "priority": "medium"
}
```

Expected: `sent: true`, check server logs

## Next Steps

1. ✅ Components created in `langflow-components/` directory
2. ✅ API endpoints created and registered in `server/routes.ts`
3. ⏳ Upload components via Langflow UI (Method 1 above)
4. ⏳ Create MCP integration flows using uploaded components
5. ⏳ Test end-to-end flow
6. ⏳ Build agent objects as MCP clients

## Files

- Component files: `langflow-components/*.py`
- API endpoints: `server/routes/langflow-integration.ts`
- Upload script: `server/scripts/upload-langflow-components.ts` (requires JWT)
