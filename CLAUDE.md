# Kyndral-365 — project context for Claude

## Architecture (ONE monorepo, three services, one product)

Everything lives in THIS repo; `docker compose up -d` boots the whole product.
Services talk over fixed compose-internal hostnames — only secrets are env vars.

- **`/` (Kyndral app)** — THE application: React/Vite client (Tailwind,
  shadcn/ui, Vercel AI SDK) + Express/Drizzle/Postgres server, Mastra agents,
  a2a bus. This is the only UI users see. Runs at `app:5000`.
- **`/openproject`** — our OpenProject FORK (Rails), the datastore / system of
  work. Projects and work packages physically live there. Users never see its
  UI; we read/write via APIv3 at `http://openproject:80`.
- **`/agent-runtime`** — the agentic sidecar: syncs OpenProject into a
  **FalkorDB** graph, runs the reasoning agents + deterministic detectors,
  owns the findings/HITL lifecycle and the learning loop. Runs at
  `agent-runtime:8745`.
  HTTP API: `GET /api/findings|metrics|learning|roster|project-status`,
  `POST /api/findings/:id/approve|reject`, `POST /api/sweep`.

The ontology layer: the UI reads ontology objects (Project/Feature/Story/Task/
Risk) via `/api/palantir/ontology/*` routes backed by
`server/FalkorOntologyDataProvider.ts` (FalkorDB; Palantir has been replaced —
keep the route URLs, never reintroduce Foundry).

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
3. **HITL gates actions.** Agent actions execute only on human approval
   (ApprovalQueue / HITLApprovalCenter). Decisions are training labels —
   they feed per-agent accuracy and severity auto-tuning. Don't bypass.
4. **Event-driven, not polling.** `EventDrivenOrchestrator` fires agents on
   real changes (CRUD diffs, OpenProject webhooks, memory updates). Never
   re-enable the `ContinuousOrchestrator` 15-second loop (it cost ~$10–15k/yr).
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
AGENT_RUNTIME_URL=…           # the sidecar
AGENT_RUNTIME_TOKEN=…         # sidecar CONSOLE_TOKEN, if set
FALKORDB_HOST/PORT/GRAPH/PASSWORD  # ontology graph
ANTHROPIC_API_KEY / ANTHROPIC_MODEL # AI SDK chat route
```

## Docs (this repo is fully self-contained)

All strategy docs live under `docs/`:
`GROUNDING_AND_HALLUCINATION.md`, `ORCHESTRATION_AND_RULES.md`,
`UI_STRATEGY.md`, `SCHEMA_AND_OPENPROJECT_MAPPING.md`,
`PALANTIR_TO_FALKORDB.md`, `UI_BIDIRECTIONAL_WIRING_MAP.md`,
`MOCK_DATA_TO_REAL.md`, `OPENPROJECT_CONNECTOR_README.md`.
Nothing external remains: the OpenProject fork is `/openproject` and the
agent-runtime sidecar is `/agent-runtime` in this repo. The app still degrades
gracefully when sidecar/OpenProject services aren't running (clear 503s).
The old `agenticopenproject` repo is retired as a source of truth.
