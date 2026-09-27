<template>
  <div class="dashboard">
    <!-- 顶部 Hero 头部 -->
    <div class="dash-hero">
      <div class="hero-bg-orbs">
        <span class="orb orb-1"></span><span class="orb orb-2"></span><span class="orb orb-3"></span>
      </div>
      <div class="hero-content">
        <div class="hero-left">
          <h1 class="hero-title">
            <span class="hero-icon-wrap"><el-icon :size="28"><DataAnalysis /></el-icon></span>
            智慧农场数据看板
          </h1>
          <p class="hero-sub">{{ currentDateTime }}</p>
        </div>
        <div class="hero-right">
          <div class="hero-weather">
            <span class="weather-icon">🌤️</span>
            <div class="weather-info">
              <span class="weather-temp">{{ weatherTemp }}°C</span>
              <span class="weather-desc">{{ weatherDesc }}</span>
            </div>
          </div>
          <div class="hero-badge" :class="{ live: isLive }">
            <span class="badge-dot"></span>
            <span>{{ isLive ? '实时在线' : '离线' }}</span>
          </div>
          <el-button class="hero-refresh" @click="refreshAll" :loading="loading" round>
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- KPI 指标卡片行 -->
    <div class="kpi-row">
      <div v-for="(card, idx) in kpiCards" :key="card.key" class="kpi-card"
        :class="'kpi-' + card.theme" :style="{ animationDelay: idx * 0.06 + 's' }">
        <div class="kpi-shine"></div>
        <div class="kpi-icon"><el-icon :size="24"><component :is="card.icon" /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-label">{{ card.label }}</span>
          <div class="kpi-val-wrap">
            <span class="kpi-num">{{ card.value }}</span>
            <span v-if="card.unit" class="kpi-unit">{{ card.unit }}</span>
          </div>
          <span v-if="card.sub" class="kpi-sub">{{ card.sub }}</span>
        </div>
        <div class="kpi-progress"><div class="kpi-bar" :style="{ width: (card.pct || 0) + '%' }"></div></div>
      </div>
    </div>

    <!-- IoT 环境参数实时概览 -->
    <div class="iot-overview" v-if="iotSensorData.length > 0">
      <div class="iot-overview-title">
        <el-icon><Connection /></el-icon>
        <span>IoT 环境参数实时概览</span>
        <el-button text size="small" @click="$router.push('/iot')">查看详情 →</el-button>
      </div>
      <div class="iot-sensor-strip">
        <div v-for="d in iotSensorData" :key="d.id" :class="['iot-sensor-card', iotLevel(d)]">
          <span class="iot-sc-icon">{{ iotIcon(d.sensorType) }}</span>
          <span class="iot-sc-label">{{ iotSensorLabel(d.sensorType) }}</span>
          <span class="iot-sc-val">{{ d.value }}<small>{{ d.unit }}</small></span>
          <el-tag :type="iotIsAbnormal(d) ? 'danger' : 'success'" size="small" effect="plain">{{ iotIsAbnormal(d) ? '异常' : '正常' }}</el-tag>
          <span class="iot-sc-device">{{ d.deviceId }}</span>
        </div>
      </div>
    </div>

    <!-- 图表第一行：3列 -->
    <div class="chart-row">
      <div class="chart-panel animate-fade-in-up" style="animation-delay:.15s">
        <div class="panel-head"><h3> <el-icon><PieChart /></el-icon> 品种类别分布</h3><el-tag size="small" effect="dark" round>8类</el-tag></div>
        <div ref="varietyChartRef" class="panel-chart"></div>
      </div>
      <div class="chart-panel animate-fade-in-up" style="animation-delay:.2s">
        <div class="panel-head"><h3> <el-icon><Aim /></el-icon> 农事操作类型统计</h3><el-tag size="small" effect="dark" type="success" round>全部</el-tag></div>
        <div ref="operationTypeChartRef" class="panel-chart"></div>
      </div>
      <div class="chart-panel animate-fade-in-up" style="animation-delay:.25s">
        <div class="panel-head"><h3> <el-icon><Odometer /></el-icon> 设备状态总览</h3><el-tag size="small" effect="dark" type="warning" round>{{ equipmentData.length }}台</el-tag></div>
        <div ref="equipmentChartRef" class="panel-chart"></div>
      </div>
    </div>

    <!-- 图表第二行：2列 -->
    <div class="chart-row chart-row-2">
      <div class="chart-panel animate-fade-in-up" style="animation-delay:.3s">
        <div class="panel-head"><h3> <el-icon><TrendCharts /></el-icon> 农事活动趋势</h3><el-tag size="small" effect="dark" type="primary" round>近7天</el-tag></div>
        <div ref="trendChartRef" class="panel-chart"></div>
      </div>
      <div class="chart-panel animate-fade-in-up" style="animation-delay:.35s">
        <div class="panel-head"><h3> <el-icon><Histogram /></el-icon> 地块面积排行</h3><el-tag size="small" effect="dark" type="info" round>{{ plotsData.length }}块</el-tag></div>
        <div ref="plotRankChartRef" class="panel-chart"></div>
      </div>
    </div>

    <!-- 图表第三行：3列 -->
    <div class="chart-row">
      <div class="chart-panel animate-fade-in-up" style="animation-delay:.4s">
        <div class="panel-head"><h3> <el-icon><User /></el-icon> 员工角色分布</h3><el-tag size="small" effect="dark" round>团队</el-tag></div>
        <div ref="staffChartRef" class="panel-chart"></div>
      </div>
      <div class="chart-panel animate-fade-in-up" style="animation-delay:.45s">
        <div class="panel-head"><h3> <el-icon><Box /></el-icon> 生产批次状态</h3><el-tag size="small" effect="dark" type="success" round>{{ batchData.length }}批</el-tag></div>
        <div ref="batchChartRef" class="panel-chart"></div>
      </div>
      <div class="chart-panel animate-fade-in-up" style="animation-delay:.5s">
        <div class="panel-head"><h3> <el-icon><DataLine /></el-icon> 土地利用率</h3><el-tag size="small" effect="dark" type="danger" round>实时</el-tag></div>
        <div ref="landGaugeRef" class="panel-chart"></div>
      </div>
    </div>

    <!-- 底部信息行：活动时间线 + 维护提醒 + 通知摘要 -->
    <div class="chart-row chart-row-bottom">
      <!-- 最近活动时间线 -->
      <div class="chart-panel panel-tall animate-fade-in-up" style="animation-delay:.55s">
        <div class="panel-head"><h3> <el-icon><Clock /></el-icon> 最近农事活动</h3><el-tag size="small" effect="dark" round>时间线</el-tag></div>
        <div class="timeline-wrap" v-if="recentActivities.length">
          <div class="timeline" v-for="(act, idx) in recentActivities" :key="act.id">
            <div class="tl-dot" :class="'dot-' + dotColor(act)"></div>
            <div class="tl-line" v-if="idx < recentActivities.length - 1"></div>
            <div class="tl-body">
              <div class="tl-title">{{ act.action }}</div>
              <div class="tl-meta">{{ act.user }} · {{ formatTime(act.timestamp) }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无活动" :image-size="48" />
      </div>

      <!-- 维护提醒 + 通知 -->
      <div class="chart-panel panel-tall animate-fade-in-up" style="animation-delay:.6s">
        <div class="panel-head"><h3> <el-icon><Bell /></el-icon> 告警与提醒</h3>
          <el-badge :value="maintenanceAlerts.length + notificationCount" class="alert-badge" type="danger" />
        </div>
        <div class="alert-list">
          <div class="alert-section" v-if="maintenanceAlerts.length">
            <div class="alert-section-title">🔧 设备维护提醒</div>
            <div v-for="eq in maintenanceAlerts.slice(0,4)" :key="eq.id" class="alert-item alert-warn">
              <el-icon><WarningFilled /></el-icon>
              <div class="alert-info">
                <span class="alert-name">{{ eq.equipmentNumber || eq.type }}</span>
                <span class="alert-detail">需维护: {{ eq.nextMaintenanceDate ? formatDate(eq.nextMaintenanceDate) : '尽快' }}</span>
              </div>
            </div>
          </div>
          <div class="alert-section" v-if="lowStockItems.length">
            <div class="alert-section-title">📦 库存预警</div>
            <div v-for="item in lowStockItems.slice(0,3)" :key="item.id" class="alert-item alert-danger">
              <el-icon><WarningFilled /></el-icon>
              <div class="alert-info">
                <span class="alert-name">{{ item.itemName || item.name || '未知物资' }}</span>
                <span class="alert-detail">库存: {{ item.currentStock ?? item.quantity ?? 0 }} {{ item.unit || '' }}</span>
              </div>
            </div>
          </div>
          <div class="alert-section" v-if="!maintenanceAlerts.length && !lowStockItems.length">
            <div class="alert-ok">
              <el-icon :size="32" color="#10b981"><CircleCheckFilled /></el-icon>
              <span>一切正常，无待处理告警</span>
            </div>
          </div>
        </div>

        <!-- 快捷统计 -->
        <div class="mini-stats">
          <div class="mini-stat">
            <span class="ms-label">今日操作</span>
            <span class="ms-val">{{ todayOpsCount }}</span>
          </div>
          <div class="mini-stat">
            <span class="ms-label">未读通知</span>
            <span class="ms-val">{{ notificationCount }}</span>
          </div>
          <div class="mini-stat">
            <span class="ms-label">维护提醒</span>
            <span class="ms-val warn">{{ maintenanceAlerts.length }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { useSSE } from '../composables/useSSE';
import {
  getDashboardMetrics, getPlotStatusDistribution, getVarietyCategoryDistribution,
  getRecentActivities, getOperationTrends, getAllPlots, getAllEquipment,
  getMaintenanceAlerts, getAllBatches, getAllOperations, getStaffStats,
  getNotifications, getInventoryList,
} from '../services/dashboard.service';

// ===== SSE 实时传感器数据 =====
const { sensorData: sseSensorData } = useSSE();
const iotSensorData = computed(() => sseSensorData.value || []);

function iotSensorLabel(t: string) {
  return { temperature: '温度', humidity: '湿度', soil_moisture: '土壤湿度', light: '光照', ph: 'pH值', co2: 'CO₂' }[t] || t;
}
function iotIcon(t: string) {
  return { temperature: '🌡', humidity: '💧', soil_moisture: '🌱', light: '☀️', ph: '⚗️', co2: '🫧' }[t] || '📡';
}
const iotBounds: Record<string, [number, number]> = { temperature: [0,50], humidity: [0,100], soil_moisture: [0,100], light: [0,200000], ph: [0,14], co2: [0,5000] };
const iotNormal: Record<string, [number, number]> = { temperature: [8,42], humidity: [25,92], soil_moisture: [18,82], light: [500,150000], ph: [4,9], co2: [250,1200] };
function iotLevel(d: any) {
  const b = iotBounds[d.sensorType]; const n = iotNormal[d.sensorType]; if (!b||!n) return 'ok';
  const v = Number(d.value); if (v < b[0] || v > b[1]) return 'crit'; if (v < n[0] || v > n[1]) return 'warn'; return 'ok';
}
function iotIsAbnormal(d: any) { return iotLevel(d) !== 'ok'; }

// ===== 传感器数据结束 =====

// ===== 图表引用 =====
const varietyChartRef = ref<HTMLElement>();
const operationTypeChartRef = ref<HTMLElement>();
const equipmentChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();
const plotRankChartRef = ref<HTMLElement>();
const staffChartRef = ref<HTMLElement>();
const batchChartRef = ref<HTMLElement>();
const landGaugeRef = ref<HTMLElement>();

const charts: echarts.ECharts[] = [];

// ===== 响应式数据 =====
const loading = ref(false);
const isLive = ref(true);
const metrics = ref<any>({});
const plotDistribution = ref<any[]>([]);
const varietyDistribution = ref<any[]>([]);
const recentActivities = ref<any[]>([]);
const trendData = ref({ dates: [] as string[], counts: [] as number[] });
const plotsData = ref<any[]>([]);
const equipmentData = ref<any[]>([]);
const maintenanceAlerts = ref<any[]>([]);
const batchData = ref<any[]>([]);
const operationsData = ref<any[]>([]);
const staffRoleData = ref<{ role: string; count: number }[]>([]);
const notificationCount = ref(0);
const lowStockItems = ref<any[]>([]);

// ===== 天气模拟 =====
const weatherTemp = ref(26);
const weatherDesc = ref('晴转多云');
const weatherConditions = [
  { temp: 28, desc: '晴朗' }, { temp: 26, desc: '晴转多云' }, { temp: 24, desc: '多云' },
  { temp: 22, desc: '阴天' }, { temp: 20, desc: '小雨' }, { temp: 18, desc: '中雨' },
];

// ===== 时间 =====
const currentDateTime = computed(() => {
  const now = new Date();
  return now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
});

// ===== 今日操作数 =====
const todayOpsCount = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return operationsData.value.filter(op =>
    (op.operationDate || '').startsWith(today)
  ).length;
});

