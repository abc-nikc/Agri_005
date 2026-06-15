<template>
  <div class="map-page">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><MapLocation /></el-icon> 基地数字地图</h2>
        <span class="page-badge">实时可视化地块管理</span>
      </div>
      <div class="header-actions">
        <el-select v-model="selectedRegion" placeholder="按区域筛选" clearable size="small" style="width:130px">
          <el-option v-for="r in regions" :key="r" :label="r" :value="r" />
        </el-select>
        <el-select v-model="selectedStatus" placeholder="按状态筛选" clearable size="small" style="width:110px">
          <el-option label="使用中" value="使用中" />
          <el-option label="闲置" value="闲置" />
          <el-option label="休耕" value="休耕" />
        </el-select>
        <el-button-group size="small">
          <el-button :type="mapLayer === 'satellite' ? 'primary' : ''" @click="switchLayer('satellite')">卫星</el-button>
          <el-button :type="mapLayer === 'hybrid' ? 'primary' : ''" @click="switchLayer('hybrid')">混合</el-button>
          <el-button :type="mapLayer === 'street' ? 'primary' : ''" @click="switchLayer('street')">地图</el-button>
        </el-button-group>
        <el-button size="small" @click="resetView" round>
          <el-icon><Aim /></el-icon> 复位
        </el-button>
      </div>
    </div>

    <div class="map-layout">
      <!-- 真实地图 -->
      <div class="map-main">
        <div class="leaflet-container" ref="mapContainer"></div>
        <!-- 图例 -->
        <div class="map-legend-card">
          <div class="legend-title">地块状态</div>
          <div class="legend-items">
            <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span> 使用中</span>
            <span class="legend-item"><span class="legend-dot" style="background:#94a3b8"></span> 闲置</span>
            <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span> 休耕</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span> 告警</span>
          </div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="map-sidebar">
        <div v-if="selectedPlot" class="detail-card">
          <div class="detail-header">
            <h3>{{ selectedPlot.plotNumber }}</h3>
            <el-tag :type="statusTagType(selectedPlot.status)" size="small" effect="dark" round>{{ selectedPlot.status }}</el-tag>
          </div>
          <div class="detail-fields">
            <div class="df"><label>面积</label><span>{{ selectedPlot.area }} 亩</span></div>
            <div class="df"><label>土壤类型</label><span>{{ selectedPlot.soilType || '未知' }}</span></div>
            <div class="df"><label>区域</label><span>{{ selectedPlot.region }}</span></div>
            <div class="df"><label>当前品种</label><span>{{ getVarietyName(selectedPlot.currentVarietyId) || '无' }}</span></div>
          </div>

          <!-- 传感器数据 -->
          <div class="sensor-section" v-if="plotSensors[selectedPlot.id]">
            <h4>实时传感器数据</h4>
            <div class="sensor-grid">
              <div v-for="(val, type) in plotSensors[selectedPlot.id]" :key="type" class="sensor-card" :class="{ abnormal: isSensorAbnormal(type, val) }">
                <div class="sensor-icon">{{ sensorIcon(type) }}</div>
                <div class="sensor-info">
                  <div class="sensor-label">{{ sensorLabel(type) }}</div>
                  <div class="sensor-value">{{ val.toFixed(1) }} <small>{{ sensorUnit(type) }}</small></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 关联设备 -->
          <div class="equip-section" v-if="plotEquipment[selectedPlot.id]?.length">
            <h4>关联设备</h4>
            <div v-for="eq in plotEquipment[selectedPlot.id]" :key="eq.id" class="equip-row" :class="{ offline: eq.status !== '正常' }">
              <span class="equip-icon">{{ eq.type === '灌溉设备' ? '💧' : '📡' }}</span>
              <span class="equip-name">{{ eq.equipmentNumber }}</span>
              <span class="equip-status">{{ eq.status }}</span>
            </div>
          </div>

          <el-button class="close-detail-btn" size="small" @click="selectedPlot = null" round>关闭</el-button>
        </div>

        <!-- 全场概览 -->
        <div v-else class="overview-card">
          <h3>基地概览</h3>
          <div class="overview-stats">
            <div class="os-item"><div class="os-val">{{ plots.length }}</div><div class="os-label">总地块</div></div>
            <div class="os-item"><div class="os-val">{{ totalArea }}</div><div class="os-label">总面积(亩)</div></div>
            <div class="os-item"><div class="os-val os-green">{{ activePlotCount }}</div><div class="os-label">使用中</div></div>
            <div class="os-item"><div class="os-val os-gray">{{ plots.length - activePlotCount }}</div><div class="os-label">闲置</div></div>
          </div>
          <p class="overview-hint">点击地图上的地块标记查看详情</p>

          <!-- 地块列表 -->
          <div class="plot-list-section">
            <h4>地块列表</h4>
            <div v-for="plot in filteredPlots" :key="plot.id" class="plot-list-item" @click="flyToPlot(plot)">
              <span class="pli-status" :class="'dot-' + plotStatusClass(plot.status)"></span>
              <span class="pli-name">{{ plot.plotNumber }}</span>
              <span class="pli-area">{{ plot.area }}亩</span>
              <span class="pli-variety">{{ getVarietyName(plot.currentVarietyId) || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { plotService } from '@/services/plot.service';
import { varietyService } from '@/services/variety.service';

// ===== 类型 =====
interface PlotItem {
  id: string;
  plotNumber: string;
  area: number;
  status: string;
  soilType?: string;
  region: string;
  currentVarietyId?: string;
}
interface EquipmentItem {
  id: string;
  equipmentNumber: string;
  type: string;
  status: string;
  associatedPlotId?: string;
}

// ===== 响应式数据 =====
const plots = ref<PlotItem[]>([]);
const varieties = ref<any[]>([]);
const equipment = ref<EquipmentItem[]>([]);
const selectedPlot = ref<PlotItem | null>(null);
const selectedRegion = ref('');
const selectedStatus = ref('');
const plotSensors = ref<Record<string, Record<string, number>>>({});
const mapContainer = ref<HTMLElement>();

let map: L.Map | null = null;
const markers: L.Marker[] = [];
const mapLayer = ref<string>('satellite');
let satelliteTile: L.TileLayer | null = null;
let hybridTile: L.TileLayer | null = null;
let streetTile: L.TileLayer | null = null;

// 地块坐标映射 - 寿光市稻田镇蔬菜大棚区 (典型农田，远离城区和河道)
// 中心点: 36.90, 118.85 — 乡镇农田地带
const FARM_CENTER: [number, number] = [36.900, 118.850];
const plotCoordinates: Record<string, [number, number]> = {
  'A01': [36.903, 118.847],
  'A02': [36.907, 118.844],
  'A03': [36.910, 118.848],
  'B01': [36.900, 118.853],
  'B02': [36.897, 118.857],
  'B03': [36.902, 118.860],
  'C01': [36.895, 118.845],
  'C02': [36.892, 118.848],
  'D01': [36.906, 118.854],
  'D02': [36.910, 118.857],
};

// ===== 计算 =====
const regions = computed(() => [...new Set(plots.value.map(p => p.region))]);
const filteredPlots = computed(() => plots.value.filter(p => {
  if (selectedRegion.value && p.region !== selectedRegion.value) return false;
  if (selectedStatus.value && p.status !== selectedStatus.value) return false;
  return true;
}));
const totalArea = computed(() => plots.value.reduce((a, p) => a + p.area, 0).toFixed(1));
const activePlotCount = computed(() => plots.value.filter(p => p.status === '使用中').length);

const plotEquipment = computed(() => {
  const result: Record<string, EquipmentItem[]> = {};
  for (const eq of equipment.value) {
    if (eq.associatedPlotId) {
      if (!result[eq.associatedPlotId]) result[eq.associatedPlotId] = [];
      result[eq.associatedPlotId].push(eq);
    }
  }
  return result;
});

function getVarietyName(id?: string) { return varieties.value.find(v => v.id === id)?.name || ''; }

// ===== 传感器工具 =====
const sensorLabels: Record<string, string> = { temperature: '温度', humidity: '湿度', soil_moisture: '土壤湿度', light: '光照', co2: 'CO2', ph: 'pH' };
const sensorIcons: Record<string, string> = { temperature: '🌡️', humidity: '💧', soil_moisture: '🌱', light: '☀️', co2: '🌬️', ph: '🧪' };
const sensorUnits: Record<string, string> = { temperature: '°C', humidity: '%', soil_moisture: '%', light: 'lux', co2: 'ppm', ph: '' };
function sensorLabel(t: string) { return sensorLabels[t] || t; }
function sensorIcon(t: string) { return sensorIcons[t] || '📡'; }
function sensorUnit(t: string) { return sensorUnits[t] || ''; }
function isSensorAbnormal(type: string, val: number): boolean {
  if (type === 'temperature') return val > 35 || val < 5;
  if (type === 'humidity') return val > 90 || val < 20;
  if (type === 'soil_moisture') return val < 20 || val > 85;
  return false;
}

// ===== 状态工具 =====
function statusColor(status: string): string {
  if (status === '使用中') return '#10b981';
  if (status === '闲置') return '#94a3b8';
  if (status === '休耕') return '#f59e0b';
  return '#64748b';
}
function statusTagType(status: string): string {
  if (status === '使用中') return 'success';
  if (status === '闲置') return 'info';
  if (status === '休耕') return 'warning';
  return 'info';
}
function plotStatusClass(status: string): string {
  if (status === '使用中') return 'green';
  if (status === '闲置') return 'gray';
  if (status === '休耕') return 'yellow';
  return 'gray';
}

// ===== 创建自定义图标 =====
function createPlotIcon(plot: PlotItem): L.DivIcon {
  const color = statusColor(plot.status);
  const varietyName = getVarietyName(plot.currentVarietyId);
  const label = plot.plotNumber;
  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:42px;height:42px;border-radius:50%;
        background:${color};border:3px solid #fff;
        box-shadow:0 3px 10px rgba(0,0,0,.25);
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;color:#fff;
        cursor:pointer;transition:transform .2s;
      ">${label}</div>
      ${varietyName ? `<div style="margin-top:2px;font-size:10px;color:#334155;font-weight:600;white-space:nowrap;text-shadow:0 1px 3px #fff,0 1px 3px #fff,0 1px 3px #fff;">${varietyName}</div>` : ''}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'plot-marker',
    iconSize: [42, varietyName ? 56 : 42],
    iconAnchor: [21, 21],
  });
}

