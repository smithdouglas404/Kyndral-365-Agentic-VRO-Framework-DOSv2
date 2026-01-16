import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(process.cwd(), 'attached_assets', 'project_templates');

const storySpecificCriteria: Record<string, Record<string, string[]>> = {
  'Enterprise_Data_Platform.json': {
    'Azure ADLS Gen2 Infrastructure Setup': [
      'Given infrastructure-as-code is executed, When Terraform applies successfully, Then ADLS Gen2 containers are provisioned with RBAC policies in under 30 minutes',
      'Given storage accounts are created, When hierarchical namespace is enabled, Then Delta Lake tables can be written with ACID transactions',
      'Given disaster recovery is configured, When primary region fails, Then data is accessible from paired region within RPO of 1 hour'
    ],
    'Delta Lake Format Implementation': [
      'Given raw data is ingested, When Delta format is applied, Then time travel queries retrieve data from any point in last 90 days',
      'Given concurrent writes occur, When ACID transactions complete, Then data integrity is maintained with no lost updates',
      'Given schema evolution is needed, When new columns added, Then existing queries continue to work with graceful null handling'
    ],
    'Source System Connectivity': [
      'Given 47 source systems identified, When connectors deployed, Then each system is ingested on defined schedule (real-time/daily/weekly)',
      'Given source system is unavailable, When retry exhausted, Then alerting triggers and last successful data is retained',
      'Given new source onboarding requested, When template applied, Then connectivity is established within 2 weeks'
    ],
    'Data Quality Framework': [
      'Given data quality rules defined, When validation executes, Then DQ score per dataset is published to catalog with drill-down to failed records',
      'Given DQ threshold breached, When alert triggers, Then data steward is notified with root cause analysis and remediation guidance',
      'Given new DQ rule required, When configured, Then rule applies to next ingestion without code deployment'
    ],
    'Data Catalog Integration': [
      'Given dataset is onboarded, When metadata harvested, Then lineage from source to consumption is visible in Purview/Collibra',
      'Given business user searches catalog, When query submitted, Then relevant datasets returned with data owner and sensitivity classification',
      'Given glossary term updated, When linked to datasets, Then business context propagates to all downstream reports'
    ],
    'PII Detection and Masking': [
      'Given data contains PII, When ML classifier runs, Then sensitive columns are tagged with 95%+ precision within 24 hours of ingestion',
      'Given PII is detected, When non-authorized user queries, Then dynamic masking returns obfuscated values',
      'Given GDPR deletion request received, When processed, Then PII is removed from all lakehouse layers within 72 hours'
    ],
    'Customer 360 View': [
      'Given customer has multiple policies, When 360 view queried, Then all policies, claims, interactions are consolidated under single customer ID',
      'Given name/address variations exist, When entity resolution runs, Then 98%+ match accuracy links duplicate records',
      'Given customer preference changes, When updated, Then preference propagates to all consuming applications within 1 hour'
    ],
    'Predictive Analytics Pipeline': [
      'Given feature store contains customer features, When ML model requests features, Then real-time serving returns features in <100ms',
      'Given new model version deployed, When A/B test runs, Then champion/challenger metrics are tracked with statistical significance',
      'Given model drift detected, When threshold breached, Then automated retraining pipeline triggers with approval workflow'
    ]
  },
  'AI_Chatbot_Implementation.json': {
    'Conversational AI Engine': [
      'Given customer types pension query, When NLU processes, Then intent is classified with 92%+ accuracy within 2 seconds',
      'Given ambiguous query received, When clarification needed, Then bot asks focused follow-up question without frustrating loops',
      'Given profanity or abuse detected, When sentiment negative, Then escalation to human agent triggers with context preserved'
    ],
    'RAG Knowledge Base': [
      'Given pension scheme document uploaded, When indexed, Then vector embeddings enable semantic search across 10,000+ pages',
      'Given customer asks scheme-specific question, When RAG retrieves, Then answer cites source document section with page number',
      'Given document is updated, When re-indexed, Then new content is searchable within 4 hours of publication'
    ],
    'Pension Calculator Integration': [
      'Given member requests retirement projection, When calculator invoked, Then illustration uses actual scheme data with statutory assumptions',
      'Given SMPI illustration required, When generated, Then PDF download includes required FCA disclosures',
      'Given projection parameters changed, When recalculated, Then comparison shows impact of different retirement ages/contributions'
    ],
    'Multi-Channel Deployment': [
      'Given customer accesses web chat, When session starts, Then previous conversation history is available for continuity',
      'Given mobile app user switches to phone, When handoff occurs, Then agent sees full chat transcript without customer repeating',
      'Given WhatsApp channel deployed, When message received, Then response adheres to WhatsApp template and character limits'
    ],
    'Compliance Guardrails': [
      'Given question approaches regulated advice, When boundary detected, Then chatbot explains limitation and offers adviser referral',
      'Given FCA regulatory update occurs, When content refreshed, Then guardrails reflect new guidance within 48 hours',
      'Given conversation is audited, When compliance reviews, Then full transcript with timestamps and triggered guardrails is available'
    ],
    'Analytics Dashboard': [
      'Given chatbot deployed, When metrics tracked, Then containment rate, CSAT, and intent distribution are shown real-time',
      'Given conversation fails to resolve, When flagged, Then unhandled queries are routed to content team for knowledge gap analysis',
      'Given A/B test runs on response, When winner determined, Then optimal response variant is promoted automatically'
    ]
  },
  'Build_to_Rent_Operating_Platform.json': {
    'Tenant Application Portal': [
      'Given prospective tenant starts application, When ID uploaded, Then biometric verification completes in under 60 seconds with liveness check',
      'Given affordability check required, When Open Banking connected, Then income verification confirms 30x rent threshold automatically',
      'Given application approved, When contract generated, Then AST with property-specific terms is ready for e-signature'
    ],
    'Maintenance Ticketing System': [
      'Given tenant reports leak, When ticket created, Then emergency SLA (4-hour response) is auto-assigned to approved contractor',
      'Given contractor completes work, When photos uploaded, Then tenant is notified and satisfaction survey is triggered',
      'Given repeat issue for same unit, When pattern detected, Then escalation to property manager flags potential major repair'
    ],
    'Rent Collection Engine': [
      'Given rent due date arrives, When Direct Debit collected, Then payment posts to property ledger with automatic receipt to tenant',
      'Given payment fails, When arrears begins, Then SMS/email reminder triggers with hardship support information',
      'Given 7 days arrears, When escalation runs, Then case manager is assigned with tenant contact history and payment plan options'
    ],
    'Building Access Control': [
      'Given tenant moves in, When access credentials issued, Then fob/app unlocks apartment, parking, and amenities per entitlement',
      'Given guest access requested, When tenant grants, Then temporary code is valid for specified hours with visitor log captured',
      'Given tenant moves out, When deactivation processed, Then all access revoked within 1 hour of lease end'
    ],
    'Property Inspection Workflow': [
      'Given move-in inspection due, When conducted, Then photo evidence of each room captured with condition notes on standardized form',
      'Given move-out inspection finds damage, When assessed, Then deposit deduction is calculated with itemized breakdown to tenant',
      'Given mid-tenancy inspection scheduled, When completed, Then compliance checklist (gas safety, smoke alarms) is signed off'
    ],
    'Community Engagement': [
      'Given resident event planned, When invitations sent, Then RSVP tracking and capacity management is automated',
      'Given amenity booking requested, When availability checked, Then gym/cinema/workspace slot is reserved with QR code access',
      'Given community feedback survey sent, When responses analyzed, Then NPS score trends are visible per building'
    ]
  },
  'Protection_Product_Digitization.json': {
    'Product Selector': [
      'Given customer answers needs questions, When recommendation runs, Then suitable life/CI/IP products are ranked with coverage rationale',
      'Given budget constraint specified, When options filtered, Then affordable alternatives with coverage trade-offs are explained',
      'Given family circumstances disclosed, When dependents identified, Then life cover sum assured recommendation accounts for mortgage and income replacement'
    ],
    'Quote Engine': [
      'Given personal details entered, When quote calculated, Then premium is displayed within 5 seconds with breakdown by cover type',
      'Given smoker status or BMI disclosed, When loadings applied, Then premium adjustment is explained with wellness incentives if available',
      'Given quote saved, When customer returns, Then quote is retrievable for 30 days with option to refresh rates'
    ],
    'Underwriting Rules Engine': [
      'Given application submitted, When rules evaluate, Then straight-through processing approves 65%+ applications without referral',
      'Given medical condition disclosed, When decision tree followed, Then appropriate outcome (accept/load/exclude/decline) is automated per underwriting manual',
      'Given edge case triggers, When referred to underwriter, Then case appears in queue with pre-populated risk assessment summary'
    ],
    'Medical Evidence Gateway': [
      'Given GP report required, When eMRO request sent, Then record received and parsed within 10 business days average',
      'Given tele-interview needed, When scheduled, Then customer books convenient slot via SMS link',
      'Given medical evidence reviewed, When underwriter decides, Then decision letter with clear explanation is sent within 48 hours'
    ],
    'Policy Administration': [
      'Given policy issued, When documents generated, Then policy schedule, terms, and key facts are available in secure portal',
      'Given customer requests change, When processed, Then mid-term adjustment recalculates premium with pro-rata billing',
      'Given renewal due, When reminder sent, Then customer can confirm continuation or adjust cover online'
    ],
    'Claims Journey': [
      'Given claim submitted, When FNOL received, Then acknowledgment with expected timeline is sent within 2 hours',
      'Given claims evidence uploaded, When assessed, Then decision is made within 5 business days for uncomplicated claims',
      'Given claim approved, When payment processed, Then funds reach claimant bank account within 3 business days'
    ]
  },
  'ESG_Analytics_Dashboard.json': {
    'MSCI ESG Ratings Integration': [
      'Given MSCI ESG rating changes, When daily feed processed, Then updated ratings are reflected in portfolio scores by market open next day',
      'Given portfolio contains 500+ securities, When MSCI coverage checked, Then coverage percentage and gaps are reported with Sustainalytics fallback options',
      'Given rating methodology changes, When MSCI publishes update, Then recalibration impact analysis is available within 1 week'
    ],
    'Sustainalytics Risk Scores': [
      'Given company controversy emerges, When Sustainalytics updates, Then alert is triggered to portfolio managers with holdings exposure',
      'Given ESG Risk Rating deteriorates, When threshold breached, Then watchlist notification includes controversy category and recommended action',
      'Given controversy is resolved, When status updated, Then historical timeline shows full lifecycle with impact on ESG score'
    ],
    'Climate Data Pipeline': [
      'Given CDP data is released annually, When ingested, Then company climate scores are available within 48 hours of publication',
      'Given Scope 1/2/3 emissions reported, When normalized, Then tCO2e per $m revenue enables peer comparison',
      'Given SBTi target validation updates, When synced, Then company Net Zero commitment status is current within 1 week'
    ],
    'PAI Indicators Calculation': [
      'Given Article 8 fund selected, When PAI report generated, Then all 18 mandatory indicators calculated with data coverage percentage',
      'Given PAI data gaps exist, When estimation applied, Then methodology and confidence level are disclosed per SFDR requirements',
      'Given PAI values calculated, When compared to benchmark, Then relative performance is displayed with traffic light status'
    ],
    'EU Taxonomy Alignment': [
      'Given company reports Taxonomy-eligible revenue, When alignment assessed, Then Do No Significant Harm criteria status is shown per environmental objective',
      'Given Taxonomy data is incomplete, When estimated, Then estimation methodology and data sources are disclosed',
      'Given Taxonomy regulation updates, When implemented, Then technical screening criteria are updated within 2 months'
    ],
    'Portfolio Carbon Footprint': [
      'Given portfolio holdings provided, When WACI calculated, Then weighted average carbon intensity is shown in tCO2e per $m invested',
      'Given Net Zero target set, When trajectory modeled, Then year-by-year decarbonization pathway with interim milestones is displayed',
      'Given carbon attribution analyzed, When drill-down requested, Then top 10 contributors by absolute emissions are identified'
    ]
  },
  'Bulk_Annuity_Pricing_Engine.json': {
    'Bloomberg B-PIPE Integration': [
      'Given trading desk is active, When gilt yield requested, Then data is less than 5 seconds stale with sub-second API response',
      'Given Bloomberg feed experiences outage, When failover triggers, Then Reuters backup is used seamlessly with audit log of data source switch',
      'Given quote is generated, When audit trail requested, Then exact timestamp and value of each market rate used is retrievable'
    ],
    'Credit Spread Curve Builder': [
      'Given issuer credit rating available, When curve built, Then spreads are interpolated for 1-50 year tenors using Nelson-Siegel-Svensson model',
      'Given new corporate bond trades, When price observed, Then curve recalibrates within 1 hour incorporating new data point',
      'Given curve query at off-market tenor, When interpolation needed, Then cubic spline provides smooth transition with no arbitrage'
    ],
    'Swap Rate Integration': [
      'Given interest rate swap tenor selected, When live rate queried, Then mid-market rate from ICE is returned with bid-offer spread',
      'Given historical analysis needed, When 10-year lookback requested, Then time series data is available with intraday granularity',
      'Given basis swap adjustment required, When cross-currency swap referenced, Then SOFR-SONIA basis is correctly applied'
    ],
    'Historical Deal Data Pipeline': [
      'Given 10+ years of closed deals exist, When data cleaned, Then 2,500+ deals are available for ML training with standardized features',
      'Given data quality issue detected, When flagged, Then manual review queue receives case with specific quality concern highlighted',
      'Given new deal closes, When ingested, Then model retraining pipeline triggers within 24 hours'
    ],
    'Win Probability Model': [
      'Given deal parameters entered, When model predicts, Then win probability is 0-100% with 90% confidence interval',
      'Given prediction is made, When deal outcome known, Then accuracy tracking updates with Brier score and calibration metrics',
      'Given market conditions shift, When model retrained, Then performance improvement is validated on holdout test set'
    ],
    'Optimal Pricing Recommendation': [
      'Given target margin defined, When optimization runs, Then price recommendation range balances win probability with profitability',
      'Given competitive intelligence available, When incorporated, Then recommendations adjust based on expected competitor behavior',
      'Given recommendation reviewed, When rationale requested, Then SHAP values explain feature contributions to price suggestion'
    ]
  }
};