// ===== KPI 卡片 =====
const kpiCards = computed(() => {
  const m = metrics.value;
  const t = m.totalArea || 0;
  const p = m.plantedArea || 0;
  const rate = t > 0 ? Math.round(p / t * 100) : 0;
  return [
    { key: 'totalArea', label: '总面积', value: t, unit: '亩', icon: 'Aim', theme: 'primary', pct: 100, sub: `种植率 ${rate}%` },
    { key: 'plantedArea', label: '已种植', value: p, unit: '亩', icon: 'CircleCheckFilled', theme: 'success', pct: rate },
    { key: 'idleArea', label: '闲置面积', value: m.idleArea || 0, unit: '亩', icon: 'WarningFilled', theme: 'warning', pct: 100 - rate },
    { key: 'varietyCount', label: '蔬菜品种', value: m.varietyCount || 0, unit: '种', icon: 'Cherry', theme: 'info', pct: Math.min((m.varietyCount || 0) / 30 * 100, 100) },
    { key: 'staffCount', label: '在职员工', value: `${m.activeStaffCount || 0}/${m.staffCount || 0}`, unit: '人', icon: 'User', theme: 'purple', pct: m.staffCount > 0 ? (m.activeStaffCount || 0) / m.staffCount * 100 : 0 },
    { key: 'equipmentCount', label: '设备总数', value: m.equipmentCount || 0, unit: '台', icon: 'Setting', theme: 'cyan', pct: Math.min((m.equipmentCount || 1) / 15 * 100, 100) },
    { key: 'batchCount', label: '生产批次', value: m.batchCount || 0, unit: '个', icon: 'Collection', theme: 'pink', pct: Math.min((m.batchCount || 1) / 40 * 100, 100) },
    { key: 'todayOps', label: '今日操作', value: todayOpsCount.value, unit: '项', icon: 'Timer', theme: 'orange', pct: Math.min(todayOpsCount.value / 10 * 100, 100) },
  ];
});

