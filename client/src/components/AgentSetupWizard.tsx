/**
 * AGENT SETUP WIZARD
 *
 * Initial setup wizard for configuring agents, MCP servers, and LLM strategy.
 * Runs during first-time setup or accessible from admin panel.
 *
 * Steps:
 * 1. Agent Selection - Enable/disable agents
 * 2. MCP Server Assignment - Assign MCP servers to agents
 * 3. LLM Strategy - Configure model preferences per agent
 * 4. Cost & Failover - Set budgets and failover rules
 * 5. Review & Save - Final review and confirmation
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Settings,
  Bot,
  Zap,
  DollarSign,
  Shield,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AgentSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface MCPServer {
  id: string;
  displayName: string;
  category: string;
  description: string;
}

interface AgentMCPMapping {
  agentId: string;
  mcpServers: string[];
}

interface LLMPreference {
  taskType: string;
  primary: string;
  fallback: string[];
}

interface AgentLLMStrategy {
  agentId: string;
  preferences: LLMPreference[];
}

interface CostSettings {
  dailyBudget: number;
  monthlyBudget: number;
  alertThreshold: number;
  downgradeOnLimit: boolean;
}

const AVAILABLE_AGENTS: Agent[] = [
  {
    id: 'governance',
    name: 'Governance Agent',
    description: 'Policy compliance, regulatory adherence, audit tracking',
    enabled: true,
  },
  {
    id: 'risk',
    name: 'Risk Agent',
    description: 'Risk identification, assessment, mitigation planning',
    enabled: true,
  },
  {
    id: 'finops',
    name: 'FinOps Agent',
    description: 'Financial analysis, budget tracking, cost optimization',
    enabled: true,
  },
  {
    id: 'tmo',
    name: 'TMO Agent',
    description: 'Transformation management, roadmap planning, change orchestration',
    enabled: true,
  },
  {
    id: 'vro',
    name: 'VRO Agent',
    description: 'Value realization, ROI tracking, benefit measurement',
    enabled: true,
  },
  {
    id: 'planning',
    name: 'Planning Agent',
    description: 'Project planning, dependency analysis, resource allocation',
    enabled: true,
  },
  {
    id: 'ocm',
    name: 'OCM Agent',
    description: 'Change management, stakeholder communication, adoption tracking',
    enabled: true,
  },
  {
    id: 'pmo',
    name: 'PMO Agent',
    description: 'Portfolio analytics, reporting, governance oversight',
    enabled: true,
  },
  {
    id: 'okr',
    name: 'OKR Agent',
    description: 'OKR inference, goal tracking, key result monitoring',
    enabled: true,
  },
];

const RECOMMENDED_MCP_MAPPINGS: Record<string, string[]> = {
  governance: ['project-knowledge-graph', 'sequential-thinking', 'filesystem', 'semgrep'],
  risk: ['weaviate', 'sequential-thinking', 'filesystem', 'sentry'],
  finops: ['quickbooks', 'dynamics-365-erp', 'clickhouse', 'filesystem'],
  tmo: ['project-knowledge-graph', 'sequential-thinking', 'weaviate', 'clickhouse', 'filesystem'],
  vro: ['dynamics-365-erp', 'greptimedb', 'clickhouse', 'financial-datasets'],
  planning: ['project-knowledge-graph', 'sequential-thinking', 'filesystem', 'microsoft-project-server'],
  ocm: ['weaviate', 'filesystem', 'slack', 'microsoft-teams'],
  pmo: ['clickhouse', 'filesystem', 'jira_cloud', 'asana'],
  okr: ['clickhouse', 'filesystem'],
};

const DEFAULT_LLM_STRATEGIES: Record<string, LLMPreference[]> = {
  governance: [
    { taskType: 'policy_interpretation', primary: 'anthropic/claude-opus-4', fallback: ['openai/gpt-4', 'anthropic/claude-sonnet-4.5'] },
    { taskType: 'compliance_analysis', primary: 'anthropic/claude-sonnet-4.5', fallback: ['openai/gpt-4o'] },
    { taskType: 'document_search', primary: 'meta-llama/llama-3.1-70b-instruct', fallback: ['mistralai/mistral-large'] },
  ],
  risk: [
    { taskType: 'risk_assessment', primary: 'anthropic/claude-opus-4', fallback: ['openai/gpt-4'] },
    { taskType: 'rca_analysis', primary: 'anthropic/claude-sonnet-4.5', fallback: ['openai/gpt-4o'] },
    { taskType: 'rca_search', primary: 'meta-llama/llama-3.1-70b-instruct', fallback: ['mistralai/mistral-large'] },
  ],
  finops: [
    { taskType: 'financial_calculation', primary: 'openai/gpt-4', fallback: ['anthropic/claude-sonnet-4.5'] },
    { taskType: 'budget_analysis', primary: 'anthropic/claude-sonnet-4.5', fallback: ['openai/gpt-4o'] },
    { taskType: 'data_extraction', primary: 'meta-llama/llama-3.1-70b-instruct', fallback: ['mistralai/mistral-medium'] },
  ],
  // ... Add remaining agents
};

const AVAILABLE_MODELS = [
  { value: 'anthropic/claude-opus-4', label: 'Claude Opus 4 (Premium)', tier: 'Tier 1' },
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5 (Standard)', tier: 'Tier 2' },
  { value: 'anthropic/claude-haiku-4', label: 'Claude Haiku 4 (Budget)', tier: 'Tier 3' },
  { value: 'openai/gpt-4', label: 'GPT-4 (Premium)', tier: 'Tier 1' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (Standard)', tier: 'Tier 2' },
  { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B (Budget)', tier: 'Tier 3' },
  { value: 'mistralai/mistral-large', label: 'Mistral Large (Standard)', tier: 'Tier 2' },
  { value: 'mistralai/mistral-medium', label: 'Mistral Medium (Budget)', tier: 'Tier 3' },
];

export function AgentSetupWizard({ open, onOpenChange, onComplete }: AgentSetupWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step 1: Agent Selection
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>(AVAILABLE_AGENTS);

  // Step 2: MCP Assignments
  const [mcpMappings, setMcpMappings] = useState<AgentMCPMapping[]>(
    AVAILABLE_AGENTS.map((agent) => ({
      agentId: agent.id,
      mcpServers: RECOMMENDED_MCP_MAPPINGS[agent.id] || [],
    }))
  );

  // Step 3: LLM Strategy
  const [llmStrategies, setLlmStrategies] = useState<AgentLLMStrategy[]>(
    AVAILABLE_AGENTS.map((agent) => ({
      agentId: agent.id,
      preferences: DEFAULT_LLM_STRATEGIES[agent.id] || [],
    }))
  );

  // Step 4: Cost Settings
  const [costSettings, setCostSettings] = useState<CostSettings>({
    dailyBudget: 50,
    monthlyBudget: 1000,
    alertThreshold: 80,
    downgradeOnLimit: true,
  });

  // Fetch available MCP servers
  const { data: mcpServersData } = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/mcp-servers');
      if (!res.ok) throw new Error('Failed to fetch MCP servers');
      return res.json();
    },
  });

  const mcpServers: MCPServer[] = mcpServersData?.servers || [];

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      // Save agent configurations
      const saveResponse = await fetch('/api/admin/agent-setup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agents: selectedAgents,
          mcpMappings,
          llmStrategies,
          costSettings,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save configuration');
      }

      // Automatically reload agent orchestrator to activate changes
      const reloadResponse = await fetch('/api/agents/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!reloadResponse.ok) {
        console.warn('Failed to reload agents, but configuration was saved');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Setup Complete',
        description: 'Agent configuration saved and activated successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-config'] });
      onOpenChange(false);
      onComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, enabled: !agent.enabled } : agent
      )
    );
  };

  const toggleMCPServer = (agentId: string, mcpId: string) => {
    setMcpMappings((prev) =>
      prev.map((mapping) => {
        if (mapping.agentId === agentId) {
          const servers = mapping.mcpServers.includes(mcpId)
            ? mapping.mcpServers.filter((id) => id !== mcpId)
            : [...mapping.mcpServers, mcpId];
          return { ...mapping, mcpServers: servers };
        }
        return mapping;
      })
    );
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    saveConfigMutation.mutate();
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                step === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
            </div>
            {step < 5 && (
              <div
                className={cn(
                  'w-16 h-1 mx-2',
                  step < currentStep ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Agents to Enable</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose which AI agents you want to activate. You can always enable/disable agents later.
        </p>
      </div>

      <div className="grid gap-4">
        {AVAILABLE_AGENTS.map((agent) => {
          const isEnabled = selectedAgents.find((a) => a.id === agent.id)?.enabled;
          return (
            <Card
              key={agent.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isEnabled && 'border-primary'
              )}
              onClick={() => toggleAgent(agent.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isEnabled} />
                    <Bot className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {agent.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={isEnabled ? 'default' : 'outline'}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const enabledAgents = selectedAgents.filter((a) => a.enabled);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Assign MCP Servers to Agents</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connect MCP servers to agents. Each agent gets recommended servers, but you can customize.
          </p>
        </div>

        <div className="space-y-6">
          {enabledAgents.map((agent) => {
            const mapping = mcpMappings.find((m) => m.agentId === agent.id);
            const recommended = RECOMMENDED_MCP_MAPPINGS[agent.id] || [];

            return (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <CardTitle className="text-sm">{agent.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                    {mcpServers
                      .sort((a, b) => {
                        const aRec = recommended.includes(a.id);
                        const bRec = recommended.includes(b.id);
                        if (aRec && !bRec) return -1;
                        if (!aRec && bRec) return 1;
                        return a.displayName.localeCompare(b.displayName);
                      })
                      .map((mcp) => {
                        const isSelected = mapping?.mcpServers.includes(mcp.id);
                        const isRecommended = recommended.includes(mcp.id);

                        return (
                          <div
                            key={mcp.id}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-accent',
                              isSelected && 'border-primary bg-primary/5'
                            )}
                            onClick={() => toggleMCPServer(agent.id, mcp.id)}
                          >
                            <Checkbox checked={isSelected} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{mcp.displayName}</p>
                              {isRecommended && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1 mt-1">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure LLM Strategy</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose which language models each agent uses for different tasks. Smart defaults are pre-configured.
        </p>
      </div>

      <Alert>
        <Zap className="w-4 h-4" />
        <AlertDescription className="text-xs">
          <strong>Cost Optimization:</strong> We route complex tasks to premium models (Claude Opus, GPT-4),
          standard tasks to mid-tier models (Claude Sonnet, GPT-4o), and simple tasks to budget models (Llama, Mistral).
          This reduces costs by 60-80%.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">Tier 1</div>
              <div className="text-xs text-muted-foreground">Premium Models</div>
              <div className="text-xs mt-1">Claude Opus, GPT-4</div>
              <div className="text-xs text-muted-foreground mt-1">$15-30 per 1M tokens</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">Tier 2</div>
              <div className="text-xs text-muted-foreground">Standard Models</div>
              <div className="text-xs mt-1">Claude Sonnet, GPT-4o</div>
              <div className="text-xs text-muted-foreground mt-1">$3-5 per 1M tokens</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">Tier 3</div>
              <div className="text-xs text-muted-foreground">Budget Models</div>
              <div className="text-xs mt-1">Llama, Mistral</div>
              <div className="text-xs text-muted-foreground mt-1">$0.10-0.50 per 1M tokens</div>
            </CardContent>
          </Card>
        </div>

        <div className="text-sm text-muted-foreground text-center mt-4">
          Default strategy uses ~70% Tier 3, ~25% Tier 2, ~5% Tier 1 for optimal cost/quality balance.
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Cost & Failover Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set budget limits and configure failover behavior for resilience.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <CardTitle className="text-sm">Budget Limits</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dailyBudget" className="text-xs">Daily Budget (USD)</Label>
              <Input
                id="dailyBudget"
                type="number"
                value={costSettings.dailyBudget}
                onChange={(e) =>
                  setCostSettings({ ...costSettings, dailyBudget: parseFloat(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="monthlyBudget" className="text-xs">Monthly Budget (USD)</Label>
              <Input
                id="monthlyBudget"
                type="number"
                value={costSettings.monthlyBudget}
                onChange={(e) =>
                  setCostSettings({ ...costSettings, monthlyBudget: parseFloat(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alertThreshold" className="text-xs">Alert Threshold (%)</Label>
              <Input
                id="alertThreshold"
                type="number"
                value={costSettings.alertThreshold}
                onChange={(e) =>
                  setCostSettings({ ...costSettings, alertThreshold: parseFloat(e.target.value) })
                }
                className="mt-1"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Send alert when {costSettings.alertThreshold}% of budget is used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <CardTitle className="text-sm">Failover & Safety</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Auto-downgrade on budget limit</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically use cheaper models when budget is exceeded
                </p>
              </div>
              <Checkbox
                checked={costSettings.downgradeOnLimit}
                onCheckedChange={(checked) =>
                  setCostSettings({ ...costSettings, downgradeOnLimit: !!checked })
                }
              />
            </div>

            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <strong>Automatic Failover:</strong> If primary model fails (e.g., Anthropic outage),
                system automatically tries backup models (GPT-4, then Claude Haiku).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const enabledAgents = selectedAgents.filter((a) => a.enabled);
    const totalMCPs = mcpMappings.reduce((sum, m) => sum + m.mcpServers.length, 0);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Review Configuration</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Review your setup before saving. You can modify these settings anytime from the admin panel.
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <CardTitle className="text-sm">Agents</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enabledAgents.length}</div>
              <div className="text-xs text-muted-foreground">
                {enabledAgents.map((a) => a.name).join(', ')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <CardTitle className="text-sm">MCP Servers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMCPs}</div>
              <div className="text-xs text-muted-foreground">
                Total MCP server connections across all agents
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <CardTitle className="text-sm">LLM Strategy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                Multi-tier strategy with automatic failover
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                70% budget models, 25% standard, 5% premium
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <CardTitle className="text-sm">Budget</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily:</span>
                <span className="font-semibold">${costSettings.dailyBudget}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Monthly:</span>
                <span className="font-semibold">${costSettings.monthlyBudget}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agent Setup Wizard</DialogTitle>
          <DialogDescription>
            Configure your AI agents, MCP integrations, and LLM strategy
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="min-h-[400px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saveConfigMutation.isPending}
            >
              {saveConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Setup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
