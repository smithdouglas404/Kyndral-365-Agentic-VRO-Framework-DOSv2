/**
 * PALANTIR INGEST SERVICE
 *
 * Single source of truth for project ingestion.
 * Writes EVERY entity directly into Palantir Foundry via applyAction
 * (with createObject fallback). Zero PostgreSQL writes for project data.
 *
 * Used by POST /api/projects/ingest. Returns a stable projectId that
 * downstream agents can immediately query from Palantir.
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { PALANTIR_ACTIONS, PALANTIR_OBJECT_TYPES } from '../constants/palantirOntology.js';
import { OntologyDataProvider } from './OntologyDataProvider.js';

export interface SafeProjectInput {
  id?: string;
  name: string;
  bu: string;
  description?: string;
  status?: string;
  priority?: string;
  expectedROI?: number;
  roiValue?: number;
  artName?: string;
  portfolioTheme?: string;
  safeStage?: string;
  timeline?: { startDate?: string; endDate?: string };
  budget?: { spent?: number; total?: number; unit?: string };
  safe?: {
    currentPI?: string;
    totalPIs?: number;
    velocity?: number;
    predictability?: number;
    flowEfficiency?: number;
    epicId?: string;
    epicName?: string;
    epicProgress?: number;
  };
  features?: any[];
  stories?: any[];
  tasks?: any[];
  milestones?: any[];
  resources?: any[];
  risks?: any[];
  dependencies?: any[];
  financials?: any;
  objectives?: any[];
  kpis?: any[];
  governanceCheckpoints?: any[];
}

export interface IngestResult {
  projectId: string;
  created: {
    project: number;
    features: number;
    stories: number;
    tasks: number;
    risks: number;
    objectives: number;
    keyResults: number;
    kpis: number;
    checkpoints: number;
  };
  warnings: string[];
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export class PalantirIngestService {
  private warnings: string[] = [];

  async ingest(input: SafeProjectInput): Promise<IngestResult> {
    const palantir = getPalantirService();
    if (!palantir) {
      throw new Error(
        'Palantir is not configured. Cannot ingest project — Palantir is the single source of truth.'
      );
    }

    this.warnings = [];

    const projectId = input.id || `proj-${slug(input.name)}-${Date.now().toString(36)}`;
    const counts = {
      project: 0,
      features: 0,
      stories: 0,
      tasks: 0,
      risks: 0,
      objectives: 0,
      keyResults: 0,
      kpis: 0,
      checkpoints: 0,
    };

    // ---- 1. PROJECT (with embedded milestones/resources/financials JSON) ----
    const budgetTotal = Number(input.budget?.total ?? 0);
    const budgetSpent = Number(input.budget?.spent ?? 0);
    const milestonesJson = JSON.stringify(input.milestones || []);
    const resourcesJson = JSON.stringify(input.resources || []);
    const financialsJson = JSON.stringify(input.financials || {});

    const projectProps: Record<string, any> = {
      projectId,
      name: input.name,
      description: input.description || `${input.name} - SAFe project`,
      businessUnitId: input.bu,
      status: input.status || 'planning',
      priority: input.priority || 'medium',
      startDate: input.timeline?.startDate || null,
      endDate: input.timeline?.endDate || null,
      expectedRoi: input.expectedROI ?? null,
      roiValue: input.roiValue ?? null,
      artName: input.artName || null,
      portfolioTheme: input.portfolioTheme || null,
      safeStage: input.safeStage || 'funnel',
      currentPi: input.safe?.currentPI || null,
      totalPis: input.safe?.totalPIs ?? null,
      velocity: input.safe?.velocity ?? null,
      predictability: input.safe?.predictability ?? null,
      flowEfficiency: input.safe?.flowEfficiency ?? null,
      epicId: input.safe?.epicId || null,
      epicName: input.safe?.epicName || null,
      epicProgress: input.safe?.epicProgress ?? 0,
      progress: input.safe?.epicProgress ?? 0,
      budget: budgetTotal,
      actualCost: budgetSpent,
      budgetUnit: input.budget?.unit || '$m',
      milestonesJson,
      resourcesJson,
      financialsJson,
      ingestedAt: new Date().toISOString(),
      source: 'palantir-ingest-service',
    };

    await this.applyOrCreate(
      palantir,
      PALANTIR_ACTIONS.CREATE_PROJECT,
      PALANTIR_OBJECT_TYPES.PROJECT,
      projectId,
      projectProps,
      'project'
    );
    // Always mirror locally so agents can read this project even if the
    // Palantir write was rejected (e.g. unmapped action params).
    OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.PROJECT, projectProps);
    counts.project = 1;

    // ---- 1a. RESOURCES (dedicated AtlasResource objects + embedded JSON) ----
    if (Array.isArray(input.resources)) {
      for (let i = 0; i < input.resources.length; i++) {
        const r = input.resources[i] || {};
        const resourceId = r.id || `res-${slug(r.name || 'resource')}-${projectId}-${i}`;
        const resourceProps: Record<string, any> = {
          resourceId,
          projectId,
          name: r.name || 'Unnamed',
          role: r.role || 'Member',
          allocation: Math.round(Number(r.allocation ?? 0)),
          email: r.email || '',
          department: r.department || input.bu || '',
          costRate: Number(r.costRate ?? 0),
          startDate: r.startDate || input.timeline?.startDate || null,
          endDate: r.endDate || input.timeline?.endDate || null,
          skills: JSON.stringify(r.skills || []),
          source: 'palantir-ingest-service',
          externalId: r.externalId || '',
          syncedAt: new Date().toISOString(),
        };
        await this.applyOrCreate(
          palantir,
          PALANTIR_ACTIONS.CREATE_RESOURCE,
          PALANTIR_OBJECT_TYPES.RESOURCE,
          resourceId,
          resourceProps,
          'resource'
        );
        OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.RESOURCE, resourceProps);
      }
    }

    // ---- 1b. MILESTONES (dedicated AtlasMilestone objects + embedded JSON) ----
    if (Array.isArray(input.milestones)) {
      for (let i = 0; i < input.milestones.length; i++) {
        const m = input.milestones[i] || {};
        const milestoneId = m.id || `ms-${slug(m.name || 'milestone')}-${projectId}-${i}`;
        const milestoneProps: Record<string, any> = {
          milestoneId,
          projectId,
          name: m.name || `Milestone ${i + 1}`,
          description: m.description || '',
          status: (m.status || 'planned').toLowerCase(),
          dueDate: m.dueDate || null,
          completedDate: m.completedDate || null,
          expectedDate: m.expectedDate || null,
          owner: m.owner || '',
          gate: m.gate || '',
          type: m.type || 'phase',
          source: 'palantir-ingest-service',
          externalId: m.externalId || '',
          syncedAt: new Date().toISOString(),
        };
        await this.applyOrCreate(
          palantir,
          PALANTIR_ACTIONS.CREATE_MILESTONE,
          PALANTIR_OBJECT_TYPES.MILESTONE,
          milestoneId,
          milestoneProps,
          'milestone'
        );
        OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.MILESTONE, milestoneProps);
      }
    }

    // ---- 2. FEATURES (and nested stories/tasks) ----
    if (Array.isArray(input.features)) {
      for (const feat of input.features) {
        const featureId = feat.id || `feat-${slug(feat.name || 'feature')}-${Date.now().toString(36)}-${counts.features}`;
        const featureProps: Record<string, any> = {
          featureId,
          projectId,
          name: feat.name,
          description: feat.description || '',
          status: feat.status || 'planned',
          storyPoints: Number(feat.storyPoints ?? 0),
          completedPoints: Number(feat.completedPoints ?? 0),
          priority: feat.priority || 'medium',
          targetPi: feat.targetPi ?? null,
          wsjfScore: feat.wsjf?.score ?? feat.wsjfScore ?? null,
          acceptanceCriteriaJson: JSON.stringify(feat.acceptanceCriteria || []),
        };
        await this.applyOrCreate(
          palantir,
          PALANTIR_ACTIONS.CREATE_FEATURE,
          PALANTIR_OBJECT_TYPES.FEATURE,
          featureId,
          featureProps,
          'feature'
        );
        counts.features++;

        if (Array.isArray(feat.stories)) {
          for (const st of feat.stories) {
            const storyId = await this.createStory(palantir, st, projectId, featureId, counts.stories);
            counts.stories++;
            if (Array.isArray(st.tasks)) {
              for (const task of st.tasks) {
                await this.createTask(palantir, task, projectId, featureId, storyId, counts.tasks);
                counts.tasks++;
              }
            }
          }
        }
      }
    }

    // ---- 3. TOP-LEVEL STORIES ----
    if (Array.isArray(input.stories)) {
      for (const st of input.stories) {
        const storyId = await this.createStory(palantir, st, projectId, st.featureId, counts.stories);
        counts.stories++;
        if (Array.isArray(st.tasks)) {
          for (const task of st.tasks) {
            await this.createTask(palantir, task, projectId, st.featureId, storyId, counts.tasks);
            counts.tasks++;
          }
        }
      }
    }

    // ---- 4. TOP-LEVEL TASKS ----
    if (Array.isArray(input.tasks)) {
      for (const task of input.tasks) {
        await this.createTask(
          palantir,
          task,
          projectId,
          task.featureId,
          task.storyId,
          counts.tasks
        );
        counts.tasks++;
      }
    }

    // ---- 5. RISKS ----
    if (Array.isArray(input.risks)) {
      for (const risk of input.risks) {
        const riskId =
          risk.id || `risk-${slug(risk.name || 'risk')}-${Date.now().toString(36)}-${counts.risks}`;
        const probability = Number(risk.probability ?? 3);
        const impact = Number(risk.impact ?? 3);
        const riskProps: Record<string, any> = {
          riskId,
          projectId,
          name: risk.name,
          description: risk.description || risk.name,
          probability,
          impact,
          riskScore: probability * impact,
          status: risk.status || 'Open',
          mitigation: risk.mitigation || '',
          owner: risk.owner || '',
          category: risk.category || 'general',
        };
        await this.applyOrCreate(
          palantir,
          PALANTIR_ACTIONS.CREATE_RISK,
          PALANTIR_OBJECT_TYPES.RISK,
          riskId,
          riskProps,
          'risk'
        );
        OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.RISK, riskProps);
        counts.risks++;
      }
    }

    // ---- 6. OBJECTIVES (OKRs) ----
    if (Array.isArray(input.objectives)) {
      for (const obj of input.objectives) {
        const objectiveId =
          obj.id ||
          `obj-${slug(obj.name || 'objective')}-${Date.now().toString(36)}-${counts.objectives}`;
        const objectiveProps: Record<string, any> = {
          objectiveId,
          name: obj.name,
          description: obj.description || obj.name,
          businessUnitId: input.bu,
          linkedProjectIds: Array.isArray(obj.linkedProjectIds)
            ? [...obj.linkedProjectIds, projectId]
            : [projectId],
          progress: Number(obj.progress ?? 0),
          status: obj.status || 'on_track',
          alignmentStrength: Number(obj.alignmentStrength ?? 0.7),
          quarter: obj.quarter || null,
        };
        await this.applyOrCreate(
          palantir,
          PALANTIR_ACTIONS.CREATE_OBJECTIVE,
          PALANTIR_OBJECT_TYPES.OKR,
          objectiveId,
          objectiveProps,
          'objective'
        );
        OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.OKR, objectiveProps);
        counts.objectives++;

        if (Array.isArray(obj.keyResults)) {
          for (const kr of obj.keyResults) {
            const krId =
              kr.id || `kr-${slug(kr.name || 'kr')}-${Date.now().toString(36)}-${counts.keyResults}`;
            const krProps: Record<string, any> = {
              keyResultId: krId,
              objectiveId,
              projectId,
              name: kr.name,
              description: kr.description || kr.name,
              currentValue: Number(kr.currentValue ?? 0),
              targetValue: Number(kr.targetValue ?? 100),
              unit: kr.unit || '%',
              progress:
                kr.targetValue && kr.targetValue !== 0
                  ? (Number(kr.currentValue ?? 0) / Number(kr.targetValue)) * 100
                  : 0,
              status: kr.status || 'on_track',
            };
            await this.applyOrCreate(
              palantir,
              PALANTIR_ACTIONS.CREATE_KEY_RESULT,
              PALANTIR_OBJECT_TYPES.KEY_RESULT,
              krId,
              krProps,
              'keyResult'
            );
            OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.KEY_RESULT, krProps);
            counts.keyResults++;
          }
        }
      }
    }

    // ---- 7. KPIs ----
    if (Array.isArray(input.kpis)) {
      for (const kpi of input.kpis) {
        const kpiId =
          kpi.id || `kpi-${slug(kpi.name || 'kpi')}-${Date.now().toString(36)}-${counts.kpis}`;
        const currentValue = Number(kpi.currentValue ?? 0);
        const targetValue = Number(kpi.targetValue ?? 100);
        const kpiProps: Record<string, any> = {
          kpiId,
          projectId,
          name: kpi.name,
          category: kpi.category || 'operational',
          metricType: kpi.metricType || 'efficiency',
          currentValue,
          targetValue,
          baselineValue: Number(kpi.baselineValue ?? 0),
          unit: kpi.unit || 'units',
          weight: Number(kpi.weight ?? 1),
          status:
            kpi.status ||
            (currentValue >= targetValue
              ? 'exceeding'
              : currentValue >= targetValue * 0.8
                ? 'on_track'
                : 'at_risk'),
        };
        await this.applyOrCreate(
          palantir,
          PALANTIR_ACTIONS.CREATE_KPI,
          PALANTIR_OBJECT_TYPES.KPI,
          kpiId,
          kpiProps,
          'kpi'
        );
        OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.KPI, kpiProps);
        counts.kpis++;
      }
    }

    // ---- 8. GOVERNANCE CHECKPOINTS ----
    if (Array.isArray(input.governanceCheckpoints)) {
      for (const cp of input.governanceCheckpoints) {
        const checkpointId =
          cp.id ||
          `chk-${slug(cp.name || 'checkpoint')}-${Date.now().toString(36)}-${counts.checkpoints}`;
        const checkpointProps: Record<string, any> = {
          checkpointId,
          projectId,
          name: cp.name,
          gate: cp.gate || 'execution',
          rule: cp.rule || cp.name,
          status: cp.status || 'pending',
          required: cp.required ?? true,
          dueDate: cp.dueDate || null,
          owner: cp.owner || '',
          notes: cp.notes || '',
        };
        await this.applyOrCreate(
          palantir,
          PALANTIR_ACTIONS.RECORD_GOVERNANCE_DECISION,
          PALANTIR_OBJECT_TYPES.CHECKPOINT,
          checkpointId,
          checkpointProps,
          'checkpoint'
        );
        OntologyDataProvider.injectLocal?.(PALANTIR_OBJECT_TYPES.CHECKPOINT, checkpointProps);
        counts.checkpoints++;
      }
    }

    // ---- 9. DEPENDENCIES ----
    if (Array.isArray(input.dependencies)) {
      for (const dep of input.dependencies) {
        const depId =
          dep.id || `dep-${slug(dep.name || 'dep')}-${Date.now().toString(36)}`;
        const depProps: Record<string, any> = {
          dependencyId: depId,
          sourceProjectId: projectId,
          targetProjectId: dep.targetProjectId || projectId,
          name: dep.name,
          dependencyType: dep.type || dep.dependencyType || 'finish-to-start',
          status: dep.status || 'open',
          description: dep.description || '',
        };
        await this.applyOrCreate(
          palantir,
          PALANTIR_ACTIONS.CREATE_DEPENDENCY,
          PALANTIR_OBJECT_TYPES.DEPENDENCY,
          depId,
          depProps,
          'dependency'
        );
      }
    }

    // Invalidate cache so agents see the new data immediately
    try {
      OntologyDataProvider.invalidateCache?.();
    } catch {
      // best-effort
    }

    console.log(
      `[PalantirIngest] Project ${projectId} ingested: ` +
        `${counts.features} features, ${counts.stories} stories, ${counts.tasks} tasks, ` +
        `${counts.risks} risks, ${counts.objectives} OKRs, ${counts.keyResults} KRs, ` +
        `${counts.kpis} KPIs, ${counts.checkpoints} checkpoints. ` +
        `${this.warnings.length} warnings.`
    );

    return { projectId, created: counts, warnings: this.warnings };
  }

  // ---- helpers ----

  private async createStory(
    palantir: any,
    st: any,
    projectId: string,
    featureId: string | undefined,
    index: number
  ): Promise<string> {
    const storyId =
      st.id || `story-${slug(st.name || 'story')}-${Date.now().toString(36)}-${index}`;
    const storyProps: Record<string, any> = {
      storyId,
      projectId,
      featureId: featureId || null,
      name: st.name,
      description: st.description || '',
      status: st.status || 'planned',
      storyPoints: Number(st.storyPoints ?? 0),
      acceptanceCriteriaJson: JSON.stringify(st.acceptanceCriteria || []),
    };
    await this.applyOrCreate(
      palantir,
      PALANTIR_ACTIONS.CREATE_STORY,
      PALANTIR_OBJECT_TYPES.STORY,
      storyId,
      storyProps,
      'story'
    );
    return storyId;
  }

  private async createTask(
    palantir: any,
    task: any,
    projectId: string,
    featureId: string | undefined,
    storyId: string | undefined,
    index: number
  ): Promise<string> {
    const taskId =
      task.id || `task-${slug(task.name || 'task')}-${Date.now().toString(36)}-${index}`;
    const taskProps: Record<string, any> = {
      taskId,
      projectId,
      featureId: featureId || null,
      storyId: storyId || null,
      name: task.name,
      status: task.status || 'planned',
      effortHours: Number(task.effortHours ?? 0),
      assignee: task.assignee || '',
      priority: task.priority || 'medium',
      skillsJson: JSON.stringify(task.skills || []),
    };
    await this.applyOrCreate(
      palantir,
      PALANTIR_ACTIONS.CREATE_TASK,
      PALANTIR_OBJECT_TYPES.TASK,
      taskId,
      taskProps,
      'task'
    );
    return taskId;
  }

  /**
   * Try Palantir Action first; if action fails (e.g. parameter mismatch),
   * fall back to direct object create. Both end up in Palantir.
   */
  private async applyOrCreate(
    palantir: any,
    actionName: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, any>,
    label: string
  ): Promise<void> {
    try {
      await palantir.applyAction(actionName, properties);
    } catch (actionErr: any) {
      try {
        await palantir.createObject(objectType, primaryKey, properties);
      } catch (createErr: any) {
        const msg = `${label} ${primaryKey}: action failed (${actionErr.message?.slice(0, 80)}), createObject failed (${createErr.message?.slice(0, 80)})`;
        console.warn(`[PalantirIngest] ${msg}`);
        this.warnings.push(msg);
      }
    }
  }
}

let _ingestService: PalantirIngestService | null = null;
export function getPalantirIngestService(): PalantirIngestService {
  if (!_ingestService) _ingestService = new PalantirIngestService();
  return _ingestService;
}
