import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

// Simulation removed - component now shows "No changes" state
// TODO: Wire to real-time project change feed from backend when available
interface ProjectHighlightsProps {
  onDrillDown?: (type: string, id: string) => void;
}

export function ProjectHighlights({ onDrillDown }: ProjectHighlightsProps) {
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
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent changes available
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
