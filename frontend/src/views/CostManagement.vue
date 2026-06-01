<template>
  <div class="ct">
    <div class="ph"><h2>成本核算与产量预估</h2>
      <div class="btns">
        <button class="btn btn-primary" @click="mode='cost';showForm=true">记成本</button>
        <button class="btn btn-success" @click="mode='sale';showForm=true">记销售</button>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in ['cost','sale','profit','yield','compare','report']" :key="t" :class="['tab',{active:tab===t}]" @click="tab=t;onTab(t)">{{ {cost:'成本记录',sale:'销售记录',profit:'利润分析',yield:'产量预估',compare:'批次对比',report:'综合报表'}[t] }}</button>
    </div>

    <!-- 成本记录 -->
    <div v-if="tab==='cost'" class="tw">
      <table v-if="costs.length"><thead><tr><th>日期</th><th>类型</th><th>描述</th><th>金额</th><th>关联</th></tr></thead>
        <tbody><tr v-for="c in costs" :key="c.id"><td>{{ c.date }}</td><td>{{ c.type }}</td><td>{{ c.description }}</td><td class="num">¥{{ c.amount }}</td><td>{{ c.batchId||c.plotId||'-' }}</td></tr></tbody></table>
      <div v-else class="em">暂无成本记录</div>
    </div>

    <!-- 销售记录 -->
    <div v-if="tab==='sale'" class="tw">
      <table v-if="sales.length"><thead><tr><th>日期</th><th>客户</th><th>品种</th><th>数量</th><th>单价</th><th>金额</th><th>收款</th></tr></thead>
        <tbody><tr v-for="s in sales" :key="s.id"><td>{{ s.saleDate }}</td><td>{{ s.customer }}</td><td>{{ s.varietyName }}</td><td>{{ s.quantity }}{{ s.unit }}</td><td>¥{{ s.unitPrice }}</td><td class="num">¥{{ s.totalAmount }}</td><td :class="s.paymentStatus==='已付款'?'g':s.paymentStatus==='部分付款'?'y':'r'">{{ s.paymentStatus }}</td></tr></tbody></table>
      <div v-else class="em">暂无销售记录</div>
    </div>

    <!-- 利润分析 (FR-036) -->
    <div v-if="tab==='profit'" class="tw">
      <div class="filter">
        <select v-model="pf.batchId" @change="loadProfit"><option value="">全部批次</option><option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batchNumber }}</option></select>
        <select v-model="pf.variety" @change="loadProfit" style="margin-left:8px"><option value="">全部品种</option><option v-for="v in varieties" :key="v.id" :value="v.name">{{ v.name }}</option></select>
        <select v-model="pf.plotId" @change="loadProfit" style="margin-left:8px"><option value="">全部地块</option><option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }} ({{ p.region }})</option></select>
      </div>
      <div v-if="profit" class="cards">
        <div class="card"><span>总成本</span><b class="r">¥{{ profit.totalCost }}</b></div>
        <div class="card"><span>总收入</span><b class="g">¥{{ profit.totalRevenue }}</b></div>
        <div class="card"><span>利润</span><b :class="profit.profit>=0?'g':'r'">¥{{ profit.profit }}</b></div>
        <div class="card"><span>利润率</span><b>{{ profit.profitMargin.toFixed(1) }}%</b></div>
        <div class="card"><span>已收款</span><b>¥{{ profit.paidRevenue }}</b></div>
        <div class="card"><span>待收款</span><b class="y">¥{{ profit.unpaidRevenue }}</b></div>
      </div>
      <div v-if="profit?.costBreakdown?.length" class="mt"><h4>成本构成</h4>
        <div class="bar"><div v-for="b in profit.costBreakdown" :key="b.type" class="seg" :style="{width:(b.amount/profit.totalCost*100)+'%',background:{种子:'#4caf50',肥料:'#ff9800',农药:'#f44336',人工:'#2196f3',机械:'#9c27b0',其他:'#607d8b'}[b.type]||'#999'}">{{ b.type }} ¥{{ b.amount }}</div></div>
      </div>
    </div>

    <!-- 综合报表 (FR-039) -->
    <div v-if="tab==='report'" class="tw">
      <div v-if="report" class="report-content">
        <!-- 总览 -->
        <h3>📊 综合经营报表</h3>
        <div class="cards">
          <div class="card"><span>总成本</span><b class="r">¥{{ report.overview.totalCost }}</b></div>
          <div class="card"><span>总收入</span><b class="g">¥{{ report.overview.totalRevenue }}</b></div>
          <div class="card"><span>总利润</span><b :class="report.overview.totalProfit>=0?'g':'r'">¥{{ report.overview.totalProfit }}</b></div>
          <div class="card"><span>利润率</span><b>{{ report.overview.profitMargin.toFixed(1) }}%</b></div>
        </div>

        <!-- 按地块 -->
        <h4>📋 地块成本核算表</h4>
        <table v-if="report.byPlot.length">
          <thead><tr><th>地块</th><th>面积(亩)</th><th>成本</th><th>收入</th><th>利润</th><th>亩均利润</th></tr></thead>
          <tbody>
            <tr v-for="p in report.byPlot" :key="p.plotNumber">
              <td>{{ p.plotNumber }}</td><td>{{ p.area }}</td>
              <td class="num">¥{{ p.cost }}</td><td class="num">¥{{ p.revenue }}</td>
              <td class="num" :class="p.profit>=0?'g':'r'">¥{{ p.profit }}</td>
              <td class="num">¥{{ p.area>0 ? Math.round(p.profit/p.area) : 0 }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 按品种 -->
        <h4>🌾 品种利润分析表</h4>
        <table v-if="report.byVariety.length">
          <thead><tr><th>品种</th><th>成本</th><th>收入</th><th>利润</th><th>批次数</th><th>批均利润</th></tr></thead>
          <tbody>
            <tr v-for="v in report.byVariety" :key="v.varietyName">
              <td>{{ v.varietyName }}</td>
              <td class="num">¥{{ v.cost }}</td><td class="num">¥{{ v.revenue }}</td>
              <td class="num" :class="v.profit>=0?'g':'r'">¥{{ v.profit }}</td>
              <td>{{ v.batchCount }}</td>
              <td class="num">¥{{ v.batchCount>0 ? Math.round(v.profit/v.batchCount) : 0 }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 成本构成图 -->
        <h4>💰 成本构成比例</h4>
        <div class="bar" style="height:36px;margin-top:0.5rem" v-if="report.costBreakdown.length">
          <div v-for="b in report.costBreakdown" :key="b.type" class="seg" :style="{width:(b.amount/report.overview.totalCost*100)+'%',background:{种子:'#4caf50',肥料:'#ff9800',农药:'#f44336',人工:'#2196f3',机械:'#9c27b0',其他:'#607d8b'}[b.type]||'#999'}">{{ b.type }} ¥{{ b.amount }}</div>
        </div>
      </div>
      <div v-else class="em">加载报表中...</div>
    </div>

    <!-- 产量预估 -->
    <div v-if="tab==='yield'" class="tw">
      <div class="filter"><select v-model="ypVar" @change="loadYield"><option value="">选择品种</option><option v-for="v in varieties" :key="v.id" :value="v.name">{{ v.name }}</option></select></div>
      <div v-if="yieldData" class="cards">
        <div class="card"><span>历史批次</span><b>{{ yieldData.historicalBatches }}</b></div>
        <div class="card"><span>平均亩产</span><b class="g">{{ yieldData.avgYieldPerMu }} kg</b></div>
        <div class="card"><span>置信度</span><b>{{ yieldData.confidence }}</b></div>
      </div>
      <div v-if="yieldData?.prediction" class="pred">{{ yieldData.prediction }}</div>
    </div>

    <!-- 批次对比 (FR-038) -->
    <div v-if="tab==='compare'" class="tw">
      <div class="filter"><select v-model="bcVar" @change="loadCompare"><option value="">选择品种</option><option v-for="v in varieties" :key="v.id" :value="v.name">{{ v.name }}</option></select></div>
      <div v-if="compareData?.best" class="best-batch">🏆 最佳批次：<strong>{{ compareData.best.batchNumber }}</strong> — 亩产 {{ compareData.best.yieldPerMu }}kg，每公斤成本 ¥{{ compareData.best.efficiency }}，共 {{ compareData.count }} 个批次</div>
      <table v-if="compareData?.items?.length"><thead><tr><th>排名</th><th>批次号</th><th>播种</th><th>面积</th><th>亩产(kg)</th><th>总成本</th><th>¥/kg</th><th>肥料</th><th>农药</th><th>人工</th></tr></thead>
        <tbody>
          <tr v-for="(c,i) in sortedCompare" :key="c.batchNumber" :class="{best:c.isBest}">
            <td class="rank">{{ i+1 }}</td>
            <td>{{ c.batchNumber }} <span v-if="c.isBest" class="best-tag">最优</span></td>
            <td>{{ c.sowDate }}</td>
            <td>{{ c.area }}亩</td>
            <td class="num">{{ c.yieldPerMu }}</td>
            <td class="num">¥{{ c.totalCost }}</td>
            <td class="num" :class="c.isBest?'g':''">¥{{ c.efficiency }}</td>
            <td>¥{{ c.fertilizerCost }}</td>
            <td>¥{{ c.pesticideCost }}</td>
            <td>¥{{ c.laborCost }}</td>
          </tr>
        </tbody></table>
      <div v-else class="em">请选择品种</div>
    </div>

    <!-- 弹窗 -->
    <div class="ov" v-if="showForm" @click.self="closeForm">
      <div class="md"><h3>{{ mode==='cost'?'记录成本':'记录销售' }}</h3>
        <form @submit.prevent="submitForm">
          <div v-if="mode==='cost'">
            <div class="fg"><label>类型</label><select v-model="f.type"><option value="种子">种子</option><option value="肥料">肥料</option><option value="农药">农药</option><option value="人工">人工</option><option value="机械">机械</option><option value="其他">其他</option></select></div>
            <div class="fg"><label>描述*</label><input v-model="f.description" required /></div>
            <div class="fg"><label>金额*</label><input v-model.number="f.amount" type="number" required /></div>
            <div class="fg"><label>日期</label><input v-model="f.date" type="date" /></div>
            <div class="fg"><label>关联批次</label><select v-model="f.batchId"><option value="">不关联</option><option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batchNumber }}</option></select></div>
          </div>
          <div v-if="mode==='sale'">
            <div class="fg"><label>客户*</label><input v-model="f.customer" required /></div>
            <div class="fg"><label>品种*</label><select v-model="f.varietyName" required><option value="">选择</option><option v-for="v in varieties" :key="v.id" :value="v.name">{{ v.name }}</option></select></div>
            <div class="fg"><label>数量*</label><input v-model.number="f.quantity" type="number" required /></div>
            <div class="fg"><label>单价*</label><input v-model.number="f.unitPrice" type="number" required /></div>
            <div class="fg"><label>日期</label><input v-model="f.saleDate" type="date" /></div>
            <div class="fg"><label>收款状态</label><select v-model="f.paymentStatus"><option value="已付款">已付款</option><option value="未付款">未付款</option><option value="部分付款">部分付款</option></select></div>
            <div class="fg"><label>销售员*</label><input v-model="f.salesperson" required /></div>
          </div>
          <div class="form-actions"><button type="button" class="btn btn-secondary" @click="closeForm">取消</button><button type="submit" class="btn btn-primary">保存</button></div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { costService } from '@/services/cost.service';
