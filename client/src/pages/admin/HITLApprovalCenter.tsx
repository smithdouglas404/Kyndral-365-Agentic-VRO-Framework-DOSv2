/**
 * HITL (Human-in-the-Loop) Approval Center
 *
 * UI for reviewing and approving/rejecting agent interventions
 * Data comes from Palantir Foundry via /api/hitl endpoints
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  Clock,
  Bot,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Bell,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ApprovalQueue, SourceBadge } from "@/openproject";

interface Intervention {
  interventionId: string;
  title: string;
  description: string;
  interventionType: string;
  severity: "critical" | "high" | "medium" | "low";
  agentSource: string;
  projectId?: string;
  recommendation: string;
  estimatedImpact?: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface Alert {
  alertId: string;
  title: string;
  message: string;
  alertType: string;
  severity: "critical" | "high" | "medium" | "low";
  agentSource: string;
  projectId?: string;
  status: string;
  actionRequired: boolean;
  createdAt: string;
}

const severityColors = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white",
};

const severityBorders = {
  critical: "border-l-4 border-red-500",
  high: "border-l-4 border-orange-500",
  medium: "border-l-4 border-yellow-500",
  low: "border-l-4 border-blue-500",
};

export default function HITLApprovalCenter() {
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "escalate" | null>(null);
  const [notes, setNotes] = useState("");
  const [escalateTo, setEscalateTo] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch HITL summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["hitl-summary"],
    queryFn: async () => {
      const res = await fetch("/api/hitl/summary");
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Fetch pending interventions
  const { data: interventions, isLoading: interventionsLoading } = useQuery({
    queryKey: ["hitl-interventions", severityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter !== "all") params.append("severity", severityFilter);
      const res = await fetch(`/api/hitl/interventions/pending?${params}`);
      if (!res.ok) throw new Error("Failed to fetch interventions");
      return res.json();
    },
    refetchInterval: 15000,
  });

  // Fetch active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["hitl-alerts", severityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter !== "all") params.append("severity", severityFilter);
      const res = await fetch(`/api/hitl/alerts/active?${params}`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    refetchInterval: 15000,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/hitl/interventions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: "current-user", notes }), // TODO: Get actual user
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Intervention Approved", description: "The intervention has been approved." });
      queryClient.invalidateQueries({ queryKey: ["hitl-interventions"] });
      queryClient.invalidateQueries({ queryKey: ["hitl-summary"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`/api/hitl/interventions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedBy: "current-user", reason }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Intervention Rejected", description: "The intervention has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["hitl-interventions"] });
      queryClient.invalidateQueries({ queryKey: ["hitl-summary"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Escalate mutation
  const escalateMutation = useMutation({
    mutationFn: async ({ id, escalatedTo, reason }: { id: string; escalatedTo: string; reason: string }) => {
      const res = await fetch(`/api/hitl/interventions/${id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalatedBy: "current-user", escalatedTo, reason }),
      });
      if (!res.ok) throw new Error("Failed to escalate");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Intervention Escalated", description: "The intervention has been escalated." });
      queryClient.invalidateQueries({ queryKey: ["hitl-interventions"] });
      queryClient.invalidateQueries({ queryKey: ["hitl-summary"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/hitl/alerts/${id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgedBy: "current-user", notes }),
      });
      if (!res.ok) throw new Error("Failed to acknowledge");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Alert Acknowledged" });
      queryClient.invalidateQueries({ queryKey: ["hitl-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["hitl-summary"] });
      setSelectedAlert(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setSelectedIntervention(null);
    setActionType(null);
    setNotes("");
    setEscalateTo("");
  };

  const handleAction = () => {
    if (!selectedIntervention || !actionType) return;

    if (actionType === "approve") {
      approveMutation.mutate({ id: selectedIntervention.interventionId, notes });
    } else if (actionType === "reject") {
      if (!notes) {
        toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
        return;
      }
      rejectMutation.mutate({ id: selectedIntervention.interventionId, reason: notes });
    } else if (actionType === "escalate") {
      if (!escalateTo || !notes) {
        toast({ title: "Fields Required", description: "Please specify who to escalate to and why.", variant: "destructive" });
        return;
      }
      escalateMutation.mutate({ id: selectedIntervention.interventionId, escalatedTo, reason: notes });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            HITL Approval Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve agent interventions from Palantir
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["hitl-summary"] });
            queryClient.invalidateQueries({ queryKey: ["hitl-interventions"] });
            queryClient.invalidateQueries({ queryKey: ["hitl-alerts"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={summary.summary.interventions.critical > 0 ? "border-red-500 border-2" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Interventions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.summary.interventions.pending}</div>
              {summary.summary.interventions.critical > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {summary.summary.interventions.critical} Critical
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className={summary.summary.alerts.critical > 0 ? "border-red-500 border-2" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.summary.alerts.active}</div>
              {summary.summary.alerts.critical > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {summary.summary.alerts.critical} Critical
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agents Reporting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.summary.agentsWithPending?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {summary.summary.agentsWithPending?.slice(0, 3).join(", ")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.summary.requiresAttention ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-6 w-6" />
                  <span className="font-semibold">Attention Required</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-semibold">All Clear</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="interventions">
        <TabsList>
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Interventions
            {interventions?.total > 0 && (
              <Badge variant="secondary">{interventions.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
            {alerts?.total > 0 && (
              <Badge variant="secondary">{alerts.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="agent-queue" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agent Queue
          </TabsTrigger>
        </TabsList>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-4">
          {interventionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading interventions...</div>
          ) : interventions?.interventions?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No pending interventions</p>
              </CardContent>
            </Card>
          ) : (
            interventions?.interventions?.map((intervention: Intervention) => (
              <Card
                key={intervention.interventionId}
                className={`${severityBorders[intervention.severity]} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => setSelectedIntervention(intervention)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[intervention.severity]}>
                        {intervention.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{intervention.interventionType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {getTimeAgo(intervention.createdAt)}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{intervention.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    {intervention.agentSource}
                    {intervention.projectId && (
                      <>
                        <span className="mx-2">|</span>
                        Project: {intervention.projectId}
                      </>
                    )}
                    {/* Self-gating: renders only when the target entity is OpenProject-sourced */}
                    <SourceBadge
                      entity={(intervention.metadata as Record<string, unknown> | undefined)?.targetEntity ?? intervention}
                      entityType="project"
                    />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {intervention.recommendation}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIntervention(intervention);
                        setActionType("approve");
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIntervention(intervention);
                        setActionType("reject");
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIntervention(intervention);
                        setActionType("escalate");
                      }}
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-1" />
                      Escalate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alertsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
          ) : alerts?.alerts?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No active alerts</p>
              </CardContent>
            </Card>
          ) : (
            alerts?.alerts?.map((alert: Alert) => (
              <Card
                key={alert.alertId}
                className={`${severityBorders[alert.severity]}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[alert.severity]}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{alert.alertType}</Badge>
                      {alert.actionRequired && (
                        <Badge variant="destructive">Action Required</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {getTimeAgo(alert.createdAt)}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{alert.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    {alert.agentSource}
                    <SourceBadge entity={alert} entityType="project" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{alert.message}</p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAlert(alert);
                        acknowledgeMutation.mutate({ id: alert.alertId, notes: "" });
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Agent Queue Tab — agent findings/recommendations from the
            agent-runtime proxy (/api/agent/*). Approve executes the gated
            action (mirrored to OpenProject server-side) and trains the agent.
            The component degrades gracefully (inline error + retry) while the
            server routes are unavailable. */}
        <TabsContent value="agent-queue">
          <ApprovalQueue
            onDecided={() => {
              queryClient.invalidateQueries({ queryKey: ["hitl-summary"] });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionType && !!selectedIntervention} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Intervention"}
              {actionType === "reject" && "Reject Intervention"}
              {actionType === "escalate" && "Escalate Intervention"}
            </DialogTitle>
            <DialogDescription>
              {selectedIntervention?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "escalate" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Escalate To</label>
                <Input
                  placeholder="e.g., Portfolio Manager, Executive Team"
                  value={escalateTo}
                  onChange={(e) => setEscalateTo(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionType === "approve" && "Notes (optional)"}
                {actionType === "reject" && "Reason for Rejection (required)"}
                {actionType === "escalate" && "Reason for Escalation (required)"}
              </label>
              <Textarea
                placeholder={
                  actionType === "approve"
                    ? "Any notes about this approval..."
                    : "Please provide a reason..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {selectedIntervention && (
              <div className="bg-muted p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">Recommendation:</p>
                <p className="text-muted-foreground">{selectedIntervention.recommendation}</p>
                {selectedIntervention.estimatedImpact && (
                  <>
                    <p className="font-medium mt-3 mb-1">Estimated Impact:</p>
                    <p className="text-muted-foreground">{selectedIntervention.estimatedImpact}</p>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={
                approveMutation.isPending ||
                rejectMutation.isPending ||
                escalateMutation.isPending
              }
            >
              {actionType === "approve" && "Approve"}
              {actionType === "reject" && "Reject"}
              {actionType === "escalate" && "Escalate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
