<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><Setting /></el-icon> 设备管理</h2>
        <span class="header-count">共 {{ store.equipmentList.length }} 台</span>
      </div>
      <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">添加设备</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="searchQuery" placeholder="搜索设备编号..." clearable @input="handleSearch" :prefix-icon="Search" style="flex:1;max-width:260px" />
      <el-select v-model="typeFilter" placeholder="全部类型" clearable @change="handleSearch" style="width:140px">
        <el-option v-for="t in ['农机具','灌溉设备','物联网设备','施肥设备','采摘设备','监测设备','运输设备']" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="全部状态" clearable @change="handleSearch" style="width:120px">
        <el-option v-for="s in ['正常','维护中','故障']" :key="s" :label="s" :value="s" />
      </el-select>
    </div>

    <div v-if="store.maintenanceAlerts.length > 0" class="alert-banner">
      <el-icon><WarningFilled /></el-icon>
      <span v-for="(item, index) in store.maintenanceAlerts" :key="item.id">{{ item.equipmentNumber }}{{ index < store.maintenanceAlerts.length - 1 ? '、' : '' }}</span>
      即将需要维护
    </div>

    <div class="content-card">
      <div v-if="store.loading" class="loading-state"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
      <div v-else-if="store.equipmentList.length === 0" class="empty-state"><el-empty description="暂无设备数据" :image-size="80" /></div>
      <el-table v-else :data="store.equipmentList" stripe row-key="id">
        <el-table-column prop="equipmentNumber" label="设备编号" min-width="120" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{row}"><el-tag :type="statusTagType(row.status)" size="small" effect="plain">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="关联地块" min-width="120"><template #default="{row}">{{ row.associatedPlotNumber || '-' }}</template></el-table-column>
        <el-table-column label="下次维护" width="120">
          <template #default="{row}"><span :class="{ 'due-warn': isMaintenanceDue(row.nextMaintenanceDate) }">{{ formatDate(row.nextMaintenanceDate) }}</span></template>
        </el-table-column>
        <el-table-column label="MQTT主题" min-width="160"><template #default="{row}">{{ row.mqttTopic || '-' }}</template></el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="editEquipment(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <EquipmentForm v-if="showCreateDialog || showEditDialog" :equipment="editingEquipment" :plots="plots" @save="handleSave" @cancel="closeDialogs" />

    <el-dialog v-model="showDeleteDialog" title="确认删除" width="400px" center>
      <p>确定要删除设备 "{{ deletingEquipment?.equipmentNumber }}" 吗？</p>
      <template #footer><el-button @click="showDeleteDialog = false">取消</el-button><el-button type="danger" @click="handleDelete" :loading="store.loading">确定删除</el-button></template>
    </el-dialog>

    <div v-if="store.error" class="error-toast" @click="store.clearError()">{{ store.error }} <el-icon><Close /></el-icon></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Search } from '@element-plus/icons-vue';
import { useEquipmentStore } from '@/stores/equipment.store';
import { usePlotStore } from '@/stores/plot.store';
import EquipmentForm from '@/components/EquipmentForm.vue';
import type { Equipment } from '@/types/equipment';
import type { Plot } from '@/types/plot';

const store = useEquipmentStore(); const plotStore = usePlotStore();
const showCreateDialog = ref(false); const showEditDialog = ref(false); const showDeleteDialog = ref(false);
const editingEquipment = ref<Equipment | null>(null); const deletingEquipment = ref<Equipment | null>(null);
const searchQuery = ref(''); const typeFilter = ref(''); const statusFilter = ref(''); const plots = ref<Plot[]>([]);

onMounted(async () => { await Promise.all([store.fetchEquipment(), store.fetchMaintenanceAlerts(), plotStore.fetchPlots()]); plots.value = plotStore.plots; });
const handleSearch = async () => { const params: any = {}; if (searchQuery.value) params.search = searchQuery.value; if (typeFilter.value) params.type = typeFilter.value; if (statusFilter.value) params.status = statusFilter.value; await store.fetchEquipment(params); };
const statusTagType = (s: string) => s === '正常' ? 'success' : s === '维护中' ? 'warning' : 'danger';
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('zh-CN') : '-';
const isMaintenanceDue = (d: string | null) => { if (!d) return false; const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); return diff <= 7; };
const editEquipment = (e: Equipment) => { editingEquipment.value = e; showEditDialog.value = true; };
const confirmDelete = (e: Equipment) => { deletingEquipment.value = e; showDeleteDialog.value = true; };
const handleSave = async (data: any) => { try { if (showEditDialog.value && editingEquipment.value) await store.updateEquipment(editingEquipment.value.id, data); else await store.createEquipment(data); closeDialogs(); await store.fetchEquipment(); } catch (e: any) { store.error = e?.message || '操作失败'; } };
const handleDelete = async () => { if (!deletingEquipment.value) return; const backup = { ...deletingEquipment.value }; try { await store.deleteEquipment(deletingEquipment.value.id); showDeleteDialog.value = false; const addUndo = (window as any).__addUndo; if (addUndo) addUndo(backup.id, '删除设备「' + backup.equipmentNumber + '」', async () => { await store.createEquipment(backup); }); deletingEquipment.value = null; } catch (e: any) { store.error = e?.message || '删除失败'; } };
const closeDialogs = () => { showCreateDialog.value = false; showEditDialog.value = false; editingEquipment.value = null; };
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-left { display: flex; align-items: center; gap: var(--space-md); }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-count { font-size: var(--text-sm); color: var(--color-text-muted); background: var(--color-bg-alt); padding: 3px 12px; border-radius: var(--radius-full); }
.search-bar { display: flex; gap: var(--space-sm); margin-bottom: var(--space-lg); align-items: center; }
.alert-banner { background: var(--color-warning-bg); color: #92400e; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(245,158,11,0.2); margin-bottom: var(--space-md); font-size: var(--text-sm); display: flex; align-items: center; gap: 8px; }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.due-warn { color: var(--color-danger); font-weight: 700; }
.error-toast { position: fixed; bottom: 20px; right: 20px; background: var(--color-danger); color: white; padding: 12px 20px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; cursor: pointer; z-index: 2000; font-size: var(--text-sm); box-shadow: var(--shadow-lg); }
</style>
