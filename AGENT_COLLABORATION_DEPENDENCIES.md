# AGENT-DRIVEN CROSS-PROJECT DEPENDENCY COLLABORATION

**Purpose**: Agents proactively identify dependency issues and foster collaboration between project teams via HITL

---

## 🎯 THE SCENARIO

### Current State (No Collaboration)
```
Project A: Customer Portal v3
- Depends on: Auth Service API (Project B)
- Status: Blocked for 2 weeks
- Team A doesn't know Team B is behind schedule

Project B: Auth Service Modernization
- Schedule: 3 weeks delayed
- Team B doesn't know Project A is blocked
- No one coordinating the dependency
```

### Desired State (Agent-Fostered Collaboration)
```
🤖 Planning Agent Detects Dependency Risk:
"Project A (Customer Portal) is blocked waiting for Auth API from
Project B (Auth Modernization), which is 3 weeks delayed. Historical
data shows this dependency pattern causes 8-week delays on average.

RECOMMENDATION: Initiate cross-team coordination NOW
- Schedule joint planning session (both PMs)
- Create interim API mock for Project A to unblock dev
- Escalate to Portfolio Manager if not resolved in 48hrs"

HITL Action Queue → Both PMs notified → Collaboration initiated
```

---

## 🏗️ ARCHITECTURE: DEPENDENCY DETECTION + HITL COLLABORATION

### Component 1: Dependency Graph Monitor

