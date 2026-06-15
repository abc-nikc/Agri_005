import { apiClient } from './api-client';

/** 农事任务服务 */

export interface FarmTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  plotId?: string;
  plotName?: string;
  varietyId?: string;
  varietyName?: string;
  batchId?: string;
  assigneeId?: string;
  assigneeName?: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  aiGenerated?: boolean;
  aiReason?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getFarmTasks(params?: { status?: string; priority?: string; category?: string; assigneeId?: string; plotId?: string; page?: number; limit?: number }) {
  const res = await apiClient.get('/farm-tasks', { params });
  return res.data.data;
}

export async function getFarmTask(id: string) {
  const res = await apiClient.get(`/farm-tasks/${id}`);
  return res.data.data;
}

export async function createFarmTask(data: Partial<FarmTask>) {
  const res = await apiClient.post('/farm-tasks', data);
  return res.data.data;
}

export async function updateFarmTask(id: string, data: Partial<FarmTask>) {
  const res = await apiClient.put(`/farm-tasks/${id}`, data);
  return res.data.data;
}

export async function deleteFarmTask(id: string) {
  const res = await apiClient.delete(`/farm-tasks/${id}`);
  return res.data;
}

export async function getFarmTaskStats() {
  const res = await apiClient.get('/farm-tasks/stats');
  return res.data.data;
}

export async function aiCreateFarmTasks(tasks: Partial<FarmTask>[]) {
  const res = await apiClient.post('/farm-tasks/ai-create', { tasks });
  return res.data;
}

/** 新增AI服务函数 */
export async function aiPlotAnalysis(plotId: string) {
  const res = await apiClient.get('/ai/plot-analysis', { params: { plotId } });
  return res.data.data?.analysis || '';
}

export async function aiSmartSchedule() {
  const res = await apiClient.get('/ai/smart-schedule');
  return res.data.data?.schedule || '';
}
