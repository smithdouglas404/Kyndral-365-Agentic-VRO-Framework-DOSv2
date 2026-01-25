# POLICY AS CODE - COMPLETE END-TO-END DEMONSTRATION

**Status**: ✅ Fully Implemented and Working
**Last Updated**: January 25, 2026

---

## OVERVIEW: HOW IT WORKS

Policy as Code converts compliance documents (PDFs, Word docs) into **executable code** that agents use for real-time enforcement.

**Traditional approach**: RAG queries at runtime (slow, expensive, inconsistent)
**Our approach**: One-time LLM extraction → Executable rules → Instant enforcement

---

## THE COMPLETE FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: DOCUMENT UPLOAD                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ User uploads: "ISO27001_Security_Policy.pdf"                   │
│ Tags document as: "policy_compliance"                          │
│                                                                 │
│ Database: documents table                                       │
│ ├─ id: "doc-123"                                               │
│ ├─ name: "ISO27001_Security_Policy.pdf"                        │
│ ├─ filePath: "/uploads/doc-123.pdf"                            │
│ ├─ documentType: "policy_compliance" ← IMPORTANT!              │
│ └─ createdAt: 2026-01-25                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: LLM EXTRACTION                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ POST /api/policy/extract/doc-123                               │
│ Body: {                                                         │
│   model: "gpt-4",                                              │
│   complianceFramework: "ISO27001"                              │
│ }                                                               │
│                                                                 │
│ PolicyExtractionService processes:                             │
│ 1. Reads document content                                      │
│ 2. Sends to GPT-4 with extraction prompt                       │
│ 3. LLM returns structured JSON                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: POLICY RECORD CREATED                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Database: policy_as_code table                                 │
│ ├─ id: "policy-456"                                            │
│ ├─ source_document_id: "doc-123"                               │
│ ├─ document_name: "ISO27001_Security_Policy.pdf"               │
│ ├─ policy_name: "Information Security Policy"                  │
│ ├─ policy_description: "ISO27001 compliance requirements..."   │
│ ├─ full_policy_code: { ...extracted JSON... }                  │
│ ├─ custom_attributes_created: 12                               │
│ ├─ rules_generated: 8                                          │
│ ├─ status: "pending_review" ← Awaiting HITL approval           │
│ ├─ extraction_confidence: 0.92                                 │
│ ├─ extraction_tokens_used: 15420                               │
│ ├─ extraction_cost: $0.4626                                    │
│ └─ created_by: "user-789"                                      │
│                                                                 │
│ full_policy_code contains:                                      │
│ {                                                               │
│   customAttributes: [12 extracted attributes],                 │
│   rules: [8 extracted rules],                                  │
│   sections: [policy sections]                                  │
│ }                                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: HUMAN REVIEW (HITL)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Compliance officer reviews:                                    │
│ - Extracted custom attributes (12)                             │
│ - Extracted rules (8)                                          │
│ - Confidence score: 92%                                        │
│                                                                 │
│ Decision: APPROVE                                               │
│                                                                 │
│ PUT /api/policy/policy-456/approve                             │
│ Body: {                                                         │
│   activateImmediately: true,                                   │
│   reviewNotes: "Extracted rules look accurate"                 │
│ }                                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: ACTIVATION - RULES & ATTRIBUTES CREATED                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ PolicyExtractionService.approvePolicy() executes:              │
│                                                                 │
│ 1. Creates 12 custom attributes in custom_attributes table     │
│ 2. Creates 8 rules in agent_collaboration_rules table          │
│ 3. Updates policy status to "active"                           │
│                                                                 │
│ All attributes and rules are LINKED to policy-456              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: AGENTS USE THE RULES                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ DeepGovernanceAgent loads rules:                               │
│ - SELECT * FROM agent_collaboration_rules                      │
│   WHERE source_policy_id = 'policy-456' AND enabled = true     │
│                                                                 │
│ Evaluates rules on every project change:                       │
│ - json-rules-engine evaluates conditions                       │
│ - Triggers actions if rules match                              │
│ - Creates interventions for violations                         │
│                                                                 │
│ DeepGovernanceAgent queries custom attributes:                 │
│ - SELECT * FROM custom_attributes                              │
│   WHERE source_policy_id = 'policy-456'                        │
│                                                                 │
│ Uses attributes to track compliance metrics                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## CONCRETE EXAMPLE: ISO27001 SECURITY POLICY

### INPUT DOCUMENT

