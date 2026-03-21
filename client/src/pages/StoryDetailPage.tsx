/**
 * STORY DETAIL PAGE
 *
 * Comprehensive view of a User Story including:
 * - Story overview and acceptance criteria
 * - Related tasks with status
 * - Team assignments
 * - Sprint information
 * - Comments and activity
 */

import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GitBranch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Target,
  Calendar,
  ChevronRight,
  Zap,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Square,
  MessageSquare,
  Paperclip,
  Flag,
  Tag,
  Timer,
  CheckSquare,
  ListTodo,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Square },
  backlog: { label: 'Backlog', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Square },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: PlayCircle },
  'in progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: PlayCircle },
  'in-review': { label: 'In Review', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700 border-red-200', icon: PauseCircle },
  done: { label: 'Done', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
};

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200', icon: Flag },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Flag },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Flag },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Flag },
};

// ============================================================================
// TASK CARD COMPONENT
// ============================================================================

function TaskCard({ task, index }: { task: any; index: number }) {
  const statusKey = (task.status || 'todo').toLowerCase().replace(/_/g, '-');
  const statusConfig = STATUS_CONFIG[statusKey as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.todo;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className={cn('p-1.5 rounded', statusConfig.color.split(' ')[0])}>
        <StatusIcon className={cn('h-4 w-4', statusConfig.color.split(' ')[1])} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{task.name}</p>
        {task.description && (
          <p className="text-xs text-gray-500 truncate">{task.description}</p>
        )}
      </div>
      {task.assignee && (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
              {task.assignee.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500 hidden md:inline">{task.assignee}</span>
        </div>
      )}
      <Badge variant="outline" className={cn('text-[10px] shrink-0', statusConfig.color)}>
        {statusConfig.label}
      </Badge>
    </motion.div>
  );
}

// ============================================================================
// ACCEPTANCE CRITERIA COMPONENT
// ============================================================================

function AcceptanceCriteriaList({ criteria }: { criteria: any[] }) {
  return (
    <div className="space-y-3">
      {criteria.map((item, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className={cn(
            'mt-0.5 p-1 rounded',
            item.completed ? 'bg-green-100' : 'bg-white border border-gray-200'
          )}>
            {item.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <p className={cn(
              'text-sm',
              item.completed ? 'text-gray-500' : 'text-gray-700'
            )}>
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ACTIVITY TIMELINE COMPONENT
// ============================================================================

function ActivityTimeline({ activities }: { activities: any[] }) {
  return (
    <div className="space-y-4">
      {activities.map((activity, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                {activity.user.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {i < activities.length - 1 && (
              <div className="w-px h-full bg-gray-200 my-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 text-sm">{activity.user}</span>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
            <p className="text-sm text-gray-600">{activity.action}</p>
            {activity.comment && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                {activity.comment}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// STORY INFO SIDEBAR
// ============================================================================

function StoryInfoSidebar({ story }: { story: any }) {
  const infoItems = [
    { label: 'Story Points', value: story.storyPoints || 0, icon: Target },
    { label: 'Sprint', value: story.sprint || 'Backlog', icon: Timer },
    { label: 'Assignee', value: story.assignee || 'Unassigned', icon: Users },
    { label: 'Feature', value: story.featureId || 'N/A', icon: GitBranch },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {infoItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StoryDetailPage() {
  const params = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['story-detail', params.id],
    queryFn: async () => {
      // Fetch story details
      const storiesRes = await fetch(`/api/palantir/ontology/stories`);
      if (!storiesRes.ok) throw new Error('Failed to fetch stories');
      const stories = await storiesRes.json();
      const story = stories.find((s: any) => s.id === params.id);

      if (!story) throw new Error('Story not found');

      // Fetch related tasks
      const tasksRes = await fetch(`/api/palantir/ontology/tasks?storyId=${params.id}`);
      const tasks = tasksRes.ok ? await tasksRes.json() : [];

      return { story, tasks };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading story details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Story not found</h2>
          <p className="text-gray-500">The story you're looking for doesn't exist.</p>
          <Link href="/ppm">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { story, tasks } = data;
  const completedTasks = tasks.filter((t: any) =>
    ['done', 'complete'].includes((t.status || '').toLowerCase())
  ).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const statusKey = (story.status || 'backlog').toLowerCase().replace(/_/g, '-');
  const statusConfig = STATUS_CONFIG[statusKey as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.backlog;
  const priorityKey = (story.priority || 'medium').toLowerCase();
  const priorityConfig = PRIORITY_CONFIG[priorityKey as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;

  // Mock acceptance criteria
  const acceptanceCriteria = [
    { description: 'User can create a new story from the backlog', completed: true },
    { description: 'Story points can be assigned and modified', completed: true },
    { description: 'Story can be assigned to a team member', completed: false },
    { description: 'Story status transitions are validated', completed: false },
  ];

  // Mock activity timeline
  const activities = [
    { user: 'Sarah Chen', action: 'moved story to In Progress', time: '2 hours ago' },
    { user: 'Mike Johnson', action: 'added a comment', time: '5 hours ago', comment: 'The API integration is ready for testing. Please review the documentation.' },
    { user: 'Emily Davis', action: 'assigned story to Sarah Chen', time: '1 day ago' },
    { user: 'John Smith', action: 'created this story', time: '3 days ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ppm">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 bg-blue-100 rounded-xl">
                <GitBranch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{story.name}</h1>
                  <Badge variant="outline" className={cn(statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="outline" className={cn(priorityConfig.color)}>
                    {priorityConfig.label}
                  </Badge>
                  {story.storyPoints > 0 && (
                    <Badge variant="secondary">
                      {story.storyPoints} pts
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">User Story • {story.id}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Task Progress</p>
                    <p className="text-3xl font-bold text-gray-900">{progress.toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {completedTasks} / {tasks.length}
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>

            {/* Description */}
            {story.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{story.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="tasks" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Tasks ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="acceptance" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Acceptance Criteria
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks">
                <Card>
                  <CardContent className="p-4">
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-2 pr-4">
                        {tasks.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No tasks for this story</p>
                          </div>
                        ) : (
                          tasks.map((task: any, index: number) => (
                            <TaskCard key={task.id} task={task} index={index} />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="acceptance">
                <Card>
                  <CardContent className="p-4">
                    <AcceptanceCriteriaList criteria={acceptanceCriteria} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardContent className="p-4">
                    <ActivityTimeline activities={activities} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StoryInfoSidebar story={story} />

            {/* Tags */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Labels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">frontend</Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">api</Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">enhancement</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            {story.featureId && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Parent Feature</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/feature/${story.featureId}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <GitBranch className="h-4 w-4 mr-2" />
                      {story.featureId}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
