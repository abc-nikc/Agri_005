<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><UserFilled /></el-icon> 员工管理</h2>
        <span class="header-count">共 {{ store.staffList.length }} 人</span>
      </div>
      <el-button type="primary" @click="openCreate" :icon="Plus">添加员工</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="searchQuery" placeholder="搜索员工姓名..." clearable @input="handleSearch" :prefix-icon="Search" style="flex:1;max-width:260px" />
      <el-select v-model="roleFilter" placeholder="全部角色" clearable @change="handleSearch" style="width:150px">
        <el-option v-for="r in ['系统管理员','农艺师','操作员','只读观察者']" :key="r" :label="r" :value="r" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="全部状态" clearable @change="handleSearch" style="width:120px">
        <el-option label="在职" value="true" /><el-option label="离职" value="false" />
      </el-select>
    </div>

    <div class="content-card">
      <div v-if="store.loading" class="loading-state"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
      <div v-else-if="store.staffList.length === 0" class="empty-state"><el-empty description="暂无员工数据" :image-size="80" /></div>
      <el-table v-else :data="store.staffList" stripe row-key="id">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column label="系统角色" width="120"><template #default="{row}"><el-tag size="small" effect="plain">{{ row.systemRole }}</el-tag></template></el-table-column>
        <el-table-column label="业务分工" min-width="120"><template #default="{row}">{{ row.businessDivision || '-' }}</template></el-table-column>
        <el-table-column label="总工时" width="100"><template #default="{row}">{{ row.totalWorkHours }}h</template></el-table-column>
        <el-table-column label="联系方式" width="140"><template #default="{row}">{{ row.contactPhone || '-' }}</template></el-table-column>
        <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="row.isActive ? 'success' : 'info'" size="small" effect="plain">{{ row.isActive ? '在职' : '离职' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="editStaff(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="resetPassword(row)">重置密码</el-button>
            <el-button type="danger" link size="small" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <StaffForm v-if="showCreateDialog || showEditDialog" :staff="editingStaff" :error="store.error" @save="handleSave" @cancel="closeDialogs" />

    <el-dialog v-model="showDeleteDialog" title="确认删除" width="400px" center>
      <p>确定要删除员工 "{{ deletingStaff?.name }}" 吗？</p>
      <template #footer><el-button @click="showDeleteDialog = false">取消</el-button><el-button type="danger" @click="handleDelete" :loading="store.loading">确定删除</el-button></template>
    </el-dialog>

    <el-dialog v-model="showResetDialog" title="重置密码" width="400px" center>
      <el-input v-model="newPassword" type="password" placeholder="请输入新密码" show-password />
      <template #footer><el-button @click="showResetDialog = false">取消</el-button><el-button type="primary" @click="handleResetPassword" :loading="store.loading">确定重置</el-button></template>
    </el-dialog>

    <div v-if="store.error" class="error-toast" @click="store.clearError()">{{ store.error }} <el-icon><Close /></el-icon></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Search } from '@element-plus/icons-vue';
import { useStaffStore } from '@/stores/staff.store';
import StaffForm from '@/components/StaffForm.vue';
import type { Staff } from '@/types/staff';

const store = useStaffStore();
const showCreateDialog = ref(false); const showEditDialog = ref(false); const showDeleteDialog = ref(false); const showResetDialog = ref(false);
const editingStaff = ref<Staff | null>(null); const deletingStaff = ref<Staff | null>(null); const resettingStaff = ref<Staff | null>(null);
const newPassword = ref(''); const searchQuery = ref(''); const roleFilter = ref(''); const statusFilter = ref('');

onMounted(async () => { await store.fetchStaff(); });
const openCreate = () => { store.clearError(); editingStaff.value = null; showCreateDialog.value = true; };
const handleSearch = async () => { const params: any = {}; if (searchQuery.value) params.search = searchQuery.value; if (roleFilter.value) params.systemRole = roleFilter.value; if (statusFilter.value !== '') params.isActive = statusFilter.value === 'true'; await store.fetchStaff(params); };
const editStaff = (staff: Staff) => { editingStaff.value = staff; showEditDialog.value = true; };
const resetPassword = (staff: Staff) => { resettingStaff.value = staff; newPassword.value = ''; showResetDialog.value = true; };
const confirmDelete = (staff: Staff) => { deletingStaff.value = staff; showDeleteDialog.value = true; };
const handleSave = async (data: any) => { try { if (showEditDialog.value && editingStaff.value) await store.updateStaff(editingStaff.value.id, data); else await store.createStaff(data); closeDialogs(); } catch {} };
const handleDelete = async () => { if (!deletingStaff.value) return; const backup = { ...deletingStaff.value }; try { await store.deleteStaff(deletingStaff.value.id); showDeleteDialog.value = false; const addUndo = (window as any).__addUndo; if (addUndo) addUndo(backup.id, '删除员工「' + backup.name + '」', async () => { await store.createStaff(backup); }); deletingStaff.value = null; } catch {} };
const handleResetPassword = async () => { if (!resettingStaff.value || !newPassword.value) return; try { await store.resetPassword(resettingStaff.value.id, newPassword.value); showResetDialog.value = false; resettingStaff.value = null; newPassword.value = ''; alert('密码重置成功'); } catch {} };
const closeDialogs = () => { showCreateDialog.value = false; showEditDialog.value = false; editingStaff.value = null; };
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-left { display: flex; align-items: center; gap: var(--space-md); }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-count { font-size: var(--text-sm); color: var(--color-text-muted); background: var(--color-bg-alt); padding: 3px 12px; border-radius: var(--radius-full); }
.search-bar { display: flex; gap: var(--space-sm); margin-bottom: var(--space-lg); align-items: center; }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.error-toast { position: fixed; bottom: 20px; right: 20px; background: var(--color-danger); color: white; padding: 12px 20px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; cursor: pointer; z-index: 2000; font-size: var(--text-sm); box-shadow: var(--shadow-lg); }
</style>
