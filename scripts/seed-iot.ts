import { AppDataSource } from '../backend/src/config/database';
import { SensorData } from '../backend/src/models/sensor-data.entity';

const plots = [
  { plotId: 'A01', region: 'A区' },
  { plotId: 'B01', region: 'B区' },
  { plotId: 'C01', region: 'C区' },
];

const sensors = [
  { type: 'temperature', unit: '°C', min: 15, max: 35, base: 25 },
  { type: 'humidity', unit: '%', min: 40, max: 95, base: 65 },
  { type: 'soil_moisture', unit: '%', min: 25, max: 85, base: 55 },
  { type: 'light', unit: 'lux', min: 5000, max: 80000, base: 35000 },
  { type: 'ph', unit: 'pH', min: 5.5, max: 7.5, base: 6.5 },
  { type: 'co2', unit: 'ppm', min: 350, max: 800, base: 450 },
];

const devices = ['SENSOR-001', 'SENSOR-002', 'SENSOR-003'];

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function seed() {
  await AppDataSource.initialize();
  console.log('数据库已连接');

  const repo = AppDataSource.getRepository(SensorData);
  const records: any[] = [];

  // 为过去24小时每10分钟生成一条数据
  const now = Date.now();
  for (let minutesAgo = 0; minutesAgo < 24 * 60; minutesAgo += 10) {
    const timestamp = new Date(now - minutesAgo * 60000);
    const hour = timestamp.getHours();

    for (const plot of plots) {
      for (const sensor of sensors) {
        // 模拟昼夜变化
        const dayFactor = 1 + Math.sin((hour - 6) / 24 * Math.PI * 2) * 0.3;
        const value = rand(
          sensor.base + (sensor.min - sensor.base) * dayFactor,
          sensor.base + (sensor.max - sensor.base) * dayFactor
        );

        records.push({
          plotId: plot.plotId,
          deviceId: devices[Math.floor(Math.random() * devices.length)],
          sensorType: sensor.type,
          value,
          unit: sensor.unit,
          recordedAt: timestamp,
          equipmentId: undefined,
        });
      }
    }
  }

  // 批量插入
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await repo.save(repo.create(batch));
    console.log(`已插入 ${Math.min(i + batchSize, records.length)} / ${records.length}`);
  }

  console.log(`完成！共插入 ${records.length} 条传感器数据`);
  console.log(`覆盖 ${plots.length} 个地块 x ${sensors.length} 种传感器 x 24小时(间隔10分钟)`);

  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
