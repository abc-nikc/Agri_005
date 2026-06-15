import { apiClient } from './api-client';

/** AI 智能服务 */

/** AI 种植推荐 */
export async function aiPlantingRecommendation(params: {
  plotId?: string;
  varietyId?: string;
  area?: number;
  season?: string;
}) {
  const res = await apiClient.post('/ai/planting-recommendation', params);
  return res.data.data?.recommendation || '';
}

/** AI 环境分析 */
export async function aiEnvironmentAnalysis(plotId?: string) {
  const res = await apiClient.get('/ai/environment-analysis', { params: { plotId } });
  return res.data.data?.analysis || '';
}

/** AI 产量预测 */
export async function aiYieldPrediction(params: {
  plotId?: string;
  varietyId?: string;
  batchId?: string;
}) {
  const res = await apiClient.post('/ai/yield-prediction', params);
  return res.data.data?.prediction || '';
}

/** AI 病虫害诊断 */
export async function aiPestDiagnosis(params: {
  symptoms: string;
  plotId?: string;
  varietyName?: string;
}) {
  const res = await apiClient.post('/ai/pest-diagnosis', params);
  return res.data.data?.diagnosis || '';
}

/** AI 农事问答 */
export async function aiChat(message: string, context?: string) {
  const res = await apiClient.post('/ai/chat', { message, context });
  return res.data.data?.reply || '';
}

/** AI 仪表盘洞察 */
export async function aiDashboardInsight() {
  const res = await apiClient.get('/ai/dashboard-insight');
  return res.data.data?.insight || '';
}

/** AI 地块分析 */
export async function aiPlotAnalysis(plotId: string) {
  const res = await apiClient.get('/ai/plot-analysis', { params: { plotId } });
  return res.data.data?.analysis || '';
}

/** AI 智能排程 */
export async function aiSmartSchedule() {
  const res = await apiClient.get('/ai/smart-schedule');
  return res.data.data?.schedule || '';
}
