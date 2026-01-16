import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(process.cwd(), 'attached_assets', 'project_templates');

const allStoryCriteria: Record<string, string[]> = {
  // ========== ENTERPRISE DATA PLATFORM ==========
  'Azure ADLS Gen2 Infrastructure Setup': [
    'Given infrastructure-as-code is executed, When Terraform applies successfully, Then ADLS Gen2 containers are provisioned with RBAC policies in under 30 minutes',
    'Given storage accounts are created, When hierarchical namespace is enabled, Then Delta Lake tables can be written with ACID transactions',
    'Given disaster recovery is configured, When primary region fails, Then data is accessible from paired region within RPO of 1 hour'
  ],
  'Delta Lake Table Implementation': [
    'Given raw data is ingested into Bronze layer, When Delta format applied, Then time travel queries retrieve data from any point in last 90 days',
    'Given concurrent writes from multiple jobs occur, When ACID transactions complete, Then data integrity is maintained with optimistic concurrency control',
    'Given schema evolution is required, When new columns added via ALTER, Then existing Spark queries continue working with null handling for missing columns'
  ],
  'Source System Connectors': [
    'Given source system credentials are configured, When connector job runs, Then data is extracted with change data capture for incremental loads',
    'Given source system API rate limit is reached, When throttling detected, Then backoff strategy applies with job resumption without data loss',
    'Given new source system onboarding requested, When connector template instantiated, Then first data load completes within 2-week sprint'
  ],
  'Data Quality Rules Engine': [
    'Given Great Expectations rules are defined, When validation checkpoint runs, Then DQ results publish to data catalog with pass/fail per expectation',
    'Given DQ score falls below 95% threshold, When alert triggers, Then data steward receives Slack notification with failed records sample',
    'Given new DQ rule requested by business, When configured in YAML, Then rule applies to next scheduled validation without code deployment'
  ],
  'Purview Catalog Integration': [
    'Given Databricks notebook processes data, When lineage captured, Then Purview shows full transformation path from source to gold table',
    'Given data consumer searches for customer data, When query returns results, Then sensitivity labels and data owner contact are displayed',
    'Given business glossary term is updated, When propagated, Then linked technical assets reflect updated business context within 1 hour'
  ],
  'PII Detection Service': [
    'Given data lake contains customer records, When Presidio analyzer runs, Then PII entities (NI, DOB, postcode) are tagged with 95%+ precision',
    'Given analyst without PII clearance queries data, When dynamic masking applied, Then obfuscated values returned preserving analytical utility',
    'Given SAR deletion request received, When processed through workflow, Then customer PII removed from Bronze/Silver/Gold layers within 72 hours'
  ],
  'Customer 360 Data Model': [
    'Given customer holds policy across L&G divisions, When entity resolution runs, Then records link under single golden customer ID with confidence score',
    'Given customer changes address, When update ingested, Then address propagates to 360 view and downstream systems within 1 hour',
    'Given duplicate customer records identified, When merge executed, Then transaction history consolidates preserving audit trail of source records'
  ],
  'Feature Store Implementation': [
    'Given feature is registered in Feast, When ML model requests feature, Then real-time serving returns value in <50ms from Redis cache',
    'Given feature definition changes, When new version deployed, Then model training uses versioned features with point-in-time correctness',
    'Given feature monitoring detects drift, When threshold exceeded, Then alert triggers to data science team with distribution comparison charts'
  ],
  'ML Model Registry': [
    'Given data scientist trains new model, When registered in MLflow, Then model artifacts, metrics, and parameters are versioned and searchable',
    'Given model promoted to production, When deployment triggers, Then A/B traffic split configures champion vs challenger with metrics tracking',
    'Given model performance degrades, When retraining pipeline runs, Then new model version is validated against holdout set before promotion'
  ],
  'Data Mesh Domain Setup': [
    'Given business domain identified, When domain team onboarded, Then domain-specific data products are published to mesh catalog',
    'Given data product SLA is defined, When monitoring enabled, Then freshness and quality metrics are tracked with alerting to domain owner',
    'Given cross-domain data access requested, When approved, Then federated query routes to source domain with access logged'
  ],
  'Self-Service Analytics Portal': [
    'Given business analyst accesses portal, When dataset selected, Then Power BI embedded report loads within 5 seconds with row-level security',
    'Given custom analysis needed, When SQL query submitted, Then results return from Databricks SQL warehouse with cost governance limits applied',
    'Given report is scheduled, When delivery time reached, Then PDF/Excel emailed to distribution list with refresh timestamp'
  ],
  'Data Governance Workflows': [
    'Given sensitive dataset is created, When classification requested, Then data steward workflow initiates with sensitivity assessment form',
    'Given access request submitted, When approved by data owner, Then permissions propagate to Databricks Unity Catalog within 15 minutes',
    'Given retention period expires, When archival job runs, Then data moved to cold storage with metadata retained for compliance'
  ],

  // ========== AI CHATBOT IMPLEMENTATION ==========
  'Intent Classification Model': [
    'Given customer types pension query in natural language, When NLU processes, Then intent is classified with 92%+ accuracy within 2 seconds',
    'Given ambiguous query with multiple possible intents, When confidence below threshold, Then clarification question is generated',
    'Given new intent pattern emerges from conversation logs, When retraining triggered, Then updated model deploys within 48 hours'
  ],
  'LLM Response Generation': [
    'Given customer question matched to intent, When GPT-4 generates response, Then answer is contextually accurate with pension-specific terminology',
    'Given hallucination risk detected, When confidence low, Then response includes caveat and offers human escalation option',
    'Given response generated, When quality scored, Then inappropriate or incorrect responses trigger feedback loop to content team'
  ],
  'Multi-turn Conversation Management': [
    'Given customer is mid-conversation, When context window updated, Then previous exchanges inform current response with slot filling',
    'Given conversation exceeds 10 turns, When summarization triggered, Then key points are extracted to maintain context within token limits',
    'Given customer returns after session timeout, When conversation resumes, Then previous context is restored with recap offered'
  ],
  'Knowledge Base RAG System': [
    'Given pension scheme rules document uploaded, When vector embedding created, Then semantic search returns relevant passages in <500ms',
    'Given customer asks scheme-specific question, When RAG retrieves context, Then answer cites source document section with confidence score',
    'Given document is updated by content team, When re-indexed, Then new content is searchable within 4 hours of publication'
  ],
  'Pension Calculator Widget': [
    'Given member requests retirement projection, When calculator invoked via API, Then illustration uses scheme data with statutory assumptions',
    'Given SMPI illustration required by regulations, When generated, Then PDF includes all FCA-mandated disclosures and assumptions',
    'Given user adjusts retirement age slider, When projection recalculates, Then impact on pension amount updates in real-time'
  ],
  'Human Handoff System': [
    'Given customer explicitly requests human agent, When handoff initiated, Then full conversation transcript transfers to agent CRM',
    'Given chatbot cannot resolve after 3 attempts, When escalation triggers, Then customer is informed of queue position and wait time',
    'Given agent accepts handoff during business hours, When conversation continues, Then agent has full context without requiring customer to repeat'
  ],
  'Compliance Guardrails': [
    'Given customer question approaches regulated financial advice, When boundary detected, Then chatbot explains limitation and offers FCA-regulated adviser referral',
    'Given FCA Consumer Duty guidance updates, When content team refreshes guardrails, Then new rules active within 48 hours',
    'Given compliance audit requested, When conversation logs reviewed, Then triggered guardrails are highlighted with timestamps'
  ],
  'Analytics & Reporting Dashboard': [
    'Given chatbot is live, When metrics dashboard accessed, Then containment rate, CSAT score, and top intents display in real-time',
    'Given unhandled query pattern identified, When flagged for review, Then content team receives weekly digest with resolution recommendations',
    'Given A/B test configured for response variant, When statistically significant winner determined, Then winning variant auto-promotes'
  ],
  'Web Widget Deployment': [
    'Given website integration required, When widget script embedded, Then chatbot loads within 2 seconds with consistent styling',
    'Given mobile browser detected, When widget rendered, Then responsive design provides optimal touch experience',
    'Given widget loads on authenticated page, When session context passed, Then personalized greeting uses customer name'
  ],
  'IVR Integration': [
    'Given customer calls contact centre, When IVR dialogue triggered, Then voice recognition accuracy exceeds 85% for common pension queries',
    'Given speech-to-text transcribes query, When intent matched, Then automated response plays with option to transfer to human agent',
    'Given call quality degrades, When audio issues detected, Then graceful fallback offers callback option'
  ],
  'Mobile SDK Integration': [
    'Given mobile app integrates chatbot SDK, When user taps chat icon, Then conversation interface loads natively within 1 second',
    'Given push notification about pension update received, When user responds via chat, Then context includes notification reference',
    'Given app is offline, When chat attempted, Then queued messages sync when connectivity restored'
  ],
  'Document Ingestion Pipeline': [
    'Given PDF pension document uploaded, When OCR and parsing complete, Then structured data extracted with 95%+ accuracy',
    'Given document contains tables and charts, When processed, Then tabular data is queryable and charts summarized in text',
    'Given document language is Welsh, When language detected, Then appropriate language model processes content'
  ],

  // ========== BUILD TO RENT OPERATING PLATFORM ==========
  'Property Listings': [
    'Given property becomes available for letting, When listing created, Then professional photos, floor plans, and virtual tour publish to portal within 24 hours',
    'Given prospect inquires about listing, When lead captured, Then automated response with viewing booking link sent within 2 hours',
    'Given listing updated (price, availability), When saved, Then Rightmove/Zoopla syndication reflects changes within 4 hours'
  ],
  'Application Processing': [
    'Given prospective tenant completes application, When ID document uploaded, Then biometric liveness check completes in under 60 seconds',
    'Given affordability assessment required, When Open Banking connection established, Then 30x rent income verification runs automatically',
    'Given all checks pass, When approval granted, Then AST contract with property-specific terms generates for e-signature'
  ],
  'Referencing Integration': [
    'Given tenant referencing initiated, When request sent to provider, Then credit check, employment verification, and previous landlord reference return within 48 hours',
    'Given referencing returns adverse indicator, When guarantor required, Then guarantor application workflow triggers automatically',
    'Given all references satisfactory, When passed, Then move-in workflow initiates with key collection slot scheduling'
  ],
  'Tenancy Agreement Generation': [
    'Given tenancy is approved, When AST generated, Then all prescribed information per Housing Act 1988/2004 is included',
    'Given deposit amount calculated, When protected with TDS, Then protection certificate auto-attaches to tenant portal',
    'Given tenant e-signs agreement, When landlord countersigns, Then fully executed copy stores in DMS with 7-year retention'
  ],
  'Work Order System': [
    'Given tenant reports emergency (leak/heating failure), When work order created, Then contractor dispatched within 4-hour emergency SLA',
    'Given contractor completes repair, When photos and notes uploaded, Then tenant receives completion notification with satisfaction survey',
    'Given same issue reported 3 times for same unit, When pattern detected, Then property manager escalation flags potential major works requirement'
  ],
  'Contractor Management': [
    'Given contractor is onboarded, When compliance check runs, Then public liability insurance, gas safe certificate, and DBS are verified',
    'Given contractor misses SLA, When 24 hours elapsed, Then automated penalty calculation triggers with operations team notification',
    'Given contractor invoice submitted, When validated against work order details, Then payment schedules per agreed terms'
  ],
  'Rent Collection': [
    'Given rent due date is 1st of month, When Direct Debit collected, Then payment posts to property accounting ledger with automated receipt to tenant',
    'Given Direct Debit fails, When arrears status begins, Then SMS and email reminder sent with payment link and hardship support info',
    'Given 7 days arrears threshold reached, When case escalated, Then dedicated arrears officer assigned with full tenant payment history'
  ],
  'Arrears Management': [
    'Given arrears exceed $500, When payment plan workflow triggers, Then tenant is offered structured repayment options via portal',
    'Given payment plan agreed and signed, When schedule activated, Then automated collections adjust to plan installments',
    'Given pre-action protocol threshold reached (8 weeks arrears), When legal process initiates, Then compliant Section 8 notice pack generates'
  ],
  'Building Access Control': [
    'Given tenant moves in, When access credentials provisioned, Then fob/app unlocks apartment, parking bay, and amenities per entitlement',
    'Given tenant requests guest access, When temporary code generated, Then access valid for specified hours with visitor log entry',
    'Given lease ends, When tenant checks out, Then all access credentials deactivate within 1 hour of lease termination'
  ],
  'Move-in/Move-out Inspections': [
    'Given move-in scheduled, When inventory inspection conducted, Then photo evidence of each room captured with standardized condition rating',
    'Given move-out inspection finds damage beyond fair wear, When assessed, Then deposit deduction calculated with itemized breakdown',
    'Given inventory comparison complete, When report finalized, Then tenant receives copy within 7 days with dispute window'
  ],
  'Community Engagement': [
    'Given resident event planned, When invitations distributed via app, Then RSVP tracking enables capacity management',
    'Given tenant requests amenity booking, When availability checked, Then gym/cinema/workspace slot reserved with QR code access',
    'Given quarterly satisfaction survey distributed, When responses analyzed, Then NPS trends display per building with action items'
  ],

  // ========== BULK ANNUITY PRICING ENGINE ==========
  'Bloomberg B-PIPE Integration': [
    'Given UK gilt market is open, When yield curve requested, Then data is <5 seconds stale with sub-second API response time',
    'Given Bloomberg feed experiences outage, When automatic failover triggers, Then Reuters backup activates with audit log of data source switch',
    'Given quote is generated using market data, When audit trail requested, Then exact timestamp and value of each rate used is retrievable for regulatory purposes'
  ],
  'Credit Spread Curve Builder': [
    'Given issuer has investment-grade rating, When credit curve built, Then spreads interpolate across 1-50 year tenors using Nelson-Siegel-Svensson model',
    'Given new corporate bond trades in secondary market, When price observed, Then curve recalibrates within 1 hour incorporating latest data point',
    'Given odd maturity tenor requested (e.g., 17.5 years), When interpolation applied, Then cubic spline provides arbitrage-free smooth transition'
  ],
  'Swap Rate Integration': [
    'Given interest rate swap tenor selected, When live rate queried, Then ICE mid-market rate returned with bid-offer spread in <100ms',
    'Given historical swap rate analysis needed, When 10-year lookback requested, Then intraday granularity time series is available',
    'Given cross-currency basis swap adjustment required, When SOFR-SONIA basis applied, Then spread adjustment is correctly incorporated'
  ],
  'Historical Deal Data Pipeline': [
    'Given 10+ years of closed BPA deals exist, When data cleaned and standardized, Then 2,500+ deals available for ML training with consistent feature encoding',
    'Given data quality issue identified (e.g., missing scheme size), When flagged, Then manual review queue receives case with specific field highlighted',
    'Given new deal closes successfully, When deal data ingested, Then ML model retraining pipeline triggers within 24 hours'
  ],
  'Win Probability Model': [
    'Given deal parameters (scheme size, duration, sponsor strength) entered, When XGBoost model predicts, Then win probability 0-100% returned with 90% confidence interval',
    'Given prediction made and deal outcome later known, When accuracy tracked, Then Brier score and calibration curve update for ongoing validation',
    'Given macro market conditions shift significantly, When model retrained on recent data, Then performance improvement validated on temporal holdout set'
  ],
  'Optimal Pricing Recommendation': [
    'Given target margin and win probability trade-off defined, When optimization runs, Then price recommendation range balances profitability with competitive positioning',
    'Given competitive intelligence on rival insurer pricing available, When incorporated, Then recommendations adjust based on expected competitor behavior',
    'Given pricing recommendation reviewed by actuary, When rationale requested, Then SHAP values explain contribution of each feature to suggested price'
  ],
  'Quote Generation Engine': [
    'Given liability cashflows uploaded for 10,000 members, When pricing engine invoked, Then quote generation completes in under 60 seconds',
    'Given market conditions change mid-morning, When re-quote triggered, Then updated price reflects latest gilt yields and credit spreads',
    'Given final quote approved, When documentation packaged, Then full assumptions breakdown and sensitivity tables are audit-ready for trustee board'
  ],
  'Model Explainability Dashboard': [
    'Given ML pricing model makes recommendation, When explainability requested, Then feature importance and SHAP waterfall charts display',
    'Given model governance review is due, When documentation generated, Then model card with training data summary, performance metrics, and limitations is produced',
    'Given prediction significantly differs from actuarial judgement, When investigated, Then model factors driving deviation are clearly identified'
  ],
  'Sensitivity Analysis Tools': [
    'Given base case quote is generated, When sensitivity analysis initiated, Then impact of +/-50bps gilt yield shift is calculated and displayed',
    'Given mortality improvement assumption varied, When scenario runs, Then liability impact in $m is quantified with chart',
    'Given multiple scenarios requested for stress testing, When batch processed, Then comparison table with tornado diagram is generated'
  ],

  // ========== ESG ANALYTICS DASHBOARD ==========
  'MSCI ESG Ratings Integration': [
    'Given MSCI publishes daily ESG rating update, When feed processed overnight, Then updated ratings reflect in portfolio scores by market open',
    'Given portfolio contains 500+ securities, When MSCI coverage analyzed, Then percentage covered and gaps by sector are reported with fallback recommendations',
    'Given MSCI methodology version changes annually, When new methodology released, Then recalibration impact analysis available within 1 week of publication'
  ],
  'Sustainalytics Risk Scores': [
    'Given company experiences ESG controversy, When Sustainalytics updates incident severity, Then alert triggers to portfolio managers with holdings exposure quantified',
    'Given company ESG Risk Rating deteriorates to High category, When threshold breach detected, Then watchlist notification includes controversy details and recommended engagement actions',
    'Given controversy status changes from ongoing to resolved, When database updated, Then historical controversy timeline displays full lifecycle with ESG score recovery tracking'
  ],
  'Climate Data Pipeline': [
    'Given CDP releases annual climate questionnaire responses, When data ingested, Then company climate scores available in platform within 48 hours of publication',
    'Given company reports Scope 1/2/3 GHG emissions, When data normalized to tCO2e per $m revenue, Then peer comparison across GICS sectors is enabled',
    'Given company sets or achieves SBTi-validated target, When SBTi database syncs, Then Net Zero commitment status reflects current validation within 1 week'
  ],
  'SFDR PAI Reporting': [
    'Given Article 8 fund is selected for PAI disclosure, When report generates, Then all 18 mandatory Principal Adverse Impact indicators calculated with data coverage % displayed',
    'Given PAI data gaps exist for specific holdings, When estimation methodology applied, Then estimation approach and confidence level disclosed per SFDR RTS requirements',
    'Given PAI indicator values calculated, When benchmarked against peer funds, Then relative performance displays with traffic light (green/amber/red) status'
  ],
  'EU Taxonomy Alignment Engine': [
    'Given company discloses Taxonomy-eligible economic activities, When alignment assessed, Then Do No Significant Harm criteria status shown for each of 6 environmental objectives',
    'Given company Taxonomy disclosure is incomplete or estimated, When alignment calculated, Then estimation methodology and data sources are clearly disclosed',
    'Given EU Taxonomy Delegated Acts are updated, When regulatory change implemented, Then technical screening criteria reflect new thresholds within 2 months of publication'
  ],
  'Portfolio Carbon Calculator': [
    'Given portfolio holdings with weights provided, When WACI calculated, Then weighted average carbon intensity (tCO2e per $m invested) displayed with sector attribution',
    'Given Net Zero 2050 target commitment exists, When decarbonization trajectory modeled, Then year-by-year interim target pathway with current position vs trajectory shown',
    'Given carbon attribution drill-down requested, When analysis runs, Then top 10 carbon contributors by absolute financed emissions identified with engagement priority ranking'
  ],
  'TCFD Scenario Analysis': [
    'Given NGFS climate scenarios (orderly/disorderly/hot house) selected, When portfolio stress test runs, Then value at risk impact quantified in $m across time horizons',
    'Given physical risk assessment needed for real assets, When geocoding and climate hazard mapping complete, Then flood/wildfire/heat stress scores display at asset level',
    'Given transition risk from carbon pricing modeled, When carbon price pathway (e.g., IEA Net Zero) applied, Then stranded asset exposure calculated for fossil fuel holdings'
  ],

  // ========== PROTECTION PRODUCT DIGITIZATION ==========
  'Product Selector': [
    'Given customer answers lifestyle and protection needs questions, When recommendation engine runs, Then suitable life/CI/IP products ranked with coverage rationale explained',
    'Given customer specifies monthly budget constraint, When products filtered, Then affordable alternatives presented with coverage trade-off explanations',
    'Given customer discloses dependents and mortgage, When sum assured calculated, Then recommendation accounts for income replacement and debt clearance needs'
  ],
  'Quote Engine': [
    'Given customer enters personal details and coverage requirements, When quote calculation runs, Then premium displays within 5 seconds with breakdown by cover type',
    'Given customer discloses smoker status or elevated BMI, When rating factors applied, Then premium loading is explained with potential wellness discount opportunities',
    'Given customer saves quote for later, When returning within 30 days, Then quote is retrievable with option to refresh rates to current market'
  ],
  'Underwriting Rules Engine': [
    'Given application submitted through digital journey, When underwriting rules evaluate, Then 65%+ of applications receive straight-through processing decision without referral',
    'Given medical condition is disclosed (e.g., diabetes), When decision tree logic followed, Then appropriate outcome (accept/load/exclude/decline) is automated per underwriting manual',
    'Given edge case triggers referral to human underwriter, When case appears in queue, Then pre-populated risk assessment summary and recommended decision are displayed'
  ],
  'Medical Evidence Gateway': [
    'Given GP report is required for disclosed condition, When eMRO electronic request sent, Then medical records received and parsed within average 10 business days',
    'Given tele-underwriting interview needed, When scheduled, Then customer books convenient time slot via SMS booking link',
    'Given all medical evidence reviewed by underwriter, When final decision made, Then decision letter with clear explanation sent to customer within 48 hours'
  ],
  'Policy Issuance': [
    'Given application is approved and premium paid, When policy documents generated, Then policy schedule, terms and conditions, and key facts document available in secure portal',
    'Given customer requests mid-term alteration, When change processed, Then premium recalculates with pro-rata adjustment and amended schedule issued',
    'Given annual renewal date approaches, When renewal notice sent, Then customer can confirm continuation, adjust cover, or cancel online without phone call'
  ],
  'Claims Journey': [
    'Given claim is initiated via portal or phone, When FNOL received and logged, Then acknowledgment with expected timeline sent within 2 hours',
    'Given supporting evidence documents uploaded, When claims assessor reviews, Then decision made within 5 business days for straightforward claims',
    'Given claim is approved for payment, When funds released, Then payment reaches claimant bank account within 3 business days with confirmation notification'
  ],

  // ========== PRT INTAKE SYSTEM ==========
  'Multi-Format Parser': [
    'Given pension scheme provides member data in Excel format, When file uploaded, Then 50,000+ records parsed within 5 minutes with field-level validation report',
    'Given scheme uses legacy proprietary column headers, When intelligent mapping runs, Then field suggestions achieve 90%+ accuracy with manual override option',
    'Given file contains duplicate National Insurance numbers, When duplicates detected, Then records flagged with merge/split decision workflow'
  ],
  'Data Validation Rules': [
    'Given member data batch is ingested, When 200+ validation rules execute, Then errors categorized (critical/warning/info) with correction guidance per field',
    'Given NI number format validation fails, When error displayed, Then correct format example and common mistakes are shown',
    'Given benefit calculation validation detects discrepancy, When flagged, Then expected vs actual values displayed with calculation breakdown'
  ],
  'Data Cleansing Workflows': [
    'Given multiple validation errors exist, When cleansing UI accessed, Then batch editing allows simultaneous correction of common error patterns',
    'Given address is incomplete, When Royal Mail PAF lookup triggered, Then address auto-completes from postcode with UPRN validation',
    'Given cleansing session complete, When sign-off requested, Then audit trail captures all changes with user attribution and timestamp'
  ],
  'GMP Calculation Engine': [
    'Given member has Guaranteed Minimum Pension entitlement, When GMP calculated at payment age, Then correct revaluation method (fixed rate 6.25%/S148 orders) applied based on leaving date',
    'Given HMRC GMP reconciliation required, When Contracted-Out Deduction statement received, Then variance report generated with explanation codes per discrepancy type',
    'Given GMP equalisation applies following Lloyds ruling, When conversion method selected (C2 or dual record), Then calculation implements methodology per actuarial guidance'
  ],
  'Pension Increase Engine': [
    'Given pension in payment has RPI-linked increases, When annual increase date arrives, Then increase calculated using ONS published September RPI index',
    'Given scheme rules specify LPI 0-5% cap and collar, When inflation exceeds 5%, Then pension increase correctly capped with excess carried forward if rules permit',
    'Given member has multiple benefit tranches with different increase rules, When annual increase runs, Then each tranche increases separately per applicable scheme rules'
  ],
  'Cashflow Projection Engine': [
    'Given member data is cleansed and validated, When cashflow generation runs, Then monthly benefit projections calculated for 70+ years based on mortality assumptions',
    'Given mortality basis is CMI_2022, When survival probabilities applied, Then scheme-specific mortality adjustments and long-term improvement rate incorporated',
    'Given spouse reversionary benefits apply, When calculated, Then contingent spouse pensions modeled using age difference and reversion percentage assumptions'
  ],
  'Real-time Quote Integration': [
    'Given liability cashflows generated for scheme, When pricing API invoked, Then quote response returns within 60 seconds for 10,000 member scheme',
    'Given gilt yields move significantly during bidding window, When re-quote requested, Then updated price reflects current market conditions',
    'Given quote is finalized for trustee review, When documentation requested, Then full methodology, assumptions, and sensitivity analysis delivered in standardized format'
  ],

  // ========== REMAINING TEMPLATES WITH CONTEXTUAL CRITERIA ==========
  // Climate Transition Analytics
  'Climate Scenario Engine': [
    'Given NGFS climate scenario is selected, When portfolio analyzed, Then asset-level impact quantified across 2030/2040/2050 time horizons in $m value at risk',
    'Given orderly vs disorderly transition pathways compared, When results displayed, Then differential impact on fossil fuel vs clean energy holdings is clear',
    'Given scenario assumptions updated by NGFS, When new scenario version released, Then platform incorporates updated parameters within 1 month'
  ],
  'Physical Risk Assessment': [
    'Given real asset portfolio geocoded, When climate hazard layers applied, Then flood/wildfire/heat/water stress scores display at individual property level',
    'Given asset-level risk score is high, When drill-down requested, Then specific climate hazards and adaptation recommendations are provided',
    'Given physical risk aggregated across portfolio, When reported, Then VaR contribution from physical risk is quantified vs transition risk'
  ],
  'Transition Pathway Tracker': [
    'Given company publishes Net Zero commitment, When tracked, Then interim targets and progress milestones are monitored with alerts on missed targets',
    'Given sector decarbonization pathway defined, When company compared, Then alignment vs Paris-aligned trajectory is scored',
    'Given company transition plan is published, When assessed, Then credibility scoring reflects CapEx commitment and technology roadmap'
  ],
  
  // Investment Research AI
  'Earnings Call Summarizer': [
    'Given company earnings call transcript available, When AI summarization runs, Then key themes, sentiment, and forward guidance are extracted with source citations',
    'Given management commentary on strategy shifts, When analyzed, Then investment implications are highlighted for analyst review',
    'Given multiple earnings calls in same sector, When comparative analysis requested, Then sector-wide themes and outliers are identified'
  ],
  'Fundamental Analysis Engine': [
    'Given company financial statements filed, When DCF valuation runs, Then fair value estimate generated with explicit assumptions and sensitivity tables',
    'Given peer group defined, When multiples comparison generated, Then relative valuation position (premium/discount) is explained with key drivers',
    'Given model updated with new quarterly data, When re-run, Then changes from previous estimate are highlighted with driver attribution'
  ],
  'Research Note Generator': [
    'Given analyst completes company analysis, When report generated, Then MiFID II compliant research note with disclosures and disclaimers is produced',
    'Given target price and rating change, When published, Then previous target and rating history are displayed with date of changes',
    'Given research is distributed to clients, When access logged, Then consumption tracking enables research budget allocation per MiFID II unbundling'
  ]
};

