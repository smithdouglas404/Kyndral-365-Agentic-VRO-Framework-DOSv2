/**
 * RULEBRICKS INTEGRATION
 *
 * Simplified integration page - links directly to Rulebricks dashboard
 * for all rule management, flows, and execution logs.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Workflow,
  Database,
  Settings,
  BarChart3,
  Shield,
} from "lucide-react";

interface RulebricksStatus {
  success: boolean;
  configured: boolean;
  connected: boolean;
  ruleCount: number;
  rules: { id: string; slug: string; name: string; published?: boolean }[];
}

// Agent to rule mapping - based on actual rules in Rulebricks
const AGENT_RULES: {
  agent: string;
  slug: string;
  description: string;
  color: string;
  trigger: string;
}[] = [
  {
    agent: "FinOps",
    slug: "threshold-budget-utilization",
    description: "Budget Utilization",
    color: "bg-emerald-500",
    trigger: "Warning 85%, Critical 95%",
  },
  {
    agent: "TMO",
    slug: "threshold-spi",
    description: "Schedule Performance Index",
    color: "bg-blue-500",
    trigger: "Warning <0.95, Critical <0.85",
  },
  {
    agent: "Governance",
    slug: "gdpr-article-5",
    description: "GDPR Article 5: Principles",
    color: "bg-purple-500",
    trigger: "Data processing compliance",
  },
  {
    agent: "Governance",
    slug: "gdpr-article-32",
    description: "GDPR Article 32: Security",
    color: "bg-purple-500",
    trigger: "Security measures required",
  },
  {
    agent: "Governance",
    slug: "agent-tool-rules-governance",
    description: "Governance Agent Tool Rules",
    color: "bg-purple-500",
    trigger: "Tool execution sequence",
  },
  {
    agent: "VRO",
    slug: "agent-tool-rules-vro",
    description: "VRO Agent Tool Rules",
    color: "bg-cyan-500",
    trigger: "Tool execution sequence",
  },
];

export default function RulebricksIntegration() {
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);

  // Fetch Rulebricks status
  const { data: status, isLoading, refetch } = useQuery<RulebricksStatus>({
    queryKey: ["/api/rulebricks/status"],
    refetchInterval: 60000,
  });

  // Fetch dashboard URL
  const { data: dashboardData } = useQuery<{ success: boolean; url: string }>({
    queryKey: ["/api/rulebricks/dashboard-url"],
    onSuccess: (data) => {
      if (data?.url) setDashboardUrl(data.url);
    },
  });

  const openDashboard = (section?: string) => {
    const baseUrl = dashboardData?.url || "https://app.rulebricks.com";
    const url = section ? `${baseUrl}/${section}` : baseUrl;
    window.open(url, "_blank");
  };

  const getRuleStatus = (slug: string) => {
    return status?.rules?.find((r) => r.slug === slug);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Rulebricks Not Configured
            </CardTitle>
            <CardDescription>
              Set RULEBRICKS_API_KEY environment variable to enable the rules engine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Rulebricks is a no-code decision rules engine that powers agent
              threshold checks and business logic. Each agent has rules defined
              in Rulebricks that determine when to trigger alerts and actions.
            </p>
            <Button onClick={() => window.open("https://rulebricks.com", "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Rulebricks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rulebricks Integration</h1>
          <p className="text-muted-foreground">
            Agent decision rules powered by Rulebricks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status?.connected ? "default" : "destructive"} className="px-3 py-1">
            {status?.connected ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Rulebricks Dashboard</CardTitle>
          <CardDescription>
            Open the full-featured Rulebricks dashboard to manage rules, flows, and view analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button onClick={() => openDashboard()} className="h-20 flex-col gap-2">
              <ExternalLink className="h-5 w-5" />
              <span>Dashboard</span>
            </Button>
            <Button variant="outline" onClick={() => openDashboard("rules")} className="h-20 flex-col gap-2">
              <Zap className="h-5 w-5" />
              <span>Decision Tables</span>
            </Button>
            <Button variant="outline" onClick={() => openDashboard("flows")} className="h-20 flex-col gap-2">
              <Workflow className="h-5 w-5" />
              <span>Rule Flows</span>
            </Button>
            <Button variant="outline" onClick={() => openDashboard("logs")} className="h-20 flex-col gap-2">
              <Database className="h-5 w-5" />
              <span>Execution Logs</span>
            </Button>
            <Button variant="outline" onClick={() => openDashboard("values")} className="h-20 flex-col gap-2">
              <Settings className="h-5 w-5" />
              <span>Dynamic Values</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{status?.ruleCount || 0}</p>
                <p className="text-sm text-muted-foreground">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {AGENT_RULES.filter((ar) => getRuleStatus(ar.slug)).length}
                </p>
                <p className="text-sm text-muted-foreground">Agent Rules Configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{AGENT_RULES.length}</p>
                <p className="text-sm text-muted-foreground">Agent Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Rules Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Rule Mapping</CardTitle>
          <CardDescription>
            Each agent monitors specific conditions and triggers rules in Rulebricks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENT_RULES.map((ar) => {
              const rule = getRuleStatus(ar.slug);
              return (
                <Card key={ar.slug} className={`relative ${!rule ? "opacity-60" : ""}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={ar.color}>{ar.agent}</Badge>
                      {rule ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <code className="text-sm font-mono text-muted-foreground">
                      {ar.slug}
                    </code>
                    <p className="text-sm mt-2">{ar.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Trigger: {ar.trigger}
                    </p>
                    {rule && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => openDashboard(`rules/${ar.slug}`)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Edit in Rulebricks
                      </Button>
                    )}
                    {!rule && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => openDashboard("rules")}
                      >
                        Create Rule
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>1. Agents Monitor:</strong> Each agent continuously monitors project data for threshold breaches.
          </p>
          <p>
            <strong>2. Rules Execute:</strong> When a threshold is crossed, the agent calls Rulebricks to evaluate the rule.
          </p>
          <p>
            <strong>3. Actions Trigger:</strong> Based on the rule result, agents create interventions, send notifications, or escalate.
          </p>
          <p>
            <strong>4. Learning:</strong> Results are stored in agent memory for pattern recognition and avoiding duplicates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
