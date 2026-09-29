# 农场管家系统 (Farm Management System)

一个基于 Node.js + TypeScript (后端) 和 Vue 3 + TypeScript (前端) 的现代农场管理系统。

## 功能特性

### 已实现功能 (Phase 1-9)

- **用户认证与授权**: JWT 认证 + RBAC 权限控制
- **地块管理**: 创建、查看、更新、删除地块信息
- **品种管理**: 管理蔬菜品种，支持批量导入
- **员工管理**: 管理农场员工信息和工时
- **设备管理**: 管理 farm equipment 和维护计划
- **仪表盘**: 显示关键指标统计
- **农事与批次**: 播种、施肥、灌溉、防治、采收记录，生产批次和质量检验
- **库存与经营**: 农资/农产品库存、盘点、成本、销售、利润和产量预测
- **质量追溯**: 追溯码、二维码、消费者公开查询和追溯报告导出
- **智能物联网**: 传感器历史数据、异常检测、预警、远程控制和 AI 农事任务
- **多渠道通知**: 系统内消息、浏览器桌面通知、邮件、企业微信机器人和 MQTT

### 技术栈

**后端:**
- Node.js + TypeScript
- Express.js
- MySQL 8.0 + TypeORM
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
2. **MySQL** (v8.0 或更高版本) - [下载地址](https://dev.mysql.com/downloads/mysql/)
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

# 数据库配置 (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=farm_user
DB_PASSWORD=farm_password
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

# 通知渠道（按需启用：in_app,email,wechat,mqtt）
NOTIFICATION_CHANNELS=in_app

# 邮件通知（启用 email 时填写）
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-account@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=your-account@example.com
SMTP_TO=receiver@example.com

# 企业微信机器人（启用 wechat 时填写）
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your-key

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
# 连接到 MySQL 并创建数据库
mysql -u root -p
CREATE DATABASE farm_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 6. 运行数据库迁移

```bash
cd backend
npm run migration:run
```

#### 7. 导入演示数据

首次切换到新的 MySQL 数据库后，在后端目录执行：

```bash
cd backend
npm run seed
```

该命令会导入项目原有的地块、品种、人员、设备、生产批次、农事记录、库存、成本、销售、传感器、任务、预警和通知等演示数据；脚本可重复执行，不会重复创建基础业务数据。

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
| liming | 123456 | 农艺师 |
| wangwu | 123456 | 操作员 |
| liuming | 123456 | 只读观察者 |

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

## 功能完成情况

### Phase 4: 农事操作管理
- [x] 种植操作记录
- [x] 施肥操作记录
- [x] 浇水操作记录
- [x] 病虫害防治记录
- [x] 采收操作记录

### Phase 5: 生产批次管理
- [x] 生产批次创建
- [x] 生长周期追踪
- [x] 基于历史批次的产量预测与批次效率对比
- [x] 采收后质量检验、品质分级和子批次拆分

### Phase 6: 库存管理
- [x] 种子库存管理
- [x] 肥料库存管理
- [x] 农药库存管理
- [x] 农产品库存、品质验收、出入库和盘点管理

### Phase 7: 追溯系统
- [x] 追溯码和二维码生成
- [x] 消费者免登录扫码查询
- [x] 包含农事、投入品和质检信息的追溯报告生成

### Phase 8: 成本核算
- [x] 种子成本统计
- [x] 肥料成本统计
- [x] 人工成本统计
- [x] 设备使用成本统计
- [x] 销售、利润、亩均成本和综合经营报表

### Phase 9: 通知系统
- [x] 系统内消息与 SSE 实时未读提醒
- [x] 浏览器桌面通知
- [x] 企业微信机器人通知
- [x] SMTP 邮件通知
- [x] MQTT 推送通知

浏览器通知可在“消息通知”页面由用户授权启用。邮件、企业微信和 MQTT 的发送代码均已实现；部署时只需在 `backend/.env` 填写对应服务凭据，并把渠道名称加入 `NOTIFICATION_CHANNELS`。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

**项目状态**: Phase 1–9 已全部实现并通过自动化测试与构建验证。生产部署前请替换默认密码、JWT 密钥及各外部服务凭据。
