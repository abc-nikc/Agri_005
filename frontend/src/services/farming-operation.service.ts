import type { FarmingOperation, CreateOperationDto, UpdateOperationDto } from '@/types/farming-operation';
import { apiClient } from './api-client';

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
