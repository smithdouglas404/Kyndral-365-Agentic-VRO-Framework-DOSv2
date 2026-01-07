import { pmoProjects, vroPrograms, riskIssues } from './buPrograms';

export type SimulationEventType = 
  | 'ai_alert' 
  | 'risk_warning' 
  | 'opportunity' 
  | 'prediction' 
  | 'safe_anomaly' 
  | 'value_milestone'
  | 'action_required';

export type EventPriority = 'critical' | 'high' | 'medium' | 'low';

export interface SimulationEvent {
  id: string;
  type: SimulationEventType;
  priority: EventPriority;
  timestamp: Date;
  title: string;
  message: string;
  detail: string;
  confidence: number;
  source: string;
  relatedEntity?: {
    type: 'project' | 'program' | 'portfolio' | 'risk';
    id: string;
    name: string;
    bu: string;
  };
  metrics?: {
    impact: string;
    timeframe: string;
    value?: string;
  };
  actions?: {
    id: string;
    label: string;
    type: 'mitigate' | 'accelerate' | 'investigate' | 'escalate';
  }[];
  citations?: string[];
  read: boolean;
}

const EVENT_TEMPLATES: {
  type: SimulationEventType;
  priority: EventPriority;
  templates: { title: string; message: string; detail: string; source: string }[];
}[] = [
  {
    type: 'ai_alert',
    priority: 'high',
    templates: [
      {
        title: 'Pattern Detected',
        message: 'ML model detecting anomaly in {entity} performance metrics',
        detail: 'Our AI has identified a deviation from expected patterns. Historical analysis suggests intervention within 48 hours could prevent escalation. Confidence based on 847 similar patterns across the portfolio.',
        source: 'Pattern Recognition AI'
      },
      {
        title: 'Sentiment Shift',
        message: 'Stakeholder sentiment declining 15% for {entity}',
        detail: 'NLP analysis of recent communications shows increasing concern. Key themes: timeline uncertainty, resource constraints. Recommend proactive stakeholder engagement.',
        source: 'Sentiment Analysis Engine'
      },
      {
        title: 'Cross-Portfolio Correlation',
        message: '{entity} showing correlation with 3 other initiatives',
        detail: 'Dependency mapping reveals shared resources and timeline conflicts. AI recommends portfolio-level review to optimize sequencing and prevent bottlenecks.',
        source: 'Portfolio Intelligence'
      }
    ]
  },
  {
    type: 'risk_warning',
    priority: 'critical',
    templates: [
      {
        title: 'Risk Threshold Breach',
        message: '{entity} approaching critical risk threshold',
        detail: 'Predictive model indicates 78% probability of risk materialization within 2 weeks. Early warning triggered based on leading indicators. Immediate review recommended.',
        source: 'Risk Prediction Model'
      },
      {
        title: 'Emerging Risk',
        message: 'New risk vector detected for {entity}',
        detail: 'AI has identified a previously untracked risk factor from external data sources. Market conditions and regulatory changes contributing to elevated exposure.',
        source: 'External Risk Scanner'
      }
    ]
  },
  {
    type: 'opportunity',
    priority: 'medium',
    templates: [
      {
        title: 'Value Acceleration',
        message: '{entity} positioned for 20% faster value realization',
        detail: 'Analysis shows favorable conditions for acceleration. Similar initiatives achieved breakthrough by reallocating resources during this phase. Window of opportunity: 3 weeks.',
        source: 'Value Optimization AI'
      },
      {
        title: 'Synergy Opportunity',
        message: 'Potential £2.5m synergy identified with {entity}',
        detail: 'Cross-functional analysis reveals shared capabilities that could be leveraged. Collaboration between teams could unlock significant efficiency gains.',
        source: 'Synergy Detection'
      },
      {
        title: 'Market Advantage',
        message: 'First-mover opportunity for {entity}',
        detail: 'Competitive analysis shows gap in market. Accelerating delivery could capture significant market share before competitors respond.',
        source: 'Market Intelligence'
      }
    ]
  },
  {
    type: 'prediction',
    priority: 'medium',
    templates: [
      {
        title: 'Trajectory Forecast',
        message: '{entity} projected to exceed targets by Q4',
        detail: 'Based on current velocity and historical patterns, AI predicts successful delivery with 15% margin. Confidence interval: 85-92%. Key assumption: no major scope changes.',
        source: 'Predictive Analytics'
      },
      {
        title: 'Resource Prediction',
        message: 'Resource constraint predicted for {entity} in 6 weeks',
        detail: 'Workforce planning AI detects upcoming capacity gap. Proactive resource acquisition or scope adjustment recommended to maintain momentum.',
        source: 'Capacity Planning AI'
      }
    ]
  },
  {
    type: 'safe_anomaly',
    priority: 'high',
    templates: [
      {
        title: 'Velocity Deviation',
        message: '{entity} velocity dropped 18% from baseline',
        detail: 'SAFe metrics indicate delivery slowdown. Root cause analysis suggests impediment accumulation. PI planning review recommended.',
        source: 'SAFe Metrics Engine'
      },
      {
        title: 'Flow Efficiency Alert',
        message: '{entity} flow efficiency below PI target',
        detail: 'Work item cycle time increasing. Bottleneck analysis points to handoff delays between teams. Value stream mapping recommended.',
        source: 'Flow Analytics'
      }
    ]
  },
  {
    type: 'value_milestone',
    priority: 'low',
    templates: [
      {
        title: 'Value Realized',
        message: '{entity} achieved £5m value milestone',
        detail: 'Cumulative value realization has crossed significant threshold. ROI tracking shows 23% above initial projections. Success pattern captured for replication.',
        source: 'Value Tracking'
      }
    ]
  },
  {
    type: 'action_required',
    priority: 'critical',
    templates: [
      {
        title: 'Decision Required',
        message: 'Executive decision needed for {entity}',
        detail: 'Critical path decision point reached. Options analysis complete. Delay beyond 48 hours impacts delivery timeline. Stakeholder alignment session recommended.',
        source: 'Decision Intelligence'
      },
      {
        title: 'Escalation Triggered',
        message: 'Automated escalation for {entity}',
        detail: 'Issue has exceeded resolution timeframe. AI has compiled briefing for leadership review. Escalation matrix activated per governance framework.',
        source: 'Escalation Engine'
      }
    ]
  }
];

