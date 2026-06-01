<template>
  <div class="dashboard-container">
    <h2>农场管理仪表盘</h2>
    
    <!-- 关键指标卡片 -->
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>总面积</h3>
        <p class="metric-value">{{ metrics.totalArea?.toFixed(2) || 0 }} 亩</p>
      </div>
      <div class="metric-card">
        <h3>已种植面积</h3>
        <p class="metric-value">{{ metrics.plantedArea?.toFixed(2) || 0 }} 亩</p>
      </div>
      <div class="metric-card">
        <h3>闲置面积</h3>
        <p class="metric-value">{{ metrics.idleArea?.toFixed(2) || 0 }} 亩</p>
      </div>
      <div class="metric-card">
        <h3>品种数量</h3>
        <p class="metric-value">{{ metrics.varietyCount || 0 }}</p>
      </div>
      <div class="metric-card">
        <h3>员工总数</h3>
        <p class="metric-value">{{ metrics.staffCount || 0 }}</p>
      </div>
      <div class="metric-card">
        <h3>在职员工</h3>
        <p class="metric-value">{{ metrics.activeStaffCount || 0 }}</p>
      </div>
    </div>

    <!-- 地块状态分布 -->
    <div class="chart-container">
      <h3>地块状态分布</h3>
      <div v-if="plotDistribution.length > 0">
        <div v-for="item in plotDistribution" :key="item.status" class="distribution-item">
          <span class="status-label">{{ item.status }}</span>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: (item.count / metrics.plotCount * 100) + '%' }"
            ></div>
          </div>
          <span class="count">{{ item.count }} 块 ({{ item.area?.toFixed(2) }} 亩)</span>
        </div>
      </div>
    </div>

    <!-- 品种类别分布 -->
    <div class="chart-container">
      <h3>品种类别分布</h3>
      <div v-if="varietyDistribution.length > 0">
        <div v-for="item in varietyDistribution" :key="item.category" class="distribution-item">
          <span class="category-label">{{ item.category }}</span>
          <div class="progress-bar">
            <div 
              class="progress-fill category" 
              :style="{ width: (item.count / metrics.varietyCount * 100) + '%' }"
            ></div>
          </div>
          <span class="count">{{ item.count }} 种</span>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="activity-container">
      <h3>最近活动</h3>
      <ul v-if="recentActivities.length > 0">
        <li v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <span class="activity-action">{{ activity.action }}</span>
          <span class="activity-user">{{ activity.user }}</span>
          <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
        </li>
      </ul>
      <p v-else>暂无最近活动</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDashboardMetrics, getPlotStatusDistribution, getVarietyCategoryDistribution, getRecentActivities } from '../services/dashboard.service';

interface DashboardMetrics {
  totalArea: number;
  plantedArea: number;
  idleArea: number;
  varietyCount: number;
  staffCount: number;
  plotCount: number;
  activeStaffCount: number;
}

interface DistributionItem {
  status?: string;
  category?: string;
  count: number;
  area?: number;
}

interface Activity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

const metrics = ref<DashboardMetrics>({
  totalArea: 0,
  plantedArea: 0,
  idleArea: 0,
  varietyCount: 0,
  staffCount: 0,
  plotCount: 0,
  activeStaffCount: 0,
});

const plotDistribution = ref<DistributionItem[]>([]);
const varietyDistribution = ref<DistributionItem[]>([]);
const recentActivities = ref<Activity[]>([]);

const loadDashboardData = async () => {
  try {
    const [metricsData, plotData, varietyData, activitiesData] = await Promise.all([
      getDashboardMetrics(),
      getPlotStatusDistribution(),
      getVarietyCategoryDistribution(),
      getRecentActivities(10),
    ]);

    metrics.value = metricsData;
    plotDistribution.value = plotData;
    varietyDistribution.value = varietyData;
    recentActivities.value = activitiesData;
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
  }
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.dashboard-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.metric-card h3 {
  color: #606266;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #409eff;
  margin: 0;
}

.chart-container, .activity-container {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.chart-container h3, .activity-container h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.distribution-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.8rem;
  gap: 1rem;
}

.status-label, .category-label {
  min-width: 80px;
  font-weight: 600;
  color: #606266;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background-color: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #409eff;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-fill.category {
  background-color: #67c23a;
}

.count {
  min-width: 120px;
  text-align: right;
  color: #909399;
  font-size: 0.9rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid #ebeef5;
}

.activity-action {
  font-weight: 600;
  color: #2c3e50;
}

.activity-user {
  color: #606266;
}

.activity-time {
  color: #909399;
  font-size: 0.9rem;
}
</style>
