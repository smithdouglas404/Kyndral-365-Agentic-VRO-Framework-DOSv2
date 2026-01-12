import { pmoProjects, vroPrograms, riskIssues, buPortfolios } from './buPrograms';

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

type EventSentiment = 'positive' | 'cautionary';

interface EventTemplate {
  type: SimulationEventType;
  priority: EventPriority;
  sentiment: EventSentiment;
  templates: { title: string; message: string; detail: string; source: string }[];
}

const POSITIVE_EVENTS: EventTemplate[] = [
  {
    type: 'opportunity',
    priority: 'medium',
    sentiment: 'positive',
    templates: [
      {
        title: 'Value Acceleration Opportunity',
        message: '{entity} positioned for 20% faster value realization',
        detail: 'Analysis shows favorable conditions for acceleration. Similar initiatives achieved breakthrough by reallocating resources during this phase. Window of opportunity: 3 weeks.',
        source: 'Value Optimization AI'
      },
      {
        title: 'Synergy Opportunity Identified',
        message: 'Potential £2.5m synergy identified with {entity}',
        detail: 'Cross-functional analysis reveals shared capabilities that could be leveraged. Collaboration between teams could unlock significant efficiency gains.',
        source: 'Synergy Detection'
      },
      {
        title: 'Cost Savings Detected',
        message: '{entity} showing potential for £1.8m operational savings',
        detail: 'AI analysis of vendor contracts and operational metrics indicates optimization opportunities. Quick wins available within current PI.',
        source: 'Cost Intelligence'
      }
    ]
  },
  {
    type: 'value_milestone',
    priority: 'low',
    sentiment: 'positive',
    templates: [
      {
        title: 'Value Milestone Achieved',
        message: '{entity} achieved £5m value milestone ahead of schedule',
        detail: 'Cumulative value realization has crossed significant threshold. ROI tracking shows 23% above initial projections. Success pattern captured for replication.',
        source: 'Value Tracking'
      },
      {
        title: 'Customer Satisfaction Improved',
        message: '{entity} NPS score increased by 12 points',
        detail: 'Customer feedback analysis shows significant improvement in satisfaction metrics. Key drivers: faster response times and improved service quality.',
        source: 'Customer Analytics'
      },
      {
        title: 'Efficiency Gains Realized',
        message: '{entity} delivered 15% process efficiency improvement',
        detail: 'Automation and process optimization have yielded measurable results. Team productivity metrics show sustained improvement over 6 weeks.',
        source: 'Performance Analytics'
      }
    ]
  },
  {
    type: 'prediction',
    priority: 'medium',
    sentiment: 'positive',
    templates: [
      {
        title: 'Positive Trajectory Forecast',
        message: '{entity} projected to exceed targets by Q4',
        detail: 'Based on current velocity and historical patterns, AI predicts successful delivery with 15% margin. Confidence interval: 85-92%. Key assumption: no major scope changes.',
        source: 'Predictive Analytics'
      },
      {
        title: 'Strong Performance Predicted',
        message: '{entity} on track for early completion',
        detail: 'Current momentum suggests delivery 2-3 weeks ahead of schedule. Team velocity stable at 118% of baseline. Recommend locking in gains.',
        source: 'Delivery Forecasting'
      }
    ]
  }
];

const CAUTIONARY_EVENTS: EventTemplate[] = [
  {
    type: 'ai_alert',
    priority: 'high',
    sentiment: 'cautionary',
    templates: [
      {
        title: 'Pattern Anomaly Detected',
        message: 'ML model detecting deviation in {entity} performance metrics',
        detail: 'Our AI has identified a pattern that warrants attention. Historical analysis suggests early intervention could prevent escalation. Confidence based on 847 similar patterns.',
        source: 'Pattern Recognition AI'
      },
      {
        title: 'Stakeholder Engagement Needed',
        message: 'Communication frequency declining for {entity}',
        detail: 'NLP analysis of recent communications suggests stakeholder engagement may need attention. Recommend proactive outreach to maintain alignment.',
        source: 'Sentiment Analysis Engine'
      }
    ]
  },
  {
    type: 'risk_warning',
    priority: 'high',
    sentiment: 'cautionary',
    templates: [
      {
        title: 'Risk Indicator Elevated',
        message: '{entity} risk score trending upward',
        detail: 'Predictive model indicates increasing risk exposure. Early warning triggered based on leading indicators. Proactive review recommended within 2 weeks.',
        source: 'Risk Prediction Model'
      },
      {
        title: 'External Factor Alert',
        message: 'Market conditions may impact {entity}',
        detail: 'AI monitoring external factors that could influence delivery. Regulatory changes and market shifts being tracked. Contingency planning advised.',
        source: 'External Risk Scanner'
      }
    ]
  },
  {
    type: 'prediction',
    priority: 'medium',
    sentiment: 'cautionary',
    templates: [
      {
        title: 'Resource Planning Alert',
        message: 'Capacity review suggested for {entity} in 6 weeks',
        detail: 'Workforce planning AI suggests reviewing resource allocation. Proactive planning can prevent bottlenecks and maintain momentum.',
        source: 'Capacity Planning AI'
      }
    ]
  },
  {
    type: 'safe_anomaly',
    priority: 'medium',
    sentiment: 'cautionary',
    templates: [
      {
        title: 'Velocity Trend Notice',
        message: '{entity} velocity showing slight variation from baseline',
        detail: 'SAFe metrics indicate minor delivery variation. May be temporary. Recommend monitoring during next sprint and addressing if trend continues.',
        source: 'SAFe Metrics Engine'
      },
      {
        title: 'Flow Review Suggested',
        message: '{entity} cycle time trending above target',
        detail: 'Work item flow showing minor delays. Root cause may be handoff coordination. Value stream review can identify quick improvements.',
        source: 'Flow Analytics'
      }
    ]
  },
  {
    type: 'action_required',
    priority: 'high',
    sentiment: 'cautionary',
    templates: [
      {
        title: 'Decision Point Approaching',
        message: 'Strategic decision needed for {entity}',
        detail: 'Key decision point on the horizon. Options analysis prepared. Timely decision will help maintain delivery timeline.',
        source: 'Decision Intelligence'
      }
    ]
  }
];

