/**
 * PROJECT STATUS WIDGET
 *
 * Displays project cards with real-time status updates from Palantir.
 * Shows project health, budget, risks, and progress indicators.
 */

import { useLiveProjects } from "@/hooks/useLivePalantirData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Filter,
  FolderKanban,
  RefreshCw,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectStatus = "green" | "amber" | "red";
type ProjectPriority = "critical" | "high" | "medium" | "low";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  statusText?: string;
  businessUnit: string;
  priority: ProjectPriority;
  priorityText?: string;
  // Budget
  budgetTotal?: number;
  budgetSpent?: number;
  budgetUnit?: string;
  budgetUtilization?: number;
  // Progress & EVM
  progress?: number;
  milestoneProgress?: number;
  cpiValue?: number;
  spiValue?: number;
  // SAFe
  artName?: string;
  currentPi?: string;
  velocity?: number;
  // Counts
  riskCount?: number;
  featureCount?: number;
  storyCount?: number;
  taskCount?: number;
  dependencyCount?: number;
}

const STATUS_CONFIG = {
  green: {
    label: "On Track",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900",
    borderColor: "border-green-200 dark:border-green-800",
  },
  amber: {
    label: "At Risk",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  red: {
    label: "Delayed",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900",
    borderColor: "border-red-200 dark:border-red-800",
  },
};

const PRIORITY_BADGE = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function ProjectCard({ project }: { project: Project }) {
  const statusConfig = STATUS_CONFIG[project.status];
  const StatusIcon = statusConfig.icon;
  const budgetPercent =
    project.budgetTotal && project.budgetSpent
      ? (project.budgetSpent / project.budgetTotal) * 100
      : 0;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all hover:shadow-md",
        statusConfig.borderColor
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium leading-tight">{project.name}</h4>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-xs", PRIORITY_BADGE[project.priority])}
            >
              {project.priority}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{project.businessUnit}</p>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            statusConfig.bgColor
          )}
        >
          <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className={cn("font-medium", statusConfig.color)}>
            {project.statusText || statusConfig.label}
          </span>
        </div>

        {/* Budget */}
        {project.budgetTotal !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                Budget
              </span>
              <span className="font-medium">
                {formatCurrency(project.budgetSpent)} / {formatCurrency(project.budgetTotal)}
              </span>
            </div>
            <Progress
              value={budgetPercent}
              className={cn(
                "h-1.5",
                budgetPercent > 90 && "bg-red-200 [&>div]:bg-red-500",
                budgetPercent > 75 && budgetPercent <= 90 && "bg-amber-200 [&>div]:bg-amber-500"
              )}
            />
          </div>
        )}

        {/* Milestone Progress */}
        {project.milestoneProgress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                Progress
              </span>
              <span className="font-medium">{project.milestoneProgress}%</span>
            </div>
            <Progress value={project.milestoneProgress} className="h-1.5" />
          </div>
        )}

        {/* Risks */}
        {project.riskCount !== undefined && project.riskCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              Active Risks
            </span>
            <Badge
              variant="outline"
              className={cn(
                project.riskCount > 5
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : project.riskCount > 2
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              )}
            >
              {project.riskCount}
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
          <a href={`/project/${project.id}`}>
            View Details
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function ProjectStatusWidget() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
  };

  const { data: projects, isLive, isLoading, lastUpdated, refetch, error } =
    useLiveProjects(filters);

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || "Failed to load projects from Palantir"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            Project Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={isLive ? "default" : "secondary"}
                  className={cn(
                    "gap-1",
                    isLive
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  )}
                >
                  {isLive ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  {isLive ? "Live" : "Polling"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isLive
                  ? "Connected to real-time updates"
                  : "WebSocket disconnected, using polling"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh projects</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-2 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="green">On Track</SelectItem>
              <SelectItem value="amber">At Risk</SelectItem>
              <SelectItem value="red">Delayed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {lastUpdated && (
          <p className="mt-1 text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[500px] px-6 pb-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
              <FolderKanban className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No projects found</p>
              <p className="text-xs">
                {statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Projects will appear here when available"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ProjectStatusWidget;
