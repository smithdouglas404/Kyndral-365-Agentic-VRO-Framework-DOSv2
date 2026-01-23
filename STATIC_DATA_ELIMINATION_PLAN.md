# STATIC DATA ELIMINATION - ACTION PLAN

**Status:** IN PROGRESS
**Priority:** P0 - CRITICAL
**Date:** January 23, 2026

## 🎯 OBJECTIVE

Remove ALL 240KB of hardcoded/static data and replace with database-backed API calls.
Make this system TRULY production-ready with ZERO hardcoded data.

---

## ✅ COMPLETED (Phase 1)

### 1. Database Seed Infrastructure
- ✅ Created `/server/seedProduction.ts` - production data seeding
- ✅ Created `/script/seed-production.ts` - CLI command
- ✅ Added `npm run seed:production` command
- ✅ Seeds: Business Units, Portfolios, Programs, Projects, Features, Risks, Issues, OKRs, KPIs, Resources

### 2. API Endpoints Created
- ✅ `/server/routes/dashboard-data.ts` - comprehensive dashboard APIs
- ✅ Endpoints:
  - `GET /api/dashboard/overview` - portfolio metrics
  - `GET /api/dashboard/business-units` - BU performance
  - `GET /api/dashboard/portfolios` - portfolio rollup
  - `GET /api/dashboard/safe-data` - SAFe features/stories
  - `GET /api/dashboard/okrs` - OKR tracking
  - `GET /api/dashboard/kpis` - KPI metrics
  - `GET /api/dashboard/value-streams` - value stream data
  - `GET /api/dashboard/resources` - resource utilization
- ✅ Routes registered in `/server/routes.ts`

### 3. React Hooks for Data Fetching
- ✅ Created `/client/src/hooks/useDashboardData.ts`
- ✅ Hooks with auto-refresh (30-60 second intervals):
  - `useDashboardOverview()`
  - `useBusinessUnits()`
  - `usePortfolios()`
  - `useSafeData()`
  - `useOKRs()`
  - `useKPIs()`
  - `useValueStreams()`
  - `useResources()`
  - `useProjects()`
  - `useProject(id)`
  - `useRisks()`
  - `useIssues()`

### 4. Build System
- ✅ Build passes successfully
- ✅ No TypeScript errors
- ✅ All routes compile

---

## ⚠️ REMAINING WORK (Phase 2)

### FILES TO DELETE (240KB of static data)
```bash
# These files MUST be deleted:
client/src/lib/data.ts           # 14KB - mock challenges
client/src/lib/safe6Data.ts      # 41KB - fake SAFe data
client/src/lib/lgData.ts         # 37KB - hardcoded L&G data
client/src/lib/safeProjectData.ts # 66KB - fake projects
client/src/lib/scenarios.ts      # 27KB - hardcoded scenarios
client/src/lib/buPrograms.ts     # 55KB - fake BU data
```

### COMPONENTS TO UPDATE (34 files importing static data)

**High Priority - Core Dashboards:**
1. `/client/src/pages/dashboard.tsx` - Main dashboard
2. `/client/src/pages/dashboard-okr.tsx` - OKR dashboard
3. `/client/src/pages/dashboard-finops.tsx` - Financial dashboard
4. `/client/src/pages/dashboard-tmo.tsx` - TMO dashboard
5. `/client/src/pages/dashboard-governance.tsx` - Governance dashboard
6. `/client/src/pages/dashboard-planning.tsx` - Planning dashboard
7. `/client/src/pages/SustainabilityPage.tsx` - Sustainability metrics
8. `/client/src/pages/SegmentPage.tsx` - Segment/BU view
9. `/client/src/pages/RiskCenter.tsx` - Risk management

**Components:**
10. `/client/src/components/BUProgramsSection.tsx` - Replace `buPrograms`
11. `/client/src/components/BusinessPerformance.tsx` - Replace `scenarios`
12. `/client/src/components/DrillDownDrawer.tsx` - Replace `safe6Data`
13. `/client/src/components/AIProactiveInsights.tsx`
14. `/client/src/components/PMOProjectWorkspace.tsx`
15. `/client/src/components/PMOPipeline.tsx`
16. `/client/src/components/IndustryBenchmarks.tsx`
17. `/client/src/components/ScenarioCharts.tsx`
18. `/client/src/components/ScenarioWorkflow.tsx`
19. `/client/src/components/PMOCoPilotWorkspace.tsx`
20. `/client/src/pages/ProjectDetailPage.tsx`

