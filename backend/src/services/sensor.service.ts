import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { SensorData } from '../models/sensor-data.entity';
import { AlertRecord } from '../models/alert-record.entity';
import { mqttService } from './mqtt.service';
import { NotificationService } from './notification.service';

// ====== 传感器量程定义（物理极限，不可配置）======
const SENSOR_RANGES: Record<string, [number, number]> = {
  temperature: [0, 50],      // 温度量程: 0~50°C
  humidity: [0, 100],        // 湿度量程: 0~100%
  soil_moisture: [0, 100],   // 土壤湿度量程: 0~100%
  light: [0, 200000],        // 光照量程: 0~200000 lux
  ph: [0, 14],               // pH量程: 0~14
  co2: [0, 5000],            // CO2量程: 0~5000 ppm
};

export class SensorService {
  private repo: Repository<SensorData>;
  private alertRepo: Repository<AlertRecord>;
  private notifier: NotificationService;

  constructor() {
    this.repo = AppDataSource.getRepository(SensorData);
    this.alertRepo = AppDataSource.getRepository(AlertRecord);
    this.notifier = new NotificationService();
  }

  // ====== 动态阈值（从 system_settings 读取）======

  private static DEFAULT_NORMAL_RANGES: Record<string, [number, number]> = {
    temperature: [8, 42],
    humidity: [25, 92],
    soil_moisture: [18, 82],
    light: [500, 150000],
    ph: [4, 9],
    co2: [250, 1200],
  };

  private async getThresholds(): Promise<Record<string, [number, number]>> {
    const { systemSettingsService } = await import('./system-settings.service');
    const types = ['temperature', 'humidity', 'soil_moisture', 'light', 'ph', 'co2'];
    const result: Record<string, [number, number]> = {};
    for (const t of types) {
      const min = await systemSettingsService.getNumber(`threshold_${t}_min`, SensorService.DEFAULT_NORMAL_RANGES[t][0]);
      const max = await systemSettingsService.getNumber(`threshold_${t}_max`, SensorService.DEFAULT_NORMAL_RANGES[t][1]);
      result[t] = [min, max];
    }
    return result;
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
    let sql = `
      SELECT 
        s.id,
        s.plot_id AS plotId,
        s.device_id AS deviceId,
        s.sensor_type AS sensorType,
        s.value,
        s.unit,
        s.recorded_at AS recordedAt,
        s.equipment_id AS equipmentId,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt
      FROM sensor_data s
      INNER JOIN (
        SELECT device_id, sensor_type, MAX(recorded_at) as max_time
        FROM sensor_data
        ${plotId ? 'WHERE plot_id = ?' : ''}
        GROUP BY device_id, sensor_type
      ) latest ON s.device_id = latest.device_id
        AND s.sensor_type = latest.sensor_type
        AND s.recorded_at = latest.max_time
      ${plotId ? 'WHERE s.plot_id = ?' : ''}
    `;
    const params: any[] = [];
    if (plotId) { params.push(plotId); params.push(plotId); }
    return await this.repo.query(sql, params);
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
    return { topic, command, params, sentAt: new Date().toISOString() };
  }

  // ====== 异常检测（增强版）======