import type { CostRecord, SalesRecord, ProfitAnalysis, YieldPrediction, BatchCompareResult, SummaryReport } from '@/types/cost';

const tab = ref('cost');
const showForm = ref(false);
const mode = ref<'cost'|'sale'>('cost');
const costs = ref<CostRecord[]>([]);
const sales = ref<SalesRecord[]>([]);
const profit = ref<ProfitAnalysis | null>(null);
const yieldData = ref<YieldPrediction | null>(null);
const compareData = ref<BatchCompareResult | null>(null);
const report = ref<SummaryReport | null>(null);
const batches = ref<any[]>([]);
const varieties = ref<any[]>([]);
const plots = ref<any[]>([]);
const pf = reactive({ batchId: '', variety: '', plotId: '' });
const ypVar = ref('');
const bcVar = ref('');
const f = reactive<Record<string,any>>({ type:'种子',description:'',amount:0,date:new Date().toISOString().slice(0,10),batchId:'',customer:'',varietyName:'',quantity:0,unitPrice:0,unit:'kg',saleDate:new Date().toISOString().slice(0,10),paymentStatus:'已付款',salesperson:'' });

onMounted(()=>{loadCosts();loadSales();loadRefs();});

async function loadRefs() {
  try { const r = await (await import('@/services/production-batch.service')).productionBatchService.getAll(); batches.value = r; } catch {}
  try { const r = await (await import('@/services/variety.service')).varietyService.getVarieties(); varieties.value = r; } catch {}
  try { const r = await (await import('@/services/plot.service')).plotService.getAll(); plots.value = r; } catch {}
}

