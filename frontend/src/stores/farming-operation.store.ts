import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { FarmingOperation, CreateOperationDto, UpdateOperationDto } from '@/types/farming-operation';
import { farmingOperationService } from '@/services/farming-operation.service';

export const useFarmingOperationStore = defineStore('farmingOperation', () => {
  const operations = ref<FarmingOperation[]>([]);
  const currentOperation = ref<FarmingOperation | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchOperations(params?: any) {
    loading.value = true;
    error.value = null;
    try {
      operations.value = await farmingOperationService.getAll(params);
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取农事操作记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOperation(id: string) {
    loading.value = true;
    error.value = null;
    try {
      currentOperation.value = await farmingOperationService.getById(id);
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取操作详情失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createOperation(data: CreateOperationDto) {
    loading.value = true;
    error.value = null;
    try {
      const op = await farmingOperationService.create(data);
      operations.value.unshift(op);
      return op;
    } catch (err: any) {
      error.value = err.response?.data?.error || '创建操作记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateOperation(id: string, data: UpdateOperationDto) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await farmingOperationService.update(id, data);
      const idx = operations.value.findIndex(o => o.id === id);
      if (idx !== -1) operations.value[idx] = updated;
      if (currentOperation.value?.id === id) currentOperation.value = updated;
      return updated;
    } catch (err: any) {
      error.value = err.response?.data?.error || '更新操作记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteOperation(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await farmingOperationService.delete(id);
      operations.value = operations.value.filter(o => o.id !== id);
    } catch (err: any) {
      error.value = err.response?.data?.error || '删除操作记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    operations,
    currentOperation,
    loading,
    error,
    fetchOperations,
    fetchOperation,
    createOperation,
    updateOperation,
    deleteOperation,
    clearError,
  };
});