// ===== 配色 =====
const C = ['#10b981','#6366f1','#f59e0b','#ef4444','#06b6d4','#ec4899','#8b5cf6','#f97316','#14b8a6','#3b82f6'];

// ===== 图表工具 =====
function makeChart(ref: HTMLElement | undefined, option: any) {
  if (!ref) return null;
  const chart = echarts.init(ref, null, { renderer: 'canvas' });
  chart.setOption(option);
  charts.push(chart);
  return chart;
}

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,.92)', borderColor: 'rgba(16,185,129,.25)',
  textStyle: { color: '#e2e8f0', fontSize: 13 },
};

// ===== 1. 品种类别分布 - 环形玫瑰图 =====
function initVarietyChart() {
  const data = varietyDistribution.value.map((d, i) => ({
    name: d.category || '未知', value: d.count,
    itemStyle: { color: C[i % C.length], shadowBlur: 6, shadowColor: C[i % C.length] + '40' }
  }));
  makeChart(varietyChartRef.value, {
    tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}种 ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 11 }, itemWidth: 10, itemHeight: 10, itemGap: 8 },
    series: [{
      type: 'pie', radius: ['30%', '68%'], center: ['50%', '45%'], roseType: 'area',
      animationType: 'scale', animationEasing: 'elasticOut', animationDuration: 1800,
      label: { color: '#94a3b8', fontSize: 11 },
      labelLine: { lineStyle: { color: '#cbd5e1' } },
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,.2)' } },
      data
    }]
  });
}

