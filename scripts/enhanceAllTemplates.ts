import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(process.cwd(), 'attached_assets', 'project_templates');

interface Task {
  id: string;
  name: string;
  status: string;
  effortHours: number;
  assignee: string;
  skills: string[];
}

interface Story {
  id: string;
  name: string;
  description: string;
  storyPoints: number;
  status: string;
  acceptanceCriteria: string[];
  tasks: Task[];
}

interface Feature {
  id: string;
  name: string;
  description: string;
  status: string;
  storyPoints: number;
  completedPoints: number;
  priority: string;
  wsjf: { businessValue: number; timeCriticality: number; riskReduction: number; jobSize: number; score: number };
  acceptanceCriteria: string[];
  stories: Story[];
}

const domainExperts: Record<string, { names: string[]; skills: string[][] }> = {
  'Institutional Retirement': {
    names: ['Dr. Sarah Chen (Actuary)', 'James Morrison (Pension Specialist)', 'Emily Watson (Risk Analyst)', 'Michael Peters (Pricing Lead)', 'Rachel Green (Data Scientist)', 'Thomas Brown (Integration Lead)'],
    skills: [['Actuarial Science', 'Mortality Tables', 'PRA Regulations'], ['Pension Scheme Management', 'TPAS Compliance', 'Trustee Relations'], ['Longevity Risk', 'Credit Risk', 'Solvency II'], ['Pricing Models', 'Market Data', 'Quote Generation'], ['Python', 'ML/AI', 'Statistical Modeling'], ['API Integration', 'Bloomberg', 'Reuters']]
  },
  'LGIM': {
    names: ['Dr. James Foster (ESG Analyst)', 'Sophie Mitchell (Climate Scientist)', 'Oliver Thompson (Portfolio Manager)', 'Emma Clarke (Sustainability Lead)', 'William Harris (Data Engineer)', 'Charlotte Davies (Regulatory Expert)'],
    skills: [['ESG Scoring', 'MSCI', 'Sustainalytics'], ['Climate Science', 'TCFD', 'Net Zero'], ['Portfolio Construction', 'Risk Management', 'Factor Investing'], ['SFDR', 'EU Taxonomy', 'Stewardship'], ['Python', 'Spark', 'Data Pipelines'], ['FCA Regulations', 'MiFID II', 'Reporting']]
  },
  'Retail Retirement': {
    names: ['Amanda Richards (Product Manager)', 'Christopher Lee (Platform Architect)', 'Jessica Taylor (UX Designer)', 'Daniel Wilson (Security Lead)', 'Laura Anderson (Compliance Officer)', 'Matthew Johnson (Integration Specialist)'],
    skills: [['Pension Products', 'Drawdown', 'Annuities'], ['Microservices', 'Cloud Architecture', 'APIs'], ['User Research', 'Accessibility', 'Mobile Design'], ['Cyber Security', 'PCI DSS', 'Encryption'], ['FCA Consumer Duty', 'GDPR', 'TCF'], ['Open Banking', 'Origo', 'STAR']]
  },
  'General Insurance': {
    names: ['Katherine White (Underwriting Lead)', 'Andrew Martin (Claims Analyst)', 'Victoria Jackson (Digital Lead)', 'Nicholas Robinson (Pricing Actuary)', 'Stephanie Thompson (Operations Manager)', 'Benjamin Clark (Technology Architect)'],
    skills: [['Underwriting', 'Risk Selection', 'Pricing'], ['Claims Processing', 'Fraud Detection', 'FNOL'], ['Digital Channels', 'Customer Journey', 'E-commerce'], ['GLM', 'Pricing Models', 'Telematics'], ['Claims Operations', 'SLAs', 'Vendor Management'], ['Policy Admin Systems', 'Integration', 'Cloud']]
  },
  'Group Functions': {
    names: ['Dr. Robert Turner (Enterprise Architect)', 'Helen Baker (Data Governance Lead)', 'Simon Price (Security Architect)', 'Claire Edwards (Change Manager)', 'David Hughes (Platform Engineer)', 'Rebecca Morris (Business Analyst)'],
    skills: [['Enterprise Architecture', 'TOGAF', 'Solution Design'], ['Data Governance', 'MDM', 'Data Quality'], ['InfoSec', 'Zero Trust', 'Identity Management'], ['OCM', 'Stakeholder Management', 'Training'], ['Kubernetes', 'Terraform', 'DevOps'], ['Requirements', 'Process Mapping', 'BPM']]
  },
  'Housing & Property': {
    names: ['Sarah Jenkins (Property Manager)', 'Mark Stevens (Sustainability Manager)', 'Lucy Cooper (Asset Manager)', 'Alex Turner (Development Lead)', 'Emma Collins (Compliance Officer)', 'Chris Ward (Technology Lead)'],
    skills: [['Property Management', 'Tenant Relations', 'Lettings'], ['Net Zero Carbon', 'EPC', 'Sustainability'], ['Asset Management', 'Portfolio Optimization', 'Valuation'], ['Development Planning', 'Construction', 'Project Management'], ['Building Regulations', 'Health & Safety', 'Landlord Compliance'], ['PropTech', 'IoT', 'Smart Buildings']]
  }
};

