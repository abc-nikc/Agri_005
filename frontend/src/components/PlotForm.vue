<template>
  <div class="dialog-overlay">
    <div class="dialog-content">
      <h3>{{ isEdit ? '编辑地块' : '添加地块' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>地块编号 *</label>
          <input v-model="formData.plotNumber" required placeholder="如：A01" />
        </div>
        <div class="form-group">
          <label>面积(亩) *</label>
          <input v-model.number="formData.area" type="number" step="0.01" min="0.01" required />
        </div>
        <div class="form-group">
          <label>土壤类型</label>
          <select v-model="formData.soilType">
            <option value="">请选择</option>
            <option value="壤土">壤土</option>
            <option value="砂土">砂土</option>
            <option value="黏土">黏土</option>
            <option value="砂壤土">砂壤土</option>
          </select>
        </div>
        <div class="form-group">
          <label>区域 *</label>
          <input v-model="formData.region" required placeholder="如：A区" />
        </div>
        <div class="form-group">
          <label>状态</label>
          <select v-model="formData.status">
            <option value="闲置">闲置</option>
            <option value="已种植">已种植</option>
          </select>
        </div>
        <div class="dialog-actions">
          <button type="button" @click="$emit('cancel')">取消</button>
          <button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Plot, PlotFormData } from '../types/plot';

const props = defineProps<{
  plot?: Plot | null;
}>();

const emit = defineEmits<{
  (e: 'save', data: PlotFormData): void;
  (e: 'cancel'): void;
}>();

const isEdit = computed(() => !!props.plot);
const isSubmitting = ref(false);

const formData = ref<PlotFormData>({
  plotNumber: '',
  area: 0,
  soilType: '',
  region: '',
  status: '闲置',
});

// 使用 watch 替代 onMounted，确保编辑时数据正确填充
watch(() => props.plot, (newPlot) => {
  if (newPlot) {
    formData.value = {
      plotNumber: newPlot.plotNumber,
      area: newPlot.area,
      soilType: newPlot.soilType || '',
      region: newPlot.region,
      status: newPlot.status,
    };
  }
}, { immediate: true });

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    await emit('save', { ...formData.value });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 500px;
}

.dialog-content h3 {
  margin-top: 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #606266;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.dialog-actions button {
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
}

.dialog-actions button:last-child {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.dialog-actions button:first-child:hover {
  background: #f5f7fa;
}
</style>
