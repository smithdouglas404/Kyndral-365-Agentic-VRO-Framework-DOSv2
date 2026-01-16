import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, FileText, ListTodo, AlertTriangle, Users, 
  Clock, Target, CheckCircle, ArrowRight, Sparkles,
  MessageSquare, Calendar, ChevronRight, Brain,
  Zap, TrendingUp, Shield, Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PMOProject, SAFePortfolioStage } from '@/lib/buPrograms';
import { formatValueWithUnit } from '@/lib/formatters';

interface PMOProjectWorkspaceProps {
  project: PMOProject;
  onClose?: () => void;
}

const STAGE_GUIDANCE: Record<SAFePortfolioStage, { 
  title: string; 
  description: string; 
  checklist: string[];
  aiRecommendations: string[];
  templates: string[];
}> = {
  'funnel': {
    title: 'Idea Capture & Intake',
    description: 'Capture and document the opportunity. Focus on problem statement and initial value hypothesis.',
    checklist: [
      'Define the problem statement clearly',
      'Identify key stakeholders and sponsors',
      'Document initial value hypothesis',
      'Estimate high-level effort (T-shirt sizing)',
      'Submit to Portfolio Kanban for review'
    ],
    aiRecommendations: [
      'Similar initiatives in Retail achieved 3x ROI with customer focus',
      'Consider bundling with Digital Transformation epic for resource efficiency',
      'Early stakeholder alignment reduces time-to-value by 40%'
    ],
    templates: ['Opportunity Canvas', 'Value Hypothesis Template', 'Stakeholder Map']
  },
  'reviewing': {
    title: 'Initial Evaluation',
    description: 'Evaluate the opportunity against strategic themes and portfolio capacity.',
    checklist: [
      'Align with strategic themes and OKRs',
      'Assess portfolio capacity and constraints',
      'Identify dependencies with other initiatives',
      'Conduct preliminary feasibility review',
      'Prepare for deeper analysis or rejection'
    ],
    aiRecommendations: [
      'This aligns strongly with NextEra\'s Clean Energy Transition strategy',
      'Similar scope projects averaged 8-month delivery',
      '2 potential synergies identified with NEER initiatives'
    ],
    templates: ['Strategic Alignment Scorecard', 'Dependency Matrix', 'Go/No-Go Checklist']
  },
  'analyzing': {
    title: 'Business Case Development',
    description: 'Develop detailed business case with MVP definition and implementation approach.',
    checklist: [
      'Complete Lean Business Case',
      'Define MVP scope and acceptance criteria',
      'Estimate detailed costs and benefits',
      'Identify and quantify key risks',
      'Plan implementation approach and timeline'
    ],
    aiRecommendations: [
      'MVP definition should focus on 3 core user journeys',
      'Include contingency buffer of 15-20% based on similar projects',
      'Risk mitigation for vendor dependencies is critical'
    ],
    templates: ['Lean Business Case', 'MVP Definition Canvas', 'Risk Assessment Matrix']
  },
  'portfolio-backlog': {
    title: 'Ready for Implementation',
    description: 'Approved and prioritized. Awaiting resource allocation and sprint capacity.',
    checklist: [
      'Secure budget approval and funding',
      'Finalize team composition and roles',
      'Complete architectural runway items',
      'Schedule PI Planning participation',
      'Establish governance and reporting cadence'
    ],
    aiRecommendations: [
      'Optimal team size for this scope: 6-8 members',
      'Consider Q1 start for best resource availability',
      'Engage accessibility specialist early to prevent delays'
    ],
    templates: ['Team Charter', 'RACI Matrix', 'Governance Framework']
  },
  'implementing': {
    title: 'Active Delivery',
    description: 'Project is in active development with regular PI cadence and value delivery.',
    checklist: [
      'Conduct regular PI Planning and sync events',
      'Track flow metrics and velocity trends',
      'Manage impediments and escalations',
      'Deliver incremental value each iteration',
      'Prepare for milestone demos and reviews'
    ],
    aiRecommendations: [
      'Flow efficiency is at 68% - target 75% by removing wait states',
      'Velocity trending upward - maintain current practices',
      'Consider feature toggle for early user feedback'
    ],
    templates: ['PI Planning Deck', 'Sprint Review Template', 'Impediment Log']
  },
  'done': {
    title: 'Value Realized',
    description: 'Implementation complete. Focus on benefits realization and knowledge capture.',
    checklist: [
      'Conduct formal project retrospective',
      'Document lessons learned for knowledge base',
      'Validate benefits realization against business case',
      'Transition to BAU support and operations',
      'Archive project artifacts and close governance'
    ],
    aiRecommendations: [
      'Share automation patterns with other BU projects',
      'Retrospective insights should inform next PI planning',
      'Benefits tracking shows 12% above initial projections'
    ],
    templates: ['Retrospective Template', 'Benefits Realization Report', 'Handover Checklist']
  }
};