  async detectAnomalies(plotId?: string): Promise<{
    anomalies: Array<{
      plotId: string; deviceId: string; sensorType: string;
      sensorName: string; value: number; unit: string;
      anomalyType: string;
      message: string; severity: 'warning' | 'critical';
      threshold?: string; recordedAt: string;
    }>;
    summary: { total: number; warning: number; critical: number };
  }> {
    const latestData = await this.latest(plotId);
    const thresholds = await this.getThresholds();
    const anomalies: any[] = [];

    // 1. 量程越界 (out_of_bounds) — 严重
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
            recordedAt: typeof d.recordedAt === 'string' ? d.recordedAt : (d.recordedAt as Date).toISOString(),
          });
        }
      }
    }

    // 2. 正常范围超限 (out_of_range) — 警告（使用动态阈值）
    for (const d of latestData) {
      const range = SENSOR_RANGES[d.sensorType];
      const normal = thresholds[d.sensorType];
      if (range && normal) {
        const v = Number(d.value);
        if (v >= (range[0] || 0) && v <= (range[1] || Infinity) && (v < normal[0] || v > normal[1])) {
          anomalies.push({
            plotId: d.plotId, deviceId: d.deviceId,
            sensorType: d.sensorType, sensorName: this.sensorLabel(d.sensorType),
            value: v, unit: d.unit,
            anomalyType: 'out_of_range',
            message: `${this.sensorLabel(d.sensorType)} 数值 ${v}${d.unit} 超出正常范围 [${normal[0]}~${normal[1]}]`,
            severity: 'warning',
            threshold: `${normal[0]}~${normal[1]}${d.unit}`,
            recordedAt: typeof d.recordedAt === 'string' ? d.recordedAt : (d.recordedAt as Date).toISOString(),
          });
        }
      }
    }

    // 3. 设备离线检测
    try {
      const { systemSettingsService } = await import('./system-settings.service');
      const offlineMinutes = await systemSettingsService.getNumber('sensor_offline_minutes', 30);
      const cutoff = new Date(Date.now() - offlineMinutes * 60000);
      const activeDevices = await this.repo
        .createQueryBuilder('s')
        .select('DISTINCT s.device_id', 'device_id')
        .addSelect('s.plot_id', 'plot_id')
        .addSelect('MAX(s.recorded_at)', 'last_time')
        .groupBy('s.device_id')
        .addGroupBy('s.plot_id')
        .getRawMany();

      for (const dev of activeDevices) {
        const lastTime = new Date(dev.last_time);
        if (lastTime < cutoff) {
          anomalies.push({
            plotId: dev.plot_id, deviceId: dev.device_id,
            sensorType: '', sensorName: '设备离线',
            value: 0, unit: '',
            anomalyType: 'offline',
            message: `设备 ${dev.device_id} 已离线超过${offlineMinutes}分钟（最后数据: ${lastTime.toLocaleString('zh-CN')}）`,
            severity: 'warning',
            threshold: `${offlineMinutes}分钟内应有数据`,
            recordedAt: dev.last_time,
          });
        }
      }
    } catch (e: any) {
      console.warn('[ALERT] 离线检测失败:', e.message);
    }

    // 4. 死值检测
    try {
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
    } catch (e: any) {
      console.warn('[ALERT] 死值检测失败:', e.message);
    }

    // 去重 (同一设备+传感器+类型只保留一条)
    const seen = new Set<string>();
    const unique = anomalies.filter(a => {
      const key = `${a.deviceId}/${a.sensorType}/${a.anomalyType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 自动写入告警记录并发送通知
    try {
      const { systemSettingsService } = await import('./system-settings.service');
      const autoNotify = await systemSettingsService.getValue('alert_auto_notify');
      if (autoNotify === 'true') {
        await this.recordAndNotify(unique);
      }
    } catch (e: any) {
      console.warn('[ALERT] 自动告警记录失败:', e.message);
    }

    const warnings = unique.filter((a: any) => a.severity === 'warning').length;
    const criticals = unique.filter((a: any) => a.severity === 'critical').length;

    return {
      anomalies: unique,
      summary: { total: unique.length, warning: warnings, critical: criticals },
    };
  }

  /** 将异常写入告警记录表并发送系统通知 */
  private async recordAndNotify(anomalies: any[]): Promise<void> {
    for (const a of anomalies) {
      // 写入告警记录
      await this.alertRepo.save({
        plotId: a.plotId,
        deviceId: a.deviceId,
        sensorType: a.sensorType,
        sensorName: a.sensorName,
        value: a.value,
        unit: a.unit,
        anomalyType: a.anomalyType,
        message: a.message,
        severity: a.severity,
        threshold: a.threshold,
        resolved: false,
      });

      // 发送系统通知
      const type = a.severity === 'critical' ? 'error' : 'warning';
      const msg = `[IoT告警] ${a.message}`;
      try {
        await this.notifier.sendNotification('', msg, { type, link: '/iot' });
      } catch {}
    }
  }

  // ====== 告警记录查询 ======

  async getAlertHistory(params: {
    severity?: string; anomalyType?: string; resolved?: string;
    plotId?: string; page?: number; limit?: number;
  }): Promise<{ records: AlertRecord[]; total: number }> {
    const qb = this.alertRepo.createQueryBuilder('a')
      .orderBy('a.created_at', 'DESC');

    if (params.severity) qb.andWhere('a.severity = :s', { s: params.severity });
    if (params.anomalyType) qb.andWhere('a.anomaly_type = :at', { at: params.anomalyType });
    if (params.resolved !== undefined) qb.andWhere('a.resolved = :r', { r: params.resolved === 'true' });
    if (params.plotId) qb.andWhere('a.plot_id = :p', { p: params.plotId });

    const page = params.page || 1;
    const limit = params.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [records, total] = await qb.getManyAndCount();
    return { records, total };
  }

  async getAlertStatistics(): Promise<{
    total: number; unresolved: number; bySeverity: { severity: string; count: number }[];
    byType: { anomalyType: string; count: number }[]; todayCount: number;
  }> {
    const total = await this.alertRepo.count();
    const unresolved = await this.alertRepo.count({ where: { resolved: false } });
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount = await this.alertRepo.count({ where: { createdAt: MoreThanOrEqual(todayStart) as any } });

    const bySeverityRaw = await this.alertRepo
      .createQueryBuilder('a')
      .select('a.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.severity')
      .getRawMany();
    const byTypeRaw = await this.alertRepo
      .createQueryBuilder('a')
      .select('a.anomaly_type', 'anomalyType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.anomaly_type')
      .getRawMany();

    return {
      total, unresolved,
      bySeverity: bySeverityRaw.map(r => ({ severity: r.severity, count: Number(r.count) })),
      byType: byTypeRaw.map(r => ({ anomalyType: r.anomalyType, count: Number(r.count) })),
      todayCount,
    };
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await this.alertRepo.update(alertId, { resolved: true, resolvedAt: new Date(), resolvedBy });
  }

  // ====== 阈值管理 ======

  async getThresholdsConfig(): Promise<Record<string, { min: number; max: number; label: string; unit: string }>> {
    const thresholds = await this.getThresholds();
    const labels: Record<string, string> = {
      temperature: '温度', humidity: '湿度', soil_moisture: '土壤湿度',
      light: '光照', ph: 'pH值', co2: 'CO₂浓度',
    };
    const units: Record<string, string> = {
      temperature: '°C', humidity: '%', soil_moisture: '%',
      light: 'lux', ph: '', co2: 'ppm',
    };
    const result: Record<string, { min: number; max: number; label: string; unit: string }> = {};
    for (const [k, v] of Object.entries(thresholds)) {
      result[k] = { min: v[0], max: v[1], label: labels[k] || k, unit: units[k] || '' };
    }
    return result;
  }

  async updateThreshold(sensorType: string, min: number, max: number, updatedBy?: string): Promise<void> {
    const { systemSettingsService } = await import('./system-settings.service');
    await systemSettingsService.upsert(`threshold_${sensorType}_min`, String(min), updatedBy);
    await systemSettingsService.upsert(`threshold_${sensorType}_max`, String(max), updatedBy);
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
