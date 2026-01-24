import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export function AnalyticsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Advanced Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Data insights and performance analytics
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard (Coming Soon)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Advanced analytics and reporting features will be available in this tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
