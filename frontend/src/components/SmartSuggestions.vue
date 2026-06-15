<template>
  <div class="ss-panel" v-if="suggestions.length">
    <div class="ss-header" @click="collapsed = !collapsed">
      <span>🔮 智能建议 ({{ suggestions.length }})</span>
      <span class="ss-arrow">{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div class="ss-body" v-if="!collapsed">
      <div v-for="(s, i) in suggestions" :key="i" :class="['ss-item', s.severity]">
        <span class="ss-icon">{{ typeIcon(s.type) }}</span>
        <div class="ss-content">
          <div class="ss-title">{{ s.title }}</div>
          <div class="ss-msg">{{ s.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { SmartSuggestion } from '@/composables/useSSE';

defineProps<{ suggestions: SmartSuggestion[] }>();
const collapsed = ref(true);

function typeIcon(t: string) {
  return { irrigation: '💧', harvest: '🌾', pest: '🦗', maintenance: '🔧' }[t] || '📌';
}
</script>

<style scoped>
.ss-panel { position: fixed; bottom: 20px; left: 240px; right: 20px; z-index: 999; max-width: 500px; }
.ss-header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 16px; border-radius: 10px 10px 0 0; cursor: pointer; display: flex; justify-content: space-between; font-weight: 600; font-size: 0.9rem; }
.ss-body { background: white; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px; max-height: 300px; overflow-y: auto; }
.ss-item { display: flex; gap: 0.6rem; padding: 10px 16px; border-bottom: 1px solid #f5f5f5; font-size: 0.85rem; }
.ss-item:last-child { border-bottom: none; }
.ss-item.danger { border-left: 3px solid #f44336; }
.ss-item.warning { border-left: 3px solid #ff9800; }
.ss-item.info { border-left: 3px solid #2196f3; }
.ss-icon { font-size: 1.2rem; flex-shrink: 0; }
.ss-title { font-weight: 600; color: #2c3e50; }
.ss-msg { color: #909399; font-size: 0.8rem; margin-top: 2px; }
.ss-arrow { opacity: 0.7; }
</style>
