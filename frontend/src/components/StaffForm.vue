<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEdit ? '编辑员工' : '添加员工' }}</h3>
      <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">姓名 *</label>
          <input id="name" v-model="formData.name" type="text" required placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label for="username">用户名 *</label>
          <input id="username" v-model="formData.username" type="text" required placeholder="请输入用户名" />
        </div>
        <div class="form-group" v-if="!isEdit">
          <label for="password">密码 *</label>
          <input id="password" v-model="formData.password" type="password" required placeholder="至少6位" />
        </div>
        <div class="form-group">
          <label for="systemRole">系统角色 *</label>
          <select id="systemRole" v-model="formData.systemRole" required>
            <option value="">请选择角色</option>
            <option value="系统管理员">系统管理员</option>
            <option value="农艺师">农艺师</option>
            <option value="操作员">操作员</option>
            <option value="只读观察者">只读观察者</option>
          </select>
        </div>
        <div class="form-group">
          <label for="businessDivision">业务分工</label>
          <input id="businessDivision" v-model="formData.businessDivision" type="text" placeholder="例：田间作业、仓库管理" />
        </div>
        <div class="form-group">
          <label for="contactPhone">联系方式</label>
          <input id="contactPhone" v-model="formData.contactPhone" type="tel" placeholder="请输入手机号" />
        </div>
        <div class="form-group" v-if="isEdit">
          <label><input type="checkbox" v-model="formData.isActive" /> 在职</label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { CreateStaffDto } from '@/types/staff';

const props = defineProps<{ staff?: any; error?: string | null }>();
const emit = defineEmits<{ (e: 'save', data: CreateStaffDto): void; (e: 'cancel'): void }>();

const loading = ref(false);
const errorMsg = ref<string | null>(null);
const formData = ref<CreateStaffDto>({
  name: '', username: '', password: '', systemRole: '操作员',
  businessDivision: '', contactPhone: '',
});

const isEdit = computed(() => !!props.staff);

onMounted(() => {
  if (props.staff) {
    formData.value = {
      name: props.staff.name || '',
      username: props.staff.username || '',
      password: '',
      systemRole: props.staff.systemRole || '操作员',
      businessDivision: props.staff.businessDivision || '',
      contactPhone: props.staff.contactPhone || '',
    };
  }
});

const handleSubmit = async () => {
  errorMsg.value = null;
  loading.value = true;
  try {
    const dataToSend: any = { ...formData.value };
    if (!isEdit.value && dataToSend.password.length < 6) {
      errorMsg.value = '密码至少6位';
      loading.value = false;
      return;
    }
    if (isEdit.value) { delete dataToSend.password; }
    if (!dataToSend.businessDivision) delete dataToSend.businessDivision;
    if (!dataToSend.contactPhone) delete dataToSend.contactPhone;
    await emit('save', dataToSend);
  } catch (err: any) {
    errorMsg.value = err?.message || '操作失败';
  } finally { loading.value = false; }
};
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 24px; border-radius: 8px; min-width: 500px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 4px; font-weight: 500; }
.form-group input, .form-group select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.form-group input:disabled { background: #f5f5f5; cursor: not-allowed; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
.btn-primary { background: #007bff; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error-banner { background: #f8d7da; color: #721c24; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 14px; }
</style>
