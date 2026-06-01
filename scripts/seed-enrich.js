"use strict";
const crypto = require('crypto');
const { Client } = require('../backend/node_modules/pg');
const bcrypt = require('../backend/node_modules/bcrypt');

const db = new Client({ host: 'localhost', port: 3306, user: 'root', password: 'LZY123', database: 'farm_management' });
const u = () => crypto.randomUUID();
const f = d => d.toISOString().slice(0, 10);
function ago(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

async function q(sql, params) {
  try { return await db.query(sql, params); }
  catch (e) { if (e.code !== '23505') throw e; } // 23505 = unique violation, skip silently
}

async function main() {
  await db.connect();
  console.log('开始扩充数据集...\n');

  // 1. Varieties (+12) - ON CONFLICT DO NOTHING
  console.log('1. 品种');
  const vars = [
    ['茄子','果菜类','["春","夏"]',2500,35,3,100,10],
    ['冬瓜','瓜果类','["春","夏"]',1000,30,2,110,10],
    ['苦瓜','瓜果类','["春","夏"]',2000,25,3,85,10],
    ['花椰菜','花菜类','["春","秋"]',3500,40,3,75,7],
    ['西兰花','花菜类','["春","秋"]',3500,45,3,80,7],
    ['胡萝卜','根茎类','["春","秋"]',10000,30,2,100,14],
    ['白萝卜','根茎类','["秋","冬"]',8000,25,2,60,7],
    ['芹菜','叶菜类','["春","秋","冬"]',6000,20,2,65,7],
    ['香菜','香料类','["春","秋"]',12000,15,2,40,5],
    ['葱','香料类','["全季"]',15000,20,2,50,7],
    ['豆角','豆类','["春","夏"]',4000,30,3,80,7],
    ['四季豆','豆类','["春","秋"]',4500,25,3,70,7],
  ];
  for (const r of vars) {
    await q("INSERT INTO varieties(id,created_at,updated_at,name,category,sowing_season,planting_density,fertilization_rate,watering_frequency,growth_cycle,safety_interval,is_active) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (name) DO NOTHING",
      [u(), r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], true]);
  }
  console.log('  OK');

  // 2. Staff (+4)
  console.log('2. 员工');
  const staff = ['陈师傅,chen,操作员,农资管理','黄技术,huang,农艺师,技术指导','大刘,daliu,操作员,植保作业','小吴,xiaowu,操作员,灌溉管理'];
  for (const s of staff) {
    const [name, uname, role, div] = s.split(',');
    const h = await bcrypt.hash(uname + '123', 10);
    await q("INSERT INTO staff(id,created_at,updated_at,name,username,password_hash,system_role,business_division,total_work_hours,contact_phone,is_active) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9)",
      [u(), name, uname, h, role, div, Math.floor(Math.random() * 200) + 10, '1' + String(Math.floor(Math.random() * 9000000000 + 1000000000)), true]);
  }
  console.log('  OK');

  // 3. Equipment (+4)
  console.log('3. 设备');
  await q("INSERT INTO equipment(id,created_at,updated_at,equipment_number,type,status,next_maintenance_date) VALUES($1,now(),now(),'EQ-IOT02','物联网设备','正常',$2)", [u(), f(ago(120))]);
  await q("INSERT INTO equipment(id,created_at,updated_at,equipment_number,type,status,next_maintenance_date) VALUES($1,now(),now(),'EQ-MACH02','农机具','正常',$2)", [u(), f(ago(60))]);
  await q("INSERT INTO equipment(id,created_at,updated_at,equipment_number,type,status,next_maintenance_date) VALUES($1,now(),now(),'EQ-IRR04','灌溉设备','正常',$2)", [u(), f(ago(45))]);
  await q("INSERT INTO equipment(id,created_at,updated_at,equipment_number,type,status,next_maintenance_date) VALUES($1,now(),now(),'EQ-MACH03','农机具','维护中',$2)", [u(), f(ago(5))]);
  console.log('  OK');

  // Get existing references
  const plots = (await db.query("SELECT id,plot_number FROM plots")).rows;
  const varieties = (await db.query("SELECT id,name FROM varieties")).rows;
  const pid = n => plots.find(p => p.plot_number === n)?.id;
  const vid = n => varieties.find(v => v.name === n)?.id;

  // 4. Plans (+3)
  console.log('4. 种植计划');
  await q("INSERT INTO planting_plans(id,created_at,updated_at,plot_id,plot_name,variety_id,variety_name,planned_sow_date,planned_harvest_date,status,area) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9)",
    [u(), pid('B01'), 'B01', vid('豆角'), '豆角', f(ago(5)), f(ago(-75)), '执行中', 3]);
  await q("INSERT INTO planting_plans(id,created_at,updated_at,plot_id,plot_name,variety_id,variety_name,planned_sow_date,planned_harvest_date,status,area) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9)",
    [u(), pid('C01'), 'C01', vid('西兰花'), '西兰花', f(ago(3)), f(ago(-77)), '执行中', 1.5]);
  console.log('  OK');

  // 5. Batches (+3)
  console.log('5. 生产批次');
  const newBatches = {};
  for (const [vn, pn, sd, eh, st, area] of [['豆角','B01',f(ago(5)),f(ago(-75)),'进行中',3],['西兰花','C01',f(ago(3)),f(ago(-77)),'进行中',1.5],['胡萝卜','A01',f(ago(65)),f(ago(-35)),'进行中',1.8]]) {
    const id = u();
    newBatches[vn] = id;
    await q("INSERT INTO production_batches(id,created_at,updated_at,batch_number,plot_id,plot_name,variety_id,variety_name,sow_date,estimated_harvest_date,status,area) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [id, 'P' + sd.replace(/-/g, '') + '-' + pn + '-' + vn, pid(pn), pn, vid(vn), vn, sd, eh, st, area]);
  }
  console.log('  OK');

  const allBatches = (await db.query("SELECT id,batch_number,variety_name,status,plot_name FROM production_batches")).rows;
  const bid = n => allBatches.find(b => b.variety_name === n)?.id;

  // 6. Farming Ops (+15)
  console.log('6. 农事操作');
  const ops = [
    ['播种', pid('B01'), 'B01', vid('豆角'), '豆角', bid('豆角'), 3, '大刘', ago(5), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    ['灌溉', pid('B01'), 'B01', vid('豆角'), '豆角', bid('豆角'), 3, '小吴', ago(3), null, null, null, null, null, null, 25, '分钟', null, null, null, null, null, null, null, '苗期'],
    ['施肥', pid('B01'), 'B01', vid('豆角'), '豆角', bid('豆角'), 3, '大刘', ago(1), '复合肥', 20, 'kg', null, null, null, null, null, null, null, null, null, null, null, null, null, '生长期'],
    ['播种', pid('C01'), 'C01', vid('西兰花'), '西兰花', bid('西兰花'), 1.5, '小吴', ago(3), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    ['施肥', pid('C01'), 'C01', vid('西兰花'), '西兰花', bid('西兰花'), 1.5, '小吴', ago(1), '有机肥', 8, 'kg', null, null, null, null, null, null, null, null, null, null, null, null, null, '生长期'],
    ['播种', pid('A01'), 'A01', vid('胡萝卜'), '胡萝卜', bid('胡萝卜'), 1.8, '大刘', ago(65), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    ['灌溉', pid('A01'), 'A01', vid('胡萝卜'), '胡萝卜', bid('胡萝卜'), 1.8, '小吴', ago(60), null, null, null, null, null, null, 20, '分钟', null, null, null, null, null, null, null, '生长期'],
    ['除草', pid('A01'), 'A01', vid('胡萝卜'), '胡萝卜', bid('胡萝卜'), 1.8, '大刘', ago(50), null, null, null, null, null, null, null, null, '间苗除草', null, null, null, null, null, null, null],
    ['施肥', pid('A01'), 'A01', vid('胡萝卜'), '胡萝卜', bid('胡萝卜'), 1.8, '大刘', ago(40), '复合肥', 12, 'kg', null, null, null, null, null, null, null, null, null, null, null, null, null, '膨大期'],
    ['灌溉', pid('A01'), 'A01', vid('胡萝卜'), '胡萝卜', bid('胡萝卜'), 1.8, '小吴', ago(20), null, null, null, null, null, null, 30, '分钟', null, null, null, null, null, null, null, '膨大期'],
  ];
  for (const o of ops) {
    await q("INSERT INTO farming_operations(id,created_at,updated_at,operation_type,plot_id,plot_name,variety_id,variety_name,batch_id,area,operator_name,operation_date,fertilizer_name,fertilizer_amount,fertilizer_unit,water_duration,water_duration_unit,work_description,crop_stage) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)",
      [u(), o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8], o[9], o[10], o[11], o[14], o[15], o[17], o[18]]);
  }
  // 补录测试
  const cb = allBatches.find(b => b.variety_name === '黄瓜');
  if (cb && pid('A02')) {
    await q("INSERT INTO farming_operations(id,created_at,updated_at,operation_type,plot_id,plot_name,variety_id,variety_name,batch_id,area,operator_name,operation_date,fertilizer_name,fertilizer_amount,fertilizer_unit,crop_stage,is_supplemental,supplemental_operation_date) VALUES($1,now(),now(),'施肥',$2,'A02',$3,'黄瓜',$4,3,'大刘',$5,'有机肥',18,'kg','生长期',true,$6)",
      [u(), pid('A02'), vid('黄瓜'), cb.id, ago(3), ago(72)]);
  }
  console.log('  OK');

  // 7. Inventory (+8)
  console.log('7. 库存');
  for (const [type, name, qty, unit, loc, grade, exp, min] of [
    ['农产品','胡萝卜',120,'kg','冷库A','合格',f(ago(20)),80],
    ['农产品','豆角',45,'kg','冷库A','合格',f(ago(12)),30],
    ['农产品','西兰花',60,'kg','冷库B','合格',f(ago(10)),40],
    ['农资','尿素',12,'袋','农资仓库A',null,f(ago(360)),5],
    ['农资','磷酸二铵',8,'袋','农资仓库A',null,f(ago(300)),3],
    ['农资','阿维菌素',20,'瓶','农资仓库B',null,f(ago(240)),8],
    ['农资','遮阳网',5,'张','农资仓库C',null,f(ago(730)),2],
    ['农资','育苗盘',200,'个','农资仓库C',null,null,50],
  ]) {
    await q("INSERT INTO inventory(id,created_at,updated_at,type,name,quantity,unit,location,quality_grade,quality_passed,expiry_date,min_stock) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [u(), type, name, qty, unit, loc, grade, grade ? true : null, exp, min]);
  }
  console.log('  OK');

  const allInvs = (await db.query("SELECT id,name FROM inventory")).rows;
  const iid = n => allInvs.filter(x => x.name === n).pop()?.id;

  // 8. Stock Transactions (+7)
  console.log('8. 库存流水');
  for (const [type, desc, name, qty, unit, op, date] of [
    ['入库','农产品入库','胡萝卜',120,'kg','小吴',f(ago(20))],
    ['入库','农资采购','尿素',12,'袋','赵仓',f(ago(60))],
    ['入库','农资采购','遮阳网',5,'张','赵仓',f(ago(90))],
    ['出库','农资领用','阿维菌素',3,'瓶','大刘',f(ago(10))],
    ['出库','农资领用','磷酸二铵',2,'袋','小吴',f(ago(7))],
    ['出库','销售出库','胡萝卜',80,'kg','赵仓',f(ago(2))],
    ['入库','农产品入库','豆角',45,'kg','大刘',f(ago(8))],
  ]) {
    await q("INSERT INTO stock_transactions(id,created_at,updated_at,type,description,inventory_id,item_name,quantity,unit,operator,transaction_date) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9)",
      [u(), type, desc, iid(name), name, qty, unit, op, date]);
  }
  console.log('  OK');

  // 9. Sales (+8)
  console.log('9. 销售记录');
  for (const [cust, vn, qty, price, pay, date, person] of [
    ['永辉超市','黄瓜',150,5.5,'已付款',f(ago(5)),'赵仓'],
    ['社区菜场','胡萝卜',80,3.0,'已付款',f(ago(2)),'赵仓'],
    ['美团优选','番茄',200,6.0,'部分付款',f(ago(4)),'赵仓'],
    ['盒马鲜生','黄瓜',100,6.5,'已付款',f(ago(3)),'赵仓'],
    ['农贸市场','辣椒',50,4.0,'未付款',f(ago(1)),'赵仓'],
    ['多多买菜','生菜',80,2.5,'已付款',f(ago(6)),'赵仓'],
    ['钱大妈','菠菜',60,3.5,'已付款',f(ago(7)),'赵仓'],
    ['食堂配送','番茄',120,5.0,'已付款',f(ago(8)),'赵仓'],
  ]) {
    await q("INSERT INTO sales_records(id,created_at,updated_at,customer,variety_name,quantity,unit,unit_price,total_amount,payment_status,sale_date,salesperson) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [u(), cust, vn, qty, 'kg', price, qty * price, pay, date, person]);
  }
  console.log('  OK');

  // 10. Cost Records (+10)
  console.log('10. 成本记录');
  for (const [type, desc, amt, date, plot, batch] of [
    ['种子','豆角种子',180,f(ago(7)),pid('B01'),bid('豆角')],
    ['种子','西兰花种子',120,f(ago(5)),pid('C01'),bid('西兰花')],
    ['肥料','豆角追肥',200,f(ago(2)),pid('B01'),bid('豆角')],
    ['农药','杀虫剂',150,f(ago(3)),pid('C01'),bid('西兰花')],
    ['人工','管护工资',600,f(ago(10)),pid('A01'),bid('胡萝卜')],
    ['种子','胡萝卜种子',90,f(ago(66)),pid('A01'),bid('胡萝卜')],
    ['机械','旋耕',300,f(ago(68)),pid('A01'),bid('胡萝卜')],
    ['肥料','复合肥采购',450,f(ago(30)),null,null],
    ['其他','农膜覆盖',250,f(ago(15)),pid('C01'),bid('西兰花')],
    ['人工','技术指导',1200,f(ago(20)),null,null],
  ]) {
    await q("INSERT INTO cost_records(id,created_at,updated_at,type,description,amount,date,plot_id,batch_id) VALUES($1,now(),now(),$2,$3,$4,$5,$6,$7)",
      [u(), type, desc, amt, date, plot, batch]);
  }
  console.log('  OK');

  // 11. Notifications (+6)
  console.log('11. 通知');
  const admins = (await db.query("SELECT id FROM staff WHERE system_role='系统管理员'")).rows;
  for (const [msg, type] of [
    ['豆角播种完成', 'info'], ['设备MQ03需维护', 'maintenance'],
    ['阿维菌素库存低', 'warning'], ['复合肥即将到期', 'warning'],
    ['胡萝卜可采收', 'harvest'], ['产地报告已生成', 'info'],
  ]) {
    await q("INSERT INTO notifications(id,created_at,updated_at,user_id,message,is_read,type) VALUES($1,now(),now(),$2,$3,$4,$5)",
      [u(), admins[0]?.id, msg, Math.random() > 0.5, type]);
  }
  console.log('  OK');

  console.log('\n=== 扩充完成 ===');
  await db.end();
}

main().catch(e => { console.error('ERROR:', e.message); db.end(); });
