/**
 * Agent Activity Timeline
 * Shows chronological history of agent interventions, alerts, and A2A messages
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Bell, MessageSquare, TrendingUp, Clock, Users } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'intervention' | 'alert' | 'a2a_message' | 'pattern_detection' | 'fact_broadcast';
  timestamp: string;
  agentName: string;
  projectName?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metadata?: any;
}

export function AgentActivityTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivityHistory();
  }, []);

  const loadActivityHistory = async () => {
    try {
      // Check if demo mode is active
      const demoResponse = await fetch('/api/demo/status', { credentials: 'include' });
      const demoStatus = await demoResponse.json();

      if (demoStatus.active) {
        // Load demo data
        const dataResponse = await fetch('/api/demo/data', { credentials: 'include' });
        const demoData = await dataResponse.json();

        // Convert demo data to timeline events
        const timelineEvents: TimelineEvent[] = [];

        // Add interventions
        demoData.interventions?.forEach((intervention: any) => {
          timelineEvents.push({
            id: `intervention-${intervention.createdAt}`,
            type: 'intervention',
            timestamp: intervention.createdAt,
            agentName: intervention.agentType,
            projectName: intervention.projectName,
            severity: intervention.severity,
            title: `${intervention.agentType} Intervention`,
            description: intervention.message,
            metadata: intervention,
          });
        });

        // Add observations
        demoData.observations?.forEach((obs: any) => {
          const type = obs.type === 'pattern_detection' ? 'pattern_detection' :
                      obs.type === 'fact_broadcast' ? 'fact_broadcast' : 'a2a_message';

          timelineEvents.push({
            id: `${type}-${obs.observedAt || obs.broadcastAt || obs.sentAt}`,
            type,
            timestamp: obs.observedAt || obs.broadcastAt || obs.sentAt,
            agentName: obs.detectingAgent || obs.sourceAgent || obs.fromAgent,
            projectName: obs.projectName,
            severity: obs.urgency || 'medium',
            title: obs.pattern || `${obs.sourceAgent || obs.fromAgent} ${type.replace('_', ' ')}`,
            description: obs.description || obs.fact || obs.message,
            metadata: obs,
          });
        });

        // Sort by timestamp (most recent first)
        timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setEvents(timelineEvents);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading activity history:', error);
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'intervention':
        return <AlertTriangle className="w-4 h-4" />;
      case 'alert':
        return <Bell className="w-4 h-4" />;
      case 'a2a_message':
        return <MessageSquare className="w-4 h-4" />;
      case 'pattern_detection':
        return <TrendingUp className="w-4 h-4" />;
      case 'fact_broadcast':
        return <Users className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.type === filter);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Agent Activity Timeline</CardTitle>
        <CardDescription>
          Chronological history of agent interventions, alerts, and collaborations
        </CardDescription>

        <div className="flex gap-2 mt-4">
          <Badge
            variant={filter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('all')}
          >
            All
          </Badge>
          <Badge
            variant={filter === 'intervention' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('intervention')}
          >
            Interventions
          </Badge>
          <Badge
            variant={filter === 'pattern_detection' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('pattern_detection')}
          >
            Patterns
          </Badge>
          <Badge
            variant={filter === 'a2a_message' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('a2a_message')}
          >
            A2A Messages
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No activity found</div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredEvents.map((event, idx) => (
                <div
                  key={event.id}
                  className={`relative pl-8 pb-4 ${
                    idx < filteredEvents.length - 1 ? 'border-l-2 border-gray-200' : ''
                  }`}
                >
                  <div className={`absolute left-0 top-0 -ml-2 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center ${
                    getSeverityColor(event.severity).replace('bg-', 'border-').split(' ')[0]
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                  </div>

                  <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${getSeverityColor(event.severity)}`}>
                          {getIcon(event.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.agentName}
                            {event.projectName && ` • ${event.projectName}`}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {formatTimestamp(event.timestamp)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>

                    {event.metadata?.confidence && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Confidence: {(event.metadata.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
