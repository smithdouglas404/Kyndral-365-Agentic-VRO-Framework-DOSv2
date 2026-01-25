import { useState } from 'react';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { handleError, showSuccess, toastPromise } from '@/lib/errorHandling';

/**
 * ENHANCED API MUTATION HOOK
 *
 * Wraps React Query's useMutation with automatic error handling and success toasts.
 * Provides consistent UX for all data mutations.
 */

interface UseApiMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, unknown, TVariables>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  // Success message
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  // Error context
  errorContext: {
    operation: string;
    entity?: string;
  };
  // Auto-invalidate queries
  invalidateQueries?: string[] | string[][];
  // Show toast notifications
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  // Recovery action
  onErrorRetry?: (error: unknown, variables: TVariables) => void;
}

export function useApiMutation<TData = unknown, TVariables = void>({
  mutationFn,
  successMessage,
  errorContext,
  invalidateQueries,
  showSuccessToast = true,
  showErrorToast = true,
  onErrorRetry,
  onSuccess,
  onError,
  ...options
}: UseApiMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Show success toast
      if (showSuccessToast && successMessage) {
        const message = typeof successMessage === 'function'
          ? successMessage(data, variables)
          : successMessage;
        showSuccess(message);
      }

      // Invalidate queries
      if (invalidateQueries) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({
            queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
          });
        });
      }

      // Call custom onSuccess
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Show error toast with recovery option
      if (showErrorToast) {
        handleError(error, errorContext, {
          toast: true,
          log: true,
          recovery: onErrorRetry
            ? {
                label: 'Try again',
                action: () => onErrorRetry(error, variables),
              }
            : undefined,
        });
      }

      // Call custom onError
      onError?.(error, variables, context);
    },
    ...options,
  });

  return mutation;
}

/**
 * Mutation with promise toast (loading → success/error)
 */
export function useApiMutationWithToast<TData = unknown, TVariables = void>({
  mutationFn,
  successMessage,
  errorContext,
  invalidateQueries,
  loadingMessage = 'Processing...',
  ...options
}: UseApiMutationOptions<TData, TVariables> & {
  loadingMessage?: string;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (variables: TVariables) => {
      return toastPromise(mutationFn(variables), {
        loading: loadingMessage,
        success: (data) => {
          return typeof successMessage === 'function'
            ? successMessage(data, variables)
            : successMessage || 'Success!';
        },
        error: (error) => {
          return `Failed to ${errorContext.operation}`;
        },
      });
    },
    onSuccess: (data, variables, context) => {
      // Invalidate queries
      if (invalidateQueries) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({
            queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
          });
        });
      }

      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });

  return mutation;
}

/**
 * Example usage:
 *
 * const createProject = useApiMutation({
 *   mutationFn: (data) => fetch('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
 *   successMessage: (data) => `Project "${data.name}" created successfully`,
 *   errorContext: { operation: 'create project', entity: 'project' },
 *   invalidateQueries: ['projects'],
 *   onErrorRetry: (error, variables) => createProject.mutate(variables),
 * });
 *
 * // Use it
 * createProject.mutate({ name: 'New Project', ... });
 */
