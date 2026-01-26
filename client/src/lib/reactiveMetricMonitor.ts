import { emitAgentIntervention, NewIntervention } from './commandCenterBridge';
import { executeAction, ActionType } from './agentActionEngine';
import { notifyAction } from './backgroundAgentMonitor';

export interface MetricThreshold {
  metricId: string;
  metricName: string;
  projectId: string;
  projectName: string;
  warningThreshold: number;
  criticalThreshold: number;
  direction: 'above' | 'below';
  agentOwner: string;
  interventionType: 'dependency' | 'budget' | 'timeline' | 'resource' | 'quality';
  isPercentage: boolean;
  autonomousAction?: AutonomousAction;
}

export interface AutonomousAction {
  actionType: ActionType;
  description: string;
  requiresApproval: boolean;
}

export interface MetricChangeEvent {
  metricId: string;
  previousValue: number;
  currentValue: number;
  timestamp: Date;
}

const metricThresholds: Map<string, MetricThreshold> = new Map();
const metricHistory: Map<string, number[]> = new Map();
const autonomousActionsLog: { timestamp: Date; action: string; result: string }[] = [];

export function registerMetricThreshold(threshold: MetricThreshold): void {
  metricThresholds.set(threshold.metricId, threshold);
  console.log(`[ReactiveMonitor] Registered threshold for ${threshold.metricName}: ${threshold.direction} ${threshold.criticalThreshold}`);
}

export function updateMetricValue(metricId: string, newValue: number): MetricChangeEvent | null {
  const history = metricHistory.get(metricId) || [];
  const previousValue = history.length > 0 ? history[history.length - 1] : newValue;
  
  history.push(newValue);
  if (history.length > 10) history.shift();
  metricHistory.set(metricId, history);
  
  const event: MetricChangeEvent = {
    metricId,
    previousValue,
    currentValue: newValue,
    timestamp: new Date()
  };
  
  evaluateThreshold(event);
  
  return event;
}

async function evaluateThreshold(event: MetricChangeEvent): Promise<void> {
  const threshold = metricThresholds.get(event.metricId);
  if (!threshold) return;
  
  let breachLevel: 'none' | 'warning' | 'critical' = 'none';
  
  if (threshold.direction === 'below') {
    if (event.currentValue < threshold.criticalThreshold) {
      breachLevel = 'critical';
    } else if (event.currentValue < threshold.warningThreshold) {
      breachLevel = 'warning';
    }
  } else {
    if (event.currentValue > threshold.criticalThreshold) {
      breachLevel = 'critical';
    } else if (event.currentValue > threshold.warningThreshold) {
      breachLevel = 'warning';
    }
  }
  
  if (breachLevel !== 'none') {
    console.log(`[ReactiveMonitor] THRESHOLD BREACH: ${threshold.metricName} = ${event.currentValue} (${breachLevel})`);
    
    const intervention = await createInterventionFromBreach(threshold, event, breachLevel);
    
    if (threshold.autonomousAction && !threshold.autonomousAction.requiresApproval) {
      await executeAutonomousAction(threshold, event, intervention);
    }
  }
}

async function createInterventionFromBreach(
  threshold: MetricThreshold, 
  event: MetricChangeEvent,
  breachLevel: 'warning' | 'critical'
): Promise<NewIntervention> {
  const changeDirection = event.currentValue < event.previousValue ? 'decreased' : 'increased';
  const changePct = Math.abs(((event.currentValue - event.previousValue) / Math.max(event.previousValue, 0.01)) * 100).toFixed(1);
  
  // Format value display based on whether it's a percentage or index
  const displayValue = threshold.isPercentage 
    ? `${(event.currentValue * 100).toFixed(1)}%`
    : event.currentValue.toFixed(2);
  
  const intervention: NewIntervention = {
    type: threshold.interventionType,
    severity: breachLevel === 'critical' ? 'critical' : 'high',
    title: `${threshold.metricName} ${breachLevel.toUpperCase()} Alert`,
    description: `${threshold.metricName} has ${changeDirection} to ${displayValue} (${changePct}% change). ${breachLevel === 'critical' ? 'Immediate action required.' : 'Monitoring closely.'}`,
    projectId: threshold.projectId,
    projectName: threshold.projectName,
    confidence: breachLevel === 'critical' ? 95 : 82,
    suggestedAction: threshold.autonomousAction?.description || 'Review metric and take corrective action.',
    impact: breachLevel === 'critical' 
      ? 'Critical threshold breach may impact project delivery and stakeholder commitments.'
      : 'Warning threshold indicates potential risk if trend continues.',
    agentSource: threshold.agentOwner
  };
  
  try {
    const result = await emitAgentIntervention(intervention);
    console.log(`[ReactiveMonitor] Intervention created:`, result);
  } catch (error) {
    console.error('[ReactiveMonitor] Failed to emit intervention:', error);
  }
  
  return intervention;
}

