/**
 * THRESHOLD SETTINGS
 *
 * Professional system-wide threshold configuration
 * Now integrated with Rulebricks Dynamic Values for centralized management
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  DollarSign,
  Clock,
  Shield,
  CheckCircle2,
  Users,
  AlertTriangle,
  Save,
  RotateCcw,
  Cloud,
  CloudOff,
  RefreshCw,
  Upload,
  Download,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

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
  const [useRulebricks, setUseRulebricks] = useState(true);

  // Check Rulebricks status
  const { data: rulebricksStatus } = useQuery({
    queryKey: ['/api/rulebricks/status'],
  });

  // Fetch dashboard URL
  const { data: dashboardData } = useQuery<{ success: boolean; url: string }>({
    queryKey: ['/api/rulebricks/dashboard-url'],
  });

  // Fetch thresholds from Rulebricks
  const { data: rulebricksThresholds, isLoading: loadingRulebricks, refetch: refetchRulebricks } = useQuery({
    queryKey: ['/api/rulebricks/thresholds'],
    enabled: useRulebricks && rulebricksStatus?.configured,
  });

  // Fetch local thresholds
  const { data: localData, isLoading: loadingLocal } = useQuery({
    queryKey: ['threshold-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/threshold-settings');
      if (!res.ok) throw new Error('Failed to fetch threshold settings');
      return res.json();
    },
  });

  // Merge Rulebricks thresholds with defaults
  useEffect(() => {
    if (useRulebricks && rulebricksThresholds?.thresholds) {
      const rb = rulebricksThresholds.thresholds;
      setThresholds({
        financial: { ...defaultThresholds.financial, ...rb.financial },
        schedule: { ...defaultThresholds.schedule, ...rb.schedule },
        risk: { ...defaultThresholds.risk, ...rb.risk },
        quality: { ...defaultThresholds.quality, ...rb.quality },
        resource: { ...defaultThresholds.resource, ...rb.resource },
      });
    } else if (localData?.thresholds) {
      setThresholds(localData.thresholds);
    }
  }, [useRulebricks, rulebricksThresholds, localData]);

  // Save local thresholds mutation
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

  // Sync to Rulebricks mutation
  const syncToRulebricksMutation = useMutation({
    mutationFn: async (data: ThresholdConfig) => {
      const response = await apiRequest('POST', '/api/rulebricks/thresholds/sync', { thresholds: data });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rulebricks/thresholds'] });
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

  const handleSave = async () => {
    if (useRulebricks && rulebricksStatus?.configured) {
      syncToRulebricksMutation.mutate(thresholds);
    }
    saveMutation.mutate(thresholds);
  };

  const handlePullFromRulebricks = () => {
    refetchRulebricks();
  };

  const handlePushToRulebricks = () => {
    syncToRulebricksMutation.mutate(thresholds);
  };

  const handleReset = () => {
    setThresholds(defaultThresholds);
    setHasChanges(true);
  };

  const openRulebricksDashboard = () => {
    if (dashboardData?.url) {
      window.open(`${dashboardData.url}/values`, '_blank');
    }
  };

  const isLoading = loadingLocal || (useRulebricks && loadingRulebricks);
  const isSaving = saveMutation.isPending || syncToRulebricksMutation.isPending;

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
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Rulebricks Integration Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Rulebricks Integration</CardTitle>
                  <CardDescription>
                    Sync thresholds with Rulebricks Dynamic Values for centralized management
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {rulebricksStatus?.configured ? (
                  <Badge variant="default" className="gap-1">
                    <Cloud className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <CloudOff className="w-3 h-3" />
                    Not Configured
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <Label htmlFor="use-rulebricks" className="text-sm">
                    Use Rulebricks
                  </Label>
                  <Switch
                    id="use-rulebricks"
                    checked={useRulebricks}
                    onCheckedChange={setUseRulebricks}
                    disabled={!rulebricksStatus?.configured}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          {rulebricksStatus?.configured && useRulebricks && (
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePullFromRulebricks}
                  disabled={loadingRulebricks}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Pull from Rulebricks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePushToRulebricks}
                  disabled={syncToRulebricksMutation.isPending}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Push to Rulebricks
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openRulebricksDashboard}
                  className="gap-2 ml-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Rulebricks Dashboard
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Success Alert */}
        {(saveMutation.isSuccess || syncToRulebricksMutation.isSuccess) && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription>
              Threshold settings saved successfully!
              {syncToRulebricksMutation.isSuccess && ' Synced to Rulebricks.'}
            </AlertDescription>
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
                  rulebricksKey="threshold_financial_cpiWarning"
                  value={thresholds.financial.cpiWarning}
                  onChange={(value) => handleThresholdChange('financial', 'cpiWarning', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="CPI Critical Threshold"
                  description="Cost Performance Index critical level (CPI below this triggers critical alert)"
                  rulebricksKey="threshold_financial_cpiCritical"
                  value={thresholds.financial.cpiCritical}
                  onChange={(value) => handleThresholdChange('financial', 'cpiCritical', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Budget Variance Warning (%)"
                  description="Budget variance percentage that triggers a warning"
                  rulebricksKey="threshold_financial_budgetVarianceWarning"
                  value={thresholds.financial.budgetVarianceWarning}
                  onChange={(value) => handleThresholdChange('financial', 'budgetVarianceWarning', value)}
                  min={0}
                  max={50}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Budget Variance Critical (%)"
                  description="Budget variance percentage that triggers critical alert"
                  rulebricksKey="threshold_financial_budgetVarianceCritical"
                  value={thresholds.financial.budgetVarianceCritical}
                  onChange={(value) => handleThresholdChange('financial', 'budgetVarianceCritical', value)}
                  min={0}
                  max={50}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Cost Overrun Limit (%)"
                  description="Maximum allowable cost overrun before escalation"
                  rulebricksKey="threshold_financial_costOverrunLimit"
                  value={thresholds.financial.costOverrunLimit}
                  onChange={(value) => handleThresholdChange('financial', 'costOverrunLimit', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
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
                  rulebricksKey="threshold_schedule_spiWarning"
                  value={thresholds.schedule.spiWarning}
                  onChange={(value) => handleThresholdChange('schedule', 'spiWarning', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="SPI Critical Threshold"
                  description="Schedule Performance Index critical level"
                  rulebricksKey="threshold_schedule_spiCritical"
                  value={thresholds.schedule.spiCritical}
                  onChange={(value) => handleThresholdChange('schedule', 'spiCritical', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => v.toFixed(2)}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Delay Tolerance (Days)"
                  description="Number of days of delay before triggering alert"
                  rulebricksKey="threshold_schedule_delayToleranceDays"
                  value={thresholds.schedule.delayToleranceDays}
                  onChange={(value) => handleThresholdChange('schedule', 'delayToleranceDays', value)}
                  min={0}
                  max={90}
                  step={1}
                  format={(v) => `${v} days`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Critical Path Buffer (%)"
                  description="Percentage buffer for critical path activities"
                  rulebricksKey="threshold_schedule_criticalPathBuffer"
                  value={thresholds.schedule.criticalPathBuffer}
                  onChange={(value) => handleThresholdChange('schedule', 'criticalPathBuffer', value)}
                  min={0}
                  max={50}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
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
                  rulebricksKey="threshold_risk_riskScoreWarning"
                  value={thresholds.risk.riskScoreWarning}
                  onChange={(value) => handleThresholdChange('risk', 'riskScoreWarning', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Risk Score Critical"
                  description="Risk score that triggers critical alerts"
                  rulebricksKey="threshold_risk_riskScoreCritical"
                  value={thresholds.risk.riskScoreCritical}
                  onChange={(value) => handleThresholdChange('risk', 'riskScoreCritical', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Escalation Threshold"
                  description="Risk score requiring executive escalation"
                  rulebricksKey="threshold_risk_escalationThreshold"
                  value={thresholds.risk.escalationThreshold}
                  onChange={(value) => handleThresholdChange('risk', 'escalationThreshold', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Mitigation Deadline (Days)"
                  description="Days allowed for risk mitigation before escalation"
                  rulebricksKey="threshold_risk_mitigationDeadlineDays"
                  value={thresholds.risk.mitigationDeadlineDays}
                  onChange={(value) => handleThresholdChange('risk', 'mitigationDeadlineDays', value)}
                  min={1}
                  max={90}
                  step={1}
                  format={(v) => `${v} days`}
                  useRulebricks={useRulebricks}
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
                  rulebricksKey="threshold_quality_defectRateWarning"
                  value={thresholds.quality.defectRateWarning}
                  onChange={(value) => handleThresholdChange('quality', 'defectRateWarning', value)}
                  min={0}
                  max={20}
                  step={1}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Defect Rate Critical (%)"
                  description="Defect rate percentage that triggers critical alert"
                  rulebricksKey="threshold_quality_defectRateCritical"
                  value={thresholds.quality.defectRateCritical}
                  onChange={(value) => handleThresholdChange('quality', 'defectRateCritical', value)}
                  min={0}
                  max={20}
                  step={1}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Test Coverage Minimum (%)"
                  description="Minimum required test coverage percentage"
                  rulebricksKey="threshold_quality_testCoverageMinimum"
                  value={thresholds.quality.testCoverageMinimum}
                  onChange={(value) => handleThresholdChange('quality', 'testCoverageMinimum', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Code Review Threshold (%)"
                  description="Minimum percentage of code requiring review"
                  rulebricksKey="threshold_quality_codeReviewThreshold"
                  value={thresholds.quality.codeReviewThreshold}
                  onChange={(value) => handleThresholdChange('quality', 'codeReviewThreshold', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
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
                  rulebricksKey="threshold_resource_utilizationWarning"
                  value={thresholds.resource.utilizationWarning}
                  onChange={(value) => handleThresholdChange('resource', 'utilizationWarning', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Utilization Critical (%)"
                  description="Resource utilization percentage that triggers critical alert"
                  rulebricksKey="threshold_resource_utilizationCritical"
                  value={thresholds.resource.utilizationCritical}
                  onChange={(value) => handleThresholdChange('resource', 'utilizationCritical', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Capacity Buffer (%)"
                  description="Percentage buffer for resource capacity planning"
                  rulebricksKey="threshold_resource_capacityBufferPercent"
                  value={thresholds.resource.capacityBufferPercent}
                  onChange={(value) => handleThresholdChange('resource', 'capacityBufferPercent', value)}
                  min={0}
                  max={50}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
                />

                <ThresholdSlider
                  label="Skill Gap Threshold (%)"
                  description="Percentage of skill gap before training alert"
                  rulebricksKey="threshold_resource_skillGapThreshold"
                  value={thresholds.resource.skillGapThreshold}
                  onChange={(value) => handleThresholdChange('resource', 'skillGapThreshold', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(v) => `${v}%`}
                  useRulebricks={useRulebricks}
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
  rulebricksKey: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  useRulebricks?: boolean;
}

function ThresholdSlider({
  label,
  description,
  rulebricksKey,
  value,
  onChange,
  min,
  max,
  step,
  format,
  useRulebricks,
}: ThresholdSliderProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            {useRulebricks && (
              <Badge variant="outline" className="text-xs gap-1">
                <Cloud className="w-3 h-3" />
                {rulebricksKey}
              </Badge>
            )}
          </div>
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
          <span>-</span>
          <span>Max: {format ? format(max) : max}</span>
        </div>
      </div>
    </div>
  );
}
