/**
 * Seed Knowledge Base with PMBOK, Prince2, PMI, and SAFe content
 */

import { storage } from "../server/storage.js";
import { initKnowledgeBaseRepository } from "../server/lib/KnowledgeBaseRepository.js";

const pmbokArticles = [
  {
    title: "PMBOK 7.4: Cost Management and EVM",
    category: "pmbok" as const,
    subcategory: "Cost Management",
    content: `# PMBOK Section 7.4: Cost Management & Earned Value Management

## Overview
Cost Management includes the processes involved in planning, estimating, budgeting, financing, funding, managing, and controlling costs so that the project can be completed within the approved budget.

## Key Concepts

### Earned Value Management (EVM)
EVM is a methodology that combines scope, schedule, and resource measurements to assess project performance and progress.

**Key Metrics:**
- **BAC (Budget at Completion)**: Total planned budget
- **PV (Planned Value)**: Planned work scheduled to be completed
- **EV (Earned Value)**: Value of work actually completed
- **AC (Actual Cost)**: Actual cost incurred for completed work
- **CPI (Cost Performance Index)**: EV / AC
  - CPI > 1.0 = Under budget (good)
  - CPI = 1.0 = On budget
  - CPI < 1.0 = Over budget (concerning)
- **SPI (Schedule Performance Index)**: EV / PV
  - SPI > 1.0 = Ahead of schedule
  - SPI = 1.0 = On schedule
  - SPI < 1.0 = Behind schedule
- **EAC (Estimate at Completion)**: BAC / CPI (forecasted total cost)
- **ETC (Estimate to Complete)**: EAC - AC (remaining budget)
- **VAC (Variance at Completion)**: BAC - EAC

## Thresholds and Actions

### CPI Thresholds
- **CPI < 0.80**: CRITICAL - Immediate escalation required
  - Convene emergency stakeholder meeting
  - Develop recovery plan within 48 hours
  - Consider scope reduction or additional funding
- **CPI 0.80-0.90**: HIGH RISK - Urgent action needed
  - Analyze cost drivers immediately
  - Implement cost reduction measures
  - Weekly executive briefings
- **CPI 0.90-0.95**: AT RISK - Corrective action required
  - Enhanced monitoring and reporting
  - Review vendor contracts
  - Consider scope prioritization
- **CPI 0.95-1.05**: HEALTHY - Normal monitoring
- **CPI > 1.05**: UNDER BUDGET - Verify quality not compromised

### SPI Thresholds
- **SPI < 0.85**: CRITICAL - Recovery may not be possible
  - Assess critical path dependencies
  - Consider fast-tracking or crashing
  - Communicate revised timeline to stakeholders
- **SPI 0.85-0.95**: AT RISK - Schedule recovery plan needed
  - Identify schedule compression opportunities
  - Review resource allocation
  - Bi-weekly schedule reviews

## Best Practices
1. **Establish baseline early**: Complete scope and schedule baseline before project execution
2. **Regular measurement**: Update EVM metrics at least bi-weekly
3. **Consistent WBS**: Use consistent Work Breakdown Structure for planning and tracking
4. **Integrate with risk management**: High cost variance often indicates risks materializing
5. **Trend analysis**: Don't rely on single-point metrics - analyze trends over time

## Common Pitfalls
- Waiting too long to act on negative trends
- Focusing solely on cost without schedule integration
- Not adjusting EAC forecasts regularly
- Inadequate scope control leading to cost overruns

## Success Factors
- Executive support for baseline integrity
- Integrated change control process
- Timely and accurate status reporting
- Proactive stakeholder communication
`,
    summary: "Comprehensive guide to PMBOK Cost Management and Earned Value Management (EVM) including metrics, thresholds, and best practices",
    tags: ["pmbok", "cost-management", "evm", "cpi", "spi", "budget", "forecasting"],
    source: "PMBOK 7th Edition",
    version: "7.0",
    metadata: {
      section: "7.4",
      chapter: "7",
      pageReference: "pp. 145-168",
      applicability: ["all-projects", "construction", "it", "manufacturing"]
    },
    status: "published" as const
  },

  {
    title: "PMBOK 6.6: Schedule Management and Critical Path Method",
    category: "pmbok" as const,
    subcategory: "Schedule Management",
    content: `# PMBOK Section 6.6: Schedule Management & Critical Path Method

## Overview
Project Schedule Management includes the processes required to manage the timely completion of the project.

## Critical Path Method (CPM)

### Definition
The Critical Path is the sequence of activities that represents the longest path through a project, determining the shortest possible project duration.

### Key Concepts
- **Float/Slack**: Amount of time an activity can be delayed without delaying project
  - Zero float = Critical path activity
  - Positive float = Non-critical activity
  - Negative float = Behind schedule
- **Forward Pass**: Calculate Early Start (ES) and Early Finish (EF)
- **Backward Pass**: Calculate Late Start (LS) and Late Finish (LF)

## Schedule Compression Techniques

### Fast Tracking
- **Definition**: Performing activities in parallel that were originally planned in sequence
- **Advantages**: Can significantly reduce schedule without additional cost
- **Risks**: Increased risk and potential rework
- **When to use**: When activities have some independence
- **Example**: Start construction before final designs are complete

### Crashing
- **Definition**: Adding resources to critical path activities to reduce duration
- **Advantages**: More controlled than fast tracking
- **Disadvantages**: Increases cost
- **When to use**: When schedule is critical and budget allows
- **Example**: Add developers to accelerate software development

## Resource Leveling
Technique to optimize resource usage by adjusting start/finish dates based on resource constraints.

**Effects:**
- Can extend project duration
- Reduces resource conflicts
- Smooths resource demand

## Schedule Performance Indicators

### Key Metrics
- **Schedule Variance (SV)**: EV - PV
  - SV > 0 = Ahead of schedule
  - SV < 0 = Behind schedule
- **Schedule Performance Index (SPI)**: EV / PV
  - Target: SPI >= 0.95
  - Critical threshold: SPI < 0.85

## Best Practices
1. **Regular Updates**: Update schedule weekly or bi-weekly
2. **Critical Path Focus**: Monitor critical path activities daily
3. **Dependencies**: Document all dependencies clearly
4. **Buffers**: Include time buffers for high-risk activities
5. **Baseline Protection**: Formal change control for baseline changes
6. **What-if Analysis**: Regular scenario planning

## Common Issues
- **Student Syndrome**: Waiting until deadline approaches before starting
- **Parkinson's Law**: Work expands to fill available time
- **Resource Conflicts**: Multiple projects competing for same resources
- **Dependency Delays**: Waiting for dependencies from other projects

## Corrective Actions

### When SPI < 0.90
1. Analyze critical path for compression opportunities
2. Identify fast-tracking possibilities
3. Review resource allocation
4. Consider scope prioritization
5. Communicate revised timeline

### When Float is Consumed
1. Escalate to project sponsor
2. Develop recovery plan
3. Increase monitoring frequency
4. Consider contingency activation
`,
    summary: "PMBOK Schedule Management covering Critical Path Method, schedule compression techniques, and performance indicators",
    tags: ["pmbok", "schedule", "critical-path", "cpm", "spi", "fast-tracking", "crashing"],
    source: "PMBOK 7th Edition",
    version: "7.0",
    metadata: {
      section: "6.6",
      chapter: "6",
      pageReference: "pp. 112-138",
      applicability: ["all-projects"]
    },
    status: "published" as const
  },

  {
    title: "PMBOK 11: Risk Management",
    category: "pmbok" as const,
    subcategory: "Risk Management",
    content: `# PMBOK Chapter 11: Project Risk Management

## Overview
Project Risk Management includes the processes of conducting risk management planning, identification, analysis, response planning, response implementation, and monitoring risk on a project.

## Risk Management Process

### 1. Plan Risk Management
Defines how to conduct risk management activities.

### 2. Identify Risks
Determine which risks may affect the project and document their characteristics.

**Techniques:**
- Brainstorming
- Delphi technique
- SWOT analysis
- Checklists
- Assumption analysis

### 3. Perform Qualitative Risk Analysis
Prioritize risks for further analysis by assessing probability and impact.

**Risk Matrix:**
\`\`\`
Impact →        Low     Medium    High
Probability ↓
High           Medium   High      Critical
Medium         Low      Medium    High
Low            Low      Low       Medium
\`\`\`

### 4. Perform Quantitative Risk Analysis
Numerically analyze the effect of identified risks on overall project objectives.

**Techniques:**
- Monte Carlo simulation
- Decision tree analysis
- Sensitivity analysis
- Expected Monetary Value (EMV)

### 5. Plan Risk Responses

**For Threats (Negative Risks):**
- **Avoid**: Change project plan to eliminate threat
- **Transfer**: Shift impact to third party (insurance, outsourcing)
- **Mitigate**: Reduce probability or impact
- **Accept**: Acknowledge risk, prepare contingency

**For Opportunities (Positive Risks):**
- **Exploit**: Ensure opportunity occurs
- **Enhance**: Increase probability or impact
- **Share**: Allocate to third party best able to capture opportunity
- **Accept**: Willing to take advantage if it occurs

### 6. Implement Risk Responses
Execute agreed-upon risk response plans.

### 7. Monitor Risks
Track identified risks, monitor residual risks, identify new risks.

## Risk Categories

### Technical Risks
- Technology changes
- Complexity
- Performance issues
- Quality problems

### External Risks
- Regulatory changes
- Market conditions
- Vendor/supplier issues
- Weather/natural disasters

### Organizational Risks
- Resource availability
- Funding constraints
- Competing projects
- Stakeholder changes

### Project Management Risks
- Poor planning
- Inadequate communication
- Scope creep
- Unrealistic schedule

## Risk Register Components
1. Risk ID
2. Risk Description
3. Category
4. Probability (1-5)
5. Impact (1-5)
6. Risk Score (Probability × Impact)
7. Risk Owner
8. Response Strategy
9. Response Actions
10. Status

## Key Metrics

### Risk Exposure
\`\`\`
Risk Exposure = Probability × Impact (financial)
\`\`\`

### Contingency Reserve
Budget set aside for known risks (risk response strategies).

**Typical Ranges:**
- Low-risk projects: 5-10% of project budget
- Medium-risk projects: 10-20%
- High-risk projects: 20-40%

### Management Reserve
Budget for unknown risks (cannot be quantified).

## Best Practices
1. **Continuous Process**: Risk management throughout project lifecycle
2. **Ownership**: Assign clear risk owners
3. **Regular Reviews**: Weekly for high-risk projects, monthly for others
4. **Early Warning Signs**: Define triggers for risk activation
5. **Lessons Learned**: Document risk outcomes for future projects
6. **Integration**: Link risks to WBS, schedule, and cost baseline

## Risk Prioritization

### Critical Risks (Immediate Action)
- Probability > 70% AND Impact > $500K
- Or affects critical path by > 2 weeks
- Requires executive attention

### High Risks (Weekly Monitoring)
- Probability > 50% OR Impact > $250K
- Detailed response plan required
- PM oversight

### Medium Risks (Monthly Monitoring)
- Track trends
- Basic response plan
- Team level management

### Low Risks (Quarterly Review)
- Watch list
- No active mitigation unless escalates

## Common Pitfalls
- Risk identification done once at project start
- No risk owner assigned
- Treating all risks equally
- No contingency budget
- Poor risk communication
`,
    summary: "Complete PMBOK Risk Management framework including processes, techniques, risk matrix, and best practices",
    tags: ["pmbok", "risk-management", "risk-matrix", "contingency", "mitigation"],
    source: "PMBOK 7th Edition",
    version: "7.0",
    metadata: {
      section: "11",
      chapter: "11",
      pageReference: "pp. 395-456",
      applicability: ["all-projects"]
    },
    status: "published" as const
  }
];

