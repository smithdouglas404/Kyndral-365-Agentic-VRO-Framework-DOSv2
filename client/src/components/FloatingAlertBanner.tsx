import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Lightbulb, TrendingUp, GitBranch, Zap, Target, X, DollarSign, Clock, Users, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface CommandCenterIntervention {
  id: string;
  type: 'dependency' | 'budget' | 'timeline' | 'resource' | 'quality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  confidence: string;
  suggestedAction: string;
  impact: string;
  status: string;
  agentSource: string;
  createdAt: string;
}

const priorityColors: Record<string, string> = {
  critical: "#D50032",
  high: "#f59e0b",
  medium: "#005EB8",
  low: "#00843D"
};

const typeIcons: Record<string, React.ReactNode> = {
  budget: <DollarSign size={16} />,
  timeline: <Clock size={16} />,
  resource: <Users size={16} />,
  dependency: <GitBranch size={16} />,
  quality: <Shield size={16} />,
  ai_alert: <Brain size={16} />,
  risk_warning: <AlertTriangle size={16} />,
  opportunity: <Lightbulb size={16} />,
  prediction: <TrendingUp size={16} />,
  safe_anomaly: <GitBranch size={16} />,
  value_milestone: <Target size={16} />,
  action_required: <Zap size={16} />
};

export function FloatingAlertBanner() {
  const [location, setLocation] = useLocation();
  const [showBanner, setShowBanner] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState<CommandCenterIntervention | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const lastShownIdRef = useRef<string | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Show on dashboard and division pages
  const shouldShowBanner = location && (
    location === '/dashboard' || 
    location.startsWith('/dashboard/') || 
    location.startsWith('/division/') ||
    location.startsWith('/project/')
  );

  // Poll Command Center for new interventions
  useEffect(() => {
    if (!shouldShowBanner) return;
    
    const fetchInterventions = async () => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      try {
        const response = await fetch('/api/interventions', {
          signal: abortControllerRef.current.signal
        });
        if (response.ok) {
          const data = await response.json();
          const interventions: CommandCenterIntervention[] = data.interventions || [];
          
          // Find newest pending intervention we haven't shown
          const pendingInterventions = interventions
            .filter(i => i.status === 'pending' && !seenIdsRef.current.has(i.id))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          if (pendingInterventions.length > 0) {
            const newest = pendingInterventions[0];
            if (lastShownIdRef.current !== newest.id) {
              // Clear any existing hide timeout
              if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
              }
              
              lastShownIdRef.current = newest.id;
              setCurrentIntervention(newest);
              setShowBanner(true);
              
              // Auto-hide after 6 seconds
              hideTimeoutRef.current = setTimeout(() => {
                setShowBanner(false);
                seenIdsRef.current.add(newest.id);
              }, 6000);
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.log('Command Center fetch error:', error);
        }
      }
    };

    fetchInterventions();
    const interval = setInterval(fetchInterventions, 10000); // Poll every 10 seconds
    
    return () => {
      clearInterval(interval);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [shouldShowBanner]);

  const handleClick = () => {
    if (currentIntervention) {
      seenIdsRef.current.add(currentIntervention.id);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setShowBanner(false);
      // Navigate to Command Center with intervention ID for deep-linking
      setLocation(`/command-center?highlight=${currentIntervention.id}`);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIntervention) {
      seenIdsRef.current.add(currentIntervention.id);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setShowBanner(false);
  };

  // Only show on specified pages
  if (!shouldShowBanner) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showBanner && currentIntervention && (
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
                borderColor: priorityColors[currentIntervention.severity],
                boxShadow: `0 4px 20px rgba(0,0,0,0.15)`
              }}
            >
              <div className="px-4 py-3 flex items-start gap-3">
                <div
                  className="p-2 rounded-lg text-white flex-shrink-0"
                  style={{ backgroundColor: priorityColors[currentIntervention.severity] }}
                >
                  {typeIcons[currentIntervention.type]}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      className="text-white text-[10px]"
                      style={{ backgroundColor: priorityColors[currentIntervention.severity] }}
                    >
                      {currentIntervention.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{currentIntervention.agentSource}</span>
                  </div>
                  <p className="font-semibold text-sm leading-tight">{currentIntervention.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{currentIntervention.description}</p>
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
                style={{ backgroundColor: priorityColors[currentIntervention.severity] }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
