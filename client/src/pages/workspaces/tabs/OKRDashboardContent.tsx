import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export function OKRDashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">OKR Alignment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Strategic objectives and key results tracking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            OKR Dashboard (Coming Soon)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            OKR tracking and strategic alignment features will be available in this tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
