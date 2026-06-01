import axios from 'axios';
import type { Equipment, CreateEquipmentDto, UpdateEquipmentDto, EquipmentQueryParams } from '@/types/equipment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
