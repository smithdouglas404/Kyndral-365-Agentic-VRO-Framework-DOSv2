/**
 * THRESHOLD SETTINGS
 *
 * Professional system-wide threshold configuration
 * - Financial thresholds (CPI, budget variance)
 * - Schedule thresholds (SPI, delay tolerance)
 * - Risk thresholds (risk scores, escalation)
 * - Quality thresholds (defect rates, test coverage)
 * - Resource thresholds (utilization, capacity)
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  DollarSign,
  Clock,
  Shield,
  CheckCircle2,
  TrendingUp,
  Users,
  AlertTriangle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ThresholdConfig {
  financial: {
    cpiWarning: number;
    cpiCritical: number;
    budgetVarianceWarning: number;
    budgetVarianceCritical: number;
    costOverrunLimit: number;
  };
  schedule: {
    spiWarning: number;
    spiCritical: number;
    delayToleranceDays: number;
    criticalPathBuffer: number;
  };
  risk: {
    riskScoreWarning: number;
    riskScoreCritical: number;
    escalationThreshold: number;
    mitigationDeadlineDays: number;
  };
  quality: {
    defectRateWarning: number;
    defectRateCritical: number;
    testCoverageMinimum: number;
    codeReviewThreshold: number;
  };
  resource: {
    utilizationWarning: number;
    utilizationCritical: number;
    capacityBufferPercent: number;
    skillGapThreshold: number;
  };
}

const defaultThresholds: ThresholdConfig = {
  financial: {
    cpiWarning: 0.9,
    cpiCritical: 0.8,
    budgetVarianceWarning: 10,
    budgetVarianceCritical: 20,
    costOverrunLimit: 25,
  },
  schedule: {
    spiWarning: 0.9,
    spiCritical: 0.8,
    delayToleranceDays: 7,
    criticalPathBuffer: 10,
  },
  risk: {
    riskScoreWarning: 70,
    riskScoreCritical: 85,
    escalationThreshold: 80,
    mitigationDeadlineDays: 14,
  },
  quality: {
    defectRateWarning: 5,
    defectRateCritical: 10,
    testCoverageMinimum: 80,
    codeReviewThreshold: 95,
  },
  resource: {
    utilizationWarning: 85,
    utilizationCritical: 95,
    capacityBufferPercent: 20,
    skillGapThreshold: 30,
  },
};

export default function ThresholdSettings() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(defaultThresholds);

  // Fetch current thresholds
  const { data, isLoading } = useQuery({
    queryKey: ['threshold-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/threshold-settings');
      if (!res.ok) throw new Error('Failed to fetch threshold settings');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.thresholds) {
        setThresholds(data.thresholds);
      }
    },
  });

  // Save thresholds mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ThresholdConfig) => {
      const res = await fetch('/api/admin/threshold-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save threshold settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threshold-settings'] });
      setHasChanges(false);
    },
  });

  const handleThresholdChange = (category: keyof ThresholdConfig, key: string, value: number) => {
    setThresholds((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(thresholds);
  };

  const handleReset = () => {
    setThresholds(defaultThresholds);
    setHasChanges(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold">Threshold Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Configure system-wide thresholds and alert levels for all projects
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Success Alert */}
        {saveMutation.isSuccess && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription>Threshold settings saved successfully!</AlertDescription>
          </Alert>
        )}

        {/* Changes Alert */}
        {hasChanges && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <AlertDescription>You have unsaved changes. Click Save Changes to apply them.</AlertDescription>
          </Alert>
        )}

        {/* Threshold Tabs */}
        <Tabs defaultValue="financial" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Clock className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2">
              <Shield className="w-4 h-4" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Quality
            </TabsTrigger>
            <TabsTrigger value="resource" className="gap-2">
              <Users className="w-4 h-4" />
              Resource
            </TabsTrigger>
          </TabsList>

          {/* Financial Thresholds */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Financial Performance Thresholds
                </CardTitle>
                <CardDescription>
                  Configure cost performance and budget variance alert levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ThresholdSlider
                  label="CPI Warning Threshold"
                  description="Cost Performance Index warning level (CPI below this triggers warning)"
                  value={thresholds.financial.cpiWarning}
                  onChange={(value) => handleThresholdChange('financial', 'cpiWarning', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                />

                <ThresholdSlider
                  label="CPI Critical Threshold"
                  description="Cost Performance Index critical level (CPI below this triggers critical alert)"
                  value={thresholds.financial.cpiCritical}
                  onChange={(value) => handleThresholdChange('financial', 'cpiCritical', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                />

                <ThresholdSlider
                  label="Budget Variance Warning (%)"
                  description="Budget variance percentage that triggers a warning"
                  value={thresholds.financial.budgetVarianceWarning}
                  onChange={(value) => handleThresholdChange('financial', 'budgetVarianceWarning', value)}
                  min={0}
                  max={50}
                  step={5}
                  format={(v) => `${v}%`}
                />

                <ThresholdSlider
                  label="Budget Variance Critical (%)"
                  description="Budget variance percentage that triggers critical alert"
                  value={thresholds.financial.budgetVarianceCritical}
                  onChange={(value) => handleThresholdChange('financial', 'budgetVarianceCritical', value)}
                  min={0}
                  max={50}
                  step={5}
                  format={(v) => `${v}%`}
                />

                <ThresholdSlider
                  label="Cost Overrun Limit (%)"
                  description="Maximum allowable cost overrun before escalation"
                  value={thresholds.financial.costOverrunLimit}
                  onChange={(value) => handleThresholdChange('financial', 'costOverrunLimit', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Thresholds */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Schedule Performance Thresholds
                </CardTitle>
                <CardDescription>
                  Configure timeline and delivery performance alert levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ThresholdSlider
                  label="SPI Warning Threshold"
                  description="Schedule Performance Index warning level"
                  value={thresholds.schedule.spiWarning}
                  onChange={(value) => handleThresholdChange('schedule', 'spiWarning', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                />

                <ThresholdSlider
                  label="SPI Critical Threshold"
                  description="Schedule Performance Index critical level"
                  value={thresholds.schedule.spiCritical}
                  onChange={(value) => handleThresholdChange('schedule', 'spiCritical', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                />

                <ThresholdSlider
                  label="Delay Tolerance (Days)"
                  description="Number of days of delay before triggering alert"
                  value={thresholds.schedule.delayToleranceDays}
                  onChange={(value) => handleThresholdChange('schedule', 'delayToleranceDays', value)}
                  min={0}
                  max={90}
                  step={1}
                  format={(v) => `${v} days`}
                />

                <ThresholdSlider
                  label="Critical Path Buffer (%)"
                  description="Percentage buffer for critical path activities"
                  value={thresholds.schedule.criticalPathBuffer}
                  onChange={(value) => handleThresholdChange('schedule', 'criticalPathBuffer', value)}
                  min={0}
                  max={50}
                  step={5}
                  format={(v) => `${v}%`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Thresholds */}
          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Risk Management Thresholds
                </CardTitle>
                <CardDescription>
                  Configure risk scoring and escalation alert levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ThresholdSlider
                  label="Risk Score Warning"
                  description="Risk score that triggers warning alerts"
                  value={thresholds.risk.riskScoreWarning}
                  onChange={(value) => handleThresholdChange('risk', 'riskScoreWarning', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}`}
                />

                <ThresholdSlider
                  label="Risk Score Critical"
                  description="Risk score that triggers critical alerts"
                  value={thresholds.risk.riskScoreCritical}
                  onChange={(value) => handleThresholdChange('risk', 'riskScoreCritical', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}`}
                />

                <ThresholdSlider
                  label="Escalation Threshold"
                  description="Risk score requiring executive escalation"
                  value={thresholds.risk.escalationThreshold}
                  onChange={(value) => handleThresholdChange('risk', 'escalationThreshold', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}`}
                />

                <ThresholdSlider
                  label="Mitigation Deadline (Days)"
                  description="Days allowed for risk mitigation before escalation"
                  value={thresholds.risk.mitigationDeadlineDays}
                  onChange={(value) => handleThresholdChange('risk', 'mitigationDeadlineDays', value)}
                  min={1}
                  max={90}
                  step={1}
                  format={(v) => `${v} days`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Thresholds */}
          <TabsContent value="quality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Quality Assurance Thresholds
                </CardTitle>
                <CardDescription>
                  Configure quality metrics and code review standards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ThresholdSlider
                  label="Defect Rate Warning (%)"
                  description="Defect rate percentage that triggers warning"
                  value={thresholds.quality.defectRateWarning}
                  onChange={(value) => handleThresholdChange('quality', 'defectRateWarning', value)}
                  min={0}
                  max={20}
                  step={1}
                  format={(v) => `${v}%`}
                />

                <ThresholdSlider
                  label="Defect Rate Critical (%)"
                  description="Defect rate percentage that triggers critical alert"
                  value={thresholds.quality.defectRateCritical}
                  onChange={(value) => handleThresholdChange('quality', 'defectRateCritical', value)}
                  min={0}
                  max={20}
                  step={1}
                  format={(v) => `${v}%`}
                />

                <ThresholdSlider
                  label="Test Coverage Minimum (%)"
                  description="Minimum required test coverage percentage"
                  value={thresholds.quality.testCoverageMinimum}
                  onChange={(value) => handleThresholdChange('quality', 'testCoverageMinimum', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                />

                <ThresholdSlider
                  label="Code Review Threshold (%)"
                  description="Minimum percentage of code requiring review"
                  value={thresholds.quality.codeReviewThreshold}
                  onChange={(value) => handleThresholdChange('quality', 'codeReviewThreshold', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resource Thresholds */}
          <TabsContent value="resource" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Resource Management Thresholds
                </CardTitle>
                <CardDescription>
                  Configure resource utilization and capacity alert levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ThresholdSlider
                  label="Utilization Warning (%)"
                  description="Resource utilization percentage that triggers warning"
                  value={thresholds.resource.utilizationWarning}
                  onChange={(value) => handleThresholdChange('resource', 'utilizationWarning', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                />

                <ThresholdSlider
                  label="Utilization Critical (%)"
                  description="Resource utilization percentage that triggers critical alert"
                  value={thresholds.resource.utilizationCritical}
                  onChange={(value) => handleThresholdChange('resource', 'utilizationCritical', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                />

                <ThresholdSlider
                  label="Capacity Buffer (%)"
                  description="Percentage buffer for resource capacity planning"
                  value={thresholds.resource.capacityBufferPercent}
                  onChange={(value) => handleThresholdChange('resource', 'capacityBufferPercent', value)}
                  min={0}
                  max={50}
                  step={5}
                  format={(v) => `${v}%`}
                />

                <ThresholdSlider
                  label="Skill Gap Threshold (%)"
                  description="Percentage of skill gap before training alert"
                  value={thresholds.resource.skillGapThreshold}
                  onChange={(value) => handleThresholdChange('resource', 'skillGapThreshold', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

interface ThresholdSliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
}

function ThresholdSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: ThresholdSliderProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <Badge variant="outline" className="ml-4">
          {format ? format(value) : value}
        </Badge>
      </div>

      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />

      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-24"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Min: {format ? format(min) : min}</span>
          <span>•</span>
          <span>Max: {format ? format(max) : max}</span>
        </div>
      </div>
    </div>
  );
}
