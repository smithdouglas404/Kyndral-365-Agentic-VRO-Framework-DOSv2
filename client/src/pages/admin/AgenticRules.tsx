/**
 * AGENTIC RULES (read-only)
 *
 * The OpenProject-authored threshold/decision rules the agent-runtime evaluates,
 * the recent breaches, and the ML-suggested thresholds learned from the HITL loop.
 * Authoring stays in OpenProject (the agentic_ppm module is the system of record);
 * this is the read-only Kyndral view, fed by the /api/agent/* proxy.
 */
import { AdminLayout } from '@/components/AdminLayout';
import { RulesPanel } from '@/openproject';

export default function AgenticRules() {
  return (
    <AdminLayout>
      <div className="p-6">
        <RulesPanel
          openProjectRulesUrl={
            import.meta.env.VITE_OPENPROJECT_BASE_URL
              ? `${String(import.meta.env.VITE_OPENPROJECT_BASE_URL).replace(/\/$/, '')}/projects`
              : undefined
          }
        />
      </div>
    </AdminLayout>
  );
}
