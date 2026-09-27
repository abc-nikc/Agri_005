import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    username: string;
    systemRole: string;
  };
}

export const login = async (username: string, password: string): Promise<LoginResult> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { username, password },
      { withCredentials: true }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || '登录失败');
    }
    throw new Error('网络错误');
  }
};

export const logout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('access_token');
    await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
};

export const refreshToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );

    return response.data.accessToken;
  } catch (error) {
    throw new Error('刷新 Token 失败');
  }
};