const genericDomainCriteria: Record<string, (storyName: string) => string[]> = {
  'Institutional Retirement': (story) => [
    `Given ${story} is processed, When actuarial calculations complete, Then results are accurate to regulatory standards with full audit trail`,
    `Given scheme data is loaded, When benefit projections run, Then member-level cashflows use approved mortality and economic assumptions`,
    `Given pricing deadline approaches, When quote finalized, Then documentation package is complete for trustee board presentation`
  ],
  'LGIM': (story) => [
    `Given ${story} data is requested, When portfolio analysis runs, Then results reflect latest market data with regulatory-compliant methodology`,
    `Given ESG metrics calculated, When SFDR disclosure generated, Then Article 8/9 requirements are satisfied with supporting data`,
    `Given client report due, When generated, Then MiFID II cost disclosures and performance attribution are included`
  ],
  'Retail Retirement': (story) => [
    `Given customer interacts with ${story}, When journey completes, Then FCA Consumer Duty requirements are met with fair value demonstrated`,
    `Given pension illustration requested, When generated, Then statutory assumptions and personalised projections are clearly presented`,
    `Given vulnerability indicators detected, When flagged, Then appropriate support pathways and signposting are offered`
  ],
  'General Insurance': (story) => [
    `Given ${story} is initiated, When underwriting evaluates, Then risk selection follows approved guidelines with consistent pricing`,
    `Given claim submitted, When assessed, Then decision timeline meets SLA with clear communication to policyholder`,
    `Given regulatory requirement applies, When compliance checked, Then evidence is documented and audit-ready`
  ],
  'Group Functions': (story) => [
    `Given ${story} is executed, When processing completes, Then enterprise standards for data governance and security are met`,
    `Given cross-business integration required, When data flows, Then consistent entity resolution and lineage tracking are maintained`,
    `Given regulatory reporting due, When submitted, Then accuracy is validated with reconciliation to source systems`
  ],
  'Housing & Property': (story) => [
    `Given ${story} for property is processed, When transaction completes, Then tenant/landlord obligations are fulfilled per AST and regulations`,
    `Given sustainability metric tracked, When reported, Then EPC and carbon data are accurate with improvement roadmap visible`,
    `Given compliance inspection due, When conducted, Then gas safety, electrical, and health & safety requirements are signed off`
  ]
};

