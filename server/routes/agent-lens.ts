/**
 * AGENT LENS — insight-first dashboards for each agent.
 *
 * Each insight is a small handler that pulls real data from Palantir Foundry
 * (via PalantirGraphService) and returns a structured tile payload OR an
 * honest `{ available: false, reason }` response when the underlying data
 * isn't ingested yet. NO MOCKS. NO PLACEHOLDERS WITH FAKE NUMBERS.
 *
 * Frontend reads /api/agent-lens/agents to build navigation, then loads
 * /api/agent-lens/insight/:id per tile.
 */

import { Router, Request, Response } from 'express';
import { palantirGraphService } from '../services/PalantirGraphService.js';

const router = Router();

// ─── Types ───────────────────────────────────────────────────────────────────
type Severity = 'critical' | 'high' | 'warning' | 'info' | 'good';
type TileKind = 'metric' | 'list' | 'rank' | 'table' | 'heatmap' | 'narrative';

interface TilePayload {
  available: boolean;
  reason?: string;
  kind?: TileKind;
  metric?: { value: number | string; label: string; severity?: Severity; sublabel?: string };
  items?: Array<{ id?: string; label: string; sublabel?: string; severity?: Severity; value?: string | number; linkTo?: string }>;
  table?: { columns: string[]; rows: Array<Array<string | number>> };
  heatmap?: { x: string[]; y: string[]; values: number[][]; legend?: string };
  narrative?: string;
  context?: string; // short "why it matters" / recommendation
}

interface InsightDef {
  id: string;
  title: string;
  description: string;
  agentIds: string[]; // which agents show this tile on their lens
  size: 'sm' | 'md' | 'lg' | 'xl';
  compute: () => Promise<TilePayload>;
}

// ─── Data helpers ────────────────────────────────────────────────────────────
const SUB_PREFIXES = ['[task]', '[story]', '[feature]', '[subtask]', '[agent]', '[jira', '[division]'];
const isRealProject = (p: any) => {
  const label = (p.name || p.title || '').toLowerCase();
  return !SUB_PREFIXES.some(pre => label.startsWith(pre));
};

async function svc() {
  await palantirGraphService.initialize();
  return (palantirGraphService as any).palantirService as any | null;
}

async function listAll(type: string, pageSize = 200): Promise<any[]> {
  const s = await svc();
  if (!s) return [];
  try {
    const r = await s.listObjects(type, { pageSize });
    return r?.data || [];
  } catch { return []; }
}

const sevRank = (s?: Severity) => ({ critical: 0, high: 1, warning: 2, info: 3, good: 4 }[s || 'info']);

const NO_PALANTIR: TilePayload = { available: false, reason: 'Palantir Foundry connection unavailable' };

// ─── Insight catalog ─────────────────────────────────────────────────────────
const INSIGHTS: InsightDef[] = [];
const def = (i: InsightDef) => { INSIGHTS.push(i); };

// ============================================================================
// PMO — Delivery & Health
// ============================================================================
def({
  id: 'portfolio-heatmap',
  title: 'Portfolio Heatmap',
  description: 'Every project colored by status × severity — single-screen exec view.',
  agentIds: ['pmo', 'integrated'],
  size: 'xl',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    if (projects.length === 0) return { available: false, reason: 'No projects found in Palantir' };
    const buckets: Record<string, Record<string, number>> = {};
    const statusOrder = ['On Track', 'At Risk', 'Critical', 'Complete', 'Not Started'];
    const sevOrder: Severity[] = ['good', 'warning', 'high', 'critical', 'info'];
    for (const p of projects) {
      // Derive severity from CPI/SPI when available, else from status text.
      let sev: Severity = 'info';
      if (typeof p.cpi === 'number' && typeof p.spi === 'number') {
        if (p.cpi < 0.85 || p.spi < 0.85) sev = 'critical';
        else if (p.cpi < 0.95 || p.spi < 0.95) sev = 'high';
        else if (p.cpi < 1.0 || p.spi < 1.0) sev = 'warning';
        else sev = 'good';
      } else if ((p.status || '').toLowerCase().includes('risk')) sev = 'high';
      else if ((p.status || '').toLowerCase().includes('complete')) sev = 'good';

      const status = p.status || 'Unknown';
      buckets[status] = buckets[status] || {};
      buckets[status][sev] = (buckets[status][sev] || 0) + 1;
    }
    const xLabels = Object.keys(buckets).sort((a, b) => statusOrder.indexOf(a) - statusOrder.indexOf(b));
    const values = sevOrder.map(s => xLabels.map(x => buckets[x]?.[s] || 0));
    return {
      available: true,
      kind: 'heatmap',
      heatmap: { x: xLabels, y: sevOrder.map(s => s.toUpperCase()), values, legend: 'project count' },
      context: `${projects.length} real projects across ${xLabels.length} status buckets.`,
    };
  },
});

