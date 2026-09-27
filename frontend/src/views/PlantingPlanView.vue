<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><Document /></el-icon> 种植计划与批次管理</h2>
        <span class="term-tag" v-if="store.termRec.term">{{ store.termRec.term }} | 推荐: {{ store.termRec.recommendedNames.join('、') || '无' }}</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showPlanForm = true" :icon="Plus">新增种植计划</el-button>
        <el-button @click="showBatchForm = true">创建生产批次</el-button>
        <el-button type="success" plain @click="showAIPanel = true">
          <span style="margin-right:4px">✨</span>AI 种植推荐
        </el-button>
      </div>
    </div>

    <div class="tabs-bar">
      <el-radio-group v-model="activeTab" size="default">
        <el-radio-button value="plans">种植计划 ({{ store.plans.length }})</el-radio-button>
        <el-radio-button value="batches">生产批次 ({{ store.batches.length }})</el-radio-button>
      </el-radio-group>
    </div>

    <div class="content-card">
      <!-- 种植计划 -->
      <div v-if="activeTab === 'plans'">
        <div v-if="store.plans.length === 0" class="empty-state"><el-empty description="暂无种植计划" :image-size="80" /></div>
        <el-table v-else :data="store.plans" stripe row-key="id">
          <el-table-column label="地块" width="100"><template #default="{row}">{{ row.plotName }}</template></el-table-column>
          <el-table-column label="品种" width="100"><template #default="{row}">{{ row.varietyName }}</template></el-table-column>
          <el-table-column label="面积" width="80"><template #default="{row}">{{ row.area }}亩</template></el-table-column>
          <el-table-column label="播种日期" width="120"><template #default="{row}">{{ row.plannedSowDate }}</template></el-table-column>
          <el-table-column label="预计采收" width="120"><template #default="{row}">{{ row.plannedHarvestDate }}</template></el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{row}"><el-tag :type="planTagType(row.status)" size="small" effect="plain">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{row}">
              <el-button type="primary" link size="small" @click="editPlan(row)">调整</el-button>
              <el-button type="danger" link size="small" @click="delPlan(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 生产批次 -->
      <div v-if="activeTab === 'batches'">
        <div v-if="store.batches.length === 0" class="empty-state"><el-empty description="暂无生产批次" :image-size="80" /></div>
        <el-table v-else :data="store.batches" stripe row-key="id">
          <el-table-column label="批次号" width="140"><template #default="{row}"><code>{{ row.batchNumber }}</code></template></el-table-column>
          <el-table-column label="地块" width="100"><template #default="{row}">{{ row.plotName }}</template></el-table-column>
          <el-table-column label="品种" width="100"><template #default="{row}">{{ row.varietyName }}</template></el-table-column>
          <el-table-column label="面积" width="80"><template #default="{row}">{{ row.area }}亩</template></el-table-column>
          <el-table-column label="播种" width="120"><template #default="{row}">{{ row.sowDate }}</template></el-table-column>
          <el-table-column label="预计采收" width="120"><template #default="{row}">{{ row.estimatedHarvestDate }}</template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{row}"><el-tag :type="row.status==='已完成'?'success':''" size="small" effect="plain">{{ row.status }}</el-tag></template></el-table-column>
          <el-table-column label="质量检验" width="110"><template #default="{row}"><el-tag :type="row.qualityStatus==='合格'?'success':row.qualityStatus==='不合格'?'danger':'warning'" size="small" effect="plain">{{ row.qualityStatus || '待检' }}{{ row.qualityGrade ? ` · ${row.qualityGrade}` : '' }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{row}">
              <el-button v-if="row.status === '进行中'" type="success" link size="small" @click="finishBatch(row)">完成采收</el-button>
              <el-button v-if="row.status === '已完成'" type="warning" link size="small" @click="showQualityDialog(row)">质量检验</el-button>
              <el-button v-if="row.status === '已完成'" link size="small" @click="showSplitDialog(row)">按品质拆分</el-button>
              <el-button v-if="row.status !== '已完成'" type="danger" link size="small" @click="delBatch(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Plan Form Modal -->
    <el-dialog v-model="showPlanForm" :title="editingPlan ? '调整计划' : '新增种植计划'" width="600px">
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
        <div class="form-actions"><el-button @click="showPlanForm=false">取消</el-button><el-button type="primary" native-type="submit">保存</el-button></div>
      </form>
    </el-dialog>

    <!-- Quality inspection dialog -->
    <el-dialog v-model="qualityVisible" title="生产批次质量检验" width="520px">
      <div class="fg"><label>检验结论*</label><select v-model="qualityForm.passed"><option :value="true">合格</option><option :value="false">不合格</option></select></div>
      <div class="fg" v-if="qualityForm.passed"><label>品质等级*</label><select v-model="qualityForm.grade"><option value="">请选择</option><option value="特级">特级</option><option value="一级">一级</option><option value="二级">二级</option><option value="三级">三级</option></select></div>
      <div class="fg"><label>实际产量(kg)</label><input v-model.number="qualityForm.actualYield" type="number" min="0.01" step="0.01" /></div>
      <div class="fg"><label>检验说明</label><textarea v-model="qualityForm.notes" rows="3" placeholder="记录外观、农残、含水率等检验情况"></textarea></div>
      <template #footer><el-button @click="qualityVisible=false">取消</el-button><el-button type="primary" @click="submitQuality" :loading="qualityLoading">保存检验结果</el-button></template>
    </el-dialog>

    <!-- Batch Form Modal -->
    <el-dialog v-model="showBatchForm" title="创建生产批次" width="600px">
      <form @submit.prevent="submitBatch">
        <div class="form-grid">
          <div class="fg"><label>地块*</label><select v-model="batchForm.plotId" required><option value="">选择地块</option><option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }}</option></select></div>
          <div class="fg"><label>品种*</label><select v-model="batchForm.varietyId" required @change="onBatchVarietyChange"><option value="">选择品种</option><option v-for="v in varieties" :key="v.id" :value="v.id">{{ v.name }}</option></select></div>
          <div class="fg"><label>面积(亩)*</label><input v-model.number="batchForm.area" required type="number" step="0.1" /></div>
          <div class="fg"><label>播种日期*</label><input v-model="batchForm.sowDate" required type="date" /></div>
          <div class="fg"><label>预计采收日期*</label><input v-model="batchForm.estimatedHarvestDate" required type="date" /></div>
          <div class="fg"><label>关联计划</label><select v-model="batchForm.planId"><option value="">不关联</option><option v-for="p in store.plans.filter((x:any)=>x.status!=='已完成')" :key="p.id" :value="p.id">{{ p.plotName }}-{{ p.varietyName }}</option></select></div>
        </div>
        <div class="form-actions"><el-button @click="showBatchForm=false">取消</el-button><el-button type="primary" native-type="submit">创建</el-button></div>
      </form>
    </el-dialog>

    <!-- Split dialog -->
    <el-dialog v-model="splitVisible" title="按品质等级拆分子批次" width="520px">
      <p class="split-desc">将完成采收的批次按品质等级拆分为独立子批次，分别入库管理</p>
      <div class="fg" v-for="i in 3" :key="i"><label>等级 {{ i }}</label><div class="fg-row"><input v-model="splitForm['grade'+i]" placeholder="如: 一级/二级/三级" style="flex:1" /><input v-model.number="splitForm['qty'+i]" type="number" placeholder="产量(kg)" style="width:120px" /></div></div>
      <template #footer><el-button @click="splitVisible=false;splitBatchId=''">取消</el-button><el-button type="primary" @click="submitSplit" :loading="splitLoading">确认拆分</el-button></template>
    </el-dialog>

    <div v-if="store.error" class="error-toast" @click="store.clearError()">{{ store.error }} <el-icon><Close /></el-icon></div>

    <!-- AI 种植推荐面板 -->
    <el-drawer v-model="showAIPanel" title="✨ AI 智能种植推荐" direction="rtl" size="520px">
      <div class="ai-panel">
        <div class="ai-input-section">
          <div class="fg"><label>选择地块（可选）</label><select v-model="aiForm.plotId"><option value="">全部地块</option><option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }} - {{ p.area }}亩</option></select></div>
          <div class="fg"><label>选择品种（可选）</label><select v-model="aiForm.varietyId"><option value="">全部品种</option><option v-for="v in varieties" :key="v.id" :value="v.id">{{ v.name }}</option></select></div>
          <div class="fg"><label>面积（亩，可选）</label><input v-model.number="aiForm.area" type="number" step="0.1" placeholder="留空则由 AI 推荐" /></div>
          <el-button type="primary" :loading="aiLoading" @click="getAIRecommendation" style="width:100%;margin-top:8px">
            {{ aiLoading ? '🤖 AI 正在分析...' : '✨ 获取 AI 种植推荐' }}
          </el-button>
        </div>
        <div v-if="aiResult" class="ai-result">
          <div class="ai-result-header"><span class="ai-badge">AI 分析结果</span><el-button text size="small" @click="copyAIResult">📋 复制</el-button></div>
          <div class="ai-result-body" v-html="renderMarkdown(aiResult)"></div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { usePlantingStore } from '@/stores/planting-plan.store';
