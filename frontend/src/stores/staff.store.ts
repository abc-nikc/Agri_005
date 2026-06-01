import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Staff, CreateStaffDto, UpdateStaffDto } from '@/types/staff';
import { staffService } from '@/services/staff.service';

function getError(err: any): string {
  return err.response?.data?.error || err.response?.data?.message || err.message || '操作失败';
}

export const useStaffStore = defineStore('staff', () => {
  const staffList = ref<Staff[]>([]);
  const currentStaff = ref<Staff | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const workloadStats = ref<Array<{ name: string; hours: number }>>([]);

  async function fetchStaff(params?: any) {
    loading.value = true; error.value = null;
    try { staffList.value = await staffService.getStaff(params); } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }

  async function fetchStaffMember(id: string) {
    loading.value = true; error.value = null;
    try { currentStaff.value = await staffService.getStaffMember(id); } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }

  async function createStaff(data: CreateStaffDto) {
    loading.value = true; error.value = null;
    try { const s = await staffService.createStaff(data); staffList.value.unshift(s); return s; } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }

  async function updateStaff(id: string, data: UpdateStaffDto) {
    loading.value = true; error.value = null;
    try {
      const s = await staffService.updateStaff(id, data);
      const i = staffList.value.findIndex(x => x.id === id);
      if (i >= 0) staffList.value[i] = s;
      if (currentStaff.value?.id === id) currentStaff.value = s;
      return s;
    } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }

  async function deleteStaff(id: string) {
    loading.value = true; error.value = null;
    try { await staffService.deleteStaff(id); staffList.value = staffList.value.filter(s => s.id !== id); } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }

  async function resetPassword(id: string, newPassword: string) {
    loading.value = true; error.value = null;
    try { await staffService.resetPassword(id, newPassword); } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }

  async function fetchWorkloadStats() {
    loading.value = true; error.value = null;
    try { workloadStats.value = await staffService.getWorkloadStats(); } catch (e: any) { error.value = getError(e); throw e; } finally { loading.value = false; }
  }

  function clearError() { error.value = null; }

  return { staffList, currentStaff, loading, error, workloadStats, fetchStaff, fetchStaffMember, createStaff, updateStaff, deleteStaff, resetPassword, fetchWorkloadStats, clearError };
});