def({
  id: 'at-risk-cascade',
  title: 'At-Risk Cascade',
  description: 'Projects whose slip would propagate via dependencies to 3+ downstream projects.',
  agentIds: ['pmo', 'planning', 'integrated'],
  size: 'lg',
  compute: async () => {
    const deps = (await listAll('AtlasDependency')).filter(d =>
      d.sourceProjectId && d.targetProjectId && d.sourceProjectId !== d.targetProjectId &&
      d.status !== 'resolved' && d.status !== 'completed'
    );
    if (deps.length === 0) return { available: false, reason: 'No active cross-project dependencies in Palantir' };
    // Build adjacency: source -> set of targets (downstream impact)
    const downstream = new Map<string, Set<string>>();
    for (const d of deps) {
      const set = downstream.get(d.sourceProjectId) || new Set<string>();
      set.add(d.targetProjectId);
      downstream.set(d.sourceProjectId, set);
    }
    // Transitive closure (BFS) — count reachable downstreams
    const reachable = new Map<string, number>();
    for (const start of downstream.keys()) {
      const seen = new Set<string>();
      const q = [start];
      while (q.length) {
        const cur = q.shift()!;
        for (const next of downstream.get(cur) || []) {
          if (!seen.has(next)) { seen.add(next); q.push(next); }
        }
      }
      reachable.set(start, seen.size);
    }
    const ranked = [...reachable.entries()]
      .filter(([, n]) => n >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    if (ranked.length === 0) return { available: true, kind: 'metric', metric: { value: 0, label: 'projects with 3+ downstream cascade', severity: 'good' } };
    return {
      available: true,
      kind: 'rank',
      items: ranked.map(([pid, n]) => ({
        id: pid,
        label: pid,
        sublabel: `${n} downstream project${n === 1 ? '' : 's'} depend on this`,
        value: n,
        severity: n >= 5 ? 'critical' : n >= 3 ? 'high' : 'warning',
      })),
      context: 'A slip on these projects cascades through the dependency graph.',
    };
  },
});

def({
  id: 'stale-projects',
  title: 'Stale Projects',
  description: 'Active projects with no fact broadcast or update in the last 14 days.',
  agentIds: ['pmo', 'governance', 'integrated'],
  size: 'md',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    if (projects.length === 0) return { available: false, reason: 'No projects found in Palantir' };
    const FOURTEEN_D = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const stale = projects.filter(p => {
      if (p.status === 'Complete' || p.status === 'completed') return false;
      const t = p.lastUpdatedAt || p.updatedAt || p.lastModified;
      if (!t) return true; // never updated → stale
      const ts = new Date(t).getTime();
      return !isNaN(ts) && (now - ts) > FOURTEEN_D;
    });
    return {
      available: true,
      kind: 'list',
      metric: { value: stale.length, label: 'stale projects', severity: stale.length > 10 ? 'critical' : stale.length > 3 ? 'high' : 'warning' },
      items: stale.slice(0, 10).map(p => ({
        id: p.id || p.projectId,
        label: p.name || p.title || p.id,
        sublabel: p.lastUpdatedAt ? `last updated ${new Date(p.lastUpdatedAt).toLocaleDateString()}` : 'no update history',
        severity: 'warning',
      })),
      context: 'Stale projects often hide ghost work or unresolved blockers.',
    };
  },
});

def({
  id: 'schedule-slip-velocity',
  title: 'Schedule Slip Velocity',
  description: 'Projects whose schedule performance is eroding right now — early warning before SPI tanks.',
  agentIds: ['pmo', 'planning'],
  size: 'md',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    const withSpi = projects.filter(p => typeof p.spi === 'number' && p.status !== 'Complete' && p.status !== 'completed');
    if (withSpi.length === 0) return { available: false, reason: 'No SPI on AtlasProject records' };
    // Without SPI history we approximate slip velocity by current SPI gap from 1.0,
    // weighted by remaining work (1 - milestoneProgress) since slips on early-stage projects compound more.
    const slipping = withSpi
      .map(p => {
        const gap = Math.max(0, 1 - p.spi);
        const remaining = typeof p.milestoneProgress === 'number' ? Math.max(0.05, 1 - p.milestoneProgress) : 1;
        const score = gap * remaining;
        return { p, gap, score };
      })
      .filter(x => x.gap > 0.05)
      .sort((a, b) => b.score - a.score);
    return {
      available: true,
      kind: 'rank',
      metric: { value: slipping.length, label: 'projects losing schedule float', severity: slipping.length > 10 ? 'critical' : slipping.length > 0 ? 'high' : 'good' },
      items: slipping.slice(0, 10).map(({ p, gap }) => ({
        id: p.id || p.projectId,
        label: p.name || p.title,
        sublabel: `SPI ${p.spi.toFixed(2)} · ${(gap * 100).toFixed(0)}% behind plan${typeof p.milestoneProgress === 'number' ? ` · ${(p.milestoneProgress * 100).toFixed(0)}% complete` : ''}`,
        value: Number((gap * 100).toFixed(0)),
        severity: p.spi < 0.8 ? 'critical' : p.spi < 0.9 ? 'high' : 'warning',
      })),
      context: 'Approximated from current SPI + remaining work. True slip velocity needs SPI history (not yet ingested).',
    };
  },
});

def({
  id: 'milestone-cliff',
  title: 'Milestone Concentration',
  description: 'Calendar weeks with 5+ milestones due — delivery cliffs.',
  agentIds: ['pmo', 'tmo'],
  size: 'md',
  compute: async () => {
    return {
      available: false,
      reason: 'Requires AtlasMilestone object type or milestonesJson on AtlasProject. Not ingested yet.',
    };
  },
});

def({
  id: 'resource-conflict',
  title: 'Resource Conflicts',
  description: 'Same person/team allocated >100% across projects in the same window.',
  agentIds: ['pmo', 'planning'],
  size: 'md',
  compute: async () => {
    return {
      available: false,
      reason: 'Requires AtlasResource object type or resourcesJson on AtlasProject. Not ingested yet.',
    };
  },
});

def({
  id: 'pm-span-of-control',
  title: 'PM Span of Control',
  description: 'PMs/RTEs owning more than 5 active projects (overload signal).',
  agentIds: ['pmo'],
  size: 'md',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    if (projects.length === 0) return { available: false, reason: 'No projects found in Palantir' };
    const counts = new Map<string, number>();
    for (const p of projects) {
      const owner = p.ownerName || p.projectManager || p.pmName || p.ownerId;
      if (!owner) continue;
      if (p.status === 'Complete' || p.status === 'completed') continue;
      counts.set(owner, (counts.get(owner) || 0) + 1);
    }
    if (counts.size === 0) return { available: false, reason: 'AtlasProject records do not carry an owner/PM field' };
    const overloaded = [...counts.entries()].filter(([, c]) => c >= 5).sort((a, b) => b[1] - a[1]);
    return {
      available: true,
      kind: 'rank',
      metric: { value: overloaded.length, label: 'overloaded PMs', severity: overloaded.length > 0 ? 'high' : 'good' },
      items: overloaded.slice(0, 8).map(([name, c]) => ({
        id: name,
        label: name,
        sublabel: `${c} active projects`,
        value: c,
        severity: c >= 8 ? 'critical' : 'high',
      })),
    };
  },
});

