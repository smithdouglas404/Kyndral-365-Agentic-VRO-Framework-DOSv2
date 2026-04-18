/**
 * EXCEL / CSV PROJECT IMPORTER
 *
 * Parses an uploaded .xlsx, .xls, or .csv file into the SafeProjectInput
 * shape consumed by PalantirIngestService.
 *
 * Excel convention (multi-sheet workbook):
 *   Sheet "Project"      key/value rows describing the project (name, bu, ...)
 *   Sheet "Features"     one row per feature
 *   Sheet "Stories"      one row per story
 *   Sheet "Tasks"        one row per task
 *   Sheet "Risks"        one row per risk
 *   Sheet "Milestones"   one row per milestone
 *   Sheet "Resources"    one row per resource
 *   Sheet "Objectives"   one row per OKR objective
 *   Sheet "KPIs"         one row per KPI
 *
 * CSV convention (single sheet, flat list of tasks): the parser will treat
 * the whole sheet as the "Tasks" tab. Project name and BU must be supplied
 * by the caller (typically via form fields on the upload UI).
 */

import * as XLSX from 'xlsx';
import type { SafeProjectInput } from './PalantirIngestService.js';

type Row = Record<string, any>;

function num(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function readSheet(wb: XLSX.WorkBook, name: string): Row[] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' });
}

function readKeyValueSheet(wb: XLSX.WorkBook, name: string): Record<string, any> {
  const sheet = wb.Sheets[name];
  if (!sheet) return {};
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: '' }) as any[];
  const out: Record<string, any> = {};
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const key = str(row[0]);
    if (!key) continue;
    out[key] = row[1];
  }
  return out;
}

function caseInsensitive(obj: Record<string, any>, key: string): any {
  if (key in obj) return obj[key];
  const lower = key.toLowerCase();
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === lower) return obj[k];
  }
  return undefined;
}

export interface ImporterOptions {
  /** Fallback project name used when the file does not specify one (e.g. CSV uploads). */
  fallbackName?: string;
  /** Fallback business unit used when the file does not specify one. */
  fallbackBu?: string;
}

