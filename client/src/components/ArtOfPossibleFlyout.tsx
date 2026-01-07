import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  transformationPhases, 
  personas, 
  sampleAIAlerts, 
  sampleCollaborationEvents,
  voiceCommands,
  TransformationPhase,
  AIAlert
} from "@/lib/artOfPossible";
import { 
  Smartphone, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Users, 
  Mic, 
  MicOff,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Play,
  Pause,
  Volume2
} from "lucide-react";

// Mobile-only colors (L&G Design System - Art of the Possible section only)
const MOBILE = {
  red: "#C50B30",
  blue: "#007FAA",
  grey: "#F6F6F6",
  white: "#FFFFFF",
  dark: "#1a1a1a",
};

interface ArtOfPossibleFlyoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtOfPossibleFlyout({ open, onOpenChange }: ArtOfPossibleFlyoutProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [scenarioMode, setScenarioMode] = useState<"asIs" | "toBe">("toBe");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showPersonaFeed, setShowPersonaFeed] = useState(true);

  const phase = transformationPhases[currentPhase];
  const scenario = scenarioMode === "asIs" ? phase.asIs : phase.toBe;
  const phaseAlerts = sampleAIAlerts.filter(a => a.phase === phase.id);

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentScreen(prev => {
          if (prev >= phase.screens.length - 1) {
            if (currentPhase < transformationPhases.length - 1) {
              setCurrentPhase(p => p + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return prev + 1;
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentPhase, phase.screens.length]);

  const nextPhase = () => {
    if (currentPhase < transformationPhases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentScreen(0);
    }
  };

  const prevPhase = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
      setCurrentScreen(0);
    }
  };

  const getSeverityColor = (severity: AIAlert["severity"]) => {
    switch (severity) {
      case "critical": return MOBILE.red;
      case "warning": return "#FFC107";
      case "info": return MOBILE.blue;
    }
  };

  const getSeverityIcon = (severity: AIAlert["severity"]) => {
    switch (severity) {
      case "critical": return <AlertTriangle size={14} />;
      case "warning": return <Info size={14} />;
      case "info": return <CheckCircle size={14} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Left Panel - Controls & Info */}
          <div className="w-80 bg-white border-r p-4 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" style={{ color: MOBILE.red }} />
                Art of the Possible
              </DialogTitle>
            </DialogHeader>

            {/* Scenario Toggle */}
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: MOBILE.grey }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Scenario View</span>
                <Switch 
                  checked={scenarioMode === "toBe"} 
                  onCheckedChange={(checked) => setScenarioMode(checked ? "toBe" : "asIs")}
                />
              </div>
              <div className="flex gap-2">
                <Badge 
                  variant={scenarioMode === "asIs" ? "default" : "outline"}
                  className="cursor-pointer"
                  style={{ backgroundColor: scenarioMode === "asIs" ? "#757575" : "transparent" }}
                  onClick={() => setScenarioMode("asIs")}
                >
                  AS-IS
                </Badge>
                <Badge 
                  variant={scenarioMode === "toBe" ? "default" : "outline"}
                  className="cursor-pointer"
                  style={{ backgroundColor: scenarioMode === "toBe" ? MOBILE.blue : "transparent" }}
                  onClick={() => setScenarioMode("toBe")}
                >
                  TO-BE
                </Badge>
              </div>
            </div>

            {/* Phase Navigation */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">5-Phase Journey</p>
              <div className="space-y-1">
                {transformationPhases.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => { setCurrentPhase(i); setCurrentScreen(0); }}
                    className={`w-full text-left p-2 rounded text-sm transition-all ${
                      i === currentPhase 
                        ? "text-white font-medium" 
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    style={{ backgroundColor: i === currentPhase ? MOBILE.red : undefined }}
                    data-testid={`phase-button-${i}`}
                  >
                    <span className="font-bold mr-2">{i + 1}.</span>
                    {p.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="mb-4 flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1"
                data-testid="button-playback"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span className="ml-1">{isPlaying ? "Pause" : "Auto-Play"}</span>
              </Button>
              <Button
                size="sm"
                variant={isListening ? "default" : "outline"}
                onClick={() => setIsListening(!isListening)}
                style={{ backgroundColor: isListening ? MOBILE.red : undefined }}
                data-testid="button-voice"
              >
                {isListening ? <Mic size={16} /> : <MicOff size={16} />}
              </Button>
            </div>

            {/* Voice Commands */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 p-3 rounded-lg border-2 border-dashed"
                style={{ borderColor: MOBILE.red }}
              >
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <Volume2 size={12} style={{ color: MOBILE.red }} />
                  Listening... Try saying:
                </p>
                <div className="space-y-1">
                  {voiceCommands.slice(0, 3).map((cmd, i) => (
                    <p key={i} className="text-xs text-gray-600 italic">"{cmd}"</p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Alerts Feed */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Bell size={12} /> AI Alerts
                </p>
                <Badge variant="outline" className="text-xs">{sampleAIAlerts.length}</Badge>
              </div>
              <div className="space-y-2">
                {sampleAIAlerts.slice(0, 4).map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 rounded border-l-4 text-xs"
                    style={{ 
                      borderLeftColor: getSeverityColor(alert.severity),
                      backgroundColor: MOBILE.grey 
                    }}
                  >
                    <div className="flex items-start gap-1">
                      {getSeverityIcon(alert.severity)}
                      <p className="flex-1">{alert.message}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-gray-500">
                      <span>{alert.timestamp}</span>
                      <span>→ {personas.find(p => p.id === alert.targetPersona)?.role}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Mobile Phone Mockup */}
          <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: "#e5e5e5" }}>
            <div className="relative">
              {/* Phone Frame */}
              <div 
                className="w-[320px] h-[640px] rounded-[40px] p-3 shadow-2xl"
                style={{ backgroundColor: MOBILE.dark }}
              >
                {/* Phone Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
                
                {/* Phone Screen */}
                <div 
                  className="w-full h-full rounded-[32px] overflow-hidden relative"
                  style={{ backgroundColor: MOBILE.grey }}
                >
                  {/* Status Bar */}
                  <div className="h-10 px-6 flex items-center justify-between text-xs" style={{ backgroundColor: MOBILE.red, color: MOBILE.white }}>
                    <span>9:41</span>
                    <span className="font-medium">L&G TMO</span>
                    <div className="flex items-center gap-1">
                      <Bell size={12} />
                      <span>●●●</span>
                    </div>
                  </div>

                  {/* Screen Content */}
                  <div className="p-4 h-[calc(100%-40px)] overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${currentPhase}-${currentScreen}-${scenarioMode}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Phase Header */}
                        <div className="mb-4">
                          <Badge 
                            className="mb-2 text-white"
                            style={{ backgroundColor: scenarioMode === "toBe" ? MOBILE.blue : "#757575" }}
                          >
                            Phase {phase.id}: {phase.shortName}
                          </Badge>
                          <h3 className="font-bold text-lg" style={{ color: MOBILE.dark }}>
                            {scenario.title}
                          </h3>
                          <p className="text-xs text-gray-600">{phase.duration}</p>
                        </div>

                        {/* Metrics Cards */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {scenario.metrics.map((m, i) => (
                            <div 
                              key={i} 
                              className="p-2 rounded-lg text-center"
                              style={{ backgroundColor: MOBILE.white }}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {m.trend === "up" ? (
                                  <TrendingUp size={12} style={{ color: "#00843D" }} />
                                ) : m.trend === "down" ? (
                                  <TrendingDown size={12} style={{ color: MOBILE.red }} />
                                ) : null}
                              </div>
                              <p className="font-bold text-sm" style={{ color: scenarioMode === "toBe" ? MOBILE.blue : "#757575" }}>
                                {m.value}
                              </p>
                              <p className="text-[10px] text-gray-500">{m.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Current Screen */}
                        {phase.screens[currentScreen] && (
                          <div 
                            className="p-3 rounded-lg mb-4"
                            style={{ backgroundColor: MOBILE.white }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className="text-[10px]"
                                style={{ borderColor: MOBILE.blue, color: MOBILE.blue }}
                              >
                                {phase.screens[currentScreen].type}
                              </Badge>
                              <span className="font-medium text-sm">{phase.screens[currentScreen].title}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{phase.screens[currentScreen].content}</p>
                            {phase.screens[currentScreen].aiAction && (
                              <div 
                                className="p-2 rounded text-xs flex items-center gap-2"
                                style={{ backgroundColor: MOBILE.blue + "15", color: MOBILE.blue }}
                              >
                                <Brain size={14} />
                                <span>{phase.screens[currentScreen].aiAction}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Process Steps */}
                        <div className="mb-4">
                          <p className="text-xs font-medium mb-2" style={{ color: MOBILE.dark }}>Process Flow</p>
                          <div className="space-y-2">
                            {scenario.process.map((step, i) => (
                              <div 
                                key={i}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                  style={{ backgroundColor: scenarioMode === "toBe" ? MOBILE.blue : "#757575" }}
                                >
                                  {i + 1}
                                </div>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Screen Navigation Dots */}
                        <div className="flex justify-center gap-2">
                          {phase.screens.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentScreen(i)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                i === currentScreen ? "w-4" : ""
                              }`}
                              style={{ 
                                backgroundColor: i === currentScreen ? MOBILE.red : "#ccc" 
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Phase Navigation Arrows */}
              <button
                onClick={prevPhase}
                disabled={currentPhase === 0}
                className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg disabled:opacity-30"
                data-testid="button-prev-phase"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextPhase}
                disabled={currentPhase === transformationPhases.length - 1}
                className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg disabled:opacity-30"
                data-testid="button-next-phase"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Right Panel - Collaboration & Personas */}
          <div className="w-72 bg-white border-l p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <Users size={16} /> Personas
              </h4>
              <Switch 
                checked={showPersonaFeed} 
                onCheckedChange={setShowPersonaFeed}
              />
            </div>

            {/* Persona Cards */}
            <div className="space-y-2 mb-4">
              {personas.map((persona) => (
                <div 
                  key={persona.id}
                  className="p-2 rounded-lg flex items-center gap-2"
                  style={{ backgroundColor: MOBILE.grey }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: persona.color + "20" }}
                  >
                    {persona.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{persona.name}</p>
                    <p className="text-xs text-gray-500">{persona.role}</p>
                  </div>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#00843D" }}
                  />
                </div>
              ))}
            </div>

            {/* Collaboration Timeline */}
            {showPersonaFeed && (
              <div className="flex-1 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-2">Live Collaboration</p>
                <div className="space-y-3">
                  {sampleCollaborationEvents.map((event) => {
                    const persona = personas.find(p => p.id === event.persona);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2"
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                          style={{ backgroundColor: persona?.color + "20" }}
                        >
                          {persona?.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs">{event.action}</p>
                          <p className="text-[10px] text-gray-400">{event.timestamp}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sentiment Gauge */}
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: MOBILE.grey }}>
              <p className="text-xs text-gray-500 mb-2">Team Sentiment</p>
              <div className="flex items-center gap-2">
                <Progress value={78} className="flex-1 h-2" />
                <span className="text-sm font-bold" style={{ color: "#00843D" }}>78%</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Positive alignment across stakeholders</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