```typescript
// server/agents/DependencyCollaborationAgent.ts

import { DeepAgentWithRAG } from "./deep/DeepAgentWithRAG.js";
import { AgentRAGService } from "../lib/AgentRAGService.js";
import type { IStorage } from "../storage.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

interface DependencyRisk {
  blockingProject: {
    id: string;
    name: string;
    owner: string;
    status: string;
    delayDays: number;
  };
  blockedProjects: Array<{
    id: string;
    name: string;
    owner: string;
    waitingFor: string;
    impactDays: number;
  }>;
  riskLevel: "critical" | "high" | "medium" | "low";
  historicalPattern?: {
    patternName: string;
    averageDelayDays: number;
    successfulResolutions: string[];
  };
  recommendedCollaboration: {
    participants: string[]; // PM IDs
    urgency: string;
    suggestedActions: string[];
  };
}

export class DependencyCollaborationAgent extends DeepAgentWithRAG {
  constructor(storage: IStorage) {
    const config = {
      agentName: "DependencyCollaboration",
      agentType: "cross_project_orchestration",
      description: "Detects cross-project dependencies and fosters team collaboration via HITL",
      capabilities: [
        "Dependency graph analysis",
        "Cross-project risk detection",
        "Team collaboration facilitation",
        "Historical pattern matching for dependency issues",
        "Proactive stakeholder coordination",
      ],
      enablePlanning: true,
      enableReflection: true,
    };
    super(config, storage);
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "analyze_dependency_graph",
        description: "Analyze all project dependencies and identify blocking/blocked relationships",
        schema: z.object({
          portfolioId: z.string().optional(),
        }),
        func: async ({ portfolioId }) => {
          const projects = portfolioId
            ? await this.storage.getProjectsByPortfolio(portfolioId)
            : await this.storage.getProjects();

          const dependencies = await this.storage.getDependencies();

          // Build dependency graph
          const dependencyGraph = this.buildDependencyGraph(projects, dependencies);

          return dependencyGraph;
        },
      }),

      new DynamicStructuredTool({
        name: "detect_blocking_risks",
        description: "Identify projects that are blocking others due to delays",
        schema: z.object({
          portfolioId: z.string().optional(),
        }),
        func: async ({ portfolioId }) => {
          const projects = portfolioId
            ? await this.storage.getProjectsByPortfolio(portfolioId)
            : await this.storage.getProjects();

          const dependencies = await this.storage.getDependencies();

          const blockingRisks: DependencyRisk[] = [];

          for (const dep of dependencies) {
            const blockingProj = projects.find(p => p.id === dep.blockingProjectId);
            const blockedProj = projects.find(p => p.id === dep.blockedProjectId);

            if (!blockingProj || !blockedProj) continue;

            // Check if blocking project is delayed or at-risk
            const isDelayed = blockingProj.status === 'at-risk' || blockingProj.status === 'delayed';
            const expectedDate = new Date(dep.expectedCompletionDate || Date.now());
            const now = new Date();
            const isOverdue = expectedDate < now;

            if (isDelayed || isOverdue) {
              // Calculate delay impact
              const delayDays = Math.floor((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));

              // Find all projects blocked by this one
              const allBlocked = dependencies
                .filter(d => d.blockingProjectId === blockingProj.id)
                .map(d => projects.find(p => p.id === d.blockedProjectId))
                .filter(p => p);

              // Search RAG for similar dependency patterns
              const pattern = await this.ragService.findPatternMatches({
                type: 'dependency_delay',
                blockingProjectStatus: blockingProj.status,
                delayDays,
                numBlockedProjects: allBlocked.length,
              }, 3);

              blockingRisks.push({
                blockingProject: {
                  id: blockingProj.id,
                  name: blockingProj.name,
                  owner: blockingProj.owner || 'Unknown',
                  status: blockingProj.status || 'unknown',
                  delayDays,
                },
                blockedProjects: allBlocked.map(bp => ({
                  id: bp.id,
                  name: bp.name,
                  owner: bp.owner || 'Unknown',
                  waitingFor: dep.deliverable || 'Unknown',
                  impactDays: delayDays,
                })),
                riskLevel: delayDays > 14 ? 'critical' : delayDays > 7 ? 'high' : 'medium',
                historicalPattern: pattern[0] ? {
                  patternName: pattern[0].patternName,
                  averageDelayDays: pattern[0].typicalOutcome?.averageDelayDays || 0,
                  successfulResolutions: pattern[0].successInterventions?.map((i: any) => i.action) || [],
                } : undefined,
                recommendedCollaboration: {
                  participants: [blockingProj.owner, ...allBlocked.map(bp => bp.owner)].filter(Boolean),
                  urgency: delayDays > 14 ? 'immediate' : 'within_48hrs',
                  suggestedActions: [
                    'Schedule joint planning session',
                    'Create interim solution/workaround',
                    'Escalate to Portfolio Manager',
                  ],
                },
              });
            }
          }

          return blockingRisks;
        },
      }),

      new DynamicStructuredTool({
        name: "create_collaboration_intervention",
        description: "Create HITL intervention to facilitate cross-team collaboration",
        schema: z.object({
          dependencyRisk: z.any(),
        }),
        func: async ({ dependencyRisk }) => {
          const risk = dependencyRisk as DependencyRisk;

          // Search RAG for successful collaboration strategies
          const collaborationKnowledge = await this.ragService.searchKnowledge(
            `cross-project dependency resolution collaboration strategies`,
            'sop',
            5
          );

          // Generate narrative using RAG
          const narrative = await this.generateCollaborationNarrative(risk, collaborationKnowledge);

          // Create intervention in HITL queue
          const interventionId = await this.storage.createIntervention({
            agentName: this.config.agentName,
            type: 'dependency_collaboration',
            severity: risk.riskLevel,
            title: `Dependency Risk: ${risk.blockingProject.name} blocking ${risk.blockedProjects.length} projects`,
            description: narrative,
            recommendedAction: risk.recommendedCollaboration.suggestedActions.join('; '),
            affectedProjects: [
              risk.blockingProject.id,
              ...risk.blockedProjects.map(p => p.id),
            ],
            confidence: 0.85,
            expectedImpact: `${risk.blockedProjects.length} projects affected`,
            status: 'pending',
          });

          // Notify all stakeholders (PMs, Portfolio Manager)
          await this.notifyStakeholders(risk, interventionId);

          return {
            interventionId,
            stakeholdersNotified: risk.recommendedCollaboration.participants,
            narrative,
          };
        },
      }),
    ];
  }

  protected getSystemPrompt(): string {
    return `You are the Dependency Collaboration Agent, responsible for detecting cross-project dependencies
