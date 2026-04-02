/**
 * SEED REGULATORY DOCUMENTS SCRIPT
 *
 * Populates Enhanced Knowledge Base with pre-documented regulatory frameworks,
 * standards, and best practices for all agents.
 *
 * Run with: npm run seed:documents
 */

import { storage } from '../storage.js';
import { getEnhancedKnowledgeBase } from '../lib/EnhancedKnowledgeBaseRepository.js';

interface RegulatoryDocument {
  title: string;
  content: string;
  summary: string;
  documentType: 'guideline' | 'manual' | 'sop' | 'rca' | 'form' | 'template' | 'policy';
  relevantAgents: string[];
  countryCode?: string;
  industry?: string;
  standardName: string;
  tags: string[];
  applicablePhases?: string[];
  category: string;
}

const REGULATORY_DOCUMENTS: RegulatoryDocument[] = [
  // ==================== GOVERNANCE AGENT ====================
  {
    title: 'SOX Compliance Checklist',
    summary: 'Sarbanes-Oxley Act compliance requirements for financial reporting and internal controls',
    content: `# SOX Compliance Checklist

## Overview
The Sarbanes-Oxley Act (SOX) requires public companies to maintain accurate financial records and establish internal controls.

## Key Requirements
1. **Section 302**: CEO/CFO certification of financial reports
2. **Section 404**: Internal control assessment
3. **Section 409**: Real-time disclosure of material changes
4. **Section 802**: Criminal penalties for document destruction

## Compliance Steps
- Establish internal control framework (COSO)
- Document all financial processes
- Implement segregation of duties
- Conduct regular audits
- Maintain audit trails
- Train personnel on compliance
- Report deficiencies to audit committee

## Project Management Implications
- Budget approval controls
- Change request documentation
- Financial reporting accuracy
- Risk assessment procedures`,
    documentType: 'guideline',
    relevantAgents: ['governance', 'finops', 'risk'],
    countryCode: 'US',
    industry: 'financial',
    standardName: 'SOX',
    tags: ['compliance', 'financial', 'audit', 'governance'],
    applicablePhases: ['initiation', 'planning', 'execution', 'monitoring', 'closing'],
    category: 'sop',
  },
  {
    title: 'GDPR Compliance Guide',
    summary: 'General Data Protection Regulation compliance for EU data privacy',
    content: `# GDPR Compliance Guide

## Overview
GDPR requires organizations to protect EU citizens' personal data and privacy.

## Core Principles
1. Lawfulness, fairness, and transparency
2. Purpose limitation
3. Data minimization
4. Accuracy
5. Storage limitation
6. Integrity and confidentiality
7. Accountability

## Compliance Requirements
- Obtain explicit consent
- Implement data protection by design
- Conduct Data Protection Impact Assessments (DPIAs)
- Appoint Data Protection Officer (DPO)
- Report breaches within 72 hours
- Enable right to erasure
- Maintain processing records

## Project Data Handling
- Identify personal data in project systems
- Implement access controls
- Encrypt data at rest and in transit
- Establish data retention policies
- Document data processing activities`,
    documentType: 'guideline',
    relevantAgents: ['governance', 'risk', 'tmo'],
    countryCode: 'EU',
    industry: 'technology',
    standardName: 'GDPR',
    tags: ['compliance', 'privacy', 'data protection', 'eu'],
    applicablePhases: ['initiation', 'planning', 'execution', 'monitoring'],
    category: 'sop',
  },
  {
    title: 'ISO 21500 Project Governance Standard',
    summary: 'International standard for project management governance',
    content: `# ISO 21500 Project Governance Standard

## Overview
ISO 21500 provides guidance on project management concepts and processes.

## Governance Structure
1. **Project Board**: Strategic oversight
2. **Project Manager**: Operational execution
3. **Project Assurance**: Independent review
4. **Project Support**: Administrative assistance

## Key Processes
- Integration management
- Stakeholder management
- Scope management
- Resource management
- Time management
- Cost management
- Risk management
- Quality management
- Procurement management
- Communication management

## Governance Gates
- Stage 1: Initiation approval
- Stage 2: Planning review
- Stage 3: Execution checkpoints
- Stage 4: Closing acceptance

## Decision Framework
- Define decision authority matrix (RACI)
- Establish escalation procedures
- Document approval thresholds
- Set governance meeting cadence`,
    documentType: 'guideline',
    relevantAgents: ['governance', 'pmo', 'planning'],
    countryCode: 'INTL',
    industry: 'all',
    standardName: 'ISO 21500',
    tags: ['governance', 'project management', 'iso', 'standard'],
    applicablePhases: ['initiation', 'planning', 'execution', 'monitoring', 'closing'],
    category: 'pmbok',
  },

  // ==================== RISK AGENT ====================
  {
    title: 'ISO 31000 Risk Management Guidelines',
    summary: 'International standard for enterprise risk management',
    content: `# ISO 31000 Risk Management Guidelines

## Overview
ISO 31000 provides principles, framework, and process for managing risk.

## Risk Management Principles
1. Integrated - Part of all organizational activities
2. Structured - Systematic approach
3. Customized - Aligned to context
4. Inclusive - Stakeholder involvement
5. Dynamic - Responsive to change
6. Best available information
7. Human and cultural factors
8. Continual improvement

## Risk Management Process
### 1. Establish Context
- Define scope and objectives
- Identify stakeholders
- Set risk criteria

### 2. Risk Assessment
- **Risk Identification**: Brainstorming, checklists, SWOT
- **Risk Analysis**: Qualitative and quantitative
- **Risk Evaluation**: Compare against criteria

### 3. Risk Treatment
- Avoid, reduce, share, or retain
- Develop action plans
- Assign ownership

### 4. Monitoring and Review
- Track KRIs (Key Risk Indicators)
- Review risk register
- Update assessments

### 5. Communication and Consultation
- Report to stakeholders
- Facilitate risk workshops
- Escalate critical risks`,
    documentType: 'guideline',
    relevantAgents: ['risk', 'governance', 'tmo'],
    countryCode: 'INTL',
    industry: 'all',
    standardName: 'ISO 31000',
    tags: ['risk management', 'iso', 'standard', 'framework'],
    applicablePhases: ['initiation', 'planning', 'execution', 'monitoring'],
    category: 'sop',
  },
  {
    title: 'NIST Cybersecurity Framework 2.0',
    summary: 'Framework for managing cybersecurity risks',
    content: `# NIST Cybersecurity Framework 2.0

## Overview
NIST CSF provides a policy framework of computer security guidance.

## Core Functions
### 1. Govern (NEW in 2.0)
- Establish cybersecurity strategy
- Define roles and responsibilities
- Align with organizational objectives

### 2. Identify
- Asset management
- Business environment
- Risk assessment
- Risk management strategy

### 3. Protect
- Access control
- Data security
- Protective technology
- Training and awareness

### 4. Detect
- Continuous monitoring
- Anomaly detection
- Security event analysis

### 5. Respond
- Incident response planning
- Communications
- Analysis and mitigation
- Improvements

### 6. Recover
- Recovery planning
- Improvements
- Communications

## Project Integration
- Conduct cybersecurity risk assessment
- Implement security controls
- Monitor for security events
- Report incidents
- Maintain audit logs`,
    documentType: 'guideline',
    relevantAgents: ['risk', 'governance', 'tmo'],
    countryCode: 'US',
    industry: 'technology',
    standardName: 'NIST CSF',
    tags: ['cybersecurity', 'risk', 'nist', 'framework'],
    applicablePhases: ['initiation', 'planning', 'execution', 'monitoring'],
    category: 'sop',
  },

  // ==================== FINOPS AGENT ====================
  {
    title: 'GAAP Cost Accounting Standards',
    summary: 'Generally Accepted Accounting Principles for project cost accounting',
    content: `# GAAP Cost Accounting Standards

## Overview
GAAP provides standardized accounting principles for financial reporting.

## Project Cost Categories
### 1. Direct Costs
- Labor (salaries, benefits)
- Materials and supplies
- Equipment usage
- Subcontractors

### 2. Indirect Costs
- Overhead allocation
- Administrative support
- Facilities
- Utilities

### 3. Capital Expenditures
- Long-term assets
- Depreciation schedules
- Asset lifecycle

## Cost Recognition
- **Accrual Basis**: Recognize when incurred, not when paid
- **Matching Principle**: Match costs to revenue period
- **Consistency**: Use same methods across periods

## Financial Reporting
- Balance sheet (assets, liabilities, equity)
- Income statement (revenue, expenses)
- Cash flow statement
- Statement of retained earnings

## Project Budget Controls
- Establish cost baselines
- Track actual vs. budget
- Calculate variances
- Forecast completion costs
- Report to stakeholders`,
    documentType: 'guideline',
    relevantAgents: ['finops', 'governance', 'vro'],
    countryCode: 'US',
    industry: 'financial',
    standardName: 'GAAP',
    tags: ['accounting', 'finance', 'gaap', 'cost management'],
    applicablePhases: ['planning', 'execution', 'monitoring', 'closing'],
    category: 'sop',
  },
  {
    title: 'Earned Value Management (EVM) Guide',
    summary: 'PMBOK-based methodology for measuring project performance',
    content: `# Earned Value Management Guide

## Overview
EVM integrates scope, schedule, and cost to measure project performance.

## Key Metrics
### Planned Value (PV)
- Authorized budget for scheduled work
- Also called Budgeted Cost of Work Scheduled (BCWS)

### Earned Value (EV)
- Budget for work actually completed
- Also called Budgeted Cost of Work Performed (BCWP)

### Actual Cost (AC)
- Actual cost incurred for work
- Also called Actual Cost of Work Performed (ACWP)

## Performance Indicators
### Cost Performance Index (CPI)
\`\`\`
CPI = EV / AC
\`\`\`
- CPI > 1.0: Under budget
- CPI < 1.0: Over budget

### Schedule Performance Index (SPI)
\`\`\`
SPI = EV / PV
\`\`\`
- SPI > 1.0: Ahead of schedule
- SPI < 1.0: Behind schedule

### Cost Variance (CV)
\`\`\`
CV = EV - AC
\`\`\`
- CV > 0: Under budget
- CV < 0: Over budget

### Schedule Variance (SV)
\`\`\`
SV = EV - PV
\`\`\`
- SV > 0: Ahead of schedule
- SV < 0: Behind schedule

## Forecasting
### Estimate at Completion (EAC)
\`\`\`
EAC = BAC / CPI
\`\`\`

### Estimate to Complete (ETC)
\`\`\`
ETC = EAC - AC
\`\`\`

### Variance at Completion (VAC)
\`\`\`
VAC = BAC - EAC
\`\`\`

## Reporting
- Create EVM reports monthly
- Track trends over time
- Escalate if CPI < 0.90 or SPI < 0.90
- Update forecasts based on performance`,
    documentType: 'guideline',
    relevantAgents: ['finops', 'planning', 'pmo'],
    countryCode: 'INTL',
    industry: 'all',
    standardName: 'PMBOK EVM',
    tags: ['evm', 'cost management', 'pmbok', 'performance'],
    applicablePhases: ['execution', 'monitoring'],
    category: 'pmbok',
  },

  // ==================== TMO AGENT ====================
  {
    title: 'TOGAF Architecture Development Method',
    summary: 'Enterprise architecture framework for transformation programs',
    content: `# TOGAF Architecture Development Method (ADM)

## Overview
TOGAF provides a framework for enterprise architecture planning and implementation.

## ADM Phases
### Preliminary Phase
- Define architecture principles
- Establish governance
- Select frameworks and tools

### Phase A: Architecture Vision
- Identify stakeholders
- Define scope
- Create high-level vision

### Phase B: Business Architecture
- Baseline business architecture
- Target business architecture
- Gap analysis

### Phase C: Information Systems Architecture
- Data architecture
- Application architecture

### Phase D: Technology Architecture
- Infrastructure and platforms
- Standards and guidelines

### Phase E: Opportunities and Solutions
- Identify work packages
- Define transition architectures
- Create roadmap

### Phase F: Migration Planning
- Prioritize projects
- Create implementation plan
- Assess dependencies

### Phase G: Implementation Governance
- Oversee implementation
- Manage architecture contracts
- Review compliance

### Phase H: Architecture Change Management
- Monitor changes
- Update architecture
- Manage change requests

## TMO Application
- Use for large transformation programs
- Establish architecture governance board
- Create transition roadmaps
- Manage architectural debt`,
    documentType: 'guideline',
    relevantAgents: ['tmo', 'governance', 'planning'],
    countryCode: 'INTL',
    industry: 'technology',
    standardName: 'TOGAF',
    tags: ['architecture', 'transformation', 'togaf', 'framework'],
    applicablePhases: ['initiation', 'planning', 'execution'],
    category: 'playbook',
  },
  {
    title: 'Prosci ADKAR Change Model',
    summary: 'Individual change management framework for transformation',
    content: `# Prosci ADKAR Change Model

## Overview
ADKAR is a goal-oriented change management model that focuses on individual change.

## ADKAR Elements
### A - Awareness
- Understand the need for change
- Communicate business reasons
- Create sense of urgency

**Key Activities:**
- Town halls and announcements
- Business case presentations
- Executive sponsorship
- Stakeholder analysis

### D - Desire
- Build desire to support change
- Address WIIFM (What's In It For Me)
- Manage resistance

**Key Activities:**
- One-on-one conversations
- Incentive programs
- Address concerns
- Engage middle management

### K - Knowledge
- Provide knowledge on how to change
- Training and education
- Documentation

**Key Activities:**
- Training programs
- Job aids and guides
- Coaching and mentoring
- Knowledge base articles

### A - Ability
- Support the ability to implement change
- Practice and feedback
- Remove barriers

**Key Activities:**
- Hands-on practice
- Performance support
- Remove obstacles
- Provide resources

### R - Reinforcement
- Sustain the change
- Recognize and reward
- Course correction

**Key Activities:**
- Celebrate wins
- Recognition programs
- Measure adoption
- Continuous improvement

## TMO Application
- Assess ADKAR scores for key stakeholders
- Create targeted interventions for weak areas
- Track change adoption metrics
- Report resistance and barriers`,
    documentType: 'guideline',
    relevantAgents: ['tmo', 'ocm', 'pmo'],
    countryCode: 'INTL',
    industry: 'all',
    standardName: 'Prosci ADKAR',
    tags: ['change management', 'adkar', 'transformation', 'prosci'],
    applicablePhases: ['planning', 'execution', 'monitoring'],
    category: 'playbook',
  },

  // ==================== PLANNING AGENT ====================
  {
    title: 'PMBOK 7th Edition Planning Guide',
    summary: 'Project Management Body of Knowledge planning principles',
    content: `# PMBOK 7th Edition Planning Guide

## Overview
PMBOK 7 focuses on principles and project performance domains.

## Planning Performance Domain
### Key Activities
1. **Scope Definition**
   - Define project objectives
   - Create WBS (Work Breakdown Structure)
   - Identify deliverables

2. **Schedule Development**
   - Sequence activities
   - Estimate durations
   - Identify critical path
   - Develop schedule baseline

3. **Resource Planning**
   - Identify resource requirements
   - Develop resource calendar
   - Plan resource acquisition

4. **Budget Estimation**
   - Estimate costs
   - Aggregate cost estimates
   - Establish cost baseline

5. **Risk Planning**
   - Identify risks
   - Assess probability and impact
   - Develop response strategies

6. **Quality Planning**
   - Define quality standards
   - Plan quality assurance
   - Plan quality control

7. **Stakeholder Planning**
   - Identify stakeholders
   - Analyze engagement needs
   - Plan communication

8. **Procurement Planning**
   - Make or buy decisions
   - Plan procurement strategy
   - Prepare procurement documents

## Planning Principles
- **Progressive Elaboration**: Refine plans iteratively
- **Rolling Wave**: Detail near-term, high-level long-term
- **Contingency**: Include buffers and reserves
- **Baseline Management**: Establish and control baselines`,
    documentType: 'guideline',
    relevantAgents: ['planning', 'pmo', 'governance'],
    countryCode: 'INTL',
    industry: 'all',
    standardName: 'PMBOK 7',
    tags: ['project management', 'planning', 'pmbok', 'pmi'],
    applicablePhases: ['planning'],
    category: 'pmbok',
  },
  {
    title: 'SAFe Program Increment Planning Guide',
    summary: 'Scaled Agile Framework for large-scale agile planning',
    content: `# SAFe Program Increment (PI) Planning Guide

## Overview
PI Planning is a cadence-based event for synchronizing multiple Agile teams.

## PI Planning Structure
### Pre-PI Planning
- Define business context
- Prepare product roadmap
- Identify capacity and velocity
- Plan logistics

### Day 1: Planning
#### Morning
- Business context presentation
- Product/solution vision
- Architecture vision and development practices

#### Afternoon
- Team breakouts (Draft plans)
- Management review and problem solving
- Draft plan reviews

### Day 2: Planning
#### Morning
- Planning adjustments
- Team breakouts (Finalize plans)

#### Afternoon
- Final plan reviews
- Program risks and impediments
- PI objectives vote of confidence
- Plan rework (if needed)
- Retrospective

### Post-PI Planning
- Finalize plans and objectives
- Publish to teams
- Track execution

## Outputs
1. **Committed PI Objectives**
2. **Program Board**: Visual of features and dependencies
3. **Program Risks**: ROAM (Resolved, Owned, Accepted, Mitigated)
4. **Confidence Vote**: Team vote on plan achievability

## Planning Agent Role
- Facilitate dependency identification
- Track critical path
- Monitor progress during PI execution
- Flag blockers and risks`,
    documentType: 'guideline',
    relevantAgents: ['planning', 'pmo', 'tmo'],
    countryCode: 'INTL',
    industry: 'technology',
    standardName: 'SAFe',
    tags: ['agile', 'safe', 'planning', 'pi planning'],
    applicablePhases: ['planning', 'execution'],
    category: 'safe',
  },

  // ==================== OKR AGENT ====================
  {
    title: 'Google OKR Playbook',
    summary: 'Objectives and Key Results framework for goal setting',
    content: `# Google OKR Playbook

## Overview
OKRs (Objectives and Key Results) align and track measurable goals.

## OKR Structure
### Objective
- **What**: Qualitative, inspirational goal
- **Characteristics**: Aspirational, actionable, memorable
- **Example**: "Become the market leader in cloud PMO tools"

### Key Results
- **How**: Quantitative, measurable outcomes
- **Characteristics**: Specific, time-bound, aggressive but realistic
- **Example**:
  - KR1: Increase user base from 10K to 50K
  - KR2: Achieve 90% customer satisfaction
  - KR3: Reduce churn rate from 5% to 2%

## OKR Principles
1. **Ambitious**: Stretch goals (70% completion is success)
2. **Aligned**: Cascade from company to team to individual
3. **Transparent**: Visible to entire organization
4. **Trackable**: Regular progress updates (weekly/monthly)
5. **Few**: 3-5 objectives per cycle

## OKR Cycle
### 1. Planning (Quarterly)
- Set company OKRs
- Cascade to departments
- Align team and individual OKRs

### 2. Tracking (Weekly/Monthly)
- Update progress (0.0 to 1.0 scale)
- Identify blockers
- Adjust tactics (not OKRs)

### 3. Review (Mid-Quarter & End)
- Mid-quarter check-in
- End-of-quarter scoring
- Retrospective

### 4. Reset (Quarterly)
- Review previous OKRs
- Set next quarter OKRs
- Incorporate learnings

## Scoring
- **0.0 - 0.3**: Red (needs attention)
- **0.4 - 0.6**: Yellow (making progress)
- **0.7 - 1.0**: Green (on track or achieved)

Note: 0.7 is considered success for stretch goals!`,
    documentType: 'guideline',
    relevantAgents: ['okr', 'pmo', 'vro'],
    countryCode: 'INTL',
    industry: 'technology',
    standardName: 'Google OKR',
    tags: ['okr', 'goals', 'performance', 'objectives'],
    applicablePhases: ['initiation', 'planning', 'execution', 'monitoring'],
    category: 'playbook',
  },
];

