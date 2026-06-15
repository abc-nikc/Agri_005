<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><Aim /></el-icon> 农事任务管理</h2>
        <span class="page-badge">AI 智能排程</span>
      </div>
      <div class="header-actions">
        <el-button type="success" :loading="aiScheduling" @click="runAISchedule">
          ✨ AI 智能排程
        </el-button>
        <el-button type="primary" @click="showForm = true; editingTask = null">
          新建任务
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-bar">
      <div class="stat-card pending"><div class="stat-val">{{ stats.pending }}</div><div class="stat-label">待执行</div></div>
      <div class="stat-card progress"><div class="stat-val">{{ stats.inProgress }}</div><div class="stat-label">执行中</div></div>
      <div class="stat-card done"><div class="stat-val">{{ stats.completed }}</div><div class="stat-label">已完成</div></div>
      <div class="stat-card overdue"><div class="stat-val">{{ stats.overdue }}</div><div class="stat-label">已逾期</div></div>
      <div class="stat-card ai"><div class="stat-val">{{ stats.aiGenerated }}</div><div class="stat-label">AI生成</div></div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="状态" clearable size="small" style="width:100px">
        <el-option label="待执行" value="待执行" /><el-option label="执行中" value="执行中" /><el-option label="已完成" value="已完成" /><el-option label="已取消" value="已取消" />
      </el-select>
      <el-select v-model="filterCategory" placeholder="类型" clearable size="small" style="width:100px">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filterPriority" placeholder="优先级" clearable size="small" style="width:100px">
        <el-option label="紧急" value="high" /><el-option label="一般" value="medium" /><el-option label="低" value="low" />
      </el-select>
    </div>

    <!-- 任务列表 -->
    <div class="task-list">
      <div v-if="tasks.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无农事任务</p>
        <p class="empty-hint">点击"AI 智能排程"自动生成任务，或手动创建</p>
      </div>
      <div v-for="task in filteredTasks" :key="task.id" class="task-card" :class="{ [task.status]: true, 'ai-task': task.aiGenerated }">
        <div class="task-left">
          <div class="task-priority" :class="task.priority">{{ task.priority === 'high' ? '紧急' : task.priority === 'medium' ? '一般' : '低' }}</div>
          <div class="task-category-icon">{{ categoryIcon(task.category) }}</div>
        </div>
        <div class="task-body">
          <div class="task-title-row">
            <span class="task-title">{{ task.title }}</span>
            <span v-if="task.aiGenerated" class="ai-tag">AI</span>
            <span class="task-category-tag">{{ task.category }}</span>
          </div>
          <div class="task-meta">
            <span v-if="task.plotName">地块: {{ task.plotName }}</span>
            <span v-if="task.varietyName">品种: {{ task.varietyName }}</span>
            <span v-if="task.assigneeName">负责人: {{ task.assigneeName }}</span>
            <span>排期: {{ formatDate(task.scheduledDate) }}</span>
          </div>
          <div class="task-desc" v-if="task.aiReason">{{ task.aiReason }}</div>
        </div>
        <div class="task-actions">
          <el-select v-model="task.status" size="small" @change="updateStatus(task)" style="width:90px">
            <el-option label="待执行" value="待执行" /><el-option label="执行中" value="执行中" /><el-option label="已完成" value="已完成" /><el-option label="已取消" value="已取消" />
          </el-select>
          <el-button text size="small" @click="editingTask = task; showForm = true">编辑</el-button>
          <el-button text size="small" type="danger" @click="deleteTask(task.id)">删除</el-button>
        </div>
      </div>
    </div>

    <!-- AI排程结果弹窗 -->
    <el-dialog v-model="showAISchedule" title="✨ AI 智能排程建议" width="680px">
      <div v-if="aiScheduleResult" class="ai-schedule-result" v-html="renderMd(aiScheduleResult)"></div>
      <div v-if="aiScheduleResult" style="margin-top:16px;text-align:center">
        <el-button type="primary" @click="applyAISchedule">一键应用AI建议</el-button>
        <el-button @click="showAISchedule = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 创建/编辑任务弹窗 -->
    <el-dialog v-model="showForm" :title="editingTask ? '编辑任务' : '新建农事任务'" width="520px">
      <div class="form-grid">
        <div class="fg"><label>任务标题 *</label><input v-model="formData.title" placeholder="如：A区番茄地灌溉" /></div>
        <div class="fg"><label>任务类型 *</label>
          <select v-model="formData.category">
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="fg"><label>优先级</label>
          <select v-model="formData.priority">
            <option value="high">紧急</option><option value="medium">一般</option><option value="low">低</option>
          </select>
        </div>
        <div class="fg"><label>关联地块</label>
          <select v-model="formData.plotId">
            <option value="">不指定</option>
            <option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }}</option>
          </select>
        </div>
        <div class="fg"><label>负责人</label>
          <select v-model="formData.assigneeName">
            <option value="">未分配</option>
            <option v-for="s in staffList" :key="s.id" :value="s.name">{{ s.name }} ({{ s.businessDivision || s.systemRole }})</option>
          </select>
        </div>
        <div class="fg"><label>计划日期</label><input v-model="formData.scheduledDate" type="date" /></div>
        <div class="fg full"><label>描述</label><textarea v-model="formData.description" rows="3" placeholder="任务详细描述..."></textarea></div>
      </div>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="saveTask" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { getFarmTasks, getFarmTaskStats, createFarmTask, updateFarmTask, deleteFarmTask, aiCreateFarmTasks, type FarmTask } from '@/services/farm-task.service';
