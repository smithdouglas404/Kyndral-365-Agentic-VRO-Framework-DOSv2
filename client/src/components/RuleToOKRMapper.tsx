/**
 * RULE-TO-OKR MAPPER
 *
 * Links Camunda collaboration rules to agent OKRs and KPIs.
 * Shows which rules fire when OKR/KPI thresholds are breached.
 *
 * Flow: Agent OKR → Threshold → Camunda Rule → Trigger → Notification
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2,
  Zap,
  Target,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Save,
  ChevronRight,
  Activity,
  Bell,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface OKRRuleMapping {
  id: string;
  okrId: string;
  okrTitle: string;
  kpiMetric?: string;
  agent: string;
  threshold: number;
  thresholdOperator: '<' | '>' | '<=' | '>=' | '==';
  thresholdType: 'warning' | 'critical';
  camundaRuleId: string;
  ruleName: string;
  actions: string[];
  notificationTargets: {
    inApp: boolean;
    email?: string[];
    slack?: string[];
    teams?: string[];
  };
  isActive: boolean;
}

interface Props {
  agentId?: string;
  okrId?: string;
}

const AGENTS = [
  { id: 'governance', name: 'Governance', color: 'blue' },
  { id: 'risk', name: 'Risk', color: 'red' },
  { id: 'finops', name: 'FinOps', color: 'green' },
  { id: 'tmo', name: 'TMO', color: 'purple' },
  { id: 'vro', name: 'VRO', color: 'orange' },
  { id: 'planning', name: 'Planning', color: 'indigo' },
  { id: 'ocm', name: 'OCM', color: 'pink' },
  { id: 'pmo', name: 'PMO', color: 'teal' },
  { id: 'okr', name: 'OKR', color: 'yellow' },
];

const METRICS = [
  { value: 'cpi', label: 'CPI (Cost Performance Index)', unit: 'ratio' },
  { value: 'spi', label: 'SPI (Schedule Performance Index)', unit: 'ratio' },
  { value: 'risk_score', label: 'Risk Score', unit: 'score' },
  { value: 'compliance_violations', label: 'Compliance Violations', unit: 'count' },
  { value: 'benefits_realization', label: 'Benefits Realization', unit: 'percentage' },
  { value: 'stakeholder_satisfaction', label: 'Stakeholder Satisfaction', unit: 'percentage' },
  { value: 'change_adoption', label: 'Change Adoption Rate', unit: 'percentage' },
];

const COMMON_RULES = [
  {
    id: 'budget-overrun-critical',
    name: 'Critical Budget Overrun (CPI < 0.80)',
    agent: 'finops',
    metric: 'cpi',
    threshold: 0.80,
    targetAgents: ['tmo', 'risk', 'governance'],
  },
  {
    id: 'budget-overrun-warning',
    name: 'Budget Warning (CPI < 0.90)',
    agent: 'finops',
    metric: 'cpi',
    threshold: 0.90,
    targetAgents: ['tmo', 'vro'],
  },
  {
    id: 'high-risk',
    name: 'High Risk Detected (Score > 8)',
    agent: 'risk',
    metric: 'risk_score',
    threshold: 8,
    targetAgents: ['governance', 'tmo'],
  },
  {
    id: 'compliance-violation',
    name: 'Compliance Violations (Count >= 3)',
    agent: 'governance',
    metric: 'compliance_violations',
    threshold: 3,
    targetAgents: ['risk', 'finops', 'tmo'],
  },
  {
    id: 'value-leakage',
    name: 'Value Leakage (Benefits < 90%)',
    agent: 'vro',
    metric: 'benefits_realization',
    threshold: 0.90,
    targetAgents: ['tmo', 'finops'],
  },
];

export function RuleToOKRMapper({ agentId, okrId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [editingMapping, setEditingMapping] = useState<OKRRuleMapping | null>(null);

  // Form state
  const [mappingForm, setMappingForm] = useState<Partial<OKRRuleMapping>>({
    agent: agentId || 'finops',
    threshold: 0.90,
    thresholdOperator: '<',
    thresholdType: 'warning',
    actions: ['notify', 'email'],
    notificationTargets: {
      inApp: true,
      email: [],
      slack: [],
      teams: [],
    },
    isActive: true,
  });

  // Fetch OKR-Rule mappings
  const { data: mappingsData, isLoading } = useQuery({
    queryKey: ['okr-rule-mappings', agentId, okrId],
    queryFn: async () => {
      // Mock data - replace with actual API call
      const mockMappings: OKRRuleMapping[] = [
        {
          id: 'map-1',
          okrId: 'okr-finops-1',
          okrTitle: 'Maintain project profitability above 15%',
          kpiMetric: 'CPI',
          agent: 'finops',
          threshold: 0.85,
          thresholdOperator: '<',
          thresholdType: 'critical',
          camundaRuleId: 'budget-overrun-critical',
          ruleName: 'Critical Budget Overrun Collaboration',
          actions: ['notify', 'email', 'escalate'],
          notificationTargets: {
            inApp: true,
            email: ['cfo@company.com', 'project-leads@company.com'],
            slack: ['#finance-alerts'],
            teams: [],
          },
          isActive: true,
        },
        {
          id: 'map-2',
          okrId: 'okr-risk-1',
          okrTitle: 'Keep portfolio risk score below 7',
          kpiMetric: 'Risk Score',
          agent: 'risk',
          threshold: 8,
          thresholdOperator: '>',
          thresholdType: 'critical',
          camundaRuleId: 'high-risk',
          ruleName: 'High Risk Escalation',
          actions: ['escalate', 'email', 'attach_document'],
          notificationTargets: {
            inApp: true,
            email: ['risk-committee@company.com'],
            slack: ['#risk-alerts'],
            teams: [],
          },
          isActive: true,
        },
        {
          id: 'map-3',
          okrId: 'okr-vro-1',
          okrTitle: 'Achieve 95% benefits realization',
          kpiMetric: 'Benefits Realization',
          agent: 'vro',
          threshold: 0.90,
          thresholdOperator: '<',
          thresholdType: 'warning',
          camundaRuleId: 'value-leakage',
          ruleName: 'Value Leakage Intervention',
          actions: ['notify', 'create_task'],
          notificationTargets: {
            inApp: true,
            email: ['value-team@company.com'],
            slack: [],
            teams: [],
          },
          isActive: true,
        },
      ];

      // Filter by agent or OKR if specified
      let filtered = mockMappings;
      if (agentId) {
        filtered = filtered.filter((m) => m.agent === agentId);
      }
      if (okrId) {
        filtered = filtered.filter((m) => m.okrId === okrId);
      }

      return { mappings: filtered };
    },
  });

  const mappings = mappingsData?.mappings || [];

  const handleAddMapping = () => {
    setEditingMapping(null);
    setMappingForm({
      agent: agentId || 'finops',
      threshold: 0.90,
      thresholdOperator: '<',
      thresholdType: 'warning',
      actions: ['notify'],
      notificationTargets: {
        inApp: true,
        email: [],
        slack: [],
        teams: [],
      },
      isActive: true,
    });
    setShowMappingDialog(true);
  };

  const handleEditMapping = (mapping: OKRRuleMapping) => {
    setEditingMapping(mapping);
    setMappingForm(mapping);
    setShowMappingDialog(true);
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'inApp':
        return <Bell className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4" />;
      case 'teams':
        return <Activity className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const renderMappingDialog = () => (
    <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingMapping ? 'Edit' : 'Create'} OKR-to-Rule Mapping</DialogTitle>
          <DialogDescription>
            Link an OKR/KPI threshold to a Camunda collaboration rule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Selection */}
          <div>
            <Label>Agent *</Label>
            <Select
              value={mappingForm.agent}
              onValueChange={(value) => setMappingForm({ ...mappingForm, agent: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} Agent
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metric Selection */}
          <div>
            <Label>KPI Metric *</Label>
            <Select
              value={mappingForm.kpiMetric}
              onValueChange={(value) => setMappingForm({ ...mappingForm, kpiMetric: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a metric" />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Threshold Configuration */}
          <div>
            <Label>Threshold Condition *</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Select
                value={mappingForm.thresholdOperator}
                onValueChange={(value: any) =>
                  setMappingForm({ ...mappingForm, thresholdOperator: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<">Less Than (&lt;)</SelectItem>
                  <SelectItem value="<=">Less Than or Equal (&lt;=)</SelectItem>
                  <SelectItem value=">">Greater Than (&gt;)</SelectItem>
                  <SelectItem value=">=">Greater Than or Equal (&gt;=)</SelectItem>
                  <SelectItem value="==">Equal To (==)</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                step="0.01"
                value={mappingForm.threshold}
                onChange={(e) =>
                  setMappingForm({ ...mappingForm, threshold: parseFloat(e.target.value) })
                }
                placeholder="Threshold value"
              />

              <Select
                value={mappingForm.thresholdType}
                onValueChange={(value: any) =>
                  setMappingForm({ ...mappingForm, thresholdType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Example: "CPI &lt; 0.85" triggers critical alert
            </p>
          </div>

          {/* Camunda Rule Selection */}
          <div>
            <Label>Camunda Rule to Trigger *</Label>
            <Select
              value={mappingForm.camundaRuleId}
              onValueChange={(value) => {
                const rule = COMMON_RULES.find((r) => r.id === value);
                setMappingForm({
                  ...mappingForm,
                  camundaRuleId: value,
                  ruleName: rule?.name || '',
                });
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a rule" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_RULES.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Notifies: {rule.targetAgents.join(', ')}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notification Configuration */}
          <div>
            <Label>Notification Targets</Label>
            <div className="space-y-3 mt-2">
              {/* In-App */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mappingForm.notificationTargets?.inApp}
                  onChange={(e) =>
                    setMappingForm({
                      ...mappingForm,
                      notificationTargets: {
                        ...mappingForm.notificationTargets!,
                        inApp: e.target.checked,
                      },
                    })
                  }
                  className="cursor-pointer"
                />
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">In-App Notifications</span>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  <Label>Email Recipients (comma-separated)</Label>
                </div>
                <Textarea
                  value={mappingForm.notificationTargets?.email?.join(', ') || ''}
                  onChange={(e) =>
                    setMappingForm({
                      ...mappingForm,
                      notificationTargets: {
                        ...mappingForm.notificationTargets!,
                        email: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  placeholder="cfo@company.com, pm-leads@company.com"
                  rows={2}
                />
              </div>

              {/* Slack */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <Label>Slack Channels (comma-separated)</Label>
                </div>
                <Input
                  value={mappingForm.notificationTargets?.slack?.join(', ') || ''}
                  onChange={(e) =>
                    setMappingForm({
                      ...mappingForm,
                      notificationTargets: {
                        ...mappingForm.notificationTargets!,
                        slack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  placeholder="#finance-alerts, #risk-notifications"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast({
                title: 'Success',
                description: 'OKR-to-Rule mapping saved successfully!',
              });
              setShowMappingDialog(false);
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            OKR-to-Rule Mappings
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatic rule triggers based on OKR/KPI thresholds
          </p>
        </div>
        <Button onClick={handleAddMapping} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading mappings...</p>
          </CardContent>
        </Card>
      ) : mappings.length === 0 ? (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            No OKR-to-Rule mappings configured yet. Add a mapping to automatically trigger collaboration
            rules when KPI thresholds are breached.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {mappings.map((mapping) => (
            <Card key={mapping.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* OKR Title */}
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{mapping.okrTitle}</span>
                      <Badge variant="outline">{mapping.agent.toUpperCase()}</Badge>
                    </div>

                    {/* Threshold Flow */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Badge variant="secondary">{mapping.kpiMetric}</Badge>
                      <ChevronRight className="w-4 h-4" />
                      <Badge
                        variant={mapping.thresholdType === 'critical' ? 'destructive' : 'default'}
                      >
                        {mapping.thresholdOperator} {mapping.threshold}
                      </Badge>
                      <ChevronRight className="w-4 h-4" />
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium">{mapping.ruleName}</span>
                    </div>

                    {/* Actions & Notifications */}
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="font-medium">Actions:</span> {mapping.actions.join(', ')}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Notifications:</span>
                        {mapping.notificationTargets.inApp && renderNotificationIcon('inApp')}
                        {mapping.notificationTargets.email && mapping.notificationTargets.email.length > 0 && (
                          <div className="flex items-center gap-1">
                            {renderNotificationIcon('email')}
                            <span>({mapping.notificationTargets.email.length})</span>
                          </div>
                        )}
                        {mapping.notificationTargets.slack && mapping.notificationTargets.slack.length > 0 && (
                          <div className="flex items-center gap-1">
                            {renderNotificationIcon('slack')}
                            <span>({mapping.notificationTargets.slack.length})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditMapping(mapping)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {renderMappingDialog()}
    </div>
  );
}
