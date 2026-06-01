import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'LZY123',
  database: process.env.DB_NAME || 'farm_management',
  synchronize: false,
  logging: true,
  entities: [],
  migrations: [],
  subscribers: [],
});
