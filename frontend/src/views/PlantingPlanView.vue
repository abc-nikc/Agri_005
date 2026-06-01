<template>
  <div class="container">
    <div class="page-header">
      <h2>种植计划与批次管理</h2>
      <div class="header-btns">
        <span class="term-tag" v-if="store.termRec.term">{{ store.termRec.term }} | 推荐: {{ store.termRec.recommendedNames.join('、') || '无' }}</span>
        <button class="btn btn-primary" @click="showPlanForm = true">新增种植计划</button>
        <button class="btn btn-secondary" @click="showBatchForm = true">创建生产批次</button>
      </div>
    </div>

    <!-- 选项卡 -->
    <div class="tabs">
      <button :class="['tab', { active: activeTab === 'plans' }]" @click="activeTab = 'plans'">种植计划 ({{ store.plans.length }})</button>
      <button :class="['tab', { active: activeTab === 'batches' }]" @click="activeTab = 'batches'">生产批次 ({{ store.batches.length }})</button>
    </div>

    <!-- 种植计划列表 -->
    <div v-if="activeTab === 'plans'" class="table-wrap">
      <table class="data-table" v-if="store.plans.length">
        <thead><tr><th>地块</th><th>品种</th><th>面积</th><th>播种日期</th><th>预计采收</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="p in store.plans" :key="p.id">
            <td>{{ p.plotName }}</td><td>{{ p.varietyName }}</td><td>{{ p.area }}亩</td>
            <td>{{ p.plannedSowDate }}</td><td>{{ p.plannedHarvestDate }}</td>
            <td><span :class="['status-badge', statusClass(p.status)]">{{ p.status }}</span></td>
            <td>
              <button class="btn btn-sm btn-primary" @click="editPlan(p)">调整</button>
              <button class="btn btn-sm btn-danger" @click="delPlan(p.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无种植计划</div>
    </div>

    <!-- 生产批次列表 -->
    <div v-if="activeTab === 'batches'" class="table-wrap">
      <table class="data-table" v-if="store.batches.length">
        <thead><tr><th>批次号</th><th>地块</th><th>品种</th><th>面积</th><th>播种</th><th>预计采收</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="b in store.batches" :key="b.id">
            <td><code>{{ b.batchNumber }}</code></td><td>{{ b.plotName }}</td><td>{{ b.varietyName }}</td><td>{{ b.area }}亩</td>
            <td>{{ b.sowDate }}</td><td>{{ b.estimatedHarvestDate }}</td>
            <td><span :class="['status-badge', b.status === '已完成' ? 'done' : 'active']">{{ b.status }}</span></td>
            <td>
              <button v-if="b.status === '进行中'" class="btn btn-sm btn-success" @click="finishBatch(b)">完成采收</button>
              <button v-if="b.status === '已完成'" class="btn btn-sm" @click="showSplitDialog(b)">按品质拆分</button>
              <button v-if="b.status !== '已完成'" class="btn btn-sm btn-danger" @click="delBatch(b.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无生产批次</div>
    </div>

    <!-- 种植计划表单 -->
    <div class="overlay" v-if="showPlanForm" @click.self="showPlanForm = false">
      <div class="modal"><h3>{{ editingPlan ? '调整计划' : '新增种植计划' }}</h3>
        <form @submit.prevent="submitPlan">
          <div class="form-grid">
            <div class="fg"><label>地块*</label><select v-model="planForm.plotId" required @change="onPlotChange"><option value="">选择地块</option><option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }}</option></select></div>
            <div class="fg"><label>品种*</label><select v-model="planForm.varietyId" required @change="onVarietyChange"><option value="">选择品种</option><option v-for="v in varieties" :key="v.id" :value="v.id">{{ v.name }}</option></select></div>
            <div class="fg"><label>面积(亩)*</label><input v-model.number="planForm.area" required type="number" step="0.1" /></div>
            <div class="fg"><label>计划播种日期*</label><input v-model="planForm.plannedSowDate" required type="date" /></div>
            <div class="fg"><label>预计采收日期*</label><input v-model="planForm.plannedHarvestDate" required type="date" /></div>
            <div class="fg" v-if="editingPlan"><label>调整原因</label><textarea v-model="planForm.adjustReason" rows="2"></textarea></div>
            <div class="fg full"><label>备注</label><textarea v-model="planForm.remark" rows="2"></textarea></div>
          </div>
          <div class="form-actions"><button type="button" class="btn btn-secondary" @click="showPlanForm=false">取消</button><button type="submit" class="btn btn-primary">保存</button></div>
        </form>
      </div>
    </div>

    <!-- 生产批次表单 -->
    <div class="overlay" v-if="showBatchForm" @click.self="showBatchForm = false">
      <div class="modal"><h3>创建生产批次</h3>
        <form @submit.prevent="submitBatch">
          <div class="form-grid">
            <div class="fg"><label>地块*</label><select v-model="batchForm.plotId" required><option value="">选择地块</option><option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }}</option></select></div>
            <div class="fg"><label>品种*</label><select v-model="batchForm.varietyId" required @change="onBatchVarietyChange"><option value="">选择品种</option><option v-for="v in varieties" :key="v.id" :value="v.id">{{ v.name }}</option></select></div>
            <div class="fg"><label>面积(亩)*</label><input v-model.number="batchForm.area" required type="number" step="0.1" /></div>
            <div class="fg"><label>播种日期*</label><input v-model="batchForm.sowDate" required type="date" /></div>
            <div class="fg"><label>预计采收日期*</label><input v-model="batchForm.estimatedHarvestDate" required type="date" /></div>
            <div class="fg"><label>关联计划</label><select v-model="batchForm.planId"><option value="">不关联</option><option v-for="p in store.plans.filter(x=>x.status!=='已完成')" :key="p.id" :value="p.id">{{ p.plotName }}-{{ p.varietyName }}</option></select></div>
          </div>
          <div class="form-actions"><button type="button" class="btn btn-secondary" @click="showBatchForm=false">取消</button><button type="submit" class="btn btn-primary">创建</button></div>
        </form>
      </div>
    </div>

    <div v-if="store.error" class="err-toast" @click="store.clearError()">{{ store.error }}</div>

    <!-- 按品质拆分弹窗 -->
    <div class="overlay" v-if="splitBatchId" @click.self="splitBatchId=''">
      <div class="modal"><h3>按品质等级拆分子批次</h3>
        <p class="desc">将完成采收的批次按品质等级拆分为独立子批次，分别入库管理</p>
        <div class="fg" v-for="i in 3" :key="i">
          <label>等级 {{ i }}</label>
          <div class="fg-row"><input v-model="splitForm['grade'+i]" placeholder="如: 一级/二级/三级" style="flex:1" /> <input v-model.number="splitForm['qty'+i]" type="number" placeholder="产量(kg)" style="width:120px" /></div>
        </div>
        <div class="form-actions"><button class="btn btn-secondary" @click="splitBatchId=''">取消</button><button class="btn btn-primary" @click="submitSplit" :disabled="splitLoading">{{ splitLoading?'拆分中...':'确认拆分' }}</button></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { usePlantingStore } from '@/stores/planting-plan.store';
