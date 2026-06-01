<template>
  <div class="variety-management">
    <div class="page-header">
      <h2>品种管理</h2>
      <div class="header-actions">
        <input
          type="file"
          ref="fileInput"
          accept=".xlsx,.xls,.csv"
          style="display: none"
          @change="handleFileImport"
        />
        <button class="btn btn-secondary" @click="triggerFileImport">
          批量导入
        </button>
        <button class="btn btn-primary" @click="showCreateDialog = true">
          添加品种
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索品种名称..."
        class="search-input"
        @input="handleSearch"
      />
      <select v-model="categoryFilter" @change="handleSearch" class="filter-select">
        <option value="">全部分类</option>
        <option value="叶菜类">叶菜类</option>
        <option value="根茎类">根茎类</option>
        <option value="果菜类">果菜类</option>
        <option value="花菜类">花菜类</option>
        <option value="香料类">香料类</option>
      </select>
    </div>

    <!-- 品种列表 -->
    <div class="table-container" v-if="!store.loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>品种名称</th>
            <th>分类</th>
            <th>播种季节</th>
            <th>生长周期(天)</th>
            <th>种植密度(株/㎡)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="variety in store.varieties" :key="variety.id">
            <td>{{ variety.name }}</td>
            <td>{{ variety.category }}</td>
            <td>{{ Array.isArray(variety.sowingSeason) ? variety.sowingSeason.join('、') : (variety.sowingSeason || '-') }}</td>
            <td>{{ variety.growthCycle ?? '-' }}</td>
            <td>{{ variety.plantingDensity ?? '-' }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="editVariety(variety)">
                编辑
              </button>
              <button class="btn btn-sm btn-danger" @click="confirmDelete(variety)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="store.varieties.length === 0" class="empty-state">
        暂无品种数据
      </div>
    </div>

    <div v-if="store.loading" class="loading">加载中...</div>

    <!-- 创建/编辑对话框 -->
    <VarietyForm
      v-if="showCreateDialog || showEditDialog"
      :variety="editingVariety"
      @save="handleSave"
      @cancel="closeDialogs"
    />

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>确定要删除品种 "{{ deletingVariety?.name }}" 吗？</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteDialog = false">
            取消
          </button>
          <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">
            确定删除
          </button>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="store.error" class="error-message">
      {{ store.error }}
      <button class="close-btn" @click="store.clearError()">&times;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useVarietyStore } from '@/stores/variety.store';
import VarietyForm from '@/components/VarietyForm.vue';
import type { Variety } from '@/types/variety';

const store = useVarietyStore();
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const editingVariety = ref<Variety | null>(null);
const deletingVariety = ref<Variety | null>(null);
const searchQuery = ref('');
const categoryFilter = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  await store.fetchVarieties();
});

const handleSearch = async () => {
  const params: any = {};
  if (searchQuery.value) params.search = searchQuery.value;
  if (categoryFilter.value) params.category = categoryFilter.value;
  await store.fetchVarieties(params);
};

const editVariety = (variety: Variety) => {
  editingVariety.value = variety;
  showEditDialog.value = true;
};

const confirmDelete = (variety: Variety) => {
  deletingVariety.value = variety;
  showDeleteDialog.value = true;
};

const handleSave = async (data: any) => {
  try {
    if (showEditDialog.value && editingVariety.value) {
      await store.updateVariety(editingVariety.value.id, data);
    } else {
      await store.createVariety(data);
    }
    closeDialogs();
  } catch (error) {
    // 错误已在 store 中处理
  }
};

const handleDelete = async () => {
  if (!deletingVariety.value) return;
  
  try {
    await store.deleteVariety(deletingVariety.value.id);
    showDeleteDialog.value = false;
    deletingVariety.value = null;
  } catch (error) {
    // 错误已在 store 中处理
  }
};

const closeDialogs = () => {
  showCreateDialog.value = false;
  showEditDialog.value = false;
  editingVariety.value = null;
};

const triggerFileImport = () => {
  fileInput.value?.click();
};

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  
  try {
    await store.batchImport(target.files[0]);
    alert('导入成功');
  } catch (error) {
    // 错误已在 store 中处理
  } finally {
    target.value = ''; // 重置文件输入
  }
};
</script>

<style scoped>
.variety-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.error-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #721c24;
}
</style>