// ============================================================================
// VRO — Value Realization
// ============================================================================
def({
  id: 'value-at-risk',
  title: 'Value at Risk',
  description: 'Sum of expected value × probability of realization, ranked by gap to plan.',
  agentIds: ['vro', 'integrated'],
  size: 'lg',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    // Require monetary expected + realized fields (not ratio-style ROI). No proxying.
    const withMonetary = projects.filter(p =>
      typeof p.expectedValue === 'number' && typeof p.realizedValue === 'number'
    );
    if (withMonetary.length === 0) {
      return { available: false, reason: 'Requires monetary expectedValue + realizedValue per AtlasProject. Currently only ratio-style ROI fields are present.' };
    }
    let totalExpected = 0;
    let totalRealized = 0;
    const ranked = withMonetary.map(p => {
      const expected = p.expectedValue;
      const realized = p.realizedValue;
      const gap = expected - realized;
      totalExpected += expected;
      totalRealized += realized;
      return { id: p.id || p.projectId, name: p.name || p.title, expected, realized, gap };
    }).sort((a, b) => b.gap - a.gap);
    const valueAtRisk = totalExpected - totalRealized;
    const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
    return {
      available: true,
      kind: 'metric',
      metric: {
        value: fmt(valueAtRisk),
        label: 'value at risk',
        sublabel: `${fmt(totalRealized)} realized of ${fmt(totalExpected)} expected`,
        severity: valueAtRisk / Math.max(totalExpected, 1) > 0.3 ? 'critical' : valueAtRisk / Math.max(totalExpected, 1) > 0.15 ? 'high' : 'warning',
      },
      items: ranked.slice(0, 8).map(r => ({
        id: r.id, label: r.name,
        sublabel: `gap ${fmt(r.gap)} (${fmt(r.realized)}/${fmt(r.expected)})`,
        value: Math.round(r.gap),
        severity: r.gap / Math.max(r.expected, 1) > 0.5 ? 'critical' : 'high',
      })),
      context: 'Largest dollar gaps between planned and realized value.',
    };
  },
});

def({
  id: 'roi-reality-check',
  title: 'ROI Reality Check',
  description: 'Actual ROI vs business-case ROI per project, with variance.',
  agentIds: ['vro', 'finops'],
  size: 'lg',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    const withRoi = projects.filter(p => typeof p.expectedRoi === 'number' && (typeof p.actualCost === 'number' || typeof p.realizedValue === 'number'));
    if (withRoi.length === 0) return { available: false, reason: 'Projects need expectedRoi + actualCost or realizedValue to compute' };
    const rows = withRoi.map(p => {
      const expected = p.expectedRoi;
      const actual = p.realizedValue && p.actualCost ? (p.realizedValue / p.actualCost) : 0;
      const variance = expected ? ((actual - expected) / expected) * 100 : 0;
      return [p.name || p.id, expected.toFixed(2), actual.toFixed(2), `${variance.toFixed(0)}%`];
    }).sort((a, b) => parseFloat(a[3] as string) - parseFloat(b[3] as string)).slice(0, 12);
    return {
      available: true,
      kind: 'table',
      table: { columns: ['Project', 'Expected ROI', 'Actual ROI', 'Variance'], rows },
      context: 'Negative variance = under-delivering vs the original business case.',
    };
  },
});

def({
  id: 'strategic-alignment-score',
  title: 'Strategic Alignment Score',
  description: '% of portfolio spend funding the top 3 strategic objectives.',
  agentIds: ['vro', 'okr', 'integrated'],
  size: 'md',
  compute: async () => {
    const [projects, objectives] = await Promise.all([listAll('AtlasProject'), listAll('AtlasObjective')]);
    const real = projects.filter(isRealProject);
    if (real.length === 0 || objectives.length === 0) return { available: false, reason: 'Need both AtlasProject and AtlasObjective records' };
    const totalSpend = real.reduce((s, p) => s + (p.budget || p.actualCost || 0), 0);
    if (totalSpend === 0) return { available: false, reason: 'No budget/actualCost on AtlasProject — cannot compute spend share' };
    const spendByObjective = new Map<string, number>();
    for (const obj of objectives) {
      const ids: string[] = obj.linkedProjectIds || [];
      const spend = ids.reduce((s, pid) => {
        const p = real.find(rp => (rp.id || rp.projectId) === pid);
        return s + (p?.budget || p?.actualCost || 0);
      }, 0);
      spendByObjective.set(obj.name || obj.title || obj.id, spend);
    }
    const top3 = [...spendByObjective.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const top3Total = top3.reduce((s, [, v]) => s + v, 0);
    const pct = (top3Total / totalSpend) * 100;
    return {
      available: true,
      kind: 'metric',
      metric: {
        value: `${pct.toFixed(0)}%`,
        label: 'spend on top 3 strategic objectives',
        severity: pct > 60 ? 'good' : pct > 40 ? 'warning' : 'high',
      },
      items: top3.map(([name, v]) => ({
        label: name,
        sublabel: `$${(v / 1_000_000).toFixed(1)}M`,
        value: Math.round((v / totalSpend) * 100),
      })),
      context: pct < 40 ? 'Portfolio spend is fragmented across many objectives.' : 'Spend is concentrated on stated priorities.',
    };
  },
});

def({
  id: 'okr-coverage-gap',
  title: 'OKR Coverage Gap',
  description: 'Key Results that have no funded project pointing at them.',
  agentIds: ['vro', 'okr'],
  size: 'md',
  compute: async () => {
    const [krs, objectives] = await Promise.all([listAll('AtlasKeyResult'), listAll('AtlasObjective')]);
    if (krs.length === 0) return { available: false, reason: 'No AtlasKeyResult records found' };
    const objectivesById = new Map(objectives.map(o => [o.id || o.objectiveId, o]));
    const orphanKrs = krs.filter(kr => {
      const obj = objectivesById.get(kr.objectiveId);
      const projectIds: string[] = obj?.linkedProjectIds || [];
      return projectIds.length === 0;
    });
    return {
      available: true,
      kind: 'list',
      metric: { value: orphanKrs.length, label: 'KRs with no funded delivery', severity: orphanKrs.length > 5 ? 'critical' : orphanKrs.length > 0 ? 'high' : 'good' },
      items: orphanKrs.slice(0, 8).map(kr => ({
        id: kr.id || kr.keyResultId,
        label: kr.name || kr.title || kr.id,
        sublabel: kr.objectiveId ? `objective: ${kr.objectiveId}` : 'no parent objective',
        severity: 'high',
      })),
      context: 'Strategy without delivery — these KRs cannot be hit without scoping a project.',
    };
  },
});

def({
  id: 'sunset-candidates',
  title: 'Sunset Candidates',
  description: 'Active projects whose value-to-cost ratio dropped below 1.0.',
  agentIds: ['vro', 'finops', 'integrated'],
  size: 'md',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    const withMath = projects.filter(p => typeof p.actualCost === 'number' && p.actualCost > 0 && (typeof p.realizedValue === 'number' || typeof p.expectedValue === 'number'));
    if (withMath.length === 0) return { available: false, reason: 'Need actualCost + realizedValue/expectedValue per project' };
    const candidates = withMath
      .map(p => {
        const value = p.realizedValue || p.expectedValue || 0;
        const ratio = value / p.actualCost;
        return { p, ratio };
      })
      .filter(x => x.ratio < 1.0 && x.p.status !== 'Complete' && x.p.status !== 'completed')
      .sort((a, b) => a.ratio - b.ratio);
    return {
      available: true,
      kind: 'list',
      metric: { value: candidates.length, label: 'projects underwater', severity: candidates.length > 5 ? 'critical' : 'warning' },
      items: candidates.slice(0, 10).map(({ p, ratio }) => ({
        id: p.id || p.projectId,
        label: p.name || p.title,
        sublabel: `value-to-cost ${ratio.toFixed(2)} (kill candidate)`,
        value: ratio,
        severity: ratio < 0.5 ? 'critical' : 'high',
      })),
      context: 'Hard conversation candidates — value delivered is less than dollars spent.',
    };
  },
});

