import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  DollarSign,
  Clock,
  Shield,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Layers,
  Plug,
  Plus,
  Trash2,
  Database,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  ArrowUpDown,
  Cpu,
  Network,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface McpDefinition {
  id: string;
  name: string;
  display_name: string;
  type: 'knowledge' | 'governance';
  category: string;
  description: string;
  capabilities: string;
  enabled: boolean;
}

interface AgentConnection {
  connection_id: string;
  agent_id: string;
  mcp_id: string;
  enabled: boolean;
  priority: number;
  mcp_name: string;
  mcp_display_name: string;
  mcp_type: 'knowledge' | 'governance';
  mcp_category: string;
  mcp_description: string;
  mcp_capabilities: string;
  usage_count: number;
  last_used: string | null;
}

const AGENTS = [
  { id: 'finops', name: 'DeepFinOps', domain: 'Financial Operations', icon: DollarSign, color: 'text-green-500' },
  { id: 'tmo', name: 'DeepTMO', domain: 'Transformation Management', icon: Clock, color: 'text-blue-500' },
  { id: 'risk', name: 'DeepRisk', domain: 'Risk Management', icon: Shield, color: 'text-red-500' },
  { id: 'pmo', name: 'DeepPMO', domain: 'Portfolio Management', icon: Brain, color: 'text-purple-500' },
  { id: 'governance', name: 'DeepGovernance', domain: 'Governance & Compliance', icon: Lock, color: 'text-amber-500' },
  { id: 'vro', name: 'DeepVRO', domain: 'Value Realization', icon: TrendingUp, color: 'text-emerald-500' },
  { id: 'ocm', name: 'DeepOCM', domain: 'Change Management', icon: Users, color: 'text-cyan-500' },
  { id: 'planning', name: 'DeepPlanning', domain: 'Project Planning', icon: Calendar, color: 'text-indigo-500' },
  { id: 'okr', name: 'OKR Agent', domain: 'OKR & KPI Tracking', icon: Target, color: 'text-orange-500' },
  { id: 'integrated', name: 'Integrated Mgmt', domain: 'Cross-Agent Coordination', icon: Network, color: 'text-pink-500' },
  { id: 'notification', name: 'Notification Agent', domain: 'Palantir Gateway & HITL', icon: Cpu, color: 'text-rose-500' },
];

const CATEGORY_LABELS: Record<string, string> = {
  agile_ppm: 'Agile PPM',
  enterprise_ppm: 'Enterprise PPM',
  erp_finance: 'ERP / Finance',
  devops: 'DevOps',
  communication: 'Communication',
  enterprise_analytics: 'Enterprise Analytics',
  crm: 'CRM',
  hrm: 'HR Management',
  responsible_ai: 'Responsible AI',
  qa: 'Quality Assurance',
  policy: 'Policy',
  audit: 'Audit',
};

function parseCapabilities(cap: string | null): string[] {
  if (!cap) return [];
  try { return JSON.parse(cap); } catch { return []; }
}

