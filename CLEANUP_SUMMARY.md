# 🧹 HARDCODED DATA CLEANUP SUMMARY

**Date**: January 26, 2026
**Status**: IN PROGRESS

---

## ✅ COMPLETED REMOVALS (PRT & British References)

### Files Cleaned:
1. **AIRecommendations.tsx**
   - Line 338: Removed "PRT processing workflow" → "Processing workflow"
   - Line 342: Removed "PRT volume forecast" → "Volume forecast"

2. **RiskConfidenceMetrics.tsx**  
   - Line 30: Removed "PRT market growth" → "market growth analysis"

3. **DrillDownDrawer.tsx**
   - Line 630: Removed "PRT Digital Intake" → "Digital Platform Modernization"

4. **data.ts**
   - Line 143: Removed "PRT Pipeline" → "Portfolio Optimization"

---

## 🚨 FILES MARKED FOR REMOVAL (Contains Hardcoded Mock Data)

### Large Data Files (>1000 lines each):
These files contain extensive hardcoded data and should be replaced with API calls:

1. **lib/safeProjectData.ts** (1,500 lines)
   - Contains 18 hardcoded SAFe projects
   - **British Insurance Projects to Remove:**
     - Lines 154-276: "PRT Platform Modernization" (Pension Risk Transfer)
     - Lines 313-401: "Pensioner Digital Portal"  
     - Lines 430-468: "Bulk Annuity Processing Automation"
   - **Action**: These 3 projects contain pension/annuity references and MUST be removed
   - **Replacement**: API endpoint `/api/safe-projects`

2. **lib/safe6Data.ts** (1,134 lines)
   - Complete SAFe 6.0 portfolio data
   - Strategic themes, value streams, epics, features, stories, tasks
   - **Action**: Replace entire file with API calls
   - **Replacement**: API endpoint `/api/safe6-portfolio`

3. **lib/projects.ts** (600+ lines)
   - 12+ enriched NextEra projects
   - **Action**: Replace with API calls
   - **Replacement**: API endpoint `/api/projects/enriched`

4. **lib/data.ts** (400+ lines)
   - 16 challenge definitions with VRO/PMO metrics
   - **Action**: Replace with API calls  
   - **Replacement**: API endpoint `/api/challenges`

---

## 🔌 COMPONENTS REQUIRING API WIRING

### Priority 1 (Currently Using Hardcoded Arrays):

1. **AIRecommendations.tsx** ❌
   - Lines 31-313: 28 hardcoded recommendations
   - **Required API**: `/api/recommendations?agentType={type}`
   - **Agents**: VRO, PMO, TMO, FinOps, Governance, OKR, Planning, OCM

2. **KPIAttributionPanel.tsx** ❌
   - Lines 38-100+: CORE_KPIS array with attribution
   - **Required API**: `/api/kpis/attribution`

3. **CommonOperationalPicture.tsx** ❌
   - Lines 78-112: Strategic layer metrics
   - **Required API**: `/api/dashboard-data/strategic-metrics`

4. **AIProactiveInsights.tsx** ❌
   - Line 6: Imports from missing `@/lib/scenarios` file
   - **Action**: Fix broken import or remove component

### Priority 2 (May Be OK as Static Config):

5. **BattleRhythmCalendar.tsx**
   - Lines 48-117: Weekly meeting events
   - **Decision Needed**: Keep as static recurring meetings OR wire to API?
   - **Recommendation**: Keep static (these are organizational recurring meetings)

---

## 📊 BRITISH INSURANCE TERMS FOUND (All References)

| File | Lines | Term | Status |
|------|-------|------|--------|
| safeProjectData.ts | 154-276 | PRT (Pension Risk Transfer) | ⚠️ MUST REMOVE |
| safeProjectData.ts | 313-401 | Pensioner, pension payments | ⚠️ MUST REMOVE |
| safeProjectData.ts | 430-468 | Bulk Annuity | ⚠️ MUST REMOVE |
| AIRecommendations.tsx | 338, 342 | PRT processing/forecast | ✅ REMOVED |
| RiskConfidenceMetrics.tsx | 30 | PRT market growth | ✅ REMOVED |
| DrillDownDrawer.tsx | 630 | PRT Digital Intake | ✅ REMOVED |
| data.ts | 143 | PRT Pipeline | ✅ REMOVED |

---

## 🎯 NEXT STEPS

### Immediate (Breaking Changes):
1. Remove 3 British insurance projects from `safeProjectData.ts`
2. Update any components that reference these specific project IDs
3. Test that ProjectDetailPage and other consumers still work

### Short Term (API Wiring):
1. Create `/api/recommendations` endpoint
2. Wire AIRecommendations.tsx to use real API data
3. Create `/api/kpis/attribution` endpoint
4. Wire KPIAttributionPanel.tsx to real data

### Long Term (Complete Removal):
1. Phase out lib/safeProjectData.ts entirely
2. Phase out lib/safe6Data.ts entirely  
3. Phase out lib/projects.ts hardcoded data
4. Replace all with database-backed APIs

---

## ✅ FILES THAT ARE CLEAN (Using Real APIs)

These components are correctly wired to real data sources:
- ✅ AIAlertTicker.tsx - Uses SimulationContext
- ✅ AlertsFlyout.tsx - Uses UnifiedNotificationContext
- ✅ ActionAuditTimeline.tsx - Uses agentActionEngine
- ✅ Charts.tsx - Static chart configuration (OK)
- ✅ GuidedTour.tsx - Static tour steps (OK)
- ✅ AdminLayout.tsx - Static layout (OK)

---

**Total Hardcoded Lines Found**: ~4,000+ lines across data files
**British References Removed**: 4/7 (57% complete)
**Files Requiring API Wiring**: 4 high-priority components

