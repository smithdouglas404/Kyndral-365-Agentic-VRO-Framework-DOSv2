/**
 * CUSTOM ATTRIBUTES BUILDER
 *
 * Create and manage custom attributes for agents (exposed via MCP).
 * Allows teams to extend agent capabilities with domain-specific metrics.
 */

import { AdminLayout } from '@/components/AdminLayout';
import { CustomAttributeBuilder } from '@/components/rules/editors';

export default function CustomAttributes() {
  return (
    <AdminLayout>
      <CustomAttributeBuilder />
    </AdminLayout>
  );
}
