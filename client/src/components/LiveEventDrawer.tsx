import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, AlertTriangle, TrendingUp, Lightbulb, GitBranch, Zap, 
  Clock, Target, FileText, ChevronRight, Shield, Rocket, Search, 
  ArrowUpRight, CheckCircle, XCircle, BarChart3, Mail, Calendar, 
  MessageSquare, Users, Send, Sparkles, Bot, ThumbsUp, ThumbsDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { SimulationEvent } from "@/lib/liveSimulation";
import { useSimulation } from "@/contexts/SimulationContext";

const priorityColors: Record<string, string> = {
  critical: "#D50032",
  high: "#f59e0b",
  medium: "#005EB8",
  low: "#00843D"
};

const typeIcons: Record<string, React.ReactNode> = {
  ai_alert: <Brain className="h-5 w-5" />,
  risk_warning: <AlertTriangle className="h-5 w-5" />,
  opportunity: <Lightbulb className="h-5 w-5" />,
  prediction: <TrendingUp className="h-5 w-5" />,
  safe_anomaly: <GitBranch className="h-5 w-5" />,
  value_milestone: <Target className="h-5 w-5" />,
  action_required: <Zap className="h-5 w-5" />
};

const actionIcons: Record<string, React.ReactNode> = {
  mitigate: <Shield size={14} />,
  accelerate: <Rocket size={14} />,
  investigate: <Search size={14} />,
  escalate: <ArrowUpRight size={14} />
};

const actionColors: Record<string, string> = {
  mitigate: "#D50032",
  accelerate: "#00843D",
  investigate: "#005EB8",
  escalate: "#f59e0b"
};

interface AgentAction {
  id: string;
  question: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'pending' | 'accepted' | 'declined';
}

function generateAgentActions(event: SimulationEvent): AgentAction[] {
  const entityName = event.relatedEntity?.name || 'the initiative';
  const ownerTitle = event.relatedEntity?.type === 'project' ? 'Project Owner' : 
                     event.relatedEntity?.type === 'program' ? 'Program Director' : 'Portfolio Lead';
  
  const baseActions: AgentAction[] = [];
  
  if (event.type === 'risk_warning' || event.priority === 'critical') {
    baseActions.push({
      id: 'notify-owner',
      question: `Shall I send an urgent notification to the ${ownerTitle}?`,
      description: `I'll draft a priority alert email highlighting the risk and requesting immediate review of ${entityName}.`,
      icon: <Mail size={18} />,
      color: '#D50032',
      status: 'pending'
    });
    baseActions.push({
      id: 'schedule-meeting',
      question: 'Would you like me to schedule an emergency risk review meeting?',
      description: `I can find the next available slot for key stakeholders and send calendar invites for a 30-minute risk assessment.`,
      icon: <Calendar size={18} />,
      color: '#f59e0b',
      status: 'pending'
    });
  }
  
  if (event.type === 'ai_alert' || event.type === 'prediction') {
    baseActions.push({
      id: 'request-update',
      question: `Should I request a status update from the ${ownerTitle}?`,
      description: `I'll send a friendly request for the latest progress update and any blockers they're facing on ${entityName}.`,
      icon: <MessageSquare size={18} />,
      color: '#005EB8',
      status: 'pending'
    });
  }
  
  if (event.type === 'opportunity') {
    baseActions.push({
      id: 'accelerate-notify',
      question: 'Want me to notify the team about this acceleration opportunity?',
      description: `I'll share this insight with the delivery team and suggest a quick sync to capture the value window.`,
      icon: <Rocket size={18} />,
      color: '#00843D',
      status: 'pending'
    });
  }
  
  baseActions.push({
    id: 'stakeholder-brief',
    question: 'Shall I prepare a stakeholder briefing document?',
    description: `I'll generate a concise executive summary with key facts, AI insights, and recommended next steps for ${entityName}.`,
    icon: <FileText size={18} />,
    color: '#7c3aed',
    status: 'pending'
  });
  
  baseActions.push({
    id: 'track-action',
    question: 'Would you like me to add this to your action tracker?',
    description: `I'll create a follow-up task with a reminder to check back on this in 48 hours.`,
    icon: <Target size={18} />,
    color: '#0891b2',
    status: 'pending'
  });
  
  return baseActions.slice(0, 4);
}

