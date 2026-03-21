/**
 * AGENT FEED WIDGET
 *
 * Real-time activity feed showing agent updates, insights, and actions.
 * Connects to WebSocket for live updates from all agents.
 */

import { useAgentDataStream } from "@/hooks/useLivePalantirData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Filter,
  Info,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EVENT_TYPES = [
  { value: "metrics", label: "Metrics", icon: Activity },
  { value: "project-update", label: "Project Updates", icon: CheckCircle2 },
  { value: "risk-alert", label: "Risk Alerts", icon: AlertTriangle },
  { value: "insight", label: "Insights", icon: Zap },
  { value: "activity", label: "Activity", icon: Clock },
  { value: "status-change", label: "Status Changes", icon: Info },
  { value: "financial-update", label: "Financial", icon: Activity },
];

const PRIORITY_COLORS = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  metrics: Activity,
  "project-update": CheckCircle2,
  "risk-alert": AlertTriangle,
  insight: Zap,
  activity: Clock,
  "status-change": Info,
  "financial-update": Activity,
  "okr-progress": Activity,
  "dependency-alert": AlertCircle,
  custom: Bot,
};

interface AgentEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  agentId?: string;
  agentName?: string;
  timestamp: string;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function EventItem({ event }: { event: AgentEvent }) {
  const Icon = TYPE_ICONS[event.type] || Bot;
  const priority = (event.payload.priority as string) || "normal";

  return (
    <div className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          priority === "critical" && "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
          priority === "high" && "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
          priority === "normal" && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
          priority === "low" && "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-tight">
              {(event.payload.title as string) || event.type.replace(/-/g, " ")}
            </p>
            {event.payload.message && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {String(event.payload.message)}
              </p>
            )}
          </div>
          <Badge variant="outline" className={cn("shrink-0 text-xs", PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS])}>
            {priority}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {event.agentName && (
            <>
              <Bot className="h-3 w-3" />
              <span>{event.agentName}</span>
              <span>-</span>
            </>
          )}
          <Clock className="h-3 w-3" />
          <span>{formatTimeAgo(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

export function AgentFeedWidget() {
  const { events, isConnected, clearEvents } = useAgentDataStream();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const filteredEvents = useMemo(() => {
    if (selectedTypes.length === 0) return events;
    return events.filter((e) => selectedTypes.includes(e.type));
  }, [events, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Agent Activity Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={isConnected ? "default" : "secondary"}
                  className={cn(
                    "gap-1",
                    isConnected
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  )}
                >
                  {isConnected ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  {isConnected ? "Live" : "Disconnected"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isConnected
                  ? "Receiving real-time agent updates"
                  : "WebSocket disconnected"}
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EVENT_TYPES.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type.value}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => toggleType(type.value)}
                  >
                    <type.icon className="mr-2 h-4 w-4" />
                    {type.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearEvents}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all events</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {filteredEvents.length} events
          {selectedTypes.length > 0 && ` (filtered from ${events.length})`}
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          {filteredEvents.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No agent activity yet</p>
              <p className="text-xs">
                Events will appear here when agents send updates
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AgentFeedWidget;
