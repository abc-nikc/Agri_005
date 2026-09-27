import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动附带 token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器：401 自动刷新 token, 403/401 友好提示
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 403 权限不足 → 优先使用后端返回的具体原因
    if (error.response?.status === 403) {
      const backendMsg = error.response.data?.error || error.response.data?.message;
      const msg = backendMsg || '对不起，权限不足，无法执行此操作';
      return Promise.reject(new Error(msg));
    }
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;
        localStorage.setItem('access_token', accessToken);
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(error.config);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('登录已过期'));
      }
    }
    return Promise.reject(error);
  }
);
