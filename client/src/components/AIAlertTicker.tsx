import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertTriangle, TrendingUp, Sparkles, Zap, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { pmoProjects, vroPrograms, riskIssues } from "@/lib/buPrograms";

interface TickerAlert {
  id: string;
  type: "warning" | "opportunity" | "insight" | "prediction" | "action";
  message: string;
  source: string;
  timestamp: Date;
}

const icons: Record<TickerAlert["type"], React.ReactNode> = {
  warning: <AlertTriangle size={14} className="text-amber-500" />,
  opportunity: <TrendingUp size={14} className="text-green-500" />,
  insight: <Brain size={14} className="text-purple-500" />,
  prediction: <Sparkles size={14} className="text-blue-500" />,
  action: <Zap size={14} className="text-emerald-500" />
};

function generateAlerts(): TickerAlert[] {
  const alerts: TickerAlert[] = [];
  
  pmoProjects.forEach(project => {
    project.aiSignals.forEach((signal, i) => {
      alerts.push({
        id: `pmo-${project.id}-${i}`,
        type: signal.type,
        message: signal.message,
        source: project.name,
        timestamp: new Date(Date.now() - Math.random() * 3600000)
      });
    });
  });
  
  vroPrograms.forEach(program => {
    program.aiSignals.forEach((signal, i) => {
      alerts.push({
        id: `vro-${program.id}-${i}`,
        type: signal.type,
        message: signal.message,
        source: program.name,
        timestamp: new Date(Date.now() - Math.random() * 3600000)
      });
    });
  });
  
  riskIssues.filter(r => r.aiAlert).forEach(risk => {
    alerts.push({
      id: `risk-${risk.id}`,
      type: risk.severity === "critical" ? "warning" : "insight",
      message: risk.aiAlert!,
      source: risk.name,
      timestamp: new Date(Date.now() - Math.random() * 3600000)
    });
  });
  
  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function AIAlertTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const alerts = useMemo(() => generateAlerts(), []);
  const [isLive, setIsLive] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % alerts.length);
      setAnimationKey(k => k + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [alerts.length, isLive]);
  
  const currentAlert = alerts[currentIndex];
  const totalAlerts = alerts.length;
  
  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % totalAlerts);
    setAnimationKey(k => k + 1);
  };
  
  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + totalAlerts) % totalAlerts);
    setAnimationKey(k => k + 1);
  };
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700">
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
      
      <div className="flex items-center gap-3 p-3 relative">
        <motion.div
          className="flex items-center gap-2 px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium"
          animate={isLive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 2, repeat: isLive ? Infinity : 0 }}
        >
          <Activity size={12} />
          AI LIVE
        </motion.div>
        
        <div className="flex-1 min-w-0 h-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAlert?.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 absolute inset-0"
            >
              {currentAlert && (
                <>
                  {icons[currentAlert.type]}
                  <span className="text-sm text-white truncate">
                    <span className="text-slate-400 font-medium">{currentAlert.source}:</span>{" "}
                    {currentAlert.message}
                  </span>
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
          >
            <ChevronLeft size={14} className="text-slate-400" />
          </button>
          
          <span className="text-xs text-slate-400 min-w-[40px] text-center">
            {currentIndex + 1}/{totalAlerts}
          </span>
          
          <button
            onClick={goNext}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            aria-label="Next alert"
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
          >
            {isLive ? "LIVE" : "PAUSED"}
          </button>
        </div>
      </div>
      
      {isLive && (
        <motion.div
          key={animationKey}
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "linear" }}
        />
      )}
      
      {!isLive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-600" />
      )}
    </div>
  );
}
