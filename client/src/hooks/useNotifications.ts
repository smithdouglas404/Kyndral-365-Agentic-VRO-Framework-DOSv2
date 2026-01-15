import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Notification {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  severity: string | null;
  source: string | null;
  sourceId: string | null;
  isRead: boolean | null;
  isDismissed: boolean | null;
  actionUrl: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

export function useNotifications(includeRead = false) {
  return useQuery<Notification[]>({
    queryKey: ["notifications", includeRead],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?includeRead=${includeRead}`);
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    refetchInterval: 30000,
  });
}

export function useUnreadNotificationCount() {
  const { data: notifications = [] } = useNotifications(false);
  return notifications.filter(n => !n.isRead).length;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDismissNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to dismiss notification");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notification: {
      type: 'sync_failure' | 'alert' | 'info' | 'warning' | 'success';
      title: string;
      message: string;
      severity?: 'info' | 'warning' | 'error' | 'critical';
      source?: string;
      sourceId?: string;
      actionUrl?: string;
    }) => {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });
      if (!response.ok) {
        throw new Error("Failed to create notification");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
