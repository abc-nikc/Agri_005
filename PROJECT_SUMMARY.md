# 农场管家系统 - 项目总结

## 项目概述

农场管家系统是一个基于现代 Web 技术栈的农场管理解决方案，旨在帮助农场管理者高效管理土地、作物、员工和设备。

### 技术栈

**后端:**
- Node.js + TypeScript
- Express.js (Web 框架)
- MySQL 8.0 + TypeORM (关系型数据库)
- InfluxDB (时序数据库，用于物联网数据)
- MQTT (物联网设备通信)
- Redis (缓存)
- JWT (认证)

**前端:**
- Vue 3 + TypeScript
- Vite (构建工具)
- Pinia (状态管理)
- Vue Router (路由)
- Element Plus (UI 组件库)
- Axios (HTTP 客户端)

## 已实现功能 (Phase 1-3)

### Phase 1: 项目设置
- ✅ 项目结构初始化
- ✅ 后端 Node.js + TypeScript 配置
- ✅ 前端 Vue 3 + TypeScript 配置
- ✅ ESLint 和 Prettier 配置
- ✅ Docker Compose 配置
- ✅ 环境变量配置

### Phase 2: 基础架构
- ✅ 数据库配置 (MySQL + TypeORM)
- ✅ InfluxDB 配置
- ✅ JWT 认证中间件
- ✅ RBAC 授权中间件
- ✅ Express 应用配置
- ✅ CORS 配置
- ✅ 路由结构
- ✅ 全局错误处理
- ✅ 请求验证
- ✅ 审计日志
- ✅ MQTT 基础配置
- ✅ 通知基础配置

### Phase 3: 农场生产要素管理 (MVP)
- ✅ 地块管理 (Plot)
  - 创建、查看、更新、删除地块
  - 地块状态管理
  - 地块区域管理
- ✅ 品种管理 (Variety)
  - 创建、查看、更新、删除品种
  - 批量导入品种
  - 品种分类管理
- ✅ 员工管理 (Staff)
  - 创建、查看、更新、删除员工
  - 员工角色管理
  - 工时统计
- ✅ 设备管理 (Equipment)
  - 创建、查看、更新、删除设备
  - 设备状态管理
  - 维护计划
- ✅ 仪表盘 (Dashboard)
  - 总面积统计
  - 已种植面积统计
  - 闲置面积统计
  - 品种数量统计
  - 员工数量统计

## 项目结构

```
nyjc/
├── backend/                      # 后端代码
│   ├── src/
│   │   ├── config/              # 配置文件
│   │   │   ├── database.ts     # 数据库连接配置
│   │   │   └── influxdb.ts     # InfluxDB 配置
│   │   ├── controllers/         # API 控制器
│   │   │   ├── plot.controller.ts
│   │   │   ├── variety.controller.ts
│   │   │   ├── staff.controller.ts
│   │   │   ├── equipment.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   ├── entities/            # TypeORM 实体
│   │   │   ├── plot.entity.ts
│   │   │   ├── variety.entity.ts
│   │   │   ├── staff.entity.ts
│   │   │   ├── equipment.entity.ts
│   │   │   └── notification.entity.ts
│   │   ├── middlewares/         # Express 中间件
│   │   │   ├── authenticate.ts  # JWT 认证
│   │   │   ├── authorize.ts     # RBAC 授权
│   │   │   ├── error-handler.ts # 错误处理
│   │   │   ├── audit-logger.ts # 审计日志
│   │   │   └── login-rate-limit.ts # 登录限制
│   │   ├── migrations/          # 数据库迁移
│   │   ├── routes/              # API 路由
│   │   │   ├── index.ts        # 路由入口
│   │   │   ├── plot.routes.ts
│   │   │   ├── variety.routes.ts
│   │   │   ├── staff.routes.ts
│   │   │   ├── equipment.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── notification.routes.ts
│   │   ├── services/            # 业务逻辑服务
│   │   │   ├── plot.service.ts
│   │   │   ├── variety.service.ts
│   │   │   ├── staff.service.ts
│   │   │   ├── equipment.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── mqtt.service.ts
│   │   │   └── notification.service.ts
│   │   ├── utils/               # 工具函数
│   │   │   ├── jwt.ts          # JWT 工具
│   │   │   └── password.ts     # 密码加密
│   │   ├── constants/           # 常量定义
│   │   │   └── mqtt-topics.ts # MQTT 主题
│   │   └── index.ts             # 后端入口文件
│   ├── .env                     # 环境变量 (需创建)
│   ├── .env.example             # 环境变量示例
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile               # 后端 Docker 配置
│
├── frontend/                    # 前端代码
│   ├── src/
│   │   ├── components/          # Vue 组件
│   │   │   ├── PlotForm.vue
│   │   │   ├── VarietyForm.vue
│   │   │   ├── StaffForm.vue
│   │   │   ├── EquipmentForm.vue
│   │   │   └── VarietyBatchImport.vue
│   │   ├── services/            # API 服务
│   │   │   ├── plot.service.ts
│   │   │   ├── variety.service.ts
│   │   │   ├── staff.service.ts
│   │   │   └── equipment.service.ts
│   │   ├── stores/            # Pinia 状态管理
│   │   │   ├── plot.store.ts
│   │   │   ├── variety.store.ts
│   │   │   ├── staff.store.ts
│   │   │   ├── equipment.store.ts
│   │   │   └── dashboard.store.ts
│   │   ├── views/              # 页面视图
│   │   │   ├── DashboardView.vue
│   │   │   ├── PlotManagement.vue
│   │   │   ├── VarietyManagement.vue
│   │   │   ├── StaffManagement.vue
│   │   │   ├── EquipmentManagement.vue
│   │   │   └── LoginView.vue
│   │   ├── router/             # Vue Router
│   │   │   └── index.ts
│   │   ├── App.vue             # 根组件
│   │   └── main.ts            # 前端入口文件
│   ├── .env                    # 环境变量 (需创建)
│   ├── .env.example            # 环境变量示例
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile              # 前端 Docker 配置
│   └── docker/                 # Docker 相关配置
│       └── nginx.conf          # Nginx 配置
│
├── scripts/                     # 脚本文件
│   ├── seed-data.ts            # 种子数据
│   └── init-db.sql            # 数据库初始化脚本
│
├── docker/                      # Docker 配置
│   └── docker-compose.yml      # Docker Compose 配置
│
├── specs/                       # 项目规范文档
│   └── 001-farm-management-system/
│       ├── spec.md             # 项目规范
│       ├── plan.md             # 实施计划
│       ├── tasks.md            # 任务列表
│       └── data-model.md       # 数据模型
│
├── README.md                    # 项目说明文档
├── QUICKSTART.md                # 快速启动指南
├── DOCKER.md                   # Docker 使用指南
├── PROJECT_SUMMARY.md          # 本文件 - 项目总结
├── start-backend.ps1           # 后端启动脚本
└── start-frontend.ps1          # 前端启动脚本
```

