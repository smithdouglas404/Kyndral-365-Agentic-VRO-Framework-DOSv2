/**
 * RISK CATEGORIES WIDGET
 *
 * Displays enterprise risk categories with sub-risks.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

function RiskCategoryCard({ category }: { category: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <Shield className="h-5 w-5" style={{ color: category.color }} />
            <span className="font-semibold">{category.name}</span>
          </div>
          <Badge variant="outline">{category.subRisks?.length || 0} sub-risks</Badge>
        </div>
        <p className="text-xs text-gray-500 ml-9">{category.subtitle}</p>
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
              <div className="space-y-3">
                {category.subRisks?.map((subRisk: any, i: number) => (
                  <div key={i} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{subRisk.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            subRisk.severity === 'high' ? 'destructive' :
                              subRisk.severity === 'medium' ? 'secondary' : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {subRisk.severity}
                        </Badge>
                        {subRisk.trend === 'improving' ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : subRisk.trend === 'worsening' ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <span className="text-xs text-gray-400">stable</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{subRisk.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RiskCategoriesWidget() {
  const { data: riskFrameworkData } = useQuery({
    queryKey: ['governance', 'risk-framework'],
    queryFn: async () => {
      const res = await fetch('/api/governance/risk-framework');
      if (!res.ok) throw new Error('Failed to fetch risk framework');
      return res.json();
    },
    refetchInterval: 300000,
  });

  const riskData = riskFrameworkData?.riskData || { categories: [] };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Risk Categories</span>
          <Badge variant="outline" className="text-xs">From Enterprise Risk Framework</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {riskData.categories.slice(0, 5).map((category: any) => (
            <RiskCategoryCard key={category.id} category={category} />
          ))}
          {riskData.categories.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No risk categories available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
