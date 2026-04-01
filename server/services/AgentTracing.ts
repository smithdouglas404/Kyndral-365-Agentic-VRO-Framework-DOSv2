import type { IStorage } from '../storage.js';

export interface TraceEvent {
  id: string;
  traceId: string;
  agentKey: string;
  eventType: 'tool-call' | 'tool-result' | 'agent-start' | 'agent-end' | 'error' | 'a2a-message' | 'fact-broadcast' | 'rule-evaluation';
  toolId?: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  durationMs?: number;
  tokenUsage?: { input: number; output: number; total: number };
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AgentMetrics {
  agentKey: string;
  totalInvocations: number;
  totalErrors: number;
  avgDurationMs: number;
  totalTokensUsed: number;
  toolBreakdown: Record<string, { calls: number; errors: number; avgDurationMs: number }>;
  lastActivity: Date | null;
  uptime: number;
}

const MAX_TRACE_BUFFER = 5000;
const MAX_METRICS_WINDOW = 24 * 60 * 60 * 1000;

let traceBuffer: TraceEvent[] = [];
let metricsAccumulator: Map<string, {
  invocations: number;
  errors: number;
  totalDuration: number;
  totalTokens: number;
  toolStats: Map<string, { calls: number; errors: number; totalDuration: number }>;
  lastActivity: Date | null;
  startTime: Date;
}> = new Map();

let tracingEnabled = true;
let storageRef: IStorage | null = null;

function generateId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTraceId(): string {
  return `tid-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function initTracing(storage: IStorage) {
  storageRef = storage;
  console.log('[AgentTracing] Initialized');
}

export function setTracingEnabled(enabled: boolean) {
  tracingEnabled = enabled;
}

export function isTracingEnabled(): boolean {
  return tracingEnabled;
}

function getOrCreateMetrics(agentKey: string) {
  if (!metricsAccumulator.has(agentKey)) {
    metricsAccumulator.set(agentKey, {
      invocations: 0,
      errors: 0,
      totalDuration: 0,
      totalTokens: 0,
      toolStats: new Map(),
      lastActivity: null,
      startTime: new Date(),
    });
  }
  return metricsAccumulator.get(agentKey)!;
}

export function recordTrace(event: Omit<TraceEvent, 'id' | 'timestamp'>): TraceEvent {
  if (!tracingEnabled) return { ...event, id: '', timestamp: new Date() };

  const fullEvent: TraceEvent = {
    ...event,
    id: generateId(),
    timestamp: new Date(),
  };

  traceBuffer.push(fullEvent);
  if (traceBuffer.length > MAX_TRACE_BUFFER) {
    traceBuffer = traceBuffer.slice(-MAX_TRACE_BUFFER);
  }

  const metrics = getOrCreateMetrics(event.agentKey);
  metrics.lastActivity = fullEvent.timestamp;

  if (event.eventType === 'agent-start') {
    metrics.invocations++;
  }
  if (event.eventType === 'agent-end' && event.durationMs) {
    metrics.totalDuration += event.durationMs;
  }
  if (event.eventType === 'error') {
    metrics.errors++;
  }
  if (event.tokenUsage) {
    metrics.totalTokens += event.tokenUsage.total;
  }
  if (event.eventType === 'tool-call' && event.toolId) {
    const toolKey = event.toolId;
    if (!metrics.toolStats.has(toolKey)) {
      metrics.toolStats.set(toolKey, { calls: 0, errors: 0, totalDuration: 0 });
    }
    metrics.toolStats.get(toolKey)!.calls++;
  }
  if (event.eventType === 'tool-result' && event.toolId) {
    const stats = metrics.toolStats.get(event.toolId);
    if (stats && event.durationMs) {
      stats.totalDuration += event.durationMs;
    }
  }
  if (event.eventType === 'error' && event.toolId) {
    const stats = metrics.toolStats.get(event.toolId);
    if (stats) stats.errors++;
  }

  return fullEvent;
}

export function startTrace(agentKey: string, metadata?: Record<string, any>): string {
  const traceId = generateTraceId();
  recordTrace({
    traceId,
    agentKey,
    eventType: 'agent-start',
    metadata,
  });
  return traceId;
}

export function endTrace(traceId: string, agentKey: string, durationMs: number, tokenUsage?: TraceEvent['tokenUsage'], metadata?: Record<string, any>) {
  recordTrace({
    traceId,
    agentKey,
    eventType: 'agent-end',
    durationMs,
    tokenUsage,
    metadata,
  });
}

export function recordToolCall(traceId: string, agentKey: string, toolId: string, input?: Record<string, any>) {
  recordTrace({
    traceId,
    agentKey,
    eventType: 'tool-call',
    toolId,
    input,
  });
}

export function recordToolResult(traceId: string, agentKey: string, toolId: string, output?: Record<string, any>, durationMs?: number) {
  recordTrace({
    traceId,
    agentKey,
    eventType: 'tool-result',
    toolId,
    output,
    durationMs,
  });
}

export function recordError(traceId: string, agentKey: string, error: string, toolId?: string) {
  recordTrace({
    traceId,
    agentKey,
    eventType: 'error',
    error,
    toolId,
  });
}

export function recordA2AMessage(traceId: string, agentKey: string, messageType: string, metadata?: Record<string, any>) {
  recordTrace({
    traceId,
    agentKey,
    eventType: 'a2a-message',
    metadata: { messageType, ...metadata },
  });
}

export function recordFactBroadcast(traceId: string, agentKey: string, factType: string, metadata?: Record<string, any>) {
  recordTrace({
    traceId,
    agentKey,
    eventType: 'fact-broadcast',
    metadata: { factType, ...metadata },
  });
}

export function recordRuleEvaluation(traceId: string, agentKey: string, ruleId: string, result: string, metadata?: Record<string, any>) {
  recordTrace({
    traceId,
    agentKey,
    eventType: 'rule-evaluation',
    metadata: { ruleId, result, ...metadata },
  });
}

export function getAgentMetrics(agentKey?: string): AgentMetrics[] {
  const results: AgentMetrics[] = [];
  const entries = agentKey
    ? [[agentKey, metricsAccumulator.get(agentKey)] as const].filter(([, v]) => v)
    : Array.from(metricsAccumulator.entries());

  for (const [key, acc] of entries) {
    if (!acc) continue;
    const toolBreakdown: Record<string, { calls: number; errors: number; avgDurationMs: number }> = {};
    for (const [toolId, stats] of acc.toolStats) {
      toolBreakdown[toolId] = {
        calls: stats.calls,
        errors: stats.errors,
        avgDurationMs: stats.calls > 0 ? Math.round(stats.totalDuration / stats.calls) : 0,
      };
    }

    results.push({
      agentKey: key as string,
      totalInvocations: acc.invocations,
      totalErrors: acc.errors,
      avgDurationMs: acc.invocations > 0 ? Math.round(acc.totalDuration / acc.invocations) : 0,
      totalTokensUsed: acc.totalTokens,
      toolBreakdown,
      lastActivity: acc.lastActivity,
      uptime: Date.now() - acc.startTime.getTime(),
    });
  }

  return results;
}

export function getTraces(options?: {
  agentKey?: string;
  traceId?: string;
  eventType?: TraceEvent['eventType'];
  limit?: number;
  since?: Date;
}): TraceEvent[] {
  let filtered = [...traceBuffer];

  if (options?.agentKey) {
    filtered = filtered.filter(e => e.agentKey === options.agentKey);
  }
  if (options?.traceId) {
    filtered = filtered.filter(e => e.traceId === options.traceId);
  }
  if (options?.eventType) {
    filtered = filtered.filter(e => e.eventType === options.eventType);
  }
  if (options?.since) {
    filtered = filtered.filter(e => e.timestamp >= options.since!);
  }

  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function getTraceSummary(): {
  totalTraces: number;
  activeAgents: number;
  totalErrors: number;
  tracesByType: Record<string, number>;
  recentErrors: TraceEvent[];
  systemUptime: number;
} {
  const tracesByType: Record<string, number> = {};
  let totalErrors = 0;
  const recentErrors: TraceEvent[] = [];
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  for (const event of traceBuffer) {
    tracesByType[event.eventType] = (tracesByType[event.eventType] || 0) + 1;
    if (event.eventType === 'error') {
      totalErrors++;
      if (event.timestamp >= fiveMinAgo) {
        recentErrors.push(event);
      }
    }
  }

  let earliestStart = Date.now();
  for (const [, acc] of metricsAccumulator) {
    if (acc.startTime.getTime() < earliestStart) {
      earliestStart = acc.startTime.getTime();
    }
  }

  return {
    totalTraces: traceBuffer.length,
    activeAgents: metricsAccumulator.size,
    totalErrors,
    tracesByType,
    recentErrors: recentErrors.slice(-10),
    systemUptime: Date.now() - earliestStart,
  };
}

export function clearTraces(agentKey?: string) {
  if (agentKey) {
    traceBuffer = traceBuffer.filter(e => e.agentKey !== agentKey);
    metricsAccumulator.delete(agentKey);
  } else {
    traceBuffer = [];
    metricsAccumulator = new Map();
  }
}
