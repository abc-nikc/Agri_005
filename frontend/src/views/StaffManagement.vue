<template>
  <div class="staff-management">
    <div class="page-header">
      <h2>员工管理</h2>
      <button class="btn btn-primary" @click="openCreate">添加员工</button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索员工姓名..."
        class="search-input"
        @input="handleSearch"
      />
      <select v-model="roleFilter" @change="handleSearch" class="filter-select">
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="manager">经理</option>
        <option value="worker">工人</option>
        <option value="viewer">查看者</option>
      </select>
      <select v-model="statusFilter" @change="handleSearch" class="filter-select">
        <option value="">全部状态</option>
        <option value="true">在职</option>
        <option value="false">离职</option>
      </select>
    </div>

    <!-- 员工列表 -->
    <div class="table-container" v-if="!store.loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>用户名</th>
            <th>系统角色</th>
            <th>业务分工</th>
            <th>总工时</th>
            <th>联系方式</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="staff in store.staffList" :key="staff.id">
            <td>{{ staff.name }}</td>
            <td>{{ staff.username }}</td>
            <td>{{ getRoleText(staff.systemRole) }}</td>
            <td>{{ staff.businessDivision || '-' }}</td>
            <td>{{ staff.totalWorkHours }}小时</td>
            <td>{{ staff.contactPhone || '-' }}</td>
            <td>
              <span :class="['status-badge', staff.isActive ? 'active' : 'inactive']">
                {{ staff.isActive ? '在职' : '离职' }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-primary" @click="editStaff(staff)">
                编辑
              </button>
              <button class="btn btn-sm btn-warning" @click="resetPassword(staff)">
                重置密码
              </button>
              <button class="btn btn-sm btn-danger" @click="confirmDelete(staff)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="store.staffList.length === 0" class="empty-state">
        暂无员工数据
      </div>
    </div>

    <div v-if="store.loading" class="loading">加载中...</div>

    <!-- 创建/编辑对话框 -->
    <StaffForm
      v-if="showCreateDialog || showEditDialog"
      :staff="editingStaff"
      :error="store.error"
      @save="handleSave"
      @cancel="closeDialogs"
    />

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>确定要删除员工 "{{ deletingStaff?.name }}" 吗？</p>
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

    <!-- 重置密码对话框 -->
    <div v-if="showResetDialog" class="modal-overlay">
      <div class="modal-content">
        <h3>重置密码</h3>
        <div class="form-group">
          <label for="newPassword">新密码</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            placeholder="请输入新密码"
            class="form-input"
          />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showResetDialog = false">
            取消
          </button>
          <button class="btn btn-primary" @click="handleResetPassword" :disabled="store.loading">
            确定重置
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
import { useStaffStore } from '@/stores/staff.store';
import StaffForm from '@/components/StaffForm.vue';
import type { Staff } from '@/types/staff';

const store = useStaffStore();
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const showResetDialog = ref(false);
const editingStaff = ref<Staff | null>(null);
const deletingStaff = ref<Staff | null>(null);
const resettingStaff = ref<Staff | null>(null);
const newPassword = ref('');
const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');

onMounted(async () => {
  await store.fetchStaff();
});

const getRoleText = (role: string) => {
  // 角色就是中文，直接返回
  return role;
};

const openCreate = () => {
  store.clearError();
  editingStaff.value = null;
  showCreateDialog.value = true;
};

const handleSearch = async () => {
  const params: any = {};
  if (searchQuery.value) params.search = searchQuery.value;
  if (roleFilter.value) params.system_role = roleFilter.value;
  if (statusFilter.value !== '') params.is_active = statusFilter.value === 'true';
  await store.fetchStaff(params);
};

const editStaff = (staff: Staff) => {
  editingStaff.value = staff;
  showEditDialog.value = true;
};

const resetPassword = (staff: Staff) => {
  resettingStaff.value = staff;
  newPassword.value = '';
  showResetDialog.value = true;
};

const confirmDelete = (staff: Staff) => {
  deletingStaff.value = staff;
  showDeleteDialog.value = true;
};

const handleSave = async (data: any) => {
  try {
    if (showEditDialog.value && editingStaff.value) {
      await store.updateStaff(editingStaff.value.id, data);
    } else {
      await store.createStaff(data);
    }
    closeDialogs();
  } catch {
    // 错误显示在 store.error + 表单错误栏
  }
};

const handleDelete = async () => {
  if (!deletingStaff.value) return;
  try {
    await store.deleteStaff(deletingStaff.value.id);
    showDeleteDialog.value = false;
    deletingStaff.value = null;
  } catch {
    // 错误已由 store 设置
  }
};

const handleResetPassword = async () => {
  if (!resettingStaff.value || !newPassword.value) return;
  
  try {
    await store.resetPassword(resettingStaff.value.id, newPassword.value);
    showResetDialog.value = false;
    resettingStaff.value = null;
    newPassword.value = '';
    alert('密码重置成功');
  } catch (error) {
    // 错误已在 store 中处理
  }
};

const closeDialogs = () => {
  showCreateDialog.value = false;
  showEditDialog.value = false;
  editingStaff.value = null;
};
</script>

<style scoped>
.staff-management {
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

.status-badge.inactive {
  background-color: #f8d7da;
  color: #1a1a1a;
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

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
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

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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
