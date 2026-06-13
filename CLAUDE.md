# Kyndral-365 — project context for Claude

## Architecture (ONE monorepo, three services, one product)

Everything lives in THIS repo; `docker compose up -d` boots the whole product.
Services talk over fixed compose-internal hostnames — only secrets are env vars.

- **`/` (Kyndral app)** — THE application + the only UI users see: React/Vite
  client (Tailwind, shadcn/ui, Vercel AI SDK) + Express/Drizzle/Postgres server.
  It does NOT run the agents itself — it **proxies** to the agent-runtime
  sidecar for everything agentic (`/api/agent/*` → `AGENT_RUNTIME_URL`). Runs at
  `app:5000`.
- **`/openproject`** — our OpenProject FORK (Rails), the datastore / system of
  work. Projects and work packages physically live there. Users never see its
  UI; we read/write via APIv3 at `http://openproject:80`.
- **`/agent-runtime`** — **the agent system** (ported from agenticPPM). This is
  where ALL agent reasoning, the rules engine, HITL, and the learning loop live
  — not `server/`. Runs at `agent-runtime:8745`.
  HTTP API: `GET /api/findings|metrics|learning|roster|project-status`,
  `POST /api/findings/:id/approve|reject`, `POST /api/sweep`. See the
  "Agent system" section below for exactly how the closed loop works.

The ontology layer: the UI reads ontology objects (Project/Feature/Story/Task/
Risk) via `/api/palantir/ontology/*` routes backed by
`server/FalkorOntologyDataProvider.ts` (FalkorDB; Palantir has been replaced —
keep the route URLs, never reintroduce Foundry).

## LIVE vs LEGACY — read this before touching "agents" (avoid a costly mistake)

The repo physically contains TWO agent stacks. Only one is live.

- ✅ **LIVE = `agent-runtime/src/`.** The reasoning agents, detectors, ZEN rules
  engine, findings/HITL, and learning loop are HERE. The Kyndral UI reaches them
  through `server/routes/agentFindings.routes.ts` (`/api/agent/*` proxy). When a
  question is about agents, rules, findings, HITL, or learning — **look here
  first.**
- ❌ **LEGACY / DEAD = `server/agents/` (Mastra configs + `deep/Deep*Agent.ts`),
  `server/services/Palantir*`, `server/mcp/Palantir*`, the
  `EventDrivenOrchestrator`/`ContinuousOrchestrator`/Mastra/Mem0 wiring.** This
  is the pre-agent-runtime DOSv2 product. It is being retired and must NOT be
  treated as the agent system. (It is still partly booted in `server/index.ts`;
  that is cleanup debt, not the design.) Do not extend it or cite it as truth.

## Agent system (the closed loop, all in `agent-runtime/`)

The full roster lives in `agent-runtime/src/agents/roster.ts` — 10 agents, all
`active`: `strategic-pmo, governance, finops, vro, okr, planning, ocm, tmo,
rules, notification`. Every finding is owned by a roster agent (provenance).

The loop, orchestrated by `agents/sweep.ts` (periodic + throttled after webhook
events — there is no 15s polling):

1. **Detect + reason** — `agents/detectors.ts` (deterministic detectors) +
   `agents/reasoningAgents.ts` runs EVERY roster agent as a reasoning agent,
   each through its stateful **Letta** memory (else a direct **Claude** call via
   `llm/claude.ts`). Strategic-PMO runs as the per-project assessor.
2. **Grounding gate** — `grounding/validate.ts` drops any finding citing
   entities/metrics not in the **FalkorDB** graph. Evidence is required; numbers
   are never invented.
3. **HITL** — grounded findings are deduped/stored (`store/findings.ts`) and
   published as OpenProject Agent Alerts + to the console (`inbox/inbox.ts`).
4. **Learning loop** (`learning/outcomes.ts`) — each high/medium finding is
   logged as a `:Prediction`; `resolveOutcomes()` scores it against **the HITL
   decision first** (`recordHumanDecision()` — human approve/reject is the
   strongest label) then graph state; `agentAccuracy()` feeds
   `severityAdjustment()`, which **auto-tunes** future published severity per
   agent's track record.
5. **Rules engine** — `rules/evaluator.ts` + `rules/zenEvaluator.ts` evaluate
   OpenProject-authored ZEN (GoRules) decision models against the graph, in both
   the sweep and the event path, raising `RuleBreach` findings into the same
   pipeline.

## OpenProject integration — how to do common things

All building blocks are already in this repo (originally authored in
`agenticopenproject:agentic-ppm/kyndryl-connector/`, kept in sync from there):

