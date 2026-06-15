# API Contracts: 农场管家系统

**Date**: 2026-05-28
**Feature**: 001-farm-management-system
**Base URL**: `http://api.example.com/api/v1`

## Authentication

All API endpoints (except public traceability endpoint) require JWT authentication.

**Header**:
```
Authorization: Bearer <jwt_access_token>
```

**Token Refresh**:
- Access Token 有效期：2小时
- Refresh Token 有效期：7天，存储在 HttpOnly Cookie
- 刷新端点：`POST /api/v1/auth/refresh`

---

## 1. 认证与用户管理 API

### 1.1 用户登录

**Endpoint**: `POST /api/v1/auth/login`
**权限**: 公开
**描述**: 用户登录获取 JWT Token

**Request Body**:
```json
{
  "username": "string",      // 用户名（必填）
  "password": "string"       // 密码（必填）
}
```

**Response** (200 OK):
```json
{
  "access_token": "string",  // JWT Access Token
  "token_type": "Bearer",
  "expires_in": 7200,       // 2小时（秒）
  "user": {
    "id": "uuid",
    "username": "string",
    "name": "string",
    "system_role": "系统管理员|农艺师|操作员|只读观察者",
    "business_division": "string|null"
  }
}
```

**Error Responses**:
- 401 Unauthorized: 用户名或密码错误
- 423 Locked: 账户已锁定（连续失败5次）

---

### 1.2 刷新 Token

**Endpoint**: `POST /api/v1/auth/refresh`
**权限**: 公开（需要 Refresh Token Cookie）
**描述**: 使用 Refresh Token 获取新的 Access Token

