<template>
  <div class="plot-management">
    <div class="page-header">
      <h2>地块管理</h2>
      <button @click="showCreateDialog = true" class="btn-primary">
        添加地块
      </button>
    </div>

    <!-- 地块列表 -->
    <div v-if="plotStore.loading" class="loading">加载中...</div>
    <div v-else-if="plotStore.error" class="error-message">{{ plotStore.error }}</div>
    <div v-else class="plot-list">
      <table class="data-table">
        <thead>
          <tr>
            <th>地块编号</th>
            <th>面积(亩)</th>
            <th>土壤类型</th>
            <th>区域</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plot in plotStore.plots" :key="plot.id">
            <td>{{ plot.plotNumber }}</td>
            <td>{{ plot.area }}</td>
            <td>{{ plot.soilType || '-' }}</td>
            <td>{{ plot.region }}</td>
            <td>
              <span :class="['status-badge', plot.status === '已种植' ? 'status-active' : 'status-idle']">
                {{ plot.status }}
              </span>
            </td>
            <td>
              <button @click="editPlot(plot)" class="btn-small">编辑</button>
              <button @click="deletePlot(plot.id)" class="btn-small btn-danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 创建/编辑对话框 -->
    <PlotForm
      v-if="showCreateDialog || showEditDialog"
      :plot="currentPlot"
      @save="handleSave"
      @cancel="closeDialogs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePlotStore } from '../stores/plot.store';
import PlotForm from '../components/PlotForm.vue';
import type { Plot } from '../types/plot';

const plotStore = usePlotStore();
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const currentPlot = ref<Plot | null>(null);

onMounted(() => {
  plotStore.fetchPlots();
});

const editPlot = (plot: Plot) => {
  currentPlot.value = plot;
  showEditDialog.value = true;
};

const deletePlot = async (id: string) => {
  if (confirm('确定要删除这个地块吗？')) {
    try {
      await plotStore.deletePlot(id);
    } catch (error) {
      alert('删除失败：' + error);
    }
  }
};

const handleSave = async (plotData: any) => {
  try {
    if (currentPlot.value) {
      await plotStore.updatePlot(currentPlot.value.id, plotData);
    } else {
      await plotStore.createPlot(plotData);
    }
    closeDialogs();
  } catch (error) {
    alert('保存失败：' + error);
  }
};

const closeDialogs = () => {
  showCreateDialog.value = false;
  showEditDialog.value = false;
  currentPlot.value = null;
};
</script>

<style scoped>
.plot-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.data-table th,
.data-table td {
  border: 1px solid #ebeef5;
  padding: 12px;
  text-align: left;
}

.data-table th {
  background-color: #f5f7fa;
  color: #606266;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-active {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-idle {
  background-color: #fef0f0;
  color: #f56c6c;
}

.btn-small {
  padding: 5px 10px;
  margin-right: 5px;
  border: 1px solid #dcdfe6;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger {
  color: #f56c6c;
  border-color: #f56c6c;
}

.loading, .error-message {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>
