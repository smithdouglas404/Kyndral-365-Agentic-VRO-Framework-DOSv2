/**
 * FEATURE DETAIL PAGE
 *
 * Comprehensive view of a SAFe Feature including:
 * - Feature overview and progress
 * - Related stories with status
 * - Acceptance criteria tracking
 * - Team assignments
 * - Dependencies
 */

import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Layers,
  GitBranch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Target,
  Calendar,
  ChevronRight,
  BarChart3,
  Zap,
  Link as LinkIcon,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// STATUS & PRIORITY CONFIGS
// ============================================================================

const STATUS_CONFIG = {
  backlog: { label: 'Backlog', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Square },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: PlayCircle },
  'in progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: PlayCircle },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700 border-red-200', icon: PauseCircle },
  done: { label: 'Done', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
};

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

// ============================================================================
// STORY CARD COMPONENT
// ============================================================================

function StoryCard({ story, index }: { story: any; index: number }) {
  const statusKey = (story.status || 'backlog').toLowerCase().replace(/_/g, '-');
  const statusConfig = STATUS_CONFIG[statusKey as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.backlog;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/story/${story.id}`}>
        <div className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn('text-[10px]', statusConfig.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {story.storyPoints > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {story.storyPoints} pts
                  </Badge>
                )}
              </div>
              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {story.name}
              </h4>
              {story.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{story.description}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" />
          </div>
          {story.assignee && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">{story.assignee}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// ACCEPTANCE CRITERIA COMPONENT
// ============================================================================

function AcceptanceCriteria({ criteria }: { criteria: any[] }) {
  const completed = criteria.filter(c => c.completed).length;
  const total = criteria.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-blue-600" />
            Acceptance Criteria
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {completed}/{total} complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {criteria.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={cn(
                'mt-0.5 p-1 rounded',
                item.completed ? 'bg-green-100' : 'bg-gray-100'
              )}>
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <p className={cn(
                'text-sm',
                item.completed ? 'text-gray-500 line-through' : 'text-gray-700'
              )}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FEATURE STATS COMPONENT
// ============================================================================

function FeatureStats({ feature, stories }: { feature: any; stories: any[] }) {
  const totalStories = stories.length;
  const completedStories = stories.filter(s =>
    ['done', 'complete'].includes((s.status || '').toLowerCase())
  ).length;
  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);
  const completedPoints = stories
    .filter(s => ['done', 'complete'].includes((s.status || '').toLowerCase()))
    .reduce((sum, s) => sum + (s.storyPoints || 0), 0);

  const stats = [
    { label: 'Stories', value: totalStories, icon: GitBranch, color: 'text-blue-600 bg-blue-100' },
    { label: 'Completed', value: completedStories, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
    { label: 'Total Points', value: totalPoints, icon: Target, color: 'text-purple-600 bg-purple-100' },
    { label: 'Points Done', value: completedPoints, icon: Zap, color: 'text-amber-600 bg-amber-100' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeatureDetailPage() {
  const params = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feature-detail', params.id],
    queryFn: async () => {
      // Fetch feature details
      const featureRes = await fetch(`/api/palantir/ontology/features`);
      if (!featureRes.ok) throw new Error('Failed to fetch features');
      const features = await featureRes.json();
      const feature = features.find((f: any) => f.id === params.id);

      if (!feature) throw new Error('Feature not found');

      // Fetch related stories
      const storiesRes = await fetch(`/api/palantir/ontology/stories?featureId=${params.id}`);
      const stories = storiesRes.ok ? await storiesRes.json() : [];

      return { feature, stories };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading feature details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Feature not found</h2>
          <p className="text-gray-500">The feature you're looking for doesn't exist.</p>
          <Link href="/ppm">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { feature, stories } = data;
  const progress = feature.progress || (feature.storyPoints > 0
    ? ((feature.completedPoints || 0) / feature.storyPoints) * 100
    : 0);

  const statusKey = (feature.status || 'backlog').toLowerCase().replace(/_/g, '-');
  const statusConfig = STATUS_CONFIG[statusKey as keyof typeof statusConfig] || STATUS_CONFIG.backlog;
  const priorityConfig = PRIORITY_CONFIG[(feature.priority || 'medium').toLowerCase() as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;

  // Mock acceptance criteria for demo
  const acceptanceCriteria = [
    { description: 'User can view feature details on the dashboard', completed: true },
    { description: 'Feature progress is calculated from child stories', completed: true },
    { description: 'All related stories are displayed with status', completed: true },
    { description: 'Feature can be linked to parent epic', completed: false },
    { description: 'Export feature report to PDF', completed: false },
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
              <div className="p-2 bg-purple-100 rounded-xl">
                <Layers className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{feature.name}</h1>
                  <Badge variant="outline" className={cn(statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="outline" className={cn(priorityConfig.color)}>
                    {priorityConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">Feature • {feature.id}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Progress Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Feature Progress</p>
                <p className="text-3xl font-bold text-gray-900">{progress.toFixed(0)}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Story Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feature.completedPoints || 0} / {feature.storyPoints || 0}
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Stats */}
        <FeatureStats feature={feature} stories={stories} />

        {/* Description */}
        {feature.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{feature.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="stories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Stories ({stories.length})
            </TabsTrigger>
            <TabsTrigger value="acceptance" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Acceptance Criteria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                  User Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {stories.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No stories linked to this feature</p>
                      </div>
                    ) : (
                      stories.map((story: any, index: number) => (
                        <StoryCard key={story.id} story={story} index={index} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acceptance">
            <AcceptanceCriteria criteria={acceptanceCriteria} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