## 数据库设计

### 核心实体

1. **Plot (地块)**
   - id: 主键
   - plot_number: 地块编号
   - area: 面积
   - current_variety_id: 当前种植品种
   - status: 状态 (闲置/种植中/准备中)
   - soil_type: 土壤类型
   - region: 区域

2. **Variety (品种)**
   - id: 主键
   - name: 品种名称
   - category: 分类
   - sowing_season: 播种季节
   - planting_density: 种植密度
   - fertilization_rate: 施肥率
   - watering_frequency: 浇水频率
   - growth_cycle: 生长周期
   - safety_interval: 安全间隔期

3. **Staff (员工)**
   - id: 主键
   - name: 姓名
   - username: 用户名
   - password_hash: 密码哈希
   - system_role: 系统角色
   - business_division: 业务分工
   - total_work_hours: 总工时
   - contact_phone: 联系电话
   - is_active: 是否激活

4. **Equipment (设备)**
   - id: 主键
   - equipment_number: 设备编号
   - type: 类型
   - status: 状态
   - associated_plot_id: 关联地块
   - next_maintenance_date: 下次维护日期
   - mqtt_topic: MQTT 主题

## API 端点设计

### 认证接口
- POST `/api/v1/auth/login` - 用户登录
- POST `/api/v1/auth/refresh` - 刷新 Token
- POST `/api/v1/auth/logout` - 用户登出

### 地块管理接口
- GET `/api/v1/plots` - 获取地块列表
- GET `/api/v1/plots/:id` - 获取地块详情
- POST `/api/v1/plots` - 创建地块
- PUT `/api/v1/plots/:id` - 更新地块
- DELETE `/api/v1/plots/:id` - 删除地块

### 品种管理接口
- GET `/api/v1/varieties` - 获取品种列表
- GET `/api/v1/varieties/:id` - 获取品种详情
- POST `/api/v1/varieties` - 创建品种
- POST `/api/v1/varieties/batch-import` - 批量导入品种
- PUT `/api/v1/varieties/:id` - 更新品种
- DELETE `/api/v1/varieties/:id` - 删除品种

### 员工管理接口
- GET `/api/v1/staff` - 获取员工列表
- GET `/api/v1/staff/:id` - 获取员工详情
- POST `/api/v1/staff` - 创建员工
- PUT `/api/v1/staff/:id` - 更新员工
- DELETE `/api/v1/staff/:id` - 删除员工

### 设备管理接口
- GET `/api/v1/equipment` - 获取设备列表
- GET `/api/v1/equipment/:id` - 获取设备详情
- POST `/api/v1/equipment` - 创建设备
- PUT `/api/v1/equipment/:id` - 更新设备
- DELETE `/api/v1/equipment/:id` - 删除设备

