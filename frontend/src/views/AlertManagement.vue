<template>
  <div class="alert-page animate-fade-in">
    <div class="alert-header">
      <h2><el-icon><AlarmClock /></el-icon> 预警管理中心</h2>
      <el-button :icon="Refresh" @click="loadAll" :loading="loading" size="small">刷新</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card sc-total">
        <div class="sc-val">{{ alertStats.total || 0 }}</div>
        <div class="sc-label">告警总数</div>
      </div>
      <div class="stat-card sc-unresolved">
        <div class="sc-val">{{ alertStats.unresolved || 0 }}</div>
        <div class="sc-label">未处理</div>
      </div>
      <div class="stat-card sc-today">
        <div class="sc-val">{{ alertStats.todayCount || 0 }}</div>
        <div class="sc-label">今日告警</div>
      </div>
      <div class="stat-card sc-critical">
        <div class="sc-val">{{ countBySeverity('critical') }}</div>
        <div class="sc-label">严重告警</div>
      </div>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" @tab-change="onTabChange" class="alert-tabs">
      <el-tab-pane label="告警历史" name="history">
        <!-- 筛选 -->
        <div class="filter-row">
          <el-select v-model="filterSeverity" placeholder="全部级别" clearable size="small" style="width: 120px" @change="loadAlerts">
            <el-option label="严重" value="critical" />
            <el-option label="警告" value="warning" />
          </el-select>
          <el-select v-model="filterType" placeholder="全部类型" clearable size="small" style="width: 120px; margin-left: 8px" @change="loadAlerts">
            <el-option label="量程越界" value="out_of_bounds" />
            <el-option label="超正常范围" value="out_of_range" />
            <el-option label="设备离线" value="offline" />
            <el-option label="死值" value="dead_value" />
          </el-select>
          <el-select v-model="filterResolved" placeholder="全部状态" clearable size="small" style="width: 120px; margin-left: 8px" @change="loadAlerts">
            <el-option label="未处理" value="false" />
            <el-option label="已处理" value="true" />
          </el-select>
        </div>

        <!-- 告警列表 -->
        <div class="alert-list">
          <div v-if="alertRecords.length === 0" class="empty-box"><el-empty description="暂无告警记录" :image-size="60" /></div>
          <div v-for="r in alertRecords" :key="r.id" :class="['alert-item', r.resolved ? 'resolved' : r.severity]">
            <div class="ai-left">
              <el-tag :type="r.severity === 'critical' ? 'danger' : 'warning'" size="small" effect="dark">
                {{ r.severity === 'critical' ? '严重' : '警告' }}
              </el-tag>
              <el-tag size="small" effect="plain" style="margin-left: 4px">{{ anomalyLabel(r.anomalyType) }}</el-tag>
              <span class="ai-msg">{{ r.message }}</span>
            </div>
            <div class="ai-right">
              <span class="ai-device">{{ r.deviceId }}</span>
              <span class="ai-time">{{ fmtTime(r.createdAt) }}</span>
              <el-button v-if="!r.resolved" type="success" size="small" text @click="resolveAlert(r.id)" :loading="r._resolving">处理</el-button>
              <el-tag v-else type="success" size="small" effect="plain">已处理</el-tag>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="alertTotal > pageSize" class="pagination-row">
          <el-pagination small background layout="prev, pager, next" :total="alertTotal" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadAlerts" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="阈值配置" name="thresholds">
        <div class="threshold-desc">配置各传感器的正常范围阈值，超出该范围的数值将触发告警通知。</div>
        <div class="threshold-grid">
          <div v-for="(cfg, sensorType) in thresholds" :key="sensorType" class="threshold-card">
            <div class="tc-header">
              <span class="tc-icon">{{ sensorIcon(sensorType) }}</span>
              <span class="tc-name">{{ cfg.label }}</span>
            </div>
            <div class="tc-body">
              <div class="tc-row">
                <label>下限</label>
                <el-input-number v-model="cfg.min" :min="getAbsMin(sensorType)" :max="cfg.max - 0.01" :step="getStep(sensorType)" size="small" controls-position="right" />
                <span class="tc-unit">{{ cfg.unit }}</span>
              </div>
              <div class="tc-row">
                <label>上限</label>
                <el-input-number v-model="cfg.max" :min="cfg.min + 0.01" :max="getAbsMax(sensorType)" :step="getStep(sensorType)" size="small" controls-position="right" />
                <span class="tc-unit">{{ cfg.unit }}</span>
              </div>
            </div>
            <el-button type="primary" size="small" @click="saveThreshold(sensorType, cfg)" :loading="cfg._saving" style="width: 100%; margin-top: 8px">保存</el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="告警统计" name="statistics">
        <div class="charts-row">
          <div class="chart-box-wrap">
            <h4>告警类型分布</h4>
            <div ref="typeChartEl" style="width: 100%; height: 300px;"></div>
          </div>
          <div class="chart-box-wrap">
            <h4>告警级别分布</h4>
            <div ref="severityChartEl" style="width: 100%; height: 300px;"></div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { Refresh, AlarmClock } from '@element-plus/icons-vue';
