import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Layout, Activity, Database, ArrowUp, ArrowDown, Eye, EyeOff, RefreshCw, Download, FileSpreadsheet, FileJson, Loader2, Key, CheckCircle, XCircle, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardWidgets, useUpdateDashboardWidget, useReorderDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { useDemoMode, useToggleDemoMode } from "@/hooks/useAppConfig";
import { usePortfolioMetrics } from "@/hooks/usePortfolioMetrics";
import { useExportJobs, useCreateExportJob } from "@/hooks/useExportJobs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function WidgetConfiguration() {
  const { data: widgets, isLoading, refetch } = useDashboardWidgets(undefined, true);
  const updateWidget = useUpdateDashboardWidget();
  const reorderWidgets = useReorderDashboardWidgets();
  const [localWidgets, setLocalWidgets] = useState<typeof widgets>([]);

  const handleToggleVisibility = async (widgetId: string, currentVisibility: boolean) => {
    try {
      await updateWidget.mutateAsync({ id: widgetId, updates: { isVisible: !currentVisibility } });
      toast.success("Widget visibility updated");
    } catch (error) {
      toast.error("Failed to update widget");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (!widgets || index === 0) return;
    const newOrder = widgets.map((w, i) => ({
      id: w.id,
      sortOrder: i === index ? index - 1 : i === index - 1 ? index : i,
    }));
    try {
      await reorderWidgets.mutateAsync(newOrder);
      toast.success("Widget order updated");
    } catch (error) {
      toast.error("Failed to reorder widgets");
    }
  };

  const handleMoveDown = async (index: number) => {
    if (!widgets || index === widgets.length - 1) return;
    const newOrder = widgets.map((w, i) => ({
      id: w.id,
      sortOrder: i === index ? index + 1 : i === index + 1 ? index : i,
    }));
    try {
      await reorderWidgets.mutateAsync(newOrder);
      toast.success("Widget order updated");
    } catch (error) {
      toast.error("Failed to reorder widgets");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Configure which widgets appear on the dashboard and their order.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-widgets">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-2">
        {widgets?.map((widget, index) => (
          <div
            key={widget.id}
            className={cn(
              "flex items-center justify-between p-4 border rounded-lg bg-white",
              !widget.isVisible && "opacity-60 bg-gray-50"
            )}
            data-testid={`widget-config-${widget.widgetKey}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  data-testid={`button-move-up-${widget.widgetKey}`}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === (widgets?.length || 0) - 1}
                  data-testid={`button-move-down-${widget.widgetKey}`}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{widget.title}</span>
                  <Badge variant="outline" className="text-xs">{widget.widgetType}</Badge>
                  <Badge variant="secondary" className="text-xs">{widget.category}</Badge>
                </div>
                <p className="text-sm text-gray-500">{widget.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{widget.size}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleVisibility(widget.id, widget.isVisible || false)}
                data-testid={`button-toggle-${widget.widgetKey}`}
              >
                {widget.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemSettings() {
  const { isDemoMode, isLoading: demoLoading } = useDemoMode();
  const { toggle: toggleDemoMode, isPending: isToggling } = useToggleDemoMode();

  const handleToggleDemoMode = async () => {
    try {
      toggleDemoMode();
      toast.success(isDemoMode ? "Demo mode disabled" : "Demo mode enabled");
    } catch (error) {
      toast.error("Failed to toggle demo mode");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-1">
          <Label htmlFor="demo-mode" className="text-base font-medium">Demo Mode</Label>
          <p className="text-sm text-gray-500">
            When enabled, the system simulates agent activity for demonstration purposes.
          </p>
        </div>
        <Switch
          id="demo-mode"
          checked={isDemoMode}
          onCheckedChange={handleToggleDemoMode}
          disabled={demoLoading || isToggling}
          data-testid="switch-demo-mode"
        />
      </div>
    </div>
  );
}

function APIKeySettings() {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'valid' | 'invalid' | 'checking'>('unknown');
  const [isSaving, setIsSaving] = useState(false);

  const checkKeyStatus = async () => {
    setKeyStatus('checking');
    try {
      const res = await fetch('/api/ai/check-key');
      const data = await res.json();
      setKeyStatus(data.valid ? 'valid' : 'invalid');
    } catch {
      setKeyStatus('unknown');
    }
  };

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const handleSaveKey = async () => {
    if (!anthropicKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ANTHROPIC_API_KEY', value: anthropicKey })
      });
      
      if (res.ok) {
        toast.success("API key saved successfully. Restart the application to apply changes.");
        setAnthropicKey("");
        checkKeyStatus();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save API key");
      }
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">Anthropic API Key</Label>
              {keyStatus === 'checking' && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              )}
              {keyStatus === 'valid' && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              )}
              {keyStatus === 'invalid' && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Required for AI Executive Summary, AI insights, and intelligent analysis features.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkKeyStatus}
            disabled={keyStatus === 'checking'}
            data-testid="button-check-api-key"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", keyStatus === 'checking' && "animate-spin")} />
            Check Status
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-ant-api03-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="pr-10"
              data-testid="input-anthropic-key"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowKey(!showKey)}
              data-testid="button-toggle-key-visibility"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button 
            onClick={handleSaveKey}
            disabled={isSaving || !anthropicKey.trim()}
            data-testid="button-save-api-key"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Key
          </Button>
        </div>
        
        <p className="text-xs text-gray-400">
          Get your API key from{" "}
          <a 
            href="https://console.anthropic.com/settings/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Key className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800">Security Note</p>
            <p className="text-xs text-amber-700">
              API keys are stored securely as environment secrets. After saving a new key, 
              you may need to restart the application for changes to take effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioStats() {
  const { data: metrics, isLoading, refetch } = usePortfolioMetrics();

  if (isLoading) {
    return <div className="h-32 bg-gray-100 rounded animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Real-time calculated metrics from project data.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-metrics">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-2xl">{metrics?.summary.totalProjects}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budget Utilization</CardDescription>
            <CardTitle className="text-2xl">{metrics?.financial.budgetUtilization}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total ROI Value</CardDescription>
            <CardTitle className="text-2xl">${metrics?.financial.totalRoiValue}M</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Health Score</CardDescription>
            <CardTitle className="text-2xl">{metrics?.performance.healthScore}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Green Projects</CardDescription>
            <CardTitle className="text-xl">{metrics?.summary.projectsByStatus.green}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription>Amber Projects</CardDescription>
            <CardTitle className="text-xl">{metrics?.summary.projectsByStatus.amber}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription>Red Projects</CardDescription>
            <CardTitle className="text-xl">{metrics?.summary.projectsByStatus.red}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <p className="text-xs text-gray-400">
        Last calculated: {metrics?.lastCalculated ? new Date(metrics.lastCalculated).toLocaleString() : 'N/A'}
      </p>
    </div>
  );
}

function DataExport() {
  const { data: jobs = [], isLoading, refetch } = useExportJobs();
  const createExport = useCreateExportJob();

  const handleExport = async (exportType: 'projects' | 'metrics' | 'reports' | 'full_backup', format: 'csv' | 'json') => {
    try {
      await createExport.mutateAsync({ exportType, format });
      toast.success(`Export job created. Check back in a moment.`);
      setTimeout(() => refetch(), 3000);
    } catch (error) {
      toast.error("Failed to create export job");
    }
  };

  const recentJobs = jobs.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Export Data</h3>
        <p className="text-sm text-gray-600">Download your data in various formats for backup or analysis.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Projects</CardTitle>
              <CardDescription className="text-xs">Export all project data</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('projects', 'csv')}
                disabled={createExport.isPending}
                data-testid="button-export-projects-csv"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('projects', 'json')}
                disabled={createExport.isPending}
                data-testid="button-export-projects-json"
              >
                <FileJson className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Metrics</CardTitle>
              <CardDescription className="text-xs">Export VRO metrics data</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('metrics', 'csv')}
                disabled={createExport.isPending}
                data-testid="button-export-metrics-csv"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('metrics', 'json')}
                disabled={createExport.isPending}
                data-testid="button-export-metrics-json"
              >
                <FileJson className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Recent Exports</h3>
          <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-exports">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : recentJobs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No exports yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {recentJobs.map(job => (
              <div 
                key={job.id} 
                className="flex items-center justify-between p-3 border rounded-lg bg-white"
                data-testid={`export-job-${job.id}`}
              >
                <div className="flex items-center gap-3">
                  {job.format === 'json' ? (
                    <FileJson className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm capitalize">{job.exportType}</p>
                    <p className="text-xs text-gray-500">
                      {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'Just now'}
                      {job.rowCount && ` • ${job.rowCount} rows`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {job.status}
                  </Badge>
                  {job.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/api/export-jobs/${job.id}/download`, '_blank')}
                      data-testid={`button-download-${job.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-[#0072CE]" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500">Configure dashboard and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="widgets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="widgets" className="flex items-center gap-2" data-testid="tab-widgets">
            <Layout className="h-4 w-4" />
            Widgets
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2" data-testid="tab-metrics">
            <Database className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2" data-testid="tab-export">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2" data-testid="tab-api-keys">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2" data-testid="tab-system">
            <Activity className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="widgets">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Widget Configuration</CardTitle>
              <CardDescription>
                Control which widgets appear on the dashboard and their display order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WidgetConfiguration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Calculated Portfolio Metrics</CardTitle>
              <CardDescription>
                These metrics are calculated in real-time from your project data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioStats />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export your project and metrics data for backup or external analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataExport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Configure API keys for AI features and external integrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <APIKeySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and feature toggles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