and fostering proactive collaboration between teams.

Your mission:
1. Monitor all project dependencies continuously
2. Detect when blocking projects are delayed
3. Identify impacted (blocked) projects
4. Search historical patterns for successful resolutions
5. Create HITL interventions that bring teams together
6. Recommend specific collaboration actions

You PROACTIVELY initiate collaboration before issues escalate. Don't wait for teams to ask for help.`;
  }

  /**
   * Build dependency graph from projects and dependencies
   */
  private buildDependencyGraph(projects: any[], dependencies: any[]): any {
    const graph: any = {
      nodes: projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        owner: p.owner,
      })),
      edges: dependencies.map(d => ({
        from: d.blockingProjectId,
        to: d.blockedProjectId,
        deliverable: d.deliverable,
        expectedDate: d.expectedCompletionDate,
      })),
    };

    return graph;
  }

  /**
   * Generate detailed collaboration narrative using RAG
   */
  private async generateCollaborationNarrative(
    risk: DependencyRisk,
    knowledge: any[]
  ): Promise<string> {
    const prompt = `Generate a detailed HITL intervention narrative for this dependency risk:

Blocking Project: ${risk.blockingProject.name} (${risk.blockingProject.delayDays} days delayed)
Blocked Projects: ${risk.blockedProjects.map(p => p.name).join(', ')}

Historical Pattern: ${risk.historicalPattern?.patternName || 'No pattern match'}
Average Delay Impact: ${risk.historicalPattern?.averageDelayDays || 'Unknown'} days

Successful Resolutions from History:
${risk.historicalPattern?.successfulResolutions.join('\n') || 'None'}

Knowledge Base References:
${knowledge.map(k => `- ${k.title}: ${k.content.substring(0, 200)}...`).join('\n')}

Generate a narrative that:
1. Explains the dependency issue clearly
2. Quantifies the impact (X projects blocked, Y days delay)
3. References historical similar cases
4. Recommends specific collaboration actions
5. Suggests who should be involved
6. Provides timeline for action

Format as a detailed, actionable intervention message.`;

    const response = await this.model.invoke(prompt);
    return response.content.toString();
  }

  /**
   * Notify all stakeholders about the dependency risk
   */
  private async notifyStakeholders(risk: DependencyRisk, interventionId: string): Promise<void> {
    // Implementation: Send notifications via WebSocket, email, etc.
    console.log(`[DependencyAgent] Notifying ${risk.recommendedCollaboration.participants.length} stakeholders`);

    // Broadcast to WebSocket
    // broadcastNotification({
    //   type: 'dependency_collaboration_required',
    //   interventionId,
    //   participants: risk.recommendedCollaboration.participants,
    //   urgency: risk.recommendedCollaboration.urgency,
    // });
  }

  /**
   * Run continuous monitoring (called by scheduler)
   */
  async runDependencyMonitoring(): Promise<void> {
    console.log('[DependencyAgent] Running dependency monitoring...');

    const risks = await this.defineTools()[1].func({ portfolioId: undefined });

    for (const risk of risks) {
      if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
        await this.defineTools()[2].func({ dependencyRisk: risk });
      }
    }

    console.log(`[DependencyAgent] Monitoring complete. Found ${risks.length} risks.`);
  }
}
```

---

## 📚 HOW AGENTS USE RAG AS KNOWLEDGE SOURCE

### Step-by-Step Knowledge Retrieval

```typescript
/**
 * EXAMPLE: How FinOps Agent Uses RAG Knowledge
 */

// 1. Agent analyzes project budget issue
const project = await storage.getProject('proj-123');
const budgetVariance = (project.actualCost - project.budget) / project.budget;

// 2. Agent queries RAG for similar situations
const similarDecisions = await ragService.findSimilarDecisions({
  projectType: project.type,
  budgetVariance: budgetVariance,
  phase: 'execution',
  cpi: 0.82,
}, 'FinOps', 10);

