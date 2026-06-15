import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DashboardMetrics } from '@/services/dashboard.service';
import { getDashboardMetrics } from '@/services/dashboard.service';

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardMetrics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 获取仪表盘统计数据
  async function fetchStats() {
    loading.value = true;
    error.value = null;
    try {
      stats.value = await getDashboardMetrics();
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取仪表盘数据失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 清除错误
  function clearError() {
    error.value = null;
  }

  return {
    stats,
    loading,
    error,
    fetchStats,
    clearError,
  };
});
