/**
 * COST CATEGORIES WIDGET
 *
 * Displays cost breakdown by category with budget vs. actual comparison.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight, Bot, PieChart } from 'lucide-react';
import { useCostCategories, type CostCategory } from '@/hooks/useFinOpsData';
import type { DataMode } from '@/lib/agentDataTransformers';

interface CostCategoriesWidgetProps {
  mode: DataMode;
  onDrillDown?: (type: string, id: string) => void;
}

function CostCategoryCard({ category, mode }: { category: CostCategory; mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);
  const isOverBudget = category.variance > 0;

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`cost-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <span className="font-semibold">{category.name}</span>
          </div>
          <Badge variant={isOverBudget ? 'destructive' : 'default'}>
            {isOverBudget ? '+' : ''}
            {category.variance.toFixed(1)}%
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Budget</p>
            <p className="font-bold">${category.budget}M</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">YTD Spend</p>
            <p className="font-bold">${category.spent}M</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Forecast</p>
            <p className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              ${category.forecast}M
            </p>
          </div>
        </div>
        <Progress value={(category.spent / category.budget) * 100} className="h-1.5 mt-3" />
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
                  <p className="text-xs text-gray-500">Segment Owner</p>
                  <p className="font-semibold text-sm">{category.division}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Savings Identified</p>
                  <p className="font-bold text-green-600">${category.savings}M</p>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  {mode === 'VRO' ? 'AI-Driven Analysis' : 'Manual Analysis'}
                </h4>
                <p className="text-sm text-gray-700">{category.aiInsight}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CostCategoriesWidget({ mode, onDrillDown }: CostCategoriesWidgetProps) {
  const { data: costCategories = [], isLoading } = useCostCategories();

  if (isLoading) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="h-5 w-5" />
            Cost Categories
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

  const totalBudget = costCategories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = costCategories.reduce((sum, c) => sum + c.spent, 0);

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="h-5 w-5 text-blue-600" />
            Cost Categories
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            ${totalSpent.toFixed(0)}M / ${totalBudget.toFixed(0)}M
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {costCategories.map((category) => (
            <CostCategoryCard key={category.name} category={category} mode={mode} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
