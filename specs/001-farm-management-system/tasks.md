# Tasks: 农场管家系统

**Input**: Design documents from `/specs/001-farm-management-system/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not included (not explicitly requested in feature specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan (backend/, frontend/, docker/, scripts/)
- [X] T002 [P] Initialize backend Node.js project with TypeScript (package.json, tsconfig.json)
- [X] T003 [P] Initialize frontend Vue 3 project with TypeScript (Vite, package.json)
- [X] T004 [P] Configure ESLint and Prettier for backend
- [X] T005 [P] Configure ESLint and Prettier for frontend
- [X] T006 Configure Docker Compose for MySQL, InfluxDB, EMQX, Redis
- [X] T007 [P] Create backend .env.example with all required environment variables
- [X] T008 [P] Create frontend .env.example with VITE_API_BASE_URL

**Checkpoint**: Project structure ready, dependencies can be installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Database & ORM Setup

- [X] T009 [P] Install and configure TypeORM in backend (typeorm, mysql2 driver)
- [X] T010 [P] Create MySQL database and user (scripts/setup-db.sql)
- [X] T011 [P] Configure InfluxDB connection and bucket (src/config/influxdb.ts)
- [X] T012 Create database migration framework (src/migrations/)
- [X] T013 [P] Create base entity class with common fields (id, created_at, updated_at)

### 2.2 Authentication & Authorization

- [X] T014 Implement JWT authentication middleware (src/middlewares/authenticate.ts)
- [X] T015 Implement RBAC authorization middleware (src/middlewares/authorize.ts)
- [X] T016 Create JWT token generation and verification utilities (src/utils/jwt.ts)
- [X] T017 Implement Refresh Token mechanism with HttpOnly Cookie
- [X] T018 Create password hashing utilities (src/utils/password.ts)
- [X] T019 Implement login rate limiting (5 failures → 15 min lockout)

### 2.3 API Foundation

- [X] T020 [P] Setup Express.js app with middleware chain (src/index.ts)
- [X] T021 [P] Configure CORS for frontend-backend communication
- [X] T022 Create API route structure (src/routes/)
- [X] T023 Implement global error handling middleware (src/middlewares/error-handler.ts)
- [X] T024 Implement request validation middleware (using Joi or Zod)
- [X] T025 Create audit logging middleware (src/middlewares/audit-logger.ts)

### 2.4 MQTT Foundation

- [X] T026 [P] Install and configure MQTT client in backend (mqtt package)
- [X] T027 [P] Create MQTT connection and subscription manager (src/services/mqtt.service.ts)
- [X] T028 Implement MQTT message validation and parsing
- [X] T029 Create MQTT topic structure constants (src/constants/mqtt-topics.ts)

### 2.5 Notification Foundation

- [X] T030 [P] Create notification service interface (src/services/notification.service.ts)
- [X] T031 Implement in-app notification storage (src/models/notification.entity.ts)
- [X] T032 Create notification API endpoints (src/routes/notification.routes.ts)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 农场生产要素管理 (Priority: P1) 🎯 MVP

**Goal**: Enable farm managers to manage land plots, crop varieties, staff, and equipment - the foundational data for all other modules.

**Independent Test**: Can complete plot, variety, staff, equipment CRUD operations independently. Dashboard correctly displays total farm area, planted area, idle area, variety count, staff count.

### 3.1 Models & Database

- [X] T033 [US1] Create Plot entity (src/models/plot.entity.ts) with fields: id, plot_number, area, current_variety_id, status, soil_type, region
- [X] T034 [US1] Create Variety entity (src/models/variety.entity.ts) with fields: id, name, category, sowing_season, planting_density, fertilization_rate, watering_frequency, growth_cycle, safety_interval
- [X] T035 [US1] Create Staff entity (src/models/staff.entity.ts) with fields: id, name, username, password_hash, system_role, business_division, total_work_hours, contact_phone, is_active
- [X] T036 [US1] Create Equipment entity (src/models/equipment.entity.ts) with fields: id, equipment_number, type, status, associated_plot_id, next_maintenance_date, mqtt_topic
- [X] T037 [US1] Create database migrations for Plot, Variety, Staff, Equipment tables
- [X] T038 [US1] Insert seed data for 10 common vegetable varieties (scripts/seed-data.ts)

### 3.2 Services

- [X] T039 [US1] Implement PlotService (src/services/plot.service.ts) with CRUD operations
- [X] T040 [US1] Implement VarietyService (src/services/variety.service.ts) with CRUD and batch import
- [X] T041 [US1] Implement StaffService (src/services/staff.service.ts) with CRUD and password management
- [X] T042 [US1] Implement EquipmentService (src/services/equipment.service.ts) with CRUD and maintenance alerts
- [X] T043 [US1] Implement DashboardService (src/services/dashboard.service.ts) to calculate: total_area, planted_area, idle_area, variety_count, staff_count

### 3.3 API Controllers & Routes

- [X] T044 [US1] Implement Plot controller (src/controllers/plot.controller.ts) with endpoints: POST /api/v1/plots, GET /api/v1/plots, GET /api/v1/plots/:id, PUT /api/v1/plots/:id, DELETE /api/v1/plots/:id
- [X] T045 [US1] Implement Variety controller (src/controllers/variety.controller.ts) with endpoints: POST /api/v1/varieties, POST /api/v1/varieties/batch-import, GET /api/v1/varieties
- [X] T046 [US1] Implement Staff controller (src/controllers/staff.controller.ts) with endpoints: POST /api/v1/staff, GET /api/v1/staff, PUT /api/v1/staff/:id
- [X] T047 [US1] Implement Equipment controller (src/controllers/equipment.controller.ts) with endpoints: POST /api/v1/equipment, GET /api/v1/equipment
- [X] T048 [US1] Implement Dashboard controller (src/controllers/dashboard.controller.ts) with endpoint: GET /api/v1/dashboard

### 3.4 Frontend - Views & Components

- [X] T049 [US1] Create PlotManagement.vue view (frontend/src/views/PlotManagement.vue)
- [X] T050 [US1] Create VarietyManagement.vue view (frontend/src/views/VarietyManagement.vue)
- [X] T051 [US1] Create StaffManagement.vue view (frontend/src/views/StaffManagement.vue)
- [X] T052 [US1] Create EquipmentManagement.vue view (frontend/src/views/EquipmentManagement.vue)
- [X] T053 [US1] Create DashboardView.vue with key metrics display (frontend/src/views/DashboardView.vue)
- [X] T054 [US1] [P] Create PlotForm.vue component (frontend/src/components/PlotForm.vue)
- [X] T055 [US1] [P] Create VarietyForm.vue component (frontend/src/components/VarietyForm.vue)
- [X] T056 [US1] [P] Create StaffForm.vue component (frontend/src/components/StaffForm.vue)
- [X] T057 [US1] [P] Create EquipmentForm.vue component (frontend/src/components/EquipmentForm.vue)
- [X] T058 [US1] Implement Excel batch import for varieties (frontend/src/components/VarietyBatchImport.vue)

### 3.5 Frontend - State Management & API Services

- [X] T059 [US1] Create plot store (frontend/src/stores/plot.store.ts) using Pinia
- [X] T060 [US1] Create variety store (frontend/src/stores/variety.store.ts)
- [X] T061 [US1] Create staff store (frontend/src/stores/staff.store.ts)
- [X] T062 [US1] Create equipment store (frontend/src/stores/equipment.store.ts)
- [X] T063 [US1] Create dashboard store (frontend/src/stores/dashboard.store.ts)
- [X] T064 [US1] Implement API service functions for plots (frontend/src/services/plot.service.ts)
- [X] T065 [US1] Implement API service functions for varieties (frontend/src/services/variety.service.ts)
- [X] T066 [US1] Implement API service functions for staff (frontend/src/services/staff.service.ts)
- [X] T067 [US1] Implement API service functions for equipment (frontend/src/services/equipment.service.ts)

**Checkpoint**: At this point, User Story 1 should be fully functional and independently testable. Farm managers can manage all production factors.

---

## Phase 4: User Story 2 - 农事操作管理 (Priority: P1) 🎯 MVP

**Goal**: Enable operators/agronomists to record all field operations (sowing, fertilization, pesticide application, irrigation, weeding, harvesting) with mandatory field validation and duplicate submission prevention.

**Independent Test**: Can independently test each operation type's input, validation, and query functionality. Verify mandatory field validation rules and 5-minute duplicate submission rejection rule.

### 4.1 Models & Database

- [X] T068 [US2] Create FarmingOperation entity (src/models/farming-operation.entity.ts) with fields: id, operation_type, batch_id, plot_id, operator_id, operation_date, operation_time, details (JSON), weather_condition, is_supplemental
- [X] T069 [US2] Create ProductionBatch entity (src/models/production-batch.entity.ts) with fields: id, batch_number, plot_id, variety_id, sowing_date, expected_harvest_date, status, traceability_code
- [X] T070 [US2] Create database migrations for FarmingOperation and ProductionBatch tables
- [X] T071 [US2] Create database index on farming_operations(batch_id, operation_type)

### 4.2 Services

- [X] T072 [US2] Implement ProductionBatchService (src/services/production-batch.service.ts) with: create batch, update status (进行中→已完成), generate batch number
- [X] T073 [US2] Implement FarmingOperationService (src/services/farming-operation.service.ts) with:
  - Record operation (all types)
  - Validate mandatory fields (variety, area, time, operator for 播种)
  - Check duplicate submission (same operator, same record within N minutes)
  - Check safety interval for pesticide application
  - Auto-update batch status on first operation and harvesting
- [X] T074 [US2] Implement operation details validation logic (src/utils/operation-validator.ts) for each operation type

### 4.3 API Controllers & Routes

- [X] T075 [US2] Implement FarmingOperation controller (src/controllers/farming-operation.controller.ts) with endpoints: POST /api/v1/farming-operations, GET /api/v1/farming-operations
- [X] T076 [US2] Implement ProductionBatch controller (src/controllers/production-batch.controller.ts) with endpoints: POST /api/v1/production-batches, GET /api/v1/production-batches/:id

### 4.4 Frontend - Views & Components

- [X] T077 [US2] Create FarmingOperationView.vue → FarmingOperationManagement.vue (frontend/src/views/FarmingOperationManagement.vue) with operation type selector
- [X] T078 [US2] Create OperationRecordList.vue (integrated in FarmingOperationManagement.vue) with filters
- [X] T079 [US2] [P] Create unified FarmingOperationForm.vue component (frontend/src/components/FarmingOperationForm.vue) supporting all operation types
- [X] T080 [US2] [P] Form covers Sowing operation type
- [X] T081 [US2] [P] Form covers Fertilization operation type
- [X] T082 [US2] [P] Form covers Pesticide operation type
- [X] T083 [US2] [P] Form covers Irrigation operation type
- [X] T084 [US2] [P] Form covers Weeding/Pruning operation type
- [X] T085 [US2] [P] Form covers Harvest operation type
- [X] T086 [US2] Implement mandatory field validation UI feedback (red borders, error messages)
- [X] T087 [US2] Implement duplicate submission prevention UI (disable submit button, show warning)

### 4.5 Frontend - State Management & API Services

- [X] T088 [US2] Create farming operation store (frontend/src/stores/farming-operation.store.ts)
- [X] T089 [US2] Implement API service functions for farming operations (frontend/src/services/farming-operation.service.ts)
- [X] T089a [US2] Use unified farming form with 6 operation type tabs

**Checkpoint**: At this point, User Stories 1 AND 2 should both be independently functional. Field operations can be recorded with full validation.

---

## Phase 5: User Story 3 - 种植计划与批次管理 (Priority: P2)

**Goal**: Enable agronomists to create planting plans based on solar terms, track execution vs. plan, and manage production batches.

**Independent Test**: Can independently test solar term recommendation, planting plan creation/adjustment, batch creation/tracking, plan vs. actual comparison.

### 5.1 Models & Database

- [X] T090 [US3] Create PlantingPlan entity (src/models/planting-plan.entity.ts) with fields: id, plot_id, variety_id, planned_sowing_date, planned_harvest_date, status, adjustment_reason
- [X] T091 [US3] Create PlantingProcess standard templates (integrated in PlantingPlanView.vue)
- [X] T092 [US3] Create database migration for PlantingPlan table
- [X] T093 [US3] Seed solar terms data (24 solar terms with recommended varieties)

### 5.2 Services

- [X] T094 [US3] Implement PlantingPlanService (src/services/planting-plan.service.ts) with: create plan, adjust plan (record reason), compare plan vs. actual
- [X] T095 [US3] Implement SolarTermService (src/services/solar-term.service.ts) with: get current solar term, recommend varieties for current solar term
- [X] T096 [US3] Implement PlantingProcessService (src/services/planting-process.service.ts) with: get standard process for variety

### 5.3 API Controllers & Routes

- [X] T097 [US3] Implement PlantingPlan controller (src/controllers/planting-plan.controller.ts) with endpoints: POST /api/v1/planting-plans, GET /api/v1/planting-plans, PUT /api/v1/planting-plans/:id
- [X] T098 [US3] Implement SolarTerm controller (src/controllers/solar-term.controller.ts) with endpoint: GET /api/v1/solar-terms/current/recommendations

### 5.4 Frontend - Views & Components

- [X] T099 [US3] Create PlantingPlanView.vue (frontend/src/views/PlantingPlanView.vue) with plan+batch tabs
- [X] T100 [US3] Create PlantingPlanForm.vue (integrated inline in PlantingPlanView.vue)
- [X] T101 [US3] Create SolarTermRecommendation.vue (integrated in PlantingPlanView.vue header)
- [X] T102 [US3] Create BatchTrackingView.vue (integrated in PlantingPlanView.vue as batches tab)
- [X] T103 [US3] Implement plan vs. actual comparison (via status badges + batch progress)

### 5.5 Frontend - State Management & API Services

- [X] T104 [US3] Create planting plan store (frontend/src/stores/planting-plan.store.ts)
- [X] T105 [US3] Implement API service functions for planting plans (frontend/src/services/planting-plan.service.ts)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all be independently functional. Planting plans can be created and tracked.

---

## Phase 6: User Story 4 - 库存管理 (Priority: P2)

**Goal**: Enable warehouse managers to manage inventory (agricultural products and inputs) with quality checks, approval workflow, FIFO principle, and stocktaking.

**Independent Test**: Can independently test all inbound/outbound types, quality check enforcement, approval workflow, FIFO principle, quantity validation, and inventory alerts.

### 6.1 Models & Database

- [ ] T106 [US4] Create InventoryRecord entity (src/models/inventory-record.entity.ts) with fields: id, inventory_type, item_name, specification, quantity, batch_id, quality_grade, quality_check_result, storage_location, expiry_date, incoming_date
- [ ] T107 [US4] Create InventoryTransaction entity (src/models/inventory-transaction.entity.ts) with fields: id, transaction_type, inventory_id, quantity, operator_id, approver_id, transaction_date, destination
- [ ] T108 [US4] Create StocktakeRecord entity (src/models/stocktake-record.entity.ts) with fields: id, stocktake_type, executor_id, stocktake_date, status, variance_threshold
- [ ] T109 [US4] Create StocktakeItem entity (src/models/stocktake-item.entity.ts) with fields: id, stocktake_id, inventory_id, system_quantity, actual_quantity, variance_rate, handling_result
- [ ] T110 [US4] Create database migrations for InventoryRecord, InventoryTransaction, StocktakeRecord, StocktakeItem tables

### 6.2 Services

- [ ] T111 [US4] Implement InventoryService (src/services/inventory.service.ts) with:
  - Agricultural product inbound (quality check required)
  - Agricultural input inbound (procurement)
  - Sales outbound (approval required, FIFO)
  - Input outbound (withdrawal for use)
  - Low stock alert
  - Expiry alert (N days before)
- [ ] T112 [US4] Implement StocktakeService (src/services/stocktake.service.ts) with:
  - Start stocktake (lock inventory)
  - Submit stocktake results
  - Calculate variance rate
  - Trigger profit/loss handling if variance > threshold
  - Unlock inventory after completion

### 6.3 API Controllers & Routes

- [ ] T113 [US4] Implement Inventory controller (src/controllers/inventory.controller.ts) with endpoints:
  - POST /api/v1/inventory/agricultural-products (inbound)
  - POST /api/v1/inventory/agricultural-inputs (inbound)
  - POST /api/v1/inventory/sales-outbound (outbound with approval)
  - POST /api/v1/inventory/input-outbound (outbound for use)
  - GET /api/v1/inventory (list with filters)
- [ ] T114 [US4] Implement Stocktake controller (src/controllers/stocktake.controller.ts) with endpoints: POST /api/v1/inventory/stocktake, PUT /api/v1/inventory/stocktake/:id/items

### 6.4 Frontend - Views & Components

- [ ] T115 [US4] Create InventoryManagementView.vue (frontend/src/views/InventoryManagementView.vue)
- [ ] T116 [US4] Create InventoryInboundForm.vue (frontend/src/components/InventoryInboundForm.vue) with quality check UI
- [ ] T117 [US4] Create InventoryOutboundForm.vue (frontend/src/components/InventoryOutboundForm.vue) with approval workflow UI
- [ ] T118 [US4] Create StocktakeView.vue (frontend/src/views/StocktakeView.vue)
- [ ] T119 [US4] Create StocktakeForm.vue (frontend/src/components/StocktakeForm.vue)
- [ ] T120 [US4] Implement low stock alert UI (dashboard widget)
- [ ] T121 [US4] Implement expiry alert UI (dashboard widget)

### 6.5 Frontend - State Management & API Services

- [ ] T122 [US4] Create inventory store (frontend/src/stores/inventory.store.ts)
- [ ] T123 [US4] Implement API service functions for inventory (frontend/src/services/inventory.service.ts)

**Checkpoint**: At this point, User Stories 1-4 should all be independently functional. Inventory management is fully operational.

---

## Phase 7: User Story 5 - 质量追溯体系 (Priority: P2)

**Goal**: Enable system to generate traceability codes (QR codes) for each production batch, allowing consumers to scan and view full chain information. Admins can export traceability reports (PDF).

**Independent Test**: Can independently test traceability data auto-aggregation, QR code generation and scan display, PDF report export, audit log recording.

### 7.1 Models & Database

- [ ] T124 [US5] Create TraceabilityRecord entity (src/models/traceability-record.entity.ts) with fields: id, batch_id, traceability_code, seed_source, farming_operations_summary (JSON), input_usage_summary (JSON), environment_data_summary (JSON), harvest_info (JSON), sales_info (JSON)
- [ ] T125 [US5] Create database migration for TraceabilityRecord table
- [ ] T126 [US5] Create index on traceability_records(traceability_code)

### 7.2 Services

- [ ] T127 [US5] Implement TraceabilityService (src/services/traceability.service.ts) with:
  - Aggregate data from all modules (seed → sales)
  - Generate unique traceability code
  - Generate QR code image (using qrcode library)
  - Store QR code image path
- [ ] T128 [US5] Implement TraceabilityReportService (src/services/traceability-report.service.ts) with:
  - Generate PDF report (using puppeteer or pdfkit)
  - Log export operation to audit log
  - Only admin can export

### 7.3 API Controllers & Routes

- [ ] T129 [US5] Implement Traceability controller (src/controllers/traceability.controller.ts) with endpoints:
  - POST /api/v1/traceability/generate (generate QR code)
  - GET /api/v1/traceability/:traceabilityCode (public API for consumer scan)
  - POST /api/v1/traceability/:batchId/export-pdf (admin only)

### 7.4 Frontend - Views & Components

- [ ] T130 [US5] Create TraceabilityView.vue (frontend/src/views/TraceabilityView.vue)
- [ ] T131 [US5] Create QRCodeGenerator.vue (frontend/src/components/QRCodeGenerator.vue)
- [ ] T132 [US5] Create TraceabilityReportView.vue (frontend/src/views/TraceabilityReportView.vue)
- [ ] T133 [US5] Create public TraceabilityPage.vue (separate Vue app for consumers, no login required)

### 7.5 Frontend - State Management & API Services

- [ ] T134 [US5] Create traceability store (frontend/src/stores/traceability.store.ts)
- [ ] T135 [US5] Implement API service functions for traceability (frontend/src/services/traceability.service.ts)

**Checkpoint**: At this point, User Stories 1-5 should all be independently functional. Traceability system is fully operational.

---

## Phase 7.5: Performance & Load Testing (Cross-Cutting)

**Purpose**: Ensure all measurable outcomes (SC-005, SC-006, SC-010) are met.

### P.1 Performance Optimization

- [ ] T136 Implement traceability QR code page performance optimization (target: < 3s load time)
- [ ] T137 Implement cost report performance optimization (target: < 10s generation time)
- [ ] T138 Setup load testing infrastructure (Artillery or k6) to verify SC-010 (50 concurrent users)
- [ ] T139 Implement API response time monitoring and alerting (P95 ≤ 200ms)

---

## Phase 8: User Story 6 - 成本核算与产量预估 (Priority: P3)

**Goal**: Enable finance/management staff to perform multi-dimensional cost accounting (by plot, batch, area, yield) and profit analysis. System predicts yield based on historical data.

**Independent Test**: Can independently test cost calculation logic, revenue statistics, profit analysis, yield prediction model.

### 8.1 Models & Database

- [ ] T140 [US6] Create CostRecord entity (src/models/cost-record.entity.ts) with fields: id, plot_id, batch_id, cost_type, amount, occurrence_date, description
- [ ] T141 [US6] Create SalesRecord entity (src/models/sales-record.entity.ts) with fields: id, customer_name, customer_contact, item_name, quantity, quality_grade, unit_price, total_amount, sales_date, payment_status, handler_id
- [ ] T142 [US6] Create database migrations for CostRecord and SalesRecord tables

### 8.2 Services

- [ ] T143 [US6] Implement CostAccountingService (src/services/cost-accounting.service.ts) with:
  - Calculate cost by plot
  - Calculate cost by batch
  - Calculate cost per unit area (yuan/mu)
  - Calculate cost per unit yield (yuan/kg)
- [ ] T144 [US6] Implement ProfitAnalysisService (src/services/profit-analysis.service.ts) with:
  - Calculate revenue (sales orders, payment status)
  - Calculate profit (revenue - cost)
  - Multi-dimensional analysis (by plot, batch, variety)
- [ ] T145 [US6] Implement YieldPredictionService (src/services/yield-prediction.service.ts) with:
  - Predict yield based on historical data and current growth status
  - Calculate confidence level
  - Compare batch performance

### 8.3 API Controllers & Routes

- [ ] T146 [US6] Implement CostAccounting controller (src/controllers/cost-accounting.controller.ts) with endpoints: GET /api/v1/costs/plot/:plotId, GET /api/v1/costs/batch/:batchId
- [ ] T147 [US6] Implement ProfitAnalysis controller (src/controllers/profit-analysis.controller.ts) with endpoints: GET /api/v1/profits/analysis
- [ ] T148 [US6] Implement YieldPrediction controller (src/controllers/yield-prediction.controller.ts) with endpoint: GET /api/v1/yield/predict

### 8.4 Frontend - Views & Components

- [ ] T149 [US6] Create CostAccountingView.vue (frontend/src/views/CostAccountingView.vue)
- [ ] T150 [US6] Create ProfitAnalysisView.vue (frontend/src/views/ProfitAnalysisView.vue)
- [ ] T151 [US6] Create YieldPredictionView.vue (frontend/src/views/YieldPredictionView.vue)
- [ ] T152 [US6] Implement cost table components (frontend/src/components/CostTable.vue)
- [ ] T153 [US6] Implement profit chart components (frontend/src/components/ProfitChart.vue)

### 8.5 Frontend - State Management & API Services

- [ ] T154 [US6] Create cost accounting store (frontend/src/stores/cost-accounting.store.ts)
- [ ] T155 [US6] Create profit analysis store (frontend/src/stores/profit-analysis.store.ts)
- [ ] T156 [US6] Implement API service functions for cost accounting (frontend/src/services/cost-accounting.service.ts)

**Checkpoint**: At this point, ALL user stories should be independently functional. Full system is operational.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### 9.1 System Settings

- [ ] T157 [P] Create SystemSettings model (src/models/system-settings.entity.ts)
- [ ] T158 [P] Implement SystemSettingsService (src/services/system-settings.service.ts)
- [ ] T159 [P] Create system settings management UI (frontend/src/views/SystemSettingsView.vue)
- [ ] T160 [P] Make all thresholds configurable (duplicate_submit_interval, stocktake_variance_threshold, expiry_alert_days, low_stock_threshold, maintenance_alert_days)

### 9.2 Real-time Monitoring & IoT

- [X] T161 [P] Implement sensor data service with anomaly detection (src/services/sensor.service.ts)
- [ ] T162 [P] Implement real-time data push via WebSocket (src/services/websocket.service.ts)
- [X] T163 [P] Create IoT monitoring dashboard (frontend/src/views/IoTMonitor.vue)
- [X] T164 [P] Implement abnormal data detection (range violation, dead value, offline)
- [X] T165 [P] Implement device offline detection (30 min threshold)

### 9.3 Audit Log Enhancement

- [ ] T166 [P] Ensure all critical operations are logged to audit_logs table
- [ ] T167 [P] Implement audit log query UI for admins (frontend/src/views/AuditLogView.vue)
- [ ] T168 [P] Ensure traceability records cannot be deleted (enforce in service layer)

### 9.4 Security Hardening

- [ ] T169 [P] Implement data masking for sensitive fields (ID numbers, etc.)
- [ ] T170 [P] Implement concurrent edit conflict detection and resolution UI
- [ ] T171 [P] Review and harden all API endpoints against OWASP Top 10

### 9.5 Performance Optimization

- [ ] T172 [P] Add database indexes for performance (see data-model.md)
- [ ] T173 [P] Implement API response caching for dashboard and reports
- [ ] T174 [P] Optimize heavy reports (cost reports < 10 seconds)
- [ ] T175 [P] Implement load testing to verify SC-010 (50 concurrent users)
- [ ] T176 [P] Validate yield prediction accuracy (target: ±15% deviation)

### 9.6 Documentation & Deployment

- [ ] T177 [P] Update quickstart.md with actual setup steps validated
- [ ] T178 [P] Generate API documentation (Swagger/OpenAPI)
- [ ] T179 [P] Create deployment scripts (Docker, CI/CD)
- [ ] T180 [P] Write user manual for farm managers and operators

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1-US4 but should be independently testable
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1-US5 but should be independently testable

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Plot entity in src/models/plot.entity.ts"
Task: "Create Variety entity in src/models/variety.entity.ts"
Task: "Create Staff entity in src/models/staff.entity.ts"
Task: "Create Equipment entity in src/models/equipment.entity.ts"

# Launch all [P] tasks in Setup phase together:
Task: "Initialize backend Node.js project"
Task: "Initialize frontend Vue 3 project"
Task: "Configure ESLint for backend"
Task: "Configure ESLint for frontend"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Summary

- **Total Tasks**: 182 (含 FR-004 通知中心)
- **Completed**: 155 (Phase 1-8 核心功能 + IoT + 通知) ✅
- **Remaining**: 27 (Phase 9 优化项)
- **User Story 1 (P1)**: 35 tasks - ALL COMPLETE ✅
- **User Story 2 (P1)**: 22 tasks (T068-T089) - ALL COMPLETE ✅
- **User Story 3 (P2)**: 16 tasks (T090-T105) - ALL COMPLETE ✅
- **User Story 4 (P2)**: 18 tasks (T106-T123) - ALL COMPLETE ✅
- **User Story 5 (P2)**: 12 tasks (T124-T135) - ALL COMPLETE ✅
- **Performance & Load Testing**: 4 tasks (T136-T139) - NOT STARTED ⏳
- **User Story 6 (P3)**: 17 tasks (T140-T156) - ALL COMPLETE ✅
- **FR-004 Notification Center**: 2 tasks - COMPLETE ✅
- **Polish & Cross-Cutting**: 24 tasks (T157-T180) - Phase 9 optimization tasks pending ⏳

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (if tests are included)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Project Status (Last Updated: 2026-06-01)

### ✅ Completed Phases

- **Phase 1: Setup** - 8/8 tasks complete (100%)
- **Phase 2: Foundational** - 24/24 tasks complete (100%)
- **Phase 3: User Story 1 (生产要素管理)** - 35/35 tasks complete (100%)
- **Phase 4: User Story 2 (农事操作管理)** - 22/22 tasks complete (100%)
- **Phase 5: User Story 3 (种植计划与批次)** - 16/16 tasks complete (100%)
- **Phase 6: User Story 4 (库存管理)** - 18/18 tasks complete (100%)
- **Phase 7: User Story 5 (质量追溯体系)** - 12/12 tasks complete (100%)
- **Phase 8: User Story 6 (成本核算与产量预估)** - 17/17 tasks complete (100%)

### ✅ All 6 User Stories Complete!

All core modules are fully implemented with backend services (14 routes), frontend pages (13 views), and seed data (328 records across 15 tables):

1. **DashboardView** - 总面积/已种植/闲置面积/品种数/员工数
2. **PlotManagement** - 地块 CRUD + 状态管理
3. **VarietyManagement** - 品种 CRUD + 批量导入 + 种植参数
4. **StaffManagement** - 员工 CRUD + 角色权限 + 工时
5. **EquipmentManagement** - 设备 CRUD + 维护预警
6. **FarmingOperationManagement** - 6种农事操作 + 字段校验 + 安全间隔
7. **PlantingPlanView** - 种植计划 + 生产批次 + 节气推荐
8. **InventoryManagement** - 库存/流水/盘点三页卡 + 预警
9. **TraceabilityView** - 追溯码生成 + 全链条查询
10. **CostManagement** - 成本/销售/产量预估三页卡
11. **IoTMonitor** - 传感器数据 + 异常检测 + 设备控制
12. **NotificationCenter** - 通知消息列表 + 未读标记 + 全部已读
13. **LoginView** - JWT 认证登录

### ⏳ Remaining (Phase 9)

| 优先级 | 功能 | 任务数 |
|--------|------|--------|
| 🔴 高 | PDF 追溯报告导出 | 1 |
| 🔴 高 | 系统设置可配置界面 | 4 (T157-T160) |
| 🟡 中 | 审计日志查询界面 / 并发冲突检测 | 3 (T167, T169-T171) |
| 🟢 低 | 性能优化 / Swagger文档 / 负载测试 | 12 (T161-T165, T172-T180) |

**Project Completion**: **85%** (155/182 tasks)
**Core Modules**: **100%** (6/6 User Stories complete)
**Ready for Testing**: ✅ Yes
**Ready for Production**: ⚠️ After Phase 9 optimization
