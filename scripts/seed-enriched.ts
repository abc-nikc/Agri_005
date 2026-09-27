import { AppDataSource } from '../backend/src/config/database';
import { SensorData } from '../backend/src/models/sensor-data.entity';
import { ProductionBatch } from '../backend/src/models/production-batch.entity';
import { FarmTask } from '../backend/src/models/farm-task.entity';
import { AlertRecord } from '../backend/src/models/alert-record.entity';
import { Notification } from '../backend/src/models/notification.entity';
import { Plot } from '../backend/src/models/plot.entity';
import { Variety } from '../backend/src/models/variety.entity';
import { Staff } from '../backend/src/models/staff.entity';
import { PlantingPlan } from '../backend/src/models/planting-plan.entity';
import { Inventory } from '../backend/src/models/inventory.entity';
import { Stocktake } from '../backend/src/models/stocktake.entity';
import { TraceabilityService } from '../backend/src/services/traceability.service';

function hoursAgo(h: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d;
}

function daysAgo(d: number): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(8, 0, 0, 0);
  return dt;
}

function daysFromNow(d: number): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(8, 0, 0, 0);
  return dt;
}

async function seed() {
  await AppDataSource.initialize();
  console.log('数据库已连接\n');

  const sensorRepo = AppDataSource.getRepository(SensorData);
  const batchRepo = AppDataSource.getRepository(ProductionBatch);
  const taskRepo = AppDataSource.getRepository(FarmTask);
  const alertRepo = AppDataSource.getRepository(AlertRecord);
  const notifRepo = AppDataSource.getRepository(Notification);
  const plotRepo = AppDataSource.getRepository(Plot);
  const varRepo = AppDataSource.getRepository(Variety);
  const staffRepo = AppDataSource.getRepository(Staff);
  const planRepo = AppDataSource.getRepository(PlantingPlan);
  const inventoryRepo = AppDataSource.getRepository(Inventory);
  const stocktakeRepo = AppDataSource.getRepository(Stocktake);

  const plots = await plotRepo.find();
  const varieties = await varRepo.find();
  console.log(`已有地块 ${plots.length} 个，品种 ${varieties.length} 个`);

  // ===== 1. 传感器数据 =====
  const existingSensors = await sensorRepo.count();
  if (existingSensors < 100) {
    const plotIds = plots.map(p => ({ id: p.id, name: p.plotNumber }));
    const sensorTypes = [
      { type: 'temperature', min: 22, max: 35, unit: '°C' },
      { type: 'humidity', min: 45, max: 85, unit: '%' },
      { type: 'soil_moisture', min: 20, max: 70, unit: '%' },
      { type: 'light', min: 30000, max: 90000, unit: 'lux' },
      { type: 'co2', min: 350, max: 600, unit: 'ppm' },
      { type: 'ph', min: 5.5, max: 7.5, unit: '' },
    ];
    const sensors: any[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const p of plotIds) {
        for (const s of sensorTypes) {
          // Make some values lower for drought detection
          let val: number;
          if (s.type === 'soil_moisture' && p.name === 'B02' && hour < 6) {
            val = 18 + Math.random() * 12; // Low soil moisture for B02
          } else if (s.type === 'temperature' && hour >= 12 && hour <= 15) {
            val = s.min + (s.max - s.min) * 0.8 + Math.random() * (s.max - s.min) * 0.2;
          } else {
            val = s.min + Math.random() * (s.max - s.min);
          }
          const rounded = s.type === 'light' ? Math.round(val) : parseFloat(val.toFixed(1));
          sensors.push({
            plotId: p.id,
            deviceId: `${p.name}-SENSOR-${sensorTypes.indexOf(s) + 1}`,
            sensorType: s.type,
            value: rounded,
            unit: s.unit,
            recordedAt: hoursAgo(24 - hour),
          });
        }
      }
    }
    // Insert in batches
    for (let i = 0; i < sensors.length; i += 50) {
      await sensorRepo.insert(sensors.slice(i, i + 50));
    }
    console.log(`传感器数据: ${sensors.length} 条`);
  } else {
    const [latest] = await sensorRepo.find({ order: { recordedAt: 'DESC' }, take: 1 });
    if (latest) {
      const shiftSeconds = Math.max(0, Math.floor((Date.now() - latest.recordedAt.getTime()) / 1000) - 60);
      if (shiftSeconds > 0) {
        await sensorRepo.query(
          'UPDATE sensor_data SET recorded_at = DATE_ADD(recorded_at, INTERVAL ? SECOND)',
          [shiftSeconds],
        );
      }
    }
    await alertRepo.createQueryBuilder().update()
      .set({ resolved: true, resolvedAt: new Date(), resolvedBy: 'demo-seed-refresh' })
      .where("anomaly_type = 'offline' AND device_id LIKE '%-SENSOR-%' AND resolved = 0")
      .execute();
    await notifRepo.createQueryBuilder().delete()
      .where("message LIKE :pattern", { pattern: '[IoT告警] 设备 %-SENSOR-%已离线%' })
      .execute();
    console.log(`传感器数据已存在: ${existingSensors} 条，时间已刷新为在线状态`);
  }

  // ===== 2. 生产批次 =====
  const existingBatches = await batchRepo.count();
  if (existingBatches < 3) {
    const batchDefs = [
      { plotName: 'B01', varietyName: '辣椒', area: 5, sowDaysAgo: 60, harvestDaysFromNow: 60, status: '生长中' },
      { plotName: 'B02', varietyName: '西瓜', area: 4, sowDaysAgo: 45, harvestDaysFromNow: 40, status: '生长中' },
      { plotName: 'C01', varietyName: '草莓', area: 1, sowDaysAgo: 20, harvestDaysFromNow: 75, status: '苗期' },
      { plotName: 'A01', varietyName: '番茄', area: 8, sowDaysAgo: 100, harvestDaysFromNow: 10, status: '接近采收' },
    ];
    for (const bd of batchDefs) {
      const plot = plots.find(p => p.plotNumber === bd.plotName);
      const variety = varieties.find(v => v.name === bd.varietyName);
      if (!plot || !variety) { console.log(`跳过: ${bd.varietyName}(${bd.plotName}) - 找不到地块或品种`); continue; }
      const bn = `P${daysAgo(bd.sowDaysAgo).toISOString().slice(0, 10).replace(/-/g, '')}-${plot.plotNumber}-${variety.name}`;
      const ex = await batchRepo.findOne({ where: { batchNumber: bn } });
      if (!ex) {
        await batchRepo.save(batchRepo.create({
          batchNumber: bn,
          plotId: plot.id,
          plotName: plot.plotNumber,
          varietyId: variety.id,
          varietyName: variety.name,
          sowDate: daysAgo(bd.sowDaysAgo).toISOString().slice(0, 10),
          estimatedHarvestDate: daysFromNow(bd.harvestDaysFromNow).toISOString().slice(0, 10),
          area: bd.area,
          status: bd.status,
        }));
      }
    }
    console.log(`新增批次: ${batchDefs.length} 个`);
  } else {
    console.log(`批次已存在: ${existingBatches} 个，跳过`);
  }

  // ===== 2.1 已完成批次质量检验 =====
  const completedBatches = await batchRepo.find({ where: { status: '已完成' } });
  for (const [index, batch] of completedBatches.entries()) {
    if (batch.qualityStatus !== '合格') {
      batch.qualityStatus = '合格';
      batch.qualityGrade = index === 0 ? '一级' : '二级';
      batch.actualYield = index === 0 ? 2680 : 2250;
      batch.inspectionNotes = '外观、成熟度、含水率及农残快速检测均符合入库标准。';
      batch.inspectedAt = daysAgo(2 + index);
      batch.inspectedBy = '陈美玲';
      await batchRepo.save(batch);
    }
  }
  console.log(`质量检验: ${completedBatches.length} 个已完成批次`);

  // ===== 2.2 种植计划 =====
  if (await planRepo.count() === 0) {
    const allBatches = await batchRepo.find({ order: { sowDate: 'ASC' } });
    for (const batch of allBatches) {
      await planRepo.save(planRepo.create({
        plotId: batch.plotId,
        plotName: batch.plotName,
        varietyId: batch.varietyId,
        varietyName: batch.varietyName,
        plannedSowDate: batch.sowDate,
        plannedHarvestDate: batch.estimatedHarvestDate,
        status: batch.status === '已完成' ? '已完成' : '执行中',
        solarTerm: batch.varietyName === '番茄' ? '小满' : batch.varietyName === '黄瓜' ? '夏至' : '大暑',
        area: batch.area,
        batchId: batch.id,
        remark: batch.status === '已完成' ? '计划已执行并完成质量检验。' : '计划执行中，生产批次已自动关联。',
      }));
    }
    const futurePlot = plots.find(p => p.plotNumber === 'B02');
    const futureVariety = varieties.find(v => v.name === '菠菜') || varieties[0];
    if (futurePlot && futureVariety) {
      await planRepo.save(planRepo.create({
        plotId: futurePlot.id,
        plotName: futurePlot.plotNumber,
        varietyId: futureVariety.id,
        varietyName: futureVariety.name,
        plannedSowDate: daysFromNow(10).toISOString().slice(0, 10),
        plannedHarvestDate: daysFromNow(60).toISOString().slice(0, 10),
        status: '待执行',
        solarTerm: '寒露',
        area: 4,
        remark: '秋季叶菜轮作计划，待农艺师确认后执行。',
      }));
    }
  }
  console.log(`种植计划: ${await planRepo.count()} 条`);

  // ===== 3. 农事任务 =====
  const existingTasks = await taskRepo.count();
  if (existingTasks < 3) {
    const plotA = plots.find(p => p.plotNumber === 'A01');
    const plotB = plots.find(p => p.plotNumber === 'B01');
    const plotB2 = plots.find(p => p.plotNumber === 'B02');
    const plotC = plots.find(p => p.plotNumber === 'C01');
    const tasks = [
      {
        title: '紧急灌溉 - B02地块土壤干旱', category: '灌溉', priority: 'high' as const, status: '待执行' as const,
        plotId: plotB2?.id, plotName: 'B02', description: 'B02地块土壤湿度降至22.6%，低于30%警戒线，需立即灌溉。建议灌溉量：200m³',
        assigneeName: '王大山', scheduledDate: new Date(), aiGenerated: true, aiReason: '土壤湿度低于30%警戒值',
      },
      {
        title: '施肥 - A01番茄追膨果肥', category: '施肥', priority: 'medium' as const, status: '待执行' as const,
        plotId: plotA?.id, plotName: 'A01', varietyName: '番茄', description: '番茄进入膨果期，需追施高钾复合肥，亩施20kg',
        assigneeName: '陈美玲', scheduledDate: daysFromNow(2), aiGenerated: false,
      },
      {
        title: '病虫害防治 - B01辣椒蚜虫', category: '打药', priority: 'high' as const, status: '待执行' as const,
        plotId: plotB?.id, plotName: 'B01', varietyName: '辣椒', description: '辣椒植株发现蚜虫危害，需使用吡虫啉1500倍液喷雾防治',
        assigneeName: '王大山', scheduledDate: daysFromNow(1), aiGenerated: true, aiReason: '蚜虫危害检测',
      },
      {
        title: '除草 - C01地块人工除草', category: '除草', priority: 'low' as const, status: '待执行' as const,
        plotId: plotC?.id, plotName: 'C01', description: '草莓地块杂草较多，需人工除草，避免使用化学除草剂',
        assigneeName: '赵小燕', scheduledDate: daysFromNow(3), aiGenerated: false,
      },
      {
        title: '设备检修 - 灌溉设备IRR-002', category: '维修', priority: 'high' as const, status: '待执行' as const,
        description: 'IRR-002灌溉设备维护中，需更换密封圈，检查喷头', assigneeName: '王大山', scheduledDate: new Date(), aiGenerated: false,
      },
      {
        title: '采收准备 - A01番茄即将成熟', category: '采收', priority: 'medium' as const, status: '待执行' as const,
        plotId: plotA?.id, plotName: 'A01', varietyName: '番茄', description: '番茄预计10天后采收，需提前准备采收工具、包装箱和冷库',
        assigneeName: '赵小燕', scheduledDate: daysFromNow(5), aiGenerated: true, aiReason: '番茄接近采收期',
      },
      {
        title: '整枝打杈 - A01番茄侧枝修剪', category: '整枝', priority: 'medium' as const, status: '执行中' as const,
        plotId: plotA?.id, plotName: 'A01', varietyName: '番茄', description: '番茄第一穗果坐住后，需打掉下部侧枝，保留主干和第一侧枝',
        assigneeName: '王大山', scheduledDate: daysAgo(1), aiGenerated: false,
      },
      {
        title: '巡检 - 全场设备日常巡检', category: '巡检', priority: 'low' as const, status: '待执行' as const,
        description: '检查所有物联网设备运行状态、电池电量、数据传输情况', assigneeName: '陈美玲', scheduledDate: daysFromNow(1), aiGenerated: false,
      },
    ];
    for (const t of tasks) {
      await taskRepo.save(taskRepo.create(t as any));
    }
    console.log(`农事任务: ${tasks.length} 条`);
  } else {
    console.log(`任务已存在: ${existingTasks} 条，跳过`);
  }

  // ===== 4. 预警记录 =====
  const existingAlerts = await alertRepo.count();
  if (existingAlerts < 3) {
    const plotB2 = plots.find(p => p.plotNumber === 'B02');
    const alerts = [
      {
        plotId: plotB2?.id, deviceId: 'B02-SENSOR-3', sensorType: 'soil_moisture', sensorName: 'B02土壤湿度',
        value: 22.6, unit: '%', anomalyType: 'out_of_bounds',
        message: 'B02地块土壤湿度22.6%，低于下限阈值30%', severity: 'warning',
        threshold: '30%~70%', resolved: false,
      },
      {
        deviceId: 'PUMP-001', anomalyType: 'offline',
        message: 'PUMP-001水泵设备离线，可能存在故障', severity: 'critical',
        resolved: false,
      },
      {
        deviceId: 'A01-SENSOR-1', sensorType: 'temperature', sensorName: 'A01温度',
        value: 35.6, unit: '°C', anomalyType: 'out_of_bounds',
        message: 'A01地块温度35.6°C，超过上限阈值35°C', severity: 'warning',
        threshold: '15°C~35°C', resolved: false,
      },
    ];
    for (const a of alerts) {
      await alertRepo.save(alertRepo.create(a as any));
    }
    console.log(`预警记录: ${alerts.length} 条`);
  } else {
    console.log(`预警已存在: ${existingAlerts} 条，跳过`);
  }

  // ===== 5. 通知消息 =====
  const existingNotifs = await notifRepo.count();
  const admin = await staffRepo.findOne({ where: { username: 'admin' } });
  if (admin) {
    await notifRepo.createQueryBuilder().update().set({ userId: admin.id })
      .where('user_id IS NULL OR user_id = :empty', { empty: '' }).execute();
  }
  if (existingNotifs < 3) {
    const notifs = [
      {
        message: '欢迎使用智能农场管家系统！系统已接入5个地块的物联网监控，覆盖温度、湿度、土壤、光照、CO2、pH六类传感器。如需帮助，请联系管理员。',
        type: 'info', isRead: false, link: '/dashboard',
      },
      {
        message: '💡 AI建议：B02地块土壤湿度已降至22.6%（低于30%警戒线），建议今日下午进行灌溉，灌溉量约200m³。当前天气晴朗，灌溉后预计土壤湿度可恢复至45%以上。',
        type: 'warning', isRead: false, link: '/iot',
      },
      {
        message: '⏰ 任务提醒：辣椒病虫害防治任务（B01地块）将于明日到期，请安排操作员及时处理。当前蚜虫密度为中等水平，建议使用吡虫啉1500倍液喷雾。',
        type: 'warning', isRead: false, link: '/farm-tasks',
      },
      {
        message: '🔧 设备提醒：PUMP-001水泵设备处于故障状态，已离线超过2小时。建议尽快安排维修，避免影响灌溉作业。',
        type: 'error', isRead: false, link: '/equipment',
      },
      {
        message: '📊 系统周报：本周完成农事操作12次，包括灌溉3次、施肥2次、打药1次、除草2次、采收4次。生产批次3个正常生长中，库存充足。',
        type: 'info', isRead: true, link: '/dashboard',
      },
      {
        message: '🌱 种植建议：当前节气为芒种，适合夏播播种和病虫害综合防治。建议关注梅雨季排水和高温高湿病害预防。',
        type: 'info', isRead: false, link: '/ai',
      },
    ];
    for (const n of notifs) {
      await notifRepo.save(notifRepo.create({ ...n, userId: admin?.id } as any));
    }
    console.log(`通知消息: ${notifs.length} 条`);
  } else {
    console.log(`通知已存在: ${existingNotifs} 条，跳过`);
  }

  // ===== 5.1 库存盘点记录 =====
  if (await stocktakeRepo.count() === 0) {
    const inventoryItems = await inventoryRepo.find({ take: 3, order: { createdAt: 'ASC' } });
    for (const [index, item] of inventoryItems.entries()) {
      const systemQuantity = Number(item.quantity);
      const actualQuantity = index === 1 ? systemQuantity - 5 : systemQuantity;
      const discrepancy = actualQuantity - systemQuantity;
      await stocktakeRepo.save(stocktakeRepo.create({
        type: '月度',
        executor: '赵小燕',
        inventoryId: item.id,
        itemName: item.name,
        systemQuantity,
        actualQuantity,
        unit: item.unit,
        discrepancy,
        discrepancyRate: systemQuantity ? discrepancy / systemQuantity : 0,
        result: discrepancy === 0 ? '正常' : '盘亏',
        remark: discrepancy === 0 ? '账实相符。' : '运输及分拣损耗，已登记复核。',
      }));
    }
  }
  console.log(`库存盘点: ${await stocktakeRepo.count()} 条`);

  // ===== 6. 质量追溯记录 =====
  const traceService = new TraceabilityService();
  let traceCount = 0;
  for (const batch of completedBatches) {
    await traceService.generateTrace(batch.id, 'seed');
    traceCount++;
  }
  console.log(`质量追溯: ${traceCount} 条`);

  await AppDataSource.destroy();
  console.log('\n✅ 丰富种子数据插入完成！');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
