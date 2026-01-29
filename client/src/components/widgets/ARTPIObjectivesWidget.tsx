import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeText } from '@/hooks/useAgentAttributes';

export function ARTPIObjectivesWidget() {
  const { data: planningAttributes } = useAgentAttributes('planning');
  const attrMap = getAttributeMap(planningAttributes?.attributes || []);

  // PI Objectives from Planning agent
  const obj1 = parseAttributeText(attrMap.pi_objective_1?.value);
  const obj1Status = parseAttributeText(attrMap.pi_objective_1_status?.value) || 'Planned';
  const obj2 = parseAttributeText(attrMap.pi_objective_2?.value);
  const obj2Status = parseAttributeText(attrMap.pi_objective_2_status?.value) || 'Planned';
  const obj3 = parseAttributeText(attrMap.pi_objective_3?.value);
  const obj3Status = parseAttributeText(attrMap.pi_objective_3_status?.value) || 'Planned';
  const obj4 = parseAttributeText(attrMap.pi_objective_4?.value);
  const obj4Status = parseAttributeText(attrMap.pi_objective_4_status?.value) || 'Planned';

  const objectives = [
    {
      name: obj1 || 'Objective 1',
      status: obj1Status,
      owner: 'Team Alpha',
      availability: attrMap.pi_objective_1?.availability,
    },
    {
      name: obj2 || 'Objective 2',
      status: obj2Status,
      owner: 'Team Beta',
      availability: attrMap.pi_objective_2?.availability,
    },
    {
      name: obj3 || 'Objective 3',
      status: obj3Status,
      owner: 'Team Gamma',
      availability: attrMap.pi_objective_3?.availability,
    },
    {
      name: obj4 || 'Objective 4',
      status: obj4Status,
      owner: 'Team Delta',
      availability: attrMap.pi_objective_4?.availability,
    },
  ];

  const objectivesByStatus = {
    Planned: objectives.filter(o => o.status === 'Planned'),
    Committed: objectives.filter(o => o.status === 'Committed'),
    Delivered: objectives.filter(o => o.status === 'Delivered'),
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          PI Objectives Board
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['Planned', 'Committed', 'Delivered'] as const).map((status) => (
          <div key={status} className="space-y-3">
            <div className="text-sm font-semibold text-slate-600">{status}</div>
            {objectivesByStatus[status].map((item, index) => (
              <div key={index} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-slate-900">{item.name}</div>
                  {item.availability && <AttributeStatusBadge availability={item.availability} />}
                </div>
                <div className="text-xs text-slate-500">{item.owner}</div>
              </div>
            ))}
            {objectivesByStatus[status].length === 0 && (
              <div className="text-xs text-slate-400 italic">No {status.toLowerCase()} objectives</div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
