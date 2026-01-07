import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  liveAIAlerts, 
  collaborationThreads, 
  governanceTasks,
  executivePersonas,
  analyzeSentiment,
  parseVoiceCommand,
  getAlertsForPersona,
  getTasksForPersona,
  AIAlert,
  GovernanceTask
} from "@/lib/agenticOrchestration";
import { 
  Brain, 
  Bell, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Mic,
  MicOff,
  Send,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  Leaf,
  FileCheck,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Volume2
} from "lucide-react";

const LG = {
  blue: "#005EB8",
  teal: "#00843D",
  red: "#D50032",
  yellow: "#FFD700",
  grey: "#757575",
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getSeverityColor(severity: AIAlert["severity"]): string {
  switch (severity) {
    case "critical": return LG.red;
    case "warning": return LG.yellow;
    case "info": return LG.blue;
  }
}

function getTypeIcon(type: AIAlert["type"]) {
  switch (type) {
    case "opportunity": return <Target size={16} />;
    case "risk": return <Shield size={16} />;
    case "performance": return <TrendingUp size={16} />;
    case "climate": return <Leaf size={16} />;
    case "compliance": return <FileCheck size={16} />;
    case "governance": return <Users size={16} />;
  }
}

interface AlertCardProps {
  alert: AIAlert;
  onAction?: () => void;
}

function AlertCard({ alert, onAction }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const persona = executivePersonas.find(p => p.id === alert.targetPersona);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg overflow-hidden bg-white"
      style={{ borderLeftWidth: 4, borderLeftColor: getSeverityColor(alert.severity) }}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: getSeverityColor(alert.severity) + "15" }}
            >
              {getTypeIcon(alert.type)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className="text-xs capitalize"
                  style={{ borderColor: getSeverityColor(alert.severity), color: getSeverityColor(alert.severity) }}
                >
                  {alert.severity}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {alert.type}
                </Badge>
              </div>
              <h4 className="font-semibold text-sm">{alert.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              {formatTimeAgo(alert.timestamp)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-lg">{persona?.avatar}</span>
              <span className="text-xs text-gray-600">{persona?.role}</span>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t"
            >
              <div className="bg-blue-50 p-3 rounded-lg mb-3">
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">AI Insight</p>
                    <p className="text-xs text-blue-700">{alert.insight}</p>
                  </div>
                </div>
                {alert.prediction && (
                  <div className="mt-2 flex items-center gap-2">
                    <Brain size={12} className="text-blue-600" />
                    <p className="text-xs text-blue-700 italic">{alert.prediction}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {alert.dataPoints.map((dp, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded text-center">
                    <div className="flex items-center justify-center gap-1">
                      {dp.trend === "up" ? (
                        <TrendingUp size={12} style={{ color: LG.teal }} />
                      ) : dp.trend === "down" ? (
                        <TrendingDown size={12} style={{ color: LG.red }} />
                      ) : null}
                      <span className="font-bold text-sm">{dp.value}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{dp.label}</p>
                  </div>
                ))}
              </div>
              
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Suggested Actions:</p>
                <div className="space-y-1">
                  {alert.suggestedActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <ChevronRight size={12} className="text-gray-400" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">
                    Confidence: {Math.round(alert.confidence * 100)}%
                  </div>
                  <Progress value={alert.confidence * 100} className="w-20 h-1.5" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7">
                    <MessageSquare size={12} className="mr-1" />
                    Discuss
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs h-7"
                    style={{ backgroundColor: LG.blue }}
                    onClick={onAction}
                  >
                    Take Action
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TaskCard({ task }: { task: GovernanceTask }) {
  const assignee = executivePersonas.find(p => p.id === task.assignee);
  const priorityColor = {
    low: LG.grey,
    medium: LG.blue,
    high: LG.yellow,
    critical: LG.red,
  }[task.priority];
  
  return (
    <div className="p-3 border rounded-lg bg-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              className="text-xs text-white capitalize"
              style={{ backgroundColor: priorityColor }}
            >
              {task.priority}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {task.status.replace("_", " ")}
            </Badge>
          </div>
          <h4 className="font-medium text-sm">{task.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{task.description}</p>
        </div>
        <div className="text-right">
          <span className="text-lg">{assignee?.avatar}</span>
          <p className="text-xs text-gray-500">{assignee?.name}</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={12} />
          Due: {task.dueDate.toLocaleDateString()}
        </div>
        <div className="flex gap-1">
          {task.approvals.map((a, i) => {
            const p = executivePersonas.find(ep => ep.id === a.personaId);
            return (
              <div 
                key={i}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ 
                  backgroundColor: a.status === "approved" ? LG.teal + "20" : 
                                   a.status === "rejected" ? LG.red + "20" : "#f3f4f6"
                }}
                title={`${p?.name}: ${a.status}`}
              >
                {a.status === "approved" ? "✓" : a.status === "rejected" ? "✗" : "?"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CollaborationFeed() {
  return (
    <div className="space-y-4">
      {collaborationThreads.map(thread => (
        <div key={thread.id} className="border rounded-lg bg-white overflow-hidden">
          <div className="p-3 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} style={{ color: LG.blue }} />
                <span className="text-sm font-medium">
                  {liveAIAlerts.find(a => a.id === thread.alertId)?.title}
                </span>
              </div>
              <Badge variant={thread.status === "open" ? "default" : "secondary"} className="text-xs">
                {thread.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {thread.participants.map(pId => {
                const p = executivePersonas.find(ep => ep.id === pId);
                return <span key={pId} className="text-sm">{p?.avatar}</span>;
              })}
            </div>
          </div>
          <div className="p-3 space-y-3 max-h-48 overflow-y-auto">
            {thread.messages.map(msg => {
              const persona = executivePersonas.find(p => p.id === msg.personaId);
              return (
                <div key={msg.id} className="flex items-start gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: msg.isAI ? LG.blue + "20" : "#f3f4f6" }}
                  >
                    {msg.isAI ? <Brain size={12} /> : persona?.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {msg.isAI ? "AI Assistant" : persona?.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AICommandCenter() {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [sentimentInput, setSentimentInput] = useState("");
  const [sentimentResult, setSentimentResult] = useState<ReturnType<typeof analyzeSentiment> | null>(null);
  
  const filteredAlerts = selectedPersona 
    ? getAlertsForPersona(selectedPersona)
    : liveAIAlerts;
  
  const criticalCount = liveAIAlerts.filter(a => a.severity === "critical").length;
  const warningCount = liveAIAlerts.filter(a => a.severity === "warning").length;
  const pendingTasks = governanceTasks.filter(t => t.status === "pending").length;
  
  const handleSentimentAnalysis = () => {
    if (sentimentInput.trim()) {
      setSentimentResult(analyzeSentiment(sentimentInput));
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setVoiceTranscript("Listening...");
      setTimeout(() => {
        setVoiceTranscript("Show me the risk alerts");
        const command = parseVoiceCommand("Show me the risk alerts");
        if (command.entity === "risk") {
          setSelectedPersona("cro");
        }
      }, 2000);
    } else {
      setVoiceTranscript("");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain style={{ color: LG.blue }} />
            AI Command Center
          </h2>
          <p className="text-muted-foreground">
            Agentic orchestration pushing insights to the right personas in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle size={16} style={{ color: LG.red }} />
            <span className="text-sm font-medium">{criticalCount} Critical</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200">
            <Info size={16} style={{ color: LG.yellow }} />
            <span className="text-sm font-medium">{warningCount} Warnings</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <CheckCircle size={16} style={{ color: LG.blue }} />
            <span className="text-sm font-medium">{pendingTasks} Tasks</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {executivePersonas.map(persona => {
          const personaAlerts = getAlertsForPersona(persona.id);
          const personaTasks = getTasksForPersona(persona.id);
          const hasCritical = personaAlerts.some(a => a.severity === "critical");
          
          return (
            <Card 
              key={persona.id}
              className={`cursor-pointer transition-all ${
                selectedPersona === persona.id ? "ring-2 ring-offset-2" : ""
              }`}
              style={{ 
                borderColor: selectedPersona === persona.id ? LG.blue : undefined
              }}
              onClick={() => setSelectedPersona(selectedPersona === persona.id ? null : persona.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{persona.avatar}</div>
                  <div>
                    <h4 className="font-medium text-sm">{persona.name}</h4>
                    <p className="text-xs text-gray-500">{persona.role}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge 
                    variant={hasCritical ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {personaAlerts.length} alerts
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {personaTasks.length} tasks
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell size={14} />
            AI Alerts
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle size={14} />
            Governance
          </TabsTrigger>
          <TabsTrigger value="collab" className="flex items-center gap-2">
            <Users size={14} />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic size={14} />
            Voice & Sentiment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4 space-y-3">
          {filteredAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-3">
          {governanceTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>

        <TabsContent value="collab" className="mt-4">
          <CollaborationFeed />
        </TabsContent>

        <TabsContent value="voice" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mic style={{ color: LG.blue }} />
                  Voice Commands
                </CardTitle>
                <CardDescription>
                  Speak to interact with the AI Command Center
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full gap-2 mb-4"
                  variant={isListening ? "destructive" : "default"}
                  onClick={toggleVoice}
                  style={{ backgroundColor: isListening ? LG.red : LG.blue }}
                  data-testid="button-voice-toggle"
                >
                  {isListening ? <MicOff /> : <Mic />}
                  {isListening ? "Stop Listening" : "Start Voice Command"}
                </Button>
                {voiceTranscript && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 size={14} style={{ color: LG.blue }} />
                      <span className="text-sm font-medium">Transcript</span>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{voiceTranscript}"</p>
                  </div>
                )}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Try saying:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>"Show me the risk alerts"</li>
                    <li>"Brief me on PRT opportunities"</li>
                    <li>"Approve the pending business case"</li>
                    <li>"What's the climate status?"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles style={{ color: LG.teal }} />
                  Sentiment Analysis
                </CardTitle>
                <CardDescription>
                  Analyze qualitative inputs for risk and tone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full p-3 border rounded-lg text-sm resize-none"
                  rows={4}
                  placeholder="Enter text to analyze (e.g., meeting notes, email content, stakeholder feedback)..."
                  value={sentimentInput}
                  onChange={(e) => setSentimentInput(e.target.value)}
                  data-testid="input-sentiment-text"
                />
                <Button 
                  className="w-full mt-3 gap-2"
                  onClick={handleSentimentAnalysis}
                  style={{ backgroundColor: LG.teal }}
                  data-testid="button-analyze-sentiment"
                >
                  <Send size={14} />
                  Analyze Sentiment
                </Button>
                {sentimentResult && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Sentiment Score</span>
                      <Badge 
                        style={{ 
                          backgroundColor: sentimentResult.score > 0.2 ? LG.teal : 
                                          sentimentResult.score < -0.2 ? LG.red : LG.grey 
                        }}
                      >
                        {sentimentResult.score > 0.2 ? "Positive" : 
                         sentimentResult.score < -0.2 ? "Negative" : "Neutral"}
                      </Badge>
                    </div>
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full rounded-full"
                        style={{ 
                          width: `${(sentimentResult.score + 1) * 50}%`,
                          backgroundColor: sentimentResult.score > 0 ? LG.teal : LG.red
                        }}
                      />
                    </div>
                    {sentimentResult.riskFlags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-red-600 mb-1">Risk Flags Detected:</p>
                        <div className="flex flex-wrap gap-1">
                          {sentimentResult.riskFlags.map((flag, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
