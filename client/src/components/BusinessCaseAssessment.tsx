import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Brain, CheckCircle2, AlertTriangle, TrendingUp, 
  ChevronRight, Sparkles, Target, DollarSign, Clock, Users,
  ArrowRight, ThumbsUp, ThumbsDown, GitBranch, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BusinessCase {
  id: string;
  name: string;
  bu: string;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  score: number;
  investment: string;
  expectedRoi: string;
  paybackPeriod: string;
  riskLevel: 'low' | 'medium' | 'high';
  aiRecommendations: {
    type: 'improvement' | 'risk' | 'opportunity';
    text: string;
    impact: string;
  }[];
  governanceStage: string;
  nextMilestone: string;
}

const BUSINESS_CASES: BusinessCase[] = [
  {
    id: 'bc-001',
    name: 'Claims',
    bu: 'Insurance',
    status: 'review',
    score: 78,
    investment: '£4.2m',
    expectedRoi: '245%',
    paybackPeriod: '18 months',
    riskLevel: 'medium',
    aiRecommendations: [
      { type: 'improvement', text: 'Strengthen benefits quantification with customer NPS correlation data', impact: '+12% approval likelihood' },
      { type: 'risk', text: 'Legacy system integration costs may be underestimated by 15-20%', impact: 'Budget risk £630k' },
      { type: 'opportunity', text: 'Cross-sell opportunity in Retail identified - add to benefits case', impact: '+£1.8m NPV' }
    ],
    governanceStage: 'Investment Committee',
    nextMilestone: 'Stage Gate 2 Review - Jan 15'
  },
  {
    id: 'bc-002',
    name: 'Workplace Pensions',
    bu: 'Workplace',
    status: 'approved',
    score: 92,
    investment: '£8.7m',
    expectedRoi: '312%',
    paybackPeriod: '24 months',
    riskLevel: 'low',
    aiRecommendations: [
      { type: 'opportunity', text: 'Accelerate Phase 2 to capture early market advantage', impact: '+£2.1m revenue' },
      { type: 'improvement', text: 'Add sustainability metrics to align with ESG reporting requirements', impact: 'Regulatory compliance' }
    ],
    governanceStage: 'Execution',
    nextMilestone: 'Phase 1 Go-Live - Feb 28'
  },
  {
    id: 'bc-003',
    name: 'Customer',
    bu: 'Group Functions',
    status: 'draft',
    score: 65,
    investment: '£12.5m',
    expectedRoi: '189%',
    paybackPeriod: '36 months',
    riskLevel: 'high',
    aiRecommendations: [
      { type: 'risk', text: 'Data governance approvals not yet secured - critical path risk', impact: '3-month delay risk' },
      { type: 'improvement', text: 'Phased rollout recommended to reduce execution risk', impact: '-25% risk exposure' },
      { type: 'improvement', text: 'Include quick wins from Retail data consolidation', impact: '+£800k Year 1' },
      { type: 'risk', text: 'Resource dependency on external vendor capacity', impact: 'Delivery risk' }
    ],
    governanceStage: 'Business Case Development',
    nextMilestone: 'Sponsor Sign-off Required - Jan 10'
  },
  {
    id: 'bc-004',
    name: 'AI Powered Pricing',
    bu: 'Insurance',
    status: 'review',
    score: 84,
    investment: '£3.1m',
    expectedRoi: '278%',
    paybackPeriod: '14 months',
    riskLevel: 'medium',
    aiRecommendations: [
      { type: 'opportunity', text: 'Expand scope to include motor insurance for 40% additional benefit', impact: '+£1.2m NPV' },
      { type: 'improvement', text: 'Add model explainability requirements for FCA compliance', impact: 'Regulatory alignment' }
    ],
    governanceStage: 'Technical Review Board',
    nextMilestone: 'Architecture Approval - Jan 12'
  }
];

const GOVERNANCE_STAGES = [
  { id: 'ideation', name: 'Ideation', icon: Sparkles },
  { id: 'development', name: 'Business Case Development', icon: FileText },
  { id: 'review', name: 'Review & Approval', icon: CheckCircle2 },
  { id: 'execution', name: 'Execution', icon: Target },
  { id: 'realisation', name: 'Benefits Realisation', icon: TrendingUp }
];

