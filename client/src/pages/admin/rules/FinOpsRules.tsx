/**
 * FINOPS RULE EDITOR
 *
 * Configure collaboration rules for FinOps agent.
 * Attributes: CPI, EVM, Budget Variance, Cost Performance
 */

import { AdminLayout } from '@/components/AdminLayout';
import { FinOpsRuleEditor } from '@/components/rules/editors';

export default function FinOpsRules() {
  return (
    <AdminLayout>
      <FinOpsRuleEditor />
    </AdminLayout>
  );
}