async function applyCompleteCriteria() {
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  console.log(`Applying comprehensive story-specific criteria to ${files.length} templates...\n`);

  let totalStoriesUpdated = 0;
  let storiesWithBespokeCriteria = 0;

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    let fileStoriesUpdated = 0;
    let fileBespokeCriteria = 0;
    
    if (content.features) {
      content.features = content.features.map((feature: any) => {
        if (feature.stories) {
          feature.stories = feature.stories.map((story: any) => {
            const storyName = story.name;
            
            if (allStoryCriteria[storyName]) {
              fileBespokeCriteria++;
              storiesWithBespokeCriteria++;
              story.acceptanceCriteria = allStoryCriteria[storyName];
            } else {
              story.acceptanceCriteria = generateDomainCriteria(storyName, content.bu, content.division);
            }
            
            fileStoriesUpdated++;
            totalStoriesUpdated++;
            return story;
          });
        }
        return feature;
      });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    const percentage = fileStoriesUpdated > 0 ? Math.round((fileBespokeCriteria / fileStoriesUpdated) * 100) : 0;
    console.log(`✓ ${file}: ${fileBespokeCriteria}/${fileStoriesUpdated} bespoke (${percentage}%)`);
  }

  const overallPercentage = Math.round((storiesWithBespokeCriteria / totalStoriesUpdated) * 100);
  console.log(`\n=== Summary ===`);
  console.log(`Total stories: ${totalStoriesUpdated}`);
  console.log(`Bespoke criteria: ${storiesWithBespokeCriteria} (${overallPercentage}%)`);
  console.log(`Contextual criteria: ${totalStoriesUpdated - storiesWithBespokeCriteria}`);
}