const templateEnhancements: Record<string, { domain: string; features: { name: string; stories: { name: string; criteria: string[]; tasks: { name: string; effort: number; skills: string[] }[] }[] }[] }> = {
  'ESG_Analytics_Dashboard.json': {
    domain: 'LGIM',
    features: [
      {
        name: 'ESG Data Integration Hub',
        stories: [
          {
            name: 'MSCI ESG Ratings Integration',
            criteria: [
              'Given a portfolio of 500+ securities is uploaded, When MSCI ESG ratings are fetched, Then each security receives a rating within 30 seconds with 99.9% coverage',
              'Given MSCI data contains a rating change, When the daily refresh runs, Then the change is reflected in portfolio scores within 1 hour',
              'Given a security has no MSCI coverage, When the gap is identified, Then Sustainalytics is used as fallback and the source is flagged'
            ],
            tasks: [
              { name: 'Implement MSCI API authentication with OAuth 2.0', effort: 16, skills: ['OAuth', 'API Security'] },
              { name: 'Build ESG rating normalization to 0-100 scale', effort: 24, skills: ['Data Transformation', 'Python'] },
              { name: 'Create security identifier matching (ISIN/SEDOL/CUSIP)', effort: 20, skills: ['Reference Data', 'SQL'] }
            ]
          },
          {
            name: 'Sustainalytics Risk Scores',
            criteria: [
              'Given a company has ESG controversies, When Sustainalytics data is ingested, Then controversy severity (1-5) and category are captured',
              'Given a portfolio manager views a holding, When controversy data exists, Then alerts are displayed with links to source documents',
              'Given controversy status changes, When weekly refresh occurs, Then historical controversy timeline is maintained'
            ],
            tasks: [
              { name: 'Build Sustainalytics SFTP data ingestion', effort: 20, skills: ['SFTP', 'Python'] },
              { name: 'Map controversy categories to internal taxonomy', effort: 16, skills: ['Data Mapping', 'ESG Domain'] },
              { name: 'Implement controversy alert notification service', effort: 12, skills: ['Event Processing', 'Notifications'] }
            ]
          },
          {
            name: 'CDP Climate Data Pipeline',
            criteria: [
              'Given CDP questionnaire responses are available, When annual data is released, Then company climate scores are updated within 48 hours',
              'Given a company has Scope 1/2/3 emissions data, When queried, Then emissions are displayed with YoY comparison',
              'Given science-based targets are set, When SBTi validation occurs, Then target status is reflected in company profile'
            ],
            tasks: [
              { name: 'Parse CDP questionnaire response formats', effort: 32, skills: ['XML Parsing', 'Climate Data'] },
              { name: 'Build emissions calculation engine (Scope 1/2/3)', effort: 28, skills: ['GHG Protocol', 'Python'] },
              { name: 'Integrate SBTi target validation database', effort: 16, skills: ['API Integration', 'Reference Data'] }
            ]
          }
        ]
      },
      {
        name: 'SFDR Regulatory Reporting',
        stories: [
          {
            name: 'Principal Adverse Impact (PAI) Indicators',
            criteria: [
              'Given an Article 8/9 fund is selected, When PAI report is generated, Then all 18 mandatory indicators are calculated with data coverage %',
              'Given PAI data has gaps, When coverage is below 70%, Then estimation methodology is applied and flagged for disclosure',
              'Given PAI metrics are calculated, When compared to benchmark, Then relative performance is displayed with traffic light status'
            ],
            tasks: [
              { name: 'Implement 18 mandatory PAI indicator calculations', effort: 40, skills: ['SFDR Regulations', 'Python'] },
              { name: 'Build PAI data gap estimation models', effort: 24, skills: ['Statistical Estimation', 'ML'] },
              { name: 'Create PAI benchmark comparison engine', effort: 20, skills: ['Benchmarking', 'Analytics'] }
            ]
          },
          {
            name: 'EU Taxonomy Alignment',
            criteria: [
              'Given a company has disclosed Taxonomy-eligible activities, When alignment is calculated, Then revenue/CapEx/OpEx split is shown',
              'Given Do No Significant Harm (DNSH) criteria apply, When assessed, Then each environmental objective status is displayed',
              'Given Taxonomy data is incomplete, When reported, Then estimation methodology and confidence level are disclosed'
            ],
            tasks: [
              { name: 'Build Taxonomy eligibility classification engine', effort: 32, skills: ['EU Taxonomy', 'NACE Codes'] },
              { name: 'Implement DNSH assessment framework', effort: 28, skills: ['Environmental Science', 'Compliance'] },
              { name: 'Create Taxonomy alignment reporting module', effort: 24, skills: ['Regulatory Reporting', 'React'] }
            ]
          },
          {
            name: 'TCFD Climate Scenario Analysis',
            criteria: [
              'Given NGFS climate scenarios are selected, When portfolio stress test runs, Then impact on holdings is quantified in $m',
              'Given physical risk assessment is requested, When geocoding completes, Then asset-level flood/wildfire/heat risk scores are shown',
              'Given transition risk is modeled, When carbon price pathway is applied, Then stranded asset exposure is calculated'
            ],
            tasks: [
              { name: 'Integrate NGFS scenario data (1.5°C, 2°C, 3°C+ pathways)', effort: 36, skills: ['Climate Scenarios', 'Python'] },
              { name: 'Build physical risk geocoding and scoring engine', effort: 32, skills: ['Geospatial', 'Climate Risk'] },
              { name: 'Implement transition risk carbon pricing model', effort: 28, skills: ['Carbon Markets', 'Financial Modeling'] }
            ]
          }
        ]
      },
      {
        name: 'Portfolio ESG Analytics',
        stories: [
          {
            name: 'ESG Score Aggregation Engine',
            criteria: [
              'Given multiple ESG data sources exist, When portfolio score is calculated, Then weighted average using AUM is applied',
              'Given ESG pillars (E/S/G) are analyzed, When drill-down is requested, Then sub-factor scores are displayed hierarchically',
              'Given portfolio vs benchmark comparison is requested, When generated, Then relative ESG positioning is visualized'
            ],
            tasks: [
              { name: 'Build multi-source ESG score aggregation logic', effort: 24, skills: ['Data Aggregation', 'Python'] },
              { name: 'Create E/S/G pillar breakdown visualization', effort: 20, skills: ['Data Visualization', 'D3.js'] },
              { name: 'Implement benchmark-relative ESG analytics', effort: 16, skills: ['Benchmarking', 'Analytics'] }
            ]
          },
          {
            name: 'Carbon Footprint Calculator',
            criteria: [
              'Given portfolio holdings are provided, When carbon footprint is calculated, Then tCO2e per $m invested is shown (WACI)',
              'Given Scope 3 emissions are included, When financed emissions are calculated, Then PCAF methodology is applied',
              'Given Net Zero target is set, When trajectory is modeled, Then year-by-year decarbonization path is displayed'
            ],
            tasks: [
              { name: 'Implement WACI and carbon intensity calculations', effort: 24, skills: ['Carbon Accounting', 'PCAF'] },
              { name: 'Build financed emissions attribution model', effort: 28, skills: ['PCAF Methodology', 'Python'] },
              { name: 'Create Net Zero trajectory modeling tool', effort: 20, skills: ['Scenario Modeling', 'Visualization'] }
            ]
          }
        ]
      }
    ]
  },
  'PRT_Intake_System_Upgrade.json': {
    domain: 'Institutional Retirement',
    features: [
      {
        name: 'Scheme Data Ingestion',
        stories: [
          {
            name: 'Multi-Format Parser',
            criteria: [
              'Given a pension scheme provides member data in Excel format, When uploaded, Then 50,000+ member records are parsed within 5 minutes with validation report',
              'Given scheme data contains legacy column headers, When mapped, Then intelligent matching suggests field mappings with 90%+ accuracy',
              'Given data file contains duplicate NI numbers, When detected, Then duplicates are flagged with merge/split options'
            ],
            tasks: [
              { name: 'Build Excel parser with xlsxwriter supporting 1M+ rows', effort: 24, skills: ['Python', 'Pandas', 'Excel'] },
              { name: 'Implement intelligent column header matching using NLP', effort: 32, skills: ['NLP', 'Machine Learning'] },
              { name: 'Create duplicate detection engine with fuzzy matching', effort: 20, skills: ['Record Linkage', 'Python'] }
            ]
          },
          {
            name: 'Data Validation Rules',
            criteria: [
              'Given member data is ingested, When validation runs, Then 200+ business rules are applied including NI number format, DOB validity, and benefit calculations',
              'Given a validation error is found, When displayed, Then error severity (critical/warning/info) and correction guidance are shown',
              'Given historical data exists, When new data uploaded, Then reconciliation identifies members who left/joined/changed benefits'
            ],
            tasks: [
              { name: 'Implement NI number validation with HMRC format checks', effort: 16, skills: ['Regex', 'UK Tax Systems'] },
              { name: 'Build benefit calculation validation (GMP, revaluation, pension increases)', effort: 32, skills: ['Pension Calculations', 'Actuarial'] },
              { name: 'Create member reconciliation engine for scheme comparisons', effort: 28, skills: ['Data Reconciliation', 'SQL'] }
            ]
          },
          {
            name: 'Data Cleansing Workflows',
            criteria: [
              'Given validation errors exist, When cleansing UI is accessed, Then batch editing allows correction of multiple records simultaneously',
              'Given address data is incomplete, When Postcode lookup triggered, Then Royal Mail PAF data auto-completes addresses',
              'Given cleansing is complete, When sign-off requested, Then audit trail captures all changes with user attribution'
            ],
            tasks: [
              { name: 'Build batch editing UI with undo/redo functionality', effort: 32, skills: ['React', 'State Management'] },
              { name: 'Integrate Royal Mail PAF for address validation', effort: 20, skills: ['API Integration', 'Address Data'] },
              { name: 'Implement comprehensive audit trail with change tracking', effort: 24, skills: ['Audit Logging', 'PostgreSQL'] }
            ]
          }
        ]
      },
      {
        name: 'Automated Benefit Calculations',
        stories: [
          {
            name: 'GMP Calculation Engine',
            criteria: [
              'Given a member has GMP entitlement, When calculated, Then GMP at GMP payment age uses correct revaluation (fixed rate/S148) based on leaving date',
              'Given GMP reconciliation with HMRC is required, When COD statement received, Then variance report is generated with explanation codes',
              'Given GMP equalisation applies, When conversion method selected, Then dual record methodology is applied per High Court ruling'
            ],
            tasks: [
              { name: 'Implement GMP revaluation calculations (fixed rate and S148 orders)', effort: 32, skills: ['GMP', 'Actuarial Calculations'] },
              { name: 'Build HMRC COD reconciliation module', effort: 28, skills: ['HMRC Integration', 'GMP Reconciliation'] },
              { name: 'Create GMP equalisation calculation engine', effort: 40, skills: ['GMP Equalisation', 'Lloyds Ruling'] }
            ]
          },
          {
            name: 'Pension Increase Calculations',
            criteria: [
              'Given pension has RPI/CPI increases, When increase date approaches, Then increase is calculated using ONS published indices',
              'Given scheme has LPI 0-5% cap and collar, When inflation exceeds 5%, Then pension increase is correctly capped',
              'Given member has multiple tranches with different increase rules, When calculated, Then each tranche increases separately'
            ],
            tasks: [
              { name: 'Build ONS index integration for RPI/CPI/CPIH', effort: 20, skills: ['API Integration', 'Inflation Indices'] },
              { name: 'Implement LPI cap and collar calculation logic', effort: 24, skills: ['Pension Increases', 'Actuarial'] },
              { name: 'Create multi-tranche benefit tracking system', effort: 28, skills: ['Pension Administration', 'Data Modeling'] }
            ]
          },
          {
            name: 'Transfer Value Calculator',
            criteria: [
              'Given a member requests CETV, When calculated, Then value uses scheme-specific factors and market conditions as at calculation date',
              'Given member is approaching retirement, When CETV requested, Then comparison with scheme pension is shown (MaPS regulations)',
              'Given transfer is to overseas scheme (QROPS), When requested, Then additional checks and tax implications are flagged'
            ],
            tasks: [
              { name: 'Implement CETV calculation with scheme-specific factors', effort: 32, skills: ['Transfer Values', 'Actuarial'] },
              { name: 'Build pension comparison tool per FCA/MaPS requirements', effort: 28, skills: ['FCA Regulations', 'Pension Guidance'] },
              { name: 'Create QROPS transfer checking module', effort: 24, skills: ['International Pensions', 'QROPS'] }
            ]
          }
        ]
      },
      {
        name: 'Pricing Workflow Automation',
        stories: [
          {
            name: 'Liability Cashflow Generation',
            criteria: [
              'Given member data is cleansed, When cashflows generated, Then projected benefits are calculated monthly for 70+ years',
              'Given mortality assumptions are applied, When survival probabilities used, Then CMI projections with scheme-specific adjustments are applied',
              'Given spouse reversions apply, When calculated, Then contingent spouse benefits are modeled with appropriate proportions'
            ],
            tasks: [
              { name: 'Build monthly cashflow projection engine', effort: 36, skills: ['Actuarial Projections', 'Python'] },
              { name: 'Implement CMI mortality model with improvements', effort: 32, skills: ['CMI Model', 'Longevity'] },
              { name: 'Create spouse reversion calculation module', effort: 24, skills: ['Survivor Benefits', 'Actuarial'] }
            ]
          },
          {
            name: 'Real-Time Quote Generation',
            criteria: [
              'Given cashflows are generated, When quote requested, Then pricing completes in under 60 seconds for 10,000 members',
              'Given market conditions change, When re-quote triggered, Then new price reflects updated gilt yields and credit spreads',
              'Given quote is generated, When audit requested, Then full assumptions breakdown and sensitivity analysis are available'
            ],
            tasks: [
              { name: 'Optimize pricing engine for sub-minute performance', effort: 28, skills: ['Performance Optimization', 'C++'] },
              { name: 'Build real-time market data integration for pricing', effort: 24, skills: ['Market Data', 'Bloomberg'] },
              { name: 'Create quote audit and sensitivity reporting', effort: 20, skills: ['Reporting', 'Analytics'] }
            ]
          }
        ]
      }
    ]
  },
  'Longevity_Model_Enhancement.json': {
    domain: 'Institutional Retirement',
    features: [
      {
        name: 'CMI Model Integration',
        stories: [
          {
            name: 'CMI Core Model Implementation',
            criteria: [
              'Given CMI publishes new model version, When integrated, Then model is available within 2 weeks of publication',
              'Given user selects mortality basis, When applied, Then CMI_2022 (or later) with configurable initial addition and long-term rate is used',
              'Given scheme-specific mortality experience exists, When applied, Then adjustments to qx rates are implemented correctly'
            ],
            tasks: [
              { name: 'Implement CMI_2022 core mortality model', effort: 40, skills: ['CMI Model', 'Actuarial', 'Python'] },
              { name: 'Build period vs cohort mortality switching', effort: 24, skills: ['Mortality Projections', 'Statistics'] },
              { name: 'Create scheme-specific experience adjustment module', effort: 28, skills: ['Experience Analysis', 'Actuarial'] }
            ]
          },
          {
            name: 'Mortality Improvement Projections',
            criteria: [
              'Given long-term mortality improvement rate is set, When projections run, Then improvements taper from initial to long-term over convergence period',
              'Given pandemic adjustment is required, When 2020-2022 period analyzed, Then COVID-19 mortality is handled per CMI guidance',
              'Given sensitivity analysis requested, When variations applied, Then impact of +/- 0.5% improvement rate is shown'
            ],
            tasks: [
              { name: 'Build mortality improvement tapering calculations', effort: 24, skills: ['Mortality Projections', 'Mathematics'] },
              { name: 'Implement COVID-19 mortality adjustment handling', effort: 20, skills: ['Pandemic Analysis', 'CMI'] },
              { name: 'Create mortality sensitivity analysis tools', effort: 16, skills: ['Sensitivity Analysis', 'Visualization'] }
            ]
          }
        ]
      },
      {
        name: 'Socio-Economic Mortality Adjustments',
        stories: [
          {
            name: 'Postcode-Based Mortality Factors',
            criteria: [
              'Given member postcode is available, When mortality factors applied, Then IMD (Index of Multiple Deprivation) adjustments modify base mortality',
              'Given Club Vita longevity data is used, When applied, Then lifestyle-adjusted mortality provides better risk segmentation',
              'Given affluence indicators are derived, When pension amount analyzed, Then higher pensions receive longevity uplift'
            ],
            tasks: [
              { name: 'Integrate ONS IMD data for postcode-level adjustments', effort: 28, skills: ['Geospatial', 'ONS Data'] },
              { name: 'Build Club Vita lifestyle factor integration', effort: 32, skills: ['Club Vita', 'Longevity Data'] },
              { name: 'Implement pension amount as longevity predictor', effort: 24, skills: ['Actuarial Analysis', 'ML'] }
            ]
          },
          {
            name: 'Occupation-Based Adjustments',
            criteria: [
              'Given member occupation is classified, When SOC code applied, Then occupation-specific mortality factors adjust life expectancy',
              'Given historical scheme is blue-collar heavy, When analyzed, Then appropriate mortality loading is applied',
              'Given occupation data is missing, When imputed, Then industry-level defaults based on employer SIC code are used'
            ],
            tasks: [
              { name: 'Map occupations to SOC codes with mortality factors', effort: 24, skills: ['Occupational Data', 'Classification'] },
              { name: 'Build blue-collar/white-collar mortality differential model', effort: 20, skills: ['Mortality Analysis', 'Statistics'] },
              { name: 'Create occupation imputation from employer data', effort: 16, skills: ['Data Imputation', 'ML'] }
            ]
          }
        ]
      },
      {
        name: 'Reinsurance Optimization',
        stories: [
          {
            name: 'Longevity Swap Structuring',
            criteria: [
              'Given large pension liabilities exist, When longevity swap quoted, Then optimal attachment point and exhaustion point are recommended',
              'Given swap collateral requirements calculated, When posted, Then CSA terms are reflected in pricing',
              'Given swap counterparty risk assessed, When exposure modeled, Then CVA adjustment is applied to pricing'
            ],
            tasks: [
              { name: 'Build longevity swap pricing model', effort: 40, skills: ['Longevity Swaps', 'Derivatives Pricing'] },
              { name: 'Implement collateral optimization for CSA terms', effort: 32, skills: ['Collateral Management', 'Treasury'] },
              { name: 'Create counterparty credit risk (CVA) module', effort: 28, skills: ['CVA', 'Credit Risk'] }
            ]
          },
          {
            name: 'Reinsurer Comparison Tool',
            criteria: [
              'Given multiple reinsurer quotes received, When compared, Then pricing, terms, and credit quality are displayed side-by-side',
              'Given reinsurer capacity is tracked, When deal flow analyzed, Then available capacity by reinsurer is shown',
              'Given optimal reinsurer selected, When contract executed, Then treaty terms are captured in policy admin system'
            ],
            tasks: [
              { name: 'Build reinsurer quote comparison dashboard', effort: 24, skills: ['React', 'Data Visualization'] },
              { name: 'Create reinsurer capacity tracking module', effort: 20, skills: ['Relationship Management', 'Analytics'] },
              { name: 'Implement treaty terms capture workflow', effort: 16, skills: ['Insurance Operations', 'Contract Management'] }
            ]
          }
        ]
      }
    ]
  }
};