function getStoryCriteria(templateName: string, storyName: string, domain: string): string[] {
  const templateCriteria = storySpecificCriteria[templateName];
  if (templateCriteria && templateCriteria[storyName]) {
    return templateCriteria[storyName];
  }
  
  const domainCriteriaFn = genericDomainCriteria[domain];
  if (domainCriteriaFn) {
    return domainCriteriaFn(storyName);
  }
  
  return [
    `Given ${storyName} is initiated, When all prerequisites are met, Then processing completes within defined SLA with full traceability`,
    `Given valid inputs provided, When business rules evaluated, Then expected outcomes are achieved with exception handling for edge cases`,
    `Given audit is required, When records reviewed, Then complete evidence trail demonstrates compliance with policies and regulations`
  ];
}

function getDomainFromTemplate(content: any): string {
  const division = content.division?.toLowerCase() || '';
  const bu = content.bu?.toLowerCase() || '';
  
  if (division.includes('institutional') || bu.includes('institutional') || division.includes('retirement') && division.includes('institutional')) {
    return 'Institutional Retirement';
  }
  if (bu.includes('lgim') || division.includes('investment')) {
    return 'LGIM';
  }
  if (division.includes('retail') || (bu.includes('lgr') && division.includes('retail'))) {
    return 'Retail Retirement';
  }
  if (division.includes('insurance') || division.includes('protection') || bu.includes('gi')) {
    return 'General Insurance';
  }
  if (bu.includes('housing') || division.includes('housing') || division.includes('property')) {
    return 'Housing & Property';
  }
  return 'Group Functions';
}

async function enhanceWithUniqueCriteria() {
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  console.log(`Enhancing ${files.length} templates with story-specific acceptance criteria...\n`);

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const domain = getDomainFromTemplate(content);
    
    let storiesEnhanced = 0;
    
    if (content.features) {
      content.features = content.features.map((feature: any) => {
        if (feature.stories) {
          feature.stories = feature.stories.map((story: any) => {
            const criteria = getStoryCriteria(file, story.name, domain);
            storiesEnhanced++;
            return {
              ...story,
              acceptanceCriteria: criteria
            };
          });
        }
        return feature;
      });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`✓ ${file}: ${storiesEnhanced} stories with unique criteria (${domain})`);
  }

  console.log('\nAll templates enhanced with story-specific acceptance criteria!');
}

enhanceWithUniqueCriteria().catch(console.error);
