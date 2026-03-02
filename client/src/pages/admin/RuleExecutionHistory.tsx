/**
 * RULE EXECUTION HISTORY
 *
 * Admin interface for viewing audit trail of agent collaboration rule executions.
 * Features:
 * - Real-time execution log of all collaboration rules
 * - Filter by date range, agent, project, status
 * - Search by rule name or trigger
 * - Color-coded status indicators
 * - Detailed execution drill-down
 * - Response time tracking
 * - Export to CSV
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Filter,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface RuleExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  fromAgent: string;
  toAgent: string | null;
  projectId: string | null;
  triggerAttribute: string;
  triggerValue: string;
  threshold: string;
  actionsTaken: string; // JSON array
  status: 'pending' | 'acknowledged' | 'resolved' | 'failed';
  responseTimeSeconds: number | null;
  responseMessage: string | null;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  metadata: string | null; // JSON object
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  acknowledged: {
    label: 'Acknowledged',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: CheckCircle2,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
  },
};

interface Agent {
  id: string;
  name: string;
  enabled: boolean;
}

export default function RuleExecutionHistory() {
  // Fetch agents from API
  const { data: agentsData } = useQuery<{ agents: Agent[] }>({
    queryKey: ['agents-enabled'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agents?enabled=true');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
  });
  const availableAgents = agentsData?.agents || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');
  const [selectedExecution, setSelectedExecution] = useState<RuleExecution | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch rule execution history
  const { data: executions = [], isLoading, error, refetch } = useQuery<RuleExecution[]>({
    queryKey: ['/api/admin/rule-execution-history', selectedAgent, selectedStatus, dateRange],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Filter executions based on search query
  const filteredExecutions = executions.filter((execution) => {
    const matchesSearch =
      searchQuery === '' ||
      execution.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      execution.triggerAttribute.toLowerCase().includes(searchQuery.toLowerCase()) ||
      execution.fromAgent.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const toggleRowExpansion = (executionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId);
    } else {
      newExpanded.add(executionId);
    }
    setExpandedRows(newExpanded);
  };

  const handleViewDetails = (execution: RuleExecution) => {
    setSelectedExecution(execution);
    setShowDetailsDialog(true);
  };

  const handleExportCSV = () => {
    // Convert executions to CSV
    const headers = [
      'Timestamp',
      'Rule Name',
      'From Agent',
      'To Agent',
      'Trigger',
      'Threshold',
      'Status',
      'Response Time (s)',
    ];
    const rows = filteredExecutions.map((exec) => [
      new Date(exec.triggeredAt).toLocaleString(),
      exec.ruleName,
      exec.fromAgent,
      exec.toAgent || '-',
      `${exec.triggerAttribute}: ${exec.triggerValue}`,
      exec.threshold,
      exec.status,
      exec.responseTimeSeconds?.toString() || '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rule-execution-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const parseActions = (actionsJson: string): string[] => {
    try {
      return JSON.parse(actionsJson);
    } catch {
      return [actionsJson];
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rule Execution History</h1>
          <p className="text-muted-foreground mt-2">
            Real-time audit trail of agent collaboration rule executions and outcomes
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredExecutions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredExecutions.filter((e) => e.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredExecutions.filter((e) => e.status === 'resolved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredExecutions.filter((e) => e.responseTimeSeconds !== null).length > 0
                  ? Math.round(
                      filteredExecutions
                        .filter((e) => e.responseTimeSeconds !== null)
                        .reduce((sum, e) => sum + (e.responseTimeSeconds || 0), 0) /
                        filteredExecutions.filter((e) => e.responseTimeSeconds !== null).length
                    ) + 's'
                  : '-'}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rule name, trigger..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
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
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Executions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Log</CardTitle>
            <CardDescription>
              Showing {filteredExecutions.length} execution{filteredExecutions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load execution history. Please try again.</AlertDescription>
              </Alert>
            ) : filteredExecutions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rule executions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Timestamp</th>
                      <th className="pb-3 font-medium">Rule Name</th>
                      <th className="pb-3 font-medium">From → To</th>
                      <th className="pb-3 font-medium">Trigger</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Response Time</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExecutions.map((execution) => {
                      const StatusIcon = STATUS_CONFIG[execution.status].icon;
                      const isExpanded = expandedRows.has(execution.id);

                      return (
                        <>
                          <tr key={execution.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 text-sm">
                              {new Date(execution.triggeredAt).toLocaleString()}
                            </td>
                            <td className="py-3 text-sm font-medium">{execution.ruleName}</td>
                            <td className="py-3 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">{execution.fromAgent}</span>
                                {execution.toAgent && (
                                  <>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-muted-foreground">{execution.toAgent}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-sm">
                              <div className="max-w-xs truncate">
                                <span className="font-medium">{execution.triggerAttribute}</span>:{' '}
                                {execution.triggerValue}
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge
                                variant="outline"
                                className={cn('gap-1', STATUS_CONFIG[execution.status].color)}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {STATUS_CONFIG[execution.status].label}
                              </Badge>
                            </td>
                            <td className="py-3 text-sm">
                              {formatDuration(execution.responseTimeSeconds)}
                            </td>
                            <td className="py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(execution.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-muted/30">
                              <td colSpan={7} className="py-4 px-6">
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-sm font-medium">Threshold:</span>
                                    <span className="text-sm ml-2">{execution.threshold}</span>
                                  </div>

                                  <div>
                                    <span className="text-sm font-medium">Actions Taken:</span>
                                    <ul className="mt-1 ml-2 list-disc list-inside text-sm">
                                      {parseActions(execution.actionsTaken).map((action, idx) => (
                                        <li key={idx}>{action}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {execution.responseMessage && (
                                    <div>
                                      <span className="text-sm font-medium">Response:</span>
                                      <p className="text-sm ml-2 mt-1">{execution.responseMessage}</p>
                                    </div>
                                  )}

                                  {execution.projectId && (
                                    <div>
                                      <span className="text-sm font-medium">Project ID:</span>
                                      <span className="text-sm ml-2">{execution.projectId}</span>
                                    </div>
                                  )}

                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewDetails(execution)}
                                    >
                                      View Full Details
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        {selectedExecution && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Execution Details</DialogTitle>
                <DialogDescription>{selectedExecution.ruleName}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Triggered At</Label>
                    <p className="text-sm mt-1">
                      {new Date(selectedExecution.triggeredAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={STATUS_CONFIG[selectedExecution.status].color}
                      >
                        {STATUS_CONFIG[selectedExecution.status].label}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">From Agent</Label>
                    <p className="text-sm mt-1">{selectedExecution.fromAgent}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">To Agent</Label>
                    <p className="text-sm mt-1">{selectedExecution.toAgent || 'N/A'}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Response Time</Label>
                    <p className="text-sm mt-1">
                      {formatDuration(selectedExecution.responseTimeSeconds)}
                    </p>
                  </div>

                  {selectedExecution.projectId && (
                    <div>
                      <Label className="text-muted-foreground">Project ID</Label>
                      <p className="text-sm mt-1">{selectedExecution.projectId}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Trigger</Label>
                  <p className="text-sm mt-1">
                    <span className="font-medium">{selectedExecution.triggerAttribute}</span>:{' '}
                    {selectedExecution.triggerValue} (threshold: {selectedExecution.threshold})
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Actions Taken</Label>
                  <ul className="mt-1 list-disc list-inside text-sm space-y-1">
                    {parseActions(selectedExecution.actionsTaken).map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>

                {selectedExecution.responseMessage && (
                  <div>
                    <Label className="text-muted-foreground">Response Message</Label>
                    <p className="text-sm mt-1">{selectedExecution.responseMessage}</p>
                  </div>
                )}

                {selectedExecution.metadata && (
                  <div>
                    <Label className="text-muted-foreground">Metadata</Label>
                    <pre className="text-xs mt-1 bg-muted p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedExecution.metadata), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedExecution.acknowledgedAt && (
                  <div>
                    <Label className="text-muted-foreground">Acknowledged At</Label>
                    <p className="text-sm mt-1">
                      {new Date(selectedExecution.acknowledgedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedExecution.resolvedAt && (
                  <div>
                    <Label className="text-muted-foreground">Resolved At</Label>
                    <p className="text-sm mt-1">
                      {new Date(selectedExecution.resolvedAt).toLocaleString()}
                    </p>
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
