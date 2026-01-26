const fs = require('fs');

// Existing industries (will be preserved)
const existingIndustries = require('./server/seed-data/acme-project-templates.json');

// New industries to add
const newIndustries = [
  {
    industryId: 'healthcare',
    companyId: 'acme-health',
    projects: [
      {
        name: 'Epic EMR System Upgrade',
        description: 'Upgrade Epic electronic medical records system to latest version across 12 hospitals',
        healthStatus: 'critical',
        budget: { planned: 42000000, actual: 54000000, forecast: 60000000, cpi: 0.78 },
        schedule: { plannedDuration: 18, actualDuration: 24, weeksLate: 6, spi: 0.75 },
        tasks: [
          { name: 'Data Migration Planning', status: 'complete', delayWeeks: 3, rootCause: 'Complex data mapping, vendor delays' },
          { name: 'System Configuration', status: 'in_progress', delayWeeks: 5, rootCause: 'Customization requirements exceeded estimates' },
          { name: 'Clinical Workflow Design', status: 'in_progress', delayWeeks: 4, rootCause: 'Physician stakeholder alignment challenges' },
          { name: 'Go-Live Preparation', status: 'blocked', delayWeeks: 6, rootCause: 'Dependencies not complete, training delayed' }
        ],
        triggeredRules: ['Budget Overrun Critical', 'Schedule Delay High', 'Clinical Safety Risk'],
        interventionTypes: ['DeepFinOps', 'DeepTMO', 'DeepRisk'],
        governanceStatus: 'executive_escalation_required'
      },
      {
        name: 'Hospital Expansion - Cardiology Wing',
        description: 'Construct new 80-bed cardiology wing with hybrid ORs and cath labs',
        healthStatus: 'critical',
        budget: { planned: 125000000, actual: 148000000, forecast: 160000000, cpi: 0.84 },
        schedule: { plannedDuration: 30, actualDuration: 36, weeksLate: 6, spi: 0.79 },
        tasks: [
          { name: 'Architectural Design', status: 'complete', delayWeeks: 4, rootCause: 'Code compliance issues, design revisions' },
          { name: 'Foundation & Structure', status: 'complete', delayWeeks: 5, rootCause: 'Soil conditions, weather delays' },
          { name: 'Medical Equipment Install', status: 'in_progress', delayWeeks: 6, rootCause: 'Supply chain delays, vendor coordination' },
          { name: 'Systems Commissioning', status: 'pending', delayWeeks: 0, rootCause: 'Waiting on equipment installation' }
        ],
        triggeredRules: ['Budget Overrun Critical', 'Schedule Delay High', 'Regulatory Compliance Risk'],
        interventionTypes: ['DeepFinOps', 'DeepTMO', 'DeepGovernance'],
        governanceStatus: 'compliance_review_pending'
      },
      {
        name: 'Telehealth Platform Expansion',
        description: 'Scale virtual care platform to support 50K daily appointments',
        healthStatus: 'warning',
        budget: { planned: 15000000, actual: 13800000, forecast: 16200000, cpi: 0.92 },
        schedule: { plannedDuration: 12, actualDuration: 14, weeksLate: 2, spi: 0.86 },
        tasks: [
          { name: 'Platform Selection', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Infrastructure Scaling', status: 'in_progress', delayWeeks: 2, rootCause: 'Performance tuning challenges' },
          { name: 'Provider Training', status: 'in_progress', delayWeeks: 1, rootCause: 'Scheduling conflicts with clinical staff' },
          { name: 'Patient Onboarding', status: 'pending', delayWeeks: 2, rootCause: 'Dependent on training completion' }
        ],
        triggeredRules: ['Schedule Delay Moderate', 'Integration Risk'],
        interventionTypes: ['DeepTMO', 'DeepOCM'],
        governanceStatus: 'on_track'
      },
      {
        name: 'Medical Device IoT Integration',
        description: 'Connect 5000+ medical devices to central monitoring system',
        healthStatus: 'warning',
        budget: { planned: 8500000, actual: 7800000, forecast: 9200000, cpi: 0.92 },
        schedule: { plannedDuration: 10, actualDuration: 11, weeksLate: 1, spi: 0.88 },
        tasks: [
          { name: 'Device Inventory', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Integration Development', status: 'complete', delayWeeks: 1, rootCause: 'Legacy device compatibility issues' },
          { name: 'Pilot Deployment', status: 'in_progress', delayWeeks: 1, rootCause: 'Network connectivity challenges' },
          { name: 'Full Rollout', status: 'pending', delayWeeks: 0, rootCause: 'Waiting on pilot validation' }
        ],
        triggeredRules: ['Schedule Delay Moderate', 'Technical Integration Risk'],
        interventionTypes: ['DeepTMO', 'DeepRisk'],
        governanceStatus: 'on_track'
      },
      {
        name: 'AI Diagnostic Assistant Implementation',
        description: 'Deploy AI-powered radiology image analysis across imaging centers',
        healthStatus: 'healthy',
        budget: { planned: 12000000, actual: 10500000, forecast: 11200000, cpi: 1.14 },
        schedule: { plannedDuration: 14, actualDuration: 12, weeksLate: -2, spi: 1.12 },
        tasks: [
          { name: 'Vendor Selection', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Model Validation', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Integration & Testing', status: 'complete', delayWeeks: -1, rootCause: 'Efficient execution' },
          { name: 'Radiologist Training', status: 'in_progress', delayWeeks: -2, rootCause: 'Ahead of schedule' }
        ],
        triggeredRules: [],
        interventionTypes: [],
        governanceStatus: 'on_track'
      },
      {
        name: 'Patient Portal Modernization',
        description: 'Launch new patient engagement platform with mobile app',
        healthStatus: 'healthy',
        budget: { planned: 6500000, actual: 5800000, forecast: 6200000, cpi: 1.12 },
        schedule: { plannedDuration: 9, actualDuration: 8, weeksLate: -1, spi: 1.11 },
        tasks: [
          { name: 'UX Research', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Development', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'HIPAA Security Review', status: 'complete', delayWeeks: -1, rootCause: 'Proactive security design' },
          { name: 'Beta Launch', status: 'in_progress', delayWeeks: -1, rootCause: 'Early completion' }
        ],
        triggeredRules: [],
        interventionTypes: [],
        governanceStatus: 'on_track'
      },
      {
        name: 'Clinical Trial Management System',
        description: 'Implement new CTMS for managing 200+ concurrent research studies',
        healthStatus: 'risk',
        budget: { planned: 18000000, actual: 17200000, forecast: 19500000, cpi: 1.05 },
        schedule: { plannedDuration: 16, actualDuration: 15, weeksLate: -1, spi: 1.06 },
        tasks: [
          { name: 'Requirements Analysis', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'System Configuration', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Data Migration', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'FDA Validation', status: 'pending', delayWeeks: 0, rootCause: 'High risk - regulatory approval required' }
        ],
        triggeredRules: ['Regulatory Approval Pending', 'Compliance Validation Risk'],
        interventionTypes: ['DeepRisk', 'DeepGovernance'],
        governanceStatus: 'regulatory_review'
      },
      {
        name: 'Pharmacy Automation Upgrade',
        description: 'Install robotic dispensing systems in 8 hospital pharmacies',
        healthStatus: 'risk',
        budget: { planned: 22000000, actual: 20800000, forecast: 23500000, cpi: 1.06 },
        schedule: { plannedDuration: 14, actualDuration: 13, weeksLate: -1, spi: 1.07 },
        tasks: [
          { name: 'Equipment Procurement', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Facility Modifications', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'System Installation', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'Validation & Go-Live', status: 'pending', delayWeeks: 0, rootCause: 'Complex validation protocols, patient safety critical' }
        ],
        triggeredRules: ['High Risk Implementation', 'Patient Safety Monitoring'],
        interventionTypes: ['DeepRisk', 'DeepGovernance'],
        governanceStatus: 'high_risk_monitoring'
      },
      {
        name: 'Revenue Cycle Optimization',
        description: 'Implement AI-powered billing and coding optimization platform',
        healthStatus: 'governance',
        budget: { planned: 9500000, actual: 9200000, forecast: 10000000, cpi: 1.03 },
        schedule: { plannedDuration: 11, actualDuration: 11, weeksLate: 0, spi: 1.00 },
        tasks: [
          { name: 'Process Analysis', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Platform Implementation', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Staff Training', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'Performance Validation', status: 'pending', delayWeeks: 0, rootCause: 'None' }
        ],
        triggeredRules: ['Stage Gate Approval Pending', 'Change Adoption Monitoring'],
        interventionTypes: ['DeepGovernance', 'DeepOCM'],
        governanceStatus: 'approval_pending'
      },
      {
        name: 'Nursing Workflow Optimization',
        description: 'Deploy mobile nursing stations and workflow automation tools',
        healthStatus: 'governance',
        budget: { planned: 7500000, actual: 7200000, forecast: 7900000, cpi: 1.04 },
        schedule: { plannedDuration: 10, actualDuration: 10, weeksLate: 0, spi: 1.00 },
        tasks: [
          { name: 'Workflow Assessment', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Technology Selection', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Pilot Program', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'Change Management', status: 'in_progress', delayWeeks: 0, rootCause: 'None' }
        ],
        triggeredRules: ['Change Adoption Below Target', 'Stakeholder Engagement Gap'],
        interventionTypes: ['DeepOCM', 'DeepGovernance'],
        governanceStatus: 'stakeholder_review_pending'
      }
    ]
  },
  {
    industryId: 'financial-services',
    companyId: 'acme-finserv',
    projects: [
      {
        name: 'Core Banking System Modernization',
        description: 'Replace 30-year-old mainframe with modern core banking platform',
        healthStatus: 'critical',
        budget: { planned: 120000000, actual: 158000000, forecast: 175000000, cpi: 0.76 },
        schedule: { plannedDuration: 36, actualDuration: 46, weeksLate: 10, spi: 0.78 },
        tasks: [
          { name: 'Vendor Selection', status: 'complete', delayWeeks: 4, rootCause: 'Extended RFP process, board approval delays' },
          { name: 'Data Migration Design', status: 'in_progress', delayWeeks: 8, rootCause: 'Legacy data quality issues, complex transformations' },
          { name: 'Parallel Run Testing', status: 'in_progress', delayWeeks: 10, rootCause: 'Reconciliation issues, performance problems' },
          { name: 'Cutover Planning', status: 'blocked', delayWeeks: 10, rootCause: 'Testing not complete, high risk' }
        ],
        triggeredRules: ['Budget Overrun Critical', 'Schedule Delay High', 'Regulatory Risk'],
        interventionTypes: ['DeepFinOps', 'DeepTMO', 'DeepRisk', 'DeepGovernance'],
        governanceStatus: 'executive_escalation_required'
      },
      {
        name: 'Digital Banking Platform Launch',
        description: 'Launch new digital-only bank brand with mobile-first experience',
        healthStatus: 'critical',
        budget: { planned: 65000000, actual: 78000000, forecast: 88000000, cpi: 0.83 },
        schedule: { plannedDuration: 20, actualDuration: 26, weeksLate: 6, spi: 0.77 },
        tasks: [
          { name: 'Platform Development', status: 'complete', delayWeeks: 4, rootCause: 'Feature creep, security requirements expanded' },
          { name: 'Regulatory Approval', status: 'in_progress', delayWeeks: 5, rootCause: 'Additional documentation requested by regulators' },
          { name: 'Marketing Campaign', status: 'in_progress', delayWeeks: 6, rootCause: 'Delayed by launch date changes' },
          { name: 'Public Launch', status: 'at_risk', delayWeeks: 6, rootCause: 'Regulatory approval still pending' }
        ],
        triggeredRules: ['Budget Overrun Critical', 'Schedule Delay High', 'Market Window Risk'],
        interventionTypes: ['DeepFinOps', 'DeepTMO', 'DeepGovernance'],
        governanceStatus: 'regulatory_review'
      },
      {
        name: 'Real-Time Payments Implementation',
        description: 'Implement RTP rails and instant payment capabilities',
        healthStatus: 'warning',
        budget: { planned: 28000000, actual: 25800000, forecast: 30500000, cpi: 0.92 },
        schedule: { plannedDuration: 14, actualDuration: 16, weeksLate: 2, spi: 0.88 },
        tasks: [
          { name: 'Network Integration', status: 'complete', delayWeeks: 1, rootCause: 'Integration complexity with clearing house' },
          { name: 'Fraud Detection Setup', status: 'in_progress', delayWeeks: 2, rootCause: 'Real-time fraud rules more complex than planned' },
          { name: 'Customer Systems Update', status: 'in_progress', delayWeeks: 2, rootCause: 'Legacy system integration challenges' },
          { name: 'Launch Preparation', status: 'pending', delayWeeks: 0, rootCause: 'Waiting on fraud detection completion' }
        ],
        triggeredRules: ['Schedule Delay Moderate', 'Integration Risk'],
        interventionTypes: ['DeepTMO', 'DeepRisk'],
        governanceStatus: 'on_track'
      },
      {
        name: 'Anti-Money Laundering System Upgrade',
        description: 'Implement AI-powered AML transaction monitoring system',
        healthStatus: 'warning',
        budget: { planned: 35000000, actual: 32200000, forecast: 38000000, cpi: 0.92 },
        schedule: { plannedDuration: 16, actualDuration: 18, weeksLate: 2, spi: 0.89 },
        tasks: [
          { name: 'Vendor Selection', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Rule Configuration', status: 'complete', delayWeeks: 2, rootCause: 'Complex regulatory requirements' },
          { name: 'Historical Data Testing', status: 'in_progress', delayWeeks: 2, rootCause: 'False positive rate tuning' },
          { name: 'Production Deployment', status: 'pending', delayWeeks: 2, rootCause: 'Regulatory validation required' }
        ],
        triggeredRules: ['Schedule Delay Moderate', 'Regulatory Compliance Risk'],
        interventionTypes: ['DeepTMO', 'DeepGovernance'],
        governanceStatus: 'compliance_review_pending'
      },
      {
        name: 'Wealth Management Platform Upgrade',
        description: 'Modernize advisor workstation and client portal for wealth division',
        healthStatus: 'healthy',
        budget: { planned: 42000000, actual: 38500000, forecast: 40000000, cpi: 1.09 },
        schedule: { plannedDuration: 18, actualDuration: 16, weeksLate: -2, spi: 1.11 },
        tasks: [
          { name: 'Requirements Gathering', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Platform Development', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Data Migration', status: 'complete', delayWeeks: -1, rootCause: 'Efficient execution, good data quality' },
          { name: 'Advisor Training', status: 'in_progress', delayWeeks: -2, rootCause: 'Ahead of schedule' }
        ],
        triggeredRules: [],
        interventionTypes: [],
        governanceStatus: 'on_track'
      },
      {
        name: 'Cloud Data Lake Implementation',
        description: 'Build enterprise data lake for analytics and regulatory reporting',
        healthStatus: 'healthy',
        budget: { planned: 25000000, actual: 22800000, forecast: 23500000, cpi: 1.10 },
        schedule: { plannedDuration: 15, actualDuration: 13, weeksLate: -2, spi: 1.13 },
        tasks: [
          { name: 'Architecture Design', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Infrastructure Setup', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Data Pipeline Development', status: 'complete', delayWeeks: -1, rootCause: 'Reusable components' },
          { name: 'Analytics Enablement', status: 'in_progress', delayWeeks: -2, rootCause: 'Strong execution' }
        ],
        triggeredRules: [],
        interventionTypes: [],
        governanceStatus: 'on_track'
      },
      {
        name: 'Card Processing Platform Migration',
        description: 'Migrate credit/debit card processing to new platform',
        healthStatus: 'risk',
        budget: { planned: 55000000, actual: 52500000, forecast: 58000000, cpi: 1.05 },
        schedule: { plannedDuration: 22, actualDuration: 20, weeksLate: -2, spi: 1.08 },
        tasks: [
          { name: 'Platform Selection', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Integration Development', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Testing & Certification', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'Production Cutover', status: 'pending', delayWeeks: 0, rootCause: 'Zero downtime requirement, millions of cards at risk' }
        ],
        triggeredRules: ['High Risk Cutover', 'Customer Impact Analysis Required'],
        interventionTypes: ['DeepRisk', 'DeepTMO'],
        governanceStatus: 'executive_approval_required'
      },
      {
        name: 'Open Banking API Platform',
        description: 'Launch API platform for third-party financial service integration',
        healthStatus: 'risk',
        budget: { planned: 18000000, actual: 17100000, forecast: 19200000, cpi: 1.05 },
        schedule: { plannedDuration: 12, actualDuration: 11, weeksLate: -1, spi: 1.08 },
        tasks: [
          { name: 'API Design', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Security Implementation', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Partner Onboarding', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'Regulatory Compliance', status: 'in_progress', delayWeeks: 0, rootCause: 'Complex data privacy requirements' }
        ],
        triggeredRules: ['Regulatory Approval Pending', 'Security Risk Monitoring'],
        interventionTypes: ['DeepRisk', 'DeepGovernance'],
        governanceStatus: 'regulatory_review'
      },
      {
        name: 'Branch Network Transformation',
        description: 'Redesign 300 branches with new digital-physical hybrid model',
        healthStatus: 'governance',
        budget: { planned: 95000000, actual: 92500000, forecast: 98000000, cpi: 1.03 },
        schedule: { plannedDuration: 24, actualDuration: 24, weeksLate: 0, spi: 1.00 },
        tasks: [
          { name: 'Pilot Branch Design', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Technology Deployment', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'Staff Retraining', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'Rollout Execution', status: 'in_progress', delayWeeks: 0, rootCause: 'None' }
        ],
        triggeredRules: ['Stage Gate Review Required', 'Change Adoption Monitoring'],
        interventionTypes: ['DeepGovernance', 'DeepOCM'],
        governanceStatus: 'gate_approval_overdue'
      },
      {
        name: 'ESG Reporting Platform',
        description: 'Implement environmental, social, governance reporting and analytics',
        healthStatus: 'governance',
        budget: { planned: 8500000, actual: 8200000, forecast: 8900000, cpi: 1.04 },
        schedule: { plannedDuration: 10, actualDuration: 10, weeksLate: 0, spi: 1.00 },
        tasks: [
          { name: 'Framework Selection', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Data Collection Design', status: 'complete', delayWeeks: 0, rootCause: 'None' },
          { name: 'Platform Development', status: 'in_progress', delayWeeks: 0, rootCause: 'None' },
          { name: 'Stakeholder Training', status: 'pending', delayWeeks: 0, rootCause: 'None' }
        ],
        triggeredRules: ['Compliance Framework Gap', 'Stakeholder Alignment Needed'],
        interventionTypes: ['DeepGovernance'],
        governanceStatus: 'approval_pending'
      }
    ]
  }
];

// Combine with existing industries
const allIndustries = [...existingIndustries, ...newIndustries];

// Write to file
fs.writeFileSync(
  './server/seed-data/acme-project-templates.json',
  JSON.stringify(allIndustries, null, 2)
);

console.log('Generated ACME project templates with', allIndustries.length, 'industries');
