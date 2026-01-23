import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Target, TrendingUp, AlertTriangle, Clock, Users, Zap,
  ChevronRight, Calendar, Shield, Brain, CheckCircle2,
  XCircle, AlertOctagon, ArrowUpRight, Network, GitBranch,
  Crosshair, Map, Radio
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface COPProps {
  onDrillDown?: (type: string, id: string) => void;
}

// Battle Rhythm indicator
function BattleRhythmIndicator() {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  const events = [
    { day: 1, name: "Scrum of Scrums", color: "bg-blue-500", time: "09:00" },
    { day: 2, name: "Cross-Functional OPT", color: "bg-purple-500", time: "10:00" },
    { day: 3, name: "Decision Node", color: "bg-amber-500", time: "14:00" },
    { day: 4, name: "Value Pulse", color: "bg-green-500", time: "11:00" },
    { day: 5, name: "Weekly Orders", color: "bg-red-500", time: "15:00" },
  ];

  const todayEvent = events.find(e => e.day === today);

  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-slate-900 text-white rounded-lg">
      <Radio className="h-5 w-5 text-green-400 animate-pulse" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Battle Rhythm</span>
          {todayEvent && (
            <>
              <span className="text-xs text-slate-400">•</span>
              <Badge className={cn("text-xs", todayEvent.color)}>
                {todayEvent.name} @ {todayEvent.time}
              </Badge>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {events.map((event) => (
            <TooltipProvider key={event.day}>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      event.day === today ? event.color + " scale-150" : "bg-slate-600"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{event.name} - {event.time}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
      <Button size="sm" variant="outline" className="text-xs">
        View Calendar
      </Button>
    </div>
  );
}

// Strategic Layer (VRO - 6-12 months horizon)
function StrategicLayer({ onDrillDown }: { onDrillDown?: (type: string, id: string) => void }) {
  const metrics = [
    {
      id: "portfolio-roi",
      label: "Portfolio ROI",
      current: 64,
      target: 85,
      unit: "%",
      trend: "up",
      status: "at-risk",
      gap: -21,
      impact: "$12.5M value leakage"
    },
    {
      id: "strategic-alignment",
      label: "Strategic Alignment",
      current: 78,
      target: 90,
      unit: "%",
      trend: "up",
      status: "on-track",
      gap: -12,
      impact: "3 misaligned initiatives"
    },
    {
      id: "benefits-realization",
      label: "Benefits Realization",
      current: 56,
      target: 80,
      unit: "%",
      trend: "down",
      status: "critical",
      gap: -24,
      impact: "$18.2M unrealized"
    },
  ];

  return (
    <Card className="border-l-4 border-l-red-500 bg-red-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-red-600" />
            <span className="text-red-900">Strategic Layer</span>
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
              VRO • 6-12 Months
            </Badge>
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDrillDown?.("strategic", "vro-dashboard")}
            className="text-xs"
          >
            View Full VRO Dashboard
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <motion.div
              key={metric.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-lg border border-red-200 cursor-pointer"
              onClick={() => onDrillDown?.("metric", metric.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    metric.status === "critical" && "bg-red-100 text-red-700 border-red-300",
                    metric.status === "at-risk" && "bg-amber-100 text-amber-700 border-amber-300",
                    metric.status === "on-track" && "bg-green-100 text-green-700 border-green-300"
                  )}
                >
                  {metric.status}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">{metric.current}</span>
                <span className="text-lg text-gray-500">{metric.unit}</span>
                <span className="text-sm text-gray-400">/ {metric.target}{metric.unit}</span>
              </div>
              <Progress
                value={(metric.current / metric.target) * 100}
                className={cn(
                  "h-2 mb-2",
                  metric.status === "critical" && "[&>div]:bg-red-500",
                  metric.status === "at-risk" && "[&>div]:bg-amber-500",
                  metric.status === "on-track" && "[&>div]:bg-green-500"
                )}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Gap: {metric.gap}{metric.unit}</span>
                <span className="text-red-600 font-medium">{metric.impact}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Strategic Initiatives */}
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-red-600" />
            Strategic Initiatives (Next 6-12 Months)
          </h4>
          <div className="space-y-2">
            {[
              { name: "Digital Transformation Phase 3", status: "on-track", value: "$24M", progress: 68 },
              { name: "Customer Experience Optimization", status: "at-risk", value: "$18M", progress: 45 },
              { name: "Operations Modernization", status: "critical", value: "$32M", progress: 23 },
            ].map((initiative, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => onDrillDown?.("initiative", initiative.name.toLowerCase().replace(/\s+/g, '-'))}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    initiative.status === "on-track" && "bg-green-500",
                    initiative.status === "at-risk" && "bg-amber-500",
                    initiative.status === "critical" && "bg-red-500"
                  )}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{initiative.name}</span>
                    <span className="text-xs text-gray-500">{initiative.value}</span>
                  </div>
                  <Progress value={initiative.progress} className="h-1 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Operational Layer (TMO - 3-6 months horizon)
function OperationalLayer({ onDrillDown }: { onDrillDown?: (type: string, id: string) => void }) {
  const roadmapHealth = [
    { id: "architecture", label: "Architecture Debt", current: 23, target: 10, unit: "%", status: "at-risk" },
    { id: "dependencies", label: "Blocked Dependencies", current: 7, target: 3, unit: "", status: "critical" },
    { id: "resource-allocation", label: "Resource Utilization", current: 87, target: 85, unit: "%", status: "on-track" },
  ];

  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-5 w-5 text-amber-600" />
            <span className="text-amber-900">Operational Layer</span>
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
              TMO • 3-6 Months
            </Badge>
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDrillDown?.("operational", "tmo-dashboard")}
            className="text-xs"
          >
            View Full TMO Dashboard
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roadmapHealth.map((metric) => (
            <motion.div
              key={metric.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-lg border border-amber-200 cursor-pointer"
              onClick={() => onDrillDown?.("metric", metric.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    metric.status === "critical" && "bg-red-100 text-red-700 border-red-300",
                    metric.status === "at-risk" && "bg-amber-100 text-amber-700 border-amber-300",
                    metric.status === "on-track" && "bg-green-100 text-green-700 border-green-300"
                  )}
                >
                  {metric.status}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">{metric.current}</span>
                <span className="text-lg text-gray-500">{metric.unit}</span>
                {metric.target && (
                  <span className="text-sm text-gray-400">/ {metric.target}{metric.unit}</span>
                )}
              </div>
              <Progress
                value={(metric.current / metric.target) * 100}
                className="h-2"
              />
            </motion.div>
          ))}
        </div>

        {/* Cross-Functional Dependencies */}
        <div className="bg-white p-4 rounded-lg border border-amber-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Network className="h-4 w-4 text-amber-600" />
            Cross-Functional Dependencies (Requires OPT Review)
          </h4>
          <div className="space-y-2">
            {[
              {
                from: "Clean Energy Initiative",
                to: "Grid Modernization",
                status: "blocked",
                blocker: "Awaiting TMO architecture decision",
                impact: "2-week delay risk"
              },
              {
                from: "Customer Portal v2",
                to: "Data Platform",
                status: "at-risk",
                blocker: "Resource contention - FinOps review needed",
                impact: "Budget +15%"
              },
              {
                from: "Operations Hub",
                to: "Security Framework",
                status: "on-track",
                blocker: "Coordinated delivery Q2",
                impact: "No impact"
              },
            ].map((dep, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer border-l-2"
                style={{
                  borderLeftColor:
                    dep.status === "blocked" ? "#ef4444" :
                    dep.status === "at-risk" ? "#f59e0b" :
                    "#10b981"
                }}
                onClick={() => onDrillDown?.("dependency", `${dep.from}-${dep.to}`.toLowerCase().replace(/\s+/g, '-'))}
              >
                <GitBranch className="h-4 w-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{dep.from}</span>
                    <ArrowUpRight className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-600">{dep.to}</span>
                  </div>
                  <p className="text-xs text-gray-600">{dep.blocker}</p>
                  <p className="text-xs font-medium text-amber-600 mt-1">Impact: {dep.impact}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    dep.status === "blocked" && "bg-red-100 text-red-700 border-red-300",
                    dep.status === "at-risk" && "bg-amber-100 text-amber-700 border-amber-300",
                    dep.status === "on-track" && "bg-green-100 text-green-700 border-green-300"
                  )}
                >
                  {dep.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Tactical Layer (PMO - Current week)
function TacticalLayer({ onDrillDown }: { onDrillDown?: (type: string, id: string) => void }) {
  const weekMetrics = [
    { id: "active-projects", label: "Active Projects", value: 24, change: "+3", status: "on-track" },
    { id: "blockers", label: "Blockers", value: 5, change: "-2", status: "at-risk" },
    { id: "velocity", label: "Sprint Velocity", value: 87, change: "+12", status: "accelerating", unit: "pts" },
  ];

  return (
    <Card className="border-l-4 border-l-green-500 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            <span className="text-green-900">Tactical Layer</span>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              PMO • Current Week
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Week 4, Jan 2026
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDrillDown?.("tactical", "pmo-dashboard")}
              className="text-xs"
            >
              View Full PMO Dashboard
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weekMetrics.map((metric) => (
            <motion.div
              key={metric.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-lg border border-green-200 cursor-pointer"
              onClick={() => onDrillDown?.("metric", metric.id)}
            >
              <span className="text-sm font-medium text-gray-700 block mb-2">{metric.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
                {metric.unit && <span className="text-lg text-gray-500">{metric.unit}</span>}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs ml-auto",
                    metric.change.startsWith("+") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  )}
                >
                  {metric.change} this week
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>

        {/* This Week's Projects */}
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            Active Sprints & Projects This Week
          </h4>
          <div className="space-y-2">
            {[
              { name: "Clean Energy Portal - Sprint 12", team: "FPL Digital", progress: 78, status: "on-track", blockers: 0 },
              { name: "Grid Analytics Dashboard", team: "Energy Resources", progress: 45, status: "at-risk", blockers: 2 },
              { name: "Customer Self-Service v2.1", team: "CX Platform", progress: 92, status: "accelerating", blockers: 0 },
              { name: "Operations Automation Phase 2", team: "Corporate IT", progress: 34, status: "blocked", blockers: 3 },
            ].map((project, i) => (
              <div
                key={i}
                className="p-3 hover:bg-gray-50 rounded cursor-pointer border-l-2"
                style={{
                  borderLeftColor:
                    project.status === "blocked" ? "#ef4444" :
                    project.status === "at-risk" ? "#f59e0b" :
                    project.status === "accelerating" ? "#3b82f6" :
                    "#10b981"
                }}
                onClick={() => onDrillDown?.("project", project.name.toLowerCase().replace(/\s+/g, '-'))}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium block">{project.name}</span>
                    <span className="text-xs text-gray-500">{project.team}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.blockers > 0 && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                        {project.blockers} blockers
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        project.status === "blocked" && "bg-red-100 text-red-700 border-red-300",
                        project.status === "at-risk" && "bg-amber-100 text-amber-700 border-amber-300",
                        project.status === "on-track" && "bg-green-100 text-green-700 border-green-300",
                        project.status === "accelerating" && "bg-blue-100 text-blue-700 border-blue-300"
                      )}
                    >
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={project.progress} className="h-2 flex-1" />
                  <span className="text-xs text-gray-500 w-12 text-right">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Action Queue - What needs attention TODAY
function ActionQueue({ onDrillDown }: { onDrillDown?: (type: string, id: string) => void }) {
  const actions = [
    {
      id: "1",
      type: "decision",
      urgency: "immediate",
      title: "Wednesday Decision Node: Kill/Continue/Pivot - Operations Modernization",
      source: "Battle Rhythm Orchestrator",
      impact: "high",
      dueTime: "14:00 Today",
      icon: AlertOctagon,
      color: "red"
    },
    {
      id: "2",
      type: "blocker",
      urgency: "today",
      title: "Resolve dependency blocker: Grid Modernization waiting on architecture decision",
      source: "TMO Agent",
      impact: "high",
      dueTime: "EOD",
      icon: AlertTriangle,
      color: "amber"
    },
    {
      id: "3",
      type: "risk",
      urgency: "this-week",
      title: "Budget overrun detected: Customer Portal v2 trending +15%",
      source: "FinOps Agent",
      impact: "medium",
      dueTime: "Friday",
      icon: Shield,
      color: "amber"
    },
    {
      id: "4",
      type: "opportunity",
      urgency: "this-week",
      title: "Accelerate Clean Energy Portal - team velocity +40%, can pull forward features",
      source: "Planning Agent",
      impact: "medium",
      dueTime: "Thursday Value Pulse",
      icon: Zap,
      color: "green"
    },
  ];

  return (
    <Card className="border-2 border-blue-500 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
          <span className="text-blue-900">Action Queue</span>
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            {actions.filter(a => a.urgency === "immediate" || a.urgency === "today").length} Require Attention Today
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          AI-identified actions requiring your decision or attention
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "p-4 bg-white rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all",
                  action.color === "red" && "border-l-red-500",
                  action.color === "amber" && "border-l-amber-500",
                  action.color === "green" && "border-l-green-500"
                )}
                onClick={() => onDrillDown?.("action", action.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    action.color === "red" && "bg-red-100",
                    action.color === "amber" && "bg-amber-100",
                    action.color === "green" && "bg-green-100"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      action.color === "red" && "text-red-600",
                      action.color === "amber" && "text-amber-600",
                      action.color === "green" && "text-green-600"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">{action.title}</h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap",
                          action.urgency === "immediate" && "bg-red-100 text-red-700 border-red-300",
                          action.urgency === "today" && "bg-amber-100 text-amber-700 border-amber-300",
                          action.urgency === "this-week" && "bg-blue-100 text-blue-700 border-blue-300"
                        )}
                      >
                        {action.urgency === "immediate" ? "URGENT" : action.dueTime}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        {action.source}
                      </span>
                      <span className={cn(
                        "font-medium",
                        action.impact === "high" && "text-red-600",
                        action.impact === "medium" && "text-amber-600"
                      )}>
                        {action.impact.toUpperCase()} IMPACT
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </motion.div>
            );
          })}
        </div>
        <Button className="w-full mt-4" variant="outline">
          View All Actions ({actions.length})
        </Button>
      </CardContent>
    </Card>
  );
}

// Main COP Component
export function CommonOperationalPicture({ onDrillDown }: COPProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Common Operational Picture</h1>
          <p className="text-gray-600 mt-1">
            Real-time, three-layer view of Strategic, Operational, and Tactical health
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
          LIVE
        </Badge>
      </div>

      {/* Battle Rhythm Indicator */}
      <BattleRhythmIndicator />

      {/* Action Queue - First thing users see */}
      <ActionQueue onDrillDown={onDrillDown} />

      {/* Three Layers */}
      <StrategicLayer onDrillDown={onDrillDown} />
      <OperationalLayer onDrillDown={onDrillDown} />
      <TacticalLayer onDrillDown={onDrillDown} />
    </div>
  );
}
