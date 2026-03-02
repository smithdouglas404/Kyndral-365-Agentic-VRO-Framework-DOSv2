/**
 * AGENT COLLABORATION MATRIX
 *
 * Visual matrix showing agent-to-agent collaboration patterns.
 * Features:
 * - Heatmap of collaboration frequency between agents
 * - Success rate indicators
 * - Average response time per agent pair
 * - Drill-down to see specific rules between agents
 * - Filter by date range
 * - Export to image/CSV
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Network,
  Download,
  Info,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AgentCollaborationData {
  fromAgent: string;
  toAgent: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgResponseTimeSeconds: number;
  lastCollaborationAt: string;
}

interface AgentPairDetails {
  fromAgent: string;
  toAgent: string;
  rules: {
    ruleId: string;
    ruleName: string;
    executionCount: number;
    successRate: number;
    avgResponseTime: number;
  }[];
}

interface Agent {
  id: string;
  name: string;
  color?: string;
  enabled: boolean;
}

// Helper to generate short name from agent name
function getShortName(name: string): string {
  return name.split(' ')[0].substring(0, 2).toUpperCase();
}

// Default colors for agents that don't have one
const DEFAULT_COLORS = [
  'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-orange-500',
  'bg-teal-500', 'bg-pink-500', 'bg-blue-500', 'bg-indigo-500', 'bg-yellow-500',
];

export default function AgentCollaborationMatrix() {
  // Fetch agents from API
  const { data: agentsData } = useQuery<{ agents: Agent[] }>({
    queryKey: ['agents-enabled'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agents?enabled=true');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
  });

  const AGENT_LIST = (agentsData?.agents || []).map((agent, index) => ({
    id: agent.id,
    name: agent.name,
    shortName: getShortName(agent.name),
    color: agent.color ? `bg-[${agent.color}]` : DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));
  const [dateRange, setDateRange] = useState<string>('7days');
  const [selectedPair, setSelectedPair] = useState<{ from: string; to: string } | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch collaboration matrix data
  const { data: collaborationData = [], isLoading, error, refetch } = useQuery<AgentCollaborationData[]>({
    queryKey: ['/api/admin/agent-collaboration-matrix', dateRange],
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Fetch details for selected agent pair
  const { data: pairDetails } = useQuery<AgentPairDetails>({
    queryKey: ['/api/admin/agent-collaboration-details', selectedPair?.from, selectedPair?.to],
    enabled: !!selectedPair,
  });

  // Build collaboration matrix
  const buildMatrix = () => {
    const matrix: Record<string, Record<string, AgentCollaborationData | null>> = {};

    AGENT_LIST.forEach((fromAgent) => {
      matrix[fromAgent.id] = {};
      AGENT_LIST.forEach((toAgent) => {
        matrix[fromAgent.id][toAgent.id] = null;
      });
    });

    collaborationData.forEach((collab) => {
      if (matrix[collab.fromAgent] && matrix[collab.fromAgent][collab.toAgent] !== undefined) {
        matrix[collab.fromAgent][collab.toAgent] = collab;
      }
    });

    return matrix;
  };

  const matrix = buildMatrix();

  // Calculate max executions for heatmap scaling
  const maxExecutions = Math.max(...collaborationData.map((d) => d.totalExecutions), 1);

  const getHeatmapColor = (executions: number) => {
    const intensity = Math.min(executions / maxExecutions, 1);
    if (intensity === 0) return 'bg-gray-50';
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-300';
    if (intensity < 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const getSuccessRateColor = (successRate: number) => {
    if (successRate >= 0.9) return 'text-green-600';
    if (successRate >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleCellClick = (fromAgent: string, toAgent: string, data: AgentCollaborationData | null) => {
    if (data && data.totalExecutions > 0) {
      setSelectedPair({ from: fromAgent, to: toAgent });
      setShowDetailsDialog(true);
    }
  };

  const handleExportCSV = () => {
    const headers = ['From Agent', 'To Agent', 'Total Executions', 'Success Rate', 'Avg Response Time (s)', 'Last Collaboration'];
    const rows = collaborationData.map((collab) => [
      collab.fromAgent,
      collab.toAgent,
      collab.totalExecutions.toString(),
      `${((collab.successfulExecutions / collab.totalExecutions) * 100).toFixed(1)}%`,
      collab.avgResponseTimeSeconds.toFixed(1),
      new Date(collab.lastCollaborationAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-collaboration-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const totalCollaborations = collaborationData.reduce((sum, d) => sum + d.totalExecutions, 0);
  const totalSuccessful = collaborationData.reduce((sum, d) => sum + d.successfulExecutions, 0);
  const overallSuccessRate = totalCollaborations > 0 ? (totalSuccessful / totalCollaborations) * 100 : 0;
  const avgResponseTime =
    collaborationData.length > 0
      ? collaborationData.reduce((sum, d) => sum + d.avgResponseTimeSeconds, 0) / collaborationData.length
      : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Collaboration Matrix</h1>
          <p className="text-muted-foreground mt-2">
            Visualize patterns of agent-to-agent collaboration and communication
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Collaborations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCollaborations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', getSuccessRateColor(overallSuccessRate / 100))}>
                {overallSuccessRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponseTime.toFixed(1)}s</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="h-4 w-4" />
                Active Pairs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {collaborationData.filter((d) => d.totalExecutions > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24hours">Last 24 Hours</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Collaboration Matrix */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Collaboration Heatmap</CardTitle>
                <CardDescription>Click on a cell to see detailed collaboration history</CardDescription>
              </div>
              <Alert className="max-w-md">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Color intensity shows collaboration frequency. Success rate and response time are shown for each pair.
                </AlertDescription>
              </Alert>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Failed to load collaboration data. Please try again.</AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <TooltipProvider>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-sm font-medium border text-left">From → To</th>
                        {AGENT_LIST.map((agent) => (
                          <th key={agent.id} className="p-2 text-sm font-medium border text-center">
                            <div className="flex flex-col items-center">
                              <Badge className={cn('text-white mb-1', agent.color)}>{agent.shortName}</Badge>
                              <span className="text-xs text-muted-foreground">{agent.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {AGENT_LIST.map((fromAgent) => (
                        <tr key={fromAgent.id}>
                          <td className="p-2 text-sm font-medium border">
                            <div className="flex items-center gap-2">
                              <Badge className={cn('text-white', fromAgent.color)}>{fromAgent.shortName}</Badge>
                              <span>{fromAgent.name}</span>
                            </div>
                          </td>
                          {AGENT_LIST.map((toAgent) => {
                            const data = matrix[fromAgent.id][toAgent.id];
                            const isDisabled = fromAgent.id === toAgent.id;

                            if (isDisabled) {
                              return (
                                <td key={toAgent.id} className="p-2 border bg-gray-100">
                                  <div className="text-center text-xs text-muted-foreground">—</div>
                                </td>
                              );
                            }

                            if (!data || data.totalExecutions === 0) {
                              return (
                                <td key={toAgent.id} className="p-2 border bg-gray-50">
                                  <div className="text-center text-xs text-muted-foreground">0</div>
                                </td>
                              );
                            }

                            const successRate = (data.successfulExecutions / data.totalExecutions) * 100;

                            return (
                              <Tooltip key={toAgent.id}>
                                <TooltipTrigger asChild>
                                  <td
                                    className={cn(
                                      'p-2 border cursor-pointer transition-all hover:ring-2 hover:ring-blue-400',
                                      getHeatmapColor(data.totalExecutions)
                                    )}
                                    onClick={() => handleCellClick(fromAgent.id, toAgent.id, data)}
                                  >
                                    <div className="text-center">
                                      <div className="font-bold text-sm">{data.totalExecutions}</div>
                                      <div className={cn('text-xs font-medium', getSuccessRateColor(successRate / 100))}>
                                        {successRate.toFixed(0)}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {data.avgResponseTimeSeconds.toFixed(1)}s
                                      </div>
                                    </div>
                                  </td>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">
                                      {fromAgent.name} → {toAgent.name}
                                    </p>
                                    <p className="text-xs">Executions: {data.totalExecutions}</p>
                                    <p className="text-xs">Success Rate: {successRate.toFixed(1)}%</p>
                                    <p className="text-xs">Avg Response: {data.avgResponseTimeSeconds.toFixed(1)}s</p>
                                    <p className="text-xs">Last: {new Date(data.lastCollaborationAt).toLocaleDateString()}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Click for details</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TooltipProvider>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        {selectedPair && pairDetails && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Collaboration Details: {AGENT_LIST.find((a) => a.id === selectedPair.from)?.name} →{' '}
                  {AGENT_LIST.find((a) => a.id === selectedPair.to)?.name}
                </DialogTitle>
                <DialogDescription>Rules triggering collaboration between these agents</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {pairDetails.rules.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>No collaboration rules found for this agent pair.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {pairDetails.rules.map((rule) => (
                      <Card key={rule.ruleId}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{rule.ruleName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label className="text-muted-foreground">Executions</Label>
                              <p className="font-medium mt-1">{rule.executionCount}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Success Rate</Label>
                              <p className={cn('font-medium mt-1', getSuccessRateColor(rule.successRate / 100))}>
                                {rule.successRate.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Avg Response Time</Label>
                              <p className="font-medium mt-1">{rule.avgResponseTime.toFixed(1)}s</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
