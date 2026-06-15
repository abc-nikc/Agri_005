<template>
  <div class="iot-page animate-fade-in">
    <!-- 头部 -->
    <div class="iot-header">
      <div class="iot-header-left">
        <h2><el-icon><Connection /></el-icon> IoT 物联网监控中心</h2>
        <p class="iot-subtitle">实时采集 · 智能预警 · 远程控制</p>
      </div>
      <div class="iot-header-right">
        <div class="live-indicator">
          <span class="live-dot"></span>
          <span>{{ autoRefresh ? '实时监控中' : '已暂停' }}</span>
        </div>
        <el-tag :type="mqttStatus === 'connected' ? 'success' : 'danger'" effect="dark" size="small" round>
          {{ mqttStatus === 'connected' ? 'MQTT 在线' : 'MQTT 离线' }}
        </el-tag>
        <el-switch v-model="autoRefresh" active-text="自动刷新" inactive-text="" style="margin-left: 12px" />
      </div>
    </div>

    <!-- 颜色图例 -->
    <div class="legend-strip">
      <span class="lg-item"><span class="lg-dot lg-ok"></span> 正常</span>
      <span class="lg-item"><span class="lg-dot lg-warn"></span> 超出正常范围</span>
      <span class="lg-item"><span class="lg-dot lg-crit"></span> 超出量程（严重）</span>
      <span class="lg-item"><span class="lg-dot lg-off"></span> 离线/死值</span>
      <span class="lg-item" style="margin-left:auto;font-size:0.7rem;color:var(--color-text-muted)">刷新间隔: {{ autoRefresh ? '10秒' : '手动' }}</span>
    </div>

    <!-- 异常告警横幅 -->
    <div v-if="anomalies.length" class="alert-banner">
      <div class="alert-banner-header">
        <el-icon><WarningFilled /></el-icon>
        <span>检测到 {{ summary.total }} 条异常</span>
        <el-tag type="danger" size="small" effect="dark" style="margin-left:8px">严重 {{ summary.critical }}</el-tag>
        <el-tag type="warning" size="small" effect="dark" style="margin-left:4px">警告 {{ summary.warning }}</el-tag>
      </div>
      <div class="alert-banner-list">
        <div v-for="a in anomalies" :key="a.deviceId+a.sensorType+a.anomalyType" :class="['alert-row', a.severity]">
          <el-tag :type="a.severity === 'critical' ? 'danger' : 'warning'" size="small" effect="dark">
            {{ a.severity === 'critical' ? '严重' : '警告' }}
          </el-tag>
          <span class="alert-type">{{ anomalyLabel(a.anomalyType) }}</span>
          <span class="alert-msg">{{ a.message }}</span>
          <span class="alert-time">{{ fmtTime(a.recordedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-row">
      <el-select v-model="filterPlotId" placeholder="全部地块" clearable @change="onFilterChange" style="width: 200px">
        <el-option v-for="p in plots" :key="p.id" :label="`${p.plotNumber} (${p.region || ''})`" :value="p.id" />
      </el-select>
      <el-select v-model="filterSensor" placeholder="全部传感器" clearable @change="onFilterChange" style="width: 140px; margin-left: 8px">
        <el-option v-for="s in sensorOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <el-button :icon="Refresh" @click="refreshAll" :loading="loading" size="small" style="margin-left: 8px">立即刷新</el-button>
      <span style="margin-left: auto; font-size: 0.75rem; color: var(--color-text-muted)">最后更新: {{ lastUpdateTime }}</span>
    </div>

    <!-- 实时数据卡片网格 -->
    <h3 class="sec-title">实时环境数据</h3>
    <div class="sensor-grid" v-if="filteredLatest.length">
      <div v-for="d in filteredLatest" :key="d.id" :class="['sensor-card', cardLevel(d)]">
        <div class="sc-icon">{{ sensorIcon(d.sensorType) }}</div>
        <div class="sc-body">
          <span class="sc-label">{{ sensorLabel(d.sensorType) }}</span>
          <div class="sc-value" :class="valueColor(d)">{{ d.value }}<small>{{ d.unit }}</small></div>
        </div>
        <div class="sc-footer">
          <el-tag :type="isAbnormal(d) ? 'danger' : 'success'" size="small" effect="plain">{{ isAbnormal(d) ? '异常' : '正常' }}</el-tag>
          <span class="sc-device">{{ d.deviceId }}</span>
        </div>
        <div class="sc-time">{{ fmtTime(d.recordedAt) }}</div>
      </div>
    </div>
    <div v-else class="empty-box"><el-empty description="暂无传感器数据" :image-size="60" /></div>

    <!-- 24小时趋势图表 -->
    <div v-if="filterPlotId && Object.keys(stats).length" class="charts-section">
      <h3 class="sec-title">24小时环境趋势</h3>
      <div class="charts-grid">
        <div v-for="(data, sensorType) in stats" :key="sensorType" class="chart-card">
          <div class="chart-header">
            <span class="chart-title">{{ sensorIcon(sensorType) }} {{ sensorLabel(sensorType) }}</span>
            <div class="chart-stats">
              <span class="cs cs-min">Min {{ data.min }}{{ unitMap[sensorType] }}</span>
              <span class="cs cs-avg">Avg {{ data.avg.toFixed(1) }}{{ unitMap[sensorType] }}</span>
              <span class="cs cs-max">Max {{ data.max }}{{ unitMap[sensorType] }}</span>
            </div>
          </div>
          <div :ref="(el: any) => setChartRef(sensorType, el)" class="chart-box"></div>
        </div>
      </div>
    </div>

    <!-- 设备远程控制 -->
    <h3 class="sec-title">设备远程控制</h3>
    <div class="control-panel">
      <div class="ctrl-form">
        <el-form :model="ctrl" inline size="default">
          <el-form-item label="地块">
            <el-select v-model="ctrl.plotId" placeholder="选择地块" style="width: 160px">
              <el-option v-for="p in plots" :key="p.id" :label="p.plotNumber" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备">
            <el-select v-model="ctrl.deviceId" placeholder="选择设备" style="width: 160px">
              <el-option v-for="e in equipment" :key="e.id" :label="`${e.equipmentNumber} (${e.type})`" :value="e.equipmentNumber" />
            </el-select>
          </el-form-item>
          <el-form-item label="指令">
            <el-select v-model="ctrl.command" style="width: 160px">
              <el-option-group label="灌溉">
                <el-option value="irrigation_on" label="开启灌溉"><el-icon style="color:#3b82f6"><CircleCheck /></el-icon> 开启灌溉</el-option>
                <el-option value="irrigation_off" label="关闭灌溉"><el-icon style="color:#ef4444"><CircleClose /></el-icon> 关闭灌溉</el-option>
              </el-option-group>
              <el-option-group label="通风">
                <el-option value="ventilation_on" label="开启通风" />
                <el-option value="ventilation_off" label="关闭通风" />
              </el-option-group>
              <el-option-group label="水泵">
                <el-option value="pump_on" label="开启水泵" />
                <el-option value="pump_off" label="关闭水泵" />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="sendCmd" :loading="sending" :icon="Promotion">发送指令</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div v-if="ctrlLog.length" class="ctrl-log">
        <div class="ctrl-log-title">指令记录</div>
        <div v-for="(log, i) in ctrlLog.slice().reverse().slice(0, 10)" :key="i" class="ctrl-log-item" :class="log.success ? 'success' : 'error'">
          <el-icon :size="14"><component :is="log.success ? 'SuccessFilled' : 'CircleCloseFilled'" /></el-icon>
          <span>{{ cmdLabel(log.command) }} → {{ log.deviceId }} ({{ log.time }})</span>
        </div>
      </div>
    </div>

    <!-- 历史数据表格 -->
    <h3 class="sec-title">传感器历史数据</h3>
    <div class="content-card">
      <el-table v-if="history.length" :data="history" stripe size="small" max-height="400">
        <el-table-column label="采集时间" width="170" fixed>
          <template #default="{ row }">{{ fmtTime(row.recordedAt) }}</template>
        </el-table-column>
        <el-table-column label="传感器" width="120">
          <template #default="{ row }">
            <span>{{ sensorIcon(row.sensorType) }} {{ sensorLabel(row.sensorType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数值" width="120">
          <template #default="{ row }">
            <span :class="valueColor(row)" style="font-weight:600">{{ row.value }}{{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deviceId" label="设备编号" width="130" />
        <el-table-column prop="plotId" label="地块" width="100" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="isAbnormal(row) ? 'danger' : 'success'" size="small" effect="plain">{{ isAbnormal(row) ? '异常' : '正常' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty-box"><el-empty description="暂无历史数据" :image-size="60" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { Refresh, Promotion, WarningFilled, Connection } from '@element-plus/icons-vue';
import { sensorService } from '@/services/sensor.service';
import { plotService } from '@/services/plot.service';
import * as echarts from 'echarts';

const latest = ref<any[]>([]);
const history = ref<any[]>([]);
const stats = ref<Record<string, any>>({});
const plots = ref<any[]>([]);
const equipment = ref<any[]>([]);
const filterPlotId = ref('');
const filterSensor = ref('');
const mqttStatus = ref('disconnected');
const loading = ref(false);
const sending = ref(false);
const anomalies = ref<any[]>([]);
const summary = ref({ total: 0, warning: 0, critical: 0 });
const autoRefresh = ref(true);
const lastUpdateTime = ref('--:--:--');
const ctrlLog = ref<any[]>([]);
const chartRefs: Record<string, any> = {};
let refreshTimer: any = null;

const ctrl = reactive({ plotId: '', deviceId: '', command: 'irrigation_on' });

const unitMap: Record<string, string> = {
  temperature: '°C', humidity: '%', soil_moisture: '%', light: 'lux', ph: 'pH', co2: 'ppm',
};
const sensorOptions = [
  { value: 'temperature', label: '温度' },
  { value: 'humidity', label: '湿度' },
  { value: 'soil_moisture', label: '土壤湿度' },
  { value: 'light', label: '光照' },
  { value: 'ph', label: 'pH值' },
  { value: 'co2', label: 'CO₂' },
];
const bounds: Record<string, [number, number]> = {
  temperature: [0, 50], humidity: [0, 100], soil_moisture: [0, 100],
  light: [0, 200000], ph: [0, 14], co2: [0, 5000],
};
const normal: Record<string, [number, number]> = {
  temperature: [8, 42], humidity: [25, 92], soil_moisture: [18, 82],
  light: [500, 150000], ph: [4, 9], co2: [250, 1200],
};

const filteredLatest = computed(() => {
  let data = latest.value;
  if (filterSensor.value) data = data.filter(d => d.sensorType === filterSensor.value);
  return data;
});

function alertLevel(type: string, val: number) {
  const b = bounds[type]; const n = normal[type];
  if (!b || !n) return 'ok';
  const v = Number(val);
  if (v < b[0] || v > b[1]) return 'critical';
  if (v < n[0] || v > n[1]) return 'warning';
  return 'ok';
}
function valueColor(d: any) {
  const lv = alertLevel(d.sensorType, d.value);
  return lv === 'critical' ? 'vc-crit' : lv === 'warning' ? 'vc-warn' : 'vc-ok';
}
function cardLevel(d: any) { return 'sc-' + alertLevel(d.sensorType, d.value); }
function isAbnormal(d: any) { return alertLevel(d.sensorType, d.value) !== 'ok'; }

function sensorLabel(t: string) {
  return { temperature: '温度', humidity: '湿度', soil_moisture: '土壤湿度', light: '光照', ph: 'pH值', co2: 'CO₂浓度' }[t] || t;
}
function sensorIcon(t: string) {
  return { temperature: '🌡', humidity: '💧', soil_moisture: '🌱', light: '☀️', ph: '⚗️', co2: '🫧' }[t] || '📡';
}
function anomalyLabel(t: string) {
  return { out_of_bounds: '量程越界', out_of_range: '超正常范围', offline: '设备离线', dead_value: '死值' }[t] || t;
}
function cmdLabel(c: string) {
  return { irrigation_on: '开启灌溉', irrigation_off: '关闭灌溉', ventilation_on: '开启通风', ventilation_off: '关闭通风', pump_on: '开启水泵', pump_off: '关闭水泵' }[c] || c;
}
function fmtTime(d: string) {
  if (!d) return '-';
  const t = new Date(d);
  if (isNaN(t.getTime())) return String(d).slice(0, 19).replace('T', ' ');
  return t.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function setChartRef(sensorType: string, el: any) {
  if (el) chartRefs[sensorType] = el;
}

function initCharts() {
  for (const [sensorType, data] of Object.entries(stats.value)) {
    const el = chartRefs[sensorType];
    if (!el) continue;
    const chart = echarts.init(el);
    const values = data.values || [];
    const times = values.map((v: any) => {
      const d = new Date(v.time);
      return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    });
    const vals = values.map((v: any) => v.value);
    const colorMap: Record<string, string> = {
      temperature: '#ef4444', humidity: '#3b82f6', soil_moisture: '#10b981',
      light: '#f59e0b', ph: '#8b5cf6', co2: '#6366f1',
    };
    const color = colorMap[sensorType] || '#6366f1';

    chart.setOption({
      grid: { top: 10, right: 15, bottom: 25, left: 50 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.9)',
        borderColor: color,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>${sensorLabel(sensorType)}: <b>${p.value}</b>${unitMap[sensorType] || ''}`;
        },
      },
      xAxis: {
        type: 'category', data: times, axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, interval: Math.max(0, Math.floor(times.length / 8)) },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      series: [{
        type: 'line', data: vals, smooth: true, showSymbol: false,
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' },
          ]),
        },
      }],
    });
  }
}

async function loadPlots() {
  try { plots.value = await plotService.getAll(); } catch {}
}

async function loadEquipment() {
  try {
    const { default: apiClient } = await import('@/services/api-client');
    const r = await apiClient.get('/equipment');
    equipment.value = r.data.data || [];
  } catch {}
}

async function loadData() {
  loading.value = true;
  try {
    const [latestData, historyData, anomalyData] = await Promise.all([
      sensorService.latest(filterPlotId.value || undefined),
      sensorService.query(filterPlotId.value ? { plotId: filterPlotId.value, limit: 100 } : { limit: 100 }),
      sensorService.anomalies(filterPlotId.value || undefined),
    ]);
    latest.value = latestData;
    history.value = historyData;
    anomalies.value = anomalyData.anomalies;
    summary.value = anomalyData.summary;
    mqttStatus.value = latestData.length > 0 ? 'connected' : 'disconnected';
    lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN');

    if (filterPlotId.value) {
      const statsData = await sensorService.stats(filterPlotId.value, 24);
      stats.value = statsData;
      await nextTick();
      initCharts();
    } else {
      stats.value = {};
    }
  } catch {
    mqttStatus.value = 'disconnected';
  } finally {
    loading.value = false;
  }
}

function onFilterChange() { loadData(); }
function refreshAll() { loadData(); }

async function sendCmd() {
  if (!ctrl.plotId || !ctrl.deviceId) return;
  sending.value = true;
  try {
    await sensorService.sendControl(ctrl.plotId, ctrl.deviceId, ctrl.command);
    ctrlLog.value.push({
      command: ctrl.command, deviceId: ctrl.deviceId,
      success: true, time: new Date().toLocaleTimeString('zh-CN'),
    });
  } catch {
    ctrlLog.value.push({
      command: ctrl.command, deviceId: ctrl.deviceId,
      success: false, time: new Date().toLocaleTimeString('zh-CN'),
    });
  } finally {
    sending.value = false;
  }
}

watch(autoRefresh, (v) => {
  if (v) { refreshTimer = setInterval(loadData, 10000); }
  else { clearInterval(refreshTimer); refreshTimer = null; }
});

onMounted(() => {
  loadPlots();
  loadEquipment();
  loadData();
  refreshTimer = setInterval(loadData, 10000);
});

onUnmounted(() => {
  clearInterval(refreshTimer);
  for (const el of Object.values(chartRefs)) {
    if (el) echarts.getInstanceByDom(el)?.dispose();
  }
});
</script>

<style scoped>
.iot-page { padding: 24px; max-width: 1500px; margin: 0 auto; }
.iot-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.iot-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: var(--color-text); display: flex; align-items: center; gap: 8px; }
.iot-subtitle { margin: 4px 0 0; font-size: 0.8rem; color: var(--color-text-muted); }
.iot-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.live-indicator { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--color-success); font-weight: 600; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-success); animation: live-pulse 1.5s ease-in-out infinite; }
@keyframes live-pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.6); } 50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(16,185,129,0); } }

.legend-strip { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 16px; padding: 8px 16px; background: var(--color-surface); border-radius: var(--radius-sm); border: 1px solid var(--color-border-light); font-size: 0.75rem; }
.lg-item { display: flex; align-items: center; gap: 5px; color: var(--color-text-secondary); }
.lg-dot { width: 10px; height: 10px; border-radius: 50%; }
.lg-ok { background: var(--color-success); } .lg-warn { background: var(--color-warning); } .lg-crit { background: #b71c1c; } .lg-off { background: #9e9e9e; }

.alert-banner { background: linear-gradient(135deg, #fef2f2, #fffbeb); border: 1px solid rgba(245,158,11,0.3); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px; animation: banner-in 0.3s ease; }
@keyframes banner-in { from { opacity: 0; transform: translateY(-8px); } }
.alert-banner-header { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #92400e; margin-bottom: 8px; font-size: 0.9rem; }
.alert-banner-list { display: flex; flex-direction: column; gap: 4px; }
.alert-row { display: flex; align-items: center; gap: 10px; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 0.8rem; }
.alert-row.critical { background: #fee2e2; } .alert-row.warning { background: #fef9c3; }
.alert-type { font-weight: 600; min-width: 60px; } .alert-msg { flex: 1; color: var(--color-text); }
.alert-time { font-size: 0.7rem; color: var(--color-text-muted); font-family: var(--font-mono); }

.filter-row { display: flex; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 4px; }
.sec-title { color: var(--color-text); margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--color-border-light); font-size: 0.95rem; font-weight: 700; }

.sensor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.sensor-card { padding: 14px; border-radius: var(--radius-md); background: var(--color-surface); border: 1px solid var(--color-border-light); transition: all 0.25s; position: relative; overflow: hidden; }
.sensor-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.sc-critical { background: #fee2e2; border-color: #fca5a5; } .sc-warning { background: #fef9c3; border-color: #fde047; }
.sc-icon { font-size: 1.4rem; margin-bottom: 6px; }
.sc-body { display: flex; align-items: baseline; gap: 8px; }
.sc-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); }
.sc-value { font-size: 1.5rem; font-weight: 700; }
.vc-ok { color: var(--color-success); } .vc-warn { color: #f59e0b; } .vc-crit { color: #dc2626; }
.sc-value small { font-size: 0.7rem; font-weight: 400; margin-left: 2px; }
.sc-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.sc-device { font-size: 0.7rem; color: var(--color-text-muted); font-family: var(--font-mono); }
.sc-time { font-size: 0.65rem; color: var(--color-text-muted); margin-top: 4px; }
.empty-box { text-align: center; padding: 30px; }

.charts-section { margin-top: 8px; }
.charts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 12px; }
.chart-card { background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border-light); padding: 14px; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }
.chart-title { font-weight: 600; font-size: 0.85rem; color: var(--color-text); }
.chart-stats { display: flex; gap: 8px; font-size: 0.7rem; }
.cs { padding: 2px 6px; border-radius: 4px; } .cs-min { background: #dbeafe; color: #1d4ed8; }
.cs-avg { background: #dcfce7; color: #15803d; } .cs-max { background: #fee2e2; color: #dc2626; }
.chart-box { width: 100%; height: 200px; }

.control-panel { background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border-light); padding: 16px; }
.ctrl-form { display: flex; flex-wrap: wrap; gap: 4px; }
.ctrl-log { margin-top: 12px; border-top: 1px solid var(--color-border-light); padding-top: 10px; }
.ctrl-log-title { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 6px; font-weight: 600; }
.ctrl-log-item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; padding: 3px 0; }
.ctrl-log-item.success { color: var(--color-success); } .ctrl-log-item.error { color: var(--color-danger); }

.content-card { background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border-light); overflow: hidden; }
</style>