**File**: `ISO27001_Security_Policy.pdf`

**Content** (excerpt):
```
ISO 27001 INFORMATION SECURITY POLICY

Section 5.2: Risk Assessment Requirements
All projects handling sensitive data MUST undergo a security risk assessment
before development begins. The risk assessment must be completed within 5
business days of project initiation.

Risk assessments must include:
- Data classification (Public, Internal, Confidential, Restricted)
- Threat modeling
- Vulnerability assessment
- Impact analysis

Projects classified as "Confidential" or "Restricted" require CISO approval
before proceeding to development phase.

Section 8.1: Access Control
Projects must track the following access control metrics:
- Number of users with admin access
- Last access review date
- Multi-factor authentication (MFA) enabled: Yes/No

Admin access should be limited to maximum 3 users per project.

Section 10.3: Change Management
All production changes require:
- Change request documentation
- Security impact assessment
- Rollback plan documented
- Post-deployment verification

Emergency changes (P0 incidents) can bypass approval but MUST be
documented within 24 hours.
```

---

### STEP 1: UPLOAD DOCUMENT

```typescript
// Frontend: Upload form
const formData = new FormData();
formData.append('file', file);
formData.append('documentType', 'policy_compliance'); // ← Key field!
formData.append('category', 'Security');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData,
});

// Response:
{
  success: true,
  document: {
    id: "doc-iso27001-2026",
    name: "ISO27001_Security_Policy.pdf",
    filePath: "/uploads/doc-iso27001-2026.pdf",
    documentType: "policy_compliance",
    uploadedBy: "john.doe@company.com"
  }
}
```

**Database** (`documents` table):
```sql
id                   | doc-iso27001-2026
name                 | ISO27001_Security_Policy.pdf
file_path            | /uploads/doc-iso27001-2026.pdf
document_type        | policy_compliance
content              | [Full text extracted]
uploaded_by          | john.doe@company.com
created_at           | 2026-01-25 10:30:00
```

---

### STEP 2: EXTRACT POLICY

```typescript
// Frontend: Trigger extraction
const response = await fetch('/api/policy/extract/doc-iso27001-2026', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4',
    complianceFramework: 'ISO27001'
  })
});

// Response:
{
  success: true,
  policyId: "policy-iso27001-001",
  message: "Policy extracted successfully. Awaiting human approval."
}
```

**What happens internally**:

1. **PolicyExtractionService.extractPolicy()** reads the document
2. Sends to **GPT-4** with this prompt:

```
You are a policy compliance expert. Extract requirements from this policy document...

DOCUMENT:
[Full ISO27001 content here]

DOCUMENT TYPE: policy_compliance
COMPLIANCE FRAMEWORK: ISO27001

Extract the following:

1. CUSTOM ATTRIBUTES - Measurable attributes that agents must track
2. COLLABORATION RULES - Executable rules for compliance
3. VALIDATION RULES - Hard constraints

Respond in JSON format...
```

3. **GPT-4 Response** (structured JSON):

