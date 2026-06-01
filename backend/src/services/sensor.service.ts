import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../config/database';
import { SensorData } from '../models/sensor-data.entity';
import { mqttService } from './mqtt.service';

// ====== 传感器阈值定义 ======
const SENSOR_RANGES: Record<string, [number, number]> = {
  temperature: [0, 50],      // 温度量程: 0~50°C
  humidity: [0, 100],        // 湿度量程: 0~100%
  soil_moisture: [0, 100],   // 土壤湿度量程: 0~100%
  light: [0, 200000],        // 光照量程: 0~200000 lux
  ph: [0, 14],               // pH量程: 0~14
  co2: [0, 5000],            // CO2量程: 0~5000 ppm
};

const NORMAL_RANGES: Record<string, [number, number]> = {
  temperature: [10, 40],     // 正常范围: 10~40°C
  humidity: [30, 90],        // 正常范围: 30~90%
  soil_moisture: [20, 80],   // 正常范围: 20~80%
  light: [1000, 120000],     // 正常范围: 1000~120000 lux
  ph: [5, 8],                // 正常范围: 5~8 pH
  co2: [300, 1000],          // 正常范围: 300~1000 ppm
};

export class SensorService {
  private repo: Repository<SensorData>;

  constructor() {
    this.repo = AppDataSource.getRepository(SensorData);
  }

  // ====== 基础 CRUD ======

  async save(data: {
    plotId: string; deviceId: string; sensorType: string;
    value: number; unit: string; timestamp: string; equipmentId?: string;
  }): Promise<SensorData> {
    const record = this.repo.create({
      plotId: data.plotId, deviceId: data.deviceId,
      sensorType: data.sensorType, value: data.value, unit: data.unit,
      recordedAt: new Date(data.timestamp), equipmentId: data.equipmentId,
    });
    return await this.repo.save(record);
  }

  async query(params: {
    plotId?: string; deviceId?: string; sensorType?: string;
    start?: string; end?: string; limit?: number;
  }): Promise<SensorData[]> {
    const where: any = {};
    if (params.plotId) where.plotId = params.plotId;
    if (params.deviceId) where.deviceId = params.deviceId;
    if (params.sensorType) where.sensorType = params.sensorType;
    if (params.start || params.end) {
      where.recordedAt = Between(
        new Date(params.start || '2000-01-01'),
        new Date(params.end || new Date().toISOString())
      );
    }
    return await this.repo.find({
      where, order: { recordedAt: 'DESC' }, take: params.limit || 200,
    });
  }

  async latest(plotId?: string): Promise<SensorData[]> {
    const qb = this.repo.createQueryBuilder('s')
      .distinctOn(['s.device_id', 's.sensor_type'])
      .orderBy('s.device_id')
      .addOrderBy('s.sensor_type')
      .addOrderBy('s.recorded_at', 'DESC');
    if (plotId) qb.where('s.plot_id = :plotId', { plotId });
    return await qb.getMany();
  }

  async stats(plotId: string, hours: number = 24): Promise<any> {
    const since = new Date(Date.now() - hours * 3600000);
    const data = await this.repo.find({
      where: { plotId, recordedAt: Between(since, new Date()) } as any,
      order: { recordedAt: 'ASC' },
    });
    const result: Record<string, { values: { time: string; value: number }[]; min: number; max: number; avg: number }> = {};
    for (const d of data) {
      if (!result[d.sensorType]) result[d.sensorType] = { values: [], min: Infinity, max: -Infinity, avg: 0 };
      const v = Number(d.value);
      result[d.sensorType].values.push({ time: d.recordedAt.toISOString(), value: v });
      result[d.sensorType].min = Math.min(result[d.sensorType].min, v);
      result[d.sensorType].max = Math.max(result[d.sensorType].max, v);
    }
    for (const k of Object.keys(result)) {
      const arr = result[k].values;
      result[k].avg = arr.length > 0 ? arr.reduce((s, v) => s + v.value, 0) / arr.length : 0;
    }
    return result;
  }

  // ====== MQTT 自动收集 ======

  startMqttCollection() {
    mqttService.on('sensorData', async (data: any) => {
      try {
        await this.save(data);
        console.log(`[MQTT] 传感器数据已存储: ${data.deviceId}/${data.sensorType} = ${data.value}${data.unit}`);
      } catch (e: any) {
        console.error('[MQTT] 存储传感器数据失败:', e.message);
      }
    });
    console.log('[MQTT] 传感器数据收集已启动');
  }

  async sendControl(plotId: string, deviceId: string, command: string, params?: any) {
    const topic = `farm/${plotId}/${deviceId}/control`;
    await mqttService.publish(topic, { command, params, timestamp: new Date().toISOString() });
    return { topic, command, params };
  }

  // ====== 异常检测 ======

