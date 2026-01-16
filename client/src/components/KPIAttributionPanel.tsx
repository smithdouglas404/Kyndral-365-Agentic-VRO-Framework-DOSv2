import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, TrendingUp, BarChart3, PieChart, CheckCircle2, 
  AlertCircle, Sparkles, ArrowRight, ChevronDown, ChevronUp,
  DollarSign, Users, Clock, Zap, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface KPI {
  id: string;
  name: string;
  category: 'financial' | 'operational' | 'customer' | 'strategic';
  baseline: number;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'on-track' | 'at-risk' | 'off-track';
  attribution: {
    initiative: string;
    contribution: number;
    confidence: number;
  }[];
}

interface AttributionAnalysis {
  initiative: string;
  kpiImpact: { kpi: string; contribution: string; confidence: number }[];
  totalValue: string;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
}

const CORE_KPIS: KPI[] = [
  {
    id: 'kpi-001',
    name: 'Revenue Growth',
    category: 'financial',
    baseline: 18200,
    target: 21000,
    current: 19850,
    unit: '$m',
    trend: 'up',
    status: 'on-track',
    attribution: [
      { initiative: 'FPL Solar Expansion', contribution: 35, confidence: 92 },
      { initiative: 'NEER Wind Repowering', contribution: 42, confidence: 88 },
      { initiative: 'Grid Modernization', contribution: 23, confidence: 78 }
    ]
  },
  {
    id: 'kpi-002',
    name: 'Customer Reliability Index',
    category: 'customer',
    baseline: 92,
    target: 99.5,
    current: 98.2,
    unit: '%',
    trend: 'up',
    status: 'on-track',
    attribution: [
      { initiative: 'Grid Modernization', contribution: 55, confidence: 90 },
      { initiative: 'Storm Hardening Program', contribution: 30, confidence: 85 },
      { initiative: 'Smart Meter Deployment', contribution: 15, confidence: 82 }
    ]
  },
  {
    id: 'kpi-003',
    name: 'Outage Response Time',
    category: 'operational',
    baseline: 120,
    target: 45,
    current: 68,
    unit: 'min',
    trend: 'down',
    status: 'at-risk',
    attribution: [
      { initiative: 'Grid Modernization', contribution: 65, confidence: 90 },
      { initiative: 'AI Predictive Maintenance', contribution: 35, confidence: 85 }
    ]
  },
  {
    id: 'kpi-004',
    name: 'Renewable Capacity',
    category: 'strategic',
    baseline: 28500,
    target: 35000,
    current: 32400,
    unit: 'MW',
    trend: 'up',
    status: 'on-track',
    attribution: [
      { initiative: 'NEER Wind Repowering', contribution: 45, confidence: 92 },
      { initiative: 'FPL Solar Expansion', contribution: 40, confidence: 88 },
      { initiative: 'Battery Storage Deployment', contribution: 15, confidence: 75 }
    ]
  },
  {
    id: 'kpi-005',
    name: 'Carbon Reduction',
    category: 'financial',
    baseline: 42,
    target: 70,
    current: 58,
    unit: '%',
    trend: 'up',
    status: 'on-track',
    attribution: [
      { initiative: 'Coal Plant Retirement', contribution: 50, confidence: 95 },
      { initiative: 'NEER Wind Repowering', contribution: 30, confidence: 88 },
      { initiative: 'FPL Solar Expansion', contribution: 20, confidence: 82 }
    ]
  },
  {
    id: 'kpi-006',
    name: 'Safety Performance (TRIR)',
    category: 'strategic',
    baseline: 0.85,
    target: 0.50,
    current: 0.62,
    unit: '',
    trend: 'stable',
    status: 'at-risk',
    attribution: [
      { initiative: 'Safety Excellence Program', contribution: 50, confidence: 88 },
      { initiative: 'Field Operations Training', contribution: 30, confidence: 82 },
      { initiative: 'Contractor Management', contribution: 20, confidence: 75 }
    ]
  }
];

const ATTRIBUTION_ANALYSIS: AttributionAnalysis[] = [
  {
    initiative: 'FPL Solar Expansion',
    kpiImpact: [
      { kpi: 'Revenue Growth', contribution: '+$580M', confidence: 92 },
      { kpi: 'Renewable Capacity', contribution: '+1,200 MW', confidence: 95 },
      { kpi: 'Carbon Reduction', contribution: '+8%', confidence: 88 }
    ],
    totalValue: '$1.2B',
    evidenceStrength: 'strong'
  },
  {
    initiative: 'NEER Wind Repowering',
    kpiImpact: [
      { kpi: 'Revenue Growth', contribution: '+$690M', confidence: 88 },
      { kpi: 'Renewable Capacity', contribution: '+2,100 MW', confidence: 92 }
    ],
    totalValue: '$1.8B',
    evidenceStrength: 'strong'
  },
  {
    initiative: 'Grid Modernization',
    kpiImpact: [
      { kpi: 'Customer Reliability Index', contribution: '+4.2%', confidence: 90 },
      { kpi: 'Outage Response Time', contribution: '-35 min', confidence: 85 }
    ],
    totalValue: '$450M',
    evidenceStrength: 'moderate'
  }
];

const AI_SUGGESTED_KPIS = [
  { name: 'Battery Storage Capacity', rationale: 'Critical metric for grid reliability and renewable integration', confidence: 94 },
  { name: 'Customer Self-Service Rate', rationale: 'Leading indicator for digital transformation success', confidence: 82 },
  { name: 'Grid Resilience Score', rationale: 'Measures storm hardening effectiveness for Florida operations', confidence: 88 },
  { name: 'Clean Energy Generation %', rationale: 'Aligns with NextEra Real Zero carbon goals and ESG commitments', confidence: 96 }
];