function generateDomainCriteria(storyName: string, bu: string, division: string): string[] {
  const domain = (division + ' ' + bu).toLowerCase();
  const nameLower = storyName.toLowerCase();
  
  // Generate highly specific criteria based on domain and story name
  if (domain.includes('retirement') || domain.includes('pension') || domain.includes('lgr')) {
    if (nameLower.includes('calculation') || nameLower.includes('benefit') || nameLower.includes('projection')) {
      return [
        `Given ${storyName} is initiated for pension scheme, When actuarial assumptions applied, Then results comply with TPR and FCA regulatory standards`,
        `Given calculation parameters are set, When processing completes, Then member-level outputs are validated against expected ranges with variance reporting`,
        `Given scheme-specific rules apply, When overrides configured, Then custom calculation logic reflects scheme deed amendments`
      ];
    }
    if (nameLower.includes('data') || nameLower.includes('member') || nameLower.includes('scheme')) {
      return [
        `Given ${storyName} receives pension scheme data, When validation runs, Then records comply with Pensions Dashboard Programme data standards`,
        `Given data quality issues identified, When cleansing workflow triggered, Then corrections are tracked with full audit trail for TPR compliance`,
        `Given GDPR SAR request received, When member data extracted, Then complete records provided within statutory 30-day deadline`
      ];
    }
  }
  
  if (domain.includes('lgim') || domain.includes('investment')) {
    if (nameLower.includes('esg') || nameLower.includes('climate') || nameLower.includes('carbon')) {
      return [
        `Given ${storyName} processes ESG data, When SFDR reporting triggered, Then Article 8/9 fund disclosures meet regulatory requirements`,
        `Given climate metrics calculated, When TCFD alignment assessed, Then portfolio temperature alignment score is generated`,
        `Given ESG data gaps exist, When estimation applied, Then methodology disclosure meets FCA sustainability labelling requirements`
      ];
    }
    if (nameLower.includes('portfolio') || nameLower.includes('fund') || nameLower.includes('mandate')) {
      return [
        `Given ${storyName} for client mandate, When performance calculated, Then GIPS-compliant returns are generated with benchmark comparison`,
        `Given client reporting period ends, When factsheet generated, Then MiFID II cost disclosures and ESG metrics are included`,
        `Given portfolio rebalancing triggered, When trades executed, Then best execution documentation is maintained per FCA requirements`
      ];
    }
  }
  
  if (domain.includes('housing') || domain.includes('property') || domain.includes('btr')) {
    if (nameLower.includes('tenant') || nameLower.includes('rent') || nameLower.includes('lettings')) {
      return [
        `Given ${storyName} for BTR property, When tenancy created, Then AST complies with Housing Act 2004 and Renters Reform requirements`,
        `Given rent collection processed, When arrears detected, Then pre-action protocol compliant process initiates within regulatory timeframes`,
        `Given tenant raises complaint, When logged, Then response provided within 14 days per Redress Scheme requirements`
      ];
    }
    if (nameLower.includes('maintenance') || nameLower.includes('repair') || nameLower.includes('asset')) {
      return [
        `Given ${storyName} for property portfolio, When maintenance required, Then response SLA meets HHSRS Category 1 hazard requirements`,
        `Given gas safety check due, When scheduled, Then CP12 certificate obtained before annual expiry with tenant notification`,
        `Given EPC rating below target, When retrofit assessed, Then upgrade pathway aligns with MEES 2028 compliance requirements`
      ];
    }
  }
  
  if (domain.includes('insurance') || domain.includes('protection')) {
    if (nameLower.includes('underwriting') || nameLower.includes('risk') || nameLower.includes('quote')) {
      return [
        `Given ${storyName} for protection application, When risk assessed, Then underwriting decision aligns with treating customers fairly (TCF) principles`,
        `Given medical disclosure made, When evidence reviewed, Then decision timeline meets FCA DISP complaint handling requirements`,
        `Given premium calculated, When disclosed to customer, Then Consumer Duty fair value assessment is documented`
      ];
    }
    if (nameLower.includes('claim') || nameLower.includes('settlement') || nameLower.includes('payment')) {
      return [
        `Given ${storyName} for protection claim, When assessed, Then decision made within published claim handling SLA`,
        `Given claim declined, When communicated, Then clear explanation and complaints process information provided per FCA requirements`,
        `Given settlement approved, When paid, Then funds reach beneficiary within 3 business days of approval`
      ];
    }
  }
  
  // Default domain-aware criteria
  return [
    `Given ${storyName} is executed, When all validations pass, Then processing completes within defined SLA with full audit trail`,
    `Given business rules apply, When evaluated, Then outcomes align with regulatory requirements and internal policies`,
    `Given exception occurs, When handled, Then appropriate escalation and notification processes are triggered`
  ];
}

applyCompleteCriteria().catch(console.error);
