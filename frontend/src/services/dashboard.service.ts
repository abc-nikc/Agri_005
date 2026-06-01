import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 token 过期
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('access_token', accessToken);
          
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(error.config);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// 仪表盘指标接口
export interface DashboardMetrics {
  totalArea: number;
  plantedArea: number;
  idleArea: number;
  varietyCount: number;
  staffCount: number;
  plotCount: number;
  activeStaffCount: number;
}

// 分布项接口
export interface DistributionItem {
  status?: string;
  category?: string;
  count: number;
  area?: number;
}

// 活动记录接口
export interface Activity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

/**
 * 获取仪表盘关键指标
 * GET /api/v1/dashboard/metrics
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await apiClient.get('/dashboard/metrics');
  return response.data.data;
};

/**
 * 获取地块状态分布
 * GET /api/v1/dashboard/plot-status
 */
export const getPlotStatusDistribution = async (): Promise<DistributionItem[]> => {
  const response = await apiClient.get('/dashboard/plot-status');
  return response.data.data;
};

/**
 * 获取品种类别分布
 * GET /api/v1/dashboard/variety-categories
 */
export const getVarietyCategoryDistribution = async (): Promise<DistributionItem[]> => {
  const response = await apiClient.get('/dashboard/variety-categories');
  return response.data.data;
};

/**
 * 获取最近活动记录
 * GET /api/v1/dashboard/recent-activities?limit=10
 */
export const getRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
  const response = await apiClient.get('/dashboard/recent-activities', {
    params: { limit },
  });
  return response.data.data;
};