def({
  id: 'benefit-decay',
  title: 'Benefit Decay',
  description: 'Projects where realized value is declining post go-live.',
  agentIds: ['vro'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Requires time-series of realizedValue per project (post-go-live KPI history). Not ingested yet.',
  }),
});

def({
  id: 'time-to-value',
  title: 'Time to Value Distribution',
  description: 'Distribution of days from go-live to first measurable benefit.',
  agentIds: ['vro'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Requires goLiveDate + firstBenefitDate per project. Not ingested yet.',
  }),
});

def({
  id: 'value-leakage',
  title: 'Value Leakage Per Dollar',
  description: 'Worst $-spent-to-$-value ratios across the portfolio.',
  agentIds: ['vro', 'finops'],
  size: 'md',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    const withMath = projects.filter(p => p.actualCost > 0 && (p.realizedValue || p.expectedValue));
    if (withMath.length === 0) return { available: false, reason: 'Need actualCost + value per project' };
    const ranked = withMath.map(p => {
      const value = p.realizedValue || (p.expectedValue || 0) * (p.milestoneProgress || 0);
      const leakage = p.actualCost - value;
      return { p, leakage };
    }).sort((a, b) => b.leakage - a.leakage).slice(0, 10);
    return {
      available: true,
      kind: 'rank',
      items: ranked.map(({ p, leakage }) => ({
        id: p.id || p.projectId,
        label: p.name || p.title,
        sublabel: `$${(leakage / 1_000_000).toFixed(1)}M leaked`,
        value: Math.round(leakage),
        severity: leakage > 5_000_000 ? 'critical' : leakage > 1_000_000 ? 'high' : 'warning',
      })),
      context: 'Dollars spent without proportional value delivered — efficiency targets.',
    };
  },
});

// ============================================================================
// FinOps
// ============================================================================
def({
  id: 'burn-rate-anomaly',
  title: 'Burn Rate Anomalies',
  description: 'Projects spending materially above their planned burn.',
  agentIds: ['finops'],
  size: 'md',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    const withCpi = projects.filter(p => typeof p.cpi === 'number');
    if (withCpi.length === 0) return { available: false, reason: 'No CPI on AtlasProject records' };
    const overrun = withCpi.filter(p => p.cpi < 0.9).sort((a, b) => a.cpi - b.cpi);
    return {
      available: true,
      kind: 'list',
      metric: { value: overrun.length, label: 'projects burning hot', severity: overrun.length > 5 ? 'critical' : 'high' },
      items: overrun.slice(0, 10).map(p => ({
        id: p.id || p.projectId,
        label: p.name || p.title,
        sublabel: `CPI ${p.cpi.toFixed(2)} · $${((p.actualCost || 0) / 1_000_000).toFixed(1)}M spent of $${((p.budget || 0) / 1_000_000).toFixed(1)}M`,
        severity: p.cpi < 0.75 ? 'critical' : 'high',
      })),
      context: 'CPI < 0.9 means $1 of value costs >$1.10 to deliver.',
    };
  },
});

def({
  id: 'budget-reforecast-confidence',
  title: 'Budget Reforecast Risk',
  description: 'Projects where the original budget will likely be exceeded based on current burn.',
  agentIds: ['finops'],
  size: 'md',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    const withMath = projects.filter(p => p.budget > 0 && p.actualCost > 0 && typeof p.milestoneProgress === 'number');
    if (withMath.length === 0) return { available: false, reason: 'Need budget + actualCost + milestoneProgress per project' };
    const projected = withMath.map(p => {
      const projectedTotal = p.milestoneProgress > 0 ? p.actualCost / p.milestoneProgress : p.actualCost;
      const overrun = projectedTotal - p.budget;
      const overrunPct = (overrun / p.budget) * 100;
      return { p, projectedTotal, overrunPct };
    }).filter(x => x.overrunPct > 5).sort((a, b) => b.overrunPct - a.overrunPct);
    return {
      available: true,
      kind: 'rank',
      metric: { value: projected.length, label: 'projects projected to overrun', severity: projected.length > 5 ? 'critical' : 'warning' },
      items: projected.slice(0, 8).map(({ p, projectedTotal, overrunPct }) => ({
        id: p.id || p.projectId,
        label: p.name || p.title,
        sublabel: `projected $${(projectedTotal / 1_000_000).toFixed(1)}M vs budget $${(p.budget / 1_000_000).toFixed(1)}M`,
        value: Math.round(overrunPct),
        severity: overrunPct > 25 ? 'critical' : overrunPct > 10 ? 'high' : 'warning',
      })),
      context: 'Forward-looking — extrapolates current burn to project completion.',
    };
  },
});