import { aiSmartSchedule } from '@/services/ai.service';
import { plotService } from '@/services/plot.service';

const categories = ['灌溉', '施肥', '打药', '除草', '采收', '播种', '移栽', '整枝', '巡检', '维修', '其他'];

const tasks = ref<FarmTask[]>([]);
const stats = ref({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, highPriority: 0, aiGenerated: 0, byCategory: {} as Record<string, number>, byAssignee: {} as Record<string, number> });
const filterStatus = ref('');
const filterCategory = ref('');
const filterPriority = ref('');
const showForm = ref(false);
const editingTask = ref<FarmTask | null>(null);
const saving = ref(false);
const plots = ref<any[]>([]);
const staffList = ref<any[]>([]);
const aiScheduling = ref(false);
const aiScheduleResult = ref('');
const showAISchedule = ref(false);

const formData = reactive({
  title: '', category: '灌溉', priority: 'medium', plotId: '', plotName: '',
  varietyName: '', assigneeName: '', scheduledDate: '', description: '', aiGenerated: false, aiReason: '',
});

const filteredTasks = computed(() => tasks.value.filter(t => {
  if (filterStatus.value && t.status !== filterStatus.value) return false;
  if (filterCategory.value && t.category !== filterCategory.value) return false;
  if (filterPriority.value && t.priority !== filterPriority.value) return false;
  return true;
}));

function categoryIcon(cat: string) {
  const m: Record<string, string> = { '灌溉': '💧', '施肥': '🌿', '打药': '🧴', '除草': '🌱', '采收': '🧺', '播种': '📌', '移栽': '↗️', '整枝': '✂️', '巡检': '👁️', '维修': '🔧' };
  return m[cat] || '📋';
}

function formatDate(d?: string) { return d ? d.split('T')[0] : '未排期'; }

async function fetchTasks() {
  try { const res = await getFarmTasks(); tasks.value = res.items || []; } catch {}
}

async function fetchStats() {
  try { stats.value = await getFarmTaskStats(); } catch {}
}

async function updateStatus(task: FarmTask) {
  try { await updateFarmTask(task.id, { status: task.status }); fetchStats(); } catch {}
}

async function deleteTask(id: string) {
  try { await deleteFarmTask(id); fetchTasks(); fetchStats(); } catch {}
}

function resetForm() {
  formData.title = ''; formData.category = '灌溉'; formData.priority = 'medium';
  formData.plotId = ''; formData.plotName = ''; formData.varietyName = '';
  formData.assigneeName = ''; formData.scheduledDate = ''; formData.description = '';
  formData.aiGenerated = false; formData.aiReason = '';
}

async function saveTask() {
  if (!formData.title.trim()) return;
  saving.value = true;
  const plot = plots.value.find(p => p.id === formData.plotId);
  const data = { ...formData, plotName: plot?.plotNumber || '' };

  try {
    if (editingTask.value) {
      await updateFarmTask(editingTask.value.id, data);
    } else {
      await createFarmTask(data);
    }
    showForm.value = false; editingTask.value = null; resetForm();
    fetchTasks(); fetchStats();
  } finally { saving.value = false; }
}

async function runAISchedule() {
  aiScheduling.value = true;
  try {
    aiScheduleResult.value = await aiSmartSchedule();
    showAISchedule.value = true;
  } catch (e: any) {
    aiScheduleResult.value = 'AI排程失败: ' + e.message;
  }
  finally { aiScheduling.value = false; }
}

