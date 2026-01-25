# READ THIS FIRST - The Truth About This System

**Date:** January 25, 2026
**Last Working State:** Commit `503fe39` "Alpha" (Jan 24, 2026 @ 5:49 PM EST)
**Current Status:** BROKEN - Server won't start due to uncommitted changes made after you went to sleep

---

## What Happened

### Timeline

1. **Jan 24, 1:38 PM EST** - Commit `b65acfd` "Add MCP Marketplace"
   - Added collaboration rules API
   - Added AgentCollaborationRulesEngine
   - System working

2. **Jan 24, 5:49 PM EST** - Commit `503fe39` "Alpha"
   - Added 67 files (+14,336 lines)
   - Added agent attributes (FinOpsAgentAttributes.ts, etc.)
   - Added seed scripts
   - Added Camunda files
   - Added documentation
   - **You went to sleep - this commit is safe**

3. **After 6:00 PM EST** - Uncommitted changes (BROKE THE SYSTEM)
   - Modified ContinuousOrchestrator to use `agent.evaluateRules()`
   - Modified DeepAgentBase to add Retool Vectors knowledge enrichment
   - Modified all Deep Agents to add `evaluateRules()` methods
   - **BUT imported `RetoolVectorsMCP.ts` which doesn't exist**
   - **Broke imports in okr-kpi.ts**
   - Server won't start

---

## The CORRECT Architecture (All Systems Coexist)

You were RIGHT to be upset - the agent kept confusing things. Here's the truth:

### 1. DeepAgentOrchestrator (KEEP - CRITICAL!)
**Location:** `server/agents/deep/DeepAgentOrchestrator.ts`

**Purpose:**
- A2A (Agent-to-Agent) message bus - agents communicate with each other
- Deep Agents using LangChain that learn and reason
- Multi-step planning with reflection
- Inter-agent collaboration requests

**DO NOT DELETE THIS!** The screenshot that said to delete it was WRONG.

### 2. Flowise (Orchestration Layer - Add On Top)
**Purpose:**
- Visual workflow designer for business users
- No-code automation
- Human approval steps
- Works WITH DeepAgentOrchestrator, doesn't replace it

**How it fits:**
- Flowise reads thresholds from PostgreSQL `collaboration_rules` table
- Triggers workflows that use the Deep Agents
- Provides visual UI for workflow design

### 3. Camunda (Rules Engine)
**Location:** `server/routes/admin/camunda.ts`, `docs/camunda/*.dmn`

**Purpose:**
- DMN/BPMN for deterministic business rules
- Decision tables
- NOT for orchestration - for rules evaluation

### 4. Retool (Configuration UI - 8 SEPARATE Apps)
**Purpose:** Rule Editors for each team to configure their rules

**NOT:**
- ❌ Not "dashboards" - they are **Rule Editors**
- ❌ Not documentation telling you to build it yourself
- ❌ Not one unified interface

**YES:**
- ✅ 8 separate Retool apps (one per team)
- ✅ Each team configures their own rules
- ✅ Writes to PostgreSQL `collaboration_rules` table

**The 8 Rule Editors:**
1. **FinOps Rule Editor** - Budget variance, burn rate thresholds
2. **Governance Rule Editor** - Compliance policies, regulatory frameworks
3. **TMO Rule Editor** - Schedule delays, resource overloads
4. **Risk Rule Editor** - Risk thresholds, escalations
5. **VRO Rule Editor** - Value realization tracking
6. **PMO Rule Editor** - Portfolio metrics
7. **OCM Rule Editor** - Change management rules
8. **Planning Rule Editor** - Planning thresholds

**Each Rule Editor has:**
- **Your Active Rules** table (Rule Name, Threshold, Action, Status)
- **Edit Rule** form with:
  - Threshold sliders/inputs
  - Action checkboxes (Alert X agent, Notify Y, Block workflow, etc.)
  - Severity dropdown (Low, Medium, High, Critical)
  - Apply to: conditions
- **Buttons:**
  - Update Rule
  - Test Impact
  - Publish
  - View Dependencies (for some)
- **Change History** log
- **OVERSIGHT section** (Governance only) - View other team rules (read-only)

**Custom Attribute Builder:**
- Separate interface where users create custom attributes
- Example: "Vendor Compliance Score"
- Define: name, type, unit, data source, which agents can use it

---

## Knowledge Base System (Already Working)

### What Exists: KnowledgeBaseManagement.tsx

**Location:** `client/src/pages/admin/KnowledgeBaseManagement.tsx`

**Features:**
- Upload documents (PDF, DOCX, TXT, MD)
- Tag documents to agents via `relevantAgents` field
- Each agent gets their own documents
- Document types: guideline, sop, policy, rca, form, template, manual
- Trigger conditions (like rules engine but for documents)
- Form builder for fillable forms
- Usage tracking per agent

### Seeded Documents (All 9 Agents Have Repos)

**Script:** `server/scripts/seed-regulatory-documents.ts`

Each agent has pre-seeded regulatory/best practice documents:

1. **Governance Agent:**
   - SOX Compliance Guide
   - GDPR Compliance
   - ISO 21500 Project Governance Standard