def({
  id: 'vendor-concentration',
  title: 'Vendor Concentration',
  description: 'Top vendors absorbing the majority of portfolio spend.',
  agentIds: ['finops', 'governance'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Requires vendorId/supplierName field on AtlasProject or AtlasBudget. Not ingested yet.',
  }),
});

def({
  id: 'capex-opex-drift',
  title: 'Capex / Opex Drift',
  description: 'Projects classified one way that are spending like the other.',
  agentIds: ['finops', 'governance'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Requires capexClassification field on AtlasBudget. Not ingested yet.',
  }),
});

// ============================================================================
// Risk
// ============================================================================
def({
  id: 'unmitigated-critical-risks',
  title: 'Unmitigated Critical Risks',
  description: 'Critical/high risks with no mitigation plan and not yet resolved.',
  agentIds: ['risk', 'pmo', 'integrated'],
  size: 'md',
  compute: async () => {
    const risks = await listAll('AtlasRisk');
    if (risks.length === 0) return { available: false, reason: 'No AtlasRisk records found' };
    const open = risks.filter(r =>
      (r.severity === 'critical' || r.severity === 'high') &&
      !r.mitigationPlan &&
      r.status !== 'resolved'
    );
    return {
      available: true,
      kind: 'list',
      metric: { value: open.length, label: 'critical risks need owners', severity: open.length > 5 ? 'critical' : open.length > 0 ? 'high' : 'good' },
      items: open.slice(0, 10).map(r => ({
        id: r.id || r.riskId,
        label: r.title || r.description || r.id,
        sublabel: r.projectId ? `project: ${r.projectId}` : 'unassigned',
        severity: r.severity as Severity,
      })),
      context: 'No mitigation plan = nobody owns the response.',
    };
  },
});

def({
  id: 'risk-owner-workload',
  title: 'Risk Owner Workload',
  description: 'Owners holding more than 8 open mitigations.',
  agentIds: ['risk'],
  size: 'md',
  compute: async () => {
    const risks = await listAll('AtlasRisk');
    if (risks.length === 0) return { available: false, reason: 'No AtlasRisk records found' };
    const open = risks.filter(r => r.status !== 'resolved' && (r.ownerId || r.ownerName));
    if (open.length === 0) return { available: false, reason: 'AtlasRisk records lack ownerId/ownerName' };
    const counts = new Map<string, number>();
    for (const r of open) {
      const o = r.ownerName || r.ownerId;
      counts.set(o, (counts.get(o) || 0) + 1);
    }
    const overloaded = [...counts.entries()].filter(([, c]) => c >= 8).sort((a, b) => b[1] - a[1]);
    return {
      available: true,
      kind: 'rank',
      metric: { value: overloaded.length, label: 'overloaded risk owners', severity: overloaded.length > 0 ? 'high' : 'good' },
      items: overloaded.slice(0, 8).map(([n, c]) => ({ id: n, label: n, sublabel: `${c} open risks`, value: c, severity: 'high' })),
    };
  },
});

def({
  id: 'risk-cooccurrence',
  title: 'Risk Co-occurrence Patterns',
  description: 'Risk categories that frequently appear together on the same project.',
  agentIds: ['risk', 'integrated'],
  size: 'md',
  compute: async () => {
    const risks = await listAll('AtlasRisk');
    if (risks.length === 0) return { available: false, reason: 'No AtlasRisk records found' };
    const withCat = risks.filter(r => r.category && r.projectId);
    if (withCat.length === 0) return { available: false, reason: 'AtlasRisk records lack category field' };
    const byProject = new Map<string, Set<string>>();
    for (const r of withCat) {
      const set = byProject.get(r.projectId) || new Set<string>();
      set.add(r.category);
      byProject.set(r.projectId, set);
    }
    const pairs = new Map<string, number>();
    for (const cats of byProject.values()) {
      const arr = [...cats].sort();
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const k = `${arr[i]} + ${arr[j]}`;
          pairs.set(k, (pairs.get(k) || 0) + 1);
        }
      }
    }
    const top = [...pairs.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      available: true,
      kind: 'rank',
      items: top.map(([pair, c]) => ({ label: pair, sublabel: `${c} projects show this combo`, value: c, severity: 'warning' })),
      context: 'Predictive — when one risk type appears, the paired type often follows.',
    };
  },
});

// ============================================================================
// Governance
// ============================================================================
def({
  id: 'compliance-drift',
  title: 'Compliance Checkpoint Drift',
  description: 'Projects without a governance checkpoint in the last 30 days.',
  agentIds: ['governance'],
  size: 'md',
  compute: async () => {
    const checkpoints = await listAll('AtlasGovernanceCheckpoint');
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    if (checkpoints.length === 0 || projects.length === 0) return { available: false, reason: 'Need AtlasGovernanceCheckpoint + AtlasProject records' };
    const THIRTY_D = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const lastByProject = new Map<string, number>();
    for (const c of checkpoints) {
      const t = new Date(c.reviewedDate || c.createdAt || c.checkpointDate || 0).getTime();
      if (!isNaN(t)) lastByProject.set(c.projectId, Math.max(lastByProject.get(c.projectId) || 0, t));
    }
    const drifted = projects.filter(p => {
      if (p.status === 'Complete' || p.status === 'completed') return false;
      const last = lastByProject.get(p.id || p.projectId) || 0;
      return (now - last) > THIRTY_D;
    });
    return {
      available: true,
      kind: 'list',
      metric: { value: drifted.length, label: 'projects past checkpoint cadence', severity: drifted.length > 10 ? 'critical' : 'warning' },
      items: drifted.slice(0, 10).map(p => {
        const last = lastByProject.get(p.id || p.projectId);
        return {
          id: p.id || p.projectId,
          label: p.name || p.title,
          sublabel: last ? `last reviewed ${new Date(last).toLocaleDateString()}` : 'never reviewed',
          severity: 'warning',
        };
      }),
    };
  },
});

def({
  id: 'decision-latency',
  title: 'Decision Latency',
  description: 'Average days a decision sits awaiting approval, by approver.',
  agentIds: ['governance'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Requires AtlasApproval/AtlasDecision records with createdAt + decidedAt timestamps. Not ingested yet.',
  }),
});

def({
  id: 'change-request-velocity',
  title: 'Change Request Velocity',
  description: 'Projects accumulating CRs faster than they close them.',
  agentIds: ['governance', 'pmo'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Requires AtlasChangeRequest records with status + dates. Not ingested yet.',
  }),
});

