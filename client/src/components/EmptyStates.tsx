import { ReactNode } from 'react';
import {
  FileQuestion,
  FolderOpen,
  Search,
  AlertCircle,
  CheckCircle,
  Inbox,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  TrendingUp,
  FileText,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * EMPTY STATE COMPONENTS
 *
 * Consistent empty states across all data views.
 * Provides context and actions when no data is available.
 */

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        {icon && (
          <div className="mb-4 rounded-full bg-muted p-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
        {(action || secondaryAction) && (
          <div className="flex gap-3">
            {action && (
              <Button onClick={action.onClick}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Preset empty states for common scenarios

export function NoDataEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={<Inbox className="h-12 w-12 text-muted-foreground" />}
      title="No data available"
      description="There's no data to display yet. Check back later or refresh to see if new data is available."
      action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
    />
  );
}

export function NoSearchResultsEmptyState({ onClearSearch }: { onClearSearch?: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12 text-muted-foreground" />}
      title="No results found"
      description="We couldn't find any results matching your search. Try adjusting your filters or search terms."
      action={onClearSearch ? { label: 'Clear search', onClick: onClearSearch } : undefined}
    />
  );
}

export function NoProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen className="h-12 w-12 text-muted-foreground" />}
      title="No projects yet"
      description="Get started by creating your first project. Projects help you organize work, track progress, and collaborate with your team."
      action={{ label: 'Create project', onClick: onCreate }}
    />
  );
}

export function NoTasksEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<CheckCircle className="h-12 w-12 text-muted-foreground" />}
      title="All caught up!"
      description="You don't have any pending tasks. Great work! Check back later or create a new task to get started."
      action={onCreate ? { label: 'Create task', onClick: onCreate } : undefined}
    />
  );
}

export function NoNotificationsEmptyState() {
  return (
    <EmptyState
      icon={<Inbox className="h-12 w-12 text-muted-foreground" />}
      title="No notifications"
      description="You're all caught up! New notifications will appear here when agents detect issues or insights."
    />
  );
}

export function NoUsersEmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12 text-muted-foreground" />}
      title="No team members yet"
      description="Invite team members to collaborate on projects and share insights across your organization."
      action={{ label: 'Invite team', onClick: onInvite }}
    />
  );
}

export function NoEventsEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
      title="No events scheduled"
      description="Your calendar is clear. Schedule meetings, milestones, and important dates to stay organized."
      action={onCreate ? { label: 'Schedule event', onClick: onCreate } : undefined}
    />
  );
}

export function NoBudgetDataEmptyState({ onSetup }: { onSetup: () => void }) {
  return (
    <EmptyState
      icon={<DollarSign className="h-12 w-12 text-muted-foreground" />}
      title="No budget data"
      description="Set up your project budget to enable financial tracking, forecasting, and FinOps agent insights."
      action={{ label: 'Set up budget', onClick: onSetup }}
    />
  );
}

export function NoMetricsEmptyState() {
  return (
    <EmptyState
      icon={<BarChart3 className="h-12 w-12 text-muted-foreground" />}
      title="No metrics available"
      description="Metrics will appear here once your project has activity. Track progress, performance, and trends over time."
    />
  );
}

export function NoInsightsEmptyState() {
  return (
    <EmptyState
      icon={<TrendingUp className="h-12 w-12 text-muted-foreground" />}
      title="No insights yet"
      description="AI agents are analyzing your portfolio. Insights, predictions, and recommendations will appear here as patterns emerge."
    />
  );
}

export function NoDocumentsEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-12 w-12 text-muted-foreground" />}
      title="No documents"
      description="Upload documents to share with your team and enable AI-powered analysis."
      action={{ label: 'Upload document', onClick: onUpload }}
    />
  );
}

export function ErrorEmptyState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-12 w-12 text-red-500" />}
      title="Something went wrong"
      description={error || 'An error occurred while loading this data. Please try again.'}
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    />
  );
}

export function ComingSoonEmptyState({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon={<FileQuestion className="h-12 w-12 text-muted-foreground" />}
      title="Coming soon"
      description={`${feature} is currently in development. Check back soon for updates!`}
    />
  );
}

// Inline empty state (smaller, for tables/lists)
export function InlineEmptyState({ message, action }: { message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
