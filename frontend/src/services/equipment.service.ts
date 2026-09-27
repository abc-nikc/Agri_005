import type { Equipment, CreateEquipmentDto, UpdateEquipmentDto, EquipmentQueryParams } from '@/types/equipment';
import { apiClient } from './api-client';

export const equipmentService = {
  // 获取设备列表
  async getEquipment(params?: EquipmentQueryParams): Promise<Equipment[]> {
    const response = await apiClient.get('/equipment', { params });
    return response.data.data || response.data;
  },

  // 获取单个设备
  async getEquipmentItem(id: string): Promise<Equipment> {
    const response = await apiClient.get(`/equipment/${id}`);
    return response.data.data || response.data;
  },

  // 创建设备
  async createEquipment(data: CreateEquipmentDto): Promise<Equipment> {
    const response = await apiClient.post('/equipment', data);
    return response.data.data || response.data;
  },

  // 更新设备
  async updateEquipment(id: string, data: UpdateEquipmentDto): Promise<Equipment> {
    const response = await apiClient.put(`/equipment/${id}`, data);
    return response.data.data || response.data;
  },

  // 删除设备
  async deleteEquipment(id: string): Promise<void> {
    await apiClient.delete(`/equipment/${id}`);
  },

  // 获取维护提醒
  async getMaintenanceAlerts(): Promise<Equipment[]> {
    const response = await apiClient.get('/equipment/maintenance-alerts');
    return response.data.data || response.data;
  },
};
