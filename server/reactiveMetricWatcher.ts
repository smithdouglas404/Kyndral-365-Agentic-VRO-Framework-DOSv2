import { storage } from "./storage";
import type { InsertIntervention, InsertProjectMetric, ProjectMetric } from "@shared/schema";

interface ThresholdConfig {
  metricKey: string;
  agentOwner: string;
  agentName: string;
  interventionType: 'budget' | 'timeline' | 'dependency' | 'resource' | 'quality';
  direction: 'higher_is_better' | 'lower_is_better';
  warningThreshold: number;
  criticalThreshold: number;
  suggestedAction: string;
  autonomousAction?: {
    type: 'notify' | 'escalate' | 'update-status' | 'freeze-spending';
    description: string;
  };
}

const THRESHOLD_CONFIGS: ThresholdConfig[] = [
  {
    metricKey: 'spi',
    agentOwner: 'planning',
    agentName: 'Planning Agent',
    interventionType: 'timeline',
    direction: 'higher_is_better',
    warningThreshold: 0.95,
    criticalThreshold: 0.85,
    suggestedAction: 'Re-sequence sprint backlog and reallocate resources to critical path',
    autonomousAction: { type: 'notify', description: 'Notify Scrum Masters of schedule pressure' }
  },
  {
    metricKey: 'cpi',
    agentOwner: 'finops',
    agentName: 'FinOps Agent',
    interventionType: 'budget',
    direction: 'higher_is_better',
    warningThreshold: 0.92,
    criticalThreshold: 0.80,
    suggestedAction: 'Notify Finance team and freeze non-essential spending',
    autonomousAction: { type: 'freeze-spending', description: 'Freeze discretionary spend above £5K' }
  },
  {
    metricKey: 'okr_progress',
    agentOwner: 'okr',
    agentName: 'OKR Agent',
    interventionType: 'quality',
    direction: 'higher_is_better',
    warningThreshold: 0.70,
    criticalThreshold: 0.50,
    suggestedAction: 'Accelerate key result delivery and reassign senior engineers',
    autonomousAction: { type: 'escalate', description: 'Escalate to OKR Champion for review' }
  },
  {
    metricKey: 'change_adoption',
    agentOwner: 'ocm',
    agentName: 'OCM Agent',
    interventionType: 'resource',
    direction: 'higher_is_better',
    warningThreshold: 0.75,
    criticalThreshold: 0.60,
    suggestedAction: 'Deploy change champions and increase training sessions',
    autonomousAction: { type: 'notify', description: 'Alert OCM leads of adoption gap' }
  },
  {
    metricKey: 'sprint_velocity',
    agentOwner: 'planning',
    agentName: 'Planning Agent',
    interventionType: 'dependency',
    direction: 'lower_is_better',
    warningThreshold: 0.15,
    criticalThreshold: 0.25,
    suggestedAction: 'Recalibrate sprint capacity and notify Scrum Masters',
    autonomousAction: { type: 'update-status', description: 'Update sprint forecast in planning system' }
  }
];

interface MetricBreachResult {
  breached: boolean;
  severity: 'critical' | 'high' | 'medium' | null;
  config: ThresholdConfig | null;
  changePercent: number;
}

function evaluateMetricBreach(
  metric: ProjectMetric,
  config: ThresholdConfig
): MetricBreachResult {
  const currentValue = parseFloat(metric.currentValue);
  const previousValue = metric.previousValue ? parseFloat(metric.previousValue) : currentValue;
  
  const changePercent = previousValue !== 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0;
  
  let breached = false;
  let severity: 'critical' | 'high' | 'medium' | null = null;

  if (config.direction === 'higher_is_better') {
    if (currentValue < config.criticalThreshold) {
      breached = true;
      severity = 'critical';
    } else if (currentValue < config.warningThreshold) {
      breached = true;
      severity = 'high';
    }
  } else {
    if (currentValue > config.criticalThreshold) {
      breached = true;
      severity = 'critical';
    } else if (currentValue > config.warningThreshold) {
      breached = true;
      severity = 'high';
    }
  }

  return { breached, severity, config, changePercent };
}