2. **Risk Agent:**
   - ISO 31000 Risk Management Guidelines
   - NIST CSF 2.0

3. **FinOps Agent:**
   - GAAP Financial Standards
   - EVM Implementation Guide

4. **TMO Agent:**
   - TOGAF ADM
   - Prosci ADKAR Change Management

5. **Planning Agent:**
   - PMBOK 7th Edition Planning Guide
   - SAFe PI Planning

6. **VRO Agent:**
   - Benefits Realization Management Guide

7. **PMO Agent:**
   - Portfolio Management Framework

8. **OCM Agent:**
   - Change Management Best Practices

9. **OKR Agent:**
   - Google OKR Playbook

**How RAG Works:**
- Each agent queries documents filtered by their `agentId`
- `relevantAgents` field determines which agents can see each document
- Governance agent needs SOX compliance? It queries its repo
- Risk agent needs NIST framework? It queries its repo

---

## The Data Flow

```
User (Team Member)
    ↓
Retool Rule Editor (FinOps/Governance/TMO/etc.)
    ↓ (configures thresholds, actions)
PostgreSQL: collaboration_rules table
    ↓ (read by)
AgentCollaborationRulesEngine
    ↓ (evaluated by)
Deep Agents (via evaluateRules() method)
    ↓ (enriched with knowledge from)
Knowledge Base (agent-specific documents)
    ↓ (coordinated by)
DeepAgentOrchestrator (A2A message bus)
    ↓ (optionally triggered by)
Flowise Workflows (visual orchestration layer)
    ↓ (uses)
Camunda Rules Engine (deterministic decisions)
```

---

## What's Currently Broken

### Files with Uncommitted Changes (Made After Alpha):

1. **server/agents/ContinuousOrchestrator.ts**
   - ✅ GOOD: Changed to use `agent.evaluateRules(metrics)` instead of hardcoded rules
   - ✅ GOOD: Builds metrics from project data
   - ✅ GOOD: Falls back to legacy logic for non-Deep agents

2. **server/agents/deep/DeepAgentBase.ts**
   - ✅ GOOD: Added knowledge enrichment method
   - ❌ BAD: Imports `RetoolVectorsMCP.ts` which doesn't exist
   - **FIXED:** Commented out imports, disabled enrichment for now

3. **server/agents/deep/DeepFinOpsAgent.ts** (and Risk, TMO, VRO)
   - ✅ GOOD: Added `evaluateRules()` method
   - ✅ GOOD: Imports from attribute files (which DO exist)

4. **server/lib/AgentCollaborationRulesEngine.ts**
   - ✅ GOOD: Removed hardcoded table creation (now uses Drizzle migrations)

5. **shared/schema.ts**
   - ✅ GOOD: Added `agentCollaborationRules` table definition

6. **server/routes/admin/okr-kpi.ts**
   - ❌ BAD: Used `@db` import instead of `../../db.js`
   - ❌ BAD: Used wrong middleware import path
   - **FIXED:** Corrected imports

### What Was Created (Untracked Files):

**Good (Keep):**
- `scripts/seed-collaboration-rules.ts` - Seeds default rules
- `server/agents/attributes/*AgentAttributes.ts` - Default rules for all agents
- `docs/UIAI/` folder - UI mockups showing what Retool editors should look like

**To Be Built:**
- The actual 8 Retool Rule Editor apps (only mockups/docs exist, not actual apps)

**Wrong/Confusing (Created by agent):**
- `docs/RETOOL_*.md` files - Documentation telling YOU to build Retool apps yourself
- `server/mcp/RetoolVectorsMCP.ts` - Doesn't exist but was imported
- `server/routes/a2a/` - Unclear if needed
- `server/routes/webhooks/` - Unclear if needed

---

## What Needs To Happen Next

### Immediate Fixes (To Get Server Running):

1. ✅ **Fix broken imports** - DONE
   - Fixed `@db` import in okr-kpi.ts → `../../db.js`
   - Fixed middleware import → `../../auth/authMiddleware.js`

2. ✅ **Make RetoolVectorsMCP optional** - DONE
   - Commented out imports in DeepAgentBase.ts
   - Disabled knowledge enrichment for now

3. ⏳ **Install json-rules-engine package** - IN PROGRESS
   - Required by AgentCollaborationRulesEngine
   - Package exists at b65acfd commit, just needs to be installed

4. ⏳ **Test server startup**
   - Run `npm run dev`
   - Verify no errors

### Database Setup:

```bash
# 1. Push schema to create collaboration_rules table
npm run db:push

# 2. Seed default rules for all 9 agents
tsx scripts/seed-collaboration-rules.ts

# 3. Seed regulatory documents for all agents
npm run seed:documents
```

### Build the Retool Rule Editors:

**NOT documentation - actual working Retool apps!**

For each of the 8 teams, build a Retool app with:
1. Table component showing active rules
2. Form for editing rules (thresholds, actions, severity)
3. Buttons (Update, Test, Publish)
4. Change history
5. Connection to PostgreSQL `collaboration_rules` table
6. Connection to REST API at `/api/admin/collaboration-rules`

