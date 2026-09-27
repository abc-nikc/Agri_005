import type { PlantingPlan, PlantingPlanFormData } from '@/types/planting-plan';
import { apiClient } from './api-client';

export const plantingPlanService = {
  async getAll(params?: any): Promise<PlantingPlan[]> { const r = await apiClient.get('/planting-plans', { params }); return r.data.data; },
  async getById(id: string): Promise<{ data: PlantingPlan; standardProcess: string[] }> { const r = await apiClient.get(`/planting-plans/${id}`); return r.data; },
  async create(data: PlantingPlanFormData): Promise<PlantingPlan> { const r = await apiClient.post('/planting-plans', data); return r.data.data; },
  async update(id: string, data: Partial<PlantingPlanFormData> & { adjustReason?: string }): Promise<PlantingPlan> { const r = await apiClient.put(`/planting-plans/${id}`, data); return r.data.data; },
  async delete(id: string): Promise<void> { await apiClient.delete(`/planting-plans/${id}`); },
  async getTermRecommendations(): Promise<{ term: string; recommendedNames: string[] }> { const r = await apiClient.get('/planting-plans/term-recommendations'); return r.data.data; },
};
