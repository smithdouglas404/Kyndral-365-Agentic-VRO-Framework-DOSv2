import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Timer } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber } from '@/hooks/useAgentAttributes';

export function ValueStreamLeadTimeWidget() {
  // Value stream metrics come from PMO agent
  const { data: pmoAttributes } = useAgentAttributes('pmo');
  const attrMap = getAttributeMap(pmoAttributes?.attributes || []);

  const leadTime = parseAttributeNumber(attrMap.cycle_time_avg?.value) ?? 0;
  const target = 30; // TODO: Add target_cycle_time attribute

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="h-5 w-5 text-emerald-600" />
          Lead Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between mb-2">
          <div className="text-3xl font-semibold text-slate-900">{leadTime} days</div>
          {attrMap.cycle_time_avg?.availability && (
            <AttributeStatusBadge availability={attrMap.cycle_time_avg.availability} />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">Target: {target} days</p>
        <Progress value={Math.min(100, (target / leadTime) * 100)} className="mt-3" />
      </CardContent>
    </Card>
  );
}
