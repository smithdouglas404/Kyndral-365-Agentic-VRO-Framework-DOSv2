/**
 * DASHBOARD GENERATOR SERVICE
 *
 * Automatically generates dashboard templates based on extracted company data:
 * - Executive Dashboard: Company-wide KPIs, strategic OKRs, top risks
 * - Value Stream Dashboards: One per organizational unit with unit-specific metrics
 * - Risk Monitor Dashboard: Risk tracking and mitigation status
 */

import { db } from '../db';
import {
  dashboardTemplates,
  companies,
  organizationalUnits,
  metricDefinitions,
  strategicObjectives
} from '../db/schema';
import { eq, and } from 'drizzle-orm';

interface DashboardWidget {
  id: string;
  type: 'kpi-card' | 'chart' | 'table' | 'okr-list' | 'risk-matrix' | 'metric-trend';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: any;
}

interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  rowHeight: number;
}

/**
 * Generate all dashboards for a company after setup completes
 */
export async function generateCompanyDashboards(companyId: string): Promise<void> {
  console.log(`Generating dashboards for company ${companyId}...`);

  try {
    // Fetch company profile
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      throw new Error('Company not found');
    }

    // Fetch organizational units
    const orgUnits = await db
      .select()
      .from(organizationalUnits)
      .where(eq(organizationalUnits.companyId, companyId));

    // Fetch metrics
    const metrics = await db
      .select()
      .from(metricDefinitions)
      .where(eq(metricDefinitions.companyId, companyId));

    // Fetch strategic objectives
    const objectives = await db
      .select()
      .from(strategicObjectives)
      .where(eq(strategicObjectives.companyId, companyId));

    // Fetch risks (TODO: risks table not yet implemented)
    const companyRisks: any[] = [];

    // Generate Executive Dashboard
    await generateExecutiveDashboard(companyId, company.legalName, metrics, objectives, companyRisks);

    // Generate Value Stream Dashboards (one per org unit)
    for (const unit of orgUnits) {
      await generateValueStreamDashboard(
        companyId,
        unit,
        metrics.filter(m => m.organizationalUnitId === unit.id)
      );
    }

    // Generate Risk Monitor Dashboard
    await generateRiskMonitorDashboard(companyId, companyRisks);

    console.log(`Successfully generated ${2 + orgUnits.length} dashboards for ${company.legalName}`);
  } catch (error) {
    console.error('Dashboard generation error:', error);
    throw error;
  }
}

/**
 * Generate Executive Dashboard with company-wide KPIs and strategic OKRs
 */