/**
 * Seed the database with regulatory documents
 */
export async function seedRegulatoryDocuments(): Promise<void> {
  console.log('[Seed] Starting regulatory documents seeding...');

  const kbRepo = getEnhancedKnowledgeBase(storage);

  let successCount = 0;
  let errorCount = 0;

  for (const doc of REGULATORY_DOCUMENTS) {
    try {
      await kbRepo.createArticle({
        ...doc,
        source: 'System (Regulatory Framework)',
        version: '1.0',
        isRegulatoryDoc: true,
        isPredocumented: true,
        status: 'published',
        metadata: {
          usageCount: 0,
          usedByAgents: {},
        },
      });

      successCount++;
      console.log(`[Seed] ✓ Created: ${doc.title}`);
    } catch (error: any) {
      errorCount++;
      console.error(`[Seed] ✗ Failed to create ${doc.title}:`, error.message);
    }
  }

  console.log(`\n[Seed] Completed!`);
  console.log(`[Seed] Successfully created: ${successCount} documents`);
  console.log(`[Seed] Errors: ${errorCount}`);
}

// Run if called directly
if (!(globalThis as any).__BUNDLED__ && import.meta.url === `file://${process.argv[1]}`) {
  seedRegulatoryDocuments()
    .then(() => {
      console.log('[Seed] Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Fatal error:', error);
      process.exit(1);
    });
}
