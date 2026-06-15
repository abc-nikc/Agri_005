<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><Box /></el-icon> 库存管理</h2>
        <div class="alert-tags" v-if="store.alerts.lowStock.length || store.alerts.expiring.length">
          <el-tag v-if="store.alerts.lowStock.length" type="warning" effect="plain" size="small">⚠ 低库存 {{ store.alerts.lowStock.length }} 项</el-tag>
          <el-tag v-if="store.alerts.expiring.length" type="danger" effect="plain" size="small">⏰ 临期 {{ store.alerts.expiring.length }} 项</el-tag>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="formMode='in';showForm=true" :icon="Plus">入库</el-button>
        <el-button @click="formMode='out';showForm=true">出库</el-button>
        <el-button type="warning" @click="formMode='take';showForm=true">盘点</el-button>
      </div>
    </div>

    <div class="tabs-bar">
      <el-radio-group v-model="tab" size="default">
        <el-radio-button value="items">库存 ({{ store.items.length }})</el-radio-button>
        <el-radio-button value="txns" @change="store.fetchTransactions()">出入库记录</el-radio-button>
        <el-radio-button value="takes" @change="store.fetchStocktakes()">盘点记录</el-radio-button>
      </el-radio-group>
    </div>

    <div class="content-card">
      <!-- 库存列表 -->
      <div v-if="tab==='items'">
        <div v-if="store.items.length === 0" class="empty-state"><el-empty description="暂无库存" :image-size="80" /></div>
        <el-table v-else :data="store.items" stripe row-key="id" :row-class-name="({row}:any) => row.quantity <= row.minStock ? 'row-warn' : ''">
          <el-table-column label="类型" width="90"><template #default="{row}"><el-tag :type="row.type==='农产品'?'success':''" size="small" effect="plain">{{ row.type }}</el-tag></template></el-table-column>
          <el-table-column prop="name" label="名称" min-width="120" />
          <el-table-column label="规格" width="100"><template #default="{row}">{{ row.spec||'-' }}</template></el-table-column>
          <el-table-column label="数量" width="80"><template #default="{row}"><span :class="{ 'num-warn': row.quantity <= row.minStock }">{{ row.quantity }}</span></template></el-table-column>
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column label="批次号" width="120"><template #default="{row}"><code v-if="row.batchNumber">{{ row.batchNumber }}</code><span v-else>-</span></template></el-table-column>
          <el-table-column label="位置" width="100"><template #default="{row}">{{ row.location||'-' }}</template></el-table-column>
          <el-table-column label="品质" width="80"><template #default="{row}">{{ row.qualityGrade||'-' }}</template></el-table-column>
          <el-table-column label="有效期" width="110"><template #default="{row}">{{ row.expiryDate||'-' }}</template></el-table-column>
          <el-table-column label="操作" width="80" fixed="right"><template #default="{row}"><el-button type="primary" link size="small" @click="quickOut(row)">出库</el-button></template></el-table-column>
        </el-table>
      </div>

      <!-- 交易记录 -->
      <div v-if="tab==='txns'">
        <div v-if="!store.transactions.length" class="empty-state"><el-empty description="暂无记录" :image-size="80" /></div>
        <el-table v-else :data="store.transactions" stripe row-key="id">
          <el-table-column label="时间" width="150"><template #default="{row}">{{ fmt(row.transactionDate) }}</template></el-table-column>
          <el-table-column label="类型" width="100"><template #default="{row}"><el-tag :type="row.type==='入库'?'success':'danger'" size="small" effect="plain">{{ row.subType }}</el-tag></template></el-table-column>
          <el-table-column prop="itemName" label="名称" min-width="120" />
          <el-table-column label="数量" width="80"><template #default="{row}">{{ row.quantity }}{{ row.unit }}</template></el-table-column>
          <el-table-column prop="operator" label="操作人" width="100" />
          <el-table-column label="审批人" width="100"><template #default="{row}">{{ row.approver||'-' }}</template></el-table-column>
          <el-table-column label="来源/去向" min-width="120"><template #default="{row}">{{ row.sourceOrDest||'-' }}</template></el-table-column>
        </el-table>
      </div>

      <!-- 盘点记录 -->
      <div v-if="tab==='takes'">
        <div v-if="!store.stocktakes.length" class="empty-state"><el-empty description="暂无盘点" :image-size="80" /></div>
        <el-table v-else :data="store.stocktakes" stripe row-key="id">
          <el-table-column label="时间" width="150"><template #default="{row}">{{ fmt(row.createdAt) }}</template></el-table-column>
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column prop="itemName" label="物品" min-width="100" />
          <el-table-column prop="systemQuantity" label="系统数量" width="90" />
          <el-table-column prop="actualQuantity" label="实际数量" width="90" />
          <el-table-column label="差异" width="80"><template #default="{row}"><span :class="{ 'num-warn': row.discrepancy!==0 }">{{ row.discrepancy }}</span></template></el-table-column>
          <el-table-column label="误差率" width="90"><template #default="{row}">{{ (row.discrepancyRate*100).toFixed(2) }}%</template></el-table-column>
          <el-table-column label="结果" width="80"><template #default="{row}"><el-tag :type="row.result==='正常'?'success':row.result==='盘盈'?'':'danger'" size="small" effect="plain">{{ row.result }}</el-tag></template></el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 表单弹窗 -->
    <el-dialog v-model="showForm" :title="formMode==='in'?'入库':formMode==='out'?'出库':'盘点'" width="500px">
      <form @submit.prevent="submitForm">
        <div class="fg" v-if="formMode==='in'"><label>类型</label><select v-model="f.type"><option value="农产品">农产品</option><option value="农资">农资</option></select></div>
        <div class="fg" v-if="formMode==='in'"><label>入库类型</label><select v-model="f.subType"><option value="农产品入库">农产品入库</option><option value="农资采购入库">农资采购入库</option></select></div>
        <div class="fg"><label>名称*</label><input v-model="f.name" required /></div>
        <div class="fg" v-if="formMode==='in'"><label>规格</label><input v-model="f.spec" /></div>
        <div class="fg"><label>数量*</label><input v-model.number="f.quantity" type="number" step="0.1" required /></div>
        <div class="fg" v-if="formMode==='in'"><label>单位*</label><input v-model="f.unit" required placeholder="kg/袋/瓶" /></div>
        <div class="fg" v-if="formMode==='in'"><label>批次号</label><input v-model="f.batchNumber" /></div>
        <div class="fg" v-if="formMode==='in'"><label>存放位置</label><input v-model="f.location" /></div>
        <div class="fg" v-if="formMode==='in' && f.subType==='农产品入库'"><label>品质等级</label><select v-model="f.qualityGrade"><option value="">选择</option><option value="一级">一级</option><option value="二级">二级</option><option value="三级">三级</option></select></div>
        <div class="fg" v-if="formMode==='in' && f.subType==='农产品入库'"><label>品质检测*</label><select v-model="f.qualityPassed"><option :value="undefined">请选择</option><option :value="true">合格</option><option :value="false">不合格</option></select></div>
        <div class="fg" v-if="formMode==='in'"><label>有效期</label><input v-model="f.expiryDate" type="date" /></div>
        <div class="fg"><label>操作人*</label><input v-model="f.operator" required /></div>
        <div class="fg" v-if="formMode==='out' && f.subType==='销售出库'"><label>审批人*</label><input v-model="f.approver" required /></div>
        <div class="fg" v-if="formMode==='in'||formMode==='out'"><label>来源/去向</label><input v-model="f.sourceOrDest" /></div>
        <div class="fg" v-if="formMode==='take'"><label>盘点类型</label><select v-model="f.type"><option value="月度">月度</option><option value="季度">季度</option><option value="年度">年度</option><option value="循环">循环</option></select></div>
        <div class="fg" v-if="formMode==='take'"><label>盘点人*</label><input v-model="f.executor" required /></div>
        <div class="fg" v-if="formMode==='take'"><label>实际数量*</label><input v-model.number="f.actualQuantity" type="number" step="0.1" required /></div>
        <div class="fg"><label>备注</label><input v-model="f.remark" /></div>
        <div v-if="store.error" class="form-err">{{ store.error }}</div>
        <div class="form-actions"><el-button @click="closeForm">取消</el-button><el-button type="primary" native-type="submit">确认</el-button></div>
      </form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { useInventoryStore } from '@/stores/inventory.store';

