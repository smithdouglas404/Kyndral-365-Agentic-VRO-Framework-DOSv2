import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TemplateConfig {
  id: string;
  name: string;
  bu: string;
  division: string;
  description: string;
  expectedROI: string;
  roiValue: number;
  priority: 'critical' | 'high' | 'medium';
  status: 'green' | 'amber' | 'red';
  budget: { spent: number; total: number };
  timeline: { elapsed: number; total: number; startDate: string; endDate: string };
  artName: string;
  portfolioTheme: string;
  strategicObjectives: string[];
  featureConfigs: FeatureConfig[];
  teamMembers: TeamMember[];
  riskConfigs: RiskConfig[];
  dependencyConfigs: DependencyConfig[];
  stakeholderConfigs: StakeholderConfig[];
}

interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  status: 'done' | 'in-progress' | 'planned';
  storyPoints: number;
  completedPoints: number;
  priority: 'critical' | 'high' | 'medium';
  storyConfigs: StoryConfig[];
}

interface StoryConfig {
  id: string;
  name: string;
  description: string;
  storyPoints: number;
  status: 'done' | 'in-progress' | 'planned' | 'pending';
  taskConfigs: TaskConfig[];
}

interface TaskConfig {
  id: string;
  name: string;
  status: 'done' | 'in-progress' | 'pending' | 'planned';
  effortHours: number;
  assignee: string;
  skills: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  allocation: number;
  team: string;
  skills: string[];
  costRate: number;
}

interface RiskConfig {
  id: string;
  name: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'monitoring' | 'mitigated';
  mitigation: string;
  owner: string;
}

interface DependencyConfig {
  id: string;
  name: string;
  type: 'internal' | 'external';
  status: 'resolved' | 'active' | 'blocked';
  description: string;
}

interface StakeholderConfig {
  id: string;
  name: string;
  role: string;
  department: string;
  influence: 'high' | 'medium' | 'low';
  interest: 'high' | 'medium' | 'low';
}

function generateAcceptanceCriteria(featureName: string, storyName: string): string[] {
  return [
    `Given ${storyName.toLowerCase()} is initiated, When processing completes, Then expected outcome is achieved`,
    `Given valid inputs are provided, When action is triggered, Then system responds within SLA`,
    `Given edge case occurs, When handled, Then graceful error handling is displayed`
  ];
}

function generateWSJF(priority: string): { businessValue: number; timeCriticality: number; riskReduction: number; jobSize: number; score: number } {
  const base = priority === 'critical' ? 21 : priority === 'high' ? 13 : 8;
  const bv = base;
  const tc = Math.round(base * 0.8);
  const rr = Math.round(base * 0.5);
  const js = Math.round(base * 0.6);
  return { businessValue: bv, timeCriticality: tc, riskReduction: rr, jobSize: js, score: Math.round(((bv + tc + rr) / js) * 100) / 100 };
}