async function executeAutonomousAction(
  threshold: MetricThreshold,
  event: MetricChangeEvent,
  intervention: NewIntervention
): Promise<void> {
  const action = threshold.autonomousAction!;
  
  console.log(`[ReactiveMonitor] EXECUTING AUTONOMOUS ACTION: ${action.actionType}`);
  
  executeAction(
    threshold.agentOwner as any,
    action.actionType,
    'metric',
    threshold.metricId,
    threshold.metricName,
    action.description,
    90
  );
  
  notifyAction(
    threshold.agentOwner as any,
    action.actionType,
    `${threshold.projectName}: ${threshold.metricName}`
  );
  
  autonomousActionsLog.push({
    timestamp: new Date(),
    action: `${action.actionType} on ${threshold.metricName}`,
    result: 'Executed automatically due to threshold breach'
  });
  
  await emitAgentIntervention({
    type: threshold.interventionType,
    severity: 'medium',
    title: `Autonomous Action Executed: ${action.actionType}`,
    description: `Agent ${threshold.agentOwner} automatically executed "${action.description}" in response to ${threshold.metricName} breach.`,
    projectId: threshold.projectId,
    projectName: threshold.projectName,
    confidence: 95,
    suggestedAction: 'Action completed automatically - no further action needed.',
    impact: 'Proactive intervention to prevent further degradation.',
    agentSource: threshold.agentOwner
  });
}

export function initializeDefaultThresholds(): void {
  const defaultThresholds: MetricThreshold[] = [
    {
      metricId: 'schedule-performance',
      metricName: 'Schedule Performance Index (SPI)',
      projectId: 'nee-fpl-004',
      projectName: 'Regional Utility Storm Protection Plan',
      warningThreshold: 0.95,
      criticalThreshold: 0.85,
      direction: 'below',
      agentOwner: 'TMO Agent',
      interventionType: 'timeline',
      isPercentage: false,
      autonomousAction: {
        actionType: 'escalate',
        description: 'Auto-escalate to Program Director and request resource reallocation',
        requiresApproval: false
      }
    },
    {
      metricId: 'cost-performance',
      metricName: 'Cost Performance Index (CPI)',
      projectId: 'nee-fpl-001',
      projectName: 'Regional Utility Grid Modernization & Automation',
      warningThreshold: 0.92,
      criticalThreshold: 0.80,
      direction: 'below',
      agentOwner: 'FinOps Agent',
      interventionType: 'budget',
      isPercentage: false,
      autonomousAction: {
        actionType: 'notify',
        description: 'Notify Finance team and freeze non-essential spending',
        requiresApproval: false
      }
    },
    {
      metricId: 'okr-progress',
      metricName: 'OKR Progress Rate',
      projectId: 'proj-strategic-okr',
      projectName: 'Strategic OKR Program',
      warningThreshold: 0.70,
      criticalThreshold: 0.50,
      direction: 'below',
      agentOwner: 'OKR Agent',
      interventionType: 'quality',
      isPercentage: true,
      autonomousAction: {
        actionType: 'update-status',
        description: 'Automatically adjust Key Result targets and notify stakeholders',
        requiresApproval: true
      }
    },
    {
      metricId: 'change-adoption',
      metricName: 'Change Adoption Rate',
      projectId: 'proj-change-management',
      projectName: 'Organizational Change Program',
      warningThreshold: 0.65,
      criticalThreshold: 0.45,
      direction: 'below',
      agentOwner: 'OCM Agent',
      interventionType: 'resource',
      isPercentage: true,
      autonomousAction: {
        actionType: 'notify',
        description: 'Trigger additional change champion engagement and survey',
        requiresApproval: false
      }
    },
    {
      metricId: 'sprint-velocity',
      metricName: 'Sprint Velocity Variance',
      projectId: 'proj-agile-delivery',
      projectName: 'Agile Delivery Program',
      warningThreshold: 15,
      criticalThreshold: 25,
      direction: 'above',
      agentOwner: 'Planning Agent',
      interventionType: 'dependency',
      isPercentage: false,
      autonomousAction: {
        actionType: 'update-status',
        description: 'Recalibrate sprint capacity and notify Scrum Masters',
        requiresApproval: false
      }
    }
  ];
  
  defaultThresholds.forEach(registerMetricThreshold);
  console.log(`[ReactiveMonitor] Initialized ${defaultThresholds.length} default metric thresholds`);
}

export function simulateMetricChange(metricId: string, newValue: number): void {
  console.log(`[ReactiveMonitor] Simulating metric change: ${metricId} = ${newValue}`);
  updateMetricValue(metricId, newValue);
}

export function getAutonomousActionsLog(): typeof autonomousActionsLog {
  return [...autonomousActionsLog];
}

export function getRegisteredThresholds(): MetricThreshold[] {
  return Array.from(metricThresholds.values());
}
