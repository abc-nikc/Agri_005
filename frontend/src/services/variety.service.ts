import axios from 'axios';
import type { Variety, CreateVarietyDto, UpdateVarietyDto, VarietyQueryParams } from '@/types/variety';

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

export const varietyService = {
  // 获取品种列表
  async getVarieties(params?: VarietyQueryParams): Promise<Variety[]> {
    const response = await apiClient.get('/varieties', { params });
    return response.data.data;
  },

  // 获取单个品种
  async getVariety(id: string): Promise<Variety> {
    const response = await apiClient.get(`/varieties/${id}`);
    return response.data.data;
  },

  // 创建品种
  async createVariety(data: CreateVarietyDto): Promise<Variety> {
    const response = await apiClient.post('/varieties', data);
    return response.data.data || response.data;
  },

  // 更新品种
  async updateVariety(id: string, data: UpdateVarietyDto): Promise<Variety> {
    const response = await apiClient.put(`/varieties/${id}`, data);
    return response.data.data || response.data;
  },

  // 删除品种
  async deleteVariety(id: string): Promise<void> {
    await apiClient.delete(`/varieties/${id}`);
  },

  // 批量导入
  async batchImport(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/varieties/batch-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