async function generateExecutiveDashboard(
  companyId: string,
  companyName: string,
  metrics: any[],
  objectives: any[],
  risks: any[]
): Promise<void> {
  // Filter for company-level metrics
  const financialMetrics = metrics.filter(m =>
    m.metricType === 'financial' && !m.organizationalUnitId
  );

  const operationalMetrics = metrics.filter(m =>
    m.metricType === 'operational' && !m.organizationalUnitId
  );

  const strategicMetrics = metrics.filter(m =>
    m.metricType === 'strategic' && !m.organizationalUnitId
  );

  // Top 5 critical risks
  const criticalRisks = risks
    .filter(r => r.severity === 'critical' || r.severity === 'high')
    .slice(0, 5);

  const layout: DashboardLayout = {
    columns: 12,
    rowHeight: 80,
    widgets: [
      // Row 1: Key Financial Metrics (3 KPI cards)
      {
        id: 'revenue-card',
        type: 'kpi-card',
        title: 'Total Revenue',
        position: { x: 0, y: 0, w: 4, h: 2 },
        config: {
          metricId: financialMetrics.find(m => m.metricName.toLowerCase().includes('revenue'))?.id,
          metricName: 'Total Revenue',
          format: 'currency',
          showTrend: true,
          showTarget: true
        }
      },
      {
        id: 'margin-card',
        type: 'kpi-card',
        title: 'Operating Margin',
        position: { x: 4, y: 0, w: 4, h: 2 },
        config: {
          metricId: financialMetrics.find(m => m.metricName.toLowerCase().includes('margin'))?.id,
          metricName: 'Operating Margin',
          format: 'percentage',
          showTrend: true,
          showTarget: true
        }
      },
      {
        id: 'profit-card',
        type: 'kpi-card',
        title: 'Net Income',
        position: { x: 8, y: 0, w: 4, h: 2 },
        config: {
          metricId: financialMetrics.find(m => m.metricName.toLowerCase().includes('income') || m.metricName.toLowerCase().includes('profit'))?.id,
          metricName: 'Net Income',
          format: 'currency',
          showTrend: true,
          showTarget: true
        }
      },

      // Row 2: Strategic OKRs
      {
        id: 'okr-progress',
        type: 'okr-list',
        title: 'Strategic Objectives',
        position: { x: 0, y: 2, w: 6, h: 4 },
        config: {
          objectiveIds: objectives.map(o => o.id),
          showKeyResults: true,
          showProgress: true,
          limit: 5
        }
      },

      // Row 2: Top Risks
      {
        id: 'top-risks',
        type: 'risk-matrix',
        title: 'Top Risks',
        position: { x: 6, y: 2, w: 6, h: 4 },
        config: {
          riskIds: criticalRisks.map(r => r.id),
          showSeverity: true,
          showStatus: true,
          limit: 5
        }
      },

      // Row 3: Financial Trends
      {
        id: 'revenue-trend',
        type: 'chart',
        title: 'Revenue by Segment',
        position: { x: 0, y: 6, w: 6, h: 3 },
        config: {
          chartType: 'bar',
          metricIds: metrics.filter(m =>
            m.metricType === 'financial' &&
            m.metricName.toLowerCase().includes('revenue') &&
            m.organizationalUnitId
          ).map(m => m.id),
          groupBy: 'organizationalUnit',
          timeRange: 'quarter'
        }
      },

      // Row 3: Strategic Metrics
      {
        id: 'strategic-metrics',
        type: 'table',
        title: 'Strategic Initiatives',
        position: { x: 6, y: 6, w: 6, h: 3 },
        config: {
          metricIds: strategicMetrics.map(m => m.id),
          columns: ['name', 'currentValue', 'targetValue', 'progress'],
          sortBy: 'progress',
          sortOrder: 'asc'
        }
      }
    ]
  };

  // Check if dashboard already exists
  const existing = await db
    .select()
    .from(dashboardTemplates)
    .where(
      and(
        eq(dashboardTemplates.companyId, companyId),
        eq(dashboardTemplates.templateCode, 'executive-overview')
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing dashboard
    await db
      .update(dashboardTemplates)
      .set({
        layoutConfig: layout,
        generationMetadata: {
          generatedAt: new Date().toISOString(),
          metricsCount: metrics.length,
          objectivesCount: objectives.length,
          risksCount: risks.length
        },
        updatedAt: new Date()
      })
      .where(eq(dashboardTemplates.id, existing[0].id));
  } else {
    // Create new dashboard
    await db.insert(dashboardTemplates).values({
      companyId,
      templateName: 'Executive Overview',
      templateCode: 'executive-overview',
      templateType: 'executive',
      description: `Strategic dashboard for ${companyName} with financial performance, OKRs, and risk monitoring`,
      targetRoles: ['executive', 'ceo', 'cfo', 'coo'],
      organizationalUnitFilter: false,
      layoutConfig: layout,
      autoGenerated: true,
      generationMetadata: {
        generatedAt: new Date().toISOString(),
        metricsCount: metrics.length,
        objectivesCount: objectives.length,
        risksCount: risks.length
      },
      isDefault: true,
      isActive: false // Pending HITL approval
    });
  }
}

/**
 * Generate Value Stream Dashboard for a specific organizational unit
 */
async function generateValueStreamDashboard(
  companyId: string,
  orgUnit: any,
  unitMetrics: any[]
): Promise<void> {
  const financialMetrics = unitMetrics.filter(m => m.metricType === 'financial');
  const operationalMetrics = unitMetrics.filter(m => m.metricType === 'operational');

  const layout: DashboardLayout = {
    columns: 12,
    rowHeight: 80,
    widgets: [
      // Row 1: Unit KPIs
      {
        id: `${orgUnit.id}-revenue`,
        type: 'kpi-card',
        title: 'Revenue',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          metricId: financialMetrics.find(m => m.metricName.toLowerCase().includes('revenue'))?.id,
          metricName: 'Revenue',
          format: 'currency',
          showTrend: true
        }
      },
      {
        id: `${orgUnit.id}-margin`,
        type: 'kpi-card',
        title: 'Margin',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          metricId: financialMetrics.find(m => m.metricName.toLowerCase().includes('margin'))?.id,
          metricName: 'Margin',
          format: 'percentage',
          showTrend: true
        }
      },
      {
        id: `${orgUnit.id}-projects`,
        type: 'kpi-card',
        title: 'Active Projects',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          metricId: operationalMetrics.find(m => m.metricName.toLowerCase().includes('project'))?.id,
          metricName: 'Active Projects',
          format: 'number',
          showTrend: false
        }
      },
      {
        id: `${orgUnit.id}-capacity`,
        type: 'kpi-card',
        title: 'Team Capacity',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          metricId: operationalMetrics.find(m => m.metricName.toLowerCase().includes('capacity'))?.id,
          metricName: 'Capacity Utilization',
          format: 'percentage',
          showTrend: true
        }
      },

      // Row 2: Metrics Table
      {
        id: `${orgUnit.id}-metrics-table`,
        type: 'table',
        title: 'All Metrics',
        position: { x: 0, y: 2, w: 12, h: 4 },
        config: {
          metricIds: unitMetrics.map(m => m.id),
          columns: ['name', 'currentValue', 'targetValue', 'unit', 'trend'],
          sortBy: 'name',
          sortOrder: 'asc'
        }
      },

      // Row 3: Trends
      {
        id: `${orgUnit.id}-trend`,
        type: 'metric-trend',
        title: 'Performance Trend',
        position: { x: 0, y: 6, w: 12, h: 3 },
        config: {
          metricIds: unitMetrics.slice(0, 5).map(m => m.id),
          timeRange: 'quarter',
          chartType: 'line'
        }
      }
    ]
  };

  const templateCode = `value-stream-${orgUnit.id}`;

  // Check if dashboard already exists
  const existing = await db
    .select()
    .from(dashboardTemplates)
    .where(
      and(
        eq(dashboardTemplates.companyId, companyId),
        eq(dashboardTemplates.templateCode, templateCode)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing dashboard
    await db
      .update(dashboardTemplates)
      .set({
        layoutConfig: layout,
        generationMetadata: {
          generatedAt: new Date().toISOString(),
          organizationalUnitId: orgUnit.id,
          metricsCount: unitMetrics.length
        },
        updatedAt: new Date()
      })
      .where(eq(dashboardTemplates.id, existing[0].id));
  } else {
    // Create new dashboard
    await db.insert(dashboardTemplates).values({
      companyId,
      templateName: `${orgUnit.unitName} Dashboard`,
      templateCode: templateCode,
      templateType: 'value-stream',
      description: `Performance dashboard for ${orgUnit.unitName} with unit-specific KPIs and projects`,
      targetRoles: ['manager', 'director', 'vp'],
      organizationalUnitFilter: true,
      layoutConfig: layout,
      autoGenerated: true,
      generationMetadata: {
        generatedAt: new Date().toISOString(),
        organizationalUnitId: orgUnit.id,
        metricsCount: unitMetrics.length
      },
      isDefault: false,
      isActive: false // Pending HITL approval
    });
  }
}

