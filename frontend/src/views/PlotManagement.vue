<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><MapLocation /></el-icon> 地块管理</h2>
        <span class="header-count">共 {{ plotStore.plots.length }} 个地块</span>
      </div>
      <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">添加地块</el-button>
    </div>

    <div v-if="opError" class="op-error" @click="opError = null">
      <el-icon><WarningFilled /></el-icon> {{ opError }}
      <el-icon class="close-icon"><Close /></el-icon>
    </div>

    <div class="content-card">
      <div v-if="plotStore.loading && plotStore.plots.length === 0" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon> 加载中...
      </div>
      <div v-else-if="plotStore.plots.length === 0 && !plotStore.loading" class="empty-state">
        <el-empty description="暂无地块数据" :image-size="80" />
      </div>
      <el-table v-else :data="plotStore.plots" stripe style="width: 100%" row-key="id">
        <el-table-column prop="plotNumber" label="地块编号" min-width="120" />
        <el-table-column prop="area" label="面积(亩)" width="100" />
        <el-table-column prop="soilType" label="土壤类型" min-width="100">
          <template #default="{ row }">{{ row.soilType || '-' }}</template>
        </el-table-column>
        <el-table-column prop="region" label="区域" min-width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已种植' ? 'success' : 'danger'" effect="plain" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editPlot(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deletePlot(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <PlotForm v-if="showCreateDialog || showEditDialog" :plot="currentPlot" @save="handleSave" @cancel="closeDialogs" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { usePlotStore } from '../stores/plot.store';
import PlotForm from '../components/PlotForm.vue';
import type { Plot } from '../types/plot';

const plotStore = usePlotStore();
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const currentPlot = ref<Plot | null>(null);
const opError = ref<string | null>(null);

onMounted(() => { plotStore.fetchPlots(); });

function friendlyError(err: any): string {
  if (err?.response?.status === 403) return '对不起，权限不足，无法执行此操作';
  if (err?.response?.status === 401) return '登录已过期，请重新登录';
  return err?.response?.data?.error || err?.message || '操作失败，请稍后重试';
}

const editPlot = (plot: Plot) => { currentPlot.value = plot; showEditDialog.value = true; };
const deletePlot = async (plot: any) => {
  if (confirm('确定要删除地块 ' + plot.plotNumber + ' 吗？')) {
    const backup = { ...plot };
    try {
      await plotStore.deletePlot(plot.id);
      const addUndo = (window as any).__addUndo;
      if (addUndo) addUndo(plot.id, '删除地块「' + plot.plotNumber + '」', async () => {
        await plotStore.createPlot(backup);
        opError.value = '已撤销删除，地块「' + plot.plotNumber + '」已恢复';
      });
    } catch (error) { opError.value = friendlyError(error); }
  }
};

const handleSave = async (plotData: any) => {
  try {
    if (currentPlot.value) await plotStore.updatePlot(currentPlot.value.id, plotData);
    else await plotStore.createPlot(plotData);
    closeDialogs();
  } catch (error) { opError.value = friendlyError(error); }
};

const closeDialogs = () => { showCreateDialog.value = false; showEditDialog.value = false; currentPlot.value = null; };
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-left { display: flex; align-items: center; gap: var(--space-md); }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-count { font-size: var(--text-sm); color: var(--color-text-muted); background: var(--color-bg-alt); padding: 3px 12px; border-radius: var(--radius-full); }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.op-error { background: var(--color-danger-bg); color: var(--color-danger); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: var(--space-md); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: var(--text-sm); border: 1px solid rgba(239,68,68,0.2); }
.close-icon { margin-left: auto; }
</style>
