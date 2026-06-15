import { defineStore } from 'pinia';
import { ref } from 'vue';
import { plotService } from '../services/plot.service';
import type { Plot } from '../types/plot';

export const usePlotStore = defineStore('plot', () => {
  const plots = ref<Plot[]>([]);
  const currentPlot = ref<Plot | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const statistics = ref<any>(null);

  // 获取所有地块
  const fetchPlots = async () => {
    loading.value = true;
    error.value = null;
    try {
      plots.value = await plotService.getAll();
    } catch (err: any) {
      error.value = err.message || '获取地块列表失败';
    } finally {
      loading.value = false;
    }
  };

  // 获取单个地块
  const fetchPlotById = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      currentPlot.value = await plotService.getById(id);
    } catch (err: any) {
      error.value = err.message || '获取地块详情失败';
    } finally {
      loading.value = false;
    }
  };

  // 创建地块
  const createPlot = async (plotData: Partial<Plot>) => {
    loading.value = true;
    error.value = null;
    try {
      const newPlot = await plotService.create(plotData);
      plots.value.push(newPlot);
      return newPlot;
    } catch (err: any) {
      error.value = err.message || '创建地块失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 更新地块
  const updatePlot = async (id: string, plotData: Partial<Plot>) => {
    loading.value = true;
    error.value = null;
    try {
      const updatedPlot = await plotService.update(id, plotData);
      const index = plots.value.findIndex(p => p.id === id);
      if (index !== -1) {
        plots.value[index] = updatedPlot;
      }
      return updatedPlot;
    } catch (err: any) {
      error.value = err.message || '更新地块失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 删除地块
  const deletePlot = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await plotService.delete(id);
      plots.value = plots.value.filter(p => p.id !== id);
    } catch (err: any) {
      error.value = err.message || '删除地块失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取统计信息
  const fetchStatistics = async () => {
    loading.value = true;
    error.value = null;
    try {
      statistics.value = await plotService.getStatistics();
    } catch (err: any) {
      error.value = err.message || '获取统计信息失败';
    } finally {
      loading.value = false;
    }
  };

  return {
    plots,
    currentPlot,
    loading,
    error,
    statistics,
    fetchPlots,
    fetchPlotById,
    createPlot,
    updatePlot,
    deletePlot,
    fetchStatistics,
  };
});
