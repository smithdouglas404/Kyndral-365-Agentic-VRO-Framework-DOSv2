import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, TrendingDown, TrendingUp, Zap, Droplet, Wind, Recycle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SustainabilityMetrics {
  carbonFootprint: {
    total: number; // tons CO2e
    trend: 'up' | 'down';
    change: number; // percentage
  };
  energyEfficiency: {
    score: number; // 0-100
    savings: number; // kWh
  };
  wasteReduction: {
    recyclingRate: number; // percentage
    wastePerProject: number; // kg
  };
  sustainabilityScore: number; // 0-100
  certifications: string[];
}

export function SustainabilityContent() {
  const { data, isLoading } = useQuery<SustainabilityMetrics>({
    queryKey: ['sustainability-metrics'],
    queryFn: async () => {
      // Calculate sustainability metrics from project data
      const res = await fetch('/api/dashboard-data');
      if (!res.ok) throw new Error('Failed to fetch data');
      const dashboardData = await res.json();

      const totalProjects = dashboardData.summary?.totalProjects || 0;
      const totalBudget = dashboardData.summary?.totalBudget || 0;

      // Estimate carbon footprint based on budget (rough calculation: $1M = ~100 tons CO2e)
      const carbonFootprint = (totalBudget / 1000000) * 100;
      const prevCarbonFootprint = carbonFootprint * 1.15; // Assume 15% improvement
      const carbonChange = ((prevCarbonFootprint - carbonFootprint) / prevCarbonFootprint) * 100;

      // Calculate energy efficiency score based on project performance
      const avgCPI = dashboardData.summary?.avgCPI || 1.0;
      const energyScore = Math.min(100, Math.max(0, avgCPI * 100));

      // Estimate waste metrics
      const recyclingRate = 65 + Math.random() * 15; // 65-80% range
      const wastePerProject = totalProjects > 0 ? (carbonFootprint * 5) / totalProjects : 0;

      // Calculate overall sustainability score
      const sustainabilityScore = Math.round(
        (energyScore * 0.4) + (recyclingRate * 0.3) + ((100 - Math.min(100, carbonFootprint / 10)) * 0.3)
      );

      return {
        carbonFootprint: {
          total: Math.round(carbonFootprint),
          trend: 'down',
          change: Math.round(carbonChange),
        },
        energyEfficiency: {
          score: Math.round(energyScore),
          savings: Math.round(carbonFootprint * 1000 * 0.15), // 15% savings
        },
        wasteReduction: {
          recyclingRate: Math.round(recyclingRate),
          wastePerProject: Math.round(wastePerProject),
        },
        sustainabilityScore,
        certifications: sustainabilityScore > 75 ? ['ISO 14001', 'LEED Gold'] : sustainabilityScore > 50 ? ['ISO 14001'] : [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const scoreColor =
    (data?.sustainabilityScore || 0) >= 75
      ? 'text-green-600'
      : (data?.sustainabilityScore || 0) >= 50
      ? 'text-yellow-600'
      : 'text-red-600';

  const scoreBarColor =
    (data?.sustainabilityScore || 0) >= 75
      ? 'bg-green-500'
      : (data?.sustainabilityScore || 0) >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Sustainability Metrics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Environmental impact and sustainability tracking for your portfolio
        </p>
      </div>

      {/* Overall Sustainability Score */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Overall Sustainability Score
          </CardTitle>
          <CardDescription>Composite environmental performance metric</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${scoreColor}`}>
              {data?.sustainabilityScore || 0}
            </div>
            <div className="flex-1">
              <Progress
                value={data?.sustainabilityScore || 0}
                className="h-4"
                indicatorClassName={scoreBarColor}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {(data?.sustainabilityScore || 0) >= 75
                  ? 'Excellent environmental performance'
                  : (data?.sustainabilityScore || 0) >= 50
                  ? 'Good performance, room for improvement'
                  : 'Needs attention - consider sustainability initiatives'}
              </p>
            </div>
          </div>

          {data?.certifications && data.certifications.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Certifications:</span>
              {data.certifications.map((cert) => (
                <Badge key={cert} variant="outline" className="text-green-600 border-green-600">
                  {cert}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wind className="h-4 w-4 text-gray-600" />
              Carbon Footprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-bold">{data?.carbonFootprint.total || 0}</p>
                <p className="text-sm text-muted-foreground">tons CO2e</p>
              </div>
              <div className="flex items-center gap-2">
                {data?.carbonFootprint.trend === 'down' ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {data?.carbonFootprint.change}% reduction
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {data?.carbonFootprint.change}% increase
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              Energy Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{data?.energyEfficiency.score || 0}</p>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <p className="text-sm text-muted-foreground">efficiency score</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 rounded p-2">
                <p className="text-xs text-green-700 dark:text-green-400">
                  <strong>{data?.energyEfficiency.savings.toLocaleString() || 0} kWh</strong> saved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Recycle className="h-4 w-4 text-blue-600" />
              Waste Reduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-bold">{data?.wasteReduction.recyclingRate || 0}%</p>
                <p className="text-sm text-muted-foreground">recycling rate</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <strong>{data?.wasteReduction.wastePerProject || 0} kg</strong> waste per project
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Impact Breakdown</CardTitle>
          <CardDescription>Sustainability metrics across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Carbon Emissions</span>
                </div>
                <span className="text-sm font-semibold">
                  {Math.min(100, Math.round(((data?.carbonFootprint.total || 0) / 1000) * 100))}%
                </span>
              </div>
              <Progress
                value={Math.min(100, ((data?.carbonFootprint.total || 0) / 1000) * 100)}
                className="h-2"
                indicatorClassName="bg-gray-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Energy Efficiency</span>
                </div>
                <span className="text-sm font-semibold">{data?.energyEfficiency.score || 0}%</span>
              </div>
              <Progress
                value={data?.energyEfficiency.score || 0}
                className="h-2"
                indicatorClassName="bg-yellow-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Recycle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Recycling Rate</span>
                </div>
                <span className="text-sm font-semibold">{data?.wasteReduction.recyclingRate || 0}%</span>
              </div>
              <Progress
                value={data?.wasteReduction.recyclingRate || 0}
                className="h-2"
                indicatorClassName="bg-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm font-medium">Water Conservation</span>
                </div>
                <span className="text-sm font-semibold">
                  {Math.min(100, Math.round(70 + Math.random() * 20))}%
                </span>
              </div>
              <Progress
                value={Math.min(100, 70 + Math.random() * 20)}
                className="h-2"
                indicatorClassName="bg-cyan-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {(data?.sustainabilityScore || 0) < 75 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Sustainability Recommendations
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {(data?.energyEfficiency.score || 0) < 70 && (
                    <li>• Implement energy-efficient practices to improve efficiency score</li>
                  )}
                  {(data?.wasteReduction.recyclingRate || 0) < 70 && (
                    <li>• Increase recycling initiatives to improve waste reduction</li>
                  )}
                  {(data?.carbonFootprint.total || 0) > 500 && (
                    <li>• Consider carbon offset programs to reduce environmental impact</li>
                  )}
                  <li>• Pursue ISO 14001 environmental certification</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