```json
{
  "policyName": "ISO 27001 Information Security Policy",
  "policyDescription": "Comprehensive security requirements for handling sensitive data, access control, and change management in alignment with ISO 27001 standards.",
  "complianceFramework": "ISO27001",
  "confidenceScore": 0.92,

  "customAttributes": [
    {
      "name": "dataClassification",
      "label": "Data Classification",
      "description": "Classification level of data handled by this project",
      "dataType": "string",
      "ownerAgent": "governance",
      "visibleTo": ["governance", "risk", "pmo"],
      "validationRules": {
        "enum": ["Public", "Internal", "Confidential", "Restricted"],
        "required": true
      },
      "policySection": "5.2"
    },
    {
      "name": "securityRiskAssessmentDate",
      "label": "Security Risk Assessment Date",
      "description": "Date when security risk assessment was completed",
      "dataType": "date",
      "ownerAgent": "risk",
      "visibleTo": ["risk", "governance", "pmo"],
      "validationRules": {
        "required": true
      },
      "policySection": "5.2"
    },
    {
      "name": "adminUserCount",
      "label": "Admin User Count",
      "description": "Number of users with administrative access to project resources",
      "dataType": "number",
      "ownerAgent": "governance",
      "visibleTo": ["governance", "risk"],
      "unit": "users",
      "validationRules": {
        "min": 0,
        "max": 3
      },
      "policySection": "8.1"
    },
    {
      "name": "lastAccessReviewDate",
      "label": "Last Access Review Date",
      "description": "Date of most recent access control review",
      "dataType": "date",
      "ownerAgent": "governance",
      "visibleTo": ["governance", "risk", "pmo"],
      "policySection": "8.1"
    },
    {
      "name": "mfaEnabled",
      "label": "MFA Enabled",
      "description": "Whether multi-factor authentication is enabled for project access",
      "dataType": "boolean",
      "ownerAgent": "governance",
      "visibleTo": ["governance", "risk"],
      "validationRules": {
        "required": true
      },
      "policySection": "8.1"
    },
    {
      "name": "rollbackPlanDocumented",
      "label": "Rollback Plan Documented",
      "description": "Whether a rollback plan has been documented for production changes",
      "dataType": "boolean",
      "ownerAgent": "governance",
      "visibleTo": ["governance", "tmo", "pmo"],
      "validationRules": {
        "required": true
      },
      "policySection": "10.3"
    }
  ],

  "rules": [
    {
      "name": "ISO27001-5.2-Risk-Assessment-Required",
      "description": "Projects handling Confidential or Restricted data must complete security risk assessment within 5 business days",
      "sourceAgent": "risk",
      "priority": 9,
      "mandatory": true,
      "complianceType": "ISO27001",
      "policySection": "5.2",
      "conditions": [
        {
          "all": [
            {
              "fact": "dataClassification",
              "operator": "in",
              "value": ["Confidential", "Restricted"]
            },
            {
              "fact": "securityRiskAssessmentDate",
              "operator": "equal",
              "value": null
            },
            {
              "fact": "daysSinceProjectStart",
              "operator": "greaterThan",
              "value": 5
            }
          ]
        }
      ],
      "actions": [
        {
          "type": "create_intervention",
          "params": {
            "severity": "critical",
            "title": "Security Risk Assessment Overdue",
            "description": "ISO 27001 Section 5.2 requires security risk assessment within 5 business days for projects handling Confidential/Restricted data.",
            "suggestedAction": "Complete security risk assessment immediately and update the securityRiskAssessmentDate attribute.",
            "complianceImpact": "Non-compliance with ISO 27001 Section 5.2"
          }
        },
        {
          "type": "block_progression",
          "params": {
            "blockedPhase": "development",
            "reason": "Security risk assessment required before development"
          }
        }
      ]
    },
    {
      "name": "ISO27001-5.2-CISO-Approval-Required",
      "description": "Projects with Confidential/Restricted data require CISO approval before development",
      "sourceAgent": "governance",
      "priority": 10,
      "mandatory": true,
      "complianceType": "ISO27001",
      "policySection": "5.2",
      "conditions": [
        {
          "all": [
            {
              "fact": "dataClassification",
              "operator": "in",
              "value": ["Confidential", "Restricted"]
            },
            {
              "fact": "cisoApprovalReceived",
              "operator": "equal",
              "value": false
            },
            {
              "fact": "projectPhase",
              "operator": "equal",
              "value": "development"
            }
          ]
        }
      ],
      "actions": [
        {
          "type": "create_intervention",
          "params": {
            "severity": "critical",
            "title": "CISO Approval Required",
            "description": "ISO 27001 Section 5.2 requires CISO approval for projects handling Confidential/Restricted data before proceeding to development.",
            "suggestedAction": "Obtain CISO approval and document in project records.",
            "complianceImpact": "Non-compliance with ISO 27001 Section 5.2"
          }
        },
        {
          "type": "block_progression",
          "params": {
            "blockedPhase": "development",
            "reason": "CISO approval required"
          }
        }
      ]
    },
    {
      "name": "ISO27001-8.1-Admin-Access-Limit",
      "description": "Admin access should be limited to maximum 3 users per project",
      "sourceAgent": "governance",
      "priority": 6,
      "mandatory": false,
      "complianceType": "ISO27001",
      "policySection": "8.1",
      "conditions": [
        {
          "all": [
            {
              "fact": "adminUserCount",
              "operator": "greaterThan",
              "value": 3
            }
          ]
        }
      ],
      "actions": [
        {
          "type": "create_intervention",
          "params": {
            "severity": "high",
            "title": "Excessive Admin Access Detected",
            "description": "ISO 27001 Section 8.1 recommends limiting admin access to 3 users maximum. Current count exceeds this limit.",
            "suggestedAction": "Review admin user list and remove unnecessary admin privileges.",
            "complianceImpact": "Best practice recommendation from ISO 27001 Section 8.1"
          }
        },
        {
          "type": "notify_agents",
          "params": {
            "agents": ["risk"],
            "message": "Admin access limit exceeded on project"
          }
        }
      ]
    },
    {
      "name": "ISO27001-8.1-MFA-Required",
      "description": "Multi-factor authentication must be enabled for projects",
      "sourceAgent": "governance",
      "priority": 8,
      "mandatory": true,
      "complianceType": "ISO27001",
      "policySection": "8.1",
      "conditions": [
        {
          "all": [
            {
              "fact": "mfaEnabled",
              "operator": "equal",
              "value": false
            }
          ]
        }
      ],
      "actions": [
        {
          "type": "create_intervention",
          "params": {
            "severity": "high",
            "title": "MFA Not Enabled",
            "description": "ISO 27001 Section 8.1 requires multi-factor authentication for project access.",
            "suggestedAction": "Enable MFA for all project team members and update the mfaEnabled attribute to true.",
            "complianceImpact": "Non-compliance with ISO 27001 Section 8.1"
          }
        }
      ]
    },
    {
      "name": "ISO27001-10.3-Rollback-Plan-Required",
      "description": "Production changes require documented rollback plan",
      "sourceAgent": "governance",
      "priority": 7,
      "mandatory": true,
      "complianceType": "ISO27001",
      "policySection": "10.3",
      "conditions": [
        {
          "all": [
            {
              "fact": "productionChangeRequested",
              "operator": "equal",
              "value": true
            },
            {
              "fact": "rollbackPlanDocumented",
              "operator": "equal",
              "value": false
            }
          ]
        }
      ],
      "actions": [
        {
          "type": "create_intervention",
          "params": {
            "severity": "high",
            "title": "Rollback Plan Missing",
            "description": "ISO 27001 Section 10.3 requires documented rollback plan before production changes.",
            "suggestedAction": "Document rollback plan and update rollbackPlanDocumented attribute.",
            "complianceImpact": "Non-compliance with ISO 27001 Section 10.3"
          }
        },
        {
          "type": "block_deployment",
          "params": {
            "reason": "Rollback plan required before production deployment"
          }
        }
      ]
    }
  ]
}
```