---

## What You Were Promised (3 Days Ago)

From the conversation logs:

### ✅ What Was Delivered:

1. **Rules Engine Backend**
   - AgentCollaborationRulesEngine using json-rules-engine
   - API endpoints for CRUD operations
   - Database table schema
   - Default rules for all 9 agents (30-40 rules)

2. **Knowledge Base System**
   - Upload interface with agent tagging
   - Document repository per agent
   - Trigger conditions system
   - Regulatory documents seeded for all agents

3. **OKR Management**
   - API routes for OKR/KPI management
   - Seed scripts with 21 default OKRs

4. **Agent Attributes**
   - Attribute definition files for all agents
   - Default thresholds, conditions, actions

### ⏹ What Was NOT Delivered (Marked as Missing):

1. **Admin UI for Camunda rules engine**
   - "Web-based rule builder interface" - MISSING
   - "Admin UI for viewing/editing DMN tables" - MISSING

2. **Retool Rule Editors**
   - 8 actual Retool apps - MISSING
   - Only mockups and documentation exist
   - Docs say "build it yourself"

3. **OKR to Rules Mapping**
   - UI for defining agent-specific OKRs/KPIs - EXISTS BUT NOT INTEGRATED
   - Integration layer to map rules to OKRs - MISSING
   - RuleToOKRMapper.tsx exists but uses MOCK DATA

---

## Files You Should Review

### Critical - Read These:

1. **comeherefirst.md** (THIS FILE)
   - The source of truth
   - Read this every time you resume work

2. **docs/UIAI/** folder
   - Screenshots showing what Retool Rule Editors should look like
   - FinOps, Governance, TMO mockups
   - Custom Attribute Builder

3. **server/lib/AgentCollaborationRulesEngine.ts**
   - The rules engine implementation
   - How rules are evaluated

4. **server/agents/attributes/FinOpsAgentAttributes.ts** (and others)
   - Default rules for each agent
   - Structure of rules, conditions, actions

### Reference:

5. **server/routes/admin/collaboration-rules.ts**
   - API endpoints that Retool will call

6. **docs/RULES_ENGINE_SETUP_GUIDE.md**
   - How to set up the system
   - Database setup, seeding, testing

7. **client/src/pages/admin/KnowledgeBaseManagement.tsx**
   - Knowledge base upload interface
   - How agent document tagging works

---

## Common Mistakes to Avoid

### ❌ WRONG:

1. **"Delete DeepAgentOrchestrator"** - NO! It's critical for A2A communication
2. **"Build documentation for Retool"** - NO! Build actual Retool apps
3. **"Retool dashboards"** - NO! They're Rule Editors, not dashboards
4. **"One Retool interface for all teams"** - NO! 8 separate apps
5. **"Governance agent gets SOX docs"** - NOT COMPLETE! All 9 agents have document repos
6. **"Flowise replaces DeepAgentOrchestrator"** - NO! They work together
7. **"Camunda is for orchestration"** - NO! It's for deterministic rules

### ✅ CORRECT:

1. DeepAgentOrchestrator = A2A message bus + agent coordination (KEEP)
2. Flowise = Visual workflow layer on top (ADD)
3. Camunda = Rules engine for decisions (EXISTS)
4. Retool = 8 separate Rule Editor apps (BUILD THEM)
5. Each of 9 agents has its own document repository (EXISTS)
6. Knowledge Base enriches agent context via RAG (EXISTS)
7. Rules are stored in PostgreSQL, evaluated by agents (EXISTS)

---

## Next Session Checklist

When you resume work:

1. ✅ Read comeherefirst.md (THIS FILE)
2. ⏳ Check if server starts: `npm run dev`
3. ⏳ If broken, check uncommitted changes: `git status`
4. ⏳ Verify DeepAgentOrchestrator exists and is intact
5. ⏳ Check database has been pushed: `npm run db:push`
6. ⏳ Check rules are seeded: `SELECT COUNT(*) FROM agent_collaboration_rules;`
7. ⏳ Start building actual Retool Rule Editors

---

## The Bottom Line

**You have a working system at commit `503fe39` "Alpha".**

**The uncommitted changes are GOOD (integrate rules engine) but BROKE things (missing RetoolVectorsMCP).**

**What needs to happen:**
1. Fix the imports (done)
2. Install json-rules-engine (in progress)
3. Test server
4. Build 8 actual Retool Rule Editor apps (not docs!)
5. Commit everything as "Alpha - Rules Integration Complete"

**Architecture is:**
- DeepAgentOrchestrator (keep)
- Flowise (add on top)
- Camunda (rules engine)
- Retool (8 rule editors)
- Knowledge Base per agent (working)

**DO NOT:**
- Delete DeepAgentOrchestrator
- Build one unified Retool interface
- Call them "dashboards"
- Create more documentation instead of actual apps
- Forget that ALL 9 agents have document repos

---

**Last Updated:** January 25, 2026
**Author:** Claude (after finally understanding the truth)
**Status:** Server broken, fixing in progress