export function LiveEventDrawer() {
  const { selectedEvent, setSelectedEvent, markAsRead } = useSimulation();
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  
  useEffect(() => {
    if (selectedEvent) {
      setAgentActions(generateAgentActions(selectedEvent));
    } else {
      setAgentActions([]);
    }
  }, [selectedEvent?.id]);
  
  const handleActionResponse = (actionId: string, accepted: boolean) => {
    setAgentActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: accepted ? 'accepted' : 'declined' } : a
    ));
  };
  
  if (!selectedEvent) return null;

  const handleClose = () => {
    if (selectedEvent) {
      markAsRead(selectedEvent.id);
    }
    setSelectedEvent(null);
  };

  return (
    <Dialog open={!!selectedEvent} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <motion.div 
              className="p-2 rounded-lg text-white"
              style={{ backgroundColor: priorityColors[selectedEvent.priority] }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {typeIcons[selectedEvent.type]}
            </motion.div>
            <div>
              <Badge 
                className="text-white mb-1"
                style={{ backgroundColor: priorityColors[selectedEvent.priority] }}
              >
                {selectedEvent.priority.toUpperCase()} PRIORITY
              </Badge>
              <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {selectedEvent.timestamp.toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <Brain size={14} />
              {selectedEvent.source}
            </span>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
            >
              <p className="text-lg font-medium text-purple-900 mb-2">{selectedEvent.message}</p>
              <p className="text-sm text-purple-700">{selectedEvent.detail}</p>
            </motion.div>

            {selectedEvent.relatedEntity && (
              <Card>
                <CardContent className="py-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target size={16} /> Related Entity
                  </h4>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[#005EB8] text-white">{selectedEvent.relatedEntity.bu}</Badge>
                    <span className="font-medium">{selectedEvent.relatedEntity.name}</span>
                    <Badge variant="outline" className="capitalize">{selectedEvent.relatedEntity.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="py-4 text-center">
                  <p className="text-3xl font-bold text-purple-700">{selectedEvent.confidence}%</p>
                  <p className="text-sm text-purple-600">AI Confidence</p>
                  <Progress value={selectedEvent.confidence} className="h-2 mt-2" />
                </CardContent>
              </Card>
              {selectedEvent.metrics && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-4 text-center">
                    <p className="text-xl font-bold text-blue-700">{selectedEvent.metrics.impact}</p>
                    <p className="text-sm text-blue-600">Potential Impact</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedEvent.metrics.timeframe}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="py-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-700">
                  <Brain size={16} /> AI Intelligence Analysis
                </h4>
                <div className="space-y-4">
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs font-semibold text-purple-600 mb-1">PATTERN RECOGNITION</p>
                    <p className="text-sm">{selectedEvent.detail}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs font-semibold text-blue-600 mb-1">DATA SOURCES</p>
                    <p className="text-sm">{selectedEvent.source}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded border">
                      <BarChart3 className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                      <p className="text-xs text-muted-foreground">847 patterns analyzed</p>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <Brain className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-xs text-muted-foreground">ML model v2.4</p>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <Clock className="h-6 w-6 mx-auto text-green-600 mb-1" />
                      <p className="text-xs text-muted-foreground">Real-time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedEvent.citations && selectedEvent.citations.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText size={16} /> Source Citations
                  </h4>
                  <div className="space-y-2">
                    {selectedEvent.citations.map((citation, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle size={14} className="text-green-600" />
                        {citation}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="impact" className="space-y-4">
            {selectedEvent.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="py-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-xl font-bold text-green-700">{selectedEvent.metrics.impact}</p>
                    <p className="text-sm text-green-600">Potential Value</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-4 text-center">
                    <Clock className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-xl font-bold text-blue-700">{selectedEvent.metrics.timeframe}</p>
                    <p className="text-sm text-blue-600">Timeframe</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="py-4 text-center">
                    <Target className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <p className="text-xl font-bold text-purple-700">{selectedEvent.confidence}%</p>
                    <p className="text-sm text-purple-600">Confidence</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardContent className="py-4">
                <h4 className="font-semibold mb-3">Scenario Analysis</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="font-medium text-green-700">Best Case</span>
                    </div>
                    <p className="text-sm text-green-600">Immediate action leads to full value capture</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span className="font-medium text-amber-700">Delayed Action</span>
                    </div>
                    <p className="text-sm text-amber-600">30% value erosion if action delayed beyond 2 weeks</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={14} className="text-red-600" />
                      <span className="font-medium text-red-700">No Action</span>
                    </div>
                    <p className="text-sm text-red-600">Issue escalates to critical within 4 weeks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div 
                    className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bot size={20} />
                  </motion.div>
                  <div>
                    <h4 className="font-bold text-purple-900">AI Agent Recommendations</h4>
                    <p className="text-xs text-purple-600">I've analyzed this alert and have some suggestions for you</p>
                  </div>
                  <Sparkles className="ml-auto text-purple-400" size={20} />
                </div>
                
                <div className="space-y-3">
                  {agentActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        action.status === 'accepted' 
                          ? 'bg-green-50 border-green-300' 
                          : action.status === 'declined'
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="p-2 rounded-lg text-white flex-shrink-0"
                          style={{ backgroundColor: action.color }}
                        >
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 mb-1">{action.question}</p>
                          <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                          
                          {action.status === 'pending' ? (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                                onClick={() => handleActionResponse(action.id, true)}
                              >
                                <ThumbsUp size={14} className="mr-1" />
                                Yes, please
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleActionResponse(action.id, false)}
                              >
                                <ThumbsDown size={14} className="mr-1" />
                                Not now
                              </Button>
                            </div>
                          ) : action.status === 'accepted' ? (
                            <motion.div 
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-2 text-green-600"
                            >
                              <CheckCircle size={16} />
                              <span className="text-sm font-medium">Got it! I'll take care of this.</span>
                            </motion.div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <XCircle size={16} />
                              <span className="text-sm">Noted - skipping this action</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={handleClose}>
                <Send size={16} className="mr-2" />
                Execute & Close
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Dismiss
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