function generateEnhancedFeatures(templateName: string, existingFeatures: Feature[], domain: string): Feature[] {
  const enhancements = templateEnhancements[templateName];
  if (!enhancements) {
    console.log(`No specific enhancements defined for ${templateName}, applying generic domain improvements`);
    return existingFeatures.map(f => enhanceGenericFeature(f, domain));
  }

  const experts = domainExperts[enhancements.domain] || domainExperts['Group Functions'];
  
  return existingFeatures.map((feature, fIdx) => {
    const enhancement = enhancements.features.find(e => feature.name.toLowerCase().includes(e.name.toLowerCase().split(' ')[0]));
    
    if (enhancement) {
      const enhancedStories = feature.stories?.map((story, sIdx) => {
        const storyEnhancement = enhancement.stories[sIdx % enhancement.stories.length];
        if (storyEnhancement) {
          return {
            ...story,
            acceptanceCriteria: storyEnhancement.criteria,
            tasks: story.tasks?.map((task, tIdx) => {
              const taskEnhancement = storyEnhancement.tasks[tIdx % storyEnhancement.tasks.length];
              const expert = experts.names[tIdx % experts.names.length];
              const skills = taskEnhancement?.skills || experts.skills[tIdx % experts.skills.length];
              return {
                ...task,
                name: taskEnhancement?.name || task.name,
                effortHours: taskEnhancement?.effort || task.effortHours,
                assignee: expert,
                skills: skills
              };
            }) || []
          };
        }
        return enhanceGenericStory(story, domain, experts);
      }) || [];

      return {
        ...feature,
        stories: enhancedStories
      };
    }
    
    return enhanceGenericFeature(feature, domain);
  });
}

