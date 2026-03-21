/**
 * PPM DASHBOARD
 *
 * A reliable, real-time Project Portfolio Management dashboard that displays
 * live data from Palantir and receives updates from agents via WebSocket.
 *
 * Key Features:
 * - Real-time metrics updates via WebSocket
 * - Live project status cards
 * - Agent activity feed
 * - Connection status indicators
 * - Automatic reconnection with fallback to polling
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  Bot,
  FolderKanban,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { useCompanyName } from "@/contexts/CompanyProfileContext";

// Import live widgets
import { LiveMetricsWidget } from "@/components/widgets/LiveMetricsWidget";
import { AgentFeedWidget } from "@/components/widgets/AgentFeedWidget";
import { ProjectStatusWidget } from "@/components/widgets/ProjectStatusWidget";

// Sidebar navigation (reusable)
import { AgentSidebar } from "@/components/AgentSidebar";

function ConnectionStatusBanner() {
  const { isConnected } = useWebSocketContext();

  if (isConnected) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-800 dark:text-amber-200">
          Real-time connection lost. Using polling for updates.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-1 h-3 w-3" />
        Reconnect
      </Button>
    </motion.div>
  );
}

function DashboardHeader() {
  const { isConnected } = useWebSocketContext();
  const companyName = useCompanyName();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {companyName || "PPM"} Live Dashboard
        </h1>
        <p className="text-muted-foreground">
          Real-time portfolio management with Palantir data and agent updates
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={cn(
                "gap-1.5 px-3 py-1",
                isConnected
                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300"
              )}
            >
              {isConnected ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {isConnected ? "Live Connection" : "Polling Mode"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isConnected
              ? "Connected to WebSocket for real-time updates"
              : "WebSocket disconnected, polling every 60 seconds"}
          </TooltipContent>
        </Tooltip>
        <Button variant="outline" size="sm" asChild>
          <a href="/admin/palantir-sync">
            <Settings className="mr-1 h-4 w-4" />
            Palantir Settings
          </a>
        </Button>
      </div>
    </div>
  );
}

function QuickStats() {
  const { isConnected } = useWebSocketContext();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Data Source</p>
              <p className="text-lg font-semibold">Palantir Foundry</p>
            </div>
            <Activity className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Update Mode</p>
              <p className="text-lg font-semibold">
                {isConnected ? "Real-time" : "Polling"}
              </p>
            </div>
            {isConnected ? (
              <Wifi className="h-8 w-8 text-blue-500 opacity-50" />
            ) : (
              <RefreshCw className="h-8 w-8 text-blue-500 opacity-50" />
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Agent Interface</p>
              <p className="text-lg font-semibold">Active</p>
            </div>
            <Bot className="h-8 w-8 text-purple-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">API Endpoint</p>
              <p className="text-lg font-semibold">/api/agent/push</p>
            </div>
            <Zap className="h-8 w-8 text-amber-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function APIDocumentation() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4" />
          Agent Integration API
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div>
            <p className="mb-1 font-medium">Push Data to Dashboard</p>
            <code className="block rounded bg-muted p-2 text-xs">
              POST /api/agent/push
            </code>
          </div>
          <div>
            <p className="mb-1 font-medium">Request Body</p>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
{`{
  "type": "metrics" | "project-update" | "risk-alert" | "insight",
  "payload": {
    "title": "Update Title",
    "message": "Description",
    ...data
  },
  "priority": "critical" | "high" | "normal" | "low",
  "agentId": "your-agent-id",
  "agentName": "Your Agent Name"
}`}
            </pre>
          </div>
          <div>
            <p className="mb-1 font-medium">Example: Push Metrics Update</p>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
{`curl -X POST /api/agent/push \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "metrics",
    "payload": {
      "title": "Daily Metrics Sync",
      "totalProjects": 45,
      "atRiskProjects": 3
    },
    "agentId": "metrics-sync-agent"
  }'`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PPMDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AgentSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto space-y-6 p-6">
          {/* Connection Status Banner */}
          <ConnectionStatusBanner />

          {/* Header */}
          <DashboardHeader />

          {/* Quick Stats */}
          <QuickStats />

          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Agent Feed</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">API</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Live Metrics */}
                <LiveMetricsWidget />

                {/* Two Column Layout */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Agent Activity Feed */}
                  <AgentFeedWidget />

                  {/* Quick API Guide */}
                  <APIDocumentation />
                </div>
              </motion.div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectStatusWidget />
              </motion.div>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                <AgentFeedWidget />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Agent Integration Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h4 className="mb-2 font-medium">How Agents Send Data</h4>
                      <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                        <li>
                          Agent makes POST request to{" "}
                          <code className="rounded bg-muted px-1">/api/agent/push</code>
                        </li>
                        <li>Server validates and stores the data</li>
                        <li>WebSocket broadcasts update to all connected UI clients</li>
                        <li>Dashboard widgets update instantly</li>
                      </ol>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="mb-2 font-medium">Supported Data Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "metrics",
                          "project-update",
                          "risk-alert",
                          "insight",
                          "activity",
                          "status-change",
                          "financial-update",
                          "okr-progress",
                        ].map((type) => (
                          <Badge key={type} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                <APIDocumentation />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Additional Endpoints
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="mb-1 font-medium">Get Recent Events</p>
                      <code className="block rounded bg-muted p-2 text-xs">
                        GET /api/agent/recent?limit=20
                      </code>
                    </div>
                    <div>
                      <p className="mb-1 font-medium">Batch Push</p>
                      <code className="block rounded bg-muted p-2 text-xs">
                        POST /api/agent/batch-push
                      </code>
                      <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
{`{ "items": [...array of push items...] }`}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 font-medium">Stream Status</p>
                      <code className="block rounded bg-muted p-2 text-xs">
                        GET /api/agent/stream-status
                      </code>
                    </div>
                    <div>
                      <p className="mb-1 font-medium">Palantir Data</p>
                      <code className="block rounded bg-muted p-2 text-xs">
                        GET /api/palantir/ontology/metrics
                      </code>
                      <code className="mt-1 block rounded bg-muted p-2 text-xs">
                        GET /api/palantir/ontology/projects
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