import { plotService } from '@/services/plot.service';
import { varietyService } from '@/services/variety.service';
import { aiPlantingRecommendation } from '@/services/ai.service';

const store = usePlantingStore();
const activeTab = ref('plans'); const showPlanForm = ref(false); const showBatchForm = ref(false);
const editingPlan = ref<any>(null);
const plots = ref<any[]>([]); const varieties = ref<any[]>([]);
const planForm = reactive<Record<string,any>>({ plotId:'',varietyId:'',plotName:'',varietyName:'',area:0,plannedSowDate:'',plannedHarvestDate:'',remark:'',adjustReason:'' });
const batchForm = reactive<Record<string,any>>({ plotId:'',varietyId:'',varietyName:'',sowDate:'',estimatedHarvestDate:'',area:0,planId:'',remark:'' });

const splitVisible = computed({ get: () => !!splitBatchId.value, set: (v) => { if(!v) splitBatchId.value = ''; } });
const splitBatchId = ref('');
const splitForm = reactive({ grade1:'', qty1:0, grade2:'', qty2:0, grade3:'', qty3:0 });
const splitLoading = ref(false);
const qualityVisible = ref(false);
const qualityBatchId = ref('');
const qualityLoading = ref(false);
const qualityForm = reactive({ passed: true, grade: '一级', actualYield: 0, notes: '' });

