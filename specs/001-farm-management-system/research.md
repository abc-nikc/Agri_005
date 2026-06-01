# Research: 农场管家系统技术决策

**Date**: 2026-05-28
**Feature**: 001-farm-management-system

## 技术决策记录

### 决策 1: 前端框架选择

**决策**: Vue 3 + TypeScript + Element Plus

**理由**:
- Vue 3 的响应式系统适合实时数据展示（监控面板、实时数据刷新）
- TypeScript 提供类型安全，减少运行时错误
- Element Plus 提供丰富的农业管理场景组件（表格、表单、图表）
- 中文文档完善，适合国内开发团队
- 打包体积小，适合农场网络环境（可能带宽有限）

**替代方案考虑**:
- React 18 + Ant Design: 生态更丰富，但打包体积较大，学习曲线陡峭
- Angular: 适合大型企业应用，但过重，不适合中等规模农场系统

**结论**: 采用 Vue 3 + TypeScript + Element Plus

---

### 决策 2: 后端架构选择

**决策**: Node.js (Express) + TypeScript + TypeORM

**理由**:
- Node.js 异步 I/O 适合处理大量物联网设备并发连接
- TypeScript 提供端到端类型安全（前后端共享类型定义）
- TypeORM 支持 PostgreSQL 和复杂关系映射
- 单语言开发（JavaScript/TypeScript）降低团队成本
- 丰富的 MQTT 客户端库（如 `mqtt`、`aedes`）

**替代方案考虑**:
- Python (FastAPI): 适合数据分析和ML集成，但物联网并发处理不如Node.js
- Java (Spring Boot): 企业级稳定性，但开发效率低，适合更大型系统

**结论**: 采用 Node.js + TypeScript + Express + TypeORM

---

### 决策 3: 数据库选型

**决策**: PostgreSQL 15+ (业务数据) + InfluxDB 2.x (时序数据)

**理由**:
- PostgreSQL:
  - 强事务支持（ACID），适合业务数据（库存、财务、人员）
  - 丰富的约束机制（外键、CHECK约束、触发器）
  - JSONB 类型支持半结构化数据（如设备配置、种植规范）
  - 成熟的备份和恢复机制
  
- InfluxDB:
  - 专为时序数据优化，写入和查询性能优异
  - 自动数据过期策略（保留策略）
  - 内置连续查询（Continuous Queries）用于数据降采样
  - 适合传感器数据（温湿度、土壤墒情、光照等）

**数据存储策略**:
- PostgreSQL: 地块、品种、人员、设备、农事操作、库存、销售、审计日志
- InfluxDB: 传感器采集数据（measurement: `sensor_data`, tags: `device_id`, `plot_id`; fields: `temperature`, `humidity`, `soil_moisture`, etc.）

**结论**: 采用 PostgreSQL + InfluxDB 双数据库架构

---

### 决策 4: 物联网通信协议

**决策**: MQTT (QoS 1) + WebSocket (实时推送)

**理由**:
- MQTT:
  - 轻量级协议，适合物联网设备（低带宽、低功耗）
  - QoS 1 保证消息至少送达一次
  - 支持 TLS 加密传输
  - 主题（Topic）层级结构适合设备分组（如 `farm/plot/A01/sensor/temperature`）
  
- WebSocket:
  - 前端实时监控面板通过 WebSocket 接收数据推送
  - 双向通信，支持控制指令下发（如远程开关水泵）
  - 与 MQTT over WebSocket 无缝集成

**实现方案**:
- 设备 → MQTT Broker (如 EMQX) → 后端服务订阅并存储到 InfluxDB
- 后端服务 → WebSocket Server → 前端实时监控面板

**结论**: 采用 MQTT (设备通信) + WebSocket (前端实时推送)

---

### 决策 5: 认证与授权机制

**决策**: JWT (Access Token + Refresh Token) + RBAC

**理由**:
- JWT:
  - 无状态认证，适合分布式系统
  - Access Token 有效期 2 小时（符合宪法要求）
  - Refresh Token 有效期 7 天，存储在 HttpOnly Cookie
  - 支持 Token 黑名单（注销/强制下线）

- RBAC:
  - 四角色：系统管理员、农艺师、操作员、只读观察者
  - 权限粒度：API 端点级 + 数据行级（按地块/区域）
  - 业务分工字段进一步细分权限（如仓库管理、财务等）

**实现方案**:
- 中间件 `authenticate`：验证 JWT 并将用户信息附加到 req.user
- 中间件 `authorize(role, division?)`：检查用户角色和业务分工
- 前端路由守卫：阻止未授权访问

**结论**: 采用 JWT + RBAC 认证授权机制

---

### 决策 6: 追溯码生成与扫码页面

