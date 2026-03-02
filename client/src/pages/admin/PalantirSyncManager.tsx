/**
 * PALANTIR SYNC MANAGER
 *
 * Admin interface for managing Palantir ontology and external system synchronization.
 * This is the control center for the ontology-first architecture.
 *
 * Features:
 * - View ontology schema and object types
 * - Trigger sync from Jira, OpenProject, Monday.com TO Palantir
 * - Monitor sync status and history
 * - Browse ontology data
 * - Cache management
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  RefreshCw,
  Cloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  FileJson,
  Clock,
  Trash2,
  Play,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { LoadingState } from '@/components/ui/loading-state';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useToast } from '@/hooks/use-toast';

interface OntologyObjectType {
  apiName: string;
  displayName: string;
  description?: string;
  primaryKey: string[];
  properties: Record<string, any>;
  assignedAgents: string[];
  dataSources: string[];
}

interface SyncResult {
  source: string;
  objectType: string;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  syncedAt: string;
}

export default function PalantirSyncManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncSource, setSyncSource] = useState<'jira' | 'openproject' | 'monday' | null>(null);
  const [syncConfig, setSyncConfig] = useState<Record<string, string>>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Fetch ontology schema
  const { data: schema, isLoading: schemaLoading } = useQuery({
    queryKey: ['ontology-schema'],
    queryFn: async () => {
      const res = await fetch('/api/palantir/ontology/schema');
      if (!res.ok) throw new Error('Failed to fetch schema');
      return res.json();
    },
  });

  // Fetch dashboard metrics from ontology
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['ontology-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/palantir/ontology/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
  });

  // Fetch sync status
  const { data: syncStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const res = await fetch('/api/palantir/sync/status');
      if (!res.ok) throw new Error('Failed to fetch sync status');
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async ({ source, config }: { source: string; config: Record<string, string> }) => {
      const res = await fetch(`/api/palantir/sync/${source}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Sync failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Sync completed',
        description: `Created: ${data.result.created}, Updated: ${data.result.updated}, Failed: ${data.result.failed}`,
      });
      queryClient.invalidateQueries({ queryKey: ['ontology-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      setShowSyncDialog(false);
      setSyncConfig({});
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Sync all mutation
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/palantir/sync/all', { method: 'POST' });
      if (!res.ok) throw new Error('Sync all failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Sync all completed',
        description: `${data.summary.successful} successful, ${data.summary.failed} failed`,
      });
      queryClient.invalidateQueries({ queryKey: ['ontology-metrics'] });
    },
  });

  // Cache invalidation mutation
  const invalidateCacheMutation = useMutation({
    mutationFn: async (pattern?: string) => {
      const res = await fetch('/api/palantir/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern }),
      });
      if (!res.ok) throw new Error('Cache invalidation failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Cache cleared', description: 'Ontology cache has been invalidated' });
      queryClient.invalidateQueries({ queryKey: ['ontology-schema'] });
      queryClient.invalidateQueries({ queryKey: ['ontology-metrics'] });
    },
  });

  const toggleExpand = (apiName: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(apiName)) {
      newExpanded.delete(apiName);
    } else {
      newExpanded.add(apiName);
    }
    setExpandedTypes(newExpanded);
  };

  const openSyncDialog = (source: 'jira' | 'openproject' | 'monday') => {
    setSyncSource(source);
    setSyncConfig({});
    setShowSyncDialog(true);
  };

  const handleSync = () => {
    if (syncSource) {
      syncMutation.mutate({ source: syncSource, config: syncConfig });
    }
  };

  const objectTypes: OntologyObjectType[] = schema?.objectTypes || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Palantir Ontology Manager</h1>
            </div>
            <p className="text-muted-foreground">
              Ontology-first architecture - Palantir Foundry is the source of truth
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => invalidateCacheMutation.mutate()}
              disabled={invalidateCacheMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
            <Button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
              Sync All
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        {schema && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              Connected to Palantir Foundry - Ontology: {schema.ontologyRid} (v{schema.version})
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schema">Ontology Schema</TabsTrigger>
            <TabsTrigger value="sync">Data Sync</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {metricsLoading ? (
              <LoadingState message="Loading ontology metrics..." />
            ) : metrics ? (
              <>
                <StatGrid columns={4}>
                  <StatCard
                    title="Total Projects"
                    value={metrics.projects?.total || 0}
                    icon={Layers}
                    description={`${metrics.projects?.active || 0} active`}
                  />
                  <StatCard
                    title="Total Budget"
                    value={`$${((metrics.financials?.totalBudget || 0) / 1000000).toFixed(1)}M`}
                    icon={Database}
                    description={`${metrics.financials?.variancePercent?.toFixed(1)}% variance`}
                    valueClassName={metrics.financials?.variance >= 0 ? 'text-green-600' : 'text-red-600'}
                  />
                  <StatCard
                    title="Active Risks"
                    value={metrics.risks?.total || 0}
                    icon={AlertCircle}
                    description={`${metrics.risks?.critical || 0} critical`}
                    valueClassName={metrics.risks?.critical > 0 ? 'text-red-600' : undefined}
                  />
                  <StatCard
                    title="OKR Progress"
                    value={`${(metrics.okrs?.avgProgress || 0).toFixed(0)}%`}
                    icon={CheckCircle}
                    description={`${metrics.okrs?.totalObjectives || 0} objectives`}
                  />
                </StatGrid>

                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Object Types in Ontology</CardTitle>
                      <CardDescription>
                        {objectTypes.length} object types discovered
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {objectTypes.slice(0, 12).map((ot) => (
                          <Badge key={ot.apiName} variant="outline">
                            {ot.displayName || ot.apiName}
                          </Badge>
                        ))}
                        {objectTypes.length > 12 && (
                          <Badge variant="secondary">+{objectTypes.length - 12} more</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sync Status</CardTitle>
                      <CardDescription>Real-time sync operations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {['jira', 'openproject', 'monday'].map((source) => (
                        <div key={source} className="flex items-center justify-between">
                          <span className="capitalize font-medium">{source}</span>
                          {syncStatus?.syncing?.[source] ? (
                            <Badge variant="secondary" className="gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Syncing
                            </Badge>
                          ) : (
                            <Badge variant="outline">Idle</Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Could not load ontology metrics. Ensure Palantir is connected.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Schema Tab */}
          <TabsContent value="schema" className="space-y-4">
            {schemaLoading ? (
              <LoadingState message="Loading ontology schema..." />
            ) : (
              <div className="space-y-3">
                {objectTypes.map((objType) => (
                  <Collapsible
                    key={objType.apiName}
                    open={expandedTypes.has(objType.apiName)}
                    onOpenChange={() => toggleExpand(objType.apiName)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${
                                  expandedTypes.has(objType.apiName) ? 'rotate-90' : ''
                                }`}
                              />
                              <div>
                                <CardTitle className="text-base">
                                  {objType.displayName || objType.apiName}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {objType.apiName}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {Object.keys(objType.properties || {}).length} properties
                              </Badge>
                              <Badge variant="secondary">
                                {objType.assignedAgents?.length || 0} agents
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          {objType.description && (
                            <p className="text-sm text-muted-foreground">{objType.description}</p>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Primary Key</Label>
                              <div className="flex gap-1 mt-1">
                                {objType.primaryKey?.map((pk) => (
                                  <Badge key={pk} variant="outline" className="text-xs">
                                    {pk}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Data Sources</Label>
                              <div className="flex gap-1 mt-1">
                                {objType.dataSources?.map((ds) => (
                                  <Badge key={ds} variant="secondary" className="text-xs capitalize">
                                    {ds}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Properties</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {Object.entries(objType.properties || {}).map(([name, prop]) => (
                                <div
                                  key={name}
                                  className="text-xs p-2 rounded bg-muted flex justify-between"
                                >
                                  <span className="font-medium">{name}</span>
                                  <span className="text-muted-foreground">{(prop as any).dataType}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Assigned Agents</Label>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {objType.assignedAgents?.map((agent) => (
                                <Badge key={agent} variant="outline" className="text-xs">
                                  {agent}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Jira Sync Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-500" />
                    Jira
                  </CardTitle>
                  <CardDescription>
                    Sync issues and projects from Jira to Palantir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => openSyncDialog('jira')}
                    disabled={syncStatus?.syncing?.jira}
                    className="w-full"
                  >
                    {syncStatus?.syncing?.jira ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Sync
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* OpenProject Sync Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-green-500" />
                    OpenProject
                  </CardTitle>
                  <CardDescription>
                    Sync work packages from OpenProject to Palantir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => openSyncDialog('openproject')}
                    disabled={syncStatus?.syncing?.openproject}
                    className="w-full"
                  >
                    {syncStatus?.syncing?.openproject ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Sync
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Monday Sync Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-purple-500" />
                    Monday.com
                  </CardTitle>
                  <CardDescription>
                    Sync board items from Monday.com to Palantir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => openSyncDialog('monday')}
                    disabled={syncStatus?.syncing?.monday}
                    className="w-full"
                  >
                    {syncStatus?.syncing?.monday ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Sync
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <FileJson className="w-4 h-4" />
              <AlertDescription>
                <strong>Ontology-First Architecture:</strong> Data syncs TO Palantir Foundry, which becomes
                the single source of truth. All dashboards and agents read FROM the Palantir ontology.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sync Configuration Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">Configure {syncSource} Sync</DialogTitle>
            <DialogDescription>
              Enter credentials to sync data from {syncSource} to Palantir Foundry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {syncSource === 'jira' && (
              <>
                <div className="space-y-2">
                  <Label>Jira Base URL</Label>
                  <Input
                    placeholder="https://your-domain.atlassian.net"
                    value={syncConfig.baseUrl || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, baseUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    placeholder="your-email@company.com"
                    value={syncConfig.email || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Token</Label>
                  <Input
                    type="password"
                    placeholder="Your Jira API token"
                    value={syncConfig.apiToken || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, apiToken: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Key (optional)</Label>
                  <Input
                    placeholder="e.g., PROJ"
                    value={syncConfig.projectKey || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, projectKey: e.target.value })}
                  />
                </div>
              </>
            )}

            {syncSource === 'openproject' && (
              <>
                <div className="space-y-2">
                  <Label>OpenProject Base URL</Label>
                  <Input
                    placeholder="https://your-instance.openproject.com"
                    value={syncConfig.baseUrl || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, baseUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Token</Label>
                  <Input
                    type="password"
                    placeholder="Your OpenProject API token"
                    value={syncConfig.apiToken || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, apiToken: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project ID (optional)</Label>
                  <Input
                    placeholder="e.g., 123"
                    value={syncConfig.projectId || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, projectId: e.target.value })}
                  />
                </div>
              </>
            )}

            {syncSource === 'monday' && (
              <>
                <div className="space-y-2">
                  <Label>API Token</Label>
                  <Input
                    type="password"
                    placeholder="Your Monday.com API token"
                    value={syncConfig.apiToken || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, apiToken: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Board ID</Label>
                  <Input
                    placeholder="e.g., 1234567890"
                    value={syncConfig.boardId || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, boardId: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSync} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Sync
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
