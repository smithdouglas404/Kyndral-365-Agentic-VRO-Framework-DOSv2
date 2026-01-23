/**
 * LIQUID INTELLIGENCE INTERFACE
 *
 * Real-time, continuously updating interface showing unified multi-agent intelligence
 * Not a "dashboard" or "report" - it's a living, breathing intelligence layer
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Network, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface UnifiedInsight {
  projectId: string;
  projectName: string;
  overallHealth: 'healthy' | 'at_risk' | 'critical';
  healthScore: number;
  agentInsights: Record<string, any>;
  crossCuttingIssues: string[];
  recommendations: string[];
  confidence: number;
  lastUpdated: string;
}

interface OrchestrationStatus {
  running: boolean;
  registeredAgents: string[];
  messageBus: {
    activeQueues: number;
    totalMessages: number;
  };
  workflowRules: number;
  projectInsights: number;
}

export function LiquidIntelligenceInterface() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Poll for orchestration status
  const { data: status } = useQuery<OrchestrationStatus>({
    queryKey: ['orchestration-status'],
    queryFn: async () => {
      const res = await fetch('/api/orchestration/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    },
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds
  });

  // Poll for unified insights
  const { data: insightsData, refetch: refetchInsights } = useQuery<{
    totalProjects: number;
    insights: UnifiedInsight[];
    timestamp: string;
  }>({
    queryKey: ['unified-insights'],
    queryFn: async () => {
      const res = await fetch('/api/orchestration/insights');
      if (!res.ok) throw new Error('Failed to fetch insights');
      return res.json();
    },
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

  const insights = insightsData?.insights || [];

  // Trigger coordinated scan
  const triggerScan = async () => {
    try {
      const res = await fetch('/api/orchestration/scan', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger scan');
      setTimeout(() => refetchInsights(), 2000); // Refetch after 2 seconds
    } catch (error) {
      console.error('Scan error:', error);
    }
  };

  // Calculate aggregate statistics
  const stats = {
    total: insights.length,
    healthy: insights.filter(i => i.overallHealth === 'healthy').length,
    atRisk: insights.filter(i => i.overallHealth === 'at_risk').length,
    critical: insights.filter(i => i.overallHealth === 'critical').length,
    avgHealthScore: insights.length > 0
      ? insights.reduce((sum, i) => sum + i.healthScore, 0) / insights.length
      : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold">Unified Intelligence Layer</h1>
              <p className="text-blue-200 text-sm">Real-time multi-agent coordination</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${status?.running ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{status?.running ? 'Active' : 'Inactive'}</span>
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </button>

            <button
              onClick={triggerScan}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Trigger Scan
            </button>
          </div>
        </div>
      </div>

      {/* Orchestration Status */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-4 mb-8"
        >
          <StatusCard
            icon={Network}
            label="Active Agents"
            value={status.registeredAgents.length.toString()}
            color="blue"
          />
          <StatusCard
            icon={Activity}
            label="Message Queues"
            value={status.messageBus.activeQueues.toString()}
            color="purple"
          />
          <StatusCard
            icon={Zap}
            label="Workflow Rules"
            value={status.workflowRules.toString()}
            color="yellow"
          />
          <StatusCard
            icon={Brain}
            label="Project Insights"
            value={status.projectInsights.toString()}
            color="green"
          />
        </motion.div>
      )}

      {/* Portfolio Health Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Portfolio Intelligence
        </h2>

        <div className="grid grid-cols-5 gap-4">
          <StatBox label="Total Projects" value={stats.total} color="blue" />
          <StatBox label="Healthy" value={stats.healthy} color="green" icon={CheckCircle} />
          <StatBox label="At Risk" value={stats.atRisk} color="yellow" icon={AlertTriangle} />
          <StatBox label="Critical" value={stats.critical} color="red" icon={AlertTriangle} />
          <StatBox
            label="Avg Health"
            value={`${(stats.avgHealthScore * 100).toFixed(0)}%`}
            color={stats.avgHealthScore > 0.7 ? 'green' : stats.avgHealthScore > 0.4 ? 'yellow' : 'red'}
          />
        </div>
      </motion.div>

      {/* Live Project Insights */}
      <div>
        <h2 className="text-xl font-bold mb-4">Live Project Intelligence</h2>

        <AnimatePresence>
          {insights.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-slate-400"
            >
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No insights available. Trigger a scan to generate intelligence.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {insights.map((insight, index) => (
                <ProjectInsightCard
                  key={insight.projectId}
                  insight={insight}
                  index={index}
                  onClick={() => setSelectedProject(insight.projectId)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Agent Network Visualization */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
        >
          <h2 className="text-xl font-bold mb-4">Agent Network</h2>
          <div className="grid grid-cols-3 gap-3">
            {status.registeredAgents.map(agent => (
              <AgentNode key={agent} agentId={agent} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, color }: any) {
  const colors = {
    blue: 'bg-blue-500/20 border-blue-500',
    purple: 'bg-purple-500/20 border-purple-500',
    yellow: 'bg-yellow-500/20 border-yellow-500',
    green: 'bg-green-500/20 border-green-500',
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <Icon className="w-6 h-6 mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function StatBox({ label, value, color, icon: Icon }: any) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4`}>
      {Icon && <Icon className="w-5 h-5 mb-2" />}
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function ProjectInsightCard({ insight, index, onClick }: any) {
  const healthColors = {
    healthy: 'border-green-500 bg-green-500/5',
    at_risk: 'border-yellow-500 bg-yellow-500/5',
    critical: 'border-red-500 bg-red-500/5',
  };

  const healthIcons = {
    healthy: CheckCircle,
    at_risk: AlertTriangle,
    critical: AlertTriangle,
  };

  const HealthIcon = healthIcons[insight.overallHealth];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`${healthColors[insight.overallHealth]} border rounded-xl p-6 cursor-pointer hover:scale-[1.02] transition-transform`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <HealthIcon className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-bold">{insight.projectName}</h3>
            <p className="text-sm opacity-70">
              Health Score: {(insight.healthScore * 100).toFixed(0)}% • Confidence: {(insight.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        <div className="text-xs opacity-50">
          Updated {new Date(insight.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Agent Insights */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(insight.agentInsights).map(agentId => (
            <span
              key={agentId}
              className="px-2 py-1 bg-blue-500/20 rounded text-xs font-medium"
            >
              {agentId.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Cross-Cutting Issues */}
      {insight.crossCuttingIssues.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2">Cross-Cutting Issues:</div>
          <ul className="space-y-1">
            {insight.crossCuttingIssues.map((issue, i) => (
              <li key={i} className="text-sm opacity-80">
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {insight.recommendations.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-2">Recommendations:</div>
          <ul className="space-y-1">
            {insight.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-sm opacity-80">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function AgentNode({ agentId }: { agentId: string }) {
  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 flex items-center gap-2">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      <span className="text-sm font-medium">{agentId.toUpperCase()}</span>
    </div>
  );
}
