<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><Cherry /></el-icon> 品种管理</h2>
        <span class="header-count">共 {{ store.varieties.length }} 个品种</span>
      </div>
      <div class="header-actions">
        <input type="file" ref="fileInput" accept=".xlsx,.xls,.csv" style="display:none" @change="handleFileImport" />
        <el-button @click="triggerFileImport" :icon="Upload">批量导入</el-button>
        <el-button type="primary" @click="openCreate" :icon="Plus">添加品种</el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-input v-model="searchQuery" placeholder="搜索品种名称..." clearable @input="handleSearch" :prefix-icon="Search" style="flex:1;max-width:300px" />
      <el-select v-model="categoryFilter" placeholder="全部分类" clearable @change="handleSearch" style="width:140px">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
    </div>

    <div class="content-card">
      <div v-if="store.loading" class="loading-state"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
      <div v-else-if="store.varieties.length === 0" class="empty-state"><el-empty description="暂无品种数据" :image-size="80" /></div>
      <el-table v-else :data="store.varieties" stripe row-key="id">
        <el-table-column prop="name" label="品种名称" min-width="120" />
        <el-table-column prop="category" label="分类" width="100"><template #default="{row}"><el-tag size="small" effect="plain">{{ row.category }}</el-tag></template></el-table-column>
        <el-table-column label="播种季节" min-width="150"><template #default="{row}">{{ Array.isArray(row.sowingSeason) ? row.sowingSeason.join('、') : (row.sowingSeason || '-') }}</template></el-table-column>
        <el-table-column label="生长周期(天)" width="120"><template #default="{row}">{{ row.growthCycle ?? '-' }}</template></el-table-column>
        <el-table-column label="种植密度(株/㎡)" width="140"><template #default="{row}">{{ row.plantingDensity ?? '-' }}</template></el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="editVariety(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <VarietyForm v-if="showCreateDialog || showEditDialog" :variety="editingVariety" :error="store.error" @save="handleSave" @cancel="closeDialogs" />

    <el-dialog v-model="showDeleteDialog" title="确认删除" width="400px" center>
      <p>确定要删除品种 "{{ deletingVariety?.name }}" 吗？</p>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="handleDelete" :loading="store.loading">确定删除</el-button>
      </template>
    </el-dialog>

    <div v-if="store.error" class="error-toast" @click="store.clearError()">{{ store.error }} <el-icon><Close /></el-icon></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Upload, Search } from '@element-plus/icons-vue';
import { useVarietyStore } from '@/stores/variety.store';
import VarietyForm from '@/components/VarietyForm.vue';
import type { Variety } from '@/types/variety';

const categories = ['叶菜类','根茎类','果菜类','花菜类','瓜果类','豆类','香料类','粮食','浆果类'];
const store = useVarietyStore();
const showCreateDialog = ref(false); const showEditDialog = ref(false); const showDeleteDialog = ref(false);
const editingVariety = ref<Variety | null>(null); const deletingVariety = ref<Variety | null>(null);
const searchQuery = ref(''); const categoryFilter = ref(''); const fileInput = ref<HTMLInputElement | null>(null);

onMounted(async () => { await store.fetchVarieties(); });
const openCreate = () => { store.clearError(); editingVariety.value = null; showCreateDialog.value = true; };
const handleSearch = async () => { const params: any = {}; if (searchQuery.value) params.search = searchQuery.value; if (categoryFilter.value) params.category = categoryFilter.value; await store.fetchVarieties(params); };
const editVariety = (variety: Variety) => { editingVariety.value = variety; showEditDialog.value = true; };
const confirmDelete = (variety: Variety) => { deletingVariety.value = variety; showDeleteDialog.value = true; };
const handleSave = async (data: any) => { try { if (showEditDialog.value && editingVariety.value) await store.updateVariety(editingVariety.value.id, data); else await store.createVariety(data); closeDialogs(); } catch {} };
const handleDelete = async () => { if (!deletingVariety.value) return; const backup = { ...deletingVariety.value }; try { await store.deleteVariety(deletingVariety.value.id); showDeleteDialog.value = false; const addUndo = (window as any).__addUndo; if (addUndo) addUndo(backup.id, '删除品种「' + backup.name + '」', async () => { await store.createVariety(backup); }); deletingVariety.value = null; } catch {} };
const closeDialogs = () => { showCreateDialog.value = false; showEditDialog.value = false; editingVariety.value = null; store.clearError(); };
const triggerFileImport = () => { fileInput.value?.click(); };
const handleFileImport = async (event: Event) => { const target = event.target as HTMLInputElement; if (!target.files?.length) return; try { await store.batchImport(target.files[0]); alert('导入成功'); } catch {} finally { target.value = ''; } };
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-left { display: flex; align-items: center; gap: var(--space-md); }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-count { font-size: var(--text-sm); color: var(--color-text-muted); background: var(--color-bg-alt); padding: 3px 12px; border-radius: var(--radius-full); }
.header-actions { display: flex; gap: var(--space-sm); }
.search-bar { display: flex; gap: var(--space-sm); margin-bottom: var(--space-lg); align-items: center; }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.error-toast { position: fixed; bottom: 20px; right: 20px; background: var(--color-danger); color: white; padding: 12px 20px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; cursor: pointer; z-index: 2000; font-size: var(--text-sm); box-shadow: var(--shadow-lg); }
</style>