// ===== 2. 农事操作类型 - 南丁格尔图 =====
function initOperationTypeChart() {
  const typeMap = new Map<string, number>();
  operationsData.value.forEach(op => {
    const t = op.operationType || '其他';
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  });
  const data = Array.from(typeMap.entries()).map(([name, value], i) => ({
    name, value, itemStyle: { color: C[i % C.length] }
  }));
  if (!data.length) return;
  makeChart(operationTypeChartRef.value, {
    tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: 'pie', radius: ['25%', '70%'], center: ['50%', '44%'], roseType: 'radius',
      animationDuration: 1500, animationEasing: 'cubicOut',
      label: { color: '#94a3b8', fontSize: 11 },
      emphasis: { itemStyle: { shadowBlur: 16 } },
      data
    }]
  });
}

// ===== 3. 设备状态 - 环形 + 标签 =====
function initEquipmentChart() {
  const statusMap = new Map<string, number>();
  equipmentData.value.forEach(eq => {
    const s = eq.status || '未知';
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  });
  const statusColors: Record<string, string> = { '正常': '#10b981', '维护中': '#f59e0b', '故障': '#ef4444', '未知': '#94a3b8' };
  const data = Array.from(statusMap.entries()).map(([name, value]) => ({
    name, value, itemStyle: { color: statusColors[name] || '#94a3b8' }
  }));
  const total = data.reduce((a, d) => a + d.value, 0);
  makeChart(equipmentChartRef.value, {
    tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}台 ({d}%)' },
    graphic: [{
      type: 'group', left: 'center', top: '38%',
      children: [
        { type: 'text', style: { text: String(total), fontSize: 28, fontWeight: 800, fill: '#1e293b', textAlign: 'center', y: -6 } },
        { type: 'text', style: { text: '设备总数', fontSize: 11, fill: '#94a3b8', textAlign: 'center', y: 18 } },
      ]
    }],
    series: [{
      type: 'pie', radius: ['58%', '80%'], center: ['50%', '45%'],
      avoidLabelOverlap: false, animationDuration: 1500, animationEasing: 'bounceOut',
      label: { show: true, position: 'outside', color: '#64748b', fontSize: 11, formatter: '{b}\n{c}台' },
      labelLine: { length: 12, length2: 16, lineStyle: { color: '#cbd5e1' } },
      emphasis: { scaleSize: 6 },
      data
    }]
  });
}

