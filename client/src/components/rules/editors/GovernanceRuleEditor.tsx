import { RuleEditorBase, AttributeDefinition, ActionDefinition } from './RuleEditorBase';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, FileCheck, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const GOVERNANCE_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'approval_status',
    label: 'Approval Status',
    type: 'string',
    operators: ['==', '!='],
    description: 'Current approval status (pending, approved, rejected)',
  },
  {
    id: 'policy_compliance_percent',
    label: 'Policy Compliance %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Percentage compliance with governance policies',
  },
  {
    id: 'audit_findings_count',
    label: 'Audit Findings Count',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of outstanding audit findings',
  },
  {
    id: 'days_since_last_audit',
    label: 'Days Since Last Audit',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Days since last compliance audit',
  },
  {
    id: 'approver_response_time_hours',
    label: 'Approver Response Time (Hours)',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Average time for approver response',
  },
  {
    id: 'documentation_quality_score',
    label: 'Documentation Quality Score',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Quality score for project documentation (0-100)',
  },
  {
    id: 'security_compliance_percent',
    label: 'Security Compliance %',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Security policy compliance percentage',
  },
  {
    id: 'pending_approvals_count',
    label: 'Pending Approvals Count',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Number of approvals awaiting review',
  },
  {
    id: 'regulatory_violations_count',
    label: 'Regulatory Violations',
    type: 'number',
    operators: ['<', '<=', '>', '>=', '=='],
    description: 'Count of regulatory compliance violations',
  },
  {
    id: 'approval_workflow_stage',
    label: 'Approval Workflow Stage',
    type: 'string',
    operators: ['==', '!='],
    description: 'Current stage in approval workflow',
  },
];

const GOVERNANCE_ACTIONS: ActionDefinition[] = [
  {
    id: 'alert_governance',
    label: 'Alert Governance Team',
    description: 'Send notification to governance team',
  },
  {
    id: 'trigger_approval_workflow',
    label: 'Trigger Approval Workflow',
    description: 'Initiate formal approval process',
  },
  {
    id: 'request_policy_review',
    label: 'Request Policy Review',
    description: 'Schedule policy compliance review',
  },
  {
    id: 'escalate_compliance_issue',
    label: 'Escalate Compliance Issue',
    description: 'Bring to compliance officer',
  },
  {
    id: 'schedule_audit',
    label: 'Schedule Audit',
    description: 'Arrange compliance audit',
  },
  {
    id: 'update_compliance_dashboard',
    label: 'Update Compliance Dashboard',
    description: 'Refresh compliance metrics',
  },
  {
    id: 'require_documentation',
    label: 'Require Documentation',
    description: 'Mandate missing documentation',
  },
  {
    id: 'block_deployment',
    label: 'Block Deployment',
    description: 'Prevent deployment until compliant',
  },
  {
    id: 'notify_audit_committee',
    label: 'Notify Audit Committee',
    description: 'Alert board audit committee',
  },
];

export function GovernanceRuleEditor() {
  const specialFeatures = (
    <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-slate-600" />
          Governance, Compliance & Approval Workflows
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <strong className="text-gray-900">Compliance Risk Indicators</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Policy Compliance &lt; 80% = Non-compliant</li>
              <li>• Audit Findings &gt; 5 = Critical issues</li>
              <li>• Days Since Audit &gt; 90 = Overdue</li>
              <li>• Regulatory Violations &gt; 0 = Serious</li>
              <li>• Security Compliance &lt; 95% = Risk</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-green-600" />
              <strong className="text-gray-900">Strong Governance</strong>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Policy Compliance &gt; 95% = Excellent</li>
              <li>• Audit Findings = 0 = Clean</li>
              <li>• Quarterly audits = Proactive</li>
              <li>• Approval Response &lt; 48h = Efficient</li>
              <li>• Documentation Quality &gt; 85% = High</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck size={16} className="text-blue-600" />
              <strong className="text-gray-900">Approval Workflow Stages</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li><strong>Stage 1:</strong> Submission & Initial Review</li>
              <li><strong>Stage 2:</strong> Technical Review</li>
              <li><strong>Stage 3:</strong> Security & Compliance Check</li>
              <li><strong>Stage 4:</strong> Manager Approval</li>
              <li><strong>Stage 5:</strong> Executive Approval (if needed)</li>
              <li><strong>Stage 6:</strong> Final Sign-Off</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className="text-purple-600" />
              <strong className="text-gray-900">Common Rules</strong>
            </div>
            <ul className="space-y-1 text-gray-700 text-xs">
              <li>• Approval = "rejected" → Alert Submitter</li>
              <li>• Policy Compliance &lt; 80% → Schedule Audit</li>
              <li>• Audit Findings &gt; 5 → Escalate</li>
              <li>• Regulatory Violation → Block Deployment</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
          <p className="font-medium mb-1">💡 Best Practice:</p>
          <p>
            Governance should enable, not block - fast approvals for compliant requests, strict controls only where needed.
            Automate policy checks where possible (security scans, documentation linting). Set SLAs for approval response times.
            Conduct regular (quarterly) audits, not just when problems arise. Use "shift-left" compliance - check early in
            project lifecycle, not at deployment.
          </p>
        </div>

        {/* Approval Workflow Visualization */}
        <div className="mt-4 p-4 bg-gradient-to-r from-slate-100 to-gray-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileCheck size={16} />
            Approval Workflow Example
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div className="flex-1 bg-white p-2 rounded border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Stage 1: Submission</span>
                  <span className="text-xs text-green-700 font-bold">Approved</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Completed 3 days ago</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div className="flex-1 bg-white p-2 rounded border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Stage 2: Technical Review</span>
                  <span className="text-xs text-green-700 font-bold">Approved</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Completed 2 days ago</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold animate-pulse">
                ⏳
              </div>
              <div className="flex-1 bg-blue-50 p-2 rounded border border-blue-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Stage 3: Security Check</span>
                  <span className="text-xs text-blue-700 font-bold">In Progress</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Assigned to Security Team, 18 hours elapsed</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">
                –
              </div>
              <div className="flex-1 bg-gray-50 p-2 rounded border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Stage 4: Manager Approval</span>
                  <span className="text-xs text-gray-500 font-bold">Pending</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Waiting for Stage 3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Compliance Checklist */}
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield size={16} />
            Policy Compliance Checklist
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-xs font-medium">Security Policies</span>
              </div>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Code security scan passed</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>No secrets in repository</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Dependencies up to date</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-3 rounded border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-600" />
                <span className="text-xs font-medium">Documentation Policies</span>
              </div>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>README.md present</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-red-600">✗</span>
                  <span className="font-bold">API documentation missing</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-red-600">✗</span>
                  <span className="font-bold">Architecture diagram missing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compliance Zones */}
        <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Compliance Score Zones
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
                95-100%
              </div>
              <span className="text-xs text-gray-700">Excellent - Full compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                85-94%
              </div>
              <span className="text-xs text-gray-700">Good - Minor gaps, acceptable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">
                70-84%
              </div>
              <span className="text-xs text-gray-700">Moderate - Review needed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                &lt;70%
              </div>
              <span className="text-xs text-gray-700">Non-Compliant - Immediate action required</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <RuleEditorBase
      agentType="governance"
      agentLabel="Governance & Compliance"
      agentColor="#64748b"
      attributes={GOVERNANCE_ATTRIBUTES}
      actions={GOVERNANCE_ACTIONS}
      specialFeatures={specialFeatures}
    />
  );
}
