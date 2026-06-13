/**
 * ONTOLOGY MAPPING STUDIO (admin)
 *
 * The universal mapper: each source (OpenProject, and later Jira / ADO / MCP)
 * maps ONCE into the shared ontology, and each consumer reads ONCE from it
 * (N + M, not N × M). This screen is where a human (or the runtime's pre-match)
 * draws that map: discover → map → widget → preview → publish.
 *
 * Data flows through the /api/agent/* proxy (server/routes/agentFindings.routes.ts
 * → the agent-runtime). See docs/ONTOLOGY_MAPPING_STUDIO.md.
 */
import { AdminLayout } from '@/components/AdminLayout';
import { MappingStudio } from '@/openproject';
import { toast } from 'sonner';

export default function OntologyMappingStudio() {
  return (
    <AdminLayout>
      <div className="p-6">
        <MappingStudio
          onSaved={(set) => toast.success(`Published ${set.mappings.length} mappings for "${set.source}".`)}
          onError={(message) => toast.error(message)}
        />
      </div>
    </AdminLayout>
  );
}
