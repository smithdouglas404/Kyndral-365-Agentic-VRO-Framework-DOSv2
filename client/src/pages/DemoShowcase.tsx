/**
 * Demo Showcase Page
 * Central hub for all demo features - Time Travel, Agent Memory, Activity Timeline
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentActivityTimeline } from '@/components/AgentActivityTimeline';
import { TimeTravelViewer } from '@/components/TimeTravelViewer';
import { AgentMemoryDemo } from '@/components/AgentMemoryDemo';
import { Brain, Clock, Activity } from 'lucide-react';

export default function DemoShowcase() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Demo Showcase</h1>
          <p className="text-muted-foreground">
            Explore advanced agent capabilities: memory, pattern recognition, and time travel
          </p>
        </div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity Timeline
            </TabsTrigger>
            <TabsTrigger value="timetravel" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Travel
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Agent Memory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <AgentActivityTimeline />
          </TabsContent>

          <TabsContent value="timetravel" className="mt-6">
            <TimeTravelViewer />
          </TabsContent>

          <TabsContent value="memory" className="mt-6">
            <AgentMemoryDemo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