const prince2Articles = [
  {
    title: "PRINCE2: Seven Principles",
    category: "prince2" as const,
    subcategory: "Principles",
    content: `# PRINCE2: Seven Principles

## Overview
The seven principles are the guiding obligations and good practices which determine whether the project is genuinely being managed using PRINCE2.

## 1. Continued Business Justification
**Principle**: A PRINCE2 project has continued business justification.

**Key Points:**
- Business Case must be defined and documented
- Reviewed throughout project lifecycle
- If no longer justified, project should be stopped
- Not about whether it CAN be done, but whether it SHOULD be done

**Checkpoints:**
- At Start: Is there a clear business need?
- During Execution: Does justification still hold?
- At Closure: Were benefits realized?

## 2. Learn from Experience
**Principle**: PRINCE2 project teams learn from previous experience.

**Implementation:**
- Document lessons at start (from similar projects)
- Capture lessons during project (from current work)
- Pass on lessons at end (for future projects)
- Create searchable lessons learned database

**Activities:**
- Start-up: Review lessons from similar projects
- Stages: Hold lessons learned workshops
- Closure: Formal lessons learned report

## 3. Defined Roles and Responsibilities
**Principle**: A PRINCE2 project has defined and agreed roles and responsibilities within an organization structure.

**Key Roles:**
- **Project Board**: Executive, Senior User, Senior Supplier
- **Project Manager**: Day-to-day management
- **Team Manager**: Manages specialist teams
- **Project Assurance**: Independent view of project
- **Project Support**: Administrative support

**Responsibility Matrix (RACI):**
- R = Responsible (does the work)
- A = Accountable (ultimate ownership)
- C = Consulted (provides input)
- I = Informed (kept updated)

## 4. Manage by Stages
**Principle**: A PRINCE2 project is planned, monitored, and controlled on a stage-by-stage basis.

**Why Stages?**
- Provides control points
- Enables go/no-go decisions
- Limits detailed planning to near-term
- Manages risks in chunks

**Typical Stages:**
1. **Initiation Stage**: Define project
2. **Delivery Stages**: Build products (2-5 stages typical)
3. **Final Stage**: Close project

**Stage Boundaries:**
- Formal review of stage performance
- Update Business Case
- Risk review
- Approval for next stage

## 5. Manage by Exception
**Principle**: A PRINCE2 project has defined tolerances for each project objective.

**Tolerances Defined:**
- **Time**: +/- 2 weeks
- **Cost**: +/- 5%
- **Quality**: No reduction in acceptance criteria
- **Scope**: No changes without approval
- **Risk**: Risk exposure limit
- **Benefits**: Minimum acceptable benefits

**Escalation Levels:**
- **Within Tolerance**: Project Manager manages
- **Forecast Deviation**: Project Manager alerts Project Board
- **Exceeds Tolerance**: Project Board decision required

**Exception Reports Triggered When:**
- Stage/project will exceed tolerance
- Major risk materializes
- Significant issue cannot be resolved at PM level

## 6. Focus on Products
**Principle**: A PRINCE2 project focuses on the definition and delivery of products.

**Product-Based Planning:**
1. Write Project Product Description
2. Create Product Breakdown Structure
3. Write Product Descriptions
4. Create Product Flow Diagram

**Product Description Includes:**
- Purpose
- Composition
- Derivation (inputs)
- Quality criteria
- Quality methods
- Quality responsibilities

**Benefits:**
- Clarity on what will be delivered
- Traceability
- Quality focus
- Progress measurement

## 7. Tailor to Suit the Project
**Principle**: PRINCE2 is tailored to suit the project's environment, size, complexity, importance, capability, and risk.

**Tailoring Considerations:**
- Project size and complexity
- Organization maturity
- Regulatory requirements
- Risk level
- Resource availability

**What Can Be Tailored:**
- Management product templates
- Roles (combine or separate)
- Frequency of management activities
- Level of formality
- Terminology

**What Cannot Be Changed:**
- The seven principles themselves
- Need for Business Case
- Defined roles (though can be combined)
- Stage-based control

## Applying the Principles

### Small Projects
- Combine roles (Project Manager + Team Manager)
- Shorter stages
- Simplified documentation
- Informal reviews

### Large Programs
- Multiple teams with Team Managers
- Formal stage boundaries
- Comprehensive documentation
- Independent Project Assurance

### Agile Environment
- Sprint = delivery stage
- Product Owner = Senior User
- Scrum Master = Team Manager/Project Support
- Backlog = Product Descriptions

## Validation Checklist
✓ Is there documented business justification?
✓ Have lessons been captured and applied?
✓ Are roles clearly defined and filled?
✓ Is the project divided into manageable stages?
✓ Are tolerances set and monitored?
✓ Are products clearly defined?
✓ Has PRINCE2 been tailored appropriately?

**If any answer is NO, the project is not following PRINCE2.**
`,
    summary: "Complete guide to PRINCE2's Seven Principles - the foundational rules that determine if a project is truly PRINCE2-compliant",
    tags: ["prince2", "principles", "governance", "business-case", "stages", "products"],
    source: "PRINCE2 6th Edition",
    version: "6.0",
    metadata: {
      chapter: "3",
      applicability: ["all-projects", "uk-government", "european-projects"]
    },
    status: "published" as const
  },

  {
    title: "PRINCE2: Managing Product Delivery",
    category: "prince2" as const,
    subcategory: "Processes",
    content: `# PRINCE2: Managing Product Delivery Process

## Overview
The purpose of the Managing Product Delivery process is to control the link between the Project Manager and the Team Manager(s) by agreeing on requirements for acceptance, execution, and delivery of project work.

## Process Activities

### 1. Accept a Work Package
**Objective**: Ensure Team Manager and Project Manager agree on work to be done.

**Inputs:**
- Work Package (from Project Manager)
- Quality Register
- Configuration Item Records

**Activities:**
- Review Work Package requirements
- Clarify expectations and constraints
- Confirm resource availability
- Agree reporting schedule
- Sign off on acceptance

**Work Package Contains:**
- Product Description(s)
- Techniques, processes, procedures to be used
- Development interfaces
- Operations and maintenance acceptance
- Configuration management requirements
- Joint agreements between PM and Team Manager
- Tolerances (time, cost, effort, scope, risk, quality)
- Reporting arrangements

**Acceptance Criteria:**
✓ Requirements clearly understood
✓ Quality criteria defined
✓ Resources available
✓ Dependencies identified
✓ Reporting agreed

### 2. Execute a Work Package
**Objective**: Create products defined in Work Package to required quality.

**Activities:**
- Assign work to team members
- Create products per specification
- Track progress
- Capture issues
- Perform quality checks
- Update records
- Report progress to Project Manager

**Quality Management:**
- Follow Product Description quality criteria
- Apply quality methods specified
- Document quality inspections
- Get quality sign-offs

**Progress Tracking:**
- **Daily**: Team stand-ups
- **Weekly**: Checkpoint Reports to PM
- **As Needed**: Highlight Reports (issues/risks)

**Issue Management:**
- Log issues immediately
- Assess impact
- Propose resolution
- Escalate if beyond authority

### 3. Deliver a Work Package
**Objective**: Obtain approval that products meet quality criteria and hand them over.

**Activities:**
- Conduct final quality checks
- Create Quality Records
- Update Configuration Item Records
- Obtain acceptance from Project Manager
- Hand over completed products
- Report lessons learned

**Approval Process:**
1. Team Manager confirms quality checks complete
2. Project Manager reviews quality records
3. Project Manager confirms products meet acceptance criteria
4. Formal sign-off
5. Products transferred to Project Manager control

**Deliverables:**
- Completed products
- Quality Records
- Updated Configuration Item Records
- Lessons Report
- Final Checkpoint Report

## Checkpoint Reports

**Purpose**: Regular progress update from Team Manager to Project Manager.

**Content:**
- Date of report and period covered
- Follow-ups from previous report
- This reporting period:
  - Products completed
  - Quality work performed
  - Work packages ready for approval
  - Actual or potential slippages
  - Actuals v. budget
  - Issues and risks
- Next reporting period:
  - Products to be completed
  - Quality activities planned
  - Corrective actions

**Frequency:**
- Weekly for most projects
- Daily for critical/fast-paced work
- Bi-weekly for stable work

## Quality in Product Delivery

### Quality Planning
- Review Product Descriptions
- Understand quality criteria
- Plan quality activities
- Assign quality roles

### Quality Methods
- **Inspection**: Formal review by independent party
- **Test**: Execute to verify function
- **Review**: Team examines product
- **Walkthrough**: Creator presents to team

### Quality Records
Document all quality activities:
- Method used
- Date conducted
- Participants
- Results
- Actions required
- Sign-offs

## Interface with Project Manager

### Communication Points
1. **Work Package Handover**: Clear understanding of requirements
2. **Checkpoint Reports**: Regular progress updates
3. **Highlight Reports**: Exceptions and issues
4. **Work Package Delivery**: Formal handover

### Escalation Path
- **Minor Issues**: Team Manager resolves
- **Work Package Impact**: Highlight Report to PM
- **Tolerance Breach**: Exception Report via PM to Board

## Team Manager Responsibilities

### Daily
- Monitor team work
- Remove blockers
- Track progress
- Answer questions

### Weekly
- Checkpoint Report to PM
- Quality reviews
- Risk assessments
- Issue management

### End of Work Package
- Final quality checks
- Documentation completion
- Lessons capture
- Formal handover

## Common Challenges

### Challenge: Scope Creep
**Solution**: Work Package defines exact scope. Any additions require new Work Package.

### Challenge: Quality vs. Speed
**Solution**: Quality criteria non-negotiable. If time pressured, escalate to PM for tolerance decision.

### Challenge: Resource Conflicts
**Solution**: Highlight Report to PM. Resource allocation is PM responsibility.

### Challenge: Changing Requirements
**Solution**: Issue raised. Change control via PM and Board.

## Success Factors
✓ Clear Work Package with unambiguous requirements
✓ Agreed quality criteria and methods
✓ Regular, honest reporting
✓ Early escalation of issues
✓ Disciplined quality checks
✓ Complete documentation
✓ Formal handovers

## Integration with Agile

### Sprint as Work Package
- Sprint Planning = Accept Work Package
- Daily Scrum = Progress tracking
- Sprint Review = Deliver Work Package
- Sprint Retrospective = Lessons learned

### Adaptations
- Checkpoint Reports = Sprint burndown
- Quality checks = Definition of Done
- Highlight Reports = Sprint impediments
`,
    summary: "PRINCE2's Managing Product Delivery process - how Team Managers accept, execute, and deliver Work Packages with quality",
    tags: ["prince2", "product-delivery", "work-package", "quality", "checkpoint-reports"],
    source: "PRINCE2 6th Edition",
    version: "6.0",
    metadata: {
      chapter: "14",
      applicability: ["all-projects"]
    },
    status: "published" as const
  }
];