const EVENT_TEMPLATES: EventTemplate[] = [...POSITIVE_EVENTS, ...CAUTIONARY_EVENTS];

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
  const isPositive = Math.random() < 0.45;
  const eventPool = isPositive ? POSITIVE_EVENTS : CAUTIONARY_EVENTS;
  const eventCategory = getRandomItem(eventPool);
  const template = getRandomItem(eventCategory.templates);
  
  const roll = Math.random();
  let entity: { id: string; name: string; bu: string };
  let entityType: 'project' | 'program' | 'portfolio' | 'risk';
  
  if (roll < 0.4) {
    entity = getRandomItem(pmoProjects);
    entityType = 'project';
  } else if (roll < 0.7) {
    entity = getRandomItem(vroPrograms);
    entityType = 'program';
  } else if (roll < 0.85) {
    const portfolio = getRandomItem(buPortfolios);
    entity = { id: portfolio.id, name: portfolio.name, bu: portfolio.id };
    entityType = 'portfolio';
  } else {
    const risk = getRandomItem(riskIssues);
    entity = { id: risk.id, name: risk.name, bu: risk.category };
    entityType = 'risk';
  }
  
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
      type: entityType,
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
  private timeoutId: NodeJS.Timeout | null = null;
  private subscribers: ((event: SimulationEvent) => void)[] = [];
  private events: SimulationEvent[] = [];
  private isRunning = false;
  
  constructor() {
    // Seed with initial batch of events so users see activity immediately
    this.events = generateBatchEvents(3);
  }
  
  private getRandomInterval(): number {
    // Generate new events every 8-20 seconds for dynamic feel
    const minSeconds = 8;
    const maxSeconds = 20;
    const randomSeconds = Math.random() * (maxSeconds - minSeconds) + minSeconds;
    return Math.floor(randomSeconds * 1000);
  }
  
  private scheduleNextEvent(initialDelay?: number) {
    if (!this.isRunning) return;
    
    const delay = initialDelay ?? this.getRandomInterval();
    this.timeoutId = setTimeout(() => {
      // When we have 13+ events, drop oldest 3 to make room for continuous flow
      if (this.events.length >= 13) {
        this.events = this.events.slice(0, this.events.length - 3);
      }
      
      const newEvent = generateSimulationEvent();
      this.events.unshift(newEvent);
      this.notifySubscribers(newEvent);
      this.scheduleNextEvent();
    }, delay);
  }
  
  start(_intervalMs?: number) {
    if (this.isRunning) return;
    this.isRunning = true;
    // Start streaming new events after a short delay (5-10 seconds)
    const initialDelay = Math.floor(Math.random() * 5000) + 5000;
    this.scheduleNextEvent(initialDelay);
  }
  
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
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
  
  pushEvent(event: Partial<SimulationEvent> & { title: string; message: string }): SimulationEvent {
    const fullEvent: SimulationEvent = {
      id: `cascade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: event.type || 'action_required',
      priority: event.priority || 'high',
      timestamp: event.timestamp || new Date(),
      title: event.title,
      message: event.message,
      detail: event.detail || event.message,
      confidence: event.confidence || 95,
      source: event.source || 'Agent Cascade',
      relatedEntity: event.relatedEntity || { type: 'project', id: 'cascade-action', name: 'Agent Action', bu: 'VRO' },
      metrics: event.metrics || { impact: 'High', timeframe: 'Immediate' },
      actions: event.actions || [
        { id: 'view', label: 'View Details', type: 'investigate' as const },
        { id: 'ack', label: 'Acknowledge', type: 'mitigate' as const }
      ],
      citations: event.citations || [],
      read: false
    };
    
    if (this.events.length >= 13) {
      this.events = this.events.slice(0, this.events.length - 3);
    }
    
    this.events.unshift(fullEvent);
    this.notifySubscribers(fullEvent);
    return fullEvent;
  }
}

export const simulationEngine = new SimulationEngine();
