<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <h2><el-icon><Tools /></el-icon> 系统设置</h2>
      <el-tag type="warning" effect="plain" size="small">仅系统管理员可配置</el-tag>
    </div>

    <div v-if="loadErr" class="alert-banner"><el-icon><WarningFilled /></el-icon> {{ loadErr }}</div>

    <div class="section-card">
      <div class="section-head">
        <h3><el-icon><Setting /></el-icon> 业务阈值配置</h3>
        <p class="section-desc">修改后即时生效，无需重启服务</p>
      </div>
      <div class="setting-list">
        <div class="setting-item" v-for="s in bizConfigs" :key="s.key">
          <div class="si-info">
            <span class="si-label">{{ s.label }}</span>
            <span class="si-desc">{{ s.desc }}</span>
          </div>
          <div class="si-control">
            <span class="si-unit">{{ s.unit }}</span>
            <el-input-number v-model="form[s.key]" :min="s.min" :step="s.step" size="small" style="width:130px" />
            <el-button type="success" size="small" :disabled="form[s.key]===getRaw(s.key)" @click="saveKey(s.key)">保存</el-button>
          </div>
        </div>
      </div>
      <div class="btn-row">
        <el-button type="primary" @click="saveAll" :loading="saving">一键保存全部</el-button>
        <el-button @click="resetAll">恢复默认</el-button>
      </div>
    </div>

    <div class="section-card">
      <div class="section-head"><h3><el-icon><Switch /></el-icon> 功能开关</h3></div>
      <div class="switch-list">
        <div class="switch-item" v-for="sw in switchConfigs" :key="sw.key">
          <div class="sw-info"><span class="sw-label">{{ sw.label }}</span><span class="sw-desc">{{ sw.desc }}</span></div>
          <el-switch v-model="swForm[sw.key]" @change="saveSwitch(sw.key)" active-color="var(--color-primary)" />
        </div>
      </div>
    </div>

    <transition name="msg-fade">
      <div v-if="msg" :class="['msg-toast', msgType]">{{ msg }} <el-icon class="msg-close" @click="msg=''"><Close /></el-icon></div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { settingsService } from '@/services/settings.service';

interface BizConfig { key: string; label: string; desc: string; unit: string; min: number; step: number; defaultVal: string; }
interface SwitchConfig { key: string; label: string; desc: string; defaultVal: boolean; }

const bizConfigs: BizConfig[] = [
  { key: 'duplicate_window_minutes', label: '防重复提交窗口', desc: '同一操作人在此时间内重复提交相同记录将被拒绝', unit: '分钟', min: 1, step: 1, defaultVal: '5' },
  { key: 'stocktake_discrepancy_threshold', label: '盘点误差率阈值', desc: '误差率超过此值触发盈亏处理流程', unit: '%', min: 0.1, step: 0.5, defaultVal: '2' },
  { key: 'low_stock_threshold', label: '低库存预警阈值', desc: '库存数量低于此值触发低库存预警', unit: '数量', min: 0, step: 1, defaultVal: '100' },
  { key: 'expiry_alert_days', label: '效期预警天数', desc: '物资到期前 N 天触发效期预警', unit: '天', min: 1, step: 1, defaultVal: '30' },
  { key: 'sensor_offline_minutes', label: '传感器离线阈值', desc: '传感器超过此时长无数据视为离线', unit: '分钟', min: 1, step: 1, defaultVal: '30' },
];
const switchConfigs: SwitchConfig[] = [{ key: 'stocktaking_locked', label: '盘点出入库锁定', desc: '盘点期间暂停所有出入库操作，防止数据不一致', defaultVal: false }];

const raw = ref<Record<string, string>>({}); const form = reactive<Record<string, number>>({}); const swForm = reactive<Record<string, boolean>>({});
const saving = ref(false); const msg = ref(''); const msgType = ref('ok'); const loadErr = ref('');