// Returns:
// [
//   {
//     decisionId: 'dec-2025-1234',
//     recommendation: 'Defer Phase 2 scope',
//     outcome: { saved: 280000, success: true },
//     similarity: 0.91,
//   },
//   ...9 more similar decisions
// ]

// 3. Agent queries RAG for relevant knowledge base articles
const knowledge = await ragService.searchKnowledge(
  'budget overrun recovery strategies project management',
  'sop', // category: SOPs
  5
);

// Returns:
// [
//   {
//     title: 'SOP-FIN-042: Budget Recovery Procedures',
//     content: 'When budget variance exceeds 10%...',
//     similarity: 0.87,
//   },
//   {
//     title: 'PMBOK Section 7.4: Cost Control',
//     content: 'Earned value management techniques...',
//     similarity: 0.83,
//   },
//   ...3 more articles
// ]

// 4. Agent finds matching patterns
const patterns = await ragService.findPatternMatches({
  budgetVariancePercent: 15,
  cpiValue: 0.82,
  completionPercent: 42,
  projectType: 'digital_transformation',
}, 5);

// Returns:
// [
//   {
//     patternName: 'CPI Drop Below 0.85 at 40% Completion',
//     typicalOutcome: { avgOverrun: 18.3, avgDelayWeeks: 3 },
//     successInterventions: [
//       { action: 'Scope defer', successRate: 0.67 },
//       { action: 'Vendor renegotiation', successRate: 0.54 },
//     ],
//     similarity: 0.89,
//   },
//   ...4 more patterns
// ]

// 5. Agent constructs narrative combining all knowledge
const narrative = await agent.generatePredictiveNarrative(project.id);

// Final narrative includes:
// - Current situation (from project data)
// - Similar projects (from RAG decision history)
// - Proven solutions (from RAG patterns)
// - Knowledge references (from RAG knowledge base)
// - Predictive forecast (from pattern analysis)
```

### Knowledge Source Priority

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT KNOWLEDGE SOURCES                   │
└─────────────────────────────────────────────────────────────┘

1. DECISION HISTORY (agent_decision_history)
   → What agents recommended in the past
   → What actually happened (outcomes)
   → Success rates of interventions
   Use Case: "3 similar projects saved $380K with scope defer"

2. PATTERN LIBRARY (project_outcome_patterns)
   → Recurring patterns across portfolio
   → Typical outcomes for each pattern
   → Successful/failed interventions
   Use Case: "This CPI pattern appears in 12 projects, avg 18% overrun"

3. KNOWLEDGE BASE (knowledge_base)
   → SOPs (Standard Operating Procedures)
   → PMBOK methodology
   → Internal playbooks
   → Lesson learned documents
   Use Case: "According to SOP-FIN-042 and PMBOK Section 7.4..."

4. REAL-TIME DATA (PostgreSQL)
   → Current project metrics
   → Team information
   → Budget/schedule data
   Use Case: "Current burn rate: $150K/week"

5. LEARNING FEEDBACK (agent_learning_feedback)
   → Agent accuracy over time
   → Prediction vs actual comparison
   → Confidence calibration
   Use Case: "Agent was 91% accurate on similar predictions"
```

---

## 🤝 HITL COLLABORATION WORKFLOW

### Scenario: Dependency Detected

