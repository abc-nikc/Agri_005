import axios from 'axios';
import type { ProductionBatch, ProductionBatchFormData } from '@/types/planting-plan';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });
apiClient.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

export const productionBatchService = {
  async getAll(params?: any): Promise<ProductionBatch[]> { const r = await apiClient.get('/production-batches', { params }); return r.data.data; },
  async getById(id: string): Promise<ProductionBatch> { const r = await apiClient.get(`/production-batches/${id}`); return r.data.data; },
  async create(data: ProductionBatchFormData): Promise<ProductionBatch> { const r = await apiClient.post('/production-batches', data); return r.data.data; },
  async complete(id: string, actualHarvestDate: string): Promise<ProductionBatch> { const r = await apiClient.put(`/production-batches/${id}/complete`, { actualHarvestDate }); return r.data.data; },
  async delete(id: string): Promise<void> { await apiClient.delete(`/production-batches/${id}`); },
  async splitByQuality(id: string, grades: { grade: string; quantity: number }[]): Promise<any[]> { const r = await apiClient.post(`/production-batches/${id}/split`, { grades }); return r.data.data; },
};
