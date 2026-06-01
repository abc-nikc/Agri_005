# Quick Start: 农场管家系统

**Date**: 2026-05-28
**Feature**: 001-farm-management-system
**Estimated Setup Time**: 30 minutes

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+) / macOS 12+ / Windows 10+ (WSL2)
- **Node.js**: 18.0+ (推荐 20.x LTS)
- **PostgreSQL**: 15+
- **InfluxDB**: 2.7+
- **MQTT Broker**: EMQX 5.0+ (或 Mosquitto 2.0+)
- **Redis**: 7.0+ (可选，用于缓存和 Session 管理)

### Development Tools

- **Git**: 2.30+
- **Docker**: 20.10+ (推荐，用于快速搭建依赖服务)
- **VS Code**: 1.80+ (推荐，含推荐的插件)

---

## Quick Setup (Docker Compose)

### 1. 克隆项目并启动依赖服务

```bash
# 克隆项目（假设项目已创建）
git clone https://github.com/your-org/farm-management-system.git
cd farm-management-system

# 启动依赖服务（PostgreSQL, InfluxDB, EMQX, Redis）
docker-compose -f docker/docker-compose.yml up -d

# 验证服务状态
docker ps
```

**Expected Output**:
```
CONTAINER ID   IMAGE                    STATUS
abc123          postgres:15-alpine       Up 30 seconds
def456          influxdb:2.7-alpine      Up 30 seconds
ghi789          emqx/emqx:5.0            Up 30 seconds
jkl012          redis:7-alpine           Up 30 seconds
```

---

### 2. 配置环境变量

```bash
# 后端环境变量
cp backend/.env.example backend/.env

# 编辑 backend/.env，配置以下关键变量：
# - DATABASE_URL=postgresql://farm_user:password@localhost:5432/farm_management
# - INFLUX_URL=http://localhost:8086
# - INFLUX_TOKEN=your-influx-token
# - INFLUX_ORG=your-org
# - INFLUX_BUCKET=farm_management
# - MQTT_BROKER_URL=mqtt://localhost:1883
# - JWT_SECRET=your-super-secret-jwt-key
# - REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
```

---

### 3. 初始化数据库

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 创建数据库（如果未自动创建）
npm run db:create

# 运行迁移脚本
npm run migration:run

# 填充种子数据（可选，用于开发测试）
npm run seed
```

**Seed Data Includes**:
- 管理员账号：`admin` / `Admin@1234`
- 测试品种库：番茄、辣椒、黄瓜等 10 个品种
- 测试地块：A01, A02, B01
- 测试设备：2 个温湿度传感器、1 个水泵

---

### 4. 启动后端服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm run start
```

**Expected Output**:
```
[INFO] Server listening on port 3000
[INFO] Connected to PostgreSQL database
[INFO] Connected to InfluxDB
[INFO] MQTT client connected to broker
[INFO] JWT authentication initialized
[INFO] Audit logger initialized
```

---

### 5. 启动前端应用

```bash
# 新开终端，进入前端目录
cd ../frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置 VITE_API_BASE_URL=http://localhost:3000/api/v1

# 启动开发服务器
npm run dev
```

**Expected Output**:
```
  VITE v5.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

---

### 6. 验证安装

#### 6.1 访问前端应用

打开浏览器，访问 `http://localhost:5173/`

**Expected**:
- 显示登录页面
- 输入 `admin` / `Admin@1234` 可成功登录
- 登录后显示仪表盘页面

#### 6.2 测试 API 端点

```bash
# 登录获取 Token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@1234"}'

# 使用返回的 access_token 访问受保护端点
curl -X GET http://localhost:3000/api/v1/plots \
  -H "Authorization: Bearer <your_access_token>"
```

**Expected**: 返回 JSON 格式的地块列表

#### 6.3 测试 MQTT 通信

```bash
# 使用 MQTT 客户端（如 MQTTX）连接到 broker
# Broker: mqtt://localhost:1883
# Username: device_DEVTEMP001
# Password: your-device-password

# 订阅主题以监听数据
# Topic: farm/+/+/+/data

# 发布测试传感器数据
# Topic: farm/A01/DEVTEMP001/temperature/data
# Payload:
{
  "device_id": "DEVTEMP001",
  "plot_id": "<uuid-of-plot-A01>",
  "sensor_type": "temperature",
  "value": 25.5,
  "unit": "°C",
  "timestamp": "2026-05-28T10:00:00Z"
}
```

**Expected**:
- 后端控制台打印接收到数据
- 数据写入 InfluxDB
- 前端实时监控面板（如果已打开）显示更新

---

## Project Structure Overview

```
farm-management-system/
├── backend/                # Node.js + TypeScript 后端
│   ├── src/
│   │   ├── controllers/    # API 控制器
│   │   ├── services/      # 业务逻辑层
│   │   ├── models/        # TypeORM 实体
│   │   ├── middlewares/   # 中间件（认证、权限、日志）
│   │   ├── routes/        # API 路由
│   │   └── utils/         # 工具函数
│   ├── tests/             # 测试文件
│   └── package.json
│
├── frontend/               # Vue 3 + TypeScript 前端
│   ├── src/
│   │   ├── components/    # 通用组件
│   │   ├── views/         # 页面组件
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── router/        # Vue Router
│   │   └── services/      # API 服务层
│   ├── tests/             # 测试文件
│   └── package.json
│
├── docker/                 # Docker 配置
│   ├── docker-compose.yml # 依赖服务定义
│   ├── postgres/          # PostgreSQL 初始化脚本
│   └── influxdb/         # InfluxDB 配置
│
├── scripts/                # 脚本工具
│   ├── setup-db.sql      # 数据库初始化脚本
│   └── seed-data.js      # 种子数据生成脚本
│
└── specs/                 # 功能规格文档
    └── 001-farm-management-system/
        ├── spec.md        # 功能规格
        ├── plan.md        # 实施计划（本文件）
        ├── research.md    # 技术调研
        ├── data-model.md  # 数据模型
        ├── contracts/     # 接口契约
        └── quickstart.md  # 本文件
```

