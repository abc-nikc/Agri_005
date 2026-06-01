import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { AppDataSource } from './config/database';
import { authenticate } from './middlewares/authenticate';
import { authorize } from './middlewares/authorize';
import { errorHandler } from './middlewares/error-handler';
import { auditLogger } from './middlewares/audit-logger';
import { loginRateLimit, clearLoginAttempts, recordFailedLogin } from './middlewares/login-rate-limit';

// 导入路由
import apiRoutes from './routes';

// 加载环境变量
config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ==================== 基础中间件 ====================

// 安全头
app.use(helmet());

// CORS 配置
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    
    // 允许不带 origin 的请求（如移动应用、Postman）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true, // 允许发送 Cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 预检请求缓存时间（秒）
};
app.use(cors(corsOptions));

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie 解析
app.use(cookieParser());

// 请求日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==================== 健康检查 ====================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==================== 公开路由（无需认证）====================

// 登录接口（带速率限制）
app.post('/api/v1/auth/login', loginRateLimit, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 真正调用 AuthService.login 方法
    const authServiceModule = await import('./services/auth.service');
    const authService = new authServiceModule.AuthService();
    const result = await authService.login(username, password, req.ip || req.socket.remoteAddress || '');

    // 登录成功，清除失败记录
    const key = (req as any).loginAttemptKey;
    if (key) {
      clearLoginAttempts(key);
    }

    // 设置 Refresh Token 为 HttpOnly Cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    });

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error: any) {
    // 登录失败，记录失败次数
    const key = (req as any).loginAttemptKey;
    if (key) {
      recordFailedLogin(key);
    }

    res.status(401).json({
      error: error.message || '登录失败',
      code: 'LOGIN_FAILED',
    });
  }
});

// 刷新 Token 接口
app.post('/api/v1/auth/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: '未提供 Refresh Token',
        code: 'REFRESH_TOKEN_MISSING',
      });
    }
    
    // 真正调用 AuthService.refreshToken 方法
    const authServiceModule = await import('./services/auth.service');
    const authService = new authServiceModule.AuthService();
    const result = await authService.refreshToken(refreshToken);
    
    res.json({
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Refresh Token 无效',
      code: 'REFRESH_TOKEN_INVALID',
    });
  }
});

// 登出接口
app.post('/api/v1/auth/logout', authenticate, async (req: Request, res: Response) => {
  try {
    res.clearCookie('refresh_token');

    // Token 加入黑名单
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const { cache } = await import('./config/redis');
      const decoded: any = require('jsonwebtoken').decode(token);
      const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
      if (ttl > 0) await cache.sadd('token:blacklist', token, ttl);
    }

    const authServiceModule = await import('./services/auth.service');
    const authService = new authServiceModule.AuthService();
    await authService.logout((req as any).user.id, req.ip || req.socket.remoteAddress || '');

    res.json({ message: '登出成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '登出失败', code: 'LOGOUT_FAILED' });
  }
});

// ==================== 受保护路由 ====================

// 使用 API 路由
app.use('/api/v1', apiRoutes);

// ==================== 错误处理 ====================

// 🔴 边缘场景：并发编辑冲突处理（在全局错误处理之前）
import { conflictHandler } from './middlewares/conflict-handler';
app.use(conflictHandler);

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: '请求的接口不存在',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// 全局错误处理中间件
app.use(errorHandler);

// ==================== 启动服务器 ====================

const startServer = async () => {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('[INFO] Connected to PostgreSQL database');

    // 自动创建 admin 用户（如果不存在）
    const { Staff } = await import('./models/staff.entity');
    const { hashPassword } = await import('./utils/password');
    const staffRepository = AppDataSource.getRepository(Staff);

    const existingAdmin = await staffRepository.findOne({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
      const passwordHash = await hashPassword('admin123');
      const admin = staffRepository.create({
        name: '系统管理员',
        username: 'admin',
        passwordHash: passwordHash,
        systemRole: '系统管理员',
        businessDivision: '管理部',
        isActive: true,
      });
      await staffRepository.save(admin);
      console.log('[INFO] 已自动创建 admin 用户 (密码: admin123)');
    } else {
      console.log('[INFO] admin 用户已存在');
    }
    
    // 初始化 InfluxDB bucket
    // await createBucketIfNotExists();
    console.log('[INFO] InfluxDB configured');

    // 初始化系统设置默认值 (FR-017/024/025)
    try {
      const { systemSettingsService } = await import('./services/system-settings.service');
      await systemSettingsService.initDefaults();
      console.log('[INFO] 系统设置默认值已初始化');
    } catch (e: any) { console.log('[WARN] 系统设置初始化失败（非阻塞）:', e.message); }

    // 启动 MQTT 传感器数据收集
    try {
      const { sensorService } = await import('./services/sensor.service');
      sensorService.startMqttCollection();
      console.log('[INFO] MQTT IoT 数据收集已启动');
    } catch (e: any) {
      console.log('[WARN] MQTT 服务启动失败（非阻塞）:', e.message);
    }
    
    // 启动 HTTP 服务器
    app.listen(PORT, () => {
      console.log(`[INFO] Server listening on port ${PORT}`);
      console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[INFO] API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n[INFO] Shutting down server...');
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[INFO] Shutting down server...');
  await AppDataSource.destroy();
  process.exit(0);
});

// 启动服务器
startServer();

export { app, startServer };