function onTab(t: string) {
  if (t==='cost') loadCosts();
  else if (t==='sale') loadSales();
  else if (t==='profit') loadProfit();
  else if (t==='yield' && ypVar.value) loadYield();
  else if (t==='compare' && bcVar.value) loadCompare();
  else if (t==='report') loadReport();
}

async function loadCosts() { try { costs.value = await costService.getCosts(); } catch {} }
async function loadSales() { try { sales.value = await costService.getSales(); } catch {} }
async function loadProfit() {
  try {
    const params: any = {};
    if (pf.batchId) params.batchId = pf.batchId;
    if (pf.variety) params.variety = pf.variety;
    if (pf.plotId) params.plotId = pf.plotId;
    profit.value = await costService.profitAnalysis(params);
  } catch {}
}
async function loadYield() { if (!ypVar.value) return; try { yieldData.value = await costService.yieldPredict(ypVar.value); } catch {} }
async function loadCompare() { if (!bcVar.value) return; try { compareData.value = await costService.batchCompare(bcVar.value); } catch {} }
async function loadReport() { try { report.value = await costService.generateReport(); } catch {} }

// 按效率排序（每公斤成本越低越好）
const sortedCompare = computed(() => {
  if (!compareData.value?.items) return [];
  return [...compareData.value.items].sort((a, b) => a.efficiency - b.efficiency);
});

