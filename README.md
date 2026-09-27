# 农场管家系统 (Farm Management System)

一个基于 Node.js + TypeScript (后端) 和 Vue 3 + TypeScript (前端) 的现代农场管理系统。

## 功能特性

### 已实现功能 (Phase 1-3)

- ✅ **用户认证与授权**: JWT 认证 + RBAC 权限控制
- ✅ **地块管理**: 创建、查看、更新、删除地块信息
- ✅ **品种管理**: 管理蔬菜品种，支持批量导入
- ✅ **员工管理**: 管理农场员工信息和工时
- ✅ **设备管理**: 管理 farm equipment 和维护计划
- ✅ **仪表盘**: 显示关键指标统计

### 技术栈

**后端:**
- Node.js + TypeScript
- Express.js
- PostgreSQL + TypeORM
- InfluxDB (时序数据)
- MQTT (物联网通信)
- Redis (缓存)
- JWT 认证

**前端:**
- Vue 3 + TypeScript
- Vite
- Pinia (状态管理)
- Vue Router
- Element Plus (UI 组件库)
- Axios (HTTP 客户端)

## 快速开始

### 环境要求

1. **Node.js** (v18 或更高版本) - [下载地址](https://nodejs.org/)
2. **PostgreSQL** (v14 或更高版本) - [下载地址](https://www.postgresql.org/download/)
3. **InfluxDB** (v2.7 或更高版本) - [下载地址](https://portal.influxdata.com/downloads/)
4. **Redis** (可选) - [下载地址](https://redis.io/download/)
5. **MQTT Broker** (可选, 如 Mosquitto) - [下载地址](https://mosquitto.org/download/)

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd nyjc
```

#### 2. 安装后端依赖
```bash
cd backend
npm install
```

#### 3. 安装前端依赖
```bash
cd ../frontend
npm install
```

#### 4. 配置环境变量

**后端配置** (`backend/.env`):
```env
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置 (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/farm_management
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=farm_management

# InfluxDB 配置
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your-influx-token
INFLUX_ORG=your-org
INFLUX_BUCKET=farm_management

# MQTT 配置
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=guest
MQTT_PASSWORD=guest

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_TOKEN_EXPIRY=2h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
REFRESH_TOKEN_EXPIRY=7d

# Redis 配置 (可选)
REDIS_URL=redis://localhost:6379

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

**前端配置** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_TITLE=农场管家系统
```

#### 5. 创建数据库

```bash
# 连接到 PostgreSQL 并创建数据库
psql -U postgres
CREATE DATABASE farm_management;
```

#### 6. 运行数据库迁移

```bash
cd backend
npm run migration:run
```

#### 7. 种子数据 (可选)

```bash
cd backend
npm run seed
```

#### 8. 启动开发服务器

**启动后端:**
```bash
cd backend
npm run dev
```
后端将在 `http://localhost:3000` 运行

**启动前端:**
```bash
cd frontend
npm run dev
```
前端将在 `http://localhost:5173` 运行

### 默认用户账号

种子数据会创建以下测试账号:

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 系统管理员 |
| manager | manager123 | 农艺师 |
| operator | operator123 | 操作员 |
| observer | observer123 | 只读观察者 |

## 项目结构

```
nyjc/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # API 控制器
│   │   ├── entities/       # TypeORM 实体
│   │   ├── middlewares/    # Express 中间件
│   │   ├── migrations/     # 数据库迁移
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 业务逻辑服务
│   │   └── index.ts        # 后端入口文件
│   ├── .env                # 环境变量 (需创建)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   ├── services/       # API 服务
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── views/          # 页面视图
│   │   ├── router/         # Vue Router
│   │   ├── App.vue
│   │   └── main.ts
│   ├── .env                # 环境变量 (需创建)
│   ├── package.json
│   └── vite.config.ts
│
├── scripts/                # 脚本文件
│   ├── seed-data.ts        # 种子数据
│   └── init-db.sql        # 数据库初始化脚本
│
├── docker/                 # Docker 配置
│   └── docker-compose.yml  # Docker Compose 配置
│
└── specs/                  # 项目规范文档
    └── 001-farm-management-system/
```

## API 文档

### 认证接口

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新 Token
- `POST /api/v1/auth/logout` - 用户登出

### 地块管理接口

- `GET /api/v1/plots` - 获取地块列表
- `GET /api/v1/plots/:id` - 获取地块详情
- `POST /api/v1/plots` - 创建地块
- `PUT /api/v1/plots/:id` - 更新地块
- `DELETE /api/v1/plots/:id` - 删除地块

### 品种管理接口

- `GET /api/v1/varieties` - 获取品种列表
- `GET /api/v1/varieties/:id` - 获取品种详情
- `POST /api/v1/varieties` - 创建品种
- `POST /api/v1/varieties/batch-import` - 批量导入品种
- `PUT /api/v1/varieties/:id` - 更新品种
- `DELETE /api/v1/varieties/:id` - 删除品种

### 员工管理接口

- `GET /api/v1/staff` - 获取员工列表
- `GET /api/v1/staff/:id` - 获取员工详情
- `POST /api/v1/staff` - 创建员工
- `PUT /api/v1/staff/:id` - 更新员工
- `DELETE /api/v1/staff/:id` - 删除员工

### 设备管理接口

- `GET /api/v1/equipment` - 获取设备列表
- `GET /api/v1/equipment/:id` - 获取设备详情
- `POST /api/v1/equipment` - 创建设备
- `PUT /api/v1/equipment/:id` - 更新设备
- `DELETE /api/v1/equipment/:id` - 删除设备

### 仪表盘接口

- `GET /api/v1/dashboard` - 获取仪表盘统计数据

## 开发指南

### 后端开发

```bash
cd backend
npm run dev          # 启动开发服务器 (支持热重载)
npm run build        # 编译 TypeScript
npm run start        # 运行编译后的代码
npm run lint         # 代码检查
npm run test         # 运行测试
```

### 前端开发

```bash
cd frontend
npm run dev          # 启动开发服务器 (支持热重载)
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
npm run lint         # 代码检查
npm run test         # 运行测试
```

### 数据库迁移

```bash
cd backend
npm run migration:generate  # 生成迁移文件
npm run migration:run       # 运行迁移
npm run migration:revert    # 回滚迁移
```

## 路线图

### Phase 4: 农事操作管理 (待实现)
- [ ] 种植操作记录
- [ ] 施肥操作记录
- [ ] 浇水操作记录
- [ ] 病虫害防治记录
- [ ] 采收操作记录

### Phase 5: 生产批次管理 (待实现)
- [ ] 生产批次创建
- [ ] 生长周期追踪
- [ ] 产量预测
- [ ] 质量检验

### Phase 6: 库存管理 (待实现)
- [ ] 种子库存管理
- [ ] 肥料库存管理
- [ ] 农药库存管理
- [ ] 农产品库存管理

### Phase 7: 追溯系统 (待实现)
- [ ] 追溯码生成
- [ ] 追溯信息查询
- [ ] 追溯报告生成

### Phase 8: 成本核算 (待实现)
- [ ] 种子成本统计
- [ ] 肥料成本统计
- [ ] 人工成本统计
- [ ] 设备使用成本统计

### Phase 9: 通知系统 (待实现)
- [ ] 浏览器通知
- [ ] 微信通知
- [ ] 邮件通知
- [ ] MQTT 推送通知

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

**注意**: 本项目仍在积极开发中，部分功能可能不稳定。生产环境使用前请充分测试。
