import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Target, Crosshair, Flag, Shield, User, AlertCircle, CheckCircle2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CommandersIntentFormProps {
  projectId?: string;
  onSave?: (intent: CommandersIntent) => void;
  onCancel?: () => void;
  initialData?: Partial<CommandersIntent>;
}

export interface CommandersIntent {
  id?: string;
  projectId: string;
  purpose: string; // The "Why" - VRO perspective (value, customer impact)
  keyTasks: string; // The "What" - PMO perspective (deliverables, milestones)
  endState: string; // Success criteria - TMO perspective (business outcomes)
  riskTolerance: {
    schedule: "strict" | "flexible" | "adaptive";
    budget: "fixed" | "flexible" | "adaptive";
    scope: "fixed" | "flexible" | "adaptive";
    quality: "non-negotiable" | "balanced" | "minimum-viable";
  };
  decisionAuthority: {
    tacticalPivots: "pmo-autonomous" | "tmo-approval" | "vro-approval";
    operationalPivots: "tmo-autonomous" | "vro-approval" | "executive-approval";
    strategicPivots: "vro-autonomous" | "executive-approval" | "board-approval";
  };
  status: "draft" | "active" | "archived" | "superseded";
  version: number;
  createdBy?: string;
}

export function CommandersIntentForm({
  projectId,
  onSave,
  onCancel,
  initialData
}: CommandersIntentFormProps) {
  const [intent, setIntent] = useState<CommandersIntent>({
    projectId: projectId || "",
    purpose: initialData?.purpose || "",
    keyTasks: initialData?.keyTasks || "",
    endState: initialData?.endState || "",
    riskTolerance: initialData?.riskTolerance || {
      schedule: "flexible",
      budget: "flexible",
      scope: "flexible",
      quality: "balanced"
    },
    decisionAuthority: initialData?.decisionAuthority || {
      tacticalPivots: "pmo-autonomous",
      operationalPivots: "tmo-autonomous",
      strategicPivots: "vro-autonomous"
    },
    status: initialData?.status || "draft",
    version: initialData?.version || 1
  });

  const [aiSuggestions, setAiSuggestions] = useState<{
    purpose?: string;
    keyTasks?: string;
    endState?: string;
  }>({});

  const handleGenerateAISuggestions = () => {
    // Simulate AI generation - in production, this would call an API
    setAiSuggestions({
      purpose: "Deliver measurable customer value by reducing energy costs by 15% and improving grid reliability by 20%, enabling Enterprise to maintain competitive advantage in the clean energy transition.",
      keyTasks: "1. Deploy smart grid sensors across 50k nodes\n2. Integrate predictive analytics platform\n3. Train operations team on new systems\n4. Achieve 99.9% uptime during transition",
      endState: "By Q4 2026: Operational grid with real-time optimization, 15% cost reduction validated through independent audit, customer satisfaction score >85%, and zero critical incidents during deployment."
    });
  };

  const handleApplySuggestion = (field: keyof typeof aiSuggestions) => {
    if (aiSuggestions[field]) {
      setIntent(prev => ({ ...prev, [field]: aiSuggestions[field] }));
    }
  };

  const handleSave = () => {
    onSave?.(intent);
  };

  const isComplete = intent.purpose && intent.keyTasks && intent.endState;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Flag className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Commander's Intent</h2>
            <p className="text-sm text-gray-600">
              One-page directive enabling autonomous execution within clear boundaries
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            Replaces 50-page Project Charter
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Enables Kill/Continue/Pivot Decisions
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateAISuggestions}
            className="ml-auto"
          >
            <Brain className="h-4 w-4 mr-2" />
            Generate AI Suggestions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - The Three Pillars */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. PURPOSE (Why - VRO) */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-red-600" />
                <span className="text-red-900">Purpose</span>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                  VRO • The "Why"
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Why does this project exist? What value does it create for customers and the business?
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Example: Reduce customer energy costs by 15% while improving grid reliability, positioning Enterprise as the clean energy leader..."
                value={intent.purpose}
                onChange={(e) => setIntent(prev => ({ ...prev, purpose: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              {aiSuggestions.purpose && intent.purpose !== aiSuggestions.purpose && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-purple-900 mb-1">AI Suggestion</p>
                      <p className="text-sm text-gray-700">{aiSuggestions.purpose}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplySuggestion("purpose")}
                    className="text-xs"
                  >
                    Apply Suggestion
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* 2. KEY TASKS (What - PMO) */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-900">Key Tasks</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                  PMO • The "What"
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                What are the critical deliverables and milestones that must be accomplished?
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Example:\n1. Deploy sensor network across 50k grid nodes\n2. Integrate predictive analytics platform\n3. Train 200 operations staff\n4. Achieve 99.9% uptime"
                value={intent.keyTasks}
                onChange={(e) => setIntent(prev => ({ ...prev, keyTasks: e.target.value }))}
                rows={6}
                className="resize-none font-mono text-sm"
              />
              {aiSuggestions.keyTasks && intent.keyTasks !== aiSuggestions.keyTasks && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-purple-900 mb-1">AI Suggestion</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{aiSuggestions.keyTasks}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplySuggestion("keyTasks")}
                    className="text-xs"
                  >
                    Apply Suggestion
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* 3. END STATE (Success - TMO) */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-amber-600" />
                <span className="text-amber-900">End State</span>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                  TMO • Success Criteria
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                What does success look like? How will we know the mission is accomplished?
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Example: By Q4 2026, operational grid with real-time optimization, 15% cost reduction validated by audit, customer satisfaction >85%, zero critical incidents..."
                value={intent.endState}
                onChange={(e) => setIntent(prev => ({ ...prev, endState: e.target.value }))}
                rows={5}
                className="resize-none"
              />
              {aiSuggestions.endState && intent.endState !== aiSuggestions.endState && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-purple-900 mb-1">AI Suggestion</p>
                      <p className="text-sm text-gray-700">{aiSuggestions.endState}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplySuggestion("endState")}
                    className="text-xs"
                  >
                    Apply Suggestion
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Risk Tolerance & Decision Authority */}
        <div className="space-y-6">
          {/* Risk Tolerance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Risk Tolerance
              </CardTitle>
              <p className="text-xs text-gray-600">
                What are we willing to trade off?
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-gray-700">Schedule</Label>
                <RadioGroup
                  value={intent.riskTolerance.schedule}
                  onValueChange={(value) => setIntent(prev => ({
                    ...prev,
                    riskTolerance: { ...prev.riskTolerance, schedule: value as any }
                  }))}
                  className="mt-2 space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="strict" id="schedule-strict" />
                    <Label htmlFor="schedule-strict" className="text-sm font-normal cursor-pointer">
                      Strict (Fixed dates)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="schedule-flexible" />
                    <Label htmlFor="schedule-flexible" className="text-sm font-normal cursor-pointer">
                      Flexible (±2 weeks)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="adaptive" id="schedule-adaptive" />
                    <Label htmlFor="schedule-adaptive" className="text-sm font-normal cursor-pointer">
                      Adaptive (Value-driven)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">Budget</Label>
                <RadioGroup
                  value={intent.riskTolerance.budget}
                  onValueChange={(value) => setIntent(prev => ({
                    ...prev,
                    riskTolerance: { ...prev.riskTolerance, budget: value as any }
                  }))}
                  className="mt-2 space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="budget-fixed" />
                    <Label htmlFor="budget-fixed" className="text-sm font-normal cursor-pointer">
                      Fixed (No overruns)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="budget-flexible" />
                    <Label htmlFor="budget-flexible" className="text-sm font-normal cursor-pointer">
                      Flexible (±10%)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="adaptive" id="budget-adaptive" />
                    <Label htmlFor="budget-adaptive" className="text-sm font-normal cursor-pointer">
                      Adaptive (ROI-driven)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">Quality</Label>
                <RadioGroup
                  value={intent.riskTolerance.quality}
                  onValueChange={(value) => setIntent(prev => ({
                    ...prev,
                    riskTolerance: { ...prev.riskTolerance, quality: value as any }
                  }))}
                  className="mt-2 space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-negotiable" id="quality-non-negotiable" />
                    <Label htmlFor="quality-non-negotiable" className="text-sm font-normal cursor-pointer">
                      Non-negotiable
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="balanced" id="quality-balanced" />
                    <Label htmlFor="quality-balanced" className="text-sm font-normal cursor-pointer">
                      Balanced
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimum-viable" id="quality-minimum-viable" />
                    <Label htmlFor="quality-minimum-viable" className="text-sm font-normal cursor-pointer">
                      Minimum Viable
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Decision Authority */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Decision Authority
              </CardTitle>
              <p className="text-xs text-gray-600">
                Who can pivot what?
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-gray-700">Tactical Pivots</Label>
                <p className="text-xs text-gray-500 mb-2">
                  (Same end state, different approach)
                </p>
                <RadioGroup
                  value={intent.decisionAuthority.tacticalPivots}
                  onValueChange={(value) => setIntent(prev => ({
                    ...prev,
                    decisionAuthority: { ...prev.decisionAuthority, tacticalPivots: value as any }
                  }))}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pmo-autonomous" id="tactical-pmo" />
                    <Label htmlFor="tactical-pmo" className="text-sm font-normal cursor-pointer">
                      PMO Autonomous
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tmo-approval" id="tactical-tmo" />
                    <Label htmlFor="tactical-tmo" className="text-sm font-normal cursor-pointer">
                      TMO Approval Required
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">Operational Pivots</Label>
                <p className="text-xs text-gray-500 mb-2">
                  (Roadmap changes)
                </p>
                <RadioGroup
                  value={intent.decisionAuthority.operationalPivots}
                  onValueChange={(value) => setIntent(prev => ({
                    ...prev,
                    decisionAuthority: { ...prev.decisionAuthority, operationalPivots: value as any }
                  }))}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tmo-autonomous" id="operational-tmo" />
                    <Label htmlFor="operational-tmo" className="text-sm font-normal cursor-pointer">
                      TMO Autonomous
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vro-approval" id="operational-vro" />
                    <Label htmlFor="operational-vro" className="text-sm font-normal cursor-pointer">
                      VRO Approval Required
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">Strategic Pivots</Label>
                <p className="text-xs text-gray-500 mb-2">
                  (End state changes)
                </p>
                <RadioGroup
                  value={intent.decisionAuthority.strategicPivots}
                  onValueChange={(value) => setIntent(prev => ({
                    ...prev,
                    decisionAuthority: { ...prev.decisionAuthority, strategicPivots: value as any }
                  }))}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vro-autonomous" id="strategic-vro" />
                    <Label htmlFor="strategic-vro" className="text-sm font-normal cursor-pointer">
                      VRO Autonomous
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="executive-approval" id="strategic-exec" />
                    <Label htmlFor="strategic-exec" className="text-sm font-normal cursor-pointer">
                      Executive Approval
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Validation Status */}
          <Card className={cn(
            "border-2",
            isComplete ? "border-green-500 bg-green-50/50" : "border-amber-500 bg-amber-50/50"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isComplete ? "Intent Complete" : "Intent Incomplete"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {isComplete
                      ? "All three pillars defined. Ready to activate."
                      : "Please complete Purpose, Key Tasks, and End State."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIntent(prev => ({ ...prev, status: "draft" }))}
          >
            Save as Draft
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isComplete}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Flag className="h-4 w-4 mr-2" />
            Activate Intent
          </Button>
        </div>
      </div>
    </div>
  );
}
