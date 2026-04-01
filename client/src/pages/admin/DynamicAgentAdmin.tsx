import { AdminLayout } from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Plus, Trash2, Edit2, Save, X, Bot, CheckCircle2, AlertTriangle,
  Zap, Settings, RefreshCw, Wrench, Eye, EyeOff, Activity,
  Clock, BarChart3, AlertCircle, Cpu, ArrowUpDown, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

interface DynamicAgent {
  key: string;
  name: string;
  agentId: string;
  instructions: string;
  model: string;
  enabled: boolean;
  skills: { id: string; name: string; description: string }[];
  toolMappings: string[];
  tags: string[];
  skillCount: number;
  toolCount: number;
}

interface ToolRegistry {
  availableToolSets: string[];
  toolDetails: Record<string, string[]>;
}

interface TraceSummary {
  totalTraces: number;
  activeAgents: number;
  totalErrors: number;
  tracesByType: Record<string, number>;
  recentErrors: any[];
  systemUptime: number;
}

interface AgentMetric {
  agentKey: string;
  totalInvocations: number;
  totalErrors: number;
  avgDurationMs: number;
  totalTokensUsed: number;
  toolBreakdown: Record<string, { calls: number; errors: number; avgDurationMs: number }>;
  lastActivity: string | null;
  uptime: number;
}

interface TraceEvent {
  id: string;
  traceId: string;
  agentKey: string;
  eventType: string;
  toolId?: string;
  input?: any;
  output?: any;
  error?: string;
  durationMs?: number;
  tokenUsage?: { input: number; output: number; total: number };
  metadata?: any;
  timestamp: string;
}

interface AgentFormData {
  agentKey: string;
  agentId: string;
  name: string;
  instructions: string;
  model: string;
  toolMappings: string[];
  tags: string;
  skills: string;
}

