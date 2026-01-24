import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export function AgentMonitoringContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Agent Monitoring</h2>
        <p className="text-sm text-gray-500 mt-1">
          Real-time monitoring of AI agent activity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Agent Performance Monitoring (Coming Soon)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Real-time agent monitoring and performance metrics will be available in this tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