// ============================================================================
// OCM
// ============================================================================
def({
  id: 'adoption-dropoff',
  title: 'Adoption Drop-off',
  description: 'Projects where post-go-live adoption stalled below target.',
  agentIds: ['ocm'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Requires adoption KPI series (active users / target users) post-go-live. Not ingested yet.',
  }),
});

def({
  id: 'sentiment-trend',
  title: 'Stakeholder Sentiment Trend',
  description: 'Projects where sponsor sentiment has decayed over time.',
  agentIds: ['ocm'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Requires stakeholder sentiment scoring (surveys, NLP on comments). Not ingested yet.',
  }),
});

def({
  id: 'change-saturation',
  title: 'Change Saturation Index',
  description: 'Business units receiving too many concurrent change initiatives.',
  agentIds: ['ocm', 'planning'],
  size: 'md',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    if (projects.length === 0) return { available: false, reason: 'No projects found' };
    const buckets = new Map<string, number>();
    for (const p of projects) {
      const bu = p.businessUnit || p.division || p.affectedBusinessUnit;
      if (!bu) continue;
      if (p.status === 'Complete' || p.status === 'completed') continue;
      buckets.set(bu, (buckets.get(bu) || 0) + 1);
    }
    if (buckets.size === 0) return { available: false, reason: 'AtlasProject records lack businessUnit/division field' };
    const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      available: true,
      kind: 'rank',
      items: ranked.map(([bu, c]) => ({
        id: bu, label: bu, sublabel: `${c} active initiatives`,
        value: c, severity: c > 8 ? 'critical' : c > 4 ? 'high' : 'warning',
      })),
      context: 'High counts = change fatigue risk for the receiving business unit.',
    };
  },
});

// ============================================================================
// TMO
// ============================================================================
def({
  id: 'transformation-portfolio-pulse',
  title: 'Transformation Portfolio Pulse',
  description: 'Status mix across all transformation initiatives.',
  agentIds: ['tmo'],
  size: 'md',
  compute: async () => {
    const transformations = await listAll('AtlasTransformation');
    if (transformations.length === 0) return { available: false, reason: 'No AtlasTransformation records found' };
    const statusCounts = new Map<string, number>();
    for (const t of transformations) {
      const s = t.status || 'Unknown';
      statusCounts.set(s, (statusCounts.get(s) || 0) + 1);
    }
    return {
      available: true,
      kind: 'rank',
      metric: { value: transformations.length, label: 'active transformations' },
      items: [...statusCounts.entries()].sort((a, b) => b[1] - a[1]).map(([s, c]) => ({
        label: s, value: c, sublabel: `${((c / transformations.length) * 100).toFixed(0)}% of portfolio`,
      })),
    };
  },
});

// ============================================================================
// Planning
// ============================================================================
def({
  id: 'dependency-war-room',
  title: 'Dependency War Room',
  description: 'Cross-project dependencies that need a human decision this week.',
  agentIds: ['planning', 'integrated'],
  size: 'lg',
  compute: async () => {
    const deps = (await listAll('AtlasDependency')).filter(d =>
      d.sourceProjectId !== d.targetProjectId &&
      (d.status === 'blocked' || d.status === 'at_risk')
    );
    if (deps.length === 0) return { available: true, kind: 'metric', metric: { value: 0, label: 'dependencies need decisions', severity: 'good' } };
    return {
      available: true,
      kind: 'list',
      metric: { value: deps.length, label: 'awaiting decision', severity: deps.length > 5 ? 'critical' : 'high' },
      items: deps.slice(0, 12).map(d => ({
        id: d.id || d.dependencyId,
        label: d.title || d.description || d.id,
        sublabel: `${d.sourceProjectId} → ${d.targetProjectId} · ${d.status}`,
        severity: d.severity as Severity || 'high',
      })),
      context: 'Action items for the next portfolio sync.',
    };
  },
});

def({
  id: 'critical-path',
  title: 'Critical Path Across Portfolio',
  description: 'Longest dependency chain — determines portfolio end date.',
  agentIds: ['planning', 'tmo', 'pmo', 'integrated'],
  size: 'lg',
  compute: async () => {
    const deps = (await listAll('AtlasDependency')).filter(d =>
      d.sourceProjectId && d.targetProjectId && d.sourceProjectId !== d.targetProjectId
    );
    if (deps.length === 0) return { available: false, reason: 'No cross-project dependencies in Palantir' };
    // Build DAG and find longest path (count of edges).
    const adj = new Map<string, string[]>();
    const nodes = new Set<string>();
    for (const d of deps) {
      adj.set(d.sourceProjectId, [...(adj.get(d.sourceProjectId) || []), d.targetProjectId]);
      nodes.add(d.sourceProjectId);
      nodes.add(d.targetProjectId);
    }
    // DFS with memoization (will short-circuit on cycles)
    const memo = new Map<string, string[]>();
    const visiting = new Set<string>();
    function longest(n: string): string[] {
      if (memo.has(n)) return memo.get(n)!;
      if (visiting.has(n)) return [n]; // cycle guard
      visiting.add(n);
      let best: string[] = [n];
      for (const next of adj.get(n) || []) {
        const path = longest(next);
        if (path.length + 1 > best.length) best = [n, ...path];
      }
      visiting.delete(n);
      memo.set(n, best);
      return best;
    }
    let critical: string[] = [];
    for (const n of nodes) {
      const p = longest(n);
      if (p.length > critical.length) critical = p;
    }
    return {
      available: true,
      kind: 'list',
      metric: { value: critical.length, label: 'projects in critical chain', severity: critical.length > 5 ? 'high' : 'warning' },
      items: critical.map((pid, i) => ({
        id: pid, label: `${i + 1}. ${pid}`,
        sublabel: i === 0 ? 'start' : i === critical.length - 1 ? 'end' : 'in chain',
      })),
      context: 'Any slip in this chain pushes the whole portfolio end date.',
    };
  },
});

