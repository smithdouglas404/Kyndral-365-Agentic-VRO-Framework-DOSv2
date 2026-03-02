/**
 * PALANTIR RULES ENGINE UI
 *
 * Manage business rules as Palantir Functions
 * Replaces Rulebricks with native Palantir capabilities
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Settings,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Filter,
  RefreshCw,
  Code,
  TestTube,
  Gauge,
  Bot,
  Users,
} from "lucide-react";

interface PalantirFunction {
  rid: string;
  apiName: string;
  displayName: string;
  description?: string;
  parameters: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }>;
  returnType?: string;
  category?: string;
}

interface Threshold {
  thresholdId: string;
  name: string;
  category: string;
  agentId?: string;
  warningValue: number;
  criticalValue: number;
  operator: string;
  unit?: string;
  description?: string;
}

interface RuleExecution {
  executionId: string;
  functionId: string;
  agentId?: string;
  status: "success" | "error" | "timeout";
  executedAt: string;
  executionTime: number;
  result?: any;
  error?: string;
}

interface Agent {
  id: string;
  name: string;
  enabled: boolean;
  palantirObjectTypes?: string[];
}

interface AgentRule {
  id: string;
  name: string;
  sourceAgent: string;
  conditions: any[];
  actions: any[];
  enabled: boolean;
  priority: number;
}

export default function PalantirRulesEngine() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Parse URL search params
  const getAgentFromUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('agent') || "";
    }
    return "";
  };

  const [activeTab, setActiveTab] = useState(() => getAgentFromUrl() ? "agent-rules" : "functions");
  const [selectedAgent, setSelectedAgent] = useState<string>(getAgentFromUrl);
  const [selectedFunction, setSelectedFunction] = useState<PalantirFunction | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  // Update selected agent when URL changes
  useEffect(() => {
    const agentFromUrl = getAgentFromUrl();
    if (agentFromUrl && agentFromUrl !== selectedAgent) {
      setSelectedAgent(agentFromUrl);
      setActiveTab("agent-rules");
    }
  }, [location]);
  const [testParams, setTestParams] = useState<Record<string, any>>({});
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState({
    name: "",
    category: "",
    agentId: "",
    warningValue: 0,
    criticalValue: 0,
    operator: "gt",
    unit: "",
    description: "",
  });

  // Fetch agents
  const { data: agentsData } = useQuery({
    queryKey: ["agents-for-rules"],
    queryFn: async () => {
      const response = await fetch("/api/admin/agents");
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
  });

  // Fetch agent-specific rules
  const { data: agentRulesData, isLoading: loadingAgentRules } = useQuery({
    queryKey: ["agent-rules", selectedAgent],
    queryFn: async () => {
      if (!selectedAgent) return { rules: [] };
      const response = await fetch(`/api/rules/agent/${selectedAgent}`);
      if (!response.ok) throw new Error("Failed to fetch agent rules");
      return response.json();
    },
    enabled: !!selectedAgent,
  });

  // Fetch functions
  const { data: functionsData, isLoading: loadingFunctions } = useQuery({
    queryKey: ["palantir-functions"],
    queryFn: async () => {
      const response = await fetch("/api/palantir-rules/functions");
      if (!response.ok) throw new Error("Failed to fetch functions");
      return response.json();
    },
  });

  // Fetch thresholds
  const { data: thresholdsData, isLoading: loadingThresholds } = useQuery({
    queryKey: ["palantir-thresholds"],
    queryFn: async () => {
      const response = await fetch("/api/palantir-rules/thresholds");
      if (!response.ok) throw new Error("Failed to fetch thresholds");
      return response.json();
    },
  });

  // Fetch execution history
  const { data: executionsData, isLoading: loadingExecutions } = useQuery({
    queryKey: ["palantir-executions"],
    queryFn: async () => {
      const response = await fetch("/api/palantir-rules/executions?limit=50");
      if (!response.ok) throw new Error("Failed to fetch executions");
      return response.json();
    },
  });

  // Test function mutation
  const testFunctionMutation = useMutation({
    mutationFn: async ({ functionId, testData }: { functionId: string; testData: any }) => {
      const response = await fetch("/api/palantir-rules/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ functionId, testData }),
      });
      if (!response.ok) throw new Error("Test execution failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Completed",
        description: `Execution time: ${data.executionTime}ms`,
      });
      queryClient.invalidateQueries({ queryKey: ["palantir-executions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create threshold mutation
  const createThresholdMutation = useMutation({
    mutationFn: async (threshold: typeof newThreshold) => {
      const response = await fetch("/api/palantir-rules/thresholds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(threshold),
      });
      if (!response.ok) throw new Error("Failed to create threshold");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Threshold Created" });
      setThresholdDialogOpen(false);
      setNewThreshold({
        name: "",
        category: "",
        agentId: "",
        warningValue: 0,
        criticalValue: 0,
        operator: "gt",
        unit: "",
        description: "",
      });
      queryClient.invalidateQueries({ queryKey: ["palantir-thresholds"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Threshold",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestFunction = () => {
    if (!selectedFunction) return;
    testFunctionMutation.mutate({
      functionId: selectedFunction.apiName,
      testData: testParams,
    });
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      governance: "bg-purple-100 text-purple-800",
      financial: "bg-green-100 text-green-800",
      risk: "bg-red-100 text-red-800",
      schedule: "bg-blue-100 text-blue-800",
      resource: "bg-orange-100 text-orange-800",
      general: "bg-gray-100 text-gray-800",
    };
    return colors[category || "general"] || colors.general;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "timeout":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Palantir Rules Engine</h1>
          <p className="text-muted-foreground">
            Manage business rules as Palantir Functions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["palantir-functions"] });
            queryClient.invalidateQueries({ queryKey: ["palantir-thresholds"] });
            queryClient.invalidateQueries({ queryKey: ["palantir-executions"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agent-rules" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agent Rules
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Functions
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Agent Rules Tab */}
        <TabsContent value="agent-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rules by Agent</CardTitle>
              <CardDescription>
                Select an agent to view and manage its rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select
                  value={selectedAgent}
                  onValueChange={setSelectedAgent}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agentsData?.agents?.map((agent: Agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          {agent.name}
                          {!agent.enabled && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAgent && (
                  <Badge variant="secondary">
                    {agentRulesData?.rules?.length || 0} rules
                  </Badge>
                )}
              </div>

              {!selectedAgent ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Select an Agent</p>
                  <p className="text-muted-foreground">
                    Choose an agent to view its rules and configuration
                  </p>
                </div>
              ) : loadingAgentRules ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading rules...
                </div>
              ) : agentRulesData?.rules?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Rules Configured</p>
                  <p className="text-muted-foreground mb-4">
                    This agent has no rules yet
                  </p>
                  <Button variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Create First Rule
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Conditions</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentRulesData?.rules?.map((rule: AgentRule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rule.conditions?.length || 0} conditions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rule.actions?.slice(0, 2).map((action: any, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {action.type}
                              </Badge>
                            ))}
                            {rule.actions?.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{rule.actions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          {rule.enabled ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Functions Tab */}
        <TabsContent value="functions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingFunctions ? (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading functions...
                </CardContent>
              </Card>
            ) : functionsData?.functions?.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Code className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No Palantir Functions found</p>
                  <p className="text-sm text-muted-foreground">
                    Configure functions in Palantir Foundry
                  </p>
                </CardContent>
              </Card>
            ) : (
              functionsData?.functions?.map((func: PalantirFunction) => (
                <Card key={func.rid || func.apiName} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{func.displayName}</CardTitle>
                        <CardDescription className="text-xs font-mono">
                          {func.apiName}
                        </CardDescription>
                      </div>
                      <Badge className={getCategoryColor(func.category)}>
                        {func.category || "general"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {func.description && (
                      <p className="text-sm text-muted-foreground">{func.description}</p>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Parameters:</p>
                      <div className="flex flex-wrap gap-1">
                        {func.parameters?.length > 0 ? (
                          func.parameters.map((param) => (
                            <Badge key={param.name} variant="outline" className="text-xs">
                              {param.name}: {param.type}
                              {param.required && <span className="text-red-500">*</span>}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedFunction(func);
                        setTestParams({});
                        setTestDialogOpen(true);
                      }}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Function
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Thresholds Tab */}
        <TabsContent value="thresholds" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setThresholdDialogOpen(true)}>
              <Gauge className="h-4 w-4 mr-2" />
              Add Threshold
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>
                Configure warning and critical thresholds for metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingThresholds ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading thresholds...
                </div>
              ) : thresholdsData?.thresholds?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Gauge className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No thresholds configured</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Warning</TableHead>
                      <TableHead>Critical</TableHead>
                      <TableHead>Operator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {thresholdsData?.thresholds?.map((threshold: Threshold) => (
                      <TableRow key={threshold.thresholdId || threshold.name}>
                        <TableCell className="font-medium">{threshold.name}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(threshold.category)}>
                            {threshold.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{threshold.agentId || "-"}</TableCell>
                        <TableCell className="text-yellow-600">
                          {threshold.warningValue}
                          {threshold.unit}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {threshold.criticalValue}
                          {threshold.unit}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{threshold.operator}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Rule execution history and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingExecutions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading executions...
                </div>
              ) : executionsData?.executions?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No execution history</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Function</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Execution Time</TableHead>
                      <TableHead>Executed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionsData?.executions?.map((execution: RuleExecution) => (
                      <TableRow key={execution.executionId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(execution.status)}
                            <span className="capitalize">{execution.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {execution.functionId}
                        </TableCell>
                        <TableCell>{execution.agentId || "-"}</TableCell>
                        <TableCell>{execution.executionTime}ms</TableCell>
                        <TableCell>
                          {new Date(execution.executedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Function Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Test Function: {selectedFunction?.displayName}</DialogTitle>
            <DialogDescription>
              Enter test parameters and execute the function
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFunction?.parameters?.map((param) => (
              <div key={param.name} className="space-y-2">
                <Label htmlFor={param.name}>
                  {param.name}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {param.description && (
                  <p className="text-xs text-muted-foreground">{param.description}</p>
                )}
                <Input
                  id={param.name}
                  placeholder={`Enter ${param.type}`}
                  value={testParams[param.name] || ""}
                  onChange={(e) =>
                    setTestParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                  }
                />
              </div>
            ))}
            {(!selectedFunction?.parameters || selectedFunction.parameters.length === 0) && (
              <div className="space-y-2">
                <Label>Custom JSON Input</Label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={JSON.stringify(testParams, null, 2)}
                  onChange={(e) => {
                    try {
                      setTestParams(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono text-sm"
                  rows={5}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTestFunction}
              disabled={testFunctionMutation.isPending}
            >
              {testFunctionMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Threshold Dialog */}
      <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Threshold</DialogTitle>
            <DialogDescription>
              Configure a new alert threshold
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="threshold-name">Name</Label>
              <Input
                id="threshold-name"
                value={newThreshold.name}
                onChange={(e) => setNewThreshold((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Budget Overrun"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="threshold-category">Category</Label>
                <Select
                  value={newThreshold.category}
                  onValueChange={(value) =>
                    setNewThreshold((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="threshold-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="governance">Governance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold-operator">Operator</Label>
                <Select
                  value={newThreshold.operator}
                  onValueChange={(value) =>
                    setNewThreshold((prev) => ({ ...prev, operator: value }))
                  }
                >
                  <SelectTrigger id="threshold-operator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                    <SelectItem value="gte">Greater or equal (&gt;=)</SelectItem>
                    <SelectItem value="lt">Less than (&lt;)</SelectItem>
                    <SelectItem value="lte">Less or equal (&lt;=)</SelectItem>
                    <SelectItem value="eq">Equal (=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="threshold-warning">Warning Value</Label>
                <Input
                  id="threshold-warning"
                  type="number"
                  value={newThreshold.warningValue}
                  onChange={(e) =>
                    setNewThreshold((prev) => ({
                      ...prev,
                      warningValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold-critical">Critical Value</Label>
                <Input
                  id="threshold-critical"
                  type="number"
                  value={newThreshold.criticalValue}
                  onChange={(e) =>
                    setNewThreshold((prev) => ({
                      ...prev,
                      criticalValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold-unit">Unit (optional)</Label>
              <Input
                id="threshold-unit"
                value={newThreshold.unit}
                onChange={(e) => setNewThreshold((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., %, days, $"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold-description">Description</Label>
              <Textarea
                id="threshold-description"
                value={newThreshold.description}
                onChange={(e) =>
                  setNewThreshold((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe when this threshold should trigger"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThresholdDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createThresholdMutation.mutate(newThreshold)}
              disabled={createThresholdMutation.isPending || !newThreshold.name}
            >
              {createThresholdMutation.isPending ? "Creating..." : "Create Threshold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