import { alertService } from '@/services/alert.service';
import * as echarts from 'echarts';

const activeTab = ref('history');
const loading = ref(false);
const alertRecords = ref<any[]>([]);
const alertTotal = ref(0);
const alertStats = ref<any>({});
const currentPage = ref(1);
const pageSize = 20;
const filterSeverity = ref('');
const filterType = ref('');
const filterResolved = ref('');
const thresholds = ref<Record<string, any>>({});

const typeChartEl = ref<HTMLElement>();
const severityChartEl = ref<HTMLElement>();

function anomalyLabel(t: string) {
  return { out_of_bounds: '量程越界', out_of_range: '超正常范围', offline: '设备离线', dead_value: '死值' }[t] || t;
}
function sensorIcon(t: string) {
  return { temperature: '🌡', humidity: '💧', soil_moisture: '🌱', light: '☀️', ph: '⚗️', co2: '🫧' }[t] || '📡';
}
function fmtTime(d: string) {
  if (!d) return '-';
  const t = new Date(d);
  if (isNaN(t.getTime())) return String(d).slice(0, 19).replace('T', ' ');
  return t.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function countBySeverity(s: string) {
  return alertStats.value.bySeverity?.find((b: any) => b.severity === s)?.count || 0;
}
function getAbsMin(t: string) {
  return { temperature: -50, humidity: 0, soil_moisture: 0, light: 0, ph: 0, co2: 0 }[t] || 0;
}
function getAbsMax(t: string) {
  return { temperature: 100, humidity: 100, soil_moisture: 100, light: 300000, ph: 14, co2: 10000 }[t] || 99999;
}
function getStep(t: string) {
  return { temperature: 1, humidity: 1, soil_moisture: 1, light: 100, ph: 0.1, co2: 10 }[t] || 1;
}

async function loadAlerts() {
  loading.value = true;
  try {
    const params: any = { page: currentPage.value, limit: pageSize };
    if (filterSeverity.value) params.severity = filterSeverity.value;
    if (filterType.value) params.anomalyType = filterType.value;
    if (filterResolved.value) params.resolved = filterResolved.value;
    const r = await alertService.getHistory(params);
    alertRecords.value = r.records.map((rec: any) => ({ ...rec, _resolving: false }));
    alertTotal.value = r.total;
  } catch {} finally { loading.value = false; }
}

async function loadStats() {
  try { alertStats.value = await alertService.getStatistics(); } catch {}
}

async function loadThresholds() {
  try {
    const data = await alertService.getThresholds();
    thresholds.value = Object.fromEntries(
      Object.entries(data).map(([k, v]: any) => [k, { ...v, _saving: false }])
    );
  } catch {}
}

async function resolveAlert(id: string) {
  try {
    await alertService.resolveAlert(id);
    await loadAlerts();
    await loadStats();
  } catch {}
}

async function saveThreshold(sensorType: string, cfg: any) {
  cfg._saving = true;
  try {
    await alertService.updateThreshold(sensorType, cfg.min, cfg.max);
  } finally { cfg._saving = false; }
}

function initStatCharts() {
  if (!typeChartEl.value || !severityChartEl.value) return;
  const typeData = alertStats.value.byType || [];
  const sevData = alertStats.value.bySeverity || [];

  const typeColors: Record<string, string> = { out_of_bounds: '#dc2626', out_of_range: '#f59e0b', offline: '#6b7280', dead_value: '#8b5cf6' };
  const typeLabels: Record<string, string> = { out_of_bounds: '量程越界', out_of_range: '超正常范围', offline: '设备离线', dead_value: '死值' };

  const tChart = echarts.init(typeChartEl.value);
  tChart.setOption({
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.9)' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
      label: { color: '#94a3b8', fontSize: 12 },
      data: typeData.map((d: any) => ({
        value: d.count, name: typeLabels[d.anomalyType] || d.anomalyType,
        itemStyle: { color: typeColors[d.anomalyType] || '#6366f1' },
      })),
    }],
  });

  const sChart = echarts.init(severityChartEl.value);
  sChart.setOption({
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.9)' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
      label: { color: '#94a3b8', fontSize: 12 },
      data: sevData.map((d: any) => ({
        value: d.count, name: d.severity === 'critical' ? '严重' : '警告',
        itemStyle: { color: d.severity === 'critical' ? '#dc2626' : '#f59e0b' },
      })),
    }],
  });
}