import { plotService } from '@/services/plot.service';
import { varietyService } from '@/services/variety.service';

const store = usePlantingStore();
const activeTab = ref('plans');
const showPlanForm = ref(false);
const showBatchForm = ref(false);
const editingPlan = ref<any>(null);
const plots = ref<any[]>([]);
const varieties = ref<any[]>([]);

const planForm = reactive<Record<string,any>>({ plotId:'',varietyId:'',plotName:'',varietyName:'',area:0,plannedSowDate:'',plannedHarvestDate:'',remark:'',adjustReason:'' });
const batchForm = reactive<Record<string,any>>({ plotId:'',varietyId:'',varietyName:'',sowDate:'',estimatedHarvestDate:'',area:0,planId:'',remark:'' });

onMounted(() => { loadRefs(); store.fetchPlans(); store.fetchBatches(); store.fetchTermRecommendations(); });
async function loadRefs() { try { plots.value = await plotService.getAll(); } catch {} try { varieties.value = await varietyService.getVarieties(); } catch {} }

function onPlotChange() { const p = plots.value.find(x=>x.id===planForm.plotId); if(p) planForm.plotName = p.plotNumber; }
function onVarietyChange() { const v = varieties.value.find(x=>x.id===planForm.varietyId); if(v) planForm.varietyName = v.name; }
function onBatchVarietyChange() { const v = varieties.value.find(x=>x.id===batchForm.varietyId); if(v) batchForm.varietyName = v.name; }