```
STEP 1: Agent Detects Issue
━━━━━━━━━━━━━━━━━━━━━━━━━━
DependencyAgent runs every 6 hours
Finds: Project B is 2 weeks delayed, blocking Project A

STEP 2: Agent Searches RAG
━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Finds 8 similar dependency delays in history
→ Learns that avg delay cascades to 8 weeks
→ Finds SOP-PM-018: "Cross-Project Dependency Resolution"
→ Identifies successful intervention: "Joint planning session + interim API mock"

STEP 3: Agent Creates HITL Intervention
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Intervention appears in AgentActionQueue:

┌────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL: Dependency Risk Detected                  │
│                                                        │
│ Project B (Auth Modernization) is 14 days delayed,    │
│ blocking Project A (Customer Portal). Historical data  │
│ shows this pattern causes 8-week cascade delays.       │
│                                                        │
│ LEARNED FROM HISTORY:                                  │
│ → 8 similar cases found in portfolio                   │
│ → Average cascade delay: 8.2 weeks                     │
│ → Successful resolution rate: 73% with early action   │
│                                                        │
│ RECOMMENDED COLLABORATION:                             │
│ 1. Schedule joint planning: PM of Project A + PM of   │
│    Project B within 48 hours                           │
│ 2. Create interim API mock for Project A (unblocks    │
│    development)                                        │
│ 3. Escalate to Portfolio Manager if not resolved      │
│                                                        │
│ KNOWLEDGE BASE:                                        │
│ → SOP-PM-018: Cross-Project Dependency Resolution      │
│ → Success pattern: "Early coordination + interim       │
│    solution" (73% success rate from 8 cases)           │
│                                                        │
│ STAKEHOLDERS NOTIFIED:                                 │
│ ✓ Jane Doe (PM, Project A)                             │
│ ✓ John Smith (PM, Project B)                           │
│ ✓ Sarah Johnson (Portfolio Manager)                   │
│                                                        │
│ [✓ Approve Collaboration] [✗ Dismiss] [👁 View Details]│
└────────────────────────────────────────────────────────┘

STEP 4: PMs Approve → Collaboration Initiated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ System creates calendar invite for joint planning
→ System creates task: "Build interim API mock"
→ System sets 48hr deadline
→ System tracks resolution

STEP 5: Agent Monitors Outcome
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Did collaboration happen? YES
→ Was deadline resolved? YES (12 days)
→ Did it prevent cascade delay? YES
→ Store outcome in RAG: Success pattern confirmed
→ Update pattern success rate: 73% → 74%
```

---

## 🎯 EXAMPLE: DEPENDENCY COLLABORATION IN ACTION

### Blocking Project: Auth Service Modernization
- Status: 14 days delayed
- Blocking: 3 projects

### Agent-Generated HITL Intervention

