import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, AlertTriangle, Lightbulb, TrendingUp, GitBranch, Zap, Target, Clock, ChevronRight } from 'lucide-react';
import { useSimulation } from '@/contexts/SimulationContext';
import { SimulationEvent, SimulationEventType } from '@/lib/liveSimulation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const priorityColors: Record<string, string> = {
  critical: "#D50032",
  high: "#f59e0b",
  medium: "#005EB8",
  low: "#00843D"
};

const typeIcons: Record<SimulationEventType, React.ReactNode> = {
  ai_alert: <Brain size={16} />,
  risk_warning: <AlertTriangle size={16} />,
  opportunity: <Lightbulb size={16} />,
  prediction: <TrendingUp size={16} />,
  safe_anomaly: <GitBranch size={16} />,
  value_milestone: <Target size={16} />,
  action_required: <Zap size={16} />
};

interface AlertsFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

type AlertCategory = 'PMO' | 'VRO' | 'Other';

function categorizeEvent(event: SimulationEvent): AlertCategory {
  if (!event.relatedEntity) return 'Other';
  
  if (event.relatedEntity.type === 'project') {
    return 'PMO';
  } else if (event.relatedEntity.type === 'program' || event.relatedEntity.type === 'portfolio') {
    return 'VRO';
  }
  return 'Other';
}

const categoryColors: Record<AlertCategory, { bg: string; border: string; text: string }> = {
  PMO: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  VRO: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  Other: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
};

const categoryDescriptions: Record<AlertCategory, string> = {
  PMO: 'Project Management Office',
  VRO: 'Value Realization Office',
  Other: 'Risks & Issues'
};

export function AlertsFlyout({ isOpen, onClose }: AlertsFlyoutProps) {
  const { events, setSelectedEvent, markAsRead, unreadCount } = useSimulation();

  const handleEventClick = (event: SimulationEvent) => {
    markAsRead(event.id);
    setSelectedEvent(event);
    onClose();
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const categorizedEvents = events.reduce((acc, event) => {
    const category = categorizeEvent(event);
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<AlertCategory, SimulationEvent[]>);
  
  const categoryOrder: AlertCategory[] = ['PMO', 'VRO', 'Other'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-[420px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            data-testid="alerts-flyout"
          >
            <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain size={24} />
                  <div>
                    <h2 className="font-bold text-lg">AI Alerts Center</h2>
                    <p className="text-sm text-white/80">{unreadCount} unread alerts</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                  data-testid="close-alerts-flyout"
                >
                  <X size={20} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No alerts yet</p>
                    <p className="text-sm">AI is analyzing your portfolio...</p>
                  </div>
                ) : (
                  categoryOrder.map((category) => {
                    const categoryEvents = categorizedEvents[category];
                    if (!categoryEvents || categoryEvents.length === 0) return null;
                    
                    const colors = categoryColors[category];
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className={`px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold text-sm ${colors.text}`}>{category}</span>
                            <span className={`text-xs ${colors.text}`}>{categoryDescriptions[category]}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{categoryEvents.length} alert{categoryEvents.length !== 1 ? 's' : ''}</span>
                        </div>
                        
                        {categoryEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.01, x: 4 }}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ml-2 ${
                              !event.read 
                                ? 'bg-purple-50 border-purple-200' 
                                : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                            style={{ borderLeftColor: priorityColors[event.priority], borderLeftWidth: 4 }}
                            onClick={() => handleEventClick(event)}
                            data-testid={`alert-item-${event.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="p-2 rounded-lg text-white flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: priorityColors[event.priority] }}
                              >
                                {typeIcons[event.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    className="text-white text-[10px]"
                                    style={{ backgroundColor: priorityColors[event.priority] }}
                                  >
                                    {event.priority.toUpperCase()}
                                  </Badge>
                                  {!event.read && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  )}
                                  <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                                    <Clock size={10} />
                                    {formatTime(event.timestamp)}
                                  </span>
                                </div>
                                <p className="font-semibold text-sm leading-tight mb-1">{event.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{event.message}</p>
                                {event.relatedEntity && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">
                                      {event.relatedEntity.bu}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {event.relatedEntity.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-2" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-center text-muted-foreground">
                New alerts appear every 3-7 minutes. Click any alert for details.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
