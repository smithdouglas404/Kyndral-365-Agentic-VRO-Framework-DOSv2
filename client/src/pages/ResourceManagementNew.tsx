/**
 * RESOURCE MANAGEMENT PAGE
 * Capacity planning, resource allocation, and skills tracking
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users, TrendingUp, AlertTriangle, CheckCircle, Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function ResourceManagementNew() {
  const [view, setView] = useState<'list' | 'capacity' | 'skills'>('capacity');

  const { data: capacityData } = useQuery({
    queryKey: ['resources', 'capacity'],
    queryFn: async () => {
      const res = await fetch('/api/resources/capacity/analysis');
      if (!res.ok) throw new Error('Failed to fetch capacity');
      return res.json();
    },
  });

  const { data: skillsData } = useQuery({
    queryKey: ['resources', 'skills'],
    queryFn: async () => {
      const res = await fetch('/api/resources/skills/matrix');
      if (!res.ok) throw new Error('Failed to fetch skills matrix');
      return res.json();
    },
  });

  const analysis = capacityData?.analysis;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Resource Management</h1>
          <p className="text-muted-foreground">Capacity planning and resource allocation</p>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('capacity')}
          className={`px-4 py-2 rounded-lg ${
            view === 'capacity'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Capacity Analysis
        </button>
        <button
          onClick={() => setView('skills')}
          className={`px-4 py-2 rounded-lg ${
            view === 'skills'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Skills Matrix
        </button>
      </div>

      {/* Capacity Analysis View */}
      {view === 'capacity' && analysis && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analysis.totalResources}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active team members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Utilization Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analysis.utilizationRate}%</div>
                <Progress value={parseFloat(analysis.utilizationRate)} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Over-allocated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div className="text-3xl font-bold">{analysis.overallocatedCount}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div className="text-3xl font-bold">{analysis.underutilizedCount}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Can take more work
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Resource Capacity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {capacityData?.resources?.map((resource: any) => {
                  const allocated = parseFloat(resource.allocated_percent);
                  const isOverallocated = allocated > 100;
                  const isFullyAllocated = allocated >= 90 && allocated <= 100;

                  return (
                    <div key={resource.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {resource.role || 'No role'} • {resource.project_count} projects
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverallocated && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          {isFullyAllocated && !isOverallocated && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          <span className={`text-sm font-semibold ${
                            isOverallocated ? 'text-red-600' :
                            isFullyAllocated ? 'text-green-600' :
                            'text-blue-600'
                          }`}>
                            {allocated.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isOverallocated ? 'bg-red-500' :
                            isFullyAllocated ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(allocated, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skills Matrix View */}
      {view === 'skills' && skillsData && (
        <Card>
          <CardHeader>
            <CardTitle>Skills Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="text-left p-2 font-semibold sticky left-0 bg-slate-50 dark:bg-slate-700">
                      Resource
                    </th>
                    <th className="text-left p-2 font-semibold">Role</th>
                    {skillsData.allSkills?.map((skill: string) => (
                      <th key={skill} className="text-center p-2 font-semibold min-w-[100px]">
                        {skill}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {skillsData.matrix?.map((row: any) => (
                    <tr key={row.resourceId} className="border-t dark:border-slate-700">
                      <td className="p-2 font-medium sticky left-0 bg-white dark:bg-slate-800">
                        {row.resourceName}
                      </td>
                      <td className="p-2 text-muted-foreground">{row.role || '-'}</td>
                      {skillsData.allSkills?.map((skill: string) => (
                        <td key={skill} className="text-center p-2">
                          {row.skills[skill] ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