export function BusinessCaseAssessment() {
  const [selectedCase, setSelectedCase] = useState<BusinessCase | null>(null);
  const [activeTab, setActiveTab] = useState('cases');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'review': return 'bg-amber-500';
      case 'draft': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00843D';
    if (score >= 60) return '#f59e0b';
    return '#D50032';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="text-[#005EB8]" />
            AI Business Case Project Insights
          </h2>
          <p className="text-muted-foreground">Intelligent analysis, recommendations, and governance tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles size={12} className="text-purple-500" />
            AI-Powered Analysis
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cases" className="gap-2">
            <FileText size={16} />
            Business Cases
          </TabsTrigger>
          <TabsTrigger value="governance" className="gap-2">
            <GitBranch size={16} />
            Change Governance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {BUSINESS_CASES.map((bc) => (
              <motion.div
                key={bc.id}
                whileHover={{ scale: 1.01 }}
                className="cursor-pointer"
                onClick={() => setSelectedCase(bc)}
              >
                <Card className={`border-2 transition-all ${selectedCase?.id === bc.id ? 'border-[#005EB8] shadow-lg' : 'border-transparent hover:border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(bc.status)}>{bc.status.toUpperCase()}</Badge>
                          <Badge variant="outline">{bc.bu}</Badge>
                        </div>
                        <h3 className="font-semibold">{bc.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: getScoreColor(bc.score) }}>{bc.score}</div>
                        <div className="text-xs text-muted-foreground">AI Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-muted-foreground" />
                        <span>{bc.investment}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-green-600" />
                        <span>{bc.expectedRoi}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-muted-foreground" />
                        <span>{bc.paybackPeriod}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={getRiskColor(bc.riskLevel)}>
                        <Shield size={12} className="mr-1" />
                        {bc.riskLevel} risk
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles size={12} className="text-purple-500" />
                        {bc.aiRecommendations.length} AI recommendations
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {selectedCase && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-[#005EB8] border-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="text-[#005EB8]" />
                        AI Recommendations for {selectedCase.name}
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>×</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCase.aiRecommendations.map((rec, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-3 rounded-lg border ${
                          rec.type === 'improvement' ? 'bg-blue-50 border-blue-200' :
                          rec.type === 'risk' ? 'bg-amber-50 border-amber-200' :
                          'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            {rec.type === 'improvement' && <TrendingUp size={16} className="text-blue-600 mt-0.5" />}
                            {rec.type === 'risk' && <AlertTriangle size={16} className="text-amber-600 mt-0.5" />}
                            {rec.type === 'opportunity' && <Sparkles size={16} className="text-green-600 mt-0.5" />}
                            <div>
                              <p className="text-sm font-medium">{rec.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">Impact: {rec.impact}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <ThumbsUp size={14} />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <ThumbsDown size={14} />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Governance Stage:</span>{' '}
                        <span className="font-medium">{selectedCase.governanceStage}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Next:</span>{' '}
                        <span className="font-medium text-[#005EB8]">{selectedCase.nextMilestone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="governance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="text-[#005EB8]" />
                Change Governance Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                {GOVERNANCE_STAGES.map((stage, idx) => (
                  <div key={stage.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        idx <= 2 ? 'bg-[#005EB8] text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <stage.icon size={20} />
                      </div>
                      <span className="text-xs mt-2 text-center max-w-[80px]">{stage.name}</span>
                    </div>
                    {idx < GOVERNANCE_STAGES.length - 1 && (
                      <ArrowRight className={`mx-2 ${idx < 2 ? 'text-[#005EB8]' : 'text-gray-300'}`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Cases by Stage</h4>
                {GOVERNANCE_STAGES.map((stage) => {
                  const casesInStage = BUSINESS_CASES.filter(bc => 
                    bc.governanceStage.toLowerCase().includes(stage.name.toLowerCase().split(' ')[0])
                  );
                  return casesInStage.length > 0 ? (
                    <div key={stage.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <stage.icon size={14} className="text-[#005EB8]" />
                        <span className="font-medium text-sm">{stage.name}</span>
                        <Badge variant="outline" className="ml-auto">{casesInStage.length}</Badge>
                      </div>
                      <div className="space-y-1">
                        {casesInStage.map(bc => (
                          <div key={bc.id} className="flex items-center justify-between text-sm">
                            <span>{bc.name}</span>
                            <span className="text-muted-foreground text-xs">{bc.nextMilestone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
