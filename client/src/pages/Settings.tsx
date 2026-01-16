import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, RotateCcw, Save, ArrowLeft, Layout, Eye, Grid3X3, Palette } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  widgetDefinitions,
  WidgetSize,
  DashboardConfig,
  loadDashboardConfig,
  saveDashboardConfig,
  resetDashboardConfig,
  sizeToGrid,
} from '@/lib/widgetRegistry';

export default function Settings() {
  const [config, setConfig] = useState<DashboardConfig>(() => loadDashboardConfig());
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggleWidget = (widgetId: string, visible: boolean) => {
    setConfig(prev => ({
      ...prev,
      visibleWidgets: visible
        ? [...prev.visibleWidgets, widgetId]
        : prev.visibleWidgets.filter(id => id !== widgetId),
    }));
    setHasChanges(true);
  };

  const handleSizeChange = (widgetId: string, size: WidgetSize) => {
    setConfig(prev => ({
      ...prev,
      widgetSizes: {
        ...prev.widgetSizes,
        [widgetId]: size,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveDashboardConfig(config);
    setHasChanges(false);
    toast.success('Dashboard settings saved successfully');
  };

  const handleReset = () => {
    const defaultConfig = resetDashboardConfig();
    setConfig(defaultConfig);
    setHasChanges(true);
    toast.info('Dashboard reset to default settings');
  };

  const groupedWidgets = widgetDefinitions.reduce((acc, widget) => {
    const category = widget.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(widget);
    return acc;
  }, {} as Record<string, typeof widgetDefinitions>);

  const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    insights: { label: 'AI Insights', icon: <Eye className="h-4 w-4" /> },
    metrics: { label: 'Metrics & KPIs', icon: <Grid3X3 className="h-4 w-4" /> },
    segments: { label: 'Business Segments', icon: <Layout className="h-4 w-4" /> },
    agents: { label: 'AI Agents', icon: <Palette className="h-4 w-4" /> },
    charts: { label: 'Charts & Analysis', icon: <Grid3X3 className="h-4 w-4" /> },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 border-b border-gray-200 bg-white flex items-center px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-semibold">Dashboard Settings</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
            data-testid="button-reset-all"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs defaultValue="widgets" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="widgets" className="gap-2" data-testid="tab-widgets">
                <Layout className="h-4 w-4" />
                Widgets
              </TabsTrigger>
              <TabsTrigger value="layout" className="gap-2" data-testid="tab-layout">
                <Grid3X3 className="h-4 w-4" />
                Layout
              </TabsTrigger>
            </TabsList>

            <TabsContent value="widgets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Visibility</CardTitle>
                  <CardDescription>
                    Choose which widgets to display on your dashboard. Hidden widgets can be re-enabled anytime.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {Object.entries(groupedWidgets).map(([category, widgets]) => (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        {categoryLabels[category]?.icon}
                        <h3 className="font-semibold text-gray-700">
                          {categoryLabels[category]?.label || category}
                        </h3>
                        <Badge variant="outline" className="ml-2">
                          {widgets.filter(w => config.visibleWidgets.includes(w.id)).length}/{widgets.length}
                        </Badge>
                      </div>

                      <div className="grid gap-3">
                        {widgets.map(widget => {
                          const isVisible = config.visibleWidgets.includes(widget.id);
                          return (
                            <div
                              key={widget.id}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                                isVisible 
                                  ? "bg-blue-50 border-blue-200" 
                                  : "bg-gray-50 border-gray-200 opacity-60"
                              )}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{widget.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {widget.tabs.join(', ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{widget.description}</p>
                              </div>
                              <Switch
                                checked={isVisible}
                                onCheckedChange={(checked) => handleToggleWidget(widget.id, checked)}
                                data-testid={`switch-widget-${widget.id}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Sizes</CardTitle>
                  <CardDescription>
                    Customize the size of each widget on your dashboard. Larger widgets show more detail.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {widgetDefinitions
                      .filter(w => config.visibleWidgets.includes(w.id))
                      .map(widget => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-white"
                        >
                          <div>
                            <span className="font-medium">{widget.name}</span>
                            <p className="text-sm text-gray-500">
                              Allowed: {widget.allowedSizes.join(', ')}
                            </p>
                          </div>
                          <Select
                            value={config.widgetSizes[widget.id] || widget.defaultSize}
                            onValueChange={(value) => handleSizeChange(widget.id, value as WidgetSize)}
                          >
                            <SelectTrigger className="w-32" data-testid={`select-size-${widget.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {widget.allowedSizes.map(size => (
                                <SelectItem key={size} value={size}>
                                  {size.charAt(0).toUpperCase() + size.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}

                    {config.visibleWidgets.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No widgets are currently visible. Enable widgets in the Widgets tab first.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Layout Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <p>
                    <strong>Edit Mode:</strong> Click "Edit Layout" on the dashboard to drag and reorder widgets.
                  </p>
                  <p>
                    <strong>Widget Sizes:</strong> Small (25% width), Medium (50%), Large (75%), Full (100%).
                  </p>
                  <p>
                    <strong>Persistence:</strong> Your layout is automatically saved to your browser.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
