import { RuleEditorBase, AttributeDefinition, ActionDefinition } from './RuleEditorBase';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, AlertTriangle, TrendingUp, Target } from 'lucide-react';

const RISK_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'risk_score',
    label: 'Overall Risk Score',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Composite risk score (0-10 scale, 10 = highest risk)',
  },
  {
    id: 'critical_risks_count',
    label: 'Critical Risks Count',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of critical (red) risks in register',
  },
  {
    id: 'high_risks_count',
    label: 'High Risks Count',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of high (orange) risks',
  },
  {
    id: 'unmitigated_risks_count',
    label: 'Unmitigated Risks',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Risks without mitigation plans',
  },
  {
    id: 'risk_trend',
    label: 'Risk Trend',
    type: 'string',
    operators: ['==', '!='],
    description: 'Increasing, Stable, or Decreasing',
  },
  {
    id: 'probability_impact_score',
    label: 'Probability × Impact',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Highest individual risk P×I score',
  },
  {
    id: 'days_since_last_review',
    label: 'Days Since Last Review',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Days since risk register was reviewed',
  },
  {
    id: 'risks_realized_count',
    label: 'Risks Realized (Issues)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of risks that have materialized',
  },
  {
    id: 'mitigation_effectiveness',
    label: 'Mitigation Effectiveness %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage of risks with effective mitigations',
  },
  {
    id: 'external_risks_count',
    label: 'External Risks',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Risks outside team control',
  },
];

const RISK_ACTIONS: ActionDefinition[] = [
  {
    id: 'alert_risk',
    label: 'Alert Risk Team',
    description: 'Send notification to risk management team',
  },
  {
    id: 'alert_pmo',
    label: 'Alert PMO',
    description: 'Escalate to PMO for oversight',
    requiresTarget: true,
  },
  {
    id: 'trigger_risk_review',
    label: 'Trigger Risk Review',
    description: 'Schedule emergency risk review meeting',
  },
  {
    id: 'request_mitigation_plan',
    label: 'Request Mitigation Plan',
    description: 'Require mitigation plan submission',
  },
  {
    id: 'escalate_to_steering',
    label: 'Escalate to Steering Committee',
    description: 'Bring to executive steering committee',
  },
  {
    id: 'collaborate_finops',
    label: 'Collaborate with FinOps',
    description: 'Assess financial impact',
    requiresTarget: true,
  },
  {
    id: 'collaborate_tmo',
    label: 'Collaborate with TMO',
    description: 'Assess schedule impact',
    requiresTarget: true,
  },
  {
    id: 'update_risk_register',
    label: 'Update Risk Register',
    description: 'Automated risk register update',
  },
  {
    id: 'initiate_contingency_plan',
    label: 'Initiate Contingency Plan',
    description: 'Activate pre-defined contingency',
  },
];