export function KPIAttributionPanel() {
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tracking');
  const [addedKpis, setAddedKpis] = useState<Set<string>>(new Set());

  const handleAddKpi = (kpiName: string) => {
    setAddedKpis(prev => new Set(Array.from(prev).concat(kpiName)));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return <DollarSign size={14} />;
      case 'operational': return <Clock size={14} />;
      case 'customer': return <Users size={14} />;
      case 'strategic': return <Target size={14} />;
      default: return <BarChart3 size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-500';
      case 'at-risk': return 'bg-amber-500';
      case 'off-track': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressPercentage = (kpi: KPI) => {
    const range = Math.abs(kpi.target - kpi.baseline);
    const progress = Math.abs(kpi.current - kpi.baseline);
    return Math.min(100, (progress / range) * 100);
  };

  const getEvidenceColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'weak': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatValueWithUnit = (value: number, unit: string): string => {
    if (unit === '$m' || unit === '$M') {
      return `$${value}M`;
    } else if (unit.startsWith('$')) {
      return `$${value}${unit.slice(1).toUpperCase()}`;
    }
    return `${value}${unit}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="text-[#005EB8]" />
            KPI Tracking & Attribution
          </h2>
          <p className="text-muted-foreground">Automated measurement and value attribution analysis</p>
        </div>
        <Button variant="outline" className="gap-2">
          <FileText size={16} />
          Generate Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tracking" className="gap-2">
            <BarChart3 size={16} />
            KPI Tracking
          </TabsTrigger>
          <TabsTrigger value="attribution" className="gap-2">
            <PieChart size={16} />
            Attribution Analysis
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2">
            <Sparkles size={16} />
            AI Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_KPIS.map((kpi) => (
              <motion.div key={kpi.id} layout>
                <Card 
                  className={`cursor-pointer transition-all ${expandedKpi === kpi.id ? 'ring-2 ring-[#005EB8]' : ''}`}
                  onClick={() => setExpandedKpi(expandedKpi === kpi.id ? null : kpi.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          {getCategoryIcon(kpi.category)}
                          {kpi.category}
                        </Badge>
                        <Badge className={getStatusColor(kpi.status)}>{kpi.status}</Badge>
                      </div>
                      {kpi.trend === 'up' && <TrendingUp size={16} className="text-green-600" />}
                      {kpi.trend === 'down' && (
                        kpi.name.includes('Time') || kpi.name.includes('Ratio') 
                          ? <TrendingUp size={16} className="text-green-600" />
                          : <TrendingUp size={16} className="text-red-600 rotate-180" />
                      )}
                    </div>
                    
                    <h3 className="font-semibold mb-3">{kpi.name}</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{formatValueWithUnit(kpi.current, kpi.unit)} / {formatValueWithUnit(kpi.target, kpi.unit)}</span>
                      </div>
                      <Progress value={getProgressPercentage(kpi)} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Baseline: {formatValueWithUnit(kpi.baseline, kpi.unit)}</span>
                        <span>Target: {formatValueWithUnit(kpi.target, kpi.unit)}</span>
                      </div>
                    </div>

                    {expandedKpi === kpi.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t"
                      >
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <PieChart size={12} />
                          Value Attribution
                        </h4>
                        <div className="space-y-2">
                          {kpi.attribution.map((attr, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="truncate flex-1">{attr.initiative}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#005EB8]">{attr.contribution}%</span>
                                <Badge variant="outline" className="text-xs">{attr.confidence}% conf</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex justify-center mt-2">
                      {expandedKpi === kpi.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attribution" className="mt-4">
          <div className="space-y-4">
            {ATTRIBUTION_ANALYSIS.map((analysis, idx) => (
              <motion.div
                key={analysis.initiative}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{analysis.initiative}</h3>
                        <p className="text-sm text-muted-foreground">Automated attribution analysis</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#00843D]">{analysis.totalValue}</div>
                        <Badge className={`${getEvidenceColor(analysis.evidenceStrength)} border`}>
                          {analysis.evidenceStrength} evidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {analysis.kpiImpact.map((impact, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-muted-foreground">{impact.kpi}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-semibold text-[#005EB8]">{impact.contribution}</span>
                            <Badge variant="outline" className="text-xs">{impact.confidence}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-800">AI Attribution Insight</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Based on multivariate analysis, Claims shows the highest 
                      attribution certainty (85-90%) due to clear temporal correlation between deployment milestones 
                      and KPI improvements. Consider adding leading indicators to strengthen attribution for 
                      Customer Portal Upgrade.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-purple-500" />
                AI-Suggested KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Based on NextEra's strategic objectives and industry benchmarks, consider adding these KPIs:
              </p>
              <div className="space-y-3">
                {AI_SUGGESTED_KPIS.map((suggestion, idx) => {
                  const isAdded = addedKpis.has(suggestion.name);
                  return (
                    <motion.div
                      key={suggestion.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-start justify-between p-4 rounded-lg border ${isAdded ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className={isAdded ? "text-green-600" : "text-gray-400"} />
                          <h4 className="font-semibold">{suggestion.name}</h4>
                          {isAdded && <Badge className="bg-green-100 text-green-700 text-xs">Added</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.rationale}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{suggestion.confidence}% relevant</Badge>
                        <Button 
                          size="sm" 
                          variant={isAdded ? "default" : "outline"}
                          className={isAdded ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() => handleAddKpi(suggestion.name)}
                          disabled={isAdded}
                          data-testid={`btn-add-kpi-${suggestion.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {isAdded ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
