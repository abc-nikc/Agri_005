<template>
  <div class="ct">
    <div class="ph"><h2>IoT 物联网监控</h2>
      <span class="mqtt-status" :class="mqttStatus">{{ mqttStatus === 'connected' ? '● MQTT 已连接' : '● MQTT 未连接' }}</span>
    </div>

    <!-- 图例 -->
    <div class="legend-bar">
      <span class="lg"><span class="dot g"></span> 数值正常</span>
      <span class="lg"><span class="dot r"></span> 超出正常范围</span>
      <span class="lg"><span class="dot cr"></span> 超出量程（严重）</span>
      <span class="lg"><span class="dot y"></span> 死值/离线</span>
    </div>

    <div class="filter">
      <select v-model="filterPlotId" @change="loadData"><option value="">全部地块</option><option v-for="p in plots" :key="p.id" :value="p.id">{{ p.plotNumber }} ({{ p.region }})</option></select>
      <span class="refresh" @click="loadData">🔄 刷新</span>
    </div>

    <!-- 异常告警面板 -->
    <div v-if="anomalies.length" class="anomaly-panel">
      <h3>⚠️ 异常告警 ({{ summary.total }}条 — 严重:{{ summary.critical }} 警告:{{ summary.warning }})</h3>
      <div class="anomaly-list">
        <div v-for="a in anomalies" :key="a.deviceId+a.sensorType+a.anomalyType" :class="['anomaly-item', a.severity]">
          <span :class="['sev-tag', a.severity]">{{ a.severity === 'critical' ? '🔴 严重' : '⚠️ 警告' }}</span>
          <span class="anomaly-msg">{{ a.message }}</span>
          <span class="anomaly-time">{{ fmt(a.recordedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 最新传感器数据卡片 -->
    <h3>实时数据</h3>
    <div class="cards" v-if="latest.length">
      <div class="card" :class="cardClass(d)" v-for="d in latest" :key="d.id">
        <span class="label">{{ sensorLabel(d.sensorType) }}</span>
        <b :class="alertClass(d.sensorType, d.value)">{{ d.value }}<small>{{ d.unit }}</small></b>
        <span v-if="isAbnormal(d)" class="anomaly-flag">异常</span>
        <span v-else class="normal-flag">正常</span>
        <span class="meta">{{ d.deviceId }}</span>
        <span class="time">{{ fmt(d.recordedAt) }}</span>
      </div>
    </div>
    <div v-else class="em">暂无传感器数据。请确保 MQTT Broker 运行且设备已连接。</div>

    <!-- 统计图表 -->
    <h3 v-if="filterPlotId && Object.keys(stats).length">24小时统计</h3>
    <div class="stats-grid" v-if="filterPlotId">
      <div class="stat-card" v-for="(v, k) in stats" :key="k">
        <span class="label">{{ sensorLabel(k) }}</span>
        <div class="stats-row"><span>最小值</span><b :class="alertClass(k, v.min)">{{ v.min }}<small>{{ unitMap[k] }}</small></b></div>
        <div class="stats-row"><span>最大值</span><b :class="alertClass(k, v.max)">{{ v.max }}<small>{{ unitMap[k] }}</small></b></div>
        <div class="stats-row"><span>平均值</span><b>{{ v.avg.toFixed(1) }}<small>{{ unitMap[k] }}</small></b></div>
        <div class="mini-chart">
          <div v-for="(p, i) in v.values.filter((_:any,z:number)=>z%Math.ceil(v.values.length/30)===0)" :key="i"
            class="bar" :style="{height: ((p.value / (v.max||1)) * 40)+'px'}"
            :title="p.value+unitMap[k]"></div>
        </div>
      </div>
    </div>

    <!-- 设备控制 -->
    <h3>设备控制</h3>
    <div class="ctrl-panel">
      <div class="ctrl-row">
        <input v-model="ctrl.plotId" placeholder="地块ID" class="ctrl-input" />
        <input v-model="ctrl.deviceId" placeholder="设备ID" class="ctrl-input" />
        <select v-model="ctrl.command" class="ctrl-select">
          <option value="irrigation_on">开启灌溉</option><option value="irrigation_off">关闭灌溉</option>
          <option value="ventilation_on">开启通风</option><option value="ventilation_off">关闭通风</option>
          <option value="pump_on">开启水泵</option><option value="pump_off">关闭水泵</option>
        </select>
        <button class="btn btn-primary" @click="sendCmd" :disabled="sending">{{ sending?'发送中...':'发送指令' }}</button>
      </div>
      <div v-if="ctrlResult" class="ctrl-result">{{ ctrlResult }}</div>
    </div>

    <!-- 历史数据 -->
    <h3>历史数据</h3>
    <table class="data-table" v-if="history.length">
      <thead><tr><th>时间</th><th>传感器</th><th>数值</th><th>设备</th><th>地块</th></tr></thead>
      <tbody><tr v-for="d in history" :key="d.id"><td>{{ fmt(d.recordedAt) }}</td><td>{{ sensorLabel(d.sensorType) }}</td><td :class="alertClass(d.sensorType, d.value)">{{ d.value }}{{ d.unit }}</td><td>{{ d.deviceId }}</td><td>{{ d.plotId }}</td></tr></tbody>
    </table>
    <div v-else class="em">暂无历史数据</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import type { SensorData } from '@/types/sensor';

const latest = ref<SensorData[]>([]);
const history = ref<SensorData[]>([]);
const stats = ref<Record<string, any>>({});
const plots = ref<any[]>([]);
const filterPlotId = ref('');
const mqttStatus = ref('disconnected');
const sending = ref(false);
const ctrlResult = ref('');
const anomalies = ref<any[]>([]);
const summary = ref({ total: 0, warning: 0, critical: 0 });
const ctrl = reactive({ plotId: '', deviceId: '', command: 'irrigation_on' });

const unitMap: Record<string, string> = { temperature: '°C', humidity: '%', soil_moisture: '%', light: 'lux', ph: 'pH', co2: 'ppm' };
const sensorLabel = (t: string) => ({ temperature: '🌡 温度', humidity: '💧 湿度', soil_moisture: '🌱 土壤湿度', light: '☀ 光照', ph: '⚗ pH值', co2: '🫧 CO₂' }[t] || t);

// 量程 + 正常范围
const bounds: Record<string, [number, number]> = { temperature: [0, 50], humidity: [0, 100], soil_moisture: [0, 100], light: [0, 200000], ph: [0, 14], co2: [0, 5000] };
const normal: Record<string, [number, number]> = { temperature: [10, 40], humidity: [30, 90], soil_moisture: [20, 80], light: [1000, 120000], ph: [5, 8], co2: [300, 1000] };

function alertClass(type: string, val: number) {
  const b = bounds[type];
  const n = normal[type];
  if (!b) return '';
  const v = Number(val);
  if (v < b[0] || v > b[1]) return 'cr';   // 超出量程 → 深红
  if (v < n[0] || v > n[1]) return 'r';     // 超出正常范围 → 红色
  return 'g';                                  // 正常 → 绿色
}

function isAbnormal(d: SensorData) {
  return alertClass(d.sensorType, d.value) !== 'g';
}

function cardClass(d: SensorData) {
  const status = alertClass(d.sensorType, d.value);
  if (status === 'cr') return 'card-critical';
  if (status === 'r') return 'card-warning';
  return 'card-normal';
}

onMounted(() => { loadPlots(); loadData(); loadAnomalies(); });

async function loadPlots() { try { const r = await (await import('@/services/plot.service')).plotService.getAll(); plots.value = r; } catch {} }

async function loadData() {
  try {
    const api = (await import('@/services/sensor.service')).sensorService;
    latest.value = await api.latest(filterPlotId.value || undefined);
    history.value = await api.query(filterPlotId.value ? { plotId: filterPlotId.value, limit: 50 } : { limit: 50 });
    if (filterPlotId.value) stats.value = await api.stats(filterPlotId.value);
    mqttStatus.value = latest.value.length > 0 ? 'connected' : 'disconnected';
  } catch { mqttStatus.value = 'disconnected'; }
}

async function loadAnomalies() {
  try {
    const api = (await import('@/services/sensor.service')).sensorService;
    const r = await api.anomalies(filterPlotId.value || undefined);
    anomalies.value = r.anomalies;
    summary.value = r.summary;
  } catch {}
}

async function sendCmd() {
  if (!ctrl.plotId || !ctrl.deviceId) { ctrlResult.value = '请输入地块和设备ID'; return; }
  sending.value = true; ctrlResult.value = '';
  try {
    const api = (await import('@/services/sensor.service')).sensorService;
    await api.sendControl(ctrl.plotId, ctrl.deviceId, ctrl.command);
    ctrlResult.value = `指令 ${ctrl.command} 已发送到 ${ctrl.deviceId}`;
  } catch (e: any) { ctrlResult.value = '发送失败: ' + (e.response?.data?.error || e.message); }
  finally { sending.value = false; }
}

function fmt(d: string) { return new Date(d).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
</script>

<style scoped>
.ct { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.ph h2 { margin: 0; }
.mqtt-status { font-size: 0.9rem; padding: 4px 12px; border-radius: 16px; }
.mqtt-status.connected { background: #e8f5e9; color: #2e7d32; }
.mqtt-status.disconnected { background: #fff3e0; color: #e65100; }

/* 图例 */
.legend-bar { display: flex; gap: 1.5rem; margin-bottom: 1rem; padding: 8px 16px; background: #fafafa; border-radius: 8px; font-size: 0.8rem; }
.lg { display: flex; align-items: center; gap: 4px; color: #1a1a1a; }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.dot.g { background: #67c23a; }
.dot.r { background: #f56c6c; }
.dot.cr { background: #c62828; }
.dot.y { background: #e6a23c; }

/* 异常面板 */
.anomaly-panel { background: #fffbf0; border: 1px solid #f5dab1; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
.anomaly-panel h3 { margin: 0 0 0.75rem; color: #e65100; font-size: 1rem; }
.anomaly-list { display: flex; flex-direction: column; gap: 6px; }
.anomaly-item { display: flex; align-items: center; gap: 0.75rem; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; color: #1a1a1a; }
.anomaly-item.warning { background: #fff3e0; }
.anomaly-item.critical { background: #fce4ec; }
.sev-tag { padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; color: #1a1a1a; }
.sev-tag.warning { background: #fff3cd; }
.sev-tag.critical { background: #ffcdd2; }
.anomaly-msg { flex: 1; }
.anomaly-time { font-size: 0.75rem; color: #909399; white-space: nowrap; }

.filter { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
.filter select { padding: 6px 12px; border: 1px solid #dcdfe6; border-radius: 6px; }
.refresh { cursor: pointer; color: #409eff; font-size: 0.85rem; }
h3 { color: #2c3e50; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #ebeef5; padding-bottom: 0.5rem; }

.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
.card { padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; position: relative; }
.card-normal { background: #e8f5e9; }        /* 绿色背景 — 正常 */
.card-warning { background: #fff3e0; }       /* 橙色背景 — 超出正常范围 */
.card-critical { background: #fce4ec; }      /* 红色背景 — 超出量程 */
.card .label { display: block; font-size: 0.8rem; color: #909399; }
.card b { display: block; font-size: 1.8rem; margin: 4px 0; }
.card b.g { color: #67c23a; }   /* 绿色 — 正常 */
.card b.r { color: #f56c6c; }   /* 红色 — 超出正常范围 */
.card b.cr { color: #c62828; }  /* 深红 — 超出量程 */
.card b small { font-size: 0.8rem; font-weight: normal; margin-left: 2px; }
.card .meta, .card .time { display: block; font-size: 0.75rem; color: #c0c4cc; }
.card .anomaly-flag { display: inline-block; margin-top: 2px; padding: 1px 8px; border-radius: 8px; font-size: 0.7rem; background: #fce4ec; color: #c62828; }
.card .normal-flag { display: inline-block; margin-top: 2px; padding: 1px 8px; border-radius: 8px; font-size: 0.7rem; background: #e8f5e9; color: #1a1a1a; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.stat-card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.stat-card .label { font-weight: 600; display: block; margin-bottom: 0.5rem; }
.stats-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 2px 0; }
.stats-row span { color: #909399; }
.stats-row b { color: #1a1a1a; }
.stats-row b.g { color: #67c23a; }
.stats-row b.r { color: #f56c6c; }
.stats-row b.cr { color: #c62828; }
.stats-row b small { font-size: 0.75rem; font-weight: normal; }
.mini-chart { display: flex; align-items: flex-end; gap: 1px; margin-top: 0.5rem; height: 40px; }
.mini-chart .bar { flex: 1; background: #409eff; border-radius: 2px 2px 0 0; min-width: 2px; opacity: 0.7; }
.ctrl-panel { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.ctrl-row { display: flex; gap: 0.5rem; align-items: center; }
.ctrl-input { padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px; width: 180px; }
.ctrl-select { padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px; }
.ctrl-result { margin-top: 0.5rem; font-size: 0.85rem; color: #409eff; }
.data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
.data-table th { background: #f5f7fa; padding: 8px; text-align: left; font-size: 0.85rem; }
.data-table td { padding: 8px; border-bottom: 1px solid #ebeef5; font-size: 0.85rem; }
.data-table td.g { color: #67c23a; }
.data-table td.r { color: #f56c6c; }
.data-table td.cr { color: #c62828; font-weight: 600; }
.em { text-align: center; padding: 2rem; color: #909399; }
.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary { background: #409eff; color: white; }
.btn:disabled { opacity: 0.6; }
</style>
