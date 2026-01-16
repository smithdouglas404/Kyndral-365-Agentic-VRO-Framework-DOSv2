import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(process.cwd(), 'attached_assets', 'project_templates');

const domainEnhancements: Record<string, { criteria: (storyName: string) => string[], experts: string[], expertSkills: string[][] }> = {
  'Bulk_Annuity_Pricing_Engine': {
    criteria: (storyName: string) => [
      `Given pricing actuary requests ${storyName.toLowerCase()}, When market data is current, Then quote generation completes in under 60 seconds with full audit trail`,
      `Given scheme liability cashflows are loaded, When mortality assumptions applied, Then CMI_2022 with scheme-specific improvements is used correctly`,
      `Given competitive bid is required, When optimal price calculated, Then win probability model achieves 75%+ accuracy on historical validation`
    ],
    experts: ['Dr. Sarah Chen (Pricing Actuary)', 'Robert Hughes (Market Data Lead)', 'Jennifer Liu (Quant Developer)', 'Dr. Mark Evans (Data Scientist)', 'David Kim (Integration Lead)'],
    expertSkills: [['Actuarial Science', 'Pricing Models', 'Solvency II'], ['Bloomberg API', 'Reuters', 'Market Data'], ['Python', 'C++', 'Performance'], ['Machine Learning', 'XGBoost', 'MLOps'], ['API Integration', 'Real-time Systems']]
  },
  'Client_Portal_Modernization': {
    criteria: (storyName: string) => [
      `Given institutional client accesses portal for ${storyName.toLowerCase()}, When page loads, Then all investment data renders within 2 seconds with WCAG 2.1 AA compliance`,
      `Given client requests portfolio report, When generated, Then SFDR Article 8/9 disclosures are included with accurate ESG metrics`,
      `Given mandate documentation is required, When downloaded, Then digitally signed PDF with MiFID II cost disclosures is delivered`
    ],
    experts: ['Oliver Thompson (Client Experience Lead)', 'Sophie Mitchell (UX Designer)', 'William Harris (Frontend Developer)', 'Emma Clarke (Compliance Analyst)', 'Charlotte Davies (Product Manager)'],
    expertSkills: [['Client Experience', 'Investment Portals', 'MiFID II'], ['UX Design', 'Accessibility', 'Figma'], ['React', 'TypeScript', 'Performance'], ['FCA Regulations', 'Client Reporting'], ['Product Management', 'Agile']]
  },
  'Climate_Transition_Analytics': {
    criteria: (storyName: string) => [
      `Given portfolio holdings for ${storyName.toLowerCase()} are analyzed, When climate scenarios applied, Then NGFS 1.5°C/2°C/3°C+ impacts are quantified in $m value at risk`,
      `Given physical risk assessment needed, When geocoding completes, Then asset-level flood/wildfire/heat stress scores use IPCC AR6 projections`,
      `Given Net Zero pathway required, When trajectory modeled, Then year-by-year Scope 1/2/3 reduction targets align with SBTi framework`
    ],
    experts: ['Dr. James Foster (Climate Scientist)', 'Sophie Mitchell (ESG Analyst)', 'Oliver Thompson (Portfolio Manager)', 'Emma Clarke (Net Zero Lead)', 'William Harris (Data Engineer)'],
    expertSkills: [['Climate Science', 'TCFD', 'NGFS Scenarios'], ['ESG Analysis', 'SFDR', 'EU Taxonomy'], ['Portfolio Construction', 'Risk Management'], ['Net Zero', 'SBTi', 'Carbon Accounting'], ['Python', 'Geospatial', 'Data Pipelines']]
  },
  'Digital_Onboarding_Redesign': {
    criteria: (storyName: string) => [
      `Given new retail customer begins ${storyName.toLowerCase()}, When ID verification triggered, Then biometric checks complete in under 30 seconds with 99.5% accuracy`,
      `Given customer provides personal details, When KYC/AML checks run, Then Experian/Equifax verification completes with risk score and PEP/sanctions screening`,
      `Given FCA Consumer Duty applies, When product recommended, Then suitability assessment and fair value statement are documented`
    ],
    experts: ['Amanda Richards (Product Manager)', 'Jessica Taylor (UX Lead)', 'Daniel Wilson (Security Architect)', 'Laura Anderson (Compliance Manager)', 'Matthew Johnson (Integration Lead)'],
    expertSkills: [['Digital Products', 'Customer Journeys', 'Pensions'], ['UX Research', 'Mobile Design', 'Accessibility'], ['Identity Verification', 'Biometrics', 'Fraud Prevention'], ['FCA Consumer Duty', 'KYC/AML', 'GDPR'], ['Open Banking', 'API Integration', 'Onfido']]
  },
  'Enterprise_Data_Platform': {
    criteria: (storyName: string) => [
      `Given enterprise data for ${storyName.toLowerCase()} is ingested, When lineage tracked, Then full data provenance from source to report is visible with transformation logic`,
      `Given data quality rules applied, When validation completes, Then DQ scores are published to data catalog with remediation workflows`,
      `Given cross-LOB analytics requested, When data joined, Then consistent entity resolution across policies, customers, and investments is achieved`
    ],
    experts: ['Dr. Robert Turner (Chief Data Architect)', 'Helen Baker (Data Governance Lead)', 'Simon Price (Data Engineer)', 'Claire Edwards (MDM Specialist)', 'David Hughes (Platform Engineer)'],
    expertSkills: [['Enterprise Architecture', 'Data Mesh', 'Lakehouse'], ['Data Governance', 'BCBS 239', 'Data Quality'], ['Spark', 'Databricks', 'dbt'], ['Master Data Management', 'Entity Resolution'], ['Kubernetes', 'Terraform', 'DevOps']]
  },
  'AI_Chatbot_Implementation': {
    criteria: (storyName: string) => [
      `Given customer asks about ${storyName.toLowerCase()}, When AI processes query, Then response is generated within 3 seconds with 90%+ intent accuracy`,
      `Given pension-specific question asked, When RAG retrieval runs, Then answer cites official scheme documentation with confidence score`,
      `Given FCA regulations apply, When advice boundary reached, Then chatbot hands off to human adviser with full conversation context`
    ],
    experts: ['Christopher Lee (AI/ML Lead)', 'Amanda Richards (Product Owner)', 'Jessica Taylor (Conversation Designer)', 'Laura Anderson (Compliance)', 'Matthew Johnson (Integration Lead)'],
    expertSkills: [['LLM', 'RAG', 'Prompt Engineering'], ['Pension Products', 'Customer Experience'], ['Conversation Design', 'NLU', 'Dialog Flow'], ['FCA SMCR', 'Advice Boundaries', 'TCF'], ['API Integration', 'Azure OpenAI', 'Vector DB']]
  },
  'Build_to_Rent_Operating_Platform': {
    criteria: (storyName: string) => [
      `Given prospective tenant applies for ${storyName.toLowerCase()}, When affordability check runs, Then income verification via Open Banking completes in real-time`,
      `Given tenant reports maintenance issue, When logged, Then job is routed to contractor with SLA tracking and tenant notification`,
      `Given monthly rent due, When payment collected, Then automated reconciliation posts to property accounting with arrears escalation triggers`
    ],
    experts: ['Sarah Jenkins (Operations Director)', 'Mark Stevens (Property Manager)', 'Lucy Cooper (Lettings Lead)', 'Alex Turner (Technology Lead)', 'Emma Collins (Compliance Manager)'],
    expertSkills: [['BTR Operations', 'Portfolio Management', 'P&L'], ['Property Management', 'Tenant Relations', 'Maintenance'], ['Lettings', 'Referencing', 'AST Contracts'], ['PropTech', 'React', 'APIs'], ['Landlord Compliance', 'HHSRS', 'Right to Rent']]
  },
  'Net_Zero_Housing_Tracker': {
    criteria: (storyName: string) => [
      `Given property portfolio analyzed for ${storyName.toLowerCase()}, When EPC data loaded, Then current ratings and upgrade pathways to EPC C are displayed per unit`,
      `Given retrofit intervention modeled, When costs estimated, Then ROI calculation includes fuel savings, property value uplift, and carbon reduction`,
      `Given MEES 2028 deadline approaches, When compliance gap identified, Then prioritized remediation plan is generated with contractor matching`
    ],
    experts: ['Mark Stevens (Net Zero Manager)', 'Sarah Jenkins (Asset Manager)', 'Alex Turner (Sustainability Lead)', 'Emma Collins (Data Analyst)', 'Chris Ward (Technology Lead)'],
    expertSkills: [['Net Zero Carbon', 'Retrofit', 'Heat Pumps'], ['Asset Management', 'Valuation', 'CapEx Planning'], ['EPC', 'SAP Calculations', 'MEES'], ['Energy Data', 'Analytics', 'Python'], ['PropTech', 'IoT', 'Smart Metering']]
  },
  'Infrastructure_Asset_Management_System': {
    criteria: (storyName: string) => [
      `Given infrastructure asset performance for ${storyName.toLowerCase()} is tracked, When IoT sensor data received, Then real-time monitoring updates dashboard within 60 seconds`,
      `Given maintenance schedule due, When triggered, Then work orders are dispatched to contractors with asset documentation and safety requirements`,
      `Given asset lifecycle analysis needed, When depreciation calculated, Then accounting treatment per IAS 16 is applied with impairment testing`
    ],
    experts: ['Lucy Cooper (Infrastructure Manager)', 'Mark Stevens (Technical Director)', 'Alex Turner (IoT Lead)', 'Sarah Jenkins (Finance Analyst)', 'Chris Ward (Platform Architect)'],
    expertSkills: [['Infrastructure Assets', 'Lifecycle Management', 'CMMS'], ['Civil Engineering', 'Asset Condition', 'Inspections'], ['IoT', 'Sensors', 'SCADA'], ['IAS 16', 'Asset Accounting', 'Depreciation'], ['Cloud Architecture', 'Azure', 'Data Pipelines']]
  },
  'Investment_Research_AI': {
    criteria: (storyName: string) => [
      `Given analyst researches ${storyName.toLowerCase()}, When AI summarizes earnings calls, Then key themes and sentiment are extracted with source citations`,
      `Given fundamental analysis required, When financial data processed, Then peer comparison and DCF valuation are auto-generated with assumptions`,
      `Given MiFID II research unbundling applies, When report generated, Then cost attribution and client entitlement are tracked for compliance`
    ],
    experts: ['Dr. James Foster (Quant Analyst)', 'Oliver Thompson (Research Director)', 'Sophie Mitchell (NLP Engineer)', 'William Harris (Data Engineer)', 'Charlotte Davies (Compliance Lead)'],
    expertSkills: [['Quantitative Analysis', 'Factor Models', 'Alpha Generation'], ['Equity Research', 'Fixed Income', 'Credit Analysis'], ['NLP', 'LLM', 'Named Entity Recognition'], ['Python', 'SQL', 'Bloomberg'], ['MiFID II', 'Research Unbundling', 'Inducements']]
  },
  'Operational_Resilience_Framework': {
    criteria: (storyName: string) => [
      `Given important business service for ${storyName.toLowerCase()} is mapped, When impact tolerances set, Then maximum tolerable disruption period is defined with escalation triggers`,
      `Given scenario testing required, When DR exercise run, Then RTO/RPO targets are validated with documented lessons learned`,
      `Given PRA/FCA regulatory review, When self-assessment submitted, Then evidence of resilience testing and remediation plans is comprehensive`
    ],
    experts: ['Dr. Robert Turner (Resilience Lead)', 'Helen Baker (Risk Manager)', 'Simon Price (BC/DR Manager)', 'Claire Edwards (Compliance Director)', 'David Hughes (Technology Resilience)'],
    expertSkills: [['Operational Resilience', 'PS21/3', 'Important Business Services'], ['Enterprise Risk', 'RCSA', 'Key Risk Indicators'], ['Business Continuity', 'DR Testing', 'Crisis Management'], ['PRA/FCA Regulations', 'Self-Assessment', 'Remediation'], ['IT Resilience', 'Cloud DR', 'Failover']]
  },
  'Pension_Scheme_Data_Hub': {
    criteria: (storyName: string) => [
      `Given scheme data for ${storyName.toLowerCase()} is consolidated, When queried, Then member records from all admin platforms are linked with golden record logic`,
      `Given TPR data submission due, When scheme return generated, Then DB/DC statistics and chair statement data are accurate and audit-ready`,
      `Given member view requested, When benefits displayed, Then combined DB and DC projections use TPR assumptions with statutory money purchase illustration`
    ],
    experts: ['James Morrison (Pension Data Lead)', 'Emily Watson (Admin Manager)', 'Rachel Green (Data Architect)', 'Thomas Brown (Integration Lead)', 'Dr. Sarah Chen (Compliance Analyst)'],
    expertSkills: [['Pension Administration', 'Member Data', 'Record Keeping'], ['Scheme Administration', 'Member Comms', 'Retirement Processing'], ['Data Architecture', 'MDM', 'Data Quality'], ['Origo Integration', 'STAR', 'Altus'], ['TPR Regulations', 'Scheme Funding', 'Disclosure']]
  },
  'Private_Markets_Platform_Build': {
    criteria: (storyName: string) => [
      `Given private equity fund for ${storyName.toLowerCase()} is onboarded, When capital calls processed, Then investor allocations and carried interest are calculated per LPA terms`,
      `Given quarterly valuation required, When NAV calculated, Then IPEV guidelines are applied with auditor-ready documentation`,
      `Given investor reporting due, When distributed, Then IRR, TVPI, and DPI metrics are computed with benchmark comparisons`
    ],
    experts: ['Oliver Thompson (Private Markets Lead)', 'Sophie Mitchell (Fund Accountant)', 'William Harris (Operations Manager)', 'Emma Clarke (Investor Relations)', 'Charlotte Davies (Compliance Director)'],
    expertSkills: [['Private Equity', 'Infrastructure', 'Real Assets'], ['Fund Accounting', 'IPEV', 'NAV Calculations'], ['Capital Calls', 'Distributions', 'Waterfalls'], ['LP Reporting', 'IRR/TVPI', 'ILPA Templates'], ['AIFMD', 'FCA Host', 'Depositary']]
  },
  'Protection_Product_Digitization': {
    criteria: (storyName: string) => [
      `Given customer applies for ${storyName.toLowerCase()} protection, When underwriting rules applied, Then straight-through processing achieves 60%+ auto-acceptance rate`,
      `Given medical evidence required, When GP report requested, Then eMRO integration delivers records within 10 business days`,
      `Given claims notification received, When validated, Then triage routes to appropriate handler with fraud scoring and estimated settlement timeline`
    ],
    experts: ['Katherine White (Product Director)', 'Andrew Martin (Underwriting Lead)', 'Victoria Jackson (Claims Manager)', 'Nicholas Robinson (Pricing Actuary)', 'Stephanie Thompson (Digital Lead)'],
    expertSkills: [['Protection Products', 'Life/CI/IP', 'Product Design'], ['Underwriting', 'Risk Selection', 'Medical Evidence'], ['Claims Assessment', 'Fraud Detection', 'FNOL'], ['Protection Pricing', 'Experience Analysis', 'Morbidity'], ['Digital Channels', 'Quote & Apply', 'Customer Journey']]
  },
  'Regulatory_Change_Management': {
    criteria: (storyName: string) => [
      `Given regulatory change for ${storyName.toLowerCase()} is identified, When impact assessed, Then affected systems, processes, and policies are mapped with remediation owners`,
      `Given implementation deadline approaching, When tracked, Then project milestones are monitored with RAG status and escalation to ExCo`,
      `Given post-implementation review required, When conducted, Then lessons learned and residual risks are documented with regulatory evidence pack`
    ],
    experts: ['Claire Edwards (Regulatory Affairs Director)', 'Helen Baker (Compliance Manager)', 'Dr. Robert Turner (Change Lead)', 'Simon Price (Project Manager)', 'Rebecca Morris (Business Analyst)'],
    expertSkills: [['Regulatory Change', 'Horizon Scanning', 'Policy Analysis'], ['Compliance Monitoring', 'Attestation', 'Assurance'], ['Change Management', 'Impact Assessment', 'Remediation'], ['Project Management', 'RAID', 'Dependencies'], ['Requirements', 'Gap Analysis', 'Testing']]
  },
  'Risk_Appetite_Dashboard_Upgrade': {
    criteria: (storyName: string) => [
      `Given risk appetite for ${storyName.toLowerCase()} is defined, When metrics calculated, Then current position vs appetite/tolerance/limit is displayed with trend`,
      `Given threshold breach occurs, When detected, Then automated alert triggers to CRO with root cause analysis and proposed actions`,
      `Given Board reporting required, When generated, Then heat maps and bow-tie diagrams visualize enterprise risk landscape`
    ],
    experts: ['Helen Baker (Enterprise Risk Lead)', 'Dr. Robert Turner (CRO Office)', 'Simon Price (Risk Analyst)', 'Claire Edwards (Risk Reporting Manager)', 'David Hughes (Technology Lead)'],
    expertSkills: [['Enterprise Risk', 'Risk Appetite', 'ORSA'], ['Strategic Risk', 'Emerging Risks', 'Scenario Analysis'], ['Risk Analytics', 'Quantitative Methods', 'Monte Carlo'], ['Board Reporting', 'Visualization', 'Dashboards'], ['Risk Systems', 'GRC Platforms', 'Data Integration']]
  },
  'Savings_Investments_Platform': {
    criteria: (storyName: string) => [
      `Given customer invests in ${storyName.toLowerCase()}, When order placed, Then trade execution confirms within T+2 with contract note delivered same day`,
      `Given ISA/SIPP wrapper applies, When subscription made, Then annual allowance tracking prevents over-contribution with automated HMRC reporting`,
      `Given Consumer Duty applies, When product selected, Then fair value assessment and target market alignment are documented`
    ],
    experts: ['Amanda Richards (Platform Director)', 'Christopher Lee (Product Manager)', 'Jessica Taylor (UX Lead)', 'Laura Anderson (Compliance Manager)', 'Matthew Johnson (Integration Lead)'],
    expertSkills: [['Platform Products', 'ISA/SIPP', 'GIA'], ['Fund Selection', 'Model Portfolios', 'Rebalancing'], ['Digital Journeys', 'Mobile App', 'Accessibility'], ['FCA Consumer Duty', 'COBS', 'PROD'], ['Calastone', 'EMX', 'Fund Settlement']]
  },
  'Three_Lines_of_Defence_Automation': {
    criteria: (storyName: string) => [
      `Given control testing for ${storyName.toLowerCase()} is scheduled, When automated test runs, Then evidence is captured with pass/fail status and exception workflow`,
      `Given first line attestation due, When completed, Then control owner sign-off is recorded with supporting documentation`,
      `Given internal audit review scheduled, When findings tracked, Then remediation actions are monitored with SLA compliance and executive escalation`
    ],
    experts: ['Claire Edwards (Controls Director)', 'Helen Baker (First Line Lead)', 'Dr. Robert Turner (Internal Audit)', 'Simon Price (GRC Manager)', 'Rebecca Morris (Testing Lead)'],
    expertSkills: [['Control Framework', 'COSO', 'Three Lines'], ['Control Testing', 'SOX', 'Attestation'], ['Internal Audit', 'Risk-Based Auditing', 'IPPF'], ['GRC Platforms', 'ServiceNow', 'Archer'], ['Test Automation', 'RPA', 'Evidence Collection']]
  }
};

