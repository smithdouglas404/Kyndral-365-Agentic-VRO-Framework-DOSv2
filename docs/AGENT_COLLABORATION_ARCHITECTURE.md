# Agent Collaboration Architecture

## The Hybrid Approach: AI + Rules + Patterns

### Why Not Just Rules? Why Not Just AI?

Your team asked the right question: **"What's the value of AI and agentic if we have to define every rule?"**

The answer is: **You don't define every rule.** We use a **hybrid approach** with three collaboration modes:

---

## 1. Rule-Based Collaboration (User-Defined)

**When to use**: Critical business logic that MUST always fire.

**Examples**:
- "When CPI drops below 0.70, always notify FinOps + TMO + Risk"
- "When compliance violations > 3, escalate to Governance immediately"
- "When project budget exceeds $1M overrun, require exec approval"

**Why rules**:
- Compliance requirements
- Regulatory mandates
- Company policies
- SLAs

**Implementation**: `AgentCollaborationRulesEngine.ts` using `json-rules-engine`

**Example Rule**:
```json
{
  "name": "Critical Budget Overrun",
  "sourceAgent": "finops",
  "conditions": [
    {
      "fact": "cpi",
      "operator": "lessThan",
      "value": 0.70
    },
    {
      "fact": "cost_overrun",
      "operator": "greaterThan",
      "value": 100000
    }
  ],
  "actions": [
    {
      "type": "notify_agent",
      "targetAgent": "tmo"
    },
    {
      "type": "notify_agent",
      "targetAgent": "risk"
    },
    {
      "type": "send_email",
      "targetUser": "exec@company.com"
    },
    {
      "type": "escalate",
      "targetAgent": "governance"
    }
  ]
}
```

---

## 2. AI-Driven Collaboration (Contextual Reasoning)

**When to use**: Nuanced decisions requiring context and judgment.

**Examples**:
- "This budget overrun is concerning, but the project is strategic and nearing completion. Should I involve TMO?"
- "Risk score is high, but it's mostly due to tech debt we're actively addressing. Is Governance needed?"
- "Schedule slippage on this project affects 3 downstream projects. Which agents should collaborate?"

**Why AI**:
- Context matters
- Trade-offs need to be evaluated
- Historical patterns inform decisions
- Priorities change

**Implementation**: LLM router with inter-agent reasoning prompt

**Example Prompt** (sent to LLM):
```
You are the FinOps Agent. You've detected:
- CPI: 0.82 (budget overrun)
- Project: Cloud Migration ($2.3M spent of $2M budget)
- Status: 95% complete
- Strategic priority: HIGH

Available collaborators:
- TMO Agent: Transformation strategy and timeline optimization
- Risk Agent: Risk assessment and mitigation
- VRO Agent: Value realization and ROI tracking

Question: Which agents should you collaborate with, if any? Consider:
1. Project criticality
2. Completion percentage
3. Overrun amount relative to total budget
4. Strategic importance

Respond with agent IDs and brief reasoning.
```

**LLM Response**:
```json
{
  "collaborate": ["vro"],
  "reasoning": "Project is 95% complete and strategic. Budget overrun is 15%, which is concerning but manageable given high completion. VRO should assess if benefits justify the overrun. TMO and Risk not needed at this stage - project is nearly done and overrun is moderate."
}
```

---

## 3. Pattern-Based Collaboration (Machine Learning)

**When to use**: Learn from successful collaborations and improve over time.

**Examples**:
- "Risk + FinOps collaboration reduced issues by 30% in Q1. Auto-suggest this pairing more often."
- "TMO + Governance escalations took 5 days on average. Add 2-day reminder rule."
- "VRO assessments after CPI drops improved ROI by 12%. Make this standard."

**Why patterns**:
- Continuous improvement
- Learn what works
- Reduce manual rule creation
- Adapt to organizational culture

**Implementation**: Track collaboration outcomes, suggest new rules

**Example Analytics**:
```
Collaboration: FinOps → VRO (budget overrun → value assessment)
- Triggered: 47 times
- Avg time to resolution: 3.2 days
- Projects saved: 8 (avoided cancellation)
- ROI improvement: +12%
- User rating: 4.7/5

Recommendation: Create standard rule for CPI < 0.85
```

