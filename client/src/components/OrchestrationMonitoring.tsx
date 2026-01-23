/**
 * ORCHESTRATION MONITORING DASHBOARD
 *
 * Real-time monitoring of the multi-agent orchestration engine with:
 * - System health status
 * - Agent health and circuit breakers
 * - Performance metrics
 * - Live activity feed
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastSuccessfulExecution: number;
  consecutiveFailures: number;
  totalExecutions: number;
  totalFailures: number;
  averageExecutionTime: number;
  circuitBreakerState: {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    lastFailureTime: number;
    successCount: number;
  };
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  healthyAgents: number;
  degradedAgents: number;
  unhealthyAgents: number;
  totalAgents: number;
}

interface PerformanceMetrics {
  totalOrchestrations: number;
  successfulOrchestrations: number;
  failedOrchestrations: number;
  averageOrchestrationTime: number;
  totalMessages: number;
  totalWorkflowTriggers: number;
  totalContextShares: number;
  uptime: number;
  startTime: number;
}

export function OrchestrationMonitoring() {
  // Poll for enhanced status
  const { data: status, refetch } = useQuery({
    queryKey: ['orchestration-status-enhanced'],
    queryFn: async () => {
      const res = await fetch('/api/orchestration/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const systemHealth: SystemHealth | undefined = status?.systemHealth;
  const metrics: PerformanceMetrics | undefined = status?.metrics;
  const agentHealth: AgentHealth[] = status?.agentHealth || [];

  // Reset circuit breaker
  const resetCircuitBreaker = async (agentId: string) => {
    try {
      const res = await fetch(`/api/orchestration/circuit-breaker/${agentId}/reset`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to reset circuit breaker');
      refetch();
    } catch (error) {
      console.error('Failed to reset circuit breaker:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orchestration Monitoring</h1>
          <p className="text-muted-foreground">Real-time multi-agent system health</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className="grid grid-cols-5 gap-4">
          <SystemHealthCard
            label="Overall Status"
            status={systemHealth.overall}
            icon={systemHealth.overall === 'healthy' ? CheckCircle : AlertCircle}
          />
          <StatCard
            label="Healthy Agents"
            value={systemHealth.healthyAgents}
            total={systemHealth.totalAgents}
            color="green"
            icon={CheckCircle}
          />
          <StatCard
            label="Degraded Agents"
            value={systemHealth.degradedAgents}
            total={systemHealth.totalAgents}
            color="yellow"
            icon={AlertCircle}
          />
          <StatCard
            label="Unhealthy Agents"
            value={systemHealth.unhealthyAgents}
            total={systemHealth.totalAgents}
            color="red"
            icon={XCircle}
          />
          <StatCard
            label="Total Agents"
            value={systemHealth.totalAgents}
            color="blue"
            icon={Activity}
          />
        </div>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Metrics
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              label="Total Orchestrations"
              value={metrics.totalOrchestrations.toLocaleString()}
              icon={Activity}
            />
            <MetricCard
              label="Success Rate"
              value={`${metrics.totalOrchestrations > 0 ? ((metrics.successfulOrchestrations / metrics.totalOrchestrations) * 100).toFixed(1) : 0}%`}
              icon={CheckCircle}
              color="green"
            />
            <MetricCard
              label="Avg Response Time"
              value={`${metrics.averageOrchestrationTime.toFixed(0)}ms`}
              icon={Clock}
            />
            <MetricCard
              label="Uptime"
              value={formatUptime(metrics.uptime)}
              icon={Clock}
              color="blue"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <MetricCard
              label="Messages Sent"
              value={metrics.totalMessages.toLocaleString()}
              icon={Activity}
            />
            <MetricCard
              label="Workflow Triggers"
              value={metrics.totalWorkflowTriggers.toLocaleString()}
              icon={Zap}
            />
            <MetricCard
              label="Context Shares"
              value={metrics.totalContextShares.toLocaleString()}
              icon={Activity}
            />
          </div>
        </div>
      )}

      {/* Agent Health Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border">
        <h2 className="text-xl font-bold mb-4">Agent Health Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Agent</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Circuit Breaker</th>
                <th className="text-right p-3">Executions</th>
                <th className="text-right p-3">Failures</th>
                <th className="text-right p-3">Success Rate</th>
                <th className="text-right p-3">Avg Time</th>
                <th className="text-right p-3">Last Success</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agentHealth.map(health => (
                <AgentHealthRow
                  key={health.agentId}
                  health={health}
                  onResetCircuitBreaker={resetCircuitBreaker}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SystemHealthCard({ label, status, icon: Icon }: any) {
  const colors = {
    healthy: 'bg-green-100 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400',
    degraded:
      'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500 text-yellow-700 dark:text-yellow-400',
    unhealthy: 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400',
  };

  return (
    <div className={`${colors[status]} border-2 rounded-lg p-4`}>
      <Icon className="w-6 h-6 mb-2" />
      <div className="text-2xl font-bold capitalize">{status}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function StatCard({ label, value, total, color = 'blue', icon: Icon }: any) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4`}>
      <Icon className="w-6 h-6 mb-2" />
      <div className="text-2xl font-bold">
        {value}
        {total !== undefined && <span className="text-lg opacity-60">/{total}</span>}
      </div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color = 'default' }: any) {
  const colors: Record<string, string> = {
    default: '',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <Icon className={`w-5 h-5 ${colors[color]}`} />
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function AgentHealthRow({ health, onResetCircuitBreaker }: any) {
  const statusColors = {
    healthy: 'text-green-600 dark:text-green-400',
    degraded: 'text-yellow-600 dark:text-yellow-400',
    unhealthy: 'text-red-600 dark:text-red-400',
  };

  const cbColors = {
    CLOSED: 'text-green-600 dark:text-green-400',
    HALF_OPEN: 'text-yellow-600 dark:text-yellow-400',
    OPEN: 'text-red-600 dark:text-red-400',
  };

  const successRate =
    health.totalExecutions > 0
      ? (((health.totalExecutions - health.totalFailures) / health.totalExecutions) * 100).toFixed(1)
      : '0.0';

  const timeSinceSuccess = Date.now() - health.lastSuccessfulExecution;
  const timeAgo = formatTimeAgo(timeSinceSuccess);

  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-700/50">
      <td className="p-3 font-medium">{health.agentId.toUpperCase()}</td>
      <td className="p-3">
        <span className={`font-semibold ${statusColors[health.status]}`}>
          {health.status.toUpperCase()}
        </span>
      </td>
      <td className="p-3">
        <span className={`font-semibold ${cbColors[health.circuitBreakerState.state]}`}>
          {health.circuitBreakerState.state}
        </span>
        {health.circuitBreakerState.failures > 0 && (
          <span className="text-xs ml-2 text-muted-foreground">
            ({health.circuitBreakerState.failures} failures)
          </span>
        )}
      </td>
      <td className="p-3 text-right">{health.totalExecutions}</td>
      <td className="p-3 text-right">
        <span className="text-red-600 dark:text-red-400">{health.totalFailures}</span>
        {health.consecutiveFailures > 0 && (
          <span className="text-xs ml-2">({health.consecutiveFailures} consecutive)</span>
        )}
      </td>
      <td className="p-3 text-right">{successRate}%</td>
      <td className="p-3 text-right">{health.averageExecutionTime.toFixed(0)}ms</td>
      <td className="p-3 text-right text-sm text-muted-foreground">{timeAgo}</td>
      <td className="p-3 text-center">
        {health.circuitBreakerState.state === 'OPEN' && (
          <button
            onClick={() => onResetCircuitBreaker(health.agentId)}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
          >
            Reset
          </button>
        )}
      </td>
    </tr>
  );
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
