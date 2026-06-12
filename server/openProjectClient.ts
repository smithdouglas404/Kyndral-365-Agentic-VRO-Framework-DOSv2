/**
 * OpenProject Client (root-level drop-in)
 *
 * Bridges the comprehensive headless client in services/openproject/ into the
 * same conventions used by the sibling root clients (jiraClient, mondayClient,
 * serviceNowClient, ...):
 * - createOpenProjectClientFromAdapter(adapterId) for the sync scheduler
 * - createOpenProjectClientFromIntegration(credentials) for IntegrationSyncService
 * - syncOpenProjectProjects(client) high-level pull of OP projects into Kyndral storage
 *
 * OpenProject is the PPM datastore of record; Kyndral is the system + UI.
 * The ontology mapping (OP -> Palantir) lives in services/sync/OpenProjectToPalantirSync.
 */

import { storage as defaultStorage } from "./storage";
import type { IStorage } from "./storage";
import {
  OpenProjectClient,
  getOpenProjectClient,
  resetOpenProjectClient,
  type OpenProjectClientConfig,
} from "./services/openproject/OpenProjectClient.js";
import type { OPProject, OPWorkPackage } from "./services/openproject/types.js";

export { OpenProjectClient, getOpenProjectClient, resetOpenProjectClient };
export type { OpenProjectClientConfig };

export interface OpenProjectSyncResult {
  projectsCreated: number;
  projectsUpdated: number;
  workPackagesProcessed: number;
  errors: string[];
}

/**
 * Create a client from an MCP adapter row (used by the sync scheduler).
 * Adapter configuration JSON: { "baseUrl": "...", "apiKey": "..." }
 */
export async function createOpenProjectClientFromAdapter(adapterId: string): Promise<OpenProjectClient | null> {
  const adapters = await defaultStorage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'openproject') {
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    const baseUrl = config.baseUrl || process.env.OPENPROJECT_URL;
    const apiKey = config.apiKey || process.env.OPENPROJECT_API_KEY;
    if (!baseUrl || !apiKey) return null;
    return new OpenProjectClient({ baseUrl, apiKey });
  } catch (error) {
    console.error('Failed to create OpenProject client:', error);
    return null;
  }
}

/**
 * Create a client from decrypted Integration credentials
 * (used by IntegrationSyncService). Accepts apiKey or apiToken.
 */
export function createOpenProjectClientFromIntegration(credentials: {
  baseUrl?: string;
  apiKey?: string;
  apiToken?: string;
  [key: string]: any;
}): OpenProjectClient {
  const baseUrl = credentials.baseUrl || process.env.OPENPROJECT_URL;
  const apiKey = credentials.apiKey || credentials.apiToken || process.env.OPENPROJECT_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error('Missing required OpenProject credentials: baseUrl, apiKey');
  }

  return new OpenProjectClient({ baseUrl, apiKey });
}

function mapOpenProjectStatus(project: OPProject): string {
  return project.active ? 'active' : 'on_hold';
}

function rollUpWorkPackages(workPackages: OPWorkPackage[]): { percentComplete: number; overdueCount: number } {
  if (workPackages.length === 0) return { percentComplete: 0, overdueCount: 0 };

  const now = new Date();
  let totalProgress = 0;
  let overdueCount = 0;

  for (const wp of workPackages) {
    totalProgress += wp.percentageDone || 0;
    const statusTitle = wp._links?.status?.title || '';
    if (wp.dueDate && new Date(wp.dueDate) < now && !/closed|rejected/i.test(statusTitle)) {
      overdueCount++;
    }
  }

  return {
    percentComplete: Math.round(totalProgress / workPackages.length),
    overdueCount,
  };
}

/**
 * Pull OpenProject projects (with work-package roll-ups) into Kyndral storage.
 * Idempotent: matches on externalId/name, updates existing rows.
 */
export async function syncOpenProjectProjects(
  client: OpenProjectClient,
  store: IStorage = defaultStorage,
): Promise<OpenProjectSyncResult> {
  const result: OpenProjectSyncResult = {
    projectsCreated: 0,
    projectsUpdated: 0,
    workPackagesProcessed: 0,
    errors: [],
  };

  const opProjects = await client.listProjects();

  for (const opProject of opProjects) {
    try {
      let workPackages: OPWorkPackage[] = [];
      try {
        workPackages = await client.listWorkPackages({ projectId: opProject.id });
      } catch (wpErr: any) {
        result.errors.push(`Failed to fetch work packages for ${opProject.name}: ${wpErr.message}`);
      }
      result.workPackagesProcessed += workPackages.length;

      const { percentComplete } = rollUpWorkPackages(workPackages);
      const externalId = String(opProject.id);

      const existing = await store.getProjects();
      const existingProject = existing.find(p =>
        (p.externalId === externalId && p.externalSource === 'openproject') || p.name === opProject.name
      );

      if (existingProject) {
        await store.updateProject(existingProject.id, {
          name: opProject.name,
          description: opProject.description?.raw || '',
          status: mapOpenProjectStatus(opProject),
          percentComplete: String(percentComplete),
          externalId,
          externalSource: 'openproject',
        });
        result.projectsUpdated++;
      } else {
        await store.createProject({
          name: opProject.name,
          description: opProject.description?.raw || '',
          status: mapOpenProjectStatus(opProject),
          startDate: new Date(opProject.createdAt),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          owner: 'system',
          budget: '0',
          teamSize: '0',
          priority: 'medium',
          risks: '',
          dependencies: '',
          spi: '0',
          cpi: '0',
          percentComplete: String(percentComplete),
          externalId,
          externalSource: 'openproject',
        });
        result.projectsCreated++;
      }
    } catch (error: any) {
      result.errors.push(`Failed to import project ${opProject.name}: ${error.message}`);
    }
  }

  return result;
}

export default OpenProjectClient;
