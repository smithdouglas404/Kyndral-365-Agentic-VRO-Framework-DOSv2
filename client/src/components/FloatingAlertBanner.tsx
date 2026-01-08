import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Lightbulb, TrendingUp, GitBranch, Zap, Target, X, Bell } from 'lucide-react';
import { useSimulation } from '@/contexts/SimulationContext';
import { SimulationEvent } from '@/lib/liveSimulation';
import { Badge } from '@/components/ui/badge';

const priorityColors: Record<string, string> = {
  critical: "#D50032",
  high: "#f59e0b",
  medium: "#005EB8",
  low: "#00843D"
};

const typeIcons: Record<string, React.ReactNode> = {
  ai_alert: <Brain size={16} />,
  risk_warning: <AlertTriangle size={16} />,
  opportunity: <Lightbulb size={16} />,
  prediction: <TrendingUp size={16} />,
  safe_anomaly: <GitBranch size={16} />,
  value_milestone: <Target size={16} />,
  action_required: <Zap size={16} />
};

interface FloatingAlertBannerProps {
  onOpenFlyout?: () => void;
}

export function FloatingAlertBanner({ onOpenFlyout }: FloatingAlertBannerProps) {
  const { latestEvent, setSelectedEvent, unreadCount, markAsRead } = useSimulation();
  const [showBanner, setShowBanner] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SimulationEvent | null>(null);

  useEffect(() => {
    if (latestEvent && (latestEvent.priority === 'critical' || latestEvent.priority === 'high')) {
      setCurrentEvent(latestEvent);
      setShowBanner(true);
      
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [latestEvent]);

  const handleClick = () => {
    if (currentEvent) {
      markAsRead(currentEvent.id);
      setSelectedEvent(currentEvent);
      setShowBanner(false);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && currentEvent && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] cursor-pointer max-w-2xl w-[90%]"
            onClick={handleClick}
            data-testid="floating-alert-banner"
          >
            <motion.div
              className="rounded-xl shadow-2xl border-2 backdrop-blur-sm"
              style={{ 
                borderColor: priorityColors[currentEvent.priority],
                backgroundColor: `${priorityColors[currentEvent.priority]}15`
              }}
              animate={{ 
                boxShadow: [
                  `0 4px 20px ${priorityColors[currentEvent.priority]}40`,
                  `0 4px 40px ${priorityColors[currentEvent.priority]}60`,
                  `0 4px 20px ${priorityColors[currentEvent.priority]}40`
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="p-4 flex items-start gap-3">
                <motion.div
                  className="p-2 rounded-lg text-white flex-shrink-0"
                  style={{ backgroundColor: priorityColors[currentEvent.priority] }}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  {typeIcons[currentEvent.type]}
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      className="text-white text-[10px]"
                      style={{ backgroundColor: priorityColors[currentEvent.priority] }}
                    >
                      {currentEvent.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{currentEvent.source}</span>
                  </div>
                  <p className="font-semibold text-sm leading-tight">{currentEvent.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{currentEvent.message}</p>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
              
              <motion.div 
                className="h-1 rounded-b-xl"
                style={{ backgroundColor: priorityColors[currentEvent.priority] }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-full bg-purple-600 text-white shadow-lg flex items-center gap-2"
            onClick={() => {
              if (onOpenFlyout) {
                onOpenFlyout();
              } else if (latestEvent) {
                markAsRead(latestEvent.id);
                setSelectedEvent(latestEvent);
              }
            }}
            animate={{ 
              boxShadow: [
                "0 4px 20px rgba(147, 51, 234, 0.4)",
                "0 4px 40px rgba(147, 51, 234, 0.6)",
                "0 4px 20px rgba(147, 51, 234, 0.4)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            data-testid="alert-fab"
          >
            <Bell size={20} />
            <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>
          </motion.button>
        </motion.div>
      )}
    </>
  );
}
