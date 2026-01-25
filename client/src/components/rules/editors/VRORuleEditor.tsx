import { RuleEditorBase, AttributeDefinition, ActionDefinition } from './RuleEditorBase';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, DollarSign, Users } from 'lucide-react';

const VRO_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'value_realization_score',
    label: 'Value Realization Score',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Overall score (0-100) of value delivered vs planned',
  },
  {
    id: 'business_case_roi',
    label: 'Business Case ROI %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Return on investment percentage',
  },
  {
    id: 'benefit_realization_percent',
    label: 'Benefit Realization %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage of planned benefits realized',
  },
  {
    id: 'value_at_risk',
    label: 'Value at Risk ($)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Dollar value of benefits at risk',
  },
  {
    id: 'okr_progress_percent',
    label: 'OKR Progress %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Progress toward linked OKRs',
  },
  {
    id: 'customer_satisfaction_score',
    label: 'Customer Satisfaction (CSAT)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Customer satisfaction score (0-100)',
  },
  {
    id: 'nps_score',
    label: 'NPS (Net Promoter Score)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Net Promoter Score (-100 to +100)',
  },
  {
    id: 'time_to_value_days',
    label: 'Time to Value (Days)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Days until benefits start materializing',
  },
  {
    id: 'stakeholder_satisfaction',
    label: 'Stakeholder Satisfaction %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Stakeholder satisfaction percentage',
  },
  {
    id: 'value_gap',
    label: 'Value Gap ($)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Difference between planned and actual value',
  },
];

const VRO_ACTIONS: ActionDefinition[] = [
  {
    id: 'alert_vro',
    label: 'Alert VRO Team',
    description: 'Send notification to Value Realization team',
  },
  {
    id: 'trigger_business_case_review',
    label: 'Trigger Business Case Review',
    description: 'Schedule business case reassessment',
  },
  {
    id: 'update_value_dashboard',
    label: 'Update Value Dashboard',
    description: 'Refresh value tracking dashboard',
  },
  {
    id: 'escalate_value_gap',
    label: 'Escalate Value Gap',
    description: 'Bring value shortfall to leadership',
  },
  {
    id: 'request_benefit_tracking',
    label: 'Request Benefit Tracking Update',
    description: 'Request updated benefit measurements',
  },
  {
    id: 'collaborate_finops',
    label: 'Collaborate with FinOps',
    description: 'Assess financial impact on value',
    requiresTarget: true,
  },
  {
    id: 'collaborate_pmo',
    label: 'Collaborate with PMO',
    description: 'Review project delivery impact',
    requiresTarget: true,
  },
  {
    id: 'run_value_simulation',
    label: 'Run Value Simulation',
    description: 'Execute value projection model',
  },
];

export function VRORuleEditor() {
  const specialFeatures = (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target size={20} className="text-purple-600" />
          Value Realization & Benefits Tracking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-red-600" />
              <strong className="text-gray-900">Value Risk Indicators</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Value Realization &lt; 70% = At risk</li>
              <li>• Business Case ROI &lt; Target = Review</li>
              <li>• Value Gap &gt; $100k = Escalate</li>
              <li>• CSAT &lt; 60% = Customer dissatisfaction</li>
              <li>• NPS &lt; 0 = Detractors exceed promoters</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-green-600" />
              <strong className="text-gray-900">Strong Value Delivery</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Value Realization &gt;= 90% = On track</li>
              <li>• ROI exceeds business case = Excellent</li>
              <li>• Benefit Realization &gt; 85% = Good</li>
              <li>• CSAT &gt; 80% = Satisfied customers</li>
              <li>• NPS &gt; 50 = Strong promoters</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-purple-600" />
              <strong className="text-gray-900">Value Metrics</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• ROI = (Benefit - Cost) / Cost × 100%</li>
              <li>• Value Gap = Planned Value - Actual Value</li>
              <li>• Benefit Realization % = Delivered / Planned</li>
              <li>• Time to Value = First measurable benefit</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-600" />
              <strong className="text-gray-900">Common Rules</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• Value Realization &lt; 70% → Business Case Review</li>
              <li>• Value Gap &gt; $100k → Escalate</li>
              <li>• CSAT &lt; 60% → Alert Stakeholders</li>
              <li>• ROI below target → Run Value Simulation</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
          <p className="font-medium mb-1">💡 Best Practice:</p>
          <p>
            Link VRO rules to OKRs and business case commitments. Track both financial value (ROI, cost savings)
            and non-financial value (customer satisfaction, employee engagement). Set early warning thresholds
            at 70-80% of target to allow course correction before major value erosion.
          </p>
        </div>

        {/* Value Simulation Example */}
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target size={16} />
            Value Realization Zones
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                Exceeding (≥100%)
              </div>
              <span className="text-xs text-gray-700">Delivering above planned value</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                On Track (85-99%)
              </div>
              <span className="text-xs text-gray-700">Meeting value targets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">
                At Risk (70-84%)
              </div>
              <span className="text-xs text-gray-700">Value shortfall likely</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                Critical (&lt;70%)
              </div>
              <span className="text-xs text-gray-700">Major value gap, immediate action needed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <RuleEditorBase
      agentType="vro"
      agentLabel="VRO (Value Realization Office)"
      agentColor="#a855f7"
      attributes={VRO_ATTRIBUTES}
      actions={VRO_ACTIONS}
      specialFeatures={specialFeatures}
    />
  );
}
