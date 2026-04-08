// Core Dashboard Components
export { DynamicDashboard, type DynamicDashboardProps, type DashboardMode } from './core/DynamicDashboard';

// Widget Catalog
export { WidgetCatalog } from './catalog/WidgetCatalog';

// Sharing
export { ShareDialog, type ShareConfig, type ShareAccessLevel } from './sharing/ShareDialog';

// AI Widget Builder
export { AIWidgetBuilder } from './ai-builder/AIWidgetBuilder';

// Re-export Tremor widgets for convenience
export * from '@/components/tremor-widgets';

// Re-export workspace components
export { WorkspacePage, DashboardPage } from '@/components/workspace';

// Re-export AI insights components
export * from '@/components/ai-insights';
