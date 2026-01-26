// ============================================================================
// LIVE SIMULATION - STUBBED
// Real-time events should come from WebSocket/SSE connection to backend
// ============================================================================

export type SimulationEventType =
  | 'ai_alert'
  | 'risk_warning'
  | 'opportunity'
  | 'prediction'
  | 'safe_anomaly'
  | 'value_milestone'
  | 'action_required';

export type EventPriority = 'critical' | 'high' | 'medium' | 'low';

export interface SimulationEvent {
  id: string;
  type: SimulationEventType;
  priority: EventPriority;
  timestamp: Date;
  title: string;
  message: string;
  detail: string;
  confidence: number;
  source: string;
  relatedEntity?: {
    type: 'project' | 'program' | 'portfolio' | 'risk';
    id: string;
    name: string;
    bu: string;
  };
  metrics?: {
    impact: string;
    timeframe: string;
    value?: string;
  };
  actions?: {
    id: string;
    label: string;
    type: 'mitigate' | 'accelerate' | 'investigate' | 'escalate';
  }[];
  citations?: string[];
  read: boolean;
}

// DEPRECATED: Use WebSocket connection to backend for real-time events
export function generateRandomEvent(): SimulationEvent {
  return {
    id: `evt-${Date.now()}`,
    type: 'ai_alert',
    priority: 'low',
    timestamp: new Date(),
    title: 'No events',
    message: 'Connect to backend for real-time events',
    detail: 'Use WebSocket or SSE for live agent updates',
    confidence: 0,
    source: 'System',
    read: false
  };
}

// DEPRECATED: Use WebSocket connection to backend
export function getLatestEvents(count: number = 10): SimulationEvent[] {
  return [];
}

// DEPRECATED: Use WebSocket connection to backend
export function getAllEvents(): SimulationEvent[] {
  return [];
}

// DEPRECATED: Use WebSocket connection to backend
export function clearAllEvents(): void {
  // No-op
}

// DEPRECATED: Use WebSocket connection to backend
export function startSimulation(): void {
  console.warn('Simulation is deprecated. Use WebSocket connection to backend for real-time events.');
}

// DEPRECATED: Use WebSocket connection to backend
export function stopSimulation(): void {
  // No-op
}

// DEPRECATED: Use WebSocket connection to backend
export const simulationEngine = {
  start: startSimulation,
  stop: stopSimulation,
  generateEvent: generateRandomEvent,
  getLatest: getLatestEvents,
  getAll: getAllEvents,
  clear: clearAllEvents
};
