/**
 * OCM RULE EDITOR
 *
 * Configure collaboration rules for OCM (Organizational Change Management) agent.
 * Attributes: ADKAR, Resistance Score, Adoption Rate, Change Readiness
 */

import { AdminLayout } from '@/components/AdminLayout';
import { OCMRuleEditor } from '@/components/rules/editors';

export default function OCMRules() {
  return (
    <AdminLayout>
      <OCMRuleEditor />
    </AdminLayout>
  );
}
