import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, RefreshCw, DollarSign, GitBranch, Repeat, 
  Shield, Users, AlertTriangle, TrendingDown, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AgentMessage {
  id: string;
  fromAgent: string;
  fromIcon: React.ElementType;
  fromColor: string;
  toAgent: string;
  toIcon: React.ElementType;
  toColor: string;
  direction: 'incoming' | 'outgoing';
  message: string;
  impact?: string;
  impactType?: 'negative' | 'positive' | 'neutral';
  delay?: string;
  confidence: number;
  timestamp: string;
}

const agentMessages: AgentMessage[] = [
  {
    id: '1',
    fromAgent: 'PMO',
    fromIcon: GitBranch,
    fromColor: 'bg-purple-500',
    toAgent: 'VRO',
    toIcon: DollarSign,
    toColor: 'bg-blue-500',
    direction: 'incoming',
    message: 'Digital Platform milestone delay detected - Customer Portal launch pushed by 10 days',
    impact: '-$450K',
    impactType: 'negative',
    delay: '+10 days',
    confidence: 82,
    timestamp: '2 min ago'
  },
  {
    id: '2',
    fromAgent: 'TMO',
    fromIcon: Repeat,
    fromColor: 'bg-teal-500',
    toAgent: 'VRO',
    toIcon: DollarSign,
    toColor: 'bg-blue-500',
    direction: 'incoming',
    message: 'Retail division adoption velocity below target - training completion at 68%',
    impact: '-$180K',
    impactType: 'negative',
    confidence: 75,
    timestamp: '5 min ago'
  },
  {
    id: '3',
    fromAgent: 'Governance',
    fromIcon: Shield,
    fromColor: 'bg-red-500',
    toAgent: 'All',
    toIcon: Users,
    toColor: 'bg-gray-500',
    direction: 'incoming',
    message: 'Q1 Steering Committee Review scheduled for Jan 15, 2025 - all agents notified',
    confidence: 100,
    timestamp: '15 min ago'
  },
  {
    id: '4',
    fromAgent: 'VRO',
    fromIcon: DollarSign,
    fromColor: 'bg-blue-500',
    toAgent: 'Governance',
    toIcon: Shield,
    toColor: 'bg-red-500',
    direction: 'outgoing',
    message: 'Budget variance at 8% - requesting governance review approval for contingency release',
    confidence: 95,
    timestamp: '20 min ago'
  },
  {
    id: '5',
    fromAgent: 'OCM',
    fromIcon: Users,
    fromColor: 'bg-pink-500',
    toAgent: 'PMO',
    toIcon: GitBranch,
    toColor: 'bg-purple-500',
    direction: 'incoming',
    message: 'Training completion updated to 68%. Resource allocation may need adjustment.',
    confidence: 88,
    timestamp: '25 min ago'
  }
];

export function CrossAgentCollaboration() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [synced, setSynced] = useState(true);

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Cross-Agent Collaboration
            </CardTitle>
            <Badge variant={synced ? "default" : "secondary"} className="text-xs">
              {synced ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Synced
                </>
              ) : 'Offline'}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="toggle-cross-agent"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          AI monitors cause-effect relationships across all agents
        </p>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {agentMessages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    data-testid={`agent-message-${msg.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className={cn("p-1.5 rounded-md", msg.fromColor)}>
                          <msg.fromIcon className="h-3 w-3 text-white" />
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <div className={cn("p-1.5 rounded-md", msg.toColor)}>
                          <msg.toIcon className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {msg.fromAgent} → {msg.toAgent}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {msg.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{msg.message}</p>
                        
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {msg.impact && (
                            <span className={cn(
                              "text-xs font-semibold flex items-center gap-1",
                              msg.impactType === 'negative' ? "text-red-600" : 
                              msg.impactType === 'positive' ? "text-green-600" : "text-gray-600"
                            )}>
                              {msg.impactType === 'negative' && <TrendingDown className="h-3 w-3" />}
                              {msg.impact}
                            </span>
                          )}
                          {msg.delay && (
                            <span className="text-xs text-orange-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {msg.delay}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {msg.confidence}% confidence
                          </span>
                          <span className="text-xs text-gray-400">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Showing {agentMessages.length} of {agentMessages.length} impacts
                </p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
