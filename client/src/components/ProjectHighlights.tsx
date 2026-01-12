import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { useSimulation } from "@/lib/liveSimulationEngine";
import { cn } from "@/lib/utils";

interface ProjectHighlightsProps {
  onDrillDown?: (type: string, id: string) => void;
}

export function ProjectHighlights({ onDrillDown }: ProjectHighlightsProps) {
  const { state } = useSimulation();

  const handleProjectClick = (id: string, name: string) => {
    onDrillDown?.('project', id);
  };

  return (
    <Card data-testid="project-highlights">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 size={18} className="text-green-600" />
          Project Highlights
        </CardTitle>
        <CardDescription>Recent changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {state.recentChanges.slice(0, 8).map((change, idx) => (
            <motion.div
              key={change.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-2 rounded-lg border bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => handleProjectClick(change.id, change.entityName)}
            >
              <div className="flex items-center gap-2">
                {change.trend === 'up' ? (
                  <TrendingUp size={14} className="text-green-600" />
                ) : (
                  <TrendingDown size={14} className="text-red-500" />
                )}
                <div>
                  <p className="text-xs font-medium truncate max-w-[180px]">{change.entityName}</p>
                  <p className="text-[10px] text-muted-foreground">{change.field}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-xs font-medium",
                  change.trend === 'up' ? "text-green-600" : "text-red-500"
                )}>
                  {change.oldValue} → {change.newValue}
                </span>
              </div>
            </motion.div>
          ))}
          {state.recentChanges.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Monitoring for changes...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
