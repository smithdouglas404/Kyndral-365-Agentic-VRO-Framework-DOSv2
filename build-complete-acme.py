#!/usr/bin/env python3
"""Generate complete ACME project templates for all 20 industries"""
import json

# Read existing file (has energy-utilities and technology)
with open('server/seed-data/acme-project-templates.json', 'r') as f:
    all_data = json.load(f)

# Define the 18 new industries with 10 projects each
# Each follows the health status distribution: 2 critical, 2 warning, 2 healthy, 2 risk, 2 governance

new_industries = []

# Helper function to create projects
def make_project(name, desc, health, budget_vals, schedule_vals, tasks, rules, interventions, gov_status):
    return {
        'name': name,
        'description': desc,
        'healthStatus': health,
        'budget': {
            'planned': budget_vals[0],
            'actual': budget_vals[1],
            'forecast': budget_vals[2],
            'cpi': budget_vals[3]
        },
        'schedule': {
            'plannedDuration': schedule_vals[0],
            'actualDuration': schedule_vals[1],
            'weeksLate': schedule_vals[2],
            'spi': schedule_vals[3]
        },
        'tasks': tasks,
        'triggeredRules': rules,
        'interventionTypes': interventions,
        'governanceStatus': gov_status
    }

# 1. HEALTHCARE
healthcare_projects = [
    make_project('Epic EMR System Upgrade', 'Upgrade Epic electronic medical records system to latest version across 12 hospitals', 'critical',
        [42000000, 54000000, 60000000, 0.78], [18, 24, 6, 0.75],
        [{'name': 'Data Migration Planning', 'status': 'complete', 'delayWeeks': 3, 'rootCause': 'Complex data mapping, vendor delays'},
         {'name': 'System Configuration', 'status': 'in_progress', 'delayWeeks': 5, 'rootCause': 'Customization requirements exceeded estimates'},
         {'name': 'Clinical Workflow Design', 'status': 'in_progress', 'delayWeeks': 4, 'rootCause': 'Physician stakeholder alignment challenges'},
         {'name': 'Go-Live Preparation', 'status': 'blocked', 'delayWeeks': 6, 'rootCause': 'Dependencies not complete, training delayed'}],
        ['Budget Overrun Critical', 'Schedule Delay High', 'Clinical Safety Risk'], ['DeepFinOps', 'DeepTMO', 'DeepRisk'], 'executive_escalation_required'),

    make_project('Hospital Expansion - Cardiology Wing', 'Construct new 80-bed cardiology wing with hybrid ORs and cath labs', 'critical',
        [125000000, 148000000, 160000000, 0.84], [30, 36, 6, 0.79],
        [{'name': 'Architectural Design', 'status': 'complete', 'delayWeeks': 4, 'rootCause': 'Code compliance issues, design revisions'},
         {'name': 'Foundation & Structure', 'status': 'complete', 'delayWeeks': 5, 'rootCause': 'Soil conditions, weather delays'},
         {'name': 'Medical Equipment Install', 'status': 'in_progress', 'delayWeeks': 6, 'rootCause': 'Supply chain delays, vendor coordination'},
         {'name': 'Systems Commissioning', 'status': 'pending', 'delayWeeks': 0, 'rootCause': 'Waiting on equipment installation'}],
        ['Budget Overrun Critical', 'Schedule Delay High', 'Regulatory Compliance Risk'], ['DeepFinOps', 'DeepTMO', 'DeepGovernance'], 'compliance_review_pending'),

    make_project('Telehealth Platform Expansion', 'Scale virtual care platform to support 50K daily appointments', 'warning',
        [15000000, 13800000, 16200000, 0.92], [12, 14, 2, 0.86],
        [{'name': 'Platform Selection', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Infrastructure Scaling', 'status': 'in_progress', 'delayWeeks': 2, 'rootCause': 'Performance tuning challenges'},
         {'name': 'Provider Training', 'status': 'in_progress', 'delayWeeks': 1, 'rootCause': 'Scheduling conflicts with clinical staff'},
         {'name': 'Patient Onboarding', 'status': 'pending', 'delayWeeks': 2, 'rootCause': 'Dependent on training completion'}],
        ['Schedule Delay Moderate', 'Integration Risk'], ['DeepTMO', 'DeepOCM'], 'on_track'),

    make_project('Medical Device IoT Integration', 'Connect 5000+ medical devices to central monitoring system', 'warning',
        [8500000, 7800000, 9200000, 0.92], [10, 11, 1, 0.88],
        [{'name': 'Device Inventory', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Integration Development', 'status': 'complete', 'delayWeeks': 1, 'rootCause': 'Legacy device compatibility issues'},
         {'name': 'Pilot Deployment', 'status': 'in_progress', 'delayWeeks': 1, 'rootCause': 'Network connectivity challenges'},
         {'name': 'Full Rollout', 'status': 'pending', 'delayWeeks': 0, 'rootCause': 'Waiting on pilot validation'}],
        ['Schedule Delay Moderate', 'Technical Integration Risk'], ['DeepTMO', 'DeepRisk'], 'on_track'),

    make_project('AI Diagnostic Assistant Implementation', 'Deploy AI-powered radiology image analysis across imaging centers', 'healthy',
        [12000000, 10500000, 11200000, 1.14], [14, 12, -2, 1.12],
        [{'name': 'Vendor Selection', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Model Validation', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Integration & Testing', 'status': 'complete', 'delayWeeks': -1, 'rootCause': 'Efficient execution'},
         {'name': 'Radiologist Training', 'status': 'in_progress', 'delayWeeks': -2, 'rootCause': 'Ahead of schedule'}],
        [], [], 'on_track'),

    make_project('Patient Portal Modernization', 'Launch new patient engagement platform with mobile app', 'healthy',
        [6500000, 5800000, 6200000, 1.12], [9, 8, -1, 1.11],
        [{'name': 'UX Research', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Development', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'HIPAA Security Review', 'status': 'complete', 'delayWeeks': -1, 'rootCause': 'Proactive security design'},
         {'name': 'Beta Launch', 'status': 'in_progress', 'delayWeeks': -1, 'rootCause': 'Early completion'}],
        [], [], 'on_track'),

    make_project('Clinical Trial Management System', 'Implement new CTMS for managing 200+ concurrent research studies', 'risk',
        [18000000, 17200000, 19500000, 1.05], [16, 15, -1, 1.06],
        [{'name': 'Requirements Analysis', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'System Configuration', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Data Migration', 'status': 'in_progress', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'FDA Validation', 'status': 'pending', 'delayWeeks': 0, 'rootCause': 'High risk - regulatory approval required'}],
        ['Regulatory Approval Pending', 'Compliance Validation Risk'], ['DeepRisk', 'DeepGovernance'], 'regulatory_review'),

    make_project('Pharmacy Automation Upgrade', 'Install robotic dispensing systems in 8 hospital pharmacies', 'risk',
        [22000000, 20800000, 23500000, 1.06], [14, 13, -1, 1.07],
        [{'name': 'Equipment Procurement', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Facility Modifications', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'System Installation', 'status': 'in_progress', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Validation & Go-Live', 'status': 'pending', 'delayWeeks': 0, 'rootCause': 'Complex validation protocols, patient safety critical'}],
        ['High Risk Implementation', 'Patient Safety Monitoring'], ['DeepRisk', 'DeepGovernance'], 'high_risk_monitoring'),

    make_project('Revenue Cycle Optimization', 'Implement AI-powered billing and coding optimization platform', 'governance',
        [9500000, 9200000, 10000000, 1.03], [11, 11, 0, 1.00],
        [{'name': 'Process Analysis', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Platform Implementation', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Staff Training', 'status': 'in_progress', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Performance Validation', 'status': 'pending', 'delayWeeks': 0, 'rootCause': 'None'}],
        ['Stage Gate Approval Pending', 'Change Adoption Monitoring'], ['DeepGovernance', 'DeepOCM'], 'approval_pending'),

    make_project('Nursing Workflow Optimization', 'Deploy mobile nursing stations and workflow automation tools', 'governance',
        [7500000, 7200000, 7900000, 1.04], [10, 10, 0, 1.00],
        [{'name': 'Workflow Assessment', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Technology Selection', 'status': 'complete', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Pilot Program', 'status': 'in_progress', 'delayWeeks': 0, 'rootCause': 'None'},
         {'name': 'Change Management', 'status': 'in_progress', 'delayWeeks': 0, 'rootCause': 'None'}],
        ['Change Adoption Below Target', 'Stakeholder Engagement Gap'], ['DeepOCM', 'DeepGovernance'], 'stakeholder_review_pending')
]

new_industries.append({'industryId': 'healthcare', 'companyId': 'acme-health', 'projects': healthcare_projects})

print(f"Generated {len(new_industries)} industries so far...")
print("This script will be extended with all remaining industries...")
