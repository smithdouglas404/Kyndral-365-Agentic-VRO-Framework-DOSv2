import { useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import * as RGL from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Card,
  Metric,
  Text,
  Flex,
  Badge,
  Button,
  Callout,
} from '@tremor/react';
import {
  GripVertical,
  Settings,
  Share2,
  Plus,
  RotateCcw,
  Save,
  X,
  Sparkles,
  LayoutGrid,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  WidgetDefinition,
  WidgetLayout,
  DashboardConfig,
  WidgetSize,
  WidgetCategory,
  getAllWidgetsForTab,
  sizeToGrid,
  loadDashboardConfig,
  saveDashboardConfig,
  resetDashboardConfig,
  widgetCategories,
} from '@/lib/widgetRegistry';
import {
  useUserDashboardConfig,
  useSaveDashboardConfig,
  useResetDashboardConfig,
} from '@/hooks/useAppConfig';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const RGLModule = RGL as any;
const ResponsiveGridLayout = RGLModule.ResponsiveGridLayout || RGLModule.default?.ResponsiveGridLayout || RGLModule.Responsive || RGLModule.default?.Responsive;

// ============================================================================
// Types
// ============================================================================

export type DashboardMode = 'view' | 'edit' | 'customize';

export interface DynamicDashboardProps {
  workspaceType: string;
  activeTab?: string;
  defaultWidgets?: string[];
  widgetComponents: Record<string, ReactNode>;
  onWidgetClick?: (widgetId: string) => void;
  onDrillDown?: (type: string, id: string) => void;
  onOpenCatalog?: () => void;
  onOpenShare?: () => void;
  onOpenAIBuilder?: () => void;
}

// ============================================================================
// Widget Container Component
// ============================================================================

interface WidgetContainerProps {
  widget: WidgetDefinition;
  children: ReactNode;
  mode: DashboardMode;
  onRemove?: () => void;
  insights?: {
    count: number;
    severity: 'info' | 'warning' | 'critical';
  };
}

