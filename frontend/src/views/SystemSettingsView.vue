<template>
  <div class="ct">
    <div class="ph"><h2>系统设置</h2><span class="info">仅系统管理员可配置</span></div>

    <!-- 业务阈值配置 -->
    <div class="section"><h3>业务阈值配置 (FR-017/024/025)</h3><p class="desc">修改后即时生效，无需重启服务</p>

      <div class="setting-grid">
        <div class="setting-card" v-for="s in bizSettings" :key="s.key">
          <div class="sc-head">
            <span class="sc-label">{{ s.label }}</span>
            <span class="sc-unit">{{ s.unit }}</span>
          </div>
          <div class="sc-body">
            <input type="number" v-model.number="form[s.key]" :min="s.min" :step="s.step" />
            <button class="btn-save" :disabled="form[s.key]===getRaw(s.key)" @click="saveKey(s.key)">保存</button>
          </div>
          <div class="sc-foot">{{ s.desc }}</div>
        </div>
      </div>

      <div class="btn-bar">
        <button class="btn-all" @click="saveAll" :disabled="saving">{{ saving ? '保存中...' : '一键保存全部' }}</button>
        <button class="btn-reset" @click="resetAll">恢复默认</button>
      </div>

      <div v-if="msg" :class="['msg', msgType]">{{ msg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { settingsService, type SettingsItem } from '@/services/settings.service';

interface BizConfig { key: string; label: string; desc: string; unit: string; min: number; step: number; defaultVal: string; }
const bizConfigs: BizConfig[] = [
  { key: 'duplicate_window_minutes', label: '防重复提交窗口', desc: '同一操作人在此时间内重复提交相同记录将被拒绝', unit: '分钟', min: 1, step: 1, defaultVal: '5' },
  { key: 'stocktake_discrepancy_threshold', label: '盘点误差率阈值', desc: '误差率超过此值触发盈亏处理流程', unit: '%', min: 0.1, step: 0.5, defaultVal: '2' },
  { key: 'low_stock_threshold', label: '低库存预警阈值', desc: '库存数量低于此值触发低库存预警', unit: '数量', min: 0, step: 1, defaultVal: '100' },
  { key: 'expiry_alert_days', label: '效期预警天数', desc: '物资到期前 N 天触发效期预警', unit: '天', min: 1, step: 1, defaultVal: '30' },
  { key: 'sensor_offline_minutes', label: '传感器离线阈值', desc: '传感器超过此时长无数据视为离线', unit: '分钟', min: 1, step: 1, defaultVal: '30' },
];

const raw = ref<Record<string, string>>({});
const form = reactive<Record<string, number>>({});
const saving = ref(false);
const msg = ref('');
const msgType = ref('ok');

const bizSettings = computed(() => bizConfigs);

onMounted(() => loadAll());

async function loadAll() {
  try {
    const items = await settingsService.getAll();
    for (const s of items) { raw.value[s.settingKey] = s.settingValue; }
    for (const c of bizConfigs) { form[c.key] = Number(raw.value[c.key] || c.defaultVal); }
  } catch {}
}

function getRaw(key: string) { return Number(raw.value[key] || bizConfigs.find(c => c.key === key)?.defaultVal || '0'); }

async function saveKey(key: string) {
  try {
    saving.value = true;
    await settingsService.updateSetting(key, String(form[key]));
    raw.value[key] = String(form[key]);
    msg.value = `"${bizConfigs.find(c => c.key === key)?.label}" 已更新`;
    msgType.value = 'ok';
  } catch { msg.value = '保存失败'; msgType.value = 'err'; }
  finally { saving.value = false; }
}

async function saveAll() {
  try {
    saving.value = true;
    const data: Record<string, string> = {};
    for (const c of bizConfigs) { data[c.key] = String(form[c.key]); }
    await settingsService.batchUpdate(data);
    for (const c of bizConfigs) { raw.value[c.key] = String(form[c.key]); }
    msg.value = '所有设置已更新';
    msgType.value = 'ok';
  } catch { msg.value = '保存失败'; msgType.value = 'err'; }
  finally { saving.value = false; }
}

function resetAll() {
  for (const c of bizConfigs) { form[c.key] = Number(c.defaultVal); }
  msg.value = '已恢复默认值，点击「一键保存全部」生效';
  msgType.value = 'ok';
}
</script>

<style scoped>
.ct { max-width: 900px; margin: 0 auto; padding: 2rem; }
.ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.ph h2 { margin: 0; color: #2c3e50; }
.info { font-size: 0.85rem; color: #e6a23c; background: #fdf6ec; padding: 4px 12px; border-radius: 12px; }
.section { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.section h3 { margin: 0 0 0.25rem; color: #2c3e50; }
.desc { font-size: 0.8rem; color: #909399; margin: 0 0 1.5rem; }
.setting-grid { display: flex; flex-direction: column; gap: 0.75rem; }
.setting-card { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; background: #fafafa; border-radius: 6px; border: 1px solid #ebeef5; }
.sc-head { display: flex; justify-content: space-between; align-items: center; }
.sc-label { font-weight: 600; font-size: 0.9rem; color: #303133; }
.sc-unit { font-size: 0.75rem; color: #909399; background: #e8e8e8; padding: 1px 8px; border-radius: 10px; }
.sc-body { display: flex; gap: 0.5rem; align-items: center; }
.sc-body input { width: 120px; padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 0.9rem; text-align: center; }
.sc-foot { font-size: 0.75rem; color: #909399; }
.btn-save { padding: 6px 16px; border: none; border-radius: 6px; background: #67c23a; color: white; cursor: pointer; font-size: 0.8rem; }
.btn-save:disabled { opacity: 0.5; }
.btn-save:hover { background: #5daf34; }
.btn-bar { display: flex; gap: 1rem; margin-top: 1.5rem; }
.btn-all { padding: 10px 24px; border: none; border-radius: 6px; background: #409eff; color: white; cursor: pointer; font-size: 0.9rem; }
.btn-all:hover { background: #337ecc; }
.btn-all:disabled { opacity: 0.6; }
.btn-reset { padding: 10px 24px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; cursor: pointer; font-size: 0.9rem; }
.btn-reset:hover { border-color: #c0c4cc; }
.msg { margin-top: 1rem; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; }
.msg.ok { background: #e8f5e9; color: #2e7d32; }
.msg.err { background: #fce4ec; color: #c62828; }
</style>
