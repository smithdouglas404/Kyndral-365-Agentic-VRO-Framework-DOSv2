import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Layout, Activity, Database, ArrowUp, ArrowDown, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useDashboardWidgets, useUpdateDashboardWidget, useReorderDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { useDemoMode, useToggleDemoMode } from "@/hooks/useAppConfig";
import { usePortfolioMetrics } from "@/hooks/usePortfolioMetrics";
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="widgets" className="flex items-center gap-2" data-testid="tab-widgets">
            <Layout className="h-4 w-4" />
            Dashboard Widgets
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2" data-testid="tab-metrics">
            <Database className="h-4 w-4" />
            Portfolio Metrics
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