const safeArticles = [
  {
    title: "SAFe: PI Planning Essentials",
    category: "safe" as const,
    subcategory: "Events",
    content: `# SAFe: Program Increment (PI) Planning

## Overview
PI Planning is the heartbeat of the Agile Release Train (ART). It's a cadence-based, face-to-face event that serves as the heartbeat of the ART, aligning all teams to a shared mission and vision.

## Event Structure

### Duration
- **Standard**: 2 full days (8 hours each)
- **Distributed**: May extend to 3 days for remote teams
- **Frequency**: Every 8-12 weeks (typical PI length)

### Attendees
**Required:**
- All ART team members (Scrum Masters, Product Owners, Developers)
- Release Train Engineer (RTE)
- Product Management
- System Architect/Engineering
- Business Owners

**Optional but Valuable:**
- Customers
- Suppliers/Partners
- Portfolio stakeholders

## Agenda Overview

### Day 1

#### 8:00 AM - Business Context (1 hour)
**Speaker**: Senior executive or Business Owner

**Content:**
- Strategic vision and context
- Current state of the business
- Market conditions and competition
- Why this PI matters
- Success criteria for PI

#### 9:00 AM - Product/Solution Vision (1 hour)
**Speaker**: Product Management

**Content:**
- Product vision and roadmap
- Top 10 features for this PI
- Prioritization rationale
- Dependencies on other ARTs
- Known constraints

#### 10:00 AM - Architecture Vision (30 min)
**Speaker**: System Architect/Engineering

**Content:**
- Architectural runway status
- New architectural initiatives
- Technical constraints
- Infrastructure needs
- Enabler work required

#### 10:30 AM - Planning Context (30 min)
**Speaker**: RTE

**Content:**
- Velocity and capacity
- Current backlog
- Known issues and risks
- Planning mechanics
- Team breakout logistics

#### 11:00 AM - Team Breakouts #1 (4 hours)
**Activities:**
- Draft iteration plans (1-5)
- Identify dependencies
- Create Program Board
- Estimate capacity
- Flag risks

#### 3:00 PM - Draft Plan Review (1 hour)
- Each team presents draft plan (5 min each)
- Highlight dependencies
- Surface risks
- Identify confidence vote issues

### Day 2

#### 8:00 AM - Planning Adjustments (30 min)
**Speaker**: RTE and Product Management

**Content:**
- Address Day 1 issues
- Adjust priorities if needed
- Resolve dependencies
- Risk mitigation strategies

#### 8:30 AM - Team Breakouts #2 (4 hours)
**Activities:**
- Finalize iteration plans
- Resolve dependencies
- Update Program Board
- Risk mitigation planning
- Commit to objectives

#### 12:30 PM - Lunch & Networking (1 hour)

#### 1:30 PM - Final Plan Review (1 hour)
- Each team presents final plan
- Commitment to PI Objectives
- Confidence vote (discussed below)

#### 2:30 PM - Program Risks (30 min)
- Review ROAM board
- Risk categorization
- Mitigation ownership

#### 3:00 PM - PI Planning Vote of Confidence (30 min)
- Fist of five vote
- Address concerns if <3
- Revise if necessary

#### 3:30 PM - Planning Retrospective (30 min)
- What went well
- What to improve
- Action items for next PI Planning

## Key Artifacts Created

### 1. PI Objectives
Each team creates 3-5 objectives:
- Committed vs. Uncommitted
- Business Value (assigned by Business Owners)
- Stretch objectives clearly marked

**Format:**
\`\`\`
Team: Platform Engineering
PI Objectives:

1. [Committed] Deploy new payment gateway (BV: 8)
2. [Committed] Reduce API latency by 30% (BV: 5)
3. [Uncommitted] Implement caching layer (BV: 3)
4. [Stretch] Upgrade to Kubernetes 1.28 (BV: 2)
\`\`\`

### 2. Program Board
Visual representation showing:
- All features planned for PI
- Timeline across iterations
- Dependencies between teams
- Milestones

**Dependency Types:**
- Green = Internal (within ART)
- Red = External (other ARTs, suppliers)
- Yellow = Architecture/Infrastructure

### 3. ROAM Board (Risks)
Risks categorized as:
- **R**esolved: Dealt with, no longer a risk
- **O**wned: Owner assigned, mitigation plan in place
- **A**ccepted: Acknowledged, will monitor
- **M**itigated: Actions taken to reduce probability/impact

### 4. Confidence Vote Results
- Track individual team confidence
- Overall ART confidence
- Action items if low confidence

## Confidence Vote Mechanism

### Fist of Five Voting
- **5 fingers**: Absolutely confident, will champion the plan
- **4 fingers**: Confident, minor concerns
- **3 fingers**: Somewhat confident, moderate concerns
- **2 fingers**: Not confident, significant concerns
- **1 finger**: Very concerned, plan needs major changes
- **Fist (0)**: Cannot support this plan

### Success Criteria
- **Target**: Average >= 3.5
- **Minimum**: No team below 3
- **Ideal**: Most teams at 4 or 5

### If Low Confidence (<3)
1. Stop and address concerns immediately
2. Identify specific issues
3. Adjust plan as needed
4. Re-vote after adjustments

## Best Practices

### Pre-PI Planning Preparation
- **2 weeks before**: Features defined and estimated
- **1 week before**: Feature prioritization complete
- **3 days before**: Architectural runway review
- **Day before**: Facility and tech setup

### During Planning
✓ Keep to schedule (use timers)
✓ RTE facilitates, doesn't dictate
✓ All voices heard (use techniques like silent writing)
✓ Focus on outcomes, not activities
✓ Make dependencies visible immediately
✓ Capture risks as they emerge
✓ Business Owners actively participate

### Team Breakout Success Factors
- Co-located if possible
- Scrum Master facilitates
- Product Owner available
- Cross-team coordination visible
- Program Board updated frequently
- Capacity-based planning (not hope-based)

### Anti-Patterns to Avoid
❌ Pre-planning commitments (defeats purpose)
❌ Executives absent (lack of business context)
❌ Remote teams without proper facilitation
❌ Ignoring low confidence votes
❌ Over-committing capacity (use 80% rule)
❌ Not addressing dependencies
❌ Treating it as admin exercise

## Distributed PI Planning

### Technical Requirements
- High-quality video conferencing
- Digital Program Board (Miro, Mural, Jira)
- Breakout room capability
- Screen sharing
- Real-time collaboration tools

### Adjustments
- Shorter sessions with more breaks
- Extend to 3 days if needed
- Pre-record some presentations
- More frequent check-ins
- Enhanced facilitation

## Success Metrics

### Planning Success
- Confidence vote >= 3.5
- <10% uncommitted work
- All critical dependencies identified
- Risk mitigation plans in place
- 100% team participation

### Execution Success (Track During PI)
- Actual vs. planned feature delivery
- Dependency management effectiveness
- Risk resolution rate
- Predictability (delivery vs. commitment)

## Follow-up Activities

### Immediately After
- Publish PI Objectives
- Share Program Board
- Communicate risks and mitigation plans
- Create dependency tracking board

### Throughout PI
- Daily dependency standup (if needed)
- Bi-weekly Scrum of Scrums
- Continuous risk monitoring
- Mid-PI check-in

### End of PI
- PI System Demo
- Inspect & Adapt workshop
- Measure predictability
- Lessons for next PI Planning
`,
    summary: "Complete guide to SAFe PI Planning - the 2-day event that aligns Agile Release Trains on objectives, dependencies, and risks",
    tags: ["safe", "pi-planning", "art", "program-board", "dependencies", "confidence-vote"],
    source: "SAFe 6.0 Framework",
    version: "6.0",
    metadata: {
      applicability: ["safe", "agile", "scaled-agile"]
    },
    status: "published" as const
  },

  {
    title: "SAFe: ART Roles and Responsibilities",
    category: "safe" as const,
    subcategory: "Roles",
    content: `# SAFe: Agile Release Train (ART) Roles & Responsibilities

## Overview
The Agile Release Train (ART) is a long-lived team of Agile teams (50-125 people) that incrementally develops, delivers, and operates one or more solutions.

## Core Roles

### Release Train Engineer (RTE)

**Role**: Servant leader and coach for the ART.

**Key Responsibilities:**
1. **Facilitate Events**
   - PI Planning (lead facilitator)
   - Scrum of Scrums
   - PO Sync
   - System Demos
   - Inspect & Adapt workshops

2. **Remove Impediments**
   - Address ART-level blockers
   - Escalate to portfolio when needed
   - Coordinate with other ARTs
   - Manage vendor relationships

3. **Risk and Impediment Management**
   - Maintain ART risk board
   - Track and visualize impediments
   - Drive risk mitigation
   - Report to stakeholders

4. **Process Improvement**
   - Coach Scrum Masters
   - Improve ART ceremonies
   - Implement SAFe practices
   - Measure and improve flow

5. **Communication**
   - Status reporting to stakeholders
   - Coordinate with other ARTs
   - Facilitate alignment

**Skills Required:**
- Deep SAFe knowledge (usually SAFe RTE certification)
- Facilitation expertise
- Servant leadership
- Systems thinking
- Conflict resolution

**Success Metrics:**
- ART predictability (achieved vs. planned)
- Delivery frequency
- Team satisfaction scores
- Impediment resolution time
- Quality metrics (defects, incidents)

### Product Management

**Role**: Define and prioritize the ART backlog.

**Key Responsibilities:**
1. **Vision and Roadmap**
   - Maintain product vision
   - Develop solution roadmap
   - Communicate strategy to teams
   - Align with portfolio

2. **Backlog Management**
   - Define and prioritize features
   - Write feature descriptions
   - Sequence work for maximum value
   - Manage WSJF prioritization

3. **Customer Engagement**
   - Understand customer needs
   - Gather market feedback
   - Validate solutions
   - Manage stakeholder expectations

4. **PI Planning**
   - Present product vision
   - Define top 10 features for PI
   - Adjust priorities during planning
   - Approve team PI objectives

5. **Release Management**
   - Define release strategy
   - Coordinate release timing
   - Approve releases
   - Measure value delivery

**Skills Required:**
- Deep domain expertise
- Strategic thinking
- Customer empathy
- Business acumen
- Communication

**Success Metrics:**
- Customer satisfaction
- Feature adoption rates
- Business value delivered
- Market competitiveness
- Revenue/cost impact

### System Architect/Engineer

**Role**: Define overall technical vision and architectural runway.

**Key Responsibilities:**
1. **Architecture Vision**
   - Define technical direction
   - Establish architectural principles
   - Create reference architectures
   - Ensure technical alignment

2. **Enable Teams**
   - Provide technical guidance
   - Review designs
   - Facilitate architectural discussions
   - Transfer knowledge

3. **Manage Technical Debt**
   - Identify technical debt
   - Prioritize refactoring
   - Balance features with enablers
   - Ensure sustainable pace

4. **Build Architectural Runway**
   - Define enabler work
   - Ensure infrastructure readiness
   - Plan technical initiatives
   - Coordinate with teams

5. **Technical Risk Management**
   - Identify technical risks
   - Propose mitigation strategies
   - Validate technical feasibility
   - POC high-risk items

**Skills Required:**
- Deep technical expertise
- Systems thinking
- Design patterns knowledge
- Communication with non-technical stakeholders
- Mentoring ability

**Success Metrics:**
- Technical debt trends
- Architecture compliance
- System performance metrics
- Enabler completion rate
- Innovation velocity

### Business Owners

**Role**: Key stakeholders with financial and governance responsibility.

**Key Responsibilities:**
1. **PI Planning Participation**
   - Attend PI Planning
   - Provide business context
   - Assign business value to objectives
   - Participate in confidence vote

2. **Governance**
   - Approve PI plans
   - Review progress at System Demos
   - Make scope/schedule trade-off decisions
   - Approve releases

3. **Value Stream Management**
   - Define value stream KPIs
   - Review solution viability
   - Ensure business outcomes
   - Approve major investments

4. **Inspect & Adapt**
   - Participate in I&A workshop
   - Provide business feedback
   - Approve improvement initiatives

**Authority Level:**
- Can approve/reject PI plans
- Make trade-off decisions within portfolio constraints
- Approve releases to production
- Escalate to portfolio when needed

### Product Owners (on each team)

**Role**: Define and accept stories for one Agile team.

**Key Responsibilities:**
1. **Team Backlog Management**
   - Define user stories
   - Prioritize team backlog
   - Groom backlog with team
   - Clarify acceptance criteria

2. **Iteration Planning**
   - Participate in iteration planning
   - Answer team questions
   - Adjust priorities as needed
   - Accept completed stories

3. **Stakeholder Interface**
   - Represent stakeholder needs
   - Manage expectations
   - Provide feedback to Product Management
   - Participate in System Demos

4. **Team Objectives**
   - Define team PI Objectives
   - Negotiate with Product Management
   - Commit on behalf of team
   - Track objective progress

**Interface with Product Management:**
- PO Sync (weekly meeting)
- Feature breakdown into stories
- Escalation path for blockers
- Aligned prioritization

### Scrum Masters (on each team)

**Role**: Coach team in Agile and SAFe practices.

**Key Responsibilities:**
1. **Facilitate Team Events**
   - Daily Stand-ups
   - Iteration Planning
   - Team Demos
   - Iteration Retrospectives

2. **Remove Team Impediments**
   - Identify blockers
   - Work with RTE for ART-level issues
   - Protect team from interruptions
   - Ensure team has what they need

3. **Coach Team**
   - Improve agile practices
   - Facilitate continuous improvement
   - Build self-organization
   - Develop T-shaped skills

4. **ART Ceremonies**
   - Participate in Scrum of Scrums
   - Contribute to PI Planning
   - Support System Demos
   - I&A workshops

5. **Metrics and Visibility**
   - Maintain team boards
   - Track velocity and capacity
   - Report to RTE
   - Identify improvement opportunities

**Interface with RTE:**
- Escalate ART-level impediments
- Report team health
- Coordinate dependencies
- Learn and improve together

## Supporting Roles

### System Team
**Purpose**: Assist in building and supporting the development, continuous integration, and test environments.

**Responsibilities:**
- Build and maintain CI/CD pipelines
- Manage test environments
- Support integration testing
- Infrastructure automation

### UX Designers
**Purpose**: Design user experience across the solution.

**Responsibilities:**
- Create UX vision
- Design interfaces
- Conduct user research
- Validate designs with users

### Shared Services
**Purpose**: Provide specialized capabilities to multiple ARTs.

**Examples:**
- Data science teams
- Security specialists
- Performance engineers
- Compliance experts

## Role Interaction Model

### Daily Interactions
\`\`\`
Team Members <-> Scrum Master <-> RTE
Team Members <-> Product Owner <-> Product Management
Developers <-> System Architect
\`\`\`

### Weekly Interactions
- Scrum of Scrums (SM + RTE + Product Owners)
- PO Sync (All POs + Product Management)
- Architecture Sync (Architects + System Architect)

### PI Cadence
- PI Planning (Everyone)
- System Demos (Everyone, Business Owners)
- I&A Workshop (Everyone)
- PI Planning Preparation (Leadership)

## Staffing Models

### Dedicated vs. Shared
- **Team Members**: 100% dedicated to ART
- **PO**: Typically 100% dedicated to team
- **SM**: Can support 1-2 teams
- **RTE**: Dedicated to ART (sometimes supports 2 ARTs)
- **Product Management**: May serve multiple ARTs
- **System Architect**: Often shared

### Team Size Guidelines
- **Agile Team**: 5-9 people
- **ART**: 5-12 teams (50-125 people total)
- **Solution Train**: Multiple ARTs

## Career Progression

### Scrum Master Path
1. Team Scrum Master
2. Senior Scrum Master (support 2 teams)
3. Release Train Engineer
4. Solution Train Engineer (for large programs)

### Product Owner Path
1. Team Product Owner
2. Product Management (ART level)
3. Solution Management (Solution Train level)
4. Product Portfolio Management

## Common Anti-Patterns

❌ **RTE as Project Manager**: RTE is a servant leader, not a command-and-control manager
❌ **Product Owner bottleneck**: PO must be available and empowered
❌ **Absent Business Owners**: Must actively participate, not delegate
❌ **System Architect in ivory tower**: Must work with teams, not dictate from above
❌ **Part-time team members**: Reduces predictability and flow
❌ **Scrum Master as admin**: Should be coach and leader, not just meeting scheduler

## Success Factors

✓ Clear role definitions and boundaries
✓ Empowered decision-making at appropriate levels
✓ Strong collaboration between roles
✓ Regular communication and alignment
✓ Shared commitment to ART success
✓ Continuous learning and improvement
`,
    summary: "Comprehensive guide to all roles in a SAFe Agile Release Train including RTE, Product Management, System Architect, and team roles",
    tags: ["safe", "art", "roles", "rte", "product-management", "scrum-master", "product-owner"],
    source: "SAFe 6.0 Framework",
    version: "6.0",
    metadata: {
      applicability: ["safe", "agile", "scaled-agile", "large-organizations"]
    },
    status: "published" as const
  }
];