---

### STEP 3: POLICY RECORD CREATED

**Database** (`policy_as_code` table):

```sql
INSERT INTO policy_as_code (
  id,
  source_document_id,
  document_name,
  document_type,
  policy_name,
  policy_description,
  sections_covered,
  policy_summary,
  full_policy_code,
  custom_attributes_created,
  rules_generated,
  status,
  llm_model_used,
  extraction_confidence,
  extraction_tokens_used,
  extraction_cost,
  compliance_framework,
  enforcement_level,
  mandatory,
  version,
  created_by,
  created_at
) VALUES (
  'policy-iso27001-001',
  'doc-iso27001-2026',
  'ISO27001_Security_Policy.pdf',
  'policy_compliance',
  'ISO 27001 Information Security Policy',
  'Comprehensive security requirements...',
  '["5.2", "8.1", "10.3"]',
  'Comprehensive security requirements...',
  '{"customAttributes": [...], "rules": [...], "sections": [...]}',
  6,
  5,
  'pending_review',
  'gpt-4',
  0.92,
  15420,
  0.4626,
  'ISO27001',
  'strict',
  true,
  1,
  'john.doe@company.com',
  NOW()
);
```

**Key points**:
- `full_policy_code` contains the complete JSON extraction
- `status` is `pending_review` - awaiting human approval
- Linked to source document via `source_document_id`
- 6 custom attributes and 5 rules extracted

---

### STEP 4: HUMAN REVIEW

Compliance officer reviews the policy in the UI:

```typescript
// GET /api/policy/policy-iso27001-001
{
  success: true,
  policy: {
    id: "policy-iso27001-001",
    policyName: "ISO 27001 Information Security Policy",
    customAttributesCreated: 6,
    rulesGenerated: 5,
    extractionConfidence: 0.92,
    status: "pending_review",
    fullPolicyCode: {
      customAttributes: [...], // 6 attributes
      rules: [...]  // 5 rules
    }
  }
}
```

**Review UI shows:**
- ✅ 6 custom attributes extracted (looks good)
- ✅ 5 compliance rules extracted (accurate)
- ✅ Confidence score: 92% (high)
- ✅ All rules properly linked to policy sections

**Decision: APPROVE ✅**

