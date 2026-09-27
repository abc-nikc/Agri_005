import { apiClient as c } from './api-client';

export interface SettingsItem {
  id: string; settingKey: string; settingValue: string; settingType: string; description?: string; updatedBy?: string; updatedAt?: string;
}

export const settingsService = {
  getAll: async (): Promise<SettingsItem[]> => { const r = await c.get('/settings'); return r.data.data; },
  getValue: async (key: string): Promise<string> => { const r = await c.get(`/settings/${key}`); return r.data.value; },
  updateSetting: async (key: string, value: string): Promise<void> => { await c.put(`/settings/${key}`, { value }); },
  batchUpdate: async (settings: Record<string, string>): Promise<void> => { await c.put('/settings', { settings }); },
};