**Response** (200 OK):
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 7200
}
```

---

### 1.3 用户登出

**Endpoint**: `DELETE /api/v1/auth/logout`
**权限**: 需要认证
**描述**: 注销当前会话，使 Refresh Token 失效

**Response** (204 No Content)

---

## 2. 农场生产要素管理 API

### 2.1 地块管理

#### 2.1.1 创建地块

**Endpoint**: `POST /api/v1/plots`
**权限**: 系统管理员、农艺师
**描述**: 创建新地块

**Request Body**:
```json
{
  "plot_number": "string",   // 地块编号（必填，唯一）
  "area": 50.0,             // 面积（亩，必填，>0）
  "region": "string",        // 所属区域（必填）
  "soil_type": "string|null" // 土壤类型（可选）
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "plot_number": "string",
  "area": 50.0,
  "current_variety_id": null,
  "status": "闲置",
  "soil_type": "string|null",
  "region": "string",
  "created_at": "2026-05-28T10:00:00Z",
  "updated_at": "2026-05-28T10:00:00Z"
}
```

---

#### 2.1.2 获取地块列表

**Endpoint**: `GET /api/v1/plots`
**权限**: 所有角色
**描述**: 获取地块列表（支持分页和筛选）

**Query Parameters**:
- `region` (string, optional): 按区域筛选
- `status` (string, optional): 按状态筛选（已种植/闲置）
- `page` (integer, optional): 页码（默认1）
- `limit` (integer, optional): 每页数量（默认20）

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "plot_number": "A01",
      "area": 50.0,
      "current_variety_id": "uuid|null",
      "status": "已种植",
      "region": "A区",
      "created_at": "2026-05-28T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

---

#### 2.1.3 获取地块详情

**Endpoint**: `GET /api/v1/plots/:id`
**权限**: 所有角色
**描述**: 获取指定地块的详细信息

**Response** (200 OK):
```json
{
  "id": "uuid",
  "plot_number": "A01",
  "area": 50.0,
  "current_variety_id": "uuid",
  "status": "已种植",
  "soil_type": "壤土",
  "region": "A区",
  "variety": {
    "id": "uuid",
    "name": "番茄",
    "category": "茄果类"
  },
  "created_at": "2026-05-28T10:00:00Z",
  "updated_at": "2026-05-28T10:00:00Z"
}
```

---

#### 2.1.4 更新地块

**Endpoint**: `PUT /api/v1/plots/:id`
**权限**: 系统管理员、农艺师
**描述**: 更新地块信息

**Request Body**:
```json
{
  "plot_number": "string|null",
  "area": 50.0|null,
  "current_variety_id": "uuid|null",
  "status": "已种植|闲置|null",
  "soil_type": "string|null",
  "region": "string|null"
}
```

**Response** (200 OK): 更新后的地块对象

---

#### 2.1.5 删除地块

**Endpoint**: `DELETE /api/v1/plots/:id`
**权限**: 系统管理员
**描述**: 删除地块（仅闲置状态可删除）

**Response** (204 No Content)

**Error Responses**:
- 400 Bad Request: 地块状态为"已种植"，无法删除
- 409 Conflict: 地块存在关联的生产批次

---

### 2.2 品种库管理

#### 2.2.1 创建品种

**Endpoint**: `POST /api/v1/varieties`
**权限**: 系统管理员、农艺师
**描述**: 创建新品种

**Request Body**:
```json
{
  "name": "string",                  // 品种名称（必填，唯一）
  "category": "string",              // 类别（必填）
  "sowing_season": ["春季", "秋季"], // 播种季节（可选）
  "planting_density": 3000,         // 种植密度（株/亩，可选）
  "fertilization_rate": 50.0,       // 施肥量（kg/亩，可选）
  "watering_frequency": 2,          // 浇水频率（天/次，可选）
  "growth_cycle": 120,              // 生长周期（天，可选）
  "safety_interval": 7               // 安全间隔期（天，可选）
}
```

**Response** (201 Created): 创建后的品种对象

---

#### 2.2.2 批量导入品种

**Endpoint**: `POST /api/v1/varieties/batch-import`
**权限**: 系统管理员、农艺师
**描述**: 通过 Excel 模板批量导入品种

**Request**: `multipart/form-data`
- `file`: Excel 文件（.xlsx）

**Response** (200 OK):
```json
{
  "success_count": 150,
  "failed_count": 2,
  "errors": [
    {
      "row": 5,
      "error": "品种名称重复"
    }
  ]
}
```

---

### 2.3 人员管理

#### 2.3.1 创建员工

**Endpoint**: `POST /api/v1/staff`
**权限**: 系统管理员
**描述**: 创建新员工账号

**Request Body**:
```json
{
  "name": "string",                      // 姓名（必填）
  "username": "string",                  // 用户名（必填，唯一）
  "password": "string",                 // 密码（必填，≥8位，字母+数字）
  "system_role": "操作员",               // 系统角色（必填）
  "business_division": "田间作业",      // 业务分工（可选）
  "contact_phone": "string|null"        // 联系电话（可选）
}
```

**Response** (201 Created): 创建后的员工对象（不含密码）

---

### 2.4 设备管理

#### 2.4.1 创建设备

**Endpoint**: `POST /api/v1/equipment`
**权限**: 系统管理员
**描述**: 创建新设备

**Request Body**:
```json
{
  "equipment_number": "string",      // 设备编号（必填，唯一）
  "type": "物联网设备",             // 类型（必填）
  "associated_plot_id": "uuid|null", // 关联地块（可选）
  "next_maintenance_date": "2026-06-28" // 下次维护日期（可选）
}
```

**Response** (201 Created): 创建后的设备对象

---

## 3. 农事操作管理 API

### 3.1 记录农事操作

**Endpoint**: `POST /api/v1/farming-operations`
**权限**: 农艺师、操作员（业务分工：田间作业）
**描述**: 记录农事操作（播种/施肥/打药/灌溉/除草/采收）

**Request Body**:
```json
{
  "operation_type": "播种",        // 操作类型（必填）
  "batch_id": "uuid",              // 生产批次ID（必填）
  "plot_id": "uuid",              // 地块ID（必填）
  "operation_date": "2026-05-28", // 操作日期（必填）
  "operation_time": "10:00:00",  // 操作时间（必填）
  "details": {                    // 操作详情（必填，根据类型变化）
    // 播种
    "variety": "番茄",
    "area": 5.0,
    "seed_source": "XX种子公司"
    
    // 施肥
    "fertilizer_type": "复合肥",
    "amount": 50.0,
    "unit": "kg"
    
    // 打药
    "pesticide_type": "吡虫啉",
    "amount": 100.0,
    "unit": "ml",
    "safety_interval_days": 7
  },
  "weather_condition": "string|null", // 天气状况（可选）
  "is_supplemental": false,          // 是否补录（默认false）
  "supplemental_timestamp": "string|null" // 补录时间（可选）
}
```

**Response** (201 Created): 创建后的农事操作记录

**Error Responses**:
- 400 Bad Request: 
  - 必填字段缺失
  - 同一操作人5分钟内重复提交相同记录
  - 打药操作距采收不足安全间隔期
  - 批次状态为"已完成"，不允许新增操作

---

### 3.2 获取农事操作列表

**Endpoint**: `GET /api/v1/farming-operations`
**权限**: 所有角色
**描述**: 获取农事操作记录列表（支持分页、筛选）

**Query Parameters**:
- `batch_id` (uuid, optional): 按批次筛选
- `plot_id` (uuid, optional): 按地块筛选
- `operation_type` (string, optional): 按操作类型筛选
- `operator_id` (uuid, optional): 按操作人筛选
- `start_date` (date, optional): 开始日期
- `end_date` (date, optional): 结束日期
- `page` (integer, optional): 页码
- `limit` (integer, optional): 每页数量

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "operation_type": "播种",
      "batch_id": "uuid",
      "plot_id": "uuid",
      "operator_id": "uuid",
      "operator_name": "李四",
      "operation_date": "2026-05-28",
      "operation_time": "10:00:00",
      "details": { ... },
      "weather_condition": "晴",
      "created_at": "2026-05-28T10:05:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## 4. 库存管理 API

### 4.1 农产品入库

**Endpoint**: `POST /api/v1/inventory/agricultural-products`
**权限**: 操作员（业务分工：仓库管理）
**描述**: 农产品采收后入库

**Request Body**:
```json
{
  "batch_id": "uuid",              // 生产批次ID（必填）
  "quality_check_result": "合格",  // 品质检测结果（必填：合格/不合格）
  "quality_grade": "一级",         // 品质等级（可选）
  "quantity": 500.0,              // 数量（必填，>0）
  "unit": "kg",                   // 单位（必填）
  "storage_location": "string"    // 存放位置（可选）
}
```

**Response** (201 Created): 创建后的库存记录

**Error Responses**:
- 400 Bad Request: 
  - `quality_check_result` 为"不合格"
  - `quantity` ≤ 0

---

### 4.2 农资采购入库

**Endpoint**: `POST /api/v1/inventory/agricultural-inputs`
**权限**: 操作员（业务分工：仓库管理）
**描述**: 种子、肥料、农药等采购到货后入库

**Request Body**:
```json
{
  "item_name": "string",           // 物资名称（必填）
  "specification": "string|null",  // 规格（可选）
  "quantity": 100.0,              // 数量（必填，>0）
  "unit": "string",                // 单位（必填）
  "supplier": "string|null",      // 供应商（可选）
  "purchaser_id": "uuid",         // 采购人ID（必填）
  "expiry_date": "2027-05-28"    // 有效期（可选，农资必填）
}
```

**Response** (201 Created): 创建后的库存记录

---

### 4.3 销售出库

**Endpoint**: `POST /api/v1/inventory/sales-outbound`
**权限**: 操作员（业务分工：销售）
**描述**: 农产品销售发货（需要审批）

**Request Body**:
```json
{
  "inventory_id": "uuid",         // 库存记录ID（必填）
  "quantity": 30.0,               // 出库数量（必填，≤当前库存）
  "customer_name": "string",       // 客户名称（必填）
  "customer_contact": "string|null", // 客户联系方式（可选）
  "handler_id": "uuid"            // 经手人ID（必填）
}
```

**Workflow**:
1. 提交出库申请 → 状态：待审批
2. 主管（系统管理员/农艺师）审批 → 审批通过 → 执行出库，扣减库存（FIFO）
3. 审批拒绝 → 出库申请驳回

**Response** (201 Created): 创建后的出库记录（状态：待审批）

---

### 4.4 农资领用出库

**Endpoint**: `POST /api/v1/inventory/input-outbound`
**权限**: 操作员（业务分工：仓库管理）
**描述**: 农户或技术员领用农资

**Request Body**:
```json
{
  "inventory_id": "uuid",         // 库存记录ID（必填）
  "quantity": 10.0,               // 领用数量（必填，≤当前库存）
  "recipient_id": "uuid",         // 领用人ID（必填）
  "purpose": "string",            // 用途（必填）
  "associated_plot_id": "uuid|null" // 关联地块（可选）
}
```

**Response** (201 Created): 创建后的出库记录

---

### 4.5 库存盘点

#### 4.5.1 启动盘点

**Endpoint**: `POST /api/v1/inventory/stocktake`
**权限**: 系统管理员、农艺师
**描述**: 启动库存盘点（定期或循环）

**Request Body**:
```json
{
  "stocktake_type": "定期",       // 盘点类型（必填：定期/循环）
  "executor_id": "uuid",          // 执行人ID（必填，非操作员）
  "inventory_ids": ["uuid", ...]  // 盘点范围（可选，为空则盘点全部）
}
```

**Response** (201 Created): 创建后的盘点记录（状态：进行中）

**Error Responses**:
- 400 Bad Request: `executor_id` 为操作员，不允许执行盘点

---

#### 4.5.2 提交盘点结果

**Endpoint**: `PUT /api/v1/inventory/stocktake/:id/items`
**权限**: 盘点执行人
**描述**: 提交盘点明细结果

**Request Body**:
```json
{
  "items": [
    {
      "inventory_id": "uuid",
      "actual_quantity": 48.0     // 实际盘点数量
    }
  ]
}
```

**Response** (200 OK): 更新后的盘点记录

**Business Logic**:
- 自动计算 `variance_rate = (actual_quantity - system_quantity) / system_quantity * 100%`
- 如果 `ABS(variance_rate) > variance_threshold`（默认2%），触发盈亏处理流程

---

## 5. 质量追溯 API

### 5.1 生成追溯码

**Endpoint**: `POST /api/v1/traceability/generate`
**权限**: 系统管理员、农艺师
**描述**: 为生产批次生成追溯码（二维码）

**Request Body**:
```json
{
  "batch_id": "uuid"  // 生产批次ID（必填）
}
```

**Response** (201 Created):
```json
{
  "batch_id": "uuid",
  "traceability_code": "TRACE-20260528-A01-TOMATO-001",
  "qr_code_url": "https://example.com/qrcodes/TRACE-20260528-A01-TOMATO-001.png",
  "traceability_page_url": "https://trace.example.com/trace/TRACE-20260528-A01-TOMATO-001"
}
```

---

### 5.2 查询追溯信息（公开接口）

**Endpoint**: `GET /api/v1/traceability/:traceabilityCode`
**权限**: 公开（无需认证）
**描述**: 消费者扫码查询追溯信息

**Response** (200 OK):
```json
{
  "traceability_code": "TRACE-20260528-A01-TOMATO-001",
  "batch_info": {
    "batch_number": "P20260501-A01-番茄",
    "plot": "A01",
    "variety": "番茄",
    "sowing_date": "2026-05-01",
    "harvest_date": "2026-05-28"
  },
  "seed_info": {
    "source": "XX种子公司",
    "variety": "番茄",
    "batch_number": "SEED-20260420-001"
  },
  "farming_operations": [
    {
      "operation_type": "播种",
      "operation_date": "2026-05-01",
      "operator": "李四"
    }
  ],
  "input_usage": [
    {
      "input_type": "肥料",
      "name": "复合肥",
      "amount": 50.0,
      "application_date": "2026-05-10"
    }
  ],
  "environment_data": {
    "average_temperature": 25.5,
    "average_humidity": 70.0,
    "average_soil_moisture": 60.0
  },
  "harvest_info": {
    "yield_amount": 500.0,
    "quality_grade": "一级",
    "harvest_date": "2026-05-28"
  },
  "sales_info": {
    "customer_name": "XX超市",
    "sales_date": "2026-05-29",
    "quantity": 30.0
  }
}
```

**Note**: 不展示商业敏感数据（成本、利润等）

---

### 5.3 导出追溯报告（PDF）

**Endpoint**: `POST /api/v1/traceability/:batchId/export-pdf`
**权限**: 系统管理员（仅管理员可导出）
**描述**: 导出追溯报告（PDF格式）

**Response** (200 OK):
- Headers: 
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="traceability-report-XXX.pdf"`
- Body: PDF 文件二进制流