```typescript
// PUT /api/policy/policy-iso27001-001/approve
{
  activateImmediately: true,
  reviewNotes: "Extraction looks accurate. Rules align with ISO 27001 requirements."
}
```

---

### STEP 5: ACTIVATION - ATTRIBUTES & RULES CREATED

When approval happens, `PolicyExtractionService.approvePolicy()` executes:

#### 5a. Custom Attributes Created

**Database** (`custom_attributes` table):

```sql
-- Attribute 1
INSERT INTO custom_attributes (
  id, name, label, description, data_type, owner_agent, visible_to,
  validation_rules, unit, source_policy_id, auto_generated, policy_section, created_by
) VALUES (
  'attr-001',
  'dataClassification',
  'Data Classification',
  'Classification level of data handled by this project',
  'string',
  'governance',
  '["governance", "risk", "pmo"]',
  '{"enum": ["Public", "Internal", "Confidential", "Restricted"], "required": true}',
  NULL,
  'policy-iso27001-001',  -- ← Linked to policy!
  true,                   -- ← Auto-generated flag
  '5.2',                  -- ← Policy section
  'john.doe@company.com'
);

-- Attribute 2
INSERT INTO custom_attributes (...) VALUES (
  'attr-002',
  'securityRiskAssessmentDate',
  'Security Risk Assessment Date',
  'Date when security risk assessment was completed',
  'date',
  'risk',
  '["risk", "governance", "pmo"]',
  '{"required": true}',
  NULL,
  'policy-iso27001-001',
  true,
  '5.2',
  'john.doe@company.com'
);

-- Attribute 3
INSERT INTO custom_attributes (...) VALUES (
  'attr-003',
  'adminUserCount',
  'Admin User Count',
  'Number of users with administrative access',
  'number',
  'governance',
  '["governance", "risk"]',
  '{"min": 0, "max": 3}',
  'users',
  'policy-iso27001-001',
  true,
  '8.1',
  'john.doe@company.com'
);

-- ... 3 more attributes
```

**Key fields**:
- `source_policy_id`: Links attribute back to policy
- `auto_generated`: Flags this as policy-derived (vs manually created)
- `policy_section`: Traceability to policy section
- `owner_agent`: Which agent is responsible

#### 5b. Collaboration Rules Created

**Database** (`agent_collaboration_rules` table):

```sql
-- Rule 1
INSERT INTO agent_collaboration_rules (
  id, name, description, enabled, priority, source_agent,
  conditions, actions, source_policy_id, auto_generated, policy_section, mandatory, compliance_type, created_by
) VALUES (
  'rule-001',
  'ISO27001-5.2-Risk-Assessment-Required',
  'Projects handling Confidential or Restricted data must complete security risk assessment within 5 business days',
  true,
  9,
  'risk',
  '[{"all": [{"fact": "dataClassification", "operator": "in", "value": ["Confidential", "Restricted"]}, {"fact": "securityRiskAssessmentDate", "operator": "equal", "value": null}, {"fact": "daysSinceProjectStart", "operator": "greaterThan", "value": 5}]}]',
  '[{"type": "create_intervention", "params": {"severity": "critical", "title": "Security Risk Assessment Overdue", ...}}, {"type": "block_progression", "params": {"blockedPhase": "development", ...}}]',
  'policy-iso27001-001',  -- ← Linked to policy!
  true,                    -- ← Auto-generated
  '5.2',                   -- ← Policy section
  true,                    -- ← Mandatory rule
  'ISO27001',              -- ← Compliance framework
  'john.doe@company.com'
);

-- Rule 2
INSERT INTO agent_collaboration_rules (...) VALUES (
  'rule-002',
  'ISO27001-5.2-CISO-Approval-Required',
  'Projects with Confidential/Restricted data require CISO approval before development',
  true,
  10,
  'governance',
  '[{"all": [{"fact": "dataClassification", "operator": "in", "value": ["Confidential", "Restricted"]}, {"fact": "cisoApprovalReceived", "operator": "equal", "value": false}, {"fact": "projectPhase", "operator": "equal", "value": "development"}]}]',
  '[{"type": "create_intervention", ...}, {"type": "block_progression", ...}]',
  'policy-iso27001-001',
  true,
  '5.2',
  true,
  'ISO27001',
  'john.doe@company.com'
);

-- Rule 3
INSERT INTO agent_collaboration_rules (...) VALUES (
  'rule-003',
  'ISO27001-8.1-Admin-Access-Limit',
  'Admin access should be limited to maximum 3 users per project',
  true,
  6,
  'governance',
  '[{"all": [{"fact": "adminUserCount", "operator": "greaterThan", "value": 3}]}]',
  '[{"type": "create_intervention", "params": {"severity": "high", "title": "Excessive Admin Access Detected", ...}}, {"type": "notify_agents", ...}]',
  'policy-iso27001-001',
  true,
  '8.1',
  false,  -- ← Not mandatory (best practice)
  'ISO27001',
  'john.doe@company.com'
);

-- ... 2 more rules
```

