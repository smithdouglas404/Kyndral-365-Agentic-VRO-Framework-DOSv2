/**
 * WORKFLOW AUTOMATION BUILDER
 *
 * Create and manage multi-step workflows using Palantir Actions
 */

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Workflow,
  Play,
  Pause,
  Plus,
  Trash2,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  RefreshCw,
  ArrowRight,
  GitBranch,
  Timer,
  Bell,
  Shield,
  Layers,
  Eye,
  Copy,
  Edit,
} from "lucide-react";

interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    type: "event" | "schedule" | "manual" | "webhook";
    config: Record<string, any>;
  };
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: "action" | "condition" | "delay" | "notification" | "approval";
  config: Record<string, any>;
  onSuccess?: string;
  onFailure?: string;
}

interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  steps: Array<{
    stepId: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    output?: any;
    error?: string;
  }>;
}

const STEP_TYPES = [
  { value: "action", label: "Palantir Action", icon: Zap },
  { value: "condition", label: "Condition Check", icon: GitBranch },
  { value: "delay", label: "Wait/Delay", icon: Timer },
  { value: "notification", label: "Send Notification", icon: Bell },
  { value: "approval", label: "Request Approval", icon: Shield },
];

const TRIGGER_TYPES = [
  { value: "event", label: "On Event", description: "Trigger when ontology changes" },
  { value: "schedule", label: "Scheduled", description: "Run on a schedule" },
  { value: "manual", label: "Manual", description: "Trigger manually" },
  { value: "webhook", label: "Webhook", description: "External HTTP trigger" },
];

