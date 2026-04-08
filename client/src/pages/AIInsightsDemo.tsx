/**
 * AI Insights Demo Page
 *
 * Showcases all AI insight integration features:
 * - Multi-agent collaboration panel
 * - AI conversations with reasoning/sources
 * - Real-time insight streaming
 * - Widget insight overlays
 * - Agent streaming widgets
 */

import { useState, useEffect } from 'react';
import {
  Grid,
  Col,
  Card,
  Title,
  Text,
  Flex,
  Badge,
} from '@tremor/react';
import {
  Sparkles,
  DollarSign,
  Shield,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Zap,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/shell/AppShell';

// AI Insights Components
import {
  AIConversation,
  MultiAgentPanel,
  PPM_AGENTS,
  WidgetWithInsights,
  useInsightStream,
  type ConversationMessage,
  type Agent,
  type AgentCollaboration,
} from '@/components/ai-insights';

// Tremor Widgets
import {
  TremorKPIGrid,
  TremorAreaChart,
  TremorInsightsFeed,
  TremorAgentStreamWidget,
  useAgentStream,
  type KPIData,
  type Insight,
} from '@/components/tremor-widgets';

// ============================================================================
// Sample Data
// ============================================================================

const sampleKPIs: KPIData[] = [
  {
    title: 'Portfolio Value',
    value: 45200000,
    prefix: '$',
    delta: 8.3,
    deltaType: 'increase',
    trend: [40, 42, 41, 44, 43, 45],
    status: 'success',
    icon: DollarSign,
  },
  {
    title: 'Risk Score',
    value: 28,
    suffix: '/100',
    delta: -12,
    deltaType: 'decrease',
    status: 'success',
    icon: Shield,
  },
  {
    title: 'On-Track Projects',
    value: '89%',
    delta: 3,
    deltaType: 'increase',
    status: 'success',
    icon: TrendingUp,
  },
  {
    title: 'Team Utilization',
    value: '92%',
    delta: -2,
    deltaType: 'moderateDecrease',
    status: 'warning',
    icon: Users,
  },
];

const sampleWidgetInsights: Insight[] = [
  {
    id: 'w1',
    title: 'Budget Anomaly Detected',
    description: 'Project Alpha spending 15% above forecast this month.',
    severity: 'warning',
    source: 'FinOps Agent',
    timestamp: '2 min ago',
    actions: [{ label: 'View Details' }, { label: 'Dismiss', variant: 'outline' }],
  },
  {
    id: 'w2',
    title: 'Resource Optimization',
    description: 'Team capacity underutilized by 8%. Consider reassignment.',
    severity: 'ai',
    source: 'Resource Agent',
    timestamp: '15 min ago',
  },
];

const sampleConversation: ConversationMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Analyze the Q4 budget performance across all portfolios.',
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    role: 'assistant',
    agent: {
      id: 'finops',
      name: 'FinOps Agent',
      role: 'Financial Analysis',
      icon: DollarSign,
      color: 'emerald',
    },
    content: (
      <div>
        <p className="mb-2">
          I've analyzed Q4 budget performance across all 12 portfolios. Here are the key findings:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>8 portfolios</strong> are on or under budget (67%)</li>
          <li><strong>3 portfolios</strong> are 5-10% over budget</li>
          <li><strong>1 portfolio</strong> (Digital Transformation) is 18% over budget</li>
        </ul>
        <p className="mt-2">
          Total variance: <strong>$2.3M over plan</strong> (4.2% of total budget)
        </p>
      </div>
    ),
    reasoning: `Analysis performed on 12 portfolios containing 147 active projects.
Data sources: Palantir Foundry financial tables, EVM calculations.
Variance calculation: Sum of (Actual - Planned) for Q4 period.
Identified Digital Transformation as outlier using z-score > 2.5.`,
    sources: [
      { id: '1', title: 'Palantir Financial DB', type: 'database', confidence: 98 },
      { id: '2', title: 'EVM Calculations', type: 'calculation', confidence: 95 },
    ],
    timestamp: '10:30 AM',
  },
  {
    id: '3',
    role: 'user',
    content: 'What\'s causing the Digital Transformation overspend?',
    timestamp: '10:32 AM',
  },
  {
    id: '4',
    role: 'assistant',
    agent: {
      id: 'finops',
      name: 'FinOps Agent',
      role: 'Financial Analysis',
      icon: DollarSign,
      color: 'emerald',
    },
    content: (
      <div>
        <p className="mb-2">The Digital Transformation portfolio overspend is driven by three factors:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            <strong>Scope expansion</strong> (+$890K): Cloud migration expanded to include legacy systems
          </li>
          <li>
            <strong>Contractor costs</strong> (+$420K): Extended engagement for specialized skills
          </li>
          <li>
            <strong>Infrastructure</strong> (+$380K): Unexpected licensing requirements
          </li>
        </ol>
        <p className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-amber-700 dark:text-amber-300 text-sm">
          ⚠️ <strong>Recommendation:</strong> Review scope with stakeholders before Q1 planning.
        </p>
      </div>
    ),
    toolCalls: [
      { id: 't1', name: 'query_cost_breakdown', input: { portfolio: 'digital-transformation' }, status: 'completed', duration: 234 },
      { id: 't2', name: 'analyze_variance_drivers', input: { threshold: 10 }, status: 'completed', duration: 456 },
    ],
    timestamp: '10:32 AM',
  },
];