---

## Comparison Table

| Aspect | Rule-Based | AI-Driven | Pattern-Based |
|--------|-----------|-----------|---------------|
| **Decision Speed** | Instant | 2-5 seconds | Instant (after learning) |
| **Flexibility** | Low | High | Medium |
| **Context Awareness** | None | High | Medium |
| **Reliability** | 100% | 95% | 90% |
| **Setup Effort** | High | Low | None |
| **Best For** | Compliance | Strategy | Optimization |
| **Example** | "Always escalate if X" | "Should I escalate given Y?" | "We usually escalate when Z" |

---

## Open Source Rules Engines with Beautiful UIs

### 1. **json-rules-engine** (What we're using)
- **Language**: JavaScript/TypeScript
- **UI**: Custom (we build it)
- **Pros**: Lightweight, flexible, perfect for Node.js
- **Cons**: No built-in UI
- **GitHub**: https://github.com/CacheControl/json-rules-engine
- **Stars**: 2.7k

### 2. **Easy Rules**
- **Language**: Java
- **UI**: Basic
- **Pros**: Simple, well-documented
- **Cons**: Java-based, not ideal for our stack
- **GitHub**: https://github.com/j-easy/easy-rules
- **Stars**: 4.8k

### 3. **Nools**
- **Language**: JavaScript
- **UI**: None
- **Pros**: Powerful, Rete algorithm
- **Cons**: Complex, no UI
- **GitHub**: https://github.com/noolsjs/nools
- **Stars**: 1.5k

### 4. **Drools** (Most Powerful)
- **Language**: Java
- **UI**: Workbench (complex but comprehensive)
- **Pros**: Enterprise-grade, visual rule builder, decision tables
- **Cons**: Heavy, Java-based, steep learning curve
- **Website**: https://www.drools.org/
- **GitHub**: https://github.com/apache/incubator-kie-drools
- **Stars**: 5.8k
- **Note**: Has a beautiful UI but requires Java backend

### 5. **Business Rules Engine** (BRE)
- **Language**: Python
- **UI**: None
- **Pros**: Python-friendly
- **Cons**: Less mature
- **GitHub**: https://github.com/venmo/business-rules
- **Stars**: 1.2k

### 6. **Decision Model and Notation (DMN)** Tools
Several open-source DMN tools with visual editors:

#### **Camunda Modeler**
- **Language**: JavaScript
- **UI**: ⭐⭐⭐⭐⭐ (Beautiful visual decision table editor)
- **Pros**: Industry standard, visual decision tables, integrates with BPMN
- **Cons**: Can be complex for simple use cases
- **Website**: https://camunda.com/download/modeler/
- **GitHub**: https://github.com/camunda/camunda-modeler
- **Stars**: 1.5k

#### **Kogito** (Red Hat)
- **Language**: Java/Quarkus
- **UI**: ⭐⭐⭐⭐ (Web-based DMN editor)
- **Pros**: Cloud-native, visual editor, containerized
- **Cons**: Red Hat ecosystem
- **Website**: https://kogito.kie.org/
- **GitHub**: https://github.com/apache/incubator-kie-kogito-runtimes

---

## Our Recommendation: Build Custom UI on json-rules-engine

**Why**:
1. **Lightweight**: Pure JavaScript, no Java dependencies
2. **Flexible**: Easy to extend for agent-specific facts
3. **Fast**: Low latency, runs in-process
4. **Customizable**: Build exactly the UI we need
5. **AI Integration**: Easy to combine with LLM reasoning

**UI Features We'll Build**:
- Visual rule builder (drag-and-drop conditions)
- Agent selector (source and target agents)
- Fact autocomplete (CPI, risk_score, etc.)
- Action builder (notify, escalate, email)
- Rule testing (simulate facts, see results)
- Analytics dashboard (rule execution stats)
- AI suggestions (recommend rules based on patterns)

---

## Architecture Diagram