const pmiArticles = [
  {
    title: "PMI: Stakeholder Engagement",
    category: "pmi_standard" as const,
    subcategory: "Stakeholder Management",
    content: `# PMI Standard: Stakeholder Engagement

## Overview
Stakeholder engagement is one of the most critical success factors for projects. Effective stakeholder engagement increases the likelihood of project success by ensuring that stakeholders' needs are understood and addressed.

## Stakeholder Identification

### Stakeholder Categories

#### Internal Stakeholders
- **Project Sponsor**: Provides resources and high-level direction
- **Project Manager**: Accountable for project success
- **Project Team**: Executes project work
- **Functional Managers**: Provide resources and expertise
- **PMO**: Provides governance and support

#### External Stakeholders
- **Customers**: End users of project deliverables
- **Vendors/Suppliers**: Provide goods/services
- **Regulatory Bodies**: Enforce compliance requirements
- **Community**: Affected by project outcomes

#### Stakeholder Analysis Dimensions
1. **Power**: Ability to influence project
2. **Interest**: Level of concern about project
3. **Influence**: Active involvement in project
4. **Impact**: Affected by project outcomes

### Power/Interest Grid

\`\`\`
         High Interest
             ↑
  Manage     |     Manage
  Closely    |     Closely
  ───────────┼───────────→ High Power
  Monitor    |     Keep
             |     Informed
             ↓
         Low Interest
\`\`\`

- **High Power, High Interest**: Key stakeholders - Manage closely
- **High Power, Low Interest**: Keep satisfied
- **Low Power, High Interest**: Keep informed
- **Low Power, Low Interest**: Monitor

### Stakeholder Register

**Required Information:**
- Name and organization
- Role on project
- Contact information
- Power/Interest/Influence/Impact ratings
- Classification
- Requirements and expectations
- Engagement strategy
- Communication preferences

**Example Entry:**
\`\`\`
Name: Sarah Johnson
Role: VP of Operations
Organization: Business Unit A
Power: High | Interest: High | Influence: High | Impact: Medium
Classification: Manage Closely
Requirements: ROI > 25%, No service disruption
Engagement: Weekly status meetings, Monthly steering committee
Communication: Email summaries, Executive dashboards
\`\`\`

## Engagement Levels

### Current vs. Desired State
Track stakeholder engagement on a spectrum:

1. **Unaware**: Don't know about project
2. **Resistant**: Aware but resistant to change
3. **Neutral**: Aware but neither supportive nor resistant
4. **Supportive**: Aware and supportive
5. **Leading**: Actively engaged and influencing others

**Engagement Assessment Matrix:**
\`\`\`
Stakeholder    | Unaware | Resistant | Neutral | Supportive | Leading
───────────────┼─────────┼───────────┼─────────┼────────────┼────────
Sarah Johnson  |         |           |    C    |     D      |
John Smith     |         |     C     |         |     D      |
Mary Williams  |         |           |         |     C/D    |
\`\`\`
C = Current state, D = Desired state

## Engagement Strategies

### For Each Engagement Level

#### Moving from Unaware → Neutral
**Strategies:**
- Information sessions
- Project overview materials
- Stakeholder briefings
- Clear communication of benefits

#### Moving from Resistant → Supportive
**Strategies:**
- Listen to concerns
- Address issues directly
- Involve in solution design
- Demonstrate quick wins
- Provide training and support

#### Moving from Neutral → Supportive
**Strategies:**
- Highlight benefits
- Show progress and success
- Involve in decision-making
- Recognition and appreciation

#### Moving from Supportive → Leading
**Strategies:**
- Empower as champions
- Give platform to advocate
- Involve in strategic decisions
- Recognize publicly

## Communication Planning

### Communication Matrix

**For Each Stakeholder/Group:**
- **What**: Information to communicate
- **When**: Frequency and timing
- **How**: Method/channel
- **Who**: Responsible party
- **Why**: Purpose/objective

**Example:**
\`\`\`
Stakeholder: Executive Steering Committee
What: Project status, risks, decisions needed
When: Monthly
How: PowerPoint presentation + discussion
Who: Project Manager
Why: Governance and decision-making
\`\`\`

### Communication Methods by Stakeholder Type

**Executives:**
- Format: Executive summaries, dashboards
- Frequency: Monthly or milestone-based
- Content: High-level status, key decisions, ROI
- Duration: 15-30 minutes

**Project Team:**
- Format: Stand-ups, team meetings, collaboration tools
- Frequency: Daily/weekly
- Content: Detailed status, blockers, next steps
- Duration: Varies (15 min stand-ups to 1-hour meetings)

**Customers:**
- Format: Demos, newsletters, focus groups
- Frequency: Iteration-based or monthly
- Content: Progress, upcoming features, feedback opportunities
- Duration: 30-60 minutes

**Vendors:**
- Format: Coordination meetings, status reports
- Frequency: Weekly or as-needed
- Content: Requirements, schedules, quality expectations
- Duration: 30-60 minutes

## Engagement Techniques

### One-on-One Meetings
**When to Use:**
- Building relationships
- Addressing concerns
- Gathering sensitive feedback
- Negotiating support

**Best Practices:**
- Prepare agenda
- Listen more than talk
- Document commitments
- Follow up promptly

### Workshops
**When to Use:**
- Requirements gathering
- Problem-solving
- Decision-making
- Team building

**Best Practices:**
- Clear objectives
- Right participants
- Skilled facilitation
- Action items captured

### Surveys
**When to Use:**
- Large stakeholder groups
- Gathering broad feedback
- Baseline measurements
- Gauging satisfaction

**Best Practices:**
- Clear, concise questions
- Mix of quantitative and qualitative
- Anonymous when appropriate
- Share results

### Focus Groups
**When to Use:**
- Exploring ideas
- Testing concepts
- Understanding user needs
- Building consensus

**Best Practices:**
- Homogeneous groups
- Skilled moderator
- Open discussion
- Document insights

## Managing Difficult Stakeholders

### Types and Strategies

#### The Blocker
**Characteristics**: Actively opposes project, creates obstacles

**Strategies:**
- Understand root cause of resistance
- Address concerns directly
- Involve in solution design
- Escalate if necessary
- Seek executive sponsor support

#### The Ghost
**Characteristics**: Unresponsive, disengaged, hard to reach

**Strategies:**
- Multiple communication channels
- Clear deadlines and consequences
- Escalate to their manager
- Document attempts
- Adjust plan if critical input not received

#### The Scope Creeper
**Characteristics**: Constantly adds requirements

**Strategies:**
- Rigorous change control
- Show impact of changes (cost, schedule)
- Prioritization exercises
- Phase additional requests
- Executive sponsor enforcement

#### The Micromanager
**Characteristics**: Wants excessive detail, constant updates

**Strategies:**
- Proactive communication
- Structured reporting (satisfy need for information)
- Set boundaries politely
- Regular touchpoints
- Build trust over time

## Conflict Management

### Conflict Resolution Techniques

1. **Collaborating**: Win-win, integrate ideas
   - Best for: Important relationships, complex issues
   - Time: High

2. **Compromising**: Each party gives something
   - Best for: Equal power, temporary solutions
   - Time: Medium

3. **Accommodating**: Yield to others
   - Best for: Low importance to you, preserve relationship
   - Time: Low

4. **Competing**: Assert your position
   - Best for: Quick decisions, emergencies
   - Time: Low
   - Risk: Damages relationships

5. **Avoiding**: Postpone or withdraw
   - Best for: Trivial issues, cooling-off periods
   - Time: Low
   - Risk: Issue may escalate

**Preferred PMI Approach**: Collaborate first, compromise if needed. Avoid competing except in emergencies.

## Measuring Engagement Effectiveness

### Key Metrics

1. **Engagement Level Progression**
   - Track movement on engagement spectrum
   - Target: 80%+ at Supportive or Leading

2. **Communication Effectiveness**
   - Response rates to communications
   - Attendance at key meetings/events
   - Feedback quality and quantity

3. **Stakeholder Satisfaction**
   - Regular surveys (quarterly)
   - Net Promoter Score
   - Complaints/issues raised

4. **Project Support Indicators**
   - Change request approval rate
   - Resource allocation responsiveness
   - Issue resolution speed

### Red Flags
❌ Declining meeting attendance
❌ Increased resistance or conflict
❌ Negative feedback trending up
❌ Key decisions delayed
❌ Resources pulled or reduced
❌ Scope creep accelerating

## Best Practices

✓ **Start Early**: Identify and engage stakeholders in initiation
✓ **Be Proactive**: Don't wait for stakeholders to come to you
✓ **Tailor Approach**: One size doesn't fit all
✓ **Build Relationships**: Invest time before you need something
✓ **Be Transparent**: Share both good and bad news
✓ **Listen Actively**: Understand concerns and motivations
✓ **Manage Up**: Keep sponsors and executives engaged
✓ **Document Everything**: Track commitments and decisions
✓ **Regular Assessment**: Review and update stakeholder analysis
✓ **Celebrate Wins**: Recognize stakeholder contributions

## Common Pitfalls to Avoid

❌ **Stakeholder analysis done once**: It's a living document
❌ **Over-communicating to everyone**: Tailor your message
❌ **Under-communicating to executives**: Keep them informed
❌ **Ignoring resistant stakeholders**: They can derail projects
❌ **No formal stakeholder register**: Track systematically
❌ **Communication plan buried in PM plan**: Make it visible
❌ **Not measuring engagement**: What gets measured gets managed
❌ **Treating all stakeholders equally**: Prioritize your efforts

## Integration with Other Processes

- **Risk Management**: Stakeholder resistance is a risk
- **Communications Management**: Stakeholder needs drive communication plan
- **Change Management**: Stakeholder engagement critical for adoption
- **Quality Management**: Stakeholder expectations define quality
- **Scope Management**: Stakeholder requirements define scope
`,
    summary: "Complete PMI Stakeholder Engagement framework including identification, analysis, engagement strategies, and conflict management",
    tags: ["pmi", "stakeholder-engagement", "communication", "power-interest-grid", "conflict-management"],
    source: "PMI PMBOK Guide & Practice Standard",
    version: "7th Edition",
    metadata: {
      applicability: ["all-projects", "change-management", "large-stakeholder-groups"]
    },
    status: "published" as const
  }
];

