import axios from 'axios';
import type { FarmingOperation, CreateOperationDto, UpdateOperationDto } from '@/types/farming-operation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const farmingOperationService = {
  async getAll(params?: any): Promise<FarmingOperation[]> {
    const response = await apiClient.get('/farming-operations', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<FarmingOperation> {
    const response = await apiClient.get(`/farming-operations/${id}`);
    return response.data.data;
  },

  async create(data: CreateOperationDto): Promise<FarmingOperation> {
    const response = await apiClient.post('/farming-operations', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateOperationDto): Promise<FarmingOperation> {
    const response = await apiClient.put(`/farming-operations/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/farming-operations/${id}`);
  },
};
