/**
 * PMO RULE EDITOR
 *
 * Configure collaboration rules for PMO (Project Management Office) agent.
 * Attributes: Stage Gates, Resource Utilization, Portfolio Health
 */

import { AdminLayout } from '@/components/AdminLayout';
import { PMORuleEditor } from '@/components/rules/editors';

export default function PMORules() {
  return (
    <AdminLayout>
      <PMORuleEditor />
    </AdminLayout>
  );
}
