import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertTriangle, TrendingUp, Lightbulb, Zap, Activity, ChevronLeft, ChevronRight, GitBranch, Target } from "lucide-react";
import { useSimulation } from "@/contexts/SimulationContext";
import { SimulationEvent, SimulationEventType } from "@/lib/liveSimulation";

const typeIcons: Record<SimulationEventType, React.ReactNode> = {
  ai_alert: <Brain size={14} className="text-purple-500" />,
  risk_warning: <AlertTriangle size={14} className="text-red-500" />,
  opportunity: <Lightbulb size={14} className="text-green-500" />,
  prediction: <TrendingUp size={14} className="text-blue-500" />,
  safe_anomaly: <GitBranch size={14} className="text-amber-500" />,
  value_milestone: <Target size={14} className="text-teal-500" />,
  action_required: <Zap size={14} className="text-orange-500" />
};

export function AIAlertTicker() {
  const { events, setSelectedEvent, isRunning, latestEvent, unreadCount } = useSimulation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  
  useEffect(() => {
    if (latestEvent && isLive) {
      setCurrentIndex(0);
      setAnimationKey(k => k + 1);
    }
  }, [latestEvent, isLive]);
  
  useEffect(() => {
    if (!isLive || events.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % events.length);
      setAnimationKey(k => k + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [events.length, isLive]);
  
  const currentEvent = events[currentIndex];
  const totalEvents = events.length;
  
  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % totalEvents);
    setAnimationKey(k => k + 1);
  };
  
  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + totalEvents) % totalEvents);
    setAnimationKey(k => k + 1);
  };

  const handleEventClick = () => {
    if (currentEvent) {
      setSelectedEvent(currentEvent);
    }
  };
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700 shadow-md">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
      
      <div className="flex items-center gap-3 p-3 relative">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 text-slate-300 rounded text-xs font-normal border border-slate-600/50">
          <motion.div
            animate={isRunning && isLive ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : { scale: 1, opacity: 1 }}
            transition={{ duration: 2, repeat: isRunning && isLive ? Infinity : 0, ease: "easeInOut" }}
          >
            <Activity size={11} className={isRunning && isLive ? "text-green-400" : "text-slate-400"} />
          </motion.div>
          <span className="text-[11px]">
            {isRunning && isLive ? "System Active" : "System Paused"}
          </span>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] px-1.5 rounded-full ml-1">{unreadCount}</span>
          )}
        </div>
        
        <div 
          className="flex-1 min-w-0 h-6 overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleEventClick}
          data-testid="alert-ticker-content"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEvent?.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 absolute inset-0"
            >
              {currentEvent && (
                <>
                  {typeIcons[currentEvent.type]}
                  <span className="text-sm text-white truncate">
                    <span className="text-slate-400 font-medium">{currentEvent.relatedEntity?.name || currentEvent.source}:</span>{" "}
                    {currentEvent.message}
                  </span>
                  {!currentEvent.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            aria-label="Previous alert"
            data-testid="alert-prev"
          >
            <ChevronLeft size={14} className="text-slate-400" />
          </button>
          
          <span className="text-xs text-slate-400 min-w-[40px] text-center">
            {totalEvents > 0 ? `${currentIndex + 1}/${totalEvents}` : '0/0'}
          </span>
          
          <button
            onClick={goNext}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            aria-label="Next alert"
            data-testid="alert-next"
          >
            <ChevronRight size={14} className="text-slate-400" />
          </button>
          
          <button
            onClick={() => {
              setIsLive(!isLive);
              if (!isLive) setAnimationKey(k => k + 1);
            }}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              isLive ? "bg-green-500/20 text-green-400" : "bg-slate-600 text-slate-400"
            }`}
            data-testid="alert-toggle-live"
          >
            {isLive ? "LIVE" : "PAUSED"}
          </button>
        </div>
      </div>
      
      {isLive && (
        <motion.div
          key={animationKey}
          className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "linear" }}
        />
      )}

      {!isLive && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-700" />
      )}
    </div>
  );
}