// ============================================================================
// Integrated / Predictive
// ============================================================================
def({
  id: 'orphaned-projects',
  title: 'Orphaned Projects',
  description: 'Projects with no link to any strategic objective.',
  agentIds: ['integrated', 'okr', 'vro'],
  size: 'md',
  compute: async () => {
    const [projects, objectives] = await Promise.all([listAll('AtlasProject'), listAll('AtlasObjective')]);
    const real = projects.filter(isRealProject);
    if (real.length === 0) return { available: false, reason: 'No projects found' };
    const linked = new Set<string>(objectives.flatMap(o => o.linkedProjectIds || []));
    const orphans = real.filter(p =>
      !linked.has(p.id || p.projectId) && !p.objectiveId && p.status !== 'Complete'
    );
    return {
      available: true,
      kind: 'list',
      metric: { value: orphans.length, label: 'unaligned projects', severity: orphans.length > 10 ? 'high' : 'warning' },
      items: orphans.slice(0, 10).map(p => ({
        id: p.id || p.projectId, label: p.name || p.title,
        sublabel: `${p.status || 'unknown'} · $${((p.budget || 0) / 1_000_000).toFixed(1)}M budgeted`,
        severity: 'warning',
      })),
      context: 'Spend without a stated strategic outcome.',
    };
  },
});

def({
  id: 'early-warning-triplet',
  title: 'Early-Warning Triplet',
  description: 'Projects exhibiting all three pre-red warning signals simultaneously.',
  agentIds: ['integrated', 'risk', 'pmo'],
  size: 'md',
  compute: async () => {
    const [projects, risks] = await Promise.all([listAll('AtlasProject'), listAll('AtlasRisk')]);
    const real = projects.filter(isRealProject);
    if (real.length === 0) return { available: false, reason: 'No projects found' };
    const criticalRiskByProject = new Map<string, number>();
    for (const r of risks) {
      if ((r.severity === 'critical' || r.severity === 'high') && r.status !== 'resolved' && r.projectId) {
        criticalRiskByProject.set(r.projectId, (criticalRiskByProject.get(r.projectId) || 0) + 1);
      }
    }
    // Triplet: CPI < 0.9 AND SPI < 0.9 AND ≥1 open critical/high risk
    const triplets = real.filter(p => {
      if (p.status === 'Complete' || p.status === 'completed') return false;
      const id = p.id || p.projectId;
      const hasRisk = (criticalRiskByProject.get(id) || 0) > 0;
      const hasCpiSlip = typeof p.cpi === 'number' && p.cpi < 0.9;
      const hasSpiSlip = typeof p.spi === 'number' && p.spi < 0.9;
      return hasRisk && hasCpiSlip && hasSpiSlip;
    });
    if (triplets.length === 0 && (real.every(p => typeof p.cpi !== 'number' || typeof p.spi !== 'number'))) {
      return { available: false, reason: 'Requires CPI + SPI on AtlasProject records (not present)' };
    }
    return {
      available: true,
      kind: 'list',
      metric: { value: triplets.length, label: 'projects with all 3 warning signals', severity: triplets.length > 0 ? 'critical' : 'good' },
      items: triplets.slice(0, 10).map(p => ({
        id: p.id || p.projectId,
        label: p.name || p.title,
        sublabel: `CPI ${p.cpi.toFixed(2)} · SPI ${p.spi.toFixed(2)} · ${criticalRiskByProject.get(p.id || p.projectId)} open critical risk(s)`,
        severity: 'critical',
      })),
      context: 'Cost slip + schedule slip + open critical risk = historically the strongest pre-red predictor.',
    };
  },
});

def({
  id: 'what-if-scope-reduction',
  title: 'What-if Scope Reduction',
  description: 'If we cut the worst value-to-cost projects, how much budget is released vs value preserved?',
  agentIds: ['vro', 'integrated', 'finops'],
  size: 'lg',
  compute: async () => {
    const projects = (await listAll('AtlasProject')).filter(isRealProject);
    const withMath = projects.filter(p =>
      typeof p.budget === 'number' && p.budget > 0 &&
      (typeof p.realizedValue === 'number' || typeof p.expectedValue === 'number') &&
      p.status !== 'Complete' && p.status !== 'completed'
    );
    if (withMath.length === 0) return { available: false, reason: 'Need budget + realizedValue/expectedValue on active projects' };
    // Rank by value-to-cost ratio ascending (worst first).
    const ranked = withMath.map(p => {
      const value = (p.realizedValue ?? p.expectedValue ?? 0);
      const ratio = value / p.budget;
      return { p, value, ratio };
    }).sort((a, b) => a.ratio - b.ratio);
    // Simulate cutting bottom 10% of projects by ratio
    const cutCount = Math.max(1, Math.floor(ranked.length * 0.1));
    const cuts = ranked.slice(0, cutCount);
    const budgetReleased = cuts.reduce((s, x) => s + x.p.budget, 0);
    const valueLost = cuts.reduce((s, x) => s + x.value, 0);
    const totalBudget = withMath.reduce((s, p) => s + p.budget, 0);
    const totalValue = withMath.reduce((s, p) => s + (p.realizedValue ?? p.expectedValue ?? 0), 0);
    const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
    return {
      available: true,
      kind: 'list',
      metric: {
        value: fmt(budgetReleased - valueLost),
        label: `net capacity released by cutting bottom ${cutCount} projects`,
        severity: 'good',
        sublabel: `${fmt(budgetReleased)} budget freed · ${fmt(valueLost)} value lost · ${((1 - valueLost / totalValue) * 100).toFixed(0)}% of portfolio value preserved`,
      },
      items: cuts.map(({ p, value, ratio }) => ({
        id: p.id || p.projectId,
        label: p.name || p.title,
        sublabel: `${fmt(p.budget)} budget releasing · only ${fmt(value)} value (ratio ${ratio.toFixed(2)})`,
        value: Math.round(p.budget),
        severity: ratio < 0.3 ? 'critical' : 'high',
      })),
      context: `Simulator: cutting the bottom 10% by value-to-cost ratio. Of $${(totalBudget / 1_000_000).toFixed(1)}M total active budget, this releases ${((budgetReleased / totalBudget) * 100).toFixed(0)}% while losing only ${((valueLost / totalValue) * 100).toFixed(0)}% of portfolio value.`,
    };
  },
});

