import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Zap,
  Filter, Calendar, Users, ArrowRight, TrendingUp, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface RuleExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  fromAgent: string;
  toAgent: string;
  projectId: string;
  trigger: {
    attribute: string;
    value: string;
    threshold: string;
  };
  actionsTaken: string[];
  status: 'pending' | 'acknowledged' | 'resolved' | 'failed';
  responseTimeSeconds: number | null;
  responseMessage: string | null;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  metadata: Record<string, any>;
}

interface ExecutionStats {
  totalFired: number;
  resolved: number;
  pending: number;
  acknowledged: number;
  failed: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
}

interface RuleExecutionHistoryProps {
  className?: string;
}

const AGENT_COLORS: Record<string, string> = {
  finops: 'bg-green-100 text-green-700 border-green-200',
  tmo: 'bg-blue-100 text-blue-700 border-blue-200',
  risk: 'bg-red-100 text-red-700 border-red-200',
  vro: 'bg-purple-100 text-purple-700 border-purple-200',
  pmo: 'bg-orange-100 text-orange-700 border-orange-200',
  ocm: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const STATUS_COLORS: Record<string, { bg: string; icon: React.ReactNode }> = {
  pending: { bg: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  acknowledged: { bg: 'bg-blue-100 text-blue-700', icon: <AlertCircle size={14} /> },
  resolved: { bg: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={14} /> },
  failed: { bg: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
};

export function RuleExecutionHistory({ className }: RuleExecutionHistoryProps) {
  const [timeframe, setTimeframe] = useState('7days');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rule-execution-history', timeframe, selectedAgent, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ timeframe });
      if (selectedAgent !== 'all') params.append('agent', selectedAgent);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/rules/execution-history?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rule execution history');
      }

      return response.json() as Promise<{
        executions: RuleExecution[];
        stats: ExecutionStats;
        pagination: { limit: number; offset: number; total: number };
      }>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatResponseTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const executions = data?.executions || [];
  const stats = data?.stats || {
    totalFired: 0,
    resolved: 0,
    pending: 0,
    acknowledged: 0,
    failed: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: 0,
  };

  return (
    <div className={className}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Fired</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFired}</p>
              </div>
              <Zap className="text-amber-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Response</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatResponseTime(Math.round(stats.avgResponseTime))}
                </p>
              </div>
              <Activity className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter size={20} />
              Filters
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTimeframe('7days');
                setSelectedAgent('all');
                setSelectedStatus('all');
              }}
            >
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Agent</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="finops">FinOps</SelectItem>
                  <SelectItem value="tmo">TMO</SelectItem>
                  <SelectItem value="risk">Risk</SelectItem>
                  <SelectItem value="vro">VRO</SelectItem>
                  <SelectItem value="pmo">PMO</SelectItem>
                  <SelectItem value="ocm">OCM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Rule Executions
            <Badge variant="outline" className="ml-2">
              {executions.length} results
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No rule executions found for the selected filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {executions.map((execution) => (
                  <motion.div
                    key={execution.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="border-l-4" style={{
                      borderLeftColor: execution.status === 'resolved' ? '#10b981' :
                                      execution.status === 'failed' ? '#ef4444' :
                                      execution.status === 'acknowledged' ? '#3b82f6' : '#f59e0b'
                    }}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {execution.ruleName}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Badge
                                variant="outline"
                                className={AGENT_COLORS[execution.fromAgent] || 'bg-gray-100'}
                              >
                                {execution.fromAgent}
                              </Badge>
                              <ArrowRight size={14} />
                              <Badge
                                variant="outline"
                                className={AGENT_COLORS[execution.toAgent] || 'bg-gray-100'}
                              >
                                {execution.toAgent}
                              </Badge>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={STATUS_COLORS[execution.status].bg}
                          >
                            <span className="flex items-center gap-1">
                              {STATUS_COLORS[execution.status].icon}
                              {execution.status}
                            </span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500">Trigger:</span>{' '}
                            <span className="font-medium">
                              {execution.trigger.attribute} = {execution.trigger.value}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Threshold:</span>{' '}
                            <span className="font-medium">{execution.trigger.threshold}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatDistanceToNow(new Date(execution.triggeredAt), {
                                addSuffix: true,
                              })}
                            </span>
                            {execution.responseTimeSeconds && (
                              <span className="flex items-center gap-1">
                                <TrendingUp size={14} />
                                Response: {formatResponseTime(execution.responseTimeSeconds)}
                              </span>
                            )}
                          </div>
                          {execution.projectId && (
                            <span className="text-blue-600 hover:underline cursor-pointer">
                              Project #{execution.projectId}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
