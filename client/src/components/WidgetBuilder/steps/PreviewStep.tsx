/**
 * PREVIEW STEP
 *
 * Preview the widget and finalize configuration before saving.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Globe,
  Bot,
  Layers,
  Activity,
  BarChart3,
  Table,
  List,
  Gauge,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
interface WidgetDataSource {
  type?: 'ontology' | 'api' | 'agent';
  objectType?: string;
  endpoint?: string;
  agentId?: string;
  refreshInterval?: number;
}

interface WidgetVisualization {
  type?: 'metric' | 'chart' | 'table' | 'list' | 'gauge' | 'progress' | 'sparkline';
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'radar' | 'area';
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

interface PreviewStepProps {
  name: string;
  description: string;
  dataSource: Partial<WidgetDataSource>;
  visualization: Partial<WidgetVisualization>;
  size: 'small' | 'medium' | 'large';
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSizeChange: (size: 'small' | 'medium' | 'large') => void;
}

const sizeOptions = [
  { value: 'small', label: 'Small', description: '3 columns' },
  { value: 'medium', label: 'Medium', description: '6 columns' },
  { value: 'large', label: 'Large', description: '9 columns' },
] as const;

const dataSourceIcons = {
  ontology: <Layers className="h-4 w-4" />,
  api: <Globe className="h-4 w-4" />,
  agent: <Bot className="h-4 w-4" />,
};

const visualizationIcons = {
  metric: <Activity className="h-4 w-4" />,
  chart: <BarChart3 className="h-4 w-4" />,
  table: <Table className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  gauge: <Gauge className="h-4 w-4" />,
  progress: <TrendingUp className="h-4 w-4" />,
  sparkline: <TrendingUp className="h-4 w-4" />,
};

export function PreviewStep({
  name,
  description,
  dataSource,
  visualization,
  size,
  onNameChange,
  onDescriptionChange,
  onSizeChange,
}: PreviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Widget Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Widget Details</h3>

        <div className="space-y-2">
          <Label htmlFor="widget-name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="widget-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="My Custom Widget"
            className={cn(!name.trim() && 'border-red-300')}
          />
          {!name.trim() && (
            <p className="text-xs text-red-500">Widget name is required</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="widget-description">Description (optional)</Label>
          <Textarea
            id="widget-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe what this widget displays..."
            rows={2}
          />
        </div>
      </div>

      {/* Size Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Widget Size</h3>
        <div className="flex gap-3">
          {sizeOptions.map((option) => (
            <button
              key={option.value}
              className={cn(
                'flex-1 p-4 rounded-lg border text-center transition-all',
                size === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
              onClick={() => onSizeChange(option.value)}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configuration Summary</h3>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data Source */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {dataSource.type && dataSourceIcons[dataSource.type]}
                <span className="text-sm font-medium">Data Source</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {dataSource.type}
                </Badge>
                {dataSource.type === 'ontology' && dataSource.objectType && (
                  <Badge variant="secondary">{dataSource.objectType}</Badge>
                )}
                {dataSource.type === 'api' && dataSource.endpoint && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {dataSource.endpoint}
                  </Badge>
                )}
                {dataSource.type === 'agent' && dataSource.agentId && (
                  <Badge variant="secondary">{dataSource.agentId}</Badge>
                )}
              </div>
            </div>

            {/* Visualization */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {visualization.type && visualizationIcons[visualization.type]}
                <span className="text-sm font-medium">Visualization</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {visualization.type}
                </Badge>
                {visualization.chartType && (
                  <Badge variant="secondary" className="capitalize">
                    {visualization.chartType}
                  </Badge>
                )}
              </div>
            </div>

            {/* Refresh Interval */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Refresh Interval</span>
              </div>
              <Badge variant="outline">
                {((dataSource.refreshInterval || 60000) / 1000).toFixed(0)}s
              </Badge>
            </div>

            {/* Display Options */}
            {visualization.type === 'chart' && (
              <div className="flex flex-wrap gap-2">
                {visualization.showLegend && (
                  <Badge variant="secondary" className="text-xs">
                    Legend
                  </Badge>
                )}
                {visualization.showGrid && (
                  <Badge variant="secondary" className="text-xs">
                    Grid Lines
                  </Badge>
                )}
                {visualization.animate && (
                  <Badge variant="secondary" className="text-xs">
                    Animated
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