def({
  id: 'chatbot-question-bank',
  title: 'Executive Question Bank',
  description: 'Pre-curated questions wired to the Clarity chatbot — click to ask.',
  agentIds: ['notification', 'integrated'],
  size: 'lg',
  compute: async () => {
    const questions = [
      'What are the top 3 portfolio risks right now?',
      'Which projects have blocked cross-project dependencies?',
      'List the projects with the largest budget overruns.',
      'Are there any old open dependencies we should escalate?',
      'Which strategic objectives are not funded by any project?',
      'Show me projects with critical unmitigated risks.',
      'Which business units have the most concurrent change initiatives?',
      'What dependencies need a human decision this week?',
      'Which projects should we consider sunsetting based on value-to-cost?',
      'Where are we losing the most schedule float across the portfolio?',
      'Which PMs are overloaded with too many active projects?',
      'Summarize what changed in the portfolio this week.',
    ];
    return {
      available: true,
      kind: 'list',
      metric: { value: questions.length, label: 'curated executive questions', severity: 'info' },
      items: questions.map((q, i) => ({
        id: `q-${i}`,
        label: q,
        sublabel: 'click → ask Clarity',
        linkTo: `/chat?q=${encodeURIComponent(q)}`,
      })),
      context: 'The chatbot grounds every answer in live Palantir data via tool-use.',
    };
  },
});

def({
  id: 'lookalike-outcomes',
  title: 'Lookalike Project Outcomes',
  description: 'For each at-risk project, find similar past projects and their outcomes.',
  agentIds: ['integrated'],
  size: 'lg',
  compute: async () => ({
    available: false,
    reason: 'Requires completed-project history with outcome metrics (overrun %, slippage, ROI delivered). Will become available once 20+ projects have completed.',
  }),
});

def({
  id: 'weekly-narrative-brief',
  title: 'Weekly Portfolio Brief',
  description: 'One-page narrative of what changed in the portfolio last week.',
  agentIds: ['notification', 'integrated'],
  size: 'lg',
  compute: async () => {
    const insights = await palantirGraphService.generateCrossDomainInsights();
    if (insights.length === 0) return { available: false, reason: 'No cross-domain signals available right now' };
    const lines = insights
      .sort((a, b) => sevRank(a.severity as Severity) - sevRank(b.severity as Severity))
      .slice(0, 6)
      .map(i => `• [${(i.severity || 'info').toUpperCase()}] ${i.title} — ${i.description}`);
    const narrative = `This week the portfolio surfaced ${insights.length} cross-domain signal${insights.length === 1 ? '' : 's'}:\n\n${lines.join('\n')}\n\nRecommend reviewing the Risk and Planning agent lenses for action items.`;
    return {
      available: true,
      kind: 'narrative',
      narrative,
      context: 'Auto-composed from live Palantir data each time you open this view.',
    };
  },
});

def({
  id: 'notification-throughput',
  title: 'Notification Throughput',
  description: 'Approvals & alerts routed by the Notification agent.',
  agentIds: ['notification'],
  size: 'md',
  compute: async () => ({
    available: false,
    reason: 'Notification agent has no persisted activity log yet. Will populate as the agent runs.',
  }),
});

// ============================================================================
// Routes
// ============================================================================

// Lookup table for fast access
const INSIGHT_BY_ID = new Map(INSIGHTS.map(i => [i.id, i]));

const AGENT_LABELS: Record<string, { name: string; emoji: string; description: string }> = {
  pmo:           { name: 'PMO Agent',                 emoji: '📋', description: 'Delivery & health across the portfolio.' },
  vro:           { name: 'VRO Agent',                 emoji: '💰', description: 'Value realization, ROI reality, strategic alignment.' },
  finops:        { name: 'FinOps Agent',              emoji: '📊', description: 'Cost, burn, budget reforecast risk.' },
  risk:          { name: 'Risk Agent',                emoji: '⚠️', description: 'Risk patterns, owner workload, mitigation gaps.' },
  governance:    { name: 'Governance Agent',          emoji: '⚖️', description: 'Compliance cadence, decisions, change control.' },
  ocm:           { name: 'OCM Agent',                 emoji: '🔄', description: 'Change saturation, adoption, sentiment.' },
  tmo:           { name: 'TMO Agent',                 emoji: '🚀', description: 'Transformation portfolio pulse.' },
  planning:      { name: 'Planning Agent',            emoji: '🗺️', description: 'Critical path, dependency war room, capacity.' },
  okr:           { name: 'OKR Alignment Agent',       emoji: '🎯', description: 'Objective coverage, KR funding, alignment score.' },
  integrated:    { name: 'Integrated Agent',          emoji: '🧠', description: 'Cross-domain synthesis, orphans, lookalikes.' },
  notification:  { name: 'Notification Agent',        emoji: '🔔', description: 'Weekly briefs, approval routing, escalations.' },
};

router.get('/agents', (_req: Request, res: Response) => {
  const agents = Object.entries(AGENT_LABELS).map(([id, meta]) => {
    const tiles = INSIGHTS.filter(i => i.agentIds.includes(id));
    return {
      id, ...meta,
      tileCount: tiles.length,
      tiles: tiles.map(t => ({ id: t.id, title: t.title, description: t.description, size: t.size })),
    };
  });
  res.json({ agents });
});

router.get('/agent/:id', (req: Request, res: Response) => {
  const meta = AGENT_LABELS[req.params.id];
  if (!meta) return res.status(404).json({ error: 'Unknown agent' });
  const tiles = INSIGHTS.filter(i => i.agentIds.includes(req.params.id));
  res.json({
    id: req.params.id,
    ...meta,
    tileCount: tiles.length,
    tiles: tiles.map(t => ({ id: t.id, title: t.title, description: t.description, size: t.size })),
  });
});

router.get('/insight/:id', async (req: Request, res: Response) => {
  const insight = INSIGHT_BY_ID.get(req.params.id);
  if (!insight) return res.status(404).json({ error: 'Unknown insight' });
  try {
    const start = Date.now();
    const result = await insight.compute();
    res.json({ id: insight.id, title: insight.title, description: insight.description, computeMs: Date.now() - start, ...result });
  } catch (e: any) {
    console.error(`[AgentLens] insight ${req.params.id} failed:`, e);
    res.json({
      id: insight.id, title: insight.title, description: insight.description,
      available: false, reason: `Compute failed: ${e.message}`,
    });
  }
});

export default router;
