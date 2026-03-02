/**
 * Create missing agent rules in Rulebricks
 */
import { RulebricksClient } from "@rulebricks/sdk";
import { randomUUID } from "crypto";

const rb = new RulebricksClient({
  environment: "https://rulebricks.com/api/v1",
  apiKey: process.env.RULEBRICKS_API_KEY || "",
});

// Rules to create for each agent
const AGENT_RULES = [
  {
    slug: "risk-alert",
    name: "Risk Alert",
    description: "Risk score escalation - Warning >=6, Critical >=9",
    agent: "Risk",
    requestSchema: [
      { key: "projectId", name: "Project ID", type: "string", show: true },
      { key: "projectName", name: "Project Name", type: "string", show: true },
      { key: "riskScore", name: "Risk Score", type: "number", show: true },
      { key: "riskCategory", name: "Risk Category", type: "string", show: true },
      { key: "impact", name: "Impact", type: "string", show: true },
      { key: "severity", name: "Severity", type: "string", show: true },
    ],
    responseSchema: [
      { key: "action", name: "Action", type: "string", show: true },
      { key: "escalate", name: "Escalate", type: "boolean", show: true },
      { key: "notifyRoles", name: "Notify Roles", type: "string", show: true },
    ],
    conditions: [
      {
        request: { riskScore: { op: "greaterThanOrEquals", args: [9] } },
        response: {
          action: { value: "immediate_escalation" },
          escalate: { value: true },
          notifyRoles: { value: "executive,risk_manager" }
        },
        settings: { enabled: true, priority: 0 }
      },
      {
        request: { riskScore: { op: "greaterThanOrEquals", args: [6] } },
        response: {
          action: { value: "review_required" },
          escalate: { value: true },
          notifyRoles: { value: "risk_manager" }
        },
        settings: { enabled: true, priority: 1 }
      },
      {
        request: {},
        response: {
          action: { value: "monitor" },
          escalate: { value: false },
          notifyRoles: { value: "" }
        },
        settings: { enabled: true, priority: 2 }
      }
    ]
  },
  {
    slug: "health-alert",
    name: "Health Alert",
    description: "Project health monitoring - triggers on schedule variance < -5 days",
    agent: "PMO",
    requestSchema: [
      { key: "projectId", name: "Project ID", type: "string", show: true },
      { key: "projectName", name: "Project Name", type: "string", show: true },
      { key: "healthScore", name: "Health Score", type: "number", show: true },
      { key: "scheduleVariance", name: "Schedule Variance (days)", type: "number", show: true },
      { key: "severity", name: "Severity", type: "string", show: true },
    ],
    responseSchema: [
      { key: "action", name: "Action", type: "string", show: true },
      { key: "escalate", name: "Escalate", type: "boolean", show: true },
      { key: "intervention", name: "Intervention Type", type: "string", show: true },
    ],
    conditions: [
      {
        request: { scheduleVariance: { op: "lessThan", args: [-14] } },
        response: {
          action: { value: "critical_intervention" },
          escalate: { value: true },
          intervention: { value: "executive_review" }
        },
        settings: { enabled: true, priority: 0 }
      },
      {
        request: { scheduleVariance: { op: "lessThan", args: [-5] } },
        response: {
          action: { value: "schedule_recovery" },
          escalate: { value: true },
          intervention: { value: "pm_review" }
        },
        settings: { enabled: true, priority: 1 }
      },
      {
        request: {},
        response: {
          action: { value: "monitor" },
          escalate: { value: false },
          intervention: { value: "none" }
        },
        settings: { enabled: true, priority: 2 }
      }
    ]
  },
  {
    slug: "change-impact",
    name: "Change Impact",
    description: "Change impact assessment - triggers on high organizational impact",
    agent: "OCM",
    requestSchema: [
      { key: "changeId", name: "Change ID", type: "string", show: true },
      { key: "changeType", name: "Change Type", type: "string", show: true },
      { key: "impact", name: "Impact Level", type: "string", show: true },
      { key: "affectedTeams", name: "Affected Teams Count", type: "number", show: true },
      { key: "severity", name: "Severity", type: "string", show: true },
    ],
    responseSchema: [
      { key: "action", name: "Action", type: "string", show: true },
      { key: "requiresChampions", name: "Requires Change Champions", type: "boolean", show: true },
      { key: "communicationPlan", name: "Communication Plan", type: "string", show: true },
    ],
    conditions: [
      {
        request: { impact: { op: "equals", args: ["high"] } },
        response: {
          action: { value: "comprehensive_change_management" },
          requiresChampions: { value: true },
          communicationPlan: { value: "enterprise_wide" }
        },
        settings: { enabled: true, priority: 0 }
      },
      {
        request: { impact: { op: "equals", args: ["medium"] } },
        response: {
          action: { value: "targeted_change_management" },
          requiresChampions: { value: true },
          communicationPlan: { value: "department_level" }
        },
        settings: { enabled: true, priority: 1 }
      },
      {
        request: {},
        response: {
          action: { value: "standard_communication" },
          requiresChampions: { value: false },
          communicationPlan: { value: "team_level" }
        },
        settings: { enabled: true, priority: 2 }
      }
    ]
  },
  {
    slug: "dependency-alert",
    name: "Dependency Alert",
    description: "Dependency blocking detection - triggers on >5 blocked dependencies",
    agent: "Planning",
    requestSchema: [
      { key: "projectId", name: "Project ID", type: "string", show: true },
      { key: "blockedCount", name: "Blocked Dependencies", type: "number", show: true },
      { key: "atRiskCount", name: "At Risk Dependencies", type: "number", show: true },
      { key: "severity", name: "Severity", type: "string", show: true },
    ],
    responseSchema: [
      { key: "action", name: "Action", type: "string", show: true },
      { key: "escalate", name: "Escalate", type: "boolean", show: true },
      { key: "resolutionPriority", name: "Resolution Priority", type: "string", show: true },
    ],
    conditions: [
      {
        request: { blockedCount: { op: "greaterThan", args: [10] } },
        response: {
          action: { value: "critical_dependency_resolution" },
          escalate: { value: true },
          resolutionPriority: { value: "immediate" }
        },
        settings: { enabled: true, priority: 0 }
      },
      {
        request: { blockedCount: { op: "greaterThan", args: [5] } },
        response: {
          action: { value: "dependency_review" },
          escalate: { value: true },
          resolutionPriority: { value: "high" }
        },
        settings: { enabled: true, priority: 1 }
      },
      {
        request: {},
        response: {
          action: { value: "monitor" },
          escalate: { value: false },
          resolutionPriority: { value: "normal" }
        },
        settings: { enabled: true, priority: 2 }
      }
    ]
  }
];