export default function WorkflowAutomation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("workflows");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDefinition | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    triggerType: "manual",
    triggerConfig: {},
  });
  const [newSteps, setNewSteps] = useState<WorkflowStep[]>([]);

  // Fetch workflows
  const { data: workflowsData, isLoading: loadingWorkflows } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const response = await fetch("/api/workflow-automation/workflows");
      if (!response.ok) throw new Error("Failed to fetch workflows");
      return response.json();
    },
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ["workflow-templates"],
    queryFn: async () => {
      const response = await fetch("/api/workflow-automation/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  // Fetch executions
  const { data: executionsData, isLoading: loadingExecutions } = useQuery({
    queryKey: ["workflow-executions"],
    queryFn: async () => {
      const response = await fetch("/api/workflow-automation/executions?limit=50");
      if (!response.ok) throw new Error("Failed to fetch executions");
      return response.json();
    },
    refetchInterval: 5000,
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (workflow: any) => {
      const response = await fetch("/api/workflow-automation/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      });
      if (!response.ok) throw new Error("Failed to create workflow");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Workflow Created" });
      setCreateDialogOpen(false);
      resetNewWorkflow();
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await fetch(`/api/workflow-automation/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to execute workflow");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Workflow Execution Started" });
      queryClient.invalidateQueries({ queryKey: ["workflow-executions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Execute Workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle workflow enabled mutation
  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, enabled }: { workflowId: string; enabled: boolean }) => {
      const response = await fetch(`/api/workflow-automation/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error("Failed to update workflow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await fetch(`/api/workflow-automation/workflows/${workflowId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete workflow");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Workflow Deleted" });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetNewWorkflow = () => {
    setNewWorkflow({
      name: "",
      description: "",
      triggerType: "manual",
      triggerConfig: {},
    });
    setNewSteps([]);
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: `Step ${newSteps.length + 1}`,
      type: "action",
      config: {},
    };
    setNewSteps([...newSteps, newStep]);
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const updated = [...newSteps];
    updated[index] = { ...updated[index], ...updates };
    setNewSteps(updated);
  };

  const removeStep = (index: number) => {
    setNewSteps(newSteps.filter((_, i) => i !== index));
  };

  const handleCreateWorkflow = () => {
    createWorkflowMutation.mutate({
      name: newWorkflow.name,
      description: newWorkflow.description,
      trigger: {
        type: newWorkflow.triggerType,
        config: newWorkflow.triggerConfig,
      },
      steps: newSteps,
    });
  };

  const useTemplate = (template: any) => {
    setNewWorkflow({
      name: template.name,
      description: template.description,
      triggerType: template.trigger.type,
      triggerConfig: template.trigger.config,
    });
    setNewSteps(template.steps);
    setCreateDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Zap className="h-4 w-4" />;
      case "schedule":
        return <Clock className="h-4 w-4" />;
      case "manual":
        return <Play className="h-4 w-4" />;
      case "webhook":
        return <ArrowRight className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Automation</h1>
          <p className="text-muted-foreground">
            Create and manage multi-step workflows using Palantir Actions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Executions
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          {loadingWorkflows ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading workflows...
              </CardContent>
            </Card>
          ) : workflowsData?.workflows?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Workflow className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Workflows Yet</p>
                <p className="text-muted-foreground mb-4">
                  Create your first workflow to automate tasks
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflowsData?.workflows?.map((workflow: WorkflowDefinition) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {workflow.name}
                          {!workflow.enabled && (
                            <Badge variant="outline" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={workflow.enabled}
                          onCheckedChange={(checked) =>
                            toggleWorkflowMutation.mutate({
                              workflowId: workflow.id,
                              enabled: checked,
                            })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeWorkflowMutation.mutate(workflow.id)}
                          disabled={!workflow.enabled || executeWorkflowMutation.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {getTriggerIcon(workflow.trigger.type)}
                        <span className="capitalize">{workflow.trigger.type}</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <span>{workflow.steps.length} steps</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>{workflow.executionCount} executions</span>
                      {workflow.lastExecutedAt && (
                        <>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-muted-foreground">
                            Last: {new Date(workflow.lastExecutedAt).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {workflow.steps.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {step.name}
                          </Badge>
                          {i < workflow.steps.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent workflow executions and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingExecutions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading...
                </div>
              ) : executionsData?.executions?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No executions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionsData?.executions?.map((execution: WorkflowExecution) => (
                      <TableRow key={execution.executionId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(execution.status)}
                            <Badge className={getStatusColor(execution.status)}>
                              {execution.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{execution.workflowId}</TableCell>
                        <TableCell>
                          {new Date(execution.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {execution.completedAt
                            ? `${Math.round(
                                (new Date(execution.completedAt).getTime() -
                                  new Date(execution.startedAt).getTime()) /
                                  1000
                              )}s`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedExecution(execution)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templatesData?.templates?.map((template: any) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    {getTriggerIcon(template.trigger.type)}
                    <span className="capitalize">{template.trigger.type} trigger</span>
                    <span>•</span>
                    <span>{template.steps.length} steps</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => useTemplate(template)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
            {(!templatesData?.templates || templatesData.templates.length === 0) && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No templates available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription>
              Define a multi-step automation workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={newWorkflow.name}
                  onChange={(e) =>
                    setNewWorkflow((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Budget Alert Handler"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newWorkflow.description}
                  onChange={(e) =>
                    setNewWorkflow((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe what this workflow does"
                />
              </div>
            </div>

            <Separator />

            {/* Trigger */}
            <div className="space-y-4">
              <Label>Trigger Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {TRIGGER_TYPES.map((trigger) => (
                  <Card
                    key={trigger.value}
                    className={`cursor-pointer transition-colors ${
                      newWorkflow.triggerType === trigger.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                    onClick={() =>
                      setNewWorkflow((prev) => ({ ...prev, triggerType: trigger.value }))
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(trigger.value)}
                        <div>
                          <p className="font-medium">{trigger.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {trigger.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Workflow Steps</Label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
              </div>

              {newSteps.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Layers className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No steps added yet. Add steps to define workflow actions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {newSteps.map((step, index) => (
                      <Card key={step.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={step.name}
                                onChange={(e) => updateStep(index, { name: e.target.value })}
                                placeholder="Step name"
                                className="flex-1"
                              />
                              <Select
                                value={step.type}
                                onValueChange={(value: any) => updateStep(index, { type: value })}
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STEP_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center gap-2">
                                        <type.icon className="h-4 w-4" />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeStep(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                            {step.type === "action" && (
                              <Input
                                placeholder="Action RID (e.g., ri.actions..action.update-project)"
                                value={step.config.actionRid || ""}
                                onChange={(e) =>
                                  updateStep(index, {
                                    config: { ...step.config, actionRid: e.target.value },
                                  })
                                }
                              />
                            )}
                            {step.type === "delay" && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Duration"
                                  value={step.config.duration || ""}
                                  onChange={(e) =>
                                    updateStep(index, {
                                      config: {
                                        ...step.config,
                                        duration: parseInt(e.target.value),
                                      },
                                    })
                                  }
                                  className="w-24"
                                />
                                <Select
                                  value={step.config.unit || "seconds"}
                                  onValueChange={(value) =>
                                    updateStep(index, {
                                      config: { ...step.config, unit: value },
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="seconds">Seconds</SelectItem>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                    <SelectItem value="hours">Hours</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {step.type === "notification" && (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Notification title"
                                  value={step.config.title || ""}
                                  onChange={(e) =>
                                    updateStep(index, {
                                      config: { ...step.config, title: e.target.value },
                                    })
                                  }
                                />
                                <Textarea
                                  placeholder="Notification message"
                                  value={step.config.message || ""}
                                  onChange={(e) =>
                                    updateStep(index, {
                                      config: { ...step.config, message: e.target.value },
                                    })
                                  }
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetNewWorkflow();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={
                !newWorkflow.name ||
                newSteps.length === 0 ||
                createWorkflowMutation.isPending
              }
            >
              {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Details Dialog */}
      <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Execution Details</DialogTitle>
            <DialogDescription>
              {selectedExecution?.workflowId}
            </DialogDescription>
          </DialogHeader>
          {selectedExecution && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusColor(selectedExecution.status)}>
                  {selectedExecution.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Started</span>
                <span>{new Date(selectedExecution.startedAt).toLocaleString()}</span>
              </div>
              {selectedExecution.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{new Date(selectedExecution.completedAt).toLocaleString()}</span>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Steps</h4>
                <div className="space-y-2">
                  {selectedExecution.steps.map((step, i) => (
                    <Card key={step.stepId} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Step {i + 1}</span>
                          <span className="text-xs text-muted-foreground">
                            {step.stepId}
                          </span>
                        </div>
                        <Badge
                          className={getStatusColor(step.status)}
                          variant="outline"
                        >
                          {step.status}
                        </Badge>
                      </div>
                      {step.error && (
                        <p className="text-xs text-red-500 mt-1">{step.error}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExecution(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
