/**
 * AGENT COLLABORATION PAGE
 * Visualize real-time agent collaboration and A2A message flow
 */

import { useState, useEffect } from 'react';
import { Activity, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentNetworkDiagram } from '@/components/visualizations/AgentNetworkDiagram';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function AgentCollaboration() {
  const [isWarRoomMode, setIsWarRoomMode] = useState(false);
  // Fetch orchestration status
  const { data: statusData } = useQuery({
    queryKey: ['orchestration', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/orchestration/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Fetch real agent activity
  const { data: activityData } = useQuery({
    queryKey: ['agent-activity', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/agent-activity/recent?limit=5');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Fetch activity stats
  const { data: activityStats } = useQuery({
    queryKey: ['agent-activity', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/agent-activity/stats?hours=24');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = [
    {
      label: 'Active Agents',
      value: activityStats?.activeAgents?.toString() || '10',
      description: 'Deep Agents online',
      color: 'text-green-600',
    },
    {
      label: 'A2A Messages',
      value: activityStats?.a2aMessages?.toString() || '0',
      description: 'Agent-to-Agent (24h)',
      color: 'text-blue-600',
    },
    {
      label: 'Collaboration Rules',
      value: activityStats?.collaborationRules?.toString() || '0',
      description: 'Active triggers',
      color: 'text-purple-600',
    },
    {
      label: 'Total Activity',
      value: activityStats?.totalActivity?.toString() || '0',
      description: 'Events (24h)',
      color: 'text-orange-600',
    },
  ];

  // Fullscreen API handlers
  const toggleWarRoomMode = () => {
    if (!isWarRoomMode) {
      // Enter fullscreen
      document.documentElement.requestFullscreen?.();
      setIsWarRoomMode(true);
    } else {
      // Exit fullscreen
      document.exitFullscreen?.();
      setIsWarRoomMode(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsWarRoomMode(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={cn(
      isWarRoomMode ? 'fixed inset-0 z-50 bg-slate-950 overflow-auto' : 'p-8'
    )}>
      <div className={cn(
        'mb-8 flex items-start justify-between',
        isWarRoomMode && 'p-6'
      )}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className={cn(
              'w-8 h-8',
              isWarRoomMode ? 'text-blue-400' : 'text-blue-500'
            )} />
            <h1 className={cn(
              'text-3xl font-bold',
              isWarRoomMode && 'text-white'
            )}>Agent Collaboration</h1>
          </div>
          <p className={cn(
            'text-muted-foreground',
            isWarRoomMode && 'text-slate-300'
          )}>
            Real-time visualization of Deep Agent communication and collaboration patterns
          </p>
        </div>

        <Button
          onClick={toggleWarRoomMode}
          variant={isWarRoomMode ? 'secondary' : 'outline'}
          size="lg"
          className="gap-2"
        >
          {isWarRoomMode ? (
            <>
              <Minimize2 className="w-4 h-4" />
              Exit War Room
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4" />
              War Room Mode
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid - Hidden in War Room Mode */}
      {!isWarRoomMode && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Network Diagram */}
      <div className={cn(
        isWarRoomMode ? 'p-6' : ''
      )}>
        <AgentNetworkDiagram warRoomMode={isWarRoomMode} />
      </div>

      {/* Activity Feed - Hidden in War Room Mode */}
      {!isWarRoomMode && (
        <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Agent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activityData?.activities && activityData.activities.length > 0 ? (
              activityData.activities.map((activity: any) => {
                const timeAgo = new Date(activity.createdAt);
                const now = new Date();
                const diffMs = now.getTime() - timeAgo.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const timeStr = diffMins < 1 ? 'Just now' :
                  diffMins < 60 ? `${diffMins}m ago` :
                  diffMins < 1440 ? `${Math.floor(diffMins / 60)}h ago` :
                  `${Math.floor(diffMins / 1440)}d ago`;

                const typeColor = activity.eventType === 'agent_to_agent' ? 'bg-blue-500' :
                  activity.eventType === 'detection' ? 'bg-yellow-500' :
                  activity.eventType === 'autonomous_action' ? 'bg-green-500' :
                  'bg-purple-500';

                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${typeColor}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.summary}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.primaryAgentName} • {timeStr}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No recent agent activity</p>
                <p className="text-xs mt-1">Agents will appear here when they start processing</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
