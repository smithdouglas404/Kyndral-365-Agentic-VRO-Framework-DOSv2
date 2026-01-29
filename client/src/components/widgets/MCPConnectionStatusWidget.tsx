import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export function MCPConnectionStatusWidget({ agentId = 'pmo' }: { agentId?: string }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: mcps, refetch } = useQuery({
    queryKey: ['agent-mcps', agentId],
    queryFn: () => fetchJson<any>(`/api/agent-mcp/agent/${agentId}/mcps`),
    staleTime: 30_000,
  });

  const mcpList = Array.isArray(mcps?.mcps) ? mcps.mcps : Array.isArray(mcps) ? mcps : [];

  const handleToggle = async (connectionId: string | undefined, enabled: boolean) => {
    if (!connectionId) return;

    try {
      setUpdatingId(connectionId);
      await fetch(`/api/admin/agent-mcp-connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      await refetch();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          MCP Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mcpList.length === 0 && (
          <div className="text-sm text-slate-400">No MCP connections available for {agentId}.</div>
        )}
        {mcpList.slice(0, 5).map((item: any) => (
          <div
            key={item.id || item.connectionId}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <div className="text-sm font-semibold">{item.name || item.displayName || 'MCP Connection'}</div>
              <div className="text-xs text-slate-500">
                {item.callCount ?? 0} calls · {item.successRate ?? 0}% success
              </div>
            </div>
            <Switch
              checked={item.enabled ?? true}
              onCheckedChange={(value) => handleToggle(item.connectionId || item.id, value)}
              disabled={updatingId === (item.connectionId || item.id)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
