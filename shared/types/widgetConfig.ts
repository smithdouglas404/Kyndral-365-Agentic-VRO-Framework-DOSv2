/**
 * Widget Configuration Schema
 *
 * Defines the structure for user-created custom widgets and their data sources.
 */

// ============================================================================
// Data Source Configuration
// ============================================================================

export type DataSourceType = 'ontology' | 'api' | 'agent';

export interface WidgetFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'not_in';
  value: string | number | boolean | string[] | number[];
}

export interface WidgetDataSource {
  type: DataSourceType;
  /** Palantir object type (for ontology sources) */
  objectType?: string;
  /** API endpoint path (for api sources) */
  endpoint?: string;
  /** Agent ID to fetch data from (for agent sources) */
  agentId?: string;
  /** Data filters to apply */
  filters?: WidgetFilter[];
  /** Data refresh interval in milliseconds */
  refreshInterval?: number;
  /** Field mappings to rename source fields */
  fieldMappings?: Record<string, string>;
}

// ============================================================================
// Visualization Configuration
// ============================================================================

export type VisualizationType = 'metric' | 'chart' | 'table' | 'list' | 'gauge' | 'progress' | 'sparkline';
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'radar' | 'area' | 'scatter';
export type FieldFormat = 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'text' | 'boolean';
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';

export interface WidgetFieldMapping {
  /** Field name in source data */
  sourceField: string;
  /** Display name shown in widget */
  displayName: string;
  /** How to format the value */
  format?: FieldFormat;
  /** Aggregation method if multiple values */
  aggregation?: AggregationType;
  /** Custom formatter function name */
  customFormatter?: string;
}

export interface WidgetThreshold {
  /** Threshold value */
  value: number;
  /** Color to display when threshold is met */
  color: string;
  /** Optional label for the threshold */
  label?: string;
  /** Comparison operator */
  operator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
}

export interface WidgetVisualization {
  /** Type of visualization */
  type: VisualizationType;
  /** Specific chart type (if type is 'chart') */
  chartType?: ChartType;
  /** Field mappings for data binding */
  fields: WidgetFieldMapping[];
  /** Thresholds for conditional formatting */
  thresholds?: WidgetThreshold[];
  /** X-axis configuration for charts */
  xAxis?: {
    field: string;
    label?: string;
    format?: FieldFormat;
  };
  /** Y-axis configuration for charts */
  yAxis?: {
    field: string;
    label?: string;
    format?: FieldFormat;
  };
  /** Color scheme */
  colors?: string[];
  /** Show legend */
  showLegend?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  /** Animation enabled */
  animate?: boolean;
}

// ============================================================================
// Complete Widget Configuration
// ============================================================================

export interface WidgetConfig {
  /** Unique widget identifier */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Based on existing widget template */
  templateId?: string;
  /** Data source configuration */
  dataSource: WidgetDataSource;
  /** Visualization configuration */
  visualization: WidgetVisualization;
  /** Widget size */
  size: 'small' | 'medium' | 'large' | 'full';
  /** Data refresh interval in milliseconds */
  refreshInterval: number;
  /** Widget is shared with others */
  isShared: boolean;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

// ============================================================================
// Widget Template Definitions
// ============================================================================

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  /** Pre-configured data source */
  defaultDataSource: Partial<WidgetDataSource>;
  /** Pre-configured visualization */
  defaultVisualization: Partial<WidgetVisualization>;
  /** Allowed data source types */
  allowedDataSourceTypes?: DataSourceType[];
  /** Allowed visualization types */
  allowedVisualizationTypes?: VisualizationType[];
}

// ============================================================================
// Default Templates
// ============================================================================

export const defaultWidgetTemplates: WidgetTemplate[] = [
  {
    id: 'metric-card',
    name: 'Metric Card',
    description: 'Single value with optional trend indicator',
    category: 'metrics',
    icon: 'activity',
    defaultDataSource: { type: 'api' },
    defaultVisualization: {
      type: 'metric',
      fields: [
        { sourceField: 'value', displayName: 'Value', format: 'number' },
        { sourceField: 'trend', displayName: 'Trend', format: 'percent' }
      ]
    },
    allowedVisualizationTypes: ['metric', 'gauge', 'sparkline']
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    description: 'Compare values across categories',
    category: 'charts',
    icon: 'bar-chart-3',
    defaultDataSource: { type: 'ontology' },
    defaultVisualization: {
      type: 'chart',
      chartType: 'bar',
      showLegend: true,
      showGrid: true,
      animate: true
    },
    allowedVisualizationTypes: ['chart']
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    description: 'Show trends over time',
    category: 'charts',
    icon: 'trending-up',
    defaultDataSource: { type: 'ontology' },
    defaultVisualization: {
      type: 'chart',
      chartType: 'line',
      showLegend: true,
      showGrid: true,
      animate: true
    },
    allowedVisualizationTypes: ['chart']
  },
  {
    id: 'pie-chart',
    name: 'Pie/Donut Chart',
    description: 'Show proportions of a whole',
    category: 'charts',
    icon: 'pie-chart',
    defaultDataSource: { type: 'ontology' },
    defaultVisualization: {
      type: 'chart',
      chartType: 'pie',
      showLegend: true,
      animate: true
    },
    allowedVisualizationTypes: ['chart']
  },
  {
    id: 'data-table',
    name: 'Data Table',
    description: 'Tabular data display with sorting',
    category: 'tables',
    icon: 'table',
    defaultDataSource: { type: 'ontology' },
    defaultVisualization: {
      type: 'table',
      fields: []
    },
    allowedVisualizationTypes: ['table', 'list']
  },
  {
    id: 'progress-tracker',
    name: 'Progress Tracker',
    description: 'Show progress towards a goal',
    category: 'metrics',
    icon: 'loader',
    defaultDataSource: { type: 'api' },
    defaultVisualization: {
      type: 'progress',
      fields: [
        { sourceField: 'current', displayName: 'Current', format: 'number' },
        { sourceField: 'target', displayName: 'Target', format: 'number' }
      ],
      thresholds: [
        { value: 100, color: '#22c55e', operator: 'gte' },
        { value: 75, color: '#eab308', operator: 'gte' },
        { value: 0, color: '#ef4444', operator: 'gte' }
      ]
    },
    allowedVisualizationTypes: ['progress', 'gauge']
  }
];
