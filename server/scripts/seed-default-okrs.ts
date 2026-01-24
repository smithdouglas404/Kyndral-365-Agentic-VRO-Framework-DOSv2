/**
 * SEED DEFAULT OKRs/KPIs FOR ALL AGENTS
 *
 * Pre-populated best-practice OKRs with industry-standard thresholds.
 * Used during wizard setup or can be manually triggered.
 */

import { db } from '../db.js';
import { agentOKRs } from '../../shared/schema.js';

interface OKRTemplate {
  agentId: string;
  objective: string;
  description: string;
  keyResults: Array<{
    title: string;
    metric: string;
    targetValue: number;
    warningThreshold: number;
    criticalThreshold: number;
    unit: string;
    direction: 'above' | 'below'; // above = target is minimum, below = target is maximum
  }>;
  linkedCamundaRule?: string;
  category: 'financial' | 'quality' | 'performance' | 'compliance' | 'efficiency';
}

const DEFAULT_OKRS: OKRTemplate[] = [
  // ============================================================================
  // FINOPS AGENT - Financial Performance
  // ============================================================================
  {
    agentId: 'finops',
    objective: 'Maintain Project Profitability Above 15%',
    description: 'Ensure all projects deliver positive ROI with healthy profit margins',
    category: 'financial',
    keyResults: [
      {
        title: 'Cost Performance Index (CPI)',
        metric: 'cost_performance_index',
        targetValue: 1.0,
        warningThreshold: 0.9,
        criticalThreshold: 0.85,
        unit: 'ratio',
        direction: 'above',
      },
      {
        title: 'Budget Variance',
        metric: 'budget_variance_percent',
        targetValue: 10,
        warningThreshold: 15,
        criticalThreshold: 20,
        unit: 'percent',
        direction: 'below',
      },
      {
        title: 'Project Profit Margin',
        metric: 'profit_margin_percent',
        targetValue: 15,
        warningThreshold: 10,
        criticalThreshold: 5,
        unit: 'percent',
        direction: 'above',
      },
    ],
    linkedCamundaRule: 'budget-overrun-critical',
  },
  {
    agentId: 'finops',
    objective: 'Deliver Projects Within Budget Variance of 10%',
    description: 'Control costs and minimize budget overruns',
    category: 'financial',
    keyResults: [
      {
        title: 'Projects Within Budget',
        metric: 'projects_within_budget_percent',
        targetValue: 90,
        warningThreshold: 80,
        criticalThreshold: 70,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Average Burn Rate Variance',
        metric: 'burn_rate_variance_percent',
        targetValue: 5,
        warningThreshold: 10,
        criticalThreshold: 15,
        unit: 'percent',
        direction: 'below',
      },
    ],
  },
  {
    agentId: 'finops',
    objective: 'Achieve 98% Invoice Accuracy',
    description: 'Minimize billing errors and payment delays',
    category: 'quality',
    keyResults: [
      {
        title: 'Invoice Accuracy Rate',
        metric: 'invoice_accuracy_percent',
        targetValue: 98,
        warningThreshold: 95,
        criticalThreshold: 92,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Days Sales Outstanding (DSO)',
        metric: 'days_sales_outstanding',
        targetValue: 30,
        warningThreshold: 45,
        criticalThreshold: 60,
        unit: 'days',
        direction: 'below',
      },
    ],
  },

  // ============================================================================
  // RISK AGENT - Risk Management
  // ============================================================================
  {
    agentId: 'risk',
    objective: 'Keep Risk Score Below 7/10',
    description: 'Maintain low-to-moderate risk exposure across portfolio',
    category: 'compliance',
    keyResults: [
      {
        title: 'Average Risk Score',
        metric: 'average_risk_score',
        targetValue: 7,
        warningThreshold: 7.5,
        criticalThreshold: 8,
        unit: 'score',
        direction: 'below',
      },
      {
        title: 'Critical Risks Open',
        metric: 'critical_risks_count',
        targetValue: 0,
        warningThreshold: 1,
        criticalThreshold: 3,
        unit: 'count',
        direction: 'below',
      },
    ],
    linkedCamundaRule: 'high-risk-escalation',
  },
  {
    agentId: 'risk',
    objective: 'Resolve Critical Risks Within 48 Hours',
    description: 'Rapid response to high-severity risk events',
    category: 'performance',
    keyResults: [
      {
        title: 'Critical Risk Response Time',
        metric: 'critical_risk_response_hours',
        targetValue: 48,
        warningThreshold: 72,
        criticalThreshold: 96,
        unit: 'hours',
        direction: 'below',
      },
      {
        title: 'Risk Mitigation Success Rate',
        metric: 'risk_mitigation_success_percent',
        targetValue: 90,
        warningThreshold: 80,
        criticalThreshold: 70,
        unit: 'percent',
        direction: 'above',
      },
    ],
  },
  {
    agentId: 'risk',
    objective: 'Achieve 90% Risk Mitigation Success Rate',
    description: 'Effective risk mitigation and closure',
    category: 'quality',
    keyResults: [
      {
        title: 'Risks Mitigated Successfully',
        metric: 'risks_mitigated_percent',
        targetValue: 90,
        warningThreshold: 85,
        criticalThreshold: 80,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Risk Reoccurrence Rate',
        metric: 'risk_reoccurrence_percent',
        targetValue: 5,
        warningThreshold: 10,
        criticalThreshold: 15,
        unit: 'percent',
        direction: 'below',
      },
    ],
  },

  // ============================================================================
  // GOVERNANCE AGENT - Compliance & Policy
  // ============================================================================
  {
    agentId: 'governance',
    objective: 'Maintain 95% Policy Compliance',
    description: 'Ensure adherence to organizational policies and regulations',
    category: 'compliance',
    keyResults: [
      {
        title: 'Overall Compliance Score',
        metric: 'compliance_score_percent',
        targetValue: 95,
        warningThreshold: 90,
        criticalThreshold: 85,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Policy Violations',
        metric: 'policy_violations_count',
        targetValue: 0,
        warningThreshold: 2,
        criticalThreshold: 5,
        unit: 'count',
        direction: 'below',
      },
    ],
    linkedCamundaRule: 'compliance-violation-critical',
  },
  {
    agentId: 'governance',
    objective: 'Zero Critical Compliance Violations',
    description: 'Prevent regulatory and policy breaches',
    category: 'compliance',
    keyResults: [
      {
        title: 'Critical Violations',
        metric: 'critical_violations_count',
        targetValue: 0,
        warningThreshold: 0,
        criticalThreshold: 1,
        unit: 'count',
        direction: 'below',
      },
      {
        title: 'Audit Readiness Score',
        metric: 'audit_readiness_percent',
        targetValue: 95,
        warningThreshold: 90,
        criticalThreshold: 85,
        unit: 'percent',
        direction: 'above',
      },
    ],
  },
  {
    agentId: 'governance',
    objective: 'Resolve Audit Findings Within 30 Days',
    description: 'Rapid remediation of audit issues',
    category: 'performance',
    keyResults: [
      {
        title: 'Audit Finding Resolution Time',
        metric: 'audit_resolution_days',
        targetValue: 30,
        warningThreshold: 45,
        criticalThreshold: 60,
        unit: 'days',
        direction: 'below',
      },
      {
        title: 'Findings Resolved On-Time',
        metric: 'findings_resolved_ontime_percent',
        targetValue: 90,
        warningThreshold: 80,
        criticalThreshold: 70,
        unit: 'percent',
        direction: 'above',
      },
    ],
  },

  // ============================================================================
  // PLANNING AGENT - Sprint & Resource Management
  // ============================================================================
  {
    agentId: 'planning',
    objective: 'Achieve 85% Sprint Completion Rate',
    description: 'Consistent delivery of committed sprint scope',
    category: 'performance',
    keyResults: [
      {
        title: 'Sprint Completion Rate',
        metric: 'sprint_completion_percent',
        targetValue: 85,
        warningThreshold: 75,
        criticalThreshold: 65,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Sprint Velocity Variance',
        metric: 'velocity_variance_percent',
        targetValue: 10,
        warningThreshold: 15,
        criticalThreshold: 20,
        unit: 'percent',
        direction: 'below',
      },
    ],
  },
  {
    agentId: 'planning',
    objective: 'Maintain Resource Utilization Between 80-90%',
    description: 'Optimal team capacity without overallocation',
    category: 'efficiency',
    keyResults: [
      {
        title: 'Team Utilization Rate',
        metric: 'resource_utilization_percent',
        targetValue: 85,
        warningThreshold: 75,
        criticalThreshold: 70,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Overallocation Incidents',
        metric: 'overallocation_count',
        targetValue: 0,
        warningThreshold: 2,
        criticalThreshold: 5,
        unit: 'count',
        direction: 'below',
      },
    ],
  },
  {
    agentId: 'planning',
    objective: 'Keep Dependency Blocking Below 5%',
    description: 'Minimize delays due to cross-team dependencies',
    category: 'efficiency',
    keyResults: [
      {
        title: 'Tasks Blocked by Dependencies',
        metric: 'dependency_blocking_percent',
        targetValue: 5,
        warningThreshold: 10,
        criticalThreshold: 15,
        unit: 'percent',
        direction: 'below',
      },
      {
        title: 'Average Blocker Resolution Time',
        metric: 'blocker_resolution_hours',
        targetValue: 24,
        warningThreshold: 48,
        criticalThreshold: 72,
        unit: 'hours',
        direction: 'below',
      },
    ],
  },

  // ============================================================================
  // TMO AGENT - Technical Management
  // ============================================================================
  {
    agentId: 'tmo',
    objective: 'Keep Tech Debt Ratio Below 20%',
    description: 'Manage technical debt to prevent system degradation',
    category: 'quality',
    keyResults: [
      {
        title: 'Tech Debt Ratio',
        metric: 'tech_debt_ratio_percent',
        targetValue: 20,
        warningThreshold: 25,
        criticalThreshold: 30,
        unit: 'percent',
        direction: 'below',
      },
      {
        title: 'Code Quality Score',
        metric: 'code_quality_score',
        targetValue: 8,
        warningThreshold: 7,
        criticalThreshold: 6,
        unit: 'score',
        direction: 'above',
      },
    ],
  },
  {
    agentId: 'tmo',
    objective: 'Achieve 90% Architecture Compliance',
    description: 'Adherence to technical standards and patterns',
    category: 'compliance',
    keyResults: [
      {
        title: 'Architecture Compliance Score',
        metric: 'architecture_compliance_percent',
        targetValue: 90,
        warningThreshold: 85,
        criticalThreshold: 80,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Architecture Violations',
        metric: 'architecture_violations_count',
        targetValue: 0,
        warningThreshold: 3,
        criticalThreshold: 5,
        unit: 'count',
        direction: 'below',
      },
    ],
  },
  {
    agentId: 'tmo',
    objective: 'Maintain System Availability Above 99.5%',
    description: 'High reliability and uptime for critical systems',
    category: 'performance',
    keyResults: [
      {
        title: 'System Availability',
        metric: 'system_availability_percent',
        targetValue: 99.5,
        warningThreshold: 99.0,
        criticalThreshold: 98.5,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Mean Time to Recovery (MTTR)',
        metric: 'mttr_minutes',
        targetValue: 30,
        warningThreshold: 60,
        criticalThreshold: 120,
        unit: 'minutes',
        direction: 'below',
      },
    ],
  },

  // ============================================================================
  // PMO AGENT - Portfolio Delivery
  // ============================================================================
  {
    agentId: 'pmo',
    objective: 'Deliver 90% of Projects On-Time',
    description: 'Consistent on-schedule project delivery',
    category: 'performance',
    keyResults: [
      {
        title: 'On-Time Delivery Rate',
        metric: 'ontime_delivery_percent',
        targetValue: 90,
        warningThreshold: 85,
        criticalThreshold: 80,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Schedule Performance Index (SPI)',
        metric: 'schedule_performance_index',
        targetValue: 1.0,
        warningThreshold: 0.95,
        criticalThreshold: 0.9,
        unit: 'ratio',
        direction: 'above',
      },
    ],
  },
  {
    agentId: 'pmo',
    objective: 'Keep Project Portfolio Balanced',
    description: 'Optimal mix of strategic, operational, and innovation projects',
    category: 'efficiency',
    keyResults: [
      {
        title: 'Portfolio Balance Score',
        metric: 'portfolio_balance_score',
        targetValue: 8,
        warningThreshold: 7,
        criticalThreshold: 6,
        unit: 'score',
        direction: 'above',
      },
      {
        title: 'Resource Contention Rate',
        metric: 'resource_contention_percent',
        targetValue: 10,
        warningThreshold: 15,
        criticalThreshold: 20,
        unit: 'percent',
        direction: 'below',
      },
    ],
  },

  // ============================================================================
  // OKR AGENT - OKR Management
  // ============================================================================
  {
    agentId: 'okr',
    objective: 'Achieve 80% OKR Completion Rate',
    description: 'Consistent achievement of organizational objectives',
    category: 'performance',
    keyResults: [
      {
        title: 'OKR Completion Rate',
        metric: 'okr_completion_percent',
        targetValue: 80,
        warningThreshold: 70,
        criticalThreshold: 60,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Key Results On-Track',
        metric: 'key_results_ontrack_percent',
        targetValue: 75,
        warningThreshold: 65,
        criticalThreshold: 55,
        unit: 'percent',
        direction: 'above',
      },
    ],
  },
  {
    agentId: 'okr',
    objective: 'Maintain 90% OKR Alignment',
    description: 'Ensure team OKRs align with company objectives',
    category: 'quality',
    keyResults: [
      {
        title: 'OKR Alignment Score',
        metric: 'okr_alignment_percent',
        targetValue: 90,
        warningThreshold: 85,
        criticalThreshold: 80,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'Cascading OKR Coverage',
        metric: 'okr_cascade_coverage_percent',
        targetValue: 95,
        warningThreshold: 90,
        criticalThreshold: 85,
        unit: 'percent',
        direction: 'above',
      },
    ],
  },

  // ============================================================================
  // OCM AGENT - Organizational Change Management
  // ============================================================================
  {
    agentId: 'ocm',
    objective: 'Achieve 85% Change Adoption Rate',
    description: 'Successful adoption of organizational changes',
    category: 'performance',
    keyResults: [
      {
        title: 'Change Adoption Rate',
        metric: 'change_adoption_percent',
        targetValue: 85,
        warningThreshold: 75,
        criticalThreshold: 65,
        unit: 'percent',
        direction: 'above',
      },
      {
        title: 'User Satisfaction with Change',
        metric: 'change_satisfaction_score',
        targetValue: 4.0,
        warningThreshold: 3.5,
        criticalThreshold: 3.0,
        unit: 'score',
        direction: 'above',
      },
    ],
  },
  {
    agentId: 'ocm',
    objective: 'Keep Change Resistance Below 15%',
    description: 'Minimize resistance to organizational changes',
    category: 'efficiency',
    keyResults: [
      {
        title: 'Change Resistance Rate',
        metric: 'change_resistance_percent',
        targetValue: 15,
        warningThreshold: 20,
        criticalThreshold: 25,
        unit: 'percent',
        direction: 'below',
      },
      {
        title: 'Stakeholder Engagement Score',
        metric: 'stakeholder_engagement_score',
        targetValue: 8,
        warningThreshold: 7,
        criticalThreshold: 6,
        unit: 'score',
        direction: 'above',
      },
    ],
  },
];

