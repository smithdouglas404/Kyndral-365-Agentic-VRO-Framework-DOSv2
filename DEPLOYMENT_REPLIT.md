# 🚀 Replit Deployment Guide - No Docker Required

## Enterprise Ontology-Based System for Replit Environment

---

## ✅ What Works on Replit

All 3 implemented phases work perfectly on Replit:
- ✅ Unified Ontology Layer
- ✅ OBDA Query Engine
- ✅ LangChain Agent System (7 intelligent agents)

**Neo4j (Phase 4) can be added later via Neo4j Aura (cloud service)**

---

## 📦 Quick Start on Replit

### 1. Database Setup

**Option A: Use Replit PostgreSQL (Recommended)**

Replit provides built-in PostgreSQL:

1. Go to the "Database" tab in your Repl
2. Click "Create Database" → Select "PostgreSQL"
3. Copy the connection string

```bash
# Replit auto-sets this for you:
DATABASE_URL=postgresql://user:pass@host:5432/database
```

**Option B: External PostgreSQL**

Use a cloud PostgreSQL service:
- **Neon** (https://neon.tech) - Free tier with PostgreSQL
- **Supabase** (https://supabase.com) - Free tier with PostgreSQL
- **ElephantSQL** (https://www.elephantsql.com) - Free tier

**Option C: Use MySQL Instead**

While PostgreSQL is recommended, you can use MySQL:

```bash
# For MySQL (requires schema adjustments - see below)
DATABASE_URL=mysql://user:pass@host:3306/database
```

⚠️ **Note**: MySQL requires some schema changes (see "MySQL Compatibility" section below)

### 2. Set Environment Variables

In Replit, go to "Secrets" (lock icon) and add:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...
DATABASE_URL=postgresql://... (from step 1)

# Recommended (for agent observability)
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=nextera-eto
LANGCHAIN_TRACING_V2=true

# Session security
SESSION_SECRET=generate-a-random-string-here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Initialize Database

```bash
# Push schema to database (creates all tables)
npm run db:push
```

This creates all tables including the new ontology tables:
- `ontology_entities`
- `ontology_mappings`
- `obda_query_cache`
- `graph_sync_log`

### 5. Start Application

```bash
# Development mode (recommended for Replit)
npm run dev
```

### 6. Verify Agents Started

Check the console for:
```
[AgentScheduler] Initializing LangChain agents...
[AgentScheduler] Initialized 7 agents
[AgentScheduler] ✅ All agents scheduled and running
[AgentScheduler] 🎯 NO MORE FAKE DATA - Agents monitor real projects
```

---

## 🎯 What's Different on Replit?

### ❌ No Docker Compose
- Skip docker-compose.yml (won't work on Replit)
- Use Replit's built-in database or external services

### ❌ No Local Neo4j
- Neo4j (Phase 4) not available locally
- Use **Neo4j Aura** (free tier) when you reach Phase 4:
  ```bash
  NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
  NEO4J_USER=neo4j
  NEO4J_PASSWORD=your-password
  ```

### ✅ Everything Else Works!
- Ontology layer (file-based, no dependencies)
- OBDA query engine (works with any SQL database)
- LangChain agents (cloud-based via Anthropic API)
- GraphQL endpoints
- All API endpoints

---

## 🗄️ MySQL Compatibility (If Using MySQL Instead of PostgreSQL)

If you need to use MySQL, make these changes:

### 1. Update schema.ts

```typescript
// BEFORE (PostgreSQL):
id: varchar("id").primaryKey().default(sql`gen_random_uuid()`)

// AFTER (MySQL):
id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`)
```

### 2. Replace gen_random_uuid() in all tables

Search for `gen_random_uuid()` in `/shared/schema.ts` and replace with `(UUID())`:

```bash
# Find all occurrences
grep -n "gen_random_uuid" shared/schema.ts

# Manual replacement needed in:
# - ontologyEntities
# - ontologyMappings
# - obdaQueryCache
# - graphSyncLog
# - All other tables
```

### 3. Update Drizzle config

Create or update `drizzle.config.ts`:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "mysql2", // Changed from "pg"
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 4. Install MySQL driver

```bash
npm install mysql2
```

### 5. Update storage.ts imports

```typescript
// BEFORE:
import pkg from "pg";
const { Pool } = pkg;

// AFTER:
import mysql from "mysql2/promise";
const pool = mysql.createPool(process.env.DATABASE_URL);
```

⚠️ **Recommendation**: Stick with PostgreSQL if possible. It has better JSON support and the OBDA layer is optimized for PostgreSQL.

---

## 🌐 External Database Services (Recommended for Replit)

### Option 1: Neon (PostgreSQL) - Recommended
**Free tier: 10 GB, No credit card required**

1. Sign up: https://neon.tech
2. Create a new project
3. Copy connection string
4. Add to Replit Secrets: `DATABASE_URL=postgresql://...`

### Option 2: Supabase (PostgreSQL)
**Free tier: 500 MB, 2 projects**

1. Sign up: https://supabase.com
2. Create a new project
3. Go to Settings → Database → Connection string
4. Add to Replit Secrets: `DATABASE_URL=postgresql://...`

### Option 3: PlanetScale (MySQL)
**Free tier: 5 GB, 1 billion row reads/month**

1. Sign up: https://planetscale.com
2. Create database
3. Get connection string
4. Add to Replit Secrets: `DATABASE_URL=mysql://...`

---

## 🔌 API Testing on Replit

Once running, test your endpoints:

### 1. Verify Ontology Loaded
```bash
curl https://your-repl-name.repl.co/api/ontology/statistics
```

Expected response:
```json
{
  "totalTriples": 300+,
  "totalClasses": 30+,
  "totalObjectProperties": 15+,
  "totalDatatypeProperties": 35+
}
```

### 2. Test GraphQL
```bash
curl -X POST https://your-repl-name.repl.co/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ projects(limit: 5) { id name status } }"}'
```

### 3. Test Semantic Reconciliation
```bash
curl -X POST https://your-repl-name.repl.co/api/ontology/reconcile \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "epic", "sourceSystem": "jira"}'
```

Expected response:
```json
{
  "sourceType": "epic",
  "sourceSystem": "jira",
  "ontologyConcept": "http://nextera.energy/ontology/safe#Epic",
  "label": "SAFe Epic"
}
```

---

## 📊 Monitoring on Replit

### Agent Activity
Check console logs in Replit:
- Agent initialization messages
- Scheduled scan notifications
- Intervention creation logs

### LangSmith Dashboard
Visit https://smith.langchain.com/ to see:
- Real-time agent traces
- Tool execution logs
- Performance metrics
- Error debugging

---

## 🐛 Replit-Specific Troubleshooting

### Database Connection Issues

**Error**: "Connection refused" or "Database not found"

**Solution**:
1. Verify DATABASE_URL is set in Secrets
2. Test connection:
   ```bash
   node -e "const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); pool.end(); });"
   ```

### Port Already in Use

**Error**: "Port 5000 already in use"

**Solution**: Replit handles ports automatically. The app will bind to whatever port Replit assigns.

### Agent Not Starting

**Error**: "AgentScheduler failed to initialize"

**Solution**:
1. Check ANTHROPIC_API_KEY is set
2. Verify database connection works
3. Check console for specific error messages

### Ontology Files Not Loading

**Error**: "Cannot load ontology files"

**Solution**:
```bash
# Verify files exist
ls -la server/ontology/schema/

# Should show:
# - core.ttl
# - safe.ttl
# - pmbok.ttl
# - prince2.ttl
# - bridging.ttl
```

---

## 🎯 What Works Without Docker

### ✅ Fully Functional
- Ontology layer (file-based RDF)
- OBDA query engine (works with PostgreSQL or MySQL)
- LangChain agents (7 agents, cloud-based)
- GraphQL gateway
- All REST APIs
- Agent observability (LangSmith)
- MCP adapters (Jira, Azure, etc.)

### ⏳ Needs External Service (Phase 4+)
- Neo4j Knowledge Graph → Use **Neo4j Aura** (free tier)
- Document Intelligence (Phase 5) → Works as-is
- Frontend visualizations (Phase 7) → Works as-is

---

## 🚀 Production Deployment from Replit

### Option 1: Deploy to Replit (Simplest)
Replit can host your app:
1. Click "Deploy" button
2. Choose "Autoscale" or "Reserved VM"
3. Set up custom domain (optional)

### Option 2: Deploy to Cloud (More Control)
Export from Replit and deploy to:
- **Render** (https://render.com) - Free tier available
- **Railway** (https://railway.app) - $5/month
- **Fly.io** (https://fly.io) - Free tier available
- **Heroku** - $7/month

All support Node.js and PostgreSQL.

---

## ✨ Summary for Replit

**You can run the ENTIRE Phase 1-3 system on Replit without Docker:**

1. ✅ Use Replit PostgreSQL or external database (Neon, Supabase)
2. ✅ Set environment variables in Replit Secrets
3. ✅ Run `npm run db:push` to create tables
4. ✅ Run `npm run dev` to start
5. ✅ All 7 agents will start automatically
6. ✅ NO SIMULATION - only real data
7. ✅ Full LangSmith observability

**For Phase 4 (Neo4j Knowledge Graph):**
- Use Neo4j Aura (cloud) instead of Docker: https://neo4j.com/cloud/aura/

**Database Recommendation:**
- PostgreSQL (via Neon or Supabase) - Recommended
- MySQL (via PlanetScale) - Requires schema adjustments

---

## 📞 Need Help?

Common Replit commands:
```bash
# Check environment variables
printenv | grep -E "DATABASE_URL|ANTHROPIC"

# Test database connection
npm run db:push

# View logs
# (automatic in Replit console)

# Restart server
# (click "Stop" then "Run" button)
```

**You're ready to deploy on Replit!** 🎉