export class ExcelCsvProjectImporter {
  /**
   * Parse a buffer (xlsx, xls, or csv) into a SafeProjectInput.
   * Throws if the result has no project name and none was supplied as fallback.
   */
  parse(buffer: Buffer, filename: string, opts: ImporterOptions = {}): SafeProjectInput {
    const isCsv = /\.csv$/i.test(filename);
    const wb = XLSX.read(buffer, { type: 'buffer', raw: false });

    // CSV path: single sheet treated as flat task list
    if (isCsv || wb.SheetNames.length === 1) {
      const sheetName = wb.SheetNames[0];
      const projectMeta = sheetName?.toLowerCase() === 'project'
        ? readKeyValueSheet(wb, sheetName)
        : {};
      const taskRows = sheetName?.toLowerCase() === 'project'
        ? []
        : readSheet(wb, sheetName);

      const name =
        str(caseInsensitive(projectMeta, 'name')) ||
        opts.fallbackName ||
        filename.replace(/\.[^.]+$/, '');
      const bu =
        str(caseInsensitive(projectMeta, 'bu')) ||
        str(caseInsensitive(projectMeta, 'businessUnit')) ||
        opts.fallbackBu;

      if (!bu) {
        throw new Error(
          'CSV import requires a businessUnit. Either include a "Project" sheet with bu=<value> or supply bu in the upload form.'
        );
      }

      return {
        name,
        bu,
        description: str(caseInsensitive(projectMeta, 'description')),
        status: str(caseInsensitive(projectMeta, 'status')),
        tasks: taskRows.map((r) => this.normalizeTask(r)).filter((t) => t.name),
      };
    }

    // Multi-sheet workbook
    const projectMeta = readKeyValueSheet(wb, this.findSheet(wb, 'Project') || 'Project');

    const name =
      str(caseInsensitive(projectMeta, 'name')) || opts.fallbackName;
    if (!name) {
      throw new Error('Excel import requires a "Project" sheet with a "name" row.');
    }
    const bu =
      str(caseInsensitive(projectMeta, 'bu')) ||
      str(caseInsensitive(projectMeta, 'businessUnit')) ||
      opts.fallbackBu;
    if (!bu) {
      throw new Error('Excel import requires a "Project" sheet with a "bu" (business unit) row.');
    }

    const input: SafeProjectInput = {
      name,
      bu,
      description: str(caseInsensitive(projectMeta, 'description')),
      status: str(caseInsensitive(projectMeta, 'status')),
      priority: str(caseInsensitive(projectMeta, 'priority')),
      expectedROI: num(caseInsensitive(projectMeta, 'expectedROI')),
      roiValue: num(caseInsensitive(projectMeta, 'roiValue')),
      artName: str(caseInsensitive(projectMeta, 'artName')),
      portfolioTheme: str(caseInsensitive(projectMeta, 'portfolioTheme')),
      safeStage: str(caseInsensitive(projectMeta, 'safeStage')),
      timeline: {
        startDate: str(caseInsensitive(projectMeta, 'startDate')),
        endDate: str(caseInsensitive(projectMeta, 'endDate')),
      },
      budget: {
        total: num(caseInsensitive(projectMeta, 'budgetTotal')),
        spent: num(caseInsensitive(projectMeta, 'budgetSpent')),
        unit: str(caseInsensitive(projectMeta, 'budgetUnit')) || 'USD',
      },
      features: readSheet(wb, this.findSheet(wb, 'Features') || 'Features').map((r) =>
        this.normalizeFeature(r)
      ),
      stories: readSheet(wb, this.findSheet(wb, 'Stories') || 'Stories').map((r) =>
        this.normalizeStory(r)
      ),
      tasks: readSheet(wb, this.findSheet(wb, 'Tasks') || 'Tasks').map((r) =>
        this.normalizeTask(r)
      ),
      risks: readSheet(wb, this.findSheet(wb, 'Risks') || 'Risks').map((r) =>
        this.normalizeRisk(r)
      ),
      milestones: readSheet(wb, this.findSheet(wb, 'Milestones') || 'Milestones').map((r) =>
        this.normalizeMilestone(r)
      ),
      resources: readSheet(wb, this.findSheet(wb, 'Resources') || 'Resources').map((r) =>
        this.normalizeResource(r)
      ),
      objectives: readSheet(wb, this.findSheet(wb, 'Objectives') || 'Objectives').map((r) =>
        this.normalizeObjective(r)
      ),
      kpis: readSheet(wb, this.findSheet(wb, 'KPIs') || 'KPIs').map((r) =>
        this.normalizeKpi(r)
      ),
    };

    // Strip empty arrays so PalantirIngestService loops don't iterate junk
    for (const k of [
      'features',
      'stories',
      'tasks',
      'risks',
      'milestones',
      'resources',
      'objectives',
      'kpis',
    ] as const) {
      if (Array.isArray(input[k]) && input[k]!.filter((x: any) => x && (x.name || x.id)).length === 0) {
        delete (input as any)[k];
      }
    }

    return input;
  }

  private findSheet(wb: XLSX.WorkBook, expected: string): string | undefined {
    const lower = expected.toLowerCase();
    return wb.SheetNames.find((n) => n.toLowerCase() === lower);
  }

  private normalizeFeature(r: Row) {
    return {
      id: str(r.id),
      name: str(r.name),
      status: str(r.status),
      storyPoints: num(r.storyPoints),
      wsjfScore: num(r.wsjfScore),
      description: str(r.description),
    };
  }

  private normalizeStory(r: Row) {
    return {
      id: str(r.id),
      name: str(r.name),
      featureId: str(r.featureId),
      status: str(r.status),
      storyPoints: num(r.storyPoints),
      acceptanceCriteria: str(r.acceptanceCriteria),
    };
  }

  private normalizeTask(r: Row) {
    return {
      id: str(r.id),
      name: str(r.name) || str(r.title) || str(r.task),
      storyId: str(r.storyId),
      status: str(r.status),
      effortHours: num(r.effortHours) ?? num(r.hours),
      assignee: str(r.assignee) || str(r.owner),
      skills: str(r.skills),
    };
  }

  private normalizeRisk(r: Row) {
    return {
      id: str(r.id),
      name: str(r.name) || str(r.title),
      probability: num(r.probability),
      impact: num(r.impact),
      mitigation: str(r.mitigation),
      status: str(r.status),
      owner: str(r.owner),
    };
  }

