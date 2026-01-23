/**
 * WORKFLOW BUILDER - Visual Workflow Designer
 * Drag-and-drop workflow builder for approvals, notifications, and automated actions
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Play, Loader2, Workflow, GitBranch, Bell, CheckCircle, Clock, Zap } from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'approval' | 'notification' | 'action' | 'condition' | 'parallel' | 'wait';
  config: any;
  approvers?: string[];
  timeout?: number;
  escalation?: any;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  entity_type: string;
  trigger: {
    type: string;
    conditions: any;
  };
  steps: WorkflowStep[];
  is_active: boolean;
  created_at: string;
}

const ENTITY_TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'task', label: 'Task' },
  { value: 'issue', label: 'Issue' },
  { value: 'risk', label: 'Risk' },
  { value: 'change_request', label: 'Change Request' },
  { value: 'budget_change', label: 'Budget Change' },
];

const STEP_TYPES = [
  { value: 'approval', label: 'Approval', icon: CheckCircle, color: 'blue' },
  { value: 'notification', label: 'Notification', icon: Bell, color: 'yellow' },
  { value: 'action', label: 'Action', icon: Zap, color: 'purple' },
  { value: 'condition', label: 'Condition', icon: GitBranch, color: 'green' },
  { value: 'parallel', label: 'Parallel', icon: GitBranch, color: 'teal' },
  { value: 'wait', label: 'Wait', icon: Clock, color: 'gray' },
];

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual Trigger' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'field_change', label: 'Field Change' },
  { value: 'threshold', label: 'Threshold Reached' },
  { value: 'scheduled', label: 'Scheduled' },
];

export default function WorkflowBuilder() {
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows', filterEntity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterEntity !== 'all') {
        params.append('entityType', filterEntity);
      }

      const res = await fetch(`/api/admin/workflows?${params}`);
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const data = await res.json();
      return data.workflows || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const res = await fetch(`/api/admin/workflows/${workflowId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete workflow');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const res = await fetch(`/api/admin/workflows/${workflowId}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle workflow');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const res = await fetch(`/api/workflows/execute/${workflowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: { test: true } }),
      });
      if (!res.ok) throw new Error('Failed to execute workflow');
      return res.json();
    },
  });

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Workflow Builder</h1>
            <p className="text-muted-foreground">Design approval workflows and automated actions</p>
          </div>

          <button
            onClick={() => {
              setEditingWorkflow(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Create Workflow
          </button>
        </div>

        {/* Entity Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterEntity('all')}
            className={`px-4 py-2 rounded-lg ${
              filterEntity === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
            }`}
          >
            All ({workflows.length})
          </button>
          {ENTITY_TYPES.map((entity) => (
            <button
              key={entity.value}
              onClick={() => setFilterEntity(entity.value)}
              className={`px-4 py-2 rounded-lg ${
                filterEntity === entity.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
              }`}
            >
              {entity.label}
            </button>
          ))}
        </div>

        {/* Workflows Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Workflow className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Workflows</h3>
            <p className="text-muted-foreground mb-4">
              Create workflows to automate approvals and actions
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Create First Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white dark:bg-slate-800 rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{workflow.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {workflow.entity_type} • {workflow.trigger.type}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate(workflow.id)}
                    className="flex-shrink-0"
                  >
                    {workflow.is_active ? (
                      <ToggleRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Steps:</p>
                  <div className="space-y-1">
                    {workflow.steps.slice(0, 3).map((step, idx) => {
                      const stepType = STEP_TYPES.find(t => t.value === step.type);
                      const Icon = stepType?.icon || Workflow;
                      return (
                        <div key={step.id} className="flex items-center gap-2 text-xs">
                          <Icon className={`w-3 h-3 text-${stepType?.color}-500`} />
                          <span>{stepType?.label}</span>
                        </div>
                      );
                    })}
                    {workflow.steps.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{workflow.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => testMutation.mutate(workflow.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    <Play className="w-4 h-4" />
                    Test
                  </button>
                  <button
                    onClick={() => {
                      setEditingWorkflow(workflow);
                      setShowModal(true);
                    }}
                    className="px-3 py-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this workflow?')) {
                        deleteMutation.mutate(workflow.id);
                      }
                    }}
                    className="px-3 py-2 border border-red-200 dark:border-red-800 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <WorkflowModal
            workflow={editingWorkflow}
            onClose={() => {
              setShowModal(false);
              setEditingWorkflow(null);
            }}
            onSuccess={() => {
              setShowModal(false);
              setEditingWorkflow(null);
              queryClient.invalidateQueries({ queryKey: ['workflows'] });
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function WorkflowModal({ workflow, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    entityType: workflow?.entity_type || 'project',
    triggerType: workflow?.trigger?.type || 'manual',
    triggerConditions: JSON.stringify(workflow?.trigger?.conditions || {}, null, 2),
    isActive: workflow?.is_active ?? true,
  });
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addStep = (type: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: type as any,
      config: {},
    };

    if (type === 'approval') {
      newStep.approvers = [];
      newStep.timeout = 24;
    }

    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let triggerConditions;
      try {
        triggerConditions = JSON.parse(formData.triggerConditions);
      } catch {
        triggerConditions = {};
      }

      const url = workflow ? `/api/admin/workflows/${workflow.id}` : '/api/admin/workflows';
      const method = workflow ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        description: formData.description,
        entityType: formData.entityType,
        trigger: {
          type: formData.triggerType,
          conditions: triggerConditions,
        },
        steps,
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Operation failed');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl p-6 my-8">
        <h2 className="text-2xl font-bold mb-4">
          {workflow ? 'Edit Workflow' : 'Create New Workflow'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workflow Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Budget Approval Process"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Entity Type</label>
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {ENTITY_TYPES.map((entity) => (
                    <option key={entity.value} value={entity.value}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this workflow does"
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold">Trigger</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Trigger Type</label>
              <select
                value={formData.triggerType}
                onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {TRIGGER_TYPES.map((trigger) => (
                  <option key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Workflow Steps</h3>
              <div className="flex gap-2">
                {STEP_TYPES.map((stepType) => {
                  const Icon = stepType.icon;
                  return (
                    <button
                      key={stepType.value}
                      type="button"
                      onClick={() => addStep(stepType.value)}
                      className={`p-2 border rounded hover:bg-${stepType.color}-50 dark:hover:bg-${stepType.color}-900/20 text-${stepType.color}-600`}
                      title={`Add ${stepType.label}`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const stepType = STEP_TYPES.find(t => t.value === step.type);
                const Icon = stepType?.icon || Workflow;

                return (
                  <div key={step.id} className="flex items-center gap-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-semibold text-muted-foreground w-6">
                        {idx + 1}.
                      </span>
                      <Icon className={`w-5 h-5 text-${stepType?.color}-500`} />
                      <span className="font-medium">{stepType?.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {steps.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No steps added. Click the icons above to add workflow steps.
                </div>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Active (workflow will execute)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || steps.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg"
            >
              {loading ? 'Saving...' : workflow ? 'Update Workflow' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
