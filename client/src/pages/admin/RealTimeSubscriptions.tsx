/**
 * REAL-TIME SUBSCRIPTION DASHBOARD
 *
 * Subscribe to Palantir Ontology changes and view live events
 */

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Radio,
  Bell,
  BellOff,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  Pause,
  Play,
  Wifi,
  WifiOff,
} from "lucide-react";

interface Subscription {
  id: string;
  userId: string;
  objectType: string;
  filters?: any[];
  webhookUrl?: string;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface OntologyEvent {
  id: string;
  objectType: string;
  objectId: string;
  eventType: "created" | "updated" | "deleted";
  changes?: Record<string, { old: any; new: any }>;
  timestamp: string;
}

interface Stats {
  totalSubscriptions: number;
  byObjectType: Record<string, number>;
  totalTriggers: number;
  eventHistorySize: number;
  oldestEvent?: string;
  newestEvent?: string;
}

export default function RealTimeSubscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [liveEvents, setLiveEvents] = useState<OntologyEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<OntologyEvent | null>(null);
  const [newSubscription, setNewSubscription] = useState({
    objectType: "",
    webhookUrl: "",
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch subscriptions
  const { data: subscriptionsData, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const response = await fetch("/api/ontology-subscriptions");
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      return response.json();
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["subscription-stats"],
    queryFn: async () => {
      const response = await fetch("/api/ontology-subscriptions/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    refetchInterval: 10000,
  });

  // Fetch recent events
  const { data: eventsData } = useQuery({
    queryKey: ["subscription-events"],
    queryFn: async () => {
      const response = await fetch("/api/ontology-subscriptions/events?limit=50");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    refetchInterval: isStreaming ? false : 5000,
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (subscription: typeof newSubscription) => {
      const response = await fetch("/api/ontology-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) throw new Error("Failed to create subscription");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription Created" });
      setCreateDialogOpen(false);
      setNewSubscription({ objectType: "", webhookUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/ontology-subscriptions/${subscriptionId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete subscription");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription Deleted" });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Simulate event mutation (for testing)
  const simulateEventMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ontology-subscriptions/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectType: "Project",
          eventType: "updated",
          changes: {
            status: { old: "green", new: "amber" },
            progress: { old: 75, new: 80 },
          },
        }),
      });
      if (!response.ok) throw new Error("Failed to simulate event");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Event Simulated" });
      queryClient.invalidateQueries({ queryKey: ["subscription-events"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
    },
  });

  // Start/stop SSE stream
  const toggleStream = () => {
    if (isStreaming) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setIsStreaming(false);
      toast({ title: "Live Stream Stopped" });
    } else {
      const es = new EventSource("/api/ontology-subscriptions/stream");

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "connected") {
            setLiveEvents((prev) => [data, ...prev].slice(0, 100));
          }
        } catch (e) {
          console.error("Failed to parse event:", e);
        }
      };

      es.onerror = () => {
        es.close();
        setIsStreaming(false);
        toast({
          title: "Stream Disconnected",
          description: "Connection lost",
          variant: "destructive",
        });
      };

      eventSourceRef.current = es;
      setIsStreaming(true);
      toast({ title: "Live Stream Started" });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "created":
        return "bg-green-100 text-green-800";
      case "updated":
        return "bg-blue-100 text-blue-800";
      case "deleted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "created":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "updated":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const stats: Stats = statsData?.stats || {
    totalSubscriptions: 0,
    byObjectType: {},
    totalTriggers: 0,
    eventHistorySize: 0,
  };