---

## Common Tasks

### 创建新用户

```bash
# 使用管理员账号登录后，通过 API 创建新用户
curl -X POST http://localhost:3000/api/v1/staff \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "username": "zhangsan",
    "password": "Zhang@1234",
    "system_role": "操作员",
    "business_division": "田间作业"
  }'
```

### 录入农事操作

```bash
# 记录播种操作
curl -X POST http://localhost:3000/api/v1/farming-operations \
  -H "Authorization: Bearer <operator_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "operation_type": "播种",
    "batch_id": "<batch-uuid>",
    "plot_id": "<plot-uuid>",
    "operation_date": "2026-05-28",
    "operation_time": "10:00:00",
    "details": {
      "variety": "番茄",
      "area": 5.0,
      "seed_source": "XX种子公司"
    },
    "weather_condition": "晴"
  }'
```

### 生成追溯码

```bash
# 为生产批次生成追溯码
curl -X POST http://localhost:3000/api/v1/traceability/generate \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "<batch-uuid>"
  }'

# 返回示例：
# {
#   "traceability_code": "TRACE-20260528-A01-TOMATO-001",
#   "qr_code_url": "http://localhost:3000/qrcodes/TRACE-20260528-A01-TOMATO-001.png",
#   "traceability_page_url": "http://trace.example.com/trace/TRACE-20260528-A01-TOMATO-001"
# }
```

---

## Troubleshooting

### 问题 1: 后端启动失败，提示"Cannot connect to PostgreSQL"

**可能原因**:
- PostgreSQL 未启动
- `DATABASE_URL` 环境变量配置错误
- 数据库用户权限不足

**解决方案**:
```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 手动测试连接
psql -h localhost -U farm_user -d farm_management

# 如果失败，重新创建数据库和用户
npm run db:reset
```

---

### 问题 2: MQTT 连接失败，提示"Connection refused"

**可能原因**:
- EMQX Broker 未启动
- MQTT 端口（1883）被防火墙阻止
- 设备凭证配置错误

**解决方案**:
```bash
# 检查 EMQX 是否运行
docker ps | grep emqx

# 检查 MQTT 端口
telnet localhost 1883

# 查看 EMQX 日志
docker logs <emqx-container-id>

# 重新创建设备凭证
# 访问 EMQX Dashboard: http://localhost:18083
# 默认账号: admin / public
```

---

### 问题 3: 前端页面空白，控制台报错"CORS policy"

**可能原因**:
- 后端 CORS 配置未允许前端域名
- 前端 API 基础 URL 配置错误

**解决方案**:

编辑 `backend/src/config/cors.ts`:
```typescript
export const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}
```

编辑 `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

### 问题 4: 审计日志写入失败

**可能原因**:
- 数据库权限不足（审计日志表为只读）
- 磁盘空间不足

**解决方案**:
```bash
# 检查审计日志表权限
psql -h localhost -U farm_user -d farm_management -c "\dp audit_logs"

# 确保应用程序有 INSERT 权限
GRANT INSERT ON audit_logs TO farm_app_user;

# 检查磁盘空间
df -h
```

---

## Next Steps

After successful setup, proceed with:

1. **Complete the remaining modules**: 
   - Implement inventory management features
   - Build traceability report generation
   - Develop cost accounting and yield prediction

2. **Run tests**:
   ```bash
   # Backend unit tests
   cd backend && npm run test

   # Frontend unit tests
   cd frontend && npm run test

   # E2E tests
   npm run test:e2e
   ```

3. **Deploy to staging**:
   - Configure production environment variables
   - Set up CI/CD pipeline
   - Deploy using Docker Swarm or Kubernetes

4. **Review documentation**:
   - API Contracts: `specs/001-farm-management-system/contracts/api-contracts.md`
   - Data Model: `specs/001-farm-management-system/data-model.md`
   - Research Decisions: `specs/001-farm-management-system/research.md`

---

## Additional Resources

- **API Documentation**: After starting the backend, visit `http://localhost:3000/api-docs` for Swagger UI
- **MQTT Testing Tool**: Download [MQTTX](https://mqttx.app/) for easy MQTT testing
- **Database ER Diagram**: Generate using `npm run db:diagram` (requires Graphviz)
- **Performance Monitoring**: Access Grafana dashboard at `http://localhost:3000/monitoring` (if configured)

---

## Summary

You have successfully set up the Farm Management System development environment!

**Key URLs**:
- Frontend: http://localhost:5173/
- Backend API: http://localhost:3000/api/v1
- API Docs: http://localhost:3000/api-docs
- EMQX Dashboard: http://localhost:18083

**Next Command**: `/speckit.tasks` — Generate task list for implementation

---

**End of Quick Start Guide**
