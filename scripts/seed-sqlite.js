"use strict";
const Database = require('../backend/node_modules/better-sqlite3');
const bcrypt = require('../backend/node_modules/bcrypt');
const crypto = require('crypto');

const db = new Database('D:/Codebuddy/CodeBuddy/nyjc/backend/farm_management.sqlite');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const u = () => crypto.randomUUID();
const f = d => d.toISOString().slice(0, 10);
function ago(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

// ===== 创建所有表 =====
console.log('Creating tables...');
const createSQL = `
CREATE TABLE IF NOT EXISTS plots(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, plot_number TEXT UNIQUE, area REAL, status TEXT DEFAULT 'idle', soil_type TEXT, region TEXT, current_variety_id TEXT);
CREATE TABLE IF NOT EXISTS staff(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, name TEXT, username TEXT UNIQUE, password_hash TEXT, system_role TEXT, business_division TEXT, total_work_hours INTEGER DEFAULT 0, contact_phone TEXT, is_active INTEGER DEFAULT 1, last_login_at TEXT);
CREATE TABLE IF NOT EXISTS varieties(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, name TEXT UNIQUE, category TEXT, sowing_season TEXT, planting_density INTEGER, fertilization_rate REAL, watering_frequency INTEGER, growth_cycle INTEGER, safety_interval INTEGER, is_active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS equipment(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, equipment_number TEXT, type TEXT, status TEXT, associated_plot_id TEXT, next_maintenance_date TEXT, mqtt_topic TEXT);
CREATE TABLE IF NOT EXISTS planting_plans(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, plot_id TEXT, plot_name TEXT, variety_id TEXT, variety_name TEXT, planned_sow_date TEXT, planned_harvest_date TEXT, status TEXT, solar_term TEXT, area REAL, adjust_reason TEXT, adjust_date TEXT, batch_id TEXT, remark TEXT);
CREATE TABLE IF NOT EXISTS production_batches(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, batch_number TEXT UNIQUE, plot_id TEXT, plot_name TEXT, variety_id TEXT, variety_name TEXT, sow_date TEXT, estimated_harvest_date TEXT, status TEXT, actual_harvest_date TEXT, area REAL, traceability_code TEXT, plan_id TEXT, remark TEXT);
CREATE TABLE IF NOT EXISTS farming_operations(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, operation_type TEXT, plot_id TEXT, plot_name TEXT, variety_id TEXT, variety_name TEXT, batch_id TEXT, area REAL, fertilizer_name TEXT, fertilizer_amount REAL, fertilizer_unit TEXT, pesticide_name TEXT, pesticide_amount REAL, pesticide_unit TEXT, water_amount REAL, water_unit TEXT, water_duration INTEGER, water_duration_unit TEXT, work_description TEXT, harvest_yield REAL, yield_unit TEXT, quality_grade TEXT, harvest_destination TEXT, operator_name TEXT, operation_date TEXT, weather TEXT, temperature REAL, remark TEXT, crop_stage TEXT, is_supplemental INTEGER DEFAULT 0, supplemental_operation_date TEXT);
CREATE TABLE IF NOT EXISTS inventory(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, type TEXT, name TEXT, spec TEXT, quantity REAL, unit TEXT, batch_number TEXT, location TEXT, quality_grade TEXT, quality_passed INTEGER, expiry_date TEXT, min_stock REAL, remark TEXT);
CREATE TABLE IF NOT EXISTS stock_transactions(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, type TEXT, sub_type TEXT, description TEXT, inventory_id TEXT, item_name TEXT, quantity REAL, unit TEXT, operator TEXT, approver TEXT, source_or_dest TEXT, plot_id TEXT, batch_number TEXT, transaction_date TEXT, remark TEXT);
CREATE TABLE IF NOT EXISTS stocktakes(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, type TEXT, executor TEXT, inventory_id TEXT, item_name TEXT, system_quantity REAL, actual_quantity REAL, unit TEXT, discrepancy REAL, discrepancy_rate REAL, result TEXT, remark TEXT);
CREATE TABLE IF NOT EXISTS traceability_records(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, trace_code TEXT UNIQUE, batch_id TEXT, batch_number TEXT, plot_name TEXT, variety_name TEXT, sow_date TEXT, harvest_date TEXT, area REAL, operations_data TEXT, inputs_data TEXT, inventory_data TEXT, sales_data TEXT, qr_code_url TEXT, exported_at TEXT, exported_by TEXT);
CREATE TABLE IF NOT EXISTS cost_records(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, type TEXT, description TEXT, amount REAL, date TEXT, plot_id TEXT, batch_id TEXT, remark TEXT);
CREATE TABLE IF NOT EXISTS sales_records(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, customer TEXT, product TEXT, variety_name TEXT, quantity REAL, unit TEXT, unit_price REAL, total_amount REAL, batch_id TEXT, batch_number TEXT, payment_status TEXT, sale_date TEXT, salesperson TEXT, remark TEXT);
CREATE TABLE IF NOT EXISTS sensor_data(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, plot_id TEXT, device_id TEXT, sensor_type TEXT, unit TEXT, value REAL, recorded_at TEXT, equipment_id TEXT);
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, user_id TEXT, message TEXT, is_read INTEGER DEFAULT 0, type TEXT, link TEXT, read_at TEXT);
CREATE TABLE IF NOT EXISTS system_settings(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, setting_key TEXT UNIQUE, setting_value TEXT, setting_type TEXT DEFAULT 'string', description TEXT, updated_by TEXT);
CREATE TABLE IF NOT EXISTS audit_logs(id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, user_id TEXT, username TEXT, action_type TEXT, action_params TEXT, result TEXT, ip_address TEXT, user_agent TEXT);
`;
for (const stmt of createSQL.split(';').filter(s => s.trim())) db.exec(stmt + ';');
console.log('OK\n');

// 清空所有表数据以便重新播种
console.log('Clearing existing data...');
db.exec(`
  DELETE FROM sensor_data;
  DELETE FROM notifications;
  DELETE FROM system_settings;
  DELETE FROM audit_logs;
  DELETE FROM cost_records;
  DELETE FROM sales_records;
  DELETE FROM stock_transactions;
  DELETE FROM stocktakes;
  DELETE FROM traceability_records;
  DELETE FROM inventory;
  DELETE FROM farming_operations;
  DELETE FROM production_batches;
  DELETE FROM planting_plans;
  DELETE FROM equipment;
  DELETE FROM varieties;
  DELETE FROM staff;
  DELETE FROM plots;
`);
console.log('OK\n');

// ===== 1. Plots =====
console.log('1. Plots...');
const pid1 = u(), pid2 = u(), pid3 = u(), pid4 = u(), pid5 = u();
const plots = [
  { id: pid1, c: '2026-01-01T00:00:00.000Z', u: '2026-01-01T00:00:00.000Z', pn: 'A01', a: 2.0, s: '闲置', st: '壤土', r: 'A区' },
  { id: pid2, c: '2026-01-01T00:00:00.000Z', u: '2026-01-01T00:00:00.000Z', pn: 'A02', a: 3.0, s: '闲置', st: '砂壤土', r: 'A区' },
  { id: pid3, c: '2026-01-01T00:00:00.000Z', u: '2026-01-01T00:00:00.000Z', pn: 'B01', a: 5.0, s: '已种植', st: '黏土', r: 'B区' },
  { id: pid4, c: '2026-01-01T00:00:00.000Z', u: '2026-01-01T00:00:00.000Z', pn: 'B02', a: 4.0, s: '已种植', st: '壤土', r: 'B区' },
  { id: pid5, c: '2026-01-01T00:00:00.000Z', u: '2026-01-01T00:00:00.000Z', pn: 'C01', a: 1.0, s: '闲置', st: '砂壤土', r: 'C区' },
];
const insPlot = db.prepare('INSERT INTO plots(id,created_at,updated_at,plot_number,area,status,soil_type,region) VALUES(?,?,?,?,?,?,?,?)');
for (const p of plots) insPlot.run(p.id, p.c, p.u, p.pn, p.a, p.s, p.st, p.r);
console.log('  OK');

// ===== 2. Staff (including admin) =====
console.log('2. Staff...');
const staffData = [
  ['系统管理员', 'admin', '系统管理员', '管理部'],
  ['张农艺', 'agro', '农艺师', '技术部'],
  ['李克', 'operator1', '操作员', '田间作业'],
  ['王强', 'operator2', '操作员', '播种'],
  ['赵仓', 'warehouse', '操作员', '仓库管理'],
];
const insStaff = db.prepare('INSERT INTO staff(id,created_at,updated_at,name,username,password_hash,system_role,business_division,total_work_hours,contact_phone,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
for (const [name, uname, role, div] of staffData) {
  const h = bcrypt.hashSync(uname + '123', 10);
  const phone = '1' + String(Math.floor(Math.random() * 9000000000 + 1000000000));
  insStaff.run(u(), new Date().toISOString(), new Date().toISOString(), name, uname, h, role, div, Math.floor(Math.random() * 300), phone, 1);
}
console.log('  OK');

// ===== 3. Varieties (16) =====
console.log('3. Varieties...');
const varieties = [
  ['番茄', '果菜类', '["春","秋"]', 2500, 45, 3, 90, 7],
  ['黄瓜', '果菜类', '["春","夏"]', 2000, 35, 4, 75, 7],
  ['辣椒', '果菜类', '["春"]', 3000, 40, 3, 120, 14],
  ['生菜', '叶菜类', '["春","秋","冬"]', 5000, 25, 2, 45, 5],
  ['菠菜', '叶菜类', '["秋","冬"]', 6000, 20, 2, 40, 5],
  ['玉米', '粮食', '["春","夏"]', 4000, 50, 4, 120, 14],
  ['西瓜', '瓜果类', '["春","夏"]', 800, 30, 2, 80, 10],
  ['草莓', '浆果类', '["秋"]', 6000, 35, 3, 150, 7],
  ['茄子', '果菜类', '["春","夏"]', 2500, 35, 3, 100, 10],
  ['冬瓜', '瓜果类', '["春","夏"]', 1000, 30, 2, 110, 10],
  ['花椰菜', '花菜类', '["春","秋"]', 3500, 40, 3, 75, 7],
  ['西兰花', '花菜类', '["春","秋"]', 3500, 45, 3, 80, 7],
  ['胡萝卜', '根茎类', '["春","秋"]', 10000, 30, 2, 100, 14],
  ['白萝卜', '根茎类', '["秋","冬"]', 8000, 25, 2, 60, 7],
  ['芹菜', '叶菜类', '["春","秋","冬"]', 6000, 20, 2, 65, 7],
  ['葱', '香料类', '["全季"]', 15000, 20, 2, 50, 7],
];
const insVar = db.prepare('INSERT INTO varieties(id,created_at,updated_at,name,category,sowing_season,planting_density,fertilization_rate,watering_frequency,growth_cycle,safety_interval,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
for (const [n, cat, s, d, fw, w, g, si] of varieties) {
  insVar.run(u(), new Date().toISOString(), new Date().toISOString(), n, cat, s, d, fw, w, g, si, 1);
}
console.log('  OK');

// ===== 4. Equipment =====
console.log('4. Equipment...');
const insEq = db.prepare('INSERT INTO equipment(id,created_at,updated_at,equipment_number,type,status,associated_plot_id,next_maintenance_date,mqtt_topic) VALUES(?,?,?,?,?,?,?,?,?)');
for (const [num, type, st, apid, mdate, mqtt] of [
  ['EQ-IRR01', '灌溉设备', '正常', pid1, f(ago(30)), 'farm/A01/EQ-IRR01/data'],
  ['EQ-IRR02', '灌溉设备', '正常', pid2, f(ago(60)), 'farm/A02/EQ-IRR02/data'],
  ['EQ-IRR03', '灌溉设备', '维护中', pid3, f(ago(-3)), 'farm/B01/EQ-IRR03/data'],
  ['EQ-MACH01', '农机具', '正常', pid4, f(ago(45)), 'farm/B02/EQ-MACH01/data'],
  ['EQ-IOT01', '物联网设备', '正常', pid5, f(ago(90)), 'farm/+/EQ-IOT01/data'],
]) {
  insEq.run(u(), new Date().toISOString(), new Date().toISOString(), num, type, st, apid, mdate, mqtt);
}
console.log('  OK');

// ===== 5. Planting Plans =====
console.log('5. Plans...');
const planData = [
  [pid1, 'A01', '番茄', f(ago(100)), f(ago(-10)), '已完成', 2],
  [pid2, 'A02', '黄瓜', f(ago(80)), f(ago(-5)), '已完成', 3],
  [pid3, 'B01', '辣椒', f(ago(60)), f(ago(-60)), '执行中', 5],
  [pid4, 'B02', '西瓜', f(ago(50)), f(ago(-30)), '执行中', 4],
  [pid5, 'C01', '草莓', f(ago(30)), f(ago(-120)), '执行中', 1],
];
const insPlan = db.prepare('INSERT INTO planting_plans(id,created_at,updated_at,plot_id,plot_name,variety_name,planned_sow_date,planned_harvest_date,status,area) VALUES(?,?,?,?,?,?,?,?,?,?)');
for (const [pid, pn, vn, sd, eh, st, a] of planData) {
  insPlan.run(u(), new Date().toISOString(), new Date().toISOString(), pid, pn, vn, sd, eh, st, a);
}
console.log('  OK');

// ===== 6. Production Batches (每个品种至少一个已完成批次) =====
console.log('6. Batches...');
const batchIds = [];
const batchData = [
  // 已完成批次 — 保证所有品种都有数据
  ['P20260301-A01-番茄', pid1, 'A01', '番茄', f(ago(90)), f(ago(-5)), '已完成', f(ago(5)), 2],
  ['P20260315-A02-黄瓜', pid2, 'A02', '黄瓜', f(ago(75)), f(ago(0)), '已完成', f(ago(3)), 3],
  ['P20260401-B01-辣椒', pid3, 'B01', '辣椒', f(ago(95)), f(ago(-10)), '已完成', f(ago(8)), 5],
  ['P20260410-B02-西瓜', pid4, 'B02', '西瓜', f(ago(85)), f(ago(-5)), '已完成', f(ago(4)), 4],
  ['P20260501-C01-草莓', pid5, 'C01', '草莓', f(ago(150)), f(ago(-5)), '已完成', f(ago(6)), 1],
  // 额外已完成批次（历史数据，丰富对比）
  ['P20260201-A01-番茄2', pid1, 'A01', '番茄', f(ago(180)), f(ago(-95)), '已完成', f(ago(92)), 2],
  ['P20260215-A02-黄瓜2', pid2, 'A02', '黄瓜', f(ago(170)), f(ago(-95)), '已完成', f(ago(90)), 3],
  ['P20260101-B01-辣椒2', pid3, 'B01', '辣椒', f(ago(190)), f(ago(-100)), '已完成', f(ago(98)), 5],
  // 更多品种已完成批次
  ['P20260115-A01-生菜', pid1, 'A01', '生菜', f(ago(130)), f(ago(-85)), '已完成', f(ago(80)), 2],
  ['P20260201-A02-菠菜', pid2, 'A02', '菠菜', f(ago(120)), f(ago(-80)), '已完成', f(ago(75)), 3],
  ['P20260120-B01-玉米', pid3, 'B01', '玉米', f(ago(140)), f(ago(-20)), '已完成', f(ago(16)), 5],
  ['P20260401-A01-茄子', pid1, 'A01', '茄子', f(ago(130)), f(ago(-30)), '已完成', f(ago(25)), 2],
  ['P20260415-A02-冬瓜', pid2, 'A02', '冬瓜', f(ago(125)), f(ago(-15)), '已完成', f(ago(12)), 3],
  ['P20260301-B02-花椰菜', pid4, 'B02', '花椰菜', f(ago(130)), f(ago(-55)), '已完成', f(ago(50)), 4],
  ['P20260315-B02-西兰花', pid4, 'B02', '西兰花', f(ago(120)), f(ago(-40)), '已完成', f(ago(36)), 4],
  ['P20260501-C01-胡萝卜', pid5, 'C01', '胡萝卜', f(ago(135)), f(ago(-35)), '已完成', f(ago(32)), 1],
  ['P20260515-C01-白萝卜', pid5, 'C01', '白萝卜', f(ago(100)), f(ago(-40)), '已完成', f(ago(38)), 1],
  ['P20260601-C01-芹菜', pid5, 'C01', '芹菜', f(ago(100)), f(ago(-35)), '已完成', f(ago(32)), 1],
  // 进行中批次
  ['P20260515-B02-辣椒春', pid3, 'B01', '辣椒', f(ago(58)), f(ago(-62)), '进行中', null, 5],
  ['P20260601-B02-西瓜夏', pid4, 'B02', '西瓜', f(ago(49)), f(ago(-31)), '进行中', null, 4],
  ['P20260615-C01-草莓秋', pid5, 'C01', '草莓', f(ago(28)), f(ago(-122)), '进行中', null, 1],
];
const insBatch = db.prepare('INSERT INTO production_batches(id,created_at,updated_at,batch_number,plot_id,plot_name,variety_name,sow_date,estimated_harvest_date,status,actual_harvest_date,area) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
for (const [bn, pid, pn, vn, sd, eh, st, ah, a] of batchData) {
  const bid = u();
  batchIds.push(bid);
  insBatch.run(bid, new Date().toISOString(), new Date().toISOString(), bn, pid, pn, vn, sd, eh, st, ah, a);
}
console.log('  OK');

// ===== 7. Farming Operations =====
console.log('7. FarmingOps...');
const insOp = db.prepare('INSERT INTO farming_operations(id,created_at,updated_at,operation_type,plot_id,plot_name,variety_name,batch_id,operator_name,operation_date,fertilizer_name,fertilizer_amount,fertilizer_unit,pesticide_name,pesticide_amount,pesticide_unit,water_duration,water_duration_unit,work_description,harvest_yield,yield_unit,quality_grade,harvest_destination,weather,temperature,crop_stage) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
// batchIds: [0]=番茄1, [1]=黄瓜1, [2]=辣椒1, [3]=西瓜1, [4]=草莓1, [5]=番茄2, [6]=黄瓜2, [7]=辣椒2, [8]=生菜, [9]=菠菜, [10]=玉米, [11]=茄子, [12]=冬瓜, [13]=花椰菜, [14]=西兰花, [15]=胡萝卜, [16]=白萝卜, [17]=芹菜, [18]=辣椒春, [19]=西瓜夏, [20]=草莓秋
const ops = [
  // === 番茄 batch0 ===
  {'t':'播种','pi':pid1,'pn':'A01','vn':'番茄','on':'李克','d':ago(89),'bi':batchIds[0]},
  {'t':'施肥','pi':pid1,'pn':'A01','vn':'番茄','on':'李克','d':ago(79),'fn':'复合肥','fa':15,'fu':'kg','cs':'生长期','w':'晴','tp':25,'bi':batchIds[0]},
  {'t':'打药','pi':pid1,'pn':'A01','vn':'番茄','on':'李克','d':ago(59),'pn2':'吡虫啉','pa':0.5,'pu':'升','cs':'花果期','w':'阴','tp':20,'bi':batchIds[0]},
  {'t':'采收','pi':pid1,'pn':'A01','vn':'番茄','on':'李克','d':ago(5),'hy':520,'yu':'kg','qg':'一级','hd':'本地市场','bi':batchIds[0]},
  {'t':'灌溉','pi':pid1,'pn':'A01','vn':'番茄','on':'李克','d':ago(84),'wd':30,'wdu':'分钟','cs':'苗期','bi':batchIds[0]},
  // === 黄瓜 batch1 ===
  {'t':'播种','pi':pid2,'pn':'A02','vn':'黄瓜','on':'王强','d':ago(75),'bi':batchIds[1]},
  {'t':'施肥','pi':pid2,'pn':'A02','vn':'黄瓜','on':'王强','d':ago(65),'fn':'有机肥','fa':20,'fu':'kg','cs':'生长期','w':'晴','tp':28,'bi':batchIds[1]},
  {'t':'采收','pi':pid2,'pn':'A02','vn':'黄瓜','on':'李克','d':ago(3),'hy':680,'yu':'kg','qg':'一级','hd':'本地商超','bi':batchIds[1]},
  // === 辣椒 batch2 ===
  {'t':'播种','pi':pid3,'pn':'B01','vn':'辣椒','on':'王强','d':ago(95),'bi':batchIds[2]},
  {'t':'施肥','pi':pid3,'pn':'B01','vn':'辣椒','on':'王强','d':ago(85),'fn':'复合肥','fa':30,'fu':'kg','cs':'生长期','w':'晴','tp':30,'bi':batchIds[2]},
  {'t':'采收','pi':pid3,'pn':'B01','vn':'辣椒','on':'王强','d':ago(8),'hy':1250,'yu':'kg','qg':'一级','hd':'农贸市场','bi':batchIds[2]},
  // === 西瓜 batch3 ===
  {'t':'播种','pi':pid4,'pn':'B02','vn':'西瓜','on':'李克','d':ago(85),'bi':batchIds[3]},
  {'t':'施肥','pi':pid4,'pn':'B02','vn':'西瓜','on':'李克','d':ago(75),'fn':'有机肥','fa':25,'fu':'kg','cs':'伸蔓期','w':'晴','tp':32,'bi':batchIds[3]},
  {'t':'灌溉','pi':pid4,'pn':'B02','vn':'西瓜','on':'王强','d':ago(70),'wd':35,'wdu':'分钟','cs':'苗期','bi':batchIds[3]},
  {'t':'采收','pi':pid4,'pn':'B02','vn':'西瓜','on':'李克','d':ago(4),'hy':1800,'yu':'kg','qg':'一级','hd':'水果批发市场','bi':batchIds[3]},
  // === 草莓 batch4 ===
  {'t':'移栽','pi':pid5,'pn':'C01','vn':'草莓','on':'张农艺','d':ago(150),'bi':batchIds[4]},
  {'t':'施肥','pi':pid5,'pn':'C01','vn':'草莓','on':'张农艺','d':ago(140),'fn':'有机肥','fa':5,'fu':'kg','cs':'生长期','w':'晴','tp':26,'bi':batchIds[4]},
  {'t':'采收','pi':pid5,'pn':'C01','vn':'草莓','on':'张农艺','d':ago(6),'hy':380,'yu':'kg','qg':'特级','hd':'高端超市','bi':batchIds[4]},
  // === 番茄2 batch5 ===
  {'t':'播种','pi':pid1,'pn':'A01','vn':'番茄','on':'李克','d':ago(180),'bi':batchIds[5]},
  {'t':'采收','pi':pid1,'pn':'A01','vn':'番茄','on':'李克','d':ago(92),'hy':480,'yu':'kg','qg':'一级','hd':'本地市场','bi':batchIds[5]},
  // === 黄瓜2 batch6 ===
  {'t':'播种','pi':pid2,'pn':'A02','vn':'黄瓜','on':'王强','d':ago(170),'bi':batchIds[6]},
  {'t':'采收','pi':pid2,'pn':'A02','vn':'黄瓜','on':'王强','d':ago(90),'hy':620,'yu':'kg','qg':'一级','hd':'批发市场','bi':batchIds[6]},
  // === 辣椒2 batch7 ===
  {'t':'播种','pi':pid3,'pn':'B01','vn':'辣椒','on':'王强','d':ago(190),'bi':batchIds[7]},
  {'t':'采收','pi':pid3,'pn':'B01','vn':'辣椒','on':'王强','d':ago(98),'hy':1100,'yu':'kg','qg':'一级','hd':'农贸市场','bi':batchIds[7]},
  // === 辣椒春 batch8 ===
  {'t':'播种','pi':pid3,'pn':'B01','vn':'辣椒','on':'王强','d':ago(58),'bi':batchIds[8]},
  {'t':'施肥','pi':pid3,'pn':'B01','vn':'辣椒','on':'王强','d':ago(48),'fn':'复合肥','fa':30,'fu':'kg','cs':'生长期','w':'晴','tp':30,'bi':batchIds[8]},
  // === 西瓜夏 batch9 ===
  {'t':'播种','pi':pid4,'pn':'B02','vn':'西瓜','on':'李克','d':ago(49),'bi':batchIds[9]},
  {'t':'施肥','pi':pid4,'pn':'B02','vn':'西瓜','on':'李克','d':ago(39),'fn':'有机肥','fa':25,'fu':'kg','cs':'伸蔓期','w':'晴','tp':32,'bi':batchIds[9]},
  {'t':'灌溉','pi':pid4,'pn':'B02','vn':'西瓜','on':'王强','d':ago(44),'wd':35,'wdu':'分钟','cs':'苗期','bi':batchIds[9]},
  // === 草莓秋 batch20 ===
  {'t':'移栽','pi':pid5,'pn':'C01','vn':'草莓','on':'张农艺','d':ago(28),'bi':batchIds[20]},
  {'t':'施肥','pi':pid5,'pn':'C01','vn':'草莓','on':'张农艺','d':ago(18),'fn':'有机肥','fa':5,'fu':'kg','cs':'生长期','w':'晴','tp':26,'bi':batchIds[20]},
  // === 生菜 batch8 ===
  {'t':'播种','pi':pid1,'pn':'A01','vn':'生菜','on':'李克','d':ago(130),'bi':batchIds[8]},
  {'t':'采收','pi':pid1,'pn':'A01','vn':'生菜','on':'李克','d':ago(80),'hy':600,'yu':'kg','qg':'一级','hd':'本地市场','bi':batchIds[8]},
  // === 菠菜 batch9 ===
  {'t':'播种','pi':pid2,'pn':'A02','vn':'菠菜','on':'王强','d':ago(120),'bi':batchIds[9]},
  {'t':'采收','pi':pid2,'pn':'A02','vn':'菠菜','on':'王强','d':ago(75),'hy':450,'yu':'kg','qg':'一级','hd':'本地市场','bi':batchIds[9]},
  // === 玉米 batch10 ===
  {'t':'播种','pi':pid3,'pn':'B01','vn':'玉米','on':'王强','d':ago(140),'bi':batchIds[10]},
  {'t':'施肥','pi':pid3,'pn':'B01','vn':'玉米','on':'王强','d':ago(120),'fn':'尿素','fa':40,'fu':'kg','cs':'拔节期','bi':batchIds[10]},
  {'t':'采收','pi':pid3,'pn':'B01','vn':'玉米','on':'王强','d':ago(16),'hy':2800,'yu':'kg','qg':'一级','hd':'粮站','bi':batchIds[10]},
  // === 茄子 batch11 ===
  {'t':'播种','pi':pid1,'pn':'A01','vn':'茄子','on':'李克','d':ago(130),'bi':batchIds[11]},
  {'t':'采收','pi':pid1,'pn':'A01','vn':'茄子','on':'李克','d':ago(25),'hy':700,'yu':'kg','qg':'一级','hd':'农贸市场','bi':batchIds[11]},
  // === 冬瓜 batch12 ===
  {'t':'播种','pi':pid2,'pn':'A02','vn':'冬瓜','on':'王强','d':ago(125),'bi':batchIds[12]},
  {'t':'采收','pi':pid2,'pn':'A02','vn':'冬瓜','on':'王强','d':ago(12),'hy':1500,'yu':'kg','qg':'一级','hd':'批发市场','bi':batchIds[12]},
  // === 花椰菜 batch13 ===
  {'t':'播种','pi':pid4,'pn':'B02','vn':'花椰菜','on':'李克','d':ago(130),'bi':batchIds[13]},
  {'t':'采收','pi':pid4,'pn':'B02','vn':'花椰菜','on':'李克','d':ago(50),'hy':900,'yu':'kg','qg':'一级','hd':'商超','bi':batchIds[13]},
  // === 西兰花 batch14 ===
  {'t':'播种','pi':pid4,'pn':'B02','vn':'西兰花','on':'王强','d':ago(120),'bi':batchIds[14]},
  {'t':'采收','pi':pid4,'pn':'B02','vn':'西兰花','on':'王强','d':ago(36),'hy':800,'yu':'kg','qg':'特级','hd':'出口','bi':batchIds[14]},
  // === 胡萝卜 batch15 ===
  {'t':'播种','pi':pid5,'pn':'C01','vn':'胡萝卜','on':'张农艺','d':ago(135),'bi':batchIds[15]},
  {'t':'采收','pi':pid5,'pn':'C01','vn':'胡萝卜','on':'张农艺','d':ago(32),'hy':350,'yu':'kg','qg':'一级','hd':'本地市场','bi':batchIds[15]},
  // === 白萝卜 batch16 ===
  {'t':'播种','pi':pid5,'pn':'C01','vn':'白萝卜','on':'张农艺','d':ago(100),'bi':batchIds[16]},
  {'t':'采收','pi':pid5,'pn':'C01','vn':'白萝卜','on':'张农艺','d':ago(38),'hy':500,'yu':'kg','qg':'一级','hd':'农贸市场','bi':batchIds[16]},
  // === 芹菜 batch17 ===
  {'t':'播种','pi':pid5,'pn':'C01','vn':'芹菜','on':'张农艺','d':ago(100),'bi':batchIds[17]},
  {'t':'采收','pi':pid5,'pn':'C01','vn':'芹菜','on':'李克','d':ago(32),'hy':400,'yu':'kg','qg':'一级','hd':'本地市场','bi':batchIds[17]},
];
const nv = v => v !== undefined ? v : null;
for (const o of ops) {
  insOp.run(u(), new Date().toISOString(), new Date().toISOString(), o.t, o.pi, o.pn, o.vn, nv(o.bi), o.on, o.d.toISOString(),
    nv(o.fn), nv(o.fa), nv(o.fu),
    nv(o.pn2), nv(o.pa), nv(o.pu),
    nv(o.wd), nv(o.wdu), nv(o.wk),
    nv(o.hy), nv(o.yu), nv(o.qg), nv(o.hd),
    nv(o.w), nv(o.tp), nv(o.cs));
}
console.log('  OK');

// ===== 8. Inventory =====
console.log('8. Inventory...');
const insInv = db.prepare('INSERT INTO inventory(id,created_at,updated_at,type,name,spec,quantity,unit,location,quality_grade,quality_passed,expiry_date,min_stock) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
const invItems = [
  ['农产品', '番茄', '大果', 520, 'kg', '冷库A', '一级', 1, f(ago(-25)), 200],
  ['农产品', '黄瓜', '标准', 680, 'kg', '冷库A', '一级', 1, f(ago(-18)), 200],
  ['农产品', '辣椒', null, 0, 'kg', null, null, null, null, 50],
  ['农资', '复合肥', '50kg/袋', 35, '袋', '农资仓库A', null, null, f(ago(-365)), 10],
  ['农资', '有机肥', '40kg/袋', 25, '袋', '农资仓库A', null, null, f(ago(-180)), 10],
  ['农资', '吡虫啉', '500ml/瓶', 16.5, '瓶', '农资仓库B', null, null, f(ago(-300)), 5],
  ['农资', '滴灌带', '100m/卷', 8, '卷', '农资仓库A', null, null, f(ago(-730)), 3],
];
for (const [t, n, sp, q, uu, l, g, qp, e, m] of invItems) {
  insInv.run(u(), new Date().toISOString(), new Date().toISOString(), t, n, sp, q, uu, l, g, qp, e, m);
}
console.log('  OK');

// ===== 9. Stock Transactions =====
console.log('9. Transactions...');
const insTxn = db.prepare('INSERT INTO stock_transactions(id,created_at,updated_at,type,description,item_name,quantity,unit,operator,transaction_date) VALUES(?,?,?,?,?,?,?,?,?,?)');
for (const [t, d, n, q, uu, op, dt] of [
  ['入库', '农产品入库', '番茄', 520, 'kg', '李克', f(ago(5))],
  ['入库', '农产品入库', '黄瓜', 680, 'kg', '王强', f(ago(3))],
  ['入库', '农资采购', '复合肥', 35, '袋', '赵仓', f(ago(60))],
  ['入库', '农资采购', '有机肥', 25, '袋', '赵仓', f(ago(55))],
  ['入库', '农资采购', '吡虫啉', 20, '瓶', '赵仓', f(ago(50))],
  ['入库', '农资采购', '滴灌带', 10, '卷', '赵仓', f(ago(45))],
  ['出库', '销售出库', '番茄', 300, 'kg', '赵仓', f(ago(4))],
  ['出库', '农资领用', '复合肥', 5, '袋', '李克', f(ago(30))],
  ['出库', '农资领用', '有机肥', 5, '袋', '王强', f(ago(25))],
  ['出库', '农资领用', '吡虫啉', 3.5, '瓶', '李克', f(ago(20))],
  ['出库', '农资领用', '滴灌带', 2, '卷', '王强', f(ago(15))],
  ['出库', '销售出库', '黄瓜', 200, 'kg', '赵仓', f(ago(3))],
  ['入库', '农产品入库', '番茄', 100, 'kg', '王强', f(ago(2))],
]) {
  insTxn.run(u(), new Date().toISOString(), new Date().toISOString(), t, d, n, q, uu, op, dt);
}
console.log('  OK');

// ===== 10. Stocktakes =====
console.log('10. Stocktakes...');
const insSt = db.prepare('INSERT INTO stocktakes(id,created_at,updated_at,type,executor,item_name,system_quantity,actual_quantity,unit,discrepancy,discrepancy_rate,result,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
for (const [t, ex, n, sq, aq, uu, disc, dr, r, rm] of [
  ['月度', '赵仓', '番茄', 520, 518, 'kg', -2, 0.0038, '正常', '误差0.38%，在阈值内'],
  ['月度', '赵仓', '黄瓜', 680, 675, 'kg', -5, 0.0074, '正常', '误差0.74%，在阈值内'],
  ['月度', '赵仓', '复合肥', 35, 34.5, '袋', -0.5, 0.0143, '正常', '半袋已开封'],
  ['月度', '赵仓', '吡虫啉', 16.5, 16.5, '瓶', 0, 0, '正常', '完全匹配'],
]) {
  insSt.run(u(), new Date().toISOString(), new Date().toISOString(), t, ex, n, sq, aq, uu, disc, dr, r, rm);
}
console.log('  OK');

// ===== 11. Traceability =====
console.log('11. Traceability...');
const insTr = db.prepare('INSERT INTO traceability_records(id,created_at,updated_at,trace_code,batch_id,batch_number,plot_name,variety_name,sow_date,harvest_date,area,operations_data,inputs_data,inventory_data,sales_data) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
insTr.run(u(), new Date().toISOString(), new Date().toISOString(), 'TRC-A01-TOMATO-001', u(), 'P20260301-A01-番茄', 'A01', '番茄', f(ago(90)), f(ago(5)), 2,
  JSON.stringify([{ date: f(ago(89)), type: '播种' }, { date: f(ago(79)), type: '施肥' }, { date: f(ago(59)), type: '打药' }, { date: f(ago(5)), type: '采收' }]),
  JSON.stringify([{ name: '复合肥', amount: '15kg' }, { name: '吡虫啉', amount: '0.5L' }]),
  JSON.stringify([{ type: '入库', quantity: '520kg', grade: '一级' }]),
  JSON.stringify([{ customer: '本地市场', quantity: '200kg' }]));
console.log('  OK');

// ===== 12. Cost Records =====
console.log('12. Costs...');
const insCost = db.prepare('INSERT INTO cost_records(id,created_at,updated_at,type,description,amount,date,plot_id,batch_id) VALUES(?,?,?,?,?,?,?,?,?)');
// batchIds: [0]=番茄1, [1]=黄瓜1, [2]=辣椒1, [3]=西瓜1, [4]=草莓1, [5]=番茄2, [6]=黄瓜2, [7]=辣椒2, [8]=生菜, [9]=菠菜, [10]=玉米, [11]=茄子, [12]=冬瓜, [13]=花椰菜, [14]=西兰花, [15]=胡萝卜, [16]=白萝卜, [17]=芹菜
for (const [t, d, a, dt, pid, bid] of [
  ['种子', '番茄种子', 200, f(ago(100)), pid1, batchIds[0]],
  ['种子', '黄瓜种子', 150, f(ago(85)), pid2, batchIds[1]],
  ['种子', '辣椒种子', 100, f(ago(100)), pid3, batchIds[2]],
  ['种子', '西瓜种子', 80, f(ago(90)), pid4, batchIds[3]],
  ['种子', '草莓苗', 300, f(ago(155)), pid5, batchIds[4]],
  ['种子', '番茄种子2', 180, f(ago(185)), pid1, batchIds[5]],
  ['种子', '黄瓜种子2', 140, f(ago(175)), pid2, batchIds[6]],
  ['种子', '辣椒种子2', 90, f(ago(195)), pid3, batchIds[7]],
  ['肥料', '番茄复合肥', 300, f(ago(75)), pid1, batchIds[0]],
  ['肥料', '黄瓜有机肥', 350, f(ago(70)), pid2, batchIds[1]],
  ['肥料', '辣椒复合肥', 400, f(ago(80)), pid3, batchIds[2]],
  ['肥料', '西瓜有机肥', 280, f(ago(70)), pid4, batchIds[3]],
  ['肥料', '草莓有机肥', 150, f(ago(140)), pid5, batchIds[4]],
  ['农药', '番茄吡虫啉', 225, f(ago(60)), pid1, batchIds[0]],
  ['农药', '黄瓜杀菌剂', 180, f(ago(55)), pid2, batchIds[1]],
  ['农药', '辣椒杀虫剂', 200, f(ago(65)), pid3, batchIds[2]],
  ['人工', '番茄播种人工', 400, f(ago(90)), pid1, batchIds[0]],
  ['人工', '黄瓜播种人工', 400, f(ago(75)), pid2, batchIds[1]],
  ['人工', '辣椒播种人工', 500, f(ago(95)), pid3, batchIds[2]],
  ['人工', '西瓜播种人工', 400, f(ago(85)), pid4, batchIds[3]],
  ['人工', '草莓定植人工', 300, f(ago(150)), pid5, batchIds[4]],
  ['人工', '番茄施肥人工', 300, f(ago(75)), pid1, batchIds[0]],
  ['人工', '番茄打药人工', 200, f(ago(55)), pid1, batchIds[0]],
  ['人工', '番茄采收人工', 600, f(ago(5)), pid1, batchIds[0]],
  ['人工', '黄瓜采收人工', 600, f(ago(3)), pid2, batchIds[1]],
  ['人工', '辣椒采收人工', 700, f(ago(8)), pid3, batchIds[2]],
  ['人工', '西瓜采收人工', 500, f(ago(4)), pid4, batchIds[3]],
  ['人工', '草莓采收人工', 400, f(ago(6)), pid5, batchIds[4]],
  ['人工', '辣椒管护人工', 700, f(ago(50)), pid3, batchIds[8]],
  ['机械', '拖拉机旋耕', 300, f(ago(100)), pid1, batchIds[0]],
  ['机械', '灌溉电费', 200, f(ago(80)), pid1, null],
  ['机械', '拖拉机旋耕2', 300, f(ago(190)), pid3, batchIds[7]],
  ['其他', '农膜覆盖', 250, f(ago(85)), pid1, null],
  ['其他', '遮阳网', 180, f(ago(75)), pid3, batchIds[2]],
  ['其他', '大棚维修', 350, f(ago(145)), pid5, batchIds[4]],
  // 新批次成本
  ['种子', '生菜种子', 60, f(ago(135)), pid1, batchIds[8]],
  ['肥料', '生菜有机肥', 120, f(ago(120)), pid1, batchIds[8]],
  ['人工', '生菜采收人工', 300, f(ago(80)), pid1, batchIds[8]],
  ['种子', '菠菜种子', 50, f(ago(125)), pid2, batchIds[9]],
  ['人工', '菠菜采收人工', 250, f(ago(75)), pid2, batchIds[9]],
  ['种子', '玉米种子', 180, f(ago(145)), pid3, batchIds[10]],
  ['肥料', '玉米尿素', 250, f(ago(125)), pid3, batchIds[10]],
  ['人工', '玉米采收人工', 400, f(ago(16)), pid3, batchIds[10]],
  ['种子', '茄子种子', 60, f(ago(135)), pid1, batchIds[11]],
  ['人工', '茄子采收人工', 350, f(ago(25)), pid1, batchIds[11]],
  ['种子', '冬瓜种子', 40, f(ago(130)), pid2, batchIds[12]],
  ['人工', '冬瓜采收人工', 300, f(ago(12)), pid2, batchIds[12]],
  ['种子', '花椰菜种子', 70, f(ago(135)), pid4, batchIds[13]],
  ['人工', '花椰菜采收人工', 350, f(ago(50)), pid4, batchIds[13]],
  ['种子', '西兰花种子', 80, f(ago(125)), pid4, batchIds[14]],
  ['人工', '西兰花采收人工', 400, f(ago(36)), pid4, batchIds[14]],
  ['种子', '胡萝卜种子', 45, f(ago(140)), pid5, batchIds[15]],
  ['人工', '胡萝卜采收人工', 200, f(ago(32)), pid5, batchIds[15]],
  ['种子', '白萝卜种子', 35, f(ago(105)), pid5, batchIds[16]],
  ['人工', '白萝卜采收人工', 250, f(ago(38)), pid5, batchIds[16]],
  ['种子', '芹菜种子', 30, f(ago(105)), pid5, batchIds[17]],
  ['人工', '芹菜采收人工', 300, f(ago(32)), pid5, batchIds[17]],
]) {
  insCost.run(u(), new Date().toISOString(), new Date().toISOString(), t, d, a, dt, pid, bid);
}
console.log('  OK');

// ===== 13. Sales Records =====
console.log('13. Sales...');
const insSale = db.prepare('INSERT INTO sales_records(id,created_at,updated_at,customer,variety_name,quantity,unit,unit_price,total_amount,payment_status,sale_date,salesperson) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
for (const [c, v, q, uu, up, ps, sd, sp] of [
  ['批发市场', '番茄', 200, 'kg', 8.5, '已付款', f(ago(3)), '赵仓'],
  ['永辉超市', '黄瓜', 150, 'kg', 6.0, '已付款', f(ago(2)), '赵仓'],
  ['社区菜场', '番茄', 100, 'kg', 5.0, '未付款', f(ago(1)), '赵仓'],
  ['农贸市场', '辣椒', 300, 'kg', 12.0, '已付款', f(ago(5)), '赵仓'],
  ['水果批发', '西瓜', 500, 'kg', 3.5, '已付款', f(ago(2)), '赵仓'],
  ['高端超市', '草莓', 100, 'kg', 35.0, '已付款', f(ago(3)), '赵仓'],
]) {
  insSale.run(u(), new Date().toISOString(), new Date().toISOString(), c, v, q, uu, up, q * up, ps, sd, sp);
}
console.log('  OK');

// ===== 14. IoT Sensor Data =====
console.log('14. Sensor Data...');
const insSen = db.prepare('INSERT INTO sensor_data(id,created_at,updated_at,plot_id,device_id,sensor_type,unit,value,recorded_at,equipment_id) VALUES(?,?,?,?,?,?,?,?,?,?)');
const sensorRecords = [];
for (const [pid, did, stype, unit, baseVal, devId] of [
  [pid1, 'DEV-A01-TH', 'temperature', '°C', 26, 'EQ-IOT01'],
  [pid1, 'DEV-A01-HU', 'humidity', '%', 65, 'EQ-IOT01'],
  [pid1, 'DEV-A01-SM', 'soil_moisture', '%', 45, 'EQ-IOT01'],
  [pid2, 'DEV-A02-TH', 'temperature', '°C', 28, 'EQ-IOT01'],
  [pid2, 'DEV-A02-HU', 'humidity', '%', 58, 'EQ-IOT01'],
  [pid2, 'DEV-A02-SM', 'soil_moisture', '%', 52, 'EQ-IOT01'],
  [pid3, 'DEV-B01-TH', 'temperature', '°C', 30, 'EQ-IOT01'],
  [pid3, 'DEV-B01-HU', 'humidity', '%', 55, 'EQ-IOT01'],
  [pid3, 'DEV-B01-SM', 'soil_moisture', '%', 40, 'EQ-IOT01'],
  [pid4, 'DEV-B02-TH', 'temperature', '°C', 27, 'EQ-IOT01'],
  [pid4, 'DEV-B02-HU', 'humidity', '%', 62, 'EQ-IOT01'],
  [pid4, 'DEV-B02-SM', 'soil_moisture', '%', 48, 'EQ-IOT01'],
  [pid5, 'DEV-C01-TH', 'temperature', '°C', 22, 'EQ-IOT01'],
  [pid5, 'DEV-C01-HU', 'humidity', '%', 70, 'EQ-IOT01'],
  [pid5, 'DEV-C01-SM', 'soil_moisture', '%', 55, 'EQ-IOT01'],
]) {
  // 每个传感器生成最近24小时的216条数据（每6-7分钟一条）
  // 随机让约15%的数据超出正常范围以展示异常检测
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 9; m++) {
      const t = new Date(Date.now() - ((23 - h) * 60 + (9 - m) * 7) * 60000);
      let variation = (Math.random() - 0.5) * (unit === '°C' ? 6 : unit === '%' ? 12 : 10);
      // 约15%概率产生异常值
      if (Math.random() < 0.15) {
        variation = Math.random() < 0.5
          ? (Math.random() * -15) - 5   // 偏低异常
          : (Math.random() * 15) + 10;  // 偏高异常
      }
      const val = Math.round((baseVal + variation) * 10) / 10;
      sensorRecords.push([pid, did, stype, unit, val, t.toISOString(), devId]);
    }
  }
}
// 批量插入提高性能
const insertMany = db.transaction(() => {
  for (const r of sensorRecords) {
    insSen.run(u(), new Date().toISOString(), new Date().toISOString(), ...r);
  }
});
insertMany();
console.log('  OK (' + sensorRecords.length + ' records)');

// ===== 15. Notifications =====
console.log('15. Notifications...');
const notifs = [
  ['番茄采收完成(520kg)，请安排入库', 'harvest'],
  ['黄瓜采收完成(680kg)，已入库', 'harvest'],
  ['辣椒采收完成(1250kg)，品质一级', 'harvest'],
  ['西瓜采收完成(1800kg)，已发货', 'harvest'],
  ['草莓采收完成(380kg，特级)，已送高端超市', 'harvest'],
  ['设备 EQ-IRR03 需在3天内维护', 'maintenance'],
  ['设备 EQ-IOT01 温度传感器需校准', 'maintenance'],
  ['吡虫啉库存低于安全阈值(剩余16.5瓶)', 'warning'],
  ['复合肥有效期剩余20天，请尽快使用', 'warning'],
  ['辣椒复合肥库存不足，请及时采购', 'warning'],
  ['番茄销售完成，已收款 ¥1700', 'success'],
  ['黄瓜销售完成，已收款 ¥900', 'success'],
  ['辣椒销售完成，已收款 ¥3600', 'success'],
  ['草莓售价创新高，亩产效益优秀', 'success'],
  ['B01地块辣椒长势良好，预计2个月后采收', 'info'],
  ['C01草莓需注意温湿度控制(目标:22°C/70%)', 'info'],
  ['本周农事计划：A01施肥、B02灌溉', 'info'],
  ['系统更新：已优化数据库查询性能', 'info'],
  ['月度盘点完成，库存准确率99.5%', 'success'],
  ['预警：A02土壤湿度偏低(52%)，建议灌溉', 'warning'],
  ['新的种植计划已创建，待审批', 'info'],
];
const insNotif = db.prepare('INSERT INTO notifications(id,created_at,updated_at,user_id,message,is_read,type) VALUES(?,?,?,?,?,?,?)');
for (const [m, t] of notifs) {
  insNotif.run(u(), new Date().toISOString(), new Date().toISOString(), null, m, Math.random() > 0.5 ? 1 : 0, t);
}
console.log('  OK');

// ===== 16. System Settings =====
console.log('16. Settings...');
const insSet = db.prepare('INSERT OR IGNORE INTO system_settings(id,created_at,updated_at,setting_key,setting_value,setting_type,description) VALUES(?,?,?,?,?,?,?)');
const settings = [
  ['duplicate_window_minutes', '5', 'number', '农事操作防重复提交时间窗口（分钟）'],
  ['stocktake_discrepancy_threshold', '2', 'number', '盘点误差率阈值（百分比）'],
  ['low_stock_threshold', '100', 'number', '低库存预警阈值'],
  ['expiry_alert_days', '30', 'number', '效期预警天数'],
  ['sensor_offline_minutes', '30', 'number', '传感器离线检测阈值'],
  ['stocktaking_locked', 'false', 'boolean', '盘点期间出入库锁定'],
];
for (const [k, v, t, d] of settings) {
  insSet.run(u(), new Date().toISOString(), new Date().toISOString(), k, v, t, d);
}
console.log('  OK');

console.log('\n=== SQLite 种子数据完成 ===');
db.close();
