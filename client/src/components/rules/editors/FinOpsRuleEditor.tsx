import { RuleEditorBase, AttributeDefinition, ActionDefinition } from './RuleEditorBase';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

const FIN_OPS_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'cpi',
    label: 'CPI (Cost Performance Index)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'EV / AC - Measures cost efficiency. < 1.0 = over budget, > 1.0 = under budget',
  },
  {
    id: 'spi',
    label: 'SPI (Schedule Performance Index)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'EV / PV - Measures schedule efficiency',
  },
  {
    id: 'cv',
    label: 'CV (Cost Variance)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'EV - AC - Dollar amount over/under budget',
  },
  {
    id: 'budget_variance_percent',
    label: 'Budget Variance %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage over or under budget',
  },
  {
    id: 'ev',
    label: 'EV (Earned Value)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Value of work completed',
  },
  {
    id: 'ac',
    label: 'AC (Actual Cost)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Actual cost incurred',
  },
  {
    id: 'pv',
    label: 'PV (Planned Value)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Planned value of work scheduled',
  },
  {
    id: 'eac',
    label: 'EAC (Estimate at Completion)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Projected total cost at completion',
  },
  {
    id: 'forecast_variance',
    label: 'Forecast Variance',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Difference between BAC and EAC',
  },
  {
    id: 'burn_rate',
    label: 'Burn Rate',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Rate of spending per period',
  },
];

const FIN_OPS_ACTIONS: ActionDefinition[] = [
  {
    id: 'alert_finops',
    label: 'Alert FinOps Team',
    description: 'Send notification to FinOps team',
  },
  {
    id: 'alert_tmo',
    label: 'Alert TMO',
    description: 'Notify TMO of cost issues',
    requiresTarget: true,
  },
  {
    id: 'alert_pmo',
    label: 'Alert PMO',
    description: 'Notify PMO for escalation',
    requiresTarget: true,
  },
  {
    id: 'flag_budget_review',
    label: 'Flag for Budget Review',
    description: 'Add to budget review queue',
  },
  {
    id: 'trigger_reforecast',
    label: 'Trigger Reforecast',
    description: 'Initiate budget reforecasting process',
  },
  {
    id: 'freeze_spending',
    label: 'Freeze Spending',
    description: 'Temporarily halt new expenditures',
  },
  {
    id: 'collaborate_risk',
    label: 'Collaborate with Risk Agent',
    description: 'Initiate risk assessment',
    requiresTarget: true,
  },
];

export function FinOpsRuleEditor() {
  const specialFeatures = (
    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-emerald-600" />
          FinOps Key Metrics Quick Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-600" />
              <strong className="text-gray-900">Cost Overrun Indicators</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• CPI &lt; 0.9 = Significant cost overrun</li>
              <li>• CPI &lt; 0.85 = Critical cost issue</li>
              <li>• Budget Variance &gt; 10% = Review needed</li>
              <li>• EAC exceeds BAC by &gt; 15% = Escalate</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-600" />
              <strong className="text-gray-900">Healthy Performance</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• CPI &gt;= 0.95 = On track</li>
              <li>• CPI &gt; 1.0 = Under budget</li>
              <li>• Budget Variance &lt;= 5% = Acceptable</li>
              <li>• Burn rate stable = Good control</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <strong className="text-gray-900">EVM Formulas</strong>
            </div>
            <ul className="space-y-1 text-gray-700 font-mono text-xs">
              <li>• CPI = EV / AC</li>
              <li>• SPI = EV / PV</li>
              <li>• CV = EV - AC</li>
              <li>• EAC = BAC / CPI</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-blue-600" />
              <strong className="text-gray-900">Common Rules</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• CPI &lt; 0.85 → Alert TMO + PMO</li>
              <li>• Budget Variance &gt; 15% → Flag Review</li>
              <li>• Burn Rate spike &gt; 20% → Freeze Spending</li>
              <li>• EAC increase &gt; 10% → Trigger Reforecast</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
          <p className="font-medium mb-1">💡 Best Practice:</p>
          <p>
            Set multiple threshold levels (e.g., CPI &lt; 0.95 = Warning, CPI &lt; 0.85 = Critical)
            to create graduated escalation paths. Combine cost metrics with schedule metrics for
            comprehensive project health monitoring.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <RuleEditorBase
      agentType="finops"
      agentLabel="FinOps"
      agentColor="#10b981"
      attributes={FIN_OPS_ATTRIBUTES}
      actions={FIN_OPS_ACTIONS}
      specialFeatures={specialFeatures}
    />
  );
}