| Task | Use |
|---|---|
| Pull projects/work packages IN | `server/openProjectClient.ts` → `syncProject()`; registered as `'openproject'` in `IntegrationSyncService` (both switches) and the sync scheduler |
| Real-time inbound | `server/routes/webhooks/openproject.ts` (`POST /webhooks/openproject`, HMAC `X-OP-Signature`, echo-guarded) |
| Push a UI edit OUT to OpenProject | `server/openProjectWriteback.ts` → `pushEntityUpdate()` / `pushProjectUpdate()` (handles lockVersion + 409 retry); REST: `PATCH /api/openproject/entities/:entityType/:externalId` |
| Create a work package from the UI | `POST /api/openproject/projects/:externalProjectId/work-packages` or `writeback.createLinkedWorkPackage()` — store the returned `id` as the entity's `externalId` |
| Deep link to OpenProject | `GET /api/openproject/link/:entityType/:externalId` or `writeback.deepLink()` |
| Mark a UI element as OpenProject-backed | `client/src/openproject/SourceBadge.tsx`; detect with `isOpenProjectEntity(entity)` (`sourceSystem === 'openproject'` + `externalId`) |
| Make any save bidirectional | wrap the save handler with `useBidirectionalSave` from `client/src/openproject/OpenProjectEditGuard.tsx` |
| Agent insights + HITL approve/reject in the UI | `client/src/openproject/ApprovalQueue.tsx` + server proxy `server/routes/agentFindings.routes.ts` (`/api/agent/*`) |
| Agent chat with grounded widgets (Vercel AI SDK) | `ai-sdk/` — tools in `ai-sdk/server/tools.ts`, route `POST /api/agent-chat`, widgets + `AgenticChat` in `ai-sdk/client/` |
| OKR progress from real delivery | `server/okrRollupService.ts` (KR progress = Σ entity progress × contribution%); routes in `server/routes/okrRollup.routes.ts` |

Per-page integration recipes: `docs/UI_BIDIRECTIONAL_WIRING_MAP.md`.

## Rules that keep this system trustworthy (do not regress these)

1. **Numbers are computed, never generated.** Metrics come from
   `/api/agent/metrics` (deterministic Cypher with audit formulas) or Drizzle
   aggregates. The LLM explains and prioritizes; it must never invent a number.
   Keep the computed-vs-"AI narrative" labeling in the UI.
2. **Findings carry evidence.** Agent findings cite `evidence[]`
   (entityId · metric = value) and `confidence`. Render them; never strip them.
3. **HITL gates actions.** Agent actions execute only on human approval via the
   agent-runtime findings lifecycle, surfaced in the UI by
   `client/src/openproject/ApprovalQueue.tsx` (→ `/api/agent/*` proxy). Decisions
   are training labels — `learning/outcomes.ts:recordHumanDecision()` feeds
   per-agent accuracy and severity auto-tuning. Don't bypass.
4. **Event-driven, not polling.** The agent-runtime sweep (`agents/sweep.ts`)
   runs on a periodic cadence + throttled after OpenProject webhook events —
   there is no per-second polling loop. (The legacy `EventDrivenOrchestrator` /
   `ContinuousOrchestrator` in `server/` are off by default; never re-enable the
   old 15-second loop — it cost ~$10–15k/yr.)
5. **Echo prevention.** Outbound writes to OpenProject are marked
   (`wasRecentlyPushed`, `[sync:kyndral-365]`); the webhook skips our own
   echoes. Preserve this when touching either path.
6. **OpenProject field mapping** lives in `openProjectClient.ts`
   (`TYPE_BUCKET`, status/priority maps) and its reverse in
   `openProjectWriteback.ts`. Change them together or sync drifts.
7. **No mock data.** Every UI number must trace to: OpenProject sync, a user
   setup screen, or a computed formula (see `docs/MOCK_DATA_TO_REAL.md`).

## Env vars (integration)

Env vars alone are sufficient — no MCP adapter registration is required to
connect OpenProject (adapter config, when present, takes precedence).

```
OPENPROJECT_BASE_URL=…        # the OpenProject instance (OPENPROJECT_URL also accepted)
OPENPROJECT_API_KEY=…         # basic auth: apikey:<key>
OPENPROJECT_WEBHOOK_SECRET=…  # X-OP-Signature HMAC
AGENT_RUNTIME_URL=…           # the sidecar (the agent system; UI proxies here)
AGENT_RUNTIME_TOKEN=…         # sidecar CONSOLE_TOKEN, if set
FALKORDB_HOST/PORT/GRAPH/PASSWORD  # ontology graph
ANTHROPIC_API_KEY / ANTHROPIC_MODEL # AI SDK chat route
# ENABLE_LEGACY_AGENTS=true   # DO NOT SET. Boots the retired in-process DOSv2
#                             # agent stack (Battle Rhythm / AgentScheduler /
#                             # EventDrivenOrchestrator / Palantir sync) which
#                             # duplicates the agent-runtime sidecar. Off = correct.
```

## Docs (this repo is fully self-contained)

Strategy docs live under `docs/`:
`GROUNDING_AND_HALLUCINATION.md`, `ORCHESTRATION_AND_RULES.md`,
`UI_STRATEGY.md`, `SCHEMA_AND_OPENPROJECT_MAPPING.md`,
`PALANTIR_TO_FALKORDB.md`, `UI_BIDIRECTIONAL_WIRING_MAP.md`,
`MOCK_DATA_TO_REAL.md`, `OPENPROJECT_CONNECTOR_README.md`. The agent-runtime is
documented in `agent-runtime/README.md`; the agenticPPM migration spec is under
`docs/agentic-ppm/`. (Legacy Langflow / Mastra / Palantir / "COMPLETE"-status
docs and scratch TODOs were deleted to stop them contradicting this file — git
history has them if needed.)
Nothing external remains: the OpenProject fork is `/openproject` and the
agent-runtime sidecar is `/agent-runtime` in this repo. The app still degrades
gracefully when sidecar/OpenProject services aren't running (clear 503s).
The old `agenticopenproject` repo is retired as a source of truth.