// ============================================================================
// Multi-Agent Demo Section
// ============================================================================

function MultiAgentDemo() {
  const [collaboration, setCollaboration] = useState<AgentCollaboration | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const agents: Agent[] = [
    { ...PPM_AGENTS.finops, status: 'idle' },
    { ...PPM_AGENTS.risk, status: 'idle' },
    { ...PPM_AGENTS.schedule, status: 'idle' },
    { ...PPM_AGENTS.resource, status: 'idle' },
  ];

  const startCollaboration = async (agentIds: string[], prompt: string) => {
    setIsRunning(true);

    // Create collaboration
    const collab: AgentCollaboration = {
      id: 'collab-1',
      title: 'Portfolio Health Analysis',
      description: 'Multi-agent analysis of portfolio performance',
      agents: agents.filter(a => agentIds.includes(a.id)).map(a => ({
        ...a,
        status: 'thinking' as const,
      })),
      messages: [],
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    };
    setCollaboration(collab);

    // Simulate agents responding
    const agentResponses = [
      {
        delay: 1500,
        agent: PPM_AGENTS.finops,
        content: 'Financial health is stable. 92% of projects are within budget tolerance. Flagging 3 projects for budget review.',
      },
      {
        delay: 2500,
        agent: PPM_AGENTS.risk,
        content: 'Risk assessment complete. Overall portfolio risk score: 28/100 (Low). One high-risk item: Project Delta dependency on external vendor.',
      },
      {
        delay: 3500,
        agent: PPM_AGENTS.schedule,
        content: 'Schedule analysis shows 89% on-time delivery rate. Critical path alert: 2 projects have milestone conflicts in Q1.',
      },
    ];

    for (const response of agentResponses) {
      await new Promise(r => setTimeout(r, response.delay));
      setCollaboration(prev => ({
        ...prev!,
        messages: [
          ...prev!.messages,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant' as const,
            agent: { ...response.agent, status: 'active' as const } as any,
            content: response.content,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));
    }

    // Complete
    await new Promise(r => setTimeout(r, 1000));
    setCollaboration(prev => ({
      ...prev!,
      status: 'complete',
      completedAt: new Date().toISOString(),
      result: (
        <div className="space-y-2">
          <Flex alignItems="center" className="gap-2">
            <Badge color="emerald">Financial: Healthy</Badge>
            <Badge color="emerald">Risk: Low</Badge>
            <Badge color="amber">Schedule: 2 Alerts</Badge>
          </Flex>
          <Text className="text-sm">
            Portfolio is performing well overall with minor schedule attention needed.
          </Text>
        </div>
      ),
    }));
    setIsRunning(false);
  };

  return (
    <MultiAgentPanel
      collaboration={collaboration ?? undefined}
      availableAgents={agents}
      onStartCollaboration={startCollaboration}
      onSendMessage={(msg) => console.log('Message:', msg)}
    />
  );
}

// ============================================================================
// Agent Stream Demo
// ============================================================================

function AgentStreamDemo() {
  const { state, content, reasoning, startThinking, complete, reset } = useAgentStream();

  const runAnalysis = async () => {
    reset();
    startThinking('Running predictive analysis on portfolio data...');

    await new Promise(r => setTimeout(r, 2000));

    complete(
      <TremorAreaChart
        config={{
          title: 'AI-Generated Forecast',
          data: [
            { date: 'Jan', actual: 100, forecast: 100 },
            { date: 'Feb', actual: 105, forecast: 103 },
            { date: 'Mar', actual: 110, forecast: 108 },
            { date: 'Apr', actual: null as any, forecast: 115 },
            { date: 'May', actual: null as any, forecast: 122 },
            { date: 'Jun', actual: null as any, forecast: 128 },
          ],
          categories: ['actual', 'forecast'],
          index: 'date',
          colors: ['blue', 'violet'],
        }}
        height="sm"
      />,
      `Analyzed 147 projects across 12 portfolios using linear regression with seasonal adjustment.
Confidence interval: 85-95% based on historical accuracy.
Key drivers: Current velocity (0.8), Resource availability (0.9), Risk factors (0.7).`
    );
  };

  return (
    <TremorAgentStreamWidget
      title="Predictive Analytics"
      agent={{
        name: 'Analytics Agent',
        icon: TrendingUp,
        color: 'violet',
      }}
      state={state}
      onRefresh={runAnalysis}
      showReasoning
      reasoning={reasoning}
      timestamp="Just now"
    >
      {content}
    </TremorAgentStreamWidget>
  );
}

// ============================================================================
// Real-time Insights Demo
// ============================================================================

function RealTimeInsightsDemo() {
  const { insights, state, connect, disconnect, dismissInsight, clearInsights } =
    useInsightStream({
      maxInsights: 10,
    });

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  const feedInsights: Insight[] = insights.map(i => ({
    id: i.id,
    title: i.title,
    description: i.description,
    severity: i.severity,
    source: i.agentName || i.source,
    timestamp: i.timestamp,
  }));

  return (
    <Card className="p-0">
      <div className="px-4 py-3 border-b border-tremor-border">
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" className="gap-2">
            <Bell className="h-5 w-5 text-violet-500" />
            <Title className="text-base">Live Insight Stream</Title>
          </Flex>
          <Flex className="gap-2">
            <Badge
              color={state.connected ? 'emerald' : 'gray'}
              size="xs"
            >
              {state.connected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearInsights}>
              Clear
            </Button>
          </Flex>
        </Flex>
      </div>
      <div className="p-4">
        {feedInsights.length === 0 ? (
          <Text className="text-center text-tremor-content-subtle py-8">
            Waiting for insights... (auto-generated every ~5s)
          </Text>
        ) : (
          <TremorInsightsFeed
            title=""
            insights={feedInsights}
            maxItems={5}
          />
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// Widget with Insights Demo
// ============================================================================

function WidgetWithInsightsDemo() {
  return (
    <div className="space-y-4">
      <Text className="font-medium">Badge Placement</Text>
      <WidgetWithInsights
        insights={sampleWidgetInsights}
        insightPlacement="badge"
      >
        <Card className="p-4">
          <TremorKPIGrid kpis={sampleKPIs.slice(0, 2)} columns={2} />
        </Card>
      </WidgetWithInsights>

      <Text className="font-medium">Inline Placement</Text>
      <WidgetWithInsights
        insights={sampleWidgetInsights.slice(0, 1)}
        insightPlacement="inline"
      >
        <Card className="p-4">
          <TremorKPIGrid kpis={sampleKPIs.slice(2)} columns={2} />
        </Card>
      </WidgetWithInsights>
    </div>
  );
}

// ============================================================================
// Main Demo Page
// ============================================================================

export function AIInsightsDemo() {
  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <Flex alignItems="center" className="gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Sparkles className="h-6 w-6 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold">AI Insights Integration</h1>
          </Flex>
          <Text className="text-tremor-content-subtle">
            Demonstrates multi-agent collaboration, real-time insights, and widget integration
          </Text>
        </div>

        {/* AI Conversation */}
        <section>
          <Flex alignItems="center" className="gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-violet-500" />
            <Title>AI Conversation with Reasoning & Sources</Title>
          </Flex>
          <AIConversation
            title="Portfolio Analysis Chat"
            messages={sampleConversation}
            showInput
            inputPlaceholder="Ask about portfolio performance..."
            onSendMessage={(msg) => console.log('Send:', msg)}
            maxHeight="500px"
          />
        </section>

        {/* Two-column layout */}
        <Grid numItemsMd={2} className="gap-6">
          {/* Multi-Agent Panel */}
          <Col>
            <Flex alignItems="center" className="gap-2 mb-4">
              <Zap className="h-5 w-5 text-violet-500" />
              <Title>Multi-Agent Collaboration</Title>
            </Flex>
            <MultiAgentDemo />
          </Col>

          {/* Agent Stream Widget */}
          <Col>
            <Flex alignItems="center" className="gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              <Title>Agent-Generated Widget</Title>
            </Flex>
            <AgentStreamDemo />
          </Col>
        </Grid>

        {/* Real-time Insights */}
        <Grid numItemsMd={2} className="gap-6">
          <Col>
            <Flex alignItems="center" className="gap-2 mb-4">
              <Bell className="h-5 w-5 text-violet-500" />
              <Title>Real-time Insight Streaming</Title>
            </Flex>
            <RealTimeInsightsDemo />
          </Col>

          <Col>
            <Flex alignItems="center" className="gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <Title>Widget Insight Overlays</Title>
            </Flex>
            <WidgetWithInsightsDemo />
          </Col>
        </Grid>
      </div>
    </AppShell>
  );
}

export default AIInsightsDemo;