  private normalizeMilestone(r: Row) {
    return {
      id: str(r.id),
      name: str(r.name),
      dueDate: str(r.dueDate),
      completedDate: str(r.completedDate),
      status: str(r.status),
      type: str(r.type),
    };
  }

  private normalizeResource(r: Row) {
    return {
      id: str(r.id),
      name: str(r.name),
      role: str(r.role),
      allocation: num(r.allocation),
      skills: str(r.skills),
      department: str(r.department),
    };
  }

  private normalizeObjective(r: Row) {
    return {
      id: str(r.id),
      name: str(r.name) || str(r.title),
      description: str(r.description),
      progress: num(r.progress),
      keyResults: str(r.keyResults),
    };
  }

  private normalizeKpi(r: Row) {
    return {
      id: str(r.id),
      name: str(r.name),
      currentValue: num(r.currentValue),
      targetValue: num(r.targetValue),
      unit: str(r.unit),
    };
  }

  /**
   * Build an example .xlsx workbook the user can download as a template.
   */
  buildTemplateBuffer(): Buffer {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['name', 'Aurora Customer Portal Modernization'],
        ['bu', 'enterprise-it'],
        ['description', 'Modernize the customer-facing portal to a SAFe-aligned product platform.'],
        ['status', 'in-progress'],
        ['priority', 'high'],
        ['expectedROI', 1500000],
        ['roiValue', 0],
        ['artName', 'Customer Experience ART'],
        ['portfolioTheme', 'Customer Engagement'],
        ['safeStage', 'implementing'],
        ['startDate', '2026-01-15'],
        ['endDate', '2026-12-31'],
        ['budgetTotal', 2400000],
        ['budgetSpent', 1320000],
        ['budgetUnit', 'USD'],
      ]),
      'Project'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { id: 'feat-1', name: 'Unified Identity', status: 'in-progress', storyPoints: 34, wsjfScore: 18 },
        { id: 'feat-2', name: 'Self-Serve Billing', status: 'planned', storyPoints: 21, wsjfScore: 12 },
      ]),
      'Features'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { id: 'st-1', name: 'SSO with Azure AD', featureId: 'feat-1', status: 'in-progress', storyPoints: 8 },
        { id: 'st-2', name: 'Password reset flow', featureId: 'feat-1', status: 'done', storyPoints: 5 },
      ]),
      'Stories'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { id: 't-1', name: 'Implement OIDC handshake', storyId: 'st-1', status: 'in-progress', effortHours: 16, assignee: 'a.singh' },
        { id: 't-2', name: 'Write SSO integration tests', storyId: 'st-1', status: 'todo', effortHours: 8, assignee: 'r.lee' },
      ]),
      'Tasks'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { id: 'r-1', name: 'Vendor SSO library EOL', probability: 0.6, impact: 0.8, mitigation: 'Evaluate alternative library by PI-3', status: 'open', owner: 'security-team' },
      ]),
      'Risks'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { id: 'm-1', name: 'PI-2 Demo', dueDate: '2026-04-30', status: 'on-track', type: 'PI Demo' },
        { id: 'm-2', name: 'Go-live Wave 1', dueDate: '2026-09-15', status: 'at-risk', type: 'Release' },
      ]),
      'Milestones'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { id: 'res-1', name: 'Aanya Singh', role: 'Senior Engineer', allocation: 100, skills: 'Node,TS,OAuth', department: 'Platform' },
        { id: 'res-2', name: 'Rahul Lee', role: 'QA Lead', allocation: 80, skills: 'Cypress,Playwright', department: 'Quality' },
      ]),
      'Resources'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { id: 'okr-1', name: 'Reduce sign-in friction by 40%', progress: 35 },
      ]),
      'Objectives'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { id: 'kpi-1', name: 'Avg sign-in time (s)', currentValue: 4.2, targetValue: 1.5, unit: 'seconds' },
        { id: 'kpi-2', name: 'Portal NPS', currentValue: 22, targetValue: 45, unit: 'score' },
      ]),
      'KPIs'
    );

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}

let _instance: ExcelCsvProjectImporter | null = null;
export function getExcelCsvProjectImporter(): ExcelCsvProjectImporter {
  if (!_instance) _instance = new ExcelCsvProjectImporter();
  return _instance;
}
