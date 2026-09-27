<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><Aim /></el-icon> 农事操作管理</h2>
        <span class="header-count">共 {{ store.operations.length }} 条记录</span>
      </div>
      <el-button type="primary" @click="showForm = true" :icon="Plus">新增操作记录</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="全部类型" clearable @change="loadData" style="width:130px">
        <el-option v-for="t in operationTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filterPlotId" placeholder="全部地块" clearable @change="loadData" style="width:150px">
        <el-option v-for="p in plots" :key="p.id" :label="p.plotNumber" :value="p.id" />
      </el-select>
      <el-button @click="clearFilters" size="small">清除筛选</el-button>
    </div>

    <div class="content-card">
      <div v-if="store.loading" class="loading-state"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
      <div v-else-if="store.operations.length === 0" class="empty-state"><el-empty description="暂无农事操作记录" :image-size="80" /></div>
      <el-table v-else :data="store.operations" stripe row-key="id">
        <el-table-column label="操作类型" width="90">
          <template #default="{row}"><el-tag :type="opTagType(row.operationType)" size="small" effect="plain">{{ row.operationType }}</el-tag></template>
        </el-table-column>
        <el-table-column label="地块" width="100"><template #default="{row}">{{ row.plotName || '-' }}</template></el-table-column>
        <el-table-column label="品种" width="100"><template #default="{row}">{{ row.varietyName || '-' }}</template></el-table-column>
        <el-table-column label="详情" min-width="220"><template #default="{row}"><span class="detail-text">{{ getDetailText(row) }}</span></template></el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column label="时间" width="140"><template #default="{row}">{{ formatDate(row.operationDate) }}</template></el-table-column>
        <el-table-column label="标记" width="80">
          <template #default="{row}"><el-tag v-if="row.isSupplemental" type="warning" size="small" effect="dark">补录</el-tag><span v-else>-</span></template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{row}"><el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <FarmingOperationForm v-if="showForm" :plots="plots" :varieties="varieties" @cancel="showForm = false" @success="onFormSuccess" />
    <div v-if="store.error" class="error-toast" @click="store.clearError()">{{ store.error }} <el-icon><Close /></el-icon></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { useFarmingOperationStore } from '@/stores/farming-operation.store';
import FarmingOperationForm from '@/components/FarmingOperationForm.vue';
import { plotService } from '@/services/plot.service';
import { varietyService } from '@/services/variety.service';

const operationTypes = ['播种','移栽','施肥','打药','灌溉','排水','除草','整枝','采收'];
const store = useFarmingOperationStore();
const showForm = ref(false); const filterType = ref(''); const filterPlotId = ref('');
const plots = ref<any[]>([]); const varieties = ref<any[]>([]);

onMounted(() => { loadPlots(); loadVarieties(); loadData(); });
async function loadPlots() { try { plots.value = await plotService.getAll(); } catch {} }
async function loadVarieties() { try { varieties.value = await varietyService.getVarieties(); } catch {} }
async function loadData() { const params: any = {}; if (filterType.value) params.operationType = filterType.value; if (filterPlotId.value) params.plotId = filterPlotId.value; await store.fetchOperations(params); }
function clearFilters() { filterType.value = ''; filterPlotId.value = ''; loadData(); }
function onFormSuccess() { showForm.value = false; store.clearError(); loadData(); }
async function handleDelete(id: string) { if (!confirm('确定删除该操作记录？')) return; const op = store.operations.find(o => o.id === id); const backup = op ? { ...op } : null; try { await store.deleteOperation(id); const addUndo = (window as any).__addUndo; if (addUndo && backup) addUndo(id, '删除农事操作「' + (backup.operationType || '') + '」', async () => { await store.createOperation(backup); }); } catch {} }

function opTagType(t: string) { const m: Record<string,string> = {播种:'',移栽:'',施肥:'warning',打药:'danger',灌溉:'success',排水:'info',除草:'',整枝:'',采收:'success'}; return m[t] || ''; }
function getDetailText(op: any): string {
  const parts: string[] = [];
  if (op.fertilizerName) parts.push(`${op.fertilizerName} ${op.fertilizerAmount}${op.fertilizerUnit||'kg'}`);
  if (op.pesticideName) parts.push(`${op.pesticideName} ${op.pesticideAmount}${op.pesticideUnit||'ml'}`);
  if (op.waterAmount) parts.push(`${op.waterAmount}${op.waterUnit||'m³'}`);
  if (op.waterDuration) parts.push(`${op.waterDuration}分钟`);
  if (op.workDescription) parts.push(op.workDescription);
  if (op.harvestYield) parts.push(`${op.harvestYield}kg ${op.qualityGrade||''} → ${op.harvestDestination||''}`);
  if (op.area) parts.push(`${op.area}亩`);
  return parts.join(' | ') || '-';
}
function formatDate(dateStr: string): string { return new Date(dateStr).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }); }
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-left { display: flex; align-items: center; gap: var(--space-md); }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-count { font-size: var(--text-sm); color: var(--color-text-muted); background: var(--color-bg-alt); padding: 3px 12px; border-radius: var(--radius-full); }
.filter-bar { display: flex; gap: var(--space-sm); align-items: center; margin-bottom: var(--space-lg); flex-wrap: wrap; }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.detail-text { max-width: 280px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-xs); color: var(--color-text-secondary); }
.error-toast { position: fixed; bottom: 20px; right: 20px; background: var(--color-danger); color: white; padding: 12px 20px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; cursor: pointer; z-index: 2000; font-size: var(--text-sm); box-shadow: var(--shadow-lg); }
</style>
