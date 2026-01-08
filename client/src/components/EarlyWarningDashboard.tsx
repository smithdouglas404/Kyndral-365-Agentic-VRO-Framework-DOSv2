import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, GitBranch, Bug, Rocket, MessageSquare, 
  Users, TrendingUp, TrendingDown, Activity, Clock,
  CheckCircle2, XCircle, Minus, BarChart3, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface KanbanMetrics {
  team: string;
  wip: number;
  wipLimit: number;
  throughput: number;
  avgCycleTime: number;
  blockedItems: number;
  trend: 'up' | 'down' | 'stable';
}

interface DeploymentStatus {
  environment: string;
  lastDeployment: string;
  status: 'success' | 'failed' | 'pending';
  version: string;
  healthScore: number;
}

interface HuddleInsight {
  team: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyTopics: string[];
  blockers: number;
  actionItems: number;
}

interface SentimentData {
  source: string;
  sentiment: number;
  trend: 'improving' | 'declining' | 'stable';
  keywords: string[];
  riskIndicator: boolean;
}

const KANBAN_METRICS: KanbanMetrics[] = [
  { team: 'Digital Claims', wip: 12, wipLimit: 15, throughput: 24, avgCycleTime: 4.2, blockedItems: 2, trend: 'up' },
  { team: 'Pensions Platform', wip: 18, wipLimit: 16, throughput: 18, avgCycleTime: 6.8, blockedItems: 4, trend: 'down' },
  { team: 'Customer Portal', wip: 8, wipLimit: 12, throughput: 32, avgCycleTime: 2.1, blockedItems: 0, trend: 'up' },
  { team: 'Data Analytics', wip: 14, wipLimit: 14, throughput: 15, avgCycleTime: 5.5, blockedItems: 1, trend: 'stable' },
  { team: 'Mobile App', wip: 6, wipLimit: 10, throughput: 28, avgCycleTime: 3.2, blockedItems: 1, trend: 'up' }
];

const DEPLOYMENT_STATUS: DeploymentStatus[] = [
  { environment: 'Development', lastDeployment: '2 hours ago', status: 'success', version: 'v2.4.1-dev', healthScore: 98 },
  { environment: 'QA/Test', lastDeployment: '6 hours ago', status: 'success', version: 'v2.4.0', healthScore: 95 },
  { environment: 'Staging', lastDeployment: '1 day ago', status: 'pending', version: 'v2.3.8', healthScore: 92 },
  { environment: 'Production', lastDeployment: '3 days ago', status: 'success', version: 'v2.3.7', healthScore: 99 }
];

const HUDDLE_INSIGHTS: HuddleInsight[] = [
  { team: 'Digital Claims', date: 'Today 09:15', sentiment: 'positive', keyTopics: ['Sprint progress', 'API integration complete'], blockers: 0, actionItems: 3 },
  { team: 'Pensions Platform', date: 'Today 09:30', sentiment: 'negative', keyTopics: ['Resource constraints', 'Vendor delays'], blockers: 3, actionItems: 5 },
  { team: 'Customer Portal', date: 'Today 10:00', sentiment: 'positive', keyTopics: ['Release ready', 'Performance improvements'], blockers: 0, actionItems: 2 },
  { team: 'Data Analytics', date: 'Yesterday 09:15', sentiment: 'neutral', keyTopics: ['Data migration', 'Testing in progress'], blockers: 1, actionItems: 4 }
];

const SENTIMENT_DATA: SentimentData[] = [
  { source: 'Team Channels', sentiment: 72, trend: 'improving', keywords: ['progress', 'milestone', 'delivered'], riskIndicator: false },
  { source: 'Project Updates', sentiment: 65, trend: 'stable', keywords: ['on track', 'dependencies', 'review'], riskIndicator: false },
  { source: 'Stakeholder Comms', sentiment: 58, trend: 'declining', keywords: ['concerns', 'timeline', 'budget'], riskIndicator: true },
  { source: 'Leadership Briefs', sentiment: 78, trend: 'improving', keywords: ['strategic', 'value', 'alignment'], riskIndicator: false }
];

const BUG_METRICS = {
  critical: 2,
  high: 8,
  medium: 23,
  low: 45,
  resolved7Days: 34,
  avgResolutionTime: '2.3 days'
};

