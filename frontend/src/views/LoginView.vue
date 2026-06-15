<template>
  <div class="login-page">
    <!-- 动态粒子背景 -->
    <canvas ref="canvasRef" class="particle-bg"></canvas>

    <!-- 装饰圆环 -->
    <div class="decor-ring ring-1"></div>
    <div class="decor-ring ring-2"></div>
    <div class="decor-ring ring-3"></div>

    <!-- 登录卡片 -->
    <div class="login-card animate-scale-in">
      <!-- 卡片顶部装饰 -->
      <div class="card-shine"></div>

      <div class="card-brand">
        <div class="brand-logo">
          <svg viewBox="0 0 64 64" class="logo-svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#10b981"/>
                <stop offset="100%" style="stop-color:#6366f1"/>
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#logoGrad)" opacity="0.12"/>
            <text x="32" y="40" text-anchor="middle" font-size="32">🌾</text>
          </svg>
        </div>
        <h1 class="brand-title">农场管家系统</h1>
        <p class="brand-desc">智能化农场管理平台</p>
      </div>

      <div class="login-title">
        <span class="title-line"></span>
        <span class="title-text">欢迎登录</span>
        <span class="title-line"></span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label class="input-label">
            <el-icon><User /></el-icon>
            用户名
          </label>
          <div class="input-wrap">
            <input
              type="text"
              v-model="username"
              required
              placeholder="请输入用户名"
              class="input-field"
              autocomplete="username"
            />
            <span class="input-border"></span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">
            <el-icon><Lock /></el-icon>
            密码
          </label>
          <div class="input-wrap">
            <input
              :type="showPwd ? 'text' : 'password'"
              v-model="password"
              required
              placeholder="请输入密码"
              class="input-field"
              autocomplete="current-password"
            />
            <span class="input-border"></span>
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd" tabindex="-1">
              <el-icon v-if="showPwd"><View /></el-icon>
              <el-icon v-else><Hide /></el-icon>
            </button>
          </div>
        </div>

        <button type="submit" class="login-btn" :class="{ loading: isLoading }" :disabled="isLoading">
          <span v-if="!isLoading" class="btn-content">
            <el-icon><Right /></el-icon>
            立即登录
          </span>
          <span v-else class="btn-content">
            <el-icon class="is-loading"><Loading /></el-icon>
            登录中...
          </span>
          <span class="btn-shine"></span>
        </button>

        <transition name="error-fade">
          <div v-if="errorMessage" class="error-msg">
            <el-icon><WarningFilled /></el-icon>
            {{ errorMessage }}
          </div>
        </transition>
      </form>

      <!-- 快速体验 -->
      <div class="quick-access">
        <div class="quick-title">快速体验</div>
        <div class="quick-btns">
          <button type="button" class="quick-btn admin" @click="quickLogin('admin','admin123')">
            <span class="qb-icon">👑</span>
            <span class="qb-info">
              <span class="qb-name">管理员</span>
              <span class="qb-desc">admin / admin123</span>
            </span>
            <el-icon><Right /></el-icon>
          </button>
          <button type="button" class="quick-btn operator" @click="quickLogin('zhangwei','123456')">
            <span class="qb-icon">👨‍🌾</span>
            <span class="qb-info">
              <span class="qb-name">农艺师</span>
              <span class="qb-desc">zhangwei / 123456</span>
            </span>
            <el-icon><Right /></el-icon>
          </button>
        </div>
      </div>

      <div class="card-footer">
        <el-button text type="primary" size="small" @click="showRegister = true">注册新账号</el-button>
      </div>

      <!-- 注册对话框 -->
      <el-dialog v-model="showRegister" title="注册新账号" width="420px" :close-on-click-modal="false">
        <el-form :model="registerForm" label-width="80px">
          <el-form-item label="用户名">
            <el-input v-model="registerForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="registerForm.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="registerForm.role" placeholder="请选择角色" style="width: 100%">
              <el-option label="操作员" value="操作员" />
              <el-option label="农艺师" value="农艺师" />
              <el-option label="只读观察者" value="只读观察者" />
            </el-select>
          </el-form-item>
          <el-form-item label="部门">
            <el-input v-model="registerForm.department" placeholder="请输入部门" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showRegister = false">取消</el-button>
          <el-button type="primary" :loading="isRegistering" @click="handleRegister">注册</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../services/auth.service';
import { ElMessage } from 'element-plus';

const router = useRouter();
const username = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const showPwd = ref(false);
const canvasRef = ref<HTMLCanvasElement>();

const handleLogin = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const result = await login(username.value, password.value);
    localStorage.setItem('access_token', result.accessToken);
    localStorage.setItem('refresh_token', result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    router.push('/dashboard');
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败';
  } finally {
    isLoading.value = false;
  }
};

const quickLogin = async (u: string, p: string) => {
  username.value = u;
  password.value = p;
  await handleLogin();
};

