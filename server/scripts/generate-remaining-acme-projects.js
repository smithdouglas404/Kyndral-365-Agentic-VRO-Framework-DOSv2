#!/usr/bin/env node
/**
 * ACME Project Template Generator
 * Generates remaining 13 industries to complete 200-project dataset
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Industry project templates - concise definitions that generate full projects
const industryTemplates = {
  'telecommunications': {
    companyId: 'acme-telecom',
    projects: [
      { name: '5G Network Rollout - Phase 3', desc: 'Deploy 5G infrastructure in 25 major metro areas with mmWave and C-band spectrum', status: 'critical', budget: [850000000, 1100000000], cpi: 0.77, spi: 0.73, late: 10, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Network Performance Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'fcc_compliance_review' },
      { name: 'Fiber Backbone Expansion', desc: 'Extend fiber optic network 15,000 route miles for increased capacity and redundancy', status: 'critical', budget: [425000000, 520000000], cpi: 0.82, spi: 0.79, late: 6, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Right-of-Way Delays'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'permitting_delays' },
      { name: 'Customer Experience Platform', desc: 'Launch omnichannel customer service platform with AI chatbots and self-service', status: 'warning', budget: [65000000, 72000000], cpi: 0.90, spi: 0.87, late: 2, rules: ['Schedule Delay Moderate', 'Integration Risk'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Network Operations Center Modernization', desc: 'Upgrade NOC with AI-powered network monitoring and automated remediation', status: 'warning', budget: [48000000, 53000000], cpi: 0.91, spi: 0.85, late: 3, rules: ['Schedule Delay Moderate', 'System Integration'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Edge Computing Infrastructure', desc: 'Deploy edge compute nodes in 50 markets for low-latency IoT and gaming applications', status: 'healthy', budget: [185000000, 165000000], cpi: 1.12, spi: 1.15, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Billing System Modernization', desc: 'Replace legacy billing with cloud-native platform and real-time rating engine', status: 'healthy', budget: [95000000, 86000000], cpi: 1.10, spi: 1.08, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Network Slicing for Enterprise', desc: 'Deploy 5G network slicing capabilities for enterprise customers with SLA guarantees', status: 'risk', budget: [75000000, 72000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Technical Complexity High', 'Standards Evolution Risk'], agents: ['DeepRisk', 'DeepTMO'], gov: 'technical_validation' },
      { name: 'Satellite Backhaul - Rural Coverage', desc: 'Deploy satellite backhaul for rural cell site connectivity in underserved areas', status: 'risk', budget: [125000000, 120000000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Vendor Dependency', 'Weather Impact Risk'], agents: ['DeepRisk'], gov: 'vendor_dependency_monitoring' },
      { name: 'Cybersecurity Enhancement Program', desc: 'Implement zero-trust security architecture across network infrastructure', status: 'governance', budget: [55000000, 53500000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Stage Gate Approval Pending', 'Security Audit Required'], agents: ['DeepGovernance'], gov: 'security_audit_pending' },
      { name: 'Spectrum Refarming Project', desc: 'Migrate legacy 3G/4G spectrum to 5G use with customer migration program', status: 'governance', budget: [38000000, 37000000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Regulatory Approval Required', 'Customer Migration Risk'], agents: ['DeepGovernance', 'DeepOCM'], gov: 'fcc_approval_pending' }
    ]
  },
  'realestate-construction': {
    companyId: 'acme-realestate',
    projects: [
      { name: 'Mixed-Use Tower - Downtown Chicago', desc: 'Construct 2M sq ft mixed-use tower with residential, office, and retail components', status: 'critical', budget: [850000000, 1080000000], cpi: 0.79, spi: 0.76, late: 10, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Construction Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Multifamily Portfolio - Sunbelt Expansion', desc: 'Develop 12 multifamily properties (2,400 units) across Texas and Arizona markets', status: 'critical', budget: [425000000, 520000000], cpi: 0.82, spi: 0.78, late: 7, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Labor Shortage'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Office Campus Renovation', desc: 'Renovate 1.5M sq ft corporate campus with modern amenities and LEED certification', status: 'warning', budget: [185000000, 205000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Tenant Coordination'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Industrial Logistics Park', desc: 'Build 800K sq ft logistics park near major transportation hub with rail access', status: 'warning', budget: [145000000, 160000000], cpi: 0.91, spi: 0.88, late: 2, rules: ['Schedule Delay Moderate', 'Site Preparation Delays'], agents: ['DeepTMO'], gov: 'on_track' },
      { name: 'Affordable Housing Initiative', desc: 'Develop 450-unit affordable housing complex with tax credit financing', status: 'healthy', budget: [95000000, 84000000], cpi: 1.13, spi: 1.12, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Retail Center Redevelopment', desc: 'Transform aging mall into modern experiential retail and entertainment destination', status: 'healthy', budget: [125000000, 112000000], cpi: 1.12, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Historic Building Restoration', desc: 'Restore landmark historic building for boutique hotel and restaurant use', status: 'risk', budget: [75000000, 72000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Historic Preservation Risk', 'Structural Unknowns'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'historic_commission_review' },
      { name: 'Green Building Certification', desc: 'Achieve LEED Platinum certification for new office tower development', status: 'risk', budget: [15000000, 14500000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Certification Risk', 'Material Sourcing'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'leed_certification_pending' },
      { name: 'Community Benefits Agreement', desc: 'Negotiate and implement community benefits for major urban development project', status: 'governance', budget: [25000000, 24300000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Community Approval Required', 'Stakeholder Negotiations'], agents: ['DeepGovernance', 'DeepOCM'], gov: 'community_negotiations' },
      { name: 'Brownfield Site Remediation', desc: 'Remediate contaminated brownfield site for future mixed-use development', status: 'governance', budget: [45000000, 43800000], cpi: 1.03, spi: 1.00, late: 0, rules: ['EPA Approval Required', 'Phase II Assessment Pending'], agents: ['DeepGovernance'], gov: 'epa_review_pending' }
    ]
  },
  'pharma-biotech': {
    companyId: 'acme-pharma',
    projects: [
      { name: 'Oncology Drug Pipeline - Phase 3 Trials', desc: 'Complete Phase 3 clinical trials for lead oncology drug candidate across 300 sites', status: 'critical', budget: [450000000, 575000000], cpi: 0.78, spi: 0.74, late: 8, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'FDA Submission Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk', 'DeepGovernance'], gov: 'fda_submission_at_risk' },
      { name: 'Manufacturing Facility Expansion', desc: 'Build new biologics manufacturing facility with single-use bioreactors', status: 'critical', budget: [850000000, 1035000000], cpi: 0.82, spi: 0.80, late: 6, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'GMP Compliance'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'fda_inspection_pending' },
      { name: 'Gene Therapy Platform Development', desc: 'Develop next-generation gene therapy manufacturing platform and capabilities', status: 'warning', budget: [275000000, 305000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Technical Complexity'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Clinical Trial Management System', desc: 'Implement enterprise CTMS for trial operations and regulatory compliance', status: 'warning', budget: [55000000, 61000000], cpi: 0.90, spi: 0.87, late: 2, rules: ['Schedule Delay Moderate', 'Data Migration Risk'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Quality Management System Upgrade', desc: 'Upgrade enterprise QMS with automated deviation management and CAPA', status: 'healthy', budget: [42000000, 37500000], cpi: 1.12, spi: 1.14, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Supply Chain Digitalization', desc: 'Implement end-to-end supply chain visibility from API to patient', status: 'healthy', budget: [38000000, 34200000], cpi: 1.11, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Rare Disease Drug Development', desc: 'Advance rare disease therapy through orphan drug designation and trials', status: 'risk', budget: [185000000, 178000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Patient Recruitment Risk', 'Orphan Drug Pathway'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'fda_orphan_designation' },
      { name: 'AI Drug Discovery Platform', desc: 'Deploy AI-powered drug discovery platform for target identification', status: 'risk', budget: [125000000, 120500000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Technology Validation Risk', 'IP Protection'], agents: ['DeepRisk'], gov: 'validation_monitoring' },
      { name: 'Pharmacovigilance System Enhancement', desc: 'Upgrade global pharmacovigilance system for adverse event reporting', status: 'governance', budget: [65000000, 63200000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Regulatory Compliance Required', 'Global Reporting'], agents: ['DeepGovernance'], gov: 'regulatory_audit_pending' },
      { name: 'Product Serialization - Global Rollout', desc: 'Implement serialization and track-and-trace across global supply chain', status: 'governance', budget: [95000000, 92400000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Multi-Country Compliance', 'Deadline Approaching'], agents: ['DeepGovernance'], gov: 'compliance_deadline_tracking' }
    ]
  },
  'consumer-products': {
    companyId: 'acme-consumer',
    projects: [
      { name: 'Product Line Reformulation - Natural Ingredients', desc: 'Reformulate 50+ products with natural ingredients and remove controversial chemicals', status: 'critical', budget: [125000000, 160000000], cpi: 0.78, spi: 0.75, late: 7, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Market Launch Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Smart Factory Implementation', desc: 'Deploy Industry 4.0 automation and predictive maintenance across 8 plants', status: 'critical', budget: [185000000, 225000000], cpi: 0.82, spi: 0.78, late: 6, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Production Impact'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'E-commerce Platform Launch', desc: 'Launch direct-to-consumer e-commerce platform for core brands', status: 'warning', budget: [75000000, 83000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Channel Conflict Risk'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Sustainable Packaging Initiative', desc: 'Transition to 100% recyclable packaging across all product lines', status: 'warning', budget: [95000000, 105000000], cpi: 0.90, spi: 0.88, late: 2, rules: ['Schedule Delay Moderate', 'Supplier Readiness'], agents: ['DeepTMO'], gov: 'on_track' },
      { name: 'Brand Refresh - Flagship Line', desc: 'Complete brand refresh with new packaging, formulations, and marketing', status: 'healthy', budget: [55000000, 49000000], cpi: 1.12, spi: 1.16, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Innovation Lab - Clean Beauty', desc: 'Establish innovation lab focused on clean beauty and personalization', status: 'healthy', budget: [42000000, 38000000], cpi: 1.11, spi: 1.08, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Supply Chain Resilience Program', desc: 'Diversify supplier base and build inventory buffers for critical materials', status: 'risk', budget: [125000000, 120000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Supplier Qualification Risk', 'Cost Impact'], agents: ['DeepRisk', 'DeepFinOps'], gov: 'supplier_audit_required' },
      { name: 'Product Safety Enhancement', desc: 'Enhance product safety testing and toxicology assessment capabilities', status: 'risk', budget: [45000000, 43500000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Regulatory Expectations Evolving', 'Testing Capacity'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'regulatory_monitoring' },
      { name: 'Allergen-Free Product Line', desc: 'Develop and launch allergen-free product line with dedicated manufacturing', status: 'governance', budget: [85000000, 82600000], cpi: 1.03, spi: 1.00, late: 0, rules: ['FDA Review Required', 'Facility Certification'], agents: ['DeepGovernance'], gov: 'fda_review_pending' },
      { name: 'Animal Testing Elimination', desc: 'Transition to alternative testing methods and eliminate animal testing', status: 'governance', budget: [65000000, 63200000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Regulatory Acceptance Required', 'Validation Studies'], agents: ['DeepGovernance'], gov: 'regulatory_validation' }
    ]
  },
  'media-entertainment': {
    companyId: 'acme-media',
    projects: [
      { name: 'Streaming Platform Relaunch', desc: 'Rebuild streaming platform with improved recommendation engine and UX', status: 'critical', budget: [250000000, 320000000], cpi: 0.78, spi: 0.74, late: 8, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Subscriber Churn Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Content Production - Tentpole Franchise', desc: 'Produce next installment of major franchise with global theatrical release', status: 'critical', budget: [285000000, 350000000], cpi: 0.81, spi: 0.77, late: 7, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Release Date Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Live Sports Rights Integration', desc: 'Integrate live sports streaming rights into platform with low-latency delivery', status: 'warning', budget: [185000000, 205000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Technical Complexity'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Theme Park Expansion - New Land', desc: 'Build new themed land at flagship theme park with 5 attractions', status: 'warning', budget: [750000000, 830000000], cpi: 0.90, spi: 0.88, late: 2, rules: ['Schedule Delay Moderate', 'Construction Complexity'], agents: ['DeepTMO', 'DeepFinOps'], gov: 'on_track' },
      { name: 'Content Localization Platform', desc: 'Deploy AI-powered localization platform for 40+ languages', status: 'healthy', budget: [45000000, 39500000], cpi: 1.14, spi: 1.18, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Creator Tools & Monetization', desc: 'Launch creator platform with tools for independent content creators', status: 'healthy', budget: [65000000, 58500000], cpi: 1.11, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Virtual Production Studio', desc: 'Build state-of-the-art virtual production facility with LED volumes', status: 'risk', budget: [125000000, 120000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Technology Risk', 'Talent Availability'], agents: ['DeepRisk'], gov: 'technical_validation' },
      { name: 'Gaming Studio Acquisition Integration', desc: 'Integrate recently acquired gaming studio into content ecosystem', status: 'risk', budget: [95000000, 91500000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Integration Risk', 'Talent Retention'], agents: ['DeepRisk', 'DeepOCM'], gov: 'integration_monitoring' },
      { name: 'Content Moderation Enhancement', desc: 'Implement AI-powered content moderation with human review workflow', status: 'governance', budget: [55000000, 53500000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Regulatory Compliance', 'Platform Safety'], agents: ['DeepGovernance'], gov: 'policy_review_pending' },
      { name: 'IP Rights Management System', desc: 'Deploy enterprise rights management system for global content licensing', status: 'governance', budget: [42000000, 40800000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Contract Compliance', 'Revenue Recognition'], agents: ['DeepGovernance'], gov: 'legal_review_pending' }
    ]
  },
  'hospitality-tourism': {
    companyId: 'acme-hospitality',
    projects: [
      { name: 'Property Management System Replacement', desc: 'Replace legacy PMS with cloud-based platform across 800 properties', status: 'critical', budget: [125000000, 160000000], cpi: 0.78, spi: 0.75, late: 8, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Guest Experience Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Luxury Resort Development - Maldives', desc: 'Develop 150-villa luxury resort in Maldives with overwater bungalows', status: 'critical', budget: [450000000, 550000000], cpi: 0.82, spi: 0.78, late: 7, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Environmental Permits'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'environmental_review' },
      { name: 'Guest Experience Platform', desc: 'Launch mobile-first guest experience platform with contactless services', status: 'warning', budget: [45000000, 50000000], cpi: 0.90, spi: 0.86, late: 2, rules: ['Schedule Delay Moderate', 'Integration Complexity'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Hotel Renovation Program - 200 Properties', desc: 'Renovate 200 hotels with modern design and technology upgrades', status: 'warning', budget: [650000000, 720000000], cpi: 0.90, spi: 0.88, late: 3, rules: ['Schedule Delay Moderate', 'Operational Impact'], agents: ['DeepTMO', 'DeepFinOps'], gov: 'on_track' },
      { name: 'Revenue Management System', desc: 'Implement AI-powered dynamic pricing and revenue optimization', status: 'healthy', budget: [35000000, 30800000], cpi: 1.14, spi: 1.16, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Loyalty Program Relaunch', desc: 'Relaunch loyalty program with enhanced benefits and partnerships', status: 'healthy', budget: [55000000, 49500000], cpi: 1.11, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Sustainable Operations Initiative', desc: 'Achieve carbon neutrality across all properties through energy efficiency', status: 'risk', budget: [185000000, 178000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Carbon Credit Availability', 'Technology Readiness'], agents: ['DeepRisk'], gov: 'sustainability_audit' },
      { name: 'Food & Beverage Concept Rollout', desc: 'Launch new restaurant concept across 150 properties', status: 'risk', budget: [95000000, 91500000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Brand Standards Risk', 'Culinary Talent'], agents: ['DeepRisk', 'DeepOCM'], gov: 'quality_assurance' },
      { name: 'Health & Safety Certification', desc: 'Achieve enhanced health and safety certifications across all properties', status: 'governance', budget: [42000000, 40800000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Multi-Jurisdiction Compliance', 'Audit Requirements'], agents: ['DeepGovernance'], gov: 'certification_audit' },
      { name: 'Franchise Agreement Updates', desc: 'Renegotiate and update franchise agreements with 300+ franchisees', status: 'governance', budget: [25000000, 24300000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Contract Negotiations', 'Legal Review'], agents: ['DeepGovernance'], gov: 'legal_negotiations' }
    ]
  },
  'agriculture-food': {
    companyId: 'acme-agriculture',
    projects: [
      { name: 'Precision Agriculture Platform', desc: 'Deploy IoT sensors and AI analytics across 2M acres for precision farming', status: 'critical', budget: [185000000, 235000000], cpi: 0.79, spi: 0.76, late: 8, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Technology Adoption'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Processing Plant Modernization', desc: 'Modernize 15 food processing plants with automation and food safety systems', status: 'critical', budget: [325000000, 395000000], cpi: 0.82, spi: 0.79, late: 6, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Production Impact'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Sustainable Farming Initiative', desc: 'Transition 500K acres to regenerative agriculture practices', status: 'warning', budget: [125000000, 139000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Farmer Adoption'], agents: ['DeepTMO', 'DeepOCM'], gov: 'on_track' },
      { name: 'Cold Chain Infrastructure Upgrade', desc: 'Upgrade cold storage and transportation with IoT monitoring', status: 'warning', budget: [95000000, 105000000], cpi: 0.90, spi: 0.88, late: 2, rules: ['Schedule Delay Moderate', 'Equipment Availability'], agents: ['DeepTMO'], gov: 'on_track' },
      { name: 'Direct-to-Consumer Platform', desc: 'Launch online platform for direct farm-to-consumer sales', status: 'healthy', budget: [45000000, 39500000], cpi: 1.14, spi: 1.17, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Water Management System', desc: 'Implement smart irrigation and water conservation across operations', status: 'healthy', budget: [65000000, 58000000], cpi: 1.12, spi: 1.10, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Organic Certification Expansion', desc: 'Achieve organic certification for 300K additional acres', status: 'risk', budget: [85000000, 82000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['USDA Organic Standards', 'Transition Period'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'usda_certification' },
      { name: 'Carbon Credit Program', desc: 'Establish carbon sequestration program to generate carbon credits', status: 'risk', budget: [55000000, 53000000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Verification Standards', 'Market Volatility'], agents: ['DeepRisk'], gov: 'verification_pending' },
      { name: 'Food Safety Compliance', desc: 'Achieve FSMA compliance across all processing facilities', status: 'governance', budget: [75000000, 72900000], cpi: 1.03, spi: 1.00, late: 0, rules: ['FDA FSMA Requirements', 'Inspection Readiness'], agents: ['DeepGovernance'], gov: 'fda_inspection_pending' },
      { name: 'Traceability System Implementation', desc: 'Implement farm-to-fork traceability system for food safety and transparency', status: 'governance', budget: [95000000, 92400000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Regulatory Requirements', 'Supply Chain Integration'], agents: ['DeepGovernance'], gov: 'compliance_validation' }
    ]
  },
  'education': {
    companyId: 'acme-education',
    projects: [
      { name: 'Learning Management System Replacement', desc: 'Replace legacy LMS with modern cloud platform serving 250K students', status: 'critical', budget: [85000000, 110000000], cpi: 0.77, spi: 0.74, late: 8, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Academic Calendar Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Campus Infrastructure Modernization', desc: 'Modernize technology infrastructure across 25 campuses with Wi-Fi 6 and AV', status: 'critical', budget: [125000000, 152000000], cpi: 0.82, spi: 0.79, late: 6, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Academic Impact'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Online Program Expansion', desc: 'Launch 50 new online degree and certificate programs', status: 'warning', budget: [65000000, 72000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Accreditation Requirements'], agents: ['DeepTMO', 'DeepGovernance'], gov: 'on_track' },
      { name: 'Student Success Platform', desc: 'Implement AI-powered student success platform with early alert system', status: 'warning', budget: [42000000, 46500000], cpi: 0.90, spi: 0.87, late: 2, rules: ['Schedule Delay Moderate', 'Faculty Adoption'], agents: ['DeepTMO', 'DeepOCM'], gov: 'on_track' },
      { name: 'Research Computing Cluster', desc: 'Deploy high-performance computing cluster for research faculty', status: 'healthy', budget: [35000000, 30800000], cpi: 1.14, spi: 1.16, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Library Digital Transformation', desc: 'Digitize library collections and implement modern discovery platform', status: 'healthy', budget: [28000000, 25200000], cpi: 1.11, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Competency-Based Education Program', desc: 'Launch competency-based degree programs with prior learning assessment', status: 'risk', budget: [55000000, 53000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Accreditation Risk', 'New Model Validation'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'accreditation_review' },
      { name: 'International Campus Expansion', desc: 'Establish branch campus in Southeast Asia with local partnerships', status: 'risk', budget: [185000000, 178000000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Regulatory Approval', 'Partnership Risk'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'ministry_approval_pending' },
      { name: 'Title IV Compliance Enhancement', desc: 'Enhance financial aid systems for improved Title IV compliance', status: 'governance', budget: [42000000, 40800000], cpi: 1.03, spi: 1.00, late: 0, rules: ['ED Audit Requirements', 'Compliance Gap'], agents: ['DeepGovernance'], gov: 'ed_audit_preparation' },
      { name: 'Data Privacy - Student Records', desc: 'Implement comprehensive data privacy controls for student information', status: 'governance', budget: [32000000, 31100000], cpi: 1.03, spi: 1.00, late: 0, rules: ['FERPA Compliance', 'State Privacy Laws'], agents: ['DeepGovernance'], gov: 'privacy_review_pending' }
    ]
  },
  'professional-services': {
    companyId: 'acme-professional',
    projects: [
      { name: 'Global Delivery Network Expansion', desc: 'Expand global delivery centers in India, Poland, and Mexico (5,000 consultants)', status: 'critical', budget: [285000000, 365000000], cpi: 0.78, spi: 0.75, late: 8, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Talent Acquisition Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Knowledge Management Platform', desc: 'Deploy AI-powered knowledge management with expertise location and search', status: 'critical', budget: [95000000, 116000000], cpi: 0.82, spi: 0.78, late: 6, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'User Adoption'], agents: ['DeepFinOps', 'DeepTMO', 'DeepOCM'], gov: 'on_track' },
      { name: 'Industry Cloud Solutions Practice', desc: 'Build industry-specific cloud transformation practice with certified experts', status: 'warning', budget: [125000000, 139000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Talent Development'], agents: ['DeepTMO', 'DeepOCM'], gov: 'on_track' },
      { name: 'Project Management Suite Upgrade', desc: 'Upgrade enterprise project and resource management platform', status: 'warning', budget: [55000000, 61000000], cpi: 0.90, spi: 0.87, late: 2, rules: ['Schedule Delay Moderate', 'Integration Complexity'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Digital Consulting Accelerators', desc: 'Develop 20+ pre-built solution accelerators for digital transformation', status: 'healthy', budget: [65000000, 57000000], cpi: 1.14, spi: 1.18, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Consultant Experience Platform', desc: 'Launch modern consultant experience platform for learning and collaboration', status: 'healthy', budget: [42000000, 37800000], cpi: 1.11, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Strategic Acquisition Integration', desc: 'Integrate boutique consulting firm specializing in sustainability', status: 'risk', budget: [185000000, 178000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Cultural Integration Risk', 'Client Retention'], agents: ['DeepRisk', 'DeepOCM'], gov: 'integration_monitoring' },
      { name: 'Cybersecurity Practice Build', desc: 'Build cybersecurity consulting practice with offensive and defensive capabilities', status: 'risk', budget: [125000000, 120000000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Talent Competition', 'Certification Requirements'], agents: ['DeepRisk'], gov: 'talent_acquisition_monitoring' },
      { name: 'Quality & Ethics Compliance', desc: 'Enhance quality management and ethics compliance across all engagements', status: 'governance', budget: [45000000, 43700000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Professional Standards', 'Regulatory Requirements'], agents: ['DeepGovernance'], gov: 'professional_standards_review' },
      { name: 'Data Protection - Client Information', desc: 'Implement comprehensive data protection for client confidential information', status: 'governance', budget: [55000000, 53500000], cpi: 1.03, spi: 1.00, late: 0, rules: ['GDPR/CCPA Compliance', 'Client Contracts'], agents: ['DeepGovernance'], gov: 'privacy_audit_pending' }
    ]
  },
  'insurance': {
    companyId: 'acme-insurance',
    projects: [
      { name: 'Core Policy Administration Replacement', desc: 'Replace legacy policy admin systems with modern cloud platform', status: 'critical', budget: [425000000, 545000000], cpi: 0.78, spi: 0.74, late: 9, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Migration Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'AI-Powered Underwriting Platform', desc: 'Deploy AI underwriting for personal and commercial lines with real-time decisioning', status: 'critical', budget: [185000000, 226000000], cpi: 0.82, spi: 0.79, late: 6, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Model Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk', 'DeepGovernance'], gov: 'model_validation_required' },
      { name: 'Claims Automation Platform', desc: 'Implement end-to-end claims automation with AI fraud detection', status: 'warning', budget: [125000000, 139000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Integration Complexity'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Digital Customer Portal', desc: 'Launch modern customer portal with self-service policy management', status: 'warning', budget: [75000000, 83000000], cpi: 0.90, spi: 0.87, late: 2, rules: ['Schedule Delay Moderate', 'User Experience'], agents: ['DeepTMO'], gov: 'on_track' },
      { name: 'Telematics Program - Auto Insurance', desc: 'Launch usage-based auto insurance with mobile app and telematics', status: 'healthy', budget: [55000000, 48000000], cpi: 1.15, spi: 1.18, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Catastrophe Modeling Enhancement', desc: 'Upgrade catastrophe modeling with climate risk integration', status: 'healthy', budget: [42000000, 37800000], cpi: 1.11, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Cyber Insurance Product Launch', desc: 'Develop and launch cyber insurance product for SMB market', status: 'risk', budget: [95000000, 91500000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Product Risk', 'Regulatory Approval'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'state_filing_pending' },
      { name: 'Reinsurance Platform Modernization', desc: 'Modernize reinsurance placement and accounting platform', status: 'risk', budget: [85000000, 82000000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Technical Complexity', 'Reinsurer Integration'], agents: ['DeepRisk'], gov: 'technical_validation' },
      { name: 'State Regulatory Compliance', desc: 'Achieve compliance with new state insurance regulations across 50 states', status: 'governance', budget: [65000000, 63200000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Multi-State Compliance', 'Rate Filing Requirements'], agents: ['DeepGovernance'], gov: 'state_approval_tracking' },
      { name: 'Solvency II Implementation', desc: 'Implement Solvency II framework for European operations', status: 'governance', budget: [125000000, 121500000], cpi: 1.03, spi: 1.00, late: 0, rules: ['EU Regulatory Requirements', 'Capital Modeling'], agents: ['DeepGovernance'], gov: 'regulatory_validation' }
    ]
  },
  'automotive': {
    companyId: 'acme-automotive',
    projects: [
      { name: 'Electric Vehicle Platform Development', desc: 'Develop dedicated EV platform for next-generation electric vehicles', status: 'critical', budget: [2500000000, 3200000000], cpi: 0.78, spi: 0.75, late: 9, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Launch Date Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Battery Gigafactory Construction', desc: 'Build battery manufacturing gigafactory with 50 GWh annual capacity', status: 'critical', budget: [3500000000, 4270000000], cpi: 0.82, spi: 0.78, late: 8, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Supply Chain Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Autonomous Driving Software Stack', desc: 'Develop Level 3 autonomous driving capabilities with OTA updates', status: 'warning', budget: [850000000, 945000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Safety Validation'], agents: ['DeepTMO', 'DeepRisk', 'DeepGovernance'], gov: 'on_track' },
      { name: 'Connected Vehicle Platform', desc: 'Launch connected vehicle platform with over-the-air updates and services', status: 'warning', budget: [425000000, 472000000], cpi: 0.90, spi: 0.87, late: 2, rules: ['Schedule Delay Moderate', 'Cybersecurity Risk'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Manufacturing Efficiency Program', desc: 'Deploy Industry 4.0 technologies across 15 assembly plants', status: 'healthy', budget: [650000000, 572000000], cpi: 1.14, spi: 1.16, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Supplier Quality Enhancement', desc: 'Implement zero-defect supplier quality program with real-time monitoring', status: 'healthy', budget: [125000000, 112500000], cpi: 1.11, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Hydrogen Fuel Cell Development', desc: 'Develop hydrogen fuel cell technology for commercial vehicle applications', status: 'risk', budget: [750000000, 720000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Technology Risk', 'Infrastructure Dependency'], agents: ['DeepRisk'], gov: 'technology_validation' },
      { name: 'China JV Production Expansion', desc: 'Expand joint venture production capacity in China market', status: 'risk', budget: [1250000000, 1200000000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Regulatory Risk', 'Partner Relations'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'regulatory_approval_pending' },
      { name: 'Emissions Compliance - Global', desc: 'Achieve global emissions compliance across all vehicle platforms', status: 'governance', budget: [425000000, 412800000], cpi: 1.03, spi: 1.00, late: 0, rules: ['EPA/CARB/EU Standards', 'Testing Requirements'], agents: ['DeepGovernance'], gov: 'regulatory_testing' },
      { name: 'Safety Recall Management System', desc: 'Implement advanced safety recall detection and management system', status: 'governance', budget: [185000000, 179800000], cpi: 1.03, spi: 1.00, late: 0, rules: ['NHTSA Requirements', 'Global Coordination'], agents: ['DeepGovernance'], gov: 'regulatory_compliance' }
    ]
  },
  'aerospace-defense': {
    companyId: 'acme-aerospace',
    projects: [
      { name: 'Next-Gen Fighter Aircraft Development', desc: 'Develop next-generation fighter aircraft for US Air Force contract', status: 'critical', budget: [8500000000, 10900000000], cpi: 0.78, spi: 0.74, late: 12, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Contract Penalties'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk', 'DeepGovernance'], gov: 'dod_program_review' },
      { name: 'Commercial Aircraft Production Ramp', desc: 'Ramp production of new commercial aircraft from 3 to 10 per month', status: 'critical', budget: [2500000000, 3050000000], cpi: 0.82, spi: 0.78, late: 8, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Supply Chain Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Satellite Constellation Deployment', desc: 'Deploy 500-satellite constellation for global communications', status: 'warning', budget: [1850000000, 2057000000], cpi: 0.90, spi: 0.86, late: 4, rules: ['Schedule Delay Moderate', 'Launch Vehicle Dependency'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Hypersonic Weapons System', desc: 'Develop hypersonic weapons system for Department of Defense', status: 'warning', budget: [3250000000, 3611000000], cpi: 0.90, spi: 0.87, late: 3, rules: ['Schedule Delay Moderate', 'Technology Maturation'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Avionics Suite Upgrade', desc: 'Upgrade avionics suite for legacy military aircraft fleet', status: 'healthy', budget: [850000000, 748000000], cpi: 1.14, spi: 1.17, late: -3, rules: [], agents: [], gov: 'on_track' },
      { name: 'Composite Manufacturing Facility', desc: 'Build advanced composites manufacturing facility for airframe production', status: 'healthy', budget: [625000000, 562500000], cpi: 1.11, spi: 1.09, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Lunar Lander Development', desc: 'Develop commercial lunar lander for NASA Artemis program', status: 'risk', budget: [1250000000, 1200000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Technical Complexity', 'NASA Milestone Reviews'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'nasa_milestone_review' },
      { name: 'Urban Air Mobility Platform', desc: 'Develop electric vertical takeoff and landing (eVTOL) aircraft', status: 'risk', budget: [950000000, 912000000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Certification Risk', 'Market Uncertainty'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'faa_certification_path' },
      { name: 'Export Control Compliance', desc: 'Enhance export control compliance for ITAR/EAR regulated products', status: 'governance', budget: [125000000, 121500000], cpi: 1.03, spi: 1.00, late: 0, rules: ['ITAR/EAR Requirements', 'DDTC Oversight'], agents: ['DeepGovernance'], gov: 'ddtc_audit_pending' },
      { name: 'Cybersecurity - Critical Systems', desc: 'Implement cybersecurity enhancements for mission-critical systems', status: 'governance', budget: [285000000, 277000000], cpi: 1.03, spi: 1.00, late: 0, rules: ['CMMC Compliance', 'NIST 800-171'], agents: ['DeepGovernance'], gov: 'cmmc_certification' }
    ]
  },
  'mining-materials': {
    companyId: 'acme-mining',
    projects: [
      { name: 'Copper Mine Expansion - Chile', desc: 'Expand copper mine capacity from 300K to 500K tons per year', status: 'critical', budget: [1250000000, 1603000000], cpi: 0.78, spi: 0.75, late: 10, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Environmental Permits'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk', 'DeepGovernance'], gov: 'environmental_review' },
      { name: 'Lithium Brine Processing Plant', desc: 'Build lithium processing facility for EV battery supply chain', status: 'critical', budget: [850000000, 1037000000], cpi: 0.82, spi: 0.78, late: 7, rules: ['Budget Overrun Critical', 'Schedule Delay High', 'Technology Risk'], agents: ['DeepFinOps', 'DeepTMO', 'DeepRisk'], gov: 'executive_escalation_required' },
      { name: 'Autonomous Haul Truck Fleet', desc: 'Deploy 100 autonomous haul trucks across 5 mining operations', status: 'warning', budget: [425000000, 472000000], cpi: 0.90, spi: 0.86, late: 3, rules: ['Schedule Delay Moderate', 'Technology Integration'], agents: ['DeepTMO', 'DeepRisk'], gov: 'on_track' },
      { name: 'Water Management System', desc: 'Implement closed-loop water management and recycling system', status: 'warning', budget: [185000000, 205000000], cpi: 0.90, spi: 0.87, late: 2, rules: ['Schedule Delay Moderate', 'Environmental Standards'], agents: ['DeepTMO', 'DeepGovernance'], gov: 'on_track' },
      { name: 'Processing Plant Optimization', desc: 'Optimize ore processing with AI-powered grade control and recovery', status: 'healthy', budget: [125000000, 109400000], cpi: 1.14, spi: 1.18, late: -2, rules: [], agents: [], gov: 'on_track' },
      { name: 'Renewable Energy - Mine Power', desc: 'Install solar and wind power generation at remote mining operations', status: 'healthy', budget: [285000000, 256500000], cpi: 1.11, spi: 1.09, late: -1, rules: [], agents: [], gov: 'on_track' },
      { name: 'Rare Earth Metals Exploration', desc: 'Explore and develop rare earth metals deposit for technology supply chain', status: 'risk', budget: [425000000, 408000000], cpi: 1.04, spi: 1.05, late: 0, rules: ['Geological Risk', 'Metallurgy Complexity'], agents: ['DeepRisk'], gov: 'feasibility_study' },
      { name: 'Tailings Dam Upgrade', desc: 'Upgrade tailings storage facility to meet enhanced safety standards', status: 'risk', budget: [325000000, 312000000], cpi: 1.04, spi: 1.06, late: -1, rules: ['Safety Standards', 'Community Concerns'], agents: ['DeepRisk', 'DeepGovernance'], gov: 'safety_review' },
      { name: 'Mine Closure & Reclamation', desc: 'Execute closure and reclamation plan for depleted gold mine', status: 'governance', budget: [185000000, 179800000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Environmental Compliance', 'Bond Release'], agents: ['DeepGovernance'], gov: 'regulatory_approval' },
      { name: 'Indigenous Community Agreement', desc: 'Negotiate impact and benefit agreement with indigenous communities', status: 'governance', budget: [45000000, 43700000], cpi: 1.03, spi: 1.00, late: 0, rules: ['Community Consent', 'Benefit Sharing'], agents: ['DeepGovernance', 'DeepOCM'], gov: 'community_negotiations' }
    ]
  }
};

function generateTasks(status, weeksLate) {
  const taskSets = {
    critical: [
      {name: 'Planning & Requirements', status: 'complete', delayWeeks: 2, rootCause: 'Scope changes, stakeholder alignment delays'},
      {name: 'Procurement & Setup', status: 'complete', delayWeeks: 3, rootCause: 'Supply chain disruptions, vendor delays'},
      {name: 'Implementation', status: 'in_progress', delayWeeks: weeksLate, rootCause: 'Resource constraints, technical complexity, integration issues'},
      {name: 'Testing & Deployment', status: 'blocked', delayWeeks: weeksLate, rootCause: 'Dependency on implementation completion'}
    ],
    warning: [
      {name: 'Initiation', status: 'complete', delayWeeks: 0, rootCause: 'None'},
      {name: 'Execution Phase 1', status: 'complete', delayWeeks: 1, rootCause: 'Minor coordination delays'},
      {name: 'Execution Phase 2', status: 'in_progress', delayWeeks: weeksLate, rootCause: 'Resource availability, integration challenges'},
      {name: 'Completion & Rollout', status: 'pending', delayWeeks: 0, rootCause: 'Waiting on current phase completion'}
    ],
    healthy: [
      {name: 'Planning', status: 'complete', delayWeeks: 0, rootCause: 'None'},
      {name: 'Execution', status: 'complete', delayWeeks: Math.abs(weeksLate), rootCause: 'Efficient execution, strong team performance'},
      {name: 'Validation', status: 'complete', delayWeeks: 0, rootCause: 'None'},
      {name: 'Deployment', status: 'in_progress', delayWeeks: Math.abs(weeksLate), rootCause: 'Ahead of schedule, early delivery'}
    ],
    risk: [
      {name: 'Analysis & Design', status: 'complete', delayWeeks: 0, rootCause: 'None'},
      {name: 'Development', status: 'complete', delayWeeks: 0, rootCause: 'None'},
      {name: 'Implementation', status: 'in_progress', delayWeeks: 0, rootCause: 'None'},
      {name: 'Risk Mitigation', status: 'pending', delayWeeks: 0, rootCause: 'High risk factors require careful management and validation'}
    ],
    governance: [
      {name: 'Project Setup', status: 'complete', delayWeeks: 0, rootCause: 'None'},
      {name: 'Execution', status: 'complete', delayWeeks: 0, rootCause: 'None'},
      {name: 'Review Preparation', status: 'in_progress', delayWeeks: 0, rootCause: 'None'},
      {name: 'Approval Process', status: 'pending', delayWeeks: 0, rootCause: 'Awaiting governance committee or regulatory approval'}
    ]
  };
  return taskSets[status] || taskSets.healthy;
}

function generateProjectJSON(template) {
  const [plannedMin, plannedMax] = template.budget;
  const planned = plannedMin;
  const actual = Math.floor(planned / template.cpi);
  const forecast = Math.floor(actual * 1.05);

  // Generate realistic duration
  const durationBase = planned < 50000000 ? 8 : planned < 200000000 ? 14 : planned < 500000000 ? 20 : 30;
  const duration = durationBase + Math.floor(Math.random() * 12);
  const actualDuration = Math.floor(duration / template.spi);

  return {
    name: template.name,
    description: template.desc,
    healthStatus: template.status,
    budget: { planned, actual, forecast, cpi: template.cpi },
    schedule: { plannedDuration: duration, actualDuration, weeksLate: template.late, spi: template.spi },
    tasks: generateTasks(template.status, template.late),
    triggeredRules: template.rules,
    interventionTypes: template.agents,
    governanceStatus: template.gov
  };
}

// Main execution
console.log('═══════════════════════════════════════════════════');
console.log('   ACME Project Template Generator');
console.log('═══════════════════════════════════════════════════\n');

const filePath = path.join(__dirname, '../seed-data/acme-project-templates.json');
const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`Current state: ${existing.length} industries with ${existing.reduce((sum, ind) => sum + ind.projects.length, 0)} projects\n`);
console.log('Generating remaining industries...\n');

let addedCount = 0;
for (const [industryId, config] of Object.entries(industryTemplates)) {
  const projects = config.projects.map(p => generateProjectJSON(p));
  existing.push({
    industryId,
    companyId: config.companyId,
    projects
  });
  console.log(`  ✓ ${industryId.padEnd(30)} ${projects.length} projects`);
  addedCount++;
}

fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

console.log('\n═══════════════════════════════════════════════════');
console.log(`✅ Complete! Added ${addedCount} industries`);
console.log(`📊 Total: ${existing.length} industries, ${existing.reduce((sum, ind) => sum + ind.projects.length, 0)} projects`);
console.log('═══════════════════════════════════════════════════');