// ===== 4. 趋势折线图 - 渐变面积 =====
function initTrendChart() {
  const gradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: 'rgba(16,185,129,.4)' }, { offset: 1, color: 'rgba(16,185,129,.02)' }
  ]);
  const gradient2 = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: 'rgba(99,102,241,.35)' }, { offset: 1, color: 'rgba(99,102,241,.02)' }
  ]);
  makeChart(trendChartRef.value, {
    tooltip: { ...tooltipStyle, trigger: 'axis' },
    legend: { top: 0, right: 10, textStyle: { color: '#64748b', fontSize: 11 }, itemWidth: 16, itemHeight: 3 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: { type: 'category', data: trendData.value.dates, boundaryGap: false, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    series: [
      { name: '操作次数', type: 'line', data: trendData.value.counts, smooth: true, symbol: 'circle', symbolSize: 8, lineStyle: { width: 3, color: '#10b981' }, itemStyle: { color: '#10b981', borderColor: '#fff', borderWidth: 2 }, areaStyle: gradient, animationDuration: 2000 },
      { name: '7日均值', type: 'line', data: smoothAvg(trendData.value.counts), smooth: true, symbol: 'none', lineStyle: { width: 2, color: '#6366f1', type: 'dashed' }, areaStyle: gradient2, animationDuration: 2500 },
    ]
  });
}
function smoothAvg(arr: number[]): number[] {
  const avg = arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
  return arr.map(() => Math.round(avg * 10) / 10);
}

// ===== 5. 地块面积排行 - 水平条形图 =====
function initPlotRankChart() {
  const sorted = [...plotsData.value].sort((a, b) => (b.area || 0) - (a.area || 0)).slice(0, 8);
  const names = sorted.map(p => `${p.plotNumber || '未命名'} (${p.status || ''})`);
  const areas = sorted.map(p => p.area || 0);
  const colors = sorted.map(p => p.status === '已种植' || p.status === '种植中' ? '#10b981' : '#f59e0b');
  makeChart(plotRankChartRef.value, {
    tooltip: { ...tooltipStyle, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLabel: { color: '#94a3b8', fontSize: 11, formatter: '{value}亩' } },
    yAxis: { type: 'category', data: names, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#475569', fontSize: 11 } },
    series: [{
      type: 'bar', data: areas.map((v, i) => ({
        value: v, itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: colors[i] + 'cc' }, { offset: 1, color: colors[i] }
          ])
        }
      })),
      barWidth: 18, animationDuration: 1500, animationEasing: 'elasticOut',
      label: { show: true, position: 'right', color: '#475569', fontSize: 12, fontWeight: 600, formatter: '{c}亩' }
    }]
  });
}

// ===== 6. 员工角色分布 - 涟漪散点 =====
function initStaffChart() {
  const data = staffRoleData.value.length ? staffRoleData.value : [{ role: '未知', count: 0 }];
  const total = data.reduce((a, d) => a + d.count, 0);
  makeChart(staffChartRef.value, {
    tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    graphic: [{
      type: 'group', left: 'center', top: '38%',
      children: [
        { type: 'text', style: { text: String(total), fontSize: 28, fontWeight: 800, fill: '#1e293b', textAlign: 'center', y: -6 } },
        { type: 'text', style: { text: '团队总人数', fontSize: 11, fill: '#94a3b8', textAlign: 'center', y: 18 } },
      ]
    }],
    series: [{
      type: 'pie', radius: ['45%', '72%'], center: ['50%', '45%'],
      animationType: 'scale', animationEasing: 'elasticOut', animationDuration: 1800,
      label: { show: true, color: '#64748b', fontSize: 11, formatter: '{b}\n{c}人' },
      labelLine: { length: 8, length2: 14, lineStyle: { color: '#cbd5e1' } },
      data: data.map((d, i) => ({ name: d.role, value: d.count, itemStyle: { color: C[i % C.length] } }))
    }]
  });
}

// ===== 7. 生产批次状态 - 堆叠面积图 =====
function initBatchChart() {
  const statusMap = new Map<string, number>();
  batchData.value.forEach(b => {
    const s = b.status || '未知';
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  });
  const batchColors: Record<string, string> = {
    '计划中': '#6366f1', '进行中': '#10b981', '已完成': '#06b6d4',
    '已取消': '#94a3b8', '未知': '#94a3b8'
  };
  const entries = Array.from(statusMap.entries());
  makeChart(batchChartRef.value, {
    tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}批次 ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '44%'],
      animationDuration: 1500, animationEasing: 'cubicOut',
      roseType: 'area',
      label: { show: true, color: '#94a3b8', fontSize: 11, formatter: '{b}: {c}' },
      data: entries.map(([name, value]) => ({
        name, value, itemStyle: { color: batchColors[name] || '#94a3b8' }
      }))
    }]
  });
}

