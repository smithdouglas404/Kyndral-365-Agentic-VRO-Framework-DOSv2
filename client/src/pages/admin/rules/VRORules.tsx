/**
 * VRO RULE EDITOR
 *
 * Configure collaboration rules for VRO (Value Realization Office) agent.
 * Attributes: Value Realization, Business Case ROI, Benefit Tracking
 */

import { AdminLayout } from '@/components/AdminLayout';
import { VRORuleEditor } from '@/components/rules/editors';

export default function VRORules() {
  return (
    <AdminLayout>
      <VRORuleEditor />
    </AdminLayout>
  );
}