// ===== 初始化地图 =====
function initMap() {
  if (!mapContainer.value || map) return;

  map = L.map(mapContainer.value, {
    center: FARM_CENTER,
    zoom: 14,
    zoomControl: false,
    attributionControl: false,
  });

  // 缩放控件放右下
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // 归属信息
  L.control.attribution({ position: 'bottomleft', prefix: false })
    .addAttribution('&copy; <a href="https://www.esri.com/">Esri</a> | <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
    .addTo(map);

  // 卫星图层（默认）
  satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
  }).addTo(map);

  // 混合图层（卫星+地名标注）
  hybridTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
  });
  const hybridLabels = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.5,
  });

  // 街道图层（高德中文）
  streetTile = L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 18,
  });

  updateMarkers();
}

function switchLayer(type: string) {
  if (!map) return;
  mapLayer.value = type;
  // 清除所有图层
  if (satelliteTile) map.removeLayer(satelliteTile);
  if (streetTile) map.removeLayer(streetTile);
  // 添加选中的图层
  if (type === 'satellite') {
    satelliteTile?.addTo(map);
  } else if (type === 'street') {
    streetTile?.addTo(map);
  }
  // hybrid 跟 satellite 一样，后续可叠加标注
  if (type === 'hybrid') {
    satelliteTile?.addTo(map);
  }
}