async function submitPlan() {
  try { if (editingPlan.value) await store.updatePlan(editingPlan.value.id, planForm); else await store.createPlan(planForm as any); showPlanForm.value = false; resetPlanForm(); } catch {}
}
function editPlan(p: any) { editingPlan.value = p; Object.assign(planForm, p); showPlanForm.value = true; }
function resetPlanForm() { editingPlan.value = null; Object.keys(planForm).forEach(k=>planForm[k]=''); planForm.area = 0; }
async function delPlan(id: string) { if(!confirm('确定删除?')) return; try { await store.deletePlan(id); } catch {} }

async function submitBatch() {
  try { await store.createBatch(batchForm as any); showBatchForm.value = false; Object.keys(batchForm).forEach(k=>batchForm[k]=''); batchForm.area = 0; } catch {}
}
async function finishBatch(b: any) {
  const date = prompt('请输入实际采收日期 (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
  if (!date) return;
  try { await store.completeBatch(b.id, date); } catch {}
}
async function delBatch(id: string) { if(!confirm('确定删除?')) return; try { await store.deleteBatch(id); } catch {} }

// 🔴 边缘场景：按品质等级拆分子批次
const splitBatchId = ref('');
const splitForm = reactive({ grade1: '', qty1: 0, grade2: '', qty2: 0, grade3: '', qty3: 0 });
const splitLoading = ref(false);
function showSplitDialog(b: any) { splitBatchId.value = b.id; Object.keys(splitForm).forEach(k=>splitForm[k]=''); splitForm.qty1 = 0; splitForm.qty2 = 0; splitForm.qty3 = 0; }
async function submitSplit() {
  const grades = [];
  if (splitForm.grade1) grades.push({ grade: splitForm.grade1, quantity: Number(splitForm.qty1) });
  if (splitForm.grade2) grades.push({ grade: splitForm.grade2, quantity: Number(splitForm.qty2) });
  if (splitForm.grade3) grades.push({ grade: splitForm.grade3, quantity: Number(splitForm.qty3) });
  if (!grades.length) { alert('请至少填写一个等级'); return; }
  splitLoading.value = true;
  try {
    const api = await import('@/services/production-batch.service');
    await api.productionBatchService.splitByQuality(splitBatchId.value, grades);
    splitBatchId.value = '';
    store.fetchBatches();
  } catch (e: any) { alert('拆分失败: ' + (e.response?.data?.error || e.message)); }
  finally { splitLoading.value = false; }
}

function statusClass(s: string) { const m:Record<string,string> = {'待执行':'pending','执行中':'active','已完成':'done','已调整':'adjusted'}; return m[s]||''; }
</script>

<style scoped>
.container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.page-header h2 { margin: 0; }
.header-btns { display: flex; align-items: center; gap: 0.75rem; }
.term-tag { background: #e8f5e9; color: #1a1a1a; padding: 4px 12px; border-radius: 16px; font-size: 0.85rem; }
.tabs { display: flex; gap: 0; margin-bottom: 1rem; }
.tab { padding: 8px 24px; border: 1px solid #dcdfe6; background: #f5f7fa; cursor: pointer; font-size: 0.9rem; color: #1a1a1a; }
.tab:first-child { border-radius: 6px 0 0 6px; }
.tab:last-child { border-radius: 0 6px 6px 0; }
.tab.active { background: #409eff; color: white; border-color: #409eff; }
.table-wrap { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f5f7fa; padding: 10px; text-align: left; font-size: 0.85rem; }
.data-table td { padding: 10px; border-bottom: 1px solid #ebeef5; font-size: 0.9rem; }
.status-badge { padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
.status-badge.pending { background: #fff3e0; color: #1a1a1a; }
.status-badge.active { background: #e8f5e9; color: #1a1a1a; }
.status-badge.done { background: #e3f2fd; color: #1a1a1a; }
.status-badge.adjusted { background: #fce4ec; color: #1a1a1a; }
.empty { text-align: center; padding: 3rem; color: #909399; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; padding: 2rem; width: 600px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin: 0 0 1.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.fg { display: flex; flex-direction: column; }
.fg.full { grid-column: 1/-1; }
.fg label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #606266; }
.fg input, .fg select, .fg textarea { padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 0.9rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
.btn-primary { background: #409eff; color: white; }
.btn-secondary { background: #f5f7fa; color: #606266; border: 1px solid #dcdfe6; }
.btn-success { background: #67c23a; color: white; }
.btn-danger { background: #f56c6c; color: white; }
.btn-sm { padding: 4px 12px; font-size: 0.8rem; }
.err-toast { position: fixed; bottom: 1rem; right: 1rem; background: #f56c6c; color: white; padding: 12px 24px; border-radius: 6px; cursor: pointer; z-index: 2000; }
</style>
