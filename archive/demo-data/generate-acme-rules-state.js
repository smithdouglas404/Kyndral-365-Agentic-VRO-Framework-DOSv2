#!/usr/bin/env node
/**
 * ACME Rules Engine State Generator
 * Creates pre-fired rules showing which rules triggered and why
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rule definitions with conditions
const ruleDefinitions = {
  'Budget Overrun Critical': {
    type: 'financial',
    condition: 'CPI < 0.85',
    threshold: { metric: 'CPI', operator: '<', value: 0.85 },
    severity: 'critical',
    actions: ['Create FinOps intervention', 'Notify project manager', 'Escalate to steering committee'],
    description: 'Project cost performance index below critical threshold'
  },
  'Budget Overrun Moderate': {
    type: 'financial',
    condition: 'CPI < 0.90',
    threshold: { metric: 'CPI', operator: '<', value: 0.90 },
    severity: 'warning',
    actions: ['Create FinOps intervention', 'Request cost review'],
    description: 'Project cost performance showing negative trend'
  },
  'Schedule Delay High': {
    type: 'schedule',
    condition: 'SPI < 0.80',
    threshold: { metric: 'SPI', operator: '<', value: 0.80 },
    severity: 'critical',
    actions: ['Create TMO intervention', 'Develop recovery schedule', 'Assess resource needs'],
    description: 'Project schedule performance critically behind plan'
  },
  'Schedule Delay Moderate': {
    type: 'schedule',
    condition: 'SPI < 0.90',
    threshold: { metric: 'SPI', operator: '<', value: 0.90 },
    severity: 'warning',
    actions: ['Create TMO intervention', 'Review critical path'],
    description: 'Project schedule showing delays'
  },
  'Triple Threat Pattern': {
    type: 'risk',
    condition: 'CPI < 0.85 AND SPI < 0.85 AND Quality Issues',
    threshold: { metrics: ['CPI', 'SPI', 'Quality'], operator: 'ALL_BELOW', value: 0.85 },
    severity: 'critical',
    actions: ['Create Risk intervention', 'Executive escalation', 'Integrated recovery plan'],
    description: 'Budget, schedule, and quality converging - high risk of failure'
  },
  'Technical Debt Impact': {
    type: 'risk',
    condition: 'Quality shortcuts detected under schedule pressure',
    threshold: { metric: 'Technical_Debt_Score', operator: '>', value: 70 },
    severity: 'warning',
    actions: ['Create Risk intervention', 'Technical review required'],
    description: 'Technical debt accumulating, future maintenance risk'
  },
  'Budget Variance Warning': {
    type: 'financial',
    condition: 'Forecast variance > 10%',
    threshold: { metric: 'Budget_Variance', operator: '>', value: 10 },
    severity: 'warning',
    actions: ['Financial analysis', 'Trend monitoring'],
    description: 'Budget forecast showing significant variance from plan'
  },
  'Scope Change Detected': {
    type: 'governance',
    condition: 'Scope changes without approval',
    threshold: { metric: 'Unapproved_Changes', operator: '>', value: 0 },
    severity: 'warning',
    actions: ['Governance review', 'Change control enforcement'],
    description: 'Scope changes detected without proper approval process'
  },
  'Stage Gate Approval Overdue': {
    type: 'governance',
    condition: 'Gate approval past due date',
    threshold: { metric: 'Days_Overdue', operator: '>', value: 0 },
    severity: 'warning',
    actions: ['Governance escalation', 'Committee scheduling'],
    description: 'Stage gate approval overdue'
  },
  'Governance Review Required': {
    type: 'governance',
    condition: 'Periodic review cycle triggered',
    threshold: { metric: 'Days_Since_Review', operator: '>', value: 90 },
    severity: 'medium',
    actions: ['Schedule governance review', 'Prepare materials'],
    description: 'Regular governance review cycle triggered'
  },
  'Change Adoption Below Target': {
    type: 'change_management',
    condition: 'Adoption rate < target',
    threshold: { metric: 'Adoption_Rate', operator: '<', value: 65 },
    severity: 'warning',
    actions: ['OCM intervention', 'Enhanced training', 'Stakeholder engagement'],
    description: 'User adoption below target threshold'
  },
  'Stakeholder Engagement Gap': {
    type: 'change_management',
    condition: 'Stakeholder sentiment declining',
    threshold: { metric: 'Engagement_Score', operator: '<', value: 60 },
    severity: 'warning',
    actions: ['OCM intervention', 'Stakeholder analysis', 'Communication enhancement'],
    description: 'Stakeholder engagement trending negative'
  },
  'High Risk Dependencies': {
    type: 'risk',
    condition: 'Critical dependencies with high risk',
    threshold: { metric: 'Dependency_Risk_Score', operator: '>', value: 75 },
    severity: 'medium',
    actions: ['Risk assessment', 'Mitigation planning'],
    description: 'High-risk dependencies identified'
  },
  'Environmental Compliance Monitoring': {
    type: 'governance',
    condition: 'Environmental compliance review pending',
    threshold: { metric: 'Compliance_Status', operator: '=', value: 'PENDING' },
    severity: 'medium',
    actions: ['Compliance monitoring', 'Documentation review'],
    description: 'Environmental compliance requires ongoing monitoring'
  },
  'Technical Integration Risk': {
    type: 'risk',
    condition: 'Complex technical integration',
    threshold: { metric: 'Integration_Complexity', operator: '>', value: 70 },
    severity: 'medium',
    actions: ['Technical review', 'Integration testing plan'],
    description: 'Technical integration complexity presents risk'
  },
  'Regulatory Approval Pending': {
    type: 'governance',
    condition: 'Awaiting regulatory approval',
    threshold: { metric: 'Approval_Status', operator: '=', value: 'PENDING' },
    severity: 'medium',
    actions: ['Regulatory liaison', 'Status tracking'],
    description: 'Regulatory approval pending'
  },
  'Production Impact Analysis Required': {
    type: 'risk',
    condition: 'High impact to production systems',
    threshold: { metric: 'Production_Impact', operator: '>', value: 80 },
    severity: 'high',
    actions: ['Impact assessment', 'Rollback planning', 'Executive approval'],
    description: 'High production impact requires detailed analysis'
  },
  'Compliance Framework Gap': {
    type: 'governance',
    condition: 'Compliance framework not fully implemented',
    threshold: { metric: 'Compliance_Coverage', operator: '<', value: 90 },
    severity: 'medium',
    actions: ['Gap analysis', 'Control implementation'],
    description: 'Compliance framework has gaps requiring attention'
  },
  'Integration Risk': {
    type: 'risk',
    condition: 'Integration with legacy systems',
    threshold: { metric: 'Integration_Risk', operator: '>', value: 65 },
    severity: 'medium',
    actions: ['Integration testing', 'Risk mitigation'],
    description: 'Integration complexity presents moderate risk'
  },
  'Security Review Extended': {
    type: 'governance',
    condition: 'Security review taking longer than planned',
    threshold: { metric: 'Review_Duration', operator: '>', value: 'PLANNED' },
    severity: 'medium',
    actions: ['Security team engagement', 'Issue resolution'],
    description: 'Security review timeline extended'
  }
};

// Generate fired rule record
function generateFiredRule(project, ruleName, industryId, companyId) {
  const rule = ruleDefinitions[ruleName];
  if (!rule) return null;

  const now = new Date();
  const weeksAgo = Math.floor(Math.random() * 4) + 1;
  const firedAt = new Date(now - weeksAgo * 7 * 24 * 60 * 60 * 1000);

  // Determine actual values that caused rule to fire
  const actualValues = {};
  if (rule.threshold.metric === 'CPI') {
    actualValues.CPI = project.budget.cpi;
    actualValues.variance = ((1 - project.budget.cpi) * 100).toFixed(1) + '%';
  }
  if (rule.threshold.metric === 'SPI') {
    actualValues.SPI = project.schedule.spi;
    actualValues.weeksLate = project.schedule.weeksLate;
  }
  if (rule.type === 'risk' && ruleName === 'Triple Threat Pattern') {
    actualValues.CPI = project.budget.cpi;
    actualValues.SPI = project.schedule.spi;
    actualValues.qualityIssues = 'Detected';
  }

  return {
    ruleId: ruleName.toLowerCase().replace(/\s+/g, '_'),
    ruleName,
    projectName: project.name,
    industryId,
    companyId,
    type: rule.type,
    severity: rule.severity,
    condition: rule.condition,
    threshold: rule.threshold,
    actualValues,
    firedAt: firedAt.toISOString(),
    weeksAgoFired: weeksAgo,
    triggeredActions: rule.actions,
    status: 'active',
    description: rule.description,
    context: {
      projectHealth: project.healthStatus,
      budgetPlanned: project.budget.planned,
      budgetActual: project.budget.actual,
      schedulePlanned: project.schedule.plannedDuration,
      scheduleActual: project.schedule.actualDuration,
      interventionsCreated: project.interventionTypes.length
    },
    evaluation: {
      passed: false,
      reason: `${rule.threshold.metric} ${rule.threshold.operator} ${rule.threshold.value}`,
      evaluatedAt: firedAt.toISOString()
    }
  };
}

// Main execution
console.log('═══════════════════════════════════════════════════');
console.log('   ACME Rules Engine State Generator');
console.log('═══════════════════════════════════════════════════\n');

const projectsPath = path.join(__dirname, '../seed-data/acme-project-templates.json');
const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

const allFiredRules = [];
let totalRulesFired = 0;

for (const industry of projects) {
  let industryRulesFired = 0;

  for (const project of industry.projects) {
    if (!project.triggeredRules || project.triggeredRules.length === 0) continue;

    for (const ruleName of project.triggeredRules) {
      const firedRule = generateFiredRule(project, ruleName, industry.industryId, industry.companyId);
      if (firedRule) {
        allFiredRules.push(firedRule);
        industryRulesFired++;
      }
    }
  }

  if (industryRulesFired > 0) {
    console.log(`  ✓ ${industry.industryId.padEnd(30)} ${industryRulesFired} rules fired`);
    totalRulesFired += industryRulesFired;
  }
}

// Sort by fire date (oldest first)
allFiredRules.sort((a, b) => new Date(a.firedAt) - new Date(b.firedAt));

// Write rules state file
const rulesStatePath = path.join(__dirname, '../seed-data/acme-rules-state.json');
fs.writeFileSync(rulesStatePath, JSON.stringify(allFiredRules, null, 2));

// Generate rule summary
const ruleSummary = {};
allFiredRules.forEach(rule => {
  if (!ruleSummary[rule.type]) ruleSummary[rule.type] = 0;
  ruleSummary[rule.type]++;
});

console.log('\n  Rule Types:');
Object.entries(ruleSummary).forEach(([type, count]) => {
  console.log(`    - ${type}: ${count}`);
});

console.log('\n═══════════════════════════════════════════════════');
console.log(`✅ Complete! Generated ${totalRulesFired} fired rule records`);
console.log(`📁 Saved to: acme-rules-state.json`);
console.log('═══════════════════════════════════════════════════');