onMounted(() => { loadRefs(); store.fetchPlans(); store.fetchBatches(); store.fetchTermRecommendations(); });
const termTimer = setInterval(() => store.fetchTermRecommendations(), 3600000);
onUnmounted(() => clearInterval(termTimer));

async function loadRefs() { try { plots.value = await plotService.getAll(); } catch {} try { varieties.value = await varietyService.getVarieties(); } catch {} }
function onPlotChange() { const p = plots.value.find(x=>x.id===planForm.plotId); if(p) planForm.plotName = p.plotNumber; }
function onVarietyChange() { const v = varieties.value.find(x=>x.id===planForm.varietyId); if(v) planForm.varietyName = v.name; }
function onBatchVarietyChange() { const v = varieties.value.find(x=>x.id===batchForm.varietyId); if(v) batchForm.varietyName = v.name; }
async function submitPlan() { try { if (editingPlan.value) await store.updatePlan(editingPlan.value.id, planForm); else await store.createPlan(planForm as any); showPlanForm.value = false; resetPlanForm(); } catch {} }
function editPlan(p: any) { editingPlan.value = p; Object.assign(planForm, p); showPlanForm.value = true; }
function resetPlanForm() { editingPlan.value = null; Object.keys(planForm).forEach(k=>planForm[k]=''); planForm.area = 0; }
async function delPlan(id: string) { if(!confirm('确定删除?')) return; const plan = store.plans.find((p:any)=>p.id===id); const backup = plan ? { ...plan } : null; try { await store.deletePlan(id); const addUndo = (window as any).__addUndo; if (addUndo && backup) addUndo(id, '删除种植计划「' + (backup.planName || backup.varietyName || '') + '」', async () => { await store.createPlan(backup); }); } catch {} }
async function submitBatch() { try { await store.createBatch(batchForm as any); showBatchForm.value = false; Object.keys(batchForm).forEach(k=>batchForm[k]=''); batchForm.area = 0; } catch {} }
async function finishBatch(b: any) { const date = prompt('请输入实际采收日期 (YYYY-MM-DD):', new Date().toISOString().slice(0,10)); if (!date) return; try { await store.completeBatch(b.id, date); } catch {} }
async function delBatch(id: string) { if(!confirm('确定删除?')) return; const batch = store.batches.find((b:any)=>b.id===id); const backup = batch ? { ...batch } : null; try { await store.deleteBatch(id); const addUndo = (window as any).__addUndo; if (addUndo && backup) addUndo(id, '删除批次「' + (backup.batchNumber || '') + '」', async () => { await store.createBatch(backup); }); } catch {} }
function showSplitDialog(b: any) { splitBatchId.value = b.id; Object.keys(splitForm).forEach(k=>splitForm[k]=''); splitForm.qty1 = 0; splitForm.qty2 = 0; splitForm.qty3 = 0; }
async function submitSplit() { const grades = []; if (splitForm.grade1) grades.push({ grade: splitForm.grade1, quantity: Number(splitForm.qty1) }); if (splitForm.grade2) grades.push({ grade: splitForm.grade2, quantity: Number(splitForm.qty2) }); if (splitForm.grade3) grades.push({ grade: splitForm.grade3, quantity: Number(splitForm.qty3) }); if (!grades.length) { alert('请至少填写一个等级'); return; } splitLoading.value = true; try { const api = await import('@/services/production-batch.service'); await api.productionBatchService.splitByQuality(splitBatchId.value, grades); splitBatchId.value = ''; store.fetchBatches(); } catch (e: any) { alert('拆分失败: ' + (e.response?.data?.error || e.message)); } finally { splitLoading.value = false; } }
function showQualityDialog(b: any) { qualityBatchId.value = b.id; qualityForm.passed = b.qualityStatus !== '不合格'; qualityForm.grade = b.qualityGrade || '一级'; qualityForm.actualYield = Number(b.actualYield || 0); qualityForm.notes = b.inspectionNotes || ''; qualityVisible.value = true; }
async function submitQuality() { if (qualityForm.passed && !qualityForm.grade) { alert('请选择品质等级'); return; } qualityLoading.value = true; try { const api = await import('@/services/production-batch.service'); await api.productionBatchService.inspectQuality(qualityBatchId.value, { passed: qualityForm.passed, grade: qualityForm.passed ? qualityForm.grade : undefined, actualYield: qualityForm.actualYield || undefined, notes: qualityForm.notes || undefined }); qualityVisible.value = false; await store.fetchBatches(); } catch (e: any) { alert('保存失败: ' + (e.response?.data?.error || e.message)); } finally { qualityLoading.value = false; } }
function planTagType(s: string) { const m:Record<string,string>={'待执行':'info','执行中':'','已完成':'success','已调整':'warning'}; return m[s]||''; }

