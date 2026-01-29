# Kyndryl Clarity - Master Architecture

**Version:** 2.0.0  
**Date:** 2026-01-29  
**Classification:** Level 4 Autonomous Agentic System

---

## Executive Summary

Kyndryl Clarity is a fully autonomous, self-learning multi-agent platform for enterprise transformation management. The system implements Level 4 autonomy where agents continuously monitor, learn, communicate, and take action without human intervention.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     KYNDRYL 365 AI                               │
│                  Level 4 Autonomous System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            CONTINUOUS ORCHESTRATOR                        │   │
│  │         (Admin Switch: Default OFF)                       │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │              COST OPTIMIZATION FLOW                  │ │   │
│  │  │                                                      │ │   │
│  │  │  1. CACHE CHECK ──► Skip if unchanged               │ │   │
│  │  │         │                                           │ │   │
│  │  │         ▼                                           │ │   │
│  │  │  2. OPENROUTER ──► Cheap models ($0.10/1M tokens)   │ │   │
│  │  │         │          (Llama, Mixtral, GPT-4o-mini)    │ │   │
│  │  │         ▼                                           │ │   │
│  │  │  3. CLAUDE ──► Complex issues only ($3-15/1M)       │ │   │
│  │  │                                                      │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 10 DEEP AGENTS                           │   │
│  │                                                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ FinOps  │ │  TMO    │ │  Risk   │ │  VRO    │       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│  │       │           │           │           │             │   │
│  │  ┌────┴───────────┴───────────┴───────────┴────┐       │   │
│  │  │              A2A MESSAGE BUS                 │       │   │
│  │  │         (Unlimited Agent Communication)      │       │   │
│  │  └────┬───────────┬───────────┬───────────┬────┘       │   │
│  │       │           │           │           │             │   │
│  │  ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐       │   │
│  │  │  PMO    │ │  OCM    │ │Governan.│ │Planning │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  │                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐              │   │
│  │  │ Integrated Mgmt │  │ OKR Inference   │              │   │
│  │  └─────────────────┘  └─────────────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MEMORY & LEARNING SYSTEMS                    │   │
│  │                  (Always Running)                         │   │
│  │                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │    MEM0     │  │   LETTA     │  │ RULES ENGINE│      │   │
│  │  │ Fact Ledger │  │  Long-term  │  │   Camunda   │      │   │
│  │  │ (Semantic)  │  │   Memory    │  │    DMN      │      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Optimization Flow

Every agent analysis follows this cost-saving flow:

### 1. Cache Check (FREE)
- Hash-based comparison of project data
- If unchanged since last analysis → skip (no API cost)
- 30-minute cache TTL by default

### 2. OpenRouter (CHEAP: $0.10-0.50/1M tokens)
- Routine monitoring and simple checks
- Models: Llama 3.1-8B, Mixtral, GPT-4o-mini
- All requests visible in your OpenRouter dashboard

### 3. Anthropic Claude (PREMIUM: $3-15/1M tokens)
- Complex reasoning and critical decisions only
- Used when issues require deep analysis
- Fallback if OpenRouter unavailable

---

## Agent Self-Learning

Each agent autonomously:

1. **Stores Risks in Mem0** - Every finding saved as a fact
2. **Self-Checks Each Cycle** - Queries own stored risks
3. **Re-evaluates Status** - Checks if risks are still relevant
4. **Shares via A2A** - Broadcasts findings to other agents
5. **Learns Patterns** - Semantic memory for pattern recognition

---

## Memory Systems

### Mem0 (Shared Fact Ledger)
- Agents write facts: `project_x.risk_score = high`
- Other agents subscribe to patterns
- Triggers orchestrator when new facts stored
- No API cost (local memory)

### Letta (Long-term Memory)
- Persistent agent memory across sessions
- Stores learned patterns and preferences
- No API cost (passive listener)

---

## Admin Controls

### Orchestrator Switch
- **Default: OFF** (protects API costs)
- Admin enables via Settings > Orchestrator
- Setting persists across restarts
- Minimum interval: 30 seconds

### API Endpoints
```
GET  /api/admin/orchestrator/status   - Get status
POST /api/admin/orchestrator/start    - Enable orchestration
POST /api/admin/orchestrator/stop     - Disable orchestration
POST /api/admin/orchestrator/trigger  - Run single agent
```

---

## Setup Requirements

### Required Environment Variables
| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Cost-optimized model routing |
| `ANTHROPIC_API_KEY` | Premium Claude access |
| `DATABASE_URL` | PostgreSQL connection |

### Wizard Setup
During initial setup, provide:
1. **OpenRouter API Key** (required for cost optimization)
2. Anthropic API Key is optional if OpenRouter is configured

OpenRouter handles routing to:
- Meta Llama models
- Mistral models
- OpenAI models
- Anthropic Claude (via OpenRouter)

---

## Level 4 Autonomy Features

| Feature | Status |
|---------|--------|
| Continuous monitoring | ✅ |
| Self-learning | ✅ |
| Agent-to-agent communication | ✅ |
| Autonomous risk checking | ✅ |
| Cost optimization | ✅ |
| No human intervention required | ✅ |

---

## Monitoring

### OpenRouter Dashboard
All requests visible at: https://openrouter.ai/activity
- Model usage breakdown
- Cost per request
- Latency metrics
- Token counts

### Application Logs
```
[SmartModelRouter] Using OpenRouter: meta-llama/llama-3.1-8b-instruct (cheap tier)
[ContinuousOrchestrator] === Cycle 42 ===
[Mem0] Fact written: project_x.risk_score = high
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-29 | Level 4 autonomy, cost optimization, admin switch |
| 1.5.0 | 2026-01-26 | Deep Agent architecture, Mem0/Letta integration |
| 1.0.0 | 2026-01-23 | Initial multi-agent system |
