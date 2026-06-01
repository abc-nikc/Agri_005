import axios from 'axios';
import type { Plot } from '../types/plot';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = response.data;
          localStorage.setItem('access_token', accessToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(new Error('登录已过期'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export const plotService = {
  async getAll(): Promise<Plot[]> { const r = await apiClient.get('/plots'); return r.data.data || r.data; },
  async getById(id: string): Promise<Plot> { const r = await apiClient.get(`/plots/${id}`); return r.data.data || r.data; },
  async create(data: Partial<Plot>): Promise<Plot> { const r = await apiClient.post('/plots', data); return r.data.data || r.data; },
  async update(id: string, data: Partial<Plot>): Promise<Plot> { const r = await apiClient.put(`/plots/${id}`, data); return r.data.data || r.data; },
  async delete(id: string): Promise<void> { await apiClient.delete(`/plots/${id}`); },
  async getStatistics(): Promise<any> { const r = await apiClient.get('/plots/statistics'); return r.data.data || r.data; },
};
