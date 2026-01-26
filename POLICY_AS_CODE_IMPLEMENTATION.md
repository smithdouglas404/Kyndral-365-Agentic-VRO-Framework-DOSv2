# Policy-as-Code Implementation Status

## ✅ COMPLETED (Phase 1 - Backend Foundation)

### 1. Database Schema ✅
**File**: `server/db/schema.ts`
- Complete Drizzle ORM schema for ontology-based company profiles
- Tables created:
  - `ontology_classes` - Universal ontology (SAFe, PMBOK, etc.)
  - `ontology_relationships` - Class relationships
  - `ontology_industry_profiles` - Industry-specific extensions
  - `companies` - Company profile master table
  - `organizational_units` - Business units/value streams
  - `company_ontology_instances` - Maps company data to ontology
  - `company_instance_relationships` - Relationships between instances
  - `company_rules` - Policy-as-Code governance rules
  - `metric_definitions` + `metric_values` - KPI tracking
  - `strategic_objectives` + `key_results` - OKR system
  - `dashboard_templates` - Auto-generated dashboards
  - `document_processing_jobs` - Extraction job tracking
  - `extraction_review_queue` - Human review workflow
  - `company_discovery_candidates` - Temporary search results

### 2. Database Migration ✅
**File**: `server/db/migrations/001_initial_schema.sql`
- Complete SQL migration with all tables, indexes, enums
- Ready to run with PostgreSQL

### 3. Ontology Seed Data ✅
**File**: `server/db/seeds/001_seed_safe_ontology.sql`
- SAFe 6.0 ontology classes (Portfolio, Value Stream, ART, Team, Epic, Feature, Story, etc.)
- Ontology relationships (Portfolio → Value Stream → ART → Team)
- Industry profiles:
  - Electric Utilities (GICS: 551010)
  - Financial Services (GICS: 4011)
  - Technology/SaaS (GICS: 4510)
- Each industry has standard metrics and extensions

### 4. Company Discovery Service ✅
**File**: `server/services/companyDiscovery.ts`
- **searchSECEdgar()** - Fetches company data from SEC EDGAR API
- **searchOpenCorporates()** - Searches OpenCorporates registry
- **enrichCompanyData()** - Uses Claude to enhance industry classification
- **discoverCompanies()** - Main orchestrator, searches multiple sources
- **getCompanyProfile()** - Gets detailed profile with latest 10-K

Features:
- Multi-source search (SEC EDGAR + OpenCorporates)
- Deduplication and merging
- AI-powered GICS/NAICS classification
- Confidence scoring
- Filters by location, industry

### 5. Policy-as-Code Extraction Engine ✅
**File**: `server/services/policyAsCodeExtractor.ts`
- **extractOrganizationalStructure()** - Parses business segments/units
- **extractMetrics()** - Extracts KPIs and metrics with targets
- **extractStrategicObjectives()** - Maps to OKRs with key results
- **extractGovernanceRules()** - Finds approval thresholds, policies
- **extractRiskFactors()** - Identifies material risks
- **extractPolicyAsCode()** - Main orchestrator

Features:
- Parses 10-K/annual reports
- Uses Claude Sonnet 4.5 with low temperature (0.2)
- Section-aware extraction (finds relevant sections)
- Confidence scoring
- Source text citation
- Structured JSON output

Extracts:
- Organizational Units (segments, divisions) → Maps to Value Streams/ARTs
- Financial Metrics → Maps to KPIs
- Strategic Objectives → Maps to Strategic Themes + OKRs
- Governance Rules → Enforceable policies
- Risk Factors → Risk ontology instances

### 6. API Endpoints ✅
**File**: `server/routes/company-profile.ts`
- **POST /api/company-profile/discover** - Search for companies
- **POST /api/company-profile/enrich** - Get detailed profile
- **POST /api/company-profile/extract** - Start Policy-as-Code extraction
- **GET /api/company-profile/extraction-status/:jobId** - Check extraction progress
- **GET /api/company-profile/review-queue/:companyId** - Get items for review
- **POST /api/company-profile/review-queue/:itemId/approve** - Approve extracted item
- **POST /api/company-profile/review-queue/:itemId/reject** - Reject extracted item
- **POST /api/company-profile** - Create company profile
- **GET /api/company-profile/:id** - Get company profile
- **PUT /api/company-profile/:id/approve** - Activate company profile

Features:
- Async extraction with job tracking
- Human review workflow
- Confidence-based auto-approval (<85% = needs review)
- CRUD for company profiles

### 7. Route Registration ✅
**File**: `server/routes.ts`
- Imported `registerCompanyProfileRoutes`
- Registered after Governance routes

---

## 🚧 IN PROGRESS (Phase 2 - Frontend)

### 8. Setup Wizard UI (5 Screens)
**Files Needed**:
- `client/src/pages/SetupWizard.tsx` - Main wizard container
- `client/src/components/setup/CompanyDiscovery.tsx` - Screen 1
- `client/src/components/setup/CompanyPreview.tsx` - Screen 2
- `client/src/components/setup/OntologyMapping.tsx` - Screen 3
- `client/src/components/setup/ReviewExtraction.tsx` - Screen 4
- `client/src/components/setup/GeneratedKit.tsx` - Screen 5

Screens:
1. **Company Discovery** - Search input → results table → select
2. **Company Preview** - Show profile, org units, annual report link
3. **Ontology Mapping** - Progress bar, AI extraction status
4. **Review Extraction** - Review queue with approve/edit/reject
5. **Generated Starter Kit** - Show dashboards, rules, OKRs created

### 9. Admin > Company Profile Section
**Files Needed**:
- `client/src/pages/admin/CompanyProfile.tsx` - Main admin page
- Company info editor
- Organizational units CRUD
- Metrics/KPIs manager
- Strategic objectives/OKRs manager
- Governance rules viewer
- Document upload/re-extraction

