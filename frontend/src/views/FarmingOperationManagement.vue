<template>
  <div class="farming-ops">
    <div class="page-header">
      <h2>农事操作管理</h2>
      <button class="btn btn-primary" @click="showForm = true">新增操作记录</button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <select v-model="filterType" @change="loadData" class="filter-select">
        <option value="">全部类型</option>
        <option v-for="t in operationTypes" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filterPlotId" @change="loadData" class="filter-select">
        <option value="">全部地块</option>
        <option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }}</option>
      </select>
      <button class="btn btn-sm" @click="clearFilters">清除筛选</button>
      <span class="record-count">共 {{ store.operations.length }} 条记录</span>
    </div>

    <!-- 操作列表 -->
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-else class="table-container">
      <table class="data-table" v-if="store.operations.length > 0">
        <thead>
          <tr>
            <th>操作类型</th>
            <th>地块</th>
            <th>品种</th>
            <th>详情</th>
            <th>操作人</th>
            <th>时间</th>
            <th>标记</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="op in store.operations" :key="op.id">
            <td><span :class="['type-badge', op.operationType]">{{ op.operationType }}</span></td>
            <td>{{ op.plotName || '-' }}</td>
            <td>{{ op.varietyName || '-' }}</td>
            <td class="detail-cell">{{ getDetailText(op) }}</td>
            <td>{{ op.operatorName }}</td>
            <td>{{ formatDate(op.operationDate) }}</td>
            <td>
              <span v-if="op.isSupplemental" class="supp-badge" :title="'原始时间: ' + (op.supplementalOperationDate ? formatDate(op.supplementalOperationDate) : '未知')">补录</span>
              <span v-else>-</span>
            </td>
            <td>
              <button class="btn btn-sm btn-danger" @click="handleDelete(op.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">暂无农事操作记录</div>
    </div>

    <!-- 创建表单弹窗 -->
    <FarmingOperationForm
      v-if="showForm"
      :plots="plots"
      :varieties="varieties"
      @cancel="showForm = false"
      @success="onFormSuccess"
    />

    <div v-if="store.error" class="error-toast" @click="store.clearError()">
      {{ store.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFarmingOperationStore } from '@/stores/farming-operation.store';
import FarmingOperationForm from '@/components/FarmingOperationForm.vue';
import { plotService } from '@/services/plot.service';
import { varietyService } from '@/services/variety.service';

const operationTypes = ['播种', '移栽', '施肥', '打药', '灌溉', '排水', '除草', '整枝', '采收'];
const store = useFarmingOperationStore();
const showForm = ref(false);
const filterType = ref('');
const filterPlotId = ref('');
const plots = ref<any[]>([]);
const varieties = ref<any[]>([]);

onMounted(() => {
  loadPlots();
  loadVarieties();
  loadData();
});

async function loadPlots() {
  try { plots.value = await plotService.getAll(); } catch { /* ignore */ }
}

async function loadVarieties() {
  try { varieties.value = await varietyService.getVarieties(); } catch { /* ignore */ }
}

async function loadData() {
  const params: any = {};
  if (filterType.value) params.operationType = filterType.value;
  if (filterPlotId.value) params.plotId = filterPlotId.value;
  await store.fetchOperations(params);
}

function clearFilters() {
  filterType.value = '';
  filterPlotId.value = '';
  loadData();
}

function onFormSuccess() {
  showForm.value = false;
  store.clearError();
  loadData();
}

async function handleDelete(id: string) {
  if (!confirm('确定删除该操作记录？')) return;
  try { await store.deleteOperation(id); } catch { /* handled by store */ }
}

function getDetailText(op: any): string {
  const parts: string[] = [];
  if (op.fertilizerName) parts.push(`${op.fertilizerName} ${op.fertilizerAmount}${op.fertilizerUnit || 'kg'}`);
  if (op.pesticideName) parts.push(`${op.pesticideName} ${op.pesticideAmount}${op.pesticideUnit || 'ml'}`);
  if (op.waterAmount) parts.push(`${op.waterAmount}${op.waterUnit || 'm³'}`);
  if (op.waterDuration) parts.push(`${op.waterDuration}分钟`);
  if (op.workDescription) parts.push(op.workDescription);
  if (op.harvestYield) parts.push(`${op.harvestYield}kg ${op.qualityGrade || ''} → ${op.harvestDestination || ''}`);
  if (op.area) parts.push(`${op.area}亩`);
  return parts.join(' | ') || '-';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}
</script>

<style scoped>
.farming-ops { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.page-header h2 { margin: 0; color: #2c3e50; }
.filter-bar { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-select { padding: 6px 12px; border: 1px solid #dcdfe6; border-radius: 6px; }
.record-count { color: #909399; font-size: 0.85rem; margin-left: auto; }
.table-container { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f5f7fa; padding: 12px; text-align: left; font-size: 0.85rem; color: #606266; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #ebeef5; font-size: 0.9rem; }
.detail-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type-badge { padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
.type-badge.播种, .type-badge.移栽 { background: #e1f5fe; color: #1a1a1a; }
.type-badge.施肥 { background: #fff3e0; color: #1a1a1a; }
.type-badge.打药 { background: #fce4ec; color: #1a1a1a; }
.type-badge.灌溉, .type-badge.排水 { background: #e8f5e9; color: #1a1a1a; }
.type-badge.除草, .type-badge.整枝 { background: #f3e5f5; color: #1a1a1a; }
.type-badge.采收 { background: #fffde7; color: #1a1a1a; }
.loading, .empty-state { text-align: center; padding: 3rem; color: #909399; }
.error-toast {
  position: fixed; bottom: 1rem; right: 1rem; background: #f56c6c; color: white;
  padding: 12px 24px; border-radius: 6px; cursor: pointer; z-index: 2000;
}
.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary { background: #409eff; color: white; }
.btn-sm { padding: 4px 12px; font-size: 0.8rem; }
.btn-danger { background: #f56c6c; color: white; }
.supp-badge { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 0.7rem; background: #fff3cd; color: #856404; cursor: help; }
</style>
