<template>
  <div id="app" :class="{ 'has-sidebar': showNav }">
    <!-- 左侧深色导航栏 - 高级版 -->
    <aside v-if="showNav" class="sidebar">
      <!-- 顶部品牌区 -->
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 40 40" class="brand-svg">
            <defs>
              <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#10b981"/>
                <stop offset="100%" style="stop-color:#6366f1"/>
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="url(#brandGrad)" opacity="0.15"/>
            <text x="20" y="26" text-anchor="middle" font-size="20">🌾</text>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">农场管家</span>
          <span class="brand-sub">Smart Farm</span>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">主菜单</div>
        <router-link to="/dashboard" class="nav-item">
          <span class="nav-icon-wrap">
            <el-icon><DataAnalysis /></el-icon>
          </span>
          <span class="nav-label">仪表盘</span>
          <span class="nav-dot"></span>
        </router-link>
        <router-link to="/ai" class="nav-item ai-nav-item">
          <span class="nav-icon-wrap">
            <el-icon><Cpu /></el-icon>
          </span>
          <span class="nav-label">AI 助手</span>
          <span class="ai-nav-badge">✨</span>
        </router-link>
        <router-link to="/news" class="nav-item">
          <span class="nav-icon-wrap">
            <el-icon><Reading /></el-icon>
          </span>
          <span class="nav-label">农业资讯</span>
          <span class="nav-dot"></span>
        </router-link>

        <div class="nav-section-label">基地管理</div>
        <router-link to="/base-map" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><MapLocation /></el-icon></span>
          <span class="nav-label">数字地图</span>
        </router-link>
        <router-link to="/plots" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Grid /></el-icon></span>
          <span class="nav-label">地块管理</span>
        </router-link>
        <router-link to="/varieties" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Cherry /></el-icon></span>
          <span class="nav-label">品种管理</span>
        </router-link>
        <router-link to="/equipment" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Setting /></el-icon></span>
          <span class="nav-label">设备管理</span>
        </router-link>
        <router-link to="/iot" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Connection /></el-icon></span>
          <span class="nav-label">IoT 监控</span>
        </router-link>

        <div class="nav-section-label">基础管理</div>
        <router-link to="/staff" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><UserFilled /></el-icon></span>
          <span class="nav-label">工人管理</span>
        </router-link>
        <router-link to="/inventory" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Box /></el-icon></span>
          <span class="nav-label">库存管理</span>
        </router-link>
        <router-link to="/costs" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Money /></el-icon></span>
          <span class="nav-label">成本核算</span>
        </router-link>

        <div class="nav-section-label">农事活动</div>
        <router-link to="/farm-tasks" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Tickets /></el-icon></span>
          <span class="nav-label">任务管理</span>
          <span class="task-badge" title="AI智能排程">AI</span>
        </router-link>
        <router-link to="/farming-operations" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Aim /></el-icon></span>
          <span class="nav-label">农事记录</span>
        </router-link>
        <router-link to="/planting-plans" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Document /></el-icon></span>
          <span class="nav-label">种植计划</span>
        </router-link>
        <router-link to="/traceability" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Search /></el-icon></span>
          <span class="nav-label">质量追溯</span>
        </router-link>

        <div class="nav-section-label">监控 & 系统</div>
        <router-link to="/alerts" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><AlarmClock /></el-icon></span>
          <span class="nav-label">预警管理</span>
        </router-link>
        <router-link to="/notifications" class="nav-item notif-link">
          <span class="nav-icon-wrap"><el-icon><Bell /></el-icon></span>
          <span class="nav-label">消息通知</span>
          <span v-if="unreadCount > 0" class="badge fancy-badge">
            <span class="badge-pulse"></span>
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </router-link>
        <router-link to="/settings" class="nav-item">
          <span class="nav-icon-wrap"><el-icon><Tools /></el-icon></span>
          <span class="nav-label">系统设置</span>
        </router-link>
      </nav>

      <!-- 底部用户区 -->
      <div class="sidebar-footer">
        <div class="user-info-mini">
          <div class="user-avatar">
            <span>管</span>
          </div>
          <div class="user-detail">
            <span class="user-name">管理员</span>
            <span class="user-role">系统管理员</span>
          </div>
        </div>
        <button class="logout-btn" @click="logout">
          <el-icon><SwitchButton /></el-icon>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main>
      <!-- 智慧农业标语横幅 -->
      <div class="smart-farm-banner" v-if="isAuthenticated && currentRoute !== '/login'">
        <div class="banner-bg">
          <div class="banner-particles"></div>
        </div>
        <div class="banner-content">
          <div class="banner-left">
            <div class="banner-badge">🚀 智慧农业物联网监控平台</div>
            <div class="banner-slogan">科技赋能农业 · 数据驱动决策 · 智慧引领未来</div>
          </div>
          <div class="banner-right">
            <div class="banner-stat">
              <span class="stat-num">{{ bannerStats.devices }}</span>
              <span class="stat-label">设备在线</span>
            </div>
            <div class="banner-stat">
              <span class="stat-num">{{ bannerStats.plots }}</span>
              <span class="stat-label">监控地块</span>
            </div>
            <div class="banner-stat">
              <span class="stat-num">{{ bannerStats.alerts }}</span>
              <span class="stat-label">今日预警</span>
            </div>
          </div>
        </div>
      </div>

      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 智能建议面板 -->
    <SmartSuggestions :suggestions="sseSuggestions" />
    <!-- 撤销提示 -->
    <UndoToast :items="undoQueue" @undo="doUndo" @dismiss="dismissUndo" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { notificationService } from '@/services/notification.service';
