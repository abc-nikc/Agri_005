import type { ProductionBatch, ProductionBatchFormData } from '@/types/planting-plan';
import { apiClient } from './api-client';

export const productionBatchService = {
  async getAll(params?: any): Promise<ProductionBatch[]> { const r = await apiClient.get('/production-batches', { params }); return r.data.data; },
  async getById(id: string): Promise<ProductionBatch> { const r = await apiClient.get(`/production-batches/${id}`); return r.data.data; },
  async create(data: ProductionBatchFormData): Promise<ProductionBatch> { const r = await apiClient.post('/production-batches', data); return r.data.data; },
  async complete(id: string, actualHarvestDate: string): Promise<ProductionBatch> { const r = await apiClient.put(`/production-batches/${id}/complete`, { actualHarvestDate }); return r.data.data; },
  async delete(id: string): Promise<void> { await apiClient.delete(`/production-batches/${id}`); },
  async splitByQuality(id: string, grades: { grade: string; quantity: number }[]): Promise<any[]> { const r = await apiClient.post(`/production-batches/${id}/split`, { grades }); return r.data.data; },
};
