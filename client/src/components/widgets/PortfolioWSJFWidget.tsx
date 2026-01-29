import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber, parseAttributeText } from '@/hooks/useAgentAttributes';

export function PortfolioWSJFWidget() {
  const { data: vroAttributes } = useAgentAttributes('vro');
  const attrMap = getAttributeMap(vroAttributes?.attributes || []);

  // WSJF rankings from VRO agent
  const wsjf1Name = parseAttributeText(attrMap.wsjf_rank_1_name?.value);
  const wsjf1Score = parseAttributeNumber(attrMap.wsjf_rank_1_score?.value);
  const wsjf2Name = parseAttributeText(attrMap.wsjf_rank_2_name?.value);
  const wsjf2Score = parseAttributeNumber(attrMap.wsjf_rank_2_score?.value);
  const wsjf3Name = parseAttributeText(attrMap.wsjf_rank_3_name?.value);
  const wsjf3Score = parseAttributeNumber(attrMap.wsjf_rank_3_score?.value);

  const rankings = [
    {
      name: wsjf1Name || 'Initiative 1',
      score: wsjf1Score,
      availability: attrMap.wsjf_rank_1_score?.availability,
    },
    {
      name: wsjf2Name || 'Initiative 2',
      score: wsjf2Score,
      availability: attrMap.wsjf_rank_2_score?.availability,
    },
    {
      name: wsjf3Name || 'Initiative 3',
      score: wsjf3Score,
      availability: attrMap.wsjf_rank_3_score?.availability,
    },
  ];

  const maxScore = Math.max(...rankings.map(r => r.score || 0), 20);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          WSJF Prioritization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rankings.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item.score ?? '--'}</span>
                {item.availability && <AttributeStatusBadge availability={item.availability} />}
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div
                className="h-2 rounded-full bg-indigo-500"
                style={{ width: `${item.score ? Math.min((item.score / maxScore) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
