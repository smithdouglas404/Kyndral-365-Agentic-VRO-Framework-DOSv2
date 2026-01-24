import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertCircle, CheckCircle2, Clock, Pause, Play, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface AgentConfig {
  id: string;
  name: string;
  enabled: boolean;
  scanInterval: number;
  status: 'idle' | 'running' | 'error';
  lastRun?: string;
  lastRunDuration?: number;
  errorMessage?: string;
}

export function AgentMonitoringContent() {
  const { data: configs, isLoading } = useQuery<{ agents: AgentConfig[] }>({
    queryKey: ['agent-configs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agent-config');
      if (!res.ok) throw new Error('Failed to fetch agent configurations');
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const agents = configs?.agents || [];
  const activeAgents = agents.filter(a => a.enabled);
  const runningAgents = agents.filter(a => a.status === 'running');
  const errorAgents = agents.filter(a => a.status === 'error');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Agent Monitoring</h2>
        <p className="text-sm text-gray-500 mt-1">
          Real-time monitoring of AI agent activity and performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{agents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeAgents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">{runningAgents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold">{errorAgents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Agent Status</h3>

        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    {agent.enabled ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-gray-600 border-gray-400">
                        <Pause className="w-3 h-3" />
                        Disabled
                      </Badge>
                    )}
                    {agent.status === 'running' && (
                      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600 animate-pulse">
                        <Activity className="w-3 h-3" />
                        Running
                      </Badge>
                    )}
                    {agent.status === 'error' && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Scan interval: {agent.scanInterval} minutes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {agent.lastRun && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Last run: {format(new Date(agent.lastRun), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  {agent.lastRunDuration && (
                    <span className="text-muted-foreground">
                      Duration: {(agent.lastRunDuration / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              )}

              {agent.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing...</span>
                  </div>
                  <Progress value={66} className="h-2" />
                </div>
              )}

              {agent.errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>Error:</strong> {agent.errorMessage}
                  </p>
                </div>
              )}

              {!agent.enabled && (
                <p className="text-sm text-muted-foreground">
                  Agent is disabled. Enable in Agent Configuration to start monitoring.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Agents Configured</h3>
            <p className="text-muted-foreground">
              Configure agents in the Admin panel to start monitoring
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
