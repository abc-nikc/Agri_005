import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Equipment, CreateEquipmentDto, UpdateEquipmentDto } from '@/types/equipment';
import { equipmentService } from '@/services/equipment.service';

function getError(err: any): string {
  return err.response?.data?.error || err.response?.data?.message || err.message || '操作失败';
}

export const useEquipmentStore = defineStore('equipment', () => {
  const equipmentList = ref<Equipment[]>([]);
  const currentEquipment = ref<Equipment | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const maintenanceAlerts = ref<Equipment[]>([]);

  async function fetchEquipment(params?: any) {
    loading.value = true; error.value = null;
    try { equipmentList.value = await equipmentService.getEquipment(params); } catch (e: any) { error.value = getError(e); } finally { loading.value = false; }
  }
  async function fetchEquipmentItem(id: string) {
    loading.value = true; error.value = null;
    try { currentEquipment.value = await equipmentService.getEquipmentItem(id); } catch (e: any) { error.value = getError(e); } finally { loading.value = false; }
  }
  async function createEquipment(data: CreateEquipmentDto) {
    loading.value = true; error.value = null;
    try { const s = await equipmentService.createEquipment(data); equipmentList.value.unshift(s); return s; } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }
  async function updateEquipment(id: string, data: UpdateEquipmentDto) {
    loading.value = true; error.value = null;
    try { const s = await equipmentService.updateEquipment(id, data); const i = equipmentList.value.findIndex(x => x.id === id); if (i >= 0) equipmentList.value[i] = s; return s; } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }
  async function deleteEquipment(id: string) {
    loading.value = true; error.value = null;
    try { await equipmentService.deleteEquipment(id); equipmentList.value = equipmentList.value.filter(x => x.id !== id); } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }
  async function fetchMaintenanceAlerts() {
    loading.value = true;
    try { maintenanceAlerts.value = await equipmentService.getMaintenanceAlerts(); } catch (e: any) { /* 静默失败，不阻断页面 */ } finally { loading.value = false; }
  }
  function clearError() { error.value = null; }
  return { equipmentList, currentEquipment, loading, error, maintenanceAlerts, fetchEquipment, fetchEquipmentItem, createEquipment, updateEquipment, deleteEquipment, fetchMaintenanceAlerts, clearError };
});
