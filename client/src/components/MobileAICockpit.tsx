import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Send,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  MessageSquare,
  Sparkles,
  Volume2,
  Home,
  Target,
  Shield,
  Leaf,
  Users,
  Check,
  X
} from "lucide-react";

// Mobile-only colors (L&G Design System - Art of the Possible section only)
const MOBILE = {
  red: "#C50B30",
  blue: "#007FAA",
  grey: "#F6F6F6",
  white: "#FFFFFF",
  dark: "#1a1a1a",
  teal: "#00843D",
};

type MobileTab = "home" | "alerts" | "voice" | "sentiment";

interface MobileAICockpitProps {
  onAlertAction?: (alertId: string) => void;
}

function getSeverityColor(severity: AIAlert["severity"]) {
  switch (severity) {
    case "critical": return MOBILE.red;
    case "warning": return "#FFC107";
    case "info": return MOBILE.blue;
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

export function MobileAICockpit({ onAlertAction }: MobileAICockpitProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceResponse, setVoiceResponse] = useState("");
  const [sentimentInput, setSentimentInput] = useState("");
  const [sentimentResult, setSentimentResult] = useState<ReturnType<typeof analyzeSentiment> | null>(null);
  const [alertActions, setAlertActions] = useState<Record<string, boolean>>({});
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const pendingAlerts = liveAIAlerts.filter(a => !alertActions[a.id]);
  const criticalCount = pendingAlerts.filter(a => a.severity === "critical").length;

  const handleVoiceCommand = () => {
    if (!isListening) {
      setIsListening(true);
      setVoiceTranscript("Listening...");
      setVoiceResponse("");

      setTimeout(() => {
        const commands = [
          { text: "Show critical alerts", action: () => { setActiveTab("alerts"); setVoiceResponse("Showing all critical alerts"); }},
          { text: "Run sentiment check", action: () => { setActiveTab("sentiment"); setVoiceResponse("Opening sentiment analysis"); }},
          { text: "Brief me on risks", action: () => { setActiveTab("alerts"); setVoiceResponse("You have 2 risk alerts requiring attention"); }},
          { text: "What needs my attention", action: () => { setActiveTab("home"); setVoiceResponse(`${criticalCount} critical items need your attention`); }},
        ];
        const cmd = commands[Math.floor(Math.random() * commands.length)];
        setVoiceTranscript(cmd.text);
        cmd.action();

        setTimeout(() => {
          setIsListening(false);
        }, 2000);
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

  const handleAlertAction = (alertId: string) => {
    setAlertActions(prev => ({ ...prev, [alertId]: true }));
    onAlertAction?.(alertId);
  };

  const renderHome = () => (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <Brain size={32} style={{ color: MOBILE.blue }} className="mx-auto mb-2" />
        <h2 className="font-bold text-base" style={{ color: MOBILE.dark }}>AI Command Center</h2>
        <p className="text-xs text-gray-500">Your AI-powered executive assistant</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div 
          className="p-2 rounded-lg text-center cursor-pointer"
          style={{ backgroundColor: criticalCount > 0 ? MOBILE.red + "20" : MOBILE.grey }}
          onClick={() => setActiveTab("alerts")}
          data-testid="mobile-stat-critical"
        >
          <AlertTriangle size={16} style={{ color: MOBILE.red }} className="mx-auto mb-1" />
          <p className="font-bold text-sm" style={{ color: MOBILE.red }}>{criticalCount}</p>
          <p className="text-[10px] text-gray-500">Critical</p>
        </div>
        <div 
          className="p-2 rounded-lg text-center cursor-pointer"
          style={{ backgroundColor: MOBILE.grey }}
          onClick={() => setActiveTab("alerts")}
          data-testid="mobile-stat-alerts"
        >
          <Bell size={16} style={{ color: MOBILE.blue }} className="mx-auto mb-1" />
          <p className="font-bold text-sm" style={{ color: MOBILE.blue }}>{pendingAlerts.length}</p>
          <p className="text-[10px] text-gray-500">Alerts</p>
        </div>
        <div 
          className="p-2 rounded-lg text-center cursor-pointer"
          style={{ backgroundColor: MOBILE.grey }}
          onClick={() => setActiveTab("voice")}
          data-testid="mobile-stat-voice"
        >
          <Mic size={16} style={{ color: MOBILE.teal }} className="mx-auto mb-1" />
          <p className="font-bold text-sm" style={{ color: MOBILE.teal }}>Ready</p>
          <p className="text-[10px] text-gray-500">Voice</p>
        </div>
      </div>

      {/* Recent Alert Preview */}
      <div className="mt-4">
        <p className="text-xs font-medium mb-2" style={{ color: MOBILE.dark }}>Latest Alert</p>
        {pendingAlerts[0] && (
          <div 
            className="p-3 rounded-lg border-l-4 cursor-pointer"
            style={{ 
              borderLeftColor: getSeverityColor(pendingAlerts[0].severity),
              backgroundColor: MOBILE.white 
            }}
            onClick={() => setActiveTab("alerts")}
            data-testid="mobile-latest-alert"
          >
            <div className="flex items-start gap-2">
              {getTypeIcon(pendingAlerts[0].type)}
              <div className="flex-1">
                <p className="text-xs font-medium">{pendingAlerts[0].title}</p>
                <p className="text-[10px] text-gray-500 mt-1">{pendingAlerts[0].message.slice(0, 60)}...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4">
        <p className="text-xs font-medium mb-2" style={{ color: MOBILE.dark }}>Quick Actions</p>
        <div className="space-y-2">
          <button
            className="w-full p-3 rounded-lg flex items-center gap-3 text-left"
            style={{ backgroundColor: MOBILE.blue, color: MOBILE.white }}
            onClick={handleVoiceCommand}
            data-testid="mobile-quick-voice"
          >
            <Mic size={18} />
            <span className="text-sm font-medium">Start Voice Command</span>
          </button>
          <button
            className="w-full p-3 rounded-lg flex items-center gap-3 text-left"
            style={{ backgroundColor: MOBILE.grey }}
            onClick={() => setActiveTab("sentiment")}
            data-testid="mobile-quick-sentiment"
          >
            <Sparkles size={18} style={{ color: MOBILE.teal }} />
            <span className="text-sm font-medium">Analyze Sentiment</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm" style={{ color: MOBILE.dark }}>AI Alerts</h3>
        <Badge style={{ backgroundColor: criticalCount > 0 ? MOBILE.red : MOBILE.blue }} className="text-white text-xs">
          {pendingAlerts.length} pending
        </Badge>
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {pendingAlerts.map(alert => {
          const persona = executivePersonas.find(p => p.id === alert.targetPersona);
          const isExpanded = expandedAlert === alert.id;
          
          return (
            <motion.div
              key={alert.id}
              layout
              className="rounded-lg border-l-4 overflow-hidden"
              style={{ 
                borderLeftColor: getSeverityColor(alert.severity),
                backgroundColor: MOBILE.white 
              }}
              data-testid={`mobile-alert-${alert.id}`}
            >
              <div 
                className="p-2 cursor-pointer"
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
              >
                <div className="flex items-start gap-2">
                  {getTypeIcon(alert.type)}
                  <div className="flex-1">
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
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-2 pb-2"
                  >
                    <div className="p-2 rounded text-[10px] mb-2" style={{ backgroundColor: MOBILE.blue + "15" }}>
                      <div className="flex items-start gap-1">
                        <Sparkles size={10} style={{ color: MOBILE.blue }} />
                        <p style={{ color: MOBILE.blue }}>{alert.insight}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {alert.dataPoints.slice(0, 3).map((dp, i) => (
                        <div key={i} className="p-1 rounded text-center" style={{ backgroundColor: MOBILE.grey }}>
                          <div className="flex items-center justify-center gap-0.5">
                            {dp.trend === "up" ? (
                              <TrendingUp size={8} style={{ color: MOBILE.teal }} />
                            ) : dp.trend === "down" ? (
                              <TrendingDown size={8} style={{ color: MOBILE.red }} />
                            ) : null}
                            <span className="font-bold text-[10px]">{dp.value}</span>
                          </div>
                          <p className="text-[8px] text-gray-500">{dp.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-1.5 rounded text-[10px] font-medium flex items-center justify-center gap-1"
                        style={{ backgroundColor: MOBILE.grey }}
                        onClick={(e) => { e.stopPropagation(); setExpandedAlert(null); }}
                        data-testid={`mobile-alert-dismiss-${alert.id}`}
                      >
                        <X size={10} /> Dismiss
                      </button>
                      <button
                        className="flex-1 py-1.5 rounded text-[10px] font-medium text-white flex items-center justify-center gap-1"
                        style={{ backgroundColor: MOBILE.blue }}
                        onClick={(e) => { e.stopPropagation(); handleAlertAction(alert.id); }}
                        data-testid={`mobile-alert-action-${alert.id}`}
                      >
                        <Check size={10} /> Action
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {pendingAlerts.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle size={32} style={{ color: MOBILE.teal }} className="mx-auto mb-2" />
            <p className="text-xs text-gray-500">All alerts have been actioned!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderVoice = () => (
    <div className="flex flex-col h-full">
      <div className="text-center mb-4">
        <h3 className="font-bold text-sm mb-1" style={{ color: MOBILE.dark }}>Voice Commands</h3>
        <p className="text-[10px] text-gray-500">Speak to interact with AI</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.button
          className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: isListening ? MOBILE.red : MOBILE.blue }}
          onClick={handleVoiceCommand}
          animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}
          data-testid="mobile-voice-button"
        >
          {isListening ? (
            <MicOff size={40} color={MOBILE.white} />
          ) : (
            <Mic size={40} color={MOBILE.white} />
          )}
        </motion.button>

        <p className="text-xs font-medium mb-2" style={{ color: MOBILE.dark }}>
          {isListening ? "Listening..." : "Tap to speak"}
        </p>

        {voiceTranscript && voiceTranscript !== "Listening..." && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 rounded-lg mb-2"
            style={{ backgroundColor: MOBILE.grey }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Volume2 size={12} style={{ color: MOBILE.blue }} />
              <span className="text-[10px] font-medium">You said:</span>
            </div>
            <p className="text-xs italic">"{voiceTranscript}"</p>
          </motion.div>
        )}

        {voiceResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 rounded-lg"
            style={{ backgroundColor: MOBILE.blue + "15" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Brain size={12} style={{ color: MOBILE.blue }} />
              <span className="text-[10px] font-medium" style={{ color: MOBILE.blue }}>AI Response:</span>
            </div>
            <p className="text-xs" style={{ color: MOBILE.blue }}>{voiceResponse}</p>
          </motion.div>
        )}
      </div>

      <div className="mt-auto">
        <p className="text-[10px] text-gray-500 mb-2">Try saying:</p>
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 italic">"Show critical alerts"</p>
          <p className="text-[10px] text-gray-400 italic">"Brief me on risks"</p>
          <p className="text-[10px] text-gray-400 italic">"Run sentiment check"</p>
        </div>
      </div>
    </div>
  );

  const renderSentiment = () => (
    <div className="space-y-3">
      <div className="text-center mb-2">
        <h3 className="font-bold text-sm mb-1" style={{ color: MOBILE.dark }}>Sentiment Analysis</h3>
        <p className="text-[10px] text-gray-500">Analyze text for tone and risk</p>
      </div>

      <textarea
        className="w-full p-2 border rounded-lg text-xs resize-none"
        rows={3}
        placeholder="Paste meeting notes, emails, or feedback..."
        value={sentimentInput}
        onChange={(e) => setSentimentInput(e.target.value)}
        style={{ backgroundColor: MOBILE.white }}
        data-testid="mobile-sentiment-input"
      />

      <button
        className="w-full py-2 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-2"
        style={{ backgroundColor: MOBILE.teal }}
        onClick={handleSentimentAnalysis}
        data-testid="mobile-sentiment-analyze"
      >
        <Sparkles size={14} />
        Analyze Sentiment
      </button>

      {sentimentResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg"
          style={{ backgroundColor: MOBILE.white }}
          data-testid="mobile-sentiment-result"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Sentiment</span>
            <Badge 
              className="text-[10px] text-white"
              style={{ 
                backgroundColor: sentimentResult.score > 0.2 ? MOBILE.teal : 
                                sentimentResult.score < -0.2 ? MOBILE.red : "#757575" 
              }}
            >
              {sentimentResult.score > 0.2 ? "Positive" : 
               sentimentResult.score < -0.2 ? "Negative" : "Neutral"}
            </Badge>
          </div>

          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div 
              className="absolute h-full rounded-full transition-all"
              style={{ 
                width: `${(sentimentResult.score + 1) * 50}%`,
                backgroundColor: sentimentResult.score > 0 ? MOBILE.teal : MOBILE.red
              }}
            />
          </div>

          {sentimentResult.keywords.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-medium text-gray-600 mb-1">Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {sentimentResult.keywords.slice(0, 5).map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] py-0">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {sentimentResult.riskFlags.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: MOBILE.red }}>Risk Flags:</p>
              <div className="flex flex-wrap gap-1">
                {sentimentResult.riskFlags.map((flag, i) => (
                  <Badge 
                    key={i} 
                    className="text-[10px] py-0 text-white"
                    style={{ backgroundColor: MOBILE.red }}
                  >
                    <AlertTriangle size={8} className="mr-0.5" />
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
    <div className="h-full flex flex-col" style={{ backgroundColor: MOBILE.grey }}>
      {/* Status Bar */}
      <div 
        className="h-8 px-4 flex items-center justify-between text-[10px] shrink-0"
        style={{ backgroundColor: MOBILE.red, color: MOBILE.white }}
      >
        <span>9:41</span>
        <span className="font-medium">L&G AI Cockpit</span>
        <div className="flex items-center gap-1">
          {criticalCount > 0 && (
            <Badge className="bg-white/20 text-[8px] py-0 px-1">{criticalCount}</Badge>
          )}
          <Bell size={10} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
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
        className="h-14 flex items-center justify-around shrink-0 border-t"
        style={{ backgroundColor: MOBILE.white }}
      >
        <button
          className="flex flex-col items-center gap-0.5 p-2"
          onClick={() => setActiveTab("home")}
          style={{ color: activeTab === "home" ? MOBILE.blue : "#9ca3af" }}
          data-testid="mobile-nav-home"
        >
          <Home size={18} />
          <span className="text-[10px]">Home</span>
        </button>
        <button
          className="flex flex-col items-center gap-0.5 p-2 relative"
          onClick={() => setActiveTab("alerts")}
          style={{ color: activeTab === "alerts" ? MOBILE.blue : "#9ca3af" }}
          data-testid="mobile-nav-alerts"
        >
          <Bell size={18} />
          {criticalCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] text-white flex items-center justify-center"
              style={{ backgroundColor: MOBILE.red }}
            >
              {criticalCount}
            </span>
          )}
          <span className="text-[10px]">Alerts</span>
        </button>
        <button
          className="flex flex-col items-center gap-0.5 p-2"
          onClick={() => setActiveTab("voice")}
          style={{ color: activeTab === "voice" ? MOBILE.blue : "#9ca3af" }}
          data-testid="mobile-nav-voice"
        >
          <Mic size={18} />
          <span className="text-[10px]">Voice</span>
        </button>
        <button
          className="flex flex-col items-center gap-0.5 p-2"
          onClick={() => setActiveTab("sentiment")}
          style={{ color: activeTab === "sentiment" ? MOBILE.blue : "#9ca3af" }}
          data-testid="mobile-nav-sentiment"
        >
          <Sparkles size={18} />
          <span className="text-[10px]">Sentiment</span>
        </button>
      </div>
    </div>
  );
}
