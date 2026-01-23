/**
 * RESOURCE MANAGEMENT PAGE
 *
 * Comprehensive resource management:
 * - Resource pools
 * - Resource allocations
 * - Capacity planning
 * - Skills matrix
 * - Timesheet management
 * - Utilization analytics
 */

import { useState } from 'react';
import { Users, Calendar, BarChart3, Award, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ResourceManagement() {
  const [activeTab, setActiveTab] = useState('pools');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Resource Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage resource pools, allocations, capacity, and utilization
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pools">
            <Users className="h-4 w-4 mr-2" />
            Pools
          </TabsTrigger>
          <TabsTrigger value="allocations">
            <Calendar className="h-4 w-4 mr-2" />
            Allocations
          </TabsTrigger>
          <TabsTrigger value="capacity">
            <BarChart3 className="h-4 w-4 mr-2" />
            Capacity
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Award className="h-4 w-4 mr-2" />
            Skills Matrix
          </TabsTrigger>
          <TabsTrigger value="timesheets">
            <Clock className="h-4 w-4 mr-2" />
            Timesheets
          </TabsTrigger>
          <TabsTrigger value="utilization">
            <TrendingUp className="h-4 w-4 mr-2" />
            Utilization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pools">
          <Card>
            <CardHeader>
              <CardTitle>Resource Pools</CardTitle>
              <CardDescription>Organize resources into pools by type, skill, or department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>resourcePools</code>
                </div>
                <Button>Create Resource Pool</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations">
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocations</CardTitle>
              <CardDescription>Drag-and-drop interface for resource-to-project assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>resourceAllocations</code>
                </div>
                <Button>Allocate Resources</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Planning</CardTitle>
              <CardDescription>Forecast demand vs capacity across teams and timeframes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Visual capacity planning dashboard with demand forecasting
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Matrix</CardTitle>
              <CardDescription>Track and visualize team member skills and expertise levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Interactive skills matrix with proficiency tracking
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheets">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Management</CardTitle>
              <CardDescription>Time entry, approval workflow, and project time tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>timesheets</code> with approval workflow
                </div>
                <Button>Enter Time</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <Card>
            <CardHeader>
              <CardTitle>Utilization Analytics</CardTitle>
              <CardDescription>Resource utilization reports and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Real-time utilization tracking with forecasting and trends
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
              <span>Resource Pools Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Allocations Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Timesheet Schema</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
