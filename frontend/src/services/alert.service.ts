import { apiClient } from './api-client';

export const alertService = {
  /** 获取告警历史 */
  getHistory: async (params?: { severity?: string; anomalyType?: string; resolved?: string; plotId?: string; page?: number; limit?: number }) => {
    const r = await apiClient.get('/iot/alerts', { params });
    return { records: r.data.data || [], total: r.data.total || 0, page: r.data.page || 1 };
  },

  /** 获取告警统计 */
  getStatistics: async () => {
    const r = await apiClient.get('/iot/alerts/statistics');
    return r.data.data;
  },

  /** 处理告警 */
  resolveAlert: async (id: string) => {
    const r = await apiClient.put(`/iot/alerts/${id}/resolve`);
    return r.data;
  },

  /** 获取阈值配置 */
  getThresholds: async () => {
    const r = await apiClient.get('/iot/thresholds');
    return r.data.data || {};
  },

  /** 更新阈值 */
  updateThreshold: async (sensorType: string, min: number, max: number) => {
    const r = await apiClient.put('/iot/thresholds', { sensorType, min, max });
    return r.data;
  },
};
