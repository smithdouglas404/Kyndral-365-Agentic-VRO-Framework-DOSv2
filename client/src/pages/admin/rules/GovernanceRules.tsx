/**
 * GOVERNANCE RULE EDITOR
 *
 * Configure collaboration rules for Governance & Compliance agent.
 * Attributes: Approval Status, Policy Compliance, Audit Findings
 */

import { AdminLayout } from '@/components/AdminLayout';
import { GovernanceRuleEditor } from '@/components/rules/editors';

export default function GovernanceRules() {
  return (
    <AdminLayout>
      <GovernanceRuleEditor />
    </AdminLayout>
  );
}