import { apiClient } from '@/services/api-client';
import { useSSE } from '@/composables/useSSE';
import { useUndo } from '@/composables/useUndo';
import SmartSuggestions from '@/components/SmartSuggestions.vue';
import UndoToast from '@/components/UndoToast.vue';

const router = useRouter();
const route = useRoute();
const showNav = ref(false);
const unreadCount = ref(0);

const isAuthenticated = computed(() => !!localStorage.getItem('access_token'));
const currentRoute = computed(() => route.path);
const bannerStats = reactive({ devices: 12, plots: 5, alerts: 3 });

const { suggestions: sseSuggestions, unreadCount: sseUnread, reconnect } = useSSE();
const { undoQueue, doUndo, dismissUndo: removeUndo, addUndo } = useUndo();
(window as any).__addUndo = addUndo;

watch(() => route.path, () => {
  showNav.value = !!localStorage.getItem('access_token') && route.path !== '/login';
  if (showNav.value) { fetchUnread(); setTimeout(reconnect, 500); }
}, { immediate: true });

watch(sseUnread, (v) => { if (v > 0) unreadCount.value = v; });
function dismissUndo(id: string) { removeUndo(id); }

let unreadTimer: any = null;
async function fetchUnread() {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  try { unreadCount.value = await notificationService.getUnreadCount(); } catch {}
}
onMounted(async () => {
  if (showNav.value) fetchUnread();
  unreadTimer = setInterval(() => { if (showNav.value) fetchUnread(); }, 30000);
  // Fetch banner stats
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const res = await apiClient.get('/equipment');
      bannerStats.devices = res.data.data?.items?.length || res.data.data?.length || 12;
      const plotRes = await apiClient.get('/plots');
      bannerStats.plots = plotRes.data.data?.items?.length || plotRes.data.data?.length || 5;
      const alertRes = await apiClient.get('/alerts');
      bannerStats.alerts = alertRes.data.data?.items?.length || alertRes.data.data?.length || 3;
    }
  } catch {}
});

const logout = () => {
  clearInterval(unreadTimer);
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  showNav.value = false;
  router?.push('/login');
};
</script>

<style>
/* ===== 页面切换动画 ===== */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ===== 全局布局 ===== */
#app {
  height: 100%;
  width: 100%;
  display: flex;
  background: var(--color-bg);
}

