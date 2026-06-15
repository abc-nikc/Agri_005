import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { SystemSettings, DEFAULT_SETTINGS } from '../models/system-settings.entity';

export class SystemSettingsService {
  private repo: Repository<SystemSettings>;

  constructor() {
    this.repo = AppDataSource.getRepository(SystemSettings);
  }

  /** 初始化默认配置（首次启动时调用） */
  async initDefaults(): Promise<void> {
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await this.repo.findOne({ where: { settingKey: key } });
      if (!existing) {
        await this.repo.save({
          settingKey: key,
          settingValue: def.value,
          settingType: def.type,
          description: def.description,
        });
      }
    }
  }

  /** 获取所有配置 */
  async getAll(): Promise<SystemSettings[]> {
    return await this.repo.find({ order: { settingKey: 'ASC' } });
  }

  /** 获取单个配置值（含默认值兜底） */
  async getValue(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { settingKey: key } });
    if (row) return row.settingValue;
    const def = DEFAULT_SETTINGS[key];
    return def ? def.value : null;
  }

  /** 获取数值型配置（FR-017/024/025 用） */
  async getNumber(key: string, fallback: number): Promise<number> {
    const val = await this.getValue(key);
    if (val === null) return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  }

  /** 更新或创建配置项 */
  async upsert(key: string, value: string, updatedBy?: string): Promise<SystemSettings> {
    const row = await this.repo.findOne({ where: { settingKey: key } });
    if (row) {
      row.settingValue = value;
      row.updatedBy = updatedBy || null;
      return await this.repo.save(row);
    }
    const def = DEFAULT_SETTINGS[key];
    return await this.repo.save({
      settingKey: key,
      settingValue: value,
      settingType: def?.type || 'string',
      description: def?.description || '',
      updatedBy: updatedBy || null,
    });
  }

  /** 批量更新 */
  async batchUpdate(settings: Record<string, string>, updatedBy?: string): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.upsert(key, value, updatedBy);
    }
  }
}

/** 单例 */
export const systemSettingsService = new SystemSettingsService();