  const displayedEvents = isStreaming ? liveEvents : eventsData?.events || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Subscriptions</h1>
          <p className="text-muted-foreground">
            Subscribe to Ontology changes and view live events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isStreaming ? "destructive" : "default"}
            onClick={toggleStream}
          >
            {isStreaming ? (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Stop Stream
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Start Live Stream
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTriggers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events in History</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventHistorySize}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stream Status</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isStreaming ? "bg-green-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              <span className="text-lg font-medium">
                {isStreaming ? "Connected" : "Disconnected"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>
              Manage your ontology change subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSubscriptions ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading...
              </div>
            ) : subscriptionsData?.subscriptions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active subscriptions</p>
                <Button
                  variant="link"
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-2"
                >
                  Create your first subscription
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {subscriptionsData?.subscriptions?.map((sub: Subscription) => (
                    <Card key={sub.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{sub.objectType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {sub.triggerCount} triggers
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(sub.createdAt).toLocaleDateString()}
                          </p>
                          {sub.lastTriggered && (
                            <p className="text-xs text-muted-foreground">
                              Last: {new Date(sub.lastTriggered).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSubscriptionMutation.mutate(sub.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Live Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isStreaming && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  )}
                  {isStreaming ? "Live Events" : "Recent Events"}
                </CardTitle>
                <CardDescription>
                  {isStreaming
                    ? "Real-time stream of ontology changes"
                    : "Polling for changes every 5 seconds"}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateEventMutation.mutate()}
                disabled={simulateEventMutation.isPending}
              >
                <Zap className="h-4 w-4 mr-1" />
                Simulate
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {displayedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events yet</p>
                <p className="text-xs text-muted-foreground">
                  Events will appear here as they occur
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {displayedEvents.map((event: OntologyEvent) => (
                    <Card
                      key={event.id}
                      className="p-3 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start gap-3">
                        {getEventTypeIcon(event.eventType)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge className={getEventTypeColor(event.eventType)}>
                              {event.eventType}
                            </Badge>
                            <Badge variant="outline">{event.objectType}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {event.objectId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription Types Distribution */}
      {Object.keys(stats.byObjectType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Object Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byObjectType).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-sm py-1 px-3">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Subscription Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subscription</DialogTitle>
            <DialogDescription>
              Subscribe to changes for an object type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objectType">Object Type</Label>
              <Select
                value={newSubscription.objectType}
                onValueChange={(value) =>
                  setNewSubscription((prev) => ({ ...prev, objectType: value }))
                }
              >
                <SelectTrigger id="objectType">
                  <SelectValue placeholder="Select object type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Risk">Risk</SelectItem>
                  <SelectItem value="Budget">Budget</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                  <SelectItem value="Objective">Objective</SelectItem>
                  <SelectItem value="Milestone">Milestone</SelectItem>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="Alert">Alert</SelectItem>
                  <SelectItem value="Intervention">Intervention</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL (optional)</Label>
              <Input
                id="webhookUrl"
                value={newSubscription.webhookUrl}
                onChange={(e) =>
                  setNewSubscription((prev) => ({ ...prev, webhookUrl: e.target.value }))
                }
                placeholder="https://your-webhook.com/callback"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to receive events via the live stream only
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createSubscriptionMutation.mutate(newSubscription)}
              disabled={!newSubscription.objectType || createSubscriptionMutation.isPending}
            >
              {createSubscriptionMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              {selectedEvent?.eventType} event for {selectedEvent?.objectType}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Event ID</span>
                  <span className="font-mono text-sm">{selectedEvent.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Object Type</span>
                  <Badge variant="outline">{selectedEvent.objectType}</Badge>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Object ID</span>
                  <span className="font-mono text-sm">{selectedEvent.objectId}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Event Type</span>
                  <Badge className={getEventTypeColor(selectedEvent.eventType)}>
                    {selectedEvent.eventType}
                  </Badge>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span>{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                </div>
              </div>
              {selectedEvent.changes && Object.keys(selectedEvent.changes).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Changes</h4>
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    {Object.entries(selectedEvent.changes).map(([field, change]) => (
                      <div key={field} className="text-sm">
                        <span className="font-medium">{field}:</span>
                        <div className="flex items-center gap-2 mt-1 pl-4">
                          <span className="text-red-600 line-through">
                            {JSON.stringify(change.old)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-green-600">{JSON.stringify(change.new)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
