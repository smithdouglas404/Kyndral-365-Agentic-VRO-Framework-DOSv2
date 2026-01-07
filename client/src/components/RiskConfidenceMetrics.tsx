import { motion } from 'framer-motion';
import { 
  Shield, TrendingUp, Users, Clock, CheckCircle2, 
  AlertTriangle, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RiskMetric {
  id: string;
  label: string;
  score: number;
  status: 'high' | 'medium' | 'low';
  description: string;
  source?: string;
}

const riskMetrics: RiskMetric[] = [
  {
    id: 'market',
    label: 'Market Validation',
    score: 94,
    status: 'high',
    description: 'Strong demand signals from PRT market growth',
    source: 'L&G Annual Report 2024, p.12'
  },
  {
    id: 'technical',
    label: 'Technical Feasibility',
    score: 88,
    status: 'high',
    description: 'Proven technology stack with internal expertise',
    source: 'L&G Digital Investment Strategy'
  },
  {
    id: 'resource',
    label: 'Resource Availability',
    score: 65,
    status: 'medium',
    description: 'Synced with OCM readiness assessment - training at 68%',
    source: 'OCM Agent Report'
  },
  {
    id: 'stakeholder',
    label: 'Stakeholder Alignment',
    score: 91,
    status: 'high',
    description: 'Strong executive sponsorship across all divisions',
    source: 'Governance Agent'
  },
  {
    id: 'regulatory',
    label: 'Regulatory Compliance',
    score: 85,
    status: 'high',
    description: 'Aligned with FCA requirements and Solvency II',
    source: 'L&G Risk Management Supplement 2024'
  }
];

const statusConfig = {
  high: {
    label: 'High confidence',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    progressColor: 'bg-green-500'
  },
  medium: {
    label: 'Medium confidence',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    progressColor: 'bg-amber-500'
  },
  low: {
    label: 'Low confidence',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    progressColor: 'bg-red-500'
  }
};

export function RiskConfidenceMetrics() {
  const overallConfidence = Math.round(
    riskMetrics.reduce((sum, m) => sum + m.score, 0) / riskMetrics.length
  );
  
  const overallStatus = overallConfidence >= 80 ? 'high' : overallConfidence >= 60 ? 'medium' : 'low';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Risk & Confidence
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Overall:</span>
            <Badge 
              variant="outline" 
              className={cn(
                "font-bold",
                statusConfig[overallStatus].color,
                statusConfig[overallStatus].bgColor
              )}
            >
              {overallConfidence}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Low
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                High
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {riskMetrics.map((metric, index) => {
            const config = statusConfig[metric.status];
            
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2"
                data-testid={`risk-metric-${metric.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-bold", config.color)}>
                      {metric.score}%
                    </span>
                  </div>
                </div>
                
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.score}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn("absolute h-full rounded-full", config.progressColor)}
                  />
                </div>
                
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-gray-500">{metric.description}</p>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", config.color)}>
                    {config.label}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
