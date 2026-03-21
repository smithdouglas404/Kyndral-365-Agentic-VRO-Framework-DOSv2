/**
 * VISUALIZATION STEP
 *
 * Select and configure the visualization type for the widget.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Table,
  List,
  Gauge,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
type VisualizationType = 'metric' | 'chart' | 'table' | 'list' | 'gauge' | 'progress' | 'sparkline';
type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'radar' | 'area';

interface WidgetVisualization {
  type: VisualizationType;
  chartType?: ChartType;
  fields?: Array<{ sourceField: string; displayName: string; format?: string; aggregation?: string }>;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

interface VisualizationStepProps {
  visualization: Partial<WidgetVisualization>;
  onChange: (visualization: Partial<WidgetVisualization>) => void;
}

const visualizationTypes: {
  type: VisualizationType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'metric',
    label: 'Metric Card',
    description: 'Single value with trend indicator',
    icon: <Activity className="h-6 w-6" />,
  },
  {
    type: 'chart',
    label: 'Chart',
    description: 'Bar, line, pie, or area chart',
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    type: 'table',
    label: 'Data Table',
    description: 'Tabular data with sorting',
    icon: <Table className="h-6 w-6" />,
  },
  {
    type: 'list',
    label: 'List View',
    description: 'Simple list of items',
    icon: <List className="h-6 w-6" />,
  },
  {
    type: 'gauge',
    label: 'Gauge',
    description: 'Circular progress indicator',
    icon: <Gauge className="h-6 w-6" />,
  },
  {
    type: 'progress',
    label: 'Progress Bar',
    description: 'Linear progress indicator',
    icon: <TrendingUp className="h-6 w-6" />,
  },
];

const chartTypes: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Bar Chart', icon: <BarChart3 className="h-5 w-5" /> },
  { type: 'line', label: 'Line Chart', icon: <LineChart className="h-5 w-5" /> },
  { type: 'pie', label: 'Pie Chart', icon: <PieChart className="h-5 w-5" /> },
  { type: 'donut', label: 'Donut Chart', icon: <PieChart className="h-5 w-5" /> },
  { type: 'area', label: 'Area Chart', icon: <TrendingUp className="h-5 w-5" /> },
];

export function VisualizationStep({ visualization, onChange }: VisualizationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Visualization Type</h3>
        <div className="grid grid-cols-3 gap-4">
          {visualizationTypes.map((viz) => (
            <Card
              key={viz.type}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                visualization.type === viz.type
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'hover:border-gray-300'
              )}
              onClick={() => onChange({ ...visualization, type: viz.type })}
            >
              <CardHeader className="pb-2">
                <div
                  className={cn(
                    'p-2 rounded-lg w-fit',
                    visualization.type === viz.type
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {viz.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">{viz.label}</CardTitle>
                <CardDescription className="text-xs mt-1">{viz.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chart type selection */}
      {visualization.type === 'chart' && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Select Chart Type</h3>
          <div className="flex flex-wrap gap-3">
            {chartTypes.map((chart) => (
              <button
                key={chart.type}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                  visualization.chartType === chart.type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
                onClick={() => onChange({ ...visualization, chartType: chart.type })}
              >
                {chart.icon}
                <span className="text-sm font-medium">{chart.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Display options */}
      {visualization.type && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Display Options</h3>

          <div className="space-y-4">
            {(visualization.type === 'chart' || visualization.type === 'table') && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Legend</Label>
                  <p className="text-xs text-muted-foreground">Display a legend for data series</p>
                </div>
                <Switch
                  checked={visualization.showLegend ?? true}
                  onCheckedChange={(checked) =>
                    onChange({ ...visualization, showLegend: checked })
                  }
                />
              </div>
            )}

            {visualization.type === 'chart' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Grid Lines</Label>
                    <p className="text-xs text-muted-foreground">Display grid lines on chart</p>
                  </div>
                  <Switch
                    checked={visualization.showGrid ?? true}
                    onCheckedChange={(checked) =>
                      onChange({ ...visualization, showGrid: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Animation</Label>
                    <p className="text-xs text-muted-foreground">Animate chart transitions</p>
                  </div>
                  <Switch
                    checked={visualization.animate ?? true}
                    onCheckedChange={(checked) =>
                      onChange({ ...visualization, animate: checked })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