/**
 * Seed default OKRs for all agents
 */
export async function seedDefaultOKRs(): Promise<void> {
  console.log('[OKR Seed] Starting default OKR seeding...');

  let seededCount = 0;

  for (const okr of DEFAULT_OKRS) {
    try {
      // Check if OKR already exists for this agent + objective
      const existing = await db.query.agentOKRs.findFirst({
        where: (fields, { and, eq }) =>
          and(eq(fields.agentId, okr.agentId), eq(fields.objective, okr.objective)),
      });

      if (existing) {
        console.log(`[OKR Seed] Skipping duplicate: ${okr.agentId} - ${okr.objective}`);
        continue;
      }

      // Insert OKR
      await db.insert(agentOKRs).values({
        agentId: okr.agentId,
        objective: okr.objective,
        description: okr.description,
        keyResults: JSON.stringify(okr.keyResults),
        linkedCamundaRule: okr.linkedCamundaRule,
        category: okr.category,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seededCount++;
      console.log(`[OKR Seed] ✅ Seeded: ${okr.agentId} - ${okr.objective}`);
    } catch (error: any) {
      console.error(`[OKR Seed] ❌ Failed to seed ${okr.agentId} - ${okr.objective}:`, error.message);
    }
  }

  console.log(`[OKR Seed] ✅ Seeding complete! Seeded ${seededCount} OKRs.`);
}

/**
 * Get default OKRs for a specific agent
 */
export function getDefaultOKRsForAgent(agentId: string): OKRTemplate[] {
  return DEFAULT_OKRS.filter((okr) => okr.agentId === agentId);
}

/**
 * Get all default OKRs grouped by agent
 */
export function getAllDefaultOKRs(): Record<string, OKRTemplate[]> {
  const grouped: Record<string, OKRTemplate[]> = {};

  for (const okr of DEFAULT_OKRS) {
    if (!grouped[okr.agentId]) {
      grouped[okr.agentId] = [];
    }
    grouped[okr.agentId].push(okr);
  }

  return grouped;
}
