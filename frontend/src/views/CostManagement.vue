<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <h2><el-icon><Money /></el-icon> 成本核算与产量预估</h2>
      <div class="header-actions">
        <el-button type="primary" @click="mode='cost';showForm=true" :icon="Plus">记成本</el-button>
        <el-button type="success" @click="mode='sale';showForm=true">记销售</el-button>
      </div>
    </div>

    <div class="tabs-bar">
      <el-radio-group v-model="tab" size="default" @change="(t:any)=>onTab(t)">
        <el-radio-button value="cost">成本记录</el-radio-button>
        <el-radio-button value="sale">销售记录</el-radio-button>
        <el-radio-button value="profit">利润分析</el-radio-button>
        <el-radio-button value="yield">产量预估</el-radio-button>
        <el-radio-button value="compare">批次对比</el-radio-button>
        <el-radio-button value="report">综合报表</el-radio-button>
      </el-radio-group>
    </div>

    <div class="content-card">
      <!-- 成本记录 -->
      <div v-if="tab==='cost'">
        <div v-if="costs.length === 0" class="empty-state"><el-empty description="暂无成本记录" :image-size="80" /></div>
        <el-table v-else :data="costs" stripe row-key="id">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column label="类型" width="100"><template #default="{row}"><el-tag size="small" effect="plain">{{ row.type }}</el-tag></template></el-table-column>
          <el-table-column prop="description" label="描述" min-width="180" />
          <el-table-column label="金额" width="120"><template #default="{row}"><span class="amount">¥{{ row.amount }}</span></template></el-table-column>
          <el-table-column label="关联" width="120"><template #default="{row}">{{ row.batchId||row.plotId||'-' }}</template></el-table-column>
        </el-table>
      </div>

      <!-- 销售记录 -->
      <div v-if="tab==='sale'">
        <div v-if="sales.length === 0" class="empty-state"><el-empty description="暂无销售记录" :image-size="80" /></div>
        <el-table v-else :data="sales" stripe row-key="id">
          <el-table-column prop="saleDate" label="日期" width="120" />
          <el-table-column prop="customer" label="客户" width="120" />
          <el-table-column prop="varietyName" label="品种" width="100" />
          <el-table-column label="数量" width="100"><template #default="{row}">{{ row.quantity }}{{ row.unit }}</template></el-table-column>
          <el-table-column label="单价" width="100"><template #default="{row}">¥{{ row.unitPrice }}</template></el-table-column>
          <el-table-column label="金额" width="120"><template #default="{row}"><span class="amount">¥{{ row.totalAmount }}</span></template></el-table-column>
          <el-table-column label="收款" width="100"><template #default="{row}"><el-tag :type="row.paymentStatus==='已付款'?'success':row.paymentStatus==='部分付款'?'warning':'danger'" size="small" effect="plain">{{ row.paymentStatus }}</el-tag></template></el-table-column>
        </el-table>
      </div>

      <!-- 利润分析 -->
      <div v-if="tab==='profit'">
        <div class="filter-bar">
          <el-select v-model="pf.batchId" placeholder="全部批次" clearable @change="loadProfit" style="width:180px"><el-option v-for="b in batches" :key="b.id" :label="b.batchNumber" :value="b.id" /></el-select>
          <el-select v-model="pf.variety" placeholder="全部品种" clearable @change="loadProfit" style="width:160px"><el-option v-for="v in varieties" :key="v.id" :label="v.name" :value="v.name" /></el-select>
          <el-select v-model="pf.plotId" placeholder="全部地块" clearable @change="loadProfit" style="width:200px"><el-option v-for="p in plots" :key="p.id" :label="`${p.plotNumber} (${p.region})`" :value="p.id" /></el-select>
        </div>
        <div v-if="profit" class="kpi-cards">
          <div class="kpi-card"><span>总成本</span><b class="red">¥{{ profit.totalCost }}</b></div>
          <div class="kpi-card"><span>总收入</span><b class="green">¥{{ profit.totalRevenue }}</b></div>
          <div class="kpi-card"><span>利润</span><b :class="profit.profit>=0?'green':'red'">¥{{ profit.profit }}</b></div>
          <div class="kpi-card"><span>利润率</span><b>{{ profit.profitMargin.toFixed(1) }}%</b></div>
          <div class="kpi-card"><span>已收款</span><b>¥{{ profit.paidRevenue }}</b></div>
          <div class="kpi-card"><span>待收款</span><b class="yellow">¥{{ profit.unpaidRevenue }}</b></div>
        </div>
        <div v-if="profit?.costBreakdown?.length" class="cost-bar-wrap">
          <h4>成本构成</h4>
          <div class="cost-bar"><div v-for="b in profit.costBreakdown" :key="b.type" class="cost-seg" :style="{width:(b.amount/profit.totalCost*100)+'%',background:COST_COLORS[b.type]||'#999'}">{{ b.type }} ¥{{ b.amount }}</div></div>
        </div>
      </div>

      <!-- 产量预估 -->
      <div v-if="tab==='yield'">
        <div class="filter-bar"><el-select v-model="ypVar" placeholder="选择品种" @change="loadYield" style="width:200px"><el-option v-for="v in varieties" :key="v.id" :label="v.name" :value="v.name" /></el-select></div>
        <div v-if="yieldData" class="kpi-cards">
          <div class="kpi-card"><span>历史批次</span><b>{{ yieldData.historicalBatches }}</b></div>
          <div class="kpi-card"><span>平均亩产</span><b class="green">{{ yieldData.avgYieldPerMu }} kg</b></div>
          <div class="kpi-card"><span>置信度</span><b>{{ yieldData.confidence }}</b></div>
        </div>
        <div v-if="yieldData?.prediction" class="prediction-box">{{ yieldData.prediction }}</div>
      </div>

      <!-- 批次对比 -->
      <div v-if="tab==='compare'">
        <div class="filter-bar"><el-select v-model="bcVar" placeholder="选择品种" @change="loadCompare" style="width:200px"><el-option v-for="v in varieties" :key="v.id" :label="v.name" :value="v.name" /></el-select></div>
        <div v-if="compareData?.best" class="best-banner">🏆 最佳批次：<strong>{{ compareData.best.batchNumber }}</strong> — 亩产 {{ compareData.best.yieldPerMu }}kg，每公斤成本 ¥{{ compareData.best.efficiency }}，共 {{ compareData.count }} 个批次</div>
        <el-table v-if="sortedCompare.length" :data="sortedCompare" stripe row-key="batchNumber" :row-class-name="({row}:any)=>row.isBest?'best-row':''">
          <el-table-column label="排名" width="60"><template #default="{index}"><span class="rank">{{ index+1 }}</span></template></el-table-column>
          <el-table-column label="批次号" width="140"><template #default="{row}">{{ row.batchNumber }} <el-tag v-if="row.isBest" type="success" size="small" effect="dark">最优</el-tag></template></el-table-column>
          <el-table-column prop="sowDate" label="播种" width="120" />
          <el-table-column label="面积" width="80"><template #default="{row}">{{ row.area }}亩</template></el-table-column>
          <el-table-column label="亩产(kg)" width="100"><template #default="{row}"><span class="amount">{{ row.yieldPerMu }}</span></template></el-table-column>
          <el-table-column label="总成本" width="100"><template #default="{row}"><span class="amount">¥{{ row.totalCost }}</span></template></el-table-column>
          <el-table-column label="¥/kg" width="80"><template #default="{row}"><span :class="row.isBest?'green':''" class="amount">¥{{ row.efficiency }}</span></template></el-table-column>
          <el-table-column label="肥料" width="80"><template #default="{row}">¥{{ row.fertilizerCost }}</template></el-table-column>
          <el-table-column label="农药" width="80"><template #default="{row}">¥{{ row.pesticideCost }}</template></el-table-column>
          <el-table-column label="人工" width="80"><template #default="{row}">¥{{ row.laborCost }}</template></el-table-column>
        </el-table>
        <div v-else class="empty-state"><el-empty description="请选择品种" :image-size="80" /></div>
      </div>

      <!-- 综合报表 -->
      <div v-if="tab==='report'">
        <div v-if="report" class="report-content">
          <h3 class="report-title">📊 综合经营报表</h3>
          <div class="kpi-cards">
            <div class="kpi-card"><span>总成本</span><b class="red">¥{{ report.overview.totalCost }}</b></div>
            <div class="kpi-card"><span>总收入</span><b class="green">¥{{ report.overview.totalRevenue }}</b></div>
            <div class="kpi-card"><span>总利润</span><b :class="report.overview.totalProfit>=0?'green':'red'">¥{{ report.overview.totalProfit }}</b></div>
            <div class="kpi-card"><span>利润率</span><b>{{ report.overview.profitMargin.toFixed(1) }}%</b></div>
          </div>
          <h4>📋 地块成本核算表</h4>
          <el-table v-if="report.byPlot.length" :data="report.byPlot" size="small" stripe row-key="plotNumber">
            <el-table-column prop="plotNumber" label="地块" /><el-table-column prop="area" label="面积(亩)" />
            <el-table-column label="成本"><template #default="{row}"><span class="amount">¥{{ row.cost }}</span></template></el-table-column>
            <el-table-column label="收入"><template #default="{row}"><span class="amount">¥{{ row.revenue }}</span></template></el-table-column>
            <el-table-column label="利润"><template #default="{row}"><span class="amount" :class="row.profit>=0?'green':'red'">¥{{ row.profit }}</span></template></el-table-column>
            <el-table-column label="亩均利润"><template #default="{row}"><span class="amount">¥{{ row.area>0?Math.round(row.profit/row.area):0 }}</span></template></el-table-column>
          </el-table>
          <h4>🌾 品种利润分析表</h4>
          <el-table v-if="report.byVariety.length" :data="report.byVariety" size="small" stripe row-key="varietyName">
            <el-table-column prop="varietyName" label="品种" />
            <el-table-column label="成本"><template #default="{row}"><span class="amount">¥{{ row.cost }}</span></template></el-table-column>
            <el-table-column label="收入"><template #default="{row}"><span class="amount">¥{{ row.revenue }}</span></template></el-table-column>
            <el-table-column label="利润"><template #default="{row}"><span class="amount" :class="row.profit>=0?'green':'red'">¥{{ row.profit }}</span></template></el-table-column>
            <el-table-column prop="batchCount" label="批次数" />
            <el-table-column label="批均利润"><template #default="{row}"><span class="amount">¥{{ row.batchCount>0?Math.round(row.profit/row.batchCount):0 }}</span></template></el-table-column>
          </el-table>
        </div>
        <div v-else class="empty-state"><el-icon class="is-loading"><Loading /></el-icon> 加载报表中...</div>
      </div>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="showForm" :title="mode==='cost'?'记录成本':'记录销售'" width="500px">
      <form @submit.prevent="submitForm">
        <template v-if="mode==='cost'">
          <div class="fg"><label>类型</label><select v-model="f.type"><option v-for="t in ['种子','肥料','农药','人工','机械','其他']" :key="t" :value="t">{{ t }}</option></select></div>
          <div class="fg"><label>描述*</label><input v-model="f.description" required /></div>
          <div class="fg"><label>金额*</label><input v-model.number="f.amount" type="number" required /></div>
          <div class="fg"><label>日期</label><input v-model="f.date" type="date" /></div>
          <div class="fg"><label>关联批次</label><select v-model="f.batchId"><option value="">不关联</option><option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batchNumber }}</option></select></div>
        </template>
        <template v-if="mode==='sale'">
          <div class="fg"><label>客户*</label><input v-model="f.customer" required /></div>
          <div class="fg"><label>品种*</label><select v-model="f.varietyName" required><option value="">选择</option><option v-for="v in varieties" :key="v.id" :value="v.name">{{ v.name }}</option></select></div>
          <div class="fg"><label>数量*</label><input v-model.number="f.quantity" type="number" required /></div>
          <div class="fg"><label>单价*</label><input v-model.number="f.unitPrice" type="number" required /></div>
          <div class="fg"><label>日期</label><input v-model="f.saleDate" type="date" /></div>
          <div class="fg"><label>收款状态</label><select v-model="f.paymentStatus"><option value="已付款">已付款</option><option value="未付款">未付款</option><option value="部分付款">部分付款</option></select></div>
          <div class="fg"><label>销售员*</label><input v-model="f.salesperson" required /></div>
        </template>
        <div class="form-actions"><el-button @click="closeForm">取消</el-button><el-button type="primary" native-type="submit">保存</el-button></div>
      </form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { costService } from '@/services/cost.service';