async function seedKnowledgeBase() {
  try {
    console.log("🌱 Seeding Knowledge Base...");

    // Ensure storage is initialized
    if (!storage.db) {
      throw new Error("Storage not properly initialized");
    }

    const kbRepo = initKnowledgeBaseRepository(storage);

    // Seed PMBOK articles
    console.log("\n📘 Seeding PMBOK articles...");
    for (const article of pmbokArticles) {
      const created = await kbRepo.createArticle(article);
      console.log(`  ✅ Created: ${created.title}`);
    }

    // Seed PRINCE2 articles
    console.log("\n👑 Seeding PRINCE2 articles...");
    for (const article of prince2Articles) {
      const created = await kbRepo.createArticle(article);
      console.log(`  ✅ Created: ${created.title}`);
    }

    // Seed SAFe articles
    console.log("\n🚀 Seeding SAFe articles...");
    for (const article of safeArticles) {
      const created = await kbRepo.createArticle(article);
      console.log(`  ✅ Created: ${created.title}`);
    }

    // Seed PMI articles
    console.log("\n📊 Seeding PMI Standards articles...");
    for (const article of pmiArticles) {
      const created = await kbRepo.createArticle(article);
      console.log(`  ✅ Created: ${created.title}`);
    }

    // Summary
    const totalArticles = pmbokArticles.length + prince2Articles.length + safeArticles.length + pmiArticles.length;
    console.log(`\n🎉 Successfully seeded ${totalArticles} knowledge base articles!`);
    console.log(`\n📊 Breakdown:`);
    console.log(`   - PMBOK: ${pmbokArticles.length} articles`);
    console.log(`   - PRINCE2: ${prince2Articles.length} articles`);
    console.log(`   - SAFe: ${safeArticles.length} articles`);
    console.log(`   - PMI Standards: ${pmiArticles.length} articles`);

  } catch (error: any) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await storage.db.end();
  }
}

seedKnowledgeBase();