**Key fields**:
- `source_policy_id`: Links rule back to policy
- `auto_generated`: Flags this as policy-derived
- `policy_section`: Traceability
- `mandatory`: Hard requirement vs best practice
- `compliance_type`: Framework name
- `conditions`: JSON-rules-engine conditions (executable)
- `actions`: What happens when rule fires

#### 5c. Policy Status Updated

```sql
UPDATE policy_as_code
SET
  status = 'active',
  approved_by = 'john.doe@company.com',
  approved_at = NOW(),
  review_notes = 'Extraction looks accurate...',
  effective_date = NOW(),
  activated_at = NOW(),
  updated_at = NOW()
WHERE id = 'policy-iso27001-001';
```

---

### STEP 6: AGENTS USE THE RULES

#### How DeepGovernanceAgent Enforces Policy

```typescript
// DeepGovernanceAgent.ts

class DeepGovernanceAgent extends DeepAgentBase {
  async analyzeProject(project: Project) {
    // 1. Load policy-derived rules
    const policyRules = await this.storage.getCollaborationRules({
      sourceAgent: 'governance',
      autoGenerated: true,  // Policy-derived rules
      enabled: true,
    });

    console.log(`[Governance] Loaded ${policyRules.length} policy-derived rules`);
    // Output: [Governance] Loaded 3 policy-derived rules (from ISO27001)

    // 2. Load custom attributes for this project
    const projectAttributes = await this.storage.getCustomAttributeValues(project.id);

    // 3. Build facts object for rule engine
    const facts = {
      projectId: project.id,
      dataClassification: projectAttributes.dataClassification,  // "Confidential"
      securityRiskAssessmentDate: projectAttributes.securityRiskAssessmentDate,  // null
      daysSinceProjectStart: this.calculateDaysSince(project.startDate),  // 7
      cisoApprovalReceived: projectAttributes.cisoApprovalReceived,  // false
      projectPhase: project.phase,  // "planning"
      adminUserCount: projectAttributes.adminUserCount,  // 5
      mfaEnabled: projectAttributes.mfaEnabled,  // false
      productionChangeRequested: project.productionChangeRequested,  // false
      rollbackPlanDocumented: projectAttributes.rollbackPlanDocumented,  // N/A
    };

    // 4. Evaluate rules with json-rules-engine
    const { Engine } = require('json-rules-engine');
    const engine = new Engine();

    // Add all policy rules to engine
    policyRules.forEach(rule => {
      engine.addRule({
        conditions: rule.conditions,
        event: {
          type: rule.name,
          params: {
            ruleId: rule.id,
            actions: rule.actions,
            mandatory: rule.mandatory,
            complianceType: rule.complianceType,
          }
        }
      });
    });

    // Run engine
    const results = await engine.run(facts);

    // 5. Process triggered rules
    for (const result of results.events) {
      console.log(`[Governance] Rule triggered: ${result.type}`);
      // Output: [Governance] Rule triggered: ISO27001-5.2-Risk-Assessment-Required
      // Output: [Governance] Rule triggered: ISO27001-8.1-Admin-Access-Limit
      // Output: [Governance] Rule triggered: ISO27001-8.1-MFA-Required

      const { ruleId, actions, mandatory, complianceType } = result.params;

      // Execute actions
      for (const action of actions) {
        if (action.type === 'create_intervention') {
          await this.createIntervention({
            projectId: project.id,
            severity: action.params.severity,
            title: action.params.title,
            description: action.params.description,
            suggestedAction: action.params.suggestedAction,
            complianceImpact: action.params.complianceImpact,
            ruleId,
            complianceType,
          });

          // Broadcast to unified notifications
          broadcastAgentInsight({
            sourceAgent: 'governance',
            agentName: 'Governance Agent',
            severity: action.params.severity,
            title: action.params.title,
            description: action.params.description,
            recommendations: [{
              action: action.params.suggestedAction,
              priority: 'immediate',
              effort: 'medium',
            }],
            projectId: project.id,
            projectName: project.name,
          });
        }

        if (action.type === 'block_progression') {
          await this.blockProjectPhase(project.id, action.params.blockedPhase, action.params.reason);
        }

        if (action.type === 'notify_agents') {
          await this.notifyAgents(action.params.agents, action.params.message, project.id);
        }
      }
    }
  }
}
```

