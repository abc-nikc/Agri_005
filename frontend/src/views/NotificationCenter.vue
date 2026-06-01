<template>
  <div class="nc">
    <div class="ph">
      <h2>消息通知</h2>
      <div class="ph-actions">
        <span class="unread-badge" v-if="unreadCount > 0">{{ unreadCount }} 条未读</span>
        <button class="btn btn-text" @click="markAllRead" :disabled="!notifications.length || unreadCount === 0">全部已读</button>
        <button class="btn btn-text" @click="loadNotifications">🔄 刷新</button>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pager" v-if="pagination.totalPages > 1">
      <button class="pg-btn" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
      <span>第 {{ page }} / {{ pagination.totalPages }} 页（共 {{ pagination.total }} 条）</span>
      <button class="pg-btn" :disabled="page >= pagination.totalPages" @click="goPage(page + 1)">下一页</button>
    </div>

    <div class="list" v-if="notifications.length">
      <div
        v-for="n in notifications"
        :key="n.id"
        :class="['item', { unread: !n.isRead }]"
        @click="readOne(n)"
      >
        <span class="dot" v-if="!n.isRead"></span>
        <span class="type-icon">{{ typeIcon(n.type) }}</span>
        <div class="body">
          <span class="msg">{{ n.message }}</span>
          <span class="time">{{ fmt(n.createdAt) }}</span>
        </div>
        <button class="del" @click.stop="delOne(n.id)" title="删除">×</button>
      </div>
    </div>

    <div class="empty" v-else-if="!loading">暂无通知消息</div>
    <div class="loading" v-else>加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { notificationService, type Notification , type NotificationPagination } from '@/services/notification.service';

const notifications = ref<Notification[]>([]);
const unreadCount = ref(0);
const loading = ref(false);
const page = ref(1);
const pagination = ref<NotificationPagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });

onMounted(() => { loadUnreadCount(); loadNotifications(); });

async function loadNotifications() {
  loading.value = true;
  try {
    const r = await notificationService.getAll(page.value);
    notifications.value = r.data;
    pagination.value = r.pagination;
  } catch { /* silent */ }
  finally { loading.value = false; }
}

async function loadUnreadCount() {
  try { unreadCount.value = await notificationService.getUnreadCount(); } catch {}
}

function goPage(p: number) { page.value = p; loadNotifications(); }

async function markAllRead() {
  try { await notificationService.markAllAsRead(); await loadNotifications(); loadUnreadCount(); } catch {}
}

async function readOne(n: Notification) {
  if (!n.isRead) {
    try { await notificationService.markAsRead(n.id); n.isRead = true; loadUnreadCount(); } catch {}
  }
}

async function delOne(id: string) {
  try { await notificationService.delete(id); notifications.value = notifications.value.filter(x => x.id !== id); loadUnreadCount(); } catch {}
}

function typeIcon(t: string) {
  const m: Record<string, string> = { warning: '⚠️', error: '❌', success: '✅', info: 'ℹ️', maintenance: '🔧', inventory: '📦', harvest: '🌾' };
  return m[t] || '📌';
}

function fmt(d: string) {
  return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
</script>

<style scoped>
.nc { max-width: 900px; margin: 0 auto; padding: 2rem; }
.ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.ph h2 { margin: 0; color: #2c3e50; }
.ph-actions { display: flex; align-items: center; gap: 0.75rem; }
.unread-badge { background: #f56c6c; color: white; padding: 2px 12px; border-radius: 12px; font-size: 0.8rem; }
.btn-text { padding: 6px 14px; border: 1px solid #dcdfe6; border-radius: 4px; background: white; cursor: pointer; font-size: 0.85rem; color: #1a1a1a; }
.btn-text:hover { border-color: #409eff; color: #409eff; }
.btn-text:disabled { opacity: 0.5; cursor: default; }

.pager { display: flex; gap: 1rem; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 0.85rem; color: #909399; }
.pg-btn { padding: 4px 12px; border: 1px solid #dcdfe6; border-radius: 4px; background: white; cursor: pointer; color: #1a1a1a; }
.pg-btn:hover { border-color: #409eff; color: #409eff; }
.pg-btn:disabled { opacity: 0.4; cursor: default; }

.list { display: flex; flex-direction: column; gap: 2px; }
.item { display: flex; align-items: center; gap: 0.5rem; padding: 12px 16px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); cursor: pointer; transition: background 0.2s; }
.item:hover { background: #f5f7fa; }
.item.unread { background: #ecf5ff; border-left: 3px solid #409eff; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #409eff; flex-shrink: 0; }
.type-icon { font-size: 1.2rem; flex-shrink: 0; }
.body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.msg { font-size: 0.9rem; color: #2c3e50; }
.time { font-size: 0.75rem; color: #c0c4cc; }
.del { width: 28px; height: 28px; border: none; background: transparent; color: #c0c4cc; font-size: 1.2rem; cursor: pointer; border-radius: 4px; flex-shrink: 0; }
.del:hover { background: #fce4ec; color: #f56c6c; }
.empty, .loading { text-align: center; padding: 3rem; color: #909399; }
</style>
