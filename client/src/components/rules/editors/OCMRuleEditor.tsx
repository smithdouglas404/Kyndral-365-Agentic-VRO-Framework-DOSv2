import { RuleEditorBase, AttributeDefinition, ActionDefinition } from './RuleEditorBase';
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, AlertCircle, Target, Heart } from 'lucide-react';

const OCM_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'adkar_awareness_percent',
    label: 'ADKAR: Awareness %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Awareness of need for change (ADKAR Step 1)',
  },
  {
    id: 'adkar_desire_percent',
    label: 'ADKAR: Desire %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Desire to support the change (ADKAR Step 2)',
  },
  {
    id: 'adkar_knowledge_percent',
    label: 'ADKAR: Knowledge %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Knowledge of how to change (ADKAR Step 3)',
  },
  {
    id: 'adkar_ability_percent',
    label: 'ADKAR: Ability %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Ability to implement change (ADKAR Step 4)',
  },
  {
    id: 'adkar_reinforcement_percent',
    label: 'ADKAR: Reinforcement %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Reinforcement to sustain change (ADKAR Step 5)',
  },
  {
    id: 'resistance_score',
    label: 'Resistance Score',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Overall resistance to change (0-10, 10 = highest)',
  },
  {
    id: 'adoption_rate_percent',
    label: 'Adoption Rate %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage of users actively adopting change',
  },
  {
    id: 'change_readiness_score',
    label: 'Change Readiness Score',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Organizational readiness for change (0-100)',
  },
  {
    id: 'training_completion_percent',
    label: 'Training Completion %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage of required training completed',
  },
  {
    id: 'stakeholder_engagement_score',
    label: 'Stakeholder Engagement Score',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Level of stakeholder engagement (0-100)',
  },
];

const OCM_ACTIONS: ActionDefinition[] = [
  {
    id: 'alert_ocm',
    label: 'Alert OCM Team',
    description: 'Send notification to Change Management team',
  },
  {
    id: 'trigger_change_impact_assessment',
    label: 'Trigger Change Impact Assessment',
    description: 'Initiate formal impact analysis',
  },
  {
    id: 'request_additional_training',
    label: 'Request Additional Training',
    description: 'Schedule supplementary training sessions',
  },
  {
    id: 'escalate_resistance_issues',
    label: 'Escalate Resistance Issues',
    description: 'Bring to leadership for intervention',
  },
  {
    id: 'update_stakeholder_engagement_plan',
    label: 'Update Stakeholder Engagement Plan',
    description: 'Revise engagement strategy',
  },
  {
    id: 'deploy_change_champions',
    label: 'Deploy Change Champions',
    description: 'Activate change champion network',
  },
  {
    id: 'collaborate_pmo',
    label: 'Collaborate with PMO',
    description: 'Coordinate change with project delivery',
    requiresTarget: true,
  },
  {
    id: 'run_pulse_survey',
    label: 'Run Pulse Survey',
    description: 'Deploy quick sentiment survey',
  },
];

