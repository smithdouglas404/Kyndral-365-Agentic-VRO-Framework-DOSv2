/**
 * AGENT CONFIGURATION MODAL
 *
 * Professional modal for configuring agent-specific thresholds and settings
 * - Dynamic form based on agent type
 * - Sliders for threshold values
 * - Number inputs with validation
 * - Real-time preview of changes
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sliders, Info, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigField {
  key: string;
  label: string;
  type: 'number' | 'boolean';
  default: number | boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  configFields: ConfigField[];
}

interface AgentConfig {
  id: string;
  config: Record<string, any>;
}

interface AgentConfigModalProps {
  agent: AgentDefinition;
  config?: AgentConfig;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

export function AgentConfigModal({ agent, config, onClose, onSave }: AgentConfigModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data with current config or defaults
  useEffect(() => {
    const initialData: Record<string, any> = {};
    agent.configFields.forEach((field) => {
      initialData[field.key] = config?.config?.[field.key] ?? field.default;
    });
    setFormData(initialData);
  }, [agent, config]);

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleReset = () => {
    const resetData: Record<string, any> = {};
    agent.configFields.forEach((field) => {
      resetData[field.key] = field.default;
    });
    setFormData(resetData);
    setHasChanges(true);
  };

  const Icon = agent.icon;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('p-3 rounded-lg', agent.bgColor)}>
              <Icon className={cn('w-6 h-6', agent.color)} />
            </div>
            <div>
              <DialogTitle className="text-2xl">{agent.name} Configuration</DialogTitle>
              <DialogDescription>{agent.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Alert */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Configure thresholds and settings for this agent. Changes will take effect on the next scan cycle.
            </AlertDescription>
          </Alert>

          {/* Configuration Fields */}
          <div className="space-y-6">
            {agent.configFields.map((field) => (
              <div key={field.key} className="space-y-3">
                {field.type === 'number' && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{field.label}</Label>
                      <Badge variant="outline">
                        {typeof formData[field.key] === 'number'
                          ? formData[field.key].toFixed(field.step && field.step < 1 ? 2 : 0)
                          : formData[field.key]}
                      </Badge>
                    </div>

                    {/* Slider */}
                    {field.min !== undefined && field.max !== undefined && (
                      <Slider
                        value={[formData[field.key] ?? field.default]}
                        onValueChange={([value]) => handleFieldChange(field.key, value)}
                        min={field.min}
                        max={field.max}
                        step={field.step ?? 1}
                        className="w-full"
                      />
                    )}

                    {/* Number Input */}
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={formData[field.key] ?? field.default}
                        onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value))}
                        min={field.min}
                        max={field.max}
                        step={field.step ?? 1}
                        className="w-32"
                      />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {field.min !== undefined && <span>Min: {field.min}</span>}
                        {field.max !== undefined && <span>Max: {field.max}</span>}
                      </div>
                    </div>
                  </>
                )}

                {field.type === 'boolean' && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">{field.label}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData[field.key] ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <Switch
                      checked={formData[field.key] ?? field.default}
                      onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Example Impact */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Sliders className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong>Configuration Preview:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {agent.configFields.slice(0, 3).map((field) => (
                  <li key={field.key}>
                    {field.label}: <strong>{formData[field.key] ?? field.default}</strong>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
