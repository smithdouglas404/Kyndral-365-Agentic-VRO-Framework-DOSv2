/**
 * AGENT RULES MANAGEMENT
 *
 * Unified rules management for agent owners
 * Rules are simple if-then-else conditions that agents evaluate
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

// Agent type interface
interface AgentType {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  icon?: string;
  color?: string;
}

// Operators for conditions
const OPERATORS = [
  { value: 'lt', label: '<', description: 'Less than' },
  { value: 'lte', label: '<=', description: 'Less than or equal' },
  { value: 'gt', label: '>', description: 'Greater than' },
  { value: 'gte', label: '>=', description: 'Greater than or equal' },
  { value: 'eq', label: '==', description: 'Equal to' },
  { value: 'neq', label: '!=', description: 'Not equal to' },
];

// Action types
const ACTION_TYPES = [
  { value: 'alert', label: 'Send Alert', description: 'Send an alert notification' },
  { value: 'escalate', label: 'Escalate', description: 'Escalate to management' },
  { value: 'notify', label: 'Notify Team', description: 'Notify assigned team members' },
  { value: 'log', label: 'Log Event', description: 'Log for audit trail' },
  { value: 'trigger_workflow', label: 'Trigger Workflow', description: 'Start a workflow action' },
];

// Severity levels
const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

interface RuleCondition {
  field: string;
  operator: string;
  value: number | string;
}

interface RuleAction {
  type: string;
  severity: string;
  message: string;
  notifyRoles?: string[];
}

interface Rule {
  id: string;
  sourceAgent: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: string;
  updatedAt: string;
}

interface RuleFormData {
  name: string;
  description: string;
  field: string;
  operator: string;
  value: string;
  actionType: string;
  severity: string;
  message: string;
}

const emptyRuleForm: RuleFormData = {
  name: '',
  description: '',
  field: '',
  operator: 'lt',
  value: '',
  actionType: 'alert',
  severity: 'medium',
  message: '',
};

export default function AgentRules() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [ruleForm, setRuleForm] = useState<RuleFormData>(emptyRuleForm);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // Fetch agents from database
  const { data: agentsData, isLoading: loadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agents?enabled=true');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
  });

  const agents: AgentType[] = agentsData?.agents || [];
  const selectedAgentInfo = agents.find((a) => a.id === selectedAgent);

  // Fetch rules for selected agent
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['agent-rules', selectedAgent],
    queryFn: async () => {
      if (!selectedAgent) return { rules: [] };
      const res = await fetch(`/api/rules/agent/${selectedAgent}`);
      if (!res.ok) throw new Error('Failed to fetch rules');
      return res.json();
    },
    enabled: !!selectedAgent,
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: { agentId: string; rule: RuleFormData }) => {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAgent: data.agentId,
          name: data.rule.name,
          description: data.rule.description,
          conditions: [{
            field: data.rule.field,
            operator: data.rule.operator,
            value: isNaN(Number(data.rule.value)) ? data.rule.value : Number(data.rule.value),
          }],
          actions: [{
            type: data.rule.actionType,
            severity: data.rule.severity,
            message: data.rule.message,
          }],
        }),
      });
      if (!res.ok) throw new Error('Failed to create rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-rules', selectedAgent] });
      setIsAddingRule(false);
      setRuleForm(emptyRuleForm);
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async (data: { ruleId: string; rule: Partial<Rule> }) => {
      const res = await fetch(`/api/rules/${data.ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.rule),
      });
      if (!res.ok) throw new Error('Failed to update rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-rules', selectedAgent] });
      setEditingRule(null);
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const res = await fetch(`/api/rules/${ruleId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-rules', selectedAgent] });
    },
  });

  // Toggle rule enabled/disabled
  const toggleRuleMutation = useMutation({
    mutationFn: async (data: { ruleId: string; enabled: boolean }) => {
      const res = await fetch(`/api/rules/${data.ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: data.enabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-rules', selectedAgent] });
    },
  });

  const handleCreateRule = () => {
    if (!selectedAgent || !ruleForm.name || !ruleForm.field || !ruleForm.value) return;
    createRuleMutation.mutate({ agentId: selectedAgent, rule: ruleForm });
  };

  const toggleExpanded = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const rules: Rule[] = rulesData?.rules || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold">Agent Rules</h1>
            </div>
            <p className="text-muted-foreground">
              Create and manage if-then-else rules for your agents
            </p>
          </div>
        </div>

        {/* Agent Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Agent</CardTitle>
            <CardDescription>Choose an agent to view and manage its rules</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select an agent..." />
              </SelectTrigger>
              <SelectContent>
                {loadingAgents ? (
                  <SelectItem value="" disabled>Loading agents...</SelectItem>
                ) : agents.length === 0 ? (
                  <SelectItem value="" disabled>No agents configured</SelectItem>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">{agent.description}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedAgent && (
          <>
            {/* Add Rule Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedAgentInfo?.name} Rules</h2>
                <p className="text-sm text-muted-foreground">
                  {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
                </p>
              </div>
              <Button onClick={() => setIsAddingRule(true)} disabled={isAddingRule} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Rule
              </Button>
            </div>

            {/* Add Rule Form */}
            {isAddingRule && (
              <Card className="border-2 border-purple-200 dark:border-purple-900">
                <CardHeader>
                  <CardTitle className="text-lg">New Rule</CardTitle>
                  <CardDescription>Define an if-then rule for {selectedAgentInfo?.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rule Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rule Name</Label>
                      <Input
                        placeholder="e.g., Budget Overrun Alert"
                        value={ruleForm.name}
                        onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        placeholder="Brief description of the rule"
                        value={ruleForm.description}
                        onChange={(e) => setRuleForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Condition: IF */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <Label className="text-sm font-semibold text-purple-700">IF</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Field</Label>
                        <Input
                          placeholder="e.g., cpi, budget_variance, risk_score"
                          value={ruleForm.field}
                          onChange={(e) => setRuleForm((f) => ({ ...f, field: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Operator</Label>
                        <Select
                          value={ruleForm.operator}
                          onValueChange={(v) => setRuleForm((f) => ({ ...f, operator: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label} ({op.description})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Value</Label>
                        <Input
                          placeholder="e.g., 0.8, 20, critical"
                          value={ruleForm.value}
                          onChange={(e) => setRuleForm((f) => ({ ...f, value: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action: THEN */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <Label className="text-sm font-semibold text-green-700">THEN</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Action</Label>
                        <Select
                          value={ruleForm.actionType}
                          onValueChange={(v) => setRuleForm((f) => ({ ...f, actionType: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map((action) => (
                              <SelectItem key={action.value} value={action.value}>
                                {action.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Severity</Label>
                        <Select
                          value={ruleForm.severity}
                          onValueChange={(v) => setRuleForm((f) => ({ ...f, severity: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEVERITY_LEVELS.map((sev) => (
                              <SelectItem key={sev.value} value={sev.value}>
                                {sev.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Message</Label>
                      <Input
                        placeholder="e.g., Budget variance exceeds threshold"
                        value={ruleForm.message}
                        onChange={(e) => setRuleForm((f) => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending} className="gap-2">
                      <Save className="w-4 h-4" />
                      {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
                    </Button>
                    <Button variant="outline" onClick={() => { setIsAddingRule(false); setRuleForm(emptyRuleForm); }}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules List */}
            {isLoading ? (
              <LoadingState message="Loading rules..." />
            ) : rules.length === 0 ? (
              <EmptyState
                title="No rules configured"
                description={`Get started by adding your first rule for ${selectedAgentInfo?.name || 'this agent'}.`}
                icon={Zap}
                action={{
                  label: 'Add Rule',
                  onClick: () => setIsAddingRule(true),
                }}
              />
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <Collapsible
                    key={rule.id}
                    open={expandedRules.has(rule.id)}
                    onOpenChange={() => toggleExpanded(rule.id)}
                  >
                    <Card className={rule.enabled ? '' : 'opacity-60'}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {expandedRules.has(rule.id) ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div>
                                <CardTitle className="text-base">{rule.name}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  IF {rule.conditions[0]?.field}{' '}
                                  {OPERATORS.find((o) => o.value === rule.conditions[0]?.operator)?.label}{' '}
                                  {rule.conditions[0]?.value} THEN {rule.actions[0]?.type}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                className={
                                  SEVERITY_LEVELS.find((s) => s.value === rule.actions[0]?.severity)?.color
                                }
                              >
                                {rule.actions[0]?.severity}
                              </Badge>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => {
                                  toggleRuleMutation.mutate({ ruleId: rule.id, enabled: checked });
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          {rule.description && (
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                              <div className="font-medium text-purple-700 dark:text-purple-400 mb-1">
                                Condition
                              </div>
                              <code className="text-xs">
                                {rule.conditions[0]?.field}{' '}
                                {OPERATORS.find((o) => o.value === rule.conditions[0]?.operator)?.label}{' '}
                                {rule.conditions[0]?.value}
                              </code>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                              <div className="font-medium text-green-700 dark:text-green-400 mb-1">
                                Action
                              </div>
                              <div className="text-xs">
                                <div>{ACTION_TYPES.find((a) => a.value === rule.actions[0]?.type)?.label}</div>
                                <div className="text-muted-foreground mt-1">{rule.actions[0]?.message}</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRule(rule.id)}
                              className="gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this rule?')) {
                                  deleteRuleMutation.mutate(rule.id);
                                }
                              }}
                              className="gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                            <span className="text-xs text-muted-foreground ml-auto">
                              Updated {new Date(rule.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}

            {/* Success Messages */}
            {createRuleMutation.isSuccess && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription>Rule created successfully!</AlertDescription>
              </Alert>
            )}
            {deleteRuleMutation.isSuccess && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription>Rule deleted successfully!</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
