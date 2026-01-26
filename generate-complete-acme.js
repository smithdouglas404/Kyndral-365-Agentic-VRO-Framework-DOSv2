const fs = require('fs');

// Read existing data
const existing = JSON.parse(fs.readFileSync('./server/seed-data/acme-project-templates.json', 'utf8'));

// Helper functions for creating projects
const proj = (name, desc, health, bp, ba, bf, cpi, pd, ad, wl, spi, tasks, rules, inter, gov) => ({
  name, description: desc, healthStatus: health,
  budget: { planned: bp, actual: ba, forecast: bf, cpi },
  schedule: { plannedDuration: pd, actualDuration: ad, weeksLate: wl, spi },
  tasks, triggeredRules: rules, interventionTypes: inter, governanceStatus: gov
});

const t = (name, status, delayWeeks, rootCause) => ({ name, status, delayWeeks, rootCause });

// Industry data - defines all 18 new industries with their projects
const industries = [
  // 1. HEALTHCARE
  {
    industryId: 'healthcare',
    companyId: 'acme-health',
    projects: [
      proj('Epic EMR System Upgrade', 'Upgrade Epic electronic medical records across 12 hospitals', 'critical',
        42000000, 54000000, 60000000, 0.78, 18, 24, 6, 0.75,
        [t('Data Migration Planning', 'complete', 3, 'Complex data mapping, vendor delays'),
         t('System Configuration', 'in_progress', 5, 'Customization exceeded estimates'),
         t('Clinical Workflow Design', 'in_progress', 4, 'Physician alignment challenges'),
         t('Go-Live Preparation', 'blocked', 6, 'Dependencies incomplete, training delayed')],
        ['Budget Overrun Critical', 'Schedule Delay High', 'Clinical Safety Risk'],
        ['DeepFinOps', 'DeepTMO', 'DeepRisk'], 'executive_escalation_required'),

      proj('Hospital Expansion - Cardiology Wing', 'New 80-bed cardiology wing with hybrid ORs', 'critical',
        125000000, 148000000, 160000000, 0.84, 30, 36, 6, 0.79,
        [t('Architectural Design', 'complete', 4, 'Code compliance issues'),
         t('Foundation & Structure', 'complete', 5, 'Soil conditions, weather'),
         t('Medical Equipment Install', 'in_progress', 6, 'Supply chain delays'),
         t('Systems Commissioning', 'pending', 0, 'Waiting on equipment')],
        ['Budget Overrun Critical', 'Schedule Delay High', 'Regulatory Compliance Risk'],
        ['DeepFinOps', 'DeepTMO', 'DeepGovernance'], 'compliance_review_pending'),

      proj('Telehealth Platform Expansion', 'Scale virtual care to 50K daily appointments', 'warning',
        15000000, 13800000, 16200000, 0.92, 12, 14, 2, 0.86,
        [t('Platform Selection', 'complete', 0, 'None'),
         t('Infrastructure Scaling', 'in_progress', 2, 'Performance tuning challenges'),
         t('Provider Training', 'in_progress', 1, 'Clinical staff scheduling conflicts'),
         t('Patient Onboarding', 'pending', 2, 'Dependent on training')],
        ['Schedule Delay Moderate', 'Integration Risk'],
        ['DeepTMO', 'DeepOCM'], 'on_track'),

      proj('Medical Device IoT Integration', 'Connect 5000+ devices to central monitoring', 'warning',
        8500000, 7800000, 9200000, 0.92, 10, 11, 1, 0.88,
        [t('Device Inventory', 'complete', 0, 'None'),
         t('Integration Development', 'complete', 1, 'Legacy device compatibility'),
         t('Pilot Deployment', 'in_progress', 1, 'Network connectivity issues'),
         t('Full Rollout', 'pending', 0, 'Waiting on pilot validation')],
        ['Schedule Delay Moderate', 'Technical Integration Risk'],
        ['DeepTMO', 'DeepRisk'], 'on_track'),

      proj('AI Diagnostic Assistant', 'Deploy AI radiology image analysis', 'healthy',
        12000000, 10500000, 11200000, 1.14, 14, 12, -2, 1.12,
        [t('Vendor Selection', 'complete', 0, 'None'),
         t('Model Validation', 'complete', 0, 'None'),
         t('Integration & Testing', 'complete', -1, 'Efficient execution'),
         t('Radiologist Training', 'in_progress', -2, 'Ahead of schedule')],
        [], [], 'on_track'),

      proj('Patient Portal Modernization', 'New engagement platform with mobile app', 'healthy',
        6500000, 5800000, 6200000, 1.12, 9, 8, -1, 1.11,
        [t('UX Research', 'complete', 0, 'None'),
         t('Development', 'complete', 0, 'None'),
         t('HIPAA Security Review', 'complete', -1, 'Proactive security design'),
         t('Beta Launch', 'in_progress', -1, 'Early completion')],
        [], [], 'on_track'),

      proj('Clinical Trial Management System', 'CTMS for 200+ concurrent studies', 'risk',
        18000000, 17200000, 19500000, 1.05, 16, 15, -1, 1.06,
        [t('Requirements Analysis', 'complete', 0, 'None'),
         t('System Configuration', 'complete', 0, 'None'),
         t('Data Migration', 'in_progress', 0, 'None'),
         t('FDA Validation', 'pending', 0, 'High risk - regulatory approval required')],
        ['Regulatory Approval Pending', 'Compliance Validation Risk'],
        ['DeepRisk', 'DeepGovernance'], 'regulatory_review'),

      proj('Pharmacy Automation Upgrade', 'Robotic dispensing in 8 pharmacies', 'risk',
        22000000, 20800000, 23500000, 1.06, 14, 13, -1, 1.07,
        [t('Equipment Procurement', 'complete', 0, 'None'),
         t('Facility Modifications', 'complete', 0, 'None'),
         t('System Installation', 'in_progress', 0, 'None'),
         t('Validation & Go-Live', 'pending', 0, 'Patient safety critical validation')],
        ['High Risk Implementation', 'Patient Safety Monitoring'],
        ['DeepRisk', 'DeepGovernance'], 'high_risk_monitoring'),

      proj('Revenue Cycle Optimization', 'AI-powered billing optimization', 'governance',
        9500000, 9200000, 10000000, 1.03, 11, 11, 0, 1.00,
        [t('Process Analysis', 'complete', 0, 'None'),
         t('Platform Implementation', 'complete', 0, 'None'),
         t('Staff Training', 'in_progress', 0, 'None'),
         t('Performance Validation', 'pending', 0, 'None')],
        ['Stage Gate Approval Pending', 'Change Adoption Monitoring'],
        ['DeepGovernance', 'DeepOCM'], 'approval_pending'),

      proj('Nursing Workflow Optimization', 'Mobile nursing stations deployment', 'governance',
        7500000, 7200000, 7900000, 1.04, 10, 10, 0, 1.00,
        [t('Workflow Assessment', 'complete', 0, 'None'),
         t('Technology Selection', 'complete', 0, 'None'),
         t('Pilot Program', 'in_progress', 0, 'None'),
         t('Change Management', 'in_progress', 0, 'None')],
        ['Change Adoption Below Target', 'Stakeholder Engagement Gap'],
        ['DeepOCM', 'DeepGovernance'], 'stakeholder_review_pending')
    ]
  }
];

// Combine and write
const allIndustries = [...existing, ...industries];
fs.writeFileSync('./server/seed-data/acme-project-templates.json', JSON.stringify(allIndustries, null, 2));
console.log(`Generated ${allIndustries.length} industries total (${industries.length} new)`);
