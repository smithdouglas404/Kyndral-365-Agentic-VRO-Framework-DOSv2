import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight, Power, Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface AttributeDefinition {
  id: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'date';
  operators: string[];
  description?: string;
}

export interface ActionDefinition {
  id: string;
  label: string;
  description?: string;
  requiresTarget?: boolean;
}

export interface Rule {
  id: string;
  name: string;
  agent_type: string;
  attribute: string;
  operator: string;
  threshold: any;
  actions: string[];
  target_agents?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  enabled: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RuleEditorBaseProps {
  agentType: string;
  agentLabel: string;
  agentColor: string;
  attributes: AttributeDefinition[];
  actions: ActionDefinition[];
  specialFeatures?: React.ReactNode;
  onRuleSave?: (rule: Rule) => void;
  onRuleDelete?: (ruleId: string) => void;
}

const OPERATORS: Record<string, string[]> = {
  number: ['<', '<=', '>', '>=', '==', '!='],
  string: ['==', '!=', 'contains', 'startsWith', 'endsWith'],
  boolean: ['==', '!='],
  date: ['<', '<=', '>', '>=', '=='],
};

export function RuleEditorBase({
  agentType,
  agentLabel,
  agentColor,
  attributes,
  actions,
  specialFeatures,
  onRuleSave,
  onRuleDelete,
}: RuleEditorBaseProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Rule>>({
    name: '',
    agent_type: agentType,
    attribute: '',
    operator: '',
    threshold: '',
    actions: [],
    target_agents: [],
    priority: 'medium',
    enabled: true,
    description: '',
  });

  // Fetch rules for this agent
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['agent-rules', agentType],
    queryFn: async () => {
      const response = await fetch(`/api/rules/agent/${agentType}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch rules');
      return response.json();
    },
  });

  // Create/Update rule mutation
  const saveMutation = useMutation({
    mutationFn: async (rule: Partial<Rule>) => {
      const url = rule.id ? `/api/rules/${rule.id}` : '/api/rules';
      const method = rule.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rule),
      });

      if (!response.ok) throw new Error('Failed to save rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-rules', agentType] });
      resetForm();
      if (onRuleSave) onRuleSave(formData as Rule);
    },
  });

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete rule');
      return response.json();
    },
    onSuccess: (_, ruleId) => {
      queryClient.invalidateQueries({ queryKey: ['agent-rules', agentType] });
      if (onRuleDelete) onRuleDelete(ruleId);
    },
  });

  // Toggle rule enabled status
  const toggleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error('Failed to toggle rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-rules', agentType] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      agent_type: agentType,
      attribute: '',
      operator: '',
      threshold: '',
      actions: [],
      target_agents: [],
      priority: 'medium',
      enabled: true,
      description: '',
    });
    setIsCreating(false);
    setEditingRule(null);
  };

  const handleEdit = (rule: Rule) => {
    setFormData(rule);
    setEditingRule(rule);
    setIsCreating(true);
  };

  const handleDuplicate = (rule: Rule) => {
    setFormData({
      ...rule,
      id: undefined,
      name: `${rule.name} (Copy)`,
    });
    setIsCreating(true);
    setEditingRule(null);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteMutation.mutate(ruleId);
    }
  };

  const handleToggleEnabled = (rule: Rule) => {
    toggleMutation.mutate({ ruleId: rule.id, enabled: !rule.enabled });
  };

  const selectedAttribute = attributes.find((a) => a.id === formData.attribute);
  const availableOperators = selectedAttribute
    ? OPERATORS[selectedAttribute.type] || []
    : [];

  const rules: Rule[] = rulesData?.rules || [];

  if (isLoading) {
    return (
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: agentColor }}
                />
                {agentLabel} Rule Editor
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Configure collaboration rules and thresholds
              </p>
            </div>
            <Button
              onClick={() => setIsCreating(!isCreating)}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              {isCreating ? (
                <>
                  <X size={16} className="mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-1" />
                  New Rule
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Special Features (if provided) */}
      {specialFeatures && <div>{specialFeatures}</div>}

      {/* Rule Creation/Edit Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle>
                  {editingRule ? 'Edit Rule' : 'Create New Rule'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rule Name */}
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., High Budget Overrun Alert"
                  />
                </div>

                {/* Condition Builder */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attribute">Attribute</Label>
                    <Select
                      value={formData.attribute}
                      onValueChange={(value) =>
                        setFormData({ ...formData, attribute: value, operator: '', threshold: '' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select attribute" />
                      </SelectTrigger>
                      <SelectContent>
                        {attributes.map((attr) => (
                          <SelectItem key={attr.id} value={attr.id}>
                            {attr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operator">Operator</Label>
                    <Select
                      value={formData.operator}
                      onValueChange={(value) => setFormData({ ...formData, operator: value })}
                      disabled={!formData.attribute}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOperators.map((op) => (
                          <SelectItem key={op} value={op}>
                            {op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold">Threshold</Label>
                    <Input
                      id="threshold"
                      type={selectedAttribute?.type === 'number' ? 'number' : 'text'}
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                      placeholder="Enter value"
                      disabled={!formData.operator}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Label>Actions (select one or more)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {actions.map((action) => (
                      <Button
                        key={action.id}
                        variant={formData.actions?.includes(action.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const currentActions = formData.actions || [];
                          const newActions = currentActions.includes(action.id)
                            ? currentActions.filter((a) => a !== action.id)
                            : [...currentActions, action.id];
                          setFormData({ ...formData, actions: newActions });
                        }}
                        className="justify-start"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Explain when this rule should fire"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    <Save size={16} className="mr-1" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Rule'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <X size={16} className="mr-1" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Rules ({rules.length})</span>
            {rules.length > 0 && (
              <Badge variant="outline">
                {rules.filter((r) => r.enabled).length} enabled
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No rules configured yet</p>
              <p className="text-sm mb-4">
                Create your first rule to start automating collaboration
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus size={16} className="mr-1" />
                Create First Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`${
                    rule.enabled ? 'bg-white' : 'bg-gray-50 opacity-70'
                  } transition-all hover:shadow-md`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() =>
                              setExpandedRule(expandedRule === rule.id ? null : rule.id)
                            }
                          >
                            {expandedRule === rule.id ? (
                              <ChevronDown size={20} />
                            ) : (
                              <ChevronRight size={20} />
                            )}
                          </Button>
                          <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                          <Badge
                            variant={rule.priority === 'urgent' ? 'destructive' : 'default'}
                            className={
                              rule.priority === 'high'
                                ? 'bg-orange-500'
                                : rule.priority === 'medium'
                                ? 'bg-blue-500'
                                : 'bg-gray-500'
                            }
                          >
                            {rule.priority}
                          </Badge>
                          {rule.enabled ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 size={12} className="mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Disabled
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 ml-9">
                          {rule.attribute} {rule.operator} {rule.threshold} →{' '}
                          {rule.actions.join(', ')}
                        </p>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedRule === rule.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 ml-9 p-4 bg-gray-50 rounded-lg space-y-2 text-sm"
                            >
                              {rule.description && (
                                <p className="text-gray-700">{rule.description}</p>
                              )}
                              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                                <div>
                                  <strong>Created:</strong>{' '}
                                  {rule.created_at
                                    ? new Date(rule.created_at).toLocaleDateString()
                                    : 'N/A'}
                                </div>
                                <div>
                                  <strong>Updated:</strong>{' '}
                                  {rule.updated_at
                                    ? new Date(rule.updated_at).toLocaleDateString()
                                    : 'N/A'}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleEnabled(rule)}
                          title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                        >
                          <Power
                            size={16}
                            className={rule.enabled ? 'text-green-600' : 'text-gray-400'}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                          title="Edit rule"
                        >
                          <Edit size={16} className="text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(rule)}
                          title="Duplicate rule"
                        >
                          <Copy size={16} className="text-purple-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
                          title="Delete rule"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
