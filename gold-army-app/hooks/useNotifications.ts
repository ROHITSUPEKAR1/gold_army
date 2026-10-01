import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatApiError } from '../services/api';
import { useAuthStore } from '../store/auth';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  audience: string;
  createdAt: string;
  readAt?: string | null;
  isRead: boolean;
  createdBy?: string;
  _count?: {
    recipients: number;
  };
};

export type SendNotificationInput = {
  title: string;
  message: string;
  audience:
    | 'ALL_MEMBERS'
    | 'SELECTED_MEMBERS'
    | 'EXPIRING_MEMBERS'
    | 'EXPIRED_MEMBERS'
    | 'SPECIFIC_SERVICE'
    | 'SPECIFIC_PLAN';
  memberIds?: string[];
  planId?: string;
  serviceId?: string;
  scheduledAt?: string | Date;
};

/**
 * Fetch notifications list for current member or admin
 */
export function useNotifications() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['notifications', session?.user.role],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: NotificationItem[] }>('/notifications');
      return response.data.data;
    },
    enabled: Boolean(session),
  });
}

/**
 * Mark a single notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        const response = await api.patch<{ success: boolean }>(`/notifications/${notificationId}/read`);
        return response.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Mark all member notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await api.post<{ success: boolean }>('/notifications/mark-all-read');
        return response.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Send / Compose a notification (Admin)
 */
export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendNotificationInput) => {
      try {
        const response = await api.post<{ success: boolean; data: any }>('/notifications', payload);
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Trigger automated expiry alerts (Admin)
 */
export function useTriggerExpiryAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await api.post<{ success: boolean; data: { message: string; count: number } }>(
          '/notifications/trigger-expiry-alerts'
        );
        return response.data.data;
      } catch (error) {
        throw new Error(formatApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
