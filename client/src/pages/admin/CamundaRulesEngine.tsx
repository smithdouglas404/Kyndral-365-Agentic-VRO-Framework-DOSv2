import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Zap,
  Shield,
  Activity,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const AGENT_COLORS: Record<string, string> = {
  finops: 'bg-emerald-100 text-emerald-800',
  tmo: 'bg-blue-100 text-blue-800',
  risk: 'bg-red-100 text-red-800',
  governance: 'bg-purple-100 text-purple-800',
  pmo: 'bg-cyan-100 text-cyan-800',
  vro: 'bg-amber-100 text-amber-800',
  ocm: 'bg-pink-100 text-pink-800',
  planning: 'bg-indigo-100 text-indigo-800',
  okr: 'bg-teal-100 text-teal-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  'budget-alert': 'Budget',
  'schedule-alert': 'Schedule',
  'risk-alert': 'Risk',
  'compliance-alert': 'Compliance',
  'health-alert': 'Health',
  'value-gap': 'Value',
  'change-impact': 'Change',
  'dependency-alert': 'Dependencies',
};

function RuleCard({
  rule,
  onUpdate,
  onToggle,
  onReset,
}: {
  rule: any;
  onUpdate: (slug: string, field: string, updates: any) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  onReset: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState<number>(0);
  const [editSeverity, setEditSeverity] = useState<string>('medium');

  const startEdit = (field: string, config: any) => {
    setEditingField(field);
    setEditThreshold(config.threshold);
    setEditSeverity(config.severity);
  };

  const saveEdit = (field: string) => {
    onUpdate(rule.slug, field, { threshold: editThreshold, severity: editSeverity });
    setEditingField(null);
  };

  return (
    <Card data-testid={`rule-card-${rule.slug}`} className={`transition-all ${!rule.enabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              data-testid={`toggle-expand-${rule.slug}`}
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">{rule.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5 truncate">{rule.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={AGENT_COLORS[rule.agentMapping] || 'bg-gray-100 text-gray-800'} variant="secondary">
              {rule.agentMapping}
            </Badge>
            <Badge className={`text-xs ${SEVERITY_COLORS[Object.values(rule.thresholds || {})[0]?.severity || 'medium']}`} variant="secondary">
              {CATEGORY_LABELS[rule.category] || rule.category}
            </Badge>
            {rule.override && (
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Modified</Badge>
            )}
            <button
              data-testid={`toggle-rule-${rule.slug}`}
              onClick={() => onToggle(rule.slug, !rule.enabled)}
              className="ml-2"
            >
              {rule.enabled ? (
                <ToggleRight className="h-6 w-6 text-green-500" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-2">
          <div className="space-y-3">
            {Object.entries(rule.thresholds || {}).map(([field, config]: [string, any]) => (
              <div key={field} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {editingField === field ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-xs font-mono shrink-0">{field}</Label>
                    <Select value={config.operator} disabled>
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">&gt;</SelectItem>
                        <SelectItem value="gte">&gt;=</SelectItem>
                        <SelectItem value="lt">&lt;</SelectItem>
                        <SelectItem value="lte">&lt;=</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      data-testid={`input-threshold-${rule.slug}-${field}`}
                      type="number"
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(parseFloat(e.target.value))}
                      className="w-24 h-8 text-xs"
                    />
                    <Select value={editSeverity} onValueChange={setEditSeverity}>
                      <SelectTrigger className="w-28 h-8 text-xs" data-testid={`select-severity-${rule.slug}-${field}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      data-testid={`save-threshold-${rule.slug}-${field}`}
                      size="sm"
                      variant="default"
                      className="h-8"
                      onClick={() => saveEdit(field)}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingField(null)}>
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{field}</span>
                    <span className="text-xs text-muted-foreground">
                      {config.operator === 'gte' ? '>=' : config.operator === 'lte' ? '<=' : config.operator === 'gt' ? '>' : '<'}
                    </span>
                    <span className="text-sm font-semibold">{config.threshold}</span>
                    {config.isOverridden && (
                      <span className="text-xs text-amber-600">(was {config.originalThreshold})</span>
                    )}
                    <Badge className={`text-xs ${SEVERITY_COLORS[config.severity]}`} variant="secondary">
                      {config.severity}
                    </Badge>
                    {config.escalateSeverity && (
                      <span className="text-xs text-muted-foreground">escalates to {config.escalateSeverity}</span>
                    )}
                    <div className="ml-auto">
                      <Button
                        data-testid={`edit-threshold-${rule.slug}-${field}`}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => startEdit(field, config)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {rule.override && (
              <div className="flex justify-end">
                <Button
                  data-testid={`reset-rule-${rule.slug}`}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onReset(rule.slug)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset to defaults
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function EnterpriseRulesEnginePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('rules');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    slug: '',
    name: '',
    description: '',
    agentMapping: 'pmo',
    category: 'health-alert',
    thresholdField: '',
    thresholdValue: 0,
    thresholdOperator: 'gte' as string,
    thresholdSeverity: 'medium' as string,
  });

  const { data: status } = useQuery({
    queryKey: ['enterprise-rules-status'],
    queryFn: () => fetch('/api/enterprise-rules/status').then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: rulesData, refetch: refetchRules } = useQuery({
    queryKey: ['enterprise-rules-list'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise-rules/rules');
      const data = await res.json();
      const details = await Promise.all(
        (data.rules || []).map(async (r: any) => {
          const det = await fetch(`/api/enterprise-rules/rules/${r.slug}`).then(r2 => r2.json());
          return det;
        })
      );
      return details;
    },
  });

  const updateThreshold = useMutation({
    mutationFn: async ({ slug, field, updates }: { slug: string; field: string; updates: any }) => {
      const res = await fetch(`/api/enterprise-rules/rules/${slug}/threshold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, ...updates }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Threshold updated', description: data.message });
      refetchRules();
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ slug, enabled }: { slug: string; enabled: boolean }) => {
      const action = enabled ? 'enable' : 'disable';
      const res = await fetch(`/api/enterprise-rules/rules/${slug}/${action}`, { method: 'POST' });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      refetchRules();
    },
  });

  const resetRule = useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/enterprise-rules/rules/${slug}/reset`, { method: 'POST' });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Rule reset', description: data.message });
      refetchRules();
    },
  });

  const addCustomRule = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/enterprise-rules/rules/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newRule.slug,
          name: newRule.name,
          description: newRule.description,
          agentMapping: newRule.agentMapping,
          category: newRule.category,
          thresholds: newRule.thresholdField
            ? {
                [newRule.thresholdField]: {
                  threshold: newRule.thresholdValue,
                  operator: newRule.thresholdOperator,
                  severity: newRule.thresholdSeverity,
                },
              }
            : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add rule');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Custom rule added', description: data.message });
      setShowAddRule(false);
      setNewRule({ slug: '', name: '', description: '', agentMapping: 'pmo', category: 'health-alert', thresholdField: '', thresholdValue: 0, thresholdOperator: 'gte', thresholdSeverity: 'medium' });
      refetchRules();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteCustomRule = useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/enterprise-rules/rules/custom/${slug}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Rule removed', description: data.message });
      refetchRules();
    },
  });

  const evaluatePortfolio = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/enterprise-rules/evaluate/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executeActions: false }),
      });
      return res.json();
    },
  });

  const filteredRules = (rulesData || []).filter((r: any) =>
    filterAgent === 'all' || r.agentMapping === filterAgent
  );

  const agents = [...new Set((rulesData || []).map((r: any) => r.agentMapping))].sort();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Enterprise Rules Engine</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage Rulebricks rules, thresholds, and Palantir Action mappings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://rulebricks.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-rulebricks-dashboard"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Rulebricks Dashboard
              </Button>
            </a>
            <Button
              data-testid="button-refresh-rules"
              variant="outline"
              size="sm"
              onClick={() => refetchRules()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                {status?.rulebricks?.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Rulebricks</p>
                  <p className="text-xs text-muted-foreground">
                    {status?.rulebricks?.available ? 'Connected' : 'Local fallback'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                {status?.palantirRules?.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium">Palantir Rules</p>
                  <p className="text-xs text-muted-foreground">
                    {status?.palantirRules?.available ? 'Connected' : 'Not available'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium" data-testid="text-total-rules">{status?.rulebricks?.totalRules || 0} Rules</p>
                  <p className="text-xs text-muted-foreground">Enterprise rules defined</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium" data-testid="text-palantir-actions">{status?.palantirActions?.mappedRules || 0} Actions</p>
                  <p className="text-xs text-muted-foreground">Palantir Actions mapped</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules" data-testid="tab-rules">Rules</TabsTrigger>
            <TabsTrigger value="evaluate" data-testid="tab-evaluate">Evaluate</TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">Palantir Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Filter by agent:</Label>
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-40 h-8" data-testid="select-filter-agent">
                    <SelectValue placeholder="All agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All agents</SelectItem>
                    {agents.map((a: string) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-testid="button-add-custom-rule"
                size="sm"
                onClick={() => setShowAddRule(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Rule
              </Button>
            </div>

            <div className="space-y-3">
              {filteredRules.map((rule: any) => (
                <RuleCard
                  key={rule.slug}
                  rule={rule}
                  onUpdate={(slug, field, updates) => updateThreshold.mutate({ slug, field, updates })}
                  onToggle={(slug, enabled) => toggleRule.mutate({ slug, enabled })}
                  onReset={(slug) => resetRule.mutate(slug)}
                />
              ))}
              {filteredRules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No rules found {filterAgent !== 'all' ? `for ${filterAgent} agent` : ''}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="evaluate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Rule Evaluation</CardTitle>
                <CardDescription>
                  Run all rules against the entire Palantir portfolio. This is read-only and won't trigger any actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  data-testid="button-evaluate-portfolio"
                  onClick={() => evaluatePortfolio.mutate()}
                  disabled={evaluatePortfolio.isPending}
                >
                  {evaluatePortfolio.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  {evaluatePortfolio.isPending ? 'Evaluating...' : 'Evaluate Portfolio'}
                </Button>

                {evaluatePortfolio.data && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-2xl font-bold" data-testid="text-total-evaluated">{evaluatePortfolio.data.totalRulesEvaluated}</p>
                        <p className="text-xs text-muted-foreground">Rules evaluated</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-2xl font-bold text-red-600" data-testid="text-total-triggered">{evaluatePortfolio.data.totalTriggered}</p>
                        <p className="text-xs text-muted-foreground">Triggered</p>
                      </div>
                      {Object.entries(evaluatePortfolio.data.bySeverity || {}).map(([sev, count]: [string, any]) => (
                        count > 0 && (
                          <div key={sev} className="p-3 rounded-lg bg-muted">
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">
                              <Badge className={`text-xs ${SEVERITY_COLORS[sev]}`} variant="secondary">{sev}</Badge>
                            </p>
                          </div>
                        )
                      ))}
                    </div>

                    {Object.entries(evaluatePortfolio.data.byAgent || {}).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Alerts by Agent</h4>
                        {Object.entries(evaluatePortfolio.data.byAgent || {}).map(([agent, evals]: [string, any]) => (
                          <div key={agent} className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={AGENT_COLORS[agent] || 'bg-gray-100'} variant="secondary">{agent}</Badge>
                              <span className="text-sm text-muted-foreground">{evals.length} alerts</span>
                            </div>
                            <div className="space-y-1">
                              {evals.slice(0, 5).map((e: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <Badge className={`text-xs ${SEVERITY_COLORS[e.severity]}`} variant="secondary">{e.severity}</Badge>
                                  <span className="truncate">{e.message}</span>
                                </div>
                              ))}
                              {evals.length > 5 && (
                                <p className="text-xs text-muted-foreground">...and {evals.length - 5} more</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Palantir Action Mappings</CardTitle>
                <CardDescription>
                  These Palantir Actions fire when rules breach thresholds (requires admin authorization).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(status?.palantirActions?.actionNames || [])
                    .filter((name: string, idx: number, arr: string[]) => arr.indexOf(name) === idx)
                    .map((actionName: string) => (
                      <div key={actionName} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <code className="text-sm font-mono">{actionName}</code>
                        </div>
                        <Badge variant="outline" className="text-xs">Palantir Foundry</Badge>
                      </div>
                    ))}
                </div>

                <Alert className="mt-4">
                  <Settings className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    To execute Palantir Actions, set <code>executeActions: true</code> in evaluation requests with an <code>x-admin-token</code> header.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rule Categories</CardTitle>
                <CardDescription>Rules per category and their agent assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(status?.ruleCategories || {}).map(([cat, count]: [string, any]) => (
                    <div key={cat} className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Rule</DialogTitle>
            <DialogDescription>Create a new rule with a threshold for a specific agent.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Slug (unique ID)</Label>
                <Input
                  data-testid="input-new-rule-slug"
                  placeholder="e.g. team-velocity-low"
                  value={newRule.slug}
                  onChange={(e) => setNewRule({ ...newRule, slug: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  data-testid="input-new-rule-name"
                  placeholder="e.g. Team Velocity Below Target"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                data-testid="input-new-rule-description"
                placeholder="What does this rule check?"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Agent</Label>
                <Select value={newRule.agentMapping} onValueChange={(v) => setNewRule({ ...newRule, agentMapping: v })}>
                  <SelectTrigger data-testid="select-new-rule-agent"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(AGENT_COLORS).map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={newRule.category} onValueChange={(v) => setNewRule({ ...newRule, category: v })}>
                  <SelectTrigger data-testid="select-new-rule-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t pt-3">
              <Label className="text-xs font-medium">Threshold (optional)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Field</Label>
                  <Input
                    data-testid="input-new-rule-field"
                    placeholder="fieldName"
                    value={newRule.thresholdField}
                    onChange={(e) => setNewRule({ ...newRule, thresholdField: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select value={newRule.thresholdOperator} onValueChange={(v) => setNewRule({ ...newRule, thresholdOperator: v })}>
                    <SelectTrigger data-testid="select-new-rule-operator"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">&gt;</SelectItem>
                      <SelectItem value="gte">&gt;=</SelectItem>
                      <SelectItem value="lt">&lt;</SelectItem>
                      <SelectItem value="lte">&lt;=</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    data-testid="input-new-rule-value"
                    type="number"
                    value={newRule.thresholdValue}
                    onChange={(e) => setNewRule({ ...newRule, thresholdValue: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Severity</Label>
                  <Select value={newRule.thresholdSeverity} onValueChange={(v) => setNewRule({ ...newRule, thresholdSeverity: v })}>
                    <SelectTrigger data-testid="select-new-rule-severity"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRule(false)}>Cancel</Button>
            <Button
              data-testid="button-save-custom-rule"
              onClick={() => addCustomRule.mutate()}
              disabled={!newRule.slug || !newRule.name || addCustomRule.isPending}
            >
              {addCustomRule.isPending ? 'Adding...' : 'Add Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