---

## 📋 TODO (Phase 3 - Integration)

### 10. Auto-Generated Dashboards
**Files Needed**:
- `server/services/dashboardGenerator.ts` - Generate dashboard templates
- Logic to create dashboard JSON from ontology instances
- Executive, Value Stream, and Risk dashboards

### 11. Governance Rules Enforcement Engine
**Files Needed**:
- `server/services/ruleEngine.ts` - Evaluate rules on entity create/update
- Hook into Epic, Feature, Story creation
- Check rule conditions (e.g., `epic.estimated_cost > 500000000`)
- Trigger approval workflows or block saves

### 12. Replace Hardcoded NextEra References
**Files to Update**:
- `client/src/lib/buPrograms.ts` - Replace with dynamic lookups
- All dashboard components - Pull from `company_ontology_instances`
- Navigation/headers - Show actual company name

### 13. End-to-End Testing
- Test complete flow:
  1. Search "NextEra Energy"
  2. Extract from 10-K
  3. Review extracted data
  4. Approve and create company
  5. Verify dashboards generated
  6. Test governance rules enforcement

---

## 🗂️ File Structure Created

```
server/
├── db/
│   ├── schema.ts ✅ (Drizzle schema)
│   ├── migrations/
│   │   └── 001_initial_schema.sql ✅
│   └── seeds/
│       └── 001_seed_safe_ontology.sql ✅
├── services/
│   ├── companyDiscovery.ts ✅ (SEC EDGAR + OpenCorporates)
│   └── policyAsCodeExtractor.ts ✅ (Claude-powered extraction)
└── routes/
    └── company-profile.ts ✅ (API endpoints)

client/
└── src/
    ├── pages/
    │   ├── SetupWizard.tsx 🚧 (TODO)
    │   └── admin/
    │       └── CompanyProfile.tsx 🚧 (TODO)
    └── components/
        └── setup/
            ├── CompanyDiscovery.tsx 🚧 (TODO)
            ├── CompanyPreview.tsx 🚧 (TODO)
            ├── OntologyMapping.tsx 🚧 (TODO)
            ├── ReviewExtraction.tsx 🚧 (TODO)
            └── GeneratedKit.tsx 🚧 (TODO)
```

---

## 🎯 Next Steps

**Priority 1: Run Migrations**
```bash
# Apply database schema
psql $DATABASE_URL < server/db/migrations/001_initial_schema.sql

# Seed SAFe ontology
psql $DATABASE_URL < server/db/seeds/001_seed_safe_ontology.sql
```

**Priority 2: Test API**
```bash
# Start server
npm run dev

# Test company discovery
curl -X POST http://localhost:5000/api/company-profile/discover \
  -H "Content-Type: application/json" \
  -d '{"searchQuery": "NextEra Energy"}'

# Test extraction (use actual 10-K URL)
curl -X POST http://localhost:5000/api/company-profile/extract \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "uuid-here",
    "documentUrl": "https://www.sec.gov/...",
    "industryCode": "551010"
  }'
```

**Priority 3: Build Setup Wizard UI**
- Create 5-screen wizard flow
- Connect to API endpoints
- Handle approval workflow

**Priority 4: Build Admin Section**
- Company profile CRUD
- Metrics/OKRs management
- Re-run extraction button

**Priority 5: Dashboard Generation**
- Generate templates from ontology instances
- Create Executive, Value Stream, Risk dashboards

**Priority 6: Rules Enforcement**
- Hook into entity lifecycle
- Evaluate governance rules
- Trigger approvals/blocks

---

## 💡 Key Design Decisions

1. **Ontology-First Architecture** - All company data maps to universal SAFe ontology
2. **Confidence-Based Review** - <85% confidence items need human review
3. **Industry Profiles** - Ontology extends per industry (Utilities, FinServ, Tech)
4. **Policy-as-Code** - Governance rules extracted from annual reports are enforceable
5. **White-Label Ready** - System works for any company, not just NextEra
6. **Async Extraction** - Long-running AI extraction uses job queue
7. **Source Citation** - All extracted data cites source text and page numbers

---

## 📊 Data Flow

```
User searches "NextEra"
  → Multi-source discovery (SEC + OpenCorporates)
  → User selects match
  → Fetch latest 10-K URL
  → User clicks "Extract"
  → AI parses 10-K sections
  → Extracts org units, metrics, OKRs, rules, risks
  → Maps to SAFe ontology (Value Streams, KPIs, Strategic Themes)
  → Stores in extraction_review_queue
  → Admin reviews items
  → Approves high-confidence items
  → Creates company_ontology_instances
  → Auto-generates dashboards
  → Activates governance rules
  → System now configured for that company
```

---

## 🔄 Industry Support

**Currently Seeded:**
- Electric Utilities (NextEra)
- Financial Services
- Technology/SaaS

**Easy to Add:**
- Healthcare
- Manufacturing
- Retail
- Government/Defense

Just add new `ontology_industry_profiles` entry with:
- Standard metrics for that industry
- Ontology class extensions
- Industry-specific hints for extraction

---

## 🚀 What Makes This Special

1. **Self-Service Onboarding** - No manual setup, AI does the work
2. **Source of Truth** - Annual report drives configuration
3. **Ontology-Driven** - Consistent data model across all companies
4. **Policy Enforcement** - Rules from annual reports become system rules
5. **Industry Intelligence** - Understands utilities vs finance vs tech
6. **Confidence Transparency** - Shows extraction confidence, allows review
7. **Audit Trail** - Everything cites source document

---

**Status**: Backend complete, ready for frontend UI and testing!
