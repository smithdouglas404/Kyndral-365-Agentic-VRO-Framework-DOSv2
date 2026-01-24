import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf } from 'lucide-react';

export function SustainabilityContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Sustainability Metrics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Environmental impact and sustainability tracking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Sustainability Dashboard (Coming Soon)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Sustainability metrics and environmental impact tracking will be available in this tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