const showRegister = ref(false);
const isRegistering = ref(false);
const registerForm = reactive({
  username: '',
  password: '',
  name: '',
  role: '操作员',
  department: '',
});

const handleRegister = async () => {
  if (!registerForm.username || !registerForm.password || !registerForm.name) {
    ElMessage.warning('请填写必填字段');
    return;
  }
  isRegistering.value = true;
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const { default: axios } = await import('axios');
    await axios.post(`${API_BASE_URL}/auth/register`, registerForm);
    ElMessage.success('注册成功，请登录');
    showRegister.value = false;
    username.value = registerForm.username;
  } catch {
    ElMessage.info('注册功能开发中');
  } finally {
    isRegistering.value = false;
  }
};

// ===== 粒子背景动画 =====
let animId = 0;
interface Particle { x: number; y: number; vx: number; vy: number; size: number; alpha: number; }
let particles: Particle[] = [];

function initParticles() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // 创建粒子
  particles = Array.from({ length: 60 }, (): Particle => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 3 + 1,
    alpha: Math.random() * 0.3 + 0.1,
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    // 绘制连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(16,185,129,${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // 绘制粒子
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(16,185,129,${p.alpha})`;
      ctx.fill();
    });

    animId = requestAnimationFrame(animate);
  }
  animate();
}

onMounted(() => initParticles());
onUnmounted(() => cancelAnimationFrame(animId));
</script>

<style scoped>
.login-page {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 40%, #0f2940 100%);
}

/* 粒子背景 */
.particle-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* 装饰圆环 */
.decor-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(16,185,129,0.08);
  z-index: 0;
}
.ring-1 {
  width: 500px; height: 500px;
  top: -150px; right: -100px;
  animation: orbit 30s linear infinite;
}
.ring-2 {
  width: 350px; height: 350px;
  bottom: -80px; left: -80px;
  border-color: rgba(99,102,241,0.08);
  animation: orbit 25s linear infinite reverse;
}
.ring-3 {
  width: 200px; height: 200px;
  top: 40%; left: 10%;
  border-color: rgba(245,158,11,0.06);
  animation: orbit 20s linear infinite;
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 10;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1);
  padding: 2.5rem 2.5rem 2rem;
  width: 420px;
  max-width: 90vw;
  overflow: hidden;
}

.card-shine {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 200px;
  background: linear-gradient(180deg, rgba(16,185,129,0.08) 0%, transparent 100%);
  pointer-events: none;
}

.card-brand {
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}
.brand-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 0.75rem;
}
.logo-svg { width: 100%; height: 100%; }
.brand-title {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.25rem;
  letter-spacing: 2px;
}
.brand-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
  letter-spacing: 1px;
}

.login-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.75rem;
}
.title-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
}
.title-text {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* 输入组 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.input-wrap {
  position: relative;
}
.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: var(--font-family);
  color: var(--color-text);
  background: #fafcfa;
  transition: all var(--transition-base);
  outline: none;
}
.input-field:focus {
  border-color: var(--color-primary);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(16,185,129,0.08);
}
.input-field::placeholder {
  color: var(--color-text-placeholder);
}
.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  right: 50%;
  height: 2px;
  background: var(--color-primary);
  transition: all var(--transition-base);
  border-radius: 2px;
}
.input-field:focus ~ .input-border {
  left: 0;
  right: 0;
}
.pwd-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color var(--transition-fast);
}
.pwd-toggle:hover { color: var(--color-text); }

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 0.85rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  letter-spacing: 1px;
}
.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(16,185,129,0.35);
}
.login-btn:active:not(:disabled) {
  transform: translateY(0);
}
.login-btn.loading {
  cursor: not-allowed;
  opacity: 0.75;
}
.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}
.btn-shine {
  position: absolute;
  top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.6s;
}
.login-btn:hover .btn-shine { left: 100%; }

/* 错误提示 */
.error-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0.6rem;
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 500;
}
.error-fade-enter-active { animation: fadeInUp 0.3s ease; }
.error-fade-leave-active { animation: fadeIn 0.2s ease reverse; }

/* 底部 */
.card-footer {
  margin-top: 1.5rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}
.footer-text {
  font-size: 0.75rem;
  color: var(--color-text-placeholder);
}

/* 快速体验 */
.quick-access {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}
.quick-title {
  font-size: 0.78rem;
  color: var(--color-text-placeholder);
  text-align: center;
  margin-bottom: 0.75rem;
}
.quick-btns {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.quick-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fafcfa;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family);
}
.quick-btn:hover {
  border-color: var(--color-primary);
  background: rgba(16,185,129,0.04);
  transform: translateX(4px);
}
.qb-icon {
  font-size: 1.5rem;
}
.qb-info {
  flex: 1;
  text-align: left;
}
.qb-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.qb-desc {
  display: block;
  font-size: 0.72rem;
  color: var(--color-text-muted);
}
</style>