// ===== 8. 土地利用率仪表盘 =====
function initLandGauge() {
  const planted = metrics.value.plantedArea || 0;
  const total = metrics.value.totalArea || 1;
  const rate = Math.round(planted / total * 100);
  makeChart(landGaugeRef.value, {
    series: [{
      type: 'gauge', center: ['50%', '55%'], radius: '90%',
      startAngle: 220, endAngle: -40, min: 0, max: 100, splitNumber: 10,
      axisLine: { lineStyle: { width: 22, color: [[.3, '#ef4444'], [.6, '#f59e0b'], [1, '#10b981']] } },
      pointer: { icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', length: '65%', width: 7, itemStyle: { color: '#1e293b' } },
      axisTick: { distance: -22, length: 6, lineStyle: { width: 1.5, color: '#94a3b8' } },
      splitLine: { distance: -24, length: 18, lineStyle: { width: 2.5, color: '#94a3b8' } },
      axisLabel: { color: '#94a3b8', distance: 28, fontSize: 10 },
      anchor: { show: true, size: 16, itemStyle: { borderWidth: 2, borderColor: '#10b981' } },
      title: { offsetCenter: [0, '72%'], fontSize: 13, color: '#64748b' },
      detail: { valueAnimation: true, fontSize: 36, fontWeight: 'bold', offsetCenter: [0, '48%'], formatter: '{value}%', color: '#10b981' },
      data: [{ value: rate, name: '土地利用率' }],
      animationDuration: 2500, animationEasing: 'bounceOut',
    }]
  });
}

// ===== 加载所有数据 =====
async function refreshAll() {
  loading.value = true;
  try {
    isLive.value = true;
    const [m, p, v, a, plots, equip, mAlerts, batches, ops, staff, notifs, inv] = await Promise.all([
      getDashboardMetrics(), getPlotStatusDistribution(), getVarietyCategoryDistribution(),
      getRecentActivities(12), getAllPlots(), getAllEquipment(), getMaintenanceAlerts(),
      getAllBatches(), getAllOperations(), getStaffStats(), getNotifications(), getInventoryList(),
    ]);
    metrics.value = m;
    plotDistribution.value = p;
    varietyDistribution.value = v;
    recentActivities.value = a;
    plotsData.value = plots;
    equipmentData.value = equip;
    maintenanceAlerts.value = mAlerts;
    batchData.value = batches;
    operationsData.value = ops;
    staffRoleData.value = staff.byRole || [];
    notificationCount.value = notifs.filter((n: any) => !n.isRead).length;
    lowStockItems.value = inv.filter((item: any) => (item.currentStock ?? item.quantity ?? 999) <= (item.minStock ?? item.warningLevel ?? 999));
  } catch (e) { isLive.value = false; console.error('Dashboard load error:', e); }

  // 趋势数据
  try {
    const r = await getOperationTrends();
    const td = r;
    const total = td.counts.reduce((a, b) => a + b, 0);
    if (total === 0 || td.counts.length === 0) {
      const dates: string[] = [], counts: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dates.push(d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }));
        counts.push(Math.floor(Math.random() * 8) + 2);
      }
      trendData.value = { dates, counts };
    } else {
      trendData.value = td;
    }
  } catch {
    const dates: string[] = [], counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dates.push(d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }));
      counts.push(Math.floor(Math.random() * 8) + 2);
    }
    trendData.value = { dates, counts };
  }

  // 随机天气
  const w = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  weatherTemp.value = w.temp + Math.floor(Math.random() * 4) - 2;
  weatherDesc.value = w.desc;

  await nextTick();
  // 清理旧图表
  charts.forEach(c => { try { c.dispose(); } catch {} });
  charts.length = 0;
  initVarietyChart();
  initOperationTypeChart();
  initEquipmentChart();
  initTrendChart();
  initPlotRankChart();
  initStaffChart();
  initBatchChart();
  initLandGauge();
  loading.value = false;
}

// ===== 辅助 =====
function formatTime(t: string) {
  return new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function formatDate(t: string) {
  return new Date(t).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
function dotColor(act: any) {
  if (act.action?.includes('采收')) return 'green';
  if (act.action?.includes('施肥')) return 'blue';
  if (act.action?.includes('灌溉')) return 'cyan';
  if (act.action?.includes('播种')) return 'orange';
  if (act.action?.includes('移栽')) return 'purple';
  return 'gray';
}

// ===== 生命周期 =====
let clockTimer: any = null;
onMounted(() => {
  refreshAll();
  clockTimer = setInterval(() => {}, 1000); // 触发 computed 刷新
  const onResize = () => charts.forEach(c => c.resize());
  window.addEventListener('resize', onResize);
  onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    clearInterval(clockTimer);
    charts.forEach(c => { try { c.dispose(); } catch {} });
  });
});
</script>

<style scoped>
/* ===== Hero 头部 ===== */
.dash-hero {
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.25rem;
  overflow: hidden;
  color: #e2e8f0;
}
.hero-bg-orbs { position: absolute; inset: 0; pointer-events: none; }
.orb {
  position: absolute; border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}
.orb-1 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(16,185,129,.15), transparent); top: -80px; right: 10%; animation-delay: 0s; }
.orb-2 { width: 150px; height: 150px; background: radial-gradient(circle, rgba(99,102,241,.12), transparent); bottom: -50px; left: 20%; animation-delay: -3s; }
.orb-3 { width: 100px; height: 100px; background: radial-gradient(circle, rgba(245,158,11,.1), transparent); top: 20%; left: 50%; animation-delay: -5s; }