import type { CostRecord, SalesRecord, ProfitAnalysis, YieldPrediction, BatchCompareResult, SummaryReport } from '@/types/cost';

const COST_COLORS: Record<string,string> = { '种子':'#4caf50','肥料':'#ff9800','农药':'#f44336','人工':'#2196f3','机械':'#9c27b0','其他':'#607d8b' };
const tab = ref('cost'); const showForm = ref(false); const mode = ref<'cost'|'sale'>('cost');
const costs = ref<CostRecord[]>([]); const sales = ref<SalesRecord[]>([]);
const profit = ref<ProfitAnalysis | null>(null); const yieldData = ref<YieldPrediction | null>(null);
const compareData = ref<BatchCompareResult | null>(null); const report = ref<SummaryReport | null>(null);
const batches = ref<any[]>([]); const varieties = ref<any[]>([]); const plots = ref<any[]>([]);
const pf = reactive({ batchId: '', variety: '', plotId: '' }); const ypVar = ref(''); const bcVar = ref('');
const f = reactive<Record<string,any>>({ type:'种子',description:'',amount:0,date:new Date().toISOString().slice(0,10),batchId:'',customer:'',varietyName:'',quantity:0,unitPrice:0,unit:'kg',saleDate:new Date().toISOString().slice(0,10),paymentStatus:'已付款',salesperson:'' });

