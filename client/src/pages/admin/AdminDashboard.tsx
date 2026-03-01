/**
 * ADMIN DASHBOARD
 * With Orchestrator Controls
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Database, Activity, CheckCircle, Play, Square, Zap, Clock, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInterval, setSelectedInterval] = useState('600000');
  const [selectedAgent, setSelectedAgent] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      return {
        totalUsers: 0,
        activeIntegrations: 0,
        agentsRunning: 9,
        systemHealth: 'healthy',
      };
    },
  });

  const { data: orchestratorStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['orchestrator-status'],
    queryFn: async () => {
      const res = await fetch('/api/admin/orchestrator/status', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: agentsList } = useQuery({
    queryKey: ['orchestrator-agents'],
    queryFn: async () => {
      const res = await fetch('/api/admin/orchestrator/agents', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
  });

  const startOrchestrator = useMutation({
    mutationFn: async (interval: number) => {
      const res = await fetch('/api/admin/orchestrator/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ interval }),
      });
      if (!res.ok) throw new Error('Failed to start');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Orchestrator Started', description: 'Continuous agent analysis is now running.' });
      queryClient.invalidateQueries({ queryKey: ['orchestrator-status'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const stopOrchestrator = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/orchestrator/stop', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to stop');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Orchestrator Stopped', description: 'Continuous analysis has been paused.' });
      queryClient.invalidateQueries({ queryKey: ['orchestrator-status'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const triggerAgent = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch('/api/admin/orchestrator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) throw new Error('Failed to trigger agent');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Agent Triggered', description: `${data.agentId} is now analyzing projects.` });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const isRunning = orchestratorStatus?.isRunning || false;

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="admin-dashboard-title">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">System overview and orchestrator controls</p>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.totalUsers || 0}
            color="blue"
          />
          <StatCard
            icon={Database}
            label="Active Integrations"
            value={stats?.activeIntegrations || 0}
            color="green"
          />
          <StatCard
            icon={Activity}
            label="Agents Available"
            value={agentsList?.agents?.length || 0}
            color="purple"
          />
          <StatCard
            icon={CheckCircle}
            label="System Health"
            value={stats?.systemHealth || 'Unknown'}
            color="green"
          />
        </div>

        <Card className="mb-8" data-testid="orchestrator-controls">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Continuous Orchestrator
                </CardTitle>
                <CardDescription>
                  Control the AI agent continuous analysis loop. Default: every 10 minutes. Adjust to balance cost vs responsiveness.
                </CardDescription>
              </div>
              <Badge variant={isRunning ? 'default' : 'secondary'} className={isRunning ? 'bg-green-500' : ''}>
                {isRunning ? 'Running' : 'Stopped'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Interval (how often agents run)</label>
                  <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                    <SelectTrigger data-testid="interval-select">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60000">1 minute (high credit usage)</SelectItem>
                      <SelectItem value="120000">2 minutes</SelectItem>
                      <SelectItem value="300000">5 minutes</SelectItem>
                      <SelectItem value="600000">10 minutes (recommended)</SelectItem>
                      <SelectItem value="900000">15 minutes</SelectItem>
                      <SelectItem value="1800000">30 minutes (minimal credit usage)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-6">
                  {!isRunning ? (
                    <Button 
                      onClick={() => startOrchestrator.mutate(Number(selectedInterval))}
                      disabled={startOrchestrator.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="start-orchestrator-btn"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => stopOrchestrator.mutate()}
                      disabled={stopOrchestrator.isPending}
                      variant="destructive"
                      data-testid="stop-orchestrator-btn"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  )}
                </div>
              </div>

              {orchestratorStatus && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Cycle Count</div>
                    <div className="text-2xl font-bold">{orchestratorStatus.cycleCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Active Scans</div>
                    <div className="text-2xl font-bold">{orchestratorStatus.activeScans || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">A2A Messages</div>
                    <div className="text-2xl font-bold">{orchestratorStatus.a2a?.totalMessages || 0}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8" data-testid="manual-trigger-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Manual Agent Trigger
            </CardTitle>
            <CardDescription>
              Run a specific agent on-demand without starting continuous orchestration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger data-testid="agent-select">
                    <SelectValue placeholder="Select an agent to trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentsList?.agents?.map((agent: { id: string; name: string }) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => selectedAgent && triggerAgent.mutate(selectedAgent)}
                disabled={!selectedAgent || triggerAgent.isPending}
                data-testid="trigger-agent-btn"
              >
                <Zap className="w-4 h-4 mr-2" />
                Trigger Agent
              </Button>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Note: Each agent run uses Anthropic API credits. Use sparingly.
            </p>
          </CardContent>
        </Card>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <ActionButton label="Manage Users" href="/admin/users" />
            <ActionButton label="Integrations" href="/admin/integrations" />
            <ActionButton label="Configure Agents" href="/admin/agents" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-6`} data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <Icon className="w-8 h-8 mb-3" />
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function ActionButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="block px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center font-medium"
      data-testid={`action-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      {label}
    </a>
  );
}
