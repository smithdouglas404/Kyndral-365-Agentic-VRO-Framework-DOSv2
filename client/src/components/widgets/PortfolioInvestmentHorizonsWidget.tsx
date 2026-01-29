import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber } from '@/hooks/useAgentAttributes';

export function PortfolioInvestmentHorizonsWidget() {
  const { data: finopsAttributes } = useAgentAttributes('finops');
  const attrMap = getAttributeMap(finopsAttributes?.attributes || []);

  // Investment horizons from FinOps agent
  const h1Sustaining = parseAttributeNumber(attrMap.investment_h1_sustaining?.value);
  const h2Growth = parseAttributeNumber(attrMap.investment_h2_growth?.value);
  const h3Transformation = parseAttributeNumber(attrMap.investment_h3_transformation?.value);

  const horizons = [
    {
      label: 'H1 Sustaining',
      value: h1Sustaining,
      availability: attrMap.investment_h1_sustaining?.availability,
    },
    {
      label: 'H2 Growth',
      value: h2Growth,
      availability: attrMap.investment_h2_growth?.availability,
    },
    {
      label: 'H3 Transformation',
      value: h3Transformation,
      availability: attrMap.investment_h3_transformation?.availability,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Investment Horizons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {horizons.map((horizon, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{horizon.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{horizon.value ?? '--'}%</span>
                  {horizon.availability && <AttributeStatusBadge availability={horizon.availability} />}
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full">
                <div
                  className="h-3 rounded-full bg-emerald-500"
                  style={{ width: `${horizon.value ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