```
🔴 CRITICAL DEPENDENCY ALERT: Multi-Project Blocking Risk

Agent: DependencyCollaboration | Confidence: 89% | Based on: 8 similar historical cases

SITUATION:
Project "Auth Service Modernization" is currently 14 days behind schedule and
is blocking 3 downstream projects:
- Customer Portal v3 (waiting for: OAuth2 API)
- Mobile App Refresh (waiting for: SSO integration)
- Partner Portal (waiting for: SAML provider)

HISTORICAL ANALYSIS:
This dependency pattern has occurred 8 times in portfolio history:
→ Grid Modernization (2024): 18-day delay cascaded to 9-week portfolio impact
→ Billing System v2 (2025): Early intervention reduced cascade to 3 weeks
→ Customer CRM (2025): No action taken, resulted in 12-week total delay

Pattern: "Single API Blocking Multiple Projects"
Average cascade delay: 8.2 weeks when no intervention
Success rate with early coordination: 73%

PREDICTIVE FORECAST (if no action):
┌─────────┬──────────────────┬───────────────────────┐
│ Week    │ Blocking Status  │ Downstream Impact     │
├─────────┼──────────────────┼───────────────────────┤
│ Week 2  │ 2 weeks delayed  │ 3 projects waiting    │
│ Week 4  │ 4 weeks delayed  │ Customer Portal slips │
│ Week 6  │ 6 weeks delayed  │ Mobile App slips      │
│ Week 8  │ 8 weeks delayed  │ All 3 projects at-risk│
└─────────┴──────────────────┴───────────────────────┘

RECOMMENDED COLLABORATION (Proven 73% Success Rate):

1. [IMMEDIATE] Joint Planning Session
   → Participants: Jane Doe (PM, Customer Portal)
                   John Smith (PM, Auth Service)
                   Mike Brown (PM, Mobile App)
                   Lisa White (PM, Partner Portal)
   → Agenda: Revised timeline, dependency priorities, resource reallocation
   → Deadline: Within 48 hours
   → Based on: Billing System v2 success case (resolved in 12 days)

2. [URGENT] Interim Solution: API Mock
   → Create minimal viable API mock for Customer Portal to unblock frontend dev
   → Estimated effort: 16 hours
   → Expected value: Unblocks $420K project, maintains 85% of timeline
   → Based on: Customer CRM playbook (SOP-PM-018)

3. [HIGH] Portfolio Manager Escalation
   → If not resolved in 48hrs, escalate to Sarah Johnson (Portfolio Manager)
   → Consider: Resource augmentation for Auth Service team
   → Based on: Grid Modernization escalation pattern

KNOWLEDGE BASE REFERENCES:
→ SOP-PM-018: "Cross-Project Dependency Resolution" (Section 3.2: API Mocks)
→ PMBOK 7th Edition: Section 6.6 (Critical Path Management)
→ Internal Playbook: "Multi-Project Coordination" (8 successful cases)

STAKEHOLDERS NOTIFIED:
✓ Jane Doe (jane.doe@nexteraenergy.com) - Customer Portal PM
✓ John Smith (john.smith@nexteraenergy.com) - Auth Service PM
✓ Mike Brown (mike.brown@nexteraenergy.com) - Mobile App PM
✓ Lisa White (lisa.white@nexteraenergy.com) - Partner Portal PM
✓ Sarah Johnson (sarah.j@nexteraenergy.com) - Portfolio Manager

EXPECTED OUTCOME (if actions approved):
- Joint planning session scheduled: Day 1
- Interim API mock deployed: Day 3
- Auth Service timeline revised: Day 5
- Downstream projects unblocked: Day 7
- Portfolio risk reduced: From CRITICAL to MEDIUM

FINANCIAL IMPACT:
- Potential cascade delay cost: $1.2M (3 projects delayed 8 weeks each)
- Intervention cost: $15K (16hrs mock + 8hrs meeting time)
- Expected savings: $1.185M
- ROI: 7,900%

[✓ Approve All Actions] [Schedule Meeting] [View 8 Similar Cases] [✗ Dismiss]
```

---

## 📊 METRICS TO TRACK

### Agent Collaboration Effectiveness
- **Dependency risks detected**: Count per week
- **Collaboration interventions created**: Count
- **Stakeholder response rate**: % who approve/engage
- **Resolution time**: Avg days to resolve
- **Cascade delays prevented**: Count + $ value

### RAG Knowledge Quality
- **Decision history size**: Total decisions stored
- **Pattern library size**: Total patterns extracted
- **Knowledge base articles**: Total SOPs/PMBOK/playbooks
- **Retrieval relevance**: Avg similarity score
- **Prediction accuracy**: % accurate forecasts

### Learning Loop Effectiveness
- **Agent accuracy over time**: Trending up?
- **Success rate by intervention type**: Which work best?
- **Knowledge usage**: Which SOPs most referenced?
- **Pattern evolution**: New patterns discovered?

---

## 🚀 IMPLEMENTATION ORDER

1. ✅ RAG tables + pg_vector (30 min)
2. ✅ AgentRAGService (1 hour)
3. ✅ DeepAgentWithRAG base class (1 hour)
4. ✅ DependencyCollaborationAgent (1 hour)
5. ✅ Seed knowledge base with SOPs (30 min)
6. ✅ Test end-to-end flow (30 min)
7. ✅ UI updates for collaboration interventions (30 min)

Total: ~5 hours

---

## ✅ READY TO START

I'll now:
1. Install pg_vector
2. Create all tables
3. Build RAG service
4. Implement dependency collaboration agent
5. Seed with sample SOPs
6. Update HITL UI

Then move to UI improvements (EVM charts, etc.)

**Let's build agents that truly collaborate and learn!**