export async function updateMetricAndCheck(
  projectId: string,
  projectName: string,
  metricKey: string,
  newValue: number
): Promise<{ intervention: any | null; autonomousAction: any | null }> {
  const config = THRESHOLD_CONFIGS.find(c => c.metricKey === metricKey);
  if (!config) {
    console.log(`[ReactiveWatcher] No config for metric: ${metricKey}`);
    return { intervention: null, autonomousAction: null };
  }

  const existingMetrics = await storage.getProjectMetrics(projectId);
  const existingMetric = existingMetrics.find(m => m.metricKey === metricKey);
  
  const previousValue = existingMetric?.currentValue || String(newValue);
  
  const metricData: InsertProjectMetric = {
    projectId,
    projectName,
    metricKey,
    metricName: getMetricDisplayName(metricKey),
    currentValue: String(newValue),
    previousValue,
    threshold: String(config.warningThreshold),
    criticalThreshold: String(config.criticalThreshold),
    direction: config.direction,
    unit: 'decimal',
    agentOwner: config.agentOwner
  };

  const savedMetric = await storage.upsertProjectMetric(metricData);
  console.log(`[ReactiveWatcher] Metric updated: ${metricKey} = ${newValue} (was ${previousValue})`);

  const breachResult = evaluateMetricBreach(savedMetric, config);

  if (!breachResult.breached) {
    console.log(`[ReactiveWatcher] ${metricKey} within acceptable range`);
    return { intervention: null, autonomousAction: null };
  }

  console.log(`[ReactiveWatcher] BREACH DETECTED: ${metricKey} = ${newValue}, severity = ${breachResult.severity}`);

  const interventionData: InsertIntervention = {
    type: config.interventionType,
    severity: breachResult.severity!,
    title: `[AUTONOMOUS] ${getMetricDisplayName(metricKey)} ${breachResult.severity!.toUpperCase()} Alert`,
    description: `${getMetricDisplayName(metricKey)} has dropped to ${(newValue * 100).toFixed(1)}% (${breachResult.changePercent.toFixed(1)}% change). Immediate action required.`,
    projectId,
    projectName,
    confidence: breachResult.severity === 'critical' ? '0.95' : '0.85',
    suggestedAction: config.suggestedAction,
    impact: `${breachResult.severity === 'critical' ? 'Critical' : 'High'} threshold breach may impact project delivery and stakeholder commitments.`,
    status: 'pending',
    agentSource: config.agentName,
    isAutonomous: 'true',
    triggerSource: 'metric_breach'
  };

  const intervention = await storage.createIntervention(interventionData);
  console.log(`[ReactiveWatcher] Intervention created: ${intervention.id}`);

  await storage.createAgentActivityLog({
    eventType: 'detection',
    primaryAgentId: config.agentOwner,
    primaryAgentName: config.agentName,
    interventionId: intervention.id,
    summary: `Detected ${metricKey} breach: ${(newValue * 100).toFixed(1)}% (threshold: ${(config.criticalThreshold * 100).toFixed(0)}%)`,
    details: JSON.stringify({ metric: metricKey, value: newValue, threshold: config.criticalThreshold })
  });

  let autonomousActionResult = null;
  if (breachResult.severity === 'critical' && config.autonomousAction) {
    console.log(`[ReactiveWatcher] Executing autonomous action: ${config.autonomousAction.type}`);
    
    const actionIntervention: InsertIntervention = {
      type: config.interventionType,
      severity: 'medium',
      title: `[AUTONOMOUS] Action Executed: ${config.autonomousAction.type}`,
      description: `Agent ${config.agentName} automatically executed "${config.autonomousAction.description}" in response to ${metricKey} breach.`,
      projectId,
      projectName,
      confidence: '0.95',
      suggestedAction: 'Action completed automatically - no further action needed.',
      impact: 'Proactive intervention to prevent further degradation.',
      status: 'approved',
      agentSource: config.agentName,
      isAutonomous: 'true',
      triggerSource: 'metric_breach'
    };
    
    autonomousActionResult = await storage.createIntervention(actionIntervention);

    await storage.createAgentActivityLog({
      eventType: 'autonomous_action',
      primaryAgentId: config.agentOwner,
      primaryAgentName: config.agentName,
      interventionId: autonomousActionResult.id,
      summary: `Executed autonomous action: ${config.autonomousAction.description}`,
    });
    
    await storage.createAgentTask({
      assignedAgent: config.agentOwner,
      taskType: config.autonomousAction.type,
      priority: 'high',
      status: 'completed',
      targetType: 'metric',
      targetId: metricKey,
      targetName: getMetricDisplayName(metricKey),
      description: config.autonomousAction.description,
      reasoning: `Autonomous response to ${metricKey} breach (value: ${newValue}, threshold: ${config.criticalThreshold})`,
      delegatedBy: 'reactive-metric-watcher'
    });
    
    console.log(`[ReactiveWatcher] Autonomous action logged: ${config.autonomousAction.type}`);
  }

  return { intervention, autonomousAction: autonomousActionResult };
}

function getMetricDisplayName(metricKey: string): string {
  const names: Record<string, string> = {
    'spi': 'Schedule Performance Index (SPI)',
    'cpi': 'Cost Performance Index (CPI)',
    'okr_progress': 'OKR Progress',
    'change_adoption': 'Change Adoption Rate',
    'sprint_velocity': 'Sprint Velocity'
  };
  return names[metricKey] || metricKey;
}

export async function runPeriodicMetricCheck(): Promise<void> {
  console.log('[ReactiveWatcher] Running periodic metric check...');
  
  const allMetrics = await storage.getAllProjectMetrics();
  
  for (const metric of allMetrics) {
    const config = THRESHOLD_CONFIGS.find(c => c.metricKey === metric.metricKey);
    if (!config) continue;
    
    const breachResult = evaluateMetricBreach(metric, config);
    
    if (breachResult.breached) {
      const recentInterventions = await storage.getInterventions();
      const hasRecent = recentInterventions.some(i => 
        i.projectId === metric.projectId &&
        i.title.includes(getMetricDisplayName(metric.metricKey)) &&
        new Date(i.createdAt!).getTime() > Date.now() - 5 * 60 * 1000
      );
      
      if (!hasRecent) {
        console.log(`[ReactiveWatcher] Periodic check found breach: ${metric.metricKey} on ${metric.projectName}`);
        await updateMetricAndCheck(
          metric.projectId,
          metric.projectName,
          metric.metricKey,
          parseFloat(metric.currentValue)
        );
      }
    }
  }
}

export function getThresholdConfigs(): ThresholdConfig[] {
  return THRESHOLD_CONFIGS;
}
