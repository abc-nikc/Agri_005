<template>
  <div id="app">
    <header v-if="showNav">
      <nav>
        <router-link to="/dashboard">仪表盘</router-link>
        <router-link to="/plots">地块管理</router-link>
        <router-link to="/varieties">品种管理</router-link>
        <router-link to="/staff">员工管理</router-link>
        <router-link to="/equipment">设备管理</router-link>
        <router-link to="/farming-operations">农事操作</router-link>
        <router-link to="/planting-plans">种植计划</router-link>
        <router-link to="/inventory">库存管理</router-link>
        <router-link to="/traceability">质量追溯</router-link>
        <router-link to="/costs">成本核算</router-link>
        <router-link to="/iot">IoT监控</router-link>
        <router-link to="/notifications" class="notif-link">
          消息
          <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </router-link>
        <router-link to="/settings">系统设置</router-link>
        <button @click="logout">退出登录</button>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { notificationService } from '@/services/notification.service';

const router = useRouter();
const route = useRoute();
const showNav = ref(false);
const unreadCount = ref(0);

watch(() => route.path, () => {
  showNav.value = !!localStorage.getItem('access_token') && route.path !== '/login';
  if (showNav.value) fetchUnread();
}, { immediate: true });

let unreadTimer: any = null;
async function fetchUnread() {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  try { unreadCount.value = await notificationService.getUnreadCount(); } catch {}
}
onMounted(() => {
  if (showNav.value) fetchUnread();
  // 每30秒自动刷新未读数
  unreadTimer = setInterval(() => { if (showNav.value) fetchUnread(); }, 30000);
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

header {
  background-color: #f8f9fa;
  padding: 1rem;
  margin-bottom: 2rem;
}

nav {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

nav a {
  text-decoration: none;
  color: #2c3e50;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

nav a.router-link-exact-active {
  background-color: #42b983;
  color: white;
}

.notif-link { position: relative; }
.badge {
  position: absolute; top: -6px; right: -10px;
  background: #f56c6c; color: white; font-size: 0.65rem;
  padding: 1px 5px; border-radius: 10px; min-width: 16px; text-align: center;
  line-height: 1.2;
}

button {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