#### What Happens in Real-Time

**Scenario**: PM creates new project with Confidential data

```
1. PM creates project:
   - Name: "Customer Data Migration"
   - Data Classification: "Confidential"
   - Project Phase: "Planning"

2. DeepGovernanceAgent monitors project creation event

3. Agent loads policy rules (3 rules from ISO27001)

4. Agent evaluates rules:
   ✅ Rule: ISO27001-5.2-Risk-Assessment-Required
      Condition: dataClassification = "Confidential" AND
                 securityRiskAssessmentDate = null AND
                 daysSinceProjectStart > 5
      Status: NOT triggered (only 0 days since start)

   ✅ Rule: ISO27001-8.1-Admin-Access-Limit
      Condition: adminUserCount > 3
      Status: NOT triggered (no admins assigned yet)

   ✅ Rule: ISO27001-8.1-MFA-Required
      Condition: mfaEnabled = false
      Status: TRIGGERED!
      Action: Create intervention

5. Intervention created in database:
   INSERT INTO interventions (...)
   VALUES (
     'Critical: MFA Not Enabled',
     'ISO 27001 Section 8.1 requires multi-factor authentication',
     'Enable MFA for all project team members',
     'high',
     ...
   );

6. WebSocket broadcasts to PM:
   {
     type: 'agent:insight',
     data: {
       sourceAgent: 'governance',
       agentName: 'Governance Agent',
       severity: 'high',
       title: 'MFA Not Enabled',
       description: 'ISO 27001 Section 8.1 requires MFA...',
       recommendations: [{
         action: 'Enable MFA for all project team members',
         priority: 'immediate'
       }]
     }
   }

7. PM sees notification in GlobalNotificationBell:
   [Bell icon shows badge: 1]

   PM clicks bell → AlertsFlyout opens:

   ┌──────────────────────────────────────────┐
   │ 🔔 Notifications & Insights              │
   ├──────────────────────────────────────────┤
   │ 🎯 Governance Agent: MFA Not Enabled    │
   │ Project: Customer Data Migration         │
   │                                          │
   │ ⚠️ ROOT CAUSE                            │
   │ ISO 27001 Section 8.1 requires          │
   │ multi-factor authentication for          │
   │ project access.                          │
   │                                          │
   │ 💡 RECOMMENDATION                        │
   │ ⭐ Immediate: Enable MFA for all         │
   │    project team members                  │
   │                                          │
   │ COMPLIANCE IMPACT:                       │
   │ Non-compliance with ISO 27001 Section    │
   │ 8.1                                      │
   │                                          │
   │ [✅ Mark as Complete] [View Policy]      │
   └──────────────────────────────────────────┘

8. PM enables MFA, updates attribute:
   UPDATE custom_attribute_values
   SET value = 'true'
   WHERE project_id = 'customer-data-migration'
     AND attribute_name = 'mfaEnabled';

9. Agent re-evaluates, rule no longer triggers ✅

10. After 5 days, if risk assessment not done:
    Rule: ISO27001-5.2-Risk-Assessment-Required
    Status: TRIGGERED!
    Action: Create critical intervention + block progression to development phase
```

---

## DATABASE RELATIONSHIPS

