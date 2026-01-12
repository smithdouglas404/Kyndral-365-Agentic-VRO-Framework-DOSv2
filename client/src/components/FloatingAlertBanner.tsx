import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Lightbulb, TrendingUp, GitBranch, Zap, Target, X } from 'lucide-react';
import { useSimulation } from '@/contexts/SimulationContext';
import { SimulationEvent } from '@/lib/liveSimulation';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

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

export function FloatingAlertBanner() {
  const [location] = useLocation();
  const { latestEvent, setSelectedEvent, unreadCount, markAsRead } = useSimulation();
  const [showBanner, setShowBanner] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SimulationEvent | null>(null);
  
  // Show on dashboard and division pages
  const shouldShowBanner = location && (
    location === '/dashboard' || 
    location.startsWith('/dashboard/') || 
    location.startsWith('/division/') ||
    location.startsWith('/project/')
  );

  useEffect(() => {
    if (latestEvent) {
      setCurrentEvent(latestEvent);
      setShowBanner(true);
      
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 5000);
      
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

  // Only show on specified pages
  if (!shouldShowBanner) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showBanner && currentEvent && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] cursor-pointer w-auto max-w-lg"
            onClick={handleClick}
            data-testid="floating-alert-banner"
          >
            <motion.div
              className="shadow-xl bg-white rounded-lg border-l-4"
              style={{ 
                borderColor: priorityColors[currentEvent.priority],
                boxShadow: `0 4px 20px rgba(0,0,0,0.15)`
              }}
            >
              <div className="px-4 py-3 flex items-start gap-3">
                <div
                  className="p-2 rounded-lg text-white flex-shrink-0"
                  style={{ backgroundColor: priorityColors[currentEvent.priority] }}
                >
                  {typeIcons[currentEvent.type]}
                </div>
                
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
                className="h-1 rounded-b-lg"
                style={{ backgroundColor: priorityColors[currentEvent.priority] }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
