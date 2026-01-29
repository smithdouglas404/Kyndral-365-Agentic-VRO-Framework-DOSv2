import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, AlertCircle } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber } from '@/hooks/useAgentAttributes';

export function DependencyGraphWidget() {
  const { data: planningAttributes } = useAgentAttributes('planning');
  const attrMap = getAttributeMap(planningAttributes?.attributes || []);

  // Dependency metrics from Planning agent
  const totalDeps = parseAttributeNumber(attrMap.total_dependencies?.value) ?? 0;
  const blockedDeps = parseAttributeNumber(attrMap.blocked_dependencies?.value) ?? 0;
  const criticalDeps = parseAttributeNumber(attrMap.critical_path_dependencies?.value) ?? 0;
  const externalDeps = parseAttributeNumber(attrMap.external_dependencies?.value) ?? 0;

  const stats = [
    {
      label: 'Total Dependencies',
      value: totalDeps,
      availability: attrMap.total_dependencies?.availability,
    },
    {
      label: 'Blocked',
      value: blockedDeps,
      alert: blockedDeps > 0,
      availability: attrMap.blocked_dependencies?.availability,
    },
    {
      label: 'Critical Path',
      value: criticalDeps,
      alert: criticalDeps > 5,
      availability: attrMap.critical_path_dependencies?.availability,
    },
    {
      label: 'External',
      value: externalDeps,
      availability: attrMap.external_dependencies?.availability,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Network className="h-5 w-5 text-purple-600" />
          Dependency Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">{stat.label}</span>
                {stat.availability && <AttributeStatusBadge availability={stat.availability} />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                {stat.alert && <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border">
          <p className="text-xs text-slate-600">
            {blockedDeps > 0
              ? `⚠️ ${blockedDeps} blocked dependencies require immediate attention`
              : '✓ No blocked dependencies'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