onMounted(() => loadAll());
async function loadAll() { try { const items = await settingsService.getAll(); for (const s of items) raw.value[s.settingKey] = s.settingValue; for (const c of bizConfigs) form[c.key] = Number(raw.value[c.key] || c.defaultVal); for (const sw of switchConfigs) swForm[sw.key] = raw.value[sw.key] === 'true'; } catch (e: any) { loadErr.value = '加载设置失败：' + (e.message || '请检查网络连接'); } }
function getRaw(key: string) { return Number(raw.value[key] || bizConfigs.find(c => c.key === key)?.defaultVal || '0'); }
async function saveKey(key: string) { try { saving.value = true; await settingsService.updateSetting(key, String(form[key])); raw.value[key] = String(form[key]); msg.value = `"${bizConfigs.find(c => c.key === key)?.label}" 已更新`; msgType.value = 'ok'; } catch (e: any) { msg.value = '保存失败：' + (e.message || '未知错误'); msgType.value = 'err'; } finally { saving.value = false; } }
async function saveSwitch(key: string) { try { await settingsService.updateSetting(key, String(swForm[key])); raw.value[key] = String(swForm[key]); const label = switchConfigs.find(s => s.key === key)?.label || key; msg.value = `"${label}" 已${swForm[key] ? '开启' : '关闭'}`; msgType.value = 'ok'; } catch (e: any) { msg.value = '切换失败：' + (e.message || '未知错误'); msgType.value = 'err'; } }
async function saveAll() { try { saving.value = true; const data: Record<string, string> = {}; for (const c of bizConfigs) data[c.key] = String(form[c.key]); await settingsService.batchUpdate(data); for (const c of bizConfigs) raw.value[c.key] = String(form[c.key]); msg.value = '所有设置已更新'; msgType.value = 'ok'; } catch (e: any) { msg.value = '保存失败：' + (e.message || '未知错误'); msgType.value = 'err'; } finally { saving.value = false; } }
function resetAll() { for (const c of bizConfigs) form[c.key] = Number(c.defaultVal); msg.value = '已恢复默认值，点击「一键保存全部」生效'; msgType.value = 'ok'; }
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 900px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.page-header h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.alert-banner { background: var(--color-danger-bg); color: var(--color-danger); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: var(--space-lg); font-size: var(--text-sm); display: flex; align-items: center; gap: 8px; }
.section-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: var(--space-lg); border: 1px solid var(--color-border-light); box-shadow: var(--shadow-xs); margin-bottom: var(--space-lg); }
.section-head { margin-bottom: var(--space-md); }
.section-head h3 { margin: 0 0 4px; font-size: var(--text-base); font-weight: 700; display: flex; align-items: center; gap: 6px; color: var(--color-text); }
.section-desc { font-size: var(--text-xs); color: var(--color-text-muted); margin: 0; }
.setting-list { display: flex; flex-direction: column; gap: 10px; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: var(--color-bg-alt); border-radius: var(--radius-md); border: 1px solid var(--color-border-light); gap: var(--space-md); }
.si-info { display: flex; flex-direction: column; gap: 3px; }
.si-label { font-weight: 600; font-size: var(--text-sm); color: var(--color-text); }
.si-desc { font-size: 0.72rem; color: var(--color-text-muted); }
.si-control { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.si-unit { font-size: var(--text-xs); color: var(--color-text-muted); background: var(--color-bg); padding: 2px 8px; border-radius: var(--radius-full); }
.btn-row { display: flex; gap: var(--space-md); margin-top: var(--space-lg); }
.switch-list { display: flex; flex-direction: column; gap: 10px; }
.switch-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: var(--color-bg-alt); border-radius: var(--radius-md); border: 1px solid var(--color-border-light); }
.sw-info { display: flex; flex-direction: column; gap: 3px; }
.sw-label { font-weight: 600; font-size: var(--text-sm); color: var(--color-text); }
.sw-desc { font-size: 0.72rem; color: var(--color-text-muted); }
.msg-toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: var(--radius-sm); font-size: var(--text-sm); display: flex; align-items: center; gap: 12px; z-index: 2000; box-shadow: var(--shadow-lg); }
.msg-toast.ok { background: var(--color-success); color: white; }
.msg-toast.err { background: var(--color-danger); color: white; }
.msg-close { cursor: pointer; opacity: 0.7; }
.msg-close:hover { opacity: 1; }
.msg-fade-enter-active, .msg-fade-leave-active { transition: all 0.3s ease; }
.msg-fade-enter-from, .msg-fade-leave-to { opacity: 0; transform: translateY(12px); }
</style>
