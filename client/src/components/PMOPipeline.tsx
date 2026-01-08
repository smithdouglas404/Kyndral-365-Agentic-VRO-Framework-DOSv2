import { motion } from 'framer-motion';
import { pmoProjects, SAFePortfolioStage } from '@/lib/buPrograms';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Search, BarChart3, ClipboardList, Cog, CheckCircle2 } from 'lucide-react';

const SAFE_STAGES: { id: SAFePortfolioStage; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { id: 'funnel', label: 'Funnel', icon: Lightbulb, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  { id: 'reviewing', label: 'Reviewing', icon: Search, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  { id: 'analyzing', label: 'Analyzing', icon: BarChart3, color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200' },
  { id: 'portfolio-backlog', label: 'Portfolio Backlog', icon: ClipboardList, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  { id: 'implementing', label: 'Implementing', icon: Cog, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
];

function getStatusColor(status: 'green' | 'amber' | 'red') {
  switch (status) {
    case 'green': return 'bg-green-500';
    case 'amber': return 'bg-amber-500';
    case 'red': return 'bg-red-500';
  }
}

export function PMOPipeline() {
  const projectsByStage = SAFE_STAGES.map(stage => ({
    ...stage,
    projects: pmoProjects.filter(p => p.safeStage === stage.id)
  }));

  const totalProjects = pmoProjects.length;
  const implementingCount = pmoProjects.filter(p => p.safeStage === 'implementing').length;
  const doneCount = pmoProjects.filter(p => p.safeStage === 'done').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Pipeline (SAFe 6.0)</h3>
          <p className="text-sm text-gray-500">Visual flow of projects across portfolio stages</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600">Total:</span>
            <Badge variant="outline">{totalProjects}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600">Active:</span>
            <Badge className="bg-green-100 text-green-700">{implementingCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600">Complete:</span>
            <Badge className="bg-emerald-100 text-emerald-700">{doneCount}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {projectsByStage.map((stage, stageIdx) => {
          const Icon = stage.icon;
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stageIdx * 0.1 }}
              className={cn(
                "rounded-lg border p-3 min-h-[300px] flex flex-col",
                stage.bgColor
              )}
              data-testid={`pipeline-stage-${stage.id}`}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <Icon className={cn("h-4 w-4", stage.color)} />
                <span className={cn("text-sm font-semibold", stage.color)}>{stage.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {stage.projects.length}
                </Badge>
              </div>
              
              <div className="flex-1 space-y-2 overflow-y-auto">
                {stage.projects.length === 0 ? (
                  <div className="text-xs text-gray-400 italic text-center py-4">
                    No projects
                  </div>
                ) : (
                  stage.projects.map((project, idx) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: stageIdx * 0.1 + idx * 0.05 }}
                      className="bg-white rounded-md p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`pipeline-project-${project.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", getStatusColor(project.status))} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{project.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{project.bu}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 bg-gray-100 rounded-full h-1">
                              <div 
                                className="bg-[#005EB8] h-1 rounded-full transition-all"
                                style={{ width: `${(project.deliverables.completed / project.deliverables.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-400">
                              {project.deliverables.completed}/{project.deliverables.total}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">PMO Insight</h4>
            <p className="text-sm text-blue-700 mt-1">
              {implementingCount} projects are actively being implemented. Move projects through stages by completing their milestones and governance checkpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