onMounted(()=>{loadCosts();loadSales();loadRefs();});
async function loadRefs() { try { batches.value = await (await import('@/services/production-batch.service')).productionBatchService.getAll(); } catch {} try { varieties.value = await (await import('@/services/variety.service')).varietyService.getVarieties(); } catch {} try { plots.value = await (await import('@/services/plot.service')).plotService.getAll(); } catch {} }
function onTab(t: string) { if (t==='cost') loadCosts(); else if (t==='sale') loadSales(); else if (t==='profit') loadProfit(); else if (t==='yield'&&ypVar.value) loadYield(); else if (t==='compare'&&bcVar.value) loadCompare(); else if (t==='report') loadReport(); }
async function loadCosts() { try { costs.value = await costService.getCosts(); } catch {} }
async function loadSales() { try { sales.value = await costService.getSales(); } catch {} }
async function loadProfit() { try { const params:any={};if(pf.batchId)params.batchId=pf.batchId;if(pf.variety)params.variety=pf.variety;if(pf.plotId)params.plotId=pf.plotId;profit.value=await costService.profitAnalysis(params); } catch {} }
async function loadYield() { if(!ypVar.value)return;try{yieldData.value=await costService.yieldPredict(ypVar.value);}catch{} }
async function loadCompare() { if(!bcVar.value)return;try{compareData.value=await costService.batchCompare(bcVar.value);}catch{} }
async function loadReport() { try{report.value=await costService.generateReport();}catch{} }
const sortedCompare = computed(() => { if(!compareData.value?.items)return[];return[...compareData.value.items].sort((a,b)=>a.efficiency-b.efficiency); });
function closeForm() { showForm.value = false; }
async function submitForm() { try { if(mode.value==='cost'){ await costService.addCost({type:f.type,description:f.description,amount:f.amount,date:f.date,batchId:f.batchId||undefined});loadCosts(); } else { f.product=f.varietyName;f.totalAmount=f.quantity*f.unitPrice;f.unit='kg';await costService.addSale(f as any);loadSales(); } closeForm(); } catch {} }
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); flex-wrap: wrap; gap: var(--space-md); }
.page-header h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-actions { display: flex; gap: var(--space-sm); }
.tabs-bar { margin-bottom: var(--space-lg); }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.amount { font-weight: 700; font-family: var(--font-mono); }
.filter-bar { display: flex; gap: var(--space-sm); padding: var(--space-md); flex-wrap: wrap; }
.kpi-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-md); padding: var(--space-md); }
.kpi-card { background: var(--color-bg-alt); padding: 1rem; border-radius: var(--radius-md); text-align: center; transition: all var(--transition-fast); }
.kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.kpi-card span { display: block; font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 4px; }
.kpi-card b { display: block; font-size: 1.3rem; color: var(--color-text); }
.green { color: var(--color-success) !important; }
.red { color: var(--color-danger) !important; }
.yellow { color: var(--color-warning) !important; }
.cost-bar-wrap { padding: 0 var(--space-md) var(--space-md); }
.cost-bar-wrap h4 { margin: 0 0 8px; font-size: var(--text-sm); color: var(--color-text-secondary); }
.cost-bar { display: flex; height: 32px; border-radius: 6px; overflow: hidden; }
.cost-seg { display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem; min-width: 50px; font-weight: 600; }
.prediction-box { background: var(--color-success-bg); padding: 1rem; border-radius: var(--radius-sm); margin: 0 var(--space-md) var(--space-md); color: #065f46; font-weight: 600; }
.best-banner { background: var(--color-success-bg); border: 1px solid rgba(16,185,129,0.2); border-radius: var(--radius-sm); padding: 10px 16px; margin: 0 var(--space-md) var(--space-md); font-size: var(--text-sm); color: var(--color-text); }
.best-banner strong { color: var(--color-success); }
.rank { color: var(--color-text-muted); font-weight: 700; }
.report-content { padding: var(--space-md); }
.report-title { margin: 0 0 var(--space-md); color: var(--color-text); }
.report-content h4 { margin: var(--space-lg) 0 var(--space-sm); color: var(--color-text-secondary); font-size: var(--text-base); padding-bottom: 6px; border-bottom: 1px solid var(--color-border-light); }
.fg { display: flex; flex-direction: column; margin-bottom: 0.75rem; }
.fg label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.fg input, .fg select { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.fg input:focus, .fg select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
</style>
<style>.best-row { background: #f0fdf0 !important; }</style>
