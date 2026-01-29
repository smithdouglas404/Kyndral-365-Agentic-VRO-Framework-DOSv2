import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2 } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber } from '@/hooks/useAgentAttributes';

export function DecisionQueueWidget() {
  const { data: governanceAttributes } = useAgentAttributes('governance');
  const attrMap = getAttributeMap(governanceAttributes?.attributes || []);

  // Decision queue metrics from Governance agent
  const pendingDecisions = parseAttributeNumber(attrMap.pending_governance_decisions?.value) ?? 0;
  const autoApproved = parseAttributeNumber(attrMap.auto_approved_actions?.value) ?? 0;
  const budgetExceptions = parseAttributeNumber(attrMap.budget_exceptions?.value) ?? 0;

  const queueStats = [
    {
      label: 'Pending Governance Decisions',
      value: pendingDecisions,
      alert: pendingDecisions > 5,
      availability: attrMap.pending_governance_decisions?.availability,
    },
    {
      label: 'Budget Exceptions',
      value: budgetExceptions,
      alert: budgetExceptions > 0,
      availability: attrMap.budget_exceptions?.availability,
    },
    {
      label: 'Auto-Approved Actions',
      value: autoApproved,
      availability: attrMap.auto_approved_actions?.availability,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          Decision & Action Board
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {queueStats.map((stat, index) => (
          <div key={index} className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">{stat.label}</span>
              {stat.availability && <AttributeStatusBadge availability={stat.availability} />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">{stat.value}</span>
              {stat.alert && (
                <Badge variant="destructive" className="text-xs">
                  Action Required
                </Badge>
              )}
              {!stat.alert && stat.value === 0 && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>
        ))}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
          {pendingDecisions > 0
            ? `📋 ${pendingDecisions} decision${pendingDecisions > 1 ? 's' : ''} awaiting approval`
            : '✓ All governance decisions processed'}
        </div>
      </CardContent>
    </Card>
  );
}
