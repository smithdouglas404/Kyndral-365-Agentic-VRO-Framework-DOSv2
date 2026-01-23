/**
 * PROGRAM MANAGEMENT PAGE
 *
 * Comprehensive program/portfolio management:
 * - Program hierarchy
 * - Cross-project dependencies
 * - Master schedule
 * - Program dashboards
 */

import { useState } from 'react';
import { Layers, GitBranch, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProgramManagement() {
  const [activeTab, setActiveTab] = useState('hierarchy');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Layers className="h-8 w-8" />
          Program Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage programs, portfolios, cross-project dependencies, and master schedules
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hierarchy">
            <Layers className="h-4 w-4 mr-2" />
            Program Hierarchy
          </TabsTrigger>
          <TabsTrigger value="dependencies">
            <GitBranch className="h-4 w-4 mr-2" />
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="master-schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Master Schedule
          </TabsTrigger>
          <TabsTrigger value="dashboards">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Program Hierarchy</CardTitle>
              <CardDescription>Organize projects into programs and portfolios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Create a hierarchical structure to organize related projects into programs,
                  and programs into portfolios. Track program-level objectives, budgets, and timelines.
                </div>
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>programs</code>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Schema Fields:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- portfolioId (FK to portfolios)</div>
                    <div>- name, description</div>
                    <div>- manager (FK to users)</div>
                    <div>- startDate, endDate</div>
                    <div>- budget, status (active, on_hold, completed)</div>
                    <div>- createdAt</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Hierarchy Levels:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>1. Portfolio (strategic initiatives)</div>
                    <div>2. Program (related projects)</div>
                    <div>3. Project (specific deliverables)</div>
                    <div>4. Work Packages / Features</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Visual hierarchy tree view</div>
                    <div>- Drag-and-drop to reorganize</div>
                    <div>- Roll-up metrics (budget, schedule, risks)</div>
                    <div>- Program health indicators</div>
                    <div>- Resource allocation across program</div>
                  </div>
                </div>
                <Button>Create Program</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Project Dependencies</CardTitle>
              <CardDescription>Track and manage dependencies between projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Identify and manage dependencies between projects within programs or across the portfolio.
                  Understand critical paths and potential bottlenecks.
                </div>
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>projectDependencies</code>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Schema Fields:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- predecessorId (FK to projects)</div>
                    <div>- successorId (FK to projects)</div>
                    <div>- dependencyType (finish_to_start, start_to_start, finish_to_finish, start_to_finish)</div>
                    <div>- lagDays (lead/lag time in days)</div>
                    <div>- createdAt</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Dependency Types:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Finish-to-Start (FS): Most common, successor starts after predecessor finishes</div>
                    <div>- Start-to-Start (SS): Both projects start together</div>
                    <div>- Finish-to-Finish (FF): Both projects finish together</div>
                    <div>- Start-to-Finish (SF): Successor finishes when predecessor starts</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Visual dependency graph</div>
                    <div>- Critical path analysis</div>
                    <div>- Circular dependency detection</div>
                    <div>- Impact analysis (what-if scenarios)</div>
                    <div>- Dependency status tracking</div>
                  </div>
                </div>
                <Button>Add Dependency</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="master-schedule">
          <Card>
            <CardHeader>
              <CardTitle>Master Schedule</CardTitle>
              <CardDescription>Integrated schedule across all programs and projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Maintain a master schedule that integrates all project schedules within a program or portfolio.
                  Track baseline vs. actual, identify schedule conflicts, and visualize the critical path.
                </div>
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>masterSchedule</code>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Schema Fields:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- programId (FK to programs)</div>
                    <div>- portfolioId (FK to portfolios)</div>
                    <div>- name (schedule version name)</div>
                    <div>- baseline (JSON snapshot of baseline schedule)</div>
                    <div>- lastUpdated, createdAt</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Schedule Views:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Gantt chart (interactive timeline)</div>
                    <div>- PERT chart (network diagram)</div>
                    <div>- Calendar view (milestone dates)</div>
                    <div>- Resource histogram (resource loading)</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Baseline management (save/compare)</div>
                    <div>- Schedule leveling (resource optimization)</div>
                    <div>- What-if analysis (scenario planning)</div>
                    <div>- Critical path highlighting</div>
                    <div>- Schedule variance analysis</div>
                    <div>- Export to MS Project, Primavera</div>
                  </div>
                </div>
                <Button>Create Master Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboards">
          <Card>
            <CardHeader>
              <CardTitle>Program Dashboards</CardTitle>
              <CardDescription>Executive dashboards for program and portfolio visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Comprehensive dashboards providing program-level visibility and insights:
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Key Metrics:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Program health score</div>
                      <div>- Schedule performance (SPI)</div>
                      <div>- Cost performance (CPI)</div>
                      <div>- Risk exposure</div>
                      <div>- Resource utilization</div>
                      <div>- Benefits realization</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Visualizations:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Program roadmap timeline</div>
                      <div>- Project status heat map</div>
                      <div>- Budget burn-down chart</div>
                      <div>- Milestone tracker</div>
                      <div>- Risk/issue trending</div>
                      <div>- Dependency network graph</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Dashboard Types:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Executive summary (high-level KPIs)</div>
                    <div>- Program manager view (detailed metrics)</div>
                    <div>- Financial dashboard (budget, costs, ROI)</div>
                    <div>- Resource dashboard (capacity, allocation)</div>
                    <div>- Risk dashboard (risk heat map, trends)</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Aggregates data from projects, programs, dependencies, schedules, and financial tables.
                </div>
                <Button>View Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
          <CardDescription>All program management schemas created and ready for implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>programs</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>projectDependencies</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>masterSchedule</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