### 仪表盘接口
- GET `/api/v1/dashboard` - 获取仪表盘统计数据

## 如何运行项目

### 方法一: 本地开发环境

1. **安装依赖**
   ```bash
   # 安装后端依赖
   cd backend
   npm install
   
   # 安装前端依赖
   cd ../frontend
   npm install
   ```

2. **配置环境变量**
   - 复制 `.env.example` 为 `.env`
   - 修改数据库连接等配置

3. **启动数据库**
   - 确保 MySQL 正在运行
   - 创建数据库 `farm_management`

4. **运行数据库迁移**
   ```bash
   cd backend
   npm run migration:run
   ```

5. **启动开发服务器**
   ```bash
   # 启动后端 (终端1)
   cd backend
   npm run dev
   
   # 启动前端 (终端2)
   cd frontend
   npm run dev
   ```

6. **访问应用**
   - 前端: http://localhost:5173
   - 后端 API: http://localhost:3000/api/v1

### 方法二: Docker 部署

1. **安装 Docker Desktop**

2. **启动所有服务**
   ```bash
   docker-compose up -d
   ```

3. **访问应用**
   - 前端: http://localhost:5173
   - 后端 API: http://localhost:3000/api/v1
   - 数据库管理: http://localhost:8080 (Adminer)

### 方法三: 使用启动脚本 (Windows)

1. **启动后端**
   ```powershell
   ./start-backend.ps1
   ```

2. **启动前端** (新终端窗口)
   ```powershell
   ./start-frontend.ps1
   ```

## 默认用户账号

种子数据会创建以下测试账号:

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 系统管理员 |
| manager | manager123 | 农艺师 |
| operator | operator123 | 操作员 |
| observer | observer123 | 只读观察者 |

## 下一步开发计划 (Phase 4-9)

### Phase 4: 农事操作管理
- [ ] 种植操作记录
- [ ] 施肥操作记录
- [ ] 浇水操作记录
- [ ] 病虫害防治记录
- [ ] 采收操作记录

### Phase 5: 生产批次管理
- [ ] 生产批次创建
- [ ] 生长周期追踪
- [ ] 产量预测
- [ ] 质量检验

### Phase 6: 库存管理
- [ ] 种子库存管理
- [ ] 肥料库存管理
- [ ] 农药库存管理
- [ ] 农产品库存管理

### Phase 7: 追溯系统
- [ ] 追溯码生成
- [ ] 追溯信息查询
- [ ] 追溯报告生成

### Phase 8: 成本核算
- [ ] 种子成本统计
- [ ] 肥料成本统计
- [ ] 人工成本统计
- [ ] 设备使用成本统计

### Phase 9: 通知系统
- [ ] 浏览器通知
- [ ] 微信通知
- [ ] 邮件通知
- [ ] MQTT 推送通知

## 技术亮点

1. **现代化技术栈**: 使用最新的 Vue 3、TypeScript、Node.js 等技术
2. **类型安全**: 前端和后端都使用 TypeScript，提供类型安全
3. **响应式设计**: 前端使用 Element Plus，支持响应式布局
4. **权限控制**: 基于 RBAC 的细粒度权限控制
5. **数据安全**: JWT 认证 + Refresh Token 机制
6. **物联网集成**: 支持 MQTT 协议，可连接物联网设备
7. **时序数据**: 使用 InfluxDB 存储时序数据 (如传感器数据)
8. **容器化部署**: 支持 Docker 和 Docker Compose 部署
9. **代码规范**: 使用 ESLint 和 Prettier 保证代码质量

## 项目状态

- **当前进度**: Phase 3 完成 (MVP 核心功能已实现)
- **完成度**: 约 30% (Phase 1-3 完成)
- **可运行状态**: 是 (需要安装 Node.js 和配置数据库)
- **生产就绪**: 否 (需要完成更多功能模块和测试)

## 注意事项

1. **Node.js 安装**: 本项目需要 Node.js v18 或更高版本
2. **数据库配置**: 需要正确配置 MySQL 连接
3. **环境变量**: 请确保在运行前创建了 `.env` 文件
4. **种子数据**: 运行 `npm run seed` 可插入测试数据
5. **Docker**: 如果不想本地安装数据库，可使用 Docker Compose

## 获取帮助

如果遇到问题，请:
1. 查看 `README.md` 了解详细信息
2. 查看 `QUICKSTART.md` 了解快速启动步骤
3. 查看 `DOCKER.md` 了解 Docker 部署方法
4. 检查 `.env` 配置文件是否正确
5. 查看控制台输出的错误信息

---

**项目创建时间**: 2025年
**最后更新时间**: 2025年
**维护者**: 农场管家系统开发团队