// ===== 更新标记 =====
function updateMarkers() {
  if (!map) return;

  // 清除旧标记
  markers.forEach(m => map!.removeLayer(m));
  markers.length = 0;

  const plotsToShow = filteredPlots.value;
  const bounds: L.LatLngBounds = L.latLngBounds([]);

  plotsToShow.forEach(plot => {
    const coord = plotCoordinates[plot.plotNumber];
    if (!coord) return;

    const marker = L.marker(coord, { icon: createPlotIcon(plot) });

    const varietyName = getVarietyName(plot.currentVarietyId);
    const sensorData = plotSensors.value[plot.id];
    const sensorHtml = sensorData ? Object.entries(sensorData).map(([t, v]) =>
      `<div style="display:flex;align-items:center;gap:4px;margin:2px 0;">
        <span>${sensorIcon(t)}</span>
        <span style="color:#475569">${sensorLabel(t)}</span>
        <span style="font-weight:700;color:${isSensorAbnormal(t, v) ? '#ef4444' : '#1e293b'}">${v.toFixed(1)}${sensorUnit(t)}</span>
      </div>`
    ).join('') : '<div style="color:#94a3b8;font-size:12px;">暂无传感器数据</div>';

    marker.bindPopup(`
      <div style="min-width:200px;font-family:system-ui,-apple-system,sans-serif;">
        <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${statusColor(plot.status)}"></span>
          ${plot.plotNumber}
          <span style="font-size:11px;font-weight:500;color:#64748b;margin-left:auto;">${plot.area}亩</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px;color:#475569;margin-bottom:8px;">
          <div>区域: <b>${plot.region}</b></div>
          <div>状态: <b style="color:${statusColor(plot.status)}">${plot.status}</b></div>
          <div>土壤: <b>${plot.soilType || '未知'}</b></div>
          <div>品种: <b style="color:#6366f1">${varietyName || '无'}</b></div>
        </div>
        <div style="border-top:1px solid #e2e8f0;padding-top:6px;">
          <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px;">实时传感器</div>
          ${sensorHtml}
        </div>
      </div>
    `, { className: 'plot-popup', maxWidth: 280 });

    marker.on('click', () => {
      selectedPlot.value = plot;
    });

    marker.addTo(map);
    markers.push(marker);
    bounds.extend(coord);
  });

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }
}

