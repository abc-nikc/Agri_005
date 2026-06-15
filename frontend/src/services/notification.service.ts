import { apiClient } from './api-client';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPagination {
  page: number; limit: number; total: number; totalPages: number;
}

export const notificationService = {
  getAll: async (page = 1, limit = 20): Promise<{ data: Notification[]; pagination: NotificationPagination }> => {
    const r = await apiClient.get('/notifications', { params: { page, limit } });
    return r.data;
  },
  getUnreadCount: async (): Promise<number> => {
    const r = await apiClient.get('/notifications/unread-count');
    return r.data.count;
  },
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
