import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) { config.headers.Authorization = `Bearer ${token}`; }
  return config;
});

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
