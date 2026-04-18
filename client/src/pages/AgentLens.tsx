import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Layers } from 'lucide-react';
import InsightTile from '@/components/lens/InsightTile';

interface AgentTile { id: string; title: string; description: string; size: 'sm' | 'md' | 'lg' | 'xl'; }
interface AgentMeta {
  id: string; name: string; emoji: string; description: string;
  tileCount: number; tiles: AgentTile[];
}

interface AgentLensProps { forceAgentId?: string }

export default function AgentLens({ forceAgentId }: AgentLensProps = {}) {
  const [, params] = useRoute('/lens/:agentId');
  const agentId = forceAgentId ?? params?.agentId;

  const { data: agent, isLoading } = useQuery<AgentMeta>({
    queryKey: [`/api/agent-lens/agent/${agentId}`],
    queryFn: async () => {
      const r = await fetch(`/api/agent-lens/agent/${agentId}`);
      if (!r.ok) throw new Error('agent not found');
      return r.json();
    },
    enabled: !!agentId,
  });

  if (!agentId) return <div className="p-8">No agent selected.</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/lens">
            <Button variant="ghost" size="sm" data-testid="link-back-to-lens-index">
              <ChevronLeft className="h-4 w-4 mr-1" /> All Agents
            </Button>
          </Link>
          {isLoading && <div className="text-sm text-muted-foreground">Loading agent…</div>}
          {agent && (
            <div className="flex items-center gap-3 flex-1">
              <div className="text-3xl" aria-hidden>{agent.emoji}</div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold flex items-center gap-2" data-testid="text-agent-name">
                  {agent.name}
                  <Badge variant="outline" className="text-[10px]">
                    <Layers className="h-3 w-3 mr-1" /> {agent.tileCount} insights
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground">{agent.description}</p>
              </div>
              <Link href="/chat">
                <Button variant="outline" size="sm" data-testid="link-open-chat">Ask Clarity →</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tile grid */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {agent && agent.tiles.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            No insights configured for this agent yet.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {agent?.tiles.map(t => <InsightTile key={t.id} tileId={t.id} size={t.size} />)}
        </div>
      </div>
    </div>
  );
}
