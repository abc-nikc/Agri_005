<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><Cpu /></el-icon> AI 智能分析中心</h2>
        <span class="ai-badge-page">专业报告生成 &amp; 导出</span>
      </div>
      <div class="header-actions">
        <el-tag type="success" size="small" effect="plain">内置农业专家引擎</el-tag>
        <el-button text size="small" @click="showConfig = true">API 配置</el-button>
      </div>
    </div>

    <!-- API配置对话框 -->
    <el-dialog v-model="showConfig" title="AI 模型配置" width="500px" :close-on-click-modal="false">
      <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:16px">
        配置后可启用大模型深度分析（智谱GLM / DeepSeek / Ollama等），未配置时使用内置农业专家引擎。
      </p>
      <el-form label-width="100px">
        <el-form-item label="API 地址">
          <el-input v-model="configForm.baseUrl" placeholder="https://open.bigmodel.cn/api/paas/v4/chat/completions" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="configForm.apiKey" placeholder="你的 API Key" type="password" show-password />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="configForm.model" placeholder="glm-4-flash" />
        </el-form-item>
        <el-form-item label="预设">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <el-button size="small" @click="setPreset('zhipu')">智谱GLM</el-button>
            <el-button size="small" @click="setPreset('deepseek')">DeepSeek</el-button>
            <el-button size="small" @click="setPreset('ollama')">Ollama本地</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConfig = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
      </template>
    </el-dialog>

    <!-- 分析功能选择 -->
    <div class="analysis-grid">
      <div class="analysis-card" :class="{ active: activeModule === 'env' }" @click="activeModule = 'env'">
        <div class="ac-icon">🌡️</div>
        <div class="ac-info"><div class="ac-title">环境分析报告</div><div class="ac-desc">传感器数据综合评估分析</div></div>
      </div>
      <div class="analysis-card" :class="{ active: activeModule === 'yield' }" @click="activeModule = 'yield'">
        <div class="ac-icon">📈</div>
        <div class="ac-info"><div class="ac-title">产量预测报告</div><div class="ac-desc">基于数据预测作物产量</div></div>
      </div>
      <div class="analysis-card" :class="{ active: activeModule === 'pest' }" @click="activeModule = 'pest'">
        <div class="ac-icon">🐛</div>
        <div class="ac-info"><div class="ac-title">病虫害诊断报告</div><div class="ac-desc">智能诊断与防治方案</div></div>
      </div>
      <div class="analysis-card" :class="{ active: activeModule === 'schedule' }" @click="activeModule = 'schedule'">
        <div class="ac-icon">📅</div>
        <div class="ac-info"><div class="ac-title">智能排程报告</div><div class="ac-desc">AI自动生成农事计划</div></div>
      </div>
      <div class="analysis-card" :class="{ active: activeModule === 'chat' }" @click="activeModule = 'chat'">
        <div class="ac-icon">💬</div>
        <div class="ac-info"><div class="ac-title">智能问答</div><div class="ac-desc">自由提问获取分析</div></div>
      </div>
    </div>

    <div class="workspace-layout">
      <!-- 左侧: 参数+生成 -->
      <div class="workspace-left">
        <div v-if="activeModule === 'env'" class="params-panel">
          <h3>环境分析参数</h3>
          <div class="param-row"><label>指定地块</label>
            <select v-model="envPlotId">
              <option value="">全部地块</option>
              <option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }} - {{ p.area }}亩</option>
            </select>
          </div>
          <el-button type="primary" size="large" :loading="generating" @click="generateReport('env')" class="gen-btn">
            {{ generating ? '正在生成报告...' : '生成环境分析报告' }}
          </el-button>
        </div>

        <div v-if="activeModule === 'yield'" class="params-panel">
          <h3>产量预测参数</h3>
          <div class="param-row"><label>选择批次</label>
            <select v-model="yieldBatchId">
              <option value="">不指定</option>
              <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batchNumber }} - {{ b.varietyName }}</option>
            </select>
          </div>
          <div class="param-row"><label>选择品种</label>
            <select v-model="yieldVarietyId">
              <option value="">全部品种</option>
              <option v-for="v in varieties" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </div>
          <el-button type="primary" size="large" :loading="generating" @click="generateReport('yield')" class="gen-btn">
            {{ generating ? '正在生成报告...' : '生成产量预测报告' }}
          </el-button>
        </div>

        <div v-if="activeModule === 'pest'" class="params-panel">
          <h3>病虫害诊断参数</h3>
          <div class="param-row"><label>症状描述 *</label>
            <textarea v-model="pestSymptoms" rows="3" placeholder="描述植株症状，如：叶片出现黄色斑点、叶缘卷曲..."></textarea>
          </div>
          <div class="param-row"><label>作物品种</label>
            <select v-model="pestVarietyName">
              <option value="">不指定</option>
              <option v-for="v in varieties" :key="v.id" :value="v.name">{{ v.name }}</option>
            </select>
          </div>
          <div class="param-row"><label>所在地块</label>
            <select v-model="pestPlotId">
              <option value="">不指定</option>
              <option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }}</option>
            </select>
          </div>
          <el-button type="primary" size="large" :loading="generating" @click="generateReport('pest')" class="gen-btn" :disabled="!pestSymptoms.trim()">
            {{ generating ? '正在生成报告...' : '生成病虫害诊断报告' }}
          </el-button>
        </div>

        <div v-if="activeModule === 'schedule'" class="params-panel">
          <h3>智能排程</h3>
          <p class="param-hint">AI 将分析所有种植批次、环境数据、工人情况，自动生成本周最优农事计划。</p>
          <el-button type="primary" size="large" :loading="generating" @click="generateReport('schedule')" class="gen-btn">
            {{ generating ? '正在生成报告...' : '生成智能排程报告' }}
          </el-button>
        </div>

        <div v-if="activeModule === 'chat'" class="params-panel">
          <h3>智能问答</h3>
          <div class="chat-input-area">
            <textarea v-model="chatInput" rows="3" placeholder="输入问题，如：环境数据分析、灌溉建议、病虫害风险..." :disabled="generating"></textarea>
            <div class="chat-quick-row">
              <el-button v-for="q in quickQuestions" :key="q" text size="small" @click="chatInput = q">{{ q }}</el-button>
            </div>
            <el-button type="primary" size="large" :loading="generating" @click="generateReport('chat')" class="gen-btn" :disabled="!chatInput.trim()">
              {{ generating ? 'AI 正在分析...' : '生成分析报告' }}
            </el-button>
          </div>
        </div>

        <!-- 历史报告列表 -->
        <div class="history-panel" v-if="reportHistory.length > 0">
          <h4>历史报告 ({{ reportHistory.length }})</h4>
          <div v-for="(r, i) in reportHistory" :key="i" class="history-item" @click="viewHistory(i)">
            <span class="hi-icon">{{ r.icon }}</span>
            <div class="hi-info">
              <span class="hi-title">{{ r.title }}</span>
              <span class="hi-time">{{ r.time }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧: 正式报告预览 -->
      <div class="workspace-right">
        <div v-if="currentReport" class="report-document">
          <!-- 工具栏 -->
          <div class="doc-toolbar">
            <div class="dt-left">
              <span class="dt-filename">{{ currentReport.title }}</span>
              <span class="dt-time">{{ currentReport.time }}</span>
            </div>
            <div class="dt-actions">
              <el-dropdown trigger="click" @command="exportReport">
                <el-button type="primary" size="small" round>
                  导出文件 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="html">导出 HTML 文件</el-dropdown-item>
                    <el-dropdown-item command="txt">导出 TXT 纯文本</el-dropdown-item>
                    <el-dropdown-item command="md">导出 Markdown 文件</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button text size="small" @click="copyReport">复制内容</el-button>
            </div>
          </div>

          <!-- 正式文档 -->
          <div class="doc-paper" ref="reportBodyRef">
            <!-- 文档红头 -->
            <div class="doc-header">
              <div class="dh-logo">智慧农业物联网监控平台</div>
              <div class="dh-line"></div>
              <div class="dh-subtitle">智 能 分 析 报 告</div>
            </div>

            <!-- 文档信息区 -->
            <div class="doc-meta">
              <table class="meta-table">
                <tr><td class="meta-label">报告名称</td><td>{{ currentReport.title }}</td></tr>
                <tr><td class="meta-label">报告编号</td><td>{{ currentReport.docNo }}</td></tr>
                <tr><td class="meta-label">生成时间</td><td>{{ currentReport.time }}</td></tr>
                <tr><td class="meta-label">数据来源</td><td>系统实时传感器采集 + AI 分析引擎</td></tr>
                <tr><td class="meta-label">报告密级</td><td>内部资料</td></tr>
              </table>
            </div>

            <div class="dh-line"></div>

            <!-- 报告正文 -->
            <div class="doc-body" v-html="renderFormalReport(currentReport.content)"></div>

            <div class="dh-line"></div>

            <!-- 签章区 -->
            <div class="doc-signature">
              <table class="sig-table">
                <tr>
                  <td>编制人：AI 分析引擎</td>
                  <td>审核人：</td>
                  <td>批准人：</td>
                </tr>
                <tr>
                  <td>日期：{{ currentDateStr }}</td>
                  <td>日期：</td>
                  <td>日期：</td>
                </tr>
              </table>
            </div>

            <div class="doc-footer-note">
              本报告由智慧农业物联网监控平台 AI 分析引擎自动生成，仅供农业生产决策参考。
            </div>
          </div>
        </div>

        <div v-else class="report-placeholder">
          <div class="rp-icon">📊</div>
          <h3>选择分析类型并生成报告</h3>
          <p>在左侧选择分析模块，设置参数后点击"生成报告"按钮。</p>
          <p>系统将基于实时数据生成正式分析报告，支持导出为多种文件格式。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { aiEnvironmentAnalysis, aiYieldPrediction, aiPestDiagnosis, aiChat, aiSmartSchedule } from '@/services/ai.service';
import { plotService } from '@/services/plot.service';
import { varietyService } from '@/services/variety.service';
import { apiClient } from '@/services/api-client';

const plots = ref<any[]>([]);
const varieties = ref<any[]>([]);
const batches = ref<any[]>([]);
const activeModule = ref('env');
const showConfig = ref(false);
const configForm = reactive({ baseUrl: '', apiKey: '', model: '' });
const generating = ref(false);

const envPlotId = ref('');
const yieldBatchId = ref('');
const yieldVarietyId = ref('');
const pestSymptoms = ref('');
const pestVarietyName = ref('');
const pestPlotId = ref('');
const chatInput = ref('');
const quickQuestions = ['环境数据分析', '灌溉建议', '病虫害风险评估', '产量预测', '设备状态总览', '种植规划建议'];

interface Report { icon: string; title: string; content: string; time: string; type: string; docNo: string; }
const currentReport = ref<Report | null>(null);
const reportHistory = ref<Report[]>([]);
const reportBodyRef = ref<HTMLElement | null>(null);

const currentDateStr = computed(() => new Date().toLocaleDateString('zh-CN'));

let reportSeq = 0;
function nextDocNo() {
  reportSeq++;
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `AI-RPT-${ds}-${String(reportSeq).padStart(3,'0')}`;
}

function setPreset(type: string) {
  if (type === 'zhipu') { configForm.baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'; configForm.model = 'glm-4-flash'; }
  else if (type === 'deepseek') { configForm.baseUrl = 'https://api.deepseek.com/v1/chat/completions'; configForm.model = 'deepseek-chat'; }
  else if (type === 'ollama') { configForm.baseUrl = 'http://localhost:11434/v1/chat/completions'; configForm.model = 'qwen2.5:7b'; configForm.apiKey = 'ollama'; }
}

async function saveConfig() {
  try {
    await apiClient.post('/settings', { key: 'ai_base_url', value: configForm.baseUrl });
    await apiClient.post('/settings', { key: 'ai_api_key', value: configForm.apiKey });
    await apiClient.post('/settings', { key: 'ai_model', value: configForm.model });
    showConfig.value = false;
    ElMessage.success('AI 配置已保存，重启后端生效');
  } catch (e: any) { ElMessage.error('保存失败: ' + e.message); }
}

onMounted(async () => {
  try { plots.value = await plotService.getAll(); } catch {}
  try { varieties.value = await varietyService.getVarieties(); } catch {}
  try {
    const res = await apiClient.get('/production-batches');
    batches.value = res.data.data?.items || res.data.data || [];
  } catch {}
});

async function generateReport(type: string) {
  generating.value = true;
  let content = '';
  const now = new Date().toLocaleString('zh-CN');
  const titles: Record<string, { icon: string; name: string }> = {
    env: { icon: '🌡️', name: '农业环境智能分析报告' },
    yield: { icon: '📈', name: '作物产量预测分析报告' },
    pest: { icon: '🐛', name: '病虫害诊断分析报告' },
    schedule: { icon: '📅', name: '农事智能排程报告' },
    chat: { icon: '💬', name: '智能问答分析报告' },
  };
  const t = titles[type];
  try {
    if (type === 'env') content = await aiEnvironmentAnalysis(envPlotId.value || undefined);
    else if (type === 'yield') content = await aiYieldPrediction({ batchId: yieldBatchId.value || undefined, varietyId: yieldVarietyId.value || undefined });
    else if (type === 'pest') content = await aiPestDiagnosis({ symptoms: pestSymptoms.value, varietyName: pestVarietyName.value || undefined, plotId: pestPlotId.value || undefined });
    else if (type === 'schedule') content = await aiSmartSchedule();
    else if (type === 'chat') content = await aiChat(chatInput.value.trim());

    const report: Report = { icon: t.icon, title: t.name, content, time: now, type, docNo: nextDocNo() };
    currentReport.value = report;
    reportHistory.value.unshift(report);
    if (reportHistory.value.length > 20) reportHistory.value.pop();
  } catch (e: any) {
    currentReport.value = { icon: '❌', title: '报告生成失败', content: `报告生成失败：${e.message}`, time: now, type, docNo: nextDocNo() };
  } finally {
    generating.value = false;
  }
}

function viewHistory(idx: number) { currentReport.value = reportHistory.value[idx]; }

// ===== 正式报告渲染 =====
function renderFormalReport(text: string): string {
  // 先按 ## 分割为 sections
  let html = text
    // 清理 markdown 表格符号
    .replace(/^\|[-| :]+\|\s*$/gm, '')
    // 表格行
    .replace(/^\|(.+)\|\s*$/gm, (match, content) => {
      const cells = content.split('|').map((c: string) => c.trim());
      return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
    });

  // 将连续的 <tr> 包裹为 <table>
  html = html.replace(/((?:<tr>.*?<\/tr>\s*)+)/g, '<table class="rpt-table">$1</table>');

  // ## 标题 -> 正式章节
  let sectionIdx = 0;
  html = html.replace(/^## (.+)$/gm, () => {
    sectionIdx++;
    return `<div class="rpt-section-title"><span class="rpt-section-num">第${numToChinese(sectionIdx)}部分</span><span class="rpt-section-text">$1</span></div>`;
  });

  // ### 标题 -> 小节
  html = html.replace(/^### (.+)$/gm, '<div class="rpt-subsection">$1</div>');

  // # 标题 -> 主标题（一般不会出现在报告中）
  html = html.replace(/^# (.+)$/gm, '<div class="rpt-main-title">$1</div>');

  // 加粗
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 列表项
  html = html.replace(/^[-•] (.+)$/gm, '<div class="rpt-list-item"><span class="rpt-list-dot"></span>$1</div>');

  // 数字列表
  html = html.replace(/^\d+\. (.+)$/gm, (m, p1) => {
    const num = m.match(/^\d+/)?.[0] || '';
    return `<div class="rpt-list-item"><span class="rpt-list-num">${num}.</span>${p1}</div>`;
  });

  // 引用块
  html = html.replace(/^>\s*(.+)$/gm, '<div class="rpt-quote">$1</div>');

  // 段落：双换行
  html = html.replace(/\n\n/g, '<div class="rpt-para"></div>');

  // 单换行
  html = html.replace(/\n/g, '<br>');

  return html;
}

function numToChinese(n: number): string {
  const chars = ['零','一','二','三','四','五','六','七','八','九','十'];
  if (n <= 10) return chars[n];
  if (n < 20) return '十' + (n % 10 === 0 ? '' : chars[n % 10]);
  return n.toString();
}

// ===== 导出 =====
function exportReport(format: string) {
  if (!currentReport.value) return;
  const r = currentReport.value;
  const plainText = r.content.replace(/<[^>]*>/g, '');

  if (format === 'html') {
    const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>${r.title}</title>
<style>
  body { font-family: "SimSun","Microsoft YaHei","PingFang SC",serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 2; font-size: 14px; }
  .doc-header { text-align: center; margin-bottom: 30px; }
  .doc-header .logo { font-size: 18px; font-weight: bold; letter-spacing: 8px; color: #c41a1a; }
  .doc-header .subtitle { font-size: 22px; font-weight: bold; letter-spacing: 12px; margin-top: 10px; color: #1a1a1a; }
  .red-line { height: 3px; background: #c41a1a; margin: 12px 0; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .meta-table td { border: 1px solid #333; padding: 6px 12px; font-size: 13px; }
  .meta-table .label { background: #f5f5f5; width: 100px; font-weight: bold; }
  .section-title { font-size: 16px; font-weight: bold; margin: 24px 0 12px; padding: 8px 0; border-bottom: 2px solid #c41a1a; }
  .section-title .num { margin-right: 10px; }
  .subsection { font-size: 15px; font-weight: bold; margin: 18px 0 8px; padding-left: 12px; border-left: 4px solid #c41a1a; }
  table.report { width: 100%; border-collapse: collapse; margin: 12px 0; }
  table.report td, table.report th { border: 1px solid #666; padding: 6px 10px; text-align: left; font-size: 13px; }
  table.report tr:first-child { background: #f0f0f0; font-weight: bold; }
  .list-item { padding: 3px 0 3px 20px; position: relative; }
  .list-item::before { content: ''; position: absolute; left: 8px; top: 11px; width: 5px; height: 5px; border-radius: 50%; background: #333; }
  .quote { background: #f9f9f9; border-left: 3px solid #999; padding: 8px 16px; margin: 8px 0; color: #555; font-size: 13px; }
  strong { color: #c41a1a; }
  .sig-table { width: 100%; margin-top: 40px; }
  .sig-table td { padding: 6px 0; font-size: 13px; width: 33%; }
  .footer-note { text-align: center; color: #888; font-size: 11px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
</style></head><body>
<div class="doc-header">
  <div class="logo">智慧农业物联网监控平台</div>
  <div class="red-line"></div>
  <div class="subtitle">智 能 分 析 报 告</div>
</div>
<table class="meta-table">
  <tr><td class="label">报告名称</td><td>${r.title}</td></tr>
  <tr><td class="label">报告编号</td><td>${r.docNo}</td></tr>
  <tr><td class="label">生成时间</td><td>${r.time}</td></tr>
  <tr><td class="label">数据来源</td><td>系统实时传感器采集 + AI 分析引擎</td></tr>
  <tr><td class="label">报告密级</td><td>内部资料</td></tr>
</table>
<div class="red-line"></div>
<div class="body">${renderFormalReport(r.content)}</div>
<div class="red-line"></div>
<table class="sig-table"><tr><td>编制人：AI 分析引擎</td><td>审核人：</td><td>批准人：</td></tr>
<tr><td>日期：${r.time.split(' ')[0]}</td><td>日期：</td><td>日期：</td></tr></table>
<div class="footer-note">本报告由智慧农业物联网监控平台 AI 分析引擎自动生成，仅供农业生产决策参考。</div>
</body></html>`;
    downloadFile(html, `${r.title}_${formatDate()}.html`, 'text/html');
  } else if (format === 'txt') {
    const divider = '='.repeat(56);
    const txt = `${divider}\n       智慧农业物联网监控平台\n             智 能 分 析 报 告\n${divider}\n\n报告名称：${r.title}\n报告编号：${r.docNo}\n生成时间：${r.time}\n数据来源：系统实时传感器采集 + AI 分析引擎\n报告密级：内部资料\n\n${divider}\n\n${plainText}\n\n${divider}\n编制人：AI 分析引擎      审核人：            批准人：\n日  期：${r.time.split(' ')[0]}      日  期：            日  期：\n\n${divider}\n本报告由智慧农业物联网监控平台 AI 分析引擎自动生成，仅供农业生产决策参考。\n`;
    downloadFile(txt, `${r.title}_${formatDate()}.txt`, 'text/plain');
  } else if (format === 'md') {
    const md = `# 智慧农业物联网监控平台 - 智能分析报告\n\n> 报告名称：${r.title}  \n> 报告编号：${r.docNo}  \n> 生成时间：${r.time}  \n> 数据来源：系统实时传感器采集 + AI 分析引擎  \n> 报告密级：内部资料\n\n---\n\n${r.content}\n\n---\n\n| 编制人 | 审核人 | 批准人 |\n|--------|--------|--------|\n| AI 分析引擎 | | |\n| ${r.time.split(' ')[0]} | | |\n\n---\n\n*本报告由智慧农业物联网监控平台 AI 分析引擎自动生成，仅供农业生产决策参考。*\n`;
    downloadFile(md, `${r.title}_${formatDate()}.md`, 'text/markdown');
  }
  ElMessage.success(`报告已导出为 ${format.toUpperCase()} 文件`);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate() { return new Date().toISOString().slice(0, 10).replace(/-/g, ''); }

function copyReport() {
  if (!currentReport.value) return;
  const r = currentReport.value;
  const plain = r.content.replace(/<[^>]*>/g, '');
  const header = `智慧农业物联网监控平台 - 智能分析报告\n报告名称：${r.title}\n报告编号：${r.docNo}\n生成时间：${r.time}\n${'='.repeat(50)}\n\n`;
  navigator.clipboard.writeText(header + plain);
  ElMessage.success('报告内容已复制到剪贴板');
}
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1500px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left h2 { margin: 0; font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.ai-badge-page { background: linear-gradient(135deg, #c41a1a, #8b0000); color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; letter-spacing: 1px; }

.analysis-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px; }
@media (max-width: 1100px) { .analysis-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 700px) { .analysis-grid { grid-template-columns: repeat(2, 1fr); } }
.analysis-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
.analysis-card:hover { border-color: #c41a1a; box-shadow: 0 4px 12px rgba(196,26,26,0.08); }
.analysis-card.active { border-color: #c41a1a; background: #fef2f2; }
.ac-icon { font-size: 1.6rem; }
.ac-info { flex: 1; min-width: 0; }
.ac-title { font-weight: 700; font-size: 0.85rem; color: #1a1a1a; }
.ac-desc { font-size: 0.7rem; color: #888; margin-top: 2px; }

/* 工作区布局 */
.workspace-layout { display: grid; grid-template-columns: 360px 1fr; gap: 16px; min-height: 600px; }
@media (max-width: 1000px) { .workspace-layout { grid-template-columns: 1fr; } }

.workspace-left { display: flex; flex-direction: column; gap: 12px; }

.params-panel { background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; }
.params-panel h3 { margin: 0 0 14px; font-size: 0.95rem; color: #1a1a1a; font-weight: 700; }
.param-hint { font-size: 0.82rem; color: #888; margin: 0 0 14px; line-height: 1.5; }
.param-row { margin-bottom: 12px; }
.param-row label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 3px; color: #555; }
.param-row select, .param-row textarea { width: 100%; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem; outline: none; }
.param-row select:focus, .param-row textarea:focus { border-color: #c41a1a; }
.gen-btn { width: 100%; font-size: 0.9rem; }
.chat-quick-row { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; }

.history-panel { background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 14px; }
.history-panel h4 { margin: 0 0 10px; font-size: 0.82rem; color: #666; }
.history-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; cursor: pointer; margin-bottom: 2px; }
.history-item:hover { background: #fef2f2; }
.hi-icon { font-size: 1rem; }
.hi-info { flex: 1; min-width: 0; }
.hi-title { display: block; font-size: 0.8rem; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hi-time { display: block; font-size: 0.68rem; color: #aaa; }

/* ===== 右侧报告文档 ===== */
.workspace-right { background: #f3f4f6; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }

.doc-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.dt-left { display: flex; align-items: center; gap: 12px; }
.dt-filename { font-size: 0.82rem; font-weight: 600; color: #1a1a1a; }
.dt-time { font-size: 0.72rem; color: #999; }
.dt-actions { display: flex; gap: 8px; }

/* A4 纸效果 */
.doc-paper { flex: 1; overflow-y: auto; background: #fff; margin: 16px; padding: 48px 56px; box-shadow: 0 1px 8px rgba(0,0,0,0.12); border-radius: 2px; min-height: 700px; font-family: "SimSun","Microsoft YaHei","PingFang SC",serif; font-size: 14px; line-height: 2; color: #1a1a1a; }
@media (max-width: 1000px) { .doc-paper { padding: 24px 20px; } }

/* 红头 */
.doc-header { text-align: center; margin-bottom: 24px; }
.dh-logo { font-size: 20px; font-weight: 700; letter-spacing: 8px; color: #c41a1a; }
.dh-line { height: 3px; background: linear-gradient(90deg, transparent, #c41a1a, transparent); margin: 14px 0; }
.dh-subtitle { font-size: 24px; font-weight: 700; letter-spacing: 16px; color: #1a1a1a; margin-top: 6px; }

/* 元信息 */
.doc-meta { margin: 16px 0; }
.meta-table { width: 100%; border-collapse: collapse; }
.meta-table td { border: 1px solid #333; padding: 5px 10px; font-size: 12.5px; }
.meta-table .meta-label { background: #f5f5f5; width: 80px; font-weight: 700; text-align: center; }

/* 正文区（deep 渲染） */
.doc-body { min-height: 200px; }
.doc-body :deep(.rpt-main-title) { text-align: center; font-size: 18px; font-weight: 700; margin: 20px 0; }
.doc-body :deep(.rpt-section-title) { font-size: 15px; font-weight: 700; margin: 28px 0 12px; padding: 8px 0; border-bottom: 2px solid #c41a1a; display: flex; align-items: baseline; gap: 8px; }
.doc-body :deep(.rpt-section-num) { color: #c41a1a; font-size: 13px; }
.doc-body :deep(.rpt-section-text) { color: #1a1a1a; }
.doc-body :deep(.rpt-subsection) { font-size: 14px; font-weight: 700; margin: 18px 0 8px; padding-left: 12px; border-left: 4px solid #c41a1a; }
.doc-body :deep(.rpt-table) { width: 100%; border-collapse: collapse; margin: 12px 0; }
.doc-body :deep(.rpt-table td) { border: 1px solid #555; padding: 5px 10px; font-size: 12.5px; }
.doc-body :deep(.rpt-table tr:first-child td) { background: #f0f0f0; font-weight: 700; text-align: center; }
.doc-body :deep(.rpt-list-item) { padding: 2px 0 2px 20px; position: relative; }
.doc-body :deep(.rpt-list-dot) { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #333; margin-right: 6px; vertical-align: middle; }
.doc-body :deep(.rpt-list-num) { font-weight: 700; margin-right: 4px; color: #c41a1a; }
.doc-body :deep(.rpt-quote) { background: #fafafa; border-left: 3px solid #999; padding: 6px 14px; margin: 8px 0; color: #666; font-size: 12.5px; }
.doc-body :deep(.rpt-para) { height: 12px; }
.doc-body :deep(strong) { color: #c41a1a; }

/* 签章 */
.doc-signature { margin-top: 40px; }
.sig-table { width: 100%; }
.sig-table td { padding: 4px 0; font-size: 12.5px; width: 33%; }

.doc-footer-note { text-align: center; color: #999; font-size: 11px; margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; }

/* 占位符 */
.report-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 500px; text-align: center; padding: 40px; }
.rp-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.4; }
.report-placeholder h3 { margin: 0 0 10px; color: #666; font-size: 1rem; }
.report-placeholder p { margin: 3px 0; font-size: 0.82rem; color: #999; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
</style>
