<template>
  <div class="container">
    <div class="page-header">
      <h2>库存管理</h2>
      <div class="header-btns">
        <span v-if="store.alerts.lowStock.length" class="alert-tag warning">⚠ 低库存 {{ store.alerts.lowStock.length }} 项</span>
        <span v-if="store.alerts.expiring.length" class="alert-tag danger">⏰ 临期 {{ store.alerts.expiring.length }} 项</span>
        <button class="btn btn-primary" @click="formMode='in';showForm=true">入库</button>
        <button class="btn btn-secondary" @click="formMode='out';showForm=true">出库</button>
        <button class="btn btn-warning" @click="formMode='take';showForm=true">盘点</button>
      </div>
    </div>

    <div class="tabs">
      <button :class="['tab',{active:tab==='items'}]" @click="tab='items'">库存 ({{ store.items.length }})</button>
      <button :class="['tab',{active:tab==='txns'}]" @click="tab='txns';store.fetchTransactions()">出入库记录</button>
      <button :class="['tab',{active:tab==='takes'}]" @click="tab='takes';store.fetchStocktakes()">盘点记录</button>
    </div>

    <!-- 库存列表 -->
    <div v-if="tab==='items'" class="table-wrap">
      <table class="data-table" v-if="store.items.length">
        <thead><tr><th>类型</th><th>名称</th><th>规格</th><th>数量</th><th>单位</th><th>批次号</th><th>位置</th><th>品质</th><th>有效期</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="i in store.items" :key="i.id" :class="{ 'row-warn': i.quantity <= i.minStock }">
            <td><span :class="['type-tag', i.type==='农产品'?'agri':'input']">{{ i.type }}</span></td>
            <td>{{ i.name }}</td><td>{{ i.spec||'-' }}</td>
            <td :class="{ 'text-danger': i.quantity <= i.minStock }">{{ i.quantity }}</td>
            <td>{{ i.unit }}</td><td><code v-if="i.batchNumber">{{ i.batchNumber }}</code><span v-else>-</span></td>
            <td>{{ i.location||'-' }}</td><td>{{ i.qualityGrade||'-' }}</td>
            <td>{{ i.expiryDate||'-' }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="quickOut(i)">出库</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无库存</div>
    </div>

    <!-- 交易记录 -->
    <div v-if="tab==='txns'" class="table-wrap">
      <table class="data-table" v-if="store.transactions.length">
        <thead><tr><th>时间</th><th>类型</th><th>名称</th><th>数量</th><th>操作人</th><th>审批人</th><th>来源/去向</th></tr></thead>
        <tbody>
          <tr v-for="t in store.transactions" :key="t.id">
            <td>{{ fmt(t.transactionDate) }}</td>
            <td><span :class="['tag', t.type==='入库'?'in':'out']">{{ t.subType }}</span></td>
            <td>{{ t.itemName }}</td><td>{{ t.quantity }}{{ t.unit }}</td>
            <td>{{ t.operator }}</td><td>{{ t.approver||'-' }}</td><td>{{ t.sourceOrDest||'-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无记录</div>
    </div>

    <!-- 盘点记录 -->
    <div v-if="tab==='takes'" class="table-wrap">
      <table class="data-table" v-if="store.stocktakes.length">
        <thead><tr><th>时间</th><th>类型</th><th>物品</th><th>系统数量</th><th>实际数量</th><th>差异</th><th>误差率</th><th>结果</th></tr></thead>
        <tbody>
          <tr v-for="t in store.stocktakes" :key="t.id">
            <td>{{ fmt(t.createdAt) }}</td><td>{{ t.type }}</td><td>{{ t.itemName }}</td>
            <td>{{ t.systemQuantity }}</td><td>{{ t.actualQuantity }}</td>
            <td :class="{ 'text-red': t.discrepancy!==0 }">{{ t.discrepancy }}</td>
            <td>{{ (t.discrepancyRate*100).toFixed(2) }}%</td>
            <td><span :class="['tag', t.result==='正常'?'ok':t.result==='盘盈'?'in':t.result==='盘亏'?'out':'warn']">{{ t.result }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无盘点</div>
    </div>

    <!-- 入库/出库/盘点弹窗 -->
    <div class="overlay" v-if="showForm" @click.self="closeForm">
      <div class="modal">
        <h3>{{ formMode==='in'?'入库':formMode==='out'?'出库':'盘点' }}</h3>
        <form @submit.prevent="submitForm">
          <div class="fg" v-if="formMode==='in'">
            <label>类型</label><select v-model="f.type"><option value="农产品">农产品</option><option value="农资">农资</option></select>
          </div>
          <div class="fg" v-if="formMode==='in'">
            <label>入库类型</label><select v-model="f.subType"><option value="农产品入库">农产品入库</option><option value="农资采购入库">农资采购入库</option></select>
          </div>
          <div class="fg"><label>名称*</label><input v-model="f.name" required /></div>
          <div class="fg" v-if="formMode==='in'"><label>规格</label><input v-model="f.spec" /></div>
          <div class="fg"><label>数量*</label><input v-model.number="f.quantity" type="number" step="0.1" required /></div>
          <div class="fg" v-if="formMode==='in'"><label>单位*</label><input v-model="f.unit" required placeholder="kg/袋/瓶" /></div>
          <div class="fg" v-if="formMode==='in'"><label>批次号</label><input v-model="f.batchNumber" /></div>
          <div class="fg" v-if="formMode==='in'"><label>存放位置</label><input v-model="f.location" /></div>
          <div class="fg" v-if="formMode==='in' && f.subType==='农产品入库'">
            <label>品质等级</label><select v-model="f.qualityGrade"><option value="">选择</option><option value="一级">一级</option><option value="二级">二级</option><option value="三级">三级</option></select>
          </div>
          <div class="fg" v-if="formMode==='in' && f.subType==='农产品入库'">
            <label>品质检测*</label><select v-model="f.qualityPassed"><option :value="undefined">请选择</option><option :value="true">合格</option><option :value="false">不合格</option></select>
          </div>
          <div class="fg" v-if="formMode==='in'"><label>有效期</label><input v-model="f.expiryDate" type="date" /></div>
          <div class="fg"><label>操作人*</label><input v-model="f.operator" required /></div>
          <div class="fg" v-if="formMode==='out' && f.subType==='销售出库'"><label>审批人*</label><input v-model="f.approver" required /></div>
          <div class="fg" v-if="formMode==='in'||formMode==='out'"><label>来源/去向</label><input v-model="f.sourceOrDest" /></div>
          <div class="fg" v-if="formMode==='take'">
            <label>盘点类型</label><select v-model="f.type"><option value="月度">月度</option><option value="季度">季度</option><option value="年度">年度</option><option value="循环">循环</option></select>
          </div>
          <div class="fg" v-if="formMode==='take'"><label>盘点人*</label><input v-model="f.executor" required /></div>
          <div class="fg" v-if="formMode==='take'"><label>实际数量*</label><input v-model.number="f.actualQuantity" type="number" step="0.1" required /></div>
          <div class="fg"><label>备注</label><input v-model="f.remark" /></div>
          <div v-if="store.error" class="err">{{ store.error }}</div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeForm">取消</button>
            <button type="submit" class="btn btn-primary">确认</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useInventoryStore } from '@/stores/inventory.store';

const store = useInventoryStore();
const tab = ref('items');
const showForm = ref(false);
const formMode = ref<'in'|'out'|'take'>('in');
const f = reactive<Record<string,any>>({ type:'农产品', subType:'农产品入库', name:'', quantity:0, unit:'kg', operator:'', qualityPassed:undefined });

onMounted(() => { store.fetchAll(); store.fetchAlerts(); });

function quickOut(item: any) {
  f.inventoryId = item.id; f.subType = item.type==='农产品'?'销售出库':'农资领用出库';
  f.quantity = 0; f.operator = ''; f.approver = ''; formMode.value = 'out'; showForm.value = true;
}

function closeForm() { showForm.value = false; Object.keys(f).forEach(k => { if(k!=='type'&&k!=='subType'&&k!=='unit') f[k] = k==='quantity'?0:''; }); f.qualityPassed = undefined; }

async function submitForm() {
  try {
    if (formMode.value === 'in') await store.doStockIn(f as any);
    else if (formMode.value === 'out') await store.doStockOut(f as any);
    else await store.doStocktake({ type: f.type, executor: f.executor, inventoryId: f.inventoryId, actualQuantity: f.actualQuantity, remark: f.remark });
    closeForm();
  } catch {}
}

function fmt(d: string) { return new Date(d).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }); }
</script>

<style scoped>
.container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.page-header h2 { margin: 0; }
.header-btns { display: flex; align-items: center; gap: 0.5rem; }
.alert-tag { padding: 4px 12px; border-radius: 16px; font-size: 0.85rem; }
.alert-tag.warning { background: #fff3e0; color: #1a1a1a; }
.alert-tag.danger { background: #fce4ec; color: #1a1a1a; }
.tabs { display: flex; margin-bottom: 1rem; }
.tab { padding: 8px 24px; border: 1px solid #dcdfe6; background: #f5f7fa; cursor: pointer; color: #1a1a1a; }
.tab:first-child { border-radius: 6px 0 0 6px; }
.tab:last-child { border-radius: 0 6px 6px 0; }
.tab.active { background: #409eff; color: white; border-color: #409eff; }
.table-wrap { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f5f7fa; padding: 10px; text-align: left; font-size: 0.85rem; }
.data-table td { padding: 8px 10px; border-bottom: 1px solid #ebeef5; font-size: 0.85rem; }
.row-warn { background: #fff8e1; }
.text-danger { color: #f56c6c; font-weight: 600; }
.text-red { color: #c62828; }
.type-tag { padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; }
.type-tag.agri { background: #e8f5e9; color: #1a1a1a; }
.type-tag.input { background: #e3f2fd; color: #1a1a1a; }
.tag { padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; }
.tag.in { background: #e8f5e9; color: #1a1a1a; }
.tag.out { background: #fce4ec; color: #1a1a1a; }
.tag.ok { background: #e8f5e9; color: #1a1a1a; }
.tag.warn { background: #fff3e0; color: #1a1a1a; }
.empty { text-align: center; padding: 3rem; color: #909399; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; padding: 2rem; width: 500px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin: 0 0 1.5rem; }
.fg { display: flex; flex-direction: column; margin-bottom: 1rem; }
.fg label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #606266; }
.fg input, .fg select { padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 0.9rem; }
.err { color: #f56c6c; margin-bottom: 1rem; font-size: 0.85rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
.btn-primary { background: #409eff; color: white; }
.btn-secondary { background: #f5f7fa; color: #606266; border: 1px solid #dcdfe6; }
.btn-warning { background: #e6a23c; color: white; }
.btn-sm { padding: 4px 10px; font-size: 0.8rem; }
</style>
