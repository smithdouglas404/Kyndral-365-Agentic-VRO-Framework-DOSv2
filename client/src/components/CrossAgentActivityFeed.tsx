import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, RefreshCw, AlertTriangle, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCrossAgentFeed } from '@/hooks/useAgentData';
import { AgentType, CrossAgentMessage } from '@/lib/dataHub';
import { DrillDownDrawer } from './DrillDownDrawer';

const agentColors: Record<AgentType, string> = {
  'integrated-management': 'bg-indigo-500',
  vro: 'bg-green-500',
  pmo: 'bg-purple-500',
  tmo: 'bg-blue-500',
  finops: 'bg-amber-500',
  okr: 'bg-orange-500',
  governance: 'bg-red-500',
  planning: 'bg-teal-500',
  ocm: 'bg-pink-500'
};

const agentShortNames: Record<AgentType, string> = {
  'integrated-management': 'Integrated',
  vro: 'VRO',
  pmo: 'PMO',
  tmo: 'TMO',
  finops: 'FinOps',
  okr: 'OKR',
  governance: 'Gov',
  planning: 'Plan',
  ocm: 'OCM'
};

const messageTypeIcons: Record<string, React.ReactNode> = {
  data_sync: <RefreshCw size={12} />,
  alert_forward: <AlertTriangle size={12} />,
  action_request: <Zap size={12} />,
  status_update: <CheckCircle2 size={12} />,
  recommendation: <Brain size={12} />
};

const priorityColors: Record<string, string> = {
  critical: 'border-red-500 bg-red-50',
  high: 'border-amber-500 bg-amber-50',
  medium: 'border-blue-500 bg-blue-50',
  low: 'border-gray-300 bg-gray-50'
};

interface CrossAgentActivityFeedProps {
  maxItems?: number;
  compact?: boolean;
}

export function CrossAgentActivityFeed({ maxItems = 10, compact = false }: CrossAgentActivityFeedProps) {
  const messages = useCrossAgentFeed();
  const [selectedMessage, setSelectedMessage] = useState<CrossAgentMessage | null>(null);

  const handleMessageClick = (msg: CrossAgentMessage) => {
    setSelectedMessage(msg);
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (compact) {
    return (
      <>
        <div className="space-y-2">
          {messages.slice(0, maxItems).map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-2 p-2 rounded-lg border-l-2 ${priorityColors[msg.priority]} cursor-pointer hover:shadow-sm transition-shadow`}
              onClick={() => handleMessageClick(msg)}
              data-testid={`agent-message-${msg.id}`}
            >
              <div className={`w-2 h-2 rounded-full ${agentColors[msg.fromAgent]}`} />
              <span className="text-xs font-medium">{agentShortNames[msg.fromAgent]}</span>
              <ArrowRight size={10} className="text-gray-400" />
              <div className={`w-2 h-2 rounded-full ${agentColors[msg.toAgent]}`} />
              <span className="text-xs font-medium">{agentShortNames[msg.toAgent]}</span>
              <span className="text-xs text-gray-500 flex-1 truncate">{msg.message}</span>
              <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
            </motion.div>
          ))}
        </div>
        <DrillDownDrawer
          isOpen={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
          entityType="agent-message"
          entityId={selectedMessage?.id || ''}
        />
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-500" />
          Cross-Agent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {messages.slice(0, maxItems).map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg border-l-4 ${priorityColors[msg.priority]} cursor-pointer hover:shadow-sm transition-shadow`}
              onClick={() => handleMessageClick(msg)}
              data-testid={`agent-message-${msg.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${agentColors[msg.fromAgent]}`} />
                    <span className="text-sm font-medium">{agentShortNames[msg.fromAgent]}</span>
                  </div>
                  <ArrowRight size={14} className="text-gray-400" />
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${agentColors[msg.toAgent]}`} />
                    <span className="text-sm font-medium">{agentShortNames[msg.toAgent]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    {messageTypeIcons[msg.messageType]}
                    {msg.messageType.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{msg.message}</p>
              <p className="text-xs text-gray-400 mt-1">Entity: {msg.entity}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
      <DrillDownDrawer
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        entityType="agent-message"
        entityId={selectedMessage?.id || ''}
      />
    </Card>
  );
}
