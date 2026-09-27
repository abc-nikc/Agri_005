<template>
  <div class="undo-bar" v-if="items.length">
    <div v-for="item in items" :key="item.id" class="undo-item">
      <span>已{{ item.label }}</span>
      <button @click="$emit('undo', item.id)">撤销</button>
      <span class="undo-close" @click="$emit('dismiss', item.id)">✕</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ items: { id: string; label: string }[] }>();
defineEmits<{ undo: [id: string]; dismiss: [id: string] }>();
</script>

<style scoped>
.undo-bar { position: fixed; bottom: 300px; left: 240px; right: 20px; z-index: 1000; max-width: 400px; }
.undo-item { background: #323232; color: white; padding: 10px 14px; border-radius: 8px; display: flex; gap: 1rem; align-items: center; font-size: 0.85rem; margin-bottom: 4px; }
.undo-item button { background: #409eff; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; }
.undo-close { cursor: pointer; opacity: 0.5; }
</style>
