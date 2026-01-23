-- Seed RAG Knowledge Base
-- SOPs, PMBOK, Playbooks, and Lessons Learned

-- Note: Embeddings are placeholder arrays. The AgentRAGService will generate proper embeddings when articles are retrieved.

-- 1. SOP-FIN-042: Budget Recovery Procedures
INSERT INTO knowledge_base (id, title, content, category, tags, source, metadata, embedding, created_at, updated_at)
VALUES (
  'kb-sop-fin-042',
  'SOP-FIN-042: Budget Recovery Procedures',
  'Budget Recovery Procedures

When budget variance exceeds 10%:

1. IMMEDIATE ACTIONS (Within 48 hours):
   - Conduct variance analysis with finance team
   - Identify root causes (scope creep, resource inefficiency, vendor overruns)
   - Document all findings

2. RECOVERY STRATEGIES (Priority Order):
   A. Scope Defer (67% success rate)
      - Identify Phase 2/Phase 3 scope items that can be deferred
      - Preserve 80%+ of planned value
      - Typical savings: 15-25% of budget

   B. Vendor Renegotiation (54% success rate)
      - Review vendor SOWs for optimization opportunities
      - Renegotiate rates or deliverables
      - Typical savings: 8-15% of vendor costs

   C. Resource Optimization (45% success rate)
      - Review team utilization rates
      - Identify underutilized resources
      - Typical savings: 5-10% of labor costs

3. ESCALATION CRITERIA:
   - Variance > 15%: Escalate to Portfolio Manager
   - Variance > 20%: Escalate to Executive Sponsor
   - CPI < 0.85: Immediate executive briefing

4. MONITORING:
   - Weekly burn rate reviews
   - Bi-weekly stakeholder updates
   - Monthly executive dashboards

Historical Success Rates:
- Early intervention (variance 10-15%): 73% recovery
- Late intervention (variance > 20%): 42% recovery',
  'sop',
  ARRAY['budget', 'finance', 'recovery', 'evm'],
  'Internal SOP',
  '{}',
  (SELECT ARRAY_AGG(random()) FROM generate_series(1, 1536)),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. SOP-PM-018: Cross-Project Dependency Resolution
INSERT INTO knowledge_base (id, title, content, category, tags, source, metadata, embedding, created_at, updated_at)
VALUES (
  'kb-sop-pm-018',
  'SOP-PM-018: Cross-Project Dependency Resolution',
  'Cross-Project Dependency Resolution

When a blocking project delays dependent projects:

1. DETECT EARLY:
   - Monitor dependencies weekly
   - Flag delays > 5 days immediately
   - Notify all impacted PMs within 24 hours

2. COLLABORATION PROTOCOL:
   A. Joint Planning Session (73% success rate)
      - Include PMs from all impacted projects
      - Review revised timeline and priorities
      - Identify resource reallocation opportunities
      - Duration: 90 minutes max

   B. Interim Solution (65% success rate)
      - Create minimal viable workaround
      - Examples: API mocks, stub implementations, parallel workstreams
      - Typical effort: 8-24 hours
      - Unblocks dependent projects 60-80%

   C. Portfolio Manager Escalation (if unresolved in 48hrs)
      - Provide dependency impact analysis
      - Recommend resource augmentation
      - Request priority reallocation

3. SUCCESSFUL PATTERNS:
   - Early coordination + interim solution: 73% success
   - Delayed response (> 1 week): 38% success
   - No action taken: 15% success (mostly luck)

4. LESSONS LEARNED:
   - Grid Modernization (2024): Joint planning resolved 18-day delay in 12 days
   - Billing System v2 (2025): API mock unblocked 3 projects, saved 6 weeks
   - Customer CRM (2025): No action taken, resulted in 12-week cascade delay',
  'sop',
  ARRAY['dependencies', 'collaboration', 'planning', 'coordination'],
  'Internal SOP',
  '{}',
  (SELECT ARRAY_AGG(random()) FROM generate_series(1, 1536)),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. PMBOK 7th Edition: Section 7.4 - Cost Control
INSERT INTO knowledge_base (id, title, content, category, tags, source, metadata, embedding, created_at, updated_at)
VALUES (
  'kb-pmbok-7-4',
  'PMBOK 7th Edition: Section 7.4 - Cost Control',
  'Cost Control (PMBOK 7.4)

Earned Value Management (EVM) is the primary tool for cost control:

KEY METRICS:
- CPI (Cost Performance Index) = EV / AC
  - CPI > 1.0: Under budget
  - CPI < 1.0: Over budget
  - CPI < 0.85: Critical risk

- SPI (Schedule Performance Index) = EV / PV
  - SPI > 1.0: Ahead of schedule
  - SPI < 1.0: Behind schedule
  - SPI < 0.85: Critical risk

- EAC (Estimate at Completion) = BAC / CPI
  - Forecasts final project cost based on current performance

CONTROL ACTIONS:
1. When CPI < 0.95:
   - Conduct root cause analysis
   - Review resource utilization
   - Identify cost reduction opportunities

2. When CPI < 0.85:
   - Immediate stakeholder briefing
   - Scope review for deferral options
   - Consider project re-baselining

3. When variance trend worsens over 3 consecutive periods:
   - Implement corrective action plan
   - Increase monitoring frequency
   - Consider external audit

BEST PRACTICES:
- Measure EVM weekly
- Report to stakeholders bi-weekly
- Use trend analysis, not just point-in-time metrics
- Combine cost and schedule performance for complete picture',
  'methodology',
  ARRAY['pmbok', 'evm', 'cost-control', 'metrics'],
  'PMBOK 7th Edition',
  '{}',
  (SELECT ARRAY_AGG(random()) FROM generate_series(1, 1536)),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Continue with remaining articles...
-- (Truncated for brevity - you can add the rest similarly)

SELECT 'Knowledge base seeded successfully' AS result;
SELECT COUNT(*) AS total_articles FROM knowledge_base;
