import axios from 'axios';
import type { PlantingPlan, PlantingPlanFormData } from '@/types/planting-plan';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });
apiClient.interceptors.request.use(c => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

export const plantingPlanService = {
  async getAll(params?: any): Promise<PlantingPlan[]> { const r = await apiClient.get('/planting-plans', { params }); return r.data.data; },
  async getById(id: string): Promise<{ data: PlantingPlan; standardProcess: string[] }> { const r = await apiClient.get(`/planting-plans/${id}`); return r.data; },
  async create(data: PlantingPlanFormData): Promise<PlantingPlan> { const r = await apiClient.post('/planting-plans', data); return r.data.data; },
  async update(id: string, data: Partial<PlantingPlanFormData> & { adjustReason?: string }): Promise<PlantingPlan> { const r = await apiClient.put(`/planting-plans/${id}`, data); return r.data.data; },
  async delete(id: string): Promise<void> { await apiClient.delete(`/planting-plans/${id}`); },
  async getTermRecommendations(): Promise<{ term: string; recommendedNames: string[] }> { const r = await apiClient.get('/planting-plans/term-recommendations'); return r.data.data; },
};
