import { AppDataSource } from '../backend/src/config/database';
import { Variety } from '../backend/src/models/variety.entity';
import { Plot } from '../backend/src/models/plot.entity';

const varieties = [
  { name: '小白菜', category: '叶菜类', sowingSeason: ['春', '秋'], plantingDensity: 25, fertilizationRate: 500, wateringFrequency: 3, growthCycle: 45, safetyInterval: 7 },
  { name: '菠菜', category: '叶菜类', sowingSeason: ['秋'], plantingDensity: 20, fertilizationRate: 600, wateringFrequency: 4, growthCycle: 50, safetyInterval: 10 },
  { name: '胡萝卜', category: '根茎类', sowingSeason: ['春'], plantingDensity: 15, fertilizationRate: 400, wateringFrequency: 2, growthCycle: 90, safetyInterval: 14 },
  { name: '土豆', category: '根茎类', sowingSeason: ['春'], plantingDensity: 8, fertilizationRate: 800, wateringFrequency: 2, growthCycle: 120, safetyInterval: 21 },
  { name: '番茄', category: '果菜类', sowingSeason: ['春'], plantingDensity: 3, fertilizationRate: 1000, wateringFrequency: 3, growthCycle: 120, safetyInterval: 15 },
  { name: '黄瓜', category: '果菜类', sowingSeason: ['夏'], plantingDensity: 4, fertilizationRate: 900, wateringFrequency: 4, growthCycle: 70, safetyInterval: 10 },
  { name: '西兰花', category: '花菜类', sowingSeason: ['秋'], plantingDensity: 6, fertilizationRate: 700, wateringFrequency: 3, growthCycle: 90, safetyInterval: 14 },
  { name: '花椰菜', category: '花菜类', sowingSeason: ['秋'], plantingDensity: 6, fertilizationRate: 700, wateringFrequency: 3, growthCycle: 85, safetyInterval: 14 },
  { name: '香菜', category: '香料类', sowingSeason: ['春', '秋'], plantingDensity: 30, fertilizationRate: 300, wateringFrequency: 2, growthCycle: 40, safetyInterval: 7 },
  { name: '薄荷', category: '香料类', sowingSeason: ['春'], plantingDensity: 20, fertilizationRate: 400, wateringFrequency: 3, growthCycle: 60, safetyInterval: 7 },
  { name: '辣椒', category: '果菜类', sowingSeason: ['春'], plantingDensity: 5, fertilizationRate: 800, wateringFrequency: 3, growthCycle: 100, safetyInterval: 14 },
  { name: '茄子', category: '果菜类', sowingSeason: ['春'], plantingDensity: 4, fertilizationRate: 700, wateringFrequency: 3, growthCycle: 110, safetyInterval: 12 },
];

const plots = [
  { plotNumber: 'A01', area: 15, status: '闲置', soilType: '壤土', region: 'A区' },
  { plotNumber: 'A02', area: 20, status: '闲置', soilType: '沙壤土', region: 'A区' },
  { plotNumber: 'B01', area: 30, status: '闲置', soilType: '黏土', region: 'B区' },
  { plotNumber: 'B02', area: 25, status: '闲置', soilType: '壤土', region: 'B区' },
  { plotNumber: 'C01', area: 50, status: '闲置', soilType: '沙壤土', region: 'C区' },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('数据库已连接');

  const vRepo = AppDataSource.getRepository(Variety);
  const pRepo = AppDataSource.getRepository(Plot);

  let vCount = 0;
  for (const v of varieties) {
    const exist = await vRepo.findOne({ where: { name: v.name } });
    if (!exist) { await vRepo.save(vRepo.create(v)); vCount++; }
  }
  console.log(`品种: 新增 ${vCount} 条 (共 ${varieties.length} 种)`);

  let pCount = 0;
  for (const p of plots) {
    const exist = await pRepo.findOne({ where: { plotNumber: p.plotNumber } });
    if (!exist) { await pRepo.save(pRepo.create(p)); pCount++; }
  }
  console.log(`地块: 新增 ${pCount} 条 (共 ${plots.length} 块)`);

  await AppDataSource.destroy();
  console.log('种子数据插入完成!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
