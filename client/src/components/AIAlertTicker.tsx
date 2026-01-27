import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertTriangle, TrendingUp, Lightbulb, Zap, Activity, ChevronLeft, ChevronRight, GitBranch, Target } from "lucide-react";
import { useActiveAlerts } from "@/hooks/useAlerts";

type AlertType = 'ai_alert' | 'risk_warning' | 'opportunity' | 'prediction' | 'safe_anomaly' | 'value_milestone' | 'action_required';

const typeIcons: Record<AlertType, React.ReactNode> = {
  ai_alert: <Brain size={14} className="text-purple-500" />,
  risk_warning: <AlertTriangle size={14} className="text-red-500" />,
  opportunity: <Lightbulb size={14} className="text-green-500" />,
  prediction: <TrendingUp size={14} className="text-blue-500" />,
  safe_anomaly: <GitBranch size={14} className="text-amber-500" />,
  value_milestone: <Target size={14} className="text-teal-500" />,
  action_required: <Zap size={14} className="text-orange-500" />
};

const severityToType: Record<string, AlertType> = {
  critical: 'action_required',
  high: 'risk_warning',
  medium: 'ai_alert',
  low: 'prediction'
};

export function AIAlertTicker() {
  const { data: alerts = [], isLoading } = useActiveAlerts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (alerts.length > 0 && isLive) {
      setCurrentIndex(0);
      setAnimationKey(k => k + 1);
    }
  }, [alerts.length, isLive]);

  useEffect(() => {
    if (!isLive || alerts.length === 0) return;
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

  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700 shadow-md">
        <div className="flex items-center gap-3 p-3">
          <Activity size={11} className="text-slate-400 animate-pulse" />
          <span className="text-xs text-slate-400">Loading alerts...</span>
        </div>
      </div>
    );
  }

  if (totalAlerts === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700 shadow-md">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="flex items-center gap-3 p-3 relative">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 text-slate-300 rounded text-xs font-normal border border-slate-600/50">
            <Activity size={11} className="text-slate-400" />
            <span className="text-[11px]">No Active Alerts</span>
          </div>
          <div className="flex-1 min-w-0 h-6 overflow-hidden relative">
            <span className="text-sm text-slate-400 italic">System healthy - no alerts</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-700" />
      </div>
    );
  }

  const alertType = currentAlert.severity
    ? severityToType[currentAlert.severity] || 'ai_alert'
    : 'ai_alert';

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700 shadow-md">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "20px 20px" }} />

      <div className="flex items-center gap-3 p-3 relative">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 text-slate-300 rounded text-xs font-normal border border-slate-600/50">
          <motion.div
            animate={isLive ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : { scale: 1, opacity: 1 }}
            transition={{ duration: 2, repeat: isLive ? Infinity : 0, ease: "easeInOut" }}
          >
            <Activity size={11} className={isLive ? "text-green-400" : "text-slate-400"} />
          </motion.div>
          <span className="text-[11px]">
            {isLive ? "Live Alerts" : "Paused"}
          </span>
          {totalAlerts > 0 && (
            <span className="bg-blue-500 text-white text-[10px] px-1.5 rounded-full ml-1">{totalAlerts}</span>
          )}
        </div>

        <div
          className="flex-1 min-w-0 h-6 overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity"
          data-testid="alert-ticker-content"
        >
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
                  {typeIcons[alertType]}
                  <span className="text-sm text-white truncate">
                    <span className="text-slate-400 font-medium">{currentAlert.source || 'System'}:</span>{" "}
                    {currentAlert.message || currentAlert.title}
                  </span>
                  {currentAlert.status === 'active' && (
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
            disabled={totalAlerts <= 1}
          >
            <ChevronLeft size={14} className="text-slate-400" />
          </button>

          <span className="text-xs text-slate-400 min-w-[40px] text-center">
            {totalAlerts > 0 ? `${currentIndex + 1}/${totalAlerts}` : '0/0'}
          </span>

          <button
            onClick={goNext}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            aria-label="Next alert"
            data-testid="alert-next"
            disabled={totalAlerts <= 1}
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
