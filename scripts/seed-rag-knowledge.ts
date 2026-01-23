/**
 * SEED RAG KNOWLEDGE BASE
 *
 * Populates the knowledge_base table with:
 * - SOPs (Standard Operating Procedures)
 * - PMBOK methodology content
 * - Internal playbooks
 * - Lesson learned documents
 *
 * Run with: npx tsx scripts/seed-rag-knowledge.ts
 */

import { storage } from "../server/storage.js";
import { AgentRAGService } from "../server/lib/AgentRAGService.js";

const knowledgeArticles = [
  // SOPs - Financial Management
  {
    title: "SOP-FIN-042: Budget Recovery Procedures",
    content: `Budget Recovery Procedures

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
- Late intervention (variance > 20%): 42% recovery`,
    category: "sop",
    tags: ["budget", "finance", "recovery", "evm"],
    source: "Internal SOP",
  },

  {
    title: "SOP-PM-018: Cross-Project Dependency Resolution",
    content: `Cross-Project Dependency Resolution

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
   - Customer CRM (2025): No action taken, resulted in 12-week cascade delay`,
    category: "sop",
    tags: ["dependencies", "collaboration", "planning", "coordination"],
    source: "Internal SOP",
  },

  // PMBOK Content
  {
    title: "PMBOK 7th Edition: Section 7.4 - Cost Control",
    content: `Cost Control (PMBOK 7.4)

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
- Combine cost and schedule performance for complete picture`,
    category: "methodology",
    tags: ["pmbok", "evm", "cost-control", "metrics"],
    source: "PMBOK 7th Edition",
  },

  {
    title: "PMBOK 7th Edition: Section 6.6 - Critical Path Management",
    content: `Critical Path Management (PMBOK 6.6)

The critical path is the sequence of activities that determines the minimum project duration.

IDENTIFICATION:
1. Network diagram creation
2. Forward pass (earliest start/finish)
3. Backward pass (latest start/finish)
4. Float calculation (Total Float = LS - ES)
5. Critical path = activities with zero float

MANAGEMENT STRATEGIES:
A. Fast Tracking (Parallel Activities)
   - Execute sequential activities in parallel
   - Risk: Rework if dependencies violated
   - Use when: Schedule more important than cost

B. Crashing (Add Resources)
   - Add resources to critical path activities
   - Risk: Increased cost, diminishing returns
   - Use when: Budget available, deadline fixed

C. Scope Reduction
   - Remove non-critical deliverables
   - Risk: Reduced value
   - Use when: Budget and schedule both constrained

DEPENDENCY TYPES:
- Finish-to-Start (FS): Most common
- Start-to-Start (SS): Parallel work
- Finish-to-Finish (FF): Coordinated completion
- Start-to-Finish (SF): Rare, avoid if possible

MONITORING:
- Update critical path weekly
- Track float consumption
- Identify activities becoming critical
- Manage near-critical paths (float < 5 days)`,
    category: "methodology",
    tags: ["pmbok", "schedule", "critical-path", "dependencies"],
    source: "PMBOK 7th Edition",
  },

  // Internal Playbooks
  {
    title: "Playbook: Multi-Project Coordination",
    content: `Multi-Project Coordination Playbook

Based on 8 successful coordination cases (2024-2025)

SCENARIO: Multiple projects share dependencies or resources

APPROACH:
1. DEPENDENCY MAPPING (Day 1)
   - Create cross-project dependency matrix
   - Identify critical dependencies
   - Flag high-risk dependencies (single points of failure)

2. COORDINATION CADENCE (Ongoing)
   - Weekly PM sync (30 min)
   - Bi-weekly portfolio review (60 min)
   - Monthly stakeholder alignment (90 min)

3. SHARED DELIVERABLES (As Needed)
   - Designate "owner" project
   - Define acceptance criteria collaboratively
   - Create shared backlog/kanban board

4. CONFLICT RESOLUTION (As Needed)
   - Resource conflicts: Portfolio Manager arbitrates
   - Priority conflicts: Business value scoring
   - Technical conflicts: Architecture board decision

SUCCESSFUL CASES:
1. FPL Grid Modernization + Customer Portal (2024)
   - Shared: Auth API, Data Platform
   - Coordination: Weekly PM sync
   - Outcome: Both delivered on time, 0 conflicts

2. NEER Wind Project + Battery Storage (2025)
   - Shared: Grid interconnection, permitting
   - Coordination: Joint planning sessions
   - Outcome: 3 weeks ahead of schedule

3. Corporate IT Transformation (2025)
   - Shared: Cloud infrastructure, security framework
   - Coordination: Bi-weekly architecture reviews
   - Outcome: $1.2M cost savings through shared services

KEY SUCCESS FACTORS:
- Early coordination (project initiation phase)
- Clear ownership of shared deliverables
- Regular communication cadence
- Portfolio Manager support
- Shared risk register`,
    category: "playbook",
    tags: ["coordination", "multi-project", "dependencies", "collaboration"],
    source: "Internal Playbook",
  },

  {
    title: "Playbook: Scope Defer Without Value Loss",
    content: `Scope Defer Without Value Loss

Based on 12 successful scope deferral cases (2024-2025)

WHEN TO USE:
- Budget variance > 10%
- CPI < 0.90
- Schedule pressure
- Need to preserve core value

PROCESS:
1. VALUE MAPPING (Day 1-2)
   - List all remaining scope items
   - Estimate value for each (business impact, ROI)
   - Estimate effort for each (hours, cost)
   - Calculate value density (value / effort)

2. STAKEHOLDER ALIGNMENT (Day 3)
   - Present value map to stakeholders
   - Get consensus on "must have" vs "nice to have"
   - Identify Phase 2/Phase 3 candidates

3. DEFER DECISION (Day 4)
   - Defer lowest value density items first
   - Target: Preserve 80%+ of value, reduce 20%+ of cost
   - Document deferral rationale
   - Create Phase 2 roadmap

4. COMMUNICATION (Day 5)
   - Notify all affected teams
   - Update project plan and timeline
   - Adjust success criteria
   - Set Phase 2 expectations

SUCCESSFUL PATTERNS:
A. Defer Advanced Features (83% value preserved)
   - Example: Advanced analytics, custom reports, nice-to-have integrations
   - Typical savings: 25-35% of remaining budget

B. Defer Non-Core Integrations (78% value preserved)
   - Example: Third-party integrations, optional APIs
   - Typical savings: 15-25% of remaining budget

C. Defer UX Enhancements (75% value preserved)
   - Example: Advanced visualizations, customization options
   - Typical savings: 10-20% of remaining budget

CASES:
1. Enterprise Data Platform (2025)
   - Deferred: Advanced ML models, custom dashboards
   - Saved: $280K (23% of remaining budget)
   - Value preserved: 82%

2. Grid Modernization Phase 2 (2024)
   - Deferred: Predictive maintenance module
   - Saved: $380K (31% of remaining budget)
   - Value preserved: 85%

3. Customer Portal v3 (2025)
   - Deferred: Social login, advanced notifications
   - Saved: $120K (18% of remaining budget)
   - Value preserved: 79%`,
    category: "playbook",
    tags: ["scope", "deferral", "value", "budget-recovery"],
    source: "Internal Playbook",
  },

  // Lessons Learned
  {
    title: "Lesson Learned: Early Intervention Saves Projects",
    content: `Lesson Learned: Early Intervention Saves Projects

Analysis of 47 project interventions (2024-2025)

FINDING:
Projects where agents detected issues early (variance 10-15%) had 73% successful recovery.
Projects where issues detected late (variance > 20%) had only 42% successful recovery.

EARLY INTERVENTION PATTERN:
- Detection: Variance reaches 10-12%
- Action: Within 1 week of detection
- Success rate: 73%
- Average recovery: 65% of variance

LATE INTERVENTION PATTERN:
- Detection: Variance reaches 20%+
- Action: 2-3 weeks after detection
- Success rate: 42%
- Average recovery: 38% of variance

RECOMMENDED THRESHOLDS:
- Yellow alert: Variance = 8%
- Orange alert: Variance = 12%
- Red alert: Variance = 15%

The earlier agents intervene, the higher the success rate. Don't wait for "critical" status.`,
    category: "lesson_learned",
    tags: ["intervention", "early-detection", "success-rate"],
    source: "Portfolio Analysis 2024-2025",
  },
];

async function seedKnowledge() {
  console.log("Seeding RAG knowledge base...");

  // Wait for storage connection to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verify connection
  if (!storage.db) {
    throw new Error("Storage database connection not available");
  }

  const ragService = new AgentRAGService(storage);

  let seeded = 0;
  for (const article of knowledgeArticles) {
    try {
      await ragService.storeKnowledge(article);
      seeded++;
      console.log(`✓ Stored: ${article.title}`);
    } catch (error) {
      console.error(`✗ Failed to store: ${article.title}`, error);
    }
  }

  console.log(`\nSeeding complete! Stored ${seeded}/${knowledgeArticles.length} articles.`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedKnowledge()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch(err => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}

export { seedKnowledge };
