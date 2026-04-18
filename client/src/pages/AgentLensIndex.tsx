import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Layers } from 'lucide-react';

interface AgentTile { id: string; title: string; description: string; size: string; }
interface AgentMeta {
  id: string; name: string; emoji: string; description: string;
  tileCount: number; tiles: AgentTile[];
}

export default function AgentLensIndex() {
  const { data, isLoading } = useQuery<{ agents: AgentMeta[] }>({
    queryKey: ['/api/agent-lens/agents'],
    queryFn: async () => (await fetch('/api/agent-lens/agents')).json(),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Agent Lens</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Each agent's view answers a curated set of high-value PMO/VRO/FinOps/Risk questions
            grounded in live Palantir data. Tiles either show real numbers or honestly state
            what data is missing.
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {isLoading && <div className="text-sm text-muted-foreground">Loading agents…</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.agents.map(agent => (
            <Link key={agent.id} href={`/lens/${agent.id}`}>
              <Card className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all h-full" data-testid={`card-agent-${agent.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="text-2xl" aria-hidden>{agent.emoji}</div>
                      <CardTitle className="text-base truncate" data-testid={`text-agent-${agent.id}`}>{agent.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      <Layers className="h-3 w-3 mr-1" /> {agent.tileCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{agent.description}</p>
                  <ul className="text-[11px] space-y-1 mb-3">
                    {agent.tiles.slice(0, 4).map(t => (
                      <li key={t.id} className="flex items-center gap-1.5 text-slate-600">
                        <div className="w-1 h-1 bg-blue-400 rounded-full" />
                        <span className="truncate">{t.title}</span>
                      </li>
                    ))}
                    {agent.tiles.length > 4 && (
                      <li className="text-slate-400 italic">+ {agent.tiles.length - 4} more…</li>
                    )}
                  </ul>
                  <div className="flex items-center justify-end text-xs text-blue-600 font-medium">
                    Open lens <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
