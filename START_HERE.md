# 🚀 START HERE - Project Documentation Index

**Last Updated**: 2026-01-27

---

## 📋 MASTER TODO DOCUMENT

**→ [`MASTER_TODO_EXACT_ATTRIBUTES.md`](./MASTER_TODO_EXACT_ATTRIBUTES.md)** ← **START HERE**

This is the **SINGLE SOURCE OF TRUTH** for all project tasks, progress tracking, and next steps.

All other TODO/BACKLOG files are deprecated and kept for historical reference only.

---

## 📚 Key Reference Documents

### Active Documents (Read These)

1. **`MASTER_TODO_EXACT_ATTRIBUTES.md`** - Master TODO with all tasks and progress
   - Phase 2 Complete: 315 agent attributes + Logic Gates
   - Phase 2B In Progress: Langflow scenario implementation (7 tasks)
   - Overall Progress: 46% (27/59 tasks)

2. **`ALL_AGENTS_WIRED.md`** - Langflow integration details
   - All 8 agent Flow IDs
   - How agents call Langflow workflows
   - Server API endpoints for MCP integrations

3. **`AGENT_MCP_ARCHITECTURE.md`** - Agent-MCP integration architecture
   - Database schema
   - MCP connection patterns
   - API endpoints

4. **`server/lib/AgentLogicGates.ts`** - Logic Gates implementation
   - 5 autonomous gates
   - Gate evaluation engine
   - Cross-agent collaboration rules

5. **`server/lib/AgentInteractionScenarios.ts`** - Agent interaction scenarios
   - 4 concrete collaboration scenarios
   - Ready for Langflow implementation

### Agent Attribute Files (Reference)

All located in `server/agents/attributes/`:
- `PMOAgentAttributes.ts` - 38 attributes
- `FinOpsAgentAttributes.ts` - 40 attributes
- `VROAgentAttributes.ts` - 37 attributes
- `PlanningAgentAttributes.ts` - 30 attributes
- `OCMAgentAttributes.ts` - 38 attributes
- `RiskAgentAttributes.ts` - 39 attributes
- `GovernanceAgentAttributes.ts` - 32 attributes
- `TMOAgentAttributes.ts` - 38 attributes
- `CompanyAgentAttributes.ts` - 23 attributes (ROOT agent)

### Deprecated Documents (Historical Reference Only)

- `TODO_FROM_CONVERSATION.md` - Pre-crash conversation context
- `BACKLOG.md` - Initial backlog attempt
- `FINAL_TODO.md` - Old version
- `MASTER_TODO.md` - Old version (superseded by MASTER_TODO_EXACT_ATTRIBUTES.md)

---

## 🎯 Current Status

**Phase 2**: ✅ 100% Complete
- 315 agent attributes based on SAFe 6.0
- 5 Logic Gates for autonomous collaboration
- 4 Agent Interaction Scenarios defined

**Phase 2B**: ⏳ 0% Complete (Next Step)
- Implement 4 scenarios in Langflow
- Wire Logic Gates to Langflow
- Create API endpoints
- Document workflows

**Overall**: 46% Complete (27/59 tasks)

---

## 📋 Active Todo List

Use the `/tasks` command to see the current todo list. All tasks reference sections in `MASTER_TODO_EXACT_ATTRIBUTES.md`.

**Current Phase 2B Tasks**:
1. Task 2B.1: Create Langflow workflow for Budget Overrun scenario
2. Task 2B.2: Create Langflow workflow for Burnout Brake scenario
3. Task 2B.3: Create Langflow workflow for Regulatory Deadbolt scenario
4. Task 2B.4: Create Langflow workflow for Maturity Governor scenario
5. Task 2B.5: Wire Logic Gate triggers to Langflow
6. Task 2B.6: Create server API endpoints for Logic Gates
7. Task 2B.7: Document scenario workflows

---

## 🚀 Quick Start

1. Read `MASTER_TODO_EXACT_ATTRIBUTES.md` - Understand overall project status
2. Read `ALL_AGENTS_WIRED.md` - Understand existing Langflow integration
3. Start Task 2B.1 - Create Budget Overrun Langflow workflow
4. Test with real production data (no simulators)

---

**Remember**: `MASTER_TODO_EXACT_ATTRIBUTES.md` is the single source of truth. Always check there first!
