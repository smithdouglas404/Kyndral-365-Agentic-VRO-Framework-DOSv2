import { motion } from 'framer-motion';
import { 
  AlertTriangle, TrendingUp, DollarSign, Sparkles, 
  ChevronRight, Package, Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Recommendation {
  id: string;
  title: string;
  confidence: number;
  description: string;
  actionLabel: string;
  type: 'risk' | 'opportunity' | 'savings';
  impact?: string;
}

const recommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Digital Platform Cost Optimization',
    confidence: 84,
    description: 'Technology modernization costs running 12% above baseline at £45.2M. L&G Annual Report indicates £150M digital investment target - recommend phased deployment to stay within budget.',
    actionLabel: 'Review Cost Model',
    type: 'risk',
    impact: '£5.4M at risk'
  },
  {
    id: '2',
    title: 'PRT Volume Acceleration Opportunity',
    confidence: 91,
    description: 'Current PRT volume at £8.2bn tracking ahead of £10bn target. Market conditions favorable for accelerated growth in DB pension transfers.',
    actionLabel: 'View Growth Analysis',
    type: 'opportunity',
    impact: '+£1.8bn potential'
  },
  {
    id: '3',
    title: 'Operational Efficiency Savings',
    confidence: 88,
    description: 'Cross-divisional synergies identified in Retail and Institutional operations. Projected savings of £45M through shared services consolidation aligned with £200M cost target.',
    actionLabel: 'Analyze Savings',
    type: 'savings',
    impact: '£45M savings'
  },
  {
    id: '4',
    title: 'Risk Management Enhancement',
    confidence: 79,
    description: 'Emerging risk patterns detected in transformation delivery. Recommend enhanced monitoring aligned with L&G Three Lines Model framework.',
    actionLabel: 'View Risk Details',
    type: 'risk',
    impact: 'Medium priority'
  }
];

const typeConfig = {
  risk: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  opportunity: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  savings: {
    icon: DollarSign,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
};

export function AIRecommendations() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Recommendations
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {recommendations.length} insights
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Intelligent insights from VRO Financial Analyst based on L&G Annual Report data
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const config = typeConfig[rec.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border",
                  config.bgColor,
                  config.borderColor
                )}
                data-testid={`recommendation-${rec.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm", config.borderColor, "border")}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-sm text-gray-900">{rec.title}</h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                          {rec.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      {rec.impact && (
                        <span className={cn(
                          "text-xs font-semibold",
                          rec.type === 'risk' ? 'text-amber-700' :
                          rec.type === 'opportunity' ? 'text-green-700' : 'text-blue-700'
                        )}>
                          {rec.impact}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs shrink-0"
                    data-testid={`rec-action-${rec.id}`}
                  >
                    {rec.actionLabel}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
