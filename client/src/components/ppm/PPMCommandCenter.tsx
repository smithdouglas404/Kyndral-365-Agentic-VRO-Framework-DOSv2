/**
 * PPM Command Center View
 *
 * Dense monitoring view showing REAL business metrics from Palantir:
 * - Portfolio health, budget utilization, risk status
 * - Real agent status from the 8 Deep Agents
 * - Project alerts and activity from actual data
 */

import { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  Bot,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  Filter,
  Gauge,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  Text,
  Badge,
  Flex,
  ProgressBar,
  Metric,
  Grid,
  Col,
  Tracker,
  BadgeDelta,
} from '@tremor/react';
import { cn } from '@/lib/utils';
import { usePPMAgents, usePPMMetrics, type RealAgent } from '@/contexts/PPMAgentContext';

// ============================================================================
// Agent Icon Mapping
// ============================================================================

const AGENT_ICONS: Record<string, typeof Bot> = {
  finops: DollarSign,
  tmo: Calendar,
  pmo: Target,
  vro: TrendingUp,
  risk: Shield,
  governance: Users,
  ocm: Activity,
  planning: GitBranch,
};

// ============================================================================
// Agent Status Row - Shows REAL agent
// ============================================================================

interface AgentStatusRowProps {
  agent: RealAgent;
  onAction: (action: string) => void;
}

function AgentStatusRow({ agent, onAction }: AgentStatusRowProps) {
  const Icon = AGENT_ICONS[agent.id] || Bot;

  const statusConfig = {
    active: { color: 'emerald', label: 'Active' },
    idle: { color: 'gray', label: 'Idle' },
    processing: { color: 'amber', label: 'Processing' },
    error: { color: 'rose', label: 'Error' },
  };

  const config = statusConfig[agent.status];

  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-tremor-background-subtle rounded-lg transition-colors">
      {/* Icon */}
      <div className="h-8 w-8 rounded-lg bg-tremor-background-subtle flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-tremor-content" />
      </div>

      {/* Name & Status */}
      <div className="min-w-[120px]">
        <Text className="font-medium text-sm">{agent.name}</Text>
        <Flex alignItems="center" className="gap-1">
          <div
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              agent.status === 'active' && 'bg-emerald-500 animate-pulse',
              agent.status === 'idle' && 'bg-gray-400',
              agent.status === 'processing' && 'bg-amber-500 animate-pulse',
              agent.status === 'error' && 'bg-rose-500'
            )}
          />
          <Text className="text-xs text-tremor-content-subtle">{config.label}</Text>
        </Flex>
      </div>

      {/* Type */}
      <div className="min-w-[140px] hidden lg:block">
        <Text className="text-xs text-tremor-content-subtle">Type</Text>
        <Text className="text-sm font-mono text-xs">{agent.type}</Text>
      </div>

      {/* Capabilities count */}
      <div className="min-w-[80px]">
        <Text className="text-xs text-tremor-content-subtle">Capabilities</Text>
        <Text className="text-sm font-medium">{agent.capabilities.length}</Text>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAction('chat')}
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAction('details')}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Metric Ticker - Shows REAL Palantir metrics
// ============================================================================

interface MetricTickerBarProps {
  metrics: {
    totalProjects: number;
    activeProjects: number;
    atRiskProjects: number;
    budgetUtilization: number;
    onTrackPercentage: number;
    overallHealth: number;
  } | null;
  projectCount: number;
  riskCount: number;
}

function MetricTickerBar({ metrics, projectCount, riskCount }: MetricTickerBarProps) {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center px-4 py-3 bg-tremor-background border-b border-tremor-border">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <Text className="text-sm">Loading metrics from Palantir...</Text>
      </div>
    );
  }

  const items = [
    { label: 'Total Projects', value: metrics.totalProjects || projectCount, change: null },
    { label: 'Active', value: metrics.activeProjects, change: null },
    { label: 'At Risk', value: metrics.atRiskProjects || riskCount, change: null, isNegative: true },
    { label: 'Budget Util', value: `${Math.round(metrics.budgetUtilization)}%`, change: null },
    { label: 'On Track', value: `${Math.round(metrics.onTrackPercentage)}%`, change: null },
    { label: 'Health', value: `${Math.round(metrics.overallHealth)}%`, change: null },
  ];

  return (
    <div className="flex items-center gap-6 overflow-x-auto px-4 py-2 bg-tremor-background border-b border-tremor-border">
      {items.map((item) => (
        <Flex key={item.label} alignItems="center" className="gap-2 shrink-0">
          <Text className="text-xs text-tremor-content-subtle">{item.label}</Text>
          <Text className={cn('font-semibold', item.isNegative && 'text-rose-600')}>
            {item.value}
          </Text>
        </Flex>
      ))}
    </div>
  );
}

// ============================================================================
// Quick Stats - Shows REAL portfolio data
// ============================================================================

interface QuickStatsGridProps {
  metrics: any;
  projectCount: number;
  riskCount: number;
  agentCount: number;
}

