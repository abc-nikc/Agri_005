<template>
  <div class="equipment-management">
    <div class="page-header">
      <h2>设备管理</h2>
      <button class="btn btn-primary" @click="showCreateDialog = true">
        添加设备
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索设备编号..."
        class="search-input"
        @input="handleSearch"
      />
      <select v-model="typeFilter" @change="handleSearch" class="filter-select">
        <option value="">全部类型</option>
        <option value="灌溉设备">灌溉设备</option>
        <option value="施肥设备">施肥设备</option>
        <option value="采摘设备">采摘设备</option>
        <option value="监测设备">监测设备</option>
        <option value="运输设备">运输设备</option>
      </select>
      <select v-model="statusFilter" @change="handleSearch" class="filter-select">
        <option value="">全部状态</option>
        <option value="正常">正常</option>
        <option value="维护中">维护中</option>
        <option value="故障">故障</option>
      </select>
    </div>

    <!-- 维护提醒 -->
    <div v-if="store.maintenanceAlerts.length > 0" class="alert alert-warning">
      <strong>维护提醒：</strong>
      <span v-for="(item, index) in store.maintenanceAlerts" :key="item.id">
        {{ item.equipmentNumber }}{{ index < store.maintenanceAlerts.length - 1 ? '、' : '' }}
      </span>
      即将需要维护
    </div>

    <!-- 设备列表 -->
    <div class="table-container" v-if="!store.loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>设备编号</th>
            <th>类型</th>
            <th>状态</th>
            <th>关联地块</th>
            <th>下次维护日期</th>
            <th>MQTT主题</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="equipment in store.equipmentList" :key="equipment.id">
            <td>{{ equipment.equipmentNumber }}</td>
            <td>{{ equipment.type }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(equipment.status)]">
                {{ equipment.status }}
              </span>
            </td>
            <td>{{ equipment.associatedPlotId || '-' }}</td>
            <td :class="{ 'text-danger': isMaintenanceDue(equipment.nextMaintenanceDate) }">
              {{ formatDate(equipment.nextMaintenanceDate) }}
            </td>
            <td>{{ equipment.mqttTopic || '-' }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="editEquipment(equipment)">
                编辑
              </button>
              <button class="btn btn-sm btn-danger" @click="confirmDelete(equipment)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="store.equipmentList.length === 0" class="empty-state">
        暂无设备数据
      </div>
    </div>

    <div v-if="store.loading" class="loading">加载中...</div>

    <!-- 创建/编辑对话框 -->
    <EquipmentForm
      v-if="showCreateDialog || showEditDialog"
      :equipment="editingEquipment"
      :plots="plots"
      @save="handleSave"
      @cancel="closeDialogs"
    />

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>确定要删除设备 "{{ deletingEquipment?.equipmentNumber }}" 吗？</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteDialog = false">
            取消
          </button>
          <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">
            确定删除
          </button>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="store.error" class="error-message">
      {{ store.error }}
      <button class="close-btn" @click="store.clearError()">&times;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEquipmentStore } from '@/stores/equipment.store';
import { usePlotStore } from '@/stores/plot.store';
import EquipmentForm from '@/components/EquipmentForm.vue';
import type { Equipment } from '@/types/equipment';
import type { Plot } from '@/types/plot';

const store = useEquipmentStore();
const plotStore = usePlotStore();
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const editingEquipment = ref<Equipment | null>(null);
const deletingEquipment = ref<Equipment | null>(null);
const searchQuery = ref('');
const typeFilter = ref('');
const statusFilter = ref('');
const plots = ref<Plot[]>([]);

onMounted(async () => {
  await Promise.all([
    store.fetchEquipment(),
    store.fetchMaintenanceAlerts(),
    plotStore.fetchPlots(),
  ]);
  plots.value = plotStore.plots;
});

const handleSearch = async () => {
  const params: any = {};
  if (searchQuery.value) params.search = searchQuery.value;
  if (typeFilter.value) params.type = typeFilter.value;
  if (statusFilter.value) params.status = statusFilter.value;
  await store.fetchEquipment(params);
};

const getStatusClass = (status: string) => {
  switch (status) {
    case '正常': return 'active';
    case '维护中': return 'maintenance';
    case '故障': return 'inactive';
    default: return '';
  }
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
};

const isMaintenanceDue = (date: string | null) => {
  if (!date) return false;
  const maintenanceDate = new Date(date);
  const today = new Date();
  const diffTime = maintenanceDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7; // 7天内需要维护
};

const editEquipment = (equipment: Equipment) => {
  editingEquipment.value = equipment;
  showEditDialog.value = true;
};

const confirmDelete = (equipment: Equipment) => {
  deletingEquipment.value = equipment;
  showDeleteDialog.value = true;
};

const handleSave = async (data: any) => {
  try {
    if (showEditDialog.value && editingEquipment.value) {
      await store.updateEquipment(editingEquipment.value.id, data);
    } else {
      await store.createEquipment(data);
    }
    closeDialogs();
  } catch (error: any) {
    store.error = error?.message || '操作失败';
  }
};

const handleDelete = async () => {
  if (!deletingEquipment.value) return;
  try {
    await store.deleteEquipment(deletingEquipment.value.id);
    showDeleteDialog.value = false;
    deletingEquipment.value = null;
  } catch (error: any) {
    store.error = error?.message || '删除失败';
  }
};

const closeDialogs = () => {
  showCreateDialog.value = false;
  showEditDialog.value = false;
  editingEquipment.value = null;
};
</script>

<style scoped>
.equipment-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.status-badge.active {
  background-color: #d4edda;
  color: #1a1a1a;
}

.status-badge.maintenance {
  background-color: #fff3cd;
  color: #1a1a1a;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #1a1a1a;
}

.text-danger {
  color: #dc3545;
  font-weight: 600;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.error-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #721c24;
}
</style>
