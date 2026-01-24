/**
 * ACTIVE INTEGRATIONS MANAGEMENT
 *
 * Professional dashboard for managing active MCP server integrations
 * - View all active integrations with status
 * - Test connections
 * - Reconfigure credentials
 * - Deactivate integrations
 * - View sync history and logs
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Trash2,
  TestTube,
  RefreshCw,
  Clock,
  Activity,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ActiveIntegration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'error' | 'disconnected';
  credentials: Record<string, string>;
  connectionDetails: {
    mcpServerId: string;
    category: string;
    officialMCP: boolean;
    activatedAt: string;
    activatedBy: string;
  };
  lastSyncAt?: string;
  lastSyncStatus?: string;
  mcpServer?: {
    displayName: string;
    category: string;
    officialMCP: boolean;
    capabilities: string[];
  };
}

export default function ActiveIntegrations() {
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch active integrations
  const { data, isLoading } = useQuery({
    queryKey: ['active-integrations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/mcp-servers/active/list');
      if (!res.ok) throw new Error('Failed to fetch active integrations');
      return res.json();
    },
  });

  const integrations: ActiveIntegration[] = data?.integrations || [];

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/admin/mcp-servers/${integrationId}/test`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Test failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-integrations'] });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/admin/mcp-servers/${integrationId}/sync`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-integrations'] });
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/admin/mcp-servers/${integrationId}/deactivate`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Deactivation failed');
      return res.json();
    },
    onSuccess: () => {
      setDeactivatingId(null);
      queryClient.invalidateQueries({ queryKey: ['active-integrations'] });
    },
  });

  const handleTest = (integrationId: string) => {
    testMutation.mutate(integrationId);
  };

  const handleSync = (integrationId: string) => {
    syncMutation.mutate(integrationId);
  };

  const handleDeactivate = () => {
    if (deactivatingId) {
      deactivateMutation.mutate(deactivatingId);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Active Integrations</h1>
            <p className="text-muted-foreground">
              Manage your activated MCP server integrations
            </p>
          </div>

          <Button variant="outline" asChild>
            <a href="/admin/mcp-marketplace">
              <ExternalLink className="w-4 h-4 mr-2" />
              Browse Marketplace
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                  <p className="text-2xl font-bold">
                    {integrations.filter((i) => i.status === 'connected').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold">
                    {integrations.filter((i) => i.status === 'error').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Active</p>
                  <p className="text-2xl font-bold">{integrations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : integrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active Integrations</h3>
              <p className="text-muted-foreground mb-4">
                You haven't activated any MCP server integrations yet
              </p>
              <Button asChild>
                <a href="/admin/mcp-marketplace">Browse Marketplace</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                isExpanded={expandedId === integration.id}
                onToggleExpand={() => toggleExpanded(integration.id)}
                onTest={() => handleTest(integration.id)}
                onSync={() => handleSync(integration.id)}
                onDeactivate={() => setDeactivatingId(integration.id)}
                isTesting={testMutation.isPending}
                isSyncing={syncMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Deactivation Confirmation Dialog */}
      <AlertDialog open={!!deactivatingId} onOpenChange={() => setDeactivatingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect the integration and stop all data synchronization. You can
              reactivate it later from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

interface IntegrationCardProps {
  integration: ActiveIntegration;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTest: () => void;
  onSync: () => void;
  onDeactivate: () => void;
  isTesting: boolean;
  isSyncing: boolean;
}

function IntegrationCard({
  integration,
  isExpanded,
  onToggleExpand,
  onTest,
  onSync,
  onDeactivate,
  isTesting,
  isSyncing,
}: IntegrationCardProps) {
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      label: 'Connected',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      label: 'Error',
    },
    disconnected: {
      icon: XCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      label: 'Disconnected',
    },
  };

  const config = statusConfig[integration.status];
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('p-2 rounded-lg', config.bgColor)}>
                <StatusIcon className={cn('w-5 h-5', config.color)} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {integration.name}
                  {integration.mcpServer?.officialMCP && (
                    <Badge variant="secondary">Official</Badge>
                  )}
                  <Badge
                    variant={integration.status === 'connected' ? 'default' : 'destructive'}
                    className={cn({
                      'bg-green-600': integration.status === 'connected',
                    })}
                  >
                    {config.label}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {integration.mcpServer?.displayName || integration.type}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              {integration.lastSyncAt && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last sync: {format(new Date(integration.lastSyncAt), 'MMM d, h:mm a')}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Activated: {format(new Date(integration.connectionDetails.activatedAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={isTesting}
              className="gap-2"
            >
              <TestTube className="w-4 h-4" />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeactivate}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Deactivate
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connection Details */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Connection Details</h4>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">
                    {integration.connectionDetails.category.replace('_', ' ').toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Activated By</dt>
                  <dd className="font-medium">{integration.connectionDetails.activatedBy}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">{integration.lastSyncStatus || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {/* Credentials (Masked) */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Credentials</h4>
              <dl className="space-y-2 text-sm">
                {Object.entries(integration.credentials || {}).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd className="font-mono text-xs">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Capabilities */}
            {integration.mcpServer?.capabilities && (
              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm mb-3">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {integration.mcpServer.capabilities.map((capability) => (
                    <Badge key={capability} variant="outline">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