export function RiskRuleEditor() {
  const specialFeatures = (
    <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldAlert size={20} className="text-red-600" />
          Risk Management Metrics & Scoring
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <strong className="text-gray-900">High Risk Indicators</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Overall Risk Score &gt; 7 = Critical</li>
              <li>• Critical Risks &gt;= 3 = Immediate action</li>
              <li>• Risk Trend = "Increasing" = Monitor closely</li>
              <li>• Unmitigated Risks &gt; 5 = Unacceptable</li>
              <li>• Days Since Review &gt; 14 = Overdue</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-green-600" />
              <strong className="text-gray-900">Healthy Risk Profile</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Overall Risk Score &lt;= 5 = Acceptable</li>
              <li>• Critical Risks = 0 = Good</li>
              <li>• Mitigation Effectiveness &gt; 80% = Strong</li>
              <li>• Risk Trend = "Decreasing" = Improving</li>
              <li>• Regular reviews (weekly) = Proactive</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-purple-600" />
              <strong className="text-gray-900">Risk Scoring Formula</strong>
            </div>
            <div className="space-y-2 text-gray-700 text-xs font-mono">
              <p>Risk Score = Probability × Impact</p>
              <div className="mt-2 space-y-1">
                <p className="font-sans">Probability Scale (1-5):</p>
                <p>1 = Rare, 2 = Unlikely, 3 = Possible</p>
                <p>4 = Likely, 5 = Almost Certain</p>
              </div>
              <div className="mt-2 space-y-1">
                <p className="font-sans">Impact Scale (1-5):</p>
                <p>1 = Minimal, 2 = Minor, 3 = Moderate</p>
                <p>4 = Major, 5 = Catastrophic</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-amber-600" />
              <strong className="text-gray-900">Common Rules</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• Risk Score &gt; 8 → Escalate to Steering</li>
              <li>• Critical Risks &gt;= 3 → Emergency Review</li>
              <li>• Unmitigated &gt; 5 → Demand Plans</li>
              <li>• Risks Realized &gt; 2 → Root Cause Analysis</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
          <p className="font-medium mb-1">💡 Best Practice:</p>
          <p>
            Maintain a risk register with regular (weekly) reviews. Set automated rules for both new critical
            risks AND increasing risk trends. Integrate risk rules with cost and schedule rules - most project
            failures are predictable from risk indicators. Track mitigation effectiveness and adjust plans quarterly.
          </p>
        </div>

        {/* Risk Heat Map Example */}
        <div className="mt-4 p-4 bg-gradient-to-br from-yellow-100 to-red-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            Risk Heat Map (Probability × Impact)
          </h4>
          <div className="grid grid-cols-5 gap-1">
            {/* Header */}
            <div className="text-xs font-bold text-center py-2"></div>
            <div className="text-xs font-bold text-center py-2">1</div>
            <div className="text-xs font-bold text-center py-2">2</div>
            <div className="text-xs font-bold text-center py-2">3</div>
            <div className="text-xs font-bold text-center py-2">4</div>

            {/* Row 5 */}
            <div className="text-xs font-bold text-center py-2">5</div>
            <div className="h-8 bg-yellow-400 rounded flex items-center justify-center text-xs font-bold">5</div>
            <div className="h-8 bg-orange-400 rounded flex items-center justify-center text-xs font-bold">10</div>
            <div className="h-8 bg-red-400 rounded flex items-center justify-center text-xs font-bold">15</div>
            <div className="h-8 bg-red-600 rounded flex items-center justify-center text-xs font-bold text-white">20</div>

            {/* Row 4 */}
            <div className="text-xs font-bold text-center py-2">4</div>
            <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-bold">4</div>
            <div className="h-8 bg-yellow-400 rounded flex items-center justify-center text-xs font-bold">8</div>
            <div className="h-8 bg-orange-400 rounded flex items-center justify-center text-xs font-bold">12</div>
            <div className="h-8 bg-red-500 rounded flex items-center justify-center text-xs font-bold text-white">16</div>

            {/* Row 3 */}
            <div className="text-xs font-bold text-center py-2">3</div>
            <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-bold">3</div>
            <div className="h-8 bg-green-400 rounded flex items-center justify-center text-xs font-bold">6</div>
            <div className="h-8 bg-yellow-400 rounded flex items-center justify-center text-xs font-bold">9</div>
            <div className="h-8 bg-orange-400 rounded flex items-center justify-center text-xs font-bold">12</div>

            {/* Row 2 */}
            <div className="text-xs font-bold text-center py-2">2</div>
            <div className="h-8 bg-green-200 rounded flex items-center justify-center text-xs font-bold">2</div>
            <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-bold">4</div>
            <div className="h-8 bg-green-400 rounded flex items-center justify-center text-xs font-bold">6</div>
            <div className="h-8 bg-yellow-400 rounded flex items-center justify-center text-xs font-bold">8</div>

            {/* Row 1 */}
            <div className="text-xs font-bold text-center py-2">1</div>
            <div className="h-8 bg-green-100 rounded flex items-center justify-center text-xs font-bold">1</div>
            <div className="h-8 bg-green-200 rounded flex items-center justify-center text-xs font-bold">2</div>
            <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-bold">3</div>
            <div className="h-8 bg-green-400 rounded flex items-center justify-center text-xs font-bold">4</div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span>Low (1-6)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Medium (7-12)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span>High (13-16)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span>Critical (17-25)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <RuleEditorBase
      agentType="risk"
      agentLabel="Risk Management"
      agentColor="#ef4444"
      attributes={RISK_ATTRIBUTES}
      actions={RISK_ACTIONS}
      specialFeatures={specialFeatures}
    />
  );
}
