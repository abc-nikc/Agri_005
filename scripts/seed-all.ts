import { AppDataSource } from '../backend/src/config/database';
import { Staff } from '../backend/src/models/staff.entity';
import { Equipment } from '../backend/src/models/equipment.entity';
import { FarmingOperation } from '../backend/src/models/farming-operation.entity';
import { CostRecord } from '../backend/src/models/cost-record.entity';
import { SalesRecord } from '../backend/src/models/sales-record.entity';
import { Inventory } from '../backend/src/models/inventory.entity';
import { StockTransaction } from '../backend/src/models/stock-transaction.entity';
import { ProductionBatch } from '../backend/src/models/production-batch.entity';
import { hashPassword } from '../backend/src/utils/password';

function d(offset: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() - offset);
  return dt.toISOString().slice(0, 10);
}
function dt(offset: number, hour: number = 8) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

async function seed() {
  await AppDataSource.initialize();
  console.log('数据库已连接\n');

  // ===== 1. 员工 =====
  const staffRepo = AppDataSource.getRepository(Staff);
  const staffs = [
    { name: '李建国', username: 'zhangwei', systemRole: '系统管理员', businessDivision: '管理部', isActive: true },
    { name: '陈美玲', username: 'liming', systemRole: '农艺师', businessDivision: '技术部', isActive: true },
    { name: '王大山', username: 'wangwu', systemRole: '操作员', businessDivision: '田间作业', isActive: true },
    { name: '赵小燕', username: 'zhaoxiao', systemRole: '操作员', businessDivision: '仓库管理', isActive: true },
    { name: '刘明辉', username: 'liuming', systemRole: '只读观察者', businessDivision: '财务部', isActive: true },
  ];
  for (const s of staffs) {
    const ex = await staffRepo.findOne({ where: { username: s.username } });
    if (!ex) {
      const h = await hashPassword('123456');
      await staffRepo.save(staffRepo.create({ ...s, passwordHash: h, totalWorkHours: Math.random() * 500 }));
    }
  }
  console.log(`员工: ${staffs.length} 人`);

  // ===== 2. 设备 =====
  const equipRepo = AppDataSource.getRepository(Equipment);
  const equips = [
    { equipmentNumber: 'IRR-001', type: '灌溉设备', status: '正常', nextMaintenanceDate: d(-15), mqttTopic: 'farm/A01/IRR-001/status' },
    { equipmentNumber: 'IRR-002', type: '灌溉设备', status: '维护中', nextMaintenanceDate: d(-2), mqttTopic: 'farm/B01/IRR-002/status' },
    { equipmentNumber: 'FERT-001', type: '农机具', status: '正常', nextMaintenanceDate: d(-25), mqttTopic: 'farm/C01/FERT-001/status' },
    { equipmentNumber: 'SENS-T01', type: '物联网设备', status: '正常', nextMaintenanceDate: d(-30), mqttTopic: 'farm/A01/SENS-T01/data' },
    { equipmentNumber: 'PUMP-001', type: '灌溉设备', status: '故障', nextMaintenanceDate: d(-1), mqttTopic: 'farm/B01/PUMP-001/status' },
  ];
  for (const e of equips) {
    const ex = await equipRepo.findOne({ where: { equipmentNumber: e.equipmentNumber } });
    if (!ex) await equipRepo.save(equipRepo.create(e as any));
  }
  console.log(`设备: ${equips.length} 台`);

  // ===== 3. 生产批次（已完成） =====
  const batchRepo = AppDataSource.getRepository(ProductionBatch);
  const plots = await AppDataSource.getRepository(require('../backend/src/models/plot.entity').Plot).find();
  const varieties = await AppDataSource.getRepository(require('../backend/src/models/variety.entity').Variety).find();
  const batches: any[] = [];
  if (plots.length >= 2 && varieties.length >= 2) {
    const batchDefs = [
      { plotIdx: 0, varIdx: 4, area: 10, sow: d(-120), est: d(-10), harv: d(-5) },
      { plotIdx: 1, varIdx: 5, area: 15, sow: d(-90), est: d(-8), harv: d(-3) },
      { plotIdx: 0, varIdx: 0, area: 5, sow: d(-60), est: d(20), harv: null },
    ];
    for (const bd of batchDefs) {
      const plot = plots[bd.plotIdx];
      const variety = varieties[bd.varIdx];
      const bn = `P${bd.sow.replace(/-/g,'')}-${plot.plotNumber}-${variety.name}`;
      const ex = await batchRepo.findOne({ where: { batchNumber: bn } });
      if (!ex) {
        const b = batchRepo.create({
          batchNumber: bn, plotId: plot.id, plotName: plot.plotNumber, varietyId: variety.id,
          varietyName: variety.name, sowDate: bd.sow, estimatedHarvestDate: bd.est,
          area: bd.area, status: bd.harv ? '已完成' : '进行中',
          actualHarvestDate: bd.harv || undefined,
        });
        const saved = await batchRepo.save(b);
        batches.push(saved);
      } else { batches.push(ex); }
    }
  }
  console.log(`生产批次: ${batches.length} 个`);

  // ===== 4. 农事操作 =====
  const opRepo = AppDataSource.getRepository(FarmingOperation);
  const opCount = await opRepo.count();
  if (opCount === 0 && batches.length > 0 && plots.length > 0) {
    const ops = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const plot = plots[i % plots.length];
      ops.push(
        { operationType: '播种', plotId: plot.id, plotName: plot.plotNumber, varietyName: batch.varietyName, area: batch.area, operatorName: '王大山', operationDate: dt(120 - i * 30), remark: '晴天播种' },
        { operationType: '施肥', plotId: plot.id, plotName: plot.plotNumber, fertilizerName: '复合肥', fertilizerAmount: 50, fertilizerUnit: 'kg', operatorName: '王大山', operationDate: dt(90 - i * 30) },
        { operationType: '灌溉', plotId: plot.id, plotName: plot.plotNumber, waterAmount: 200, waterUnit: 'm³', operatorName: '王大山', operationDate: dt(80 - i * 30) },
        { operationType: '除草', plotId: plot.id, plotName: plot.plotNumber, workDescription: '人工除草5亩', operatorName: '王大山', operationDate: dt(60 - i * 30) },
        { operationType: '打药', plotId: plot.id, plotName: plot.plotNumber, pesticideName: '吡虫啉', pesticideAmount: 100, pesticideUnit: 'ml', operatorName: '王大山', operationDate: dt(40 - i * 30) },
      );
      if (batch.status === '已完成') {
        ops.push(
          { operationType: '采收', plotId: plot.id, plotName: plot.plotNumber, varietyName: batch.varietyName, harvestYield: 2000 + Math.random() * 1000, yieldUnit: 'kg', qualityGrade: '一级', harvestDestination: '冷库', operatorName: '王大山', operationDate: dt(5 - i * 30) },
        );
      }
    }
    for (const o of ops) {
      await opRepo.save(opRepo.create(o as any));
    }
    console.log(`农事操作: ${ops.length} 条`);
  }

  // ===== 5. 库存 =====
  const invRepo = AppDataSource.getRepository(Inventory);
  const txnRepo = AppDataSource.getRepository(StockTransaction);
  const invCount = await invRepo.count();
  if (invCount === 0) {
    const items = [
      { type: '农产品', name: '番茄', quantity: 2000, unit: 'kg', qualityGrade: '一级', qualityPassed: true, location: '冷库A', batchNumber: batches[0]?.batchNumber },
      { type: '农产品', name: '黄瓜', quantity: 1500, unit: 'kg', qualityGrade: '一级', qualityPassed: true, location: '冷库A', batchNumber: batches[1]?.batchNumber },
      { type: '农资', name: '复合肥', spec: '50kg/袋', quantity: 40, unit: '袋', location: '农资库B', minStock: 5 },
      { type: '农资', name: '吡虫啉', spec: '500ml/瓶', quantity: 20, unit: '瓶', location: '农资库B', minStock: 3, expiryDate: d(-60) },
      { type: '农资', name: '有机肥', spec: '25kg/袋', quantity: 100, unit: '袋', location: '农资库B', minStock: 10 },
    ];
    for (const item of items) {
      const inv = await invRepo.save(invRepo.create(item as any));
      await txnRepo.save(txnRepo.create({
        type: '入库', subType: item.type === '农产品' ? '农产品入库' : '农资采购入库',
        inventoryId: inv.id, itemName: inv.name, quantity: inv.quantity,
        unit: inv.unit, operator: '赵小燕', sourceOrDest: item.type === '农资' ? '农资供应商' : '农场采收',
        batchNumber: item.batchNumber, transactionDate: new Date(),
      }));
    }
    console.log(`库存: ${items.length} 项 (含出入库记录)`);
  }

  // ===== 6. 成本记录 =====
  const costRepo = AppDataSource.getRepository(CostRecord);
  const costCount = await costRepo.count();
  if (costCount === 0) {
    const costs = [
      { type: '种子', description: '番茄种子', amount: 500, date: d(-120), batchId: batches[0]?.id },
      { type: '种子', description: '黄瓜种子', amount: 400, date: d(-90), batchId: batches[1]?.id },
      { type: '肥料', description: '复合肥', amount: 1800, date: d(-90), batchId: batches[0]?.id },
      { type: '肥料', description: '有机肥', amount: 2500, date: d(-80), batchId: batches[0]?.id },
      { type: '农药', description: '吡虫啉', amount: 300, date: d(-40), batchId: batches[0]?.id },
      { type: '人工', description: '播种人工费', amount: 2000, date: d(-120), batchId: batches[0]?.id },
      { type: '人工', description: '采收人工费', amount: 3000, date: d(-5), batchId: batches[0]?.id },
      { type: '机械', description: '拖拉机耕地', amount: 800, date: d(-115), batchId: batches[0]?.id },
      { type: '肥料', description: '复合肥', amount: 1500, date: d(-70), batchId: batches[1]?.id },
      { type: '人工', description: '整枝人工费', amount: 1200, date: d(-50), batchId: batches[1]?.id },
    ];
    for (const c of costs) { await costRepo.save(costRepo.create(c as any)); }
    console.log(`成本记录: ${costs.length} 条`);
  }

  // ===== 7. 销售记录 =====
  const salesRepo = AppDataSource.getRepository(SalesRecord);
  const salesCount = await salesRepo.count();
  if (salesCount === 0) {
    const sales = [
      { customer: '永辉超市', product: '番茄', varietyName: '番茄', quantity: 500, unit: 'kg', unitPrice: 8, totalAmount: 4000, batchNumber: batches[0]?.batchNumber, paymentStatus: '已付款', saleDate: d(-3), salesperson: '刘明辉' },
      { customer: '盒马鲜生', product: '番茄', varietyName: '番茄', quantity: 800, unit: 'kg', unitPrice: 7.5, totalAmount: 6000, batchNumber: batches[0]?.batchNumber, paymentStatus: '已付款', saleDate: d(-2), salesperson: '刘明辉' },
      { customer: '美团买菜', product: '黄瓜', varietyName: '黄瓜', quantity: 300, unit: 'kg', unitPrice: 5, totalAmount: 1500, batchNumber: batches[1]?.batchNumber, paymentStatus: '未付款', saleDate: d(-1), salesperson: '刘明辉' },
      { customer: '本地菜市场', product: '番茄', varietyName: '番茄', quantity: 700, unit: 'kg', unitPrice: 6, totalAmount: 4200, batchNumber: batches[0]?.batchNumber, paymentStatus: '已付款', saleDate: d(-1), salesperson: '刘明辉' },
    ];
    for (const s of sales) { await salesRepo.save(salesRepo.create(s as any)); }
    console.log(`销售记录: ${sales.length} 条`);
  }

  // ===== 8. 库存出库 =====
  const txnCount = await txnRepo.count({ where: { type: '出库' } });
  if (txnCount === 0 && batches.length > 0) {
    const tomatoInv = await invRepo.findOne({ where: { name: '番茄' } });
    if (tomatoInv) {
      await txnRepo.save(txnRepo.create({ type: '出库', subType: '销售出库', inventoryId: tomatoInv.id, itemName: '番茄', quantity: 2000, unit: 'kg', operator: '赵小燕', approver: '李建国', sourceOrDest: '超市/菜市场', transactionDate: new Date() }));
      tomatoInv.quantity = 0;
      await invRepo.save(tomatoInv);
    }
  }

  await AppDataSource.destroy();
  console.log('\n✅ 全部种子数据插入完成！');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