export function OCMRuleEditor() {
  const specialFeatures = (
    <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-rose-600" />
          OCM Change Management & ADKAR
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-red-600" />
              <strong className="text-gray-900">Change Risk Indicators</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Any ADKAR dimension &lt; 60% = Barrier</li>
              <li>• Resistance Score &gt; 7 = High resistance</li>
              <li>• Adoption Rate &lt; 50% = Low uptake</li>
              <li>• Training Completion &lt; 70% = Gap</li>
              <li>• Change Readiness &lt; 60% = Not ready</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-green-600" />
              <strong className="text-gray-900">Healthy Change Adoption</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• All ADKAR dimensions &gt; 80% = Strong</li>
              <li>• Resistance Score &lt; 3 = Low resistance</li>
              <li>• Adoption Rate &gt; 80% = Excellent</li>
              <li>• Training Completion &gt; 90% = Ready</li>
              <li>• Change Readiness &gt; 80% = Prepared</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-purple-600" />
              <strong className="text-gray-900">ADKAR Model</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li><strong>A</strong>wareness: Know why change is needed</li>
              <li><strong>D</strong>esire: Want to support the change</li>
              <li><strong>K</strong>nowledge: Know how to change</li>
              <li><strong>A</strong>bility: Able to implement change</li>
              <li><strong>R</strong>einforcement: Sustain the change</li>
              <li className="mt-2 text-xs italic">Sequential model - each stage builds on previous</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} className="text-blue-600" />
              <strong className="text-gray-900">Common Rules</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• ADKAR Awareness &lt; 60% → Run Pulse Survey</li>
              <li>• Resistance &gt; 7 → Deploy Champions</li>
              <li>• Adoption &lt; 50% → Additional Training</li>
              <li>• Training &lt; 70% → Escalate to Leadership</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
          <p className="font-medium mb-1">💡 Best Practice:</p>
          <p>
            ADKAR is sequential - users can't skip steps. If Desire is low, more Awareness won't help. If Knowledge
            is low, training is needed before Ability can develop. Monitor all 5 dimensions continuously. High resistance
            typically indicates low Awareness or Desire - address root causes, not symptoms. Use change champions for
            peer influence, not just top-down messaging.
          </p>
        </div>

        {/* ADKAR Progress Bars */}
        <div className="mt-4 p-4 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            ADKAR Progress Example
          </h4>
          <div className="space-y-3">
            {/* Awareness */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Awareness</span>
                <span className="text-xs font-bold text-green-700">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full flex items-center justify-end pr-2" style={{ width: '85%' }}>
                  <span className="text-xs text-white font-bold">✓</span>
                </div>
              </div>
            </div>

            {/* Desire */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Desire</span>
                <span className="text-xs font-bold text-green-700">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full flex items-center justify-end pr-2" style={{ width: '78%' }}>
                  <span className="text-xs text-white font-bold">✓</span>
                </div>
              </div>
            </div>

            {/* Knowledge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Knowledge</span>
                <span className="text-xs font-bold text-yellow-700">65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-yellow-500 h-4 rounded-full flex items-center justify-end pr-2" style={{ width: '65%' }}>
                  <span className="text-xs text-white font-bold">⚠</span>
                </div>
              </div>
            </div>

            {/* Ability */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Ability</span>
                <span className="text-xs font-bold text-red-700">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-red-500 h-4 rounded-full flex items-center justify-end pr-2" style={{ width: '45%' }}>
                  <span className="text-xs text-white font-bold">✗</span>
                </div>
              </div>
            </div>

            {/* Reinforcement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Reinforcement</span>
                <span className="text-xs font-bold text-gray-500">N/A</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-gray-400 h-4 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 italic">Blocked by low Ability score</p>
            </div>
          </div>
          <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded text-xs">
            <p className="font-medium text-amber-900">⚠️ Bottleneck Identified:</p>
            <p className="text-amber-800">Ability score is blocking Reinforcement. Recommend additional hands-on training and job aids.</p>
          </div>
        </div>

        {/* Resistance Heat Map */}
        <div className="mt-4 p-4 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={16} />
            Resistance Analysis
          </h4>
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center">
              <div className="w-full h-12 bg-green-300 rounded flex items-center justify-center font-bold text-gray-800">
                1-2
              </div>
              <p className="text-xs mt-1 text-gray-700">Low</p>
            </div>
            <div className="text-center">
              <div className="w-full h-12 bg-yellow-300 rounded flex items-center justify-center font-bold text-gray-800">
                3-4
              </div>
              <p className="text-xs mt-1 text-gray-700">Mild</p>
            </div>
            <div className="text-center">
              <div className="w-full h-12 bg-orange-400 rounded flex items-center justify-center font-bold text-white">
                5-6
              </div>
              <p className="text-xs mt-1 text-gray-700">Moderate</p>
            </div>
            <div className="text-center">
              <div className="w-full h-12 bg-red-500 rounded flex items-center justify-center font-bold text-white">
                7-8
              </div>
              <p className="text-xs mt-1 text-gray-700">High</p>
            </div>
            <div className="text-center">
              <div className="w-full h-12 bg-red-700 rounded flex items-center justify-center font-bold text-white">
                9-10
              </div>
              <p className="text-xs mt-1 text-gray-700">Critical</p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs text-gray-700">
            <p><strong>Common Resistance Sources:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Fear of job loss or skill obsolescence</li>
              <li>Lack of trust in leadership</li>
              <li>Change fatigue from previous initiatives</li>
              <li>Cultural misalignment</li>
              <li>Insufficient communication or training</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <RuleEditorBase
      agentType="ocm"
      agentLabel="OCM (Organizational Change Management)"
      agentColor="#f43f5e"
      attributes={OCM_ATTRIBUTES}
      actions={OCM_ACTIONS}
      specialFeatures={specialFeatures}
    />
  );
}
