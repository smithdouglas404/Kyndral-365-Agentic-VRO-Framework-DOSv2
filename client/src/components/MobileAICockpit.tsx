import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  liveAIAlerts, 
  executivePersonas, 
  analyzeSentiment,
  AIAlert
} from "@/lib/agenticOrchestration";
import { 
  Brain, 
  Bell, 
  Mic, 
  MicOff,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Volume2,
  Home,
  Target,
  Shield,
  Leaf,
  Users,
  ChevronRight,
  Eye,
  EyeOff,
  Clock,
  X as XIcon
} from "lucide-react";

// STRICT Mobile-only colors (L&G Design System - Art of the Possible section only)
const MOBILE = {
  red: "#C50B30",
  blue: "#007FAA",
  grey: "#F6F6F6",
  white: "#FFFFFF",
  dark: "#1a1a1a",
};

type MobileTab = "home" | "alerts" | "voice" | "sentiment";

// Scenario presets for quick demo navigation
const DEMO_SCENARIOS = [
  { id: "critical", label: "Critical", icon: AlertTriangle, color: MOBILE.red },
  { id: "opportunities", label: "Opportunities", icon: Target, color: MOBILE.blue },
  { id: "climate", label: "Climate", icon: Leaf, color: "#00843D" },
  { id: "risk", label: "Risk", icon: Shield, color: MOBILE.red },
];

// Presenter talking points for each section
const PRESENTER_NOTES: Record<MobileTab, string[]> = {
  home: [
    "This is the AI Command Center - your executive's daily starting point",
    "Notice the real-time critical alerts count updating",
    "One tap to drill into any metric or start voice interaction",
    "Personalized to each executive's portfolio and priorities",
  ],
  alerts: [
    "AI-curated alerts ranked by business impact, not just urgency",
    "Swipe left to dismiss, right to take action",
    "Each alert includes AI insight explaining WHY it matters",
    "Tap any card to see recommended actions and data context",
  ],
  voice: [
    "Natural language interaction - no training required",
    "Ask about risks, opportunities, or get briefed on any topic",
    "Voice commands trigger real-time data queries",
    "Hands-free operation for executives on the move",
  ],
  sentiment: [
    "Paste any text - meeting notes, emails, stakeholder feedback",
    "AI detects tone, risk signals, and key themes",
    "Identifies escalation triggers before they become issues",
    "Integrates with governance workflows for proactive management",
  ],
};

// Voice command scenarios for demo
const VOICE_SCENARIOS = [
  { trigger: "Show critical alerts", response: "Showing 2 critical alerts requiring immediate attention", action: "alerts" as MobileTab },
  { trigger: "Brief me on climate risks", response: "Climate exposure at £2.4B. Stranded asset risk flagged in energy portfolio", action: "alerts" as MobileTab },
  { trigger: "What's the sentiment on the merger?", response: "Stakeholder sentiment trending negative. 3 risk flags detected in recent communications", action: "sentiment" as MobileTab },
  { trigger: "Show opportunities pipeline", response: "4 high-value opportunities identified. Combined value £180M", action: "alerts" as MobileTab },
  { trigger: "Run governance health check", response: "Governance score: 87%. 2 controls require attestation this week", action: "home" as MobileTab },
];

interface MobileAICockpitProps {
  onAlertAction?: (alertId: string) => void;
  currentPhase?: number;
  scenarioMode?: "asIs" | "toBe";
  externalVoiceActive?: boolean;
  externalVoiceResponse?: string;
  onTabChange?: (tab: MobileTab) => void;
}

function getSeverityColor(severity: AIAlert["severity"]) {
  switch (severity) {
    case "critical": return MOBILE.red;
    case "warning": return MOBILE.blue;
    case "info": return MOBILE.dark;
  }
}

function getTypeIcon(type: AIAlert["type"]) {
  switch (type) {
    case "opportunity": return <Target size={14} />;
    case "risk": return <Shield size={14} />;
    case "performance": return <TrendingUp size={14} />;
    case "climate": return <Leaf size={14} />;
    case "compliance": return <CheckCircle size={14} />;
    case "governance": return <Users size={14} />;
  }
}

type ScenarioFilter = "all" | "critical" | "opportunities" | "climate" | "risk";

