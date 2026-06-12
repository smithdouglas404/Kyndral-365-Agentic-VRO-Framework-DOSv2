/**
 * DEEP AGENT MONITORING PAGE
 *
 * Monitor Deep Agent activities:
 * - View agent plans
 * - Track execution steps
 * - Review reflections and learnings
 * - Monitor A2A collaboration
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, Activity, MessageSquare, TrendingUp, CheckCircle, Clock, AlertCircle, Play } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OpenProjectStatusDot } from '@/openproject';

export default function DeepAgentMonitoring() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [runConfig, setRunConfig] = useState({ agentName: 'deep-finops', goal: '', context: {} });

  // Fetch available deep agents
  const { data: agentsData } = useQuery({
    queryKey: ['deep-agents'],
    queryFn: async () => {
      const token = getAccessToken();
      const res = await fetch('/api/deep-agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch deep agents');
      return res.json();
    },
  });

  // Fetch collaboration stats
  const { data: statsData } = useQuery({
    queryKey: ['deep-agent-collaboration-stats'],
    queryFn: async () => {
      const token = getAccessToken();
      const res = await fetch('/api/deep-agents/collaboration-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 10000, // Auto-refresh every 10s
  });

  // Fetch A2A messages
  const { data: messagesData } = useQuery({
    queryKey: ['deep-agent-messages', selectedAgent],
    queryFn: async () => {
      const token = getAccessToken();
      const params = selectedAgent !== 'all' ? `?agent=${selectedAgent}` : '';
      const res = await fetch(`/api/deep-agents/messages${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5s
  });

  // Run deep agent mutation
  const runAgentMutation = useMutation({
    mutationFn: async (config: { agentName: string; goal: string; context: any }) => {
      const token = getAccessToken();
      const res = await fetch('/api/deep-agents/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to run agent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deep-agent-collaboration-stats'] });
      queryClient.invalidateQueries({ queryKey: ['deep-agent-messages'] });
      toast.success('Deep agent execution completed');
      setShowRunDialog(false);
    },
    onError: () => {
      toast.error('Failed to run deep agent');
    },
  });

  const agents = agentsData?.agents || [];
  const stats = statsData?.stats || {};
  const messages = messagesData?.messages || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            Deep Agent Monitoring
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-3">
            Monitor agent planning, execution, reflection, and A2A collaboration
            <OpenProjectStatusDot showLabel />
          </p>
        </div>
        <Button onClick={() => setShowRunDialog(true)}>
          <Play className="h-4 w-4 mr-2" />
          Run Deep Agent
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With planning & reflection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCollaborations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              A2A interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cross-agent messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.summary?.mostActiveAgent || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leading collaboration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">
            <Brain className="h-4 w-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            A2A Messages ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent: any) => (
              <Card key={agent.name} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Enhanced intelligence with deep reasoning
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="bg-purple-500">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities?.map((cap: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Features</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Planning</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Reflection</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>A2A</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setRunConfig({ ...runConfig, agentName: agent.name });
                      setShowRunDialog(true);
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Agent
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* A2A Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Label>Filter by agent:</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent: any) => (
                  <SelectItem key={agent.name} value={agent.name}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {messages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No A2A messages yet. Run a deep agent to see collaboration.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {messages.map((msg: any, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold">{msg.from}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold">{msg.to}</span>
                      </div>
                      <Badge variant={msg.requiresResponse ? 'default' : 'secondary'}>
                        {msg.messageType.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(msg.payload, null, 2)}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>{new Date(msg.timestamp).toLocaleString()}</span>
                      {msg.requiresResponse && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Awaiting Response
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Messages by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.messagesByType || {}).map(([type, count]: any) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                      <Badge>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collaborations by Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.collaborationsByAgent || {}).map(([agent, count]: any) => (
                    <div key={agent} className="flex items-center justify-between">
                      <span className="text-sm">{agent}</span>
                      <Badge>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Run Agent Dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Run Deep Agent</DialogTitle>
            <DialogDescription>
              Execute a deep agent with planning, execution, and reflection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Agent</Label>
              <Select value={runConfig.agentName} onValueChange={(value) => setRunConfig({ ...runConfig, agentName: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent: any) => (
                    <SelectItem key={agent.name} value={agent.name}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Goal</Label>
              <Textarea
                placeholder="What should the agent accomplish?"
                value={runConfig.goal}
                onChange={(e) => setRunConfig({ ...runConfig, goal: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Context (JSON)</Label>
              <Textarea
                placeholder='{"projectId": "P123"}'
                onChange={(e) => {
                  try {
                    const context = JSON.parse(e.target.value || '{}');
                    setRunConfig({ ...runConfig, context });
                  } catch {}
                }}
                rows={2}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => runAgentMutation.mutate(runConfig)}
              disabled={!runConfig.goal || runAgentMutation.isPending}
            >
              {runAgentMutation.isPending ? 'Running...' : 'Run Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
