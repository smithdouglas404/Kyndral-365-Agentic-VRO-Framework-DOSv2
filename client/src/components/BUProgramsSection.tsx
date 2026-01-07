import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  pmoProjects, vroPrograms, riskIssues,
  pmoSummary, vroSummary, riskSummary,
  PMOProject, VROProgram, RiskIssue
} from "@/lib/buPrograms";
import { 
  Building2, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Brain, Users, Target, Sparkles, Shield,
  ChevronDown, ChevronUp, Zap, AlertCircle
} from "lucide-react";

type DataMode = "VRO" | "PMO";

interface BUProgramsSectionProps {
  dataMode: DataMode;
}

const BU_COLORS: Record<string, string> = {
  "Institutional Retirement": "#005EB8",
  "Asset Management": "#00843D",
  "Retail": "#005EB8",
  "Corporate Investments": "#424242",
  "Risk & Compliance": "#D50032"
};

function PMOProjectCard({ project }: { project: PMOProject }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors = {
    green: "#00843D",
    amber: "#f59e0b",
    red: "#D50032"
  };
  
  const budgetPercent = (project.budget.spent / project.budget.total) * 100;
  const timelinePercent = (project.timeline.elapsed / project.timeline.total) * 100;
  const deliverablePercent = (project.deliverables.completed / project.deliverables.total) * 100;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: statusColors[project.status] }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <Badge 
              className="mb-2 text-white text-xs"
              style={{ backgroundColor: BU_COLORS[project.bu] || "#005EB8" }}
            >
              {project.bu}
            </Badge>
            <CardTitle className="text-base">{project.name}</CardTitle>
          </div>
          <Badge 
            className="text-white uppercase text-xs"
            style={{ backgroundColor: statusColors[project.status] }}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1"><DollarSign size={12} /> Budget</span>
              <span className={budgetPercent > 100 ? "text-red-600 font-medium" : ""}>
                {project.budget.spent.toFixed(1)}/{project.budget.total}{project.budget.unit}
              </span>
            </div>
            <Progress value={Math.min(budgetPercent, 100)} className="h-1.5" />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1"><Clock size={12} /> Timeline</span>
              <span>{project.timeline.elapsed}/{project.timeline.total} {project.timeline.unit}</span>
            </div>
            <Progress value={timelinePercent} className="h-1.5" />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1"><CheckCircle size={12} /> Deliverables</span>
              <span>{project.deliverables.completed}/{project.deliverables.total}</span>
            </div>
            <Progress value={deliverablePercent} className="h-1.5" />
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Next Milestone:</p>
            <p className="text-sm font-medium">{project.nextMilestone}</p>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {project.risks.length} Risk{project.risks.length !== 1 ? "s" : ""}
          </Button>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1"
              >
                {project.risks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 bg-amber-50 rounded">
                    <AlertTriangle size={12} className="text-amber-500 mt-0.5" />
                    <span>{risk}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function VROProgramCard({ program }: { program: VROProgram }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors = {
    accelerating: "#00843D",
    "on-track": "#005EB8",
    "at-risk": "#f59e0b",
    blocked: "#D50032"
  };
  
  const valuePercent = program.roiValue > 0 ? (program.valueRealized / program.roiValue) * 100 : 0;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: statusColors[program.valueStatus] }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <Badge 
              className="mb-2 text-white text-xs"
              style={{ backgroundColor: BU_COLORS[program.bu] || "#005EB8" }}
            >
              {program.bu}
            </Badge>
            <CardTitle className="text-base">{program.name}</CardTitle>
          </div>
          <Badge 
            className="text-white capitalize text-xs"
            style={{ backgroundColor: statusColors[program.valueStatus] }}
          >
            {program.valueStatus === "on-track" ? "On Track" : program.valueStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-green-50 rounded">
              <p className="text-[10px] text-muted-foreground">Expected ROI</p>
              <p className="text-sm font-bold text-green-700">{program.expectedROI}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-[10px] text-muted-foreground">Strategic Alignment</p>
              <p className="text-sm font-bold text-blue-700">{program.strategicAlignment}%</p>
            </div>
          </div>
          
          {program.roiValue > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1"><TrendingUp size={12} /> Value Realized</span>
                <span className="font-medium">£{program.valueRealized}m / £{program.roiValue}m</span>
              </div>
              <Progress value={valuePercent} className="h-1.5" />
            </div>
          )}
          
          <div className="p-2 bg-purple-50 rounded border border-purple-100">
            <div className="flex items-start gap-2">
              <Brain size={14} className="text-purple-600 mt-0.5" />
              <div>
                <p className="text-[10px] text-purple-600 font-medium">AI INSIGHT</p>
                <p className="text-xs">{program.aiInsight}</p>
              </div>
            </div>
          </div>
          
          <div className="p-2 bg-blue-50 rounded border border-blue-100">
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-[10px] text-blue-600 font-medium">PREDICTION</p>
                <p className="text-xs">{program.prediction}</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Key Outcomes & Collaborators
          </Button>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                {program.keyOutcomes.map((outcome, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span>{outcome.outcome}</span>
                      <span className="font-medium">{outcome.progress}/{outcome.target} {outcome.unit}</span>
                    </div>
                    <Progress value={(outcome.progress / outcome.target) * 100} className="h-1" />
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <p className="text-[10px] text-muted-foreground mb-1">Collaborators:</p>
                  <div className="flex flex-wrap gap-1">
                    {program.collaborators.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-2 bg-green-50 rounded text-xs">
                  <p className="text-[10px] text-green-700 font-medium">Risk Mitigation:</p>
                  <p>{program.riskMitigation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export function BUProgramsSection({ dataMode }: BUProgramsSectionProps) {
  const [selectedBU, setSelectedBU] = useState<string>("All");
  
  const businessUnits = ["All", "Institutional Retirement", "Asset Management", "Retail", "Corporate Investments", "Risk & Compliance"];
  
  const filteredPMO = selectedBU === "All" 
    ? pmoProjects 
    : pmoProjects.filter(p => p.bu === selectedBU);
    
  const filteredVRO = selectedBU === "All" 
    ? vroPrograms 
    : vroPrograms.filter(p => p.bu === selectedBU);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {dataMode === "PMO" ? "Project Delivery Status" : "Value Realization Programs"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {dataMode === "PMO" 
              ? "Traditional project tracking: budgets, timelines, deliverables" 
              : "Outcome-driven programs with AI insights and predictions"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {dataMode === "PMO" ? (
            <div className="flex gap-2">
              <Badge className="bg-green-600 text-white">{pmoSummary.green} Green</Badge>
              <Badge className="bg-amber-500 text-white">{pmoSummary.amber} Amber</Badge>
              <Badge className="bg-red-600 text-white">{pmoSummary.red} Red</Badge>
            </div>
          ) : (
            <div className="flex gap-2">
              <Badge className="bg-green-600 text-white">{vroSummary.accelerating} Accelerating</Badge>
              <Badge className="bg-blue-600 text-white">{vroSummary.onTrack} On Track</Badge>
              <div className="text-sm font-medium text-green-700">
                £{vroSummary.totalRealized}m realized
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {businessUnits.map(bu => (
          <Button
            key={bu}
            variant={selectedBU === bu ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBU(bu)}
            style={selectedBU === bu && bu !== "All" ? { backgroundColor: BU_COLORS[bu] } : undefined}
            data-testid={`filter-bu-${bu.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {bu}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataMode === "PMO" ? (
          filteredPMO.map(project => (
            <PMOProjectCard key={project.id} project={project} />
          ))
        ) : (
          filteredVRO.map(program => (
            <VROProgramCard key={program.id} program={program} />
          ))
        )}
      </div>
      
      {/* Risk Issues Section - From Risk Management Supplement */}
      {dataMode === "VRO" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-red-600" size={20} />
                Risk Intelligence Dashboard
              </h3>
              <p className="text-sm text-muted-foreground">
                From L&G Risk Management Supplement 2024 - AI-monitored risk landscape
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-red-600 text-white">{riskSummary.critical} Critical</Badge>
              <Badge className="bg-amber-500 text-white">{riskSummary.high} High</Badge>
              <Badge className="bg-blue-600 text-white">{riskSummary.medium} Medium</Badge>
              <Badge variant="outline">{riskSummary.withAIAlerts} AI Alerts</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskIssues.map(risk => {
              const severityColors = {
                critical: "#D50032",
                high: "#f59e0b",
                medium: "#005EB8",
                low: "#00843D"
              };
              const trendIcons = {
                improving: <TrendingUp size={12} className="text-green-600" />,
                stable: <div className="w-3 h-0.5 bg-gray-400" />,
                worsening: <AlertTriangle size={12} className="text-red-600" />
              };
              
              return (
                <Card key={risk.id} className="border-l-4" style={{ borderLeftColor: severityColors[risk.severity] }}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            className="text-white text-[10px] uppercase"
                            style={{ backgroundColor: severityColors[risk.severity] }}
                          >
                            {risk.severity}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{risk.category}</Badge>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            {trendIcons[risk.trend]}
                            <span className="capitalize">{risk.trend}</span>
                          </div>
                        </div>
                        <p className="font-medium text-sm">{risk.name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{risk.description}</p>
                    <div className="flex justify-between text-[10px] mb-2">
                      <span className="text-muted-foreground">Exposure: {risk.exposure}</span>
                      <span className="text-muted-foreground">Owner: {risk.owner}</span>
                    </div>
                    {risk.aiAlert && (
                      <div className="p-2 bg-purple-50 rounded border border-purple-100 text-xs">
                        <div className="flex items-start gap-1">
                          <Brain size={12} className="text-purple-600 mt-0.5" />
                          <span className="text-purple-700">{risk.aiAlert}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2 italic">Source: {risk.source}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {dataMode === "PMO" && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600" size={24} />
              <div>
                <p className="font-medium text-amber-800">PMO Limitation</p>
                <p className="text-sm text-amber-700">
                  Traditional project tracking shows delivery status but lacks value realization insights, 
                  AI predictions, and strategic alignment metrics that VRO provides.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