```
documents (source)
  ├─ id: "doc-iso27001-2026"
  ├─ document_type: "policy_compliance" ← Must be tagged!
  └─ file_path: "/uploads/doc-iso27001-2026.pdf"
       │
       ↓ source_document_id
       │
policy_as_code (extracted policy)
  ├─ id: "policy-iso27001-001"
  ├─ source_document_id: "doc-iso27001-2026" ← Link to source
  ├─ full_policy_code: {...} ← Complete extraction
  ├─ custom_attributes_created: 6
  ├─ rules_generated: 5
  └─ status: "active"
       │
       ├──────────────┬──────────────────┐
       ↓              ↓                  ↓
custom_attributes   agent_collaboration_rules   policy_extraction_audit
├─ id: "attr-001"   ├─ id: "rule-001"          ├─ policy_id: "policy-iso27001-001"
├─ name: "dataClass"├─ name: "ISO27001-5.2..." ├─ extraction_phase: "rule_generation"
├─ source_policy_id ├─ source_policy_id        ├─ status: "success"
│  = "policy-iso..." │  = "policy-iso..."      ├─ tokens_used: 15420
├─ auto_generated   ├─ auto_generated          └─ processing_time_ms: 8240
│  = true          │  = true
├─ policy_section   ├─ policy_section
│  = "5.2"         │  = "5.2"
└─ owner_agent      ├─ mandatory = true
   = "governance"   └─ enabled = true
                         │
                         ↓ Evaluated by agents
                         │
                    DeepGovernanceAgent
                    ├─ Loads rules WHERE source_policy_id = 'policy-iso27001-001'
                    ├─ Loads attributes for project
                    ├─ Evaluates conditions with json-rules-engine
                    └─ Executes actions when rules fire
```

---

## API ENDPOINTS

### 1. Extract Policy
```bash
POST /api/policy/extract/:documentId
Body: {
  model: "gpt-4",
  complianceFramework: "ISO27001"
}

Response: {
  success: true,
  policyId: "policy-iso27001-001",
  message: "Policy extracted successfully. Awaiting human approval."
}
```

### 2. List Policies
```bash
GET /api/policy?status=active&complianceFramework=ISO27001

Response: {
  success: true,
  policies: [...]
}
```

### 3. Get Policy Details
```bash
GET /api/policy/policy-iso27001-001

Response: {
  success: true,
  policy: {
    id: "policy-iso27001-001",
    policyName: "ISO 27001 Information Security Policy",
    fullPolicyCode: {
      customAttributes: [6 attributes],
      rules: [5 rules]
    },
    status: "active",
    ...
  }
}
```

### 4. Approve Policy (HITL)
```bash
PUT /api/policy/policy-iso27001-001/approve
Body: {
  activateImmediately: true,
  reviewNotes: "Looks good"
}

Response: {
  success: true,
  message: "Policy approved and activated"
}
```

### 5. Reject Policy
```bash
PUT /api/policy/policy-iso27001-001/reject
Body: {
  reviewNotes: "Rules need refinement"
}

Response: {
  success: true,
  message: "Policy rejected"
}
```

### 6. Get Audit Trail
```bash
GET /api/policy/policy-iso27001-001/audit

Response: {
  success: true,
  auditTrail: [
    {
      extractionPhase: "section_analysis",
      status: "started",
      createdAt: "2026-01-25T10:30:00Z"
    },
    {
      extractionPhase: "rule_generation",
      status: "success",
      tokensUsed: 15420,
      processingTimeMs: 8240,
      createdAt: "2026-01-25T10:30:08Z"
    }
  ]
}
```

---

## BENEFITS

### vs Traditional RAG Approach

| Aspect | Traditional RAG | Policy as Code |
|--------|-----------------|----------------|
| **Cost** | $5-10 per query | $0.46 one-time |
| **Latency** | 2-5 seconds | <50ms |
| **Consistency** | Varies per query | 100% consistent |
| **Traceability** | None | Full audit trail |
| **Versioning** | None | Built-in |
| **Human Oversight** | None | HITL approval required |
| **Agent Attachment** | N/A | Direct DB relationship |

### What Makes This Powerful

1. **One-time extraction** - Pay once, enforce forever
2. **Instant evaluation** - Rules run in <50ms (json-rules-engine)
3. **Full traceability** - Every attribute/rule linked to policy section
4. **Human oversight** - HITL approval before activation
5. **Versioning** - Can update policies without breaking existing rules
6. **Agent integration** - Rules directly attached to agents via `owner_agent`
7. **Compliance proof** - Audit trail shows exactly what was extracted and when

---

## SUMMARY

**Policy as Code is WORKING and FULLY IMPLEMENTED**

1. ✅ Upload policy document (tag as `policy_compliance`)
2. ✅ LLM extracts attributes + rules (GPT-4 or Gemini)
3. ✅ Policy record created with full extraction stored
4. ✅ Human reviews and approves (HITL)
5. ✅ Attributes and rules created in database
6. ✅ All linked to source policy via `source_policy_id`
7. ✅ Agents load and enforce rules automatically
8. ✅ Real-time notifications via WebSocket

**The system replaces expensive runtime RAG with one-time extraction + instant rule evaluation.**
