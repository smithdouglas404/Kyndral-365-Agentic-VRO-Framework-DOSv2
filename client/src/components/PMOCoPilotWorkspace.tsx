import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, Bot, ChevronRight, Filter, Search,
  ArrowLeft, Clock, Target, AlertTriangle, TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PMOProject, SAFePortfolioStage } from '@/lib/buPrograms';
import { EXPANDED_PMO_PROJECTS } from '@/lib/unifiedMetrics';
import { PMOProjectWorkspace } from './PMOProjectWorkspace';

const STAGE_LABELS: Record<SAFePortfolioStage, { label: string; color: string }> = {
  'funnel': { label: 'Funnel', color: 'bg-purple-100 text-purple-700' },
  'reviewing': { label: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
  'analyzing': { label: 'Analyzing', color: 'bg-cyan-100 text-cyan-700' },
  'portfolio-backlog': { label: 'Backlog', color: 'bg-amber-100 text-amber-700' },
  'implementing': { label: 'Implementing', color: 'bg-green-100 text-green-700' },
  'done': { label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
};

function getStatusColor(status: 'green' | 'amber' | 'red') {
  switch (status) {
    case 'green': return 'bg-green-500';
    case 'amber': return 'bg-amber-500';
    case 'red': return 'bg-red-500';
  }
}

export function PMOCoPilotWorkspace() {
  const [selectedProject, setSelectedProject] = useState<PMOProject | null>(null);
  const [stageFilter, setStageFilter] = useState<SAFePortfolioStage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allProjects = EXPANDED_PMO_PROJECTS as PMOProject[];
  
  const filteredProjects = allProjects.filter(project => {
    const matchesStage = stageFilter === 'all' || project.safeStage === stageFilter;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.bu.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const activeProjectsCount = allProjects.filter(p => p.safeStage === 'implementing').length;
  const totalActionsCount = allProjects.reduce((acc, p) => acc + p.proactiveActions.length, 0);
  const totalRisksCount = allProjects.reduce((acc, p) => acc + p.risks.length, 0);
  const totalSignalsCount = allProjects.reduce((acc, p) => acc + p.aiSignals.length, 0);

  if (selectedProject) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          className="gap-2 mb-4"
          onClick={() => setSelectedProject(null)}
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project List
        </Button>
        <PMOProjectWorkspace project={selectedProject} />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pmo-copilot-workspace">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Compass className="h-7 w-7 text-[#005EB8]" />
            Project Co-Pilot
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered project guidance with stage-aware recommendations, action queues, and collaboration tools
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4" data-testid="stat-active-projects">
          <p className="text-sm text-purple-600 font-medium">Active Projects</p>
          <p className="text-3xl font-bold text-purple-900">{activeProjectsCount}</p>
          <p className="text-xs text-purple-500 mt-1">Currently implementing</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4" data-testid="stat-actions-pending">
          <p className="text-sm text-amber-600 font-medium">Actions Pending</p>
          <p className="text-3xl font-bold text-amber-900">{totalActionsCount}</p>
          <p className="text-xs text-amber-500 mt-1">Across all projects</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-4" data-testid="stat-active-risks">
          <p className="text-sm text-red-600 font-medium">Active Risks</p>
          <p className="text-3xl font-bold text-red-900">{totalRisksCount}</p>
          <p className="text-xs text-red-500 mt-1">Requiring attention</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4" data-testid="stat-ai-signals">
          <p className="text-sm text-green-600 font-medium">AI Signals</p>
          <p className="text-3xl font-bold text-green-900">{totalSignalsCount}</p>
          <p className="text-xs text-green-500 mt-1">Insights & predictions</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400" />
          <Button
            variant={stageFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStageFilter('all')}
            className={stageFilter === 'all' ? 'bg-[#005EB8]' : ''}
            data-testid="filter-all-stages"
          >
            All Stages
          </Button>
          {(['implementing', 'analyzing', 'portfolio-backlog', 'reviewing', 'funnel', 'done'] as SAFePortfolioStage[]).map(stage => (
            <Button
              key={stage}
              variant={stageFilter === stage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStageFilter(stage)}
              className={stageFilter === stage ? 'bg-[#005EB8]' : ''}
              data-testid={`filter-stage-${stage}`}
            >
              {STAGE_LABELS[stage].label}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            data-testid="input-search-projects"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">AI Co-Pilot Ready</p>
          <p className="text-sm text-blue-700">
            Select a project below to access stage-aware guidance, action queues, risk radar, and collaboration tools.
            Each workspace is tailored to the project's current SAFe 6.0 stage.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Projects ({filteredProjects.length})
        </h3>
        <AnimatePresence mode="wait">
          <motion.div
            key={stageFilter + searchQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedProject(project)}
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", getStatusColor(project.status))} />
                    <Badge className={STAGE_LABELS[project.safeStage].color}>
                      {STAGE_LABELS[project.safeStage].label}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#005EB8] transition-colors" />
                </div>

                <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-[#005EB8] transition-colors">
                  {project.name}
                </h4>
                <p className="text-sm text-gray-500 mb-3">{project.bu}</p>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                      <Target className="h-3 w-3" />
                      Progress
                    </div>
                    <p className="font-semibold text-gray-900">
                      {Math.round((project.deliverables.completed / project.deliverables.total) * 100)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      Risks
                    </div>
                    <p className="font-semibold text-gray-900">{project.risks.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                      <TrendingUp className="h-3 w-3" />
                      Actions
                    </div>
                    <p className="font-semibold text-gray-900">{project.proactiveActions.length}</p>
                  </div>
                </div>

                {project.aiSignals.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <Bot className="h-3.5 w-3.5 text-purple-500 mt-0.5" />
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {project.aiSignals[0].message}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No projects found matching your criteria</p>
            <Button 
              variant="link" 
              onClick={() => { setStageFilter('all'); setSearchQuery(''); }}
              data-testid="button-clear-filters"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
