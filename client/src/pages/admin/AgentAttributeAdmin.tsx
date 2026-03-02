import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes } from '@/hooks/useAgentAttributes';

interface Agent {
  id: string;
  name: string;
  enabled: boolean;
}

export default function AgentAttributeAdmin() {
  // Fetch agents from API
  const { data: agentsData, isLoading: agentsLoading } = useQuery<{ agents: Agent[] }>({
    queryKey: ['agents-enabled'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agents?enabled=true');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
  });
  const AGENTS = (agentsData?.agents || []).map(a => ({ id: a.id, label: a.name }));
  const [selectedAgent, setSelectedAgent] = useState('');

  // Set first agent as selected when agents load
  if (AGENTS.length > 0 && !selectedAgent) {
    setSelectedAgent(AGENTS[0].id);
  }
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [value, setValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'admin_required' | 'mcp_required' | 'missing' | 'available'>('all');
  const [saving, setSaving] = useState(false);

  const { data, refetch } = useAgentAttributes(selectedAgent, true);

  const attributes = useMemo(() => data?.attributes || [], [data]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return attributes;
    return attributes.filter((attr) => attr.availability === statusFilter);
  }, [attributes, statusFilter]);

  const handleSave = async () => {
    if (!selectedAttribute || value.trim().length === 0) return;

    setSaving(true);
    try {
      await fetch('/api/mem0/write-fact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'admin_input',
          attribute: selectedAttribute,
          value: value,
          sourceAgent: selectedAgent,
          confidence: 1.0,
        }),
      });

      setValue('');
      await refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Attribute Inputs</h1>
          <p className="text-sm text-muted-foreground">Provide manual values for agent attributes when MCP feeds are unavailable.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manual Attribute Entry</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {AGENTS.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Attribute</Label>
              <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select attribute" />
                </SelectTrigger>
                <SelectContent>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.name} value={attr.name}>
                      {attr.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter value" />
            </div>
            <div className="md:col-span-3">
              <Button onClick={handleSave} disabled={saving || !selectedAttribute}>
                {saving ? 'Saving...' : 'Save Value'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-lg">Attribute Status</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {['all', 'admin_required', 'mcp_required', 'missing', 'available'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status as any)}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.map((attr) => (
                <div key={attr.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-semibold">{attr.displayName}</div>
                    <div className="text-xs text-muted-foreground">{attr.name}</div>
                    {attr.lastUpdated && (
                      <div className="text-xs text-muted-foreground">Updated {new Date(attr.lastUpdated).toLocaleString()}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <AttributeStatusBadge availability={attr.availability} />
                    {attr.value && (
                      <Badge variant="outline" className="text-xs">{attr.value}</Badge>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground">No attributes for this filter.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