```
User Query
    ↓
Agent Receives Request
    ↓
╔═══════════════════════════════════════╗
║   Collaboration Decision Layer        ║
╠═══════════════════════════════════════╣
║                                       ║
║  1. Check Rules Engine                ║
║     (json-rules-engine)               ║
║     └─> Evaluate facts                ║
║     └─> Fire rule actions             ║
║                                       ║
║  2. Ask LLM for Reasoning             ║
║     (if no rule matched)              ║
║     └─> Analyze context               ║
║     └─> Suggest collaborators         ║
║                                       ║
║  3. Check Pattern Analytics           ║
║     (historical data)                 ║
║     └─> Similar past situations       ║
║     └─> Successful outcomes           ║
║                                       ║
╚═══════════════════════════════════════╝
    ↓
Execute Actions
    ├─> Notify agents
    ├─> Send emails
    ├─> Create tasks
    └─> Escalate
```

---

## Example: How the Hybrid System Works

### Scenario: Budget Overrun Detected

**Facts**:
- Agent: FinOps
- CPI: 0.68
- Cost Overrun: $150,000
- Project: Cloud Migration
- Completion: 40%
- Strategic Priority: HIGH

**Step 1: Check Rules Engine**
```
Rule: "Critical Budget Overrun"
Conditions: CPI < 0.70 AND cost_overrun > $100k
Status: ✅ MATCHED

Actions Fired:
- Notify TMO Agent
- Notify Risk Agent
- Send email to exec@company.com
- Escalate to Governance
```

**Step 2: AI Reasoning** (runs in parallel)
```
LLM Analysis:
"Given 40% completion and strategic importance, this overrun
is concerning. TMO should assess timeline impact. Risk should
evaluate if current trajectory continues. VRO should not be
involved yet - too early to assess value realization."

Suggested Collaborators: [TMO, Risk]
```

**Step 3: Pattern Analysis**
```
Historical Pattern:
- Similar situations: 12
- TMO + Risk collaboration: 9/12 resolved successfully
- Avg resolution time: 8 days
- VRO added in 3/12 (when completion > 70%)

Recommendation: Wait on VRO until project is 70% complete
```

**Final Decision**:
```
Collaborate with:
- TMO (rule + AI agreement)
- Risk (rule + AI agreement)
- Governance (rule escalation)

Do NOT collaborate with:
- VRO (AI + patterns suggest too early)

Set reminder:
- Re-evaluate VRO collaboration at 70% completion
```

---

## Configuration Hierarchy

```
1. EXPLICIT RULES (Highest Priority)
   User-defined rules always fire first
   Example: Regulatory compliance rules

2. AI REASONING (Medium Priority)
   LLM makes contextual decisions
   Example: Strategic trade-offs

3. PATTERNS (Lowest Priority)
   Learned behaviors suggest actions
   Example: "We usually do X when Y"

4. DEFAULT BEHAVIOR (Fallback)
   If nothing else triggers, use defaults
   Example: Always log, never auto-escalate
```

---

## Summary: The Value of AI + Rules

### **Rules Alone** ❌
- Rigid
- Requires defining every scenario
- No context awareness
- High maintenance

### **AI Alone** ❌
- Unpredictable
- May miss critical escalations
- Can't guarantee compliance
- Requires extensive prompting

### **AI + Rules + Patterns** ✅
- Rules handle compliance (guaranteed)
- AI handles strategy (contextual)
- Patterns optimize over time (learning)
- Best of all approaches

---

## Next Steps

1. ✅ **Rules Engine Built**: `AgentCollaborationRulesEngine.ts`
2. ✅ **API Routes Created**: `/api/admin/collaboration-rules`
3. 🚧 **UI Builder**: Visual rule builder (next)
4. 🚧 **AI Integration**: LLM reasoning layer
5. 🚧 **Pattern Analytics**: Track collaboration outcomes
6. 🚧 **Hybrid Orchestrator**: Combine all three modes

---

## Questions?

**Q: Do we need to define every rule?**
A: No! Only critical business logic. AI handles the rest.

**Q: What if AI makes a bad decision?**
A: Rules override AI. Critical paths are rule-controlled.

**Q: Can we learn from what works?**
A: Yes! Pattern analytics suggest new rules based on success.

**Q: Can we disable AI reasoning?**
A: Yes! Use rule-only mode if needed. Fully configurable.
