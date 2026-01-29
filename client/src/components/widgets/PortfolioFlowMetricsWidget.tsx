import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber } from '@/hooks/useAgentAttributes';

export function PortfolioFlowMetricsWidget() {
  // Portfolio flow metrics come from Planning agent
  const { data: planningAttributes } = useAgentAttributes('planning');
  const attrMap = getAttributeMap(planningAttributes?.attributes || []);

  const flowTime = parseAttributeNumber(attrMap.flow_time_avg?.value);
  const flowEfficiency = parseAttributeNumber(attrMap.flow_efficiency?.value);
  const flowLoad = parseAttributeNumber(attrMap.wip_count?.value);
  const flowVelocity = parseAttributeNumber(attrMap.throughput_rate?.value);

  const metrics = [
    {
      label: 'Flow Time',
      value: flowTime,
      unit: 'days',
      availability: attrMap.flow_time_avg?.availability
    },
    {
      label: 'Flow Efficiency',
      value: flowEfficiency ? Math.round(flowEfficiency * 100) : null,
      unit: '%',
      availability: attrMap.flow_efficiency?.availability
    },
    {
      label: 'Flow Load',
      value: flowLoad,
      unit: 'items',
      availability: attrMap.wip_count?.availability
    },
    {
      label: 'Flow Velocity',
      value: flowVelocity,
      unit: '/week',
      availability: attrMap.throughput_rate?.availability
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Portfolio Flow Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">{metric.label}</p>
              {metric.availability && <AttributeStatusBadge availability={metric.availability} />}
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {metric.value ?? '--'}
              {metric.value !== null && metric.unit && (
                <span className="text-sm text-slate-500 ml-1">{metric.unit}</span>
              )}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