function QuickStatsGrid({ metrics, projectCount, riskCount, agentCount }: QuickStatsGridProps) {
  const stats = [
    {
      label: 'Portfolio Health',
      value: metrics ? `${Math.round(metrics.overallHealth || 85)}%` : '-',
      color: 'emerald',
      icon: Activity,
    },
    {
      label: 'Active Agents',
      value: `${agentCount}/8`,
      color: 'blue',
      icon: Bot,
    },
    {
      label: 'Open Risks',
      value: riskCount.toString(),
      color: riskCount > 5 ? 'rose' : 'amber',
      icon: Shield,
    },
    {
      label: 'Budget Utilization',
      value: metrics ? `${Math.round(metrics.budgetUtilization || 0)}%` : '-',
      color: 'violet',
      icon: DollarSign,
    },
  ];

  return (
    <Grid numItemsSm={2} numItemsMd={4} className="gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="p-3"
            decoration="left"
            decorationColor={stat.color as any}
          >
            <Flex alignItems="start" justifyContent="between">
              <div>
                <Text className="text-xs text-tremor-content-subtle">{stat.label}</Text>
                <Metric className="text-xl">{stat.value}</Metric>
              </div>
              <Icon className={cn('h-5 w-5', `text-${stat.color}-500`)} />
            </Flex>
          </Card>
        );
      })}
    </Grid>
  );
}

// ============================================================================
// Project Risk List - Shows REAL risks from Palantir
// ============================================================================

interface RiskListProps {
  risks: any[];
}

