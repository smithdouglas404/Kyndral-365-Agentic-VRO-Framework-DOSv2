import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber } from '@/hooks/useAgentAttributes';

export function ARTPredictabilityWidget() {
  // ART metrics come from PMO agent
  const { data: pmoAttributes } = useAgentAttributes('pmo');
  const attrMap = getAttributeMap(pmoAttributes?.attributes || []);

  const piPredictability = parseAttributeNumber(attrMap.delivery_predictability?.value) ?? 0;
  const target = 80;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600" />
          PI Predictability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between mb-2">
          <div className="text-3xl font-semibold text-slate-900">{piPredictability}%</div>
          {attrMap.delivery_predictability?.availability && (
            <AttributeStatusBadge availability={attrMap.delivery_predictability.availability} />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">Target: {target}%</p>
        <Progress value={piPredictability} className="mt-3" />
      </CardContent>
    </Card>
  );
}
