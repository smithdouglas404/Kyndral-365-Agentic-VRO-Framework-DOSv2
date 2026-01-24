/**
 * CAMUNDA 8 CONNECTION CENTER
 *
 * Connection details and instructions for Camunda Desktop Modeler.
 * Admins use the desktop application to configure workflows and DMN rules.
 *
 * Features:
 * - Connection details for desktop modeler
 * - Download links and setup instructions
 * - View deployed processes/rules
 * - Toggle between self-hosted and SaaS
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Download,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
  Server,
  Cloud,
  FileText,
  Play,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CamundaConfig {
  deploymentType: 'self-hosted' | 'saas';
  clusterId: string;
  clusterRegion: string;
  clientId: string;
  clientSecret: string;
  zeebeAddress: string;
  restApiUrl: string;
  operateUrl: string;
  tasklistUrl: string;
  modelerUrl: string;
}

interface DeployedProcess {
  key: string;
  name: string;
  version: number;
  resourceName: string;
  deploymentTime: string;
}

export default function CamundaRulesEngine() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState(false);
  const [useSaaS, setUseSaaS] = useState(false);

  // Fetch Camunda configuration
  const { data: config, isLoading: configLoading } = useQuery<CamundaConfig>({
    queryKey: ['camunda-config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/camunda/config');
      if (!res.ok) throw new Error('Failed to fetch Camunda config');
      return res.json();
    },
  });

  // Fetch deployed processes
  const { data: processes, isLoading: processesLoading } = useQuery<DeployedProcess[]>({
    queryKey: ['camunda-processes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/camunda/processes');
      if (!res.ok) throw new Error('Failed to fetch deployed processes');
      const data = await res.json();
      return data.processes || [];
    },
  });

  // Update deployment type
  const updateDeploymentMutation = useMutation({
    mutationFn: async (deploymentType: 'self-hosted' | 'saas') => {
      const res = await fetch('/api/admin/camunda/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentType }),
      });
      if (!res.ok) throw new Error('Failed to update deployment type');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camunda-config'] });
      toast({
        title: 'Deployment Type Updated',
        description: `Switched to ${useSaaS ? 'SaaS' : 'Self-Hosted'} deployment`,
      });
    },
  });

  // Test connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/camunda/test-connection', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Connection test failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Connection Successful',
        description: `Connected to Camunda 8 (${data.latency}ms)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: `${label} copied successfully`,
    });
  };

  const handleDeploymentToggle = (checked: boolean) => {
    setUseSaaS(checked);
    updateDeploymentMutation.mutate(checked ? 'saas' : 'self-hosted');
  };

  const maskSecret = (secret: string) => {
    if (!secret || showSecrets) return secret;
    return '••••••••••••••••••••••••••••';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Camunda 8 Connection Center</h1>
            </div>
            <p className="text-muted-foreground">
              Connect Camunda Desktop Modeler to design workflows and DMN rules
            </p>
          </div>

          <Button
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            variant="outline"
          >
            {testConnectionMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>

        {/* Deployment Type Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {useSaaS ? <Cloud className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                  Deployment Type
                </CardTitle>
                <CardDescription>
                  Choose between self-hosted or Camunda SaaS cloud
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="deployment-toggle">Self-Hosted</Label>
                <Switch
                  id="deployment-toggle"
                  checked={useSaaS}
                  onCheckedChange={handleDeploymentToggle}
                />
                <Label htmlFor="deployment-toggle">SaaS Cloud</Label>
              </div>
            </div>
          </CardHeader>
          {useSaaS && (
            <CardContent>
              <Alert>
                <Cloud className="w-4 h-4" />
                <AlertDescription>
                  <strong>SaaS Pricing:</strong> Camunda Cloud starts at $80/month for production clusters.
                  You'll need to create a cluster at{' '}
                  <a
                    href="https://camunda.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    camunda.io
                  </a>{' '}
                  and enter your cluster details below.
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        <Tabs defaultValue="connection" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connection">Connection Details</TabsTrigger>
            <TabsTrigger value="setup">Desktop Setup</TabsTrigger>
            <TabsTrigger value="deployed">Deployed Resources</TabsTrigger>
          </TabsList>

          {/* Tab 1: Connection Details */}
          <TabsContent value="connection" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cluster Connection Details</CardTitle>
                    <CardDescription>
                      Use these credentials in Camunda Desktop Modeler
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide Secrets
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Show Secrets
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {configLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : config ? (
                  <>
                    {/* Cluster ID */}
                    <div className="space-y-2">
                      <Label>Cluster ID</Label>
                      <div className="flex gap-2">
                        <Input value={config.clusterId} readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(config.clusterId, 'Cluster ID')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Region */}
                    <div className="space-y-2">
                      <Label>Region</Label>
                      <Input value={config.clusterRegion} readOnly />
                    </div>

                    {/* Client ID */}
                    <div className="space-y-2">
                      <Label>Client ID (OAuth)</Label>
                      <div className="flex gap-2">
                        <Input value={config.clientId} readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(config.clientId, 'Client ID')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Client Secret */}
                    <div className="space-y-2">
                      <Label>Client Secret (OAuth)</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          value={maskSecret(config.clientSecret)}
                          readOnly
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(config.clientSecret, 'Client Secret')}
                          disabled={!showSecrets}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Zeebe Address */}
                    <div className="space-y-2">
                      <Label>Zeebe Gateway Address</Label>
                      <div className="flex gap-2">
                        <Input value={config.zeebeAddress} readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(config.zeebeAddress, 'Zeebe Address')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* REST API */}
                    <div className="space-y-2">
                      <Label>REST API URL</Label>
                      <Input value={config.restApiUrl} readOnly />
                    </div>

                    {/* Quick Access Links */}
                    <div className="pt-4 border-t space-y-3">
                      <Label>Quick Access Links</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" asChild>
                          <a href={config.operateUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Operate
                          </a>
                        </Button>
                        <Button variant="outline" asChild>
                          <a href={config.tasklistUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Tasklist
                          </a>
                        </Button>
                        <Button variant="outline" asChild>
                          <a href={config.modelerUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Modeler Web
                          </a>
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      Failed to load Camunda configuration. Please ensure Camunda 8 is set up.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Desktop Setup Instructions */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Download Camunda Desktop Modeler</CardTitle>
                <CardDescription>
                  Use the desktop application to design BPMN workflows and DMN decision tables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Download className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Camunda Modeler 5.x</h3>
                      <p className="text-sm text-muted-foreground">
                        Free desktop application for Windows, macOS, and Linux
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <a
                      href="https://camunda.com/download/modeler/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>

                <Alert>
                  <Zap className="w-4 h-4" />
                  <AlertDescription>
                    <strong>System Requirements:</strong> Windows 10+, macOS 10.13+, or Linux with
                    GTK 3.0+
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
                <CardDescription>Follow these steps to connect Desktop Modeler</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Install Camunda Modeler</h4>
                      <p className="text-sm text-muted-foreground">
                        Download and install the desktop application for your operating system.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Open Deployment Configuration</h4>
                      <p className="text-sm text-muted-foreground">
                        In Modeler, click the deployment icon (rocket) in the toolbar, then click
                        "Configure Endpoint"
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Enter Connection Details</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Copy the connection details from the "Connection Details" tab and paste them
                        into Modeler:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>Cluster URL: Zeebe Gateway Address</li>
                        <li>OAuth Client ID: Client ID</li>
                        <li>OAuth Client Secret: Client Secret</li>
                        <li>OAuth Token URL: Depends on region</li>
                      </ul>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Deploy Workflows & Rules</h4>
                      <p className="text-sm text-muted-foreground">
                        Create BPMN diagrams or DMN tables, then click the deployment button to
                        deploy to your cluster. View deployed resources in the "Deployed Resources"
                        tab.
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/deploy-to-camunda-cloud/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Deployment Documentation
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href="https://docs.camunda.io/docs/components/modeler/bpmn/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      BPMN Tutorial
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href="https://docs.camunda.io/docs/components/modeler/dmn/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      DMN Decision Tables Guide
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Deployed Resources */}
          <TabsContent value="deployed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deployed Processes & Rules</CardTitle>
                <CardDescription>
                  View BPMN processes and DMN decision tables deployed to this cluster
                </CardDescription>
              </CardHeader>
              <CardContent>
                {processesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : processes && processes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Deployed</TableHead>
                        <TableHead>Key</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processes.map((process) => (
                        <TableRow key={process.key}>
                          <TableCell className="font-medium">{process.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{process.resourceName}</Badge>
                          </TableCell>
                          <TableCell>v{process.version}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(process.deploymentTime).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm font-mono">{process.key}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Resources Deployed</h3>
                    <p className="text-muted-foreground mb-4">
                      Deploy BPMN processes or DMN rules from Camunda Desktop Modeler to see them
                      here.
                    </p>
                    <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['camunda-processes'] })}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