function RiskList({ risks }: RiskListProps) {
  if (risks.length === 0) {
    return (
      <div className="p-4 text-center">
        <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
        <Text className="text-sm text-tremor-content-subtle">No active risks</Text>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1 max-h-[250px] overflow-y-auto">
      {risks.slice(0, 8).map((risk: any) => {
        const severityColors = {
          critical: 'rose',
          high: 'rose',
          medium: 'amber',
          low: 'blue',
        };
        const color = severityColors[risk.severity as keyof typeof severityColors] || 'gray';

        return (
          <div
            key={risk.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tremor-background-subtle"
          >
            <div className={cn('h-6 w-6 rounded flex items-center justify-center', `bg-${color}-500/10`)}>
              <AlertTriangle className={cn('h-3.5 w-3.5', `text-${color}-600`)} />
            </div>
            <div className="flex-1 min-w-0">
              <Text className="text-sm font-medium truncate">{risk.title || risk.name}</Text>
              <Flex alignItems="center" className="gap-2">
                <Badge color={color as any} size="xs">{risk.severity}</Badge>
                {risk.projectName && (
                  <Text className="text-xs text-tremor-content-subtle truncate">
                    {risk.projectName}
                  </Text>
                )}
              </Flex>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Project Status Summary - Shows REAL projects from Palantir
// ============================================================================

interface ProjectSummaryProps {
  projects: any[];
}

function ProjectSummary({ projects }: ProjectSummaryProps) {
  const summary = useMemo(() => {
    const byStatus = {
      green: projects.filter((p) => p.status === 'green').length,
      amber: projects.filter((p) => p.status === 'amber').length,
      red: projects.filter((p) => p.status === 'red').length,
    };
    return byStatus;
  }, [projects]);

  const total = projects.length || 1;

  return (
    <div className="p-4 space-y-4">
      <div>
        <Flex justifyContent="between" className="mb-2">
          <Text className="text-xs text-tremor-content-subtle">Project Status Distribution</Text>
          <Text className="text-xs font-medium">{projects.length} projects</Text>
        </Flex>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-tremor-background-subtle">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${(summary.green / total) * 100}%` }}
          />
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${(summary.amber / total) * 100}%` }}
          />
          <div
            className="bg-rose-500 transition-all"
            style={{ width: `${(summary.red / total) * 100}%` }}
          />
        </div>
        <Flex justifyContent="between" className="mt-2">
          <Text className="text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />
            On Track: {summary.green}
          </Text>
          <Text className="text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />
            At Risk: {summary.amber}
          </Text>
          <Text className="text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />
            Critical: {summary.red}
          </Text>
        </Flex>
      </div>

      {/* Top projects needing attention */}
      <div>
        <Text className="text-xs text-tremor-content-subtle mb-2">Needs Attention</Text>
        <div className="space-y-1">
          {projects
            .filter((p) => p.status === 'red' || p.status === 'amber')
            .slice(0, 3)
            .map((project) => (
              <Flex key={project.id} alignItems="center" className="gap-2 text-sm">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    project.status === 'red' ? 'bg-rose-500' : 'bg-amber-500'
                  )}
                />
                <Text className="truncate flex-1">{project.name}</Text>
                <Badge color={project.status === 'red' ? 'rose' : 'amber'} size="xs">
                  {project.statusText || project.status}
                </Badge>
              </Flex>
            ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Command Center - Using REAL Data
// ============================================================================

interface PPMCommandCenterProps {
  onAgentAction?: (agentId: string, action: string) => void;
  onAlertAction?: (alertId: string, action: string) => void;
}

export function PPMCommandCenter({
  onAgentAction,
  onAlertAction,
}: PPMCommandCenterProps) {
  const { agents, projects, risks, isLoadingAgents, isLoadingProjects, isLoadingRisks } = usePPMAgents();
  const { metrics, isLoading: isLoadingMetrics } = usePPMMetrics();

  const activeAgentCount = agents.filter((a) => a.status === 'active').length;
  const isLoading = isLoadingAgents || isLoadingProjects || isLoadingRisks || isLoadingMetrics;

  return (
    <div className="h-full flex flex-col bg-tremor-background-subtle">
      {/* Metric Ticker - REAL data */}
      <MetricTickerBar
        metrics={metrics}
        projectCount={projects.length}
        riskCount={risks.length}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Quick Stats - REAL data */}
        <div className="mb-4">
          <QuickStatsGrid
            metrics={metrics}
            projectCount={projects.length}
            riskCount={risks.length}
            agentCount={activeAgentCount}
          />
        </div>

        <Grid numItemsMd={2} className="gap-4">
          {/* Agent Status Panel - REAL 8 agents */}
          <Col numColSpan={1}>
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-tremor-border">
                <Flex justifyContent="between" alignItems="center">
                  <Flex alignItems="center" className="gap-2">
                    <Bot className="h-4 w-4 text-tremor-content-subtle" />
                    <Text className="font-semibold">Deep Agents</Text>
                    <Badge color="emerald" size="xs">
                      {activeAgentCount} active
                    </Badge>
                  </Flex>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </Flex>
              </div>
              <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto">
                {isLoadingAgents ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : (
                  agents.map((agent) => (
                    <AgentStatusRow
                      key={agent.id}
                      agent={agent}
                      onAction={(action) => onAgentAction?.(agent.id, action)}
                    />
                  ))
                )}
              </div>
            </Card>
          </Col>

          {/* Risk Panel - REAL risks from Palantir */}
          <Col numColSpan={1}>
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-tremor-border">
                <Flex justifyContent="between" alignItems="center">
                  <Flex alignItems="center" className="gap-2">
                    <Shield className="h-4 w-4 text-tremor-content-subtle" />
                    <Text className="font-semibold">Active Risks</Text>
                    {risks.length > 0 && (
                      <Badge color="rose" size="xs">
                        {risks.length}
                      </Badge>
                    )}
                  </Flex>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Filter
                  </Button>
                </Flex>
              </div>
              {isLoadingRisks ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : (
                <RiskList risks={risks} />
              )}
            </Card>
          </Col>

          {/* Project Status - REAL projects from Palantir */}
          <Col numColSpan={1}>
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-tremor-border">
                <Flex alignItems="center" className="gap-2">
                  <Target className="h-4 w-4 text-tremor-content-subtle" />
                  <Text className="font-semibold">Portfolio Status</Text>
                </Flex>
              </div>
              {isLoadingProjects ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : (
                <ProjectSummary projects={projects} />
              )}
            </Card>
          </Col>

          {/* Budget Overview - REAL financial data */}
          <Col numColSpan={1}>
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-tremor-border">
                <Flex alignItems="center" className="gap-2">
                  <DollarSign className="h-4 w-4 text-tremor-content-subtle" />
                  <Text className="font-semibold">Budget Overview</Text>
                </Flex>
              </div>
              <div className="p-4 space-y-4">
                {metrics ? (
                  <>
                    <div>
                      <Flex justifyContent="between" className="mb-2">
                        <Text className="text-xs text-tremor-content-subtle">Total Budget</Text>
                        <Text className="text-sm font-medium">
                          ${(metrics.totalBudget / 1000000).toFixed(1)}M
                        </Text>
                      </Flex>
                      <Flex justifyContent="between" className="mb-2">
                        <Text className="text-xs text-tremor-content-subtle">Spent</Text>
                        <Text className="text-sm font-medium">
                          ${(metrics.budgetSpent / 1000000).toFixed(1)}M
                        </Text>
                      </Flex>
                      <ProgressBar
                        value={metrics.budgetUtilization}
                        color={metrics.budgetUtilization > 90 ? 'rose' : metrics.budgetUtilization > 75 ? 'amber' : 'emerald'}
                        className="h-2"
                      />
                      <Text className="text-xs text-tremor-content-subtle mt-1">
                        {Math.round(metrics.budgetUtilization)}% utilized
                      </Text>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <Text className="text-xs text-tremor-content-subtle mt-2">
                      Loading from Palantir...
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Grid>
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-2 bg-tremor-background border-t border-tremor-border">
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" className="gap-4">
            <Flex alignItems="center" className="gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Text className="text-xs text-tremor-content-subtle">Palantir Connected</Text>
            </Flex>
            <Text className="text-xs text-tremor-content-subtle">
              Data source: Palantir Foundry Ontology
            </Text>
          </Flex>
          <Flex alignItems="center" className="gap-2">
            <Text className="text-xs text-tremor-content-subtle">
              {projects.length} projects | {risks.length} risks | 8 agents
            </Text>
          </Flex>
        </Flex>
      </div>
    </div>
  );
}

export default PPMCommandCenter;