async function applyAISchedule() {
  // 解析AI建议并创建任务（简化版：创建基于排程的通用任务）
  try {
    await aiCreateFarmTasks([
      { title: 'AI建议-巡检所有地块', category: '巡检', priority: 'medium', scheduledDate: new Date().toISOString().split('T')[0], aiReason: aiScheduleResult.value.substring(0, 200) },
    ]);
    showAISchedule.value = false;
    fetchTasks(); fetchStats();
  } catch (e: any) {
    aiScheduleResult.value = '\n\n❌ 创建失败: ' + e.message;
  }
}

function renderMd(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>').replace(/^[-•]/gm, '&bull;').replace(/\d+\./g, (m) => `<span style="color:#6366f1;font-weight:600">${m}</span>`);
}

onMounted(async () => {
  fetchTasks(); fetchStats();
  try { plots.value = await plotService.getAll(); } catch {}
  try {
    const { apiClient } = await import('@/services/api-client');
    const res = await apiClient.get('/staff');
    staffList.value = res.data.data?.items || res.data.data || [];
  } catch {}
});
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-left { display: flex; align-items: center; gap: var(--space-md); }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; }
.page-badge { background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1)); color: #6366f1; padding: 3px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 600; }

/* 统计 */
.stats-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { text-align: center; padding: 16px; border-radius: var(--radius-md); background: var(--color-surface); border: 1px solid var(--color-border-light); }
.stat-val { font-size: 1.5rem; font-weight: 700; }
.stat-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }
.stat-card.pending .stat-val { color: #f59e0b; }
.stat-card.progress .stat-val { color: #6366f1; }
.stat-card.done .stat-val { color: #10b981; }
.stat-card.overdue .stat-val { color: #ef4444; }
.stat-card.ai .stat-val { color: #8b5cf6; }

/* 筛选 */
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }

/* 任务列表 */
.task-list { display: flex; flex-direction: column; gap: 10px; }
.task-card {
  display: flex; align-items: center; gap: 14px;
  background: var(--color-surface); border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md); padding: 14px 18px;
  transition: all 0.2s; border-left: 4px solid transparent;
}
.task-card:hover { box-shadow: var(--shadow-sm); }
.task-card.待执行 { border-left-color: #f59e0b; }
.task-card.执行中 { border-left-color: #6366f1; }
.task-card.已完成 { border-left-color: #10b981; opacity: 0.7; }
.task-card.已取消 { border-left-color: #94a3b8; opacity: 0.5; }
.task-card.ai-task { background: linear-gradient(135deg, rgba(139,92,246,0.03), transparent); }

.task-left { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.task-priority { font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.task-priority.high { background: rgba(239,68,68,0.1); color: #ef4444; }
.task-priority.medium { background: rgba(245,158,11,0.1); color: #f59e0b; }
.task-priority.low { background: rgba(148,163,184,0.1); color: #94a3b8; }
.task-category-icon { font-size: 1.3rem; }

.task-body { flex: 1; min-width: 0; }
.task-title-row { display: flex; align-items: center; gap: 8px; }
.task-title { font-weight: 600; font-size: 0.92rem; }
.ai-tag { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 0.6rem; padding: 1px 6px; border-radius: 6px; font-weight: 700; }
.task-category-tag { font-size: 0.68rem; padding: 2px 8px; border-radius: 8px; background: rgba(99,102,241,0.08); color: #6366f1; }
.task-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 0.75rem; color: var(--color-text-muted); }
.task-desc { font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 4px; line-height: 1.5; }

.task-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

/* 空状态 */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-hint { font-size: 0.8rem; color: var(--color-text-muted); }

/* AI排程结果 */
.ai-schedule-result { font-size: 0.88rem; line-height: 1.8; padding: 16px; background: linear-gradient(135deg, #f8fafc, #eef2ff); border-radius: var(--radius-md); border: 1px solid rgba(99,102,241,0.1); }
.ai-schedule-result strong { color: #4338ca; }

/* 表单 */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-grid .fg.full { grid-column: 1 / -1; }
.form-grid .fg label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.form-grid .fg input, .form-grid .fg select, .form-grid .fg textarea {
  width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: 0.88rem; outline: none; background: var(--color-surface);
}
.form-grid .fg input:focus, .form-grid .fg select:focus, .form-grid .fg textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
</style>
