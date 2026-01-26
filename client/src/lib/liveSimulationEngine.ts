// ============================================================================
// LIVE SIMULATION ENGINE - STUBBED
// Real-time updates should come from WebSocket/SSE connection to backend
// ============================================================================

import type { PMOProject } from './buPrograms';
import type { SimulationEvent } from './liveSimulation';

// Re-export for backward compatibility
export { useSimulation } from '../contexts/SimulationContext';

// DEPRECATED: Use WebSocket connection to backend for live updates
export function applyLiveUpdates(projects: PMOProject[]): PMOProject[] {
  // Return projects unchanged
  return projects;
}

// DEPRECATED: Use WebSocket connection to backend for live events
export function generateLiveEvent(): SimulationEvent | null {
  return null;
}

// DEPRECATED: Use WebSocket connection to backend
export function getLiveMetrics() {
  return {
    totalProjects: 0,
    activeAlerts: 0,
    averageConfidence: 0,
    lastUpdateTime: new Date()
  };
}
