import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';

type Severity = 'critical' | 'high' | 'warning' | 'info' | 'good';
type TileKind = 'metric' | 'list' | 'rank' | 'table' | 'heatmap' | 'narrative';

interface TilePayload {
  id: string;
  title: string;
  description: string;
  available: boolean;
  reason?: string;
  kind?: TileKind;
  metric?: { value: number | string; label: string; severity?: Severity; sublabel?: string };
  items?: Array<{ id?: string; label: string; sublabel?: string; severity?: Severity; value?: string | number; linkTo?: string }>;
  table?: { columns: string[]; rows: Array<Array<string | number>> };
  heatmap?: { x: string[]; y: string[]; values: number[][]; legend?: string };
  narrative?: string;
  context?: string;
  computeMs?: number;
}

const SEV: Record<Severity, { dot: string; text: string; bg: string; border: string }> = {
  critical: { dot: 'bg-red-600',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-300' },
  high:     { dot: 'bg-orange-500',  text: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-300' },
  warning:  { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300' },
  info:     { dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300' },
  good:     { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
};

const SIZE_CLASS = { sm: 'col-span-1', md: 'col-span-1', lg: 'col-span-2', xl: 'col-span-3' };

interface InsightTileProps {
  tileId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function InsightTile({ tileId, size = 'md' }: InsightTileProps) {
  const { data, isLoading, isFetching, refetch, isError } = useQuery<TilePayload>({
    queryKey: [`/api/agent-lens/insight/${tileId}`],
    queryFn: async () => {
      const r = await fetch(`/api/agent-lens/insight/${tileId}`);
      return r.json();
    },
  });

  return (
    <Card className={`${SIZE_CLASS[size]} flex flex-col`} data-testid={`tile-${tileId}`}>
      <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold leading-tight" data-testid={`tile-title-${tileId}`}>
            {data?.title || tileId}
          </CardTitle>
          {data?.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{data.description}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => refetch()} disabled={isFetching} data-testid={`button-refresh-${tileId}`}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {isLoading && <TileSkeleton />}
        {!isLoading && isError && (
          <div className="text-xs text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Failed to load</div>
        )}
        {!isLoading && data && !data.available && <UnavailableState reason={data.reason} />}
        {!isLoading && data && data.available && <TileBody data={data} />}

        {data?.context && data.available && (
          <p className="text-[11px] text-muted-foreground italic mt-3 pt-2 border-t">
            {data.context}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TileSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function UnavailableState({ reason }: { reason?: string }) {
  return (
    <div className="rounded-md bg-slate-50 border border-dashed border-slate-300 p-3 flex items-start gap-2" data-testid="state-unavailable">
      <Database className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="text-xs text-slate-600">
        <div className="font-medium text-slate-700 mb-0.5">Data not yet available</div>
        <div className="text-[11px] leading-relaxed">{reason || 'The required data is not in Palantir Foundry yet.'}</div>
      </div>
    </div>
  );
}

function TileBody({ data }: { data: TilePayload }) {
  const kind = data.kind || 'metric';

  if (kind === 'narrative' && data.narrative) {
    return <div className="text-xs whitespace-pre-wrap leading-relaxed" data-testid="tile-narrative">{data.narrative}</div>;
  }

  if (kind === 'heatmap' && data.heatmap) {
    const { x, y, values } = data.heatmap;
    const max = Math.max(1, ...values.flat());
    return (
      <div className="overflow-auto" data-testid="tile-heatmap">
        <table className="text-[10px] border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th></th>
              {x.map(col => <th key={col} className="px-1 py-0.5 text-left font-normal text-muted-foreground">{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {y.map((row, i) => (
              <tr key={row}>
                <td className="pr-2 text-right text-muted-foreground">{row}</td>
                {x.map((_, j) => {
                  const v = values[i][j];
                  const intensity = v / max;
                  return (
                    <td key={j} className="text-center font-mono"
                        style={{
                          backgroundColor: v === 0 ? '#f8fafc' : `rgba(59, 130, 246, ${0.15 + intensity * 0.7})`,
                          color: intensity > 0.5 ? 'white' : '#1e293b',
                          minWidth: 32, padding: '4px 8px', borderRadius: 3,
                        }}>{v}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {data.heatmap.legend && <div className="text-[10px] text-muted-foreground mt-2">{data.heatmap.legend}</div>}
      </div>
    );
  }

  if (kind === 'table' && data.table) {
    return (
      <div className="overflow-auto max-h-72" data-testid="tile-table">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0">
            <tr>{data.table.columns.map(c => <th key={c} className="text-left px-2 py-1.5 font-medium">{c}</th>)}</tr>
          </thead>
          <tbody>
            {data.table.rows.map((row, i) => (
              <tr key={i} className="border-b">
                {row.map((cell, j) => <td key={j} className="px-2 py-1.5 font-mono text-[11px]">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Default: metric + list/rank
  return (
    <div className="space-y-3">
      {data.metric && (
        <div className="flex items-baseline gap-2" data-testid="tile-metric">
          <div className={`text-3xl font-bold ${data.metric.severity ? SEV[data.metric.severity].text : ''}`}>
            {data.metric.value}
          </div>
          <div className="text-xs text-muted-foreground">{data.metric.label}</div>
        </div>
      )}
      {data.metric?.sublabel && <div className="text-[11px] text-muted-foreground -mt-2">{data.metric.sublabel}</div>}

      {data.items && data.items.length > 0 && (
        <ul className="space-y-1.5" data-testid="tile-items">
          {data.items.map((it, i) => {
            const sev = it.severity ? SEV[it.severity] : null;
            const body = (
              <li className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded ${sev ? `${sev.bg} border ${sev.border}` : 'bg-muted/30'} ${it.linkTo ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''}`}
                  data-testid={`tile-item-${i}`}>
                {sev && <div className={`w-1.5 h-1.5 rounded-full ${sev.dot} mt-1.5 shrink-0`} />}
                <div className="min-w-0 flex-1">
                  <div className={`font-medium ${it.linkTo ? '' : 'truncate'}`}>{it.label}</div>
                  {it.sublabel && <div className="text-[10px] text-muted-foreground truncate">{it.sublabel}</div>}
                </div>
                {it.value !== undefined && <div className="text-xs font-mono shrink-0">{typeof it.value === 'number' ? it.value.toLocaleString() : it.value}</div>}
              </li>
            );
            return it.linkTo
              ? <Link key={i} href={it.linkTo}>{body}</Link>
              : <div key={i}>{body}</div>;
          })}
        </ul>
      )}

      {data.items && data.items.length === 0 && !data.metric && (
        <div className="text-xs text-muted-foreground text-center py-4">No items match — all clear.</div>
      )}
    </div>
  );
}
