<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEdit ? '编辑设备' : '添加设备' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="equipmentNumber">设备编号 *</label>
          <input id="equipmentNumber" v-model="formData.equipmentNumber" type="text" required :disabled="isEdit" placeholder="例：IRR-001" />
        </div>
        <div class="form-group">
          <label for="type">设备类型 *</label>
          <select id="type" v-model="formData.type" required>
            <option value="">请选择类型</option>
            <option value="农机具">农机具</option>
            <option value="灌溉设备">灌溉设备</option>
            <option value="物联网设备">物联网设备</option>
          </select>
        </div>
        <div class="form-group">
          <label for="status">状态 *</label>
          <select id="status" v-model="formData.status" required>
            <option value="正常">正常</option>
            <option value="维护中">维护中</option>
            <option value="故障">故障</option>
          </select>
        </div>
        <div class="form-group">
          <label for="associatedPlotId">关联地块</label>
          <select id="associatedPlotId" v-model="formData.associatedPlotId">
            <option value="">请选择地块（可选）</option>
            <option v-for="plot in plots" :key="plot.id" :value="plot.id">{{ plot.plotNumber }} ({{ plot.area }}亩)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="nextMaintenanceDate">下次维护日期</label>
          <input id="nextMaintenanceDate" v-model="formData.nextMaintenanceDate" type="date" />
        </div>
        <div class="form-group">
          <label for="mqttTopic">MQTT主题</label>
          <input id="mqttTopic" v-model="formData.mqttTopic" type="text" placeholder="例：farm/A01/SENS-T01/data" />
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
import type { EquipmentFormData } from '@/types/equipment';
import type { Plot } from '@/types/plot';

const props = defineProps<{ equipment?: any; plots?: Plot[] }>();
const emit = defineEmits<{ (e: 'save', data: EquipmentFormData): void; (e: 'cancel'): void }>();

const loading = ref(false);
const formData = ref<EquipmentFormData>({
  equipmentNumber: '', type: '', status: '正常',
  associatedPlotId: undefined, nextMaintenanceDate: '', mqttTopic: '',
});

const isEdit = computed(() => !!props.equipment);

onMounted(() => {
  if (props.equipment) {
    formData.value = {
      equipmentNumber: props.equipment.equipmentNumber || '',
      type: props.equipment.type || '',
      status: props.equipment.status || '正常',
      associatedPlotId: props.equipment.associatedPlotId || undefined,
      nextMaintenanceDate: props.equipment.nextMaintenanceDate
        ? new Date(props.equipment.nextMaintenanceDate).toISOString().split('T')[0] : '',
      mqttTopic: props.equipment.mqttTopic || '',
    };
  }
});

const handleSubmit = async () => {
  loading.value = true;
  try {
    const dataToSend: any = { ...formData.value };
    if (!dataToSend.associatedPlotId) delete dataToSend.associatedPlotId;
    if (!dataToSend.nextMaintenanceDate) delete dataToSend.nextMaintenanceDate;
    if (!dataToSend.mqttTopic) delete dataToSend.mqttTopic;
    emit('save', dataToSend);
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
</style>
