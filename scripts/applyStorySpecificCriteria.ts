import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(process.cwd(), 'attached_assets', 'project_templates');

const storySpecificCriteria: Record<string, string[]> = {
  // Enterprise Data Platform
  'Azure ADLS Gen2 Infrastructure Setup': [
    'Given infrastructure-as-code is executed, When Terraform applies successfully, Then ADLS Gen2 containers are provisioned with RBAC policies in under 30 minutes',
    'Given storage accounts are created, When hierarchical namespace is enabled, Then Delta Lake tables can be written with ACID transactions',
    'Given disaster recovery is configured, When primary region fails, Then data is accessible from paired region within RPO of 1 hour'
  ],
  'Delta Lake Table Implementation': [
    'Given raw data is ingested, When Delta format is applied, Then time travel queries retrieve data from any point in last 90 days',
    'Given concurrent writes occur, When ACID transactions complete, Then data integrity is maintained with no lost updates',
    'Given schema evolution is needed, When new columns added, Then existing queries continue to work with graceful null handling'
  ],
  'Source System Connectors': [
    'Given 47 source systems identified, When connectors deployed, Then each system is ingested on defined schedule with monitoring alerts',
    'Given source system is unavailable, When retry exhausted, Then alerting triggers and last successful data is retained',
    'Given new source onboarding requested, When template applied, Then connectivity is established within 2 weeks'
  ],
  'Data Quality Rules Engine': [
    'Given data quality rules defined, When validation executes, Then DQ score per dataset is published to catalog with drill-down to failed records',
    'Given DQ threshold breached, When alert triggers, Then data steward is notified with root cause analysis',
    'Given new DQ rule required, When configured, Then rule applies to next ingestion without code deployment'
  ],
  'Purview Catalog Integration': [
    'Given dataset is onboarded, When metadata harvested, Then lineage from source to consumption is visible in Azure Purview',
    'Given business user searches catalog, When query submitted, Then relevant datasets returned with data owner and sensitivity classification',
    'Given glossary term updated, When linked to datasets, Then business context propagates to all downstream reports'
  ],
  'PII Detection Service': [
    'Given data contains PII, When ML classifier runs, Then sensitive columns are tagged with 95%+ precision within 24 hours',
    'Given PII is detected, When non-authorized user queries, Then dynamic masking returns obfuscated values',
    'Given GDPR deletion request received, When processed, Then PII is removed from all layers within 72 hours'
  ],
  'Customer 360 Data Model': [
    'Given customer has multiple policies, When 360 view queried, Then all policies, claims, interactions are consolidated under single ID',
    'Given name/address variations exist, When entity resolution runs, Then 98%+ match accuracy links duplicate records',
    'Given customer preference changes, When updated, Then preference propagates to all applications within 1 hour'
  ],
  'Feature Store Implementation': [
    'Given feature store contains customer features, When ML model requests features, Then real-time serving returns features in <100ms',
    'Given new model version deployed, When A/B test runs, Then champion/challenger metrics are tracked with statistical significance',
    'Given model drift detected, When threshold breached, Then automated retraining pipeline triggers with approval workflow'
  ],
  
  // AI Chatbot Implementation
  'Intent Classification Model': [
    'Given customer types pension query, When NLU processes, Then intent is classified with 92%+ accuracy within 2 seconds',
    'Given ambiguous query received, When clarification needed, Then bot asks focused follow-up question without frustrating loops',
    'Given profanity or abuse detected, When sentiment negative, Then escalation to human agent triggers with context preserved'
  ],
  'LLM Response Generation': [
    'Given customer question understood, When LLM generates response, Then answer is contextually relevant and factually accurate',
    'Given complex pension query, When knowledge base searched, Then response synthesizes multiple sources with confidence score',
    'Given response generation fails, When fallback triggers, Then helpful message directs customer to alternative support channels'
  ],
  'Multi-turn Conversation Management': [
    'Given customer is in multi-turn conversation, When context tracked, Then previous exchanges inform current responses',
    'Given customer changes topic mid-conversation, When detected, Then context switches appropriately without losing prior information',
    'Given session times out, When customer returns, Then conversation summary allows resumption'
  ],
  'Knowledge Base RAG System': [
    'Given pension scheme document uploaded, When indexed, Then vector embeddings enable semantic search across 10,000+ pages',
    'Given customer asks scheme-specific question, When RAG retrieves, Then answer cites source document with page number',
    'Given document is updated, When re-indexed, Then new content is searchable within 4 hours'
  ],
  'Pension Calculator Widget': [
    'Given member requests retirement projection, When calculator invoked, Then illustration uses actual scheme data with statutory assumptions',
    'Given SMPI illustration required, When generated, Then PDF download includes required FCA disclosures',
    'Given projection parameters changed, When recalculated, Then comparison shows impact of different retirement ages'
  ],
  'Human Handoff System': [
    'Given customer requests human agent, When handoff triggered, Then full conversation transcript is passed to agent',
    'Given chatbot cannot resolve query, When escalation needed, Then customer is informed of wait time and queue position',
    'Given agent accepts handoff, When conversation continues, Then agent has full context without customer repeating'
  ],
  'Compliance Guardrails': [
    'Given question approaches regulated advice, When boundary detected, Then chatbot explains limitation and offers adviser referral',
    'Given FCA regulatory update occurs, When content refreshed, Then guardrails reflect new guidance within 48 hours',
    'Given conversation is audited, When compliance reviews, Then full transcript with triggered guardrails is available'
  ],
  'Analytics & Reporting Dashboard': [
    'Given chatbot deployed, When metrics tracked, Then containment rate, CSAT, and intent distribution are shown real-time',
    'Given conversation fails to resolve, When flagged, Then unhandled queries are routed to content team for knowledge gap analysis',
    'Given A/B test runs on response, When winner determined, Then optimal response variant is promoted automatically'
  ],
  
  // Build to Rent Operating Platform
  'Property Listings': [
    'Given property becomes available, When listing created, Then photos, floor plans, and virtual tour are published to portal within 24 hours',
    'Given prospect inquires about listing, When lead captured, Then automated response with viewing booking link is sent within 2 hours',
    'Given listing is updated, When changes saved, Then all syndication channels (Rightmove, Zoopla) reflect updates within 4 hours'
  ],
  'Application Processing': [
    'Given prospective tenant starts application, When ID uploaded, Then biometric verification completes in under 60 seconds',
    'Given affordability check required, When Open Banking connected, Then income verification confirms 30x rent threshold automatically',
    'Given application approved, When contract generated, Then AST with property-specific terms is ready for e-signature'
  ],
  'Referencing Integration': [
    'Given tenant referencing required, When submitted to provider, Then credit check, employment verification, and landlord reference complete within 48 hours',
    'Given referencing fails criteria, When adverse found, Then guarantor request workflow is triggered automatically',
    'Given referencing is complete, When passed, Then move-in workflow is initiated with key collection scheduling'
  ],
  'Tenancy Agreement Generation': [
    'Given tenancy approved, When AST generated, Then all prescribed information and required clauses are included per Housing Act',
    'Given deposit protected, When certificate issued, Then proof of protection is automatically attached to tenant portal',
    'Given tenant signs agreement, When completed, Then countersigned copy is stored in document management with audit trail'
  ],
  'Work Order System': [
    'Given tenant reports leak, When ticket created, Then emergency SLA (4-hour response) is auto-assigned to approved contractor',
    'Given contractor completes work, When photos uploaded, Then tenant is notified and satisfaction survey is triggered',
    'Given repeat issue for same unit, When pattern detected, Then escalation to property manager flags potential major repair'
  ],
  'Contractor Management': [
    'Given contractor is onboarded, When compliance checked, Then insurance, gas safe, and DBS certifications are verified and tracked',
    'Given contractor SLA is breached, When detected, Then automated penalty calculation and escalation is triggered',
    'Given invoice submitted, When validated against work order, Then payment is processed within agreed terms'
  ],
  'Rent Collection': [
    'Given rent due date arrives, When Direct Debit collected, Then payment posts to property ledger with automatic receipt to tenant',
    'Given payment fails, When arrears begins, Then SMS/email reminder triggers with hardship support information',
    'Given 7 days arrears, When escalation runs, Then case manager is assigned with tenant contact history'
  ],
  'Arrears Management': [
    'Given arrears reach threshold, When workflow triggers, Then structured payment plan options are presented to tenant',
    'Given payment plan agreed, When documented, Then automated collection adjusts to plan schedule',
    'Given legal action threshold reached, When pre-action protocol initiated, Then compliant documentation pack is generated'
  ],
  
  // Bulk Annuity Pricing Engine
  'Bloomberg B-PIPE Integration': [
    'Given trading desk is active, When gilt yield requested, Then data is less than 5 seconds stale with sub-second response',
    'Given Bloomberg feed experiences outage, When failover triggers, Then Reuters backup is used seamlessly with audit log',
    'Given quote is generated, When audit trail requested, Then exact timestamp and value of each market rate is retrievable'
  ],
  'Credit Spread Curve Builder': [
    'Given issuer credit rating available, When curve built, Then spreads are interpolated for 1-50 year tenors using Nelson-Siegel',
    'Given new corporate bond trades, When price observed, Then curve recalibrates within 1 hour',
    'Given curve query at off-market tenor, When interpolation needed, Then cubic spline provides smooth transition'
  ],
  'Swap Rate Integration': [
    'Given interest rate swap tenor selected, When live rate queried, Then mid-market rate from ICE is returned with bid-offer spread',
    'Given historical analysis needed, When 10-year lookback requested, Then time series data is available with intraday granularity',
    'Given basis swap adjustment required, When cross-currency swap referenced, Then SOFR-SONIA basis is correctly applied'
  ],
  'Historical Deal Data Pipeline': [
    'Given 10+ years of closed deals exist, When data cleaned, Then 2,500+ deals are available for ML training',
    'Given data quality issue detected, When flagged, Then manual review queue receives case with specific concern highlighted',
    'Given new deal closes, When ingested, Then model retraining pipeline triggers within 24 hours'
  ],
  'Win Probability Model': [
    'Given deal parameters entered, When model predicts, Then win probability is 0-100% with 90% confidence interval',
    'Given prediction is made, When deal outcome known, Then accuracy tracking updates with Brier score',
    'Given market conditions shift, When model retrained, Then performance improvement is validated on holdout test set'
  ],
  'Optimal Pricing Recommendation': [
    'Given target margin defined, When optimization runs, Then price recommendation balances win probability with profitability',
    'Given competitive intelligence available, When incorporated, Then recommendations adjust based on expected competitor behavior',
    'Given recommendation reviewed, When rationale requested, Then SHAP values explain feature contributions'
  ],
  'Quote Generation Engine': [
    'Given pricing actuary initiates quote, When cashflows loaded, Then quote completes in under 60 seconds for 10,000 members',
    'Given market conditions change, When re-quote triggered, Then new price reflects updated yields and spreads',
    'Given quote finalized, When packaged, Then full assumptions breakdown is available for trustee presentation'
  ],
  'Model Explainability Dashboard': [
    'Given ML model makes prediction, When explanation requested, Then feature importance and SHAP values are displayed',
    'Given model governance review due, When documentation generated, Then model card with performance metrics is produced',
    'Given model drift detected, When alert triggers, Then data science team is notified with drift diagnostics'
  ],
  'Sensitivity Analysis Tools': [
    'Given base quote generated, When sensitivity analysis run, Then impact of +/-50bps yield shift is calculated',
    'Given mortality assumption varied, When scenario applied, Then liability impact is quantified',
    'Given multiple scenarios requested, When batch processed, Then comparison table with charts is generated'
  ],
  
  // ESG Analytics Dashboard
  'MSCI ESG Ratings Integration': [
    'Given MSCI ESG rating changes, When daily feed processed, Then updated ratings are reflected by market open next day',
    'Given portfolio contains 500+ securities, When MSCI coverage checked, Then coverage percentage and gaps are reported',
    'Given rating methodology changes, When MSCI publishes update, Then recalibration impact analysis is available within 1 week'
  ],
  'Sustainalytics Risk Scores': [
    'Given company controversy emerges, When Sustainalytics updates, Then alert is triggered to portfolio managers with exposure',
    'Given ESG Risk Rating deteriorates, When threshold breached, Then watchlist notification includes recommended action',
    'Given controversy is resolved, When status updated, Then historical timeline shows full lifecycle'
  ],
  'Climate Data Pipeline': [
    'Given CDP data is released annually, When ingested, Then company climate scores are available within 48 hours',
    'Given Scope 1/2/3 emissions reported, When normalized, Then tCO2e per £m revenue enables peer comparison',
    'Given SBTi target validation updates, When synced, Then company Net Zero commitment status is current'
  ],
  'SFDR PAI Reporting': [
    'Given Article 8 fund selected, When PAI report generated, Then all 18 mandatory indicators calculated with data coverage',
    'Given PAI data gaps exist, When estimation applied, Then methodology and confidence level are disclosed',
    'Given PAI values calculated, When compared to benchmark, Then relative performance is displayed with traffic light'
  ],
  'EU Taxonomy Alignment Engine': [
    'Given company reports Taxonomy-eligible revenue, When alignment assessed, Then DNSH criteria status is shown per objective',
    'Given Taxonomy data is incomplete, When estimated, Then estimation methodology and data sources are disclosed',
    'Given Taxonomy regulation updates, When implemented, Then technical screening criteria are updated within 2 months'
  ],
  'Portfolio Carbon Calculator': [
    'Given portfolio holdings provided, When WACI calculated, Then weighted average carbon intensity is shown in tCO2e/£m',
    'Given Net Zero target set, When trajectory modeled, Then year-by-year decarbonization pathway is displayed',
    'Given carbon attribution analyzed, When drill-down requested, Then top 10 contributors by absolute emissions are identified'
  ],
  'TCFD Scenario Analysis': [
    'Given NGFS climate scenarios selected, When portfolio stress test runs, Then impact on holdings is quantified in £m',
    'Given physical risk assessment requested, When geocoding completes, Then asset-level risk scores are shown',
    'Given transition risk modeled, When carbon price pathway applied, Then stranded asset exposure is calculated'
  ],
  
  // Protection Product Digitization
  'Product Selector': [
    'Given customer answers needs questions, When recommendation runs, Then suitable products are ranked with rationale',
    'Given budget constraint specified, When options filtered, Then affordable alternatives with trade-offs are explained',
    'Given family circumstances disclosed, When dependents identified, Then cover recommendation accounts for mortgage and income'
  ],
  'Quote Engine': [
    'Given personal details entered, When quote calculated, Then premium is displayed within 5 seconds with breakdown',
    'Given smoker status disclosed, When loadings applied, Then premium adjustment is explained with wellness incentives',
    'Given quote saved, When customer returns, Then quote is retrievable for 30 days with option to refresh'
  ],
  'Underwriting Rules Engine': [
    'Given application submitted, When rules evaluate, Then straight-through processing approves 65%+ without referral',
    'Given medical condition disclosed, When decision tree followed, Then appropriate outcome is automated per manual',
    'Given edge case triggers, When referred to underwriter, Then case appears with pre-populated risk assessment'
  ],
  'Medical Evidence Gateway': [
    'Given GP report required, When eMRO request sent, Then record received and parsed within 10 business days',
    'Given tele-interview needed, When scheduled, Then customer books convenient slot via SMS link',
    'Given medical evidence reviewed, When underwriter decides, Then decision letter is sent within 48 hours'
  ],
  'Policy Issuance': [
    'Given policy approved, When documents generated, Then policy schedule and terms are available in portal',
    'Given customer requests change, When processed, Then mid-term adjustment recalculates premium with pro-rata billing',
    'Given renewal due, When reminder sent, Then customer can confirm continuation or adjust cover online'
  ],
  
  // PRT Intake System
  'Multi-Format Parser': [
    'Given pension scheme provides Excel data, When uploaded, Then 50,000+ member records are parsed within 5 minutes with validation report',
    'Given scheme data contains legacy headers, When mapped, Then intelligent matching suggests mappings with 90%+ accuracy',
    'Given data file contains duplicate NI numbers, When detected, Then duplicates are flagged with merge/split options'
  ],
  'Data Validation Rules': [
    'Given member data is ingested, When validation runs, Then 200+ business rules are applied including NI format and DOB validity',
    'Given validation error is found, When displayed, Then error severity and correction guidance are shown',
    'Given historical data exists, When new data uploaded, Then reconciliation identifies members who left/joined/changed'
  ],
  'Data Cleansing Workflows': [
    'Given validation errors exist, When cleansing UI accessed, Then batch editing allows correction of multiple records',
    'Given address data incomplete, When Postcode lookup triggered, Then Royal Mail PAF auto-completes addresses',
    'Given cleansing complete, When sign-off requested, Then audit trail captures all changes with attribution'
  ],
  'GMP Calculation Engine': [
    'Given member has GMP entitlement, When calculated, Then GMP at payment age uses correct revaluation based on leaving date',
    'Given GMP reconciliation required, When COD statement received, Then variance report is generated with explanation codes',
    'Given GMP equalisation applies, When conversion method selected, Then dual record methodology is applied per High Court ruling'
  ],
  'Pension Increase Engine': [
    'Given pension has RPI/CPI increases, When increase date approaches, Then increase is calculated using ONS published indices',
    'Given scheme has LPI 0-5% cap, When inflation exceeds 5%, Then pension increase is correctly capped',
    'Given member has multiple tranches, When calculated, Then each tranche increases separately per scheme rules'
  ],
  'Cashflow Projection Engine': [
    'Given member data cleansed, When cashflows generated, Then projected benefits are calculated monthly for 70+ years',
    'Given mortality assumptions applied, When survival probabilities used, Then CMI projections with scheme adjustments are applied',
    'Given spouse reversions apply, When calculated, Then contingent spouse benefits are modeled with appropriate proportions'
  ],
  'Real-time Quote Integration': [
    'Given cashflows generated, When quote requested, Then pricing completes in under 60 seconds for 10,000 members',
    'Given market conditions change, When re-quote triggered, Then new price reflects updated gilt yields and credit spreads',
    'Given quote generated, When audit requested, Then full assumptions breakdown and sensitivity analysis are available'
  ]
};

