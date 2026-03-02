import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, Save, X, AlertCircle, Tag, Eye,
  Code, Lock, Unlock, CheckCircle2
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
import { useAgentMetadata } from '@/hooks/useAgentRegistry';

interface CustomAttribute {
  id: string;
  name: string;
  label: string;
  description?: string;
  dataType: 'number' | 'string' | 'boolean' | 'date';
  ownerAgent: string;
  visibleTo: string[];
  validationRules?: any;
  defaultValue?: string;
  unit?: string;
  mcpToolName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function CustomAttributeBuilder() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CustomAttribute | null>(null);

  // Load agents from database
  const { data: agentMetadata = [] } = useAgentMetadata();
  const agentTypes = useMemo(() =>
    agentMetadata.map(a => ({
      id: a.id,
      label: a.shortName || a.name.replace(' Agent', ''),
      color: a.color,
    })),
    [agentMetadata]
  );

  // Form state
  const [formData, setFormData] = useState<Partial<CustomAttribute>>({
    name: '',
    label: '',
    description: '',
    dataType: 'number',
    ownerAgent: '',
    visibleTo: [],
    unit: '',
    defaultValue: '',
  });

  // Fetch custom attributes
  const { data: attributesData, isLoading } = useQuery({
    queryKey: ['custom-attributes'],
    queryFn: async () => {
      const response = await fetch('/api/custom-attributes', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch custom attributes');
      return response.json();
    },
  });

  // Create/Update attribute mutation
  const saveMutation = useMutation({
    mutationFn: async (attribute: Partial<CustomAttribute>) => {
      const url = attribute.id ? `/api/custom-attributes/${attribute.id}` : '/api/custom-attributes';
      const method = attribute.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(attribute),
      });

      if (!response.ok) throw new Error('Failed to save attribute');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-attributes'] });
      resetForm();
    },
  });

  // Delete attribute mutation
  const deleteMutation = useMutation({
    mutationFn: async (attributeId: string) => {
      const response = await fetch(`/api/custom-attributes/${attributeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete attribute');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-attributes'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      description: '',
      dataType: 'number',
      ownerAgent: '',
      visibleTo: [],
      unit: '',
      defaultValue: '',
    });
    setIsCreating(false);
    setEditingAttribute(null);
  };

  const handleEdit = (attribute: CustomAttribute) => {
    setFormData(attribute);
    setEditingAttribute(attribute);
    setIsCreating(true);
  };

  const handleSave = () => {
    // Generate MCP tool name if not provided
    if (!formData.mcpToolName && formData.name) {
      formData.mcpToolName = `get_${formData.name}`;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = (attributeId: string) => {
    if (confirm('Are you sure you want to delete this custom attribute? Rules using it may break.')) {
      deleteMutation.mutate(attributeId);
    }
  };

  const toggleVisibility = (agentId: string) => {
    const currentVisibility = formData.visibleTo || [];
    const newVisibility = currentVisibility.includes(agentId)
      ? currentVisibility.filter((id) => id !== agentId)
      : [...currentVisibility, agentId];
    setFormData({ ...formData, visibleTo: newVisibility });
  };

  const attributes: CustomAttribute[] = attributesData?.attributes || [];

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
      <Card className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Tag size={28} />
                Custom Attribute Builder
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Create custom attributes for any agent (exposed via MCP)
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
                  New Attribute
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-2">How Custom Attributes Work:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Create attributes for your agent (e.g., OCM creates "teamMorale")</li>
                <li>Choose which agents can see and use this attribute in their rules</li>
                <li>Attributes are exposed via MCP - other agents can query them</li>
                <li>Example: FinOps can create rule "When OCM's teamMorale &lt; 40%, alert OCM"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creation Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-cyan-300 bg-cyan-50">
              <CardHeader>
                <CardTitle>
                  {editingAttribute ? 'Edit Custom Attribute' : 'Create New Custom Attribute'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Attribute Name & Label */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attr-name">
                      Attribute Name (Code) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="attr-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., teamMorale"
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-600">
                      Use camelCase, no spaces. This is the variable name.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attr-label">
                      Display Label <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="attr-label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="e.g., Team Morale"
                    />
                    <p className="text-xs text-gray-600">Human-readable name shown in UI</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="attr-description">Description</Label>
                  <Input
                    id="attr-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this attribute measure?"
                  />
                </div>

                {/* Data Type & Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attr-datatype">
                      Data Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.dataType}
                      onValueChange={(value: any) => setFormData({ ...formData, dataType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attr-unit">Unit (Optional)</Label>
                    <Input
                      id="attr-unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., %, $, days"
                    />
                  </div>
                </div>

                {/* Owner Agent */}
                <div className="space-y-2">
                  <Label htmlFor="attr-owner">
                    Owner Agent <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.ownerAgent}
                    onValueChange={(value) => setFormData({ ...formData, ownerAgent: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentTypes.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: agent.color }}
                            />
                            {agent.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">Agent that owns and updates this attribute</p>
                </div>

                {/* Visibility */}
                <div className="space-y-2">
                  <Label>
                    Visible To (select agents that can use this attribute in rules)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {agentTypes.map((agent) => {
                      const isVisible = formData.visibleTo?.includes(agent.id);
                      const isOwner = formData.ownerAgent === agent.id;

                      return (
                        <Button
                          key={agent.id}
                          variant={isVisible || isOwner ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => !isOwner && toggleVisibility(agent.id)}
                          disabled={isOwner}
                          className="justify-start"
                          style={
                            isVisible || isOwner
                              ? { backgroundColor: agent.color, color: 'white' }
                              : {}
                          }
                        >
                          {isOwner ? (
                            <Lock size={14} className="mr-1" />
                          ) : isVisible ? (
                            <Eye size={14} className="mr-1" />
                          ) : (
                            <Unlock size={14} className="mr-1" />
                          )}
                          {agent.label}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-600">
                    Owner agent is always visible (locked). Other agents need explicit permission.
                  </p>
                </div>

                {/* Default Value */}
                <div className="space-y-2">
                  <Label htmlFor="attr-default">Default Value (Optional)</Label>
                  <Input
                    id="attr-default"
                    value={formData.defaultValue}
                    onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                    placeholder="Default value if not set"
                  />
                </div>

                {/* MCP Tool Name (Advanced) */}
                <div className="space-y-2">
                  <Label htmlFor="attr-mcp">MCP Tool Name (Auto-generated)</Label>
                  <Input
                    id="attr-mcp"
                    value={formData.mcpToolName || `get_${formData.name || 'attribute'}`}
                    onChange={(e) => setFormData({ ...formData, mcpToolName: e.target.value })}
                    className="font-mono text-xs"
                    disabled
                  />
                  <p className="text-xs text-gray-600">
                    MCP tool name used by other agents to query this attribute
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    <Save size={16} className="mr-1" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Attribute'}
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

      {/* Attributes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Custom Attributes ({attributes.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attributes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tag size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No custom attributes yet</p>
              <p className="text-sm mb-4">
                Create your first custom attribute to extend agent capabilities
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus size={16} className="mr-1" />
                Create First Attribute
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {attributes.map((attribute) => {
                const ownerAgent = agentTypes.find((a) => a.id === attribute.ownerAgent);

                return (
                  <Card key={attribute.id} className="bg-white transition-all hover:shadow-md">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: ownerAgent?.color }}
                            />
                            <h4 className="font-semibold text-gray-900">{attribute.label}</h4>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {attribute.name}
                            </code>
                            <Badge variant="outline">{attribute.dataType}</Badge>
                            {attribute.unit && (
                              <Badge variant="outline" className="text-xs">
                                {attribute.unit}
                              </Badge>
                            )}
                          </div>

                          {attribute.description && (
                            <p className="text-sm text-gray-600 mb-3">{attribute.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Code size={12} />
                              <span>{attribute.mcpToolName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye size={12} />
                              <span>
                                Visible to: {attribute.visibleTo.length} agent(s)
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              Owner: {ownerAgent?.label}
                            </Badge>
                            {attribute.visibleTo.map((agentId) => {
                              const agent = agentTypes.find((a) => a.id === agentId);
                              return (
                                <Badge
                                  key={agentId}
                                  variant="outline"
                                  className="text-xs"
                                  style={{ borderColor: agent?.color }}
                                >
                                  <Eye size={10} className="mr-1" />
                                  {agent?.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(attribute)}
                            title="Edit attribute"
                          >
                            <Edit size={16} className="text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(attribute.id)}
                            title="Delete attribute"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MCP Integration Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-purple-600 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-2">MCP Integration:</p>
              <p className="text-xs mb-2">
                Each custom attribute is automatically exposed as an MCP tool. Other agents can query these
                attributes via MCP calls like:
              </p>
              <pre className="bg-white p-2 rounded border border-purple-200 text-xs font-mono overflow-x-auto">
                {`// FinOps querying OCM's custom attribute
const teamMorale = await mcpCall('ocm', 'get_teamMorale', { projectId });

// Use in rule evaluation
if (teamMorale < 40) {
  sendA2AMessage('ocm', { type: 'alert', reason: 'Low team morale' });
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
