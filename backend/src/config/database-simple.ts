import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'LZY123',
  database: process.env.DB_NAME || 'farm_management',
  synchronize: false,
  logging: true,
  entities: [],
  migrations: [],
  subscribers: [],
});
