import { RuleEditorBase, AttributeDefinition, ActionDefinition } from './RuleEditorBase';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Users, GitBranch, FileCheck, AlertTriangle } from 'lucide-react';

const PMO_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'stage_gate_status',
    label: 'Stage Gate Status',
    type: 'string',
    operators: ['==', '!='],
    description: 'Current stage gate status (passed, failed, pending)',
  },
  {
    id: 'resource_utilization_percent',
    label: 'Resource Utilization %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage of resource capacity utilized',
  },
  {
    id: 'resource_conflicts_count',
    label: 'Resource Conflicts Count',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of resource allocation conflicts',
  },
  {
    id: 'portfolio_health_score',
    label: 'Portfolio Health Score',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Overall portfolio health (0-100)',
  },
  {
    id: 'dependencies_blocked_count',
    label: 'Blocked Dependencies Count',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of blocked inter-project dependencies',
  },
  {
    id: 'governance_compliance_percent',
    label: 'Governance Compliance %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage compliance with PMO governance',
  },
  {
    id: 'documentation_complete_percent',
    label: 'Documentation Complete %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage of required docs completed',
  },
  {
    id: 'active_projects_count',
    label: 'Active Projects Count',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of active projects in portfolio',
  },
  {
    id: 'critical_path_conflicts',
    label: 'Critical Path Conflicts',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Projects with conflicting critical paths',
  },
  {
    id: 'portfolio_roi',
    label: 'Portfolio ROI %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Portfolio-level return on investment',
  },
];

const PMO_ACTIONS: ActionDefinition[] = [
  {
    id: 'alert_pmo',
    label: 'Alert PMO Team',
    description: 'Send notification to PMO team',
  },
  {
    id: 'trigger_stage_gate_review',
    label: 'Trigger Stage Gate Review',
    description: 'Schedule stage gate assessment',
  },
  {
    id: 'request_resource_reallocation',
    label: 'Request Resource Reallocation',
    description: 'Initiate resource rebalancing',
  },
  {
    id: 'escalate_to_portfolio_manager',
    label: 'Escalate to Portfolio Manager',
    description: 'Bring to portfolio management level',
  },
  {
    id: 'flag_dependency_issue',
    label: 'Flag Dependency Issue',
    description: 'Mark dependency as blocked',
  },
  {
    id: 'request_documentation',
    label: 'Request Documentation',
    description: 'Require missing documentation',
  },
  {
    id: 'collaborate_finops',
    label: 'Collaborate with FinOps',
    description: 'Review portfolio financials',
    requiresTarget: true,
  },
  {
    id: 'collaborate_tmo',
    label: 'Collaborate with TMO',
    description: 'Coordinate timeline dependencies',
    requiresTarget: true,
  },
  {
    id: 'collaborate_all_agents',
    label: 'Collaborate with All Agents',
    description: 'Portfolio-wide collaboration',
    requiresTarget: true,
  },
];

export function PMORuleEditor() {
  const specialFeatures = (
    <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Briefcase size={20} className="text-indigo-600" />
          PMO Portfolio & Resource Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <strong className="text-gray-900">Portfolio Risk Indicators</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Stage Gate Status = "failed" = Immediate action</li>
              <li>• Resource Conflicts &gt; 3 = Reallocation needed</li>
              <li>• Portfolio Health &lt; 60% = Critical</li>
              <li>• Blocked Dependencies &gt; 5 = Escalate</li>
              <li>• Governance Compliance &lt; 80% = Risk</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck size={16} className="text-green-600" />
              <strong className="text-gray-900">Healthy Portfolio</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• All Stage Gates = "passed" = On track</li>
              <li>• Resource Utilization 70-90% = Optimal</li>
              <li>• Resource Conflicts = 0 = Balanced</li>
              <li>• Portfolio Health &gt; 80% = Strong</li>
              <li>• Governance Compliance &gt; 95% = Excellent</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch size={16} className="text-purple-600" />
              <strong className="text-gray-900">Stage Gates</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li><strong>Gate 1:</strong> Business Case Approval</li>
              <li><strong>Gate 2:</strong> Requirements Complete</li>
              <li><strong>Gate 3:</strong> Design Approval</li>
              <li><strong>Gate 4:</strong> Build Complete</li>
              <li><strong>Gate 5:</strong> Deployment Ready</li>
              <li><strong>Gate 6:</strong> Post-Launch Review</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-amber-600" />
              <strong className="text-gray-900">Common Rules</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• Stage Gate = "failed" → Review + Escalate</li>
              <li>• Resource Conflicts &gt; 3 → Reallocate</li>
              <li>• Blocked Dependencies &gt; 5 → All Agents</li>
              <li>• Documentation &lt; 80% → Request Docs</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
          <p className="font-medium mb-1">💡 Best Practice:</p>
          <p>
            Use stage gates as hard checkpoints - don't let projects advance without passing criteria.
            Monitor resource utilization across the portfolio (70-90% is optimal; below 70% = underutilized,
            above 90% = burnout risk). Track dependencies as first-class entities. Set automated alerts
            when multiple projects compete for the same critical resources.
          </p>
        </div>

        {/* Stage Gate Checklist */}
        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileCheck size={16} />
            Stage Gate Checklist Example
          </h4>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-indigo-900">Gate 2: Requirements</span>
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-bold">PASSED</span>
              </div>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Business requirements documented</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Stakeholder sign-off obtained</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Technical feasibility assessed</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-3 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-red-900">Gate 4: Build</span>
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded font-bold">FAILED</span>
              </div>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Code complete and reviewed</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✗</span>
                  <span className="font-bold">Unit test coverage &lt; 80%</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✗</span>
                  <span className="font-bold">Integration tests failing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resource Conflict Matrix */}
        <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} />
            Resource Utilization Zones
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-blue-300 rounded flex items-center justify-center text-white text-xs font-bold">
                0-50%
              </div>
              <span className="text-xs text-gray-700">Underutilized - Can take on more work</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                50-70%
              </div>
              <span className="text-xs text-gray-700">Good - Balanced workload</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-emerald-500 rounded flex items-center justify-center text-white text-xs font-bold">
                70-90%
              </div>
              <span className="text-xs text-gray-700">Optimal - Fully utilized, not overloaded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
                90-100%
              </div>
              <span className="text-xs text-gray-700">At Capacity - Monitor for overload</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                &gt;100%
              </div>
              <span className="text-xs text-gray-700">Overallocated - Burnout risk, rebalance needed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <RuleEditorBase
      agentType="pmo"
      agentLabel="PMO (Project Management Office)"
      agentColor="#6366f1"
      attributes={PMO_ATTRIBUTES}
      actions={PMO_ACTIONS}
      specialFeatures={specialFeatures}
    />
  );
}