function generateTemplate(config: TemplateConfig): object {
  const features = config.featureConfigs.map(fc => ({
    id: fc.id,
    name: fc.name,
    description: fc.description,
    status: fc.status,
    storyPoints: fc.storyPoints,
    completedPoints: fc.completedPoints,
    priority: fc.priority,
    wsjf: generateWSJF(fc.priority),
    acceptanceCriteria: generateAcceptanceCriteria(fc.name, fc.name),
    stories: fc.storyConfigs.map(sc => ({
      id: sc.id,
      name: sc.name,
      description: sc.description,
      storyPoints: sc.storyPoints,
      status: sc.status,
      acceptanceCriteria: [
        `Given ${sc.name.toLowerCase().split(' ').slice(0, 3).join(' ')}, When action completed, Then result is verified`,
        `Given valid configuration, When executed, Then expected behavior occurs`,
        `Given error condition, When detected, Then appropriate handling applied`
      ],
      tasks: sc.taskConfigs.map(tc => ({
        id: tc.id,
        name: tc.name,
        status: tc.status,
        effortHours: tc.effortHours,
        assignee: tc.assignee,
        skills: tc.skills
      }))
    }))
  }));

  const velocityBase = 35 + Math.floor(Math.random() * 15);
  const currentPI = Math.ceil(config.timeline.elapsed / 2.5);
  const totalPIs = Math.ceil(config.timeline.total / 2.5);

  return {
    id: config.id,
    name: config.name,
    bu: config.bu,
    division: config.division,
    description: config.description,
    expectedROI: config.expectedROI,
    roiValue: config.roiValue,
    priority: config.priority,
    status: config.status,
    budget: { ...config.budget, unit: '$m', contingency: Math.round(config.budget.total * 0.1 * 10) / 10, forecastAtCompletion: Math.round((config.budget.spent + (config.budget.total - config.budget.spent) * 0.95) * 10) / 10 },
    timeline: { ...config.timeline, unit: 'months' },
    artName: config.artName,
    portfolioTheme: config.portfolioTheme,
    strategicObjectives: config.strategicObjectives,
    safe: {
      velocity: velocityBase,
      predictability: 75 + Math.floor(Math.random() * 15),
      flowEfficiency: 65 + Math.floor(Math.random() * 15),
      currentPI: `PI 24.${currentPI}`,
      totalPIs: totalPIs,
      piCadence: '10 weeks',
      epicId: `EPIC-${config.bu.substring(0, 3).toUpperCase()}-${config.id.split('-').pop()}`,
      epicName: config.name,
      epicProgress: Math.round((config.timeline.elapsed / config.timeline.total) * 100),
      epicWsjf: generateWSJF(config.priority),
      solutionTrain: `${config.division} Technology`,
      valueStream: config.portfolioTheme
    },
    features,
    resources: config.teamMembers.map(tm => ({
      id: tm.id,
      name: tm.name,
      role: tm.role,
      allocation: tm.allocation,
      team: tm.team,
      skills: tm.skills,
      costRate: tm.costRate
    })),
    milestones: [
      { id: `ms-${config.id}-1`, name: 'Phase 1 Complete', date: config.timeline.startDate, status: 'completed', deliverables: ['Initial setup', 'Core infrastructure'] },
      { id: `ms-${config.id}-2`, name: 'MVP Launch', date: new Date(new Date(config.timeline.startDate).getTime() + (config.timeline.total * 0.5 * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], status: config.status === 'green' ? 'in-progress' : 'planned', deliverables: ['Core features', 'User testing'] },
      { id: `ms-${config.id}-3`, name: 'Full Launch', date: config.timeline.endDate, status: 'planned', deliverables: ['All features complete', 'Training delivered'] }
    ],
    risks: config.riskConfigs.map(rc => ({
      id: rc.id,
      name: rc.name,
      probability: rc.probability,
      impact: rc.impact,
      status: rc.status,
      mitigation: rc.mitigation,
      owner: rc.owner
    })),
    dependencies: config.dependencyConfigs.map(dc => ({
      id: dc.id,
      name: dc.name,
      type: dc.type,
      status: dc.status,
      description: dc.description
    })),
    stakeholders: config.stakeholderConfigs.map(sc => ({
      id: sc.id,
      name: sc.name,
      role: sc.role,
      department: sc.department,
      influence: sc.influence,
      interest: sc.interest
    })),
    iterations: [
      { id: `iter-${config.id}-1`, name: `PI 24.${currentPI} - Iteration 1`, startDate: '2024-10-14', endDate: '2024-10-25', capacity: 100, committed: 95, completed: 92, velocity: 92 },
      { id: `iter-${config.id}-2`, name: `PI 24.${currentPI} - Iteration 2`, startDate: '2024-10-28', endDate: '2024-11-08', capacity: 100, committed: 98, completed: 95, velocity: 95 },
      { id: `iter-${config.id}-3`, name: `PI 24.${currentPI} - Iteration 3`, startDate: '2024-11-11', endDate: '2024-11-22', capacity: 100, committed: 100, completed: 0, velocity: null }
    ],
    financials: {
      capitalex: Math.round(config.budget.total * 0.75 * 10) / 10,
      opex: Math.round(config.budget.total * 0.25 * 10) / 10,
      contingency: Math.round(config.budget.total * 0.1 * 10) / 10,
      npv: Math.round(config.roiValue * 0.8 * 10) / 10,
      irr: 35 + Math.floor(Math.random() * 20),
      paybackMonths: Math.round(config.timeline.total * 1.2),
      costBreakdown: {
        development: Math.round(config.budget.total * 0.5 * 10) / 10,
        infrastructure: Math.round(config.budget.total * 0.2 * 10) / 10,
        licensing: Math.round(config.budget.total * 0.15 * 10) / 10,
        contingency: Math.round(config.budget.total * 0.1 * 10) / 10
      }
    },
    qualityMetrics: {
      defectDensity: Math.round((0.4 + Math.random() * 0.4) * 10) / 10,
      testCoverage: 80 + Math.floor(Math.random() * 12),
      technicalDebtDays: 6 + Math.floor(Math.random() * 8),
      codeReviewCoverage: 100,
      documentationScore: 78 + Math.floor(Math.random() * 12)
    },
    currentPI: currentPI,
    totalPIs: totalPIs,
    velocity: velocityBase,
    burndownHealth: 75 + Math.floor(Math.random() * 15),
    qualityScore: 80 + Math.floor(Math.random() * 12)
  };
}

const templateConfigs: TemplateConfig[] = [
  {
    id: 'pmo-rt-002',
    name: 'AI Chatbot Implementation',
    bu: 'Retail',
    division: 'Retail',
    description: 'Enterprise AI chatbot powered by large language models for customer service automation across web, mobile, and voice channels. Handles policy queries, claims status, and account management with 85% resolution rate target.',
    expectedROI: '$12m cost savings through automation',
    roiValue: 12,
    priority: 'high',
    status: 'green',
    budget: { spent: 0.4, total: 0.7 },
    timeline: { elapsed: 3, total: 6, startDate: '2024-07-01', endDate: '2025-01-01' },
    artName: 'Customer Experience ART',
    portfolioTheme: 'AI Enablement',
    strategicObjectives: ['SO-6: Digital Transformation', 'SO-3: Operational Excellence', 'SO-4: Client Trust'],
    featureConfigs: [
      {
        id: 'feat-501',
        name: 'Natural Language Understanding',
        description: 'Core NLU engine for intent recognition, entity extraction, and context management across customer queries.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          {
            id: 'story-50001',
            name: 'Intent Classification Model',
            description: 'As a Customer, I need the chatbot to understand my question so that I get relevant responses.',
            storyPoints: 21,
            status: 'done',
            taskConfigs: [
              { id: 'task-500001', name: 'Train intent classifier on 50k labeled queries', status: 'done', effortHours: 32, assignee: 'Priya Sharma', skills: ['NLP', 'PyTorch'] },
              { id: 'task-500002', name: 'Build entity extraction pipeline', status: 'done', effortHours: 24, assignee: 'Priya Sharma', skills: ['NER', 'spaCy'] },
              { id: 'task-500003', name: 'Implement context management', status: 'done', effortHours: 16, assignee: 'James Wong', skills: ['Python', 'Redis'] },
              { id: 'task-500004', name: 'Deploy model to inference API', status: 'done', effortHours: 12, assignee: 'James Wong', skills: ['FastAPI', 'Docker'] }
            ]
          },
          {
            id: 'story-50002',
            name: 'LLM Response Generation',
            description: 'As a Customer, I need natural conversational responses so that interactions feel human-like.',
            storyPoints: 21,
            status: 'done',
            taskConfigs: [
              { id: 'task-500005', name: 'Fine-tune LLM on L&G tone and policies', status: 'done', effortHours: 40, assignee: 'Priya Sharma', skills: ['LLM', 'Fine-tuning'] },
              { id: 'task-500006', name: 'Build response generation pipeline', status: 'done', effortHours: 24, assignee: 'Priya Sharma', skills: ['LangChain', 'Python'] },
              { id: 'task-500007', name: 'Implement guardrails and safety filters', status: 'done', effortHours: 16, assignee: 'James Wong', skills: ['AI Safety', 'Moderation'] },
              { id: 'task-500008', name: 'Create response quality monitoring', status: 'done', effortHours: 12, assignee: 'Sarah Kim', skills: ['Analytics', 'Dashboards'] }
            ]
          },
          {
            id: 'story-50003',
            name: 'Multi-turn Conversation Management',
            description: 'As a Customer, I need the chatbot to remember context so that I do not have to repeat myself.',
            storyPoints: 13,
            status: 'done',
            taskConfigs: [
              { id: 'task-500009', name: 'Build conversation state manager', status: 'done', effortHours: 20, assignee: 'James Wong', skills: ['State Management', 'Redis'] },
              { id: 'task-500010', name: 'Implement session persistence', status: 'done', effortHours: 12, assignee: 'James Wong', skills: ['Backend', 'PostgreSQL'] },
              { id: 'task-500011', name: 'Create handoff to human agent', status: 'done', effortHours: 16, assignee: 'Sarah Kim', skills: ['Integration', 'Contact Center'] }
            ]
          }
        ]
      },
      {
        id: 'feat-502',
        name: 'Channel Integration',
        description: 'Deploy chatbot across web widget, mobile app, and IVR voice channel with consistent experience.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          {
            id: 'story-50004',
            name: 'Web Widget Deployment',
            description: 'As a Website Visitor, I need a chat widget so that I can get help without leaving the page.',
            storyPoints: 13,
            status: 'done',
            taskConfigs: [
              { id: 'task-500012', name: 'Build React chat widget component', status: 'done', effortHours: 24, assignee: 'Sarah Kim', skills: ['React', 'TypeScript'] },
              { id: 'task-500013', name: 'Implement WebSocket connection', status: 'done', effortHours: 12, assignee: 'James Wong', skills: ['WebSocket', 'Real-time'] },
              { id: 'task-500014', name: 'Create widget customization options', status: 'done', effortHours: 8, assignee: 'Sarah Kim', skills: ['CSS', 'Theming'] }
            ]
          },
          {
            id: 'story-50005',
            name: 'Mobile App Integration',
            description: 'As a Mobile User, I need in-app chat so that I can get help from my phone.',
            storyPoints: 13,
            status: 'in-progress',
            taskConfigs: [
              { id: 'task-500015', name: 'Build iOS chat SDK', status: 'done', effortHours: 20, assignee: 'Mobile Team', skills: ['Swift', 'iOS'] },
              { id: 'task-500016', name: 'Build Android chat SDK', status: 'in-progress', effortHours: 20, assignee: 'Mobile Team', skills: ['Kotlin', 'Android'] },
              { id: 'task-500017', name: 'Implement push notification triggers', status: 'pending', effortHours: 12, assignee: 'James Wong', skills: ['Push Notifications'] }
            ]
          },
          {
            id: 'story-50006',
            name: 'Voice IVR Integration',
            description: 'As a Phone Caller, I need voice-enabled AI so that I can speak naturally instead of pressing buttons.',
            storyPoints: 8,
            status: 'planned',
            taskConfigs: [
              { id: 'task-500018', name: 'Integrate speech-to-text engine', status: 'planned', effortHours: 16, assignee: 'Priya Sharma', skills: ['Speech Recognition', 'Whisper'] },
              { id: 'task-500019', name: 'Build text-to-speech output', status: 'planned', effortHours: 12, assignee: 'Priya Sharma', skills: ['TTS', 'Audio'] },
              { id: 'task-500020', name: 'Connect to existing IVR platform', status: 'planned', effortHours: 16, assignee: 'Integration Team', skills: ['Telephony', 'SIP'] }
            ]
          }
        ]
      },
      {
        id: 'feat-503',
        name: 'Knowledge Base Integration',
        description: 'Connect chatbot to policy documents, FAQs, and product information for accurate, up-to-date responses.',
        status: 'planned',
        storyPoints: 21,
        completedPoints: 0,
        priority: 'high',
        storyConfigs: [
          {
            id: 'story-50007',
            name: 'Document Ingestion Pipeline',
            description: 'As a Content Manager, I need automatic document ingestion so that the chatbot has current information.',
            storyPoints: 13,
            status: 'planned',
            taskConfigs: [
              { id: 'task-500021', name: 'Build PDF/Word document parser', status: 'planned', effortHours: 16, assignee: 'James Wong', skills: ['Document Processing', 'Python'] },
              { id: 'task-500022', name: 'Create vector embedding pipeline', status: 'planned', effortHours: 20, assignee: 'Priya Sharma', skills: ['Embeddings', 'Vector DB'] },
              { id: 'task-500023', name: 'Implement RAG retrieval system', status: 'planned', effortHours: 24, assignee: 'Priya Sharma', skills: ['RAG', 'LangChain'] }
            ]
          },
          {
            id: 'story-50008',
            name: 'Answer Accuracy Validation',
            description: 'As a Quality Manager, I need answer validation so that customers receive correct information.',
            storyPoints: 8,
            status: 'planned',
            taskConfigs: [
              { id: 'task-500024', name: 'Build answer verification pipeline', status: 'planned', effortHours: 16, assignee: 'Priya Sharma', skills: ['NLP', 'Fact Checking'] },
              { id: 'task-500025', name: 'Create accuracy monitoring dashboard', status: 'planned', effortHours: 12, assignee: 'Sarah Kim', skills: ['Dashboards', 'Analytics'] }
            ]
          }
        ]
      }
    ],
    teamMembers: [
      { id: 'res-501', name: 'Priya Sharma', role: 'Lead ML Engineer', allocation: 100, team: 'AI', skills: ['NLP', 'LLM', 'PyTorch'], costRate: 850 },
      { id: 'res-502', name: 'James Wong', role: 'Backend Developer', allocation: 100, team: 'Engineering', skills: ['Python', 'APIs', 'Redis'], costRate: 700 },
      { id: 'res-503', name: 'Sarah Kim', role: 'Frontend Developer', allocation: 80, team: 'Engineering', skills: ['React', 'TypeScript'], costRate: 650 }
    ],
    riskConfigs: [
      { id: 'risk-501', name: 'LLM hallucination risk', probability: 'medium', impact: 'high', status: 'active', mitigation: 'RAG grounding + fact verification + human escalation path', owner: 'Priya Sharma' },
      { id: 'risk-502', name: 'Customer adoption resistance', probability: 'medium', impact: 'medium', status: 'monitoring', mitigation: 'Gradual rollout with human backup; customer feedback loop', owner: 'Sarah Kim' },
      { id: 'risk-503', name: 'Data privacy concerns', probability: 'low', impact: 'critical', status: 'mitigated', mitigation: 'No PII logging; conversation encryption; GDPR review completed', owner: 'James Wong' }
    ],
    dependencyConfigs: [
      { id: 'dep-501', name: 'Azure OpenAI Access', type: 'external', status: 'resolved', description: 'Enterprise LLM API access for response generation' },
      { id: 'dep-502', name: 'Contact Center Integration', type: 'internal', status: 'active', description: 'Handoff capability to human agents' }
    ],
    stakeholderConfigs: [
      { id: 'sh-501', name: 'Michael Harris', role: 'Head of Customer Service', department: 'Operations', influence: 'high', interest: 'high' },
      { id: 'sh-502', name: 'Contact Center Team', role: 'Key Users', department: 'Operations', influence: 'medium', interest: 'high' }
    ]
  },
  {
    id: 'pmo-rt-001',
    name: 'Digital Onboarding Redesign',
    bu: 'Retail',
    division: 'Retail',
    description: 'Complete redesign of customer onboarding journey for protection and savings products with mobile-first UX, reduced friction, and real-time underwriting integration. Target: 40% improvement in completion rates.',
    expectedROI: '$28m revenue uplift through conversion improvement',
    roiValue: 28,
    priority: 'high',
    status: 'green',
    budget: { spent: 1.1, total: 1.8 },
    timeline: { elapsed: 6, total: 10, startDate: '2024-04-01', endDate: '2025-02-01' },
    artName: 'Customer Experience ART',
    portfolioTheme: 'Digital Excellence',
    strategicObjectives: ['SO-6: Digital Transformation', 'SO-4: Client Trust', 'SO-1: Market Leadership'],
    featureConfigs: [
      {
        id: 'feat-401',
        name: 'Mobile-First Application Form',
        description: 'Responsive, progressive application form optimized for mobile completion with smart defaults and inline validation.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          {
            id: 'story-40001',
            name: 'Progressive Form Architecture',
            description: 'As a Customer, I need a step-by-step form so that I am not overwhelmed by too many fields.',
            storyPoints: 21,
            status: 'done',
            taskConfigs: [
              { id: 'task-400001', name: 'Design multi-step form flow', status: 'done', effortHours: 16, assignee: 'Jessica Lee', skills: ['UX Design', 'Figma'] },
              { id: 'task-400002', name: 'Build form state management', status: 'done', effortHours: 20, assignee: 'Ryan Mitchell', skills: ['React', 'Redux'] },
              { id: 'task-400003', name: 'Implement progress saving', status: 'done', effortHours: 12, assignee: 'Ryan Mitchell', skills: ['Backend', 'APIs'] },
              { id: 'task-400004', name: 'Create inline validation', status: 'done', effortHours: 16, assignee: 'Ryan Mitchell', skills: ['React', 'Validation'] }
            ]
          },
          {
            id: 'story-40002',
            name: 'Smart Address Lookup',
            description: 'As a Customer, I need address auto-complete so that I can enter my address quickly and accurately.',
            storyPoints: 13,
            status: 'done',
            taskConfigs: [
              { id: 'task-400005', name: 'Integrate PostCode Anywhere API', status: 'done', effortHours: 12, assignee: 'Alex Turner', skills: ['APIs', 'Integration'] },
              { id: 'task-400006', name: 'Build address selection UI', status: 'done', effortHours: 8, assignee: 'Ryan Mitchell', skills: ['React', 'UX'] },
              { id: 'task-400007', name: 'Implement address verification', status: 'done', effortHours: 8, assignee: 'Alex Turner', skills: ['Data Validation'] }
            ]
          },
          {
            id: 'story-40003',
            name: 'Mobile Responsive Design',
            description: 'As a Mobile User, I need a form that works on my phone so that I can apply from anywhere.',
            storyPoints: 21,
            status: 'done',
            taskConfigs: [
              { id: 'task-400008', name: 'Create mobile-first CSS framework', status: 'done', effortHours: 20, assignee: 'Jessica Lee', skills: ['CSS', 'Responsive Design'] },
              { id: 'task-400009', name: 'Implement touch-friendly inputs', status: 'done', effortHours: 16, assignee: 'Ryan Mitchell', skills: ['Mobile UX', 'React'] },
              { id: 'task-400010', name: 'Optimize for slow connections', status: 'done', effortHours: 12, assignee: 'Alex Turner', skills: ['Performance', 'PWA'] },
              { id: 'task-400011', name: 'Test across device matrix', status: 'done', effortHours: 16, assignee: 'QA Team', skills: ['Testing', 'Mobile'] }
            ]
          }
        ]
      },
      {
        id: 'feat-402',
        name: 'Document Upload & Verification',
        description: 'Self-service document upload with AI-powered verification for ID, proof of address, and income documents.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          {
            id: 'story-40004',
            name: 'Document Capture UI',
            description: 'As a Customer, I need to upload documents from my phone so that I can complete verification easily.',
            storyPoints: 13,
            status: 'done',
            taskConfigs: [
              { id: 'task-400012', name: 'Build camera capture component', status: 'done', effortHours: 16, assignee: 'Ryan Mitchell', skills: ['React', 'Media APIs'] },
              { id: 'task-400013', name: 'Create document preview/crop', status: 'done', effortHours: 12, assignee: 'Ryan Mitchell', skills: ['Image Processing', 'Canvas'] },
              { id: 'task-400014', name: 'Implement secure upload', status: 'done', effortHours: 8, assignee: 'Alex Turner', skills: ['Security', 'S3'] }
            ]
          },
          {
            id: 'story-40005',
            name: 'AI Document Verification',
            description: 'As an Underwriter, I need automatic document verification so that processing is faster.',
            storyPoints: 21,
            status: 'in-progress',
            taskConfigs: [
              { id: 'task-400015', name: 'Integrate OCR for ID extraction', status: 'done', effortHours: 20, assignee: 'AI Team', skills: ['OCR', 'Azure Vision'] },
              { id: 'task-400016', name: 'Build fraud detection checks', status: 'in-progress', effortHours: 24, assignee: 'AI Team', skills: ['ML', 'Fraud Detection'] },
              { id: 'task-400017', name: 'Create human review queue', status: 'pending', effortHours: 16, assignee: 'Alex Turner', skills: ['Workflow', 'Backend'] },
              { id: 'task-400018', name: 'Implement verification audit trail', status: 'pending', effortHours: 8, assignee: 'Alex Turner', skills: ['Logging', 'Compliance'] }
            ]
          }
        ]
      },
      {
        id: 'feat-403',
        name: 'Real-time Underwriting Integration',
        description: 'Instant underwriting decisions for simple cases, with seamless escalation for complex applications.',
        status: 'planned',
        storyPoints: 34,
        completedPoints: 0,
        priority: 'high',
        storyConfigs: [
          {
            id: 'story-40006',
            name: 'Rules Engine Integration',
            description: 'As a Customer, I need instant decisions so that I know immediately if I am approved.',
            storyPoints: 21,
            status: 'planned',
            taskConfigs: [
              { id: 'task-400019', name: 'Connect to underwriting rules engine', status: 'planned', effortHours: 24, assignee: 'Integration Team', skills: ['APIs', 'Rules Engines'] },
              { id: 'task-400020', name: 'Build decision display UI', status: 'planned', effortHours: 16, assignee: 'Ryan Mitchell', skills: ['React', 'UX'] },
              { id: 'task-400021', name: 'Implement escalation workflow', status: 'planned', effortHours: 20, assignee: 'Alex Turner', skills: ['Workflow', 'Backend'] }
            ]
          },
          {
            id: 'story-40007',
            name: 'Quote Comparison Display',
            description: 'As a Customer, I need to see my quote options so that I can choose the right coverage.',
            storyPoints: 13,
            status: 'planned',
            taskConfigs: [
              { id: 'task-400022', name: 'Design quote comparison UI', status: 'planned', effortHours: 12, assignee: 'Jessica Lee', skills: ['UX Design'] },
              { id: 'task-400023', name: 'Build quote selection flow', status: 'planned', effortHours: 16, assignee: 'Ryan Mitchell', skills: ['React', 'State Management'] },
              { id: 'task-400024', name: 'Implement quote persistence', status: 'planned', effortHours: 8, assignee: 'Alex Turner', skills: ['Backend', 'Database'] }
            ]
          }
        ]
      }
    ],
    teamMembers: [
      { id: 'res-401', name: 'Jessica Lee', role: 'Lead UX Designer', allocation: 100, team: 'Design', skills: ['UX Design', 'Figma', 'User Research'], costRate: 700 },
      { id: 'res-402', name: 'Ryan Mitchell', role: 'Senior Frontend Developer', allocation: 100, team: 'Engineering', skills: ['React', 'TypeScript', 'Mobile'], costRate: 750 },
      { id: 'res-403', name: 'Alex Turner', role: 'Backend Developer', allocation: 80, team: 'Engineering', skills: ['Node.js', 'APIs', 'Integration'], costRate: 700 }
    ],
    riskConfigs: [
      { id: 'risk-401', name: 'Legacy system integration complexity', probability: 'high', impact: 'medium', status: 'active', mitigation: 'API adapter layer built; phased migration approach', owner: 'Alex Turner' },
      { id: 'risk-402', name: 'Conversion rate not improving', probability: 'medium', impact: 'high', status: 'monitoring', mitigation: 'A/B testing at each stage; analytics-driven optimization', owner: 'Jessica Lee' },
      { id: 'risk-403', name: 'Document fraud attempts', probability: 'medium', impact: 'high', status: 'active', mitigation: 'AI fraud detection + human review queue for edge cases', owner: 'AI Team' }
    ],
    dependencyConfigs: [
      { id: 'dep-401', name: 'Underwriting Rules Engine', type: 'internal', status: 'active', description: 'Real-time decision API for instant quotes' },
      { id: 'dep-402', name: 'PostCode Anywhere', type: 'external', status: 'resolved', description: 'Address lookup service' }
    ],
    stakeholderConfigs: [
      { id: 'sh-401', name: 'Sarah Thompson', role: 'Head of Digital', department: 'Retail', influence: 'high', interest: 'high' },
      { id: 'sh-402', name: 'Marketing Team', role: 'Key Stakeholders', department: 'Marketing', influence: 'medium', interest: 'high' }
    ]
  }
];

async function generateAllTemplates() {
  const outputDir = path.join(__dirname, '..', 'attached_assets', 'project_templates');
  
  for (const config of templateConfigs) {
    const template = generateTemplate(config);
    const filename = config.name.replace(/\s+/g, '_') + '.json';
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(template, null, 2));
    console.log(`Generated: ${filename}`);
  }
  
  console.log(`\nGenerated ${templateConfigs.length} templates`);
}

generateAllTemplates();
