/**
 * RISK RULE EDITOR
 *
 * Configure collaboration rules for Risk Management agent.
 * Attributes: Risk Score, Mitigation, Probability × Impact
 */

import { AdminLayout } from '@/components/AdminLayout';
import { RiskRuleEditor } from '@/components/rules/editors';

export default function RiskRules() {
  return (
    <AdminLayout>
      <RiskRuleEditor />
    </AdminLayout>
  );
}
