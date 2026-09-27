<template>
  <div class="page-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <h2><el-icon><Bell /></el-icon> 消息通知</h2>
        <el-tag v-if="unreadCount > 0" type="danger" effect="dark" size="small">{{ unreadCount }} 条未读</el-tag>
      </div>
      <div class="header-actions">
        <el-button @click="markAllRead" :disabled="!notifications.length || unreadCount === 0">全部已读</el-button>
        <el-button @click="loadNotifications" :icon="Refresh">刷新</el-button>
      </div>
    </div>

    <div class="content-card">
      <div v-if="loading" class="loading-state"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
      <div v-else-if="notifications.length === 0" class="empty-state"><el-empty description="暂无通知消息" :image-size="80" /></div>
      <div v-else class="notification-list">
        <div v-for="n in notifications" :key="n.id" :class="['notif-item', { unread: !n.isRead }]" @click="readOne(n)">
          <span class="notif-dot" v-if="!n.isRead"></span>
          <span class="notif-icon">{{ typeIcon(n.type) }}</span>
          <div class="notif-body">
            <span class="notif-msg">{{ n.message }}</span>
            <span class="notif-time">{{ fmt(n.createdAt) }}</span>
          </div>
          <el-button class="notif-del" @click.stop="delOne(n.id)" link type="danger" size="small" :icon="Delete" />
        </div>
      </div>
    </div>

    <div class="pager" v-if="pagination.totalPages > 1">
      <el-pagination background layout="prev, pager, next" :total="pagination.total" :page-size="20" v-model:current-page="page" @current-change="goPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Refresh, Delete } from '@element-plus/icons-vue';
import { notificationService, type Notification , type NotificationPagination } from '@/services/notification.service';

const notifications = ref<Notification[]>([]); const unreadCount = ref(0); const loading = ref(false);
const page = ref(1); const pagination = ref<NotificationPagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });

onMounted(() => { loadUnreadCount(); loadNotifications(); });
async function loadNotifications() { loading.value = true; try { const r = await notificationService.getAll(page.value); notifications.value = r.data; pagination.value = r.pagination; } catch {} finally { loading.value = false; } }
async function loadUnreadCount() { try { unreadCount.value = await notificationService.getUnreadCount(); } catch {} }
function goPage(p: number) { page.value = p; loadNotifications(); }
async function markAllRead() { try { await notificationService.markAllAsRead(); await loadNotifications(); loadUnreadCount(); } catch {} }
async function readOne(n: Notification) { if (!n.isRead) { try { await notificationService.markAsRead(n.id); n.isRead = true; loadUnreadCount(); } catch {} } }
async function delOne(id: string) { try { await notificationService.delete(id); notifications.value = notifications.value.filter(x => x.id !== id); loadUnreadCount(); } catch {} }
function typeIcon(t: string) { const m: Record<string, string> = { warning: '⚠️', error: '❌', success: '✅', info: 'ℹ️', maintenance: '🔧', inventory: '📦', harvest: '🌾' }; return m[t] || '📌'; }
function fmt(d: string) { return new Date(d).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
</script>

<style scoped>
.page-container { padding: var(--space-xl); max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.header-left { display: flex; align-items: center; gap: var(--space-md); }
.header-left h2 { margin: 0; font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
.header-actions { display: flex; gap: var(--space-sm); }
.content-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-light); overflow: hidden; }
.loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.notification-list { display: flex; flex-direction: column; }
.notif-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; cursor: pointer; transition: all var(--transition-fast); border-bottom: 1px solid var(--color-border-light); }
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--color-bg-alt); }
.notif-item.unread { background: var(--color-primary-bg); border-left: 3px solid var(--color-primary); }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); box-shadow: 0 0 8px rgba(16,185,129,0.4); flex-shrink: 0; }
.notif-icon { font-size: 1.3rem; flex-shrink: 0; }
.notif-body { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.notif-msg { font-size: var(--text-sm); color: var(--color-text); font-weight: 500; }
.notif-time { font-size: 0.72rem; color: var(--color-text-placeholder); font-family: var(--font-mono); }
.notif-del { flex-shrink: 0; }
.pager { display: flex; justify-content: center; margin-top: var(--space-lg); }
</style>
