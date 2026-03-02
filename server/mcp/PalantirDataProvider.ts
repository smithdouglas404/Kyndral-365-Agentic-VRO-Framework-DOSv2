import { getPalantirService } from './MCPServiceFactory.js';
import type { PalantirAIPService } from './PalantirAIPService.js';

const AGENT_PALANTIR_MAPPING: Record<string, {
  objectTypes: string[];
  label: string;
}> = {
  finops: {
    objectTypes: ['AtlasBudget', 'AtlasFinancialRecord', 'AtlasKpi'],
    label: 'Financial data',
  },
  deepfinops: {
    objectTypes: ['AtlasBudget', 'AtlasFinancialRecord', 'AtlasKpi'],
    label: 'Financial data',
  },
  tmo: {
    objectTypes: ['AtlasProject', 'AtlasDependency', 'AtlasTeam'],
    label: 'Transformation & schedule data',
  },
  deeptmo: {
    objectTypes: ['AtlasProject', 'AtlasDependency', 'AtlasTeam'],
    label: 'Transformation & schedule data',
  },
  risk: {
    objectTypes: ['AtlasRisk', 'AtlasInsight', 'AtlasProject'],
    label: 'Risk data',
  },
  deeprisk: {
    objectTypes: ['AtlasRisk', 'AtlasInsight', 'AtlasProject'],
    label: 'Risk data',
  },
  pmo: {
    objectTypes: ['AtlasProject', 'AtlasGovernanceCheckpoint', 'AtlasTransformation'],
    label: 'Project health data',
  },
  deeppmo: {
    objectTypes: ['AtlasProject', 'AtlasGovernanceCheckpoint', 'AtlasTransformation'],
    label: 'Project health data',
  },
  governance: {
    objectTypes: ['AtlasGovernanceCheckpoint', 'AtlasInsight', 'AtlasProject'],
    label: 'Governance data',
  },
  deepgovernance: {
    objectTypes: ['AtlasGovernanceCheckpoint', 'AtlasInsight', 'AtlasProject'],
    label: 'Governance data',
  },
  vro: {
    objectTypes: ['AtlasKpi', 'AtlasObjective', 'AtlasKeyResult'],
    label: 'Value realization data',
  },
  deepvro: {
    objectTypes: ['AtlasKpi', 'AtlasObjective', 'AtlasKeyResult'],
    label: 'Value realization data',
  },
  ocm: {
    objectTypes: ['AtlasReadinessMetric', 'AtlasTeam', 'AtlasPerson'],
    label: 'Change management data',
  },
  deepocm: {
    objectTypes: ['AtlasReadinessMetric', 'AtlasTeam', 'AtlasPerson'],
    label: 'Change management data',
  },
  planning: {
    objectTypes: ['AtlasProject', 'AtlasDependency', 'AtlasObjective'],
    label: 'Planning data',
  },
  deepplanning: {
    objectTypes: ['AtlasProject', 'AtlasDependency', 'AtlasObjective'],
    label: 'Planning data',
  },
  okr: {
    objectTypes: ['AtlasObjective', 'AtlasKeyResult', 'AtlasKpi'],
    label: 'OKR data',
  },
  deepokrinference: {
    objectTypes: ['AtlasObjective', 'AtlasKeyResult', 'AtlasKpi'],
    label: 'OKR data',
  },
  integrated: {
    objectTypes: ['AtlasProject', 'AtlasTransformation', 'AtlasInsight', 'AtlasAgent'],
    label: 'Cross-domain data',
  },
  deepintegratedmgmt: {
    objectTypes: ['AtlasProject', 'AtlasTransformation', 'AtlasInsight', 'AtlasAgent'],
    label: 'Cross-domain data',
  },
  notification: {
    objectTypes: ['AtlasAgent', 'AtlasInsight', 'AtlasProject', 'AtlasRisk', 'AtlasPerson'],
    label: 'Notification & action gateway data',
  },
  deepnotification: {
    objectTypes: ['AtlasAgent', 'AtlasInsight', 'AtlasProject', 'AtlasRisk', 'AtlasPerson'],
    label: 'Notification & action gateway data',
  },
};

const palantirCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(objectType: string, projectId?: string): string {
  return projectId ? `${objectType}:${projectId}` : objectType;
}

export class PalantirDataProvider {
  private palantir: PalantirAIPService | null;

  constructor() {
    this.palantir = getPalantirService();
  }

  isAvailable(): boolean {
    return this.palantir !== null;
  }

  getAgentObjectTypes(agentId: string): string[] {
    const normalized = agentId.toLowerCase().replace(/[^a-z]/g, '');
    const mapping = AGENT_PALANTIR_MAPPING[normalized];
    return mapping?.objectTypes || [];
  }