const emptyForm: AgentFormData = {
  agentKey: '',
  agentId: '',
  name: '',
  instructions: '',
  model: 'anthropic:claude-sonnet-4-20250514',
  toolMappings: [],
  tags: '',
  skills: '[]',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function DynamicAgentAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('agents');
  const [isCreating, setIsCreating] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<AgentFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [traceFilter, setTraceFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data: agentsData, isLoading: loadingAgents } = useQuery({
    queryKey: ['dynamic-agents'],
    queryFn: async () => {
      const res = await fetch('/api/dynamic-agents/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: toolRegistry } = useQuery<ToolRegistry>({
    queryKey: ['tool-registry'],
    queryFn: async () => {
      const res = await fetch('/api/dynamic-agents/tool-registry');
      if (!res.ok) throw new Error('Failed to fetch tool registry');
      return res.json();
    },
  });

  const { data: traceSummary } = useQuery<TraceSummary>({
    queryKey: ['trace-summary'],
    queryFn: async () => {
      const res = await fetch('/api/agent-tracing/summary');
      if (!res.ok) throw new Error('Failed to fetch trace summary');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: metricsData } = useQuery<{ metrics: AgentMetric[] }>({
    queryKey: ['agent-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/agent-tracing/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    refetchInterval: 5000,
    enabled: activeTab === 'observability',
  });

  const { data: tracesData } = useQuery<{ traces: TraceEvent[]; count: number }>({
    queryKey: ['agent-traces', traceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (traceFilter) params.set('agentKey', traceFilter);
      const res = await fetch(`/api/agent-tracing/traces?${params}`);
      if (!res.ok) throw new Error('Failed to fetch traces');
      return res.json();
    },
    refetchInterval: 5000,
    enabled: activeTab === 'traces',
  });

  const createMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const res = await fetch('/api/dynamic-agents/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentKey: data.agentKey,
          agentId: data.agentId,
          name: data.name,
          instructions: data.instructions,
          model: data.model,
          toolMappings: data.toolMappings,
          tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
          skills: JSON.parse(data.skills || '[]'),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create agent');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-agents'] });
      setIsCreating(false);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, data }: { key: string; data: Partial<AgentFormData> }) => {
      const body: any = {};
      if (data.name !== undefined) body.name = data.name;
      if (data.instructions !== undefined) body.instructions = data.instructions;
      if (data.model !== undefined) body.model = data.model;
      if (data.toolMappings !== undefined) body.toolMappings = data.toolMappings;
      if (data.tags !== undefined) body.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (data.skills !== undefined) body.skills = JSON.parse(data.skills || '[]');

      const res = await fetch(`/api/dynamic-agents/agents/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update agent');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-agents'] });
      setEditingKey(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const res = await fetch(`/api/dynamic-agents/agents/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle agent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-agents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`/api/dynamic-agents/agents/${key}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete agent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-agents'] });
      setDeleteConfirm(null);
    },
  });

  const agents: DynamicAgent[] = agentsData?.agents || [];
  const totalTools = agents.reduce((sum, a) => sum + (a.toolCount || 0), 0);

  function startEdit(agent: DynamicAgent) {
    setEditingKey(agent.key);
    setForm({
      agentKey: agent.key,
      agentId: agent.agentId,
      name: agent.name,
      instructions: agent.instructions,
      model: agent.model,
      toolMappings: agent.toolMappings || [],
      tags: (agent.tags || []).join(', '),
      skills: JSON.stringify(agent.skills || [], null, 2),
    });
  }

  function autoGenerateId(name: string) {
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    setForm(prev => ({
      ...prev,
      agentKey: key,
      agentId: `${key}-agent`,
    }));
  }

  const eventTypeColors: Record<string, string> = {
    'tool-call': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'tool-result': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'agent-start': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'agent-end': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'a2a-message': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'fact-broadcast': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'rule-evaluation': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Dynamic Agent Administration</h1>
            <p className="text-muted-foreground">Create, manage, and monitor agents in real-time — no restart needed</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm px-3 py-1" data-testid="badge-agent-count">
              <Bot className="w-4 h-4 mr-1" /> {agents.length} Agents
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1" data-testid="badge-tool-count">
              <Wrench className="w-4 h-4 mr-1" /> {totalTools} Tools
            </Badge>
            {traceSummary && (
              <Badge variant={traceSummary.totalErrors > 0 ? 'destructive' : 'outline'} className="text-sm px-3 py-1" data-testid="badge-error-count">
                <AlertCircle className="w-4 h-4 mr-1" /> {traceSummary.totalErrors} Errors
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents" data-testid="tab-agents">
              <Bot className="w-4 h-4 mr-2" /> Agents
            </TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools">
              <Wrench className="w-4 h-4 mr-2" /> Tool Registry
            </TabsTrigger>
            <TabsTrigger value="observability" data-testid="tab-observability">
              <BarChart3 className="w-4 h-4 mr-2" /> Observability
            </TabsTrigger>
            <TabsTrigger value="traces" data-testid="tab-traces">
              <Activity className="w-4 h-4 mr-2" /> Traces
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={() => { setIsCreating(true); setForm(emptyForm); setError(null); }} data-testid="button-create-agent">
                <Plus className="w-4 h-4 mr-2" /> Create Agent
              </Button>
            </div>

            {loadingAgents ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4">
                {agents.map((agent) => (
                  <Card key={agent.key} className={`transition-all ${!agent.enabled ? 'opacity-60' : ''}`} data-testid={`card-agent-${agent.key}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${agent.enabled ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <Bot className={`w-5 h-5 ${agent.enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{agent.name}</CardTitle>
                            <CardDescription className="font-mono text-xs">{agent.key} / {agent.agentId}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Switch
                                    checked={agent.enabled}
                                    onCheckedChange={(checked) => toggleMutation.mutate({ key: agent.key, enabled: checked })}
                                    data-testid={`switch-toggle-${agent.key}`}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{agent.enabled ? 'Disable agent' : 'Enable agent'}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(agent)} data-testid={`button-edit-${agent.key}`}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedAgent(expandedAgent === agent.key ? null : agent.key)} data-testid={`button-expand-${agent.key}`}>
                            {expandedAgent === agent.key ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirm(agent.key)} data-testid={`button-delete-${agent.key}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" data-testid={`badge-skills-${agent.key}`}>
                          <Zap className="w-3 h-3 mr-1" /> {agent.skillCount} skills
                        </Badge>
                        <Badge variant="secondary" data-testid={`badge-tools-${agent.key}`}>
                          <Wrench className="w-3 h-3 mr-1" /> {(agent.toolMappings || []).join(', ')}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs" data-testid={`badge-model-${agent.key}`}>
                          <Cpu className="w-3 h-3 mr-1" /> {agent.model}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(agent.tags || []).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>

                      {expandedAgent === agent.key && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Instructions</Label>
                            <pre className="mt-1 text-xs bg-slate-50 dark:bg-slate-800 rounded p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">{agent.instructions}</pre>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground">Skills</Label>
                            <div className="mt-1 space-y-1">
                              {(agent.skills || []).map((skill) => (
                                <div key={skill.id} className="flex items-start gap-2 text-xs bg-slate-50 dark:bg-slate-800 rounded p-2">
                                  <Zap className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" />
                                  <div>
                                    <span className="font-medium">{skill.name}</span>
                                    <span className="text-muted-foreground ml-2">{skill.description}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Tool Sets</CardTitle>
                <CardDescription>These tool sets can be composed into new agents via the toolMappings field</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {toolRegistry && Object.entries(toolRegistry.toolDetails).map(([setName, tools]) => (
                    <Card key={setName} className="border" data-testid={`card-toolset-${setName}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-mono">{setName}</CardTitle>
                          <Badge variant="secondary">{tools.length} tools</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {tools.map((tool) => (
                            <div key={tool} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Wrench className="w-3 h-3 shrink-0" />
                              <span className="font-mono">{tool}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="observability" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="card-metric-traces">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Traces</p>
                      <p className="text-3xl font-bold">{formatNumber(traceSummary?.totalTraces || 0)}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-metric-active">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Agents</p>
                      <p className="text-3xl font-bold">{traceSummary?.activeAgents || 0}</p>
                    </div>
                    <Bot className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-metric-errors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Errors</p>
                      <p className="text-3xl font-bold text-red-600">{traceSummary?.totalErrors || 0}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-metric-uptime">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">System Uptime</p>
                      <p className="text-3xl font-bold">{formatUptime(traceSummary?.systemUptime || 0)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {traceSummary && Object.keys(traceSummary.tracesByType).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(traceSummary.tracesByType).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-2">
                        <Badge className={eventTypeColors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>
                        <span className="text-sm font-mono">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Agent Metrics</CardTitle>
                <CardDescription>Per-agent performance and resource consumption</CardDescription>
              </CardHeader>
              <CardContent>
                {(metricsData?.metrics || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No metrics recorded yet. Metrics appear when agents process requests.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(metricsData?.metrics || []).map((m) => (
                      <div key={m.agentKey} className="border rounded-lg p-4" data-testid={`metric-agent-${m.agentKey}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold">{m.agentKey}</span>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{m.totalInvocations} calls</span>
                            <span>{m.totalErrors} errors</span>
                            <span>{formatDuration(m.avgDurationMs)} avg</span>
                            <span>{formatNumber(m.totalTokensUsed)} tokens</span>
                          </div>
                        </div>
                        {Object.keys(m.toolBreakdown).length > 0 && (
                          <div className="grid gap-2 md:grid-cols-3">
                            {Object.entries(m.toolBreakdown).map(([toolId, stats]) => (
                              <div key={toolId} className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs">
                                <span className="font-mono font-medium">{toolId}</span>
                                <div className="flex gap-3 mt-1 text-muted-foreground">
                                  <span>{stats.calls} calls</span>
                                  <span>{stats.errors} errors</span>
                                  <span>{formatDuration(stats.avgDurationMs)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {traceSummary && traceSummary.recentErrors.length > 0 && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600">Recent Errors (Last 5 min)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {traceSummary.recentErrors.map((err: any, i: number) => (
                      <div key={i} className="bg-red-50 dark:bg-red-900/20 rounded p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="font-mono font-medium">{err.agentKey}</span>
                          {err.toolId && <Badge variant="outline" className="text-xs">{err.toolId}</Badge>}
                        </div>
                        <p className="mt-1 text-red-700 dark:text-red-300">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="traces" className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Filter by agent key..."
                value={traceFilter}
                onChange={(e) => setTraceFilter(e.target.value)}
                className="max-w-xs"
                data-testid="input-trace-filter"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-traces'] })}
                data-testid="button-refresh-traces"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <span className="text-sm text-muted-foreground">
                {tracesData?.count || 0} events
              </span>
            </div>

            <Card>
              <CardContent className="pt-6">
                {(tracesData?.traces || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No trace events recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[600px] overflow-y-auto">
                    {(tracesData?.traces || []).map((trace) => (
                      <div key={trace.id} className="flex items-start gap-3 py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-sm border-b border-slate-100 dark:border-slate-800" data-testid={`trace-event-${trace.id}`}>
                        <Badge className={`${eventTypeColors[trace.eventType] || ''} text-xs shrink-0`}>
                          {trace.eventType}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground shrink-0 w-16">{trace.agentKey}</span>
                        {trace.toolId && (
                          <Badge variant="outline" className="text-xs shrink-0">{trace.toolId}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {trace.error || (trace.metadata ? JSON.stringify(trace.metadata).substring(0, 100) : '')}
                        </span>
                        {trace.durationMs !== undefined && (
                          <span className="text-xs text-muted-foreground shrink-0">{formatDuration(trace.durationMs)}</span>
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(trace.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>Define a new agent that will be instantly registered with Mastra, A2A, and MCP</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); autoGenerateId(e.target.value); }}
                    placeholder="e.g. Sustainability Agent"
                    data-testid="input-agent-name"
                  />
                </div>
                <div>
                  <Label htmlFor="agentKey">Agent Key (auto-generated)</Label>
                  <Input
                    id="agentKey"
                    value={form.agentKey}
                    onChange={(e) => setForm(prev => ({ ...prev, agentKey: e.target.value, agentId: `${e.target.value}-agent` }))}
                    placeholder="e.g. sustainability"
                    className="font-mono"
                    data-testid="input-agent-key"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={form.instructions}
                  onChange={(e) => setForm(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={6}
                  placeholder="You are the [Name] Agent responsible for:&#10;- Capability 1&#10;- Capability 2"
                  data-testid="input-instructions"
                />
              </div>
              <div>
                <Label>Tool Mappings</Label>
                <p className="text-xs text-muted-foreground mb-2">Select which tool sets this agent can use</p>
                <div className="flex flex-wrap gap-2">
                  {(toolRegistry?.availableToolSets || []).map((set) => (
                    <Badge
                      key={set}
                      variant={form.toolMappings.includes(set) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          toolMappings: prev.toolMappings.includes(set)
                            ? prev.toolMappings.filter(s => s !== set)
                            : [...prev.toolMappings, set],
                        }));
                      }}
                      data-testid={`badge-toolmap-${set}`}
                    >
                      {set}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="sustainability, esg, compliance"
                  data-testid="input-tags"
                />
              </div>
              <div>
                <Label htmlFor="skills">Skills (JSON array)</Label>
                <Textarea
                  id="skills"
                  value={form.skills}
                  onChange={(e) => setForm(prev => ({ ...prev, skills: e.target.value }))}
                  rows={4}
                  className="font-mono text-xs"
                  placeholder='[{"id": "skill-id", "name": "Skill Name", "description": "What it does"}]'
                  data-testid="input-skills"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreating(false); setError(null); }} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.agentKey || createMutation.isPending} data-testid="button-save-agent">
                {createMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Create Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingKey} onOpenChange={() => { setEditingKey(null); setError(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Agent: {editingKey}</DialogTitle>
              <DialogDescription>Changes take effect immediately — the agent is hot-reloaded in memory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="edit-name">Agent Name</Label>
                <Input id="edit-name" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} data-testid="input-edit-name" />
              </div>
              <div>
                <Label htmlFor="edit-instructions">Instructions</Label>
                <Textarea id="edit-instructions" value={form.instructions} onChange={(e) => setForm(prev => ({ ...prev, instructions: e.target.value }))} rows={6} data-testid="input-edit-instructions" />
              </div>
              <div>
                <Label>Tool Mappings</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(toolRegistry?.availableToolSets || []).map((set) => (
                    <Badge
                      key={set}
                      variant={form.toolMappings.includes(set) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          toolMappings: prev.toolMappings.includes(set)
                            ? prev.toolMappings.filter(s => s !== set)
                            : [...prev.toolMappings, set],
                        }));
                      }}
                    >
                      {set}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags</Label>
                <Input id="edit-tags" value={form.tags} onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))} data-testid="input-edit-tags" />
              </div>
              <div>
                <Label htmlFor="edit-skills">Skills (JSON)</Label>
                <Textarea id="edit-skills" value={form.skills} onChange={(e) => setForm(prev => ({ ...prev, skills: e.target.value }))} rows={4} className="font-mono text-xs" data-testid="input-edit-skills" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingKey(null); setError(null); }} data-testid="button-cancel-edit">Cancel</Button>
              <Button onClick={() => editingKey && updateMutation.mutate({ key: editingKey, data: form })} disabled={updateMutation.isPending} data-testid="button-save-edit">
                {updateMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Agent</DialogTitle>
              <DialogDescription>Are you sure you want to remove agent "{deleteConfirm}"? This will unregister it from Mastra, A2A, and MCP immediately.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete">Cancel</Button>
              <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
                {deleteMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
