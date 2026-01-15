import { useParams, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { usePageContext } from "@/contexts/PageContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Target, 
  Users, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Link2,
  Sparkles,
  Brain,
  TrendingUp,
  BarChart3,
  ListTodo,
  Layers,
  ChevronDown,
  ChevronRight,
  FileText,
  Milestone as MilestoneIcon,
  Activity,
  ExternalLink,
  Loader2,
  X
} from "lucide-react";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFullProject } from "@/hooks/useProjects";
import type { Feature, Story, Task, Milestone, Resource, Dependency } from "@/lib/safeProjectData";

const statusColors = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500'
};

const priorityColors = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-blue-500 text-white',
  low: 'bg-gray-400 text-white'
};

const stageLabels: Record<string, string> = {
  funnel: 'Funnel',
  reviewing: 'Reviewing',
  analyzing: 'Analyzing',
  backlog: 'Backlog',
  implementing: 'Implementing',
  done: 'Done'
};

function convertEnrichedToSAFe(enriched: EnrichedProject): SAFeProject {
  // Handle both $m and $M units (case-insensitive) - convert millions to actual value
  const isMillions = enriched.budget.unit.toLowerCase().includes('m');
  const budgetAmount = enriched.budget.total * (isMillions ? 1000000 : 1);
  // For backlog projects with no spend, use 0 but keep total budget from business case
  const spentAmount = enriched.budget.spent * (isMillions ? 1000000 : 1);
  
  const createTask = (id: string, storyId: string, title: string, status: 'todo' | 'in-progress' | 'done' | 'blocked', assignee: string, estimatedHours: number, actualHours: number): Task => ({
    id,
    storyId,
    title,
    description: `Task for ${title}`,
    status,
    assignee,
    estimatedHours,
    actualHours,
    priority: 'medium'
  });

  const sampleFeatures: Feature[] = [
    {
      id: `${enriched.id}-feat-1`,
      epicId: `${enriched.id}-epic-1`,
      title: `Core ${enriched.name} Implementation`,
      description: `Main implementation work for ${enriched.name}`,
      status: enriched.status === 'green' ? 'implementing' : 'backlog',
      targetPI: 25.1,
      wsjfScore: 18,
      benefitHypothesis: `Delivering ${enriched.expectedROI} expected ROI through successful implementation`,
      acceptanceCriteria: ['Meets business requirements', 'Passes quality gates', 'User acceptance completed'],
      dependencies: [],
      stories: [
        {
          id: `${enriched.id}-story-1`,
          featureId: `${enriched.id}-feat-1`,
          title: 'Requirements Analysis',
          description: 'Complete requirements gathering and analysis',
          status: 'done',
          storyPoints: 8,
          sprint: 1,
          assignedTeam: 'Analysis Team',
          acceptanceCriteria: ['All stakeholders interviewed', 'Requirements documented'],
          tasks: [
            createTask(`${enriched.id}-task-1`, `${enriched.id}-story-1`, 'Stakeholder interviews', 'done', 'Business Analyst', 16, 18),
            createTask(`${enriched.id}-task-2`, `${enriched.id}-story-1`, 'Document requirements', 'done', 'Business Analyst', 8, 10)
          ]
        },
        {
          id: `${enriched.id}-story-2`,
          featureId: `${enriched.id}-feat-1`,
          title: 'Design & Architecture',
          description: 'Complete solution design and architecture',
          status: enriched.status === 'green' ? 'done' : 'in-progress',
          storyPoints: 13,
          sprint: 2,
          assignedTeam: 'Architecture Team',
          acceptanceCriteria: ['Architecture approved', 'Design reviewed'],
          tasks: [
            createTask(`${enriched.id}-task-3`, `${enriched.id}-story-2`, 'Solution architecture', 'done', 'Solution Architect', 24, 20),
            createTask(`${enriched.id}-task-4`, `${enriched.id}-story-2`, 'Technical design', enriched.status === 'green' ? 'done' : 'in-progress', 'Tech Lead', 16, 14)
          ]
        },
        {
          id: `${enriched.id}-story-3`,
          featureId: `${enriched.id}-feat-1`,
          title: 'Core Development',
          description: 'Implement core functionality',
          status: enriched.status === 'green' ? 'in-progress' : 'backlog',
          storyPoints: 21,
          sprint: 3,
          assignedTeam: 'Development Team',
          acceptanceCriteria: ['Unit tests pass', 'Code review completed', 'Integration tested'],
          tasks: [
            createTask(`${enriched.id}-task-5`, `${enriched.id}-story-3`, 'Backend development', enriched.status === 'green' ? 'in-progress' : 'todo', 'Senior Developer', 40, 32),
            createTask(`${enriched.id}-task-6`, `${enriched.id}-story-3`, 'Frontend development', 'todo', 'UI Developer', 32, 0),
            createTask(`${enriched.id}-task-7`, `${enriched.id}-story-3`, 'Integration work', 'todo', 'Integration Lead', 24, 0)
          ]
        }
      ]
    },
    {
      id: `${enriched.id}-feat-2`,
      epicId: `${enriched.id}-epic-1`,
      title: `${enriched.name} Testing & Validation`,
      description: 'Comprehensive testing and quality assurance',
      status: 'backlog',
      targetPI: 25.2,
      wsjfScore: 15,
      benefitHypothesis: 'Ensuring quality delivery reduces operational risk and rework costs',
      acceptanceCriteria: ['All test cases pass', 'UAT sign-off obtained', 'Performance benchmarks met'],
      dependencies: [`${enriched.id}-feat-1`],
      stories: [
        {
          id: `${enriched.id}-story-4`,
          featureId: `${enriched.id}-feat-2`,
          title: 'Test Planning',
          description: 'Create comprehensive test plan',
          status: 'backlog',
          storyPoints: 5,
          sprint: 4,
          assignedTeam: 'QA Team',
          acceptanceCriteria: ['Test plan approved', 'Test cases documented'],
          tasks: [
            createTask(`${enriched.id}-task-8`, `${enriched.id}-story-4`, 'Write test plan', 'todo', 'QA Lead', 12, 0)
          ]
        }
      ]
    }
  ];

  const safeStageMap: Record<string, 'funnel' | 'reviewing' | 'analyzing' | 'backlog' | 'implementing' | 'done'> = {
    'funnel': 'funnel',
    'reviewing': 'reviewing',
    'analyzing': 'analyzing',
    'backlog': 'backlog',
    'implementing': 'implementing',
    'done': 'done',
    'portfolio-backlog': 'backlog',
    'portfolio-review': 'reviewing'
  };

  const buMap: Record<string, 'Florida Power & Light' | 'NextEra Energy Resources' | 'Corporate & Other'> = {
    'Florida Power & Light': 'Florida Power & Light',
    'NextEra Energy Resources': 'NextEra Energy Resources',
    'Corporate & Other': 'Corporate & Other'
  };

  return {
    id: enriched.id,
    name: enriched.name,
    bu: buMap[enriched.bu] || 'Corporate & Other',
    artName: `${enriched.bu} ART`,
    description: enriched.description,
    status: enriched.status,
    priority: enriched.priority,
    safeStage: safeStageMap[enriched.safeStage] || 'backlog',
    startDate: 'Q1 2024',
    targetEndDate: 'Q4 2025',
    currentPI: 25.1,
    totalPIs: 4,
    portfolioTheme: 'Digital Transformation',
    velocity: 45,
    totalFTE: 8,
    qualityScore: enriched.status === 'green' ? 85 : enriched.status === 'amber' ? 70 : 55,
    burndownHealth: enriched.status === 'green' ? 90 : enriched.status === 'amber' ? 65 : 45,
    financials: {
      budget: budgetAmount,
      spent: spentAmount,
      forecast: budgetAmount * 1.1,
      currency: '$',
      laborCost: spentAmount * 0.7,
      vendorCost: spentAmount * 0.2,
      infrastructureCost: spentAmount * 0.1,
      contingency: budgetAmount * 0.1,
      roi: {
        projected: budgetAmount * 2.5,
        confidence: 75,
        paybackMonths: 24
      }
    },
    features: sampleFeatures,
    milestones: [
      { id: `${enriched.id}-ms-1`, name: 'Project Kickoff', targetDate: '2024-01-15', status: 'completed', deliverables: ['Project charter', 'Team onboarded'], piNumber: 24.4 },
      { id: `${enriched.id}-ms-2`, name: 'Design Complete', targetDate: '2024-03-31', status: enriched.status === 'green' ? 'completed' : 'on-track', deliverables: ['Architecture design', 'Technical specs'], piNumber: 25.1 },
      { id: `${enriched.id}-ms-3`, name: 'Development Complete', targetDate: '2024-06-30', status: 'on-track', deliverables: ['Core features', 'Integration tests'], piNumber: 25.2 },
      { id: `${enriched.id}-ms-4`, name: 'Go Live', targetDate: '2024-09-30', status: 'on-track', deliverables: ['Production deployment', 'User training'], piNumber: 25.3 }
    ],
    resources: [
      { id: `${enriched.id}-res-1`, name: 'Project Lead', role: 'PM', allocation: 100, team: 'PMO', costRate: 800 },
      { id: `${enriched.id}-res-2`, name: 'Tech Lead', role: 'Architect', allocation: 100, team: 'Engineering', costRate: 950 },
      { id: `${enriched.id}-res-3`, name: 'Business Analyst', role: 'BA', allocation: 75, team: 'Analysis', costRate: 650 }
    ],
    dependencies: enriched.dependencies?.map((dep, i) => ({
      id: `${enriched.id}-dep-${i}`,
      sourceProjectId: enriched.id,
      targetProjectId: dep.projectId,
      type: dep.type as 'blocks' | 'blocked-by' | 'related' | 'data-dependency' | 'api-dependency',
      health: dep.health as 'green' | 'yellow' | 'red',
      description: dep.description || `Dependency with ${dep.projectName}`,
      impactIfDelayed: dep.impactIfDelayed || 'Schedule impact if delayed'
    })) || [],
    riskFlags: enriched.status === 'red' ? ['Timeline at risk', 'Budget concerns'] : enriched.status === 'amber' ? ['Resource constraints'] : [],
    aiRecommendations: [
      enriched.aiRecommendation || 'Continue monitoring project health indicators',
      `Expected ROI: ${enriched.expectedROI}`
    ],
    vroInsights: [
      `Value opportunity aligned with ${enriched.bu} strategic priorities`,
      'Recommend quarterly value reviews with stakeholders'
    ],
    pmoDataFeeds: [
      `Budget utilization: ${Math.round((enriched.budget.spent / enriched.budget.total) * 100)}%`,
      `Timeline progress: ${Math.round((enriched.timeline.elapsed / enriched.timeline.total) * 100)}%`
    ]
  };
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { setPageContext } = usePageContext();
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownEntityType, setDrilldownEntityType] = useState('');
  const [drilldownEntityId, setDrilldownEntityId] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  
  // Fetch project from database API
  const { data: fullProject, isLoading: isLoadingProject } = useFullProject(params.id || '');
  
  // Transform API data to SAFeProject format for rendering
  const project = useMemo(() => {
    if (!fullProject?.project) return undefined;
    const p = fullProject.project;
    const features = fullProject.features || [];
    const stories = fullProject.stories || [];
    const tasks = fullProject.tasks || [];
    
    const mappedFeatures = features.map((f: any) => ({
      id: f.id,
      epicId: p.epicId || '',
      title: f.name,
      description: f.description || '',
      status: f.status || 'backlog',
      targetPI: parseFloat(p.currentPi?.replace(/[^\d.]/g, '') || '25.1'),
      wsjfScore: parseInt(f.wsjfScore) || 0,
      benefitHypothesis: '',
      acceptanceCriteria: f.acceptanceCriteria ? JSON.parse(f.acceptanceCriteria) : [],
      dependencies: [],
      stories: stories.filter((s: any) => s.featureId === f.id).map((s: any) => ({
        id: s.id,
        featureId: s.featureId,
        title: s.name,
        description: s.description || '',
        status: s.status || 'backlog',
        storyPoints: parseInt(s.storyPoints) || 0,
        sprint: 1,
        assignedTeam: s.assignedTeam || 'Unassigned',
        acceptanceCriteria: s.acceptanceCriteria ? JSON.parse(s.acceptanceCriteria) : [],
        tasks: tasks.filter((t: any) => t.storyId === s.id).map((t: any) => ({
          id: t.id,
          storyId: t.storyId,
          title: t.name,
          description: t.description || '',
          status: t.status || 'todo',
          assignee: t.assignee || 'Unassigned',
          estimatedHours: parseInt(t.estimatedHours) || 0,
          actualHours: parseInt(t.actualHours) || 0,
          priority: t.priority || 'medium'
        }))
      }))
    }));
    
    const budgetSpent = parseInt(p.budgetSpent) || 0;
    const budgetTotal = parseInt(p.budgetTotal) || 1;
    
    return {
      id: p.id,
      name: p.name,
      bu: p.businessUnitId as any,
      artName: p.artName || '',
      description: p.description || '',
      status: p.status as any,
      priority: p.priority as any,
      safeStage: p.safeStage as any || 'backlog',
      startDate: p.startDate?.split('T')[0] || '',
      targetEndDate: p.endDate?.split('T')[0] || '',
      currentPI: parseFloat(p.currentPi?.replace(/[^\d.]/g, '') || '25.1'),
      totalPIs: parseInt(p.totalPis) || 4,
      portfolioTheme: p.portfolioTheme || '',
      velocity: parseInt(p.velocity) || 0,
      totalFTE: (fullProject.resources || []).length,
      qualityScore: 80,
      burndownHealth: 75,
      financials: {
        budget: budgetTotal * 1000000,
        spent: budgetSpent * 1000000,
        forecast: budgetTotal * 1100000,
        currency: '$',
        laborCost: budgetSpent * 700000,
        vendorCost: budgetSpent * 200000,
        infrastructureCost: budgetSpent * 100000,
        contingency: budgetTotal * 100000,
        roi: {
          projected: parseInt(p.roiValue) * 1000000 || 0,
          confidence: 75,
          paybackMonths: 24
        }
      },
      features: mappedFeatures,
      milestones: (fullProject.milestones || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        targetDate: m.targetDate,
        status: m.status || 'on-track',
        deliverables: m.deliverables ? JSON.parse(m.deliverables) : [],
        piNumber: parseFloat(m.piNumber || '25.1')
      })),
      resources: (fullProject.resources || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        allocation: parseInt(r.allocation) || 100,
        team: r.team || 'Unassigned',
        costRate: parseInt(r.costRate) || 0
      })),
      dependencies: (fullProject.dependencies || []).map((d: any) => ({
        id: d.id,
        sourceProjectId: d.sourceProjectId,
        targetProjectId: d.targetProjectId,
        type: d.type || 'related',
        health: d.health || 'green',
        description: d.description || '',
        impactIfDelayed: d.impactIfDelayed || ''
      })),
      riskFlags: (fullProject.risks || []).map((r: any) => r.description || r.name),
      aiRecommendations: [`Expected ROI: ${p.expectedRoi}`],
      vroInsights: [`Value aligned with ${p.portfolioTheme} strategic priorities`],
      pmoDataFeeds: [`Budget utilization: ${Math.round((budgetSpent / budgetTotal) * 100)}%`]
    };
  }, [fullProject]);
  
  // Update page context for Ask PM chat
  const projectName = project?.name;
  const projectBU = project?.bu;
  useEffect(() => {
    if (projectName && projectBU) {
      setPageContext({
        pageType: 'project',
        entityId: params.id || '',
        entityName: projectName,
        businessUnit: projectBU,
        breadcrumb: ['Dashboard', projectBU, projectName]
      });
    }
  }, [projectName, projectBU, params.id, setPageContext]);
  
  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-600">Loading project...</span>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <h2 className="text-xl font-bold mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/dashboard')}>Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const toggleFeature = (featureId: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      return newSet;
    });
  };

  const toggleStory = (storyId: string) => {
    setExpandedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const budgetUtilization = Math.round((project.financials.spent / project.financials.budget) * 100) || 0;
  const forecastVariance = Math.round(((project.financials.forecast - project.financials.budget) / project.financials.budget) * 100) || 0;
  
  const totalStories = project.features.reduce((sum, f) => sum + f.stories.length, 0);
  const completedStories = project.features.reduce((sum, f) => 
    sum + f.stories.filter(s => s.status === 'done' || s.status === 'accepted').length, 0);
  
  const totalTasks = project.features.reduce((sum, f) => 
    sum + f.stories.reduce((sSum, s) => sSum + s.tasks.length, 0), 0);
  const completedTasks = project.features.reduce((sum, f) => 
    sum + f.stories.reduce((sSum, s) => sSum + s.tasks.filter(t => t.status === 'done').length, 0), 0);

  const openDrilldown = (entityType: string, entityId: string) => {
    setDrilldownEntityType(entityType);
    setDrilldownEntityId(entityId);
    setDrilldownOpen(true);
  };

  const handleDrilldownNavigate = (entityType: string, entityId: string) => {
    setDrilldownEntityType(entityType);
    setDrilldownEntityId(entityId);
  };

  const generateExecutiveSummary = async () => {
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const response = await fetch('/api/ai/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          projectName: project.name,
          projectData: {
            status: project.status,
            priority: project.priority,
            bu: project.bu,
            budget: (project.financials.budget / 1000000).toFixed(1),
            budgetUtilization,
            roi: (project.financials.roi.projected / 1000000).toFixed(1),
            currentPI: project.currentPI,
            totalPIs: project.totalPIs,
            risks: project.aiRecommendations?.join(', ') || 'None identified',
            dependencies: project.dependencies?.map((d: Dependency) => d.targetProjectId).join(', ') || 'None'
          }
        })
      });
      const data = await response.json();
      if (data.summary) {
        setExecutiveSummary(data.summary);
      } else {
        setExecutiveSummary('Failed to generate summary. Please try again.');
      }
    } catch (error) {
      setExecutiveSummary('Failed to generate summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <>
    <DrillDownDrawer
      isOpen={drilldownOpen}
      onClose={() => setDrilldownOpen(false)}
      entityType={drilldownEntityType}
      entityId={drilldownEntityId}
      onNavigate={handleDrilldownNavigate}
    />
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b-4 border-purple-600">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()} 
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-project-name">
                  {project.name}
                </h1>
                <div className={`w-3 h-3 rounded-full ${statusColors[project.status]}`} />
                <Badge className={priorityColors[project.priority]}>
                  {project.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-purple-500 text-purple-700">
                  {stageLabels[project.safeStage]}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">{project.bu} | {project.artName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">PI {project.currentPI} of {project.totalPIs}</p>
              <p className="text-2xl font-bold text-purple-600">
                ${(project.financials.roi.projected / 1000000).toFixed(1)}M ROI
              </p>
            </div>
            <Button 
              onClick={generateExecutiveSummary}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              data-testid="button-executive-summary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Summary
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-purple-900">AI Executive Summary</h3>
                  {summaryLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSummary(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {summaryLoading ? (
                <div className="flex items-center gap-2 text-purple-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating executive summary...</span>
                </div>
              ) : executiveSummary ? (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {executiveSummary}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-teal-300"
            onClick={() => openDrilldown('kpi', 'budget-analysis')}
            data-testid="card-kpi-budget"
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-gray-600 mb-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Budget</span>
                </div>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">${(project.financials.budget / 1000000).toFixed(1)}M</p>
              <Progress value={budgetUtilization} className="h-2 mt-2" />
              <p className="text-xs text-gray-500 mt-1">{budgetUtilization}% utilized</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300"
            onClick={() => openDrilldown('kpi', 'velocity-metrics')}
            data-testid="card-kpi-velocity"
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-gray-600 mb-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Velocity</span>
                </div>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">{project.velocity}</p>
              <p className="text-xs text-gray-500 mt-1">story points/sprint</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-purple-300"
            onClick={() => openDrilldown('kpi', 'resource-allocation')}
            data-testid="card-kpi-resources"
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-gray-600 mb-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Resources</span>
                </div>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">{project.totalFTE}</p>
              <p className="text-xs text-gray-500 mt-1">FTE allocated</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-green-300"
            onClick={() => openDrilldown('kpi', 'quality-score')}
            data-testid="card-kpi-quality"
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-gray-600 mb-1">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Quality Score</span>
                </div>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">{project.qualityScore}%</p>
              <Progress value={project.qualityScore} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow-sm flex-wrap">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="features" data-testid="tab-features">Features & Stories</TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
            <TabsTrigger value="milestones" data-testid="tab-milestones">Milestones</TabsTrigger>
            <TabsTrigger value="dependencies" data-testid="tab-dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="financials" data-testid="tab-financials">Financials</TabsTrigger>
            <TabsTrigger value="ai-insights" data-testid="tab-ai-insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Project Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{project.description}</p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div 
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => openDrilldown('kpi', 'project-timeline')}
                      data-testid="tile-start-date"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Start Date</p>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className="font-medium">{project.startDate}</p>
                    </div>
                    <div 
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => openDrilldown('kpi', 'project-timeline')}
                      data-testid="tile-end-date"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Target End Date</p>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className="font-medium">{project.targetEndDate}</p>
                    </div>
                    <div 
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => openDrilldown('theme', project.portfolioTheme)}
                      data-testid="tile-theme"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Portfolio Theme</p>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className="font-medium">{project.portfolioTheme}</p>
                    </div>
                    <div 
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => openDrilldown('team', project.artName)}
                      data-testid="tile-art"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Agile Release Train</p>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className="font-medium">{project.artName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Progress Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                    onClick={() => openDrilldown('kpi', 'features-summary')}
                    data-testid="progress-features"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">Features <ExternalLink className="h-3 w-3 text-gray-400" /></span>
                      <span>{project.features.filter(f => f.status === 'done').length}/{project.features.length}</span>
                    </div>
                    <Progress value={(project.features.filter(f => f.status === 'done').length / Math.max(1, project.features.length)) * 100} className="h-2" />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                    onClick={() => openDrilldown('kpi', 'stories-summary')}
                    data-testid="progress-stories"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">Stories <ExternalLink className="h-3 w-3 text-gray-400" /></span>
                      <span>{completedStories}/{totalStories}</span>
                    </div>
                    <Progress value={(completedStories / Math.max(1, totalStories)) * 100} className="h-2" />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                    onClick={() => openDrilldown('kpi', 'tasks-summary')}
                    data-testid="progress-tasks"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">Tasks <ExternalLink className="h-3 w-3 text-gray-400" /></span>
                      <span>{completedTasks}/{totalTasks}</span>
                    </div>
                    <Progress value={(completedTasks / Math.max(1, totalTasks)) * 100} className="h-2" />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                    onClick={() => openDrilldown('kpi', 'burndown-health')}
                    data-testid="progress-burndown"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">Burndown Health <ExternalLink className="h-3 w-3 text-gray-400" /></span>
                      <span>{project.burndownHealth}%</span>
                    </div>
                    <Progress value={project.burndownHealth} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {project.riskFlags.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {project.riskFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-red-800">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    VRO Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {project.vroInsights.map((insight, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => openDrilldown('kpi', `vro-insight-${idx}`)}
                        data-testid={`vro-insight-${idx}`}
                      >
                        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800 flex-1">{insight}</span>
                        <ExternalLink className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    PMO Data Feeds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {project.pmoDataFeeds.map((feed, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-start gap-2 p-2 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                        onClick={() => openDrilldown('kpi', `pmo-feed-${idx}`)}
                        data-testid={`pmo-feed-${idx}`}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-green-800 flex-1">{feed}</span>
                        <ExternalLink className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-600" />
                  SAFe Hierarchy: Features → Stories → Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.features.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No features defined yet for this project.</p>
                ) : (
                  <div className="space-y-4">
                    {project.features.map(feature => (
                      <div key={feature.id} className="border rounded-lg">
                        <div 
                          className="flex items-center gap-3 p-4 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors"
                          onClick={() => toggleFeature(feature.id)}
                          data-testid={`feature-${feature.id}`}
                        >
                          {expandedFeatures.has(feature.id) ? (
                            <ChevronDown className="h-5 w-5 text-purple-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-purple-600" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-purple-900">{feature.title}</h3>
                              <Badge variant="outline" className="text-xs">PI {feature.targetPI}</Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  feature.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' :
                                  feature.status === 'implementing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                {feature.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">WSJF: {feature.wsjfScore}</p>
                            <p className="text-xs text-gray-500">{feature.stories.length} stories</p>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedFeatures.has(feature.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 border-t bg-white">
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-sm font-medium text-blue-800">Benefit Hypothesis</p>
                                  <p className="text-sm text-blue-700 mt-1">{feature.benefitHypothesis}</p>
                                </div>

                                {feature.acceptanceCriteria.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-sm font-medium mb-2">Acceptance Criteria</p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                      {feature.acceptanceCriteria.map((ac, idx) => (
                                        <li key={idx}>{ac}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {feature.stories.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Stories ({feature.stories.length})</p>
                                    {feature.stories.map(story => (
                                      <div key={story.id} className="border rounded-lg ml-4">
                                        <div 
                                          className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                          onClick={(e) => { e.stopPropagation(); toggleStory(story.id); }}
                                          data-testid={`story-${story.id}`}
                                        >
                                          {expandedStories.has(story.id) ? (
                                            <ChevronDown className="h-4 w-4 text-gray-600" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                          )}
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-sm">{story.title}</span>
                                              <Badge 
                                                variant="outline" 
                                                className={`text-xs ${
                                                  story.status === 'done' || story.status === 'accepted' ? 'bg-green-50 text-green-700' :
                                                  story.status === 'in-progress' ? 'bg-blue-50 text-blue-700' :
                                                  'bg-gray-50 text-gray-700'
                                                }`}
                                              >
                                                {story.status}
                                              </Badge>
                                              <Badge variant="outline" className="text-xs">{story.storyPoints} pts</Badge>
                                            </div>
                                            <p className="text-xs text-gray-500">Sprint {story.sprint} | {story.assignedTeam}</p>
                                          </div>
                                          <span className="text-xs text-gray-500">{story.tasks.length} tasks</span>
                                        </div>

                                        <AnimatePresence>
                                          {expandedStories.has(story.id) && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="p-3 border-t bg-white">
                                                <p className="text-sm text-gray-700 mb-3">{story.description}</p>
                                                
                                                {story.acceptanceCriteria.length > 0 && (
                                                  <div className="mb-3">
                                                    <p className="text-xs font-medium mb-1">Acceptance Criteria</p>
                                                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                                      {story.acceptanceCriteria.map((ac, idx) => (
                                                        <li key={idx}>{ac}</li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}

                                                {story.tasks.length > 0 && (
                                                  <div>
                                                    <p className="text-xs font-medium mb-2">Tasks</p>
                                                    <div className="space-y-1 ml-2">
                                                      {story.tasks.map(task => (
                                                        <div 
                                                          key={task.id} 
                                                          className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                                                          data-testid={`task-${task.id}`}
                                                        >
                                                          <div className={`w-2 h-2 rounded-full ${
                                                            task.status === 'done' ? 'bg-green-500' :
                                                            task.status === 'in-progress' ? 'bg-blue-500' :
                                                            task.status === 'blocked' ? 'bg-red-500' :
                                                            'bg-gray-300'
                                                          }`} />
                                                          <span className="flex-1 font-medium">{task.title}</span>
                                                          <span className="text-gray-500">{task.assignee}</span>
                                                          <span className="text-gray-400">{task.actualHours || task.estimatedHours}h</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Team Resources ({project.resources.length} members, {project.totalFTE} FTE)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Team</th>
                        <th className="text-center p-3">Allocation</th>
                        <th className="text-right p-3">Daily Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.resources.map(resource => (
                        <tr key={resource.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{resource.name}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">{resource.role}</Badge>
                          </td>
                          <td className="p-3 text-gray-600">{resource.team}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Progress value={resource.allocation} className="w-16 h-2" />
                              <span className="text-xs">{resource.allocation}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">${resource.costRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MilestoneIcon className="h-5 w-5 text-purple-600" />
                  Project Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.milestones.map((milestone, idx) => (
                    <div key={milestone.id} className="relative">
                      {idx < project.milestones.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          milestone.status === 'completed' ? 'bg-green-500' :
                          milestone.status === 'on-track' ? 'bg-blue-500' :
                          milestone.status === 'at-risk' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}>
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : (
                            <Clock className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{milestone.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                milestone.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                milestone.status === 'on-track' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                milestone.status === 'at-risk' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {milestone.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">PI {milestone.piNumber}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Target: {milestone.targetDate}</p>
                          <div className="flex flex-wrap gap-2">
                            {milestone.deliverables.map((deliverable, dIdx) => (
                              <Badge key={dIdx} variant="secondary" className="text-xs">
                                {deliverable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-purple-600" />
                  Cross-Project Dependencies ({project.dependencies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.dependencies.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No cross-project dependencies defined.</p>
                ) : (
                  <div className="space-y-4">
                    {project.dependencies.map(dep => {
                      const targetProject = getSafeProjectById(dep.targetProjectId);
                      return (
                        <div 
                          key={dep.id} 
                          className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${
                            dep.health === 'green' ? 'border-green-300 bg-green-50' :
                            dep.health === 'yellow' ? 'border-amber-300 bg-amber-50' :
                            'border-red-300 bg-red-50'
                          }`}
                          onClick={() => targetProject && setLocation(`/project/${targetProject.id}`)}
                          data-testid={`dependency-${dep.id}`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              dep.health === 'green' ? 'bg-green-500' :
                              dep.health === 'yellow' ? 'bg-amber-500' :
                              'bg-red-500'
                            }`} />
                            <Badge variant="outline" className="text-xs uppercase">{dep.type.replace('-', ' ')}</Badge>
                            <span className="font-semibold">{targetProject?.name || dep.targetProjectId}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{dep.description}</p>
                          {dep.impactIfDelayed && (
                            <div className="flex items-start gap-2 p-2 bg-white/50 rounded">
                              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-amber-800">Impact if Delayed</p>
                                <p className="text-xs text-amber-700">{dep.impactIfDelayed}</p>
                              </div>
                            </div>
                          )}
                          {dep.financialImpact && (
                            <div className="mt-2 flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-700">
                                ${(dep.financialImpact / 1000000).toFixed(1)}M financial impact
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Budget Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Total Budget</span>
                    <span className="font-bold text-lg">${(project.financials.budget / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span>Spent to Date</span>
                    <span className="font-bold text-blue-700">${(project.financials.spent / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${forecastVariance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <span>Forecast at Completion</span>
                    <div className="text-right">
                      <span className={`font-bold ${forecastVariance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        ${(project.financials.forecast / 1000000).toFixed(2)}M
                      </span>
                      <p className="text-xs text-gray-500">
                        {forecastVariance > 0 ? '+' : ''}{forecastVariance}% variance
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Labor Cost</span>
                      <span>${(project.financials.laborCost / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vendor Cost</span>
                      <span>${(project.financials.vendorCost / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Infrastructure</span>
                      <span>${(project.financials.infrastructureCost / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Contingency</span>
                      <span>${(project.financials.contingency / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    ROI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Projected ROI</p>
                    <p className="text-3xl font-bold text-purple-700">
                      ${(project.financials.roi.projected / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-xl font-bold">{project.financials.roi.confidence}%</p>
                      <Progress value={project.financials.roi.confidence} className="h-1 mt-2" />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Payback Period</p>
                      <p className="text-xl font-bold">{project.financials.roi.paybackMonths}</p>
                      <p className="text-xs text-gray-500">months</p>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">ROI Multiple</p>
                    <p className="text-2xl font-bold text-green-700">
                      {(project.financials.roi.projected / project.financials.budget).toFixed(1)}x
                    </p>
                    <p className="text-xs text-green-600">Return on investment</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Sparkles className="h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {project.aiRecommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-purple-900">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Target className="h-5 w-5" />
                    VRO Value Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {project.vroInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-900">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Activity className="h-5 w-5" />
                  PMO Data Feeds
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.pmoDataFeeds.map((feed, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-900">{feed}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </>
  );
}