// ===== 飞到地块 =====
function flyToPlot(plot: PlotItem) {
  if (!map) return;
  const coord = plotCoordinates[plot.plotNumber];
  if (coord) {
    map.flyTo(coord, 16, { duration: 0.8 });
    selectedPlot.value = plot;
  }
}

// ===== 复位视图 =====
function resetView() {
  if (!map) return;
  selectedPlot.value = null;
  updateMarkers();
}

// ===== 监听筛选变化 =====
watch([selectedRegion, selectedStatus], () => {
  updateMarkers();
});

// ===== 生命周期 =====
onMounted(async () => {
  try { plots.value = (await plotService.getAll() as any) || []; } catch {}
  try { varieties.value = await varietyService.getVarieties(); } catch {}

  try {
    const { apiClient } = await import('@/services/api-client');
    const res = await apiClient.get('/equipment');
    equipment.value = res.data.data?.items || res.data.data || [];
  } catch {}

  try {
    const { apiClient } = await import('@/services/api-client');
    const res = await apiClient.get('/iot/sensors');
    const items = res.data.data?.items || res.data.data || [];
    for (const s of items) {
      if (!plotSensors.value[s.plotId]) plotSensors.value[s.plotId] = {};
      plotSensors.value[s.plotId][s.sensorType] = Number(s.value);
    }
  } catch {}

  await nextTick();
  initMap();
});

onUnmounted(() => {
  if (map) { map.remove(); map = null; }
});
</script>

