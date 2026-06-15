<template>
  <div class="variety-batch-import">
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>批量导入品种</h3>
        
        <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
          <input
            type="file"
            ref="fileInput"
            accept=".xlsx,.xls,.csv"
            style="display: none"
            @change="handleFileSelect"
          />
          
          <div class="upload-placeholder" @click="triggerFileInput">
            <div class="upload-icon">📁</div>
            <p>点击或拖拽文件到此处</p>
            <p class="file-types">支持 .xlsx, .xls, .csv 格式</p>
          </div>

          <div v-if="selectedFile" class="file-info">
            <p>已选择文件: {{ selectedFile.name }}</p>
            <button class="btn btn-sm btn-secondary" @click="clearFile">清除</button>
          </div>
        </div>

        <!-- 模板下载 -->
        <div class="template-download">
          <p>没有模板？</p>
          <button class="btn btn-sm btn-link" @click="downloadTemplate">
            下载 Excel 模板
          </button>
        </div>

        <!-- 导入进度 -->
        <div v-if="importing" class="import-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <p>导入中... {{ progress }}%</p>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="import-result">
          <div v-if="importResult.success" class="alert alert-success">
            成功导入 {{ importResult.success }} 条数据
          </div>
          <div v-if="importResult.failed" class="alert alert-warning">
            失败 {{ importResult.failed }} 条数据
          </div>
          <div v-if="importResult.errors?.length" class="error-list">
            <p>错误详情：</p>
            <ul>
              <li v-for="(error, index) in importResult.errors" :key="index">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="$emit('cancel')">
            取消
          </button>
          <button
            class="btn btn-primary"
            @click="handleImport"
            :disabled="!selectedFile || importing"
          >
            {{ importing ? '导入中...' : '开始导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { varietyService } from '@/services/variety.service';

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const importing = ref(false);
const progress = ref(0);
const importResult = ref<{
  success: number;
  failed: number;
  errors?: string[];
} | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    selectedFile.value = target.files[0];
  }
};

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files?.length) {
    selectedFile.value = files[0];
  }
};

const clearFile = () => {
  selectedFile.value = null;
  importResult.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleImport = async () => {
  if (!selectedFile.value) return;

  importing.value = true;
  progress.value = 0;
  importResult.value = null;

  try {
    // 模拟进度
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10;
      }
    }, 200);

    const result = await varietyService.batchImport(selectedFile.value);
    
    clearInterval(progressInterval);
    progress.value = 100;
    
    importResult.value = result;
    
    if (result.success > 0) {
      setTimeout(() => {
        emit('success');
      }, 1000);
    }
  } catch (error: any) {
    importResult.value = {
      success: 0,
      failed: 1,
      errors: [error.response?.data?.message || '导入失败'],
    };
  } finally {
    importing.value = false;
  }
};

const downloadTemplate = () => {
  // 创建 CSV 模板
  const csvContent = '品种名称,分类,播种季节,种植密度(株/㎡),施肥量(kg/亩),浇水频率(次/周),生长周期(天),安全间隔期(天)\n' +
    '示例：小白菜,叶菜类,春秋,25,500,3,45,7';
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '品种导入模板.csv';
  link.click();
};
</script>

<style scoped>
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
  min-width: 500px;
  max-width: 600px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  margin: 20px 0;
}

.upload-area:hover {
  border-color: #007bff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.file-types {
  color: #999;
  font-size: 12px;
}

.file-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-download {
  margin: 10px 0;
  padding: 10px;
  background-color: #f0f8ff;
  border-radius: 4px;
}

.template-download p {
  margin: 0 0 5px 0;
  font-size: 14px;
}

.btn-link {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  text-decoration: underline;
}

.import-progress {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s;
}

.import-result {
  margin: 20px 0;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
}

.error-list {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8d7da;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.error-list ul {
  margin: 5px 0 0 0;
  padding-left: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