function getActionPriority(urgency: string) {
  switch (urgency) {
    case 'immediate': return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Now' };
    case 'this-week': return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'This Week' };
    case 'this-month': return { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'This Month' };
    default: return { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Planned' };
  }
}

function getActionTypeIcon(type: string) {
  switch (type) {
    case 'mitigate': return Shield;
    case 'accelerate': return Zap;
    case 'investigate': return Brain;
    case 'escalate': return TrendingUp;
    default: return ArrowRight;
  }
}

export function PMOProjectWorkspace({ project, onClose }: PMOProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('ai-brief');
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [completedChecklist, setCompletedChecklist] = useState<Set<number>>(new Set());
  const [acknowledgedRisks, setAcknowledgedRisks] = useState<Set<number>>(new Set());
  const [collaborationNotes, setCollaborationNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  
  const stageGuidance = STAGE_GUIDANCE[project.safeStage];
  
  const deliverableProgress = (project.deliverables.completed / project.deliverables.total) * 100;
  const budgetProgress = (project.budget.spent / project.budget.total) * 100;
  const timelineProgress = (project.timeline.elapsed / project.timeline.total) * 100;

  const toggleActionComplete = (actionId: string) => {
    setCompletedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const toggleChecklistItem = (idx: number) => {
    setCompletedChecklist(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const acknowledgeRisk = (idx: number) => {
    setAcknowledgedRisks(prev => new Set([...Array.from(prev), idx]));
  };

  const addCollaborationNote = () => {
    if (newNote.trim()) {
      setCollaborationNotes(prev => [...prev, newNote.trim()]);
      setNewNote('');
    }
  };

  const pendingActionsCount = project.proactiveActions.filter(a => !completedActions.has(a.id)).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden" data-testid={`workspace-${project.id}`}>
      <div className="bg-gradient-to-r from-[#005EB8] to-[#003D7A] p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{project.name}</h2>
              <p className="text-sm text-white/80">{project.bu} • {project.safe.epicName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(
              "capitalize",
              project.status === 'green' && "bg-green-500",
              project.status === 'amber' && "bg-amber-500",
              project.status === 'red' && "bg-red-500"
            )}>
              {project.status}
            </Badge>
            <Badge variant="outline" className="border-white/40 text-white">
              {project.safeStage.replace('-', ' ')}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Target className="h-3 w-3" />
              Deliverables
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{project.deliverables.completed}</span>
              <span className="text-sm text-white/60">/ {project.deliverables.total}</span>
            </div>
            <Progress value={deliverableProgress} className="h-1 mt-2" />
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Clock className="h-3 w-3" />
              Timeline
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{project.timeline.elapsed}</span>
              <span className="text-sm text-white/60">/ {project.timeline.total} {project.timeline.unit}</span>
            </div>
            <Progress value={timelineProgress} className="h-1 mt-2" />
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              $ Budget
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{formatValueWithUnit(project.budget.spent, project.budget.unit)}</span>
              <span className="text-sm text-white/60">/ {formatValueWithUnit(project.budget.total, project.budget.unit)}</span>
            </div>
            <Progress value={budgetProgress} className="h-1 mt-2" />
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <TrendingUp className="h-3 w-3" />
              Flow Efficiency
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{project.safe.flowEfficiency}</span>
              <span className="text-sm text-white/60">%</span>
            </div>
            <Progress value={project.safe.flowEfficiency} className="h-1 mt-2" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="ai-brief" className="gap-2" data-testid="tab-ai-brief">
            <Sparkles className="h-4 w-4" />
            AI Brief
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2" data-testid="tab-actions">
            <ListTodo className="h-4 w-4" />
            Action Queue
          </TabsTrigger>
          <TabsTrigger value="risks" className="gap-2" data-testid="tab-risks">
            <AlertTriangle className="h-4 w-4" />
            Risk Radar
          </TabsTrigger>
          <TabsTrigger value="collaborate" className="gap-2" data-testid="tab-collaborate">
            <Users className="h-4 w-4" />
            Collaborate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-brief" className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                  AI Project Summary
                  <Badge className="bg-purple-100 text-purple-700 text-xs">Auto-generated</Badge>
                </h3>
                <p className="text-sm text-purple-800 mt-2 leading-relaxed">
                  <strong>{project.name}</strong> is currently in the <strong>{project.safeStage.replace('-', ' ')}</strong> stage 
                  with {deliverableProgress.toFixed(0)}% deliverables complete. The project shows 
                  {project.status === 'green' ? ' healthy progress' : project.status === 'amber' ? ' some concerns requiring attention' : ' critical issues needing immediate action'}.
                  Flow efficiency is at {project.safe.flowEfficiency}% with velocity of {project.safe.velocity} points per iteration.
                  {project.aiSignals.length > 0 && ` Key signal: ${project.aiSignals[0].message}`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                Stage: {stageGuidance.title}
              </h4>
              <p className="text-sm text-gray-600 mb-3">{stageGuidance.description}</p>
              <div className="space-y-2">
                {stageGuidance.checklist.map((item, idx) => {
                  const isChecked = completedChecklist.has(idx);
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-start gap-2 text-sm p-2 rounded-md cursor-pointer transition-colors",
                        isChecked ? "bg-green-50" : "hover:bg-gray-50"
                      )}
                      onClick={() => toggleChecklistItem(idx)}
                      data-testid={`checklist-item-${idx}`}
                    >
                      <CheckCircle className={cn(
                        "h-4 w-4 mt-0.5 flex-shrink-0 transition-colors",
                        isChecked ? "text-green-500" : "text-gray-300"
                      )} />
                      <span className={cn(
                        "transition-all",
                        isChecked ? "text-gray-500 line-through" : "text-gray-700"
                      )}>{item}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                {completedChecklist.size} of {stageGuidance.checklist.length} complete
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                AI Recommendations
              </h4>
              <div className="space-y-3">
                {stageGuidance.aiRecommendations.map((rec, idx) => (
                  <div key={idx} className="bg-amber-50 border border-amber-100 rounded-md p-2.5 text-sm text-amber-800" data-testid={`ai-recommendation-${idx}`}>
                    <Sparkles className="h-3 w-3 inline mr-1.5" />
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-green-600" />
              Recommended Templates
            </h4>
            <div className="flex flex-wrap gap-2">
              {stageGuidance.templates.map((template, idx) => (
                <Button key={idx} variant="outline" size="sm" className="gap-2" data-testid={`template-${idx}`}>
                  {template}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Proactive Action Queue</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {completedActions.size} completed
              </Badge>
              <Badge variant="outline">
                {pendingActionsCount} pending
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            {project.proactiveActions.map((action, idx) => {
              const priority = getActionPriority(action.urgency);
              const TypeIcon = getActionTypeIcon(action.type);
              const isCompleted = completedActions.has(action.id);
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    isCompleted ? "border-green-200 bg-green-50 opacity-75" : "border-gray-200 hover:shadow-md"
                  )}
                  data-testid={`action-item-${action.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      isCompleted ? "bg-green-100 text-green-600" : priority.color
                    )}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : <TypeIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("font-medium", isCompleted ? "text-gray-500 line-through" : "text-gray-900")}>
                          {action.action}
                        </span>
                        {!isCompleted && <Badge className={cn("text-xs", priority.color)}>{priority.label}</Badge>}
                        {isCompleted && <Badge className="text-xs bg-green-100 text-green-700">Done</Badge>}
                      </div>
                      <p className={cn("text-sm", isCompleted ? "text-gray-400" : "text-gray-600")}>{action.impact}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          size="sm" 
                          className={cn(
                            "gap-1",
                            isCompleted ? "bg-gray-400 hover:bg-gray-500" : "bg-[#005EB8] hover:bg-[#003D7A]"
                          )}
                          onClick={() => toggleActionComplete(action.id)}
                          data-testid={`button-complete-${action.id}`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          {isCompleted ? "Undo" : "Mark Complete"}
                        </Button>
                        {!isCompleted && (
                          <Button variant="outline" size="sm" className="gap-1" data-testid={`button-delegate-${action.id}`}>
                            <Users className="h-3 w-3" />
                            Delegate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {project.proactiveActions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
              <p>No pending actions - great job staying on top of things!</p>
            </div>
          )}

          {pendingActionsCount === 0 && project.proactiveActions.length > 0 && (
            <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
              <p className="text-green-800 font-medium">All actions completed!</p>
              <p className="text-sm text-green-600">Great work staying on top of your project tasks.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Risk Radar</h3>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {project.risks.length} active risks
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Identified Risks 
                <Badge variant="outline" className="ml-2 text-xs">
                  {project.risks.length - acknowledgedRisks.size} unacknowledged
                </Badge>
              </h4>
              {project.risks.map((risk, idx) => {
                const isAcknowledged = acknowledgedRisks.has(idx);
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "border rounded-lg p-3 transition-all",
                      isAcknowledged ? "bg-gray-50 border-gray-200 opacity-60" : "bg-red-50 border-red-200"
                    )}
                    data-testid={`risk-item-${idx}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={cn(
                        "h-4 w-4 mt-0.5 flex-shrink-0",
                        isAcknowledged ? "text-gray-400" : "text-red-600"
                      )} />
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-medium",
                          isAcknowledged ? "text-gray-500 line-through" : "text-red-900"
                        )}>{risk}</p>
                        <div className="flex gap-2 mt-1">
                          {!isAcknowledged && (
                            <>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="text-xs p-0 h-auto text-red-700" 
                                data-testid={`button-mitigate-${idx}`}
                              >
                                Create Mitigation Plan →
                              </Button>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="text-xs p-0 h-auto text-gray-500"
                                onClick={() => acknowledgeRisk(idx)}
                                data-testid={`button-acknowledge-${idx}`}
                              >
                                Acknowledge
                              </Button>
                            </>
                          )}
                          {isAcknowledged && (
                            <span className="text-xs text-gray-400">Risk acknowledged</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">AI Signals</h4>
              {project.aiSignals.map((signal, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "border rounded-lg p-3",
                    signal.type === 'warning' && "bg-amber-50 border-amber-200",
                    signal.type === 'opportunity' && "bg-green-50 border-green-200",
                    signal.type === 'insight' && "bg-blue-50 border-blue-200",
                    signal.type === 'prediction' && "bg-purple-50 border-purple-200"
                  )}
                  data-testid={`signal-item-${idx}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs capitalize">{signal.type}</Badge>
                    <span className="text-xs text-gray-500">{signal.confidence}% confidence</span>
                  </div>
                  <p className="text-sm text-gray-800">{signal.message}</p>
                  <p className="text-xs text-gray-500 mt-1">Source: {signal.dataSource}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="collaborate" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-blue-600" />
                Stakeholder Alignment
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm">Executive Sponsor</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Aligned</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-amber-600" />
                    </div>
                    <span className="text-sm">Technical Lead</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm">Business Owner</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Aligned</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3 gap-2" data-testid="button-request-alignment">
                <MessageSquare className="h-4 w-4" />
                Request Alignment Session
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-purple-600" />
                Meeting Agenda Generator
              </h4>
              <p className="text-sm text-gray-600 mb-3">AI-generated agendas based on project context</p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" data-testid="button-agenda-steering">
                  <FileText className="h-4 w-4" />
                  Steering Committee Agenda
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" data-testid="button-agenda-standup">
                  <FileText className="h-4 w-4" />
                  Daily Standup Focus
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" data-testid="button-agenda-retro">
                  <FileText className="h-4 w-4" />
                  Sprint Retrospective
                </Button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-green-600" />
              Project Discussion Thread
              {collaborationNotes.length > 0 && (
                <Badge variant="outline" className="ml-2">{collaborationNotes.length + 1} messages</Badge>
              )}
            </h4>
            <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">AK</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Andrew Kail</span>
                      <span className="text-xs text-gray-400">2 hours ago</span>
                    </div>
                    <p className="text-sm text-gray-700">Just completed the API performance review. Found 3 optimization opportunities that could save 2 weeks.</p>
                  </div>
                </div>
              </div>
              {collaborationNotes.map((note, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 rounded-lg p-3"
                  data-testid={`collab-note-${idx}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-purple-600">You</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">You</span>
                        <span className="text-xs text-gray-400">Just now</span>
                      </div>
                      <p className="text-sm text-gray-700">{note}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Add a comment or ask for AI assistance..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCollaborationNote()}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
                data-testid="input-project-comment"
              />
              <Button 
                className="bg-[#005EB8] hover:bg-[#003D7A]" 
                onClick={addCollaborationNote}
                data-testid="button-post-comment"
              >
                Post
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
