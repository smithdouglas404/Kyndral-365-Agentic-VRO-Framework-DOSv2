/**
 * Shared helpers used by every external-system sync (Jira, OpenProject,
 * Monday) to populate the dedicated ontology types `AtlasResource` and
 * `AtlasMilestone` so the existing portfolio backfills automatically.
 *
 * Each helper is best-effort: it logs and swallows errors so a single bad
 * row never aborts an entire sync run.
 */

import { PALANTIR_ACTIONS, PALANTIR_OBJECT_TYPES } from '../../constants/palantirOntology.js';
import { OntologyDataProvider } from '../OntologyDataProvider.js';

/** Stable id for a person across syncs/projects. */
function resourceIdFor(source: string, projectId: string, name: string, externalId?: string): string {
  const slugName = (name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ext = externalId ? `-${externalId}` : '';
  return `res-${source}-${projectId}-${slugName}${ext}`.slice(0, 90);
}

/** Stable id for a milestone. */
function milestoneIdFor(source: string, projectId: string, name: string, externalId?: string): string {
  const slugName = (name || 'milestone').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ext = externalId ? `-${externalId}` : '';
  return `ms-${source}-${projectId}-${slugName}${ext}`.slice(0, 90);
}

export interface ResourceSeed {
  source: 'jira' | 'openproject' | 'monday' | string;
  projectId: string;
  name: string;
  role?: string;
  email?: string;
  department?: string;
  allocation?: number;
  externalId?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface MilestoneSeed {
  source: 'jira' | 'openproject' | 'monday' | string;
  projectId: string;
  name: string;
  status?: string;
  dueDate?: string | null;
  completedDate?: string | null;
  expectedDate?: string | null;
  owner?: string;
  type?: string;
  externalId?: string;
}

/**
 * Push an `AtlasResource` row to Palantir (via action OR direct create) and
 * mirror locally so agents see it immediately.
 *
 * `palantir` is a service exposing either `applyAction` / `executeAction`
 * and `createObject` (the two sync code paths use different method names).
 */
export async function pushResourceFromAssignee(
  palantir: any,
  seed: ResourceSeed
): Promise<void> {
  if (!palantir || !seed.name || !seed.projectId) return;

  const resourceId = resourceIdFor(seed.source, seed.projectId, seed.name, seed.externalId);
  const props: Record<string, any> = {
    resourceId,
    projectId: seed.projectId,
    name: seed.name,
    role: seed.role || 'Member',
    email: seed.email || '',
    department: seed.department || '',
    allocation: typeof seed.allocation === 'number' ? Math.round(seed.allocation) : 100,
    skills: '[]',
    startDate: seed.startDate || null,
    endDate: seed.endDate || null,
    source: seed.source,
    externalId: seed.externalId || '',
    syncedAt: new Date().toISOString(),
  };

  await pushToPalantir(palantir, PALANTIR_ACTIONS.CREATE_RESOURCE, PALANTIR_OBJECT_TYPES.RESOURCE, resourceId, props);
  try { OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.RESOURCE, props); } catch { /* mirror is best-effort */ }
}

/**
 * Push an `AtlasMilestone` row to Palantir and mirror locally.
 */
export async function pushMilestoneFromWorkItem(
  palantir: any,
  seed: MilestoneSeed
): Promise<void> {
  if (!palantir || !seed.name || !seed.projectId) return;

  const milestoneId = milestoneIdFor(seed.source, seed.projectId, seed.name, seed.externalId);
  const props: Record<string, any> = {
    milestoneId,
    projectId: seed.projectId,
    name: seed.name,
    status: (seed.status || 'planned').toLowerCase(),
    dueDate: seed.dueDate || null,
    completedDate: seed.completedDate || null,
    expectedDate: seed.expectedDate || null,
    owner: seed.owner || '',
    type: seed.type || 'phase',
    source: seed.source,
    externalId: seed.externalId || '',
    syncedAt: new Date().toISOString(),
  };

  await pushToPalantir(palantir, PALANTIR_ACTIONS.CREATE_MILESTONE, PALANTIR_OBJECT_TYPES.MILESTONE, milestoneId, props);
  try { OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.MILESTONE, props); } catch { /* mirror is best-effort */ }
}

/** True when an item from any source looks like a schedule milestone. */
export function isMilestoneLike(typeName?: string, name?: string, labels?: string[]): boolean {
  const t = (typeName || '').toLowerCase().trim();
  // Direct type match (singular or plural)
  if (/^(milestone|phase|release|gate|governance gate|release train)s?$/.test(t)) return true;
  // Word-level fallback for prefixed/suffixed type names
  if (/\b(milestone|gate|release|phase)\b/.test(t)) return true;
  // Name & label heuristics
  if (/\b(milestone|go-?live|gate|launch)\b/i.test(name || '')) return true;
  if (Array.isArray(labels) && labels.some(l => /milestone|gate|release|phase/i.test(l || ''))) return true;
  return false;
}

/** Normalize any source's parent project reference to a stable Palantir id. */
export function normalizeParentProjectId(source: string, rawProjectId?: string | number | null): string {
  if (!rawProjectId) return `${source}-project-unknown`;
  const s = String(rawProjectId);
  // Already prefixed (e.g., "op-project-123", "monday-board-42"): keep as-is
  if (/^[a-z]+-(project|board)-/i.test(s)) return s;
  if (source === 'openproject') return `op-project-${s}`;
  if (source === 'monday') return `monday-board-${s}`;
  if (source === 'jira') return `jira-project-${s}`;
  return `${source}-${s}`;
}

/**
 * Best-effort push using whichever method the caller's Palantir service
 * exposes. Logs and swallows failures.
 */
async function pushToPalantir(
  palantir: any,
  action: string,
  objectType: string,
  primaryKey: string,
  props: Record<string, any>
): Promise<void> {
  // Prefer applyAction (used by PalantirAIPService); fall through on failure.
  if (typeof palantir.applyAction === 'function') {
    try {
      await palantir.applyAction(action, props);
      return;
    } catch (actionErr: any) {
      // fall through
    }
  }
  // Try createObject as a low-level fallback if exposed.
  if (typeof palantir.createObject === 'function') {
    try {
      await palantir.createObject(objectType, primaryKey, props);
      return;
    } catch (createErr: any) {
      console.warn(`[SyncMappers] createObject failed for ${objectType} ${primaryKey}: ${createErr.message?.slice(0, 120)}`);
      return;
    }
  }
  // No supported write method — surface once per type so this isn't a silent no-op.
  warnNoWriter(objectType);
}

const _warned = new Set<string>();
function warnNoWriter(objectType: string): void {
  if (_warned.has(objectType)) return;
  _warned.add(objectType);
  console.warn(`[SyncMappers] Palantir service exposes neither applyAction nor createObject — ${objectType} backfill is a no-op.`);
}