async function enhanceAllTemplates() {
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  console.log(`Enhancing ${files.length} templates with domain-specific content...`);

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const baseName = file.replace('.json', '');
    
    const enhancement = domainEnhancements[baseName];
    
    if (enhancement && content.features) {
      content.features = content.features.map((feature: any, fIdx: number) => {
        if (feature.stories) {
          feature.stories = feature.stories.map((story: any, sIdx: number) => {
            const expertIdx = (fIdx + sIdx) % enhancement.experts.length;
            
            return {
              ...story,
              acceptanceCriteria: enhancement.criteria(story.name),
              tasks: story.tasks?.map((task: any, tIdx: number) => {
                const taskExpertIdx = (expertIdx + tIdx) % enhancement.experts.length;
                return {
                  ...task,
                  assignee: enhancement.experts[taskExpertIdx],
                  skills: enhancement.expertSkills[taskExpertIdx] || ['Domain Expertise']
                };
              }) || []
            };
          });
        }
        return feature;
      });
      
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`✓ Enhanced: ${file} with domain-specific SAFe content`);
    } else {
      console.log(`○ Skipped: ${file} (no specific enhancement defined or already enhanced)`);
    }
  }

  console.log('\nAll templates enhanced with comprehensive SAFe 6.0 content!');
}

enhanceAllTemplates().catch(console.error);