const store = useInventoryStore();
const tab = ref('items'); const showForm = ref(false); const formMode = ref<'in'|'out'|'take'>('in');
const f = reactive<Record<string,any>>({ type:'农产品', subType:'农产品入库', name:'', quantity:0, unit:'kg', operator:'', qualityPassed:undefined });

onMounted(() => { store.fetchAll(); store.fetchAlerts(); });
function quickOut(item: any) { f.inventoryId = item.id; f.subType = item.type==='农产品'?'销售出库':'农资领用出库'; f.quantity = 0; f.operator = ''; f.approver = ''; formMode.value = 'out'; showForm.value = true; }
function closeForm() { showForm.value = false; Object.keys(f).forEach(k => { if(k!=='type'&&k!=='subType'&&k!=='unit') f[k] = k==='quantity'?0:''; }); f.qualityPassed = undefined; }
async function submitForm() { try { if (formMode.value === 'in') await store.doStockIn(f as any); else if (formMode.value === 'out') await store.doStockOut(f as any); else await store.doStocktake({ type: f.type, executor: f.executor, inventoryId: f.inventoryId, actualQuantity: f.actualQuantity, remark: f.remark }); closeForm(); } catch {} }
function fmt(d: string) { return new Date(d).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }); }
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); flex-wrap: wrap; gap: var(--space-md); }
.header-left { display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap; }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-actions { display: flex; gap: var(--space-sm); }
.alert-tags { display: flex; gap: 4px; }
.tabs-bar { margin-bottom: var(--space-lg); }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.empty-state { text-align: center; padding: 60px 20px; }
.num-warn { color: var(--color-danger); font-weight: 700; }
.form-err { color: var(--color-danger); margin-bottom: 1rem; font-size: var(--text-sm); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
.fg { display: flex; flex-direction: column; margin-bottom: 0.75rem; }
.fg label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.fg input, .fg select { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.fg input:focus, .fg select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
</style>
<style>
.row-warn { background: #fff8e1 !important; }
</style>
