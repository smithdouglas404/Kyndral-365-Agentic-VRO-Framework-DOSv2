import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber, parseAttributeText } from '@/hooks/useAgentAttributes';

export function PredictionRiskForecastWidget() {
  const { data: riskAttributes } = useAgentAttributes('risk');
  const attrMap = getAttributeMap(riskAttributes?.attributes || []);

  // Risk predictions from Risk agent
  const budget14d = parseAttributeNumber(attrMap.budget_overrun_probability_14d?.value);
  const schedule14d = parseAttributeNumber(attrMap.schedule_delay_probability_14d?.value);
  const scope14d = parseAttributeNumber(attrMap.scope_creep_probability_14d?.value);
  const quality14d = parseAttributeNumber(attrMap.quality_issue_probability_14d?.value);

  const predictions = [
    {
      label: 'Budget Overrun Risk (14d)',
      probability: budget14d,
      severity: budget14d && budget14d > 70 ? 'high' : budget14d && budget14d > 40 ? 'medium' : 'low',
      availability: attrMap.budget_overrun_probability_14d?.availability,
    },
    {
      label: 'Schedule Delay Risk (14d)',
      probability: schedule14d,
      severity: schedule14d && schedule14d > 70 ? 'high' : schedule14d && schedule14d > 40 ? 'medium' : 'low',
      availability: attrMap.schedule_delay_probability_14d?.availability,
    },
    {
      label: 'Scope Creep Risk (14d)',
      probability: scope14d,
      severity: scope14d && scope14d > 70 ? 'high' : scope14d && scope14d > 40 ? 'medium' : 'low',
      availability: attrMap.scope_creep_probability_14d?.availability,
    },
    {
      label: 'Quality Issue Risk (14d)',
      probability: quality14d,
      severity: quality14d && quality14d > 70 ? 'high' : quality14d && quality14d > 40 ? 'medium' : 'low',
      availability: attrMap.quality_issue_probability_14d?.availability,
    },
  ];

  const severityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Risk Forecasts (Next 14 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {predictions.map((pred, index) => (
          <div key={index} className={`rounded-lg border p-3 ${severityColors[pred.severity]}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {pred.severity === 'high' && <AlertTriangle className="h-4 w-4" />}
                <span className="text-sm font-medium">{pred.label}</span>
              </div>
              {pred.availability && <AttributeStatusBadge availability={pred.availability} />}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{pred.probability ?? '--'}%</span>
              <Badge variant="outline" className="text-xs">
                {pred.severity} risk
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
