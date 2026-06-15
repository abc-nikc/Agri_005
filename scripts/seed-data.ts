import { Variety } from '../models/variety.entity';
import { AppDataSource } from '../config/database';

// 10种常见蔬菜品种种子数据
const seedVarieties = [
  {
    name: '小白菜',
    category: '叶菜类',
    sowing_season: '春秋',
    planting_density: 25,
    fertilization_rate: 500,
    watering_frequency: 3,
    growth_cycle: 45,
    safety_interval: 7,
  },
  {
    name: '菠菜',
    category: '叶菜类',
    sowing_season: '秋',
    planting_density: 20,
    fertilization_rate: 600,
    watering_frequency: 4,
    growth_cycle: 50,
    safety_interval: 10,
  },
  {
    name: '胡萝卜',
    category: '根茎类',
    sowing_season: '春',
    planting_density: 15,
    fertilization_rate: 400,
    watering_frequency: 2,
    growth_cycle: 90,
    safety_interval: 14,
  },
  {
    name: '土豆',
    category: '根茎类',
    sowing_season: '春',
    planting_density: 8,
    fertilization_rate: 800,
    watering_frequency: 2,
    growth_cycle: 120,
    safety_interval: 21,
  },
  {
    name: '番茄',
    category: '果菜类',
    sowing_season: '春',
    planting_density: 3,
    fertilization_rate: 1000,
    watering_frequency: 3,
    growth_cycle: 120,
    safety_interval: 15,
  },
  {
    name: '黄瓜',
    category: '果菜类',
    sowing_season: '夏',
    planting_density: 4,
    fertilization_rate: 900,
    watering_frequency: 4,
    growth_cycle: 70,
    safety_interval: 10,
  },
  {
    name: '西兰花',
    category: '花菜类',
    sowing_season: '秋',
    planting_density: 6,
    fertilization_rate: 700,
    watering_frequency: 3,
    growth_cycle: 90,
    safety_interval: 14,
  },
  {
    name: '花椰菜',
    category: '花菜类',
    sowing_season: '秋',
    planting_density: 6,
    fertilization_rate: 700,
    watering_frequency: 3,
    growth_cycle: 85,
    safety_interval: 14,
  },
  {
    name: '香菜',
    category: '香料类',
    sowing_season: '春秋',
    planting_density: 30,
    fertilization_rate: 300,
    watering_frequency: 2,
    growth_cycle: 40,
    safety_interval: 7,
  },
  {
    name: '薄荷',
    category: '香料类',
    sowing_season: '春',
    planting_density: 20,
    fertilization_rate: 400,
    watering_frequency: 3,
    growth_cycle: 60,
    safety_interval: 7,
  },
];

export async function seedDatabase() {
  const varietyRepository = AppDataSource.getRepository(Variety);

  console.log('开始插入品种种子数据...');

  for (const varietyData of seedVarieties) {
    const existing = await varietyRepository.findOne({
      where: { name: varietyData.name },
    });

    if (!existing) {
      const variety = varietyRepository.create(varietyData);
      await varietyRepository.save(variety);
      console.log(`✓ 已插入品种: ${varietyData.name}`);
    } else {
      console.log(`- 品种已存在: ${varietyData.name}`);
    }
  }

  console.log('品种种子数据插入完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      console.log('数据库连接成功');
      await seedDatabase();
      await AppDataSource.destroy();
      process.exit(0);
    })
    .catch((error) => {
      console.error('种子数据插入失败:', error);
      process.exit(1);
    });
}