### REPLACEMENT PATTERN

**Before (WRONG - Hardcoded):**
```typescript
import { pmoProjects, vroPrograms } from '@/lib/buPrograms';
import { portfolioEpics, features } from '@/lib/safe6Data';

function MyComponent() {
  // Using static data directly
  const projects = pmoProjects;
  const epics = portfolioEpics;

  return <div>{projects.map(p => ...)}</div>;
}
```

**After (CORRECT - Database):**
```typescript
import { useProjects, useSafeData } from '@/hooks/useDashboardData';

function MyComponent() {
  const { data: projectsData, isLoading } = useProjects();
  const { data: safeData } = useSafeData();

  if (isLoading) return <LoadingSpinner />;

  const projects = projectsData?.projects || [];
  const features = safeData?.features || [];

  return <div>{projects.map(p => ...)}</div>;
}
```

---

## 🚀 EXECUTION STEPS

### Step 1: Seed Database (CRITICAL FIRST STEP)
```bash
# Fix OKR creation issue first, then:
npm run seed:production
```

### Step 2: Update Core Dashboards (1-2 days)
- Replace static imports with `useDashboardData` hooks
- Add loading states
- Add error handling
- Test each dashboard

### Step 3: Update Components (2-3 days)
- Update all 34 files systematically
- Remove static imports
- Add proper loading/error states
- Test thoroughly

### Step 4: Delete Static Files (30 minutes)
```bash
# Only AFTER all components updated:
rm client/src/lib/data.ts
rm client/src/lib/safe6Data.ts
rm client/src/lib/lgData.ts
rm client/src/lib/safeProjectData.ts
rm client/src/lib/scenarios.ts
rm client/src/lib/buPrograms.ts
```

### Step 5: Verify Build (30 minutes)
```bash
npm run check  # No errors
npm run build  # Successful
npm run dev    # All pages load from database
```

---

## 📊 VERIFICATION CHECKLIST

After completion, verify:

- [ ] Database has real data (run seed)
- [ ] All 34 files updated to use API calls
- [ ] All 6 static data files deleted
- [ ] `npm run check` passes (no TypeScript errors)
- [ ] `npm run build` succeeds
- [ ] All dashboards show REAL data from database
- [ ] Data refreshes automatically (30-60s intervals)
- [ ] Loading states work
- [ ] Error handling works
- [ ] No console errors about missing data
- [ ] grep confirms no imports from deleted files:
  ```bash
  grep -r "from.*lib/data\|from.*lib/safe6Data\|from.*lib/lgData" client/src
  # Should return NOTHING
  ```

---

## 🎯 SUCCESS CRITERIA

**BEFORE (Current State):**
- ❌ 240KB of hardcoded data
- ❌ 34 files importing static data
- ❌ Data never changes
- ❌ Can't add real projects
- ❌ Demo mode only

**AFTER (Target State):**
- ✅ 0KB of hardcoded data
- ✅ ALL data from PostgreSQL database
- ✅ Real-time data updates every 30-60 seconds
- ✅ Can add/edit/delete actual projects
- ✅ Production-ready system

---

## ⏱️ ESTIMATED TIME

- **Phase 1 (Infrastructure):** ✅ DONE (4 hours)
- **Phase 2 (Migration):** ⏳ TODO (3-4 days)
  - Fix OKR seed issue: 1 hour
  - Update 20 core files: 2-3 days
  - Update 14 remaining files: 1 day
  - Testing & verification: 4 hours

**Total Remaining:** 3-4 days of focused work

---

## 🔥 NEXT IMMEDIATE ACTIONS

1. **Fix OKR creation in seed script** (storage.createOkr parameters)
2. **Run seed to populate database**
3. **Update dashboard.tsx as proof of concept**
4. **Update remaining 33 files systematically**
5. **Delete all 6 static data files**
6. **Verify complete system**

---

**NO MORE EXCUSES. NO MORE HARDCODED DATA.**
**THIS IS PRODUCTION-READY OR IT'S NOTHING.**