async function createRules() {
  console.log("Creating missing agent rules in Rulebricks...\n");

  // First, list existing rules to avoid duplicates
  const existingRules = await rb.assets.rules.list({});
  const existingSlugs = new Set(existingRules.map((r: any) => r.slug));
  console.log(`Found ${existingRules.length} existing rules:`, [...existingSlugs]);

  for (const rule of AGENT_RULES) {
    if (existingSlugs.has(rule.slug)) {
      console.log(`⏭️  Skipping "${rule.slug}" - already exists`);
      continue;
    }

    try {
      console.log(`📝 Creating rule: ${rule.slug} (${rule.agent} Agent)`);

      const result = await rb.assets.rules.push({
        rule: {
          id: randomUUID(),
          slug: rule.slug,
          name: rule.name,
          description: rule.description,
          published: false,
          _publish: true,
          requestSchema: rule.requestSchema,
          responseSchema: rule.responseSchema,
          conditions: rule.conditions,
          testRequest: {},
          sampleRequest: {},
          sampleResponse: {},
          history: [],
        } as any
      });

      console.log(`✅ Created: ${rule.slug}`);
    } catch (err: any) {
      console.error(`❌ Failed to create ${rule.slug}:`, err.message);
    }
  }

  // List rules again to confirm
  console.log("\n--- Final Rules List ---");
  const finalRules = await rb.assets.rules.list({});
  for (const r of finalRules) {
    console.log(`  - ${r.slug}: ${r.name}`);
  }
  console.log(`\nTotal: ${finalRules.length} rules`);
}

createRules().catch(console.error);