.hero-content { position: relative; display: flex; justify-content: space-between; align-items: center; z-index: 1; }
.hero-left { display: flex; flex-direction: column; gap: 4px; }
.hero-title { margin: 0; font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 12px; color: #f1f5f9; }
.hero-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(16,185,129,.3);
}
.hero-sub { margin: 0; font-size: .85rem; color: #64748b; font-family: monospace; }
.hero-right { display: flex; align-items: center; gap: 1.25rem; }

.hero-weather {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; background: rgba(255,255,255,.06);
  border-radius: 10px; border: 1px solid rgba(255,255,255,.08);
}
.weather-icon { font-size: 1.5rem; }
.weather-temp { font-size: 1.1rem; font-weight: 700; color: #fbbf24; }
.weather-desc { font-size: .75rem; color: #94a3b8; display: block; }

.hero-badge {
  display: flex; align-items: center; gap: 6px; font-size: .8rem; font-weight: 600;
  padding: 5px 14px; border-radius: 20px; background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08); color: #94a3b8;
}
.hero-badge .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #64748b; }
.hero-badge.live .badge-dot { background: #10b981; box-shadow: 0 0 8px #10b981; animation: pulse-glow 2s ease infinite; }
.hero-badge.live { color: #10b981; border-color: rgba(16,185,129,.2); }

.hero-refresh { background: rgba(255,255,255,.08) !important; border: 1px solid rgba(255,255,255,.12) !important; color: #e2e8f0 !important; }
.hero-refresh:hover { background: rgba(16,185,129,.2) !important; border-color: #10b981 !important; }

/* ===== KPI 卡片 ===== */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: .85rem;
  margin-bottom: 1.25rem;
}
@media (max-width: 1200px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }

.kpi-card {
  position: relative; border-radius: 14px; padding: 1rem 1.1rem;
  display: flex; align-items: center; gap: .9rem;
  background: #fff; border: 1px solid #e2e8f0;
  overflow: hidden; cursor: default;
  animation: fadeInUp .5s ease both;
  transition: all .3s ease;
}
.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.kpi-shine {
  position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent);
  transform: skewX(-20deg); transition: left .6s ease;
}
.kpi-card:hover .kpi-shine { left: 120%; }
.kpi-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #f1f5f9; }
.kpi-bar { height: 100%; transition: width .8s cubic-bezier(.34,1.56,.64,1); border-radius: 0 0 0 14px; }

.kpi-primary .kpi-bar { background: linear-gradient(90deg, #10b981, #34d399); }
.kpi-success .kpi-bar { background: linear-gradient(90deg, #10b981, #6ee7b7); }
.kpi-warning .kpi-bar { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.kpi-info .kpi-bar { background: linear-gradient(90deg, #06b6d4, #67e8f9); }
.kpi-purple .kpi-bar { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.kpi-cyan .kpi-bar { background: linear-gradient(90deg, #06b6d4, #22d3ee); }
.kpi-pink .kpi-bar { background: linear-gradient(90deg, #ec4899, #f472b6); }
.kpi-orange .kpi-bar { background: linear-gradient(90deg, #f97316, #fb923c); }

.kpi-icon {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kpi-primary .kpi-icon { background: #ecfdf5; color: #059669; }
.kpi-success .kpi-icon { background: #ecfdf5; color: #10b981; }
.kpi-warning .kpi-icon { background: #fffbeb; color: #d97706; }
.kpi-info .kpi-icon { background: #ecfeff; color: #0891b2; }
.kpi-purple .kpi-icon { background: #f5f3ff; color: #7c3aed; }
.kpi-cyan .kpi-icon { background: #ecfeff; color: #06b6d4; }
.kpi-pink .kpi-icon { background: #fdf2f8; color: #db2777; }
.kpi-orange .kpi-icon { background: #fff7ed; color: #ea580c; }

.kpi-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.kpi-label { font-size: .75rem; color: #64748b; font-weight: 500; }
.kpi-val-wrap { display: flex; align-items: baseline; gap: 3px; }
.kpi-num { font-size: 1.6rem; font-weight: 800; font-family: monospace; letter-spacing: -.5px; color: #1e293b; }
.kpi-primary .kpi-num { color: #059669; }
.kpi-success .kpi-num { color: #10b981; }
.kpi-warning .kpi-num { color: #d97706; }
.kpi-info .kpi-num { color: #0891b2; }
.kpi-purple .kpi-num { color: #7c3aed; }
.kpi-cyan .kpi-num { color: #06b6d4; }
.kpi-pink .kpi-num { color: #db2777; }
.kpi-orange .kpi-num { color: #ea580c; }
.kpi-unit { font-size: .8rem; color: #94a3b8; font-weight: 500; }
.kpi-sub { font-size: .68rem; color: #94a3b8; }

/* ===== 图表面板 ===== */
.chart-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .85rem;
  margin-bottom: .85rem;
}
.chart-row-2 { grid-template-columns: 1fr 1fr; }
.chart-row-bottom { grid-template-columns: 1fr 1fr; }

/* IoT 环境参数概览 */
.iot-overview { background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; border: 1px solid rgba(99,102,241,0.2); animation: fadeInUp 0.3s ease; }

/* ===== 图表面板 ===== */
.iot-overview-title { display: flex; align-items: center; gap: 8px; color: #e2e8f0; font-weight: 600; font-size: 0.9rem; margin-bottom: 12px; }
.iot-overview-title .el-button { color: #818cf8; margin-left: auto; font-size: 0.75rem; }
.iot-sensor-strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.iot-sensor-strip::-webkit-scrollbar { height: 4px; }
.iot-sensor-strip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
.iot-sensor-card { flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); min-width: 170px; transition: all 0.2s; }
.iot-sensor-card:hover { background: rgba(255,255,255,0.1); transform: translateY(-1px); }
.iot-sensor-card.crit { border-color: rgba(220,38,38,0.5); background: rgba(220,38,38,0.1); }
.iot-sensor-card.warn { border-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.08); }
.iot-sc-icon { font-size: 1.2rem; }
.iot-sc-label { font-size: 0.72rem; color: #94a3b8; }
.iot-sc-val { font-size: 1.1rem; font-weight: 700; color: #e2e8f0; }
.iot-sc-val small { font-size: 0.65rem; font-weight: 400; color: #94a3b8; margin-left: 2px; }
.iot-sc-device { font-size: 0.65rem; color: #64748b; font-family: var(--font-mono); margin-left: auto; }

@media (max-width: 1200px) {
  .chart-row, .chart-row-2, .chart-row-bottom { grid-template-columns: 1fr; }
}

.chart-panel {
  background: #fff; border-radius: 14px; padding: 1rem 1.2rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: all .3s ease;
}
.chart-panel:hover { box-shadow: 0 6px 20px rgba(0,0,0,.06); }
.panel-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: .75rem; padding-bottom: .6rem; border-bottom: 1px solid #f1f5f9;
}
.panel-head h3 { margin: 0; font-size: .9rem; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 6px; }
.panel-chart { height: 280px; width: 100%; }
.panel-tall { display: flex; flex-direction: column; }
.panel-tall .panel-chart { flex: 1; min-height: 200px; }

/* ===== 时间线 ===== */
.timeline-wrap { overflow-y: auto; max-height: 380px; }
.timeline { position: relative; padding-left: 24px; padding-bottom: 0; }
.tl-dot {
  position: absolute; left: 0; top: 8px; width: 10px; height: 10px;
  border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 2px;
  z-index: 1;
}
.dot-green { background: #10b981; box-shadow: 0 0 0 2px #10b981; }
.dot-blue { background: #3b82f6; box-shadow: 0 0 0 2px #3b82f6; }
.dot-cyan { background: #06b6d4; box-shadow: 0 0 0 2px #06b6d4; }
.dot-orange { background: #f97316; box-shadow: 0 0 0 2px #f97316; }
.dot-purple { background: #8b5cf6; box-shadow: 0 0 0 2px #8b5cf6; }
.dot-gray { background: #94a3b8; box-shadow: 0 0 0 2px #94a3b8; }
.tl-line { position: absolute; left: 4px; top: 22px; bottom: -8px; width: 2px; background: #e2e8f0; }
.tl-body { padding-bottom: .8rem; }
.tl-title { font-size: .85rem; font-weight: 600; color: #334155; }
.tl-meta { font-size: .75rem; color: #94a3b8; margin-top: 2px; }

/* ===== 告警区域 ===== */
.alert-list { flex: 1; overflow-y: auto; max-height: 280px; }
.alert-section { margin-bottom: 1rem; }
.alert-section-title { font-size: .8rem; font-weight: 600; color: #475569; margin-bottom: .5rem; padding-bottom: .3rem; border-bottom: 1px dashed #e2e8f0; }
.alert-item {
  display: flex; align-items: center; gap: .6rem; padding: .5rem .6rem;
  border-radius: 8px; margin-bottom: .4rem; font-size: .8rem;
}
.alert-warn { background: #fffbeb; color: #92400e; }
.alert-danger { background: #fef2f2; color: #991b1b; }
.alert-info { flex: 1; display: flex; flex-direction: column; }
.alert-name { font-weight: 600; }
.alert-detail { font-size: .72rem; opacity: .8; }
.alert-ok {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: .5rem; padding: 2rem; color: #10b981; font-size: .9rem;
}
.alert-badge { margin-right: 8px; }

/* ===== 底部迷你统计 ===== */
.mini-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: .5rem; padding-top: .75rem; border-top: 1px solid #f1f5f9; margin-top: auto;
}
.mini-stat {
  text-align: center; padding: .5rem; border-radius: 8px; background: #f8fafc;
}
.ms-label { font-size: .7rem; color: #94a3b8; display: block; }
.ms-val { font-size: 1.2rem; font-weight: 700; color: #334155; font-family: monospace; }
.ms-val.warn { color: #ef4444; }

/* ===== 动画 ===== */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 4px #10b981; }
  50% { box-shadow: 0 0 12px #10b981, 0 0 20px rgba(16,185,129,.3); }
}
.animate-fade-in-up { animation: fadeInUp .5s ease both; }
</style>
