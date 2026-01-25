import { RuleEditorBase, AttributeDefinition, ActionDefinition } from './RuleEditorBase';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, Flag, AlertTriangle } from 'lucide-react';

const TMO_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'schedule_variance_days',
    label: 'Schedule Variance (Days)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of days ahead or behind schedule (negative = behind)',
  },
  {
    id: 'schedule_variance_percent',
    label: 'Schedule Variance %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage ahead or behind schedule',
  },
  {
    id: 'spi',
    label: 'SPI (Schedule Performance Index)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'EV / PV - < 1.0 = behind schedule, > 1.0 = ahead of schedule',
  },
  {
    id: 'milestone_delay_days',
    label: 'Milestone Delay (Days)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Days overdue for critical milestones',
  },
  {
    id: 'critical_path_slack',
    label: 'Critical Path Slack (Days)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Buffer days remaining on critical path',
  },
  {
    id: 'tasks_behind_schedule_count',
    label: 'Tasks Behind Schedule',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of tasks currently overdue',
  },
  {
    id: 'completion_percentage',
    label: 'Completion %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Overall project completion percentage',
  },
  {
    id: 'velocity',
    label: 'Team Velocity',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Story points or tasks completed per sprint',
  },
  {
    id: 'blocked_tasks_count',
    label: 'Blocked Tasks',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of tasks currently blocked',
  },
  {
    id: 'days_to_deadline',
    label: 'Days to Deadline',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Days remaining until project deadline',
  },
];

const TMO_ACTIONS: ActionDefinition[] = [
  {
    id: 'alert_tmo',
    label: 'Alert TMO Team',
    description: 'Send notification to TMO team',
  },
  {
    id: 'alert_pmo',
    label: 'Alert PMO',
    description: 'Escalate to PMO for intervention',
    requiresTarget: true,
  },
  {
    id: 'alert_finops',
    label: 'Alert FinOps',
    description: 'Notify FinOps of schedule impact',
    requiresTarget: true,
  },
  {
    id: 'trigger_schedule_review',
    label: 'Trigger Schedule Review',
    description: 'Initiate formal schedule review meeting',
  },
  {
    id: 'request_resource_acceleration',
    label: 'Request Resource Acceleration',
    description: 'Request additional resources to accelerate timeline',
  },
  {
    id: 'flag_milestone_risk',
    label: 'Flag Milestone Risk',
    description: 'Mark milestone as at-risk in tracking system',
  },
  {
    id: 'update_stakeholders',
    label: 'Update Stakeholders',
    description: 'Send timeline update to stakeholders',
  },
  {
    id: 'collaborate_risk',
    label: 'Collaborate with Risk Agent',
    description: 'Assess schedule delay risks',
    requiresTarget: true,
  },
];

export function TMORuleEditor() {
  const specialFeatures = (
    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-blue-600" />
          TMO Schedule & Timeline Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <strong className="text-gray-900">Schedule Risk Indicators</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• SPI &lt; 0.9 = Significant schedule delay</li>
              <li>• SPI &lt; 0.85 = Critical timeline issue</li>
              <li>• Schedule Variance &gt; 15% = Review needed</li>
              <li>• Milestone Delay &gt; 5 days = Escalate</li>
              <li>• Critical Path Slack &lt; 5 days = Alert</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-green-600" />
              <strong className="text-gray-900">Healthy Schedule</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• SPI &gt;= 0.95 = On track</li>
              <li>• SPI &gt; 1.0 = Ahead of schedule</li>
              <li>• Milestone delays = 0 = Good</li>
              <li>• Blocked tasks &lt; 5% = Acceptable</li>
              <li>• Velocity stable or increasing</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Flag size={16} className="text-purple-600" />
              <strong className="text-gray-900">Milestone Tracking</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• Track critical milestones separately</li>
              <li>• Set alerts 5-10 days before due date</li>
              <li>• Escalate delays &gt; 3 days immediately</li>
              <li>• Review dependencies for at-risk milestones</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-600" />
              <strong className="text-gray-900">Common Rules</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• SPI &lt; 0.85 → Alert PMO + Review</li>
              <li>• Milestone Delay &gt; 5 days → Escalate</li>
              <li>• Blocked Tasks &gt; 10 → Resource Request</li>
              <li>• Critical Path Slack &lt; 3 → Alert All</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
          <p className="font-medium mb-1">💡 Best Practice:</p>
          <p>
            Monitor both absolute delays (days behind) and relative performance (SPI). Set early warning
            thresholds at 5-7 days before milestones. Integrate schedule rules with cost rules - schedule
            delays often drive cost overruns, and vice versa. Track velocity trends to predict future delays.
          </p>
        </div>

        {/* Timeline Visualization Example */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={16} />
            Example: Timeline Risk Zones
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                On Track
              </div>
              <span className="text-xs text-gray-700">0-5 days delay, SPI &gt; 0.95</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">
                At Risk
              </div>
              <span className="text-xs text-gray-700">6-10 days delay, SPI 0.85-0.95</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                Critical
              </div>
              <span className="text-xs text-gray-700">&gt;10 days delay, SPI &lt; 0.85</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <RuleEditorBase
      agentType="tmo"
      agentLabel="TMO (Technical Management Office)"
      agentColor="#3b82f6"
      attributes={TMO_ATTRIBUTES}
      actions={TMO_ACTIONS}
      specialFeatures={specialFeatures}
    />
  );
}
