/**
 * AGENT CONFIGURATION PANEL
 *
 * Professional admin interface for configuring all 9 AI agents
 * - Enable/disable agents with toggles
 * - Set scan intervals with dropdowns
 * - Configure autonomy levels (Full/Supervised)
 * - Agent-specific threshold settings
 * - Real-time status monitoring
 */

import { AdminLayout } from '@/components/AdminLayout';
import { ConfigurationStatus } from '@/components/ConfigurationStatus';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Brain,
  DollarSign,
  Clock,
  Shield,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  Power,
  Play,
  Pause,
  Activity,
  Sliders,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AgentConfigModal } from '@/components/AgentConfigModal';

interface AgentConfig {
  id: string;
  name: string;
  enabled: boolean;
  scanInterval: number; // in minutes
  autonomyLevel: 'full' | 'supervised';
  lastRun?: string;
  status: 'idle' | 'running' | 'error';
  config: Record<string, any>; // Agent-specific settings
}

interface ConfigField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'boolean';
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

interface AgentDefinition {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  defaultInterval: number;
  configFields: ConfigField[];
}

const agentDefinitions = [
  {
    id: 'finops',
    name: 'FinOps Agent',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    description: 'Financial optimization and cost management',
    defaultInterval: 60,
    configFields: [
      { key: 'cpiWarning', label: 'CPI Warning Threshold', type: 'number', default: 0.9, min: 0, max: 1, step: 0.1 },
      { key: 'cpiCritical', label: 'CPI Critical Threshold', type: 'number', default: 0.8, min: 0, max: 1, step: 0.1 },
      { key: 'budgetVariancePercent', label: 'Budget Variance % Limit', type: 'number', default: 10, min: 0, max: 50, step: 5 },
      { key: 'costReallocationLimit', label: 'Cost Reallocation Limit ($)', type: 'number', default: 50000, min: 0, max: 1000000, step: 10000 },
    ],
  },
  {
    id: 'tmo',
    name: 'TMO Agent',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    description: 'Schedule management and timeline optimization',
    defaultInterval: 30,
    configFields: [
      { key: 'spiWarning', label: 'SPI Warning Threshold', type: 'number', default: 0.9, min: 0, max: 1, step: 0.1 },
      { key: 'spiCritical', label: 'SPI Critical Threshold', type: 'number', default: 0.8, min: 0, max: 1, step: 0.1 },
      { key: 'sprintVelocityTarget', label: 'Sprint Velocity Target', type: 'number', default: 80, min: 0, max: 200, step: 10 },
      { key: 'delayToleranceDays', label: 'Delay Tolerance (Days)', type: 'number', default: 7, min: 0, max: 90, step: 1 },
    ],
  },
  {
    id: 'risk',
    name: 'Risk Agent',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    description: 'Risk identification and mitigation',
    defaultInterval: 60,
    configFields: [
      { key: 'riskScoreWarning', label: 'Risk Score Warning', type: 'number', default: 70, min: 0, max: 100, step: 5 },
      { key: 'riskScoreCritical', label: 'Risk Score Critical', type: 'number', default: 85, min: 0, max: 100, step: 5 },
      { key: 'escalationThreshold', label: 'Escalation Threshold', type: 'number', default: 80, min: 0, max: 100, step: 5 },
      { key: 'mitigationDeadlineDays', label: 'Mitigation Deadline (Days)', type: 'number', default: 14, min: 1, max: 90, step: 1 },
    ],
  },
  {
    id: 'vro',
    name: 'VRO Agent',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    description: 'Value realization and benefits tracking',
    defaultInterval: 120,
    configFields: [
      { key: 'valueRealizationTarget', label: 'Value Realization Target (%)', type: 'number', default: 80, min: 0, max: 100, step: 5 },
      { key: 'benefitTrackingFrequencyDays', label: 'Benefit Tracking Frequency (Days)', type: 'number', default: 30, min: 7, max: 90, step: 7 },
      { key: 'roiThreshold', label: 'ROI Threshold (%)', type: 'number', default: 15, min: 0, max: 100, step: 5 },
      { key: 'benefitDeliveryVariance', label: 'Benefit Delivery Variance (%)', type: 'number', default: 20, min: 0, max: 50, step: 5 },
    ],
  },
  {
    id: 'governance',
    name: 'Governance Agent',
    icon: CheckCircle2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    description: 'Compliance and policy enforcement',
    defaultInterval: 60,
    configFields: [
      { key: 'complianceCheckFrequencyHours', label: 'Compliance Check Frequency (Hours)', type: 'number', default: 24, min: 1, max: 168, step: 1 },
      { key: 'policyViolationSeverity', label: 'Policy Violation Severity (1-5)', type: 'number', default: 3, min: 1, max: 5, step: 1 },
      { key: 'auditTrailRetentionDays', label: 'Audit Trail Retention (Days)', type: 'number', default: 365, min: 90, max: 2555, step: 30 },
    ],
  },
  {
    id: 'planning',
    name: 'Planning Agent',
    icon: Calendar,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    description: 'Resource planning and dependency management',
    defaultInterval: 60,
    configFields: [
      { key: 'dependencyScanDepth', label: 'Dependency Scan Depth', type: 'number', default: 3, min: 1, max: 10, step: 1 },
      { key: 'resourceConflictSensitivity', label: 'Resource Conflict Sensitivity (1-5)', type: 'number', default: 3, min: 1, max: 5, step: 1 },
      { key: 'capacityBufferPercent', label: 'Capacity Buffer (%)', type: 'number', default: 20, min: 0, max: 50, step: 5 },
    ],
  },
  {
    id: 'ocm',
    name: 'OCM Agent',
    icon: Users,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    description: 'Organizational change management',
    defaultInterval: 120,
    configFields: [
      { key: 'changeReadinessThreshold', label: 'Change Readiness Threshold (%)', type: 'number', default: 70, min: 0, max: 100, step: 5 },
      { key: 'stakeholderEngagementScore', label: 'Stakeholder Engagement Score Target', type: 'number', default: 80, min: 0, max: 100, step: 5 },
      { key: 'resistanceLevel', label: 'Resistance Level Alert', type: 'number', default: 40, min: 0, max: 100, step: 5 },
      { key: 'communicationFrequencyDays', label: 'Communication Frequency (Days)', type: 'number', default: 14, min: 1, max: 90, step: 7 },
    ],
  },
  {
    id: 'integrated',
    name: 'Integrated Mgmt Agent',
    icon: Activity,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
    description: 'Cross-agent collaboration and orchestration',
    defaultInterval: 30,
    configFields: [
      { key: 'crossAgentTriggerThreshold', label: 'Cross-Agent Trigger Threshold', type: 'number', default: 75, min: 0, max: 100, step: 5 },
      { key: 'qualityGateMinScore', label: 'Quality Gate Minimum Score', type: 'number', default: 80, min: 0, max: 100, step: 5 },
      { key: 'collaborationFrequency', label: 'Collaboration Check Frequency (Min)', type: 'number', default: 15, min: 5, max: 120, step: 5 },
    ],
  },
  {
    id: 'okr',
    name: 'OKR Inference Agent',
    icon: Brain,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900/20',
    description: 'OKR tracking and strategic alignment',
    defaultInterval: 120,
    configFields: [
      { key: 'confidenceThreshold', label: 'Confidence Threshold (%)', type: 'number', default: 75, min: 0, max: 100, step: 5 },
      { key: 'alignmentScoringWeight', label: 'Alignment Scoring Weight', type: 'number', default: 0.6, min: 0, max: 1, step: 0.1 },
      { key: 'keyResultProgressWarning', label: 'Key Result Progress Warning (%)', type: 'number', default: 50, min: 0, max: 100, step: 10 },
      { key: 'objectiveRiskThreshold', label: 'Objective Risk Threshold', type: 'number', default: 70, min: 0, max: 100, step: 5 },
    ],
  },
];

const scanIntervalOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
];

export default function AgentConfiguration() {
  const [configuringAgent, setConfiguringAgent] = useState<typeof agentDefinitions[0] | null>(null);
  const queryClient = useQueryClient();

  // Fetch agent configurations
  const { data: configs, isLoading } = useQuery({
    queryKey: ['agent-configs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agent-config');
      if (!res.ok) throw new Error('Failed to fetch agent configurations');
      return res.json();
    },
  });

  // Update agent configuration
  const updateMutation = useMutation({
    mutationFn: async ({ agentId, updates }: { agentId: string; updates: Partial<AgentConfig> }) => {
      const res = await fetch(`/api/admin/agent-config/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update agent configuration');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
    },
  });

  const handleToggleAgent = (agentId: string, enabled: boolean) => {
    updateMutation.mutate({ agentId, updates: { enabled } });
  };

  const handleUpdateInterval = (agentId: string, scanInterval: number) => {
    updateMutation.mutate({ agentId, updates: { scanInterval } });
  };

  const handleUpdateAutonomy = (agentId: string, autonomyLevel: 'full' | 'supervised') => {
    updateMutation.mutate({ agentId, updates: { autonomyLevel } });
  };

  const getAgentConfig = (agentId: string): AgentConfig | undefined => {
    return configs?.agents?.find((a: AgentConfig) => a.id === agentId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Agent Configuration</h1>
            </div>
            <p className="text-muted-foreground">
              Configure and manage all AI agents for your portfolio
            </p>
          </div>

          <Button variant="outline" className="gap-2">
            <Activity className="w-4 h-4" />
            View Agent Activity
          </Button>
        </div>

        {/* Configuration Status */}
        <ConfigurationStatus variant="inline" />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Agents</p>
                  <p className="text-2xl font-bold">{agentDefinitions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Play className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">
                    {configs?.agents?.filter((a: AgentConfig) => a.enabled).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                  <Pause className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disabled</p>
                  <p className="text-2xl font-bold">
                    {configs?.agents?.filter((a: AgentConfig) => !a.enabled).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Running</p>
                  <p className="text-2xl font-bold">
                    {configs?.agents?.filter((a: AgentConfig) => a.status === 'running').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentDefinitions.map((agent) => {
              const config = getAgentConfig(agent.id);
              const Icon = agent.icon;

              return (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  config={config}
                  Icon={Icon}
                  onToggle={(enabled) => handleToggleAgent(agent.id, enabled)}
                  onUpdateInterval={(interval) => handleUpdateInterval(agent.id, interval)}
                  onUpdateAutonomy={(level) => handleUpdateAutonomy(agent.id, level)}
                  onConfigure={() => setConfiguringAgent(agent)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Agent Configuration Modal */}
      {configuringAgent && (
        <AgentConfigModal
          agent={configuringAgent}
          config={getAgentConfig(configuringAgent.id)}
          onClose={() => setConfiguringAgent(null)}
          onSave={(config) => {
            updateMutation.mutate({
              agentId: configuringAgent.id,
              updates: { config },
            });
            setConfiguringAgent(null);
          }}
        />
      )}
    </AdminLayout>
  );
}

interface AgentCardProps {
  agent: typeof agentDefinitions[0];
  config?: AgentConfig;
  Icon: any;
  onToggle: (enabled: boolean) => void;
  onUpdateInterval: (interval: number) => void;
  onUpdateAutonomy: (level: 'full' | 'supervised') => void;
  onConfigure: () => void;
}

function AgentCard({
  agent,
  config,
  Icon,
  onToggle,
  onUpdateInterval,
  onUpdateAutonomy,
  onConfigure,
}: AgentCardProps) {
  const isEnabled = config?.enabled ?? true;
  const scanInterval = config?.scanInterval ?? agent.defaultInterval;
  const autonomyLevel = config?.autonomyLevel ?? 'supervised';
  const status = config?.status ?? 'idle';
  const lastRun = config?.lastRun;

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', !isEnabled && 'opacity-60')}>
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-3 rounded-lg', agent.bgColor)}>
            <Icon className={cn('w-6 h-6', agent.color)} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isEnabled} onCheckedChange={onToggle} />
            {status === 'running' && (
              <Badge variant="default" className="bg-blue-600">
                <Activity className="w-3 h-3 mr-1 animate-pulse" />
                Running
              </Badge>
            )}
          </div>
        </div>

        <CardTitle className="line-clamp-1">{agent.name}</CardTitle>
        <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scan Interval */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">SCAN INTERVAL</Label>
          <Select
            value={scanInterval.toString()}
            onValueChange={(value) => onUpdateInterval(parseInt(value))}
            disabled={!isEnabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scanIntervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Autonomy Level */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">AUTONOMY LEVEL</Label>
          <Select
            value={autonomyLevel}
            onValueChange={(value: 'full' | 'supervised') => onUpdateAutonomy(value)}
            disabled={!isEnabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4" />
                  Full Autonomy
                </div>
              </SelectItem>
              <SelectItem value="supervised">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Supervised
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {autonomyLevel === 'full'
              ? 'Auto-approves actions'
              : 'Requires human approval'}
          </p>
        </div>

        {/* Last Run */}
        {lastRun && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last run: {format(new Date(lastRun), 'MMM d, h:mm a')}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onConfigure}
          disabled={!isEnabled}
        >
          <Sliders className="w-4 h-4" />
          Configure Thresholds
        </Button>
      </CardFooter>
    </Card>
  );
}
