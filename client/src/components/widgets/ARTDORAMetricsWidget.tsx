import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeText } from '@/hooks/useAgentAttributes';

export function ARTDORAMetricsWidget() {
  const { data: pmoAttributes } = useAgentAttributes('pmo');
  const attrMap = getAttributeMap(pmoAttributes?.attributes || []);

  // DORA metrics from PMO agent
  const deploymentFreq = parseAttributeText(attrMap.deployment_frequency?.value);
  const leadTime = parseAttributeText(attrMap.lead_time_for_changes?.value);
  const changeFailure = parseAttributeText(attrMap.change_failure_rate?.value);
  const mttr = parseAttributeText(attrMap.mean_time_to_restore?.value);

  const metrics = [
    {
      label: 'Deployment Frequency',
      value: deploymentFreq || '--',
      availability: attrMap.deployment_frequency?.availability,
    },
    {
      label: 'Lead Time for Changes',
      value: leadTime || '--',
      availability: attrMap.lead_time_for_changes?.availability,
    },
    {
      label: 'Change Failure Rate',
      value: changeFailure || '--',
      availability: attrMap.change_failure_rate?.availability,
    },
    {
      label: 'MTTR',
      value: mttr || '--',
      availability: attrMap.mean_time_to_restore?.availability,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">DORA Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span>{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{metric.value}</span>
              {metric.availability && <AttributeStatusBadge availability={metric.availability} />}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