const ACTIONS_BY_TYPE: Record<SimulationEventType, { id: string; label: string; type: 'mitigate' | 'accelerate' | 'investigate' | 'escalate' }[]> = {
  ai_alert: [
    { id: 'investigate', label: 'Investigate Pattern', type: 'investigate' },
    { id: 'mitigate', label: 'Apply Mitigation', type: 'mitigate' }
  ],
  risk_warning: [
    { id: 'escalate', label: 'Escalate to Leadership', type: 'escalate' },
    { id: 'mitigate', label: 'Implement Controls', type: 'mitigate' }
  ],
  opportunity: [
    { id: 'accelerate', label: 'Accelerate Initiative', type: 'accelerate' },
    { id: 'investigate', label: 'Assess Feasibility', type: 'investigate' }
  ],
  prediction: [
    { id: 'investigate', label: 'Review Forecast', type: 'investigate' },
    { id: 'accelerate', label: 'Lock In Advantage', type: 'accelerate' }
  ],
  safe_anomaly: [
    { id: 'investigate', label: 'Root Cause Analysis', type: 'investigate' },
    { id: 'mitigate', label: 'Remove Impediments', type: 'mitigate' }
  ],
  value_milestone: [
    { id: 'accelerate', label: 'Capture Learnings', type: 'accelerate' }
  ],
  action_required: [
    { id: 'escalate', label: 'Schedule Review', type: 'escalate' },
    { id: 'investigate', label: 'Gather Context', type: 'investigate' }
  ]
};

const CITATIONS = [
  'L&G Annual Report 2024, p.42',
  'Climate & Nature Report 2024, p.18',
  'Risk Management Supplement 2024, p.8',
  'L&G Annual Report 2024, p.67',
  'SAFe 6.0 Framework, Flow Metrics',
  'Portfolio Analytics Dashboard',
  'Real-time Monitoring System'
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSimulationEvent(): SimulationEvent {
  const eventCategory = getRandomItem(EVENT_TEMPLATES);
  const template = getRandomItem(eventCategory.templates);
  
  const useProject = Math.random() > 0.5;
  const entity = useProject 
    ? getRandomItem(pmoProjects) 
    : getRandomItem(vroPrograms);
  
  const message = template.message.replace('{entity}', entity.name);
  
  const impactValues = ['£2.5m savings', '15% efficiency gain', '3-week acceleration', '£8m risk mitigation', '12% ROI improvement'];
  const timeframes = ['immediate', 'this week', 'next 2 weeks', 'this PI', 'Q4 2024'];
  
  return {
    id: generateEventId(),
    type: eventCategory.type,
    priority: eventCategory.priority,
    timestamp: new Date(),
    title: template.title,
    message,
    detail: template.detail,
    confidence: Math.floor(Math.random() * 20) + 75,
    source: template.source,
    relatedEntity: {
      type: useProject ? 'project' : 'program',
      id: entity.id,
      name: entity.name,
      bu: entity.bu
    },
    metrics: {
      impact: getRandomItem(impactValues),
      timeframe: getRandomItem(timeframes),
      value: Math.random() > 0.5 ? `£${(Math.random() * 10 + 1).toFixed(1)}m` : undefined
    },
    actions: ACTIONS_BY_TYPE[eventCategory.type],
    citations: [getRandomItem(CITATIONS), getRandomItem(CITATIONS)],
    read: false
  };
}

export function generateBatchEvents(count: number): SimulationEvent[] {
  return Array.from({ length: count }, () => generateSimulationEvent());
}

export class SimulationEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private subscribers: ((event: SimulationEvent) => void)[] = [];
  private events: SimulationEvent[] = [];
  private isRunning = false;
  
  constructor() {
    this.events = generateBatchEvents(5);
  }
  
  start(intervalMs: number = 4000) {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.intervalId = setInterval(() => {
      const newEvent = generateSimulationEvent();
      this.events.unshift(newEvent);
      if (this.events.length > 50) {
        this.events = this.events.slice(0, 50);
      }
      this.notifySubscribers(newEvent);
    }, intervalMs);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }
  
  subscribe(callback: (event: SimulationEvent) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  private notifySubscribers(event: SimulationEvent) {
    this.subscribers.forEach(cb => cb(event));
  }
  
  getEvents(): SimulationEvent[] {
    return this.events;
  }
  
  getUnreadCount(): number {
    return this.events.filter(e => !e.read).length;
  }
  
  markAsRead(eventId: string) {
    const event = this.events.find(e => e.id === eventId);
    if (event) event.read = true;
  }
  
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const simulationEngine = new SimulationEngine();
