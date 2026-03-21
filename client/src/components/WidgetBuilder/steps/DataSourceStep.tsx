/**
 * DATA SOURCE STEP
 *
 * Select and configure the data source for the widget.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Globe, Bot, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
type DataSourceType = 'ontology' | 'api' | 'agent';

interface WidgetDataSource {
  type: DataSourceType;
  objectType?: string;
  endpoint?: string;
  agentId?: string;
  refreshInterval?: number;
}

interface DataSourceStepProps {
  dataSource: Partial<WidgetDataSource>;
  onChange: (dataSource: Partial<WidgetDataSource>) => void;
}

const dataSourceTypes: { type: DataSourceType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'ontology',
    label: 'Palantir Ontology',
    description: 'Query objects from the Palantir Ontology',
    icon: <Layers className="h-6 w-6" />,
  },
  {
    type: 'api',
    label: 'API Endpoint',
    description: 'Fetch data from a REST API endpoint',
    icon: <Globe className="h-6 w-6" />,
  },
  {
    type: 'agent',
    label: 'AI Agent',
    description: 'Get data from an AI agent',
    icon: <Bot className="h-6 w-6" />,
  },
];

const ontologyObjectTypes = [
  { value: 'Project', label: 'Projects' },
  { value: 'Risk', label: 'Risks' },
  { value: 'Financial', label: 'Financials' },
  { value: 'Milestone', label: 'Milestones' },
  { value: 'Team', label: 'Teams' },
  { value: 'Feature', label: 'Features' },
  { value: 'Epic', label: 'Epics' },
];

const agentTypes = [
  { value: 'finops', label: 'FinOps Agent' },
  { value: 'pmo', label: 'PMO Agent' },
  { value: 'risk', label: 'Risk Agent' },
  { value: 'planning', label: 'Planning Agent' },
  { value: 'vro', label: 'VRO Agent' },
];

const refreshIntervals = [
  { value: 5000, label: '5 seconds' },
  { value: 15000, label: '15 seconds' },
  { value: 30000, label: '30 seconds' },
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
];

export function DataSourceStep({ dataSource, onChange }: DataSourceStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Data Source Type</h3>
        <div className="grid grid-cols-3 gap-4">
          {dataSourceTypes.map((source) => (
            <Card
              key={source.type}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                dataSource.type === source.type
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'hover:border-gray-300'
              )}
              onClick={() => onChange({ ...dataSource, type: source.type })}
            >
              <CardHeader className="pb-2">
                <div className={cn(
                  'p-2 rounded-lg w-fit',
                  dataSource.type === source.type ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                )}>
                  {source.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">{source.label}</CardTitle>
                <CardDescription className="text-xs mt-1">{source.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configuration based on selected type */}
      {dataSource.type && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Configure Data Source</h3>

          {dataSource.type === 'ontology' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Object Type</Label>
                <Select
                  value={dataSource.objectType || ''}
                  onValueChange={(value) => onChange({ ...dataSource, objectType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select object type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ontologyObjectTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {dataSource.type === 'api' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>API Endpoint</Label>
                <Input
                  value={dataSource.endpoint || ''}
                  onChange={(e) => onChange({ ...dataSource, endpoint: e.target.value })}
                  placeholder="/api/metrics/summary"
                />
                <p className="text-xs text-muted-foreground">
                  Relative path to the API endpoint (e.g., /api/projects)
                </p>
              </div>
            </div>
          )}

          {dataSource.type === 'agent' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select
                  value={dataSource.agentId || ''}
                  onValueChange={(value) => onChange({ ...dataSource, agentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTypes.map((agent) => (
                      <SelectItem key={agent.value} value={agent.value}>
                        {agent.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Refresh Interval (common to all types) */}
          <div className="space-y-2">
            <Label>Refresh Interval</Label>
            <Select
              value={String(dataSource.refreshInterval || 60000)}
              onValueChange={(value) => onChange({ ...dataSource, refreshInterval: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select refresh interval" />
              </SelectTrigger>
              <SelectContent>
                {refreshIntervals.map((interval) => (
                  <SelectItem key={interval.value} value={String(interval.value)}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
