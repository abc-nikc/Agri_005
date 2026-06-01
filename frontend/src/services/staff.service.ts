import axios from 'axios';
import type { Staff, CreateStaffDto, UpdateStaffDto, StaffQueryParams } from '@/types/staff';

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

export const staffService = {
  // 获取员工列表
  async getStaff(params?: StaffQueryParams): Promise<Staff[]> {
    const response = await apiClient.get('/staff', { params });
    return response.data.data || response.data;
  },

  // 获取单个员工
  async getStaffMember(id: string): Promise<Staff> {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data.data || response.data;
  },

  // 创建员工
  async createStaff(data: CreateStaffDto): Promise<Staff> {
    const response = await apiClient.post('/staff', data);
    return response.data.data || response.data;
  },

  // 更新员工
  async updateStaff(id: string, data: UpdateStaffDto): Promise<Staff> {
    const response = await apiClient.put(`/staff/${id}`, data);
    return response.data.data || response.data;
  },

  // 删除员工（软删除）
  async deleteStaff(id: string): Promise<void> {
    await apiClient.delete(`/staff/${id}`);
  },

  // 重置密码
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await apiClient.put(`/staff/${id}/password`, { password: newPassword });
  },

  // 获取员工工作量统计
  async getWorkloadStats(): Promise<Array<{ name: string; hours: number }>> {
    const response = await apiClient.get('/staff/statistics');
    return response.data.data || response.data;
  },
};
