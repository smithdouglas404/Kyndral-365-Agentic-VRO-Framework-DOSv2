#!/usr/bin/env python3
"""
Complete ACME Project Templates Generator
Generates all 18 remaining industries with 10 projects each
"""
import json

# Read existing 2 industries
with open('server/seed-data/acme-project-templates.json', 'r') as f:
    existing_industries = json.load(f)

# Project template generator
def proj(name, desc, health, bp, ba, bf, cpi, pd, ad, wl, spi, tasks, rules, inter, gov):
    return {
        'name': name,
        'description': desc,
        'healthStatus': health,
        'budget': {'planned': bp, 'actual': ba, 'forecast': bf, 'cpi': cpi},
        'schedule': {'plannedDuration': pd, 'actualDuration': ad, 'weeksLate': wl, 'spi': spi},
        'tasks': tasks,
        'triggeredRules': rules,
        'interventionTypes': inter,
        'governanceStatus': gov
    }

def t(n, s, d, r):
    return {'name': n, 'status': s, 'delayWeeks': d, 'rootCause': r}

# All new industries
new_industries = []

# 1. HEALTHCARE
new_industries.append({
    'industryId': 'healthcare',
    'companyId': 'acme-health',
    'projects': [
        proj('Epic EMR System Upgrade', 'Upgrade Epic electronic medical records system across 12 hospitals', 'critical',
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
             t('Technology Selection', 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
             t('Pilot Program', 'in_progress', 0, 'None'),
             t('Change Management', 'in_progress', 0, 'None')],
            ['Change Adoption Below Target', 'Stakeholder Engagement Gap'],
            ['DeepOCM', 'DeepGovernance'], 'stakeholder_review_pending')
    ]
})