/* ===== 侧边栏 ===== */
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1a1f3a 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 20;
  position: relative;
}

/* 侧边栏装饰线 */
.sidebar::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(16, 185, 129, 0.3) 15%,
    rgba(99, 102, 241, 0.3) 50%,
    rgba(16, 185, 129, 0.3) 85%,
    transparent 100%
  );
}

/* 品牌区 */
.sidebar-brand {
  padding: 1.5rem 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}
.brand-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.brand-svg {
  width: 100%;
  height: 100%;
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.brand-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #e8ece8;
  letter-spacing: 1px;
}
.brand-sub {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 导航区域 */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-nav::-webkit-scrollbar {
  width: 3px;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}

.nav-section-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.25);
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 0.75rem 0.8rem 0.4rem;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.55);
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  transition: all var(--transition-base);
  position: relative;
  flex-shrink: 0;
}
.nav-icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  transition: all var(--transition-base);
  flex-shrink: 0;
}
.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
.nav-item:hover .nav-icon-wrap {
  background: rgba(16, 185, 129, 0.2);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
}
.nav-item.router-link-exact-active {
  color: var(--color-primary-light);
  background: rgba(16, 185, 129, 0.12);
  font-weight: 500;
}
.nav-item.router-link-exact-active .nav-icon-wrap {
  background: rgba(16, 185, 129, 0.25);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.3);
}
.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  position: absolute;
  right: 12px;
  transition: all var(--transition-base);
}
.nav-item.router-link-exact-active .nav-dot {
  background: var(--color-primary-light);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

/* 消息徽章 */
.notif-link {
  .ai-nav-item { background: rgba(99,102,241,0.08); }
  .ai-nav-item:hover { background: rgba(99,102,241,0.15); }
  .ai-nav-badge { font-size: 0.7rem; margin-left: auto; animation: aiPulse 2s infinite; }
  @keyframes aiPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
}
.task-badge { font-size: 0.55rem; margin-left: auto; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 1px 5px; border-radius: 4px; font-weight: 700; }
.badge { position: relative; }
.fancy-badge {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #ef4444, #f56565);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  display: flex;
  align-items: center;
  gap: 4px;
}
.badge-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  animation: pulse-glow 2s ease infinite;
}

/* 底部区域 */
.sidebar-footer {
  padding: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.15);
}
.user-info-mini {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.4rem 0.6rem;
}
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}
.user-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.user-name {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}
.user-role {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
}
.logout-btn {
  width: 100%;
  padding: 0.55rem;
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.logout-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.4);
}

/* ===== 主内容区 ===== */
main {
  flex: 1 1 0%;
  overflow-y: auto;
  background: var(--color-bg);
  position: relative;
}

/* 无侧边栏时(登录页) */
#app:not(.has-sidebar) {
  display: block;
}
#app:not(.has-sidebar) main {
  background: transparent;
  height: 100%;
}

/* ===== 智慧农业标语横幅 ===== */
.smart-farm-banner {
  position: relative;
  margin: 0 0 20px 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 30%, #991b1b 70%, #7f1d1d 100%);
  padding: 1.25rem 2rem;
  box-shadow: 0 8px 32px rgba(220,38,38,0.25);
}
.banner-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.banner-particles {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.15), transparent),
    radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.1), transparent),
    radial-gradient(2px 2px at 60% 20%, rgba(255,255,255,0.12), transparent),
    radial-gradient(2px 2px at 80% 60%, rgba(255,255,255,0.08), transparent),
    radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.1), transparent),
    radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.1), transparent);
  animation: bannerShimmer 8s ease-in-out infinite alternate;
}
@keyframes bannerShimmer {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
}
.banner-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}
.banner-left {}
.banner-badge {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.banner-slogan {
  font-size: 1.35rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 3px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.banner-right {
  display: flex;
  gap: 2rem;
}
.banner-stat {
  text-align: center;
}
.stat-num {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.stat-label {
  display: block;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.75);
  margin-top: 2px;
  letter-spacing: 1px;
}
</style>
