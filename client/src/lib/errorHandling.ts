import { toast } from 'sonner';

/**
 * ERROR HANDLING UTILITIES
 *
 * Centralized error handling with contextual messages and recovery actions.
 * Provides consistent error experience across the application.
 */

export interface ErrorContext {
  operation: string; // e.g., "create project", "fetch data"
  entity?: string; // e.g., "project", "user"
  details?: any;
}

export interface ErrorHandlerOptions {
  toast?: boolean; // Show toast notification
  log?: boolean; // Log to console
  capture?: boolean; // Send to error tracking service
  recovery?: {
    label: string;
    action: () => void;
  };
}

/**
 * Parse error into user-friendly message
 */
export function parseError(error: unknown): string {
  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    // API errors with custom messages
    if ('response' in error && typeof error.response === 'object' && error.response !== null) {
      const response = error.response as any;
      if (response.data?.message) return response.data.message;
      if (response.data?.error) return response.data.error;
    }

    // Standard error message
    if (error.message) return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Get contextual error message based on operation
 */
function getContextualMessage(error: unknown, context: ErrorContext): string {
  const baseMessage = parseError(error);
  const { operation, entity } = context;

  // Check for common error patterns
  if (baseMessage.toLowerCase().includes('network') || baseMessage.toLowerCase().includes('fetch')) {
    return `Unable to ${operation}. Please check your connection and try again.`;
  }

  if (baseMessage.toLowerCase().includes('unauthorized') || baseMessage.toLowerCase().includes('403')) {
    return `You don't have permission to ${operation}. Contact your administrator.`;
  }

  if (baseMessage.toLowerCase().includes('not found') || baseMessage.toLowerCase().includes('404')) {
    return entity
      ? `The ${entity} you're trying to access doesn't exist or has been deleted.`
      : `Resource not found. It may have been moved or deleted.`;
  }

  if (baseMessage.toLowerCase().includes('timeout')) {
    return `Request timed out while trying to ${operation}. The server might be busy.`;
  }

  if (baseMessage.toLowerCase().includes('validation') || baseMessage.toLowerCase().includes('invalid')) {
    return `Invalid data provided. Please check your input and try again.`;
  }

  // Generic contextual message
  return `Failed to ${operation}: ${baseMessage}`;
}

/**
 * Main error handler
 */
export function handleError(
  error: unknown,
  context: ErrorContext,
  options: ErrorHandlerOptions = {}
): void {
  const {
    toast: showToast = true,
    log = true,
    capture = false,
    recovery,
  } = options;

  const message = getContextualMessage(error, context);

  // Log to console in development
  if (log && import.meta.env.DEV) {
    console.error(`[Error] ${context.operation}:`, error);
    if (context.details) {
      console.error('Context:', context.details);
    }
  }

  // Show toast notification
  if (showToast) {
    toast.error(message, {
      description: context.entity ? `Entity: ${context.entity}` : undefined,
      duration: 6000,
      action: recovery
        ? {
            label: recovery.label,
            onClick: recovery.action,
          }
        : undefined,
    });
  }

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  if (capture && import.meta.env.PROD) {
    // window.errorTracker?.captureException(error, { context });
  }
}

/**
 * Async error boundary wrapper
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  options?: ErrorHandlerOptions
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context, options);
    return null;
  }
}

/**
 * Success notification helper
 */
export function showSuccess(
  message: string,
  options?: {
    description?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
) {
  toast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  });
}

/**
 * Info notification helper
 */
export function showInfo(
  message: string,
  options?: {
    description?: string;
    duration?: number;
  }
) {
  toast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
  });
}

/**
 * Warning notification helper
 */
export function showWarning(
  message: string,
  options?: {
    description?: string;
    duration?: number;
  }
) {
  toast.warning(message, {
    description: options?.description,
    duration: options?.duration || 5000,
  });
}

/**
 * Loading toast helper
 */
export function showLoading(message: string): string | number {
  return toast.loading(message);
}

/**
 * Dismiss loading toast
 */
export function dismissToast(id: string | number) {
  toast.dismiss(id);
}

/**
 * Promise toast - automatically handles loading, success, and error states
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
): Promise<T> {
  return toast.promise(promise, messages);
}