  async fetchForAgent(agentId: string, projectId?: string): Promise<Record<string, any[]>> {
    if (!this.palantir) return {};

    const objectTypes = this.getAgentObjectTypes(agentId);
    if (objectTypes.length === 0) return {};

    const result: Record<string, any[]> = {};

    for (const objectType of objectTypes) {
      try {
        const cacheKey = getCacheKey(objectType, projectId);
        const cached = palantirCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
          result[objectType] = cached.data;
          continue;
        }

        let data: any;
        if (projectId && this.isProjectLinkedType(objectType)) {
          data = await this.palantir.searchObjects(objectType, {
            type: 'eq',
            field: 'projectId',
            value: projectId,
          }, { pageSize: 100 });
        } else {
          data = await this.palantir.listObjects(objectType, { pageSize: 100 });
        }

        const objects = data.data || [];
        result[objectType] = objects;

        palantirCache.set(cacheKey, { data: objects, timestamp: Date.now() });
      } catch (error: any) {
        console.warn(`[PalantirData] Failed to fetch ${objectType} for ${agentId}: ${error.message}`);
        result[objectType] = [];
      }
    }

    return result;
  }

  async enrichAgentContext(agentId: string, context: any): Promise<any> {
    if (!this.palantir) return context;

    const objectTypes = this.getAgentObjectTypes(agentId);
    if (objectTypes.length === 0) return context;

    try {
      const projectId = context.projectId || context.project?.id;
      const palantirData = await this.fetchForAgent(agentId, projectId);

      const totalObjects = Object.values(palantirData).reduce((sum, arr) => sum + arr.length, 0);
      if (totalObjects === 0) return context;

      const normalized = agentId.toLowerCase().replace(/[^a-z]/g, '');
      const mapping = AGENT_PALANTIR_MAPPING[normalized];

      return {
        ...context,
        palantirData,
        palantirSummary: {
          source: 'Palantir AIP',
          label: mapping?.label || 'Enterprise data',
          objectTypes: Object.keys(palantirData),
          totalObjects,
          fetchedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.warn(`[PalantirData] Context enrichment failed for ${agentId}: ${error.message}`);
      return context;
    }
  }

  async getSummaryForProject(projectId: string): Promise<any> {
    if (!this.palantir) return null;

    try {
      const [risks, budgets, kpis, checkpoints] = await Promise.all([
        this.safeSearch('AtlasRisk', 'projectId', projectId),
        this.safeSearch('AtlasFinancialRecord', 'projectId', projectId),
        this.safeSearch('AtlasKpi', 'projectId', projectId),
        this.safeSearch('AtlasGovernanceCheckpoint', 'projectId', projectId),
      ]);

      return {
        projectId,
        risks: risks.length,
        openRisks: risks.filter((r: any) => r.status === 'Open' || r.status === 'Active').length,
        highRisks: risks.filter((r: any) => (r.riskScore || 0) >= 7).length,
        financialRecords: budgets.length,
        kpis: kpis.length,
        kpisBelowTarget: kpis.filter((k: any) => k.currentValue < k.targetValue).length,
        governanceCheckpoints: checkpoints.length,
        completedCheckpoints: checkpoints.filter((c: any) => c.status === 'Completed').length,
        source: 'Palantir AIP',
      };
    } catch (error: any) {
      console.warn(`[PalantirData] Project summary failed: ${error.message}`);
      return null;
    }
  }

  clearCache(): void {
    palantirCache.clear();
    console.log('[PalantirData] Cache cleared');
  }

  getCacheStats(): { entries: number; objectTypes: string[] } {
    const objectTypes = new Set<string>();
    for (const key of palantirCache.keys()) {
      objectTypes.add(key.split(':')[0]);
    }
    return { entries: palantirCache.size, objectTypes: Array.from(objectTypes) };
  }

  private isProjectLinkedType(objectType: string): boolean {
    return [
      'AtlasRisk', 'AtlasFinancialRecord', 'AtlasKpi',
      'AtlasGovernanceCheckpoint', 'AtlasDependency',
    ].includes(objectType);
  }

  private async safeSearch(objectType: string, field: string, value: string): Promise<any[]> {
    if (!this.palantir) return [];
    try {
      const result = await this.palantir.searchObjects(objectType, {
        type: 'eq', field, value,
      }, { pageSize: 100 });
      return result.data || [];
    } catch {
      return [];
    }
  }
}

let _provider: PalantirDataProvider | null = null;

export function getPalantirDataProvider(): PalantirDataProvider {
  if (!_provider) {
    _provider = new PalantirDataProvider();
  }
  return _provider;
}
