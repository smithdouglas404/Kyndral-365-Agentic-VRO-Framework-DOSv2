/**
 * SAVINGS OPPORTUNITIES WIDGET
 *
 * Displays identified cost savings opportunities with AI insights.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Bot, TrendingUp, Sparkles } from 'lucide-react';
import { useSavingsOpportunities, type SavingsOpportunity } from '@/hooks/useFinOpsData';
import type { DataMode } from '@/lib/agentDataTransformers';

interface SavingsOpportunitiesWidgetProps {
  mode: DataMode;
  onDrillDown?: (type: string, id: string) => void;
}

function SavingsOpportunityCard({ opportunity, mode }: { opportunity: SavingsOpportunity; mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`savings-${opportunity.area.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <span className="font-semibold text-sm">{opportunity.area}</span>
          </div>
          <Badge
            variant={
              opportunity.status === 'validated'
                ? 'default'
                : opportunity.status === 'in-progress'
                ? 'secondary'
                : 'outline'
            }
          >
            {opportunity.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-green-600">${opportunity.potential.toFixed(1)}M</p>
            <p className="text-xs text-gray-500">potential savings</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">{opportunity.confidence}%</p>
            <p className="text-xs text-gray-500">confidence</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Reportable Segment</p>
                  <p className="font-semibold text-sm">{opportunity.division}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Payback Period</p>
                  <p className="font-semibold text-sm">{opportunity.paybackMonths} months</p>
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-purple-800">
                  <Bot className="h-4 w-4 text-purple-500" />
                  AI Insight
                </h4>
                <p className="text-sm text-gray-700">{opportunity.aiInsight}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-500">ROI</p>
                  <p className="font-bold text-blue-600">{opportunity.roi.toFixed(1)}x</p>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-500">Implementation</p>
                  <p className="font-bold text-green-600">{mode === 'VRO' ? 'Low Risk' : 'Medium Risk'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SavingsOpportunitiesWidget({ mode, onDrillDown }: SavingsOpportunitiesWidgetProps) {
  const { data: savingsOpportunities = [], isLoading } = useSavingsOpportunities();

  if (isLoading) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            Savings Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSavings = savingsOpportunities.reduce((sum, s) => sum + s.potential, 0);
  const validatedSavings = savingsOpportunities
    .filter((s) => s.status === 'validated')
    .reduce((sum, s) => sum + s.potential, 0);

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Savings Opportunities
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              ${totalSavings.toFixed(1)}M identified
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded bg-green-50 border border-green-100">
            <p className="text-xs text-gray-500">Total Potential</p>
            <p className="font-bold text-green-600">${totalSavings.toFixed(1)}M</p>
          </div>
          <div className="text-center p-2 rounded bg-blue-50 border border-blue-100">
            <p className="text-xs text-gray-500">Validated</p>
            <p className="font-bold text-blue-600">${validatedSavings.toFixed(1)}M</p>
          </div>
          <div className="text-center p-2 rounded bg-purple-50 border border-purple-100">
            <p className="text-xs text-gray-500">Opportunities</p>
            <p className="font-bold text-purple-600">{savingsOpportunities.length}</p>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-3">
          {savingsOpportunities.map((opportunity) => (
            <SavingsOpportunityCard key={opportunity.area} opportunity={opportunity} mode={mode} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
