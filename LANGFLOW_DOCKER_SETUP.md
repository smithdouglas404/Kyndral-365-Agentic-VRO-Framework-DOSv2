# Langflow Docker Setup - Local Installation

**RECOMMENDATION**: Use Docker Langflow for full control and easy migration.

---

## Why Docker Langflow?

✅ **Full Control** - No DataStax limitations on API
✅ **Free** - No cloud costs
✅ **Easy Migration** - Move to any provider later
✅ **Simpler Auth** - No org ID complications
✅ **Fast Testing** - Reset/recreate flows easily

---

## Installation Steps

### 1. Start Langflow Container

```bash
docker-compose -f docker-compose.langflow.yml up -d
```

This will:
- Download Langflow image
- Start on port 7860
- Create local data volume
- Enable health checks

### 2. Wait for Startup (30 seconds)

```bash
docker logs -f langflow
# Wait for: "INFO:     Uvicorn running on http://0.0.0.0:7860"
```

### 3. Access Langflow UI

Open: http://localhost:7860

**First time setup:**
1. Create admin account
2. Copy API key from Settings > API Keys
3. Add to `.env`:

```bash
LANGFLOW_API_URL=http://localhost:7860/api/v1
LANGFLOW_API_KEY=<your-api-key>
# No LANGFLOW_ORG_ID needed for local Docker
```

---

## Create All 12 Flows Programmatically

Once Langflow is running:

```bash
# Update .env with your API key first
export $(cat .env | grep -v "^#" | grep LANGFLOW | xargs)

# Create 8 agent flows
npx tsx server/scripts/create-agent-flows.ts

# Import 4 Logic Gate scenarios
npx tsx server/scripts/import-logic-gate-scenarios.ts
```

This will create all 12 flows and output the Flow IDs.

---

## Update Agent Code with New Flow IDs

After flows are created, update the hardcoded IDs in agent code:

**Option A: Manual Update**

Edit each agent file and replace the Flow ID:

```typescript
// server/agents/deep/DeepFinOpsAgent.ts line 91
const flowResult = await executeLangflowFlow(
  'NEW-FLOW-ID-HERE',  // ← Replace this
  { ... }
);
```

**Option B: Automated Update (Recommended)**

```bash
npx tsx server/scripts/update-agent-flow-ids.ts
```

This script will:
1. Read all Flow IDs from Langflow
2. Match them to agents by name
3. Update all agent files automatically

---

## Test End-to-End

```bash
# 1. Test server endpoints
curl -X POST http://localhost:5000/api/agent-actions/jira/create-issue \
  -H "Content-Type: application/json" \
  -d '{"projectKey":"TEST","summary":"Test","priority":"High","agentId":"finops"}'

# 2. Test Langflow flow execution
curl -X POST http://localhost:7860/api/v1/run/<flow-id> \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"input_value": "test"}'

# 3. Trigger agent (creates project with >20% budget variance)
# Agent will detect it and call Langflow automatically
# Check logs: tail -f /tmp/server_startup.log | grep Langflow
```

---

## Migration to Cloud (Later)

When ready to move to production:

### Option 1: Docker on Cloud Provider
```bash
# Any cloud with Docker support
docker run -d -p 7860:7860 langflowai/langflow:latest
```

### Option 2: Kubernetes
```bash
# Use provided k8s manifests
kubectl apply -f k8s/langflow-deployment.yml
```

### Option 3: Cloud Provider Service
- AWS ECS/Fargate
- Azure Container Instances
- Google Cloud Run

**Just update `.env` with new URL and re-run flow creation script.**

---

## Troubleshooting

### Langflow Won't Start

```bash
# Check logs
docker logs langflow

# Common issues:
# - Port 7860 already in use: Change port in docker-compose.langflow.yml
# - Permission denied: sudo docker-compose up -d
```

### Can't Create Flows

```bash
# Check API key is valid
curl http://localhost:7860/api/v1/flows \
  -H "Authorization: Bearer <your-key>"

# If 401: Regenerate API key in Langflow UI
```

### Flows Don't Execute

```bash
# Check flow exists
curl http://localhost:7860/api/v1/flows/<flow-id> \
  -H "Authorization: Bearer <your-key>"

# Check server endpoints are running
curl http://localhost:5000/health
```

---

## Commands Reference

```bash
# Start Langflow
docker-compose -f docker-compose.langflow.yml up -d

# Stop Langflow
docker-compose -f docker-compose.langflow.yml down

# View logs
docker logs -f langflow

# Restart (if configuration changed)
docker-compose -f docker-compose.langflow.yml restart

# Remove all data (reset)
docker-compose -f docker-compose.langflow.yml down -v
rm -rf langflow-data

# Backup flows
docker cp langflow:/app/langflow ./langflow-backup

# Restore flows
docker cp ./langflow-backup langflow:/app/langflow
```

---

## Next Steps

1. ✅ Start Docker container
2. ✅ Get API key from UI
3. ✅ Update `.env`
4. ✅ Run flow creation scripts
5. ✅ Update agent code with new Flow IDs
6. ✅ Test end-to-end
7. ✅ Move to MCP UI setup
8. ✅ Fix audit items

**Total time: 30 minutes**

---

**Ready to proceed?** Run the docker-compose command above.