function WidgetContainer({
  widget,
  children,
  mode,
  onRemove,
  insights,
}: WidgetContainerProps) {
  const isEditMode = mode === 'edit';
  const categoryInfo = widgetCategories.find(c => c.id === widget.category);

  return (
    <div
      className={cn(
        'h-full w-full rounded-lg border overflow-hidden transition-all duration-200',
        'bg-tremor-background dark:bg-tremor-background',
        isEditMode && 'border-tremor-brand ring-2 ring-tremor-brand/20 shadow-lg',
        !isEditMode && 'border-tremor-border hover:shadow-md'
      )}
    >
      {/* Edit Mode Header */}
      {isEditMode && (
        <div className="flex items-center justify-between px-3 py-2 bg-tremor-brand-muted border-b border-tremor-brand cursor-move drag-handle">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-tremor-brand" />
            <span className="text-sm font-medium text-tremor-brand-emphasis">
              {widget.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {categoryInfo && (
              <ShadcnBadge variant="outline" className="text-xs">
                {categoryInfo.name}
              </ShadcnBadge>
            )}
            {widget.source === 'ai-generated' && (
              <ShadcnBadge variant="secondary" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                AI
              </ShadcnBadge>
            )}
            {onRemove && (
              <ShadcnButton
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="h-3 w-3" />
              </ShadcnButton>
            )}
          </div>
        </div>
      )}

      {/* Insight Badge */}
      {!isEditMode && insights && insights.count > 0 && widget.insightPlacement === 'badge' && (
        <div className="absolute top-2 right-2 z-10">
          <Badge
            color={
              insights.severity === 'critical' ? 'rose' :
              insights.severity === 'warning' ? 'amber' : 'blue'
            }
            size="sm"
          >
            {insights.count} insight{insights.count > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Widget Content */}
      <div className={cn(
        'overflow-auto',
        isEditMode ? 'h-[calc(100%-40px)]' : 'h-full'
      )}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Dynamic Dashboard Component
// ============================================================================

export function DynamicDashboard({
  workspaceType,
  activeTab = 'overview',
  defaultWidgets,
  widgetComponents,
  onWidgetClick,
  onDrillDown,
  onOpenCatalog,
  onOpenShare,
  onOpenAIBuilder,
}: DynamicDashboardProps) {
  // Server-persisted config
  const { data: serverConfig, isLoading: configLoading } = useUserDashboardConfig(workspaceType);
  const saveConfigMutation = useSaveDashboardConfig();
  const resetConfigMutation = useResetDashboardConfig();

  // Local state
  const [config, setConfig] = useState<DashboardConfig>(() => loadDashboardConfig());
  const [mode, setMode] = useState<DashboardMode>('view');
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
        visibleWidgets: serverConfig.visibleWidgets || defaultWidgets || [],
        widgetSizes: (serverConfig.widgetSizes || {}) as Record<string, WidgetSize>,
      });
      setIsSynced(true);
    }
  }, [serverConfig, isSynced, defaultWidgets]);

  // Get widgets for current tab
  const tabWidgets = useMemo(() => getAllWidgetsForTab(activeTab), [activeTab]);

  const visibleTabWidgets = useMemo(() => {
    return tabWidgets.filter(w => config.visibleWidgets.includes(w.id));
  }, [tabWidgets, config.visibleWidgets]);

  // Calculate layout
  const currentLayout = useMemo(() => {
    const widgetIds = new Set(visibleTabWidgets.map(w => w.id));
    let baseLayout = config.layouts.lg.filter(l => widgetIds.has(l.i));

    // Add missing widgets
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

  // Handlers
  const handleLayoutChange = useCallback((newLayout: WidgetLayout[]) => {
    if (mode !== 'edit') return;

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
  }, [mode]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setConfig(prev => ({
      ...prev,
      visibleWidgets: prev.visibleWidgets.filter(id => id !== widgetId),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    saveDashboardConfig(config);

    if (workspaceType) {
      try {
        await saveConfigMutation.mutateAsync({
          dashboardType: workspaceType,
          config: {
            layouts: config.layouts,
            visibleWidgets: config.visibleWidgets,
            widgetSizes: config.widgetSizes,
            widgetConfigs: {},
          },
        });
      } catch (error) {
        console.warn('Failed to save config to server:', error);
      }
    }

    setMode('view');
  }, [config, workspaceType, saveConfigMutation]);

  const handleReset = useCallback(async () => {
    const defaultConfig = resetDashboardConfig();
    setConfig(defaultConfig);

    if (workspaceType) {
      try {
        await resetConfigMutation.mutateAsync(workspaceType);
        setIsSynced(false);
      } catch (error) {
        console.warn('Failed to reset server config:', error);
      }
    }
  }, [workspaceType, resetConfigMutation]);

  const handleCancel = useCallback(() => {
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
    setMode('view');
  }, [serverConfig, isSynced]);

  // Loading state
  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-tremor-brand" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Sync status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs',
                  isSynced ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-50'
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
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {mode === 'edit' ? (
              <motion.div
                key="edit-actions"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <ShadcnButton variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </ShadcnButton>
                <ShadcnButton variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </ShadcnButton>
                <ShadcnButton size="sm" onClick={handleSave} className="bg-tremor-brand hover:bg-tremor-brand-emphasis">
                  <Save className="h-4 w-4 mr-1" />
                  Save Layout
                </ShadcnButton>
              </motion.div>
            ) : (
              <motion.div
                key="view-actions"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                {onOpenAIBuilder && (
                  <ShadcnButton variant="outline" size="sm" onClick={onOpenAIBuilder}>
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI Widget
                  </ShadcnButton>
                )}
                {onOpenCatalog && (
                  <ShadcnButton variant="outline" size="sm" onClick={onOpenCatalog}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Widget
                  </ShadcnButton>
                )}
                {onOpenShare && (
                  <ShadcnButton variant="outline" size="sm" onClick={onOpenShare}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </ShadcnButton>
                )}
                <ShadcnButton variant="outline" size="sm" onClick={() => setMode('edit')}>
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Edit Layout
                </ShadcnButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Mode Banner */}
      <AnimatePresence>
        {mode === 'edit' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Callout
              title="Edit Mode"
              color="blue"
              className="mb-4"
            >
              Drag widgets to reorder them. Click the X to hide a widget.
              Click "Save Layout" when done or "Cancel" to discard changes.
            </Callout>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {visibleTabWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <LayoutGrid className="h-12 w-12 mx-auto text-tremor-content-subtle mb-4" />
          <Text className="text-lg font-medium mb-2">No widgets added</Text>
          <Text className="text-tremor-content-subtle mb-4">
            Add widgets to customize your dashboard
          </Text>
          <div className="flex justify-center gap-2">
            {onOpenCatalog && (
              <Button onClick={onOpenCatalog}>
                <Plus className="h-4 w-4 mr-1" />
                Add Widget
              </Button>
            )}
            {onOpenAIBuilder && (
              <Button variant="secondary" onClick={onOpenAIBuilder}>
                <Sparkles className="h-4 w-4 mr-1" />
                Create with AI
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Widget Grid */}
      {visibleTabWidgets.length > 0 && (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: currentLayout, md: currentLayout, sm: currentLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={80}
          isDraggable={mode === 'edit'}
          isResizable={mode === 'edit'}
          draggableHandle=".drag-handle"
          onLayoutChange={(layout: WidgetLayout[]) => handleLayoutChange(layout)}
          margin={[16, 16]}
        >
          {visibleTabWidgets.map(widget => (
            <div key={widget.id} data-testid={`widget-${widget.id}`}>
              <WidgetContainer
                widget={widget}
                mode={mode}
                onRemove={() => handleRemoveWidget(widget.id)}
              >
                {widgetComponents[widget.id] || (
                  <div className="flex items-center justify-center h-full p-4">
                    <Text className="text-tremor-content-subtle">
                      Widget: {widget.name}
                    </Text>
                  </div>
                )}
              </WidgetContainer>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}

export default DynamicDashboard;
