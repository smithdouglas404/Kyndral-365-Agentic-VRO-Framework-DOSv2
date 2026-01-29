import { Badge } from '@/components/ui/badge';
import type { AttributeAvailability } from '@/hooks/useAgentAttributes';
import { cn } from '@/lib/utils';

const statusConfig: Record<AttributeAvailability, { label: string; className: string }> = {
  available: { label: 'Live', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  admin_required: { label: 'Admin input', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  mcp_required: { label: 'MCP required', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  missing: { label: 'Missing', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export function AttributeStatusBadge({ availability, className }: { availability: AttributeAvailability; className?: string }) {
  const config = statusConfig[availability];
  return (
    <Badge variant="outline" className={cn('text-[10px]', config.className, className)}>
      {config.label}
    </Badge>
  );
}