function enhanceGenericFeature(feature: Feature, domain: string): Feature {
  const experts = domainExperts[domain] || domainExperts['Group Functions'];
  
  const enhancedStories = feature.stories?.map(story => 
    enhanceGenericStory(story, domain, experts)
  ) || [];
  
  return {
    ...feature,
    stories: enhancedStories
  };
}

function enhanceGenericStory(story: Story, domain: string, experts: { names: string[]; skills: string[][] }): Story {
  const storyNameLower = story.name.toLowerCase();
  
  let criteria: string[];
  
  if (storyNameLower.includes('integrat') || storyNameLower.includes('api') || storyNameLower.includes('connect')) {
    criteria = [
      `Given the ${story.name} system is configured, When API connection is established, Then data synchronization completes within SLA with 99.9% uptime`,
      `Given data is received from external source, When validation rules are applied, Then invalid records are quarantined with detailed error codes`,
      `Given connection failure occurs, When retry logic engages, Then exponential backoff with max 5 retries ensures resilience`
    ];
  } else if (storyNameLower.includes('report') || storyNameLower.includes('dashboard') || storyNameLower.includes('analytic')) {
    criteria = [
      `Given user requests ${story.name} report, When generated, Then data is accurate to within 0.01% of source systems`,
      `Given report parameters are selected, When export triggered, Then PDF/Excel output is delivered within 30 seconds`,
      `Given historical comparison is needed, When date range selected, Then trend analysis displays with configurable periods`
    ];
  } else if (storyNameLower.includes('valid') || storyNameLower.includes('quality') || storyNameLower.includes('check')) {
    criteria = [
      `Given data is submitted for ${story.name}, When validation completes, Then all business rules are applied with pass/fail status per field`,
      `Given validation errors are found, When displayed to user, Then error severity and correction guidance are provided`,
      `Given validation rules are updated, When deployed, Then new rules apply to subsequent submissions without reprocessing history`
    ];
  } else if (storyNameLower.includes('workflow') || storyNameLower.includes('process') || storyNameLower.includes('automat')) {
    criteria = [
      `Given ${story.name} workflow is initiated, When all steps complete, Then process finishes within expected SLA with full audit trail`,
      `Given approval is required, When approver notified, Then escalation triggers if no response within 48 hours`,
      `Given workflow step fails, When error is logged, Then appropriate team is notified with context for resolution`
    ];
  } else if (storyNameLower.includes('user') || storyNameLower.includes('ui') || storyNameLower.includes('interface')) {
    criteria = [
      `Given user accesses ${story.name} interface, When page loads, Then all elements render within 2 seconds with accessibility compliance`,
      `Given user performs action, When submitted, Then confirmation is displayed with next steps guidance`,
      `Given user makes an error, When validation fires, Then inline error messages guide correction without page refresh`
    ];
  } else {
    criteria = [
      `Given ${story.name} functionality is invoked, When processing completes, Then results meet defined acceptance criteria within SLA`,
      `Given valid inputs are provided, When action executed, Then expected outcomes are achieved with full traceability`,
      `Given edge cases occur, When handled, Then graceful error handling ensures system stability with user notification`
    ];
  }

  const enhancedTasks = story.tasks?.map((task, idx) => ({
    ...task,
    assignee: experts.names[idx % experts.names.length],
    skills: experts.skills[idx % experts.skills.length]
  })) || [];

  return {
    ...story,
    acceptanceCriteria: criteria,
    tasks: enhancedTasks
  };
}

async function processAllTemplates() {
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  console.log(`Processing ${files.length} templates...`);

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    const domain = content.division || content.bu || 'Group Functions';
    const domainKey = Object.keys(domainExperts).find(k => 
      domain.toLowerCase().includes(k.toLowerCase().split(' ')[0].toLowerCase())
    ) || 'Group Functions';
    
    if (content.features) {
      content.features = generateEnhancedFeatures(file, content.features, domainKey);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Enhanced: ${file} (${domainKey})`);
  }

  console.log('All templates enhanced successfully!');
}

processAllTemplates().catch(console.error);
