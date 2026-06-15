import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { SensorData } from '../models/sensor-data.entity';
import { ProductionBatch } from '../models/production-batch.entity';
import { Variety } from '../models/variety.entity';
import { Equipment } from '../models/equipment.entity';

interface Suggestion { type: 'irrigation' | 'harvest' | 'pest' | 'maintenance'; title: string; message: string; severity: 'info' | 'warning' | 'danger'; plotId?: string; batchId?: string; }

export class SmartSuggestionsService {

  /** 智能灌溉建议 — 土壤湿度 < 25% 建议灌溉 */
  async getIrrigationSuggestions(): Promise<Suggestion[]> {
    const sensorRepo = AppDataSource.getRepository(SensorData);
    const suggestions: Suggestion[] = [];
    try {
      const latest = await sensorRepo
        .createQueryBuilder('s')
        .where('s.sensor_type = :t', { t: 'soil_moisture' })
        .andWhere('s.recorded_at = (SELECT MAX(s2.recorded_at) FROM sensor_data s2 WHERE s2.device_id = s.device_id AND s2.sensor_type = s.sensor_type)')
        .getRawMany();

      for (const row of latest) {
        const val = Number(row.s_value || row.value);
        if (val < 25) {
          suggestions.push({
            type: 'irrigation', title: `地块 ${row.s_plot_id || row.plot_id} 需要灌溉`,
            message: `土壤湿度仅 ${val.toFixed(1)}%，建议立即灌溉（正常范围 20%-80%）`,
            severity: 'danger', plotId: row.s_plot_id || row.plot_id,
          });
        } else if (val < 35) {
          suggestions.push({
            type: 'irrigation', title: `地块 ${row.s_plot_id || row.plot_id} 土壤偏干`,
            message: `土壤湿度 ${val.toFixed(1)}%，建议近期安排灌溉`,
            severity: 'warning', plotId: row.s_plot_id || row.plot_id,
          });
        }
      }
    } catch {}
    return suggestions;
  }

  /** 采收预测提醒 — 距离预计采收日 ≤ 3 天 */
  async getHarvestPredictions(): Promise<Suggestion[]> {
    const batchRepo = AppDataSource.getRepository(ProductionBatch);
    const suggestions: Suggestion[] = [];
    try {
      const batches = await batchRepo.find({ where: { status: '进行中' } });
      const now = new Date();
      for (const b of batches) {
        if (!b.estimatedHarvestDate) continue;
        const daysLeft = Math.ceil((new Date(b.estimatedHarvestDate).getTime() - now.getTime()) / 86400000);
        if (daysLeft <= 0) {
          suggestions.push({
            type: 'harvest', title: `${b.varietyName || ''} 应收期已到`,
            message: `批次 ${b.batchNumber} 预计采收日期已到（${b.estimatedHarvestDate}），请安排采收`,
            severity: 'danger', batchId: b.id,
          });
        } else if (daysLeft <= 3) {
          suggestions.push({
            type: 'harvest', title: `${b.varietyName || ''} 即将采收`,
            message: `批次 ${b.batchNumber} 预计 ${daysLeft} 天后采收（${b.estimatedHarvestDate}）`,
            severity: 'warning', batchId: b.id,
          });
        } else if (daysLeft <= 7) {
          suggestions.push({
            type: 'harvest', title: `${b.varietyName || ''} 一周内采收`,
            message: `批次 ${b.batchNumber} 预计 ${daysLeft} 天后采收，请做好准备工作`,
            severity: 'info', batchId: b.id,
          });
        }
      }
    } catch {}
    return suggestions;
  }

  /** 病虫害风险预警 — 高温+高湿 */
  async getPestRiskWarnings(): Promise<Suggestion[]> {
    const sensorRepo = AppDataSource.getRepository(SensorData);
    const suggestions: Suggestion[] = [];
    try {
      const latest = await sensorRepo
        .createQueryBuilder('s')
        .where('s.recorded_at = (SELECT MAX(s2.recorded_at) FROM sensor_data s2 WHERE s2.device_id = s.device_id AND s2.sensor_type = s.sensor_type)')
        .getRawMany();

      const readings: Record<string, { temp: number; hum: number }> = {};
      for (const row of latest) {
        const pid = row.s_plot_id || row.plot_id;
        if (!readings[pid]) readings[pid] = { temp: 0, hum: 0 };
        const val = Number(row.s_value || row.value);
        if (row.s_sensor_type === 'temperature' || row.sensor_type === 'temperature') readings[pid].temp = val;
        if (row.s_sensor_type === 'humidity' || row.sensor_type === 'humidity') readings[pid].hum = val;
      }

      for (const [pid, r] of Object.entries(readings)) {
        if (r.temp > 28 && r.hum > 75) {
          suggestions.push({
            type: 'pest', title: `地块 ${pid} 病虫害高风险`,
            message: `温度 ${r.temp}°C + 湿度 ${r.hum}%，真菌/虫害易发，建议检查并预防`,
            severity: 'danger', plotId: pid,
          });
        } else if (r.temp > 25 && r.hum > 65) {
          suggestions.push({
            type: 'pest', title: `地块 ${pid} 病虫害中风险`,
            message: `温度 ${r.temp}°C + 湿度 ${r.hum}%，注意观察植株状况`,
            severity: 'warning', plotId: pid,
          });
        }
      }
    } catch {}
    return suggestions;
  }

  /** 获取所有建议 */
  async getAllSuggestions(): Promise<Suggestion[]> {
    const [irrigation, harvest, pest] = await Promise.all([
      this.getIrrigationSuggestions(),
      this.getHarvestPredictions(),
      this.getPestRiskWarnings(),
    ]);
    return [...irrigation, ...harvest, ...pest];
  }
}

export const smartSuggestions = new SmartSuggestionsService();
