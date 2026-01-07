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
  ArrowUpRight, CheckCircle, XCircle, BarChart3
} from "lucide-react";
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

export function LiveEventDrawer() {
  const { selectedEvent, setSelectedEvent, markAsRead } = useSimulation();

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
            <Card className="border-green-200">
              <CardContent className="py-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                  <Zap size={16} /> Recommended Actions
                </h4>
                <div className="space-y-2">
                  {selectedEvent.actions?.map((action) => (
                    <motion.button
                      key={action.id}
                      whileHover={{ x: 4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 rounded-lg border-2 flex items-center gap-3 text-left transition-colors"
                      style={{ 
                        borderColor: actionColors[action.type], 
                        backgroundColor: `${actionColors[action.type]}10` 
                      }}
                    >
                      <div 
                        className="p-2 rounded text-white"
                        style={{ backgroundColor: actionColors[action.type] }}
                      >
                        {actionIcons[action.type]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{action.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">{action.type} action</p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button className="flex-1 bg-[#00843D]" onClick={handleClose}>
                <CheckCircle size={16} className="mr-2" />
                Acknowledge & Close
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