<style scoped>
.map-page { padding: 20px; height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left h2 { margin: 0; font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px; color: #1e293b; }
.page-badge { background: rgba(16,185,129,0.1); color: #059669; padding: 3px 12px; border-radius: 14px; font-size: 0.72rem; font-weight: 600; }
.header-actions { display: flex; gap: 8px; align-items: center; }

/* 布局 */
.map-layout { display: grid; grid-template-columns: 1fr 360px; gap: 16px; flex: 1; min-height: 0; }
@media (max-width: 1000px) { .map-layout { grid-template-columns: 1fr; } }

/* 地图 */
.map-main { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.leaflet-container { width: 100%; height: 100%; min-height: 500px; }

/* 图例卡片 */
.map-legend-card {
  position: absolute; bottom: 16px; left: 16px; z-index: 1000;
  background: rgba(255,255,255,.95); backdrop-filter: blur(8px);
  border-radius: 10px; padding: 10px 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,.1); border: 1px solid #e2e8f0;
}
.legend-title { font-size: .72rem; font-weight: 700; color: #475569; margin-bottom: 6px; }
.legend-items { display: flex; gap: 12px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: .72rem; color: #64748b; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.1); }

/* 右侧面板 */
.map-sidebar { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }

.detail-card, .overview-card {
  background: #fff; border-radius: 14px; padding: 20px;
  border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,.04);
  animation: fadeInUp 0.3s ease;
}
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.detail-header h3 { margin: 0; font-size: 1.05rem; color: #1e293b; }
.detail-fields { display: grid; gap: 8px; margin-bottom: 16px; }
.df { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: .85rem; }
.df label { color: #94a3b8; }
.df span { font-weight: 600; color: #334155; }
.close-detail-btn { width: 100%; margin-top: 12px; }

/* 传感器 */
.sensor-section, .equip-section { margin-top: 16px; }
.sensor-section h4, .equip-section h4 { margin: 0 0 10px; font-size: .85rem; color: #475569; font-weight: 600; }
.sensor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sensor-card {
  display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #e2e8f0; transition: all .2s;
}
.sensor-card.abnormal { border-color: rgba(239,68,68,.3); background: #fef2f2; }
.sensor-icon { font-size: 1.3rem; }
.sensor-label { font-size: .7rem; color: #94a3b8; }
.sensor-value { font-size: .95rem; font-weight: 700; color: #1e293b; }
.sensor-value small { font-weight: 400; color: #94a3b8; font-size: .72rem; }

/* 设备 */
.equip-row {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px;
  font-size: .82rem; margin-bottom: 4px; background: #f8fafc;
}
.equip-row.offline { opacity: .6; }
.equip-icon { font-size: 1.1rem; }
.equip-name { flex: 1; font-weight: 500; color: #334155; }
.equip-status { font-size: .72rem; font-weight: 600; color: #10b981; }
.equip-row.offline .equip-status { color: #ef4444; }

/* 概览 */
.overview-card h3 { margin: 0 0 16px; font-size: 1rem; color: #1e293b; }
.overview-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.os-item { text-align: center; padding: 12px 6px; border-radius: 10px; background: #f8fafc; }
.os-val { font-size: 1.4rem; font-weight: 700; color: #059669; }
.os-val.os-green { color: #10b981; }
.os-val.os-gray { color: #94a3b8; }
.os-label { font-size: .72rem; color: #94a3b8; margin-top: 2px; }
.overview-hint { text-align: center; color: #94a3b8; font-size: .8rem; margin-top: 14px; }

/* 地块列表 */
.plot-list-section { margin-top: 16px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
.plot-list-section h4 { margin: 0 0 8px; font-size: .82rem; color: #475569; font-weight: 600; }
.plot-list-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px;
  cursor: pointer; transition: all .2s; font-size: .82rem; margin-bottom: 2px;
}
.plot-list-item:hover { background: #f0fdf4; }
.pli-status { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #10b981; }
.dot-gray { background: #94a3b8; }
.dot-yellow { background: #f59e0b; }
.pli-name { font-weight: 600; color: #1e293b; }
.pli-area { font-size: .75rem; color: #94a3b8; }
.pli-variety { font-size: .75rem; color: #6366f1; margin-left: auto; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<style>
/* 全局样式 - Leaflet弹窗美化 (不能scoped) */
.plot-popup .leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  box-shadow: 0 8px 30px rgba(0,0,0,.15) !important;
  padding: 2px !important;
}
.plot-popup .leaflet-popup-content { margin: 14px 16px !important; }
.plot-popup .leaflet-popup-tip { box-shadow: 0 4px 12px rgba(0,0,0,.1) !important; }

.plot-marker { background: none !important; border: none !important; }
</style>