// ===== AI 种植推荐 =====
const showAIPanel = ref(false);
const aiLoading = ref(false);
const aiResult = ref('');
const aiForm = reactive({ plotId: '', varietyId: '', area: 0 });
async function getAIRecommendation() {
  aiLoading.value = true; aiResult.value = '';
  try { aiResult.value = await aiPlantingRecommendation({ plotId: aiForm.plotId || undefined, varietyId: aiForm.varietyId || undefined, area: aiForm.area || undefined }); } catch (e: any) { aiResult.value = '❌ 获取推荐失败: ' + (e.message || '请稍后重试'); }
  finally { aiLoading.value = false; }
}
function copyAIResult() { navigator.clipboard.writeText(aiResult.value.replace(/<[^>]*>/g, '')); }
function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/^[•\-]/gm, '&bull;')
    .replace(/\d+\./g, (m) => `<span style="color:var(--color-primary);font-weight:600">${m}</span>`);
}
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); flex-wrap: wrap; gap: var(--space-md); }
.header-left { display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap; }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-actions { display: flex; gap: var(--space-sm); }
.term-tag { background: var(--color-success-bg); color: #065f46; padding: 5px 14px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: 500; }
.tabs-bar { margin-bottom: var(--space-lg); }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.empty-state { text-align: center; padding: 60px 20px; }
.error-toast { position: fixed; bottom: 20px; right: 20px; background: var(--color-danger); color: white; padding: 12px 20px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; cursor: pointer; z-index: 2000; font-size: var(--text-sm); box-shadow: var(--shadow-lg); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.fg { display: flex; flex-direction: column; }
.fg.full { grid-column: 1/-1; }
.fg label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.fg input, .fg select, .fg textarea { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.fg input:focus, .fg select:focus, .fg textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
.split-desc { color: var(--color-text-muted); font-size: var(--text-sm); margin-bottom: 1rem; }
.fg-row { display: flex; gap: 0.5rem; }
.fg-row input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.fg-row input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }

/* AI 面板 */
.ai-panel { padding: 0 4px; }
.ai-input-section { margin-bottom: 20px; }
.ai-input-section .fg { margin-bottom: 12px; }
.ai-input-section .fg label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.ai-input-section .fg select, .ai-input-section .fg input { width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; background: var(--color-surface); }
.ai-input-section .fg select:focus, .ai-input-section .fg input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.ai-result { background: linear-gradient(135deg, #f8fafc, #eef2ff); border-radius: var(--radius-lg); border: 1px solid rgba(99,102,241,0.15); overflow: hidden; }
.ai-result-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: rgba(99,102,241,0.08); border-bottom: 1px solid rgba(99,102,241,0.1); }
.ai-badge { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 600; }
.ai-result-body { padding: 16px; font-size: 0.88rem; line-height: 1.8; color: var(--color-text); max-height: 60vh; overflow-y: auto; }
.ai-result-body strong { color: #4338ca; }
</style>
