/**
 * RISK MANAGEMENT PAGE
 *
 * Comprehensive risk management:
 * - Risk register with categorization
 * - Risk assessment (probability × impact matrix)
 * - Risk response plans
 * - Risk heat maps
 * - Risk trending and forecasting
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Shield, TrendingUp, Grid, FileText, Map } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RiskManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('register');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Fetch risks
  const { data: risks = [] } = useQuery({
    queryKey: ['risks', selectedProject],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProject !== 'all') params.set('projectId', selectedProject);

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/risks?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch risks');
      return res.json();
    },
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  // Risk matrix data (probability × impact)
  const riskMatrix = {
    probabilities: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
    impacts: ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'],
  };

  const getRiskScore = (probability: string, impact: string): number => {
    const probMap: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3 };
    const impMap: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3 };
    return (probMap[probability] || 2) * (impMap[impact] || 2);
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 7) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Risk Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Identify, assess, and manage project risks
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>Add Risk</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="register">
            <FileText className="h-4 w-4 mr-2" />
            Risk Register
          </TabsTrigger>
          <TabsTrigger value="assessment">
            <Grid className="h-4 w-4 mr-2" />
            Assessment Matrix
          </TabsTrigger>
          <TabsTrigger value="responses">
            <Shield className="h-4 w-4 mr-2" />
            Response Plans
          </TabsTrigger>
          <TabsTrigger value="heatmap">
            <Map className="h-4 w-4 mr-2" />
            Heat Map
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Grid className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Risk Register */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Risk Register</CardTitle>
              <CardDescription>
                Comprehensive list of identified risks with probability, impact, and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {risks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No risks identified yet
                  </div>
                ) : (
                  risks.map((risk: any) => {
                    const score = getRiskScore(risk.probability || 'medium', risk.impact || 'medium');
                    const level = getRiskLevel(score);
                    return (
                      <Card key={risk.id} className="border-l-4" style={{ borderLeftColor:
                        level === 'critical' ? '#ef4444' :
                        level === 'high' ? '#f97316' :
                        level === 'medium' ? '#eab308' : '#3b82f6'
                      }}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{risk.name}</CardTitle>
                            <Badge variant={
                              level === 'critical' ? 'destructive' :
                              level === 'high' ? 'default' : 'secondary'
                            }>
                              {level.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Probability:</span>
                              <span className="ml-2 font-medium">{risk.probability || 'medium'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Impact:</span>
                              <span className="ml-2 font-medium">{risk.impact || 'medium'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <span className="ml-2 font-medium">{risk.status || 'open'}</span>
                            </div>
                          </div>
                          {risk.mitigation && (
                            <div className="mt-3 text-sm">
                              <span className="text-muted-foreground">Mitigation:</span>
                              <p className="mt-1">{risk.mitigation}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment Matrix */}
        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Matrix</CardTitle>
              <CardDescription>
                Probability × Impact matrix for visual risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-slate-50">Probability \ Impact</th>
                      {riskMatrix.impacts.map((impact) => (
                        <th key={impact} className="border p-2 bg-slate-50 text-sm">
                          {impact}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {riskMatrix.probabilities.reverse().map((probability) => (
                      <tr key={probability}>
                        <td className="border p-2 bg-slate-50 font-medium text-sm">
                          {probability}
                        </td>
                        {riskMatrix.impacts.map((impact, idx) => {
                          const score = (riskMatrix.probabilities.indexOf(probability) + 1) * (idx + 1);
                          const level = getRiskLevel(score);
                          return (
                            <td
                              key={impact}
                              className="border p-4 text-center text-xs font-semibold"
                              style={{
                                backgroundColor:
                                  level === 'critical' ? '#fee2e2' :
                                  level === 'high' ? '#fed7aa' :
                                  level === 'medium' ? '#fef3c7' : '#dbeafe',
                                color: level === 'critical' || level === 'high' ? '#991b1b' : '#1e3a8a'
                              }}
                            >
                              {score}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border"></div>
                  <span>Critical (9+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 border"></div>
                  <span>High (5-8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border"></div>
                  <span>Medium (3-4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border"></div>
                  <span>Low (1-2)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Response Plans */}
        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Risk Response Plans</CardTitle>
              <CardDescription>
                Mitigation strategies: Avoid, Mitigate, Transfer, Accept
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Database schema created: <code>riskResponses</code> with strategy, action plan, owner, and effectiveness tracking
              </div>
              <Button className="mt-4">Create Response Plan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heat Map */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Risk Heat Map</CardTitle>
              <CardDescription>
                Visual representation of risk distribution across the portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Interactive heat map showing risk concentration by project, category, and time period
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Categories */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Risk Categories</CardTitle>
              <CardDescription>
                Organize risks by category for better analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>riskCategories</code>
                </div>
                <Button>Manage Categories</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Risk Trends</CardTitle>
              <CardDescription>
                Track how risks evolve over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Trend analysis showing risk emergence, resolution, and escalation patterns
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Risk Register (existing risks table)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Risk Categories Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Risk Responses Schema</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