**Audit Log**: 导出操作记入审计日志

---

## 6. 成本核算与产量预估 API

### 6.1 地块成本核算

**Endpoint**: `GET /api/v1/costs/plot/:plotId`
**权限**: 系统管理员、操作员（业务分工：财务/管理）
**描述**: 获取指定地块的成本核算报表

**Query Parameters**:
- `start_date` (date, optional): 开始日期
- `end_date` (date, optional): 结束日期

**Response** (200 OK):
```json
{
  "plot_id": "uuid",
  "plot_number": "A01",
  "total_cost": 4000.0,
  "cost_breakdown": {
    "seed": 500.0,
    "fertilizer": 800.0,
    "pesticide": 300.0,
    "labor": 2000.0,
    "machinery": 400.0
  },
  "cost_records": [ ... ]
}
```

---

### 6.2 产量预估

**Endpoint**: `GET /api/v1/yield/predict`
**权限**: 系统管理员、农艺师
**描述**: 基于历史数据和当前生长状况预测产量

**Query Parameters**:
- `batch_id` (uuid, required): 生产批次ID

**Response** (200 OK):
```json
{
  "batch_id": "uuid",
  "variety": "番茄",
  "historical_yield_range": [2000.0, 2500.0],  // 历史产量范围（kg/亩）
  "predicted_yield": 2300.0,                    // 预测产量（kg/亩）
  "confidence_level": 0.85,                       // 置信度
  "growth_stage": "开花期",                       // 当前生长阶段
  "recommendation": "生长状况良好，预计产量接近历史上限，建议提前联系销售渠道。"
}
```