// Phase-specific content for the mobile experience
const PHASE_CONTENT = [
  { title: "Strategic Alignment", highlight: "Baseline capture complete", metric: "£2.4B under management" },
  { title: "Value Discovery", highlight: "12 opportunities identified", metric: "£180M potential value" },
  { title: "Delivery Excellence", highlight: "4 programs on track", metric: "92% milestone hit rate" },
  { title: "Continuous Improvement", highlight: "AI insights active", metric: "37% efficiency gain" },
  { title: "Value Realization", highlight: "Benefits captured", metric: "£156M realized" },
];

export function MobileAICockpit({ 
  onAlertAction, 
  currentPhase = 0, 
  scenarioMode = "toBe",
  externalVoiceActive,
  externalVoiceResponse,
  onTabChange
}: MobileAICockpitProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceResponse, setVoiceResponse] = useState("");
  const [sentimentInput, setSentimentInput] = useState("");
  const [sentimentResult, setSentimentResult] = useState<ReturnType<typeof analyzeSentiment> | null>(null);
  const [alertActions, setAlertActions] = useState<Record<string, boolean>>({});
  const [presenterMode, setPresenterMode] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [voiceScenarioIndex, setVoiceScenarioIndex] = useState(0);
  const [swipedAlerts, setSwipedAlerts] = useState<Set<string>>(new Set());
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilter>("all");
  const [pulseActive, setPulseActive] = useState(true);
  
  // Sync external voice state
  const effectiveListening = externalVoiceActive !== undefined ? externalVoiceActive : isListening;
  const effectiveVoiceResponse = externalVoiceResponse || voiceResponse;

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const phaseContent = PHASE_CONTENT[currentPhase] || PHASE_CONTENT[0];

  const baseAlerts = liveAIAlerts.filter(a => !alertActions[a.id] && !swipedAlerts.has(a.id));
  
  // Apply scenario-specific filtering
  const pendingAlerts = baseAlerts.filter(alert => {
    if (scenarioFilter === "all") return true;
    if (scenarioFilter === "critical") return alert.severity === "critical";
    if (scenarioFilter === "opportunities") return alert.type === "opportunity";
    if (scenarioFilter === "climate") return alert.type === "climate";
    if (scenarioFilter === "risk") return alert.type === "risk";
    return true;
  });
  
  const criticalCount = baseAlerts.filter(a => a.severity === "critical").length;

  const handleVoiceCommand = () => {
    if (!effectiveListening) {
      setIsListening(true);
      setVoiceTranscript("Listening...");
      setVoiceResponse("");

      setTimeout(() => {
        const scenario = VOICE_SCENARIOS[voiceScenarioIndex];
        setVoiceTranscript(scenario.trigger);
        setVoiceResponse(scenario.response);
        
        setTimeout(() => {
          handleTabChange(scenario.action);
          setIsListening(false);
          setVoiceScenarioIndex((voiceScenarioIndex + 1) % VOICE_SCENARIOS.length);
        }, 1500);
      }, 1500);
    } else {
      setIsListening(false);
      setVoiceTranscript("");
      setVoiceResponse("");
    }
  };

  const handleSentimentAnalysis = () => {
    if (sentimentInput.trim()) {
      const result = analyzeSentiment(sentimentInput);
      setSentimentResult(result);
    }
  };

  const handleAlertSwipe = (alertId: string, direction: "left" | "right") => {
    if (direction === "right") {
      setAlertActions(prev => ({ ...prev, [alertId]: true }));
      onAlertAction?.(alertId);
    } else {
      setSwipedAlerts(prev => new Set(Array.from(prev).concat(alertId)));
    }
  };

  const handleScenarioJump = (scenarioId: string) => {
    setScenarioFilter(scenarioId as ScenarioFilter);
    handleTabChange("alerts");
    setCurrentNoteIndex(0);
  };

  const nextPresenterNote = () => {
    const notes = PRESENTER_NOTES[activeTab];
    setCurrentNoteIndex((currentNoteIndex + 1) % notes.length);
  };

  const renderPresenterOverlay = () => {
    if (!presenterMode) return null;
    const notes = PRESENTER_NOTES[activeTab];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-10 left-2 right-2 z-50 p-3 rounded-lg shadow-lg"
        style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 mb-1">Talking Point {currentNoteIndex + 1}/{notes.length}</p>
            <p className="text-xs text-white">{notes[currentNoteIndex]}</p>
          </div>
          <button 
            onClick={nextPresenterNote}
            className="p-1 rounded bg-white/20"
          >
            <ChevronRight size={14} className="text-white" />
          </button>
        </div>
        <div className="flex gap-1 mt-2">
          {notes.map((_, i) => (
            <div 
              key={i} 
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i === currentNoteIndex ? MOBILE.blue : "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>
      </motion.div>
    );
  };

  const renderHome = () => (
    <div className="space-y-3">
      {/* Phase Indicator Banner */}
      <motion.div
        key={`phase-${currentPhase}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-2 rounded-lg text-center"
        style={{ backgroundColor: scenarioMode === "toBe" ? MOBILE.blue : "#757575" }}
      >
        <p className="text-[10px] text-white/80">Phase {currentPhase + 1}: {phaseContent.title}</p>
        <p className="text-xs font-bold text-white">{phaseContent.highlight}</p>
      </motion.div>

      {/* Hero Stats */}
      <div 
        className="p-4 rounded-xl shadow-sm"
        style={{ 
          background: `linear-gradient(135deg, ${MOBILE.blue}15 0%, ${MOBILE.red}10 100%)`,
          border: `1px solid ${MOBILE.blue}20`
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.div 
            className="w-12 h-12 rounded-full flex items-center justify-center relative"
            style={{ backgroundColor: MOBILE.blue }}
            animate={pulseActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Brain size={24} color={MOBILE.white} />
            {/* Live pulse indicator */}
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
              style={{ backgroundColor: "#00843D" }}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </motion.div>
          <div>
            <h2 className="font-bold text-base" style={{ color: MOBILE.dark }}>
              {scenarioMode === "toBe" ? "AI-Powered View" : "Traditional View"}
            </h2>
            <p className="text-xs text-gray-500">
              {scenarioMode === "toBe" ? "Your AI briefing is ready" : "Manual dashboard mode"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div 
            className="p-3 rounded-lg text-center cursor-pointer transition-transform active:scale-95"
            style={{ backgroundColor: criticalCount > 0 ? MOBILE.red : MOBILE.grey }}
            onClick={() => handleTabChange("alerts")}
            data-testid="mobile-stat-critical"
          >
            <p className="font-bold text-xl" style={{ color: criticalCount > 0 ? MOBILE.white : MOBILE.red }}>
              {criticalCount}
            </p>
            <p className="text-[10px]" style={{ color: criticalCount > 0 ? MOBILE.white : "gray" }}>Critical</p>
          </div>
          <div 
            className="p-3 rounded-lg text-center cursor-pointer transition-transform active:scale-95"
            style={{ backgroundColor: MOBILE.white }}
            onClick={() => handleTabChange("alerts")}
          >
            <p className="font-bold text-xl" style={{ color: MOBILE.blue }}>{pendingAlerts.length}</p>
            <p className="text-[10px] text-gray-500">Alerts</p>
          </div>
          <div 
            className="p-3 rounded-lg text-center cursor-pointer transition-transform active:scale-95"
            style={{ backgroundColor: MOBILE.white }}
            onClick={() => handleTabChange("voice")}
          >
            <p className="font-bold text-xl" style={{ color: MOBILE.blue }}>AI</p>
            <p className="text-[10px] text-gray-500">Ready</p>
          </div>
        </div>
      </div>

      {/* Scenario Jump Chips */}
      <div>
        <p className="text-[10px] font-medium text-gray-500 mb-2">QUICK ACCESS</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DEMO_SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => handleScenarioJump(scenario.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-transform active:scale-95"
              style={{ backgroundColor: scenario.color + "15", color: scenario.color }}
              data-testid={`mobile-scenario-${scenario.id}`}
            >
              <scenario.icon size={12} />
              <span className="text-xs font-medium">{scenario.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Alert Card - Swipeable */}
      {pendingAlerts[0] && (
        <div>
          <p className="text-[10px] font-medium text-gray-500 mb-2">TOP PRIORITY</p>
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.x > 100) handleAlertSwipe(pendingAlerts[0].id, "right");
              if (info.offset.x < -100) handleAlertSwipe(pendingAlerts[0].id, "left");
            }}
            className="p-4 rounded-xl border-l-4 cursor-grab active:cursor-grabbing shadow-sm"
            style={{ 
              borderLeftColor: getSeverityColor(pendingAlerts[0].severity),
              backgroundColor: MOBILE.white 
            }}
            data-testid="mobile-top-alert"
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: getSeverityColor(pendingAlerts[0].severity) + "20" }}
              >
                {getTypeIcon(pendingAlerts[0].type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    className="text-[10px] py-0 px-1.5 text-white"
                    style={{ backgroundColor: getSeverityColor(pendingAlerts[0].severity) }}
                  >
                    {pendingAlerts[0].severity}
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    {executivePersonas.find(p => p.id === pendingAlerts[0].targetPersona)?.role}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">{pendingAlerts[0].title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pendingAlerts[0].message}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <Clock size={10} />
                <span>Just now</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] text-gray-400">← Dismiss</span>
                <span className="text-[10px]" style={{ color: MOBILE.blue }}>Action →</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="p-4 rounded-xl flex flex-col items-center gap-2 transition-transform active:scale-95 shadow-sm"
          style={{ backgroundColor: MOBILE.blue }}
          onClick={handleVoiceCommand}
          data-testid="mobile-quick-voice"
        >
          <Mic size={24} color={MOBILE.white} />
          <span className="text-xs font-medium text-white">Voice Command</span>
        </button>
        <button
          className="p-4 rounded-xl flex flex-col items-center gap-2 transition-transform active:scale-95 shadow-sm"
          style={{ backgroundColor: MOBILE.white }}
          onClick={() => handleTabChange("sentiment")}
          data-testid="mobile-quick-sentiment"
        >
          <Sparkles size={24} style={{ color: MOBILE.blue }} />
          <span className="text-xs font-medium">Analyze Text</span>
        </button>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base" style={{ color: MOBILE.dark }}>AI Alerts</h3>
        <div className="flex items-center gap-2">
          <Badge style={{ backgroundColor: MOBILE.red }} className="text-white text-xs">
            {criticalCount} critical
          </Badge>
          <Badge variant="outline" className="text-xs">
            {pendingAlerts.length} showing
          </Badge>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {scenarioFilter !== "all" && (
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: MOBILE.blue + "15" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: MOBILE.blue }}>
              Filtered: {scenarioFilter.charAt(0).toUpperCase() + scenarioFilter.slice(1)}
            </span>
          </div>
          <button 
            onClick={() => setScenarioFilter("all")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ backgroundColor: MOBILE.blue, color: MOBILE.white }}
          >
            <XIcon size={10} />
            Clear
          </button>
        </div>
      )}

      {/* Swipe hint */}
      <div className="flex items-center justify-center gap-4 py-2 text-[10px] text-gray-400">
        <span>← Swipe to dismiss</span>
        <span>Swipe to action →</span>
      </div>

      {/* Swipeable Alert Stack */}
      <div className="space-y-3">
        <AnimatePresence>
          {pendingAlerts.map((alert, index) => {
            const persona = executivePersonas.find(p => p.id === alert.targetPersona);
            
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                onDragEnd={(_, info: PanInfo) => {
                  if (info.offset.x > 80) handleAlertSwipe(alert.id, "right");
                  if (info.offset.x < -80) handleAlertSwipe(alert.id, "left");
                }}
                className="p-3 rounded-xl border-l-4 cursor-grab active:cursor-grabbing shadow-sm"
                style={{ 
                  borderLeftColor: getSeverityColor(alert.severity),
                  backgroundColor: MOBILE.white 
                }}
                data-testid={`mobile-alert-${alert.id}`}
              >
                <div className="flex items-start gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: getSeverityColor(alert.severity) + "20" }}
                  >
                    {getTypeIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <Badge 
                        className="text-[10px] py-0 px-1 text-white"
                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-[10px] text-gray-400">{persona?.role}</span>
                    </div>
                    <p className="text-xs font-medium">{alert.title}</p>
                    
                    {/* AI Insight */}
                    <div 
                      className="mt-2 p-2 rounded-lg text-[10px]"
                      style={{ backgroundColor: MOBILE.blue + "10" }}
                    >
                      <div className="flex items-start gap-1">
                        <Sparkles size={10} style={{ color: MOBILE.blue }} className="shrink-0 mt-0.5" />
                        <p style={{ color: MOBILE.blue }}>{alert.insight}</p>
                      </div>
                    </div>
                    
                    {/* Data Points */}
                    <div className="flex gap-2 mt-2">
                      {alert.dataPoints.slice(0, 3).map((dp, i) => (
                        <div key={i} className="flex items-center gap-0.5 text-[10px]">
                          {dp.trend === "up" ? (
                            <TrendingUp size={8} className="text-green-500" />
                          ) : dp.trend === "down" ? (
                            <TrendingDown size={8} style={{ color: MOBILE.red }} />
                          ) : null}
                          <span className="font-medium">{dp.value}</span>
                          <span className="text-gray-400">{dp.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {pendingAlerts.length === 0 && (
          <div className="text-center py-12">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: MOBILE.blue + "15" }}
            >
              <CheckCircle size={32} style={{ color: MOBILE.blue }} />
            </div>
            <p className="text-sm font-medium">All clear!</p>
            <p className="text-xs text-gray-500 mt-1">All alerts have been actioned</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderVoice = () => (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <h3 className="font-bold text-base mb-1" style={{ color: MOBILE.dark }}>Voice Commands</h3>
        <p className="text-xs text-gray-500">Speak naturally to your AI assistant</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          className="relative"
          animate={effectiveListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {/* Pulse rings */}
          {effectiveListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: MOBILE.red }}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: MOBILE.red }}
                animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              />
            </>
          )}
          <button
            className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: effectiveListening ? MOBILE.red : MOBILE.blue }}
            onClick={handleVoiceCommand}
            data-testid="mobile-voice-button"
          >
            {effectiveListening ? (
              <MicOff size={44} color={MOBILE.white} />
            ) : (
              <Mic size={44} color={MOBILE.white} />
            )}
          </button>
        </motion.div>

        <p className="text-sm font-medium mt-4 mb-2" style={{ color: MOBILE.dark }}>
          {effectiveListening ? "Listening..." : "Tap to speak"}
        </p>

        {voiceTranscript && voiceTranscript !== "Listening..." && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-4 rounded-xl mb-3 shadow-sm"
            style={{ backgroundColor: MOBILE.white }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Volume2 size={14} style={{ color: MOBILE.blue }} />
              <span className="text-xs font-medium">You said:</span>
            </div>
            <p className="text-sm italic">"{voiceTranscript}"</p>
          </motion.div>
        )}

        {effectiveVoiceResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-4 rounded-xl shadow-sm"
            style={{ backgroundColor: MOBILE.blue + "15" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} style={{ color: MOBILE.blue }} />
              <span className="text-xs font-medium" style={{ color: MOBILE.blue }}>AI Response:</span>
            </div>
            <p className="text-sm" style={{ color: MOBILE.blue }}>{effectiveVoiceResponse}</p>
          </motion.div>
        )}
      </div>

      {/* Suggested commands */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <p className="text-[10px] font-medium text-gray-500 mb-2">SUGGESTED COMMANDS</p>
        <div className="space-y-2">
          {VOICE_SCENARIOS.slice(0, 3).map((scenario, i) => (
            <button
              key={i}
              onClick={() => {
                setVoiceScenarioIndex(i);
                handleVoiceCommand();
              }}
              className="w-full p-2 rounded-lg text-left text-xs transition-all active:scale-98"
              style={{ backgroundColor: MOBILE.grey }}
            >
              "{scenario.trigger}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSentiment = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="font-bold text-base mb-1" style={{ color: MOBILE.dark }}>Sentiment Analysis</h3>
        <p className="text-xs text-gray-500">AI-powered text analysis for risk detection</p>
      </div>

      <textarea
        className="w-full p-4 border rounded-xl text-sm resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ 
          backgroundColor: MOBILE.white,
          borderColor: MOBILE.grey
        }}
        rows={4}
        placeholder="Paste meeting notes, emails, stakeholder feedback..."
        value={sentimentInput}
        onChange={(e) => setSentimentInput(e.target.value)}
        data-testid="mobile-sentiment-input"
      />

      <button
        className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-sm"
        style={{ backgroundColor: MOBILE.blue }}
        onClick={handleSentimentAnalysis}
        data-testid="mobile-sentiment-analyze"
      >
        <Sparkles size={16} />
        Analyze Sentiment
      </button>

      {sentimentResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl shadow-sm"
          style={{ backgroundColor: MOBILE.white }}
          data-testid="mobile-sentiment-result"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Overall Sentiment</span>
            <Badge 
              className="text-xs text-white px-2"
              style={{ 
                backgroundColor: sentimentResult.score > 0.2 ? "#00843D" : 
                                sentimentResult.score < -0.2 ? MOBILE.red : MOBILE.dark 
              }}
            >
              {sentimentResult.score > 0.2 ? "Positive" : 
               sentimentResult.score < -0.2 ? "Negative" : "Neutral"}
            </Badge>
          </div>

          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
            <motion.div 
              className="absolute h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(sentimentResult.score + 1) * 50}%` }}
              style={{ 
                backgroundColor: sentimentResult.score > 0 ? "#00843D" : MOBILE.red
              }}
            />
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400" />
          </div>

          {sentimentResult.keywords.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Key Themes</p>
              <div className="flex flex-wrap gap-1">
                {sentimentResult.keywords.slice(0, 6).map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {sentimentResult.riskFlags.length > 0 && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: MOBILE.red + "10" }}>
              <p className="text-xs font-medium mb-2" style={{ color: MOBILE.red }}>
                <AlertTriangle size={12} className="inline mr-1" />
                Risk Flags Detected
              </p>
              <div className="flex flex-wrap gap-1">
                {sentimentResult.riskFlags.map((flag, i) => (
                  <Badge 
                    key={i} 
                    className="text-xs text-white"
                    style={{ backgroundColor: MOBILE.red }}
                  >
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col relative" style={{ backgroundColor: MOBILE.grey }}>
      {/* Status Bar */}
      <div 
        className="h-10 px-4 flex items-center justify-between text-xs shrink-0"
        style={{ backgroundColor: MOBILE.red, color: MOBILE.white }}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">9:41</span>
        </div>
        <span className="font-semibold">NEE AI Cockpit</span>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px]">{criticalCount}</span>
            </div>
          )}
          <button 
            onClick={() => setPresenterMode(!presenterMode)}
            className="p-1 rounded"
            style={{ backgroundColor: presenterMode ? "rgba(255,255,255,0.2)" : "transparent" }}
            data-testid="mobile-presenter-toggle"
          >
            {presenterMode ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Presenter Overlay */}
      <AnimatePresence>
        {presenterMode && renderPresenterOverlay()}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === "home" && renderHome()}
            {activeTab === "alerts" && renderAlerts()}
            {activeTab === "voice" && renderVoice()}
            {activeTab === "sentiment" && renderSentiment()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div 
        className="h-16 flex items-center justify-around shrink-0 border-t shadow-lg"
        style={{ backgroundColor: MOBILE.white }}
      >
        {[
          { id: "home" as MobileTab, icon: Home, label: "Home" },
          { id: "alerts" as MobileTab, icon: Bell, label: "Alerts", badge: criticalCount },
          { id: "voice" as MobileTab, icon: Mic, label: "Voice" },
          { id: "sentiment" as MobileTab, icon: Sparkles, label: "Analyze" },
        ].map(item => (
          <button
            key={item.id}
            className="flex flex-col items-center gap-1 p-2 relative transition-transform active:scale-95"
            onClick={() => { handleTabChange(item.id); setCurrentNoteIndex(0); }}
            style={{ color: activeTab === item.id ? MOBILE.blue : "#1a1a1a60" }}
            data-testid={`mobile-nav-${item.id}`}
          >
            <div className="relative">
              <item.icon size={22} />
              {item.badge && item.badge > 0 && (
                <span 
                  className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] text-white flex items-center justify-center"
                  style={{ backgroundColor: MOBILE.red }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -bottom-1 w-8 h-1 rounded-full"
                style={{ backgroundColor: MOBILE.blue }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
