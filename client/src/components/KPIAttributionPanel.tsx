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
    name: 'Operating Profit',
    category: 'financial',
    baseline: 820,
    target: 950,
    current: 892,
    unit: '$m',
    trend: 'up',
    status: 'on-track',
    attribution: [
      { initiative: 'Claims', contribution: 32, confidence: 85 },
      { initiative: 'Cost Efficiency Programme', contribution: 45, confidence: 92 },
      { initiative: 'Process Automation', contribution: 23, confidence: 78 }
    ]
  },
  {
    id: 'kpi-002',
    name: 'Customer NPS',
    category: 'customer',
    baseline: 42,
    target: 55,
    current: 51,
    unit: 'pts',
    trend: 'up',
    status: 'on-track',
    attribution: [
      { initiative: 'Customer Portal Upgrade', contribution: 55, confidence: 88 },
      { initiative: 'Claims', contribution: 30, confidence: 75 },
      { initiative: 'Mobile App Launch', contribution: 15, confidence: 82 }
    ]
  },
  {
    id: 'kpi-003',
    name: 'Claims Processing Time',
    category: 'operational',
    baseline: 14,
    target: 5,
    current: 7.2,
    unit: 'days',
    trend: 'down',
    status: 'at-risk',
    attribution: [
      { initiative: 'Claims', contribution: 65, confidence: 90 },
      { initiative: 'Process Automation', contribution: 35, confidence: 85 }
    ]
  },
  {
    id: 'kpi-004',
    name: 'Digital Adoption Rate',
    category: 'strategic',
    baseline: 45,
    target: 75,
    current: 68,
    unit: '%',
    trend: 'up',
    status: 'on-track',
    attribution: [
      { initiative: 'Customer Portal Upgrade', contribution: 40, confidence: 92 },
      { initiative: 'Mobile App Launch', contribution: 45, confidence: 88 },
      { initiative: 'Digital Marketing Campaign', contribution: 15, confidence: 70 }
    ]
  },
  {
    id: 'kpi-005',
    name: 'Cost-to-Income Ratio',
    category: 'financial',
    baseline: 58,
    target: 50,
    current: 52.4,
    unit: '%',
    trend: 'down',
    status: 'on-track',
    attribution: [
      { initiative: 'Cost Efficiency Programme', contribution: 60, confidence: 95 },
      { initiative: 'Process Automation', contribution: 25, confidence: 82 },
      { initiative: 'Vendor Consolidation', contribution: 15, confidence: 75 }
    ]
  },
  {
    id: 'kpi-006',
    name: 'Employee Engagement',
    category: 'strategic',
    baseline: 72,
    target: 82,
    current: 76,
    unit: '%',
    trend: 'stable',
    status: 'at-risk',
    attribution: [
      { initiative: 'Workplace Transformation', contribution: 50, confidence: 80 },
      { initiative: 'Learning & Development', contribution: 30, confidence: 75 },
      { initiative: 'Hybrid Working Programme', contribution: 20, confidence: 85 }
    ]
  }
];

const ATTRIBUTION_ANALYSIS: AttributionAnalysis[] = [
  {
    initiative: 'Claims',
    kpiImpact: [
      { kpi: 'Operating Profit', contribution: '+$23m', confidence: 85 },
      { kpi: 'Customer NPS', contribution: '+4 pts', confidence: 75 },
      { kpi: 'Claims Processing Time', contribution: '-4.5 days', confidence: 90 }
    ],
    totalValue: '$47m',
    evidenceStrength: 'strong'
  },
  {
    initiative: 'Cost Efficiency Programme',
    kpiImpact: [
      { kpi: 'Operating Profit', contribution: '+$33m', confidence: 92 },
      { kpi: 'Cost-to-Income Ratio', contribution: '-3.4%', confidence: 95 }
    ],
    totalValue: '$33m',
    evidenceStrength: 'strong'
  },
  {
    initiative: 'Customer Portal Upgrade',
    kpiImpact: [
      { kpi: 'Customer NPS', contribution: '+5 pts', confidence: 88 },
      { kpi: 'Digital Adoption Rate', contribution: '+9%', confidence: 92 }
    ],
    totalValue: '$18m',
    evidenceStrength: 'moderate'
  }
];

const AI_SUGGESTED_KPIS = [
  { name: 'First Contact Resolution Rate', rationale: 'Strong correlation with NPS improvements in similar transformations', confidence: 87 },
  { name: 'Automation Coverage %', rationale: 'Leading indicator for operational efficiency gains', confidence: 82 },
  { name: 'Time to Value (New Features)', rationale: 'Measures speed of capability delivery to customers', confidence: 79 },
  { name: 'Carbon Footprint Reduction', rationale: 'Aligns with NextEra ESG commitments and Climate Report targets', confidence: 91 }
];

export function KPIAttributionPanel() {
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tracking');

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
                        <span className="font-semibold">{kpi.current}{kpi.unit} / {kpi.target}{kpi.unit}</span>
                      </div>
                      <Progress value={getProgressPercentage(kpi)} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Baseline: {kpi.baseline}{kpi.unit}</span>
                        <span>Target: {kpi.target}{kpi.unit}</span>
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
                {AI_SUGGESTED_KPIS.map((suggestion, idx) => (
                  <motion.div
                    key={suggestion.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <h4 className="font-semibold">{suggestion.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.rationale}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{suggestion.confidence}% relevant</Badge>
                      <Button size="sm" variant="outline">
                        <ArrowRight size={14} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