---

## 7. 系统配置 API

### 7.1 获取系统配置

**Endpoint**: `GET /api/v1/settings`
**权限**: 所有角色（仅查看）
**描述**: 获取系统配置参数

**Response** (200 OK):
```json
{
  "duplicate_submit_interval": 5,     // 重复提交间隔（分钟）
  "stocktake_variance_threshold": 2.0, // 盘点误差率阈值（%）
  "expiry_alert_days": 30,           // 效期预警提前天数
  "low_stock_threshold": 100,         // 低库存预警阈值
  "maintenance_alert_days": 3         // 设备维护提前提醒天数
}
```

---

### 7.2 更新系统配置

**Endpoint**: `PUT /api/v1/settings`
**权限**: 系统管理员（仅管理员可修改）
**描述**: 更新系统配置参数

**Request Body**:
```json
{
  "duplicate_submit_interval": 5,
  "stocktake_variance_threshold": 2.0,
  "expiry_alert_days": 30,
  "low_stock_threshold": 100,
  "maintenance_alert_days": 3
}
```

**Response** (200 OK): 更新后的系统配置

---

## 8. 审计日志 API

### 8.1 查询审计日志

**Endpoint**: `GET /api/v1/audit-logs`
**权限**: 系统管理员
**描述**: 查询审计日志（支持多维度筛选）

