<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEdit ? '编辑品种' : '添加品种' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">品种名称 *</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="例如：小白菜"
          />
        </div>

        <div class="form-group">
          <label for="category">分类 *</label>
          <select id="category" v-model="formData.category" required>
            <option value="">请选择分类</option>
            <option value="叶菜类">叶菜类</option>
            <option value="根茎类">根茎类</option>
            <option value="果菜类">果菜类</option>
            <option value="花菜类">花菜类</option>
            <option value="香料类">香料类</option>
          </select>
        </div>

        <div class="form-group">
          <label for="sowingSeason">播种季节 *</label>
          <select id="sowingSeason" v-model="sowingSeasonText" required>
            <option value="">请选择播种季节</option>
            <option value="春">春</option>
            <option value="夏">夏</option>
            <option value="秋">秋</option>
            <option value="冬">冬</option>
            <option value="春秋">春秋</option>
            <option value="全年">全年</option>
          </select>
        </div>

        <div class="form-group">
          <label for="plantingDensity">种植密度(株/㎡) *</label>
          <input
            id="plantingDensity"
            v-model.number="formData.plantingDensity"
            type="number"
            required
            min="1"
            placeholder="例如：25"
          />
        </div>

        <div class="form-group">
          <label for="fertilizationRate">施肥量(kg/亩) *</label>
          <input
            id="fertilizationRate"
            v-model.number="formData.fertilizationRate"
            type="number"
            required
            min="0"
            step="0.1"
            placeholder="例如：500"
          />
        </div>

        <div class="form-group">
          <label for="wateringFrequency">浇水频率(次/周) *</label>
          <input
            id="wateringFrequency"
            v-model.number="formData.wateringFrequency"
            type="number"
            required
            min="0"
            placeholder="例如：3"
          />
        </div>

        <div class="form-group">
          <label for="growthCycle">生长周期(天) *</label>
          <input
            id="growthCycle"
            v-model.number="formData.growthCycle"
            type="number"
            required
            min="1"
            placeholder="例如：45"
          />
        </div>

        <div class="form-group">
          <label for="safetyInterval">安全间隔期(天) *</label>
          <input
            id="safetyInterval"
            v-model.number="formData.safetyInterval"
            type="number"
            required
            min="0"
            placeholder="例如：7"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
            取消
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Variety, CreateVarietyDto, UpdateVarietyDto } from '@/types/variety';

const props = defineProps<{
  variety?: Variety | null;
}>();

const emit = defineEmits<{
  (e: 'save', data: CreateVarietyDto | UpdateVarietyDto): void;
  (e: 'cancel'): void;
}>();

const loading = ref(false);
const sowingSeasonText = ref('');

const formData = ref<CreateVarietyDto>({
  name: '',
  category: '',
  sowingSeason: [],
  plantingDensity: 0,
  fertilizationRate: 0,
  wateringFrequency: 0,
  growthCycle: 0,
  safetyInterval: 0,
});

const isEdit = computed(() => !!props.variety);

onMounted(() => {
  if (props.variety) {
    formData.value = {
      name: props.variety.name,
      category: props.variety.category,
      sowingSeason: props.variety.sowingSeason || [],
      plantingDensity: props.variety.plantingDensity ?? 0,
      fertilizationRate: props.variety.fertilizationRate ?? 0,
      wateringFrequency: props.variety.wateringFrequency ?? 0,
      growthCycle: props.variety.growthCycle ?? 0,
      safetyInterval: props.variety.safetyInterval ?? 0,
    };
    // 反序列化季节为文本
    if (props.variety.sowingSeason && Array.isArray(props.variety.sowingSeason)) {
      sowingSeasonText.value = props.variety.sowingSeason.join('');
    }
  }
});

const handleSubmit = () => {
  loading.value = true;
  // 将季节文本转为数组
  const data: any = { ...formData.value };
  if (sowingSeasonText.value) {
    // 全年/春秋 → 拆分为单字数组
    data.sowingSeason = sowingSeasonText.value.split('');
  }
  emit('save', data);
  loading.value = false;
};
</script>

<style scoped>
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
  min-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