export function EarlyWarningDashboard() {
  const [liveMetrics, setLiveMetrics] = useState(KANBAN_METRICS);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => prev.map(m => ({
        ...m,
        throughput: m.throughput + Math.floor(Math.random() * 3) - 1,
        wip: Math.max(1, m.wip + Math.floor(Math.random() * 3) - 1)
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={14} className="text-green-600" />;
      case 'down': return <TrendingDown size={14} className="text-red-600" />;
      default: return <Minus size={14} className="text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={16} className="text-green-600" />;
      case 'failed': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-amber-500" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 70) return 'text-green-600';
    if (sentiment >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleTeamClick = (team: KanbanMetrics) => {
    toast.info(`${team.team} Details`, {
      description: `WIP: ${team.wip}/${team.wipLimit}, Throughput: ${team.throughput} items/week, Cycle Time: ${team.avgCycleTime} days`
    });
  };

  const handleDeploymentClick = (env: DeploymentStatus) => {
    toast.info(`${env.environment} Deployment`, {
      description: `Version: ${env.version}, Last deployed: ${env.lastDeployment}, Health: ${env.healthScore}%`
    });
  };

  const handleHuddleClick = (huddle: HuddleInsight) => {
    toast.info(`${huddle.team} Huddle Summary`, {
      description: `Topics: ${huddle.keyTopics.join(', ')}. ${huddle.blockers} blockers, ${huddle.actionItems} action items.`
    });
  };

  const handleSentimentClick = (source: SentimentData) => {
    toast.info(`${source.source} Sentiment`, {
      description: `Score: ${source.sentiment}%, Trend: ${source.trend}. Keywords: ${source.keywords.join(', ')}`
    });
  };

  const handleBugMetricClick = (severity: string, count: number) => {
    toast.info(`${severity} Priority Bugs`, {
      description: `${count} ${severity.toLowerCase()} priority bugs currently open. Click to view in bug tracker.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="text-amber-500" />
            Early Warning Indicators
          </h2>
          <p className="text-muted-foreground">Real-time monitoring of delivery health signals</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity size={12} className="text-green-500 animate-pulse" />
          Live Monitoring
        </Badge>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2">
            <BarChart3 size={16} />
            Kanban & Throughput
          </TabsTrigger>
          <TabsTrigger value="deployments" className="gap-2">
            <Rocket size={16} />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="huddles" className="gap-2">
            <Users size={16} />
            Huddles & Status
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="gap-2">
            <MessageSquare size={16} />
            Sentiment Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveMetrics.map((team) => (
              <motion.div key={team.team} layout>
                <Card 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${team.wip > team.wipLimit ? 'border-red-300 bg-red-50' : ''}`}
                  onClick={() => handleTeamClick(team)}
                  data-testid={`card-team-${team.team.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{team.team}</h3>
                      {getTrendIcon(team.trend)}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">WIP</span>
                          <span className={team.wip > team.wipLimit ? 'text-red-600 font-bold' : ''}>
                            {team.wip} / {team.wipLimit}
                          </span>
                        </div>
                        <Progress 
                          value={(team.wip / team.wipLimit) * 100} 
                          className={team.wip > team.wipLimit ? 'bg-red-200' : ''}
                        />
                        {team.wip > team.wipLimit && (
                          <p className="text-xs text-red-600 mt-1">⚠️ WIP limit exceeded</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="font-semibold text-[#005EB8]">{team.throughput}</div>
                          <div className="text-xs text-muted-foreground">Items/Week</div>
                        </div>
                        <div>
                          <div className="font-semibold">{team.avgCycleTime}d</div>
                          <div className="text-xs text-muted-foreground">Cycle Time</div>
                        </div>
                        <div>
                          <div className={`font-semibold ${team.blockedItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {team.blockedItems}
                          </div>
                          <div className="text-xs text-muted-foreground">Blocked</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bug className="text-red-500" />
                Bug & Defect Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                  className="text-center p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => handleBugMetricClick('Critical', BUG_METRICS.critical)}
                  data-testid="card-bug-critical"
                >
                  <div className="text-2xl font-bold text-red-600">{BUG_METRICS.critical}</div>
                  <div className="text-sm text-muted-foreground">Critical</div>
                </div>
                <div 
                  className="text-center p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => handleBugMetricClick('High', BUG_METRICS.high)}
                  data-testid="card-bug-high"
                >
                  <div className="text-2xl font-bold text-amber-600">{BUG_METRICS.high}</div>
                  <div className="text-sm text-muted-foreground">High</div>
                </div>
                <div 
                  className="text-center p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleBugMetricClick('Medium', BUG_METRICS.medium)}
                  data-testid="card-bug-medium"
                >
                  <div className="text-2xl font-bold text-blue-600">{BUG_METRICS.medium}</div>
                  <div className="text-sm text-muted-foreground">Medium</div>
                </div>
                <div 
                  className="text-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleBugMetricClick('Low', BUG_METRICS.low)}
                  data-testid="card-bug-low"
                >
                  <div className="text-2xl font-bold text-gray-600">{BUG_METRICS.low}</div>
                  <div className="text-sm text-muted-foreground">Low</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm">
                <div><span className="text-muted-foreground">Resolved (7 days):</span> <span className="font-semibold text-green-600">{BUG_METRICS.resolved7Days}</span></div>
                <div><span className="text-muted-foreground">Avg Resolution:</span> <span className="font-semibold">{BUG_METRICS.avgResolutionTime}</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="text-[#005EB8]" />
                Deployment Pipeline Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEPLOYMENT_STATUS.map((env, idx) => (
                  <motion.div
                    key={env.environment}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleDeploymentClick(env)}
                    data-testid={`card-deployment-${env.environment.toLowerCase().replace(/\//g, '-')}`}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(env.status)}
                      <div>
                        <h4 className="font-semibold">{env.environment}</h4>
                        <p className="text-sm text-muted-foreground">{env.version}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{env.lastDeployment}</span>
                        <Badge variant={env.status === 'success' ? 'default' : env.status === 'failed' ? 'destructive' : 'secondary'}>
                          {env.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Health:</span>
                        <Progress value={env.healthScore} className="w-20 h-2" />
                        <span className="text-xs font-semibold">{env.healthScore}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="huddles" className="mt-4">
          <div className="space-y-4">
            {HUDDLE_INSIGHTS.map((huddle, idx) => (
              <motion.div
                key={`${huddle.team}-${huddle.date}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    huddle.sentiment === 'negative' ? 'border-red-200 bg-red-50' :
                    huddle.sentiment === 'positive' ? 'border-green-200 bg-green-50' : ''
                  }`}
                  onClick={() => handleHuddleClick(huddle)}
                  data-testid={`card-huddle-${huddle.team.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{huddle.team}</h3>
                          <Badge variant={
                            huddle.sentiment === 'positive' ? 'default' :
                            huddle.sentiment === 'negative' ? 'destructive' : 'secondary'
                          }>
                            {huddle.sentiment}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{huddle.date}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className={`font-bold ${huddle.blockers > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {huddle.blockers}
                          </div>
                          <div className="text-xs text-muted-foreground">Blockers</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-[#005EB8]">{huddle.actionItems}</div>
                          <div className="text-xs text-muted-foreground">Actions</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {huddle.keyTopics.map(topic => (
                        <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="text-purple-500" />
                Communication Sentiment Analysis
                <Badge variant="outline" className="ml-2 text-xs">AI-Powered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SENTIMENT_DATA.map((source, idx) => (
                  <motion.div
                    key={source.source}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${source.riskIndicator ? 'bg-amber-50 border-amber-200' : 'bg-gray-50'}`}
                    onClick={() => handleSentimentClick(source)}
                    data-testid={`card-sentiment-${source.source.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{source.source}</h4>
                        {source.riskIndicator && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <AlertTriangle size={12} className="mr-1" />
                            Risk Signal
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getSentimentColor(source.sentiment)}`}>
                          {source.sentiment}%
                        </span>
                        {source.trend === 'improving' && <TrendingUp size={16} className="text-green-600" />}
                        {source.trend === 'declining' && <TrendingDown size={16} className="text-red-600" />}
                        {source.trend === 'stable' && <Minus size={16} className="text-gray-400" />}
                      </div>
                    </div>
                    <Progress value={source.sentiment} className="mb-2" />
                    <div className="flex gap-2 flex-wrap">
                      {source.keywords.map(kw => (
                        <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  <Zap size={14} className="inline mr-1" />
                  <strong>AI Insight:</strong> Stakeholder communication sentiment trending down 8% over past week. 
                  Recommend proactive executive briefing on timeline and budget status.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
