<template>
  <div class="overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <h3>{{ isEdit ? '编辑农事操作' : '新增农事操作' }}</h3>
      
      <!-- 操作类型选择 -->
      <div class="operation-tabs">
        <button
          v-for="type in operationTypes"
          :key="type"
          :class="['tab', { active: form.operationType === type }]"
          @click="form.operationType = type"
        >{{ type }}</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <!-- 通用字段 -->
          <div class="form-group">
            <label>地块 *</label>
            <select v-model="form.plotId" required>
              <option value="">请选择地块</option>
              <option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }} ({{ p.region }})</option>
            </select>
          </div>

          <div class="form-group" v-if="needsVariety">
            <label>品种 *</label>
            <select v-model="form.varietyId" required>
              <option value="">请选择品种</option>
              <option v-for="v in varieties" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>操作人 *</label>
            <input v-model="form.operatorName" required placeholder="请输入操作人姓名" />
          </div>

          <div class="form-group">
            <label>操作时间 *</label>
            <input type="datetime-local" v-model="form.operationDate" required />
          </div>

          <!-- 播种/移栽 -->
          <div class="form-group" v-if="form.operationType === '播种' || form.operationType === '移栽'">
            <label>面积(亩) *</label>
            <input type="number" v-model.number="form.area" required min="0" step="0.1" />
          </div>

          <!-- 施肥 -->
          <template v-if="form.operationType === '施肥'">
            <div class="form-group">
              <label>肥料品类 *</label>
              <input v-model="form.fertilizerName" required placeholder="如: 复合肥" />
            </div>
            <div class="form-group">
              <label>用量 *</label>
              <input type="number" v-model.number="form.fertilizerAmount" required min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>单位</label>
              <select v-model="form.fertilizerUnit">
                <option value="kg">公斤(kg)</option>
                <option value="g">克(g)</option>
                <option value="L">升(L)</option>
                <option value="ml">毫升(ml)</option>
              </select>
            </div>
          </template>

          <!-- 打药 -->
          <template v-if="form.operationType === '打药'">
            <div class="form-group">
              <label>农药品类 *</label>
              <input v-model="form.pesticideName" required placeholder="如: 吡虫啉" />
            </div>
            <div class="form-group">
              <label>用量 *</label>
              <input type="number" v-model.number="form.pesticideAmount" required min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>单位</label>
              <select v-model="form.pesticideUnit">
                <option value="ml">毫升(ml)</option>
                <option value="g">克(g)</option>
                <option value="L">升(L)</option>
              </select>
            </div>
          </template>

          <!-- 灌溉/排水 -->
          <template v-if="form.operationType === '灌溉' || form.operationType === '排水'">
            <div class="form-group">
              <label>水量</label>
              <input type="number" v-model.number="form.waterAmount" min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>水量单位</label>
              <select v-model="form.waterUnit">
                <option value="m³">立方米(m³)</option>
                <option value="L">升(L)</option>
              </select>
            </div>
            <div class="form-group">
              <label>时长(分钟)</label>
              <input type="number" v-model.number="form.waterDuration" min="0" />
            </div>
          </template>

          <!-- 除草/整枝 -->
          <div class="form-group" v-if="form.operationType === '除草' || form.operationType === '整枝'">
            <label>操作内容 *</label>
            <textarea v-model="form.workDescription" required placeholder="描述具体操作内容和面积" rows="3"></textarea>
          </div>

          <!-- 采收 -->
          <template v-if="form.operationType === '采收'">
            <div class="form-group">
              <label>产量(kg) *</label>
              <input type="number" v-model.number="form.harvestYield" required min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>品质等级 *</label>
              <select v-model="form.qualityGrade" required>
                <option value="">请选择</option>
                <option value="一级">一级</option>
                <option value="二级">二级</option>
                <option value="三级">三级</option>
              </select>
            </div>
            <div class="form-group">
              <label>去向 *</label>
              <input v-model="form.harvestDestination" required placeholder="如: 冷库、市场" />
            </div>
          </template>

          <!-- 通用可选字段 -->
          <div class="form-group">
            <label>天气</label>
            <select v-model="form.weather">
              <option value="">不填写</option>
              <option value="晴">晴</option>
              <option value="多云">多云</option>
              <option value="阴">阴</option>
              <option value="小雨">小雨</option>
              <option value="大雨">大雨</option>
            </select>
          </div>

          <div class="form-group">
            <label>温度(°C)</label>
            <input type="number" v-model.number="form.temperature" step="0.1" />
          </div>

          <div class="form-group">
            <label>作物生长阶段</label>
            <input v-model="form.cropStage" placeholder="如: 苗期、开花期" />
          </div>

          <div class="form-group full-width">
            <label>备注</label>
            <textarea v-model="form.remark" placeholder="其他补充信息" rows="2"></textarea>
          </div>
        </div>

        <div v-if="store.error" class="error-msg">{{ store.error }}</div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('cancel')">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="store.loading">
            {{ store.loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { OperationType, CreateOperationDto } from '@/types/farming-operation';
import { useFarmingOperationStore } from '@/stores/farming-operation.store';

const props = defineProps<{
  isEdit?: boolean;
  initialData?: CreateOperationDto;
  plots?: any[];
  varieties?: any[];
}>();

const emit = defineEmits<{ (e: 'cancel'): void; (e: 'success'): void }>();
const store = useFarmingOperationStore();

const operationTypes: OperationType[] = ['播种', '移栽', '施肥', '打药', '灌溉', '排水', '除草', '整枝', '采收'];

const getDefaultForm = (): CreateOperationDto => ({
  operationType: '播种',
  plotId: '',
  varietyId: '',
  operatorName: '',
  operationDate: new Date().toISOString().slice(0, 16),
  weather: '',
  temperature: undefined,
  cropStage: '',
  remark: '',
});

const form = reactive<CreateOperationDto>(props.initialData || getDefaultForm());

const needsVariety = computed(() =>
  ['播种', '移栽', '打药'].includes(form.operationType)
);

watch(() => props.initialData, (val) => {
  if (val) Object.assign(form, val);
});

async function handleSubmit() {
  try {
    const data = { ...form };
    if (props.isEdit && props.initialData) {
      // 编辑模式暂不实现
    } else {
      await store.createOperation(data);
    }
    emit('success');
  } catch {
    // error handled by store
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: white; border-radius: 12px; padding: 2rem; width: 650px;
  max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
h3 { margin: 0 0 1rem; color: #2c3e50; }
.operation-tabs {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.5rem;
}
.tab {
  padding: 6px 14px; border: 1px solid #dcdfe6; border-radius: 20px;
  background: #f5f7fa; cursor: pointer; font-size: 0.85rem; color: #606266;
  transition: all 0.2s;
}
.tab:hover { border-color: #409eff; color: #409eff; }
.tab.active { background: #409eff; color: white; border-color: #409eff; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: 1 / -1; }
label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #606266; }
input, select, textarea {
  padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 0.9rem;
}
.error-msg { color: #f56c6c; margin: 0.5rem 0; font-size: 0.85rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
.btn-primary { background: #409eff; color: white; }
.btn-secondary { background: #f5f7fa; color: #606266; border: 1px solid #dcdfe6; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
