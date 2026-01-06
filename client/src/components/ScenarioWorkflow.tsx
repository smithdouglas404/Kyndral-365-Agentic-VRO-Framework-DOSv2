import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scenarios, stages, Scenario, ScenarioId, StageId, getKPIValueForStage } from "@/lib/scenarios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Check, ChevronRight, Target, Zap, Shield, TrendingUp, Clock, DollarSign, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ScenarioWorkflowProps {
  onScenarioChange: (scenario: Scenario, stage: StageId) => void;
}

export function ScenarioWorkflow({ onScenarioChange }: ScenarioWorkflowProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [activeStage, setActiveStage] = useState<StageId>("design");

  useEffect(() => {
    onScenarioChange(selectedScenario, activeStage);
  }, [selectedScenario, activeStage, onScenarioChange]);

  const getScenarioIcon = (id: ScenarioId) => {
    switch (id) {
      case "accelerate-prt": return Zap;
      case "digitize-operations": return TrendingUp;
      case "governance-uplift": return Shield;
    }
  };

  const stageIndex = stages.findIndex(s => s.id === activeStage);
  const progressPercent = ((stageIndex + 1) / stages.length) * 100;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-bold text-foreground">Design → Activate → Measure Value</h2>
          <p className="text-muted-foreground">Select a strategic scenario and progress through the value realization loop</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info size={20} className="text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-sm bg-white border shadow-lg p-4">
              <p className="font-semibold mb-2">Value Realization Loop</p>
              <p className="text-sm text-muted-foreground">
                This workflow mirrors the VRO methodology: Design strategic interventions, 
                Activate through automation, and Measure realized value against L&G targets.
              </p>
              <p className="text-xs text-[hsl(209,100%,36%)] mt-2">Source: VRO Strategy Document</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Scenario Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const Icon = getScenarioIcon(scenario.id);
          const isSelected = selectedScenario.id === scenario.id;
          
          return (
            <motion.div
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 h-full",
                  isSelected 
                    ? "border-2 border-[hsl(209,100%,36%)] shadow-lg bg-[hsl(209,100%,36%)]/5" 
                    : "border border-border hover:border-[hsl(209,100%,36%)]/50 hover:shadow-md"
                )}
                onClick={() => setSelectedScenario(scenario)}
                data-testid={`scenario-card-${scenario.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isSelected ? "bg-[hsl(209,100%,36%)] text-white" : "bg-primary/10 text-primary"
                    )}>
                      <Icon size={24} />
                    </div>
                    {isSelected && (
                      <Badge className="bg-[hsl(209,100%,36%)]">
                        <Check size={12} className="mr-1" /> Active
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">{scenario.name}</CardTitle>
                  <CardDescription className="text-sm">{scenario.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {scenario.strategicFocus}
                    </Badge>
                    <Badge variant={scenario.riskLevel === "Low" ? "default" : scenario.riskLevel === "Medium" ? "secondary" : "destructive"} className="text-xs">
                      {scenario.riskLevel} Risk
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Expected ROI:</span>
                      <span className="font-semibold text-[hsl(148,100%,26%)]">{scenario.expectedROI}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground mt-1">
                      <span>Timeframe:</span>
                      <span className="font-medium">{scenario.timeframe}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Stage Progress */}
      <Card className="border-2 border-dashed border-border bg-gradient-to-r from-[hsl(209,100%,36%)]/5 via-[hsl(148,100%,26%)]/5 to-[hsl(51,100%,50%)]/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-6">
            {stages.map((stage, index) => {
              const isActive = stage.id === activeStage;
              const isPast = stageIndex > index;
              
              return (
                <div key={stage.id} className="flex items-center flex-1">
                  <button
                    onClick={() => setActiveStage(stage.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg transition-all flex-1 mx-2",
                      isActive 
                        ? "bg-white shadow-lg border-2" 
                        : isPast 
                          ? "bg-white/50 border border-green-200" 
                          : "hover:bg-white/50"
                    )}
                    style={{ 
                      borderColor: isActive ? stage.color : undefined,
                    }}
                    data-testid={`stage-button-${stage.id}`}
                  >
                    <div 
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg",
                        isPast && !isActive && "opacity-70"
                      )}
                      style={{ backgroundColor: stage.color }}
                    >
                      {isPast && !isActive ? <Check size={24} /> : index + 1}
                    </div>
                    <span className={cn(
                      "font-semibold text-sm",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {stage.name}
                    </span>
                    <span className="text-xs text-muted-foreground text-center max-w-[150px]">
                      {stage.description}
                    </span>
                  </button>
                  {index < stages.length - 1 && (
                    <ChevronRight size={24} className="text-muted-foreground/30 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="px-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Value Realization Progress</span>
              <span className="font-semibold">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* KPI Dashboard for Selected Scenario & Stage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {selectedScenario.name} — {stages.find(s => s.id === activeStage)?.name} Phase
              </CardTitle>
              <CardDescription>
                Key Performance Indicators with L&G Annual Report benchmarks
              </CardDescription>
            </div>
            <Badge 
              className="text-white"
              style={{ backgroundColor: stages.find(s => s.id === activeStage)?.color }}
            >
              Stage {stageIndex + 1} of 3
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedScenario.kpis.map((kpi, index) => {
              const targetValue = getKPIValueForStage(kpi, activeStage);
              const progressToTarget = ((kpi.baseline - targetValue) / (kpi.baseline - kpi.measureTarget)) * 100;
              const isImprovement = kpi.measureTarget < kpi.baseline; // Lower is better
              
              return (
                <motion.div
                  key={kpi.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-background">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{kpi.name}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info size={14} className="text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-white border shadow-lg p-2">
                              <p className="text-xs">{kpi.source}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-end gap-2 mb-3">
                        <motion.span 
                          key={`${activeStage}-${kpi.name}`}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-3xl font-bold text-foreground"
                        >
                          {targetValue}
                        </motion.span>
                        <span className="text-sm text-muted-foreground mb-1">{kpi.unit}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Baseline: {kpi.baseline}{kpi.unit}</span>
                          <span className="text-[hsl(148,100%,26%)] font-medium">
                            Target: {kpi.measureTarget}{kpi.unit}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, Math.max(0, progressToTarget))} 
                          className="h-1.5"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-[hsl(209,100%,36%)]/5 rounded-lg border border-[hsl(209,100%,36%)]/20">
            <div className="flex items-start gap-3">
              <Target className="text-[hsl(209,100%,36%)] mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-foreground">Challenges Addressed</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedScenario.challenges.map((challengeId) => (
                    <Badge key={challengeId} variant="outline" className="capitalize">
                      {challengeId.replace(/-/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
