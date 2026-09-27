import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Variety, CreateVarietyDto, UpdateVarietyDto } from '@/types/variety';
import { varietyService } from '@/services/variety.service';

export const useVarietyStore = defineStore('variety', () => {
  const varieties = ref<Variety[]>([]);
  const currentVariety = ref<Variety | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 获取所有品种
  async function fetchVarieties(params?: any) {
    loading.value = true;
    error.value = null;
    try {
      varieties.value = await varietyService.getVarieties(params);
    } catch (err: any) {
      error.value = err.response?.data?.error || err.response?.data?.message || '获取品种列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 获取单个品种
  async function fetchVariety(id: string) {
    loading.value = true;
    error.value = null;
    try {
      currentVariety.value = await varietyService.getVariety(id);
    } catch (err: any) {
      error.value = err.response?.data?.error || err.response?.data?.message || '获取品种详情失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 创建品种
  async function createVariety(data: CreateVarietyDto) {
    loading.value = true;
    error.value = null;
    try {
      const newVariety = await varietyService.createVariety(data);
      varieties.value.push(newVariety);
      return newVariety;
    } catch (err: any) {
      error.value = err.response?.data?.error || err.response?.data?.message || '创建品种失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 更新品种
  async function updateVariety(id: string, data: UpdateVarietyDto) {
    loading.value = true;
    error.value = null;
    try {
      const updatedVariety = await varietyService.updateVariety(id, data);
      const index = varieties.value.findIndex((v) => v.id === id);
      if (index !== -1) {
        varieties.value[index] = updatedVariety;
      }
      if (currentVariety.value?.id === id) {
        currentVariety.value = updatedVariety;
      }
      return updatedVariety;
    } catch (err: any) {
      error.value = err.response?.data?.error || err.response?.data?.message || '更新品种失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 删除品种
  async function deleteVariety(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await varietyService.deleteVariety(id);
      varieties.value = varieties.value.filter((v) => v.id !== id);
    } catch (err: any) {
      error.value = err.response?.data?.error || err.response?.data?.message || '删除品种失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 批量导入
  async function batchImport(file: File) {
    loading.value = true;
    error.value = null;
    try {
      const result = await varietyService.batchImport(file);
      await fetchVarieties(); // 刷新列表
      return result;
    } catch (err: any) {
      error.value = err.response?.data?.message || '批量导入失败';
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
    varieties,
    currentVariety,
    loading,
    error,
    fetchVarieties,
    fetchVariety,
    createVariety,
    updateVariety,
    deleteVariety,
    batchImport,
    clearError,
  };
});
