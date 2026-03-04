# Orchestrator Startup Optimization Plan

## Problem Statement

When the orchestrator is enabled, it fires AI agent scans immediately during startup before the server is fully ready. This causes:
- Memory exhaustion (scans + Vite + routes + seeds all loading simultaneously)
- Server crashes/hangs
- Poor user experience

## Solution Components

### 1. Delayed Start (Priority: HIGH)
**File:** `server/services/OrchestratorService.ts`

Add configurable delay after server initialization:
- Default: 60 seconds after server ready
- Configurable via `ORCHESTRATOR_STARTUP_DELAY_MS` env var
- Prevents scans during critical startup phase

```typescript
const STARTUP_DELAY_MS = parseInt(process.env.ORCHESTRATOR_STARTUP_DELAY_MS || '60000');
```

### 2. Startup Gate (Priority: HIGH)
**File:** `server/services/ServerReadyService.ts`

Create a service that tracks server readiness:
- Port bound and listening
- Vite initialized (dev mode)
- Database connected
- Initial seeds complete
- MCP services initialized

```typescript
interface ServerReadyState {
  portBound: boolean;
  viteReady: boolean;
  dbConnected: boolean;
  seedsComplete: boolean;
  mcpReady: boolean;
  fullyReady: boolean;
}
```

### 3. Sequential Scans with Queue (Priority: HIGH)
**File:** `server/services/OrchestratorService.ts`

Enforce one agent scan at a time:
- Use a queue for pending scans
- Process queue sequentially
- Add timeout per scan (default: 5 minutes)
- Skip if previous scan still running

```typescript
interface ScanQueue {
  pending: AgentScanRequest[];
  currentScan: AgentScanRequest | null;
  isProcessing: boolean;
}
```

### 4. Memory-Aware Throttling (Priority: MEDIUM)
**File:** `server/services/MemoryMonitorService.ts`

Check memory before starting scans:
- Get current heap usage via `process.memoryUsage()`
- Define threshold (e.g., 80% of heap limit)
- Defer scan if above threshold
- Log warnings when approaching limits

```typescript
const MEMORY_THRESHOLD_PERCENT = 80;
const heapUsed = process.memoryUsage().heapUsed;
const heapTotal = process.memoryUsage().heapTotal;
const usagePercent = (heapUsed / heapTotal) * 100;
```

### 5. Centralized Orchestrator Config (Priority: MEDIUM)
**File:** `server/services/OrchestratorConfig.ts`

Single source for all orchestrator settings:
- Startup delay
- Scan interval
- Memory thresholds
- Max concurrent scans (always 1)
- Scan timeout
- Retry settings

## Implementation Order

1. **OrchestratorConfig.ts** - Centralized settings
2. **ServerReadyService.ts** - Ready state tracking
3. **MemoryMonitorService.ts** - Memory checks
4. **OrchestratorService.ts** - Main orchestrator with all safeguards
5. **Update syncScheduler.ts** - Integrate new services
6. **Update server/index.ts** - Emit ready signals

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `server/services/OrchestratorConfig.ts` | CREATE | Centralized config |
| `server/services/ServerReadyService.ts` | CREATE | Ready state tracking |
| `server/services/MemoryMonitorService.ts` | CREATE | Memory monitoring |
| `server/services/OrchestratorService.ts` | CREATE | Main orchestrator |
| `server/syncScheduler.ts` | UPDATE | Use new orchestrator |
| `server/index.ts` | UPDATE | Emit ready signals |

## Environment Variables

```bash
ORCHESTRATOR_ENABLED=true
ORCHESTRATOR_STARTUP_DELAY_MS=60000
ORCHESTRATOR_SCAN_INTERVAL_MS=300000
ORCHESTRATOR_SCAN_TIMEOUT_MS=300000
ORCHESTRATOR_MEMORY_THRESHOLD_PERCENT=80
```

## Testing Checklist

- [ ] Server starts without orchestrator overwhelming it
- [ ] Orchestrator waits for server ready signal
- [ ] Orchestrator waits for startup delay
- [ ] Only one scan runs at a time
- [ ] Scans deferred when memory high
- [ ] Graceful handling of scan timeouts
- [ ] Logs show proper startup sequence
