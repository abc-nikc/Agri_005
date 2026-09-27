<template>
  <div class="trace-page">
    <div class="trace-card">
      <header><div class="logo">🌾</div><div><h1>农产品质量追溯</h1><p>农场管家 · 全流程可信记录</p></div></header>
      <div v-if="loading" class="state">正在查询追溯信息...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <template v-else-if="record">
        <div class="verified">✓ 追溯码有效</div>
        <section><h2>产品信息</h2><div class="grid"><div><span>追溯码</span><b>{{ record.traceCode }}</b></div><div><span>生产批次</span><b>{{ record.batchNumber }}</b></div><div><span>品种</span><b>{{ record.varietyName }}</b></div><div><span>地块</span><b>{{ record.plotName }}</b></div><div><span>播种日期</span><b>{{ record.sowDate }}</b></div><div><span>采收日期</span><b>{{ record.harvestDate || '-' }}</b></div></div></section>
        <section><h2>质量检验</h2><div class="quality" :class="record.qualityData?.status === '合格' ? 'passed' : ''"><strong>{{ record.qualityData?.status || '待检' }}</strong><span>{{ record.qualityData?.grade || '未分级' }}</span><span v-if="record.qualityData?.actualYield">实际产量 {{ record.qualityData.actualYield }}kg</span></div><p>{{ record.qualityData?.notes || '暂无检验说明' }}</p></section>
        <section><h2>农事操作</h2><div v-for="(op,index) in record.operationsData || []" :key="index" class="timeline"><i></i><div><b>{{ op.type }}</b><span>{{ fmt(op.date) }} · {{ op.operator }}</span><p>{{ op.detail }}</p></div></div><p v-if="!record.operationsData?.length">暂无记录</p></section>
        <section><h2>投入品记录</h2><table v-if="record.inputsData?.length"><thead><tr><th>类型</th><th>名称</th><th>用量</th><th>日期</th></tr></thead><tbody><tr v-for="(item,index) in record.inputsData" :key="index"><td>{{ item.type }}</td><td>{{ item.name }}</td><td>{{ item.amount }}{{ item.unit }}</td><td>{{ fmt(item.date) }}</td></tr></tbody></table><p v-else>暂无投入品记录</p></section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { traceabilityService } from '@/services/traceability.service';

const route = useRoute();
const loading = ref(true); const error = ref(''); const record = ref<any>(null);
onMounted(async () => { try { record.value = await traceabilityService.scan(String(route.params.code)); } catch (e: any) { error.value = e.response?.status === 404 ? '未找到该追溯码，请核对后重试。' : '追溯信息查询失败，请稍后重试。'; } finally { loading.value = false; } });
function fmt(value: string) { return value ? new Date(value).toLocaleDateString('zh-CN') : '-'; }
</script>

<style scoped>
.trace-page{min-height:100vh;background:linear-gradient(145deg,#ecfdf5,#f8fafc);padding:32px 16px;color:#1f2937}.trace-card{max-width:880px;margin:auto;background:white;border-radius:18px;box-shadow:0 18px 50px rgba(15,23,42,.09);overflow:hidden}header{display:flex;gap:16px;align-items:center;padding:28px;background:linear-gradient(135deg,#047857,#10b981);color:white}.logo{font-size:42px}h1{font-size:25px;margin:0}header p{margin:5px 0 0;opacity:.85}.verified{margin:22px 28px 0;padding:12px 16px;border-radius:10px;background:#ecfdf5;color:#047857;font-weight:700}section{padding:22px 28px;border-bottom:1px solid #edf2f7}h2{font-size:17px;color:#065f46;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.grid div{background:#f8fafc;border-radius:9px;padding:12px}.grid span,.timeline span{display:block;color:#64748b;font-size:12px;margin-bottom:5px}.grid b{font-size:14px;word-break:break-all}.quality{display:flex;gap:12px;align-items:center;background:#fff7ed;padding:13px;border-radius:9px}.quality.passed{background:#ecfdf5;color:#047857}.quality span{font-size:13px}.timeline{display:flex;gap:13px;margin:0 0 14px}.timeline i{width:10px;height:10px;margin-top:5px;border-radius:50%;background:#10b981;flex:none}.timeline p,section>p{color:#64748b;font-size:13px;margin:5px 0}.timeline b{font-size:14px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb}.state{text-align:center;padding:80px 20px;color:#64748b}.state.error{color:#dc2626}@media(max-width:600px){.trace-page{padding:0}.trace-card{border-radius:0;min-height:100vh}section,header{padding:20px}.verified{margin:18px 20px 0}}
</style>