**Query Parameters**:
- `user_id` (uuid, optional): 按操作者筛选
- `action_type` (string, optional): 按操作类型筛选
- `target_entity` (string, optional): 按目标实体筛选
- `start_time` (datetime, optional): 开始时间
- `end_time` (datetime, optional): 结束时间
- `page` (integer, optional): 页码
- `limit` (integer, optional): 每页数量

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "管理员",
      "user_ip": "192.168.1.100",
      "action_type": "CREATE_PLOT",
      "action_params": { ... },
      "target_entity": "Plot",
      "target_id": "uuid",
      "result": "成功",
      "created_at": "2026-05-28T10:00:00.123Z"
    }
  ],
  "pagination": { ... }
}
```

**Note**: 审计日志不可删除、不可篡改

---

## Error Response Format

所有错误响应统一格式：

```json
{
  "error": {
    "code": "ERR_VALIDATION_FAILED",
    "message": "用户可理解的错误信息",
    "details": [ ... ]  // 可选，详细错误信息
  }
}
```

**Common Error Codes**:
- `ERR_UNAUTHORIZED`: 未授权（Token 无效或过期）
- `ERR_FORBIDDEN`: 权限不足
- `ERR_VALIDATION_FAILED`: 数据验证失败
- `ERR_DUPLICATE_SUBMISSION`: 重复提交
- `ERR_INSUFFICIENT_STOCK`: 库存不足
- `ERR_BATCH_COMPLETED`: 批次已完成，不允许操作
- `ERR_SAFETY_INTERVAL`: 安全间隔期不足

---

## Pagination Format

所有列表接口统一分页格式：

```json
{
  "data": [ ... ],
  "pagination": {
    "total": 100,      // 总记录数
    "page": 1,         // 当前页码
    "limit": 20,       // 每页数量
    "total_pages": 5    // 总页数
  }
}
```

---

## Summary

- **6 大类 API** 已完整定义
- **所有接口** 已声明权限要求
- **请求/响应格式** 已详细定义
- **错误响应** 已统一格式
- **分页格式** 已统一

下一步：创建 MQTT 契约文档 (`contracts/mqtt-contracts.md`)
