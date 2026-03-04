/**
 * Seed business rules to Palantir as Intervention objects
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const palantir = getPalantirService();
  if (!palantir) {
    console.log('Palantir service not available');
    process.exit(1);
  }

  console.log('Creating business rules in Palantir...\n');

  const businessRules = [
    {
      insight_id: 'rule-budget-threshold',
      title: '[Rule] Budget Variance Threshold',
      description: 'Projects exceeding 10% budget variance require executive approval',
      insight_type: 'rule',
      severity: 'high',
      recommendation: 'Escalate to CFO for budget reallocation approval',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-schedule-delay',
      title: '[Rule] Schedule Delay Notification',
      description: 'Projects delayed more than 2 weeks trigger automatic stakeholder notification',
      insight_type: 'rule',
      severity: 'medium',
      recommendation: 'Send delay notification to project sponsor and PMO',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-risk-escalation',
      title: '[Rule] Critical Risk Escalation',
      description: 'Critical risks (score > 8) must be reviewed within 24 hours',
      insight_type: 'rule',
      severity: 'critical',
      recommendation: 'Escalate to Risk Committee for immediate review',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-resource-allocation',
      title: '[Rule] Resource Over-allocation',
      description: 'Resources allocated above 120% capacity require manager approval',
      insight_type: 'rule',
      severity: 'medium',
      recommendation: 'Review resource allocation with resource manager',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-dependency-blocking',
      title: '[Rule] Blocking Dependency Alert',
      description: 'Unresolved blocking dependencies older than 5 days trigger escalation',
      insight_type: 'rule',
      severity: 'high',
      recommendation: 'Escalate to dependency owner and project manager',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-milestone-approval',
      title: '[Rule] Milestone Completion Approval',
      description: 'Phase gate milestones require PMO sign-off before proceeding',
      insight_type: 'rule',
      severity: 'high',
      recommendation: 'Submit milestone deliverables for PMO review',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-change-request',
      title: '[Rule] Scope Change Request',
      description: 'Scope changes affecting budget or timeline require Change Advisory Board approval',
      insight_type: 'rule',
      severity: 'high',
      recommendation: 'Submit RFC to Change Advisory Board',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-vendor-contract',
      title: '[Rule] Vendor Contract Renewal',
      description: 'Vendor contracts must be reviewed 90 days before expiration',
      insight_type: 'rule',
      severity: 'medium',
      recommendation: 'Initiate contract review process with procurement',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-compliance-audit',
      title: '[Rule] Compliance Audit Requirement',
      description: 'Projects handling PII must complete quarterly compliance audits',
      insight_type: 'rule',
      severity: 'critical',
      recommendation: 'Schedule compliance audit with security team',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      insight_id: 'rule-okr-alignment',
      title: '[Rule] OKR Alignment Check',
      description: 'All new initiatives must be aligned to at least one strategic OKR',
      insight_type: 'rule',
      severity: 'medium',
      recommendation: 'Map initiative to strategic objectives before approval',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ];

  let created = 0;
  for (const rule of businessRules) {
    try {
      await palantir.applyAction('atlas-create-insight', rule);
      created++;
      console.log(`✓ Created rule: ${rule.title}`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`≈ Rule already exists: ${rule.title}`);
        created++;
      } else {
        console.log(`✗ Failed to create ${rule.title}: ${error.message}`);
      }
    }
  }

  console.log(`\n${created}/${businessRules.length} business rules created in Palantir`);
}

main().catch(console.error);
