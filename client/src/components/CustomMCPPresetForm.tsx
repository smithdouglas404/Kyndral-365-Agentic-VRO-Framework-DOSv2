/**
 * CUSTOM MCP PRESET FORM
 *
 * Admin form for creating custom MCP integrations without code.
 * Allows admins to add ANY tool with REST/GraphQL/OData/SOAP API.
 *
 * Features:
 * - Basic Info: Name, Description, Category
 * - API Config: Base URL, Auth Type, API Type
 * - Endpoints: Projects, Tasks URLs
 * - Field Mappings: Map their fields to ours
 * - Status Mappings: Map their statuses to ours
 * - Test Connection: Validate before saving
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Zap, Code, Database, MapPin, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomMCPPresetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FieldMapping {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  owner?: string;
  budget?: string;
}

interface StatusMapping {
  [key: string]: 'active' | 'planning' | 'completed' | 'on_hold' | 'cancelled';
}

interface PresetFormData {
  name: string;
  displayName: string;
  description: string;
  category: string;
  apiType: 'rest' | 'graphql' | 'odata' | 'soap';
  authType: 'basic' | 'bearer' | 'oauth2' | 'api_key' | 'custom';
  baseUrl: string;
  endpoints: {
    projects: string;
    tasks: string;
    users?: string;
    statuses?: string;
  };
  fieldMappings: {
    project: FieldMapping;
    task?: Partial<FieldMapping>;
  };
  statusMappings: StatusMapping;
  pagination?: {
    type: 'offset' | 'cursor' | 'page';
    limitParam: string;
    offsetParam?: string;
    cursorParam?: string;
    defaultLimit: number;
  };
  rateLimit?: {
    requestsPerSecond: number;
    burstSize: number;
  };
  isPublic: boolean;
}

const CATEGORIES = [
  { value: 'enterprise_ppm', label: 'Enterprise PPM' },
  { value: 'agile_vro', label: 'Agile & VRO' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'development', label: 'Development' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'finance', label: 'Finance & ERP' },
  { value: 'notification', label: 'Notifications' },
];

const INTERNAL_STATUSES: Array<'active' | 'planning' | 'completed' | 'on_hold' | 'cancelled'> = [
  'active',
  'planning',
  'completed',
  'on_hold',
  'cancelled',
];

export function CustomMCPPresetForm({ open, onOpenChange, onSuccess }: CustomMCPPresetFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState('basic');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [formData, setFormData] = useState<PresetFormData>({
    name: '',
    displayName: '',
    description: '',
    category: 'enterprise_ppm',
    apiType: 'rest',
    authType: 'bearer',
    baseUrl: '',
    endpoints: {
      projects: '',
      tasks: '',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'status',
      },
    },
    statusMappings: {},
    isPublic: false,
  });

  // Status mapping pairs (external status → internal status)
  const [statusPairs, setStatusPairs] = useState<Array<{ external: string; internal: string }>>([
    { external: '', internal: 'active' },
  ]);

  const updateFormData = (path: string, value: any) => {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (credentials: any) => {
      // First, create temporary preset
      const tempPreset = {
        ...formData,
        statusMappings: statusPairs.reduce((acc, pair) => {
          if (pair.external) {
            acc[pair.external] = pair.internal;
          }
          return acc;
        }, {} as StatusMapping),
      };

      // Create preset
      const createRes = await fetch('/api/admin/custom-mcp-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempPreset),
      });

      if (!createRes.ok) {
        const error = await createRes.json();
        throw new Error(error.message || 'Failed to create preset');
      }

      const { preset } = await createRes.json();

      // Test connection
      const testRes = await fetch(`/api/admin/custom-mcp-presets/${preset.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials }),
      });

      if (!testRes.ok) {
        const error = await testRes.json();
        throw new Error(error.message || 'Connection test failed');
      }

      return { preset, testResult: await testRes.json() };
    },
    onSuccess: (data) => {
      setTestStatus('success');
      setTestMessage(data.testResult.message);
      toast({
        title: 'Connection Successful',
        description: `Connected to ${formData.displayName} successfully!`,
      });
    },
    onError: (error: Error) => {
      setTestStatus('error');
      setTestMessage(error.message);
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create preset mutation
  const createPresetMutation = useMutation({
    mutationFn: async () => {
      const presetData = {
        ...formData,
        statusMappings: statusPairs.reduce((acc, pair) => {
          if (pair.external) {
            acc[pair.external] = pair.internal;
          }
          return acc;
        }, {} as StatusMapping),
      };

      const res = await fetch('/api/admin/custom-mcp-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presetData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create preset');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Custom MCP preset created successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
      onOpenChange(false);
      onSuccess?.();
      // Reset form
      setFormData({
        name: '',
        displayName: '',
        description: '',
        category: 'enterprise_ppm',
        apiType: 'rest',
        authType: 'bearer',
        baseUrl: '',
        endpoints: { projects: '', tasks: '' },
        fieldMappings: {
          project: {
            id: 'id',
            name: 'name',
            description: 'description',
            status: 'status',
          },
        },
        statusMappings: {},
        isPublic: false,
      });
      setStatusPairs([{ external: '', internal: 'active' }]);
      setCurrentTab('basic');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addStatusPair = () => {
    setStatusPairs([...statusPairs, { external: '', internal: 'active' }]);
  };

  const removeStatusPair = (index: number) => {
    setStatusPairs(statusPairs.filter((_, i) => i !== index));
  };

  const updateStatusPair = (index: number, field: 'external' | 'internal', value: string) => {
    const newPairs = [...statusPairs];
    newPairs[index][field] = value;
    setStatusPairs(newPairs);
  };

  const isFormValid = () => {
    return (
      formData.name &&
      formData.displayName &&
      formData.baseUrl &&
      formData.endpoints.projects &&
      formData.fieldMappings.project.id &&
      formData.fieldMappings.project.name &&
      statusPairs.some((pair) => pair.external)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom MCP Integration</DialogTitle>
          <DialogDescription>
            Add ANY tool with REST/GraphQL/OData/SOAP API. It will appear in the marketplace automatically.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs">
              <Code className="w-3 h-3 mr-1" />
              API Config
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="mappings" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              Mappings
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Test
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Integration ID *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="my-custom-tool"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lowercase, no spaces. Used internally.
                </p>
              </div>

              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => updateFormData('displayName', e.target.value)}
                  placeholder="My Custom Tool"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Brief description of what this integration does..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateFormData('category', value)}
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
            </div>
          </TabsContent>

          {/* Tab 2: API Configuration */}
          <TabsContent value="api" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="baseUrl">Base URL *</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) => updateFormData('baseUrl', e.target.value)}
                  placeholder="https://api.example.com"
                  type="url"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiType">API Type *</Label>
                  <Select
                    value={formData.apiType}
                    onValueChange={(value) => updateFormData('apiType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rest">REST</SelectItem>
                      <SelectItem value="graphql">GraphQL</SelectItem>
                      <SelectItem value="odata">OData</SelectItem>
                      <SelectItem value="soap">SOAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="authType">Auth Type *</Label>
                  <Select
                    value={formData.authType}
                    onValueChange={(value) => updateFormData('authType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Authentication:</strong> Credentials will be entered by users when they activate this integration.
                  You only need to specify the auth type here.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* Tab 3: Endpoints */}
          <TabsContent value="endpoints" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectsEndpoint">Projects Endpoint *</Label>
                <Input
                  id="projectsEndpoint"
                  value={formData.endpoints.projects}
                  onChange={(e) => updateFormData('endpoints.projects', e.target.value)}
                  placeholder="/api/v1/projects"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Relative path from base URL
                </p>
              </div>

              <div>
                <Label htmlFor="tasksEndpoint">Tasks Endpoint *</Label>
                <Input
                  id="tasksEndpoint"
                  value={formData.endpoints.tasks}
                  onChange={(e) => updateFormData('endpoints.tasks', e.target.value)}
                  placeholder="/api/v1/tasks"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="usersEndpoint">Users Endpoint (Optional)</Label>
                <Input
                  id="usersEndpoint"
                  value={formData.endpoints.users || ''}
                  onChange={(e) => updateFormData('endpoints.users', e.target.value)}
                  placeholder="/api/v1/users"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="statusesEndpoint">Statuses Endpoint (Optional)</Label>
                <Input
                  id="statusesEndpoint"
                  value={formData.endpoints.statuses || ''}
                  onChange={(e) => updateFormData('endpoints.statuses', e.target.value)}
                  placeholder="/api/v1/statuses"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Field & Status Mappings */}
          <TabsContent value="mappings" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Project Field Mappings *</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="fieldId" className="text-xs">ID Field</Label>
                      <Input
                        id="fieldId"
                        value={formData.fieldMappings.project.id}
                        onChange={(e) => updateFormData('fieldMappings.project.id', e.target.value)}
                        placeholder="id"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldName" className="text-xs">Name Field</Label>
                      <Input
                        id="fieldName"
                        value={formData.fieldMappings.project.name}
                        onChange={(e) => updateFormData('fieldMappings.project.name', e.target.value)}
                        placeholder="name"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="fieldDescription" className="text-xs">Description Field</Label>
                      <Input
                        id="fieldDescription"
                        value={formData.fieldMappings.project.description}
                        onChange={(e) => updateFormData('fieldMappings.project.description', e.target.value)}
                        placeholder="description"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldStatus" className="text-xs">Status Field</Label>
                      <Input
                        id="fieldStatus"
                        value={formData.fieldMappings.project.status}
                        onChange={(e) => updateFormData('fieldMappings.project.status', e.target.value)}
                        placeholder="status"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Status Mappings *</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addStatusPair}>
                    Add Status
                  </Button>
                </div>

                <div className="space-y-2">
                  {statusPairs.map((pair, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={pair.external}
                        onChange={(e) => updateStatusPair(index, 'external', e.target.value)}
                        placeholder="Their status (e.g., 'In Progress')"
                        className="flex-1 font-mono text-sm"
                      />
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={pair.internal}
                        onValueChange={(value) => updateStatusPair(index, 'internal', value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERNAL_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              <Badge variant="outline" className="capitalize">
                                {status.replace('_', ' ')}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {statusPairs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStatusPair(index)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 5: Test Connection */}
          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Test Connection:</strong> Once you've configured everything, save the preset.
                  Users will test the connection when they activate it by providing their credentials.
                </AlertDescription>
              </Alert>

              {testStatus !== 'idle' && (
                <Alert variant={testStatus === 'success' ? 'default' : 'destructive'}>
                  <div className="flex items-start gap-2">
                    {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin mt-0.5" />}
                    {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                    {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-600 mt-0.5" />}
                    <AlertDescription>{testMessage}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Configuration Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{formData.displayName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Type:</span>
                    <Badge variant="outline">{formData.apiType.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auth Type:</span>
                    <Badge variant="outline">{formData.authType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base URL:</span>
                    <span className="font-mono text-xs">{formData.baseUrl || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Mappings:</span>
                    <span>{statusPairs.filter((p) => p.external).length} configured</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createPresetMutation.mutate()}
            disabled={!isFormValid() || createPresetMutation.isPending}
          >
            {createPresetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Integration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
