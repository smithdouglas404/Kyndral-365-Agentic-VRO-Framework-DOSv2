import { useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import * as RGL from 'react-grid-layout';
import { motion } from 'framer-motion';
import { GripVertical, Settings, Eye, EyeOff, RotateCcw, Save, X, Cloud, CloudOff, Loader2, Plus } from 'lucide-react';
import { WidgetBuilder } from '@/components/WidgetBuilder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  widgetDefinitions,
  WidgetDefinition,
  WidgetLayout,
  DashboardConfig,
  loadDashboardConfig,
  saveDashboardConfig,
  resetDashboardConfig,
  sizeToGrid,
  getWidgetsForTab,
  WidgetSize,
} from '@/lib/widgetRegistry';
import {
  useUserDashboardConfig,
  useSaveDashboardConfig,
  useResetDashboardConfig,
  useUserWidgets,
} from '@/hooks/useAppConfig';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const RGLModule = RGL as any;
const Responsive = RGLModule.Responsive || RGLModule.default?.Responsive;
const WidthProviderFn = RGLModule.WidthProvider || RGLModule.default?.WidthProvider;
const ResponsiveGridLayout = WidthProviderFn ? WidthProviderFn(Responsive) : Responsive;

interface WidgetWrapperProps {
  widget: WidgetDefinition;
  children: ReactNode;
  isEditMode: boolean;
  onRemove?: () => void;
}

