import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlantingPlan, PlantingPlanFormData, ProductionBatch, ProductionBatchFormData } from '@/types/planting-plan';
import { plantingPlanService } from '@/services/planting-plan.service';
import { productionBatchService } from '@/services/production-batch.service';

export const usePlantingStore = defineStore('planting', () => {
  const plans = ref<PlantingPlan[]>([]);
  const batches = ref<ProductionBatch[]>([]);
  const currentPlan = ref<PlantingPlan | null>(null);
  const termRec = ref<{ term: string; recommendedNames: string[] }>({ term: '', recommendedNames: [] });
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPlans(params?: any) {
    loading.value = true; error.value = null;
    try { plans.value = await plantingPlanService.getAll(params); } catch (e: any) { error.value = e.response?.data?.error || '获取计划失败'; } finally { loading.value = false; }
  }

  async function fetchBatches(params?: any) {
    loading.value = true; error.value = null;
    try { batches.value = await productionBatchService.getAll(params); } catch (e: any) { error.value = e.response?.data?.error || '获取批次失败'; } finally { loading.value = false; }
  }

  async function fetchTermRecommendations() {
    try { termRec.value = await plantingPlanService.getTermRecommendations(); } catch { /* ignore */ }
  }

  async function createPlan(data: PlantingPlanFormData) {
    loading.value = true; error.value = null;
    try { const p = await plantingPlanService.create(data); plans.value.unshift(p); return p; } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { loading.value = false; }
  }

  async function updatePlan(id: string, data: Partial<PlantingPlanFormData> & { adjustReason?: string }) {
    loading.value = true; error.value = null;
    try { const p = await plantingPlanService.update(id, data); const i = plans.value.findIndex(x => x.id === id); if (i >= 0) plans.value[i] = p; return p; } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { loading.value = false; }
  }

  async function deletePlan(id: string) {
    loading.value = true; error.value = null;
    try { await plantingPlanService.delete(id); plans.value = plans.value.filter(x => x.id !== id); } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { loading.value = false; }
  }

  async function createBatch(data: ProductionBatchFormData) {
    loading.value = true; error.value = null;
    try { const b = await productionBatchService.create(data); batches.value.unshift(b); return b; } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { loading.value = false; }
  }

  async function completeBatch(id: string, actualHarvestDate: string) {
    loading.value = true; error.value = null;
    try { const b = await productionBatchService.complete(id, actualHarvestDate); const i = batches.value.findIndex(x => x.id === id); if (i >= 0) batches.value[i] = b; return b; } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { loading.value = false; }
  }

  async function deleteBatch(id: string) {
    loading.value = true; error.value = null;
    try { await productionBatchService.delete(id); batches.value = batches.value.filter(x => x.id !== id); } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { loading.value = false; }
  }

  function clearError() { error.value = null; }

  return { plans, batches, currentPlan, termRec, loading, error, fetchPlans, fetchBatches, fetchTermRecommendations, createPlan, updatePlan, deletePlan, createBatch, completeBatch, deleteBatch, clearError };
});
