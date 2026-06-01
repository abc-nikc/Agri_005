<template>
  <div class="container">
    <div class="page-header"><h2>质量追溯管理</h2></div>

    <div class="tabs">
      <button :class="['tab',{active:tab==='list'}]" @click="tab='list';loadList()">追溯记录</button>
      <button :class="['tab',{active:tab==='gen'}]" @click="tab='gen';loadBatches()">生成追溯码</button>
    </div>

    <!-- 追溯记录列表 -->
    <div v-if="tab==='list'" class="table-wrap">
      <table class="data-table" v-if="records.length">
        <thead><tr><th>追溯码</th><th>批次号</th><th>地块</th><th>品种</th><th>播种</th><th>采收</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="r in records" :key="r.id">
            <td><code>{{ r.traceCode }}</code></td><td>{{ r.batchNumber }}</td><td>{{ r.plotName }}</td><td>{{ r.varietyName }}</td>
            <td>{{ r.sowDate }}</td><td>{{ r.harvestDate || '-' }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="viewDetail(r)">详情</button>
              <button class="btn btn-sm btn-success" @click="doExport(r.traceCode)">导出</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无追溯记录</div>
    </div>

    <!-- 生成追溯码 -->
    <div v-if="tab==='gen'">
      <div class="gen-panel" v-if="batches.length">
        <p>选择已完成的批次生成追溯码：</p>
        <div class="batch-list">
          <div v-for="b in batches" :key="b.id" class="batch-item" v-if="!b.traceabilityCode">
            <div>
              <strong>{{ b.batchNumber }}</strong>
              <span class="info">{{ b.plotName }} | {{ b.varietyName }} | {{ b.area }}亩 | {{ b.sowDate }}~{{ b.estimatedHarvestDate }}</span>
            </div>
            <button class="btn btn-sm btn-primary" @click="doGenerate(b.id)" :disabled="loading">{{ loading?'生成中...':'生成追溯码' }}</button>
          </div>
        </div>
        <div v-if="batches.every(b=>b.traceabilityCode)" class="empty">所有批次已生成追溯码</div>
      </div>
      <div v-else class="empty">暂无已完成的批次</div>
    </div>

    <!-- 追溯详情弹窗 -->
    <div class="overlay" v-if="detail" @click.self="detail=null">
      <div class="modal detail-modal">
        <h3>追溯详情 - {{ detail.traceCode }}</h3>
        <div class="qr-section" v-if="detail.qrCodeUrl">
          <img :src="detail.qrCodeUrl" alt="QR" class="qr-img" />
          <p class="qr-hint">扫描二维码查看追溯信息</p>
        </div>
        <h4>基本信息</h4>
        <table class="info-table"><tr><th>追溯码</th><td>{{ detail.traceCode }}</td><th>批次号</th><td>{{ detail.batchNumber }}</td></tr>
          <tr><th>地块</th><td>{{ detail.plotName }}</td><th>品种</th><td>{{ detail.varietyName }}</td></tr>
          <tr><th>面积</th><td>{{ detail.area }}亩</td><th>播种</th><td>{{ detail.sowDate }}</td></tr></table>
        <h4>农事操作 ({{ detail.operationsData?.length || 0 }}条)</h4>
        <table class="data-table" v-if="detail.operationsData?.length"><thead><tr><th>类型</th><th>日期</th><th>操作人</th><th>详情</th></tr></thead>
          <tbody><tr v-for="o in detail.operationsData" :key="o.type+o.date"><td>{{ o.type }}</td><td>{{ fmt(o.date) }}</td><td>{{ o.operator }}</td><td>{{ o.detail }}</td></tr></tbody></table>
        <div v-else class="empty">无记录</div>
        <h4>投入品 ({{ detail.inputsData?.length || 0 }}条)</h4>
        <table class="data-table" v-if="detail.inputsData?.length"><thead><tr><th>类型</th><th>名称</th><th>用量</th><th>日期</th></tr></thead>
          <tbody><tr v-for="i in detail.inputsData" :key="i.name+i.date"><td>{{ i.type }}</td><td>{{ i.name }}</td><td>{{ i.amount }}{{ i.unit }}</td><td>{{ fmt(i.date) }}</td></tr></tbody></table>
        <div v-else class="empty">无记录</div>
        <button class="btn btn-secondary" @click="detail=null">关闭</button>
      </div>
    </div>

    <div v-if="error" class="err-toast" @click="error=''">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { TraceabilityRecord } from '@/types/traceability';
import { traceabilityService } from '@/services/traceability.service';
import { productionBatchService } from '@/services/production-batch.service';

const tab = ref('list');
const records = ref<TraceabilityRecord[]>([]);
const batches = ref<any[]>([]);
const detail = ref<TraceabilityRecord | null>(null);
const loading = ref(false);
const error = ref('');

onMounted(() => loadList());

async function loadList() { try { records.value = await traceabilityService.list(); } catch (e: any) { error.value = e.response?.data?.error; } }
async function loadBatches() { try { batches.value = await productionBatchService.getAll({ status: '已完成' }); } catch {} }

async function doGenerate(batchId: string) {
  loading.value = true;
  try { await traceabilityService.generate(batchId); await loadBatches(); await loadList(); tab.value = 'list'; } catch (e: any) { error.value = e.response?.data?.error; }
  finally { loading.value = false; }
}

async function doExport(code: string) {
  try {
    const html = await traceabilityService.exportReport(code);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (e: any) { error.value = e.response?.data?.error; }
}

function viewDetail(r: TraceabilityRecord) { detail.value = r; }
function fmt(d: string) { return new Date(d).toLocaleDateString('zh-CN'); }
</script>

<style scoped>
.container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: 1.5rem; }
.page-header h2 { margin: 0; color: #2c3e50; }
.tabs { display: flex; margin-bottom: 1rem; }
.tab { padding: 8px 24px; border: 1px solid #dcdfe6; background: #f5f7fa; cursor: pointer; color: #1a1a1a; }
.tab:first-child { border-radius: 6px 0 0 6px; }
.tab:last-child { border-radius: 0 6px 6px 0; }
.tab.active { background: #409eff; color: white; border-color: #409eff; }
.table-wrap { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
.data-table, .info-table { width: 100%; border-collapse: collapse; }
.data-table th, .info-table th { background: #f5f7fa; padding: 8px; text-align: left; font-size: 0.85rem; }
.data-table td, .info-table td { padding: 8px; border-bottom: 1px solid #ebeef5; font-size: 0.85rem; }
.gen-panel { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.batch-list { margin-top: 1rem; }
.batch-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 0.5rem; }
.info { color: #909399; font-size: 0.85rem; margin-left: 1rem; }
.qr-section { text-align: center; margin: 1rem 0; }
.qr-img { width: 200px; height: 200px; }
.qr-hint { color: #909399; font-size: 0.85rem; }
.empty { text-align: center; padding: 2rem; color: #909399; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; padding: 2rem; width: 800px; max-height: 90vh; overflow-y: auto; }
.modal h3, .modal h4 { color: #2c3e50; margin: 1rem 0 0.5rem; }
.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary { background: #409eff; color: white; }
.btn-secondary { background: #f5f7fa; color: #606266; border: 1px solid #dcdfe6; }
.btn-success { background: #67c23a; color: white; }
.btn-sm { padding: 4px 12px; font-size: 0.8rem; }
.err-toast { position: fixed; bottom: 1rem; right: 1rem; background: #f56c6c; color: white; padding: 12px 24px; border-radius: 6px; cursor: pointer; z-index: 2000; }
</style>
