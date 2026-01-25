/**
 * TMO RULE EDITOR
 *
 * Configure collaboration rules for TMO (Technical Management Office) agent.
 * Attributes: Schedule Variance, SPI, Milestones, Timeline
 */

import { AdminLayout } from '@/components/AdminLayout';
import { TMORuleEditor } from '@/components/rules/editors';

export default function TMORules() {
  return (
    <AdminLayout>
      <TMORuleEditor />
    </AdminLayout>
  );
}