function onTabChange(tab: string) {
  if (tab === 'statistics') nextTick(initStatCharts);
}

function loadAll() {
  loadAlerts();
  loadStats();
  loadThresholds();
}

watch(activeTab, (tab) => {
  if (tab === 'statistics') nextTick(initStatCharts);
});

onMounted(loadAll);
</script>

<style scoped>
.alert-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
.alert-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.alert-header h2 { margin: 0; font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }

.stat-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
.stat-card { padding: 16px; border-radius: var(--radius-md); background: var(--color-surface); border: 1px solid var(--color-border-light); text-align: center; }
.sc-val { font-size: 1.8rem; font-weight: 700; }
.sc-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }
.sc-total .sc-val { color: #6366f1; } .sc-unresolved .sc-val { color: #f59e0b; }
.sc-today .sc-val { color: var(--color-primary); } .sc-critical .sc-val { color: #dc2626; }

.alert-tabs { margin-top: 8px; }
.filter-row { display: flex; align-items: center; margin-bottom: 12px; }

.alert-list { display: flex; flex-direction: column; gap: 6px; }
.alert-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--color-surface); border: 1px solid var(--color-border-light); transition: all 0.2s; flex-wrap: wrap; gap: 6px; }
.alert-item.critical { border-left: 3px solid #dc2626; background: #fef2f2; }
.alert-item.warning { border-left: 3px solid #f59e0b; background: #fffbeb; }
.alert-item.resolved { opacity: 0.6; }
.ai-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.ai-msg { font-size: 0.82rem; color: var(--color-text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ai-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ai-device { font-size: 0.72rem; color: var(--color-text-muted); font-family: var(--font-mono); }
.ai-time { font-size: 0.72rem; color: var(--color-text-muted); }

.pagination-row { display: flex; justify-content: center; margin-top: 16px; }
.empty-box { text-align: center; padding: 40px; }

.threshold-desc { font-size: 0.82rem; color: var(--color-text-secondary); margin-bottom: 16px; }
.threshold-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.threshold-card { background: var(--color-surface); border: 1px solid var(--color-border-light); border-radius: var(--radius-md); padding: 14px; }
.tc-header { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.tc-icon { font-size: 1.2rem; }
.tc-name { font-weight: 600; font-size: 0.9rem; }
.tc-body { display: flex; flex-direction: column; gap: 6px; }
.tc-row { display: flex; align-items: center; gap: 8px; }
.tc-row label { width: 40px; font-size: 0.8rem; color: var(--color-text-secondary); flex-shrink: 0; }
.tc-row .el-input-number { flex: 1; }
.tc-unit { font-size: 0.75rem; color: var(--color-text-muted); width: 30px; flex-shrink: 0; }

.charts-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; }
.chart-box-wrap { background: var(--color-surface); border: 1px solid var(--color-border-light); border-radius: var(--radius-md); padding: 16px; }
.chart-box-wrap h4 { margin: 0 0 8px; font-size: 0.85rem; color: var(--color-text); }
</style>