/**
 * Generate Risk Monitor Dashboard with risk tracking and mitigation status
 */
async function generateRiskMonitorDashboard(
  companyId: string,
  risks: any[]
): Promise<void> {
  const criticalRisks = risks.filter(r => r.severity === 'critical');
  const highRisks = risks.filter(r => r.severity === 'high');
  const mediumRisks = risks.filter(r => r.severity === 'medium');

  const layout: DashboardLayout = {
    columns: 12,
    rowHeight: 80,
    widgets: [
      // Row 1: Risk Summary Cards
      {
        id: 'critical-risks-count',
        type: 'kpi-card',
        title: 'Critical Risks',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          value: criticalRisks.length,
          format: 'number',
          color: 'red',
          showIcon: 'alert-circle'
        }
      },
      {
        id: 'high-risks-count',
        type: 'kpi-card',
        title: 'High Risks',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          value: highRisks.length,
          format: 'number',
          color: 'orange',
          showIcon: 'alert-triangle'
        }
      },
      {
        id: 'medium-risks-count',
        type: 'kpi-card',
        title: 'Medium Risks',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          value: mediumRisks.length,
          format: 'number',
          color: 'yellow',
          showIcon: 'info'
        }
      },
      {
        id: 'mitigated-risks',
        type: 'kpi-card',
        title: 'Mitigated',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          value: risks.filter(r => r.status === 'mitigated').length,
          format: 'number',
          color: 'green',
          showIcon: 'check-circle'
        }
      },

      // Row 2: Risk Matrix
      {
        id: 'risk-matrix',
        type: 'risk-matrix',
        title: 'Risk Heat Map',
        position: { x: 0, y: 2, w: 6, h: 5 },
        config: {
          riskIds: risks.map(r => r.id),
          showLabels: true,
          axes: {
            x: 'likelihood',
            y: 'impact'
          }
        }
      },

      // Row 2: Risk List
      {
        id: 'risk-list',
        type: 'table',
        title: 'All Risks',
        position: { x: 6, y: 2, w: 6, h: 5 },
        config: {
          riskIds: risks.map(r => r.id),
          columns: ['name', 'severity', 'status', 'owner', 'dueDate'],
          sortBy: 'severity',
          sortOrder: 'desc',
          filters: {
            status: ['identified', 'assessing', 'mitigating']
          }
        }
      },

      // Row 3: Risk Trends
      {
        id: 'risk-trend',
        type: 'chart',
        title: 'Risk Status Over Time',
        position: { x: 0, y: 7, w: 12, h: 3 },
        config: {
          chartType: 'area',
          dataSource: 'risk-history',
          groupBy: 'status',
          timeRange: 'quarter'
        }
      }
    ]
  };

  // Check if dashboard already exists
  const existing = await db
    .select()
    .from(dashboardTemplates)
    .where(
      and(
        eq(dashboardTemplates.companyId, companyId),
        eq(dashboardTemplates.templateCode, 'risk-monitor')
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing dashboard
    await db
      .update(dashboardTemplates)
      .set({
        layoutConfig: layout,
        generationMetadata: {
          generatedAt: new Date().toISOString(),
          risksCount: risks.length,
          criticalCount: criticalRisks.length,
          highCount: highRisks.length
        },
        updatedAt: new Date()
      })
      .where(eq(dashboardTemplates.id, existing[0].id));
  } else {
    // Create new dashboard
    await db.insert(dashboardTemplates).values({
      companyId,
      templateName: 'Portfolio Risk Monitor',
      templateCode: 'risk-monitor',
      templateType: 'risk',
      description: 'Comprehensive risk tracking with heat maps and mitigation status',
      targetRoles: ['risk-manager', 'executive', 'compliance'],
      organizationalUnitFilter: false,
      layoutConfig: layout,
      autoGenerated: true,
      generationMetadata: {
        generatedAt: new Date().toISOString(),
        risksCount: risks.length,
        criticalCount: criticalRisks.length,
        highCount: highRisks.length
      },
      isDefault: false,
      isActive: false // Pending HITL approval
    });
  }
}

/**
 * Re-generate dashboards after data changes (e.g., after re-extraction)
 */
export async function regenerateDashboards(companyId: string): Promise<void> {
  console.log(`Re-generating dashboards for company ${companyId}...`);

  // Delete existing auto-generated dashboards
  await db
    .delete(dashboardTemplates)
    .where(
      and(
        eq(dashboardTemplates.companyId, companyId),
        eq(dashboardTemplates.autoGenerated, true)
      )
    );

  // Generate fresh dashboards
  await generateCompanyDashboards(companyId);
}
