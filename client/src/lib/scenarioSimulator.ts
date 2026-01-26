// ============================================================================
// SCENARIO SIMULATOR - STUBBED
// Real scenarios should come from actual agent actions via backend
// ============================================================================

import { toast } from 'sonner';
import { notifyAction } from './backgroundAgentMonitor';
import { recordMemory, delegateTask, addTaskToQueue } from './agentOrchestrator';
import type { AgentType } from './dataHub';

export interface SimulatedScenario {
  id: string;
  domain: 'governance' | 'ocm' | 'financial' | 'delivery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  agentId: AgentType;
  agentAction: string;
  impact: string;
  timestamp: Date;
}

export interface ScenarioTemplate {
  domain: 'governance' | 'ocm' | 'financial' | 'delivery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  titleTemplate: string;
  descriptionTemplate: string;
  agentId: AgentType;
  actionTemplate: string;
  impactTemplate: string;
}

// DEPRECATED: Use real agent actions from backend
export async function simulateRandomScenario(): Promise<SimulatedScenario | null> {
  console.warn('Scenario simulation is deprecated. Use real agent actions from backend.');
  return null;
}

// DEPRECATED: Use real agent actions from backend
export async function simulateGovernanceScenario(): Promise<SimulatedScenario | null> {
  return null;
}

// DEPRECATED: Use real agent actions from backend
export async function simulateOCMScenario(): Promise<SimulatedScenario | null> {
  return null;
}

// DEPRECATED: Use real agent actions from backend
export async function simulateFinancialScenario(): Promise<SimulatedScenario | null> {
  return null;
}

// DEPRECATED: Use real agent actions from backend
export async function simulateDeliveryScenario(): Promise<SimulatedScenario | null> {
  return null;
}

// DEPRECATED: Use real agent actions from backend
export function getAllScenarios(): SimulatedScenario[] {
  return [];
}

// DEPRECATED: Use real agent actions from backend
export function clearScenarios(): void {
  // No-op
}

// DEPRECATED: Use real agent actions from backend
export function startScenarioSimulation(): void {
  console.warn('Scenario simulation is deprecated. Use real agent actions from backend.');
}

// DEPRECATED: Use real agent actions from backend
export function stopScenarioSimulation(): void {
  // No-op
}
