<template>
  <div class="page-container animate-fade-in">
    <div class="page-header"><h2><el-icon><Search /></el-icon> 质量追溯管理</h2></div>

    <div class="tabs-bar">
      <el-radio-group v-model="tab" size="default">
        <el-radio-button value="list" @change="loadList()">追溯记录</el-radio-button>
        <el-radio-button value="gen" @change="loadBatches()">生成追溯码</el-radio-button>
      </el-radio-group>
    </div>

    <div class="content-card">
      <div v-if="tab==='list'">
        <div v-if="records.length === 0" class="empty-state"><el-empty description="暂无追溯记录" :image-size="80" /></div>
        <el-table v-else :data="records" stripe row-key="id">
          <el-table-column label="追溯码" width="160"><template #default="{row}"><code>{{ row.traceCode }}</code></template></el-table-column>
          <el-table-column prop="batchNumber" label="批次号" width="140" />
          <el-table-column prop="plotName" label="地块" width="100" />
          <el-table-column prop="varietyName" label="品种" width="100" />
          <el-table-column prop="sowDate" label="播种" width="120" />
          <el-table-column label="采收" width="120"><template #default="{row}">{{ row.harvestDate || '-' }}</template></el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{row}">
              <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
              <el-button type="success" link size="small" @click="doExport(row.traceCode)">导出</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="tab==='gen'">
        <div v-if="batches.length === 0" class="empty-state"><el-empty description="暂无已完成的批次" :image-size="80" /></div>
        <div v-else class="gen-panel">
          <p class="gen-hint">选择已完成的批次生成追溯码：</p>
          <div class="batch-list">
            <div v-for="b in batches" :key="b.id" class="batch-item" v-if="!b.traceabilityCode">
              <div><strong>{{ b.batchNumber }}</strong><span class="info">{{ b.plotName }} | {{ b.varietyName }} | {{ b.area }}亩 | {{ b.sowDate }}~{{ b.estimatedHarvestDate }}</span></div>
              <el-button type="primary" size="small" @click="doGenerate(b.id)" :loading="loading">生成追溯码</el-button>
            </div>
          </div>
          <div v-if="batches.every((b:any)=>b.traceabilityCode)" class="empty-state"><el-empty description="所有批次已生成追溯码" :image-size="80" /></div>
        </div>
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="追溯详情" width="800px" top="5vh">
      <template v-if="detail">
        <div class="qr-section" v-if="detail.qrCodeUrl"><img :src="detail.qrCodeUrl" alt="QR" class="qr-img" /><p class="qr-hint">扫描二维码查看追溯信息</p></div>
        <h4 class="section-title">基本信息</h4>
        <table class="info-table"><tr><th>追溯码</th><td>{{ detail.traceCode }}</td><th>批次号</th><td>{{ detail.batchNumber }}</td></tr><tr><th>地块</th><td>{{ detail.plotName }}</td><th>品种</th><td>{{ detail.varietyName }}</td></tr><tr><th>面积</th><td>{{ detail.area }}亩</td><th>播种</th><td>{{ detail.sowDate }}</td></tr></table>
        <h4 class="section-title">农事操作 ({{ detail.operationsData?.length || 0 }}条)</h4>
        <el-table v-if="detail.operationsData?.length" :data="detail.operationsData" size="small"><el-table-column prop="type" label="类型" width="80" /><el-table-column label="日期" width="120"><template #default="{row}">{{ fmt(row.date) }}</template></el-table-column><el-table-column prop="operator" label="操作人" width="100" /><el-table-column prop="detail" label="详情" /></el-table>
        <div v-else class="empty-state">无记录</div>
        <h4 class="section-title">投入品 ({{ detail.inputsData?.length || 0 }}条)</h4>
        <el-table v-if="detail.inputsData?.length" :data="detail.inputsData" size="small"><el-table-column prop="type" label="类型" width="80" /><el-table-column prop="name" label="名称" width="120" /><el-table-column label="用量" width="100"><template #default="{row}">{{ row.amount }}{{ row.unit }}</template></el-table-column><el-table-column label="日期" width="120"><template #default="{row}">{{ fmt(row.date) }}</template></el-table-column></el-table>
        <div v-else class="empty-state">无记录</div>
      </template>
    </el-dialog>

    <div v-if="error" class="error-toast" @click="error=''">{{ error }} <el-icon><Close /></el-icon></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { TraceabilityRecord } from '@/types/traceability';
import { traceabilityService } from '@/services/traceability.service';
import { productionBatchService } from '@/services/production-batch.service';

const tab = ref('list'); const records = ref<TraceabilityRecord[]>([]); const batches = ref<any[]>([]);
const detail = ref<TraceabilityRecord | null>(null); const detailVisible = ref(false);
const loading = ref(false); const error = ref('');

onMounted(() => loadList());
async function loadList() { try { records.value = await traceabilityService.list(); } catch (e: any) { error.value = e.response?.data?.error; } }
async function loadBatches() { try { batches.value = await productionBatchService.getAll({ status: '已完成' }); } catch {} }
async function doGenerate(batchId: string) { loading.value = true; try { await traceabilityService.generate(batchId); await loadBatches(); await loadList(); tab.value = 'list'; } catch (e: any) { error.value = e.response?.data?.error; } finally { loading.value = false; } }
async function doExport(code: string) { try { const html = await traceabilityService.exportReport(code); const blob = new Blob([html], { type: 'text/html' }); window.open(URL.createObjectURL(blob), '_blank'); } catch (e: any) { error.value = e.response?.data?.error; } }
function viewDetail(r: TraceabilityRecord) { detail.value = r; detailVisible.value = true; }
function fmt(d: string) { return new Date(d).toLocaleDateString('zh-CN'); }
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: var(--space-lg); }
.page-header h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.tabs-bar { margin-bottom: var(--space-lg); }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; padding: 1px; }
.empty-state { text-align: center; padding: 40px 20px; }
.gen-panel { padding: var(--space-lg); }
.gen-hint { color: var(--color-text-muted); margin-bottom: 1rem; font-size: var(--text-sm); }
.batch-list { display: flex; flex-direction: column; gap: 8px; }
.batch-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--color-bg-alt); border-radius: var(--radius-sm); border: 1px solid var(--color-border-light); }
.info { color: var(--color-text-muted); font-size: var(--text-xs); margin-left: 12px; }
.qr-section { text-align: center; margin: 1rem 0; }
.qr-img { width: 180px; height: 180px; }
.qr-hint { color: var(--color-text-muted); font-size: var(--text-xs); margin-top: 8px; }
.section-title { color: var(--color-text); margin: 1rem 0 0.5rem; font-size: var(--text-base); }
.info-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
.info-table th, .info-table td { padding: 8px 12px; border: 1px solid var(--color-border-light); font-size: var(--text-sm); }
.info-table th { background: var(--color-bg-alt); color: var(--color-text-secondary); width: 70px; }
.error-toast { position: fixed; bottom: 20px; right: 20px; background: var(--color-danger); color: white; padding: 12px 20px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; cursor: pointer; z-index: 2000; font-size: var(--text-sm); box-shadow: var(--shadow-lg); }
</style>
