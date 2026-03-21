/**
 * GOVERNANCE QUEUE WIDGET
 *
 * Displays governance items with expandable details.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGovernanceItems } from '@/hooks/useDashboardData';
import type { DataMode, TransformedGovernanceItem } from '@/lib/agentDataTransformers';

interface GovernanceQueueWidgetProps {
  mode: DataMode;
}

function GovernanceItemCard({ item, mode }: { item: TransformedGovernanceItem; mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'default';
      case 'in-review': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-semibold">{item.title}</span>
          </div>
          <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 ml-6">
          <span className={`px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}>{item.priority}</span>
          <span>Due: {item.dueDate}</span>
          <span>Owner: {item.owner}</span>
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
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-semibold text-sm capitalize">{item.type}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Completion Status</p>
                  <p className={`font-semibold text-sm ${item.completionTime.includes('ahead') ? 'text-green-600' : item.completionTime.includes('Delayed') ? 'text-red-600' : 'text-blue-600'}`}>
                    {item.completionTime}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border mb-4">
                <p className="text-xs text-gray-500">Related Risks</p>
                <p className="font-semibold text-sm">{item.relatedRisks} high-severity risks in category</p>
              </div>

              <div className={`p-3 rounded-lg border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100 border-gray-200'}`}>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  {mode === 'VRO' ? 'AI Assistance' : 'Manual Process'}
                </h4>
                <p className="text-sm text-gray-700">{item.aiStatus}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GovernanceQueueWidget({ mode }: GovernanceQueueWidgetProps) {
  const { data: governanceItems = [] } = useGovernanceItems();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Governance Queue</span>
          <Badge variant="outline" className="text-xs">Click to expand</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {governanceItems.map((item, i) => (
            <GovernanceItemCard key={i} item={item} mode={mode} />
          ))}
          {governanceItems.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No governance items</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
