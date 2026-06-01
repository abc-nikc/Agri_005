import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AuditLog } from '../models/audit-log.entity';
import { BaseEntity } from '../models/base.entity';
import { Plot } from '../models/plot.entity';
import { Variety } from '../models/variety.entity';
import { Staff } from '../models/staff.entity';
import { Equipment } from '../models/equipment.entity';
import { Notification } from '../models/notification.entity';
import { FarmingOperation } from '../models/farming-operation.entity';
import { PlantingPlan } from '../models/planting-plan.entity';
import { ProductionBatch } from '../models/production-batch.entity';
import { Inventory } from '../models/inventory.entity';
import { StockTransaction } from '../models/stock-transaction.entity';
import { Stocktake } from '../models/stocktake.entity';
import { TraceabilityRecord } from '../models/traceability-record.entity';
import { CostRecord } from '../models/cost-record.entity';
import { SalesRecord } from '../models/sales-record.entity';
import { SensorData } from '../models/sensor-data.entity';
import { SystemSettings } from '../models/system-settings.entity';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'LZY123',
  database: process.env.DB_NAME || 'farm_management',
  synchronize: process.env.NODE_ENV !== 'production', // 开发环境自动建表
  logging: process.env.NODE_ENV === 'development',
  entities: [
    AuditLog,
    BaseEntity,
    Plot,
    Variety,
    Staff,
    Equipment,
    Notification,
    FarmingOperation,
    PlantingPlan,
    ProductionBatch,
    Inventory,
    StockTransaction,
    Stocktake,
    TraceabilityRecord,
    CostRecord,
    SalesRecord,
    SensorData,
    SystemSettings,
  ],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  subscribers: [__dirname + '/../subscribers/*{.ts,.js}'],
  extra: {
    connectionLimit: 10,
  },
});