# 2. FINANCIAL SERVICES
new_industries.append({
    'industryId': 'financial-services',
    'companyId': 'acme-finserv',
    'projects': [
        proj('Core Banking System Modernization', 'Replace 30-year mainframe with modern platform', 'critical',
            120000000, 158000000, 175000000, 0.76, 36, 46, 10, 0.78,
            [t('Vendor Selection', 'complete', 4, 'Extended RFP, board delays'),
             t('Data Migration Design', 'in_progress', 8, 'Legacy data quality issues'),
             t('Parallel Run Testing', 'in_progress', 10, 'Reconciliation issues'),
             t('Cutover Planning', 'blocked', 10, 'Testing incomplete, high risk')],
            ['Budget Overrun Critical', 'Schedule Delay High', 'Regulatory Risk'],
            ['DeepFinOps', 'DeepTMO', 'DeepRisk', 'DeepGovernance'], 'executive_escalation_required'),

        proj('Digital Banking Platform Launch', 'New digital-only bank brand', 'critical',
            65000000, 78000000, 88000000, 0.83, 20, 26, 6, 0.77,
            [t('Platform Development', 'complete', 4, 'Feature creep, security expansion'),
             t('Regulatory Approval', 'in_progress', 5, 'Additional regulator documentation'),
             t('Marketing Campaign', 'in_progress', 6, 'Launch date changes'),
             t('Public Launch', 'at_risk', 6, 'Regulatory approval pending')],
            ['Budget Overrun Critical', 'Schedule Delay High', 'Market Window Risk'],
            ['DeepFinOps', 'DeepTMO', 'DeepGovernance'], 'regulatory_review'),

        proj('Real-Time Payments Implementation', 'RTP rails and instant payments', 'warning',
            28000000, 25800000, 30500000, 0.92, 14, 16, 2, 0.88,
            [t('Network Integration', 'complete', 1, 'Clearing house complexity'),
             t('Fraud Detection Setup', 'in_progress', 2, 'Real-time fraud rules complex'),
             t('Customer Systems Update', 'in_progress', 2, 'Legacy integration challenges'),
             t('Launch Preparation', 'pending', 0, 'Waiting on fraud detection')],
            ['Schedule Delay Moderate', 'Integration Risk'],
            ['DeepTMO', 'DeepRisk'], 'on_track'),

        proj('Anti-Money Laundering Upgrade', 'AI-powered AML monitoring', 'warning',
            35000000, 32200000, 38000000, 0.92, 16, 18, 2, 0.89,
            [t('Vendor Selection', 'complete', 0, 'None'),
             t('Rule Configuration', 'complete', 2, 'Complex regulatory requirements'),
             t('Historical Data Testing', 'in_progress', 2, 'False positive rate tuning'),
             t('Production Deployment', 'pending', 2, 'Regulatory validation required')],
            ['Schedule Delay Moderate', 'Regulatory Compliance Risk'],
            ['DeepTMO', 'DeepGovernance'], 'compliance_review_pending'),

        proj('Wealth Management Platform', 'Modernize advisor workstation and portal', 'healthy',
            42000000, 38500000, 40000000, 1.09, 18, 16, -2, 1.11,
            [t('Requirements Gathering', 'complete', 0, 'None'),
             t('Platform Development', 'complete', 0, 'None'),
             t('Data Migration', 'complete', -1, 'Good data quality'),
             t('Advisor Training', 'in_progress', -2, 'Ahead of schedule')],
            [], [], 'on_track'),

        proj('Cloud Data Lake Implementation', 'Enterprise analytics data lake', 'healthy',
            25000000, 22800000, 23500000, 1.10, 15, 13, -2, 1.13,
            [t('Architecture Design', 'complete', 0, 'None'),
             t('Infrastructure Setup', 'complete', 0, 'None'),
             t('Data Pipeline Development', 'complete', -1, 'Reusable components'),
             t('Analytics Enablement', 'in_progress', -2, 'Strong execution')],
            [], [], 'on_track'),

        proj('Card Processing Migration', 'Migrate card processing platform', 'risk',
            55000000, 52500000, 58000000, 1.05, 22, 20, -2, 1.08,
            [t('Platform Selection', 'complete', 0, 'None'),
             t('Integration Development', 'complete', 0, 'None'),
             t('Testing & Certification', 'in_progress', 0, 'None'),
             t('Production Cutover', 'pending', 0, 'Zero downtime, millions of cards at risk')],
            ['High Risk Cutover', 'Customer Impact Analysis Required'],
            ['DeepRisk', 'DeepTMO'], 'executive_approval_required'),

        proj('Open Banking API Platform', 'API platform for third-party integration', 'risk',
            18000000, 17100000, 19200000, 1.05, 12, 11, -1, 1.08,
            [t('API Design', 'complete', 0, 'None'),
             t('Security Implementation', 'complete', 0, 'None'),
             t('Partner Onboarding', 'in_progress', 0, 'None'),
             t('Regulatory Compliance', 'in_progress', 0, 'Complex data privacy requirements')],
            ['Regulatory Approval Pending', 'Security Risk Monitoring'],
            ['DeepRisk', 'DeepGovernance'], 'regulatory_review'),

        proj('Branch Network Transformation', 'Redesign 300 branches hybrid model', 'governance',
            95000000, 92500000, 98000000, 1.03, 24, 24, 0, 1.00,
            [t('Pilot Branch Design', 'complete', 0, 'None'),
             t('Technology Deployment', 'in_progress', 0, 'None'),
             t('Staff Retraining', 'in_progress', 0, 'None'),
             t('Rollout Execution', 'in_progress', 0, 'None')],
            ['Stage Gate Review Required', 'Change Adoption Monitoring'],
            ['DeepGovernance', 'DeepOCM'], 'gate_approval_overdue'),

        proj('ESG Reporting Platform', 'Environmental, social, governance reporting', 'governance',
            8500000, 8200000, 8900000, 1.04, 10, 10, 0, 1.00,
            [t('Framework Selection', 'complete', 0, 'None'),
             t('Data Collection Design', 'complete', 0, 'None'),
             t('Platform Development', 'in_progress', 0, 'None'),
             t('Stakeholder Training', 'pending', 0, 'None')],
            ['Compliance Framework Gap', 'Stakeholder Alignment Needed'],
            ['DeepGovernance'], 'approval_pending')
    ]
})

print(f"Generated {len(new_industries)} / 18 industries...")

# Write combined data
all_industries = existing_industries + new_industries
with open('server/seed-data/acme-project-templates.json', 'w') as f:
    json.dump(all_industries, f, indent=2)

print(f"Total industries: {len(all_industries)}")