function WidgetWrapper({ widget, children, isEditMode, onRemove }: WidgetWrapperProps) {
  return (
    <div className={cn(
      "h-full w-full bg-white rounded-lg border overflow-hidden",
      isEditMode && "border-blue-300 shadow-lg"
    )}>
      {isEditMode && (
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-200 cursor-move drag-handle">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-700">{widget.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">{widget.category}</Badge>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
      <div className={cn("overflow-auto", isEditMode ? "h-[calc(100%-40px)]" : "h-full")}>
        {children}
      </div>
    </div>
  );
}

interface CustomizableDashboardProps {
  activeTab: string;
  dashboardType?: string; // For server persistence (e.g., 'finops', 'governance', 'ppm')
  widgetComponents: Record<string, ReactNode>;
  onDrillDown?: (type: string, id: string) => void;
}

export function CustomizableDashboard({
  activeTab,
  dashboardType,
  widgetComponents,
  onDrillDown
}: CustomizableDashboardProps) {
  // Server-persisted config (if dashboardType provided)
  const { data: serverConfig, isLoading: configLoading } = useUserDashboardConfig(dashboardType || activeTab);
  const saveConfigMutation = useSaveDashboardConfig();
  const resetConfigMutation = useResetDashboardConfig();
  const { data: userWidgets = [] } = useUserWidgets();

  // Local state - initialized from server or localStorage
  const [config, setConfig] = useState<DashboardConfig>(() => loadDashboardConfig());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<DashboardConfig | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  // Sync server config to local state when loaded
  useEffect(() => {
    if (serverConfig && !isSynced) {
      setConfig({
        layouts: {
          lg: serverConfig.layouts?.lg || [],
          md: serverConfig.layouts?.md || [],
          sm: serverConfig.layouts?.sm || [],
        },
        visibleWidgets: serverConfig.visibleWidgets || [],
        widgetSizes: (serverConfig.widgetSizes || {}) as Record<string, WidgetSize>,
      });
      setIsSynced(true);
    }
  }, [serverConfig, isSynced]);

  // Merge user-created widgets into widget components
  const allWidgetComponents = useMemo(() => {
    const dynamicWidgets: Record<string, ReactNode> = {};
    userWidgets.forEach(widget => {
      dynamicWidgets[`user-${widget.id}`] = (
        <div className="p-4 h-full">
          <div className="text-sm font-medium mb-2">{widget.name}</div>
          <div className="text-xs text-muted-foreground">
            {widget.description || 'Custom widget'}
          </div>
        </div>
      );
    });
    return { ...widgetComponents, ...dynamicWidgets };
  }, [widgetComponents, userWidgets]);

  const tabWidgets = useMemo(() => getWidgetsForTab(activeTab), [activeTab]);

  const visibleTabWidgets = useMemo(() => {
    return tabWidgets.filter(w => config.visibleWidgets.includes(w.id));
  }, [tabWidgets, config.visibleWidgets]);

  const currentLayout = useMemo(() => {
    const widgetIds = new Set(visibleTabWidgets.map(w => w.id));
    
    let baseLayout = config.layouts.lg.filter(l => widgetIds.has(l.i));
    
    visibleTabWidgets.forEach(widget => {
      if (!baseLayout.find(l => l.i === widget.id)) {
        const size = sizeToGrid[config.widgetSizes[widget.id] || widget.defaultSize];
        const maxY = baseLayout.length > 0 ? Math.max(...baseLayout.map(l => l.y + l.h)) : 0;
        baseLayout.push({
          i: widget.id,
          x: 0,
          y: maxY,
          w: size.w,
          h: size.h,
          minH: widget.minHeight || 2,
        });
      }
    });

    return baseLayout;
  }, [visibleTabWidgets, config]);

  const handleLayoutChange = useCallback((newLayout: WidgetLayout[]) => {
    if (!isEditMode) return;
    
    const mappedLayout: WidgetLayout[] = newLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      static: item.static,
    }));
    
    setConfig(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        lg: mappedLayout,
        md: mappedLayout,
        sm: mappedLayout,
      },
    }));
  }, [isEditMode]);

  const handleToggleWidget = useCallback((widgetId: string, visible: boolean) => {
    setConfig(prev => ({
      ...prev,
      visibleWidgets: visible
        ? [...prev.visibleWidgets, widgetId]
        : prev.visibleWidgets.filter(id => id !== widgetId),
    }));
  }, []);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    handleToggleWidget(widgetId, false);
  }, [handleToggleWidget]);

  const handleSave = useCallback(async () => {
    // Save to localStorage first (fallback)
    saveDashboardConfig(config);

    // Save to server if dashboardType provided
    if (dashboardType) {
      try {
        await saveConfigMutation.mutateAsync({
          dashboardType,
          config: {
            layouts: config.layouts,
            visibleWidgets: config.visibleWidgets,
            widgetSizes: config.widgetSizes,
            widgetConfigs: {},
          },
        });
      } catch (error) {
        console.warn('Failed to save config to server, using localStorage fallback:', error);
      }
    }

    setIsEditMode(false);
  }, [config, dashboardType, saveConfigMutation]);

  const handleReset = useCallback(async () => {
    const defaultConfig = resetDashboardConfig();
    setConfig(defaultConfig);

    // Reset server config if dashboardType provided
    if (dashboardType) {
      try {
        await resetConfigMutation.mutateAsync(dashboardType);
        setIsSynced(false); // Force re-sync from server
      } catch (error) {
        console.warn('Failed to reset server config:', error);
      }
    }
  }, [dashboardType, resetConfigMutation]);

  const handleCancelEdit = useCallback(() => {
    // Restore from server config if available, otherwise localStorage
    if (serverConfig && isSynced) {
      setConfig({
        layouts: {
          lg: serverConfig.layouts?.lg || [],
          md: serverConfig.layouts?.md || [],
          sm: serverConfig.layouts?.sm || [],
        },
        visibleWidgets: serverConfig.visibleWidgets || [],
        widgetSizes: (serverConfig.widgetSizes || {}) as Record<string, WidgetSize>,
      });
    } else {
      setConfig(loadDashboardConfig());
    }
    setIsEditMode(false);
  }, [serverConfig, isSynced]);

  // Loading state
  if (configLoading && dashboardType) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-2 mb-4">
        {/* Sync status indicator */}
        {dashboardType && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs",
                  isSynced ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50"
                )}>
                  {saveConfigMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isSynced ? (
                    <Cloud className="h-3 w-3" />
                  ) : (
                    <CloudOff className="h-3 w-3" />
                  )}
                  <span>{saveConfigMutation.isPending ? 'Saving...' : isSynced ? 'Synced' : 'Local'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isSynced ? 'Layout synced to server' : 'Using local storage'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isEditMode ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              className="gap-1"
              data-testid="button-cancel-edit"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1"
              data-testid="button-reset-layout"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="gap-1 bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-layout"
            >
              <Save className="h-4 w-4" />
              Save Layout
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetBuilder(true)}
              className="gap-1"
              data-testid="button-create-widget"
            >
              <Plus className="h-4 w-4" />
              Create Widget
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="gap-1"
              data-testid="button-widget-settings"
            >
              <Settings className="h-4 w-4" />
              Widgets
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="gap-1"
              data-testid="button-edit-layout"
            >
              <GripVertical className="h-4 w-4" />
              Edit Layout
            </Button>
          </>
        )}
      </div>

      {isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
        >
          <p className="text-sm text-blue-700">
            <strong>Edit Mode:</strong> Drag widgets to reorder them. Click the X to hide a widget. 
            Click "Save Layout" when done or "Cancel" to discard changes.
          </p>
        </motion.div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: currentLayout, md: currentLayout, sm: currentLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={80}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".drag-handle"
        onLayoutChange={(layout: WidgetLayout[]) => handleLayoutChange(layout)}
        margin={[16, 16]}
      >
        {visibleTabWidgets.map(widget => (
          <div key={widget.id} data-testid={`widget-${widget.id}`}>
            <WidgetWrapper
              widget={widget}
              isEditMode={isEditMode}
              onRemove={() => handleRemoveWidget(widget.id)}
            >
              {allWidgetComponents[widget.id] || (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Widget: {widget.name}
                </div>
              )}
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Dashboard Widgets</DialogTitle>
            <DialogDescription>
              Choose which widgets to display on the {activeTab} tab
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {tabWidgets.map(widget => {
              const isVisible = config.visibleWidgets.includes(widget.id);
              return (
                <div
                  key={widget.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    isVisible ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{widget.name}</span>
                      <Badge variant="outline" className="text-xs">{widget.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{widget.description}</p>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={(checked) => handleToggleWidget(widget.id, checked)}
                    data-testid={`toggle-widget-${widget.id}`}
                  />
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={() => {
              saveDashboardConfig(config);
              setShowSettings(false);
            }}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Widget Builder Dialog */}
      <WidgetBuilder
        open={showWidgetBuilder}
        onOpenChange={setShowWidgetBuilder}
        onSave={(widget) => {
          // Add the new widget to visible widgets
          setConfig((prev) => ({
            ...prev,
            visibleWidgets: [...prev.visibleWidgets, `user-${widget.id}`],
          }));
        }}
      />
    </div>
  );
}

export default CustomizableDashboard;