function closeForm() { showForm.value = false; }
async function submitForm() {
  try {
    if (mode.value==='cost') { await costService.addCost({type:f.type,description:f.description,amount:f.amount,date:f.date,batchId:f.batchId||undefined}); loadCosts(); }
    else { f.product = f.varietyName; f.totalAmount = f.quantity * f.unitPrice; f.unit = 'kg'; await costService.addSale(f as any); loadSales(); }
    closeForm();
  } catch {}
}
</script>

<style scoped>
.ct { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.ph h2 { margin: 0; }
.btns { display: flex; gap: 0.5rem; }
.tabs { display: flex; margin-bottom: 1rem; gap: 0; }
.tab { padding: 8px 16px; border: 1px solid #dcdfe6; background: #f5f7fa; cursor: pointer; font-size: 0.85rem; color: #1a1a1a; }
.tab:first-child { border-radius: 6px 0 0 6px; }
.tab:last-child { border-radius: 0 6px 6px 0; }
.tab.active { background: #409eff; color: white; }
.tw { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; padding: 1rem; }
table { width: 100%; border-collapse: collapse; }
th { background: #f5f7fa; padding: 8px; text-align: left; font-size: 0.85rem; }
td { padding: 8px; border-bottom: 1px solid #ebeef5; font-size: 0.85rem; }
.num { font-weight: 600; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin: 1rem 0; }
.card { background: #f5f7fa; padding: 1rem; border-radius: 8px; text-align: center; }
.card span { display: block; font-size: 0.8rem; color: #909399; }
.card b { display: block; font-size: 1.4rem; margin-top: 4px; }
.g { color: #67c23a; } .r { color: #f56c6c; } .y { color: #e6a23c; }
.bar { display: flex; height: 32px; border-radius: 6px; overflow: hidden; }
.seg { display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; min-width: 40px; }
.mt { margin-top: 1rem; }
.mt h4 { margin: 0 0 0.5rem; }
.filter { margin-bottom: 1rem; }
.filter select { padding: 6px 12px; border: 1px solid #dcdfe6; border-radius: 6px; }
.pred { background: #e8f5e9; padding: 1rem; border-radius: 8px; margin-top: 1rem; color: #2e7d32; font-weight: 600; }
.em { text-align: center; padding: 2rem; color: #909399; }
.ov { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.md { background: white; border-radius: 12px; padding: 2rem; width: 500px; max-height: 90vh; overflow-y: auto; }
.md h3 { margin: 0 0 1.5rem; }
.fg { display: flex; flex-direction: column; margin-bottom: 1rem; }
.fg label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #606266; }
.fg input, .fg select { padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary { background: #409eff; color: white; }
.btn-secondary { background: #f5f7fa; color: #606266; border: 1px solid #dcdfe6; }
.btn-success { background: #67c23a; color: white; }
/* Compare enhancements */
.best-batch { background: #e8f5e9; border: 1px solid #67c23a; border-radius: 6px; padding: 8px 16px; margin-bottom: 1rem; font-size: 0.9rem; color: #1a1a1a; }
.best-batch strong { color: #2e7d32; }
tr.best { background: #f0fdf0; font-weight: 500; }
.rank { width: 30px; text-align: center; color: #909399; font-weight: 600; }
.best-tag { display: inline-block; background: #67c23a; color: white; padding: 0 6px; border-radius: 8px; font-size: 0.7rem; margin-left: 4px; }
/* Report */
.report-content h3 { margin: 0 0 1rem; color: #2c3e50; font-size: 1.1rem; }
.report-content h4 { margin: 1.5rem 0 0.5rem; color: #606266; font-size: 0.95rem; border-bottom: 1px solid #ebeef5; padding-bottom: 0.3rem; }
</style>