**决策**: 服务端生成二维码（qrcode 库）+ 独立扫码页面（Vue 3 SPA）

**理由**:
- 二维码生成:
  - 使用 Node.js `qrcode` 库生成 PNG/SVG 格式二维码
  - 追溯码内容：批次号 + 校验哈希（防止伪造）
  - 二维码存储：文件系统或对象存储（如 MinIO）
  
- 扫码页面:
  - 独立 Vue 3 应用，部署在子域名（如 `trace.example.com`）
  - 消费者无需登录，公开访问
  - 页面展示：种子来源、种植过程、投入品使用、环境数据、采收信息、销售去向
  - 不展示商业敏感数据（成本、利润等）

**实现方案**:
1. 批次创建时生成唯一追溯码（如 `TRACE-20260528-A01-TOMATO-001`）
2. 服务端生成二维码图片，存储路径记录在 `production_batches` 表
3. 扫码页面路由：`/trace/:traceabilityCode`
4. API 端点：`GET /api/v1/traceability/:traceabilityCode`（公开访问）

**结论**: 采用服务端生成二维码 + 独立扫码页面方案

---

### 决策 7: 通知推送实现

**决策**: v1 系统内消息通知 + 预留扩展接口；v1.1 实现短信/微信推送

**理由**:
- v1 系统内消息:
  - 实现简单，快速交付
  - 消息存储在 `notifications` 表，前端轮询或 WebSocket 推送
  - 消息类型：库存预警、效期预警、设备维护提醒、审批通知
  
- v1.1 扩展:
  - 短信：阿里云短信服务 / 腾讯云短信
  - 微信公众号推送：微信公众平台模板消息
  - 设计通知渠道抽象接口 `NotificationChannel`，易于扩展

**通知渠道抽象**:
```typescript
interface NotificationChannel {
  send(userId: string, message: string): Promise<void>;
}

class InAppNotificationChannel implements NotificationChannel { ... }
class SMSNotificationChannel implements NotificationChannel { ... }
class WechatNotificationChannel implements NotificationChannel { ... }
```

**结论**: v1 实现系统内通知，预留 `NotificationChannel` 接口供 v1.1 扩展

---

### 决策 8: 数据保留与归档策略

**决策**: 
- 业务数据（PostgreSQL）：永久保留（审计要求）
- 时序数据（InfluxDB）：保留 1 年原始数据，1 年后降采样保留每日聚合值

**理由**:
- 审计合规：追溯记录、审计日志不可删除（宪法要求）
- 存储成本：传感器数据量大，长期存储成本高
- 降采样策略：
  - 原始数据（每 30 秒）：保留 1 年
  - 降采样数据（每小时聚合）：保留 5 年
  - 降采样数据（每日聚合）：永久保留

**InfluxDB 保留策略**:
```sql
-- 原始数据保留 1 年
CREATE RETENTION POLICY "one_year" ON "farm_management" DURATION 365d REPLICATION 1

-- 降采样数据保留 5 年
CREATE RETENTION POLICY "five_years" ON "farm_management" DURATION 1825d REPLICATION 1
```

**结论**: 业务数据永久保留，时序数据分级保留+降采样

---

### 决策 9: 批次状态机简化

**决策**: 仅"进行中"和"已完成"两种状态，采收自动标记完成，不允许重新打开

**理由**:
- 简化状态管理，降低系统复杂度
- 符合农业实际：采收完成后批次即结束，无需重新打开
- 避免数据混乱：重新打开已完成批次可能导致成本计算错误

**状态转换规则**:
1. 批次创建 → 状态：进行中（首次农事操作提交时自动切换）
2. 批次进行中 → 状态：已完成（采收操作提交时自动切换）
3. 批次已完成 → 不可切换回进行中

**结论**: 采用简化两状态模型

---

### 决策 10: 农产品入库品质检测流程

**决策**: 简化方案——仅"合格/不合格"二值判定，目视检查后勾选，不合格拒绝入库

**理由**:
- 快速交付，降低 v1 复杂度
- 目视检查符合中小型农场实际操作流程
- 不合格品拒绝入库，避免影响后续销售

**检测流程**:
1. 采收完成后，仓库管理员收到入库通知
2. 目视检查外观、大小、病虫害情况
3. 勾选"合格"或"不合格"
4. 合格 → 入库成功；不合格 → 拒绝入库，记录原因

**v1.1 增强**: 支持多维度检测（外观、大小、糖度、病虫害率），自动分级入库

**结论**: v1 采用合格/不合格二值判定

---

## 总结

所有技术决策已明确，无未解决的 NEEDS CLARIFICATION 项。下一步进入 Phase 1: Design & Contracts。
