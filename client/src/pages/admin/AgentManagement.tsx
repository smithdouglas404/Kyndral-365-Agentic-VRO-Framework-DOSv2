/**
 * AGENT MANAGEMENT
 *
 * Admin page for managing agent definitions
 * Add, edit, enable/disable agents
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  Zap,
  Settings,
  RefreshCw,
  Link,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  capabilities: string[];
  defaultPriority: number;
  ownerUserId?: string;
  ownerTeam?: string;
  palantirObjectTypes: string[];
  mcpConnections: string[];
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentFormData {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string;
  defaultPriority: number;
  ownerTeam: string;
  icon: string;
  color: string;
  palantirObjectTypes: string;
  palantirFunctions: string;
}

const emptyAgentForm: AgentFormData = {
  id: '',
  name: '',
  description: '',
  category: 'domain',
  capabilities: '',
  defaultPriority: 5,
  ownerTeam: '',
  icon: '',
  color: '#6366F1',
  palantirObjectTypes: '',
  palantirFunctions: '',
};

// Palantir object types that agents can work with
const PALANTIR_OBJECT_TYPES = [
  'Project', 'Risk', 'Budget', 'Team', 'Objective', 'KeyResult',
  'Milestone', 'Dependency', 'Intervention', 'Alert', 'Portfolio',
  'ValueStream', 'ART', 'Epic', 'Feature', 'Story', 'Task',
  'BusinessRule', 'Threshold', 'Workflow',
];

const CATEGORIES = [
  { value: 'domain', label: 'Domain Agent', description: 'Specialized for a business domain' },
  { value: 'orchestration', label: 'Orchestration Agent', description: 'Coordinates other agents' },
  { value: 'utility', label: 'Utility Agent', description: 'Provides support services' },
];

const ICONS = [
  'DollarSign', 'Clock', 'Shield', 'Briefcase', 'Scale', 'TrendingUp',
  'Users', 'Map', 'Target', 'Layers', 'Bell', 'Bot', 'Brain', 'Zap',
];

export default function AgentManagement() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentForm, setAgentForm] = useState<AgentFormData>(emptyAgentForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch all agents
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['agents-admin'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category,
          capabilities: data.capabilities.split('\n').filter(c => c.trim()),
          defaultPriority: data.defaultPriority,
          ownerTeam: data.ownerTeam || null,
          icon: data.icon || null,
          color: data.color || null,
          palantirObjectTypes: data.palantirObjectTypes.split('\n').filter(c => c.trim()),
          palantirFunctions: data.palantirFunctions.split('\n').filter(c => c.trim()),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create agent');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents-admin'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsAddingAgent(false);
      setAgentForm(emptyAgentForm);
    },
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<AgentFormData> }) => {
      const res = await fetch(`/api/admin/agents/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.updates.name,
          description: data.updates.description,
          category: data.updates.category,
          capabilities: data.updates.capabilities?.split('\n').filter(c => c.trim()),
          defaultPriority: data.updates.defaultPriority,
          ownerTeam: data.updates.ownerTeam || null,
          icon: data.updates.icon || null,
          color: data.updates.color || null,
          palantirObjectTypes: data.updates.palantirObjectTypes?.split('\n').filter(c => c.trim()),
          palantirFunctions: data.updates.palantirFunctions?.split('\n').filter(c => c.trim()),
        }),
      });
      if (!res.ok) throw new Error('Failed to update agent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents-admin'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setEditingAgent(null);
      setAgentForm(emptyAgentForm);
    },
  });

  // Toggle agent enabled
  const toggleAgentMutation = useMutation({
    mutationFn: async (data: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/agents/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: data.enabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle agent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents-admin'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete agent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents-admin'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setDeleteConfirm(null);
    },
  });

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentForm({
      id: agent.id,
      name: agent.name,
      description: agent.description || '',
      category: agent.category,
      capabilities: agent.capabilities?.join('\n') || '',
      defaultPriority: agent.defaultPriority || 5,
      ownerTeam: agent.ownerTeam || '',
      icon: agent.icon || '',
      color: agent.color || '#6366F1',
      palantirObjectTypes: agent.palantirObjectTypes?.join('\n') || '',
      palantirFunctions: (agent as any).palantirFunctions?.join('\n') || '',
    });
  };

  const handleSave = () => {
    if (editingAgent) {
      updateAgentMutation.mutate({ id: editingAgent.id, updates: agentForm });
    } else {
      createAgentMutation.mutate(agentForm);
    }
  };

  const handleCancel = () => {
    setIsAddingAgent(false);
    setEditingAgent(null);
    setAgentForm(emptyAgentForm);
  };

  const agents: Agent[] = agentsData?.agents || [];
  const isEditing = isAddingAgent || editingAgent !== null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold">Agent Management</h1>
            </div>
            <p className="text-muted-foreground">
              Configure and manage system agents
            </p>
          </div>
          <Button
            onClick={() => setIsAddingAgent(true)}
            disabled={isEditing}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </Button>
        </div>

        {/* Success/Error Messages */}
        {createAgentMutation.isSuccess && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription>Agent created successfully!</AlertDescription>
          </Alert>
        )}
        {createAgentMutation.isError && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription>{(createAgentMutation.error as Error).message}</AlertDescription>
          </Alert>
        )}

        {/* Add/Edit Form */}
        {isEditing && (
          <Card className="border-2 border-indigo-200 dark:border-indigo-900">
            <CardHeader>
              <CardTitle>{editingAgent ? 'Edit Agent' : 'New Agent'}</CardTitle>
              <CardDescription>
                {editingAgent ? `Editing ${editingAgent.name}` : 'Define a new agent for the system'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agent ID</Label>
                  <Input
                    placeholder="e.g., custom-finance"
                    value={agentForm.id}
                    onChange={(e) => setAgentForm((f) => ({ ...f, id: e.target.value }))}
                    disabled={!!editingAgent}
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier (lowercase, no spaces)</p>
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    placeholder="e.g., Custom Finance Agent"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="What does this agent do?"
                  value={agentForm.description}
                  onChange={(e) => setAgentForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={agentForm.category}
                    onValueChange={(v) => setAgentForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={agentForm.defaultPriority}
                    onChange={(e) => setAgentForm((f) => ({ ...f, defaultPriority: parseInt(e.target.value) || 5 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Owner Team</Label>
                  <Input
                    placeholder="e.g., Finance Team"
                    value={agentForm.ownerTeam}
                    onChange={(e) => setAgentForm((f) => ({ ...f, ownerTeam: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capabilities (one per line)</Label>
                <Textarea
                  placeholder="Budget analysis&#10;Cost forecasting&#10;Variance reporting"
                  value={agentForm.capabilities}
                  onChange={(e) => setAgentForm((f) => ({ ...f, capabilities: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Palantir Integration Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Palantir Integration</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Palantir Object Types (one per line)</Label>
                    <Textarea
                      placeholder="Project&#10;Risk&#10;Budget"
                      value={agentForm.palantirObjectTypes}
                      onChange={(e) => setAgentForm((f) => ({ ...f, palantirObjectTypes: e.target.value }))}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Object types this agent monitors and modifies
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {PALANTIR_OBJECT_TYPES.slice(0, 8).map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 text-xs"
                          onClick={() => {
                            const current = agentForm.palantirObjectTypes.split('\n').filter(t => t.trim());
                            if (!current.includes(type)) {
                              setAgentForm(f => ({
                                ...f,
                                palantirObjectTypes: [...current, type].join('\n')
                              }));
                            }
                          }}
                        >
                          + {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Palantir Functions (one per line)</Label>
                    <Textarea
                      placeholder="checkBudgetThreshold&#10;evaluateCostVariance&#10;validateSchedule"
                      value={agentForm.palantirFunctions}
                      onChange={(e) => setAgentForm((f) => ({ ...f, palantirFunctions: e.target.value }))}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Palantir Functions (rules) this agent can execute
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select
                    value={agentForm.icon}
                    onValueChange={(v) => setAgentForm((f) => ({ ...f, icon: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select icon..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ICONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={agentForm.color}
                      onChange={(e) => setAgentForm((f) => ({ ...f, color: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={agentForm.color}
                      onChange={(e) => setAgentForm((f) => ({ ...f, color: e.target.value }))}
                      placeholder="#6366F1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={createAgentMutation.isPending || updateAgentMutation.isPending || !agentForm.id || !agentForm.name}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {createAgentMutation.isPending || updateAgentMutation.isPending ? 'Saving...' : 'Save Agent'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agents List */}
        {isLoading ? (
          <LoadingState message="Loading agents..." />
        ) : agents.length === 0 ? (
          <EmptyState
            title="No agents configured"
            description="Get started by adding your first agent to the system."
            icon={Bot}
            action={{
              label: 'Add Agent',
              onClick: () => setIsAddingAgent(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className={agent.enabled ? '' : 'opacity-60'}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                      >
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {agent.category}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={agent.enabled}
                      onCheckedChange={(checked) =>
                        toggleAgentMutation.mutate({ id: agent.id, enabled: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description}
                  </p>

                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map((cap, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{agent.capabilities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Palantir Info */}
                  {agent.palantirObjectTypes && agent.palantirObjectTypes.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Cloud className="w-3 h-3" />
                      <span>Palantir: {agent.palantirObjectTypes.slice(0, 2).join(', ')}</span>
                      {agent.palantirObjectTypes.length > 2 && (
                        <span>+{agent.palantirObjectTypes.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(agent)}
                      className="gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/rules?agent=${agent.id}`)}
                      className="gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Zap className="w-3 h-3" />
                      Rules
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(agent.id)}
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">
                      P{agent.defaultPriority}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Agent</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this agent? This action cannot be undone.
                Any rules associated with this agent will also be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && deleteAgentMutation.mutate(deleteConfirm)}
                disabled={deleteAgentMutation.isPending}
              >
                {deleteAgentMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
