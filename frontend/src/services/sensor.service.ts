import type { SensorData } from '@/types/sensor';
import { apiClient as c } from './api-client';

export const sensorService = {
  latest: async (plotId?: string): Promise<SensorData[]> => { const r = await c.get('/iot/latest', { params: plotId ? { plotId } : {} }); return r.data.data; },
  query: async (params?: any): Promise<SensorData[]> => { const r = await c.get('/iot/query', { params }); return r.data.data; },
  stats: async (plotId: string, hours?: number): Promise<Record<string, any>> => { const r = await c.get('/iot/stats', { params: { plotId, hours } }); return r.data.data; },
  sendControl: async (plotId: string, deviceId: string, command: string, params?: any): Promise<any> => { const r = await c.post('/iot/control', { plotId, deviceId, command, params }); return r.data.data; },
  anomalies: async (plotId?: string): Promise<{ anomalies: any[]; summary: { total: number; warning: number; critical: number } }> => {
    const r = await c.get('/iot/anomalies', { params: plotId ? { plotId } : {} }); return { anomalies: r.data.data, summary: r.data.summary };
  },
};
