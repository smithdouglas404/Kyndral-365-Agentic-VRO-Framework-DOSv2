/**
 * WIDGET BUILDER
 *
 * Multi-step wizard for creating custom dashboard widgets.
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { DataSourceStep } from './steps/DataSourceStep';
import { VisualizationStep } from './steps/VisualizationStep';
import { PreviewStep } from './steps/PreviewStep';
import { useCreateUserWidget, type UserWidget } from '@/hooks/useAppConfig';

// Local type definitions matching the API
interface WidgetDataSource {
  type: 'ontology' | 'api' | 'agent';
  objectType?: string;
  endpoint?: string;
  agentId?: string;
  filters?: Array<{ field: string; operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in'; value: any }>;
  refreshInterval?: number;
}

interface WidgetVisualization {
  type: 'metric' | 'chart' | 'table' | 'list' | 'gauge';
  chartType?: 'bar' | 'line' | 'pie' | 'radar' | 'area';
  fields: Array<{ sourceField: string; displayName: string; format?: string; aggregation?: string }>;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  thresholds?: Array<{ value: number; color: string; label?: string }>;
}

interface WidgetConfig {
  id?: string;
  name: string;
  description?: string;
  dataSource: WidgetDataSource;
  visualization: WidgetVisualization;
  size: 'small' | 'medium' | 'large';
  refreshInterval: number;
  isShared: boolean;
}

interface WidgetBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (widget: WidgetConfig) => void;
}

const STEPS = [
  { id: 'data-source', title: 'Data Source', description: 'Select where your data comes from' },
  { id: 'visualization', title: 'Visualization', description: 'Choose how to display your data' },
  { id: 'preview', title: 'Preview & Save', description: 'Review and save your widget' },
];

export function WidgetBuilder({ open, onOpenChange, onSave }: WidgetBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [widgetName, setWidgetName] = useState('');
  const [widgetDescription, setWidgetDescription] = useState('');
  const [dataSource, setDataSource] = useState<Partial<WidgetDataSource>>({
    type: 'api',
  });
  const [visualization, setVisualization] = useState<Partial<WidgetVisualization>>({
    type: 'metric',
    fields: [],
  });
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');

  const createWidgetMutation = useCreateUserWidget();

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSave = useCallback(async () => {
    const widgetConfig: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: widgetName,
      description: widgetDescription,
      dataSource: dataSource as WidgetDataSource,
      visualization: visualization as WidgetVisualization,
      size,
      refreshInterval: dataSource.refreshInterval || 60000,
      isShared: false,
    };

    try {
      await createWidgetMutation.mutateAsync({
        name: widgetName,
        description: widgetDescription,
        dataSourceConfig: dataSource as WidgetDataSource,
        visualizationConfig: visualization as WidgetVisualization,
        size,
        refreshInterval: dataSource.refreshInterval || 60000,
        isShared: false,
      });

      onSave?.(widgetConfig as WidgetConfig);
      onOpenChange(false);

      // Reset form
      setCurrentStep(0);
      setWidgetName('');
      setWidgetDescription('');
      setDataSource({ type: 'api' });
      setVisualization({ type: 'metric', fields: [] });
      setSize('medium');
    } catch (error) {
      console.error('Failed to create widget:', error);
    }
  }, [
    widgetName,
    widgetDescription,
    dataSource,
    visualization,
    size,
    createWidgetMutation,
    onSave,
    onOpenChange,
  ]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset form on close
    setCurrentStep(0);
    setWidgetName('');
    setWidgetDescription('');
    setDataSource({ type: 'api' });
    setVisualization({ type: 'metric', fields: [] });
    setSize('medium');
  }, [onOpenChange]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return dataSource.type !== undefined;
      case 1:
        return visualization.type !== undefined;
      case 2:
        return widgetName.trim().length > 0;
      default:
        return true;
    }
  }, [currentStep, dataSource, visualization, widgetName]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl">Create Custom Widget</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].description}
          </DialogDescription>
          <Progress value={progress} className="h-2 mt-2" />
        </DialogHeader>

        <div className="flex-1 overflow-auto py-6">
          {currentStep === 0 && (
            <DataSourceStep
              dataSource={dataSource}
              onChange={setDataSource}
            />
          )}
          {currentStep === 1 && (
            <VisualizationStep
              visualization={visualization}
              onChange={setVisualization}
            />
          )}
          {currentStep === 2 && (
            <PreviewStep
              name={widgetName}
              description={widgetDescription}
              dataSource={dataSource}
              visualization={visualization}
              size={size}
              onNameChange={setWidgetName}
              onDescriptionChange={setWidgetDescription}
              onSizeChange={setSize}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!canProceed() || createWidgetMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {createWidgetMutation.isPending ? 'Creating...' : 'Create Widget'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { WidgetBuilder as default };
