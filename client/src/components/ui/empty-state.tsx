import { ReactNode } from 'react';
import { LucideIcon, FileQuestion, Inbox, Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

type EmptyStateVariant = 'default' | 'search' | 'error' | 'no-data';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: EmptyStateVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

const variantIcons: Record<EmptyStateVariant, LucideIcon> = {
  default: Inbox,
  search: Search,
  error: AlertCircle,
  'no-data': FileQuestion,
};

const variantStyles: Record<EmptyStateVariant, string> = {
  default: 'text-muted-foreground',
  search: 'text-blue-500',
  error: 'text-red-500',
  'no-data': 'text-yellow-500',
};

export function EmptyState({
  title,
  description,
  icon,
  variant = 'default',
  action,
  className,
  children,
}: EmptyStateProps) {
  const Icon = icon || variantIcons[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className={cn('rounded-full p-4 bg-muted mb-4')}>
        <Icon className={cn('h-8 w-8', variantStyles[variant])} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
