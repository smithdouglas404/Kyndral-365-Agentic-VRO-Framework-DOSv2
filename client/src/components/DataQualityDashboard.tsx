/**
 * Data Quality Dashboard
 *
 * Purpose: Show data completeness metrics across all projects
 * Helps prioritize data collection efforts and agent scanning
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, DollarSign, Target, Layers, Info,
  ArrowUpDown, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectDataQuality {
  projectId: string;
  projectName: string;
  status: string;
  completenessScore: number;
  dataCompleteness: {
    hasPortfolio: boolean;
    hasTheme: boolean;
    hasBudget: boolean;
    hasExpectedROI: boolean;
    hasDivision: boolean;
    hasOKR: boolean;
    hasSAFe: boolean;
    hasPerformance: boolean;
  };
  budget: number;
  isHighValue: boolean;
  needsOKRInference: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface DataQualityStats {
  totalProjects: number;
  avgCompleteness: number;
  projectsNeedingOKR: number;
  highValueLowData: number;
  criticalPriority: number;
}

export function DataQualityDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DataQualityStats | null>(null);
  const [projects, setProjects] = useState<ProjectDataQuality[]>([]);
  const [sortBy, setSortBy] = useState<'completeness' | 'budget' | 'priority'>('priority');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    fetchDataQuality();
  }, []);

  const fetchDataQuality = async () => {
    try {
      setLoading(true);
      // Call the OKR Inference Agent's data completeness endpoint
      const response = await fetch('/api/agents/test/okr-inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: 'Assess data completeness for all projects. Return detailed completeness scores and flag high-value projects with missing data.',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Parse the agent's output to extract stats and assessments
        const outputMatch = data.output?.match(/\{[\s\S]*\}/);
        if (outputMatch) {
          const parsed = JSON.parse(outputMatch[0]);
          setStats(parsed.stats);
          setProjects(parsed.assessments || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'completeness') {
      return a.completenessScore - b.completenessScore;
    } else if (sortBy === 'budget') {
      return b.budget - a.budget;
    } else {
      // Sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
  });

  const filteredProjects = filterPriority === 'all'
    ? sortedProjects
    : sortedProjects.filter(p => p.priority === filterPriority);

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-amber-500';
      case 'medium': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Analyzing data quality across all projects...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="data-quality-dashboard">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Avg Completeness</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.avgCompleteness || 0}%</p>
              </div>
              <Database className="h-8 w-8 text-purple-200" />
            </div>
            <Progress value={stats?.avgCompleteness || 0} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Projects</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.totalProjects || 0}</p>
              </div>
              <Layers className="h-8 w-8 text-blue-200" />
            </div>
            <p className="text-xs text-gray-500 mt-2">in portfolio</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Need OKR Mapping</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.projectsNeedingOKR || 0}</p>
              </div>
              <Target className="h-8 w-8 text-amber-200" />
            </div>
            <p className="text-xs text-gray-500 mt-2">missing linkage</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">High Value + Low Data</p>
                <p className="text-2xl font-bold text-red-600">{stats?.highValueLowData || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-200" />
            </div>
            <p className="text-xs text-gray-500 mt-2">needs attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Critical Priority</p>
                <p className="text-2xl font-bold text-green-600">{stats?.criticalPriority || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
            <p className="text-xs text-gray-500 mt-2">urgent action</p>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Project Data Quality</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Sort by Priority</SelectItem>
                  <SelectItem value="completeness">Sort by Completeness</SelectItem>
                  <SelectItem value="budget">Sort by Budget</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchDataQuality}
                data-testid="button-refresh"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProjects.slice(0, 50).map((project, idx) => (
              <motion.div
                key={project.projectId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                data-testid={`project-quality-${project.projectId}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-1.5 rounded ${getPriorityColor(project.priority)}`}>
                        {getPriorityIcon(project.priority)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{project.projectName}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="capitalize">{project.status}</span>
                          {project.isHighValue && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              High Value (${project.budget}M)
                            </Badge>
                          )}
                          {project.needsOKRInference && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                              Needs OKR Mapping
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-8 gap-2 mt-3">
                      {Object.entries(project.dataCompleteness).map(([field, hasData]) => {
                        const fieldLabels: Record<string, string> = {
                          hasPortfolio: 'Portfolio',
                          hasTheme: 'Theme',
                          hasBudget: 'Budget',
                          hasExpectedROI: 'ROI',
                          hasDivision: 'Division',
                          hasOKR: 'OKR',
                          hasSAFe: 'SAFe',
                          hasPerformance: 'Metrics',
                        };

                        return (
                          <TooltipProvider key={field}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`
                                  flex items-center justify-center p-2 rounded text-xs
                                  ${hasData
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                                  }
                                `}>
                                  {hasData ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{fieldLabels[field] || field}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className={`
                      inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2
                      ${getCompletenessColor(project.completenessScore)}
                    `}>
                      <span className="text-2xl font-bold">{project.completenessScore}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">completeness</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No projects match the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Data Completeness Criteria:</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span>Portfolio • Theme • Budget • Expected ROI • Division • OKR • SAFe • Performance</span>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">Critical: High value + low data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-gray-600">High: &lt;50% complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-600">Medium: 50-80% complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-xs text-gray-600">Low: &gt;80% complete</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
