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
import { useQuery } from '@tanstack/react-query';

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

// Agent icon and color mapping
const agentConfig: Record<string, { icon: React.ElementType; color: string }> = {
  'pmo': { icon: GitBranch, color: 'bg-purple-500' },
  'tmo': { icon: Repeat, color: 'bg-teal-500' },
  'finops': { icon: DollarSign, color: 'bg-blue-500' },
  'governance': { icon: Shield, color: 'bg-red-500' },
  'risk': { icon: AlertTriangle, color: 'bg-orange-500' },
  'vro': { icon: DollarSign, color: 'bg-blue-500' },
  'planning': { icon: GitBranch, color: 'bg-indigo-500' },
  'ocm': { icon: Users, color: 'bg-green-500' },
  'okr': { icon: Shield, color: 'bg-amber-500' },
  'integrated-management': { icon: Users, color: 'bg-gray-500' }
};

const getAgentConfig = (agentId: string) => {
  return agentConfig[agentId.toLowerCase()] || { icon: Users, color: 'bg-gray-400' };
};

export function CrossAgentCollaboration() {
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch real agent-to-agent messages from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['agent-collaboration-messages'],
    queryFn: async () => {
      const response = await fetch('/api/agent-activity/a2a-messages?limit=20&hours=24');
      if (!response.ok) throw new Error('Failed to fetch agent messages');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Transform API data to component format
  const agentMessages: AgentMessage[] = (data?.messages || []).map((msg: any) => {
    const fromConfig = getAgentConfig(msg.primaryAgentId || '');
    const toConfig = getAgentConfig(msg.secondaryAgentId || '');

    // Parse details if available
    let details: any = {};
    try {
      if (msg.details) {
        details = typeof msg.details === 'string' ? JSON.parse(msg.details) : msg.details;
      }
    } catch (e) {
      console.warn('Failed to parse message details:', e);
    }

    return {
      id: msg.id,
      fromAgent: msg.primaryAgentName || msg.primaryAgentId,
      fromIcon: fromConfig.icon,
      fromColor: fromConfig.color,
      toAgent: msg.secondaryAgentName || msg.secondaryAgentId,
      toIcon: toConfig.icon,
      toColor: toConfig.color,
      direction: 'incoming',
      message: msg.summary || 'Agent communication',
      impact: details.impact,
      impactType: details.impactType || 'neutral',
      delay: details.delay,
      confidence: details.confidence || 85,
      timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'Now',
    };
  });

  const synced = !error && !isLoading;

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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="refresh-cross-agent"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="toggle-cross-agent"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Real-time agent-to-agent collaboration from the last 24 hours
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
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading agent messages...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Failed to load messages</p>
                  <Button variant="link" onClick={() => refetch()} className="mt-2">
                    Try Again
                  </Button>
                </div>
              ) : agentMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No agent collaboration messages yet</p>
                </div>
              ) : (
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
              )}

              {!isLoading && !error && agentMessages.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">
                    Showing {agentMessages.length} agent collaborations (last 24h)
                  </p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
