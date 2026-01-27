// Simulation removed - component now shows "No data available" state
// TODO: Wire to real-time project data from backend when available

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  onDrillDown?: (type: string, id: string) => void;
}

export function ProjectLifecycleCommandCenter({ onDrillDown }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle size={18} className="text-gray-400" />
          Project Lifecycle Command Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            No real-time project lifecycle data available
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