async function applySpecificCriteria() {
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  console.log(`Applying story-specific criteria to ${files.length} templates...\n`);

  let totalStoriesUpdated = 0;
  let storiesWithSpecificCriteria = 0;

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    let fileStoriesUpdated = 0;
    let fileSpecificCriteria = 0;
    
    if (content.features) {
      content.features = content.features.map((feature: any) => {
        if (feature.stories) {
          feature.stories = feature.stories.map((story: any) => {
            const storyName = story.name;
            const specificCriteria = storySpecificCriteria[storyName];
            
            if (specificCriteria) {
              fileSpecificCriteria++;
              storiesWithSpecificCriteria++;
              story.acceptanceCriteria = specificCriteria;
            } else {
              // Generate contextual criteria based on story name
              story.acceptanceCriteria = generateContextualCriteria(storyName);
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
    console.log(`✓ ${file}: ${fileSpecificCriteria}/${fileStoriesUpdated} stories with bespoke criteria`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total stories: ${totalStoriesUpdated}`);
  console.log(`Stories with bespoke criteria: ${storiesWithSpecificCriteria}`);
  console.log(`Stories with contextual criteria: ${totalStoriesUpdated - storiesWithSpecificCriteria}`);
}

function generateContextualCriteria(storyName: string): string[] {
  const nameLower = storyName.toLowerCase();
  
  if (nameLower.includes('integration') || nameLower.includes('api') || nameLower.includes('connector') || nameLower.includes('feed')) {
    return [
      `Given ${storyName} is configured, When connection established, Then data synchronization achieves 99.9% uptime with monitoring`,
      `Given external system is unavailable, When retry logic engages, Then exponential backoff with alerting ensures resilience`,
      `Given data is received, When validation rules applied, Then invalid records are quarantined with detailed error codes`
    ];
  }
  
  if (nameLower.includes('report') || nameLower.includes('dashboard') || nameLower.includes('analytics') || nameLower.includes('metrics')) {
    return [
      `Given user requests ${storyName}, When report generated, Then data accuracy is within 0.01% of source systems`,
      `Given report parameters selected, When export triggered, Then PDF/Excel output is delivered within 30 seconds`,
      `Given historical comparison needed, When date range selected, Then trend analysis displays with configurable periods`
    ];
  }
  
  if (nameLower.includes('workflow') || nameLower.includes('process') || nameLower.includes('automation') || nameLower.includes('engine')) {
    return [
      `Given ${storyName} is initiated, When all steps complete, Then process finishes within SLA with full audit trail`,
      `Given approval is required, When approver notified, Then escalation triggers if no response within 48 hours`,
      `Given workflow step fails, When error logged, Then appropriate team is notified with context for resolution`
    ];
  }
  
  if (nameLower.includes('user') || nameLower.includes('portal') || nameLower.includes('ui') || nameLower.includes('interface') || nameLower.includes('experience')) {
    return [
      `Given user accesses ${storyName}, When page loads, Then all elements render within 2 seconds with WCAG 2.1 AA compliance`,
      `Given user performs action, When submitted, Then confirmation is displayed with clear next steps guidance`,
      `Given user makes error, When validation fires, Then inline messages guide correction without page refresh`
    ];
  }
  
  if (nameLower.includes('validation') || nameLower.includes('quality') || nameLower.includes('check') || nameLower.includes('rules')) {
    return [
      `Given data submitted to ${storyName}, When validation completes, Then all business rules applied with pass/fail status per field`,
      `Given validation errors found, When displayed, Then error severity and correction guidance are provided`,
      `Given validation rules updated, When deployed, Then new rules apply to subsequent submissions immediately`
    ];
  }
  
  if (nameLower.includes('model') || nameLower.includes('calculation') || nameLower.includes('pricing') || nameLower.includes('projection')) {
    return [
      `Given ${storyName} is invoked, When calculation completes, Then results are accurate to regulatory standards with audit trail`,
      `Given assumptions are modified, When recalculated, Then sensitivity to input changes is quantified`,
      `Given model version changes, When deployed, Then comparison with previous version is available for validation`
    ];
  }
  
  if (nameLower.includes('security') || nameLower.includes('authentication') || nameLower.includes('access') || nameLower.includes('permission')) {
    return [
      `Given user attempts ${storyName}, When credentials verified, Then access is granted within 2 seconds with MFA if required`,
      `Given unauthorized access attempted, When detected, Then security event is logged and appropriate alerts triggered`,
      `Given access rights change, When updated, Then permissions propagate across all systems within 5 minutes`
    ];
  }
  
  if (nameLower.includes('notification') || nameLower.includes('alert') || nameLower.includes('communication') || nameLower.includes('message')) {
    return [
      `Given ${storyName} is triggered, When notification sent, Then delivery confirmation is tracked with retry on failure`,
      `Given recipient preferences set, When applied, Then communication channel matches user preference`,
      `Given notification contains PII, When transmitted, Then data is encrypted in transit and at rest`
    ];
  }
  
  // Default contextual criteria
  return [
    `Given ${storyName} is initiated, When processing completes, Then expected outcomes are achieved within defined SLA`,
    `Given valid inputs provided, When business rules evaluated, Then results are accurate with exception handling for edge cases`,
    `Given audit is required, When records reviewed, Then complete evidence trail demonstrates compliance with policies`
  ];
}

applySpecificCriteria().catch(console.error);
