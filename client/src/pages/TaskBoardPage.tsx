/**
 * TASK BOARD PAGE (KANBAN)
 *
 * Interactive Kanban board for managing tasks across status columns:
 * - Backlog, In Progress, In Review, Done
 * - Drag-and-drop support
 * - Task filtering by project, assignee, priority
 * - Quick task details view
 */

import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  LayoutGrid,
  Filter,
  Search,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ChevronRight,
  Users,
  Calendar,
  Tag,
  RefreshCw,
  Columns,
  List,
  MoreVertical,
  PlayCircle,
  PauseCircle,
  Eye,
  Timer,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES & CONFIGS
// ============================================================================

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  storyId: string;
  projectId: string;
  estimatedHours: number;
  actualHours: number;
  dueDate: string;
}

const KANBAN_COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'bg-gray-500', bgColor: 'bg-gray-50' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { id: 'in-review', label: 'In Review', color: 'bg-amber-500', bgColor: 'bg-amber-50' },
  { id: 'done', label: 'Done', color: 'bg-green-500', bgColor: 'bg-green-50' },
];

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' },
};

// ============================================================================
// TASK CARD COMPONENT
// ============================================================================

function TaskCard({ task, onView }: { task: Task; onView: (task: Task) => void }) {
  const priorityKey = (task.priority || 'medium').toLowerCase() as keyof typeof PRIORITY_CONFIG;
  const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group"
    >
      <Card className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', priorityConfig.dot)} />
              <Badge variant="outline" className={cn('text-[10px]', priorityConfig.color)}>
                {priorityConfig.label}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(task)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>Move to Backlog</DropdownMenuItem>
                <DropdownMenuItem>Move to In Progress</DropdownMenuItem>
                <DropdownMenuItem>Move to Done</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
            {task.name}
          </h4>

          {task.description && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {task.estimatedHours > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      <span>{task.estimatedHours}h</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Estimated: {task.estimatedHours}h
                    {task.actualHours > 0 && ` / Actual: ${task.actualHours}h`}
                  </TooltipContent>
                </Tooltip>
              )}
              {task.dueDate && (
                <div className={cn('flex items-center gap-1', isOverdue && 'text-red-500')}>
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>
            {task.assignee && (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-blue-700">
                    {task.assignee.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// KANBAN COLUMN COMPONENT
// ============================================================================

function KanbanColumn({
  column,
  tasks,
  onViewTask,
}: {
  column: typeof KANBAN_COLUMNS[0];
  tasks: Task[];
  onViewTask: (task: Task) => void;
}) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className={cn('rounded-lg border', column.bgColor)}>
        {/* Column Header */}
        <div className="p-3 border-b bg-white/50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', column.color)} />
              <h3 className="font-semibold text-gray-900">{column.label}</h3>
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tasks */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="p-3 space-y-3">
            <AnimatePresence>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onView={onViewTask} />
              ))}
            </AnimatePresence>
            {tasks.length === 0 && (
              <div className="py-8 text-center text-gray-400">
                <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ============================================================================
// TASK DETAILS PANEL
// ============================================================================

function TaskDetailsPanel({ task, onClose }: { task: Task | null; onClose: () => void }) {
  if (!task) return null;

  const priorityKey = (task.priority || 'medium').toLowerCase() as keyof typeof PRIORITY_CONFIG;
  const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.medium;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed right-0 top-0 h-full w-[400px] bg-white border-l shadow-xl z-50"
    >
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Task Details</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-6 space-y-6">
          {/* Title & Priority */}
          <div>
            <Badge variant="outline" className={cn('mb-2', priorityConfig.color)}>
              {priorityConfig.label} Priority
            </Badge>
            <h3 className="text-xl font-semibold text-gray-900">{task.name}</h3>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600">{task.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Assignee</span>
              </div>
              <p className="font-medium text-gray-900">
                {task.assignee || 'Unassigned'}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Timer className="h-4 w-4" />
                <span className="text-xs">Estimated</span>
              </div>
              <p className="font-medium text-gray-900">
                {task.estimatedHours > 0 ? `${task.estimatedHours} hours` : 'Not set'}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Actual Time</span>
              </div>
              <p className="font-medium text-gray-900">
                {task.actualHours > 0 ? `${task.actualHours} hours` : 'Not tracked'}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Due Date</span>
              </div>
              <p className="font-medium text-gray-900">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'No due date'}
              </p>
            </div>
          </div>

          {/* Story Link */}
          {task.storyId && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Parent Story</h4>
              <Link href={`/story/${task.storyId}`}>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>View Story</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t space-y-2">
            <Button className="w-full" variant="default">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Working
            </Button>
            <Button className="w-full" variant="outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

// ============================================================================
// BOARD STATS COMPONENT
// ============================================================================

function BoardStats({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status.toLowerCase().includes('done') || t.status.toLowerCase().includes('complete')).length;
    const inProgress = tasks.filter(t => t.status.toLowerCase().includes('progress')).length;
    const blocked = tasks.filter(t => t.status.toLowerCase().includes('blocked')).length;
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    return [
      { label: 'Total Tasks', value: total, icon: LayoutGrid, color: 'text-gray-600 bg-gray-100' },
      { label: 'In Progress', value: inProgress, icon: PlayCircle, color: 'text-blue-600 bg-blue-100' },
      { label: 'Completed', value: done, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
      { label: 'Est. Hours', value: totalHours, icon: Timer, color: 'text-purple-600 bg-purple-100' },
    ];
  }, [tasks]);

  return (
    <div className="grid grid-cols-4 gap-4">
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

export default function TaskBoardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['kanban-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/palantir/ontology/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['kanban-projects'],
    queryFn: async () => {
      const res = await fetch('/api/palantir/ontology/projects');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      const matchesSearch = !searchQuery ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' ||
        task.priority?.toLowerCase() === priorityFilter;
      const matchesProject = projectFilter === 'all' ||
        task.projectId === projectFilter;
      return matchesSearch && matchesPriority && matchesProject;
    });
  }, [tasks, searchQuery, priorityFilter, projectFilter]);

  // Group tasks by status for Kanban
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const col of KANBAN_COLUMNS) {
      grouped[col.id] = [];
    }
    for (const task of filteredTasks) {
      const statusKey = (task.status || 'backlog').toLowerCase()
        .replace(/_/g, '-')
        .replace('in progress', 'in-progress')
        .replace('in review', 'in-review');

      if (grouped[statusKey]) {
        grouped[statusKey].push(task);
      } else if (statusKey.includes('done') || statusKey.includes('complete')) {
        grouped['done'].push(task);
      } else if (statusKey.includes('progress')) {
        grouped['in-progress'].push(task);
      } else if (statusKey.includes('review')) {
        grouped['in-review'].push(task);
      } else {
        grouped['backlog'].push(task);
      }
    }
    return grouped;
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading task board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ppm">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Columns className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
                <p className="text-sm text-gray-500">Kanban view of all tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('board')}
                >
                  <Columns className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <BoardStats tasks={filteredTasks} />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.slice(0, 10).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchQuery || priorityFilter !== 'all' || projectFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('all');
                    setProjectFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        {viewMode === 'board' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] || []}
                onViewTask={setSelectedTask}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">All Tasks ({filteredTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredTasks.map((task: Task) => {
                  const priorityKey = (task.priority || 'medium').toLowerCase() as keyof typeof PRIORITY_CONFIG;
                  const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.medium;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:border-blue-300 hover:bg-gray-50 cursor-pointer transition-all"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className={cn('w-2 h-2 rounded-full', priorityConfig.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{task.name}</p>
                        <p className="text-xs text-gray-500">{task.status}</p>
                      </div>
                      {task.assignee && (
                        <Badge variant="outline" className="text-xs">
                          {task.assignee}
                        </Badge>
                      )}
                      {task.estimatedHours > 0 && (
                        <span className="text-xs text-gray-500">{task.estimatedHours}h</span>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Task Details Panel */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setSelectedTask(null)}
            />
            <TaskDetailsPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