  /**
   * 检测所有设备的最新传感器数据异常
   * 返回异常列表，含异常类型、数值、阈值说明
   */
  async detectAnomalies(plotId?: string): Promise<{
    anomalies: Array<{
      plotId: string; deviceId: string; sensorType: string;
      sensorName: string; value: number; unit: string;
      anomalyType: string; // 'out_of_range' | 'out_of_bounds' | 'dead_value' | 'offline'
      message: string; severity: 'warning' | 'critical';
      threshold?: string; recordedAt: string;
    }>;
    summary: { total: number; warning: number; critical: number };
  }> {
    // 1. 获取最新数据
    const latestData = await this.latest(plotId);

    // 2. 获取设备离线检测（超过30分钟无数据的设备视为离线）
    const cutoff = new Date(Date.now() - 30 * 60000);
    const activeDevices = await this.repo
      .createQueryBuilder('s')
      .select('DISTINCT s.device_id', 'device_id')
      .addSelect('s.plot_id', 'plot_id')
      .addSelect('MAX(s.recorded_at)', 'last_time')
      .groupBy('s.device_id')
      .addGroupBy('s.plot_id')
      .getRawMany();

    const anomalies: any[] = [];

    // 3. 检测：量程越界 (out_of_bounds)
    for (const d of latestData) {
      const range = SENSOR_RANGES[d.sensorType];
      if (range) {
        const v = Number(d.value);
        if (v < range[0] || v > range[1]) {
          anomalies.push({
            plotId: d.plotId, deviceId: d.deviceId,
            sensorType: d.sensorType, sensorName: this.sensorLabel(d.sensorType),
            value: v, unit: d.unit,
            anomalyType: 'out_of_bounds',
            message: `${this.sensorLabel(d.sensorType)} 数值 ${v}${d.unit} 超出量程 [${range[0]}~${range[1]}]`,
            severity: 'critical',
            threshold: `${range[0]}~${range[1]}${d.unit}`,
            recordedAt: d.recordedAt.toISOString(),
          });
        }
      }
    }

    // 4. 检测：正常范围超限 (out_of_range) —— 在量程内但不在正常范围内
    for (const d of latestData) {
      const range = SENSOR_RANGES[d.sensorType];
      const normal = NORMAL_RANGES[d.sensorType];
      if (range && normal) {
        const v = Number(d.value);
        // 在量程内但不在正常范围
        if (v >= (range[0] || 0) && v <= (range[1] || Infinity) && (v < normal[0] || v > normal[1])) {
          anomalies.push({
            plotId: d.plotId, deviceId: d.deviceId,
            sensorType: d.sensorType, sensorName: this.sensorLabel(d.sensorType),
            value: v, unit: d.unit,
            anomalyType: 'out_of_range',
            message: `${this.sensorLabel(d.sensorType)} 数值 ${v}${d.unit} 超出正常范围 [${normal[0]}~${normal[1]}]`,
            severity: 'warning',
            threshold: `${normal[0]}~${normal[1]}${d.unit}`,
            recordedAt: d.recordedAt.toISOString(),
          });
        }
      }
    }

    // 5. 检测：设备离线 (超过30分钟无数据)
    for (const dev of activeDevices) {
      const lastTime = new Date(dev.last_time);
      if (lastTime < cutoff) {
        anomalies.push({
          plotId: dev.plot_id, deviceId: dev.device_id,
          sensorType: '', sensorName: '设备离线',
          value: 0, unit: '',
          anomalyType: 'offline',
          message: `设备 ${dev.device_id} 已离线超过30分钟（最后数据: ${lastTime.toLocaleString('zh-CN')}）`,
          severity: 'warning',
          threshold: '30分钟内应有数据',
          recordedAt: dev.last_time,
        });
      }
    }

    // 6. 检测：死值（近1小时内同一传感器数值变化<0.01）
    const oneHourAgo = new Date(Date.now() - 3600000);
    const allDevices = [...new Set(latestData.map(d => d.deviceId))];
    for (const deviceId of allDevices) {
      const deviceData = latestData.filter(d => d.deviceId === deviceId);
      const sensorTypes = [...new Set(deviceData.map(d => d.sensorType))];
      for (const stype of sensorTypes) {
        const history = await this.repo.find({
          where: { deviceId, sensorType: stype, recordedAt: Between(oneHourAgo, new Date()) } as any,
          order: { recordedAt: 'DESC' },
          take: 10,
        });
        if (history.length >= 5) {
          const values = history.map(h => Number(h.value));
          const variation = Math.max(...values) - Math.min(...values);
          const isDead = variation < 0.01 && values[0] !== 0;
          if (isDead) {
            const latestEntry = history[0];
            anomalies.push({
              plotId: latestEntry.plotId, deviceId,
              sensorType: stype, sensorName: this.sensorLabel(stype),
              value: values[0], unit: latestEntry.unit,
              anomalyType: 'dead_value',
              message: `${this.sensorLabel(stype)} 传感器疑似死值（1小时内变化量 ${variation.toFixed(4)} < 0.01）`,
              severity: 'warning',
              threshold: '变化量应 > 0.01',
              recordedAt: latestEntry.recordedAt.toISOString(),
            });
          }
        }
      }
    }

    // 去重 (同一设备+传感器+类型只保留一条)
    const seen = new Set<string>();
    const unique = anomalies.filter(a => {
      const key = `${a.deviceId}/${a.sensorType}/${a.anomalyType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const warnings = unique.filter(a => a.severity === 'warning').length;
    const criticals = unique.filter(a => a.severity === 'critical').length;

    return {
      anomalies: unique,
      summary: { total: unique.length, warning: warnings, critical: criticals },
    };
  }

  private sensorLabel(t: string): string {
    const map: Record<string, string> = {
      temperature: '温度', humidity: '湿度', soil_moisture: '土壤湿度',
      light: '光照', ph: 'pH值', co2: 'CO₂浓度',
    };
    return map[t] || t;
  }
}

export const sensorService = new SensorService();
