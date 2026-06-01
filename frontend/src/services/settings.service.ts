import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const c = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });
c.interceptors.request.use(x => { const t = localStorage.getItem('access_token'); if (t) x.headers.Authorization = `Bearer ${t}`; return x; });

export interface SettingsItem {
  id: string; settingKey: string; settingValue: string; settingType: string; description?: string; updatedBy?: string; updatedAt?: string;
}

export const settingsService = {
  getAll: async (): Promise<SettingsItem[]> => { const r = await c.get('/settings'); return r.data.data; },
  getValue: async (key: string): Promise<string> => { const r = await c.get(`/settings/${key}`); return r.data.value; },
  updateSetting: async (key: string, value: string): Promise<void> => { await c.put(`/settings/${key}`, { value }); },
  batchUpdate: async (settings: Record<string, string>): Promise<void> => { await c.put('/settings', { settings }); },
};