export default function AgentMCPManager() {
  const [selectedAgent, setSelectedAgent] = useState<string>('finops');
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allMcps } = useQuery<McpDefinition[]>({
    queryKey: ['mcp-definitions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agent-mcp-connections/mcps');
      const data = await res.json();
      return data.mcps || [];
    },
  });

  const { data: agentConnections, isLoading: connectionsLoading } = useQuery<{
    connections: AgentConnection[];
    knowledgeMcps: AgentConnection[];
    governanceMcps: AgentConnection[];
  }>({
    queryKey: ['agent-connections', selectedAgent],
    queryFn: async () => {
      const res = await fetch(`/api/admin/agent-mcp-connections/agent/${selectedAgent}`);
      const data = await res.json();
      return {
        connections: data.connections || [],
        knowledgeMcps: data.knowledgeMcps || [],
        governanceMcps: data.governanceMcps || [],
      };
    },
    enabled: !!selectedAgent,
  });

  const { data: allAgentCounts } = useQuery<Record<string, number>>({
    queryKey: ['agent-mcp-counts'],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const agent of AGENTS) {
        const res = await fetch(`/api/admin/agent-mcp-connections/agent/${agent.id}`);
        const data = await res.json();
        counts[agent.id] = data.connections?.length || 0;
      }
      return counts;
    },
  });

  const connectMcp = useMutation({
    mutationFn: async ({ mcpId, priority }: { mcpId: string; priority: number }) => {
      const res = await fetch('/api/admin/agent-mcp-connections/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent, mcpId, priority }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-connections', selectedAgent] });
      queryClient.invalidateQueries({ queryKey: ['agent-mcp-counts'] });
      toast({ title: 'MCP Connected', description: 'Data source linked to agent successfully.' });
    },
  });

  const disconnectMcp = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch(`/api/admin/agent-mcp-connections/${connectionId}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-connections', selectedAgent] });
      queryClient.invalidateQueries({ queryKey: ['agent-mcp-counts'] });
      toast({ title: 'MCP Disconnected', description: 'Data source removed from agent.' });
    },
  });

  const toggleConnection = useMutation({
    mutationFn: async ({ connectionId, enabled }: { connectionId: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/agent-mcp-connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-connections', selectedAgent] });
    },
  });

  const connectedMcpIds = new Set(agentConnections?.connections?.map(c => c.mcp_id) || []);
  const availableMcps = (allMcps || []).filter(m => !connectedMcpIds.has(m.id));
  const filteredAvailable = availableMcps.filter(m =>
    m.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAgentInfo = AGENTS.find(a => a.id === selectedAgent)!;

  return (
    <AdminLayout
      title="Agent MCP Manager"
      description="Map data sources and governance MCPs to each agent. Each agent owns its domain-specific connections."
    >
      <div className="grid grid-cols-12 gap-6" data-testid="agent-mcp-manager">
        <div className="col-span-4 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agents</h3>
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const count = allAgentCounts?.[agent.id] ?? 0;
            const isSelected = selectedAgent === agent.id;
            return (
              <Card
                key={agent.id}
                data-testid={`agent-card-${agent.id}`}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected && 'ring-2 ring-primary border-primary'
                )}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg bg-muted', agent.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.domain}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        <Plug className="w-3 h-3 mr-1" />
                        {count}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = selectedAgentInfo.icon;
                return (
                  <>
                    <div className={cn('p-2 rounded-lg bg-muted', selectedAgentInfo.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{selectedAgentInfo.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedAgentInfo.domain}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <Button
              onClick={() => setShowConnectDialog(true)}
              size="sm"
              data-testid="btn-connect-mcp"
            >
              <Plus className="w-4 h-4 mr-1" />
              Connect MCP
            </Button>
          </div>

          {connectionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading connections...</div>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Knowledge MCPs
                  </CardTitle>
                  <CardDescription>Data sources this agent pulls from during scan cycles</CardDescription>
                </CardHeader>
                <CardContent>
                  {(agentConnections?.knowledgeMcps?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No knowledge MCPs connected</p>
                  ) : (
                    <div className="space-y-2">
                      {agentConnections?.knowledgeMcps?.map((conn) => (
                        <McpConnectionRow
                          key={conn.connection_id}
                          connection={conn}
                          onToggle={(enabled) => toggleConnection.mutate({ connectionId: conn.connection_id, enabled })}
                          onDisconnect={() => disconnectMcp.mutate(conn.connection_id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Governance MCPs
                  </CardTitle>
                  <CardDescription>Policy and compliance validators that gate agent actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {(agentConnections?.governanceMcps?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No governance MCPs connected</p>
                  ) : (
                    <div className="space-y-2">
                      {agentConnections?.governanceMcps?.map((conn) => (
                        <McpConnectionRow
                          key={conn.connection_id}
                          connection={conn}
                          onToggle={(enabled) => toggleConnection.mutate({ connectionId: conn.connection_id, enabled })}
                          onDisconnect={() => disconnectMcp.mutate(conn.connection_id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Connect MCP to {selectedAgentInfo.name}</DialogTitle>
            <DialogDescription>Choose a data source or governance MCP to connect</DialogDescription>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search MCPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-mcps"
            />
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1">
            {filteredAvailable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {availableMcps.length === 0 ? 'All MCPs are already connected' : 'No matching MCPs found'}
              </p>
            ) : (
              filteredAvailable.map((mcp) => (
                <div
                  key={mcp.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  data-testid={`available-mcp-${mcp.name}`}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{mcp.display_name}</p>
                      <Badge variant={mcp.type === 'governance' ? 'destructive' : 'secondary'} className="text-xs">
                        {mcp.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[mcp.category] || mcp.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mcp.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const priority = (agentConnections?.connections?.length ?? 0) + 1;
                      connectMcp.mutate({ mcpId: mcp.id, priority });
                      setShowConnectDialog(false);
                      setSearchTerm('');
                    }}
                    data-testid={`btn-connect-${mcp.name}`}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Connect
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function McpConnectionRow({
  connection,
  onToggle,
  onDisconnect,
}: {
  connection: AgentConnection;
  onToggle: (enabled: boolean) => void;
  onDisconnect: () => void;
}) {
  const capabilities = parseCapabilities(connection.mcp_capabilities);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        connection.enabled ? 'bg-background' : 'bg-muted/50 opacity-60'
      )}
      data-testid={`connection-${connection.mcp_name}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{connection.mcp_display_name}</p>
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[connection.mcp_category] || connection.mcp_category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            P{connection.priority}
          </Badge>
          {connection.usage_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {connection.usage_count} calls
            </Badge>
          )}
        </div>
        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {capabilities.slice(0, 4).map((cap, i) => (
              <span key={i} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {cap}
              </span>
            ))}
            {capabilities.length > 4 && (
              <span className="text-xs text-muted-foreground">+{capabilities.length - 4} more</span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={connection.enabled}
          onCheckedChange={onToggle}
          data-testid={`toggle-${connection.mcp_name}`}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          className="text-destructive hover:text-destructive"
          data-testid={`btn-disconnect-${connection.mcp_name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
